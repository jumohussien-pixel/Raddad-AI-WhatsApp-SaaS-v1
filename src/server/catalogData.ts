/**
 * Egyptian SMBs Product Catalogs
 * Realistic menus and inventories tailored for Egyptian clothing stores and restaurants.
 */

import fs from 'fs';
import path from 'path';
import { storeRegistry, StoreProfile } from './storeRegistry.js';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number; // in USD ($)
  description: string;
  portionSizes?: { size: 'Single' | 'Combo' | 'Family' | string; price: number }[];
  addOns?: { name: string; price: number }[];
  prepTime?: string; // e.g. "20-30 mins"
  availableSizes?: string[];
  popular?: boolean;
  imageUrl?: string;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  inStock?: boolean;
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
  soleMaterial?: string;
  upperMaterial?: string;
  inStock: boolean;
}

export interface BusinessProfile {
  id: string;
  type: 'restaurant' | 'clothing' | 'sneakers';
  name: string;
  tagline: string;
  location: string;
  deliveryZones: { zone: string; fee: number; eta: string }[];
  workingHours: string;
  paymentMethods: string[];
  phone: string;
  vodafoneCash: string;
  policy?: string;
  systemPrompt?: string;
  items: (MenuItem | ClothingItem)[];
}

export const RESTAURANT_PROFILE: BusinessProfile = {
  id: 'restaurant_01',
  type: 'restaurant',
  name: 'Bella Roma Pizza & Pastas',
  tagline: 'Artisan stone-oven pizzas, smash burgers, and fresh pastas',
  location: 'Metropolitan Area & Suburbs (Fast Courier Delivery)',
  workingHours: 'Daily from 11:00 AM to 02:00 AM',
  deliveryZones: [
    { zone: 'City Center', fee: 5, eta: '25-35 minutes' },
    { zone: 'Suburbs', fee: 8, eta: '35-45 minutes' },
    { zone: 'Extended Metropolitan', fee: 12, eta: '45-60 minutes' },
  ],
  paymentMethods: ['Cash on Delivery (COD)', 'Credit Card / Visa via Stripe', 'PayPal & Apple Pay'],
  phone: '+1 555 100 0001',
  vodafoneCash: '+1 555 100 0001',
  items: [
    {
      id: 'piz_01',
      name: 'Pepperoni Supreme Stuffed Crust Pizza',
      category: 'Pizzas',
      price: 14.99,
      description: 'Artisan stone-oven pizza with melted mozzarella stuffed crust, herb tomato sauce, premium pepperoni, and parmesan.',
      portionSizes: [
        { size: 'Single (Medium 11")', price: 14.99 },
        { size: 'Combo (+ Cheesy Fries & Drink)', price: 19.99 },
        { size: 'Family (Large 14" Party Box)', price: 28.99 },
      ],
      addOns: [
        { name: 'Extra Mozzarella Crust', price: 2.99 },
        { name: 'Spicy Jalapeno Slices', price: 1.49 },
      ],
      popular: true,
      inStock: true,
    },
    {
      id: 'brg_01',
      name: 'Double Smash Angus Bacon Cheeseburger',
      category: 'Burgers',
      price: 13.99,
      description: 'Two smashed Angus beef patties, sharp cheddar, smoked bacon, secret sauce, on toasted brioche.',
      portionSizes: [
        { size: 'Single Sandwich', price: 13.99 },
        { size: 'Combo (+ Fries & Drink)', price: 17.99 },
      ],
      popular: true,
      inStock: true,
    },
  ],
};

