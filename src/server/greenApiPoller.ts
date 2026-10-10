import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {
  parseIncomingWebhook,
  cleanPhoneNumber,
  whatsappRuntimeConfig,
  DEFAULT_GREEN_API_INSTANCE_ID,
  DEFAULT_GREEN_API_TOKEN,
  DEFAULT_GREEN_API_HOST,
  resolveGreenApiHost,
  sendOutboundWhatsAppMessage,
} from './webhookHandler.ts';
import { memoryManager } from './memoryManager.ts';
import { generateSalesResponse, extractOrderDetails, type MediaOptions } from './geminiService.ts';
import { orderManager } from './orderManager.ts';
import { logWebhookEvent } from './telemetry.ts';
import {
  isReplayAttack,
  isRateLimited,
  inspectSecurityThreats,
  sanitizeOutboundMessage,
} from './securityShield.ts';
import { concurrencyManager } from './concurrencyManager.ts';
import { storeRegistry } from './storeRegistry.ts';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'whatsapp-config.json');

interface GreenConfig {
  instanceId: string;
  apiToken: string;
  host: string;
}

let isPollingRunning = false;
let pollingInterval: NodeJS.Timeout | null = null;
let consecutiveErrors = 0;
let lastHistoryScanTime = 0;

// Set of already processed message IDs to prevent duplicates
const processedMessageIds = new Set<string>();

function getStoredGreenConfig(): GreenConfig {
  let instanceId = whatsappRuntimeConfig.greenApi.instanceId || process.env.GREEN_API_INSTANCE_ID || DEFAULT_GREEN_API_INSTANCE_ID;
  let apiToken = whatsappRuntimeConfig.greenApi.apiToken || process.env.GREEN_API_API_TOKEN || DEFAULT_GREEN_API_TOKEN;
  let host = whatsappRuntimeConfig.greenApi.host || process.env.GREEN_API_HOST || DEFAULT_GREEN_API_HOST;

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (data.greenApi?.instanceId) instanceId = data.greenApi.instanceId;
      if (data.greenApi?.apiToken) apiToken = data.greenApi.apiToken;
      if (data.greenApi?.host) host = data.greenApi.host;
    }
  } catch (err) {
    // Ignore read error and use defaults
  }

  return { instanceId, apiToken, host };
}

/**
 * Handles a single validated incoming message payload
 */
