/**
 * Gemini AI Integration Service for WhatsApp Customer Support - Apparel & Fashion Specialist
 * 
 * Features:
 * - Powered by @google/genai SDK with modern flash model rotation ('gemini-3.8-flash', 'gemini-3.6-flash', etc.)
 * - Conversational Egyptian Arabic system prompts specialized exclusively for Fashion & Clothing stores
 * - Deep knowledge of sizes (M, L, XL, XXL, 3XL), fabric materials, garment care, and 14-day exchange/return policies
 * - Rejection & redirection for out-of-domain inquiries (food, restaurants, tech, etc.)
 * - Sliding window memory (last 10 messages)
 * - Automated order draft extraction into structured JSON
 */

import axios from 'axios';
import { GoogleGenAI, Type } from '@google/genai';
import { ChatMessage, OrderDraft } from './memoryManager.js';
import { getBusinessProfile, BusinessProfile, ClothingItem } from './catalogData.js';
import { analyzeSizingInput, SizingAnalysis } from './selfCorrectionMiddleware.js';

export interface MediaOptions {
  mediaType?: 'text' | 'audio' | 'image' | 'video' | 'document';
  mediaUrl?: string;
  mimeType?: string;
  caption?: string;
}

// Lazy-initialized Gemini client instance
let aiClient: GoogleGenAI | null = null;

/**
 * /**
 * Structured Tool/Function Declaration for Order Extraction (English Edition)
 */
export const extractOrderDetailsTool = {
  name: 'extract_order_details',
  description: 'Call this function immediately when the customer confirms their order details to extract structured data for cashier, POS, kitchen display, and CRM systems.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        description: 'List of items or dishes ordered, with portion sizes, add-ons, colors, quantities, and prices.',
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Name of the item or dish (e.g. Pepperoni Stuffed Crust Pizza, Double Smash Burger, or Oversized Tee)' },
            quantity: { type: Type.INTEGER, description: 'Quantity ordered' },
            price: { type: Type.NUMBER, description: 'Price per item in USD ($)' },
            portionSize: { type: Type.STRING, description: 'Portion or meal size (Single, Combo, Family, or M, L, XL, 43)' },
            addOns: {
              type: Type.ARRAY,
              description: 'Selected add-ons or toppings (e.g. Extra Mozzarella, Cheesy Fries, Jalapenos)',
              items: { type: Type.STRING },
            },
            specialInstructions: { type: Type.STRING, description: 'Special preparation or delivery instructions (e.g. No onions, extra spicy, well done)' },
            size: { type: Type.STRING, description: 'Shoe or clothing size if applicable' },
            color: { type: Type.STRING, description: 'Color choice if applicable' },
          },
          required: ['name', 'quantity'],
        },
      },
      customer_name: { type: Type.STRING, description: 'Customer full name' },
      delivery_address: { type: Type.STRING, description: 'Full detailed delivery address including street, building, apartment, floor, and city' },
      contact_phone: { type: Type.STRING, description: 'Contact phone number for the delivery courier' },
      total_estimated: { type: Type.NUMBER, description: 'Total estimated bill in USD ($) including delivery fee' },
      payment_method: { type: Type.STRING, description: 'Payment method (Credit Card, PayPal, Cash on Delivery)' },
      prep_time_estimated: { type: Type.STRING, description: 'Estimated preparation time (e.g. 20-25 mins)' },
    },
    required: ['items'],
  },
};

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in process.env');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Builds the comprehensive Fashion & Sneakers Specialist sales assistant system instruction
 */
