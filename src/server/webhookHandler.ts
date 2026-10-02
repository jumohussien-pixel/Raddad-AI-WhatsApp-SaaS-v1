/**
 * WhatsApp Multi-Provider Webhook Parser & Outbound Dispatcher
 * Specialized for Egyptian Fashion & Apparel Stores
 * 
 * Supports:
 * 1. Green API (Multi-host cluster resolution & auto-retry)
 * 2. Meta Cloud API (Official WhatsApp Business API)
 * 3. Whapi.cloud
 * 4. Direct / Testing Simulators
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

export interface NormalizedWhatsAppMessage {
  provider: 'meta' | 'green_api' | 'whapi' | 'custom';
  messageId: string;
  fromPhone: string;
  toPhone?: string;
  text: string;
  timestamp: number;
  businessType: 'restaurant' | 'clothing';
  rawPayload: any;
  mediaType?: 'text' | 'audio' | 'image' | 'video' | 'document';
  mediaUrl?: string;
  mimeType?: string;
  caption?: string;
}

export interface WebhookParseResult {
  isMessage: boolean;
  message?: NormalizedWhatsAppMessage;
  reason?: string;
}

export interface WhatsAppRuntimeConfig {
  provider: 'green_api' | 'meta' | 'whapi' | 'simulated' | 'custom' | string;
  greenApi: {
    instanceId: string;
    apiToken: string;
    host: string;
  };
  meta: {
    phoneNumberId: string;
    accessToken: string;
  };
}

export const DEFAULT_GREEN_API_INSTANCE_ID = '710722741559';
export const DEFAULT_GREEN_API_TOKEN = '656b27ec247545968dc4f55a2cc1521eb5ea8942a574425f8e';
export const DEFAULT_GREEN_API_HOST = 'https://7107.api.greenapi.com';

// In-memory runtime config that can be configured from the UI or environment
export const whatsappRuntimeConfig: WhatsAppRuntimeConfig = {
  provider: (process.env.WHATSAPP_API_PROVIDER as any) || 'green_api',
  greenApi: {
    instanceId: process.env.GREEN_API_INSTANCE_ID || DEFAULT_GREEN_API_INSTANCE_ID,
    apiToken: process.env.GREEN_API_API_TOKEN || DEFAULT_GREEN_API_TOKEN,
    host: process.env.GREEN_API_HOST || DEFAULT_GREEN_API_HOST,
  },
  meta: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_API_TOKEN || '',
  },
};

// Ensure data folder and config file exist with permanent fallback
try {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const configPath = path.resolve(dataDir, 'whatsapp-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.greenApi) {
      whatsappRuntimeConfig.greenApi = {
        ...whatsappRuntimeConfig.greenApi,
        ...parsed.greenApi,
      };
      if (!whatsappRuntimeConfig.greenApi.apiToken) {
        whatsappRuntimeConfig.greenApi.apiToken = DEFAULT_GREEN_API_TOKEN;
      }
      if (!whatsappRuntimeConfig.greenApi.instanceId) {
        whatsappRuntimeConfig.greenApi.instanceId = DEFAULT_GREEN_API_INSTANCE_ID;
      }
      if (!whatsappRuntimeConfig.greenApi.host) {
        whatsappRuntimeConfig.greenApi.host = DEFAULT_GREEN_API_HOST;
      }
    }
    if (parsed.provider) whatsappRuntimeConfig.provider = parsed.provider;
    if (parsed.meta) whatsappRuntimeConfig.meta = { ...whatsappRuntimeConfig.meta, ...parsed.meta };
  } else {
    fs.writeFileSync(configPath, JSON.stringify(whatsappRuntimeConfig, null, 2), 'utf-8');
  }
} catch (e) {
  console.log('[WebhookHandler] Initialized with permanent default WhatsApp configuration');
}

export function setWhatsAppConfig(config: Partial<WhatsAppRuntimeConfig>) {
  if (config.provider) whatsappRuntimeConfig.provider = config.provider;
  if (config.greenApi) {
    const inst = config.greenApi.instanceId || whatsappRuntimeConfig.greenApi.instanceId;
    let targetHost = config.greenApi.host || whatsappRuntimeConfig.greenApi.host;

    // Auto-align host with 4-digit cluster prefix if needed
    if (inst && /^\d{4}/.test(inst) && (!targetHost || targetHost.includes('7105') && !inst.startsWith('7105'))) {
      targetHost = `https://${inst.slice(0, 4)}.api.greenapi.com`;
    }

    whatsappRuntimeConfig.greenApi = {
      ...whatsappRuntimeConfig.greenApi,
      ...config.greenApi,
      host: targetHost || 'https://7107.api.greenapi.com',
    };
  }
  if (config.meta) {
    whatsappRuntimeConfig.meta = {
      ...whatsappRuntimeConfig.meta,
      ...config.meta,
    };
  }

  // Persist to disk
  try {
    const configPath = path.resolve(process.cwd(), 'data/whatsapp-config.json');
    fs.writeFileSync(configPath, JSON.stringify(whatsappRuntimeConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WebhookHandler] Failed to save WhatsApp config to disk:', err);
  }
}

export function getWhatsAppConfig() {
  return {
    provider: whatsappRuntimeConfig.provider,
    greenApi: {
      instanceId: whatsappRuntimeConfig.greenApi.instanceId,
      apiToken: whatsappRuntimeConfig.greenApi.apiToken,
      hasToken: !!whatsappRuntimeConfig.greenApi.apiToken,
      tokenMasked: whatsappRuntimeConfig.greenApi.apiToken ? '••••••••' + whatsappRuntimeConfig.greenApi.apiToken.slice(-4) : '',
      host: whatsappRuntimeConfig.greenApi.host,
    },
    meta: {
      phoneNumberId: whatsappRuntimeConfig.meta.phoneNumberId,
      hasToken: !!whatsappRuntimeConfig.meta.accessToken,
    },
  };
}

/**
 * Normalizes an incoming webhook payload into a unified structure
 */
