import React, { useState, useEffect } from 'react';
import {
  Shirt,
  Truck,
  CreditCard,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Tag,
  Scissors,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BusinessProfile } from '../server/catalogData';
import { StoreProfile, ClothingItem } from '../types';

interface CatalogViewerProps {
  storeId?: string;
  activeStore?: StoreProfile | null;
  onStoreUpdated?: () => void;
}

export const CatalogViewer: React.FC<CatalogViewerProps> = ({
  storeId,
  activeStore,
  onStoreUpdated,
}) => {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isSneakers = activeStore?.category === 'sneakers';

  // Add Item Modal / Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiImportModal, setShowAiImportModal] = useState(false);
  const [aiImportContent, setAiImportContent] = useState('');
  const [aiImportMode, setAiImportMode] = useState<'merge' | 'replace'>('merge');
  const [isAiImporting, setIsAiImporting] = useState(false);
  const [aiImportMessage, setAiImportMessage] = useState('');

  const [newItem, setNewItem] = useState<Partial<ClothingItem>>({
    name: isSneakers ? 'Nike Dunk Low Retro Panda' : 'Pure Egyptian Cotton Oversized Tee',
    category: isSneakers ? 'Sneakers' : 'T-Shirts',
    price: isSneakers ? 119.99 : 25.99,
    sizes: isSneakers
      ? ['40', '41', '42', '43', '44', '45', '46']
      : ['M (120-150 lbs)', 'L (150-175 lbs)', 'XL (175-200 lbs)', 'XXL (200-230 lbs)', '3XL (230-260 lbs)'],
    colors: isSneakers
      ? ['Panda Black/White', 'All White', 'Triple Black']
      : ['Emerald Green', 'Carbon Black', 'Pure White', 'Desert Beige', 'Navy Blue'],
    description: isSneakers
      ? 'Master-quality sneaker with ultra-comfortable cushioning, original brand box with barcode, and inspect-before-pay delivery guarantee.'
      : '100% pure Egyptian cotton, heavy weight (240 GSM), pre-shrunk and treated against pilling with a relaxed modern oversized silhouette.',
    fabric: isSneakers ? 'Supple Leather & Rubber Cushioning' : '100% Pure Egyptian Cotton, 240 GSM Heavyweight',
    care: isSneakers ? 'Clean with soft damp cloth, avoid washing machines.' : 'Machine wash cold 30°C inside out, do not bleach, iron at medium heat from inside.',
    inStock: true,
  });

  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');

  const fetchCatalogs = async () => {
    try {
      const res = await fetch('/api/catalogs');
      if (res.ok) {
        const data = await res.json();
        if (data.clothing) {
          setProfile(data.clothing);
        }
      }
    } catch (e) {
      console.error('Failed to fetch catalogs:', e);
    }
  };

  // Fetch current store profile
  useEffect(() => {
    if (activeStore) {
      setProfile({
        id: activeStore.id,
        type: activeStore.category === 'sneakers' ? 'sneakers' : 'clothing',
        name: activeStore.name,
        tagline: activeStore.tagline,
        location: activeStore.location,
        deliveryZones: activeStore.deliveryZones,
        workingHours: activeStore.workingHours,
        paymentMethods: activeStore.paymentMethods,
        phone: activeStore.phone,
        vodafoneCash: activeStore.vodafoneCash || activeStore.phone,
        policy: activeStore.policy,
        items: activeStore.items || [],
      });
      return;
    }

    fetchCatalogs();
  }, [activeStore?.id, activeStore]);

  const handleSaveToServer = async (updatedProfile: BusinessProfile) => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      if (activeStore?.id) {
        // Save to specific store
        const res = await fetch(`/api/stores/${activeStore.id}/catalog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: updatedProfile.items }),
        });
        if (res.ok) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
          if (onStoreUpdated) onStoreUpdated();
        }
      } else {
        const res = await fetch('/api/catalog/clothing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile),
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        } else {
          const err = await res.json();
          setErrorMessage(err.error || 'Failed to save catalog');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Server connection error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!profile || !newItem.name || !newItem.price) return;

    const createdItem: ClothingItem = {
      id: `cloth_${Date.now()}`,
      name: newItem.name.trim(),
      category: newItem.category || 'T-Shirts',
      price: Number(newItem.price),
      sizes: newItem.sizes && newItem.sizes.length > 0 ? newItem.sizes : ['M', 'L', 'XL', 'XXL', '3XL'],
      colors: newItem.colors && newItem.colors.length > 0 ? newItem.colors : ['Carbon Black', 'Pure White', 'Emerald Green'],
      description: newItem.description || `${newItem.name} made with premium fabric and modern relaxed fit.`,
      fabric: newItem.fabric || '100% Pure Egyptian Cotton',
      care: newItem.care || 'Machine wash cold at 30°C inside out',
      inStock: true,
    };

    const updatedItems = [createdItem, ...profile.items];
    const updatedProfile = { ...profile, items: updatedItems };
    setProfile(updatedProfile);
    handleSaveToServer(updatedProfile);

    setShowAddModal(false);
    setNewItem({
      name: '',
      category: 'T-Shirts',
      price: 350,
      sizes: ['M (120-150 lbs)', 'L (150-175 lbs)', 'XL (175-200 lbs)', 'XXL (200-230 lbs)', '3XL (230-260 lbs)'],
      colors: ['Emerald Green', 'Carbon Black', 'Pure White', 'Desert Beige', 'Navy Blue'],
      description: '',
      fabric: '100% Pure Egyptian Cotton, 240 GSM Heavyweight',
      care: 'Machine wash cold 30°C inside out, do not bleach, iron at medium heat from inside.',
      inStock: true,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!profile) return;
    const filtered = profile.items.filter((i) => i.id !== itemId);
    const updatedProfile = { ...profile, items: filtered };
    setProfile(updatedProfile);
    handleSaveToServer(updatedProfile);
  };

  const handleExportJson = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clothing-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.items)) {
          setProfile(json);
          handleSaveToServer(json);
        } else {
          alert('Invalid JSON file format: Must contain an "items" array.');
        }
      } catch (err) {
        alert('An error occurred while parsing the JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteAiImport = async () => {
    if (!aiImportContent.trim()) {
      setAiImportMessage('Please paste product details from your spreadsheet or type your description first.');
      return;
    }

    setIsAiImporting(true);
    setAiImportMessage('');

    try {
      const res = await fetch('/api/catalog/ai-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: aiImportContent,
          mode: aiImportMode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiImportMessage(`🎉 ${data.message}`);
        await fetchCatalogs();
        setTimeout(() => {
          setShowAiImportModal(false);
          setAiImportContent('');
          setAiImportMessage('');
        }, 2200);
      } else {
        setAiImportMessage(`⚠️ Error: ${data.error || 'Failed to import catalog items'}`);
      }
    } catch (err: any) {
      setAiImportMessage(`⚠️ Connection error: ${err?.message || 'Server connection failed'}`);
    } finally {
      setIsAiImporting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Loading clothing catalog inventory...</span>
      </div>
    );
  }

  return (
    <div id="catalog-manager-root" className="space-y-6" dir="ltr">
      {/* Top Banner & Control Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-emerald-400" />
              <span>Product Inventory Catalog Manager</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add and edit apparel items, prices, sizes (M, L, XL, XXL, 3XL), colors, and fabric specs referenced by your sales assistant.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAiImportModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95 border border-indigo-400/30"
              title="Import items instantly from spreadsheets or text messages using AI"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>⚡ AI Import From Sheet / Text</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item Manually</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
              title="Export catalog as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import File</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </div>

        {/* Save Notifications */}
        {saveSuccess && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Catalog updated successfully! The AI sales assistant will reference the new items and pricing instantly.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Store Summary Bar */}
        <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <span className="text-slate-400 block text-[11px]">Brand Name:</span>
            <span className="text-sm font-bold text-slate-100">{profile.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Store Mobile Wallet (Vodafone Cash):</span>
            <span className="font-mono text-emerald-400 font-bold">{profile.vodafoneCash}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Catalog Item Count:</span>
            <span className="font-semibold text-sky-400">{profile.items.length} verified products</span>
          </div>
        </div>
      </div>

      {/* Quick Guide on Adding Products */}
      <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-emerald-300 block">How to add items to your store inventory:</span>
            <span className="text-slate-300">
              Click <strong>&quot;Add Item Manually&quot;</strong> to input custom items with sizes and fabrics, or use <strong>&quot;⚡ AI Import From Sheet / Text&quot;</strong> to bulk-import items from Excel or chat messages!
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Now</span>
          </button>
          <button
            onClick={() => setShowAiImportModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Import</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Products List & Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Products List */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Available Inventory</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">{profile.items.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {profile.items.map((item, idx) => {
              const cloth = item as ClothingItem;
              return (
                <div
                  key={cloth.id || idx}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{cloth.name}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          {cloth.category || 'Apparel'}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-relaxed">{cloth.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="font-mono font-bold text-base text-emerald-400">${cloth.price}</span>
                      <button
                        onClick={() => handleDeleteItem(cloth.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fabrics & Care */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                      <span className="font-medium text-slate-300 block mb-0.5 flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-sky-400" />
                        <span>Fabric Composition:</span>
                      </span>
                      <span className="text-slate-400">{cloth.fabric || '100% Cotton'}</span>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                      <span className="font-medium text-slate-300 block mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Care Instructions:</span>
                      </span>
                      <span className="text-slate-400">{cloth.care || 'Machine Wash Cold'}</span>
                    </div>
                  </div>

                  {/* Sizes & Colors Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-300">Sizes:</span>
                      {cloth.sizes?.map((sz: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-900 text-slate-200 rounded border border-slate-800 text-[10px]">
                          {sz}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-300">Colors:</span>
                      {cloth.colors?.map((col: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-900 text-slate-200 rounded border border-slate-800 text-[10px]">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Delivery Zones & Return Policy */}
        <div className="lg:col-span-4 space-y-4">
          {/* Return & Exchange Guarantee */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg text-xs space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Inspection & Exchange Policies</span>
            </h4>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-slate-300 leading-relaxed space-y-2">
              <p>
                🛡️ <strong className="text-slate-100">Try Before Buy:</strong> Customers have the right to inspect and try on the garments with the delivery courier before making any payment.
              </p>
              <p>
                🔄 <strong className="text-slate-100">14-Day Exchanges:</strong> Free exchange and returns are honored within 14 days of purchase as long as price tags remain intact.
              </p>
              <p>
                ✨ <strong className="text-slate-100">Defect Warranty:</strong> Immediate replacement is provided free of charge with all shipping covered by the store.
              </p>
            </div>
          </div>

          {/* Delivery Zones */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg text-xs space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Delivery Zones & Pricing</span>
            </h4>
            <div className="space-y-2">
              {profile.deliveryZones.map((z, i) => (
                <div key={i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-slate-200 block">{z.zone}</span>
                    <span className="text-[10px] text-slate-400">ETA: {z.eta}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">${z.fee} USD</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accepted Payment Methods */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg text-xs space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <CreditCard className="w-4 h-4 text-sky-400" />
              <span>Accepted Payment Methods</span>
            </h4>
            <ul className="space-y-1.5 text-slate-300">
              {profile.paymentMethods.map((pm, i) => (
                <li key={i} className="flex items-center gap-2 p-1.5 bg-slate-950 rounded border border-slate-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{pm}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Add New Clothing Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="ltr">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Add Apparel Item to Catalog</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Item Title / Model Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Emerald Green Oversized Tee"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="T-Shirts">T-Shirts & Tops</option>
                    <option value="Shirts">Casual & Dress Shirts</option>
                    <option value="Hoodies">Hoodies & Sweatshirts</option>
                    <option value="Pants">Pants & Cargo</option>
                    <option value="Shoes">Shoes & Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Price (USD $) *</label>
                  <input
                    type="number"
                    placeholder="25.99"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Fabric Composition</label>
                <input
                  type="text"
                  placeholder="e.g. 100% Pure Egyptian Cotton, Heavy 240g Fabric"
                  value={newItem.fabric}
                  onChange={(e) => setNewItem({ ...newItem, fabric: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Care Guidelines</label>
                <input
                  type="text"
                  placeholder="e.g. Wash cold 30°C inside out, do not bleach"
                  value={newItem.care}
                  onChange={(e) => setNewItem({ ...newItem, care: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Available Colors (separated by commas)</label>
                <input
                  type="text"
                  placeholder="Emerald Green, Desert Beige, Carbon Black"
                  value={newItem.colors?.join(', ')}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      colors: e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Available Sizes (separated by commas)</label>
                <input
                  type="text"
                  placeholder="M, L, XL, XXL, 3XL"
                  value={newItem.sizes?.join(', ')}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      sizes: e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed description of fit, styling, and embroidery details..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.name || !newItem.price}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to AI Memory</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Catalog Importer Modal */}
      {showAiImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Instant AI Catalog Importer</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Copy rows from Google Sheets/Excel, or write a raw chat message describing your inventory, and Gemini will parse it instantly.
                </p>
              </div>
              <button
                onClick={() => setShowAiImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Template Fill Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400">Quick Templates:</span>
              <button
                type="button"
                onClick={() =>
                  setAiImportContent(
                    `Pure Egyptian Cotton Oversized Tee\t350\tM (120-150 lbs), L (150-175 lbs), XL (175-200 lbs), XXL (200-230 lbs), 3XL (230-260 lbs)\tEmerald Green, Carbon Black, Pure White, Desert Beige, Navy Blue\t100% pure Egyptian cotton, heavyweight (240 GSM) pre-shrunk fabric with relaxed oversized streetwear fit.`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-[11px] border border-emerald-500/40 font-medium"
              >
                👕 Pure Egyptian Cotton Tees
              </button>
              <button
                type="button"
                onClick={() =>
                  setAiImportContent(
                    `Red Casual Turkey Creep Dress\t450\t30, 32, 34, 36\tCrimson Red, Black\tTurkish Creep dress with ultra-breathable feel\nOversized Basic Hoodie\t490\tM, L, XL, XXL, 3XL\tBlack, White, Olive\tPremium 3-thread cotton fleece with soft lining\nWhite Casual Linen Shirt\t390\tM, L, XL, XXL\tWhite, Navy, Beige\t100% natural organic cool-feel linen`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
              >
                📋 Excel/Sheet Mapped Rows
              </button>
              <button
                type="button"
                onClick={() =>
                  setAiImportContent(
                    `I want to sell pure Egyptian cotton oversized tees in colors Emerald Green, Carbon Black, and Pure White. Sizes M to 3XL, priced at $25.99 with heavy 240 GSM pre-shrunk combed cotton.`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
              >
                💬 Raw Description Message
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                  Paste raw text or sheet cells here:
                </label>
                <textarea
                  rows={6}
                  value={aiImportContent}
                  onChange={(e) => setAiImportContent(e.target.value)}
                  placeholder="Paste spreadsheet columns or description paragraph..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-medium">Import Strategy:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={aiImportMode === 'merge'}
                    onChange={() => setAiImportMode('merge')}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <span>Merge with existing products</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={aiImportMode === 'replace'}
                    onChange={() => setAiImportMode('replace')}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <span>Replace entire catalog</span>
                </label>
              </div>

              {aiImportMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    aiImportMessage.includes('Error') || aiImportMessage.includes('Failed')
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <span>{aiImportMessage}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAiImportModal(false)}
                disabled={isAiImporting}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAiImport}
                disabled={isAiImporting || !aiImportContent.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                {isAiImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Analyze & Update Inventory</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