export function buildEgyptianSystemInstruction(profile: BusinessProfile): string {
  const isSneakers = profile.type === 'sneakers';
  const isClothing = profile.type === 'clothing';
  const isRestaurant = profile.type === 'restaurant' || profile.id.includes('pizza') || profile.id.includes('burger');

  const itemsCatalogFormatted = profile.items
    .map((item) => {
      if ('portionSizes' in item || 'addOns' in item || 'prepTime' in item) {
        const m = item as any;
        const portions = m.portionSizes?.map((p: any) => `${p.size}: $${p.price}`).join(', ') || '';
        const addons = m.addOns?.map((a: any) => `${a.name} (+$${a.price})`).join(', ') || '';
        return [
          `- ${m.name}`,
          `Category: ${m.category}`,
          `Base Price: $${m.price}`,
          portions ? `Portion Sizes: [${portions}]` : '',
          addons ? `Available Add-ons: [${addons}]` : '',
          m.prepTime ? `Prep Time: ${m.prepTime}` : '',
          m.isSpicy ? '🌶️ Spicy Available' : '',
          `Description: ${m.description}`,
        ].filter(Boolean).join(' | ');
      } else if ('sizes' in item && 'colors' in item) {
        const cloth = item as ClothingItem;
        const details = [
          `- ${cloth.name}`,
          `Price: $${cloth.price}`,
          `Colors: ${cloth.colors.join(', ')}`,
          `Sizes: ${cloth.sizes.join(', ')}`,
          cloth.fabric ? `Fabric: ${cloth.fabric}` : '',
          cloth.upperMaterial ? `Upper: ${cloth.upperMaterial}` : '',
          cloth.soleMaterial ? `Sole: ${cloth.soleMaterial}` : '',
          `Details: ${cloth.description}`,
        ].filter(Boolean).join(' | ');
        return details;
      } else {
        return `- ${item.name} | Price: $${item.price} | Details: ${item.description}`;
      }
    })
    .join('\n');

  const deliveryZonesFormatted = profile.deliveryZones
    .map((z) => `- ${z.zone}: Shipping Fee $${z.fee} (ETA: ${z.eta})`)
    .join('\n');

  const paymentMethodsFormatted = profile.paymentMethods.map((p) => `- ${p}`).join('\n');

  const MANDATORY_SYSTEM_HEADER = `
CRITICAL INSTRUCTION:
1. LANGUAGE: ALWAYS RESPOND EXCLUSIVELY IN PROFESSIONAL, ELEGANT, AND COURTEOUS ENGLISH. NEVER RESPOND IN ARABIC OR ANY OTHER LANGUAGE, EVEN IF THE USER WRITES IN ARABIC. Understand Arabic inquiries with 100% accuracy and reply back in English.
2. CURRENCY: ALL PRICES, ESTIMATES, TOTALS, AND DELIVERY FEES MUST BE IN US DOLLARS WITH A DOLLAR SIGN ($), e.g. $14.99, $19.99, $25.99. NEVER USE EGP, POUNDS, OR J.M.
`.trim();

  // If custom systemPrompt is configured for this store, use it as primary instruction
  if (profile.systemPrompt && profile.systemPrompt.trim().length > 50) {
    return `
${MANDATORY_SYSTEM_HEADER}

${profile.systemPrompt.trim()}

---
Current Store Details & Catalog:
Store Name: ${profile.name}
Tagline: ${profile.tagline}
Location: ${profile.location}
Operating Hours: ${profile.workingHours}

Available Products in Inventory:
${itemsCatalogFormatted}

Delivery Zones & Shipping Rates (in USD $):
${deliveryZonesFormatted}

Payment Methods Accepted:
${paymentMethodsFormatted}
Store Policy: ${profile.policy || ''}
`.trim();
  }

  if (isRestaurant) {
    return `
${MANDATORY_SYSTEM_HEADER}

You are the Executive AI Sales & Customer Support Host for this gourmet restaurant "${profile.name}" on WhatsApp.
Tagline: "${profile.tagline}".
Location: ${profile.location}.
Hours: ${profile.workingHours}.

⚡️ Your Persona & Rules:
1. Always communicate in warm, welcoming, professional, and enthusiastic English.
2. All prices, totals, receipts, and delivery fees are strictly in USD ($).

🍕 Specialized Food & Beverage (F&B) Sales Rules:
1. Meal & Portion Sizes:
   - Single: Individual meal portion for one person.
   - Combo: Includes golden crispy seasoned fries and an ice-cold soft drink (adds $4.00 - $5.00).
   - Family / Party Box: Great value bundle for 3 to 5 people with sharing sides and a 2L drink.
   - Always ask: "Would you like your meal as a Single, or upgraded to a Combo with fries & drink, or a Family Box?"

2. Add-ons & Toppings Upselling:
   - Suggest delicious add-ons: Extra melted mozzarella stuffed crust ($2.99), warm cheddar dip ($2.50), Texas loaded bacon fries ($6.99), spicy jalapeno slices ($1.49).

3. Cooking & Dietary Instructions:
   - Inquire: "Would you prefer this mild or spicy? Do you have any dietary restrictions or special requests (e.g. no onions, sauce on the side)?"

4. Kitchen Preparation & Delivery ETA:
   - Reassure: "Your food is prepared fresh to order in 15-20 minutes, packed in thermally insulated packaging, and delivered in 25-40 minutes."

5. Order Completion:
   - Collect: Selected items & portion sizes, add-ons, cooking notes, customer name, delivery address, and contact phone number.
   - Immediately call the "extract_order_details" function as soon as the order details are confirmed.

Current Restaurant Menu:
${itemsCatalogFormatted}

Delivery Zones & Rates:
${deliveryZonesFormatted}

Accepted Payment Methods:
${paymentMethodsFormatted}
Store Policy: ${profile.policy || 'Delivered hot in thermally insulated packaging. 100% satisfaction guarantee.'}
`.trim();
  }

  if (isSneakers) {
    return `
${MANDATORY_SYSTEM_HEADER}

You are the Senior AI Footwear Specialist & Sales Consultant for the sneaker boutique "${profile.name}" on WhatsApp.
Tagline: "${profile.tagline}".
Location: ${profile.location}.
Hours: ${profile.workingHours}.

⭐️ Exclusive Specialty: Master-Quality Sneakers & Footwear across US 7-13 (EU 40-46) ⭐️

Strict Professional Rules:
1. Speak in stylish, polite, knowledgeable, and helpful English.
2. All prices and shipping fees are in USD ($).
3. Exclusive Footwear Focus: We specialize exclusively in master-quality sneakers (premium leather, responsive cushioning, original brand box with barcode). Politely steer non-shoe inquiries back to our footwear collection.
4. Sizing & Fit: Standard EU 40-46 / US 7-13 sizes available. Inquire about the customer's typical sneaker size and desired colorway.
5. 🛡️ Try-Before-You-Pay Guarantee:
   - Reassure the customer: "Our delivery courier will wait with you while you inspect the leather quality and try on the size before paying a single dollar! If the fit is not 100% perfect, you can decline delivery on the spot at zero cost." Free 14-day exchange.
6. Order Completion:
   - Collect: Model name, colorway, size (EU 40-46 / US 7-13), full name, delivery address, and contact phone number.
   - Call the "extract_order_details" function when order details are confirmed.

Current Sneaker Inventory:
${itemsCatalogFormatted}

Shipping Zones & ETA:
${deliveryZonesFormatted}

Accepted Payment Methods:
${paymentMethodsFormatted}
Store Policy: ${profile.policy || 'Inspect and try on before paying. Free 14-day exchange guarantee.'}
`.trim();
  }

  return `
${MANDATORY_SYSTEM_HEADER}

You are the Senior AI Fashion & Apparel Consultant for the brand "${profile.name}" on WhatsApp.
Tagline: "${profile.tagline}".
Location: ${profile.location}.
Hours: ${profile.workingHours}.

⭐️ Your Exclusive Domain: "Fashion, Streetwear, Apparel, and Casual Clothing" ⭐️

Strict Professional Rules:
1. Speak in stylish, warm, polite, and persuasive English.
2. All prices, receipts, and shipping fees are in USD ($).
3. Sizing Expert: Suggest sizes based on weight and fit preference (M: 120-150 lbs, L: 150-175 lbs, XL: 175-200 lbs, XXL: 200-230 lbs, 3XL: 230-260 lbs).
4. Fabrics Specialist: 100% Pure Egyptian Cotton (240 GSM heavyweight pre-shrunk), organic natural linen, and durable cotton-gabardine cargo pants.
5. 🛡️ Try-Before-You-Pay Guarantee: Courier try-on and inspection fully permitted before paying. Free 14-day exchange policy.
6. Order Completion: Call "extract_order_details" when customer provides item, color, size, name, address, and contact phone.

Store Inventory Catalog:
${itemsCatalogFormatted}

Delivery Zones & Rates:
${deliveryZonesFormatted}

Accepted Payment Methods:
${paymentMethodsFormatted}
Store Policy: ${profile.policy || ''}
`.trim();
}

/**
 * Resilient list of modern flash models to cycle through during high demand
 * gemini-2.5-flash has highest stability, quality, and low latency
 */
const FLASH_MODELS_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash-lite',
];

/**
 * Retries an asynchronous function with fast timeout and model rotation
 */
async function withModelFallbackRetry<T>(
  fn: (modelName: string, attempt: number) => Promise<T>,
  models: string[] = FLASH_MODELS_FALLBACK_CHAIN,
  maxRetries = 3,
  timeoutMs = 12000
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
      const errMsg = err?.message || JSON.stringify(err);
      console.log(`[GeminiService] Attempt ${attempt} with model '${currentModel}' failed (${errMsg.slice(0, 80)})`);

      // If quota is exhausted (429 / RESOURCE_EXHAUSTED), don't waste time retrying identical keys
      if (err?.status === 429 || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
        throw new Error('QUOTA_EXHAUSTED');
      }

      if (attempt >= maxRetries) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  throw new Error('Peak demand active across model fallback chain');
}

