import fs from 'fs';
import path from 'path';
import { cleanPhoneNumber } from '../webhookHandler.ts';

export interface OrderNotificationPayload {
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
    size?: string;
    color?: string;
  }>;
  totalEstimated: number;
  currency?: string;
}

class OrderNotifier {
  private configPath: string;
  private defaultOwnerPhone: string = '201132044823'; // Default Egypt owner phone

  constructor() {
    this.configPath = path.resolve(process.cwd(), 'data/whatsapp-config.json');
  }

  public getOwnerPhone(): string {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.ownerPhone) {
          return cleanPhoneNumber(parsed.ownerPhone);
        }
      }
    } catch (e) {
      // ignore
    }
    return this.defaultOwnerPhone;
  }

  public setOwnerPhone(phone: string): boolean {
    const clean = cleanPhoneNumber(phone);
    if (!clean) return false;
    try {
      let cfg: Record<string, any> = {};
      if (fs.existsSync(this.configPath)) {
        cfg = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      }
      cfg.ownerPhone = clean;
      fs.writeFileSync(this.configPath, JSON.stringify(cfg, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('[OrderNotifier] Failed to persist owner phone:', e);
      return false;
    }
  }

  /**
   * Formats the exact notification message required by the user:
   * 🚨 طلب جديد محجوز عبر RADDAD AI!
   * 👤 العميل: [الاسم]
   * 📞 رقم العميل: [رقم تليفونه]
   * 📍 العنوان: [العنوان بالتفصيل]
   * 🛒 الطلبات: [تفاصيل المنتجات]
   * 💰 الإجمالي: [السعر بالجنيه المصري]
   */
  public formatAlertMessage(order: OrderNotificationPayload): string {
    const itemsFormatted = order.items
      .map((it) => {
        let details = `• ${it.name} (عدد ${it.quantity})`;
        if (it.size) details += ` | مقاس: ${it.size}`;
        if (it.color) details += ` | لون: ${it.color}`;
        if (it.price) details += ` | سعر: ${it.price} ج.م`;
        return details;
      })
      .join('\n');

    const totalStr = `${Math.round(order.totalEstimated)} جنيه مصري`;

    return `🚨 طلب جديد محجوز عبر RADDAD AI!
👤 العميل: ${order.customerName || 'عميل واتساب'}
📞 رقم العميل: ${order.customerPhone ? `+${order.customerPhone}` : 'غير محدد'}
📍 العنوان: ${order.deliveryAddress || 'العنوان مؤكد هاتفياً'}
🛒 الطلبات:
${itemsFormatted || '• منتجات حسب الاتفاق في المحادثة'}
💰 الإجمالي: ${totalStr}`;
  }

  /**
   * Sends alert to store owner via Baileys socket or registered dispatcher
   */
  public async notifyStoreOwner(
    order: OrderNotificationPayload,
    sendFn?: (toPhone: string, text: string) => Promise<boolean>
  ): Promise<boolean> {
    const ownerPhone = this.getOwnerPhone();
    const alertText = this.formatAlertMessage(order);

    console.log(`[OrderNotifier] 🚀 Dispatching order alert to store owner: +${ownerPhone}`);
    console.log(alertText);

    if (sendFn) {
      try {
        const success = await sendFn(ownerPhone, alertText);
        if (success) {
          console.log(`[OrderNotifier] ✅ Notification sent successfully to store owner +${ownerPhone}`);
          return true;
        }
      } catch (err: any) {
        console.warn(`[OrderNotifier] Dispatch failed:`, err?.message || err);
      }
    }

    return false;
  }
}

export const orderNotifier = new OrderNotifier();
