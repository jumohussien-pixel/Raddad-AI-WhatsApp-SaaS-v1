/**
 * Unified Control Center & Visual Menu/Catalog Manager for WhatsApp AI SaaS
 * 
 * 100% English Executive Suite:
 * - All-in-One Streamlined Dashboard (Zero multi-screen confusion for store owners and SaaS buyers)
 * - Visual Catalog & Menu Editor (Add/Edit products, portion sizes, add-ons/toppings, prep time, 1-click Save & Deploy)
 * - 3-Step Guided Store Setup Wizard (F&B Restaurant or Retail/Footwear with inline tooltips)
 * - Dedicated per-store Webhook URL & Phone Number display with 1-click copy
 * - Live WhatsApp Production Bot Callout: +20 113 204 4823 with direct click-to-chat
 * - Integrated Live WhatsApp Customer Simulator with real-time order extraction
 */

import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  Copy,
  Smartphone,
  Webhook,
  Sparkles,
  Utensils,
  Footprints,
  Shirt,
  Clock,
  Truck,
  DollarSign,
  AlertCircle,
  HelpCircle,
  X,
  Search,
  CheckCircle2,
  Flame,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Send,
  MessageSquare,
  ShieldCheck,
  Sliders,
  ExternalLink,
  Play,
} from 'lucide-react';
import { StoreProfile, MenuItem, SneakerItem, ClothingItem, ChatMessage, OrderDraft } from '../types';

interface UnifiedControlCenterProps {
  onStoreSwitched?: (store: StoreProfile) => void;
  onViewDevOps?: () => void;
  onLaunchAutoDemo?: () => void;
}

