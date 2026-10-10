/**
 * Store Registry for WhatsApp AI SaaS - HBB Store Single-Store Dedicated Engine
 * 
 * Exclusively manages HBB Store (Youth Streetwear & Sneakers)
 * 100% Egyptian Arabic & EGP Standardization.
 */

import fs from 'fs';
import path from 'path';

export interface StoreItem {
  id: string;
  name: string;
  category: 'clothes' | 'sneakers' | string;
  price: number; // in EGP (جنيه مصري)
  currency?: string;
  sizes: string[];
  colors: string[];
  description: string;
  inStock: boolean;
  sku?: string;
  fabric?: string;
  care?: string;
}

export interface StoreProfile {
  id: string;
  name: string;
  tagline: string;
  category: 'clothing' | 'sneakers' | 'general';
  currency: string; // 'EGP'
  phone: string;
  vodafoneCash?: string;
  instapay?: string;
  location: string;
  workingHours: string;
  prepTime?: string;
  deliveryTimeframeHoursOrDays?: string;
  deliveryZones: { zone: string; fee: number; eta: string }[];
  paymentMethods: string[];
  policy: string;
  systemPrompt?: string;
  whatsappQrRaw?: string | null;
  whatsappQrUrl?: string | null;
  whatsappState?: string;
  items: StoreItem[];
}

export const HBB_STORE_PROFILE: StoreProfile = {
  id: 'hbb',
  name: 'HBB Store',
  tagline: 'متجر HBB الرسمي لملابس الشباب العصرية والكوتشيات السنيكرز',
  category: 'clothing',
  currency: 'EGP',
  phone: '+20 113 204 4823',
  vodafoneCash: '01132044823',
  instapay: 'hbbstore@instapay',
  location: 'مصر - القاهرة والجيزة (شحن سريع ومتاح لجميع المحافظات)',
  workingHours: 'خدمة عملاء وحجز أوردرات 24/7 عبر الذكاء الاصطناعي',
  prepTime: 'تجهيز وشحن فوري خلال 24 - 48 ساعة',
  deliveryZones: [
    { zone: 'القاهرة والجيزة', fee: 45, eta: '24 - 48 ساعة' },
    { zone: 'الإسكندرية والوجه البحري', fee: 55, eta: 'يومين عمل' },
    { zone: 'الصعيد والمحافظات البعيدة', fee: 65, eta: '2 - 3 أيام' },
  ],
  paymentMethods: [
    'الدفع عند الاستلام بعد المعاينة والقياس مع المندوب (Cash on Delivery)',
    'فودافون كاش / إنستاباي (InstaPay)',
  ],
  policy: 'المعاينة والقياس متاحة ومجانية مع مندوب الشحن قبل دفع أي مليم، وضمان استبدال واسترجاع لمدة 14 يوماً.',
  systemPrompt: `أنت المساعد البيعي الذكي والرسمي لمتجر HBB Store على واتساب.
تتحدث بالعامية المصرية الودودة، الراقية، والشاطرة في البيع.
جميع الأسعار بالجنيه المصري (EGP).
تقرأ المنتجات والموديلات والأسعار من ملف products.json مباشرة وتؤكد على ميزة المعاينة والقياس قبل الدفع.`,
  items: [
    {
      id: 'prod_hoodie_01',
      name: 'هودي أوفر سايز ريفليكتف (Reflective Oversized Hoodie)',
      category: 'clothes',
      price: 650,
      currency: 'EGP',
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['أسود فاحم', 'رمادي ميلتون', 'بيج ترابي'],
      description: 'قطن ميلتون مصري تقيل مبطن بوبرة داخلية ناعمة، طباعة عاكسة للضوء على الظهر، قصة أوفر سايز مريحة جداً.',
      inStock: true,
    },
    {
      id: 'prod_tshirt_01',
      name: 'تيشيرت أوفر سايز أسيد واش (Acid Wash Vintage T-Shirt)',
      category: 'clothes',
      price: 380,
      currency: 'EGP',
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['أسود مغسول Acid Black', 'زيتي مغسول Vintage Olive'],
      description: 'قطن 100% سينجل جيرسي معالجة أسيد واش عصرية، لياقة دائرية محكمة وتقفيل دبل درزة ستريت وير.',
      inStock: true,
    },
    {
      id: 'prod_cargo_01',
      name: 'بنطلون كارغو 6 جيوب ووتر بروف (Street Cargo Pants)',
      category: 'clothes',
      price: 550,
      currency: 'EGP',
      sizes: ['30', '32', '34', '36', '38'],
      colors: ['أسود مط', 'زيتي جيشي', 'بيج كارجو'],
      description: 'خامة جبردين ووتر بروف معالجة ضد الماء والأتربة، 6 جيوب عملية مع أربطة تضييق من الأسفل لستايل جوجر.',
      inStock: true,
    },
    {
      id: 'prod_snk_panda',
      name: 'سنيكرز نايكي دانك لو باندا (Nike Dunk Low Retro Panda)',
      category: 'sneakers',
      price: 1250,
      currency: 'EGP',
      sizes: ['41', '42', '43', '44', '45'],
      colors: ['أبيض × أسود (Panda)'],
      description: 'ماستر كواليتي هاي إند مع الصندوق الأصلي، جلد طبيعي معالج، نعل مريح مانع للانزلاق، أنسب كوتشي كاجوال شبابي.',
      inStock: true,
    },
    {
      id: 'prod_snk_nb530',
      name: 'سنيكرز نيو بالانس 530 (New Balance 530 Silver / White)',
      category: 'sneakers',
      price: 1350,
      currency: 'EGP',
      sizes: ['41', '42', '43', '44', '45'],
      colors: ['فضي ميتاليك × أبيض', 'أبيض × أزرق كحلي'],
      description: 'أخف وأريح سنيكرز للمشي والجامعة والجيم بنظام التوسيد ABZORB، تصميم شبكي جيد التهوية مع تفاصيل عاكسة.',
      inStock: true,
    },
    {
      id: 'prod_snk_campus',
      name: 'سنيكرز أديداس كامبوس 00s (Adidas Campus 00s Suede)',
      category: 'sneakers',
      price: 1200,
      currency: 'EGP',
      sizes: ['41', '42', '43', '44', '45'],
      colors: ['أسود فحم × خطوط بيضاء', 'رمادي شمواه', 'كحلي داكن'],
      description: 'شمواه طبيعي فاخر، أربطة عريضة Fat Laces بتصميم التسعينات الأيقوني، بطانة كاحل مريحة جداً.',
      inStock: true,
    },
    {
      id: 'prod_snk_jordan1',
      name: 'سنيكرز إير جوردان 1 هاي (Air Jordan 1 High OG)',
      category: 'sneakers',
      price: 1450,
      currency: 'EGP',
      sizes: ['41', '42', '43', '44', '45'],
      colors: ['شيكاغو أحمر × أبيض × أسود', 'شادو رمادي × أسود'],
      description: 'التصميم الرياضي الأسطوري للشباب، رقبة عالية مبطنة تدعم الكاحل، وسادة هوائية Air-Sole مريحة طوال اليوم.',
      inStock: true,
    },
  ],
};

