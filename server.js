/**
 * ============================================================================
 * Production-Ready WhatsApp Customer Service SaaS Server (Express.js & Gemini)
 * Pure Node.js (ESM) - Zero TypeScript Syntax Errors
 * ============================================================================
 */

import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const WA_API_URL = process.env.WA_API_URL;
const WA_API_TOKEN = process.env.WA_API_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'egypt_saas_secure_token_2026';

// Parse incoming JSON payloads and URL-encoded data with high payload capacity
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// 1. Dynamic Catalog System (Google Sheets API / REST / DB Adapter)
// ============================================================================

/**
 * In-memory cache for dynamic tenant catalogs (valid for 5 minutes)
 */
const tenantCatalogCache = new Map();

/**
 * Asynchronous helper function: getTenantCatalog(tenantId)
 * Fetches the dynamic catalog for the specific tenant
 */
export async function getTenantCatalog(tenantId) {
  const normalizedId = tenantId || 'tenant-koshary-prince';

  // Check fast in-memory cache first (valid for 5 minutes)
  const cached = tenantCatalogCache.get(normalizedId);
  if (cached && Date.now() - cached.lastSyncedAt < 5 * 60 * 1000) {
    return cached;
  }

  // 1. External REST or Google Sheets API Integration if configured
  const envKey = `CATALOG_API_URL_${normalizedId.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
  const externalCatalogEndpoint = process.env[envKey] || process.env.CATALOG_API_URL;

  if (externalCatalogEndpoint) {
    try {
      console.log(`[DynamicCatalog] Fetching live catalog from external endpoint for tenant: ${normalizedId}`);
      const response = await axios.get(externalCatalogEndpoint, {
        headers: {
          'X-Tenant-ID': normalizedId,
          ...(process.env.CATALOG_API_KEY ? { Authorization: `Bearer ${process.env.CATALOG_API_KEY}` } : {}),
        },
        timeout: 6000,
      });

      if (response.data && response.data.businessName && Array.isArray(response.data.catalog)) {
        const liveProfile = {
          ...response.data,
          tenantId: normalizedId,
          lastSyncedAt: Date.now(),
        };
        tenantCatalogCache.set(normalizedId, liveProfile);
        return liveProfile;
      }
    } catch (err) {
      console.warn(`[DynamicCatalog] External catalog fetch failed for ${normalizedId}: ${err.message}. Using default catalog.`);
    }
  }

  // 2. Production Dynamic Datasets
  let profile;

  if (normalizedId === 'tenant-clothing' || normalizedId.includes('fashion') || normalizedId.includes('clothing')) {
    profile = {
      tenantId: normalizedId,
      businessName: 'مودرن ستايل للملابس والأزياء (Modern Style Egypt)',
      businessType: 'clothing',
      tagline: 'أحدث صيحات الملابس الكاجوال والتريندي بخامات قطن مصري ١٠٠٪',
      location: 'سيتي سنتر ألماظة، القاهرة (مع شحن سريع لجميع محافظات مصر)',
      workingHours: 'يومياً من ١٠:٠٠ صباحاً حتى ١١:٠٠ مساءً',
      deliveryZones: [
        { zone: 'القاهرة والجيزة والإسكندرية', fee: 45, eta: '٢٤ إلى ٤٨ ساعة' },
        { zone: 'محافظات الدلتا والقناة', fee: 55, eta: '٢ إلى ٣ أيام عمل' },
        { zone: 'محافظات الصعيد والبحر الأحمر', fee: 70, eta: '٣ إلى ٤ أيام عمل' },
      ],
      paymentMethods: ['كاش عند الاستلام مع إمكانية المعاينة قبل الدفع', 'فودافون كاش', 'إنستاباي (InstaPay)', 'فيزا وميزة'],
      vodafoneCashNumber: '01122334455',
      instapayHandle: 'modernstyle@instapay',
      storePolicy: 'المعاينة وقياس المقاس متاحان مع مندوب الشحن قبل الاستلام، مع إمكانية استبدال واسترجاع مجاني خلال ١٤ يوماً.',
      catalog: [
        {
          id: 'c_01',
          name: 'تيشيرت أوفر سايز قطن مصري ميلتون Heavy Cotton',
          category: 'تيشيرتات',
          price: 320,
          description: 'قطن ١٠٠٪ معالج ضد الانكماش مع قصة مريحة تريندي.',
          availableSizesOrColors: ['M (50-65kg)', 'L (65-80kg)', 'XL (80-95kg)', 'XXL (95-115kg)', 'ألوان: أسود، أبيض، زيتي، بيج جملي'],
          inStock: true,
        },
        {
          id: 'c_02',
          name: 'هودي شتوي مبطن فرو ناعم جداً',
          category: 'هوديز وسويت شيرت',
          price: 490,
          description: 'خامة ميلتون ثقيلة مبطنة بفرو دافئ وكابيشون واسع.',
          availableSizesOrColors: ['M', 'L', 'XL', 'XXL', 'ألوان: كحلي، رمادي، أسود، عنابي'],
          inStock: true,
        },
        {
          id: 'c_03',
          name: 'بنطلون كارجو تريند ٦ جيوب ستريت',
          category: 'بنطلونات',
          price: 440,
          description: 'خامة جبردين مستوردة مريحة وعملية مع جيوب عريضة.',
          availableSizesOrColors: ['مقاسات: ٣٠، ٣٢، ٣٤، ٣٦، ٣٨', 'ألوان: بيج كاكي، أسود، زيتي غامق'],
          inStock: true,
        },
        {
          id: 'c_04',
          name: 'قميص كتان كاجوال أكمام طويلة',
          category: 'قمصان',
          price: 380,
          description: 'كتان طبيعي ناعم ومسامي ومريح في جميع الأوقات.',
          availableSizesOrColors: ['M', 'L', 'XL', 'XXL', 'ألوان: أبيض نقي، سماوي، بيج رملي'],
          inStock: true,
        },
      ],
      lastSyncedAt: Date.now(),
    };
  } else {
    // Default Restaurant Tenant: مطعم البرنس (tenant-koshary-prince)
    profile = {
      tenantId: normalizedId,
      businessName: 'مطعم البرنس للمأكولات الشرقية والكشري',
      businessType: 'restaurant',
      tagline: 'أصل الطعم البيتي والمشويات على الفحم في قلب القاهرة',
      location: 'شارع النصر، المعادي، القاهرة',
      workingHours: 'يومياً من ١١:٠٠ صباحاً حتى ٢:٠٠ بعد منتصف الليل',
      deliveryZones: [
        { zone: 'المعادي وطرة والبساتين', fee: 20, eta: '٢٥ إلى ٣٥ دقيقة' },
        { zone: 'مدينة نصر ومصر الجديدة', fee: 30, eta: '٣٥ إلى ٤٥ دقيقة' },
        { zone: 'المهندسين والدقي والجيزة', fee: 35, eta: '٤٠ إلى ٥٠ دقيقة' },
        { zone: 'التجمع الخامس والأول', fee: 40, eta: '٤٥ إلى ٦٠ دقيقة' },
      ],
      paymentMethods: ['كاش عند الاستلام', 'فودافون كاش (Vodafone Cash)', 'فيزا وماستركارد عبر ماكينة المندوب', 'إنستاباي (InstaPay)'],
      vodafoneCashNumber: '01099887766',
      instapayHandle: 'elprince@instapay',
      storePolicy: 'التوصيل ساخن ومغلف حرارياً مع صلصة ودقة إضافية حسب الرغبة.',
      catalog: [
        {
          id: 'r_01',
          name: 'كشري البرنس مخصوص (مع دقة وصلصة وبصل مقرمش)',
          category: 'كشري وطواجن',
          price: 45,
          description: 'رز بالشعرية وعدس ممتاز ومكرونة مشكلة وحمص وبصل ذهبي مقرمش.',
          availableSizesOrColors: ['صغير: 35 ج', 'وسط: 45 ج', 'كبير: 60 ج', 'عائلي سوبر: 85 ج'],
          inStock: true,
        },
        {
          id: 'r_02',
          name: 'طاجن مكرونة فرن باللحمة المفرومة البلدي',
          category: 'كشري وطواجن',
          price: 75,
          description: 'طاجن فرن فخار بمكرونة فرن وصلصة غنية ولحمة مفرومة بلدي.',
          availableSizesOrColors: ['وسط: 75 ج', 'كبير دبل لحمة: 110 ج'],
          inStock: true,
        },
        {
          id: 'r_03',
          name: 'وجبة كباب وكفتة بلدي مشوية على الفحم',
          category: 'مشويات',
          price: 195,
          description: '٣ أسياخ كفتة بلدي مع سيخ كباب ورز بسمتي مبهر وطحينة وعيش ساخن.',
          inStock: true,
        },
        {
          id: 'r_04',
          name: 'نصف فرخة تكا مشوية ع الفحم مع بطاطس وثومية',
          category: 'مشويات',
          price: 140,
          description: 'نصف دجاجة بتتبيلة تكا مشوية على الفحم وتقدم مع رز وبطاطس.',
          inStock: true,
        },
        {
          id: 'r_05',
          name: 'طاجن أرز باللبن فرن بالقشطة والمكسرات',
          category: 'حلويات',
          price: 35,
          description: 'أرز بلبن بلدي دسم معمول في طاجن فخار بالفرن مع مكسرات.',
          inStock: true,
        },
        {
          id: 'r_06',
          name: 'كانز بيبسي / سفن أب / ميرندا مشبرة',
          category: 'مشروبات',
          price: 18,
          description: 'مشروب غازي مثلج ٣٣٠ مل.',
          inStock: true,
        },
      ],
      lastSyncedAt: Date.now(),
    };
  }

  tenantCatalogCache.set(normalizedId, profile);
  return profile;
}

// ============================================================================
// 2. Session Memory & 24-Hour TTL Eviction Buffer
// ============================================================================

class SlidingWindowSessionManager {
  constructor() {
    this.sessions = new Map();
    this.MAX_MESSAGES = 10;
    this.TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

    // Run periodic eviction routine every 15 minutes to prevent memory leaks
    setInterval(() => this.evictStaleSessions(), 15 * 60 * 1000);
  }

  sanitize(phone) {
    return (phone || '').toString().replace(/[^0-9]/g, '');
  }

  getSession(phone, tenantId) {
    const cleanPhone = this.sanitize(phone);
    const key = `${tenantId}:${cleanPhone}`;
    let session = this.sessions.get(key);

    if (!session) {
      session = {
        phoneNumber: cleanPhone,
        tenantId,
        messages: [],
        lastActive: Date.now(),
        createdAt: Date.now(),
      };
      this.sessions.set(key, session);
    } else {
      session.lastActive = Date.now();
    }

    return session;
  }

  addMessage(phone, tenantId, role, content) {
    const session = this.getSession(phone, tenantId);
    session.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Enforce strict sliding window of last 10 messages
    if (session.messages.length > this.MAX_MESSAGES) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES);
    }

    session.lastActive = Date.now();
    return session;
  }

  getHistory(phone, tenantId) {
    return this.getSession(phone, tenantId).messages;
  }

  clearSession(phone, tenantId) {
    const cleanPhone = this.sanitize(phone);
    const key = `${tenantId}:${cleanPhone}`;
    return this.sessions.delete(key);
  }

  saveOrder(phone, tenantId, order) {
    const session = this.getSession(phone, tenantId);
    session.confirmedOrder = order;
    return session;
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }

  evictStaleSessions() {
    const now = Date.now();
    let removed = 0;
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.TTL_MS) {
        this.sessions.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[SessionManager] Evicted ${removed} inactive sessions (24h TTL).`);
    }
    return removed;
  }
}

