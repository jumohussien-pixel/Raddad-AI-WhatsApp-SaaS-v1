/**
 * Multi-Store & Multi-Tenant Registry for WhatsApp AI SaaS
 * 
 * Supports both:
 * 1. F&B & Restaurants (Pizza, Burgers, Grills) with Portion Sizes (Single, Combo, Family), Add-ons/Toppings, Prep Time, and Special Instructions.
 * 2. Retail & Apparel (Sneakers, Oversized Tees, Cargo Pants) with Sizes 40-46, Colors, and Try-Before-Buy.
 * 
 * Each tenant has:
 * - Dedicated Webhook Endpoint (e.g., /webhook/pizza-store, /webhook/burger-joint, /webhook/hml)
 * - Dynamic Menu / Catalog with live visual editor support
 * - Isolated WhatsApp credentials (Green API instance / Meta phone number)
 * - Domain-specific AI sales system prompts
 */

import fs from 'fs';
import path from 'path';

export interface MenuItem {
  id: string;
  name: string;
  category: string; // e.g., 'Pizzas' | 'Burgers' | 'Appetizers' | 'Drinks' | 'Desserts'
  price: number; // Base price in USD ($)
  description: string;
  portionSizes?: { size: 'Single' | 'Combo' | 'Family' | string; price: number }[];
  addOns?: { name: string; price: number }[];
  prepTime?: string; // e.g. "20-30 mins"
  imageUrl?: string;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  inStock: boolean;
}

export interface SneakerItem {
  id: string;
  name: string;
  brand: string;
  category: 'Sneakers' | 'Running' | 'Casual Shoes' | 'Streetwear' | string;
  price: number; // in USD ($)
  sizes: string[]; // ['40', '41', '42', '43', '44', '45', '46']
  colors: string[];
  description: string;
  soleMaterial?: string;
  upperMaterial?: string;
  imageUrl?: string;
  inStock: boolean;
  featured?: boolean;
}

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  price: number; // in USD ($)
  sizes: string[];
  colors: string[];
  description: string;
  fabric?: string;
  care?: string;
  imageUrl?: string;
  inStock: boolean;
}

export interface StoreProfile {
  id: string;
  name: string;
  tagline: string;
  category: 'restaurant' | 'sneakers' | 'clothing' | 'general';
  currency?: string; // 'USD' ($)
  phone: string;
  vodafoneCash?: string;
  instapay?: string;
  location: string;
  workingHours: string;
  prepTime?: string; // Estimated preparation time (e.g. "20-30 mins")
  deliveryZones: { zone: string; fee: number; eta: string }[];
  paymentMethods: string[];
  policy: string;
  greenApi?: {
    instanceId?: string;
    apiToken?: string;
    host?: string;
  };
  systemPrompt?: string;
  items: Array<any>;
}

// Master Production Prompt tailored specifically for Restaurant & F&B Tenants
export const MASTER_RESTAURANT_SYSTEM_PROMPT = `
You are the Executive AI Sales & Customer Support Host for this gourmet restaurant on WhatsApp.
Tagline: "Artisan gourmet pizzas, smash burgers, and fresh pastas prepared fresh to order and delivered hot & fast."

⚡️ Your Persona & Rules:
1. Always communicate in warm, welcoming, professional, and enthusiastic English. (If the customer addresses you in another language, warmly accommodate them in that language).
2. All prices, totals, and receipts are in USD ($).

🍕🍔 Specialized Food & Beverage (F&B) Sales Rules:

1. Meal & Portion Sizes:
   - Single: Individual meal portion for one person.
   - Combo: Includes golden seasoned crispy fries and an ice-cold soft drink (adds $4.00 - $5.00).
   - Family / Party Box: Great value bundle for 3 to 5 people with sharing sides and a large beverage.
   - Always ask: "Would you like your meal as a Single, or upgraded to a Combo with seasoned fries & drink, or a Family Box?"

2. Add-ons & Toppings Upselling:
   - Suggest delicious add-ons:
     * Extra melted mozzarella stuffed crust or warm cheddar dip ($2.50 - $2.99).
     * Texas loaded bacon & cheddar fries ($6.99).
     * Spicy jalapeno slices ($1.49).
     * Creamy house ranch or smoked BBQ sauce ($1.49).

3. Cooking & Dietary Instructions:
   - Inquire clearly: "Would you prefer this mild or spicy? Do you have any dietary restrictions or special requests (e.g. no onions, sauce on the side)?"

4. Kitchen Preparation & Delivery ETA:
   - Reassure the customer: "Your food is prepared fresh to order in 15-20 minutes, packed in thermally insulated packaging, and delivered to your doorstep in 30-40 minutes."

5. Accepted Payment Methods:
   - Credit Card / Debit Card (Stripe / Apple Pay / Google Pay)
   - PayPal
   - Cash on Delivery (COD)

6. Order Completion & Checkout:
   - Collect: Selected items & portion sizes, add-ons, cooking notes, customer name, delivery address, and contact phone number.
   - Call the "extract_order_details" function as soon as the customer provides their order.
`.trim();