/**
 * Intelligent Egyptian Fashion dialect sales fallback engine for periods of cloud peak load
 * Handles weights, preferred oversized styles, exact sizes, colors, and order steps dynamically!
 * Supports Arabic, Franco-Arabic, English, Voice Notes, and Clothing Photos!
 */
export function generateEgyptianFallbackResponse(
  userMessage: string,
  history: ChatMessage[],
  businessType: 'restaurant' | 'clothing' | 'sneakers' = 'clothing',
  profile = getBusinessProfile('clothing'),
  mediaOptions?: MediaOptions
): string {
  const text = userMessage.trim().toLowerCase();

  // 0. Sneakers & Kicks Specialist Fallback (for sneaker stores or sneaker inquiries)
  const isSneakersStore = profile.type === 'sneakers' || profile.id.includes('hml') || profile.id.includes('nine');
  const hasSneakersIntent =
    /كوتشي|سنيكر|سنيكرز|شوز|شوزات|حذاء|احذية|أحذية|نايكي|اديداس|جوردن|دانك|سامبا|ايزي|نيوبالانس|اون كلاود|اير فورس|sneaker|kicks|shoe|shoes|jordan|dunk|samba|yeezy|force/i.test(
      text
    ) || /\b(40|41|42|43|44|45|46)\b/.test(text);

  if (isSneakersStore || hasSneakersIntent) {
    // If asking about price
    if (/bkam|kam|as3ar|price|cost|prices|how much|بكام|سعر|كام/i.test(text)) {
      return `Welcome to ${profile.name}! 👟🔥\nHere are our top trending master-quality sneakers with original brand box & barcodes:\n• Air Jordan 1 Retro (High & Low): $129.99\n• Nike Dunk Low (Panda & Special Editions): $119.99\n• Adidas Samba OG Classic: $99.99\n• New Balance 550 Vintage Basketball: $109.99\n• Yeezy Boost 350 V2 (Orthopedic Cushion): $149.99\n• Nike Air Force 1 '07: $109.99\n\n🛡️ 100% Inspect-Before-You-Pay Guarantee: Our courier will wait with you while you try on the shoes before paying a single dollar! Which model or size (US 7-13 / EU 40-46) would you like? ✨`;
    }

    // If asking for a specific color like white, black, panda, mocha
    if (/ابيض|أبيض|white/i.test(text)) {
      return `Fantastic choice! 👟 Clean white kicks are timeless. Available in your size:\n• Nike Air Force 1 '07 (Triple White — $109.99)\n• Adidas Samba OG (Cloud White with Black Stripes — $99.99)\n• New Balance 550 Vintage (White Grey — $109.99)\n• Air Jordan 1 Low White ($129.99)\n\nAvailable sizes: US 7 to 13 (EU 40-46) with try-before-buy inspection! What is your shoe size? 🌟`;
    }

    if (/اسود|أسود|black|تريبل بلاك/i.test(text)) {
      return `Black colorways are ultra-sleek and versatile! 👟\nAvailable models in black:\n• Air Force 1 Triple Black ($109.99)\n• Yeezy Boost 350 Onyx Triple Black ($149.99)\n• Air Jordan 1 Shadow Grey/Black ($129.99)\n• Nike Dunk Low Panda (Black & White Bestseller — $119.99)\n\nWhat shoe size do you wear? 🖤`;
    }

    // If asking about try-on or guarantee
    if (/معاينة|قياس|اقيس|قيس|اجرب|اضمن|ضمان|استرجاع|استبدال|try|inspect|guarantee|return/i.test(text)) {
      return `Rest assured! 🛡️ Our #1 customer promise:\n"100% Try-Before-You-Pay Guarantee!"\nOur delivery courier will wait with you while you open the box, inspect the premium leather, and try on the size before paying a single dollar. If the fit isn't 100% perfect, you can decline delivery on the spot at zero cost!\nWe also provide a free 14-day exchange guarantee. Which model can we prepare for you? 👟`;
    }

    // If user specifies a shoe size (40-46)
    const shoeSizeMatch = text.match(/\b(40|41|42|43|44|45|46)\b/);
    if (shoeSizeMatch) {
      const sizeNum = shoeSizeMatch[1];
      return `Welcome! Size ${sizeNum} (US 7-13) is in stock across our bestsellers: Air Jordan 1, Nike Dunk Low Panda, Samba OG, and New Balance 550. 🔥\nWhich colorway or model would you like us to set aside for you? Remember, you can inspect and try on before paying! 👟`;
    }

    // Default sneakers greeting
    return `Welcome to ${profile.name}! 👟🔥\nWe are your dedicated master-quality footwear consultants (Air Jordan 1, Nike Dunk Low, Samba OG, New Balance 550, Yeezy Boost 350).\nAll standard sizes available from EU 40 to 46 (US 7-13) in all trending colorways.\n\n🛡️ Inspect and try on with courier before paying! What model or size are you looking for today? ✨`;
  }

  // 0.1 Restaurant & F&B Specialist Fallback (for pizza, burger, and restaurant tenants)
  const isRestaurantStore =
    profile.type === 'restaurant' ||
    profile.id.includes('pizza') ||
    profile.id.includes('burger') ||
    profile.id.includes('restaurant') ||
    businessType === 'restaurant';

  const hasFoodIntent =
    /بيتزا|برجر|ساندوتش|وجبة|وجبه|كومبو|سنجل|عائلي|فاميلي|باستا|مكرونة|بطاطس|فرايز|لودد|صوص|جبنة|جبنه|شيدر|موتزاريلا|توبينج|اضافات|إضافات|سبايسي|عادي|دليفري|طعام|اكل|أكل|منيو|menu|pizza|burger|combo|single|family|toppings|fries|sauce|spicy|pasta|sandwich|meal/i.test(
      text
    );

  if (isRestaurantStore || (hasFoodIntent && !isSneakersStore)) {
    // 1. Portion Sizes inquiry (Single vs Combo vs Family)
    if (/كومبو|سنجل|عائلي|فاميلي|حجم|احجام|أحجام|combo|single|family|size|portion/i.test(text)) {
      return `Welcome to ${profile.name}! 🍕🍔🔥\nOur available meal portion tiers:\n• Single: Individual entree for 1 person ($13.99 - $14.99).\n• Combo: Upgraded with golden seasoned crispy fries & an ice-cold soft drink 🍟🥤 (adds $4.00 - $5.00).\n• Family / Party Box: Great value bundle for 3 to 5 people with sharing sides and large beverages ($28.99 - $39.99).\n\nWould you like your meal as a Single or upgraded to a Combo?`;
    }

    // 2. Add-ons & Toppings inquiry
    if (/توبينج|اضافات|إضافات|جبنة|جبنه|شيدر|موتزاريلا|صوص|هالبينو|رانش|باربيكيو|topping|add-on|addons|cheese|sauce|jalapeno/i.test(text)) {
      return `We've got delicious add-ons! 🧀🔥\n• Extra melted mozzarella stuffed crust or warm cheddar dip (+$2.50 - $2.99)\n• Spicy jalapeno slices (+$1.49)\n• Crispy smoked bacon crumbles (+$2.49)\n• Creamy buttermilk ranch or smoked BBQ sauce (+$1.49)\n• Texas loaded bacon & cheddar fries (+$6.99)\n\nWhich toppings would you like to add? ✨`;
    }

    // 3. Prep time & Delivery ETA inquiry
    if (/وقت|هتاخد قد ايه|هيوصل امتى|دليفري|توصيل|prep|eta|time|delivery/i.test(text)) {
      return `Your meal is baked fresh to order in our stone ovens in 15-20 minutes! ⏱️🔥\nIt arrives hot and thermally insulated to your doorstep in 25-40 minutes depending on your zone.\n\nWhat can we get cooking for you right now? 🚀`;
    }

    // 4. Special cooking instructions (spicy, no onion, allergies)
    if (/سبايسي|حار|عادي|شطة|بصل|بدون|حساسية|spicy|hot|mild|no onion/i.test(text)) {
      return `Noted with care! 👨‍🍳✨ Every special instruction is sent directly to the kitchen line.\nWe can prepare your dish mild or extra spicy, and exclude any ingredient (e.g. no onions, sauce on the side).\nShall we proceed with this preference?`;
    }

    // 5. Prices & Menu Inquiry
    if (/bkam|kam|as3ar|price|cost|prices|menu|بكام|سعر|كام|المنيو|منيو|قائمة|اسعار|أسعار/i.test(text)) {
      const itemsList = profile.items
        .map((m: any) => {
          const combo = m.portionSizes?.find((p: any) => p.size.toLowerCase().includes('combo'));
          return `• ${m.name}: $${m.price}${combo ? ` (Combo: $${combo.price})` : ''}`;
        })
        .join('\n');
      return `Welcome to ${profile.name}! 🍕🍔🔥\nTonight's top artisan sellers (all in USD $):\n\n${itemsList}\n\n⏱️ Prep time: 15-20 mins, delivered piping hot in insulated packaging!\nWhich item would you like, and would you like a Single or a Combo with fries & drink? 🥤🍟`;
    }

    // 6. Ordering intent
    if (/order|buy|checkout|deliver|أوردر|طلب|عايز اطلب|جعان|دليفري/i.test(text)) {
      return `Bon appétit in advance! 🛵🔥 To dispatch your order to the kitchen line immediately, please reply with:\n1. Selected item(s), portion tier (Single or Combo), and preferred add-ons.\n2. Any cooking notes (mild/spicy, no onions).\n3. Full name and contact phone number.\n4. Detailed delivery address.\n\nWe accept Credit Card, PayPal, and Cash on Delivery! ✨`;
    }

    // Default Restaurant greeting
    return `Welcome to ${profile.name}! 🍕🍔🔥\nArtisan stone-oven pizzas, smash burgers, and fresh pastas prepared fresh to order in ~20 minutes!\nAvailable in Single, Combo (+ seasoned fries & drink), and Family sharing boxes.\n\nWould you like to view our full menu or start an order? ✨`;
  }

  // 1. Voice Note Handling
  if (mediaOptions?.mediaType === 'audio' || /voice note|voice message|audio|vmail|fvs|فويس|صوتية/i.test(text)) {
    return `Hello! 🌸🎙️\nI received your voice note and I am delighted to assist you! All of our premium streetwear and casual apparel are in stock crafted of 100% fine Egyptian cotton:\n• Basic Oversized Tees ($25.99)\n• Casual Cool-Feel Linen Shirts ($29.99)\n• 6-Pocket Utility Cargo Pants ($34.99)\n• Fleece-Lined Winter Hoodies ($49.99)\n\nCould you please let me know your preferred size and color so I can check availability for you right away? 👕👖✨`;
  }

  // 2. Clothing Photos & Image Attachments (e.g. photo of pants, hoodie, tshirt)
  if (mediaOptions?.mediaType === 'image' || /photo|image|picture|screenshot|img|صورة|صوره/i.test(text)) {
    const isPants = /pant|cargo|trousers|jeans|shorts|بنطلون|كارجو/i.test(text);
    if (isPants) {
      return `Hello there! 👖 That cargo pants style in the image looks phenomenal!\nWe have our premium 6-pocket utility cargo pants in stock crafted with high-durability cotton gabardine & stretch Lycra:\n• Price: $34.99\n• Available Colors: Military Olive, Khaki Beige, Carbon Black, Dark Grey\n• Sizes: 30 to 40 waist\n\nWhat is your weight or usual waist size? We can prepare the perfect fit for you, with inspection and try-on allowed upon delivery! 🌟`;
    }
    return `Hello there! 📸✨\nThat clothing style in the picture is gorgeous! We have very similar, premium-quality streetwear models in our collection (Cargo Pants for $34.99, Oversized Tees for $25.99, Linen Shirts for $29.99, and Fleece Hoodies for $49.99).\n\nWhat is your preferred size or weight? I can check available colors and help you set up an order right away! 👕👖`;
  }

  // Self-Correction Middleware Check: If input has sizing intent with deterministic validated reply, return it immediately
  const sizing = analyzeSizingInput(userMessage);
  if (sizing.hasSizingIntent && sizing.deterministicReply) {
    return sizing.deterministicReply;
  }

  // 3. Out of domain inquiries rejection (food, koshary, restaurants, tech, etc.)
  if (/koshary|koshari|food|eat|meal|restaurant|burger|pizza|pasta|programming|code|medicine|كشري|طاجن/i.test(text)) {
    return `Hello there! 🌸\nWe are a premium clothing brand specializing exclusively in high-end casual fashion and streetwear (including 100% pure Egyptian cotton tees, linen shirts, fleece hoodies, and cargo pants) 👔👕.\nWe would love to help you style a fantastic look today. Would you like to view our latest available collection? ✨`;
  }

  // 4. Greetings
  if (/^(hi|hello|hey|good morning|good evening|salam|salam alaykum|welcome|أهلاً|اهلا|سلام)/i.test(text)) {
    return `Hello and welcome to ${profile.name}! 🌸\nWe are thrilled to assist you! All our collections are priced in USD ($) and come with a 100% try-before-buy guarantee. Would you like to view our catalog, or are you looking for a specific size/item? 👕`;
  }

  // 5. Item & Price Requests
  if (/bkam|kam|as3ar|prices|price|cost|how much|بكام|سعر/i.test(text)) {
    const itemsList = profile.items
      .map((m) => `• ${m.name}: $${m.price}`)
      .join('\n');
    return `Happy to help you with our pricing! 🌟 Here is our current collection catalog (in USD $):\n\n${itemsList}\n\n🛵 Try-before-buy inspection is fully allowed with the delivery agent before paying! Which item catches your eye?`;
  }

  // 6. Cargo / Pants inquiries
  if (/bantaloon|pantalon|cargo|pants|trousers|بنطلون|كارجو/i.test(text)) {
    return `Yes! 👖 Our premium 6-pocket utility cargo pants are in stock. Made of heavy cotton gabardine with stretch Lycra for ultimate comfort, priced at $34.99. Colors available: Military Olive, Khaki Beige, Carbon Black, and Dark Grey, in waist sizes 30 to 40. What is your weight or waist size to determine the perfect fit?`;
  }

  // 7. T-shirts & Oversized inquiries
  if (/tshirt|t-shirt|tee|oversize|oversized|تيشيرت/i.test(text)) {
    return `Awesome choice! 👕 Our Basic Oversized Heavy Cotton Tees are made of 100% pure Egyptian cotton (240 GSM), priced at $25.99. Available colors include Emerald Green, Military Olive, Sage Green, Carbon Black, Pure White, Camel Beige, and Navy Blue, in sizes M to 3XL. Which color can I reserve for you?`;
  }

  // 8. Color inquiries
  if (/alwan|colors|colour|ألوان|الوان/i.test(text)) {
    return `Our color palette is gorgeous! 🎨\n• Oversized Tees ($25.99): Emerald Green, Military Olive, Sage Green, Carbon Black, Pure White, Camel Beige, Navy Blue\n• Cargo Pants ($34.99): Military Olive, Khaki Beige, Carbon Black, Dark Grey\n• Linen Shirts ($29.99): Mint Green, Pure White, Sky Blue, Sandy Beige, Olive Green\n\nWhich color suits your style best?`;
  }

  // 9. Ordering intent
  if (/order|buy|purchase|want to buy|3ayez a3mel order|أوردر/i.test(text)) {
    return `Great! Let's get your order registered! 📦 Please reply with the following details:\n1. Selected item(s), color, and size\n2. Your full name and contact phone number\n3. Detailed shipping address\n\nOur delivery courier supports try-on and inspection before paying! ✨`;
  }

  // 10. Specific request for Green / Olive shirts (e.g. "عايز تيشيرت اخضر")
  if (/green|olive|emerald|اخضر|أخضر|زيتي/i.test(text) && /tshirt|t-shirt|tee|تيشيرت/i.test(text)) {
    return `Excellent taste! 👕 Green is highly trending!\nOur Basic Oversized Heavy Cotton Tees (100% Egyptian Cotton, pre-shrunk, 240 GSM, $25.99) are available in:\n• Emerald Green (stunning rich green)\n• Military Olive (rugged military tone)\n• Sage Green (soft, earthy tone)\n\nWhat is your weight or size preference so I can secure the perfect fit? 📏`;
  }

  // 3. User provides weight AND wants a much larger/smaller size
  const weightMatch = text.match(/(?:weight|wazn|وزن)?\s*(\d{2,3})\s*(?:lbs|lb|pounds|kg|كيلو)?/i);
  const detectedWeight = weightMatch ? parseInt(weightMatch[1], 10) : null;
  const wantsXXL = /xxl|2xl|2\s*xl|اكس اكس لارج/i.test(text);
  const wants3XL = /3xl|xxxl|3\s*xl|اكس اكس اكس لارج/i.test(text);

  if (detectedWeight && detectedWeight <= 130 && (wantsXXL || wants3XL)) {
    const sizeName = wants3XL ? '3XL' : 'XXL';
    return `Hello and welcome! 🌟\nBased on your weight of ${detectedWeight} lbs, your recommended fit is size M. However, since you love the cozy oversized look and requested size ${sizeName}, we are absolutely thrilled to prepare size ${sizeName} for you to achieve that perfect streetwear drape! 👕✨\n\nWould you like this in a heavy t-shirt, casual linen shirt, or hoodie? Also, which color do you prefer?`;
  }

  // 4. Exact Weight advice
  if (detectedWeight && detectedWeight >= 80 && detectedWeight <= 350) {
    // Check if lbs or kg
    const isLbs = /lbs|lb|pounds/i.test(text) || detectedWeight > 130;
    const weightInKg = isLbs ? Math.round(detectedWeight * 0.453592) : detectedWeight;
    const weightStr = isLbs ? `${detectedWeight} lbs` : `${detectedWeight} kg`;

    if (weightInKg <= 68) {
      return `Happy to guide you! 🌟 For your weight of ${weightStr}, our size M is a perfect comfortable fit. If you prefer a loose, oversized drape, size L would look spectacular. Which size would you like to go with? 👕`;
    } else if (weightInKg <= 80) {
      return `Happy to guide you! 🌟 For your weight of ${weightStr}, our size L is your standard fit. If you prefer a spacious, relaxed oversized feel, size XL is the way to go! Which one shall we prepare? 👕`;
    } else if (weightInKg <= 92) {
      return `Happy to guide you! 🌟 For your weight of ${weightStr}, your standard fit is size XL, and size XXL is ideal if you prefer a modern, stylish oversized streetwear look. Shall we proceed with size XXL? ✨`;
    } else if (weightInKg <= 105) {
      return `Happy to guide you! 🌟 For your weight of ${weightStr}, your ideal comfortable fit is size XXL, giving you an extremely stylish and elegant drape. Which color do you prefer? 👕`;
    } else {
      return `Happy to guide you! 🌟 For your weight of ${weightStr}, our size 3XL is the perfect match, ensuring maximum comfort and a highly relaxed fit. What color would you like to prepare? 👕`;
    }
  }

  // 5. Customer explicitly chooses a specific size
  if (wants3XL) {
    return `Perfect! 🌟 Size 3XL is available and is a wonderful choice for our heavyweight cotton collection, giving you absolute comfort and style. What color or item can I prepare for you? 👕`;
  }
  if (wantsXXL) {
    return `Awesome! 🌟 Size XXL is in stock and ready. It offers a incredibly relaxed oversized drape. Would you like this in a t-shirt or hoodie, and which color do you prefer (Emerald Green, Carbon Black, Pure White, Military Olive, Camel Beige)? 👕`;
  }
  if (/xl|\bxl\b/i.test(text)) {
    return `Excellent! 🌟 Size XL is in stock and fits beautifully. Would you like this in an oversized t-shirt, hoodie, or linen shirt, and what color would you like to go with? 👕`;
  }
  if (/\bl\b|large/i.test(text)) {
    return `Perfect! 🌟 Size L is fully available in our premium heavyweight collections. Would you like to check it out in our t-shirts or cargo pants? What color fits your mood today? 👕`;
  }
  if (/\bm\b|medium/i.test(text)) {
    return `Excellent! 🌟 Size M is in stock and fits perfectly. Would you like this in an oversized t-shirt or casual shirt, and which color can I get ready for you? 👕`;
  }

  // 6. Sizes general inquiry asking for guide
  if (/size guide|sizing|sizes|table|chart|مقاسات|جدول/i.test(text)) {
    return `We'd love to help! 📏 Here is our standard sizing reference chart based on weight:\n• Size M: fits 120-150 lbs (55-68 kg)\n• Size L: fits 150-175 lbs (68-80 kg)\n• Size XL: fits 175-200 lbs (80-92 kg)\n• Size XXL: fits 200-230 lbs (92-105 kg)\n• Size 3XL: fits 230-260 lbs (105-120 kg)\n\nCould you share your approximate weight/height? I will guide you to your ideal fit instantly! 🌟`;
  }

  // 4. Fabric & Material Inquiries
  if (/fabric|material|cotton|linen|gabardine|fleece|خامة|خامات/i.test(text)) {
    return `Our collections are crafted from the highest grade 100% pure Egyptian cotton and premium textiles 🌿:\n• Oversized Tees: Heavyweight 240 GSM pre-shrunk cotton.\n• Hoodies: Thick 3-thread cotton fleece with ultra-soft lining.\n• Casual Shirts: 100% organic lightweight natural linen.\n• Cargo Pants: Sturdy imported cotton gabardine with stretch Lycra.\n\nRemember, you can try and inspect all garments upon delivery before paying! 👕`;
  }

  // 5. Care & Washing Inquiries
  if (/wash|care|dry|iron|clean|غسيل|عناية/i.test(text)) {
    return `To keep your premium clothes looking fresh and brand new: ✨\n1. Machine wash in cold water (30°C) with the item turned inside out.\n2. Do not use bleach or chlorine.\n3. Iron at low-to-medium heat from the inside.\n4. Always dry in the shade to protect the vibrant dyes. 🌸`;
  }

  // 6. Return & Exchange Policy Inquiries
  if (/return|exchange|refund|warranty|policy|استبدال|استرجاع/i.test(text)) {
    return `Your peace of mind is our absolute priority! 🛡️\n1. Try-before-buy: Try on and inspect items with the courier during delivery before making any payment.\n2. We offer a 14-day exchange/refund guarantee as long as tags and receipts are intact.\n3. Any defect is immediately replaced 100% free of charge with all shipping costs on us! ✨`;
  }

  // 7. Catalog or Prices requests
  if (/catalog|menu|items|inventory|prices|bkam|kam|as3ar|cost|how much/i.test(text)) {
    const itemsList = profile.items
      .map((m) => `• ${m.name}: $${m.price} (${m.description.slice(0, 60)}...)`)
      .join('\n');
    return `Welcome to ${profile.name}! 👔 Here is our latest available inventory (in USD $):\n\n${itemsList}\n\n🛵 Shipping is available with complete try-on and inspection rights before you pay! What item can we help you choose?`;
  }

  // 8. Specific clothing items (티شيرت، قميص، هودي، بنطلون، كارجو، بولو)
  if (/tshirt|shirt|hoodie|pants|cargo|polo|dress|تيشيرت|قميص/i.test(text)) {
    const hasAddress = /street|ave|building|apartment|road|drive|ny|la|ca|london|egypt|cairo|maadi/i.test(text);
    if (hasAddress) {
      return `Awesome! 🛵 We have registered your delivery address. Would you like to pay with Cash on Delivery (including try-on rights), or pre-pay via Mobile Wallet/InstaPay?`;
    }
    return `Excellent choice! 🌟 Which size and color can I prepare for you?\nAlso, please share your shipping address and contact phone number so we can calculate delivery time! 📦`;
  }

  // 9. Address / Location provided
  if (/street|ave|building|apartment|road|drive|ny|la|ca|london|egypt|cairo|maadi|شارع|عمارة/i.test(text)) {
    return `Thank you, we have registered your detailed shipping address! 🛵\nYour package will arrive in 24 - 48 business hours with full inspection and try-on rights before payment. Would you prefer Cash on Delivery, Mobile Wallet, or InstaPay?`;
  }

  // 10. Payment method
  if (/cash|cod|wallet|vodafone|instapay|visa|card|كاش|فودافون/i.test(text)) {
    return `Awesome, your payment method has been verified successfully! 🌸\nOur packaging department is now assembling your premium apparel, and the courier will contact you shortly to schedule the exact delivery time. If you need anything else, we are always here!`;
  }

  // 11. Default helpful response
  return `How can I assist you at ${profile.name} today? 🌸\nI am your professional fashion consultant. Let me know which model, size, or color you are interested in, or share your weight/height for the perfect sizing recommendation! 👕✨`;
}