const sessionManager = new SlidingWindowSessionManager();

// ============================================================================
// 3. Gemini Flash AI with Dynamic System Prompt & Tools (Function Calling)
// ============================================================================

let aiClientInstance = null;

function getAIClient() {
  if (!aiClientInstance) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ [GeminiClient] GEMINI_API_KEY environment variable is not configured.');
    }
    aiClientInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  }
  return aiClientInstance;
}

/**
 * Tool Definition: extract_order_details
 * Formatted according to @google/genai FunctionDeclaration specs
 */
const extractOrderDetailsTool = {
  name: 'extract_order_details',
  description: 'يتم استدعاء هذه الوظيفة فوراً عند تأكيد العميل للأوردر لاستخراج بيانات الطلب المنظمة للربط مع نظام الكاشير (POS)',
  parameters: {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        description: 'قائمة الأصناف المطلوبة مع الكميات والأسعار والملاحظات',
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'اسم الصنف كما هو في القائمة' },
            quantity: { type: Type.INTEGER, description: 'الكمية المطلوبة' },
            price: { type: Type.NUMBER, description: 'سعر الوحدة بالجنيه المصري' },
            options: { type: Type.STRING, description: 'المقاس أو الحجم أو اللون أو درجة الحرارة/الصلصة' },
          },
          required: ['name', 'quantity'],
        },
      },
      customer_name: { type: Type.STRING, description: 'اسم العميل' },
      delivery_address: { type: Type.STRING, description: 'العنوان بالتفصيل (المنطقة، اسم الشارع، رقم العمارة، الشقة)' },
      contact_phone: { type: Type.STRING, description: 'رقم تليفون العميل للتوصيل' },
      total_estimated: { type: Type.NUMBER, description: 'إجمالي الحساب التقديري بالجنيه المصري شاملاً مصاريف الشحن' },
      payment_method: { type: Type.STRING, description: 'طريقة الدفع (كاش عند الاستلام، فودافون كاش، إنستاباي، فيزا)' },
    },
    required: ['items'],
  },
};

