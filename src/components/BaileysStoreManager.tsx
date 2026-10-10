import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Send,
  Save,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Server,
  Package,
  Layers,
  PhoneCall,
  Sparkles,
  ShoppingBag,
  FileSpreadsheet,
  Users,
  CreditCard,
  Check,
  Calendar,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  category: 'clothes' | 'sneakers';
  price: number;
  currency: string;
  sizes: string[];
  colors: string[];
  description: string;
  in_stock: boolean;
  sku?: string;
}

interface BaileysStatus {
  state: 'idle' | 'connecting' | 'qr_ready' | 'connected' | 'disconnected';
  qrCodeUrl: string | null;
  qrRaw: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  lastConnectedAt: number | null;
  lastError: string | null;
  ownerPhone: string;
  uptimeSeconds: number;
}

interface ClientRecord {
  id: string;
  storeName: string;
  category: string;
  ownerPhone: string;
  catalogSource: {
    type: string;
    filePath?: string;
    googleSheetUrl?: string;
    syncedItemCount?: number;
  };
  subscription: {
    planName: string;
    monthlyFeeEgp: number;
    status: string;
    startDate: string;
    renewalDate: string;
  };
}

export const BaileysStoreManager: React.FC = () => {
  const [status, setStatus] = useState<BaileysStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [ownerPhone, setOwnerPhone] = useState<string>('201132044823');
  const [savingPhone, setSavingPhone] = useState<boolean>(false);
  const [testingAlert, setTestingAlert] = useState<boolean>(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Clients & Onboarding State
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);
  const [syncingSheet, setSyncingSheet] = useState<boolean>(false);
  const [sheetUrlInput, setSheetUrlInput] = useState<string>('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [onboardForm, setOnboardForm] = useState({
    storeName: '',
    category: 'clothing',
    ownerPhone: '201',
    catalogSourceType: 'google_sheet' as 'google_sheet' | 'json_file',
    googleSheetUrl: '',
    monthlyFeeEgp: 1500,
  });

  const [newProductForm, setNewProductForm] = useState<Partial<ProductItem>>({
    name: '',
    category: 'clothes',
    price: 450,
    currency: 'EGP',
    sizes: ['M', 'L', 'XL'],
    colors: ['أسود'],
    description: '',
    in_stock: true,
  });

  // Fetch Baileys status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/baileys/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.ownerPhone) {
          setOwnerPhone(data.ownerPhone);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Baileys status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch products from products.json
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch Onboarded Clients
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/onboarding/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchProducts();
    fetchClients();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Reconnect Baileys
  const handleReconnect = async () => {
    try {
      setLoadingStatus(true);
      await fetch('/api/baileys/reconnect', { method: 'POST' });
      setTimeout(fetchStatus, 1500);
    } catch (err) {
      console.error('Failed to reconnect:', err);
    }
  };

  // Logout Baileys
  const handleLogout = async () => {
    if (!window.confirm('هل تريد تأكيد تسجيل الخروج ومسح جلسة الواتساب؟ ستحتاج لمسح الرمز مرة أخرى.')) return;
    try {
      setLoadingStatus(true);
      await fetch('/api/baileys/logout', { method: 'POST' });
      setTimeout(fetchStatus, 1000);
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  // Save Owner Phone
  const handleSaveOwnerPhone = async () => {
    try {
      setSavingPhone(true);
      const res = await fetch('/api/owner-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: ownerPhone }),
      });
      if (res.ok) {
        setAlertSuccess('تم حفظ رقم صاحب المحل بنجاح');
        setTimeout(() => setAlertSuccess(null), 3000);
      }
    } catch (err) {
      setAlertError('فشل حفظ رقم الهاتف');
    } finally {
      setSavingPhone(false);
    }
  };

  // Send Test Notification
  const handleTestAlert = async () => {
    try {
      setTestingAlert(true);
      setAlertSuccess(null);
      setAlertError(null);
      const res = await fetch('/api/baileys/test-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerPhone,
          customerName: 'أحمد محمود',
          customerPhone: '01012345678',
          deliveryAddress: 'القاهرة - المعادي - شارع 9',
          items: [
            {
              name: 'هودي أوفر سايز ريفليكتف',
              quantity: 1,
              size: 'XL',
              price: 650,
            },
          ],
          totalEstimated: 650,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(data.message || 'تم إرسال رسالة التنبيه بنجاح إلى هاتفك!');
      } else {
        setAlertError(data.error || 'فشل إرسال رسالة التنبيه');
      }
    } catch (err: any) {
      setAlertError('خطأ في الاتصال بالسيرفر');
    } finally {
      setTestingAlert(false);
      setTimeout(() => {
        setAlertSuccess(null);
        setAlertError(null);
      }, 5000);
    }
  };

  // Sync Google Sheets
  const handleSyncGoogleSheet = async (urlToSync?: string) => {
    const targetUrl = urlToSync || sheetUrlInput;
    if (!targetUrl) return;
    try {
      setSyncingSheet(true);
      const res = await fetch('/api/onboarding/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(data.message || 'تمت مزامنة المنتجات من شيت جوجل بنجاح!');
        fetchProducts();
        fetchClients();
      } else {
        setAlertError(data.error || 'تعذرت المزامنة، تأكد من أن الشيت متاح للقراءة العامة');
      }
    } catch (e) {
      setAlertError('خطأ في الاتصال أثناء المزامنة');
    } finally {
      setSyncingSheet(false);
      setTimeout(() => setAlertSuccess(null), 4000);
    }
  };

  // Register New Client
  const handleRegisterClient = async () => {
    if (!onboardForm.storeName || !onboardForm.ownerPhone) return;
    try {
      const res = await fetch('/api/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(data.message || 'تم تسجيل العميل بنجاح');
        setShowOnboardModal(false);
        fetchClients();
        fetchProducts();
      } else {
        setAlertError(data.error || 'فشل تسجيل العميل');
      }
    } catch (e) {
      setAlertError('خطأ في الاتصال بالسيرفر');
    }
  };

  // Save edited product
  const handleSaveProduct = async (prod: ProductItem) => {
    try {
      const res = await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod),
      });
      if (res.ok) {
        setEditingProduct(null);
        fetchProducts();
        setAlertSuccess('تم تعديل المنتج بنجاح في products.json');
        setTimeout(() => setAlertSuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add new product
  const handleAddProduct = async () => {
    if (!newProductForm.name || !newProductForm.price) return;
    try {
      const res = await fetch('/api/products/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewProductForm({
          name: '',
          category: 'clothes',
          price: 450,
          currency: 'EGP',
          sizes: ['M', 'L', 'XL'],
          colors: ['أسود'],
          description: '',
          in_stock: true,
        });
        fetchProducts();
        setAlertSuccess('تمت إضافة المنتج الجديد إلى products.json');
        setTimeout(() => setAlertSuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذا المنتج من الكتالوج؟')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isConnected = status?.state === 'connected';

  return (
    <div className="space-y-8" dir="rtl">
      {/* Alert Banner */}
      {alertSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-sm">{alertSuccess}</span>
        </div>
      )}

      {alertError && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-semibold text-sm">{alertError}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/60 rounded-2xl border border-emerald-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                المتجر النشط: HBB Store
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                العملة: جنيه مصري (EGP)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                محرك Baileys (1GB RAM Friendly)
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              نظام HBB Store الموحد لإدارة الواتساب وحجز الأوردرات (RADDAD AI)
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              تم تثبيت المتجر حصرياً على <strong className="text-white">HBB Store</strong>، بالعامية المصرية والجنيه المصري. يقرأ الكتالوج من <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs">products.json</code> أو عبر المزامنة الحية من Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>تسجيل عميل جديد (SaaS Onboarding)</span>
            </button>
            <a
              href="/qr"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح شاشة المسح المستقلة (/qr)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Baileys Connection & Order Alert Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: WhatsApp Baileys QR Code (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">ربط رقم الواتساب لـ HBB Store</h2>
                  <p className="text-xs text-slate-400">جلسة Baileys الخفيفة بدون متصفح ثقيل</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : status?.state === 'qr_ready' ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                />
                <span className="text-xs font-bold text-slate-300">
                  {isConnected
                    ? 'متصل بنشاط'
                    : status?.state === 'qr_ready'
                    ? 'جاهز للمسح'
                    : status?.state === 'connecting'
                    ? 'جاري التحضير...'
                    : 'غير متصل'}
                </span>
              </div>
            </div>

            {/* QR Box / Connected Box */}
            <div className="my-2 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 min-h-[300px]">
              {isConnected ? (
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">واتساب HBB Store متصل بنجاح!</h3>
                    <p className="text-sm font-mono text-emerald-400 dir-ltr mt-1">
                      +{status?.connectedPhone}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {status?.connectedName || 'HBB Store'}
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      استقبال رسائل وفويسات العملاء 24/7
                    </span>
                  </div>
                </div>
              ) : status?.state === 'qr_ready' && status?.qrCodeUrl ? (
                <div className="text-center space-y-3">
                  <div className="p-3 bg-white rounded-xl shadow-2xl inline-block">
                    <img
                      src={status.qrCodeUrl}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 block rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200">
                      امسح الرمز من تطبيق واتساب لربط HBB Store
                    </p>
                    <p className="text-xs text-slate-400">
                      (الرمز مطبوع أيضاً في الـ Terminal للمعاينة السريعة)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 py-8">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-sm text-slate-300 font-semibold">
                    جاري تجهيز محرك Baileys وتوليد الرمز...
                  </p>
                  <p className="text-xs text-slate-500">
                    استهلاك الذاكرة ~35 ميجابايت فقط
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 space-y-1 leading-relaxed">
              <p className="font-bold text-slate-200">📱 خطوات الربط:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                <li>افتح تطبيق WhatsApp على هاتف المتجر.</li>
                <li>القائمة (⋮) أو الإعدادات ⬅️ الأجهزة المرتبطة (Linked Devices).</li>
                <li>اضغط على "ربط جهاز" ووجّه الكاميرا نحو الرمز أعلاه.</li>
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={handleReconnect}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث الرمز</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل خروج</span>
            </button>
          </div>
        </div>

        {/* Right Column: Store Owner Phone & Notification Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">إشعار وفلو "تأكيد الطلب" لصاحب المحل</h2>
                  <p className="text-xs text-slate-400">تنبيه فوري بالجنيه المصري يرسل لرقمك الشخصي عند قفل الحجز</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% جنيه مصري EGP
              </span>
            </div>

            {/* Owner Phone Input Box */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 mb-5">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم تليفون صاحب المحل (الذي يستقبل إشعارات الحجز):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="201012345678"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <button
                  onClick={handleSaveOwnerPhone}
                  disabled={savingPhone}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>{savingPhone ? 'جاري الحفظ...' : 'حفظ الرقم'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                * اكتب الرقم مسبوقاً بكود مصر 20 (مثال: 201132044823).
              </p>
            </div>

            {/* Exact Notification Format Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  صيغة رسالة التنبيه المعتمدة لـ HBB Store:
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  RADDAD AI Template
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 font-sans text-xs text-slate-200 leading-relaxed shadow-inner">
                <p className="font-bold text-emerald-400 text-sm mb-2">
                  🚨 طلب جديد محجوز عبر RADDAD AI!
                </p>
                <div className="space-y-1 text-slate-300">
                  <p>👤 <strong>العميل:</strong> أحمد محمود</p>
                  <p>📞 <strong>رقم العميل:</strong> +201012345678</p>
                  <p>📍 <strong>العنوان:</strong> القاهرة - المعادي - شارع 9</p>
                  <p>🛒 <strong>الطلبات:</strong></p>
                  <div className="pr-4 text-emerald-300">
                    • هودي أوفر سايز ريفليكتف (عدد 1) | مقاس: XL | لون: أسود فاحم
                  </div>
                  <p className="pt-1 font-bold text-white">💰 <strong>الإجمالي:</strong> 650 جنيه مصري</p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              ارسل رسالة التنبيه المعتمدة لتجربتها على واتساب فوراً:
            </span>
            <button
              onClick={handleTestAlert}
              disabled={testingAlert}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingAlert ? 'جاري الإرسال...' : 'إرسال تنبيه تجريبي لهاتفك الآن'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Sync Module & Products Editor */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">
                مزامنة الكتالوج عبر Google Sheets & ملف products.json
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              يمكنك ربط شيت جوجل الخاص بمتجر HBB Store ليتم تحديث الأسعار والمخزون بالجنيه المصري تلقائياً دون لمس الكود.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>إضافة منتج يدوياً</span>
            </button>
          </div>
        </div>

        {/* Google Sheet Live Sync Box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={sheetUrlInput}
              onChange={(e) => setSheetUrlInput(e.target.value)}
              placeholder="ضع رابط شيت جوجل هنا (Google Sheets Public Link)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
              dir="ltr"
            />
          </div>
          <button
            onClick={() => handleSyncGoogleSheet()}
            disabled={syncingSheet}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingSheet ? 'animate-spin' : ''}`} />
            <span>{syncingSheet ? 'جاري المزامنة...' : 'مزامنة الكتالوج الآن من الشيت'}</span>
          </button>
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            <span>جاري تحميل المنتجات...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((item) => {
              const isEditing = editingProduct?.id === item.id;
              const prod = isEditing ? editingProduct : item;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {item.category === 'sneakers' ? '👟 سنيكرز وكوتشيات' : '👕 ملابس شبابي'}
                      </span>
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        {item.price} جنيه مصري
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <input
                          type="text"
                          value={prod.name}
                          onChange={(e) =>
                            setEditingProduct({ ...prod, name: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          placeholder="اسم المنتج"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={prod.price}
                            onChange={(e) =>
                              setEditingProduct({ ...prod, price: Number(e.target.value) })
                            }
                            className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            placeholder="السعر"
                          />
                          <input
                            type="text"
                            value={prod.sizes.join(', ')}
                            onChange={(e) =>
                              setEditingProduct({
                                ...prod,
                                sizes: e.target.value.split(',').map((s) => s.trim()),
                              })
                            }
                            className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            placeholder="المقاسات (بفاصلة)"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-white text-sm leading-snug">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-400">المقاسات:</span>
                      {item.sizes.map((sz) => (
                        <span
                          key={sz}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                        >
                          {sz}
                        </span>
                      ))}
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-slate-400">
                      <span>الألوان:</span>
                      <span className="text-slate-300 font-medium">
                        {item.colors.join(' • ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-900 mt-2">
                    <span
                      className={`text-[10px] font-bold ${
                        item.in_stock ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {item.in_stock ? '● متاح بالمخزن' : '○ غير متاح'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveProduct(prod)}
                          className="p-1.5 rounded bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>حفظ</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingProduct(item)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(item.id)}
                        className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarded Clients & Subscription Management Panel */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                إدارة عملاء الـ SaaS والاشتراكات الشهرية (Onboarding Engine)
              </h3>
              <p className="text-xs text-slate-400">
                تسجيل المتاجر وتخصيص جلسات Baileys ومصادر الكتالوج لكل عميل
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {clients.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{c.storeName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  {c.subscription.status === 'active' ? 'نشط' : 'تجريبي'}
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <p>📞 رقم صاحب المحل: <span className="font-mono text-emerald-400">+{c.ownerPhone}</span></p>
                <p>📦 مصدر الكتالوج: <span className="text-indigo-400 font-semibold">{c.catalogSource.type === 'google_sheet' ? 'شيت جوجل مباشر' : 'ملف products.json'}</span></p>
                <p>💰 الاشتراك الشهري: <span className="font-bold text-white">{c.subscription.monthlyFeeEgp} جنيه/شهر</span></p>
                <p>📅 تاريخ التجديد: <span className="text-slate-400">{c.subscription.renewalDate}</span></p>
              </div>
              <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 font-mono">ID: {c.id}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`/qr?store=${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title={`عرض QR Code الخاص بـ ${c.storeName}`}
                  >
                    <QrCode className="w-3 h-3 text-emerald-400" />
                    <span>رمز QR المحل</span>
                  </a>
                  {c.catalogSource.googleSheetUrl && (
                    <button
                      onClick={() => handleSyncGoogleSheet(c.catalogSource.googleSheetUrl)}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>مزامنة</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding New Client Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">تسجيل متجر جديد في نظام RADDAD AI</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم المتجر / البراند:</label>
                <input
                  type="text"
                  value={onboardForm.storeName}
                  onChange={(e) => setOnboardForm({ ...onboardForm, storeName: e.target.value })}
                  placeholder="مثال: البرنس ستور"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم هاتف صاحب المحل (لتنبيهات الأوردرات):</label>
                <input
                  type="text"
                  value={onboardForm.ownerPhone}
                  onChange={(e) => setOnboardForm({ ...onboardForm, ownerPhone: e.target.value })}
                  placeholder="201012345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">النشاط / النيش:</label>
                  <select
                    value={onboardForm.category}
                    onChange={(e) => setOnboardForm({ ...onboardForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="clothing">ملابس وأزياء</option>
                    <option value="sneakers">كوتشيات وسنيكرز</option>
                    <option value="electronics">إلكترونيات وموبايل</option>
                    <option value="perfumes">عطور ومستحضرات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">قيمة الاشتراك الشهري (EGP):</label>
                  <input
                    type="number"
                    value={onboardForm.monthlyFeeEgp}
                    onChange={(e) => setOnboardForm({ ...onboardForm, monthlyFeeEgp: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">مصدر بيانات المنتجات والأسعار:</label>
                <select
                  value={onboardForm.catalogSourceType}
                  onChange={(e) => setOnboardForm({ ...onboardForm, catalogSourceType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="google_sheet">شيت جوجل مباشر (Google Sheets Sync)</option>
                  <option value="json_file">ملف JSON محلي (Local File)</option>
                </select>
              </div>

              {onboardForm.catalogSourceType === 'google_sheet' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">رابط Google Sheet الخاص بالعميل:</label>
                  <input
                    type="text"
                    value={onboardForm.googleSheetUrl}
                    onChange={(e) => setOnboardForm({ ...onboardForm, googleSheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">يجب أن يكون الشيت متاح للقراءة العامة (Anyone with link can view)</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowOnboardModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleRegisterClient}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                تسجيل المتجر وبدء الاشتراك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">إضافة منتج جديد لكتالوج HBB Store</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم المنتج:</label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  placeholder="مثال: سويت شيرت ميلتون تقيل"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">القسم:</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, category: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="clothes">ملابس شبابي</option>
                    <option value="sneakers">كوتشيات وسنيكرز</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">السعر (جنيه مصري):</label>
                  <input
                    type="number"
                    value={newProductForm.price}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, price: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  المقاسات المتاحة (افصل بينها بفاصلة):
                </label>
                <input
                  type="text"
                  value={newProductForm.sizes?.join(', ')}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      sizes: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  placeholder="M, L, XL, XXL أو 41, 42, 43"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  الألوان (افصل بينها بفاصلة):
                </label>
                <input
                  type="text"
                  value={newProductForm.colors?.join(', ')}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      colors: e.target.value.split(',').map((c) => c.trim()),
                    })
                  }
                  placeholder="أسود, رمادي, أبيض"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">وصف المنتج:</label>
                <textarea
                  rows={2}
                  value={newProductForm.description}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, description: e.target.value })
                  }
                  placeholder="خامة قطن ميلتون 100%، تقفيل عالي الجودة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                حفظ وإضافة للملف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