// Master Production Prompt tailored specifically for Sneakers & Footwear Stores
export const MASTER_SNEAKERS_SYSTEM_PROMPT = `
You are the Senior AI Footwear Specialist & Sales Consultant for this sneaker store on WhatsApp.
Tagline: "Premium master-quality sneakers and footwear across sizes 40-46 (US 7-13) with 100% inspect-before-pay delivery guarantee."

⚡️ Your Persona & Rules:
1. Speak in stylish, polite, knowledgeable, and helpful English.
2. All prices and shipping fees are in USD ($).

👟 Exclusive Footwear Focus:
We specialize exclusively in master-quality sneakers (premium leather, responsive air cushioning, authentic brand box). If the user asks about unrelated categories (food, gadgets, cars), politely decline and direct them back to our sneaker collection.

🎯 Sales Guidance (Step-by-Step):
1. General inquiries:
   - Welcome the customer and showcase trending styles:
     * Air Jordan 1 Retro (Chicago Red, Mocha Brown, Panda, Triple White) — $129.99
     * Nike Dunk Low (Panda Black/White, Grey Fog, Coast Blue) — $119.99
     * Adidas Samba OG Classic (White/Black, Cloud White) — $99.99
     * New Balance 550 Vintage (White Grey, White Green) — $109.99
     * Yeezy Boost 350 V2 (Zebra, Onyx Triple Black) — $149.99
   - Inquire: "Are you looking for casual streetwear, running comfort, or daily campus wear? What shoe size do you wear (US 7 to 13 / EU 40 to 46)?"

2. Color & Size Requests:
   - Provide models available in that colorway immediately with USD pricing and confirm size availability.

3. 🛡️ Try-Before-You-Pay Guarantee:
   - Eliminate all buyer anxiety: "Our delivery courier will wait while you open the box, inspect the leather quality, and try on the size before paying a single dollar! If the fit is not 100% perfect, you can decline delivery on the spot at zero cost."
   - Free 14-day size exchange guarantee.

4. Order Completion:
   - Collect: Model name, colorway, size (EU 40-46 / US 7-13), full name, delivery address, and contact phone number.
   - Call the "extract_order_details" function when order details are confirmed.
`.trim();