/**
 * Builds dynamic system prompt by injecting the tenant's real catalog
 */
function buildDynamicSystemInstruction(profile) {
  const catalogLines = profile.catalog
    .map((item) => {
      const extra = item.availableSizesOrColors ? ` [خيارات: ${item.availableSizesOrColors.join(' | ')}]` : '';
      return `- ${item.name} | السعر: ${item.price} ج.م | الفئة: ${item.category}${extra} | الوصف: ${item.description}`;
    })
    .join('\n');

  const deliveryLines = profile.deliveryZones
    .map((d) => `- ${d.zone}: شحن ${d.fee} ج.م (وقت الوصول: ${d.eta})`)
    .join('\n');

  const paymentLines = profile.paymentMethods.join('، ');

  return `
أنت "كريم"، مسؤول خدمة العملاء والمبيعات الودود والخبير لـ "${profile.businessName}" عبر واتساب.
شعارنا: "${profile.tagline}".
الموقع: ${profile.location}.
مواعيد العمل: ${profile.workingHours}.

طريقة وأسلوب الحديث:
1. تتحدث بالعامية المصرية الودودة، المهذبة، واللبقة جداً ("يا فندم"، "منورنا يا باشا"، "تحت أمرك"، "عينينا ليك"، "أحلى أوردر معمول لحضرتك مخصوص").
2. هدفك: الإجابة على الاستفسارات وتحويل المحادثة لأوردر ناجح دون إلحاح منفر (Conversion-Focused).
3. البيانات والأسعار المعتمدة ديناميكياً لهذا المتجر:
[قائمة المنتجات المعتمدة الحالية]:
${catalogLines}

[مناطق ومصاريف الشحن والتوصيل]:
${deliveryLines}

[طرق الدفع المتاحة]:
${paymentLines}
${profile.vodafoneCashNumber ? `رقم فودافون كاش: ${profile.vodafoneCashNumber}` : ''}
${profile.instapayHandle ? `حساب إنستاباي: ${profile.instapayHandle}` : ''}
${profile.storePolicy ? `[سياسة المكان]: ${profile.storePolicy}` : ''}

تعليمات حاسمة لأخذ الأوردر واستدعاء الأدوات:
- عندما يقرر العميل الطلب، اجمع بهدوء في سياق المحادثة: الأصناف والمقاسات/الأحجام + الاسم + رقم التليفون + عنوان التوصيل بالتفصيل + طريقة الدفع.
- بمجرد أن يقدم العميل تفاصيل الطلب أو يوافق عليه، يجب عليك تنفيذ أداة "extract_order_details" بالبيانات المستخرجة لتسجيلها في النظام فوراً.
- بعد تنفيذ الأداة، اعرض للعميل رسالة تأكيد لطيفة وملخصاً سريعاً بالأصناف والإجمالي مع طمأنته بأن الأوردر جاري تجهيزه الآن.
`.trim();
}