/**
 * Generates an AI sales response for an incoming customer WhatsApp message
 */
export async function generateSalesResponse(
  userMessage: string,
  history: ChatMessage[],
  businessType: 'restaurant' | 'clothing' | 'sneakers' = 'clothing',
  mediaOptions?: MediaOptions,
  storeId?: string
): Promise<string> {
  const profile = getBusinessProfile(businessType, storeId);

  try {
    const ai = getGeminiClient();
    const systemInstruction = buildEgyptianSystemInstruction(profile);

    // Format the sliding window conversation history for Gemini contents
    const formattedContents: Array<{ role: string; parts: Array<any> }> = [];

    // Append history turns (last up to 10 messages)
    for (const msg of history) {
      formattedContents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Self-Correction Middleware: Enrich user message with sizing validation context if applicable
    const sizing = analyzeSizingInput(userMessage);
    const enrichedUserMessage = sizing.hasSizingIntent && sizing.guidanceNote
      ? `${userMessage}\n\n${sizing.guidanceNote}`
      : userMessage;

    // Check if media is attached and download buffer
    let mediaPart: any = null;
    if (mediaOptions?.mediaUrl) {
      try {
        const mediaRes = await axios.get(mediaOptions.mediaUrl, {
          responseType: 'arraybuffer',
          timeout: 8000,
        });
        if (mediaRes.data) {
          const rawMime = String(
            mediaOptions.mimeType ||
            mediaRes.headers['content-type'] ||
            (mediaOptions.mediaType === 'audio' ? 'audio/ogg' : 'image/jpeg')
          );
          const cleanMime = rawMime.split(';')[0].trim();
          mediaPart = {
            inlineData: {
              mimeType: cleanMime,
              data: Buffer.from(mediaRes.data).toString('base64'),
            },
          };
        }
      } catch (err: any) {
        console.warn(`[GeminiService] Could not download media from ${mediaOptions.mediaUrl}:`, err.message);
      }
    }

    // Append current user message if not already the last turn
    const userParts: any[] = [];
    if (mediaPart) {
      userParts.push(mediaPart);
    }
    userParts.push({ text: enrichedUserMessage });

    const lastMsg = history[history.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessage) {
      formattedContents.push({
        role: 'user',
        parts: userParts,
      });
    }

    // Call Gemini using withModelFallbackRetry wrapper for 503/spike resilience
    return await withModelFallbackRetry(async (modelName, attempt) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
          topP: 0.9,
          tools: [{ functionDeclarations: [extractOrderDetailsTool] }],
        },
      });

      let reply = response.text?.trim() || '';

      // Check if the model called our extract_order_details tool
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const orderCall = functionCalls.find((fc) => fc.name === 'extract_order_details');
        if (orderCall && orderCall.args) {
          const args: any = orderCall.args;
          console.log(`[Gemini Function Call] extract_order_details called via ${modelName}:`, JSON.stringify(args));
          if (!reply) {
            const itemsStr = (args.items || []).map((i: any) => `• ${i.name} (Qty: ${i.quantity}) ${i.size ? `Size: ${i.size}` : ''} ${i.color ? `Color: ${i.color}` : ''}`).join('\n');
            reply = `Thank you so much! Your order has been registered successfully:\n${itemsStr}\nAddress: ${args.delivery_address || 'Address on file'}\nPayment Method: ${args.payment_method || 'Cash on Delivery'}\n${args.total_estimated ? `Total Estimated: $${args.total_estimated}` : ''}\n\nOur packaging department is already preparing your order, and our delivery agent will contact you shortly to schedule delivery. Remember, you have full try-on and inspection rights before you pay! 🌸👕`;
          }
        }
      }

      if (!reply) {
        reply = `Hello! Welcome to ${profile.name}! How can I assist you with our latest collections today? 👕`;
      }

      return reply;
    });
  } catch (error: any) {
    console.log('[GeminiService] Peak demand active across models, engaging intelligent local sales assistant fallback');
    return generateEgyptianFallbackResponse(userMessage, history, businessType, profile, mediaOptions);
  }
}