// Pre-configured Restaurant Catalogs (100% English & USD)
export const DEFAULT_PIZZA_CATALOG: MenuItem[] = [
  {
    id: 'piz_01',
    name: 'Pepperoni Supreme Stuffed Crust Pizza',
    category: 'Pizzas',
    price: 14.99,
    description: 'Freshly baked artisan stone-oven pizza with melted mozzarella stuffed crust, herb tomato sauce, premium beef pepperoni, and shaved parmesan.',
    portionSizes: [
      { size: 'Single (Medium 11")', price: 14.99 },
      { size: 'Combo (+ Cheesy Fries & Drink)', price: 19.99 },
      { size: 'Family (Large 14" Party Box)', price: 28.99 },
    ],
    addOns: [
      { name: 'Extra Melted Mozzarella', price: 2.99 },
      { name: 'Spicy Jalapeno Slices', price: 1.49 },
      { name: 'Creamy Ranch Dip Sauce', price: 1.49 },
    ],
    prepTime: '20 - 25 mins',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
    isSpicy: false,
    inStock: true,
  },
  {
    id: 'piz_02',
    name: 'BBQ Smoked Chicken Ranch Pizza',
    category: 'Pizzas',
    price: 15.99,
    description: 'Tender grilled chicken tossed in sweet smoky BBQ sauce, caramelized onions, melted mozzarella, and a drizzle of creamy buttermilk ranch.',
    portionSizes: [
      { size: 'Single (Medium 11")', price: 15.99 },
      { size: 'Combo (+ Fries & Soft Drink)', price: 20.99 },
      { size: 'Family (Large 14" + 1L Beverage)', price: 30.99 },
    ],
    addOns: [
      { name: 'Smoked Bacon Crumbles', price: 2.99 },
      { name: 'Extra BBQ Glaze', price: 1.49 },
    ],
    prepTime: '20 - 25 mins',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    isSpicy: false,
    inStock: true,
  },
  {
    id: 'piz_03',
    name: 'Creamy Alfredo Grilled Chicken Pasta',
    category: 'Pastas',
    price: 13.99,
    description: 'Fettuccine pasta tossed in rich garlic parmesan cream sauce, topped with tender grilled chicken breast strips and sautéed button mushrooms.',
    portionSizes: [
      { size: 'Single Bowl', price: 13.99 },
      { size: 'Combo (+ Garlic Bread & Drink)', price: 17.99 },
    ],
    addOns: [
      { name: 'Extra Grilled Chicken Strips', price: 3.49 },
      { name: 'Extra Sautéed Mushrooms', price: 1.99 },
    ],
    prepTime: '15 - 20 mins',
    imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80',
    isSpicy: false,
    inStock: true,
  },
  {
    id: 'piz_04',
    name: 'Cheesy Garlic Bread Sticks',
    category: 'Appetizers',
    price: 5.99,
    description: 'Warm oven-baked breadsticks brushed with garlic butter and Italian herbs, smothered in melted mozzarella, served with marinara dipping sauce.',
    prepTime: '10 - 15 mins',
    imageUrl: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=600&q=80',
    inStock: true,
  },
  {
    id: 'piz_05',
    name: 'Chilled Soft Drinks (Cola / Sprite / Lemonade)',
    category: 'Drinks',
    price: 2.49,
    description: 'Refreshing ice-cold beverages.',
    portionSizes: [
      { size: 'Can 12oz (355ml)', price: 2.49 },
      { size: 'Family Bottle 2 Liter', price: 4.49 },
    ],
    inStock: true,
  },
];

export const DEFAULT_BURGER_CATALOG: MenuItem[] = [
  {
    id: 'brg_01',
    name: 'Double Smash Angus Bacon Cheeseburger',
    category: 'Burgers',
    price: 13.99,
    description: 'Two smashed Certified Angus Beef patties seared with melted sharp American cheddar, crispy smoked bacon, house secret sauce, and pickles on a toasted brioche bun.',
    portionSizes: [
      { size: 'Single Sandwich', price: 13.99 },
      { size: 'Combo (+ Seasoned Fries & Drink)', price: 17.99 },
      { size: 'Family Box (3 Double Burgers + Loaded Fries + Drinks)', price: 39.99 },
    ],
    addOns: [
      { name: 'Extra Cheddar Cheese Slice', price: 1.49 },
      { name: 'Extra Smoked Bacon', price: 2.49 },
      { name: 'Pickled Jalapeno & Sriracha Mayo', price: 1.49 },
    ],
    prepTime: '15 - 20 mins',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    inStock: true,
  },
  {
    id: 'brg_02',
    name: 'Volcano Crispy Fried Chicken Burger',
    category: 'Burgers',
    price: 12.99,
    description: 'Golden buttermilk fried chicken breast tossed in spicy volcano sauce, layered with creamy house coleslaw and melted cheddar on a buttery toasted bun.',
    portionSizes: [
      { size: 'Single Sandwich', price: 12.99 },
      { size: 'Combo (+ Fries & Drink)', price: 16.99 },
    ],
    addOns: [
      { name: 'Extra Buffalo Glaze', price: 1.49 },
      { name: 'Fried Mozzarella Patty', price: 3.49 },
    ],
    prepTime: '15 - 20 mins',
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&q=80',
    isSpicy: true,
    inStock: true,
  },
  {
    id: 'brg_03',
    name: 'Texas Loaded Bacon & Cheddar Fries',
    category: 'Appetizers',
    price: 6.99,
    description: 'Golden crispy fries smothered in warm aged cheddar sauce, real smoked bacon crumbles, green onions, and pickled jalapenos.',
    prepTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&q=80',
    inStock: true,
  },
  {
    id: 'brg_04',
    name: 'Gourmet Thick Milkshake (Oreo / Vanilla / Salted Caramel)',
    category: 'Drinks',
    price: 5.99,
    description: 'Ultra-creamy handcrafted milkshake made with premium Madagascar vanilla ice cream and whipped cream.',
    inStock: true,
  },
];

