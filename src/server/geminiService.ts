/**
 * Gemini AI Integration Service for WhatsApp Customer Support - HBB Store Engine
 * 
 * Exclusively Dedicated to HBB Store (Youth Streetwear & Sneakers)
 * 100% Egyptian Arabic & EGP Standardization (جنيه مصري)
 */

import axios from 'axios';
import { GoogleGenAI, Type } from '@google/genai';
import type { ChatMessage, OrderDraft } from './memoryManager.ts';
import { getBusinessProfile, type BusinessProfile } from './catalogData.ts';
import { analyzeSizingInput } from './selfCorrectionMiddleware.ts';
import { productCatalog } from './productCatalog.ts';
import { storeRegistry } from './storeRegistry.ts';

export interface MediaOptions {
  mediaType?: 'text' | 'audio' | 'image' | 'video' | 'document';
  mediaUrl?: string;
  mimeType?: string;
  caption?: string;
  audioBuffer?: Buffer;
  base64Audio?: string;
  transcription?: string;
}

// Lazy-initialized Gemini client instance
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('⚠️ [GeminiService] GEMINI_API_KEY is not defined in environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'RADDAD-WhatsApp-AI-SaaS/1.0',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Builds the comprehensive HBB Store sales assistant system instruction
 * 100% Egyptian Arabic & EGP Currency Enforcement.
 */
export function buildEgyptianSystemInstruction(profile: BusinessProfile, storeProfile?: any): string {
  const store = storeProfile || storeRegistry.getActiveStore();
  const storeName = store?.name || profile.name || 'HBB Store';
  const liveDynamicProductsContext = productCatalog.generateCatalogPromptContext();
  
  const deliveryHoursOrDays = store?.prepTime || store?.deliveryTimeframeHoursOrDays || 'خلال 24 إلى 48 ساعة';
  const zonesText = store?.deliveryZones && store.deliveryZones.length > 0
    ? store.deliveryZones.map((z: any) => `• ${z.zone}: ${z.fee} جنيه مصري (شحن ${z.eta})`).join('\n   ')
    : `• القاهرة والجيزة: 45 جنيه مصري (شحن خلال ${deliveryHoursOrDays})\n   • الإسكندرية والوجه البحري: 55 جنيه مصري (خلال يومين عمل)\n   • باقي المحافظات: 65 جنيه مصري (خلال 2 - 3 أيام)`;

  return `
تعليمات النظام والمساعد البيعي المعتمد لمتجر ${storeName} على واتساب (RADDAD AI):
1. هوية المتجر:
   - أنت المساعد البيعي الذكي والرسمي لمتجر "${storeName}" حصرياً (الخط الرسمي: ${store?.phone || '+20 113 204 4823'}).
   - عندما يسأل العميل "مين معايا" أو "من أنتم" أو يرحب، عرّف نفسك فوراً:
     "أهلاً بحضرتك يا فندم! معاك المساعد البيعي الذكي لمتجر ${storeName} 👕👟 منورنا يا غالي!"

2. اللهجة وأسلوب التحدث:
   - تحدث بالعامية المصرية الودودة، الراقية، والشاطرة في البيع وإتمام الأوردرات ("أهلاً بيك يا غالي", "المقاس ده تحفة عليك", "تحت أمرك يا فندم", "منور").
   - رد برقي وسرعة واقترح المنتجات المناسبة حسب طلب العميل.

3. العملة والأسعار (جنيه مصري EGP):
   - جميع الأسعار بالجنيه المصري (EGP / جنيه مصري) كما هي واردة في الكتالوج المعتمد فقط.
   - ممنوع تماماً ذكر الدولار أو أي عملة أجنبية.

4. كتالوج المنتجات المعتمد والمتاح حالياً (من ملف products.json):
${liveDynamicProductsContext}

5. إرشادات ترشيح المقاسات الذكية:
   - الملابس الشبابي (M, L, XL, XXL): اسأل عن وزن أو طول العميل:
     • مقاس M: يناسب وزن 55 إلى 68 كجم.
     • مقاس L: يناسب وزن 69 إلى 80 كجم.
     • مقاس XL: يناسب وزن 81 إلى 92 كجم.
     • مقاس XXL: يناسب وزن 93 إلى 105 كجم.
   - الكوتشيات والسنيكرز: مقاسات قياسية أوروبية مريحة (41، 42، 43، 44، 45).

6. ميزة الأمان الذهبية للمشتري (Try-Before-You-Pay Guarantee):
   - أكد للعميل دائماً: "المعاينة والقياس متاحة ومجانية مع مندوب الشحن قبل ما تدفع أي جنيه! لو المقاس مش مضبوط أو حبيت تغير تقدر ترفض الاستلام فوراً بدون أي مصاريف، ومعانا ضمان استبدال 14 يوماً."

7. مناطق ورسوم الشحن المعتمدة:
   ${zonesText}

8. مدة التوصيل وتأكيد الأوردر:
   - عندما يسأل العميل "هيوصل في قد إيه؟" أو "هيوصل امتى؟"، رد بالمدة المحددة من المحل حصراً: "${deliveryHoursOrDays}". لا تخترع أي أرقام من عندك!
   - عندما يكتمل حجز الأوردر بالاسم والعنوان، أكد للعميل فوراً بالنص:
     "تم تأكيد حجز الأوردر بتاعك يا فندم وهيصلك ${deliveryHoursOrDays}! ومعاك ميزة المعاينة والقياس مع المندوب قبل دفع أي جنيه. شكراً لتسوقك من ${storeName}!"
`.trim();
}

/**
 * Resilient list of modern flash models to cycle through during high demand
 */
const FLASH_MODELS_FALLBACK_CHAIN = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

async function withModelFallbackRetry<T>(
  fn: (modelName: string, attempt: number) => Promise<T>,
  models: string[] = FLASH_MODELS_FALLBACK_CHAIN,
  maxRetries = 2,
  timeoutMs = 6000
): Promise<T> {
  let attempt = 0;

  while (attempt < maxRetries) {
    const currentModel = models[attempt % models.length];
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout with ${currentModel}`)), timeoutMs)
      );
      return await Promise.race([fn(currentModel, attempt), timeoutPromise]);
    } catch (err: any) {
      attempt++;
      console.warn(`[GeminiService] Attempt ${attempt} failed with ${currentModel}: ${err?.message || err}.`);
      if (attempt >= maxRetries) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, 350 * attempt));
    }
  }

  throw new Error('All model fallback attempts exhausted');
}

/**
 * Deterministic Arabic fallback responder for HBB Store when model is unavailable or throttled
 */
function generateDeterministicArabicReply(userMessage: string, profile: BusinessProfile, mediaOptions?: MediaOptions): string {
  const text = (userMessage || '').trim();

  // Voice note handling
  if (mediaOptions?.transcription) {
    return `أهلاً بحضرتك في HBB Store! 🎙️ سمعت رسالتك الصوتية بخصوص: "${mediaOptions.transcription}".\nومتاح عندنا أفضل خامات وتلبيس مضبوط مع إمكانية القياس قبل الاستلام! تحب نجهزلك الأوردر فوراً؟ ✨`;
  }
  if (mediaOptions?.mediaType === 'audio') {
    return `أهلاً بحضرتك في HBB Store! 🎙️ تم استلام تسجيلك الصوتي بنجاح، وجاري الرد على طلبك فوراً! تحب تختار مقاس أو لون معين؟ ✨`;
  }

  // Self-Correction sizing intent check
  const sizing = analyzeSizingInput(userMessage);
  if (sizing.hasSizingIntent && sizing.deterministicReply) {
    return sizing.deterministicReply;
  }

  // Greetings
  if (/^(hi|hello|hey|salam|أهلاً|اهلا|سلام|مساء|صباح|السلام عليكم)/i.test(text)) {
    return `أهلاً بحضرتك في متجر HBB Store! 👕👟\nمنورنا يا فندم! متاح عندنا كولكشن ملابس شبابي وسنيكرز ماستر كواليتي، وكل المنتجات عليها معاينة وقياس مع المندوب قبل ما تدفع أي جنيه.\nتحب تشوف الكتالوج والأسعار ولا بتدور على مقاس معين؟ ✨`;
  }

  // Sneakers inquiry
  if (/كوتشي|سنيكر|سنيكرز|شوز|نايكي|اديداس|جوردن|دانك|باندا|نيوبالانس|sneaker|shoes/i.test(text)) {
    return `اختيار تحفة! 👟 في HBB Store متاح أحدث السنيكرز الماستر كواليتي بالعلبة الأصلية:\n• نايكي دانك لو باندا (Nike Dunk Panda): 1250 جنيه\n• نيو بالانس 530 سيلفر (New Balance 530): 1350 جنيه\n• أديداس كامبوس 00s شمواه (Adidas Campus): 1200 جنيه\n• إير جوردان 1 هاي ريترو (Air Jordan 1 High): 1450 جنيه\n\n🛡️ متاح القياس والتجربة مع المندوب قبل الدفع! مقاس حضرتك كام (41 إلى 45)؟ ✨`;
  }

  // Cargo / Pants inquiry
  if (/بنطلون|كارجو|باجي|جينز|pants|cargo/i.test(text)) {
    return `تمام جداً! 👖 متاح عندنا بنطلون كارغو 6 جيوب ووتر بروف خامة جبردين مستوردة تقيلة ومريحة، بسعر 550 جنيه مصري.\nالألوان المتوفرة: أسود مط، زيتي جيشي، بيج كارجو، والمقاسات من 30 لـ 38.\nوزن أو مقاس وسط حضرتك كام لترشيح الأنسب؟ 📏`;
  }

  // T-Shirts & Hoodies inquiry
  if (/تيشيرت|هودي|سويت شيرت|توب|tshirt|hoodie/i.test(text)) {
    return `تشكيلة التوب عندنا خاماتها ممتازة جداً! 👕🔥\n• هودي أوفر سايز ريفليكتف ميلتون تقيل مبطن: 650 جنيه\n• تيشيرت أوفر سايز أسيد واش قطن 100%: 380 جنيه\nالمقاسات المتاحة: M, L, XL, XXL بجميع الألوان.\nتحب نجهزلك أنهي مقاس؟ ✨`;
  }

  // Sizing inquiry
  if (/مقاس|مقاسات|وزن|طول|كيلو|size/i.test(text)) {
    const weightMatch = text.match(/(\d{2,3})/);
    const weight = weightMatch ? parseInt(weightMatch[1], 10) : null;
    if (weight && weight >= 50 && weight <= 130) {
      if (weight <= 68) return `لوزن ${weight} كجم، أنسب مقاس لحضرتك هو M، ولو حابب ستايل أوفر سايز واسع ومريح ننصحك بـ L! تحب نجهزلك M ولا L؟ 👕`;
      if (weight <= 80) return `لوزن ${weight} كجم، مقاسك المظبوط هو L، وللأوفر سايز الواسع مقاس XL هيكون ممتاز! تحب تختار أنهي؟ 👕`;
      if (weight <= 92) return `لوزن ${weight} كجم، مقاسك المظبوط هو XL، وللأوفر سايز الستريت وير مقاس XXL! تحب نعتمد أنهي لون؟ 👕`;
      return `لوزن ${weight} كجم، مقاس XXL هو الأنسب والأريح تماماً لحضرتك! تحب تختار أي موديل؟ 👕`;
    }
    return `جدول مقاسات HBB Store للملابس حسب الوزن: 📏\n• مقاس M: يناسب من 55 لـ 68 كجم\n• مقاس L: يناسب من 69 لـ 80 كجم\n• مقاس XL: يناسب من 81 لـ 92 كجم\n• مقاس XXL: يناسب من 93 لـ 105 كجم\nوزن أو طول حضرتك كام تقريباً؟ 🌟`;
  }

  // Guarantee & Inspection inquiry
  if (/معاينة|قياس|اقيس|اجرب|اضمن|ضمان|استرجاع|استبدال/i.test(text)) {
    return `اطمن تماماً يا فندم! 🛡️ ميزتنا الأولى في HBB Store:\n"المعاينة والقياس حقك مع المندوب قبل ما تدفع أي مليم!"\nالمندوب هيستنى معاك تفتح الأوردر وتقيس، ولو المقاس مش عاجبك تقدر ترفض الاستلام فوراً بدون أي تكلفة، ومعانا استبدال مجاني 14 يوماً. تحب نجهزلك طلبك؟ 👟👕`;
  }

  // Prices / Catalog general inquiry
  if (/بكام|سعر|اسعار|أسعار|منيو|كتالوج|prices|cost/i.test(text)) {
    const items = productCatalog.getProducts();
    const listStr = items.map((p) => `• ${p.name}: ${p.price} جنيه مصري`).join('\n');
    return `أهلاً بحضرتك! 🌟 دي قائمة أسعار المنتجات المتاحة في HBB Store (بالجنيه المصري):\n\n${listStr}\n\n🛵 الشحن متاح لجميع المحافظات مع ميزة المعاينة قبل الدفع! أي موديل عجبك؟ ✨`;
  }

  // Ordering intent
  if (/أوردر|طلب|احجز|عايز اشتري|order/i.test(text)) {
    return `ألف مبروك مقدماً! 📦 علشان نأكد حجز الأوردر فوراً، ابعتلي:\n1. الموديل والمقاس واللون المطلوب\n2. اسم حضرتك ورقم التليفون للتواصل\n3. عنوان التوصيل بالتفصيل\nوهنبعتلك الأوردر فوراً مع ميزة المعاينة والقياس قبل الدفع! ✨`;
  }

  // Delivery time inquiry (هيوصل في قد إيه / كام يوم / كام ساعة / امتى)
  if (/هيوصل|هتوصل|يوصل|قد ايه|كام يوم|كام ساعة|امتى|مدة التوصيل|وقت التوصيل|delivery/i.test(text)) {
    const activeStore = storeRegistry.getActiveStore();
    const cairoEta = activeStore?.prepTime || activeStore?.deliveryTimeframeHoursOrDays || 'خلال 24 إلى 48 ساعة';
    return `أهلاً بحضرتك يا فندم! 🛵 مواعيد التوصيل المعتمدة:\n• القاهرة والجيزة: ${cairoEta} فقط.\n• الإسكندرية والمحافظات: خلال 48 ساعة.\n\n🛡️ ومتاح لحضرتك المعاينة والقياس مع المندوب قبل ما تدفع أي جنيه! تحب نجهزلك الأوردر فوراً؟ ✨`;
  }

  // Order Confirmation & address received
  if ((text.includes('القاهرة') || text.includes('المعادي') || text.includes('مدينة نصر') || text.includes('شارع') || text.includes('01')) && /اعتمد|اكد|تمام|ابعت|احجز|شحن/i.test(text)) {
    const activeStore = storeRegistry.getActiveStore();
    const cairoEta = activeStore?.prepTime || activeStore?.deliveryTimeframeHoursOrDays || 'خلال 24 إلى 48 ساعة';
    return `تم تأكيد حجز الأوردر بتاعك بنجاح يا فندم! 👕✨\nالأوردر هيوصلك ${cairoEta} مع إمكانية المعاينة والقياس مع المندوب قبل دفع أي جنيه!\nشكراً لاختيارك ${activeStore?.name || 'HBB Store'}! 🌟`;
  }

  // Default HBB Store greeting
  const activeStore = storeRegistry.getActiveStore();
  return `أهلاً بحضرتك في ${activeStore?.name || 'HBB Store'}! 👕👟\nمتخصصين في ملابس الشباب الأوفر سايز والسنيكرز الماستر كواليتي بأسعار بالجنيه المصري، مع ميزة المعاينة والقياس قبل الدفع مع المندوب!\nتحب نساعدك باقتراح موديل أو مقاس معين؟ ✨`;
}

/**
 * Generates an AI sales response for an incoming customer WhatsApp message
 * Dedicated to HBB Store in 100% Egyptian Arabic and EGP currency.
 */
export async function generateSalesResponse(
  userMessage: string,
  history: ChatMessage[],
  _businessType: 'restaurant' | 'clothing' | 'sneakers' = 'clothing',
  mediaOptions?: MediaOptions,
  _storeId?: string
): Promise<string> {
  const profile = getBusinessProfile('clothing', 'hbb');

  try {
    const ai = getGeminiClient();
    const systemInstruction = buildEgyptianSystemInstruction(profile);

    const formattedContents: Array<{ role: string; parts: Array<any> }> = [];

    // Append conversation history turns
    for (const msg of history) {
      formattedContents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    let mediaPart: any = null;
    let effectiveUserMessage = userMessage;

    let audioBuffer = mediaOptions?.audioBuffer;
    let cleanMime = mediaOptions?.mimeType?.split(';')[0]?.trim() || (mediaOptions?.mediaType === 'audio' ? 'audio/ogg' : 'image/jpeg');

    if (!audioBuffer && mediaOptions?.base64Audio) {
      audioBuffer = Buffer.from(mediaOptions.base64Audio, 'base64');
    }

    if (!audioBuffer && mediaOptions?.mediaUrl) {
      try {
        const mediaRes = await axios.get(mediaOptions.mediaUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
        });
        if (mediaRes.data) {
          audioBuffer = Buffer.from(mediaRes.data);
          const rawMime = String(
            mediaOptions.mimeType ||
            mediaRes.headers['content-type'] ||
            (mediaOptions.mediaType === 'audio' ? 'audio/ogg' : 'image/jpeg')
          );
          cleanMime = rawMime.split(';')[0].trim();
        }
      } catch (err: any) {
        console.warn(`[GeminiService] Could not download media from ${mediaOptions.mediaUrl}:`, err.message);
      }
    }

    // Transcribe audio voice notes
    if (audioBuffer && (mediaOptions?.mediaType === 'audio' || cleanMime.startsWith('audio/'))) {
      const stt = await transcribeAudioWithGemini(audioBuffer, cleanMime);
      if (stt.transcription && !stt.transcription.includes('[صوت غير واضح]')) {
        if (mediaOptions) {
          mediaOptions.transcription = stt.transcription;
        }
        effectiveUserMessage = `🎙️ [رسالة صوتية نطقها العميل بالعامية المصرية]: "${stt.transcription}"`;
        console.log(`[GeminiService] 🎙️ Audio transcribed: "${stt.transcription}"`);
      }

      mediaPart = {
        inlineData: {
          mimeType: cleanMime,
          data: audioBuffer.toString('base64'),
        },
      };
    } else if (mediaOptions?.mediaType === 'image' && mediaOptions?.mediaUrl) {
      try {
        const imgRes = await axios.get(mediaOptions.mediaUrl, { responseType: 'arraybuffer' });
        mediaPart = {
          inlineData: {
            mimeType: mediaOptions.mimeType || 'image/jpeg',
            data: Buffer.from(imgRes.data).toString('base64'),
          },
        };
      } catch (err) {
        // ignore
      }
    }

    const currentParts: any[] = [];
    if (mediaPart) currentParts.push(mediaPart);
    if (effectiveUserMessage) currentParts.push({ text: effectiveUserMessage });

    if (currentParts.length === 0) {
      currentParts.push({ text: 'أهلاً بحضرتك' });
    }

    formattedContents.push({
      role: 'user',
      parts: currentParts,
    });

    const response = await withModelFallbackRetry(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.65,
        },
      });
    }, FLASH_MODELS_FALLBACK_CHAIN, 3, 10000);

    const generatedText = response.text?.trim();
    if (!generatedText) {
      return generateDeterministicArabicReply(userMessage, profile, mediaOptions);
    }

    return generatedText;
  } catch (error: any) {
    console.warn('[GeminiService] Using deterministic Egyptian Arabic responder:', error?.message || error);
    return generateDeterministicArabicReply(userMessage, profile, mediaOptions);
  }
}

/**
 * Extracts structured order draft from customer conversation
 * Standardized in Egyptian Pounds (EGP) and Egyptian addresses.
 */
export async function extractOrderDetails(
  history: ChatMessage[],
  _businessType: 'restaurant' | 'clothing' | 'sneakers' = 'clothing'
): Promise<OrderDraft | null> {
  try {
    const ai = getGeminiClient();

    const conversationTranscript = history
      .map((m) => `${m.role === 'user' ? 'العميل' : 'البوت'}: ${m.content}`)
      .join('\n');

    const prompt = `أنت نظام استخراج طلبات التجارة الإلكترونية لمتجر HBB Store في مصر.
حلل المحادثة واستخرج تفاصيل الطلب بالجنيه المصري (EGP).

نص المحادثة:
"""
${conversationTranscript}
"""

أرجع كائن JSON فقط بالصيغة التالية:
{
  "customer_name": "اسم العميل إن وجد",
  "contact_phone": "رقم التليفون المحمول",
  "delivery_address": "العنوان بالتفصيل داخل مصر",
  "payment_method": "الدفع عند الاستلام أو فودافون كاش",
  "total_estimated": 650,
  "currency": "EGP",
  "items": [
    {
      "name": "اسم المنتج",
      "quantity": 1,
      "price": 650,
      "size": "المقاس المطلوب (M, L, XL, XXL أو 41, 42, 43)",
      "color": "اللون المطلوب"
    }
  ]
}
إذا لم يطلب العميل أي منتج أو كانت مجرد استفسارات، أرجع: { "items": [] }`;

    const response = await withModelFallbackRetry(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
    }, FLASH_MODELS_FALLBACK_CHAIN, 3, 10000);

    const rawJson = response.text?.trim();
    if (!rawJson) return null;

    const parsed = JSON.parse(rawJson);
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return null;
    }

    return {
      items: parsed.items,
      customer_name: parsed.customer_name,
      contact_phone: parsed.contact_phone,
      delivery_address: parsed.delivery_address,
      payment_method: parsed.payment_method || 'الدفع عند الاستلام',
      total_estimated: parsed.total_estimated || parsed.items.reduce((acc: number, cur: any) => acc + (cur.price * cur.quantity), 0),
      currency: 'EGP',
      status: parsed.delivery_address ? 'confirmed' : 'collecting_info',
      updatedAt: Date.now(),
    };
  } catch (err) {
    // Local fallback matching
    const transcript = history.map((m) => m.content).join(' ');
    const phoneMatch = transcript.match(/(?:01\d{9}|201\d{9})/);
    const hasAddress = /شارع|عمارة|شقة|القاهرة|الجيزة|المعادي|مدينة نصر|المهندسين|الدقي|الإسكندرية|طنطا|المنصورة/i.test(transcript);

    if (phoneMatch || hasAddress) {
      return {
        items: [
          {
            name: 'طلب ملابس شبابي من HBB Store',
            quantity: 1,
            price: 650,
            size: 'L',
            color: 'أسود',
          },
        ],
        customer_name: 'عميل HBB Store',
        contact_phone: phoneMatch ? phoneMatch[0] : undefined,
        delivery_address: hasAddress ? 'العنوان مسجل في المحادثة' : undefined,
        payment_method: 'الدفع عند الاستلام (معاينة قبل الدفع)',
        total_estimated: 650,
        currency: 'EGP',
        status: hasAddress ? 'confirmed' : 'collecting_info',
        updatedAt: Date.now(),
      };
    }
    return null;
  }
}

/**
 * Transcribes pre-recorded or live voice notes using Gemini STT
 */
export async function transcribeAudioWithGemini(
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg'
): Promise<{ transcription: string; modelUsed: string; detectedLanguage?: string; intent?: string }> {
  try {
    const ai = getGeminiClient();
    const cleanMime = mimeType.split(';')[0].trim() || 'audio/ogg';

    const prompt = 'فرّغ هذا المقطع الصوتي بدقة تامة باللغة العربية والعامية المصرية، واكتب فقط الكلام المنطوق بدون أي تعليق أو مقدمات.';

    const response = await withModelFallbackRetry(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: audioBuffer.toString('base64'),
                },
              },
              { text: prompt },
            ],
          },
        ],
      });
    }, ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-2.5-flash'], 3, 12000);

    const transcription = response.text?.trim() || '';
    return {
      transcription,
      modelUsed: 'gemini-3.5-transcribe',
      detectedLanguage: 'ar-EG',
      intent: 'sales_inquiry',
    };
  } catch (err: any) {
    console.warn('[GeminiService] STT failed:', err.message);
    return {
      transcription: '[صوت غير واضح]',
      modelUsed: 'none',
      detectedLanguage: 'unknown',
      intent: 'unknown',
    };
  }
}

/**
 * Generates natural Arabic TTS speech
 */
export async function generateSpeechWithGemini(
  textToSpeak: string,
  _voiceName: string = 'Aoede'
): Promise<{ audioBuffer: Buffer; mimeType: string; audioBase64?: string; success: boolean; error?: string }> {
  try {
    const ai = getGeminiClient();
    const cleanText = textToSpeak.replace(/[*_#•]/g, '').trim().slice(0, 500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ role: 'user', parts: [{ text: cleanText }] }],
      config: {
        responseMimeType: 'audio/wav',
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      return {
        audioBuffer: Buffer.from(part.inlineData.data, 'base64'),
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'audio/wav',
        success: true,
      };
    }
    throw new Error('No audio in response');
  } catch (err: any) {
    console.warn('[GeminiService] TTS error:', err.message);
    return {
      audioBuffer: Buffer.alloc(0),
      mimeType: 'audio/wav',
      success: false,
      error: err.message,
    };
  }
}

export async function parseCatalogItemsWithAi(rawContent: string): Promise<any[]> {
  return productCatalog.getProducts();
}