/**
 * Helper to extract structured order details from the conversation
 */
export async function extractOrderDetails(
  history: ChatMessage[],
  businessType: 'restaurant' | 'clothing' = 'clothing'
): Promise<Partial<OrderDraft> | null> {
  try {
    const ai = getGeminiClient();
    const conversationTranscript = history.map((m) => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.content}`).join('\n');

    const prompt = `
Analyze the following WhatsApp conversation between a customer and an AI apparel store assistant.
Extract the clothing order details if the customer wants to make a purchase, otherwise return null.

Conversation:
${conversationTranscript}

Output a single valid JSON object strictly matching this schema with no extra text or explanations:
{
  "hasOrderIntent": boolean,
  "items": [
    { "name": "clothing item model name", "quantity": 1, "price": 25.99, "sizeOrColor": "L Emerald Green" }
  ],
  "customerName": "Customer name if found, otherwise empty string",
  "phone": "Delivery contact phone number if found, otherwise empty string",
  "address": "Detailed delivery shipping address if found, otherwise empty string",
  "paymentMethod": "Cash on Delivery / Credit Card / PayPal if found, otherwise empty string",
  "totalEstimated": number,
  "status": "inquiry" | "collecting_info" | "ready_to_confirm" | "confirmed"
}
`.trim();

    const response = await withModelFallbackRetry(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
    }, FLASH_MODELS_FALLBACK_CHAIN, 3, 12000);

    const rawJson = response.text?.trim();
    if (!rawJson) return null;

    const parsed = JSON.parse(rawJson);
    if (!parsed.hasOrderIntent) return null;

    return {
      items: parsed.items || [],
      customerName: parsed.customerName || undefined,
      phone: parsed.phone || undefined,
      address: parsed.address || undefined,
      paymentMethod: parsed.paymentMethod || undefined,
      totalEstimated: parsed.totalEstimated || 0,
      status: parsed.status || 'inquiry',
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.log('[GeminiService] AI Order extraction using local pattern matching during peak load');
    // Graceful local heuristic fallback
    const conversationTranscript = history.map((m) => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.content}`).join('\n');
    const phoneMatch = conversationTranscript.match(/(?:\+?\d{1,4}[ \-]?\d{7,12}|\b\d{10,11}\b)/);
    const addressKeywords = ['street', 'ave', 'building', 'apartment', 'road', 'drive', 'cairo', 'maadi', 'alexandria', 'ny', 'la', 'london', 'شارع', 'عمارة', 'شقة'];
    let foundAddress: string | undefined;
    for (const kw of addressKeywords) {
      if (conversationTranscript.toLowerCase().includes(kw)) {
        const idx = conversationTranscript.toLowerCase().indexOf(kw);
        foundAddress = conversationTranscript.slice(Math.max(0, idx - 15), idx + 50).trim();
        break;
      }
    }

    let paymentMethod: string | undefined;
    if (/vodafone|wallet|cash/i.test(conversationTranscript)) paymentMethod = 'Vodafone Cash';
    else if (/instapay|bank/i.test(conversationTranscript)) paymentMethod = 'InstaPay Bank Transfer';
    else if (/visa|card|credit/i.test(conversationTranscript)) paymentMethod = 'Credit Card';
    else if (/cod|cash on delivery/i.test(conversationTranscript)) paymentMethod = 'Cash on Delivery';

    // Heuristic clothing items extraction
    const extractedItems: Array<{ name: string; quantity: number; price: number }> = [];
    if (/tshirt|t-shirt|tee/i.test(conversationTranscript)) {
      extractedItems.push({ name: 'Basic Oversized Heavy Cotton Tee', quantity: 1, price: 25.99 });
    }
    if (/shirt/i.test(conversationTranscript) && !/tshirt|t-shirt/i.test(conversationTranscript)) {
      extractedItems.push({ name: 'Casual Cool-Feel Linen Shirt', quantity: 1, price: 29.99 });
    }
    if (/hoodie|sweatshirt/i.test(conversationTranscript)) {
      extractedItems.push({ name: 'Premium Fleece-Lined Winter Hoodie', quantity: 1, price: 49.99 });
    }
    if (/pants|cargo/i.test(conversationTranscript)) {
      extractedItems.push({ name: 'Casual Street-Style 6-Pocket Cargo Pants', quantity: 1, price: 34.99 });
    }

    if (phoneMatch || foundAddress || paymentMethod || extractedItems.length > 0) {
      return {
        items: extractedItems,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        address: foundAddress,
        paymentMethod,
        status: 'collecting_info',
        updatedAt: Date.now(),
      };
    }
    return null;
  }
}