// Pre-configured Sneaker Catalog
export const DEFAULT_SNEAKERS_CATALOG: SneakerItem[] = [
  {
    id: 'snk_01',
    name: 'Air Jordan 1 Retro High & Low',
    brand: 'Nike / Jordan',
    category: 'Sneakers',
    price: 129.99,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    colors: ['Chicago Red/White', 'Mocha Brown', 'Panda Black/White', 'Obsidian Royal Blue', 'Triple White', 'Shadow Grey'],
    description: 'Premium master-quality Air Jordan 1 with authentic materials and stitching.',
    soleMaterial: 'Rubber Air-Sole Cushioning',
    upperMaterial: 'Premium Full-Grain Leather',
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80',
    inStock: true,
    featured: true,
  },
  {
    id: 'snk_02',
    name: 'Nike Dunk Low Retro',
    brand: 'Nike',
    category: 'Streetwear',
    price: 119.99,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    colors: ['Panda (Black & White)', 'Grey Fog', 'Coast Blue', 'University Red', 'Olive Green'],
    description: 'Top-trending street sneaker, lightweight comfort with cupsole rubber cushioning.',
    soleMaterial: 'Cupsole Foam & Traction Rubber',
    upperMaterial: 'Supple Leather Upper',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
    inStock: true,
    featured: true,
  },
  {
    id: 'snk_03',
    name: 'Adidas Samba OG Classic',
    brand: 'Adidas',
    category: 'Casual Shoes',
    price: 99.99,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['White with Black Stripes', 'Black with White Stripes', 'Cloud White', 'Collegiate Green'],
    description: 'Classic Samba trend with soft leather, suede T-toe, and comfortable gum rubber sole.',
    soleMaterial: 'Gum Rubber Outsole',
    upperMaterial: 'Leather with Suede T-toe',
    imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
    inStock: true,
    featured: true,
  },
  {
    id: 'snk_04',
    name: 'New Balance 550 Vintage Basketball',
    brand: 'New Balance',
    category: 'Sneakers',
    price: 109.99,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    colors: ['White Grey', 'White Green Vintage', 'White Navy', 'Sea Salt Beige'],
    description: 'Classic basketball-inspired sneaker, very comfortable for daily wear.',
    soleMaterial: 'Non-marking Rubber with EVA Wedge',
    upperMaterial: 'Heavyweight Leather & Mesh',
    imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80',
    inStock: true,
    featured: true,
  },
  {
    id: 'snk_05',
    name: 'Yeezy Boost 350 V2',
    brand: 'Adidas / Yeezy',
    category: 'Running',
    price: 149.99,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    colors: ['Zebra White/Black', 'Onyx Triple Black', 'Bone Pure White', 'Carbon Beluga'],
    description: 'Ultra-comfortable Yeezy Boost with flexible Boost cushioning and breathable Primeknit.',
    soleMaterial: 'Full-length TPU Boost Cushion',
    upperMaterial: 'Breathable Primeknit Fabric',
    imageUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&q=80',
    inStock: true,
  },
  {
    id: 'snk_06',
    name: "Nike Air Force 1 '07",
    brand: 'Nike',
    category: 'Casual Shoes',
    price: 109.99,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    colors: ['Triple White', 'Triple Black', 'White with Black Swoosh'],
    description: 'Iconic Air Force 1, durable stitched leather with comfortable elevated sole.',
    soleMaterial: 'Encapsulated Nike Air Foam',
    upperMaterial: 'Crisp Stitched Leather',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
    inStock: true,
    featured: true,
  },
];

