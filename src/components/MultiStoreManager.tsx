/**
 * Multi-Store Manager & Multi-Tenant Architecture Controller
 * 
 * Features:
 * - Enterprise Multi-Tenant Architecture across Restaurants & Retail stores.
 * - Dedicated per-store Webhook URL and phone number bindings.
 * - 1-Click Store Switcher, Edit Store modal (change phone number, name, policies).
 * - Live Production WhatsApp Callout: +20 113 204 4823 (wa.me direct link).
 * - Architectural explanation of local simulation vs production webhook routing.
 * - 100% English Executive UI designed for SaaS marketplace sales (Acquire.com, Flippa).
 */

import React, { useState, useEffect } from 'react';
import {
  Store,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  Smartphone,
  Webhook,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info,
  Footprints,
  Shirt,
  Utensils,
  Clock,
  MapPin,
  CheckCircle2,
  X,
} from 'lucide-react';
import { StoreProfile } from '../types';

interface MultiStoreManagerProps {
  onStoreSwitched?: (store: StoreProfile) => void;
}

export const MultiStoreManager: React.FC<MultiStoreManagerProps> = ({ onStoreSwitched }) => {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('hbb');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedWebhookId, setCopiedWebhookId] = useState<string | null>(null);
  const [sneakersPrompt, setSneakersPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<Partial<StoreProfile> | null>(null);
  const [customPhone, setCustomPhone] = useState<string>('');
  const [savingPhone, setSavingPhone] = useState<boolean>(false);
  const [phoneSuccess, setPhoneSuccess] = useState<string>('');

  const PRIMARY_LIVE_PHONE = '+20 113 204 4823';
  const PRIMARY_LIVE_RAW = '201132044823';

  // Fetch stores from backend
  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
        if (data.activeStoreId) {
          setActiveStoreId(data.activeStoreId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick-assign custom phone to active store
  const handleQuickAssignPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone.trim()) return;
    setSavingPhone(true);
    try {
      const res = await fetch('/api/stores/my-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
        setPhoneSuccess(`Phone number updated successfully to: ${customPhone}! 📱✨`);
        setTimeout(() => setPhoneSuccess(''), 4500);
        if (onStoreSwitched && data.activeStore) {
          onStoreSwitched(data.activeStore);
        }
      }
    } catch (err) {
      console.error('Failed to save phone:', err);
    } finally {
      setSavingPhone(false);
    }
  };

  // Fetch sneakers master prompt
  const fetchSneakersPrompt = async () => {
    try {
      const res = await fetch('/api/stores/sneakers-prompt');
      if (res.ok) {
        const data = await res.json();
        setSneakersPrompt(data.prompt || '');
      }
    } catch (err) {
      console.error('Failed to fetch prompt:', err);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchSneakersPrompt();
  }, []);

  // Switch Active Store
  const handleSwitchStore = async (storeId: string) => {
    try {
      const res = await fetch('/api/stores/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveStoreId(data.activeStoreId);
        if (onStoreSwitched && data.activeStore) {
          onStoreSwitched(data.activeStore);
        }
      }
    } catch (err) {
      console.error('Failed to activate store:', err);
    }
  };

  // Copy Sneakers Master Prompt
  const handleCopyPrompt = () => {
    if (!sneakersPrompt) return;
    navigator.clipboard.writeText(sneakersPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // Copy dedicated webhook URL
  const handleCopyWebhook = (storeId: string) => {
    const origin = window.location.origin;
    const url = `${origin}/webhook/${storeId}`;
    navigator.clipboard.writeText(url);
    setCopiedWebhookId(storeId);
    setTimeout(() => setCopiedWebhookId(null), 2500);
  };

  // Save or update store
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore?.id || !editingStore?.name) {
      alert('Please enter Store ID and Store Name');
      return;
    }

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingStore,
          items: editingStore.items || [],
          deliveryZones: editingStore.deliveryZones || [
            { zone: 'Cairo & Giza Metro', fee: 40, eta: '24 to 48 hours' },
            { zone: 'Alexandria & Delta', fee: 50, eta: '2 to 3 business days' },
          ],
          paymentMethods: editingStore.paymentMethods || [
            'Cash on Delivery after inspection',
            'Vodafone Cash Mobile Wallet',
            'InstaPay Instant Transfer',
          ],
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        setEditingStore(null);
        await fetchStores();
      }
    } catch (err) {
      console.error('Failed to save store:', err);
    }
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  return (
    <div className="space-y-8" dir="ltr">
      {/* Top Banner & Multi-Store Introduction */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 rounded-2xl p-6 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Multi-Tenant Architecture</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono">
                Restaurants (F&B) • Footwear • Apparel
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Multi-Store Independent Tenants & Dedicated Webhooks
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every store operates as an isolated tenant with its own dedicated WhatsApp number, custom product/menu catalog, specialized sales prompt, and distinct webhook endpoint.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingStore({
                  id: `store_${Date.now().toString().slice(-4)}`,
                  name: '',
                  tagline: 'Gourmet Dining or Premium Retail',
                  category: 'restaurant',
                  phone: '+20 100 000 0006',
                  location: 'Metropolitan Area & Suburbs (Fast Delivery)',
                  workingHours: 'Daily 11:00 AM - 02:00 AM',
                  policy: '100% Satisfaction Guarantee with Inspect-Before-Pay inspection.',
                  items: [],
                });
                setIsEditing(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Store</span>
            </button>

            <button
              onClick={handleCopyPrompt}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-medium text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {copiedPrompt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPrompt ? 'Prompt Copied!' : 'Copy Sneakers Prompt'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Production WhatsApp Demo Callout Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 rounded-2xl p-5 border border-emerald-500/40 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <h3 className="text-sm font-bold text-white">
                Live Production WhatsApp Number: <span className="font-mono text-emerald-400">{PRIMARY_LIVE_PHONE}</span>
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              This is the live configured production number for the SaaS demo. Anyone sending a message to this number on WhatsApp will receive real-time autonomous AI sales responses.
            </p>
          </div>
        </div>

        <a
          href={`https://wa.me/${PRIMARY_LIVE_RAW}?text=Hi%2C%20I%20would%20like%20to%20test%20the%20autonomous%20WhatsApp%20AI%20sales%20agent%21`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all shrink-0 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Test Live On WhatsApp ({PRIMARY_LIVE_PHONE})</span>
        </a>
      </div>

      {/* Architectural Guide: Dedicated Webhooks & Simulation vs Production */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Info className="w-5 h-5 text-emerald-400" />
          <span>How Multi-Store Webhooks & Simulation Work (Architecture Explained)</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          In production WhatsApp integrations (via <strong className="text-emerald-300">Meta Cloud API</strong> or <strong className="text-emerald-300">Green API</strong>), each WhatsApp number corresponds to an independent provider instance.
          Our backend routes each incoming webhook to its respective tenant without cross-talk:
        </p>

        {/* Visual Architecture Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Single Dedicated Tenant: HBB Store */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-emerald-500/30 relative col-span-full">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                <Shirt className="w-4 h-4 text-emerald-400" />
                HBB Store (Youth Streetwear & Sneakers)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                Active Production Store
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Configured Phone: <strong className="font-mono text-emerald-300">{PRIMARY_LIVE_PHONE}</strong></span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg font-mono text-[11px] text-emerald-300 break-all select-all">
                {currentDomain}/webhook/hbb
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                المتجر النشط الوحيد: هوديز أوفر سايز، تيشيرتات أسيد واش، بناطيل كارغو، وسنيكرز ماستر كواليتي بأسعار الجنيه المصري حصراً (EGP).
              </p>
            </div>
          </div>
        </div>

        {/* 3 Step Architecture Instructions */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </span>
            <div>
              <strong className="text-white block mb-0.5">Instance per Phone Number:</strong>
              In Meta Business Suite or Green API, create one instance or phone credential per physical store or brand.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </span>
            <div>
              <strong className="text-white block mb-0.5">Paste Dedicated Webhook:</strong>
              Set the Webhook URL in that instance to <code className="text-emerald-300">/webhook/&lt;store-id&gt;</code>.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </span>
            <div>
              <strong className="text-white block mb-0.5">Zero Cross-Talk & Zero Local Costs:</strong>
              The backend routes messages strictly to the selected store's memory and catalog. The built-in simulator operates locally via in-memory sessions with zero outbound SMS charges.
            </div>
          </div>
        </div>
      </div>

      {/* Stores List & Switcher */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <span>Configured Store Tenants ({stores.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Click <strong>"Activate Store"</strong> to switch the active context in the simulator and editor
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stores.map((store) => {
            const isActive = store.id === activeStoreId;
            const isFnb = store.category === 'restaurant';
            const isSneakers = store.category === 'sneakers';

            return (
              <div
                key={store.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        isFnb
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isSneakers
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {isFnb ? (
                        <Utensils className="w-3 h-3" />
                      ) : isSneakers ? (
                        <Footprints className="w-3 h-3" />
                      ) : (
                        <Shirt className="w-3 h-3" />
                      )}
                      <span>
                        {isFnb ? 'Restaurant & F&B' : isSneakers ? 'Footwear & Sneakers' : 'Streetwear & Apparel'}
                      </span>
                    </span>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  {/* Store Name & Tagline */}
                  <div>
                    <h4 className="text-base font-bold text-white">{store.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{store.tagline}</p>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">WhatsApp Number:</span>
                      <span className="font-mono font-medium text-emerald-300">{store.phone}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Catalog Items:</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {store.items?.length || 0} items
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Inspect Before Pay:</span>
                      <span className="text-emerald-400 text-[11px] font-medium">100% Guaranteed</span>
                    </div>
                  </div>

                  {/* Webhook endpoint URL */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 block">Dedicated Webhook Route:</span>
                    <div className="flex items-center justify-between gap-1">
                      <code className="text-[11px] text-emerald-300 font-mono truncate select-all">
                        {currentDomain}/webhook/{store.id}
                      </code>
                      <button
                        onClick={() => handleCopyWebhook(store.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Copy Webhook URL"
                      >
                        {copiedWebhookId === store.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleSwitchStore(store.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isActive ? 'Current Active Store' : 'Activate Store'}
                  </button>

                  <button
                    onClick={() => {
                      setEditingStore(store);
                      setIsEditing(true);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Store Profile & Phone Number"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Sneakers Master Prompt for Google Sheets & Bot */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Footprints className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Master Footwear AI Sales System Prompt (Production-Ready)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Battle-tested prompt optimized for conversational sizing guidance, color selection, objection handling, and inspect-before-pay reassurance.
            </p>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPrompt ? 'Copied Successfully! ✅' : 'Copy Full Prompt (1-Click)'}</span>
          </button>
        </div>

        {/* Prompt Container */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 relative">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {sneakersPrompt}
          </pre>
        </div>
      </div>

      {/* Edit / Add Store Modal */}
      {isEditing && editingStore && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                <span>{editingStore.id ? 'Edit Store Profile' : 'Add New Store Tenant'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingStore(null);
                }}
                className="text-slate-400 hover:text-white text-sm cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Store ID (Slug for Webhook: /webhook/&lt;id&gt;)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.id || ''}
                    onChange={(e) =>
                      setEditingStore({
                        ...editingStore,
                        id: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                    placeholder="e.g. hbb-store, youth-brand"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Store Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.name || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                    placeholder="e.g. Bella Roma Pizza & Pastas"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Business Category
                  </label>
                  <select
                    value={editingStore.category || 'restaurant'}
                    onChange={(e) => setEditingStore({ ...editingStore, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="restaurant">Restaurant & F&B (Pizzas, Burgers, Meals)</option>
                    <option value="sneakers">Footwear & Sneakers (Sizes 40-46)</option>
                    <option value="clothing">Streetwear & Apparel (M, L, XL, XXL)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Configured WhatsApp Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.phone || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, phone: e.target.value })}
                    placeholder="e.g. +20 100 000 0001 or +20 113 204 4823"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Tagline & Value Proposition
                </label>
                <input
                  type="text"
                  value={editingStore.tagline || ''}
                  onChange={(e) => setEditingStore({ ...editingStore, tagline: e.target.value })}
                  placeholder="مثال: المتجر الرسمي لملابس الشباب العصرية والكوتشيات السنيكرز ماستر كواليتي."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Location & Delivery Hub
                  </label>
                  <input
                    type="text"
                    value={editingStore.location || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, location: e.target.value })}
                    placeholder="Metropolitan Area & Suburbs (Fast Delivery)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={editingStore.workingHours || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, workingHours: e.target.value })}
                    placeholder="Daily 11:00 AM - 02:00 AM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Customer Inspection & Return Policy
                </label>
                <textarea
                  rows={2}
                  value={editingStore.policy || ''}
                  onChange={(e) => setEditingStore({ ...editingStore, policy: e.target.value })}
                  placeholder="100% inspect-before-pay guarantee with courier..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingStore(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/50 cursor-pointer"
                >
                  Save Store Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