const FLASH_MODELS_FALLBACK_CHAIN = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];

/**
 * Exponential backoff retry execution with model fallback
 */
async function executeWithRetry(
  fn,
  models = FLASH_MODELS_FALLBACK_CHAIN,
  retries = 3,
  initialDelay = 800
) {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    const currentModel = models[i % models.length];
    try {
      return await fn(currentModel, i);
    } catch (err) {
      const errMsg = err?.message || JSON.stringify(err);
      const isHighDemand = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('429');
      
      console.warn(`[Gemini Retry] Attempt ${i + 1} with model '${currentModel}' failed: ${isHighDemand ? 'Model experiencing high demand (503/429)' : errMsg}`);
      
      if (i === retries - 1) throw err;
      
      const waitTime = isHighDemand ? Math.max(delay, 1000) + Math.random() * 500 : delay + Math.random() * 200;
      await new Promise((res) => setTimeout(res, waitTime));
      delay *= 1.8;
    }
  }
  throw new Error('All retries failed');
}

/**
 * Core AI execution: Calls Gemini Flash with dynamic catalog and function declarations
 */
export async function processCustomerMessageWithAI(userText, history, tenantProfile) {
  const ai = getAIClient();
  const systemInstruction = buildDynamicSystemInstruction(tenantProfile);

  // Prepare conversational history payload
  const contents = history.map((msg) => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Append current user message if not duplicate
  const lastMsg = history[history.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userText) {
    contents.push({ role: 'user', parts: [{ text: userText }] });
  }

  try {
    return await executeWithRetry(async (modelName) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
          topP: 0.9,
          tools: [{ functionDeclarations: [extractOrderDetailsTool] }],
        },
      });

      let extractedOrder = null;
      let replyText = response.text || '';

      // Check if the model triggered our order extraction function
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const orderCall = functionCalls.find((fc) => fc.name === 'extract_order_details');
        if (orderCall && orderCall.args) {
          const args = orderCall.args;
          extractedOrder = {
            items: args.items || [],
            customer_name: args.customer_name,
            delivery_address: args.delivery_address,
            contact_phone: args.contact_phone,
            total_estimated: args.total_estimated,
            payment_method: args.payment_method,
            status: 'confirmed',
            extractedAt: Date.now(),
          };

          console.log(`\n🎉 [Order Function Executed]`, JSON.stringify(extractedOrder, null, 2));

          // If the model returned tool call without text, generate a natural Egyptian order confirmation
          if (!replyText) {
            const itemsSummary = extractedOrder.items.map((i) => `• ${i.name} (عدد ${i.quantity})`).join('\n');
            replyText = `ألف شكر يا فندم! تم تسجيل أوردر حضرتك بنجاح:
${itemsSummary}
العنوان: ${extractedOrder.delivery_address || 'العنوان المسجل'}
طريقة الدفع: ${extractedOrder.payment_method || 'كاش عند الاستلام'}
${extractedOrder.total_estimated ? `الإجمالي التقديري: ${extractedOrder.total_estimated} ج.م` : ''}

الأوردر بيتحضر حالا وهيتواصل مع حضرتك مندوب التوصيل في أسرع وقت! منورنا يا باشا 🌸`;
          }
        }
      }

      if (!replyText) {
        replyText = 'أهلاً بيك يا فندم! تحت أمرك، تحب تطلب إيه النهاردة من المنيو؟';
      }

      return { replyText, functionCallData: extractedOrder };
    });
  } catch (error) {
    console.error('[GeminiService] All model attempts temporarily unavailable. Providing polite fallback message.', error);
    const fallbackReply = `أهلاً بحضرتك يا فندم في ${tenantProfile.businessName}! 🌸\nبنعتذر لحضرتك جداً عن أي تأخير بسبب ضغط مؤقت في السيستم، منيو اليوم وكل عروضنا متاحة وتحت أمرك، اتفضل قولنا تحب تطلب إيه وهنسجله لحضرتك فوراً! 🙏`;
    return { replyText: fallbackReply, functionCallData: null };
  }
}