export function parseIncomingWebhook(body: any, query: any = {}): WebhookParseResult {
  if (!body || typeof body !== 'object') {
    return { isMessage: false, reason: 'Empty or non-object body payload' };
  }

  // 1. Meta Cloud API (entry -> changes -> value -> messages)
  if (Array.isArray(body.entry) && body.entry[0]?.changes?.[0]?.value) {
    const value = body.entry[0].changes[0].value;
    const messages = value.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return { isMessage: false, reason: 'Meta status update or delivery receipt, not an incoming message' };
    }

    const firstMsg = messages[0];
    const text = firstMsg.text?.body || firstMsg.button?.text || firstMsg.interactive?.button_reply?.title || '';

    if (!text) {
      return { isMessage: false, reason: `Unsupported Meta message type (${firstMsg.type}) or empty text` };
    }

    const businessType = query.businessType || 'clothing';

    return {
      isMessage: true,
      message: {
        provider: 'meta',
        messageId: firstMsg.id || `meta_${Date.now()}`,
        fromPhone: cleanPhoneNumber(firstMsg.from || ''),
        toPhone: cleanPhoneNumber(value.metadata?.display_phone_number || ''),
        text: text.trim(),
        timestamp: Number(firstMsg.timestamp) * 1000 || Date.now(),
        businessType,
        rawPayload: body,
      },
    };
  }

  // 2. Green API (typeWebhook: incomingMessageReceived)
  if (body.typeWebhook === 'incomingMessageReceived' || body.messageData) {
    const sender = body.senderData?.sender || body.senderData?.chatId || '';
    const typeMessage = body.messageData?.typeMessage;

    let mediaType: 'text' | 'audio' | 'image' | 'video' | 'document' = 'text';
    let mediaUrl: string | undefined = undefined;
    let mimeType: string | undefined = undefined;
    let caption: string | undefined = undefined;

    let text =
      body.messageData?.textMessageData?.textMessage ||
      body.messageData?.extendedTextMessageData?.text ||
      body.messageData?.buttonsResponseMessage?.selectedButtonId ||
      body.messageData?.listResponseMessage?.title ||
      body.messageData?.templateButtonsResponseMessageData?.selectedButtonId ||
      '';

    if (typeMessage === 'audioMessage') {
      mediaType = 'audio';
      mediaUrl = body.messageData?.fileMessageData?.downloadUrl || body.messageData?.downloadUrl;
      mimeType = body.messageData?.fileMessageData?.mimeType || 'audio/ogg';
      caption = body.messageData?.fileMessageData?.caption || '';
      text = caption ? `[Customer Voice Note]: ${caption}` : '[Customer Voice Note via WhatsApp]';
    } else if (typeMessage === 'imageMessage') {
      mediaType = 'image';
      mediaUrl = body.messageData?.fileMessageData?.downloadUrl || body.messageData?.downloadUrl;
      mimeType = body.messageData?.fileMessageData?.mimeType || 'image/jpeg';
      caption = body.messageData?.fileMessageData?.caption || '';
      text = caption ? `[Customer Attached Image]: ${caption}` : '[Customer attached a photo or screenshot]';
    } else if (typeMessage === 'documentMessage') {
      mediaType = 'document';
      mediaUrl = body.messageData?.fileMessageData?.downloadUrl || body.messageData?.downloadUrl;
      mimeType = body.messageData?.fileMessageData?.mimeType || 'application/pdf';
      caption = body.messageData?.fileMessageData?.caption || '';
      text = caption ? `[Customer Attached File]: ${caption}` : '[Customer attached a document or file]';
    } else if (typeMessage === 'videoMessage') {
      mediaType = 'video';
      mediaUrl = body.messageData?.fileMessageData?.downloadUrl || body.messageData?.downloadUrl;
      mimeType = body.messageData?.fileMessageData?.mimeType || 'video/mp4';
      caption = body.messageData?.fileMessageData?.caption || '';
      text = caption ? `[Customer Video]: ${caption}` : '[Customer attached a video]';
    }

    if (!text && !mediaUrl) {
      return { isMessage: false, reason: 'Green API payload missing text message data' };
    }

    return {
      isMessage: true,
      message: {
        provider: 'green_api',
        messageId: body.idMessage || `green_${Date.now()}`,
        fromPhone: cleanPhoneNumber(sender),
        text: text.trim(),
        timestamp: (body.timestamp ? body.timestamp * 1000 : Date.now()),
        businessType: query.businessType || 'clothing',
        rawPayload: body,
        mediaType,
        mediaUrl,
        mimeType,
        caption,
      },
    };
  }

  // 3. Whapi.cloud (messages array)
  if (Array.isArray(body.messages) && body.messages[0]) {
    const msg = body.messages[0];
    const text = msg.text?.body || msg.body || '';

    if (!text) {
      return { isMessage: false, reason: 'Whapi payload missing text body' };
    }

    return {
      isMessage: true,
      message: {
        provider: 'whapi',
        messageId: msg.id || `whapi_${Date.now()}`,
        fromPhone: cleanPhoneNumber(msg.from || ''),
        text: text.trim(),
        timestamp: msg.timestamp ? msg.timestamp * 1000 : Date.now(),
        businessType: query.businessType || 'clothing',
        rawPayload: body,
      },
    };
  }

  // 4. Custom Direct Testing / Simulator Format
  if (body.message || body.text || body.userMessage) {
    const text = (body.message || body.text || body.userMessage || '').toString();
    const phone = (body.phone || body.from || body.sender || '201132044523').toString();
    const businessType = body.businessType || 'clothing';

    return {
      isMessage: true,
      message: {
        provider: 'custom',
        messageId: body.messageId || `test_${Date.now()}`,
        fromPhone: cleanPhoneNumber(phone),
        text: text.trim(),
        timestamp: Date.now(),
        businessType,
        rawPayload: body,
      },
    };
  }

  return { isMessage: false, reason: 'Unrecognized WhatsApp webhook schema' };
}

