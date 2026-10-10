/**
 * Client Onboarding Engine for WhatsApp AI SaaS
 * 
 * Supports:
 * 1. Store Name & Niche/Category (Apparel, Footwear, Electronics, etc.)
 * 2. Store Owner's Mobile Number for instant 🚨 Order Alert dispatch.
 * 3. Catalog Data Source: Local JSON file OR syncable Google Sheets (CSV Export / API).
 * 4. Monthly SaaS Subscription Lifecycle Management (Active, Trial, Past Due, Renewal).
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { cleanPhoneNumber } from '../webhookHandler.ts';

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price: number; // In Egyptian Pounds (EGP / جنيه مصري)
  currency: string; // 'EGP'
  sizes: string[];
  colors: string[];
  description: string;
  inStock: boolean;
  sku?: string;
}

export interface ClientOnboardingRecord {
  id: string;
  storeName: string;
  category: 'clothing' | 'sneakers' | 'electronics' | 'general' | 'perfumes';
  ownerPhone: string;
  catalogSource: {
    type: 'json_file' | 'google_sheet' | 'direct_json';
    filePath?: string;
    googleSheetUrl?: string;
    lastSyncedAt?: number;
    syncedItemCount?: number;
  };
  subscription: {
    planName: 'starter' | 'pro' | 'scale';
    monthlyFeeEgp: number; // e.g. 1500 EGP / month
    status: 'active' | 'trial' | 'past_due' | 'cancelled';
    startDate: string;
    renewalDate: string;
    notes?: string;
  };
  baileysSessionDir: string;
  createdAt: number;
}

class ClientOnboardingManager {
  private filePath: string;
  private clients: ClientOnboardingRecord[] = [];

  constructor() {
    this.filePath = path.resolve(process.cwd(), 'data/onboarded-clients.json');
    this.loadClients();
  }

  private loadClients() {
    try {
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.clients = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('[OnboardingManager] Could not read onboarded-clients.json:', e);
    }

    // Default seed: HBB Store as primary active tenant
    const now = new Date();
    const renewal = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.clients = [
      {
        id: 'hbb',
        storeName: 'HBB Store',
        category: 'clothing',
        ownerPhone: '201132044823',
        catalogSource: {
          type: 'json_file',
          filePath: 'data/products.json',
          lastSyncedAt: Date.now(),
          syncedItemCount: 7,
        },
        subscription: {
          planName: 'pro',
          monthlyFeeEgp: 1800,
          status: 'active',
          startDate: now.toISOString().split('T')[0],
          renewalDate: renewal.toISOString().split('T')[0],
          notes: 'الباقة الاحترافية - حجز وتأكيد أوردرات 24/7 عبر Baileys وفهم الفويس نوتس',
        },
        baileysSessionDir: 'data/baileys_auth',
        createdAt: Date.now(),
      },
    ];
    this.saveClients();
  }

  public saveClients() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.clients, null, 2), 'utf-8');
    } catch (e) {
      console.error('[OnboardingManager] Failed to save onboarded-clients.json:', e);
    }
  }

  public getClients(): ClientOnboardingRecord[] {
    return this.clients;
  }

  public getClient(id: string): ClientOnboardingRecord | undefined {
    return this.clients.find((c) => c.id === id);
  }

  /**
   * Registers a new SaaS client with isolated credentials and catalog binding
   */
  public async registerClient(data: {
    storeName: string;
    category?: ClientOnboardingRecord['category'];
    ownerPhone: string;
    catalogSourceType: 'json_file' | 'google_sheet' | 'direct_json';
    googleSheetUrl?: string;
    monthlyFeeEgp?: number;
    initialProducts?: CatalogItem[];
  }): Promise<ClientOnboardingRecord> {
    const slug = data.storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 20) || `store_${Date.now()}`;

    const storeId = `${slug}_${Math.random().toString(36).slice(2, 6)}`;
    const cleanPhone = cleanPhoneNumber(data.ownerPhone);

    const now = new Date();
    const renewal = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sessionDir = path.resolve(process.cwd(), `data/baileys_auth/${storeId}`);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    let syncedCount = 0;

    // Handle catalog ingestion
    if (data.catalogSourceType === 'google_sheet' && data.googleSheetUrl) {
      const synced = await this.syncFromGoogleSheet(data.googleSheetUrl);
      syncedCount = synced.length;
    } else if (data.initialProducts && data.initialProducts.length > 0) {
      syncedCount = data.initialProducts.length;
    }

    const newRecord: ClientOnboardingRecord = {
      id: storeId,
      storeName: data.storeName,
      category: data.category || 'clothing',
      ownerPhone: cleanPhone,
      catalogSource: {
        type: data.catalogSourceType,
        filePath: `data/tenants/${storeId}/products.json`,
        googleSheetUrl: data.googleSheetUrl,
        lastSyncedAt: Date.now(),
        syncedItemCount: syncedCount,
      },
      subscription: {
        planName: 'pro',
        monthlyFeeEgp: data.monthlyFeeEgp || 1500,
        status: 'trial',
        startDate: now.toISOString().split('T')[0],
        renewalDate: renewal.toISOString().split('T')[0],
        notes: 'فترة تجريبية 14 يوماً قبل بدء دورة الفوترة الشهرية',
      },
      baileysSessionDir: sessionDir,
      createdAt: Date.now(),
    };

    this.clients.unshift(newRecord);
    this.saveClients();
    return newRecord;
  }

  /**
   * Syncs products from any publicly shareable Google Sheets spreadsheet link
   * Converts CSV rows to structured products with Egyptian EGP pricing
   */
  public async syncFromGoogleSheet(url: string): Promise<CatalogItem[]> {
    try {
      // Format Google Sheet URL to direct CSV export
      let csvUrl = url;
      if (url.includes('/edit')) {
        csvUrl = url.replace(/\/edit.*$/, '/export?format=csv');
      } else if (!url.includes('format=csv')) {
        csvUrl = url.includes('?') ? `${url}&format=csv` : `${url}?format=csv`;
      }

      console.log(`[OnboardingManager] 📊 Fetching Google Sheets CSV from: ${csvUrl}`);
      const res = await axios.get(csvUrl, { timeout: 10000 });
      const csvText = String(res.data);

      return this.parseCsvToProducts(csvText);
    } catch (err: any) {
      console.warn('[OnboardingManager] Google Sheets sync failed:', err.message);
      return [];
    }
  }

  /**
   * Parses CSV rows from Google Sheets into verified CatalogItems
   */
  public parseCsvToProducts(csvText: string): CatalogItem[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const items: CatalogItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Split by comma ignoring commas inside quotes
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());
      if (row.length < 2) continue;

      const name = row[0] || `منتج رقم ${i}`;
      const priceRaw = parseFloat(row[1]?.replace(/[^0-9.]/g, '')) || 250;
      const category = row[2] || 'ملابس شبابي';
      const sizesRaw = row[3] ? row[3].split(/[/,-]/).map((s) => s.trim()) : ['M', 'L', 'XL'];
      const colorsRaw = row[4] ? row[4].split(/[/,-]/).map((c) => c.trim()) : ['أسود'];
      const desc = row[5] || 'خامة ممتازة متوفرة للمعاينة قبل الاستلام';

      items.push({
        id: `prod_sheet_${i}`,
        name,
        category: category.toLowerCase().includes('كوتش') || category.toLowerCase().includes('سنيكر') ? 'sneakers' : 'clothes',
        price: Math.round(priceRaw),
        currency: 'EGP',
        sizes: sizesRaw,
        colors: colorsRaw,
        description: desc,
        inStock: true,
      });
    }

    return items;
  }
}

export const clientOnboarding = new ClientOnboardingManager();