async function processIncomingChatMessage(
  messageId: string,
  fromPhone: string,
  text: string,
  mediaOptions?: MediaOptions,
  rawBody?: any
): Promise<boolean> {
  if (processedMessageIds.has(messageId)) {
    return false;
  }
  processedMessageIds.add(messageId);
  // Keep cache bounded
  if (processedMessageIds.size > 2000) {
    const oldest = Array.from(processedMessageIds).slice(0, 500);
    oldest.forEach((id) => processedMessageIds.delete(id));
  }

  const startTime = Date.now();

  // 1. Anti-Replay Check
  if (isReplayAttack(messageId)) {
    console.warn(`[GreenApiPoller] 🛡️ Ignored duplicate/replay message ID: ${messageId}`);
    return false;
  }

  // 2. Token Bucket Rate Limiter
  const rateCheck = isRateLimited(fromPhone);
  if (rateCheck.limited) {
    const rateReply = 'One moment please! We are preparing your request and will reply right away to give you the best experience! 🌸';
    await sendOutboundWhatsAppMessage(fromPhone, rateReply, 'green_api');
    return true;
  }

  // 3. Concurrency Manager Execution with Per-Phone Mutex
  await concurrencyManager.execute(fromPhone, async () => {
    console.log(`[GreenApiPoller] 💬 Processing incoming message from ${fromPhone}: "${text}"`);

    // Check Human Takeover Mode
    if (memoryManager.isHumanTakeover(fromPhone)) {
      console.log(`[GreenApiPoller] 👨‍💼 Human Takeover ACTIVE for +${fromPhone}. Bot response suppressed to avoid conflict.`);
      await memoryManager.addMessage(fromPhone, 'user', text);
      return;
    }

    // 4. Prompt Injection & Adversarial Payload Inspection
    const threatCheck = inspectSecurityThreats(text, fromPhone);
    let aiReply = '';

    const activeStore = storeRegistry.getActiveStore();
    const currentStoreId = 'hbb';
    const currentCategory: 'clothing' | 'sneakers' = 'clothing';

    if (threatCheck.isThreat && threatCheck.safeReplacement) {
      aiReply = threatCheck.safeReplacement;
    } else {
      await memoryManager.getSession(fromPhone, currentCategory, currentStoreId);
      const history = await memoryManager.getHistory(fromPhone);

      aiReply = await generateSalesResponse(
        text,
        history,
        currentCategory,
        mediaOptions,
        currentStoreId
      );

      const userRecordedText = mediaOptions?.transcription
        ? `🎙️ [تسجيل صوتي من العميل]: "${mediaOptions.transcription}"`
        : text;

      await memoryManager.addMessage(fromPhone, 'user', userRecordedText);
      await memoryManager.addMessage(fromPhone, 'model', aiReply);

      // Asynchronously extract and register confirmed orders
      if (!memoryManager.isOrderRecentlyConfirmed(fromPhone)) {
        extractOrderDetails(history, currentCategory).then(async (draft) => {
          if (draft && draft.items && draft.items.length > 0 && (draft.customerName || draft.customer_name || draft.address || draft.delivery_address || draft.deliveryAddress || draft.status === 'confirmed')) {
            await memoryManager.updateOrderDraft(fromPhone, draft);
            const created = await orderManager.createOrderFromDraft(draft, activeStore, fromPhone, text);
            memoryManager.markOrderConfirmed(fromPhone, created.orderNumber);
            console.log(`[GreenApiPoller] 📦 Order captured & merchant notified for +${fromPhone}:`, draft.customerName || draft.customer_name);
          }
        }).catch((e) => console.warn('[GreenApiPoller] Order extraction check warning:', e.message));
      }
    }

    // 5. Outbound Secret & Exfiltration Firewall
    const safeOutbound = sanitizeOutboundMessage(aiReply);
    const finalOutbound =
      mediaOptions?.transcription && !safeOutbound.includes(mediaOptions.transcription)
        ? `🎙️ سمعت تسجيلك الصوتي: "${mediaOptions.transcription}"\n\n${safeOutbound}`
        : safeOutbound;

    // 6. Send Outbound WhatsApp Message
    const sendResult = await sendOutboundWhatsAppMessage(fromPhone, finalOutbound, 'green_api');
    console.log(`[GreenApiPoller] 🚀 Outbound reply dispatched to ${fromPhone}. Success: ${sendResult.success}`);

    logWebhookEvent({
      method: 'POLL',
      provider: 'green_api',
      fromPhone,
      userMessage: mediaOptions?.transcription || text,
      botReply: finalOutbound,
      status: sendResult.success ? 'processed' : 'error',
      rawBody,
      error: sendResult.error,
      durationMs: Date.now() - startTime,
    });
  });

  return true;
}

/**
 * Polls Green API receiveNotification queue once and processes any pending message
 */