export function resolveGreenApiHost(instanceId?: string, host?: string): string[] {
  const candidates: string[] = [];

  // Priority 1: Cluster derived from instanceId (e.g. 7107 -> https://7107.api.greenapi.com)
  if (instanceId && /^\d{4}/.test(instanceId)) {
    const cluster = `https://${instanceId.slice(0, 4)}.api.greenapi.com`;
    candidates.push(cluster);
  }

  // Priority 2: Configured explicit host
  if (host && host.trim()) {
    const cleanHost = host.trim().replace(/\/+$/, '');
    // If instance is 7107 but host contains 7105, omit the broken 7105 host
    const isConflict = instanceId?.startsWith('7107') && cleanHost.includes('7105');
    if (!isConflict && !candidates.includes(cleanHost)) {
      candidates.push(cleanHost);
    }
  }

  // Priority 3: Universal Green API host
  if (!candidates.includes('https://api.green-api.com')) {
    candidates.push('https://api.green-api.com');
  }

  return candidates;
}

/**
 * Strips WhatsApp JID formatting and properly normalizes Egyptian mobile numbers (+20)
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return '201132044523';
  let cleaned = raw.replace(/@.+$/, '').replace(/[^0-9]/g, '');

  // If Egyptian local number starting with 01 (e.g. 010..., 011..., 012..., 015...) with 11 digits
  if (/^01[0125][0-9]{8}$/.test(cleaned)) {
    cleaned = '20' + cleaned.slice(1);
  }
  // If Egyptian number without leading 0 (e.g. 10..., 11..., 12..., 15...) with 10 digits
  else if (/^1[0125][0-9]{8}$/.test(cleaned)) {
    cleaned = '20' + cleaned;
  }

  return cleaned;
}

/**
 * Checks connection state with Green API with automatic multi-host fallback
 */
