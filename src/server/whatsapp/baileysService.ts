import path from 'path';
import fs from 'fs';
import pino from 'pino';
import QRCode from 'qrcode';
// @ts-ignore
import qrcodeTerminal from 'qrcode-terminal';
import { productCatalog } from '../productCatalog.ts';
import { generateSalesResponse, extractOrderDetails, transcribeAudioWithGemini } from '../geminiService.ts';
import { memoryManager } from '../memoryManager.ts';
import { orderManager } from '../orderManager.ts';
import { orderNotifier } from './orderNotifier.ts';
import { cleanPhoneNumber } from '../webhookHandler.ts';
import { storeRegistry } from '../storeRegistry.ts';

export type BaileysState = 'idle' | 'connecting' | 'qr_ready' | 'connected' | 'disconnected';

export interface BaileysStatusReport {
  state: BaileysState;
  qrCodeUrl: string | null;
  qrRaw: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  lastConnectedAt: number | null;
  lastError: string | null;
  ownerPhone: string;
  uptimeSeconds: number;
}

class BaileysManager {
  private sock: any = null;
  private state: BaileysState = 'idle';
  private qrRaw: string | null = null;
  private qrCodeUrl: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private lastConnectedAt: number | null = null;
  private lastError: string | null = null;
  private authDir: string;
  private isInitializing: boolean = false;
  private startTimestamp: number = Date.now();