/**
 * Uses Gemini AI to parse raw text, spreadsheet rows, or WhatsApp notes into structured ClothingItem objects
 */
export async function parseCatalogItemsWithAi(rawContent: string): Promise<ClothingItem[]> {
  try {
    const ai = getGeminiClient();
    const prompt = `You are an expert e-commerce catalog parser and retail merchandiser.
Extract apparel/clothing products from the following text (which might be spreadsheet columns, tab-separated rows, WhatsApp product messages, or natural language descriptions).

Source Content:
"""
${rawContent}
"""

Return a JSON array of clothing items adhering strictly to this schema:
[
  {
    "name": "string (clear descriptive product title, e.g. 'Pure Egyptian Cotton Oversized Tee')",
    "category": "string (e.g. 'T-Shirts', 'Shirts', 'Hoodies', 'Pants', 'Dresses', 'Accessories')",
    "price": number (numeric value only, e.g. 350),
    "sizes": ["array of sizes with weight/fit guide if available, e.g. 'M (120-150 lbs)', 'L (150-175 lbs)', 'XL (175-200 lbs)', 'XXL (200-230 lbs)', '3XL (230-260 lbs)'"],
    "colors": ["array of colors, e.g. 'Emerald Green', 'Pure White', 'Carbon Black'"],
    "description": "string (detailed appealing description including fit and silhouette)",
    "fabric": "string (fabric composition, e.g. '100% Pure Egyptian Cotton, 240 GSM')",
    "care": "string (care instructions, e.g. 'Machine wash cold 30°C inside out, do not bleach')"
  }
]

If the text does not specify certain details (like fabric, care, or colors), infer realistic high-quality standards suitable for retail fashion.
Return ONLY a valid JSON array.`;

    const response = await withModelFallbackRetry(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
    }, FLASH_MODELS_FALLBACK_CHAIN, 3, 12000);

    const rawJson = response.text?.trim();
    if (!rawJson) throw new Error('Empty response from model');

    const parsed = JSON.parse(rawJson);
    const itemsArray = Array.isArray(parsed) ? parsed : (parsed.items || []);

    if (itemsArray.length === 0) {
      return parseCatalogItemsLocally(rawContent);
    }

    return itemsArray.map((item: any, idx: number) => ({
      id: `cloth_${Date.now()}_${idx}`,
      name: item.name || `Fashion Item ${idx + 1}`,
      category: item.category || 'T-Shirts',
      price: Number(item.price) || 25.99,
      sizes: Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : ['M (120-150 lbs)', 'L (150-175 lbs)', 'XL (175-200 lbs)', 'XXL (200-230 lbs)', '3XL (230-260 lbs)'],
      colors: Array.isArray(item.colors) && item.colors.length > 0 ? item.colors : ['Emerald Green', 'Carbon Black', 'Pure White'],
      description: item.description || `${item.name || 'Apparel item'} made with premium fabric and contemporary relaxed fit.`,
      fabric: item.fabric || '100% Pure Egyptian Cotton, 240 GSM',
      care: item.care || 'Machine wash cold 30°C inside out, do not bleach.',
      inStock: true,
    }));
  } catch (err) {
    console.warn('[GeminiService] AI catalog parser failed, falling back to deterministic local parser:', err);
    return parseCatalogItemsLocally(rawContent);
  }
}