// ============================================================================
// 4. WhatsApp Webhook Contract & Outbound Dispatch
// ============================================================================

/**
 * Normalizes incoming WhatsApp payload across Green API, Whapi, Meta Cloud, or Custom Simulators
 */
export function normalizeIncomingWhatsAppPayload(body) {
  if (!body || typeof body !== 'object') return null;

  // 1. Green API format (body.typeWebhook === 'incomingMessageReceived' or body.messageData)
  if (body.typeWebhook === 'incomingMessageReceived' || body.messageData) {
    const text =
      body.messageData?.textMessageData?.textMessage ||
      body.messageData?.extendedTextMessageData?.text ||
      body.messageData?.buttonsResponseMessage?.selectedButtonId ||
      body.messageData?.listResponseMessage?.title ||
      '';
    const sender = (body.senderData?.sender || body.senderData?.chatId || '').replace(/@.+$/, '').replace(/[^0-9]/g, '');
    if (text && sender) {
      return { fromPhone: sender, text: text.trim(), messageId: body.idMessage || `green_${Date.now()}`, raw: body };
    }
  }

  // 2. Whapi.cloud format (body.messages[0].text.body)
  if (Array.isArray(body.messages) && body.messages[0]) {
    const msg = body.messages[0];
    const text = msg.text?.body || msg.body || '';
    const sender = (msg.from || '').replace(/@.+$/, '').replace(/[^0-9]/g, '');
    if (text && sender) {
      return { fromPhone: sender, text: text.trim(), messageId: msg.id || `whapi_${Date.now()}`, raw: body };
    }
  }

  // 3. Meta Cloud API format (entry[0].changes[0].value.messages[0])
  if (Array.isArray(body.entry) && body.entry[0]?.changes?.[0]?.value?.messages) {
    const msg = body.entry[0].changes[0].value.messages[0];
    const text = msg.text?.body || msg.button?.text || '';
    const sender = (msg.from || '').replace(/[^0-9]/g, '');
    if (text && sender) {
      return { fromPhone: sender, text: text.trim(), messageId: msg.id || `meta_${Date.now()}`, raw: body };
    }
  }

  // 4. Direct JSON / Flat Testing format (body.message or body.text)
  if (body.message || body.text || body.userMessage) {
    const text = (body.message || body.text || body.userMessage).toString().trim();
    const sender = (body.phone || body.from || body.sender || '201012345678').toString().replace(/[^0-9]/g, '');
    return { fromPhone: sender, text, messageId: body.messageId || `test_${Date.now()}`, raw: body };
  }

  return null;
}

