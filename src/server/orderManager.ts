import fs from 'fs';
import path from 'path';
import { sendOutboundWhatsAppMessage, cleanPhoneNumber } from './webhookHandler.ts';
import { orderNotifier } from './whatsapp/orderNotifier.ts';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
    size?: string;
    color?: string;
    specialInstructions?: string;
  }>;
  totalEstimated: number;
  currency: string;
  paymentMethod: string;
  status: 'new' | 'in_progress' | 'shipped' | 'completed' | 'cancelled';
  createdAt: number;
  humanTakeover?: boolean;
}

class OrderManager {
  private orders: OrderRecord[] = [];
  private filePath: string;
  private merchantNotifyPhone: string = '201132044823'; // Default Egypt store owner notification number

  constructor() {
    this.filePath = path.resolve(process.cwd(), 'data/orders.json');
    this.merchantNotifyPhone = orderNotifier.getOwnerPhone();
    this.loadOrders();
  }

  private loadOrders() {
    try {
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.orders = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('[OrderManager] Could not load orders.json:', e);
    }

    // Seed with realistic demo orders if empty
    this.orders = [
      {
        id: 'ord_demo_01',
        orderNumber: '#ORD-1092',
        storeId: 'hbb',
        storeName: 'HBB Store',
        customerName: 'أحمد محمود',
        customerPhone: '01001948367',
        deliveryAddress: 'القاهرة - المعادي - شارع 9 عمارة 14 الدور 3',
        items: [
          {
            name: 'هودي أوفر سايز ريفليكتف',
            quantity: 1,
            price: 650,
            size: 'XL',
            specialInstructions: 'معاينة وقياس مع المندوب قبل الدفع',
          },
        ],
        totalEstimated: 650,
        currency: 'EGP',
        paymentMethod: 'الدفع عند الاستلام (معاينة قبل الدفع)',
        status: 'new',
        createdAt: Date.now() - 1000 * 60 * 25, // 25 mins ago
      },
      {
        id: 'ord_demo_02',
        orderNumber: '#ORD-1091',
        storeId: 'hbb',
        storeName: 'HBB Store',
        customerName: 'محمد طارق',
        customerPhone: '01123456789',
        deliveryAddress: 'الجيزة - الدقي - شارع مصدق',
        items: [
          {
            name: 'سنيكرز نايكي دانك لو باندا',
            quantity: 1,
            price: 1250,
            size: '43',
            color: 'أبيض × أسود',
            specialInstructions: 'معاينة وقياس مع المندوب قبل الدفع',
          },
        ],
        totalEstimated: 1250,
        currency: 'EGP',
        paymentMethod: 'الدفع عند الاستلام (معاينة قبل الدفع)',
        status: 'shipped',
        createdAt: Date.now() - 1000 * 60 * 180, // 3 hours ago
      },
    ];
    this.saveOrders();
  }