export async function pollOnce(): Promise<{ handled: boolean; message?: string }> {
  try {
    const config = getStoredGreenConfig();
    if (!config.instanceId || !config.apiToken) {
      return { handled: false, message: 'Green API is not configured' };
    }

    const candidateHosts = resolveGreenApiHost(config.instanceId, config.host);
    let res: any = null;
    let activeHost = candidateHosts[0];

    for (const host of candidateHosts) {
      try {
        const cleanHost = host.replace(/\/+$/, '');
        // Explicit receiveTimeout=5 avoids long 20s blocking and avoids axios timeout errors
        const receiveUrl = `${cleanHost}/waInstance${config.instanceId}/receiveNotification/${config.apiToken}?receiveTimeout=5`;
        res = await axios.get(receiveUrl, { timeout: 10000 });
        activeHost = cleanHost;
        break;
      } catch (e: any) {
        continue;
      }
    }

    if (!res) {
      consecutiveErrors++;
      return { handled: false, message: 'Unable to reach Green API hosts' };
    }

    consecutiveErrors = 0;

    // Check if notification arrived in queue
    if (res.data && res.data.receiptId) {
      const { receiptId, body } = res.data;
      console.log(`[GreenApiPoller] 📥 Received notification receiptId: ${receiptId}, type: ${body?.typeWebhook}`);

      // Delete notification right away to prevent double-processing
      const deleteUrl = `${activeHost}/waInstance${config.instanceId}/deleteNotification/${config.apiToken}/${receiptId}`;
      await axios.delete(deleteUrl).catch((err) => {
        console.warn(`[GreenApiPoller] Failed to delete receiptId ${receiptId}:`, err.message);
      });

      if (body && body.typeWebhook === 'incomingMessageReceived') {
        const messageId = body.idMessage || `green_${Date.now()}`;
        const parseResult = parseIncomingWebhook(body);
        if (parseResult.isMessage && parseResult.message) {
          const { fromPhone, text, mediaType, mediaUrl, mimeType, caption } = parseResult.message;
          await processIncomingChatMessage(
            messageId,
            fromPhone,
            text,
            { mediaType, mediaUrl, mimeType, caption },
            body
          );
          return { handled: true, message: `Replied to ${fromPhone}` };
        }
      }

      return { handled: true, message: `Notification ${receiptId} processed` };
    }

    // Fallback: Check lastIncomingMessages every 10 seconds to catch any missed messages
    const now = Date.now();
    if (now - lastHistoryScanTime > 10000) {
      lastHistoryScanTime = now;
      try {
        const historyUrl = `${activeHost}/waInstance${config.instanceId}/lastIncomingMessages/${config.apiToken}?minutes=5`;
        const historyRes = await axios.get(historyUrl, { timeout: 8000 });
        if (Array.isArray(historyRes.data)) {
          for (const item of historyRes.data) {
            const msgId = item.idMessage;
            if (!msgId || processedMessageIds.has(msgId)) continue;

            const sender = item.senderId || item.chatId || '';
            const phone = cleanPhoneNumber(sender);
            const text = item.textMessage || item.caption || '';
            if (phone && text) {
              console.log(`[GreenApiPoller] 🔎 Recovered incoming message from history scan: "${text}" from ${phone}`);
              await processIncomingChatMessage(msgId, phone, text, undefined, item);
              return { handled: true, message: `Recovered message from ${phone}` };
            }
          }
        }
      } catch (err: any) {
        // history scan is optional fallback, ignore errors
      }
    }

    return { handled: false, message: 'Queue is empty' };
  } catch (err: any) {
    consecutiveErrors++;
    if (consecutiveErrors < 3) {
      console.warn(`[GreenApiPoller] Poll check error: ${err?.message?.slice(0, 80)}`);
    }
    return { handled: false, message: err?.message };
  }
}

/**
 * Starts continuous background polling for Green API
 */
export function startGreenApiPoller(intervalMs = 2000) {
  if (isPollingRunning) return;
  isPollingRunning = true;
  console.log(`[GreenApiPoller] 🟢 Starting background polling daemon (every ${intervalMs}ms)...`);

  let isRunning = false;
  pollingInterval = setInterval(async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await pollOnce();
    } catch (e) {
      // ignore
    } finally {
      isRunning = false;
    }
  }, intervalMs);
}

export function stopGreenApiPoller() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  isPollingRunning = false;
  console.log('[GreenApiPoller] 🛑 Background polling daemon stopped.');
}

export function isPollerActive(): boolean {
  return isPollingRunning;
}