  constructor() {
    this.authDir = path.resolve(process.cwd(), 'data/baileys_auth');
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  public getStatus(): BaileysStatusReport {
    return {
      state: this.state,
      qrCodeUrl: this.qrCodeUrl,
      qrRaw: this.qrRaw,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      lastConnectedAt: this.lastConnectedAt,
      lastError: this.lastError,
      ownerPhone: orderNotifier.getOwnerPhone(),
      uptimeSeconds: Math.floor((Date.now() - this.startTimestamp) / 1000),
    };
  }

  public isConnected(): boolean {
    return this.state === 'connected' && !!this.sock;
  }

  /**
   * Initializes the Baileys connection and socket listeners
   */
  public async initSocket(forceRestart: boolean = false): Promise<void> {
    if (this.isInitializing) {
      console.log('[Baileys] Socket initialization already in progress, skipping duplicate call.');
      return;
    }

    if (this.sock && this.state === 'connected' && !forceRestart) {
      console.log('[Baileys] Already connected as +', this.connectedPhone);
      return;
    }

    this.isInitializing = true;
    this.state = 'connecting';
    this.lastError = null;

    try {
      console.log('[Baileys] 🚀 Starting Baileys socket engine (Low-RAM VPS optimized)...');

      // Dynamically load Baileys to ensure ESM / CJS compatibility
      const baileys = await import('@whiskeysockets/baileys');
      const makeWASocket = (baileys.default as any)?.default || baileys.default;
      const {
        DisconnectReason,
        useMultiFileAuthState,
        fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore,
      } = baileys as any;

      const logger = pino({ level: 'silent' });
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      let version = [2, 3000, 1015901307];
      try {
        const versionFetch = await fetchLatestBaileysVersion();
        if (versionFetch?.version) {
          version = versionFetch.version;
        }
      } catch (e) {
        // fallback to standard version
      }

      this.sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false, // We print manually below using qrcode-terminal
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: false,
        browser: ['RADDAD AI', 'Chrome', '1.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      // Save credentials whenever updated
      this.sock.ev.on('creds.update', saveCreds);

      // Listen to connection updates & QR emission
      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.state = 'qr_ready';
          this.qrRaw = qr;

          // 1. Generate Base64 Data URL for web /qr endpoint and frontend UI
          try {
            this.qrCodeUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: { dark: '#111827', light: '#ffffff' },
            });
          } catch (qrErr) {
            console.error('[Baileys] QR DataURL generation error:', qrErr);
          }

          // 2. Print QR in Terminal for quick testing
          console.log('\n======================================================');
          console.log('📱 [Baileys] SCAN QR CODE TO CONNECT WHATSAPP:');
          console.log('   (Also viewable at http://localhost:3000/qr)');
          console.log('======================================================\n');
          try {
            qrcodeTerminal.generate(qr, { small: true });
          } catch (termErr) {
            console.log('[Baileys] Raw QR String:', qr);
          }
          console.log('\n======================================================\n');
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.warn(`[Baileys] 🔌 Connection closed. Reason code: ${statusCode}, shouldReconnect: ${shouldReconnect}`);
          this.state = 'disconnected';
          this.sock = null;

          if (statusCode === DisconnectReason.loggedOut) {
            console.log('[Baileys] ⚠️ Logged out. Clearing local session keys for fresh QR scan...');
            this.clearAuthFiles();
            this.qrCodeUrl = null;
            this.qrRaw = null;
            this.connectedPhone = null;
          } else if (shouldReconnect) {
            console.log('[Baileys] 🔄 Scheduling automatic reconnection in 4 seconds...');
            setTimeout(() => {
              this.initSocket(true).catch((err) => console.error('[Baileys] Reconnect error:', err));
            }, 4000);
          }
        } else if (connection === 'open') {
          console.log('🎉 [Baileys] WhatsApp Connected Successfully!');
          this.state = 'connected';
          this.qrRaw = null;
          this.qrCodeUrl = null;
          this.lastConnectedAt = Date.now();

          const userJid = this.sock.user?.id || '';
          this.connectedPhone = userJid.split(':')[0] || userJid.split('@')[0];
          this.connectedName = this.sock.user?.name || 'RADDAD Bot';
          console.log(`[Baileys] Connected phone number: +${this.connectedPhone} (${this.connectedName})`);
        }
      });

      // Listen for incoming WhatsApp messages
      this.sock.ev.on('messages.upsert', async (m: any) => {
        if (m.type !== 'notify') return;
        for (const msg of m.messages) {
          await this.handleIncomingMessage(msg);
        }
      });
    } catch (err: any) {
      console.error('[Baileys] Initialization failed:', err);
      this.state = 'disconnected';
      this.lastError = err?.message || 'Unknown Baileys error';
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Processes each incoming message, executes AI Sales logic, and sends response
   */
  private async handleIncomingMessage(msg: any): Promise<void> {
    try {
      const fromJid = msg.key.remoteJid;
      // Skip status broadcast and group chats (unless enabled)
      if (!fromJid || fromJid === 'status@broadcast' || fromJid.endsWith('@g.us')) {
        return;
      }

      // Capture messages sent directly by merchant from phone
      if (msg.key.fromMe) {
        const directText =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          '';
        const targetPhone = cleanPhoneNumber(fromJid.split('@')[0]);
        if (targetPhone && directText) {
          console.log(`[Baileys] 👤 Merchant manual reply to +${targetPhone}: "${directText}"`);
          await memoryManager.addMessage(targetPhone, 'model', `[صاحب المحل]: ${directText}`);
        }
        return;
      }

      const senderPhone = cleanPhoneNumber(fromJid.split('@')[0]);
      const pushName = msg.pushName || 'العميل';

      // 1. Extract text and detect media
      let incomingText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        '';

      const isAudio = !!(msg.message?.audioMessage || msg.message?.voiceMessage);
      let audioBuffer: Buffer | undefined = undefined;

      // Handle voice / audio notes via Baileys media download
      if (isAudio) {
        try {
          const baileys = await import('@whiskeysockets/baileys');
          const { downloadMediaMessage } = baileys as any;
          const logger = pino({ level: 'silent' });
          const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger, reuploadRequest: this.sock.updateMediaMessage });
          if (buffer) {
            audioBuffer = buffer;
            console.log(`[Baileys] 🎙️ Received voice note from +${senderPhone} (${buffer.length} bytes). Transcribing...`);
            const transcript = await transcribeAudioWithGemini(buffer, 'audio/ogg; codecs=opus');
            if (transcript) {
              incomingText = transcript.transcription || '';
              console.log(`[Baileys] 📝 Voice note transcribed: "${incomingText}"`);
            }
          }
        } catch (mediaErr) {
          console.warn('[Baileys] Failed to download or transcribe voice message:', mediaErr);
        }
      }

      if (!incomingText && !audioBuffer) {
        return;
      }

      const trimmedText = incomingText.trim();

      // Check for Merchant Command Keywords to pause or resume AI
      const isPauseCommand = /^(#pause|#stop|#توقف|وقف|ايقاف|وقف البوت)(\s+\+?\d+)?$/i.test(trimmedText);
      const isResumeCommand = /^(#resume|#start|#تشغيل|شغل|شغل البوت)(\s+\+?\d+)?$/i.test(trimmedText);

      if (isPauseCommand) {
        const parts = trimmedText.split(/\s+/);
        const targetPhone = parts.length > 1 ? cleanPhoneNumber(parts[1]) : senderPhone;
        memoryManager.setHumanTakeover(targetPhone, true);
        console.log(`[Baileys] ⏸️ Merchant Takeover Command: Bot paused for +${targetPhone}`);

        await this.sock.sendMessage(fromJid, {
          text: `⏸️ تم إيقاف الرد الآلي للعميل (+${targetPhone}) بنجاح!\nيمكنك الآن التحدث معه بحرية بدون تدخل الذكاء الاصطناعي.\nلإعادة تفعيل البوت أرسل: #resume أو #تشغيل`,
        });
        return;
      }

      if (isResumeCommand) {
        const parts = trimmedText.split(/\s+/);
        const targetPhone = parts.length > 1 ? cleanPhoneNumber(parts[1]) : senderPhone;
        memoryManager.setHumanTakeover(targetPhone, false);
        console.log(`[Baileys] ▶️ Merchant Takeover Command: Bot resumed for +${targetPhone}`);

        await this.sock.sendMessage(fromJid, {
          text: `▶️ تم إعادة تفعيل البوت الذكي للعميل (+${targetPhone}) بنجاح!\nسيتولى الذكاء الاصطناعي الرد البيعي على الفور. 🤖`,
        });
        return;
      }

      // If customer has Human Takeover active, record message but stay completely silent
      if (memoryManager.isHumanTakeover(senderPhone)) {
        console.log(`[Baileys] 👤 Customer +${senderPhone} in human takeover mode. Bot silenced.`);
        await memoryManager.addMessage(senderPhone, 'user', incomingText);
        return;
      }

      console.log(`[Baileys] 📩 Message from +${senderPhone} (${pushName}): "${incomingText}"`);

      // 2. Manage conversation history and generate AI Sales response
      await memoryManager.addMessage(senderPhone, 'user', incomingText);
      const history = await memoryManager.getHistory(senderPhone);

      const replyText = await generateSalesResponse(
        incomingText,
        history,
        'clothing',
        {
          audioBuffer,
          mimeType: isAudio ? 'audio/ogg' : undefined,
          mediaType: isAudio ? 'audio' : undefined,
        },
        'youth_streetwear_store'
      );

      await memoryManager.addMessage(senderPhone, 'model', replyText);

      // 3. Send AI Sales response back to customer
      if (replyText) {
        await this.sock.sendMessage(fromJid, {
          text: replyText,
        });
        console.log(`[Baileys] 📤 Sent reply to +${senderPhone}`);
      }

      // 4. Asynchronously detect if an order draft has been confirmed
      if (memoryManager.isOrderRecentlyConfirmed(senderPhone)) {
        console.log(`[Baileys] 🛑 Active order already confirmed recently for +${senderPhone}. Skipping duplicate order creation.`);
      } else {
        const orderDraft = await extractOrderDetails(history, 'clothing');
        if (
          orderDraft &&
          orderDraft.items &&
          orderDraft.items.length > 0 &&
          (orderDraft.deliveryAddress ||
            orderDraft.delivery_address ||
            orderDraft.address ||
            orderDraft.customerName ||
            orderDraft.customer_name)
        ) {
          console.log('[Baileys] 🎯 New order draft confirmed by customer! Registering order and alerting merchant...');

          const currentStore = storeRegistry.getActiveStore() || {
            id: 'hbb',
            name: 'HBB Store',
            currency: 'EGP',
          };

          const newOrder = await orderManager.createOrderFromDraft(orderDraft, currentStore, senderPhone, incomingText);
          memoryManager.markOrderConfirmed(senderPhone, newOrder.orderNumber);

          // Confirm directly to customer with exact merchant-configured delivery duration
          const deliveryEta = (currentStore as any).prepTime || (currentStore as any).deliveryTimeframeHoursOrDays || 'خلال 24 إلى 48 ساعة';
          const customerConfirmMsg = `تم تأكيد حجز الأوردر بتاعك يا فندم برقم (${newOrder.orderNumber})! 👕✨\nالأوردر هيوصلك ${deliveryEta} مع إمكانية المعاينة والقياس مع المندوب قبل ما تدفع أي جنيه.\nشكراً لتسوقك من ${currentStore.name}! 🌟`;
          
          await this.sock.sendMessage(fromJid, { text: customerConfirmMsg });

          // Trigger instant store owner notification
          await orderNotifier.notifyStoreOwner(
            {
              orderNumber: newOrder.orderNumber,
              customerName: newOrder.customerName,
              customerPhone: newOrder.customerPhone,
              deliveryAddress: newOrder.deliveryAddress,
              items: newOrder.items,
              totalEstimated: newOrder.totalEstimated,
              currency: 'EGP',
            },
            async (toPhone, alertText) => {
              return await this.sendTextMessage(toPhone, alertText);
            }
          );
        }
      }
    } catch (err: any) {
      console.error('[Baileys] Error processing incoming message:', err);
    }
  }

  /**
   * Sends an outbound text message to any phone number
   */
  public async sendTextMessage(phone: string, text: string): Promise<boolean> {
    if (!this.sock || this.state !== 'connected') {
      console.warn(`[Baileys] Cannot send message to +${phone}. Socket not connected (State: ${this.state})`);
      return false;
    }

    try {
      const clean = cleanPhoneNumber(phone);
      const jid = `${clean}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text });
      console.log(`[Baileys] ✅ Message sent to +${clean}`);
      return true;
    } catch (err: any) {
      console.error(`[Baileys] ❌ Failed to send message to +${phone}:`, err);
      return false;
    }
  }

  /**
   * Log out and delete local session credentials
   */
  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
    } catch (e) {
      // ignore
    }
    this.sock = null;
    this.state = 'idle';
    this.qrCodeUrl = null;
    this.qrRaw = null;
    this.connectedPhone = null;
    this.clearAuthFiles();
  }

  private clearAuthFiles(): void {
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
        fs.mkdirSync(this.authDir, { recursive: true });
      }
    } catch (e) {
      console.warn('[Baileys] Error clearing auth directory:', e);
    }
  }
}

export const baileysManager = new BaileysManager();