export const UnifiedControlCenter: React.FC<UnifiedControlCenterProps> = ({
  onStoreSwitched,
  onViewDevOps,
  onLaunchAutoDemo,
}) => {
  // Store state
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('pizza-store');
  const [activeStore, setActiveStore] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [copiedDemoPhone, setCopiedDemoPhone] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Active view inside control center: 'menu' | 'simulator' | 'settings'
  const [activeView, setActiveView] = useState<'menu' | 'simulator' | 'settings'>('menu');

  // Search & Category filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Primary Live Production Demo Phone Number
  const PRIMARY_LIVE_DEMO_PHONE = '+20 113 204 4823';
  const PRIMARY_LIVE_DEMO_RAW = '201132044823';

  // Edit Store & Phone Number Modal State
  const [showEditStoreModal, setShowEditStoreModal] = useState<boolean>(false);
  const [editStoreForm, setEditStoreForm] = useState<Partial<StoreProfile>>({
    name: '',
    phone: '',
    tagline: '',
    vodafoneCash: '',
    instapay: '',
    workingHours: '',
    location: '',
    prepTime: '',
    policy: '',
  });

  // New Store Setup Wizard State
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardData, setWizardData] = useState({
    id: '',
    name: '',
    tagline: '',
    category: 'restaurant' as 'restaurant' | 'sneakers' | 'clothing',
    phone: '',
    prepTime: '20 - 25 mins',
    preset: 'pizza' as 'pizza' | 'burger' | 'sneakers' | 'clothing' | 'blank',
    location: 'Metropolitan Area & Suburbs (Fast Courier Delivery)',
    workingHours: 'Daily 11:00 AM - 02:00 AM',
  });

  // Add / Edit Item Modal State
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<{
    id?: string;
    name: string;
    category: string;
    price: number;
    description: string;
    imageUrl: string;
    inStock: boolean;
    // Restaurant specific
    prepTime?: string;
    isSpicy?: boolean;
    isVegetarian?: boolean;
    portionSizes: { size: string; price: number }[];
    addOns: { name: string; price: number }[];
    // Retail specific
    sizes: string[];
    colors: string[];
  }>({
    name: '',
    category: '',
    price: 0,
    description: '',
    imageUrl: '',
    inStock: true,
    prepTime: '20 mins',
    isSpicy: false,
    isVegetarian: false,
    portionSizes: [
      { size: 'Single Portion', price: 120 },
      { size: 'Combo (+ Cheesy Fries & Drink)', price: 165 },
      { size: 'Family Party Box', price: 280 },
    ],
    addOns: [
      { name: 'Extra Melted Mozzarella', price: 25 },
      { name: 'Spicy Jalapeno Slices', price: 15 },
    ],
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    colors: ['White', 'Black', 'Panda Grey'],
  });

  // Simulator State
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([]);
  const [simInput, setSimInput] = useState<string>('');
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simOrderDraft, setSimOrderDraft] = useState<OrderDraft | null>(null);

  // Fetch all stores
  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        const storeList: StoreProfile[] = data.stores || [];
        setStores(storeList);
        const currentActiveId = data.activeStoreId || (storeList[0]?.id ?? 'pizza-store');
        setActiveStoreId(currentActiveId);
        const current = storeList.find((s) => s.id === currentActiveId) || storeList[0] || null;
        setActiveStore(current);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Fetch session messages for active store simulator
  useEffect(() => {
    if (!activeStore) return;
    const phone = activeStore.phone || PRIMARY_LIVE_DEMO_RAW;
    fetch(`/api/sessions`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.sessions || []).find((s: any) => s.phone === phone);
        if (found) {
          setSimMessages(found.history || []);
          setSimOrderDraft(found.orderDraft || null);
        } else {
          // Default initial greeting for simulator
          const isFnb = activeStore.category === 'restaurant';
          const defaultGreeting = isFnb
            ? `Hello and welcome to ${activeStore.name}! 🍕🍔 Our gourmet meals are freshly prepared to order in ~20 minutes. We offer Single, Combo (+ seasoned fries & drink), and Family Boxes. Would you like to explore our menu or place an order?`
            : `Hello and welcome to ${activeStore.name}! 👟 We specialize in premium master-quality sneakers with sizes 40-46 and inspect-before-pay delivery. Which style or size can I assist you with today?`;
          setSimMessages([
            { role: 'model', content: defaultGreeting, timestamp: Date.now() },
          ]);
          setSimOrderDraft(null);
        }
      })
      .catch(() => {});
  }, [activeStore?.id]);

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
        setActiveStore(data.activeStore);
        setSelectedCategory('All');
        if (onStoreSwitched && data.activeStore) {
          onStoreSwitched(data.activeStore);
        }
      }
    } catch (err) {
      console.error('Failed to switch store:', err);
    }
  };

  // Copy Webhook URL
  const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const currentWebhookUrl = `${currentDomain}/webhook/${activeStore?.id || 'pizza-store'}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(currentWebhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // Copy Demo Phone
  const handleCopyDemoPhone = () => {
    navigator.clipboard.writeText(PRIMARY_LIVE_DEMO_PHONE);
    setCopiedDemoPhone(true);
    setTimeout(() => setCopiedDemoPhone(false), 2500);
  };

  // Open Edit Store Modal
  const handleOpenEditStore = (store: StoreProfile | null) => {
    if (!store) return;
    setEditStoreForm({
      ...store,
      phone: store.phone || '',
      vodafoneCash: store.vodafoneCash || store.phone || '',
      instapay: store.instapay || '',
    });
    setShowEditStoreModal(true);
  };

  // Save Store Profile
  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore || !editStoreForm.name || !editStoreForm.phone) {
      alert('Please provide store name and phone number');
      return;
    }

    try {
      const updatedStore: StoreProfile = {
        ...activeStore,
        ...editStoreForm,
        name: editStoreForm.name,
        phone: editStoreForm.phone,
        vodafoneCash: editStoreForm.vodafoneCash || editStoreForm.phone,
        items: activeStore.items || [],
      } as StoreProfile;

      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStore),
      });

      if (res.ok) {
        const data = await res.json();
        const saved = data.store || updatedStore;
        setActiveStore(saved);
        setStores((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        setShowEditStoreModal(false);
        setSaveSuccessMsg(`Store profile and WhatsApp number (${saved.phone}) updated successfully! 📱✨`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update store:', err);
    }
  };

  // Open Add Item Modal
  const handleOpenAddItem = () => {
    const isRestaurant = activeStore?.category === 'restaurant';
    const isSneakers = activeStore?.category === 'sneakers';

    setItemForm({
      name: '',
      category: isRestaurant ? 'Pizzas' : isSneakers ? 'Sneakers' : 'T-Shirts',
      price: isRestaurant ? 140 : isSneakers ? 790 : 350,
      description: isRestaurant
        ? 'Delicious freshly baked artisan pizza prepared with San Marzano tomatoes, fresh herbs, and melted mozzarella.'
        : isSneakers
          ? 'Master-quality sneaker with responsive cushioned air foam sole, authentic materials, and inspect-before-pay guarantee.'
          : '100% pure Egyptian cotton, heavy weight (240 GSM), pre-shrunk and treated against pilling with a relaxed modern streetwear fit.',
      imageUrl: isRestaurant
        ? 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'
        : isSneakers
          ? 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'
          : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80',
      inStock: true,
      prepTime: isRestaurant ? '20 - 25 mins' : undefined,
      isSpicy: false,
      isVegetarian: false,
      portionSizes: isRestaurant
        ? [
            { size: 'Single Portion', price: 140 },
            { size: 'Combo (+ Seasoned Fries & Drink)', price: 185 },
            { size: 'Family Party Box', price: 290 },
          ]
        : [],
      addOns: isRestaurant
        ? [
            { name: 'Extra Melted Mozzarella', price: 25 },
            { name: 'Spicy Jalapeno Slices', price: 15 },
            { name: 'Creamy Ranch Sauce Dip', price: 15 },
          ]
        : [],
      sizes: isSneakers
        ? ['40', '41', '42', '43', '44', '45', '46']
        : ['M', 'L', 'XL', 'XXL', '3XL'],
      colors: isSneakers
        ? ['Panda Black/White', 'Triple White', 'Smoke Grey']
        : ['Black', 'Pure White', 'Emerald Green', 'Desert Beige'],
    });
    setEditingItemIndex(null);
    setShowItemModal(true);
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (index: number) => {
    if (!activeStore?.items?.[index]) return;
    const item = activeStore.items[index];
    setItemForm({
      id: item.id,
      name: item.name || '',
      category: item.category || 'General',
      price: item.price || 0,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      inStock: item.inStock !== false,
      prepTime: item.prepTime || '20 mins',
      isSpicy: !!item.isSpicy,
      isVegetarian: !!item.isVegetarian,
      portionSizes: item.portionSizes || [
        { size: 'Single', price: item.price || 120 },
        { size: 'Combo (+ Fries & Drink)', price: (item.price || 120) + 45 },
      ],
      addOns: item.addOns || [
        { name: 'Extra Mozzarella', price: 25 },
        { name: 'Jalapeno', price: 15 },
      ],
      sizes: item.sizes || ['40', '41', '42', '43', '44', '45', '46'],
      colors: item.colors || ['Black', 'White'],
    });
    setEditingItemIndex(index);
    setShowItemModal(true);
  };

  // Save Item to Local Store and Deploy to Backend
  const handleSaveItemModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;

    const currentItems = [...(activeStore.items || [])];
    const isRestaurant = activeStore.category === 'restaurant';

    const newItemPayload: any = {
      id: itemForm.id || `item_${Date.now().toString().slice(-6)}`,
      name: itemForm.name,
      category: itemForm.category,
      price: Number(itemForm.price),
      description: itemForm.description,
      imageUrl: itemForm.imageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
      inStock: itemForm.inStock,
    };

    if (isRestaurant) {
      newItemPayload.prepTime = itemForm.prepTime;
      newItemPayload.isSpicy = itemForm.isSpicy;
      newItemPayload.isVegetarian = itemForm.isVegetarian;
      newItemPayload.portionSizes = itemForm.portionSizes.filter((p) => p.size && p.price > 0);
      newItemPayload.addOns = itemForm.addOns.filter((a) => a.name && a.price > 0);
    } else {
      newItemPayload.sizes = itemForm.sizes;
      newItemPayload.colors = itemForm.colors;
    }

    if (editingItemIndex !== null && editingItemIndex >= 0) {
      currentItems[editingItemIndex] = newItemPayload;
    } else {
      currentItems.unshift(newItemPayload);
    }

    await deployCatalogToServer(activeStore.id, currentItems);
    setShowItemModal(false);
  };

  // Delete Item
  const handleDeleteItem = async (index: number) => {
    if (!activeStore) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${activeStore.items[index]?.name}"?`);
    if (!confirmDelete) return;

    const updated = activeStore.items.filter((_, i) => i !== index);
    await deployCatalogToServer(activeStore.id, updated);
  };

  // Deploy Entire Catalog to Server via POST /api/stores/:id/catalog
  const deployCatalogToServer = async (storeId: string, items: any[]) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.store) {
          setActiveStore(data.store);
          setStores((prev) => prev.map((s) => (s.id === storeId ? data.store : s)));
        }
        setSaveSuccessMsg('Catalog updated & deployed live to AI agents! 🚀');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to deploy catalog:', err);
    }
  };

  // Handle Wizard Submit (Create New Store)
  const handleCreateStoreSubmit = async () => {
    if (!wizardData.name.trim()) {
      alert('Please enter a store name');
      return;
    }

    const generatedId =
      wizardData.id.trim() ||
      wizardData.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') ||
      `store_${Date.now().toString().slice(-4)}`;

    let initialItems: any[] = [];
    if (wizardData.preset === 'pizza') {
      initialItems = [
        {
          id: 'piz_w1',
          name: 'Classic Margherita Fresh Basil Pizza',
          category: 'Pizzas',
          price: 120,
          description: 'Classic Italian pizza with artisanal mozzarella, San Marzano tomato sauce, and fresh basil.',
          portionSizes: [
            { size: 'Single (Medium 28cm)', price: 120 },
            { size: 'Combo (+ Cheesy Fries & Can)', price: 165 },
            { size: 'Family Box (Large 35cm)', price: 240 },
          ],
          addOns: [
            { name: 'Extra Mozzarella', price: 25 },
            { name: 'Spicy Jalapeno', price: 15 },
          ],
          prepTime: wizardData.prepTime,
          imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&q=80',
          inStock: true,
        },
      ];
    } else if (wizardData.preset === 'burger') {
      initialItems = [
        {
          id: 'brg_w1',
          name: 'Double Smash Angus Cheeseburger',
          category: 'Burgers',
          price: 150,
          description: 'Double Angus beef smash patties grilled to perfection with secret burger sauce and melted cheddar.',
          portionSizes: [
            { size: 'Single Sandwich', price: 150 },
            { size: 'Combo (+ Seasoned Fries & Drink)', price: 195 },
            { size: 'Family Box (3 Double Burgers + 1L Pepsi)', price: 430 },
          ],
          addOns: [
            { name: 'Extra Cheddar Slice', price: 20 },
            { name: 'Smoked Beef Bacon', price: 25 },
          ],
          prepTime: wizardData.prepTime,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
          inStock: true,
        },
      ];
    } else if (wizardData.preset === 'sneakers') {
      initialItems = [
        {
          id: 'snk_w1',
          name: 'Nike Dunk Low Retro Panda',
          category: 'Sneakers',
          price: 790,
          sizes: ['40', '41', '42', '43', '44', '45', '46'],
          colors: ['Panda Black/White', 'Triple White', 'Grey Fog'],
          description: 'Top-trending street sneaker, lightweight comfort with cupsole rubber cushioning.',
          imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
          inStock: true,
        },
      ];
    }

    const newStorePayload: StoreProfile = {
      id: generatedId,
      name: wizardData.name,
      tagline: wizardData.tagline || (wizardData.category === 'restaurant' ? 'Artisanal fast food prepared fresh to order' : 'Premium master-quality streetwear and footwear'),
      category: wizardData.category,
      phone: wizardData.phone || PRIMARY_LIVE_DEMO_PHONE,
      vodafoneCash: wizardData.phone || PRIMARY_LIVE_DEMO_RAW,
      location: wizardData.location,
      workingHours: wizardData.workingHours,
      prepTime: wizardData.category === 'restaurant' ? wizardData.prepTime : undefined,
      deliveryZones: [
        { zone: 'Central Metropolitan Area', fee: 35, eta: '35 - 45 mins' },
        { zone: 'Outer Suburbs & Extended City', fee: 45, eta: '45 - 60 mins' },
      ],
      paymentMethods: [
        'Cash on Delivery (COD) with full inspect-before-pay',
        'Mobile Digital Wallets (Vodafone Cash / Orange)',
        'Instant Bank Transfer (InstaPay)',
      ],
      policy: wizardData.category === 'restaurant'
        ? 'Delivered fresh and thermally insulated. 100% quality and freshness guarantee.'
        : 'Inspect-before-pay courier policy with free 14-day size exchange.',
      items: initialItems,
    };

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStorePayload),
      });

      if (res.ok) {
        setShowWizard(false);
        setWizardStep(1);
        await fetchStores();
        await handleSwitchStore(generatedId);
      }
    } catch (err) {
      console.error('Failed to create store:', err);
    }
  };

  // Simulator Message Send
  const handleSendSimulatorMessage = async (customText?: string) => {
    const textToSend = customText || simInput;
    if (!textToSend.trim() || !activeStore) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setSimMessages((prev) => [...prev, userMsg]);
    setSimInput('');
    setSimLoading(true);

    try {
      const res = await fetch('/api/chat/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: activeStore.phone || PRIMARY_LIVE_DEMO_RAW,
          message: textToSend,
          businessType: activeStore.category,
          storeId: activeStore.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const modelMsg: ChatMessage = {
          role: 'model',
          content: data.reply,
          timestamp: Date.now(),
        };
        setSimMessages((prev) => [...prev, modelMsg]);

        // Refresh sessions to get any extracted order draft
        const sessRes = await fetch('/api/sessions');
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          const target = (sessData.sessions || []).find((s: any) => s.phone === (activeStore.phone || PRIMARY_LIVE_DEMO_RAW));
          if (target && target.orderDraft) {
            setSimOrderDraft(target.orderDraft);
          }
        }
      }
    } catch (err) {
      console.error('Simulator error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  // Filter items
  const items = activeStore?.items || [];
  const categories = ['All', ...Array.from(new Set(items.map((it: any) => it.category).filter(Boolean)))];

  const filteredItems = items.filter((it: any) => {
    const matchesCat = selectedCategory === 'All' || it.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      it.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const isRestaurant = activeStore?.category === 'restaurant';
  const isSneakers = activeStore?.category === 'sneakers';

  return (
    <div className="space-y-6" dir="ltr">
      {/* 1. Global Live WhatsApp Production Demo Callout & Pitch Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Production Test Number
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Verified Meta Cloud & Green API Gateway
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Test Live On WhatsApp:</span>
              <span className="font-mono text-emerald-400 font-black">{PRIMARY_LIVE_DEMO_PHONE}</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Anyone can test our real-time production AI sales bot right now! Send a message in English, Arabic, or Franco-Arabic to experience instant sales responses and order capturing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onLaunchAutoDemo && (
              <button
                id="btn-ucc-auto-demo"
                onClick={onLaunchAutoDemo}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-orange-950/50 transition-all cursor-pointer ring-1 ring-amber-400/50 hover:scale-105 active:scale-95 animate-pulse"
                title="Launch 60-90 second self-running interactive tour of the AI sales engine"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Auto-Play Demo Walkthrough</span>
              </button>
            )}

            <a
              href={`https://wa.me/${PRIMARY_LIVE_DEMO_RAW}?text=Hi%2C%20I%20am%20testing%20the%20AI%20WhatsApp%20Customer%20Service%20and%20Sales%20Engine%21`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Chat Live on WhatsApp</span>
            </a>

            <button
              onClick={handleCopyDemoPhone}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedDemoPhone ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDemoPhone ? 'Number Copied!' : 'Copy Number'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Global Store Overview Bar & Tenant Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Active Store Details */}
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                isRestaurant
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-950/40'
                  : isSneakers
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-950/40'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-700 shadow-indigo-950/40'
              }`}
            >
              {isRestaurant ? (
                <Utensils className="w-6 h-6" />
              ) : isSneakers ? (
                <Footprints className="w-6 h-6" />
              ) : (
                <Shirt className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {activeStore?.name || 'Loading Store...'}
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    isRestaurant
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : isSneakers
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  {isRestaurant
                    ? '🍕 F&B & Restaurant'
                    : isSneakers
                      ? '👟 Footwear & Sneakers (EU 40-46)'
                      : '👕 Streetwear & Retail'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Webhook
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeStore?.tagline || 'Autonomous AI sales representative with multi-lingual negotiation'}
              </p>
            </div>
          </div>

          {/* Store Switcher Pills & Wizard Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {stores.map((s) => {
              const isSelected = s.id === activeStoreId;
              const isRes = s.category === 'restaurant';
              const isSnk = s.category === 'sneakers';
              return (
                <button
                  key={s.id}
                  onClick={() => handleSwitchStore(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 font-bold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {isRes ? <Utensils className="w-3.5 h-3.5 text-amber-400" /> : isSnk ? <Footprints className="w-3.5 h-3.5 text-emerald-400" /> : <Shirt className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{s.name.split(' ')[0]}</span>
                </button>
              );
            })}

            {/* Launch Store Wizard Button */}
            <button
              onClick={() => {
                setWizardStep(1);
                setShowWizard(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create New Store</span>
            </button>
          </div>
        </div>

        {/* Quick Connection Bar: Webhook URL, Phone Number & Edit Button */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Webhook className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dedicated Webhook:</span>
            </span>
            <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 flex items-center gap-2 select-all">
              <span>{currentWebhookUrl}</span>
              <button
                onClick={handleCopyWebhook}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                title="Copy webhook URL"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copiedWebhook && (
              <span className="text-emerald-400 text-[11px] font-semibold animate-fade-in">Copied!</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Store Phone:</span>
              <strong className="text-white font-mono">{activeStore?.phone || PRIMARY_LIVE_DEMO_PHONE}</strong>
            </div>

            <button
              onClick={() => handleOpenEditStore(activeStore)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Edit store phone number and details"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Store & Phone</span>
            </button>

            {isRestaurant && activeStore?.prepTime && (
              <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Clock className="w-3 h-3" />
                <span>Prep: {activeStore.prepTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-3 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg('')}
            className="text-emerald-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Unified Navigation Control Strip (Menu Editor vs Live Simulator vs Settings) */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'menu'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            {isRestaurant ? <Utensils className="w-4 h-4" /> : <Shirt className="w-4 h-4" />}
            <span>Visual Catalog & Menu Editor ({items.length} Items)</span>
          </button>

          <button
            onClick={() => setActiveView('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'simulator'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Interactive Live Simulator</span>
          </button>

          <button
            onClick={() => setActiveView('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'settings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Delivery Zones & Policies</span>
          </button>
        </div>

        {/* 1-Click Add Item Button */}
        {activeView === 'menu' && (
          <button
            onClick={handleOpenAddItem}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRestaurant ? '+ Add Menu Dish' : '+ Add New Product'}</span>
          </button>
        )}
      </div>

      {/* 4. VIEW: Visual Menu & Product Catalog Editor */}
      {activeView === 'menu' && (
        <div className="space-y-5">
          {/* Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog items..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8">
              <p className="text-sm text-slate-400">No items match your search or the catalog is empty.</p>
              <button
                onClick={handleOpenAddItem}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Item Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item: any, idx: number) => {
                const actualIndex = items.findIndex((orig: any) => orig.id === item.id);
                return (
                  <div
                    key={item.id || idx}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col hover:border-slate-700 transition-all group"
                  >
                    {/* Item Image Header */}
                    <div className="h-44 w-full bg-slate-950 relative overflow-hidden">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as any).src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur text-[10px] font-bold text-slate-200 border border-slate-700/60">
                          {item.category}
                        </span>
                        {item.isSpicy && (
                          <span className="px-1.5 py-0.5 rounded-md bg-red-950/90 text-red-400 text-[10px] font-bold flex items-center gap-0.5 border border-red-500/30">
                            <Flame className="w-2.5 h-2.5" />
                            Spicy
                          </span>
                        )}
                      </div>

                      {/* Bottom Price on Image */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-baseline gap-1">
                        <span className="text-xl font-black text-white font-mono">${item.price}</span>
                        <span className="text-xs text-emerald-400 font-bold">USD</span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-white text-sm leading-snug line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Restaurant Portion Sizes & Add-ons */}
                      {isRestaurant && item.portionSizes && item.portionSizes.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                          <span className="text-slate-400 font-medium">Available Portions:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.portionSizes.map((p: any, pIdx: number) => (
                              <span
                                key={pIdx}
                                className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300 font-mono text-[10px]"
                              >
                                {p.size}: <strong className="text-emerald-400">${p.price}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Retail Sizes & Colors */}
                      {!isRestaurant && item.sizes && item.sizes.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-slate-800/80 text-[11px]">
                          <span className="text-slate-400 font-medium">Sizes:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.sizes.map((s: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300 font-mono text-[10px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions Card Footer */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.inStock !== false
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-950 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditItem(actualIndex)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(actualIndex)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW: Integrated Live WhatsApp Simulator */}
      {activeView === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Simulator Phone Container */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
            {/* Phone Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {isRestaurant ? <Utensils className="w-4 h-4" /> : <Footprints className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">{activeStore?.name}</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online • AI Engine Active
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSimMessages([
                    {
                      role: 'model',
                      content: isRestaurant
                        ? `Welcome to ${activeStore?.name}! 🍕🍔 Would you like to check out our menu or place an order?`
                        : `Welcome to ${activeStore?.name}! 👟 What shoe model or size (40-46) are you looking for?`,
                      timestamp: Date.now(),
                    },
                  ]);
                  setSimOrderDraft(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Chat</span>
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a1017]">
              {simMessages.map((msg, mIdx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={mIdx}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                        isUser
                          ? 'bg-slate-800 text-white rounded-tr-none'
                          : 'bg-emerald-950/90 text-emerald-100 border border-emerald-500/30 rounded-tl-none font-sans'
                      }`}
                    >
                      {msg.content}
                      <span className="block text-[9px] text-slate-400 mt-1 text-right opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {simLoading && (
                <div className="flex justify-start">
                  <div className="bg-emerald-950/60 text-emerald-300 text-xs px-3 py-2 rounded-2xl rounded-tl-none border border-emerald-500/20 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] text-slate-400">AI agent is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="bg-slate-950/80 px-3 py-2 border-t border-slate-800/60 overflow-x-auto scrollbar-none flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">Quick Prompts:</span>
              {isRestaurant ? (
                <>
                  <button
                    onClick={() => handleSendSimulatorMessage('What pizzas do you have and what are the prices?')}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/20 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    🍕 Menu & Prices
                  </button>
                  <button
                    onClick={() => handleSendSimulatorMessage('I want Pepperoni Pizza Combo with extra mozzarella and spicy jalapenos')}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/20 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    🍟 Combo + Add-ons
                  </button>
                  <button
                    onClick={() => handleSendSimulatorMessage('What is the estimated prep time and delivery fee?')}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/20 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    ⏱️ Prep Time & Delivery
                  </button>
                  <button
                    onClick={() => handleSendSimulatorMessage('Confirm order: 1 Pepperoni Combo for David, 14 Main Street, phone 01132044823, payment on delivery')}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    📝 Confirm Order
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSendSimulatorMessage('Do you have white sneakers in size 43?')}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/20 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    👟 White Sneakers Size 43
                  </button>
                  <button
                    onClick={() => handleSendSimulatorMessage('How much is the Nike Dunk Panda and can I try it on before paying?')}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/20 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    🛡️ Dunk Panda & Try-On Policy
                  </button>
                  <button
                    onClick={() => handleSendSimulatorMessage('Register order: Air Jordan 1 Chicago size 44 for John, 22 Park Ave, phone 01132044823')}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    📦 Book Sneaker Order
                  </button>
                </>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendSimulatorMessage();
              }}
              className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="Type customer message or order details..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={simLoading || !simInput.trim()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Real-time Order Draft Extractor Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="font-bold text-white text-sm">Automated Order Extractor</h4>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                The AI automatically parses and extracts ordered items, portion sizes, add-ons, recipient name, address, and phone number in real-time for immediate CRM / POS dispatch.
              </p>

              {simOrderDraft && simOrderDraft.items && simOrderDraft.items.length > 0 ? (
                <div className="mt-4 bg-slate-950 rounded-xl p-3.5 border border-emerald-500/30 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Order Items:</span>
                    {simOrderDraft.items.map((it, itIdx) => (
                      <div key={itIdx} className="text-xs font-semibold text-white flex items-center justify-between">
                        <span>• {it.name} {it.portionSize ? `(${it.portionSize})` : ''} {it.sizeOrColor ? `[${it.sizeOrColor}]` : ''}</span>
                        <span className="text-emerald-400">{it.price ? `$${it.price}` : ''}</span>
                      </div>
                    ))}
                  </div>

                  {simOrderDraft.customerName && (
                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400">Customer:</span> <strong>{simOrderDraft.customerName}</strong>
                    </div>
                  )}

                  {simOrderDraft.address && (
                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400">Address:</span> <strong>{simOrderDraft.address}</strong>
                    </div>
                  )}

                  {simOrderDraft.phone && (
                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400">Phone:</span> <strong className="font-mono">{simOrderDraft.phone}</strong>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Status:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                      Ready for Fulfillment
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center py-8 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 p-4">
                  <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No active order captured yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Send a message in the simulator to test automated entity extraction.</p>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">💡 SaaS Value Highlight:</span>
              <p>This structured payload is automatically synced to Shopify, WooCommerce, Foodics, or your custom ERP webhook without human manual data entry.</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. VIEW: Store Policies & Delivery Settings */}
      {activeView === 'settings' && activeStore && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Delivery Zones, Fees & Business Policies</h3>
              <p className="text-xs text-slate-400 mt-1">These settings strictly guide the AI sales agent during live customer negotiations</p>
            </div>

            <button
              onClick={() => {
                setSaveSuccessMsg('Settings saved successfully!');
                setTimeout(() => setSaveSuccessMsg(''), 3000);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Delivery Zones */}
            <div className="space-y-3">
              <label className="font-bold text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Delivery Zones & Courier Rates:</span>
              </label>
              <div className="space-y-2">
                {activeStore.deliveryZones.map((z, zIdx) => (
                  <div key={zIdx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">{z.zone}</span>
                      <span className="text-[11px] text-slate-400">Estimated Delivery: {z.eta}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 font-mono font-bold border border-emerald-500/20">
                      ${z.fee} USD
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Policies */}
            <div className="space-y-4">
              <div>
                <label className="font-bold text-white block mb-1.5">Operating Hours:</label>
                <input
                  type="text"
                  value={activeStore.workingHours}
                  readOnly
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-white block mb-1.5">Accepted Payment Methods:</label>
                <div className="space-y-1.5">
                  {activeStore.paymentMethods.map((pm, pmIdx) => (
                    <div key={pmIdx} className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{pm}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-white block mb-1.5">Store Inspection & Return Policy:</label>
                <textarea
                  value={activeStore.policy}
                  readOnly
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: Edit Store & Phone Number */}
      {/* ========================================================================= */}
      {showEditStoreModal && activeStore && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowEditStoreModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Edit Store Profile & WhatsApp Phone</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure your primary live WhatsApp number or switch between clean demo numbers
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveStoreProfile} className="space-y-4 text-xs">
              {/* Store Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Store / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editStoreForm.name || ''}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Phone Number Field & 1-Click Quick Presets */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 font-bold">
                    Connected WhatsApp Phone Number *
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">Live Ingestion ID</span>
                </div>

                <input
                  type="text"
                  required
                  value={editStoreForm.phone || ''}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, phone: e.target.value })}
                  placeholder="+20 113 204 4823"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />

                {/* 1-Click User Primary Number Preset Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditStoreForm({
                        ...editStoreForm,
                        phone: PRIMARY_LIVE_DEMO_PHONE,
                        vodafoneCash: PRIMARY_LIVE_DEMO_RAW,
                        instapay: `${PRIMARY_LIVE_DEMO_RAW}@instapay`,
                      });
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Set Primary Live Project Number ({PRIMARY_LIVE_DEMO_PHONE})</span>
                  </button>
                </div>

                {/* Demo Number Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 block">Or select a clean demo number:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '+20 100 000 0001 (Pizza)', num: '+20 100 000 0001' },
                      { label: '+20 100 000 0002 (Burger)', num: '+20 100 000 0002' },
                      { label: `${PRIMARY_LIVE_DEMO_PHONE} (Primary)`, num: PRIMARY_LIVE_DEMO_PHONE },
                      { label: '+20 100 000 0004 (Apparel)', num: '+20 100 000 0004' },
                      { label: '+20 100 000 0005 (Kicks)', num: '+20 100 000 0005' },
                    ].map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setEditStoreForm({ ...editStoreForm, phone: p.num })}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-700/60 font-mono cursor-pointer transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tagline & Value Proposition</label>
                <input
                  type="text"
                  value={editStoreForm.tagline || ''}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Digital Wallets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mobile Digital Wallet</label>
                  <input
                    type="text"
                    value={editStoreForm.vodafoneCash || ''}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, vodafoneCash: e.target.value })}
                    placeholder={PRIMARY_LIVE_DEMO_RAW}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Instant Bank Transfer (InstaPay)</label>
                  <input
                    type="text"
                    value={editStoreForm.instapay || ''}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, instapay: e.target.value })}
                    placeholder="account@instapay"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Prep time (if restaurant) */}
              {activeStore.category === 'restaurant' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Kitchen Prep Time</label>
                  <input
                    type="text"
                    value={editStoreForm.prepTime || '20 - 25 mins'}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, prepTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Policy */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Customer Guarantee & Inspection Policy</label>
                <textarea
                  rows={2}
                  value={editStoreForm.policy || ''}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, policy: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditStoreModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes & Sync AI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: Add / Edit Product or Menu Item */}
      {/* ========================================================================= */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowItemModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                {isRestaurant ? <Utensils className="w-4 h-4" /> : <Shirt className="w-4 h-4" />}
              </span>
              <h3 className="text-lg font-bold text-white">
                {editingItemIndex !== null ? 'Edit Catalog Item' : isRestaurant ? 'Add New Menu Item' : 'Add New Product'}
              </h3>
            </div>

            <form onSubmit={handleSaveItemModal} className="space-y-4 text-xs">
              {/* Item Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Item Title / Product Name *</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder={isRestaurant ? 'e.g., Pepperoni Supreme Stuffed Crust Pizza' : 'e.g., Nike Dunk Low Retro Panda'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category & Base Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category / Tag *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    placeholder={isRestaurant ? 'Pizzas / Burgers / Pastas' : 'Sneakers / Streetwear / Pants'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Base Price (USD $) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Image URL & Thumbnail Preview */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Product Photo URL (Image URL)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  {itemForm.imageUrl && (
                    <img
                      src={itemForm.imageUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Restaurant Specific Fields: Portion Sizes & Addons */}
              {isRestaurant && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                  <span className="font-bold text-amber-400 block text-xs">🍕 F&B Meal Sizes & Add-on Pricing:</span>

                  {/* Portion Sizes */}
                  <div className="space-y-2">
                    <label className="text-slate-300 block text-[11px] font-medium">Meal Sizes & Tiered Pricing (Single, Combo, Family):</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Single Portion:</span>
                        <input
                          type="number"
                          value={itemForm.portionSizes[0]?.price || itemForm.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...itemForm.portionSizes];
                            updated[0] = { size: 'Single', price: val };
                            setItemForm({ ...itemForm, portionSizes: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Combo (+Fries/Can):</span>
                        <input
                          type="number"
                          value={itemForm.portionSizes[1]?.price || Number(itemForm.price) + 45}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...itemForm.portionSizes];
                            updated[1] = { size: 'Combo (+ Fries & Drink)', price: val };
                            setItemForm({ ...itemForm, portionSizes: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Family Party Box:</span>
                        <input
                          type="number"
                          value={itemForm.portionSizes[2]?.price || Number(itemForm.price) * 2}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...itemForm.portionSizes];
                            updated[2] = { size: 'Family Box', price: val };
                            setItemForm({ ...itemForm, portionSizes: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add-ons & Prep Time */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-slate-300 block text-[11px] font-medium mb-1">Kitchen Preparation Time:</label>
                      <input
                        type="text"
                        value={itemForm.prepTime || '20 - 25 mins'}
                        onChange={(e) => setItemForm({ ...itemForm, prepTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={itemForm.isSpicy}
                          onChange={(e) => setItemForm({ ...itemForm, isSpicy: e.target.checked })}
                          className="rounded text-amber-500"
                        />
                        <span>Spicy Option Available 🌶️</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Retail Specific: Sizes & Colors */}
              {!isRestaurant && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 block text-xs">👟 Footwear & Apparel Options:</span>
                  <div className="text-slate-300 text-[11px]">
                    Available Sizes: <strong className="text-white">{itemForm.sizes.join(', ')}</strong>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Colorways: <strong className="text-white">{itemForm.colors.join(', ')}</strong>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Product Description & Materials</label>
                <textarea
                  rows={2}
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Artisanal ingredients, fabric weight, or cushioning details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Deploy Live</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. WIZARD: Simple 3-Step Store Setup Guide */}
      {/* ========================================================================= */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowWizard(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Progress Header */}
            <div className="mb-6">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                New Store Setup Wizard (3 Quick Steps)
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                {wizardStep === 1 && 'Step 1: Store Type & Brand Identity'}
                {wizardStep === 2 && 'Step 2: Catalog Template & Logistics'}
                {wizardStep === 3 && 'Step 3: Webhook Binding & Launch'}
              </h3>

              {/* Progress Steps Dots */}
              <div className="flex items-center gap-2 mt-3">
                {[1, 2, 3].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      stepNum <= wizardStep ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Store Type & Identity */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-2">Industry Sector:</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setWizardData({ ...wizardData, category: 'restaurant', preset: 'pizza' })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        wizardData.category === 'restaurant'
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Utensils className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                      <span>F&B & Restaurant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWizardData({ ...wizardData, category: 'sneakers', preset: 'sneakers' })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        wizardData.category === 'sneakers'
                          ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Footprints className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                      <span>Footwear / Kicks</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWizardData({ ...wizardData, category: 'clothing', preset: 'clothing' })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        wizardData.category === 'clothing'
                          ? 'bg-indigo-500/20 border-indigo-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Shirt className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
                      <span>Apparel & Fashion</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Store / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={wizardData.name}
                    onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                    placeholder={wizardData.category === 'restaurant' ? 'e.g., Napoli Artisan Pizza' : 'e.g., Downtown Sneaker Vault'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    WhatsApp Phone Number *
                    <span className="text-[10px] text-slate-500 font-normal ml-1.5">(Independent number per tenant)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={wizardData.phone}
                    onChange={(e) => setWizardData({ ...wizardData, phone: e.target.value })}
                    placeholder={PRIMARY_LIVE_DEMO_PHONE}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Marketing Tagline</label>
                  <input
                    type="text"
                    value={wizardData.tagline}
                    onChange={(e) => setWizardData({ ...wizardData, tagline: e.target.value })}
                    placeholder="Artisanal meals prepared fresh with fast delivery"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    disabled={!wizardData.name.trim()}
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue to Step 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Catalog Preset & Details */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-2">Select Initial Catalog Template:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {wizardData.category === 'restaurant' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setWizardData({ ...wizardData, preset: 'pizza' })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            wizardData.preset === 'pizza'
                              ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="block font-bold text-amber-300">🍕 Pizza & Pastas Template</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">Includes Single, Combo, and cheese add-ons</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWizardData({ ...wizardData, preset: 'burger' })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            wizardData.preset === 'burger'
                              ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="block font-bold text-amber-300">🍔 Smash Burgers & Fries</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">Angus beef burgers, bacon, loaded fries</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setWizardData({ ...wizardData, preset: 'sneakers' })}
                          className="p-3 rounded-xl border border-emerald-500 bg-emerald-500/20 text-white font-bold text-left cursor-pointer"
                        >
                          <span className="block font-bold text-emerald-300">👟 Master-Quality Sneakers</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">Sizes 40-46 with inspect-before-pay policy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWizardData({ ...wizardData, preset: 'blank' })}
                          className="p-3 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 text-left hover:text-white cursor-pointer"
                        >
                          <span className="block font-bold text-slate-200">✨ Blank Custom Catalog</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">Start with an empty catalog to build yourself</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {wizardData.category === 'restaurant' && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Expected Kitchen Prep Time:</label>
                    <input
                      type="text"
                      value={wizardData.prepTime}
                      onChange={(e) => setWizardData({ ...wizardData, prepTime: e.target.value })}
                      placeholder="20 - 25 mins"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fulfillment Headquarters & Zone:</label>
                  <input
                    type="text"
                    value={wizardData.location}
                    onChange={(e) => setWizardData({ ...wizardData, location: e.target.value })}
                    placeholder="Central Hub & Metropolitan Delivery"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue to Step 3</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Connect & Launch */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Store Configuration Ready!</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Your isolated tenant webhook endpoint has been generated automatically. Paste this URL into your Green API instance or Meta WhatsApp Cloud API console:
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 select-all break-all">
                    {currentDomain}/webhook/{wizardData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'new-store'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateStoreSubmit}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Activate Store & Launch AI Agent 🚀</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
