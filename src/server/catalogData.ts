/**
 * HBB Store Product Catalogs & Profiles (Single-Store Dedicated Engine)
 * 100% Egyptian Arabic & EGP Standardization.
 */

import { storeRegistry, type StoreProfile, type StoreItem } from './storeRegistry.ts';

export type ClothingItem = StoreItem;

export interface BusinessProfile {
  id: string;
  type: 'clothing' | 'sneakers';
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
  items: StoreItem[];
}

export function getBusinessProfile(_businessType?: string, _storeId?: string): BusinessProfile {
  const store = storeRegistry.getStore('hbb');
  return {
    id: store.id,
    type: 'clothing',
    name: store.name,
    tagline: store.tagline,
    location: store.location,
    deliveryZones: store.deliveryZones,
    workingHours: store.workingHours,
    paymentMethods: store.paymentMethods,
    phone: store.phone,
    vodafoneCash: store.vodafoneCash || '01132044823',
    policy: store.policy,
    systemPrompt: store.systemPrompt,
    items: store.items,
  };
}

export function updateClothingProfile(updates: Partial<StoreProfile>) {
  const current = storeRegistry.getStore('hbb');
  return storeRegistry.upsertStore({ ...current, ...updates });
}

export function importAiCatalogItems(items: any[], _mode?: string) {
  const current = storeRegistry.getStore('hbb');
  current.items = items;
  return storeRegistry.upsertStore(current);
}