export async function checkGreenApiState(
  instanceId?: string,
  apiToken?: string,
  host?: string
): Promise<{ stateInstance: string; details?: any; error?: string; hostUsed?: string }> {
  const inst = instanceId || whatsappRuntimeConfig.greenApi.instanceId || process.env.GREEN_API_INSTANCE_ID;
  const token = apiToken || whatsappRuntimeConfig.greenApi.apiToken || process.env.GREEN_API_API_TOKEN;

  if (!inst || !token) {
    return {
      stateInstance: 'unconfigured',
      error: 'Instance ID or API Token for Green-API is not configured.',
    };
  }

  const candidateHosts = resolveGreenApiHost(inst, host || whatsappRuntimeConfig.greenApi.host);
  let lastError: any = null;

  for (const candidateHost of candidateHosts) {
    try {
      const url = `${candidateHost}/waInstance${inst}/getStateInstance/${token}`;
      const response = await axios.get(url, { timeout: 8000 });
      if (response.data && response.data.stateInstance) {
        // Cache the working host
        whatsappRuntimeConfig.greenApi.host = candidateHost;
        return {
          stateInstance: response.data.stateInstance,
          details: response.data,
          hostUsed: candidateHost,
        };
      }
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  const errStatus = lastError?.response?.status;
  const isForbidden = errStatus === 401 || errStatus === 403;
  const errorMsg = isForbidden
    ? 'Authentication error (403/401): Please verify API Token for Instance in Green-API Console'
    : (lastError?.response?.data?.message || lastError?.message || 'Unable to connect to Green-API server');

  return {
    stateInstance: 'error',
    error: errorMsg,
    details: lastError?.response?.data,
  };
}

/**
 * Dispatches an outbound WhatsApp text message to the customer
 * Automatically detects Green API, Meta, Whapi, or URL-based configurations
 */
export async function sendOutboundWhatsAppMessage(
  toPhone: string,
  messageText: string,
  provider = whatsappRuntimeConfig.provider
): Promise<{ success: boolean; data?: any; error?: string; simulated?: boolean }> {
  const cleanPhone = cleanPhoneNumber(toPhone);

  // 1. Direct Green API dispatch using instance credentials with multi-host resilience
  const greenInst = whatsappRuntimeConfig.greenApi.instanceId || process.env.GREEN_API_INSTANCE_ID;
  const greenToken = whatsappRuntimeConfig.greenApi.apiToken || process.env.GREEN_API_API_TOKEN;

  if (greenInst && greenToken) {
    const candidateHosts = resolveGreenApiHost(greenInst, whatsappRuntimeConfig.greenApi.host || process.env.GREEN_API_HOST);
    let lastError: any = null;

    for (const host of candidateHosts) {
      try {
        const url = `${host}/waInstance${greenInst}/sendMessage/${greenToken}`;
        console.log(`🚀 [Green API Dispatch] Sending message to +${cleanPhone} via ${host}`);
        const response = await axios.post(
          url,
          {
            chatId: `${cleanPhone}@c.us`,
            message: messageText,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );

        if (response.data?.idMessage) {
          console.log(`✅ [Green API Success] Message ID: ${response.data.idMessage} via ${host}`);
          whatsappRuntimeConfig.greenApi.host = host;
          return { success: true, data: response.data };
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        console.log(`[Green API Dispatch] Host ${host} returned status ${status || 'network error'}, trying next candidate...`);
      }
    }

    const is403 = lastError?.response?.status === 403 || lastError?.response?.status === 401;
    const errorStr = is403
      ? 'Authentication error (403): Verify that API Token matches Instance in Green API Console'
      : (lastError?.response?.data?.message || lastError?.message || 'Failed to send message via Green API');

    return {
      success: false,
      error: errorStr,
    };
  }

  // 2. Direct WA_API_URL if configured
  const waUrl = process.env.WA_API_URL;
  const waToken = process.env.WA_API_TOKEN || process.env.WHATSAPP_API_TOKEN;

  if (waUrl) {
    try {
      let payload: any;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (waToken) {
        headers['Authorization'] = `Bearer ${waToken}`;
      }

      if (waUrl.includes('green-api.com') || waUrl.includes('greenapi.com')) {
        payload = {
          chatId: `${cleanPhone}@c.us`,
          message: messageText,
        };
      } else if (waUrl.includes('whapi.cloud')) {
        payload = {
          to: cleanPhone,
          body: messageText,
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: messageText },
        };
      }

      const res = await axios.post(waUrl, payload, { headers, timeout: 10000 });
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // 3. Local Simulation Fallback
  console.log(`[WhatsApp Simulated Dispatch] Message simulated for +${cleanPhone}: "${messageText.slice(0, 50)}..."`);
  return {
    success: true,
    simulated: true,
    data: { id: `sim_${Date.now()}`, recipient: cleanPhone },
  };
}