// Runtime WhatsApp Configuration
let runtimeWhatsAppConfig = {
  provider: 'green_api',
  greenApi: {
    instanceId: process.env.GREEN_API_INSTANCE_ID || '',
    apiToken: process.env.GREEN_API_API_TOKEN || '',
    host: process.env.GREEN_API_HOST || 'https://api.green-api.com',
  },
};

function resolveGreenApiHost(instanceId, host) {
  const candidates = [];
  if (instanceId && /^\d{4}/.test(instanceId)) {
    candidates.push(`https://${instanceId.slice(0, 4)}.api.greenapi.com`);
  }
  if (host && host.trim()) {
    const clean = host.trim().replace(/\/+$/, '');
    if (!candidates.includes(clean)) candidates.push(clean);
  }
  if (!candidates.includes('https://api.green-api.com')) {
    candidates.push('https://api.green-api.com');
  }
  return candidates;
}

function cleanPhoneNumber(raw) {
  if (!raw) return '201000000000';
  let cleaned = raw.replace(/@.+$/, '').replace(/[^0-9]/g, '');
  if (/^01[0125][0-9]{8}$/.test(cleaned)) {
    cleaned = '20' + cleaned.slice(1);
  } else if (/^1[0125][0-9]{8}$/.test(cleaned)) {
    cleaned = '20' + cleaned;
  }
  return cleaned;
}

/**
 * Dispatches the generated AI response via axios.post to WhatsApp API endpoint (Green API, etc.)
 */