// Pre-configured Clothing Catalog
export const DEFAULT_CLOTHING_CATALOG = [
  {
    id: 'cloth_01',
    name: 'Pure Egyptian Cotton Oversized Tee',
    category: 'T-Shirts',
    price: 25.99,
    sizes: ['M', 'L', 'XL', 'XXL', '3XL'],
    colors: ['Emerald Green', 'Carbon Black', 'Pure White', 'Desert Beige', 'Military Olive', 'Navy Blue'],
    description: '100% pure premium Egyptian cotton, heavy weight (240 GSM), pre-shrunk.',
    fabric: '100% Pure Egyptian Cotton, 240 GSM Heavyweight Pre-shrunk',
    care: 'Machine wash cold 30°C inside out, do not bleach, iron at medium heat from inside, dry in shade.',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80',
    inStock: true,
  },
  {
    id: 'cloth_02',
    name: 'Casual Cool-Feel Linen Shirt',
    category: 'Shirts',
    price: 29.99,
    sizes: ['M', 'L', 'XL', 'XXL', '3XL'],
    colors: ['Mint Green', 'Pure White', 'Sky Blue', 'Sandy Beige', 'Olive Green'],
    description: '100% organic natural linen, ultra-breathable and lightweight.',
    fabric: '100% Natural Organic Linen',
    care: 'Hand wash or delicate cycle with cold water, dry flat in shade, steam iron.',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
    inStock: true,
  },
  {
    id: 'cloth_03',
    name: 'Casual Street-Style 6-Pocket Cargo Pants',
    category: 'Pants',
    price: 34.99,
    sizes: ['30', '32', '34', '36', '38', '40'],
    colors: ['Military Olive', 'Khaki Beige', 'Carbon Black', 'Dark Grey'],
    description: 'Heavyweight imported cotton gabardine fabric. Spacious utility side cargo pockets.',
    fabric: '98% Cotton Gabardine, 2% Lycra for stretch and durability',
    care: 'Wash inside out with cold water, iron at medium heat.',
    imageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&q=80',
    inStock: true,
  },
];