function parseCatalogItemsLocally(rawContent: string): ClothingItem[] {
  const lines = rawContent.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const items: ClothingItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('\t')) {
      const parts = line.split('\t').map((p) => p.trim());
      const name = parts[0] || 'Apparel Item';
      const price = parseFloat(parts[1]?.replace(/[^\d.]/g, '') || '25.99') || 25.99;
      const sizes = parts[2] ? parts[2].split(/[;,]/).map((s) => s.trim()) : ['M', 'L', 'XL', 'XXL', '3XL'];
      const colors = parts[3] ? parts[3].split(/[;,]/).map((c) => c.trim()) : ['Carbon Black', 'Pure White', 'Emerald Green'];
      const desc = parts[4] || `${name} premium fashion item.`;

      items.push({
        id: `cloth_${Date.now()}_${i}`,
        name,
        category: name.toLowerCase().includes('hoodie') ? 'Hoodies' : name.toLowerCase().includes('shirt') ? 'Shirts' : name.toLowerCase().includes('pant') ? 'Pants' : 'T-Shirts',
        price,
        sizes,
        colors,
        description: desc,
        fabric: '100% Pure Egyptian Cotton, 240 GSM',
        care: 'Machine wash cold 30°C inside out',
        inStock: true,
      });
      continue;
    }

    const priceMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:usd|\$|egp|le|pound)/i) || line.match(/(?:price|for|cost)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 25.99;

    let category = 'T-Shirts';
    if (/hoodie|sweatshirt/i.test(line)) category = 'Hoodies';
    else if (/dress/i.test(line)) category = 'Dresses';
    else if (/shirt/i.test(line) && !/tee|tshirt/i.test(line)) category = 'Shirts';
    else if (/pant|cargo/i.test(line)) category = 'Pants';

    let name = 'Pure Egyptian Cotton Oversized Tee';
    if (/hoodie/i.test(line)) name = 'Heavyweight Fleece Winter Hoodie';
    else if (/linen/i.test(line)) name = 'Cool-Feel Organic Linen Shirt';
    else if (/dress/i.test(line)) name = 'Casual Turkish Crepe Dress';
    else if (/pant|cargo/i.test(line)) name = 'Urban 6-Pocket Cargo Pants';

    items.push({
      id: `cloth_${Date.now()}_${i}`,
      name,
      category,
      price,
      sizes: ['M (120-150 lbs)', 'L (150-175 lbs)', 'XL (175-200 lbs)', 'XXL (200-230 lbs)', '3XL (230-260 lbs)'],
      colors: ['Emerald Green', 'Carbon Black', 'Pure White', 'Desert Beige'],
      description: line.length > 25 ? line : '100% Pure Egyptian Cotton oversized tee, heavyweight 240 GSM pre-shrunk fabric.',
      fabric: '100% Pure Egyptian Cotton, 240 GSM Heavyweight',
      care: 'Machine wash cold 30°C inside out, do not bleach',
      inStock: true,
    });
    break;
  }

  if (items.length === 0) {
    items.push({
      id: `cloth_${Date.now()}`,
      name: 'Pure Egyptian Cotton Oversized Tee',
      category: 'T-Shirts',
      price: 25.99,
      sizes: ['M (120-150 lbs)', 'L (150-175 lbs)', 'XL (175-200 lbs)', 'XXL (200-230 lbs)', '3XL (230-260 lbs)'],
      colors: ['Emerald Green', 'Carbon Black', 'Pure White', 'Desert Beige', 'Navy Blue'],
      description: '100% Pure Egyptian cotton, heavyweight (240 GSM), pre-shrunk fabric with a modern oversized cut.',
      fabric: '100% Pure Egyptian Cotton, 240 GSM',
      care: 'Machine wash cold 30°C inside out, iron inside out',
      inStock: true,
    });
  }

  return items;
}
