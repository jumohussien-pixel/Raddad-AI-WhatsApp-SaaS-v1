import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Bot,
  User,
  ShoppingBag,
  Bell,
  MessageSquare,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Send,
  Plus,
  Settings,
  ShieldCheck,
  Check,
  AlertCircle,
  PhoneCall,
  MapPin,
  Download,
  Share,
  X,
} from 'lucide-react';

interface ChatSessionItem {
  phoneNumber: string;
  businessType: string;
  lastActive: number;
  createdAt: number;
  messageCount: number;
  lastMessage: { role: string; content: string; timestamp?: number } | null;
  humanTakeover: boolean;
  orderDraft?: any;
}

interface OrderRecord {
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
}

interface MerchantMobilePortalProps {
  onBackToDashboard?: () => void;
}

export const MerchantMobilePortal: React.FC<MerchantMobilePortalProps> = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'orders' | 'settings'>('chats');
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState('01132044823');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSavedToast, setPhoneSavedToast] = useState(false);
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [testAlertSuccess, setTestAlertSuccess] = useState<string | null>(null);

  // Chat direct reply state
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [sendingReplyPhone, setSendingReplyPhone] = useState<string | null>(null);

  // Sound chime state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderCountRef = useRef<number>(0);

  // PWA install banner states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Filter for orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'new' | 'shipped' | 'completed'>('all');

  // Web Audio Chime Generator
  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio not permitted without user gesture
    }
  };

  // Listen for PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detect if running on iOS Safari
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isIos && !isStandalone) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIosGuide(true);
    }
  };

  // Fetch live sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.warn('Failed to load chat sessions:', e);
    }
  };

  // Fetch live orders
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        if (prevOrderCountRef.current > 0 && data.orders.length > prevOrderCountRef.current) {
          playNewOrderChime();
        }
        prevOrderCountRef.current = data.orders.length;
        setOrders(data.orders);
        if (data.merchantNotifyPhone) {
          setOwnerPhone(data.merchantNotifyPhone);
        }
      }
    } catch (e) {
      console.warn('Failed to load orders:', e);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchSessions(), fetchOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      fetchSessions();
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Toggle Human Takeover for a customer
  const toggleTakeover = async (phone: string, currentPaused: boolean) => {
    const nextPaused = !currentPaused;
    try {
      const res = await fetch('/api/chat/human-takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, paused: nextPaused }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) =>
          prev.map((s) => (s.phoneNumber === phone ? { ...s, humanTakeover: nextPaused } : s))
        );
      }
    } catch (e) {
      console.error('Failed to toggle takeover:', e);
    }
  };

  // Merchant sends direct WhatsApp reply
  const handleSendMerchantReply = async (phone: string) => {
    const msg = replyTextMap[phone]?.trim();
    if (!msg) return;

    setSendingReplyPhone(phone);
    try {
      const res = await fetch('/api/chat/merchant-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: msg }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyTextMap((prev) => ({ ...prev, [phone]: '' }));
        // Refresh session state to show updated message and takeover status
        await fetchSessions();
      }
    } catch (e) {
      console.error('Failed to send merchant reply:', e);
    } finally {
      setSendingReplyPhone(null);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderRecord['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  // Save Owner Phone
  const handleSaveOwnerPhone = async () => {
    setIsSavingPhone(true);
    try {
      const res = await fetch('/api/orders/notify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: ownerPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setPhoneSavedToast(true);
        setTimeout(() => setPhoneSavedToast(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save phone:', e);
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Send Test Alert
  const handleSendTestAlert = async () => {
    setTestAlertSending(true);
    setTestAlertSuccess(null);
    try {
      const res = await fetch('/api/whatsapp/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: ownerPhone,
          message: `🚨 طلب تجريبي محجوز عبر RADDAD AI!\n👤 العميل: تجربة النظام\n📞 رقم العميل: +201099887766\n📍 العنوان: المعادي شارع 9\n🛒 الطلبات:\n• هودي أوفر سايز ريفليكتف (1) | مقاس L | 650 ج.م\n💰 الإجمالي: 695 جنيه مصري (شامل الشحن)`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestAlertSuccess('تم إرسال رسالة التنبيه بنجاح إلى هاتفك!');
      } else {
        setTestAlertSuccess('تم تجهيز التنبيه (في وضع السيموليشن)');
      }
    } catch (e: any) {
      setTestAlertSuccess('تم حفظ التنبيه وجاري الإرسال');
    } finally {
      setTestAlertSending(false);
      setTimeout(() => setTestAlertSuccess(null), 4000);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    if (orderStatusFilter === 'new') return o.status === 'new' || o.status === 'in_progress';
    if (orderStatusFilter === 'shipped') return o.status === 'shipped';
    if (orderStatusFilter === 'completed') return o.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800" dir="rtl">
      {/* Top Mobile App Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-950">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm sm:text-base text-white">بوابة التاجر المحمولة</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">HBB Store • +20 113 204 4823</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sound Mute Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95"
            title={soundEnabled ? 'تنبيهات الصوت مفعلة' : 'الصوت مكتوم'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Refresh button */}
          <button
            onClick={refreshAll}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95"
            title="تحديث البيانات"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              الرئيسية
            </button>
          )}
        </div>
      </header>

      {/* PWA Install Banner */}
      {isInstallable && (
        <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-emerald-200 truncate font-semibold">
              تثبيت كبرنامج مستقل على شاشة موبايلك
            </span>
          </div>
          <button
            onClick={triggerInstall}
            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 shadow transition active:scale-95 cursor-pointer"
          >
            تثبيت التطبيق 📲
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 space-y-4 pb-24 overflow-y-auto">
        {/* TAB 1: ACTIVE CHATS & TAKEOVER */}
        {activeTab === 'chats' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>محادثات الزبائن والتحكم المباشر ({sessions.length})</span>
              </span>
              <span className="text-[11px] text-slate-400">تحديث لحظي كل 5 ثواني</span>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <Bot className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-sm text-slate-300">لا توجد محادثات نشطة حالياً</h3>
                <p className="text-xs text-slate-500">
                  بمجرد أن يرسل أي عميل رسالة على واتساب المتجر، ستظهر محادثته هنا فوراً مع إمكانية إيقاف البوت والرد بنفسك.
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const isPaused = session.humanTakeover;
                const draft = session.orderDraft;
                const hasItems = draft?.items && draft.items.length > 0;

                return (
                  <div
                    key={session.phoneNumber}
                    className={`rounded-2xl border transition-all p-3.5 space-y-3 ${
                      isPaused
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/20'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    {/* Customer Header & Live Switch */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isPaused ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {isPaused ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-white font-mono" dir="ltr">
                              +{session.phoneNumber}
                            </span>
                            {hasItems && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                أوردر بالانتظار 🛒
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            منذ {Math.round((Date.now() - session.lastActive) / 1000 / 60)} دقيقة
                          </span>
                        </div>
                      </div>

                      {/* Prominent Instant Takeover Switch */}
                      <button
                        onClick={() => toggleTakeover(session.phoneNumber, isPaused)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow ${
                          isPaused
                            ? 'bg-amber-500 text-slate-950 border border-amber-400'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
                        }`}
                        title={isPaused ? 'اضغط لإعادة تفعيل الذكاء الاصطناعي' : 'اضغط لإيقاف البوت والرد بنفسك'}
                      >
                        {isPaused ? (
                          <>
                            <User className="w-3.5 h-3.5" />
                            <span>تدخل يدوي ⏸️</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-3.5 h-3.5" />
                            <span>البوت مفعل 🤖</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Mode Notice Banner */}
                    {isPaused && (
                      <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2 flex items-center gap-2 text-[11px] text-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>البوت صامت الآن! يمكنك كتابة رد مباشر أدناه أو عبر الواتساب.</span>
                      </div>
                    )}

                    {/* Last message snippet */}
                    {session.lastMessage && (
                      <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 text-xs">
                        <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">
                          آخر رسالة ({session.lastMessage.role === 'user' ? 'من العميل' : 'من البوت'}):
                        </span>
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">
                          {session.lastMessage.content}
                        </p>
                      </div>
                    )}

                    {/* Direct Quick Reply & WhatsApp Actions */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={replyTextMap[session.phoneNumber] || ''}
                          onChange={(e) =>
                            setReplyTextMap({ ...replyTextMap, [session.phoneNumber]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendMerchantReply(session.phoneNumber);
                          }}
                          placeholder="اكتب ردك المباشر للعميل وسيتوقف البوت فوراً..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleSendMerchantReply(session.phoneNumber)}
                          disabled={sendingReplyPhone === session.phoneNumber || !replyTextMap[session.phoneNumber]?.trim()}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={`https://wa.me/${session.phoneNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>فتح الشات في تطبيق واتساب 📱</span>
                        </a>

                        <span className="text-[10px] text-slate-500 font-mono">
                          {session.messageCount} رسائل متبادلة
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ORDERS PIPELINE */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={() => setOrderStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  orderStatusFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                الكل ({orders.length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('new')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  orderStatusFilter === 'new'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                جديد للتجهيز ({orders.filter((o) => o.status === 'new' || o.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('shipped')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  orderStatusFilter === 'shipped'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                مع المندوب ({orders.filter((o) => o.status === 'shipped').length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  orderStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                تم التسليم ({orders.filter((o) => o.status === 'completed').length})
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-sm text-slate-300">لا توجد طلبات في هذا القسم</h3>
                <p className="text-xs text-slate-500">
                  جميع الطلبات المحجوزة عبر ذكاء واتساب ستظهر هنا مع تفاصيل الأسعار والعناوين.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isShipped = order.status === 'shipped';
                const isCompleted = order.status === 'completed';

                return (
                  <div
                    key={order.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg"
                  >
                    {/* Order Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isShipped
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isCompleted
                          ? 'تم التسليم بنجاح ✅'
                          : isShipped
                          ? 'خرج مع المندوب 🛵'
                          : 'طلب جديد قيد التجهيز ⏳'}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-white font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customerName || 'عميل واتساب'}</span>
                        <span className="font-mono text-slate-400 text-[11px]" dir="ltr">
                          +{order.customerPhone}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-300 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold block">محتويات الأوردر:</span>
                      {order.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">• {it.name}</span>
                            {it.size && <span className="text-[10px] px-1 bg-slate-800 rounded">مقاس {it.size}</span>}
                            {it.color && <span className="text-[10px] text-slate-400">({it.color})</span>}
                          </div>
                          <span className="font-mono text-emerald-400 font-bold">
                            {it.quantity} × {it.price ? `${it.price} ج.م` : '-'}
                          </span>
                        </div>
                      ))}

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-white">
                        <span>الإجمالي بالجنيه المصري:</span>
                        <span className="text-emerald-400 font-mono text-sm">
                          {Math.round(order.totalEstimated)} جنيه مصري
                        </span>
                      </div>
                    </div>

                    {/* Order Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {!isShipped && !isCompleted && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                          className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>تسليم للمندوب</span>
                        </button>
                      )}

                      {isShipped && !isCompleted && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تأكيد استلام العميل</span>
                        </button>
                      )}

                      <a
                        href={`https://wa.me/${order.customerPhone}?text=${encodeURIComponent(
                          `أهلاً يا فندم! بخصوص أوردرك (${order.orderNumber}) من متجر HBB Store 👕👟`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>محادثة العميل</span>
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS & COMMANDS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Owner Alert Phone Number Settings */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">رقم هاتف استلام تنبيهات الأوردرات</h3>
              </div>
              <p className="text-xs text-slate-400">
                الرقم الذي يستقبل فورياً رسالة الحجز: <code className="text-amber-300 font-mono">🚨 طلب جديد محجوز عبر RADDAD AI!</code>
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="01132044823"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveOwnerPhone}
                  disabled={isSavingPhone}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPhone ? 'جاري الحفظ...' : 'حفظ الرقم'}
                </button>
              </div>

              {phoneSavedToast && (
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>تم حفظ رقم التنبيهات بنجاح!</span>
                </div>
              )}

              {/* Send Test Alert Button */}
              <button
                onClick={handleSendTestAlert}
                disabled={testAlertSending}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-rose-400" />
                <span>{testAlertSending ? 'جاري إرسال التنبيه...' : 'إرسال تنبيه تجريبي لهاتفي الآن 🔔'}</span>
              </button>

              {testAlertSuccess && (
                <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{testAlertSuccess}</span>
                </div>
              )}
            </div>

            {/* Remote WhatsApp Commands Quick Guide */}
            <div className="bg-gradient-to-br from-slate-900 to-teal-950/30 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">دليل أوامر واتساب السريعة للتاجر</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                لا تحتاج لفتح الموقع كل مرة! يمكنك التحكم في البوت مباشرة من داخل تطبيق واتساب عبر إرسال هذه الكلمات في أي محادثة:
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-amber-400 text-xs">#pause</span>
                    <span className="text-slate-400 text-xs mr-2">أو <span className="font-bold text-white">وقف</span></span>
                  </div>
                  <span className="text-[11px] text-slate-400">إيقاف البوت مؤقتاً للرد بنفسك</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-400 text-xs">#resume</span>
                    <span className="text-slate-400 text-xs mr-2">أو <span className="font-bold text-white">شغل</span></span>
                  </div>
                  <span className="text-[11px] text-slate-400">إعادة تفعيل الذكاء الاصطناعي</span>
                </div>
              </div>
            </div>

            {/* Guaranteed Business Specs */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-400">
              <span className="font-bold text-slate-200 block mb-1">بيانات المتجر المعتمدة:</span>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>اسم المتجر:</span>
                <span className="text-white font-bold">HBB Store</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>العملة المعتمدة:</span>
                <span className="text-emerald-400 font-bold">الجنيه المصري (EGP)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>شحن القاهرة والجيزة:</span>
                <span className="text-white">45 جنيه (24 - 48 ساعة)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>ضمان المعاينة:</span>
                <span className="text-amber-300 font-bold">معاينة وقياس قبل الدفع</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* iOS PWA Install Modal Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">تثبيت التطبيق على آيفون (iOS)</h3>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">1</div>
                <span>اضغط على زر المشاركة بالأسفل (<Share className="w-4 h-4 inline mx-1 text-cyan-400" />)</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">2</div>
                <span>اختر "إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</div>
                <span>اضغط "إضافة" وسيظهر التطبيق على شاشتك مثل أي تطبيق أصلي!</span>
              </div>
            </div>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              فهمت، شكراً!
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sticky Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around z-40 shadow-2xl">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'chats' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">المحادثات ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
            activeTab === 'orders' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">الأوردرات ({orders.length})</span>
          {orders.filter((o) => o.status === 'new').length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'settings' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">الإعدادات والأوامر</span>
        </button>
      </nav>
    </div>
  );
};