  private saveOrders() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.orders, null, 2), 'utf-8');
    } catch (e) {
      console.error('[OrderManager] Failed to save orders.json:', e);
    }
  }

  public getOrders(storeId?: string): OrderRecord[] {
    if (storeId) {
      return this.orders.filter((o) => o.storeId === storeId);
    }
    return [...this.orders].sort((a, b) => b.createdAt - a.createdAt);
  }

  public getOrder(id: string): OrderRecord | undefined {
    return this.orders.find((o) => o.id === id);
  }

  public updateOrderStatus(id: string, status: OrderRecord['status']): OrderRecord | null {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    this.saveOrders();
    return order;
  }

  public setMerchantNotifyPhone(phone: string) {
    this.merchantNotifyPhone = cleanPhoneNumber(phone);
  }

  public getMerchantNotifyPhone(): string {
    return this.merchantNotifyPhone;
  }

  /**
   * Resolves the real customer phone number, extracting Egyptian mobile numbers
   * from conversation text/draft when WhatsApp transmits internal device LIDs.
   */
  public extractAccurateCustomerPhone(
    rawPhone: string,
    draftPhone?: string,
    textContext?: string
  ): string {
    const candidates = [draftPhone, textContext, rawPhone].filter(Boolean) as string[];
    for (const text of candidates) {
      // Matches Egyptian mobile prefixes: 010, 011, 012, 015 or international +2010...
      const match = text.match(/(?:\+?20|0)?(1[0125]\d{8})\b/);
      if (match && match[1]) {
        return `20${match[1]}`;
      }
    }

    const clean = cleanPhoneNumber(rawPhone);
    // Discard obvious non-phone WhatsApp LIDs (e.g. 14+ digit IDs starting with 31...)
    if (clean && clean.length > 13 && clean.startsWith('315')) {
      return draftPhone ? cleanPhoneNumber(draftPhone) : clean;
    }
    return clean || '201000000000';
  }

  /**
   * Registers a newly extracted order from AI and triggers WhatsApp alert notification to merchant
   * Features deduplication to prevent duplicate ghost orders when follow-up messages arrive.
   */
  public async createOrderFromDraft(
    draft: any,
    store: any,
    customerPhone: string,
    textContext?: string
  ): Promise<OrderRecord> {
    const resolvedPhone = this.extractAccurateCustomerPhone(
      customerPhone,
      draft.customerPhone || draft.customer_phone || draft.phone || draft.contact_phone,
      textContext || draft.delivery_address || draft.deliveryAddress
    );

    const items = (draft.items || []).map((it: any) => ({
      name: it.name,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      size: it.size || '',
      color: it.color || '',
      specialInstructions: it.specialInstructions || '',
    }));

    // Deduplication check: Suppress duplicate order if placed by same customer within 15 minutes
    const now = Date.now();
    const existingOrderIndex = this.orders.findIndex(
      (o) =>
        o.customerPhone === resolvedPhone &&
        now - o.createdAt < 15 * 60 * 1000 &&
        (o.status === 'new' || o.status === 'in_progress')
    );

    if (existingOrderIndex !== -1) {
      const existing = this.orders[existingOrderIndex];
      console.log(
        `[OrderManager] 🛡️ Duplicate order suppressed for +${resolvedPhone}. Preserving order #${existing.orderNumber}.`
      );
      // Update with newly discovered items or details if any
      if (items.length > 0 && existing.items.length === 0) {
        existing.items = items;
      }
      if (draft.customer_name && existing.customerName === 'عميل واتساب') {
        existing.customerName = draft.customer_name;
      }
      if (draft.delivery_address && existing.deliveryAddress.includes('مسجل هاتفياً')) {
        existing.deliveryAddress = draft.delivery_address;
      }
      this.saveOrders();
      return existing;
    }

    const orderNum = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: OrderRecord = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orderNumber: orderNum,
      storeId: store.id || 'hbb',
      storeName: store.name || 'HBB Store',
      customerName: draft.customer_name || draft.customerName || 'عميل واتساب',
      customerPhone: resolvedPhone,
      deliveryAddress: draft.delivery_address || draft.deliveryAddress || draft.address || 'العنوان مسجل هاتفياً',
      items,
      totalEstimated:
        Number(draft.total_estimated || draft.totalEstimated) ||
        items.reduce((acc: number, cur: any) => acc + cur.price * cur.quantity, 0) ||
        0,
      currency: store.currency || 'EGP',
      paymentMethod: draft.payment_method || draft.paymentMethod || 'الدفع عند الاستلام (معاينة قبل الدفع)',
      status: 'new',
      createdAt: Date.now(),
    };

    this.orders.unshift(newOrder);
    this.saveOrders();

    // Trigger instant WhatsApp alert to merchant personal phone!
    this.sendMerchantNotification(newOrder).catch((err) => {
      console.warn('[OrderManager] Could not send WhatsApp merchant notification:', err.message);
    });

    return newOrder;
  }

  /**
   * Sends the exact formatted alert to the store owner's personal WhatsApp
   * "🚨 طلب جديد محجوز عبر RADDAD AI!
   * 👤 العميل: [الاسم]
   * 📞 رقم العميل: [رقم تليفونه]
   * 📍 العنوان: [العنوان بالتفصيل]
   * 🛒 الطلبات: [تفاصيل المنتجات]
   * 💰 الإجمالي: [السعر بالجنيه المصري]"
   */
  public async sendMerchantNotification(order: OrderRecord) {
    const notifyTarget = this.merchantNotifyPhone || orderNotifier.getOwnerPhone();
    if (!notifyTarget) return;

    const alertMessage = orderNotifier.formatAlertMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      totalEstimated: order.totalEstimated,
      currency: order.currency || 'EGP',
    });

    console.log(`[OrderManager] 🔔 Dispatching WhatsApp notification to owner +${notifyTarget}...`);

    // Dynamically try Baileys first if connected, then fallback to configured WhatsApp gateway
    try {
      const { baileysManager } = await import('./whatsapp/baileysService.ts');
      if (baileysManager.isConnected()) {
        const sent = await baileysManager.sendTextMessage(notifyTarget, alertMessage);
        if (sent) {
          console.log(`[OrderManager] ✅ Delivered via Baileys to store owner +${notifyTarget}`);
          return;
        }
      }
    } catch (e) {
      // Baileys not yet initialized or unavailable
    }

    // Fallback to configured WhatsApp gateway (Green-API / Meta)
    await sendOutboundWhatsAppMessage(notifyTarget, alertMessage, 'green_api');
  }
}

export const orderManager = new OrderManager();