export const MASTER_SNEAKERS_SYSTEM_PROMPT = `
أنت المساعد البيعي الذكي والرسمي لمتجر HBB Store على واتساب (+20 113 204 4823).
جميع الأسعار بالجنيه المصري (EGP).
المعاينة والقياس متاحة ومجانية مع المندوب قبل دفع أي مليم.
`.trim();

class StoreRegistry {
  private stores: StoreProfile[] = [HBB_STORE_PROFILE];
  private activeStoreId: string = 'hbb';
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
          this.stores = parsed;
          const hasActive = this.stores.some((s) => s.id === this.activeStoreId);
          if (!hasActive && this.stores[0]) {
            this.activeStoreId = this.stores[0].id;
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[StoreRegistry] Could not load stores-registry.json, using default HBB Store:', err);
    }

    // Default: Initial HBB Store
    this.stores = [HBB_STORE_PROFILE];
    this.activeStoreId = 'hbb';
    this.saveStores();
  }

  public saveStores() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.stores, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StoreRegistry] Failed to save stores-registry.json:', err);
    }
  }

  public getAllStores(): StoreProfile[] {
    return this.stores;
  }

  public getStore(id: string = 'hbb'): StoreProfile {
    const found = this.stores.find((s) => s.id === id);
    return found || this.stores[0] || HBB_STORE_PROFILE;
  }

  public getActiveStore(): StoreProfile {
    return this.getStore(this.activeStoreId);
  }

  public getActiveStoreId(): string {
    return this.activeStoreId;
  }

  public setActiveStoreId(id: string): boolean {
    const exists = this.stores.some((s) => s.id === id);
    if (exists) {
      this.activeStoreId = id;
      return true;
    }
    return false;
  }

  public upsertStore(store: StoreProfile): StoreProfile {
    store.currency = store.currency || 'EGP';
    const index = this.stores.findIndex((s) => s.id === store.id);
    if (index !== -1) {
      this.stores[index] = { ...this.stores[index], ...store };
    } else {
      this.stores.push(store);
    }
    this.saveStores();
    return store;
  }

  public deleteStore(id: string): boolean {
    if (id === 'hbb' && this.stores.length === 1) {
      return false; // Retain at least one store
    }
    const lenBefore = this.stores.length;
    this.stores = this.stores.filter((s) => s.id !== id);
    if (this.activeStoreId === id && this.stores[0]) {
      this.activeStoreId = this.stores[0].id;
    }
    this.saveStores();
    return this.stores.length < lenBefore;
  }

  public updateStoreCatalog(id: string, items: StoreItem[]): StoreProfile {
    const store = this.getStore(id);
    store.items = items;
    this.saveStores();
    return store;
  }

  public updateStoreDelivery(
    id: string,
    delivery: {
      deliveryTimeframeHoursOrDays?: string;
      prepTime?: string;
      deliveryZones?: { zone: string; fee: number; eta: string }[];
    }
  ): StoreProfile {
    const store = this.getStore(id);
    if (delivery.deliveryTimeframeHoursOrDays) {
      store.prepTime = delivery.deliveryTimeframeHoursOrDays;
    }
    if (delivery.prepTime) {
      store.prepTime = delivery.prepTime;
    }
    if (delivery.deliveryZones) {
      store.deliveryZones = delivery.deliveryZones;
    }
    this.saveStores();
    return store;
  }
}

export const storeRegistry = new StoreRegistry();