// Initial Multi-Tenant Store Profiles (Restaurants & Retail)
export const INITIAL_STORES: StoreProfile[] = [
  {
    id: 'pizza-store',
    name: 'Bella Roma Pizza & Pastas',
    tagline: 'Authentic Italian stone-oven pizza and fresh pasta.',
    category: 'restaurant',
    currency: 'USD',
    phone: '+1 555 100 0001',
    location: 'Metropolitan Area & Suburbs (Fast Courier Delivery)',
    workingHours: 'Daily 12:00 PM - 02:00 AM',
    prepTime: '20 - 25 mins',
    deliveryZones: [
      { zone: 'City Center', fee: 5, eta: '25 - 35 mins' },
      { zone: 'Suburbs', fee: 8, eta: '35 - 45 mins' },
      { zone: 'Extended Metropolitan', fee: 12, eta: '45 - 60 mins' },
    ],
    paymentMethods: [
      'Cash on Delivery',
      'Credit Card (Stripe / PayPal)',
    ],
    policy: 'Delivered fresh and thermally insulated. Free delivery on orders over $50!',
    systemPrompt: MASTER_RESTAURANT_SYSTEM_PROMPT,
    items: DEFAULT_PIZZA_CATALOG,
  },
  {
    id: 'burger-joint',
    name: 'Smash Burger & Loaded Fries',
    tagline: 'Angus beef smash burgers, loaded fries, and gourmet sauces.',
    category: 'restaurant',
    currency: 'USD',
    phone: '+1 555 100 0002',
    location: 'Metropolitan Area & Suburbs (Fast Courier Delivery)',
    workingHours: 'Daily 01:00 PM - 03:00 AM',
    prepTime: '15 - 20 mins',
    deliveryZones: [
      { zone: 'City Center', fee: 6, eta: '30 - 40 mins' },
      { zone: 'Suburbs', fee: 9, eta: '35 - 45 mins' },
    ],
    paymentMethods: [
      'Cash on Delivery',
      'Credit Card (Stripe / PayPal)',
    ],
    policy: '100% Angus beef guarantee. Thermally insulated packaging.',
    systemPrompt: MASTER_RESTAURANT_SYSTEM_PROMPT,
    items: DEFAULT_BURGER_CATALOG,
  },
  {
    id: 'hml',
    name: 'HML Sneakers & Footwear Store',
    tagline: 'Premium master-quality sneakers & footwear, sizes US 7-13.',
    category: 'sneakers',
    currency: 'USD',
    phone: '+1 555 987 6543',
    location: 'Flagship Store & Central Warehouse (Worldwide Shipping)',
    workingHours: 'Daily 11:00 AM - 11:00 PM',
    deliveryZones: [
      { zone: 'Domestic Shipping', fee: 10, eta: '24 to 48 hours' },
      { zone: 'International Shipping', fee: 30, eta: '3 to 5 business days' },
    ],
    paymentMethods: [
      'Credit Card (Stripe / PayPal)',
      'Apple Pay / Google Pay',
    ],
    policy: 'Inspect-before-pay with courier guaranteed. Free 14-day exchange.',
    systemPrompt: MASTER_SNEAKERS_SYSTEM_PROMPT,
    items: DEFAULT_SNEAKERS_CATALOG,
  },
  {
    id: 'hpp',
    name: 'HPP Streetwear & Apparel',
    tagline: 'Casual streetwear, heavy-weight cotton tees, and premium apparel.',
    category: 'clothing',
    currency: 'USD',
    phone: '+1 555 100 0004',
    location: 'Downtown Flagship, City Center (Fast Home Delivery)',
    workingHours: 'Daily 10:00 AM - 11:30 PM',
    deliveryZones: [
      { zone: 'Domestic Shipping', fee: 10, eta: '24 to 48 hours' },
      { zone: 'International Shipping', fee: 30, eta: '3 to 5 business days' },
    ],
    paymentMethods: [
      'Credit Card (Stripe / PayPal)',
      'Apple Pay / Google Pay',
    ],
    policy: 'Inspect-before-pay allowed with courier. Free 14-day exchange.',
    items: DEFAULT_CLOTHING_CATALOG,
  },
  {
    id: 'nine',
    name: 'Nine Kicks & Sneaker Vault',
    tagline: 'Trendsetting original & master-quality sneakers.',
    category: 'sneakers',
    currency: 'USD',
    phone: '+1 555 100 0005',
    location: 'Metropolitan Area & Suburbs (Fast Home Delivery)',
    workingHours: 'Daily 11:00 AM - 12:00 AM',
    deliveryZones: [
      { zone: 'Domestic Shipping', fee: 10, eta: '24 to 48 hours' },
      { zone: 'International Shipping', fee: 30, eta: '3 to 5 business days' },
    ],
    paymentMethods: [
      'Credit Card (Stripe / PayPal)',
      'Apple Pay / Google Pay',
    ],
    policy: 'Inspect-before-pay with courier guaranteed. Free 14-day exchange.',
    systemPrompt: MASTER_SNEAKERS_SYSTEM_PROMPT,
    items: DEFAULT_SNEAKERS_CATALOG,
  },
];