export async function sendOutboundWhatsAppMessage(toPhone, replyText) {
  const cleanPhone = cleanPhoneNumber(toPhone);

  // 1. Direct Green API dispatch using instance ID and token with multi-host fallback
  const greenInst = runtimeWhatsAppConfig.greenApi.instanceId || process.env.GREEN_API_INSTANCE_ID;
  const greenToken = runtimeWhatsAppConfig.greenApi.apiToken || process.env.GREEN_API_API_TOKEN;

  if (greenInst && greenToken) {
    const candidateHosts = resolveGreenApiHost(greenInst, runtimeWhatsAppConfig.greenApi.host || process.env.GREEN_API_HOST);
    let lastError = null;

    for (const host of candidateHosts) {
      try {
        const url = `${host}/waInstance${greenInst}/sendMessage/${greenToken}`;
        console.log(`🚀 [Green API Dispatch] Sending message to +${cleanPhone} via ${host}`);
        const response = await axios.post(
          url,
          {
            chatId: `${cleanPhone}@c.us`,
            message: replyText,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );

        if (response.data?.idMessage) {
          console.log(`✅ [Green API Success] Message ID: ${response.data.idMessage} via ${host}`);
          runtimeWhatsAppConfig.greenApi.host = host;
          return { success: true, data: response.data };
        }
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [Green API Host ${host} failed]:`, err?.response?.status || err.message);
      }
    }

    const errDetails = lastError?.response?.data;
    const errorStr = typeof errDetails === 'string' ? errDetails.slice(0, 150) : JSON.stringify(errDetails || lastError?.message);
    console.error(`❌ [Green API Error] Failed to send to ${cleanPhone}:`, errorStr);
    return {
      success: false,
      error: errorStr,
    };
  }

  // 2. WA_API_URL if configured
  if (!WA_API_URL || !WA_API_TOKEN) {
    console.log(`[WA Outbound] (Simulated Mode - Green API credentials or WA_API_URL not set)`);
    console.log(`📱 To: +${cleanPhone} | Message: "${replyText.slice(0, 80)}..."`);
    return {
      success: true,
      data: {
        simulated: true,
        to: cleanPhone,
        note: 'Outbound logged to console. Configure Green API Instance ID and Token to dispatch live messages.',
      },
    };
  }

  try {
    console.log(`🚀 [WA Outbound Dispatch] Sending POST to: ${WA_API_URL}`);

    let payload;
    let headers = {
      'Content-Type': 'application/json',
    };

    if (WA_API_URL.includes('green-api.com') || WA_API_URL.includes('greenapi.com')) {
      // Green API format: { chatId: "2010...@c.us", message: "..." }
      payload = {
        chatId: `${cleanPhone}@c.us`,
        message: replyText,
      };
    } else if (WA_API_URL.includes('whapi.cloud')) {
      headers['Authorization'] = `Bearer ${WA_API_TOKEN}`;
      payload = {
        to: cleanPhone,
        body: replyText,
      };
    } else {
      // Default standard Meta Cloud API authorization header & payload
      headers['Authorization'] = `Bearer ${WA_API_TOKEN}`;
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { preview_url: false, body: replyText },
      };
    }

    const response = await axios.post(WA_API_URL, payload, {
      headers,
      timeout: 10000,
    });

    console.log(`✅ [WA Outbound Success] Status: ${response.status}`);
    return { success: true, data: response.data };
  } catch (err) {
    console.error(`❌ [WA Outbound Error] Failed to send message to ${cleanPhone}:`, err?.response?.data || err.message);
    return {
      success: false,
      error: err?.response?.data ? JSON.stringify(err.response.data) : err.message,
    };
  }
}

// ============================================================================
// 5. Express Routing & Immediate-Response Webhook Endpoints
// ============================================================================

/**
 * Handshake route for verification:
 * GET /webhook/tenant-koshary-prince, GET /webhook/:tenantId, GET /webhook
 */
app.get(['/webhook/tenant-koshary-prince', '/webhook/:tenantId', '/webhook'], (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ [Webhook Handshake Verified] Challenge accepted.');
    return res.status(200).send(challenge);
  }
  return res.status(200).send('OK');
});

/**
 * Ingestion route for WhatsApp Webhooks:
 * POST /webhook/tenant-koshary-prince, POST /webhook/:tenantId, POST /webhook
 *
 * CRITICAL ARCHITECTURE:
 * Green API requires an immediate 200 OK response (res.status(200).send('OK'))
 * to prevent messages from piling up in the delivery queue and triggering infinite retries.
 * The message is then processed asynchronously with Gemini in the background.
 */
app.post(['/webhook/tenant-koshary-prince', '/webhook/:tenantId', '/webhook'], (req, res) => {
  // 1. IMMEDIATELY respond 200 OK to Green API so the queue is cleared immediately
  res.status(200).send('OK');

  // 2. Asynchronously process the message in the background
  const rawBody = req.body;
  const rawQuery = req.query;
  const rawParams = req.params;

  (async () => {
    try {
      const tenantId = rawParams.tenantId || rawQuery.tenantId || 'tenant-koshary-prince';
      const parsed = normalizeIncomingWhatsAppPayload(rawBody);

      if (!parsed) {
        console.log(`ℹ️ [Webhook Ignored] No actionable user text in payload for tenant ${tenantId}`);
        return;
      }

      const { fromPhone, text } = parsed;
      console.log(`\n📩 [Incoming WhatsApp] Tenant: ${tenantId} | From: ${fromPhone} | Msg: "${text}"`);

      // Handle Reset Triggers ("إلغاء", "ابدأ من جديد", "مسح المحادثة")
      const cleanText = text.trim().toLowerCase();
      const isResetTrigger =
        cleanText === 'إلغاء' ||
        cleanText === 'ابدأ من جديد' ||
        cleanText === 'مسح المحادثة' ||
        cleanText === 'reset' ||
        cleanText === 'الغاء' ||
        cleanText === 'مسح';

      if (isResetTrigger) {
        sessionManager.clearSession(fromPhone, tenantId);
        const tenantProfile = await getTenantCatalog(tenantId);
        const resetReply = `أهلاً بيك يا فندم في ${tenantProfile.businessName}! 🌸\nتم إلغاء المحادثة السابقة والبدء من جديد. تحب أساعد حضرتك بإيه النهاردة؟`;

        sessionManager.addMessage(fromPhone, tenantId, 'model', resetReply);
        await sendOutboundWhatsAppMessage(fromPhone, resetReply);
        console.log(`🔄 [Session Reset] Cleared memory for ${fromPhone}`);
        return;
      }

      // Fetch dynamic tenant catalog (Google Sheets / REST / DB / In-memory)
      const tenantProfile = await getTenantCatalog(tenantId);

      // Save user message to 10-message sliding window
      sessionManager.addMessage(fromPhone, tenantId, 'user', text);
      const history = sessionManager.getHistory(fromPhone, tenantId);

      // Process customer inquiry with Gemini Flash AI & Order extraction tool
      const { replyText, functionCallData } = await processCustomerMessageWithAI(text, history, tenantProfile);

      // If an order was extracted via function calling, save to session
      if (functionCallData) {
        sessionManager.saveOrder(fromPhone, tenantId, functionCallData);
        console.log(`📦 [POS Ready Order Saved for ${fromPhone}]:`, functionCallData);
      }

      // Save AI reply to sliding window memory
      sessionManager.addMessage(fromPhone, tenantId, 'model', replyText);

      // Dispatch outbound response back to WhatsApp customer via Green API / WA provider
      await sendOutboundWhatsAppMessage(fromPhone, replyText);

      console.log(`⚡ [Async Turn Complete] Tenant: ${tenantId} | To: ${fromPhone} | Sent: "${replyText.slice(0, 50)}..."`);
    } catch (bgError) {
      console.error('🔥 [Async Webhook Processing Error]:', bgError);
    }
  })();
});

/**
 * WhatsApp Live Settings & Diagnostics
 */
app.get('/api/whatsapp/config', (req, res) => {
  res.json({
    config: {
      provider: runtimeWhatsAppConfig.provider,
      greenApi: {
        instanceId: runtimeWhatsAppConfig.greenApi.instanceId,
        hasToken: !!runtimeWhatsAppConfig.greenApi.apiToken,
        tokenMasked: runtimeWhatsAppConfig.greenApi.apiToken ? '••••••••' + runtimeWhatsAppConfig.greenApi.apiToken.slice(-4) : '',
        host: runtimeWhatsAppConfig.greenApi.host,
      },
    },
    appUrl: process.env.APP_URL || '',
  });
});

app.post('/api/whatsapp/config', (req, res) => {
  const { provider, greenApi } = req.body;
  if (provider) runtimeWhatsAppConfig.provider = provider;
  if (greenApi) {
    runtimeWhatsAppConfig.greenApi = {
      ...runtimeWhatsAppConfig.greenApi,
      ...greenApi,
      host: greenApi.host || runtimeWhatsAppConfig.greenApi.host || 'https://7105.api.greenapi.com',
    };
  }
  res.json({
    success: true,
    message: 'تم حفظ إعدادات واتساب بنجاح',
    config: {
      provider: runtimeWhatsAppConfig.provider,
      greenApi: {
        instanceId: runtimeWhatsAppConfig.greenApi.instanceId,
        hasToken: !!runtimeWhatsAppConfig.greenApi.apiToken,
        host: runtimeWhatsAppConfig.greenApi.host,
      },
    },
  });
});

app.post('/api/whatsapp/test-connection', async (req, res) => {
  const inst = req.body?.instanceId || runtimeWhatsAppConfig.greenApi.instanceId || process.env.GREEN_API_INSTANCE_ID;
  const token = req.body?.apiToken || runtimeWhatsAppConfig.greenApi.apiToken || process.env.GREEN_API_API_TOKEN;
  const baseUrl = (req.body?.host || runtimeWhatsAppConfig.greenApi.host || 'https://7105.api.greenapi.com').replace(/\/+$/, '');

  if (!inst || !token) {
    return res.json({
      stateInstance: 'unconfigured',
      error: 'Instance ID or API Token missing',
    });
  }

  try {
    const url = `${baseUrl}/waInstance${inst}/getStateInstance/${token}`;
    const response = await axios.get(url, { timeout: 8000 });
    return res.json({
      stateInstance: response.data?.stateInstance || 'unknown',
      details: response.data,
    });
  } catch (err) {
    return res.json({
      stateInstance: 'error',
      error: err?.response?.data?.message || err?.message || 'فشل الاتصال بخادم Green API',
      details: err?.response?.data,
    });
  }
});

app.post('/api/whatsapp/test-send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
    }
    const text = message || 'مرحباً بك! هذه رسالة تجريبية من نظام خدمة العملاء الذكي (Green API + Gemini) ✅';
    const result = await sendOutboundWhatsAppMessage(phone, text);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Health & Configuration Diagnostics
 */
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    waApiConfigured: !!(runtimeWhatsAppConfig.greenApi.instanceId && runtimeWhatsAppConfig.greenApi.apiToken) || !!process.env.WA_API_URL,
    verifyToken: WEBHOOK_VERIFY_TOKEN,
    whatsappProvider: runtimeWhatsAppConfig.provider,
  });
});

/**
 * Start Standalone Server
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n===============================================================`);
  console.log(`🚀 Production WhatsApp SaaS Server running on port ${PORT}`);
  console.log(`📍 Webhook: POST /webhook/tenant-koshary-prince`);
  console.log(`📍 Generic: POST /webhook/:tenantId`);
  console.log(`⚡ Immediate Response: res.status(200).send('OK') enabled`);
  console.log(`===============================================================\n`);
});

export default app;