export let CLOTHING_PROFILE: BusinessProfile = {
  id: 'clothing_01',
  type: 'clothing',
  name: 'Modern Style Fashion',
  tagline: 'Latest trends in premium streetwear & casual fashion made of 100% fine cotton',
  location: 'Flagship Store: Fashion District, Downtown (With fast worldwide shipping)',
  workingHours: 'Daily from 10:00 AM to 11:00 PM',
  deliveryZones: [
    { zone: 'Standard Domestic Delivery', fee: 10, eta: '24 to 48 business hours' },
    { zone: 'Express Courier Delivery', fee: 15, eta: 'Same-day or next-day delivery' },
    { zone: 'International Worldwide Shipping', fee: 30, eta: '3 to 5 business days' },
  ],
  paymentMethods: [
    'Cash on Delivery (COD) with try-before-buy inspection rights',
    'Credit Card & Debit Card (Visa / Mastercard / Stripe)',
    'PayPal & Apple Pay',
  ],
  phone: '+1 555 100 0004',
  vodafoneCash: '+1 555 100 0004',
  policy: 'Inspection and sizing try-on are fully permitted with the delivery agent before making any payment. Free 14-day exchange or refund guarantee.',
  items: [
    {
      id: 'cloth_01',
      name: 'Pure Egyptian Cotton Oversized Tee',
      category: 'T-Shirts',
      price: 25.99,
      sizes: ['M (120-150 lbs)', 'L (150-175 lbs)', 'XL (175-200 lbs)', 'XXL (200-230 lbs)', '3XL (230-260 lbs)'],
      colors: ['Emerald Green', 'Carbon Black', 'Pure White', 'Desert Beige', 'Military Olive', 'Navy Blue'],
      description: '100% pure premium Egyptian cotton, heavy weight (240 GSM), pre-shrunk and treated against pilling. Perfect modern oversized fit with a relaxed street silhouette.',
      fabric: '100% Pure Egyptian Cotton, 240 GSM Heavyweight Pre-shrunk',
      care: 'Machine wash cold 30°C inside out, do not bleach, iron at medium heat from inside, dry in shade.',
      inStock: true,
    },
    {
      id: 'cloth_02',
      name: 'Casual Cool-Feel Linen Shirt',
      category: 'Shirts',
      price: 29.99,
      sizes: ['M (120-150 lbs)', 'L (150-175 lbs)', 'XL (175-200 lbs)', 'XXL (200-230 lbs)', '3XL (230-260 lbs)'],
      colors: ['Mint Green', 'Pure White', 'Sky Blue', 'Sandy Beige', 'Olive Green'],
      description: '100% organic natural linen, ultra-breathable and lightweight. Tailored for comfort in warm climates with a casual relaxed collar.',
      fabric: '100% Natural Organic Linen',
      care: 'Hand wash or delicate cycle with cold water, dry flat in shade, steam iron.',
      inStock: true,
    },
    {
      id: 'cloth_03',
      name: 'Casual Street-Style 6-Pocket Cargo Pants',
      category: 'Pants',
      price: 34.99,
      sizes: ['30', '32', '34', '36', '38', '40'],
      colors: ['Military Olive', 'Khaki Beige', 'Carbon Black', 'Dark Grey'],
      description: 'Heavyweight imported cotton gabardine fabric. Spacious utility side cargo pockets with durable double-needle stitching.',
      fabric: '98% Cotton Gabardine, 2% Lycra for stretch and durability',
      care: 'Wash inside out with cold water, iron at medium heat.',
      inStock: true,
    },
  ],
};

// Try loading persistent clothing profile from disk if exists
try {
  const profilePath = path.resolve(process.cwd(), 'data/clothing-profile.json');
  if (fs.existsSync(profilePath)) {
    const raw = fs.readFileSync(profilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
      CLOTHING_PROFILE = parsed;
    }
  }
} catch (e) {
  console.log('[CatalogData] Loaded default clothing profile');
}

export function importAiCatalogItems(newItems: ClothingItem[], mode: 'merge' | 'replace' = 'merge'): BusinessProfile {
  if (mode === 'replace') {
    CLOTHING_PROFILE.items = newItems;
  } else {
    // Merge: add new items, avoid duplicate IDs
    const existingIds = new Set(CLOTHING_PROFILE.items.map((i) => i.id));
    for (const item of newItems) {
      if (!existingIds.has(item.id)) {
        CLOTHING_PROFILE.items.push(item);
        existingIds.add(item.id);
      } else {
        // update existing
        const idx = CLOTHING_PROFILE.items.findIndex((i) => i.id === item.id);
        if (idx !== -1) CLOTHING_PROFILE.items[idx] = item;
      }
    }
  }

  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const profilePath = path.resolve(dataDir, 'clothing-profile.json');
    fs.writeFileSync(profilePath, JSON.stringify(CLOTHING_PROFILE, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CatalogData] Failed to persist imported catalog items:', err);
  }

  return CLOTHING_PROFILE;
}

export function updateClothingProfile(newProfile: Partial<BusinessProfile>): BusinessProfile {
  CLOTHING_PROFILE = {
    ...CLOTHING_PROFILE,
    ...newProfile,
    items: newProfile.items || CLOTHING_PROFILE.items,
  };

  try {
    const profilePath = path.resolve(process.cwd(), 'data/clothing-profile.json');
    fs.writeFileSync(profilePath, JSON.stringify(CLOTHING_PROFILE, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CatalogData] Failed to persist clothing profile:', err);
  }

  return CLOTHING_PROFILE;
}

export function getBusinessProfile(
  businessType: 'restaurant' | 'clothing' | 'sneakers' = 'clothing',
  storeId?: string
): BusinessProfile {
  // If a specific store is requested or if active store exists
  const targetStore = storeId ? storeRegistry.getStore(storeId) : storeRegistry.getActiveStore();
  if (targetStore) {
    const mappedType: 'restaurant' | 'clothing' | 'sneakers' =
      targetStore.category === 'restaurant'
        ? 'restaurant'
        : targetStore.category === 'sneakers'
          ? 'sneakers'
          : 'clothing';

    return {
      id: targetStore.id,
      type: mappedType,
      name: targetStore.name,
      tagline: targetStore.tagline,
      location: targetStore.location,
      deliveryZones: targetStore.deliveryZones,
      workingHours: targetStore.workingHours,
      paymentMethods: targetStore.paymentMethods,
      phone: targetStore.phone,
      vodafoneCash: targetStore.vodafoneCash || targetStore.phone,
      policy: targetStore.policy,
      systemPrompt: targetStore.systemPrompt,
      items: targetStore.items,
    };
  }

  if (businessType === 'restaurant') {
    return RESTAURANT_PROFILE;
  }

  return CLOTHING_PROFILE;
}