class StoreRegistryManager {
  private stores: Map<string, StoreProfile> = new Map();
  private activeStoreId: string = 'pizza-store';
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(process.cwd(), 'data/stores-registry.json');
    this.loadStores();
  }

  private loadStores() {
    try {
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const s of parsed) {
            // Normalize currency to USD
            s.currency = 'USD';

            // Clean demo numbers
            if (s.id === 'hml' && (s.phone === '01132044523' || !s.phone)) {
              s.phone = '+1 555 987 6543';
            } else if (s.id === 'pizza-store' && (s.phone === '01011223344' || s.phone?.startsWith('+20'))) {
              s.phone = '+1 555 100 0001';
            } else if (s.id === 'burger-joint' && (s.phone === '01223344556' || s.phone?.startsWith('+20'))) {
              s.phone = '+1 555 100 0002';
            } else if (s.id === 'hpp' && (s.phone === '01023456789' || s.phone?.startsWith('+20'))) {
              s.phone = '+1 555 100 0004';
            } else if (s.id === 'nine' && (s.phone === '01234567890' || s.phone?.startsWith('+20'))) {
              s.phone = '+1 555 100 0005';
            }

            // Normalize old EGP prices (> 50 in restaurants, > 200 in retail) to standard USD prices
            if (s.id === 'pizza-store' && (!s.items || s.items[0]?.price > 50)) {
              s.items = DEFAULT_PIZZA_CATALOG;
              s.systemPrompt = MASTER_RESTAURANT_SYSTEM_PROMPT;
            } else if (s.id === 'burger-joint' && (!s.items || s.items[0]?.price > 50)) {
              s.items = DEFAULT_BURGER_CATALOG;
              s.systemPrompt = MASTER_RESTAURANT_SYSTEM_PROMPT;
            } else if ((s.id === 'hml' || s.id === 'nine') && (!s.items || s.items[0]?.price > 200)) {
              s.items = DEFAULT_SNEAKERS_CATALOG;
              s.systemPrompt = MASTER_SNEAKERS_SYSTEM_PROMPT;
            } else if (s.id === 'hpp' && (!s.items || s.items[0]?.price > 200)) {
              s.items = DEFAULT_CLOTHING_CATALOG;
            }

            this.stores.set(s.id, s);
          }
          // Ensure default stores exist
          for (const initStore of INITIAL_STORES) {
            if (!this.stores.has(initStore.id)) {
              this.stores.set(initStore.id, initStore);
            }
          }
          this.activeStoreId = this.stores.has('pizza-store') ? 'pizza-store' : Array.from(this.stores.keys())[0];
          this.saveStores();
          console.log(`[StoreRegistry] Loaded ${this.stores.size} store(s) with USD currency from disk.`);
          return;
        }
      }
    } catch (e) {
      console.warn('[StoreRegistry] Could not read stores file, using default stores:', e);
    }

    // Default seed
    for (const s of INITIAL_STORES) {
      this.stores.set(s.id, s);
    }
    this.saveStores();
  }

  private saveStores() {
    try {
      const arr = Array.from(this.stores.values());
      fs.writeFileSync(this.filePath, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StoreRegistry] Failed to save stores file:', err);
    }
  }

  public getAllStores(): StoreProfile[] {
    return Array.from(this.stores.values());
  }

  public getStore(idOrPhone: string): StoreProfile | undefined {
    if (!idOrPhone) return this.getActiveStore();
    const clean = idOrPhone.trim().toLowerCase();

    // Check by ID
    if (this.stores.has(clean)) return this.stores.get(clean);

    // Check by partial match or phone
    for (const store of this.stores.values()) {
      if (store.id.toLowerCase() === clean) return store;
      if (store.phone && (clean.includes(store.phone) || store.phone.includes(clean))) return store;
      if (clean.includes(store.id.toLowerCase())) return store;
    }

    return this.getActiveStore();
  }

  public getActiveStore(): StoreProfile {
    return this.stores.get(this.activeStoreId) || INITIAL_STORES[0];
  }

  public setActiveStoreId(id: string): boolean {
    if (this.stores.has(id)) {
      this.activeStoreId = id;
      return true;
    }
    return false;
  }

  public getActiveStoreId(): string {
    return this.activeStoreId;
  }

  public upsertStore(store: StoreProfile): StoreProfile {
    this.stores.set(store.id, store);
    this.saveStores();
    return store;
  }

  public deleteStore(id: string): boolean {
    if (this.stores.size <= 1) {
      return false; // prevent deleting all stores
    }
    const res = this.stores.delete(id);
    if (this.activeStoreId === id) {
      this.activeStoreId = Array.from(this.stores.keys())[0];
    }
    this.saveStores();
    return res;
  }

  public updateStoreCatalog(storeId: string, items: any[]): StoreProfile | null {
    const store = this.getStore(storeId);
    if (!store) return null;
    store.items = items;
    this.upsertStore(store);
    return store;
  }
}

export const storeRegistry = new StoreRegistryManager();
