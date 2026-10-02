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
} from './webhookHandler.js';
import { memoryManager } from './memoryManager.js';
import { generateSalesResponse } from './geminiService.js';
import { sendOutboundWhatsAppMessage } from './webhookHandler.js';
import { logWebhookEvent } from './telemetry.js';
import {
  isReplayAttack,
  isRateLimited,
  inspectSecurityThreats,
  sanitizeOutboundMessage,
} from './securityShield.js';
import { concurrencyManager } from './concurrencyManager.js';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'whatsapp-config.json');

interface GreenConfig {
  instanceId: string;
  apiToken: string;
  host: string;
}

let isPollingRunning = false;
let pollingInterval: NodeJS.Timeout | null = null;
let consecutiveErrors = 0;

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
      const receiveUrl = `${cleanHost}/waInstance${config.instanceId}/receiveNotification/${config.apiToken}`;
      res = await axios.get(receiveUrl, { timeout: 8000 });
      activeHost = cleanHost;
      break;
    } catch (e: any) {
      // try next host
      continue;
    }
  }

  if (!res) {
    consecutiveErrors++;
    return { handled: false, message: 'Unable to reach Green API hosts' };
  }

  consecutiveErrors = 0;

  if (!res.data || !res.data.receiptId) {
    return { handled: false, message: 'Queue is empty' };
  }

  const { receiptId, body } = res.data;
  console.log(`[GreenApiPoller] 📥 Received notification receiptId: ${receiptId}, type: ${body?.typeWebhook}`);

  // Delete notification right away to prevent double-processing
  const deleteUrl = `${activeHost}/waInstance${config.instanceId}/deleteNotification/${config.apiToken}/${receiptId}`;
  await axios.delete(deleteUrl).catch((err) => {
    console.warn(`[GreenApiPoller] Failed to delete receiptId ${receiptId}:`, err.message);
  });

    if (body && body.typeWebhook === 'incomingMessageReceived') {
      const messageId = body.idMessage;
      // 1. Anti-Replay Attack Check
      if (messageId && isReplayAttack(messageId)) {
        console.warn(`[GreenApiPoller] 🛡️ Ignored duplicate/replay message ID: ${messageId}`);
        return { handled: true, message: 'Ignored duplicate replay attack' };
      }

      const parseResult = parseIncomingWebhook(body, { businessType: 'clothing' });
      if (parseResult.isMessage && parseResult.message) {
        const { fromPhone, text, provider, mediaType, mediaUrl, mimeType, caption } = parseResult.message;
        const startTime = Date.now();

        // 2. Token Bucket Rate Limiter per Phone Number
        const rateCheck = isRateLimited(fromPhone);
        if (rateCheck.limited) {
          const rateReply = 'One moment please! We are preparing your request and will reply right away to give you the best experience! 🌸';
          await sendOutboundWhatsAppMessage(fromPhone, rateReply, provider);
          return { handled: true, message: `Rate-limited ${fromPhone}` };
        }

        // 3. Concurrency Manager Execution with Per-Phone Mutex
        await concurrencyManager.execute(fromPhone, async () => {
          console.log(`[GreenApiPoller] 💬 Processing incoming message from ${fromPhone}: "${text}" (media: ${mediaType || 'none'})`);

          // 4. Prompt Injection & Adversarial Payload Inspection
          const threatCheck = inspectSecurityThreats(text, fromPhone);
          let aiReply = '';

          if (threatCheck.isThreat && threatCheck.safeReplacement) {
            aiReply = threatCheck.safeReplacement;
          } else {
            // Normal conversation flow with 10-message memory
            await memoryManager.getSession(fromPhone, 'clothing');
            await memoryManager.addMessage(fromPhone, 'user', text);
            const history = await memoryManager.getHistory(fromPhone);

            aiReply = await generateSalesResponse(text, history, 'clothing', {
              mediaType,
              mediaUrl,
              mimeType,
              caption,
            });
            await memoryManager.addMessage(fromPhone, 'model', aiReply);
          }

          // 5. Outbound Secret & Exfiltration Firewall
          const safeOutbound = sanitizeOutboundMessage(aiReply);

          // 6. Send Outbound WhatsApp Message
          const sendResult = await sendOutboundWhatsAppMessage(fromPhone, safeOutbound, provider);
          console.log(`[GreenApiPoller] 🚀 Outbound reply dispatched to ${fromPhone}. Success: ${sendResult.success}`);

          logWebhookEvent({
            method: 'POLL',
            provider: 'green_api',
            fromPhone,
            userMessage: text,
            botReply: safeOutbound,
            status: sendResult.success ? 'processed' : 'error',
            rawBody: body,
            error: sendResult.error,
            durationMs: Date.now() - startTime,
          });
        });

        return { handled: true, message: `Replied to ${fromPhone}` };
      }
    }

    return { handled: true, message: `Notification ${receiptId} processed` };
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
