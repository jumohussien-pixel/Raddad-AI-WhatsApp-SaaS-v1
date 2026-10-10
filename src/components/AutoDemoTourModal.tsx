/**
 * Auto-Play Interactive Product Tour Modal for Raddad AI WhatsApp SaaS Engine
 * 
 * Purpose:
 * Provides an automated, self-running sandbox demo for HBB Store (Youth Streetwear & Sneakers)
 * 100% Egyptian Arabic & EGP Standardization (جنيه مصري).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  X,
  FastForward,
  Shirt,
  Footprints,
  Smartphone,
  ExternalLink,
  Bot,
  User,
  Timer,
} from 'lucide-react';

interface AutoDemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  sender: 'user' | 'model';
  text: string;
  delayMs: number;
  highlightNote: string;
  extractedDraft?: {
    items: { name: string; sizeOrColor: string; quantity: number; price: number }[];
    address?: string;
    paymentMethod?: string;
    prepTime?: string;
    totalEstimated?: number;
    status: 'collecting' | 'ready_to_confirm' | 'confirmed';
  };
}

const HOODIE_TOUR_STEPS: TourStep[] = [
  {
    sender: 'user',
    text: 'مساء الخير يا غالي! متاح عندكم هوديز أوفر سايز؟ وعايز اعرف الأسعار لو سمحت',
    delayMs: 3000,
    highlightNote: 'الخطوة 1: العميل يستفسر بالعامية المصرية عن الهوديز والأسعار.',
  },
  {
    sender: 'model',
    text: 'مساء الورد يا فندم! 👕🔥 أهلاً بحضرتك في HBB Store لملابس الشباب العصرية.\n\nالمتاح عندنا حالياً بأعلى جودة:\n• هودي أوفر سايز ريفليكتف (ميلتون مصري تقيل): 650 جنيه مصري\n• تيشيرت أوفر سايز أسيد واش (Acid Wash): 380 جنيه مصري\n• بنطلون كارغو 6 جيوب ووتر بروف: 550 جنيه مصري\n\n🛡️ وميزتنا الذهبية: المعاينة والقياس مجانية مع المندوب قبل ما تدفع أي جنيه! تحب تختار موديل معين؟',
    delayMs: 4000,
    highlightNote: 'الخطوة 2: البوت يرحب ويعرض الأسعار بالجنيه المصري (EGP) ويؤكد ميزة المعاينة قبل الدفع.',
    extractedDraft: {
      items: [],
      status: 'collecting',
    },
  },
  {
    sender: 'user',
    text: 'طب أنا وزني 76 كجم وطولي 178 سم، أختار مقاس إيه في الهودي الريفليكتف عشان يجي أوفر سايز مظبوط؟',
    delayMs: 3000,
    highlightNote: 'الخطوة 3: العميل يشارك وزنه وطوله لطلب ترشيح المقاس المناسب.',
  },
  {
    sender: 'model',
    text: 'لوزن 76 كجم وطول 178، مقاس L هيكون تحفة جداً وستايله أوفر سايز مريح وشيك ستريت وير! 👕✨\n\nالألوان المتوفرة منه في المخزن:\n1. أسود فاحم (الأكثر طلباً)\n2. رمادي ميلتون\n3. بيج ترابي\n\nتحب نجهزلك أنهي لون يا غالي؟',
    delayMs: 4000,
    highlightNote: 'الخطوة 4: الذكاء الاصطناعي يرشح المقاس بدقة (L) ويعرض الألوان المتاحة في المخزن.',
  },
  {
    sender: 'user',
    text: 'عاش! جهزلي 1 هودي أسود فاحم مقاس L، وضيف عليه 1 بنطلون كارغو أسود مقاس 34. الشحن للمعادي هيتكلف كام؟',
    delayMs: 3500,
    highlightNote: 'الخطوة 5: العميل يختار القطع ويطلب حساب مصاريف الشحن لمنطقة المعادي.',
    extractedDraft: {
      items: [
        { name: 'هودي أوفر سايز ريفليكتف', sizeOrColor: 'مقاس L / أسود فاحم', quantity: 1, price: 650 },
        { name: 'بنطلون كارغو ووتر بروف', sizeOrColor: 'مقاس 34 / أسود مط', quantity: 1, price: 550 },
      ],
      totalEstimated: 1200,
      status: 'collecting',
    },
  },
  {
    sender: 'model',
    text: 'اختيار جامد جداً وتنسيق ألوان شيك أوي! 🔥👕\n\n🛵 تفاصيل الشحن للمعادي (القاهرة): 45 جنيه مصري فقط، وبيوصلك خلال 24 - 48 ساعة.\n💰 إجمالي الأوردر: 1200 + 45 شحن = 1245 جنيه مصري.\n\nالمندوب بينتظر مع حضرتك تقيس الهودي والكارغو قبل الدفع! ابعتلي اسم حضرتك والعنوان بالتفصيل ورقم الموبايل لنأكد الحجز فوراً.',
    delayMs: 4000,
    highlightNote: 'الخطوة 6: البوت يحسب رسوم شحن القاهرة (45 ج.م) والإجمالي بدقة ويطلب بيانات التوصيل.',
    extractedDraft: {
      items: [
        { name: 'هودي أوفر سايز ريفليكتف', sizeOrColor: 'مقاس L / أسود فاحم', quantity: 1, price: 650 },
        { name: 'بنطلون كارغو ووتر بروف', sizeOrColor: 'مقاس 34 / أسود مط', quantity: 1, price: 550 },
      ],
      paymentMethod: 'الدفع عند الاستلام بعد المعاينة والقياس (COD)',
      prepTime: 'تجهيز فوري (توصيل خلال 24 - 48 ساعة)',
      totalEstimated: 1245,
      status: 'ready_to_confirm',
    },
  },
  {
    sender: 'user',
    text: 'أحمد محمود - القاهرة المعادي، شارع 9 عمارة 14 الدور 3 - تليفوني 01012345678 - دفع كاش بعد المعاينة.',
    delayMs: 3500,
    highlightNote: 'الخطوة 7: العميل يؤكد الاسم، العنوان بالتفصيل، ورقم التليفون.',
  },
  {
    sender: 'model',
    text: 'ألف مبروك يا أستاذ أحمد! 🎉 تم تأكيد حجز طلبك بنجاح وجاري تجهيزه للشحن فوراً!\n\n📋 ملخص الأوردر المعتمد:\n• هودي أوفر سايز ريفليكتف (L - أسود) = 650 ج.م\n• بنطلون كارغو 6 جيوب (34 - أسود) = 550 ج.م\n• مصاريف الشحن (المعادي) = 45 ج.م\n💰 الإجمالي المطلوب: 1245 جنيه مصري\n📍 العنوان: القاهرة - المعادي، شارع 9 عمارة 14\n🛡️ الضمان: المعاينة والقياس متاحة ومجانية مع المندوب قبل الدفع + ضمان استبدال 14 يوماً.\n\n🚨 تم إرسال تنبيه فوري لصاحب المحل على واتساب لإخراج القطع من المخزن وتجهيز الشحنة!',
    delayMs: 5000,
    highlightNote: 'الخطوة 8: إتمام الأوردر وإرسال إشعار فوري لصاحب المحل على رقمه الشخصي.',
    extractedDraft: {
      items: [
        { name: 'هودي أوفر سايز ريفليكتف', sizeOrColor: 'مقاس L / أسود فاحم', quantity: 1, price: 650 },
        { name: 'بنطلون كارغو ووتر بروف', sizeOrColor: 'مقاس 34 / أسود مط', quantity: 1, price: 550 },
      ],
      address: 'القاهرة - المعادي، شارع 9 عمارة 14 الدور 3',
      paymentMethod: 'الدفع عند الاستلام بعد المعاينة والقياس',
      prepTime: 'شحن فوري خلال 24 - 48 ساعة',
      totalEstimated: 1245,
      status: 'confirmed',
    },
  },
];

const SNEAKERS_TOUR_STEPS: TourStep[] = [
  {
    sender: 'user',
    text: 'السلام عليكم، متاح عندكم كوتشي نايكي دانك باندا مقاس 43؟ وهل الخامة ماستر كواليتي؟',
    delayMs: 3000,
    highlightNote: 'الخطوة 1: العميل يستفسر عن كوتشي نايكي دانك باندا ومقاس 43.',
  },
  {
    sender: 'model',
    text: 'وعليكم السلام ورحمة الله وبركاته! 👟🔥 منورنا يا فندم في HBB Store.\n\nأيوة متوفر نايكي دانك لو باندا (Nike Dunk Panda) مقاس 43 ماستر كواليتي هاي إند مع البوكس الأصلي بـ 1250 جنيه مصري فقط!\n\n🛡️ ضمان HBB الذهبي: المندوب بيفتح الكرتونة وتشوف الجلد والنعل وتقيس الكوتشي براحتك قبل ما تدفع ولا مليم! تحب نجهزهولك؟',
    delayMs: 4000,
    highlightNote: 'الخطوة 2: البوت يؤكد توفر الكوتشي وسعره (1250 جنيه مصري) وميزة المعاينة قبل الدفع.',
    extractedDraft: {
      items: [{ name: 'سنيكرز نايكي دانك باندا', sizeOrColor: 'مقاس 43 / أبيض × أسود', quantity: 1, price: 1250 }],
      status: 'collecting',
    },
  },
  {
    sender: 'user',
    text: 'طب التلبيس بتاعه مظبوط ولا بياخد نمرة أكبر؟ وعايز اعرف الشحن لمدينة نصر كام؟',
    delayMs: 3000,
    highlightNote: 'الخطوة 3: استفسار عن دقة مقاسات الكوتشيات وتكلفة شحن مدينة نصر.',
  },
  {
    sender: 'model',
    text: 'تلبيس المقاسات مظبوط ومريح جداً True to Size بنعل طري ومريح للمشي والجامعة. ولو حبيت تقيس مقاس 43 ومقاس 44 مع المندوب متاح نبعتلك المقاسين للمعاينة! 👟✨\n\n🛵 الشحن لمدينة نصر: 45 جنيه مصري والتوصيل خلال 24 ساعة.\n💰 الإجمالي: 1250 + 45 = 1295 جنيه مصري.\n\nتحب نثبت حجز مقاس 43 باسم مين وعنوان إيه؟',
    delayMs: 4000,
    highlightNote: 'الخطوة 4: البوت يوضح ميزة إرسال مقاسين للمعاينة ويحسب إجمالي السعر بالجنيه المصري.',
  },
  {
    sender: 'user',
    text: 'حلو أوي العرض ده! اعتمد مقاس 43. الاسم: كريم سامي، العنوان: مدينة نصر - مكرم عبيد شارع هشام لبيب عمارة 8، التليفون: 01122334455، دفع عند الاستلام.',
    delayMs: 3500,
    highlightNote: 'الخطوة 5: العميل يؤكد الحجز والاسم والعنوان وطريقة الدفع.',
    extractedDraft: {
      items: [{ name: 'سنيكرز نايكي دانك باندا', sizeOrColor: 'مقاس 43 / أبيض × أسود', quantity: 1, price: 1250 }],
      address: 'القاهرة - مدينة نصر، مكرم عبيد شارع هشام لبيب عمارة 8',
      paymentMethod: 'الدفع عند الاستلام بعد المعاينة والقياس',
      prepTime: 'توصيل خلال 24 ساعة',
      totalEstimated: 1295,
      status: 'confirmed',
    },
  },
  {
    sender: 'model',
    text: 'تم تأكيد حجز السنيكرز يا كابتن كريم! 👟🎉\n\n📦 الكوتشي بالبوكس الأصلي محجوز باسمك وبيروح لشركة الشحن فوراً.\n💰 الإجمالي: 1295 جنيه مصري شامل الشحن والمعاينة والقياس مع المندوب.\n\n🚨 تم إرسال إشعار طلب فوري لرقم صاحب المحل الشخصي: +201132044823 للتنفيذ المباشر!',
    delayMs: 4500,
    highlightNote: 'الخطوة 6: إصدار تذكرة الحجز وإطلاق تنبيه الواتساب للتاجر فورياً.',
    extractedDraft: {
      items: [{ name: 'سنيكرز نايكي دانك باندا', sizeOrColor: 'مقاس 43 / أبيض × أسود', quantity: 1, price: 1250 }],
      address: 'القاهرة - مدينة نصر، مكرم عبيد شارع هشام لبيب عمارة 8',
      paymentMethod: 'الدفع عند الاستلام بعد المعاينة والقياس',
      prepTime: 'توصيل خلال 24 ساعة',
      totalEstimated: 1295,
      status: 'confirmed',
    },
  },
];

export const AutoDemoTourModal: React.FC<AutoDemoTourModalProps> = ({ isOpen, onClose }) => {
  const [selectedTrack, setSelectedTrack] = useState<'hoodies' | 'sneakers'>('hoodies');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [displayedMessages, setDisplayedMessages] = useState<{ sender: 'user' | 'model'; text: string }[]>([]);
  const [typingText, setTypingText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  const elapsedTimerRef = useRef<any>(null);

  const steps = selectedTrack === 'hoodies' ? HOODIE_TOUR_STEPS : SNEAKERS_TOUR_STEPS;
  const estimatedTotalSeconds = Math.round(70 / speedMultiplier);

  const restartTour = (track = selectedTrack) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    setSelectedTrack(track);
    setCurrentStepIndex(0);
    setDisplayedMessages([]);
    setTypingText('');
    setIsTyping(false);
    setCurrentDraft(null);
    setElapsedSeconds(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      return;
    }

    restartTour(selectedTrack);

    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isOpen]);

  // Handle ESC key press to close modal immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages, typingText]);

  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    if (currentStepIndex >= steps.length) {
      setIsPlaying(false);
      return;
    }

    const currentStep = steps[currentStepIndex];
    const typingDuration = Math.min(1800, currentStep.text.length * 20) / speedMultiplier;
    const adjustedStepDelay = currentStep.delayMs / speedMultiplier;

    setIsTyping(true);
    let charIndex = 0;
    const fullText = currentStep.text;
    const charInterval = typingDuration / Math.max(1, fullText.length);

    const typeTimer = setInterval(() => {
      charIndex += 2;
      setTypingText(fullText.slice(0, charIndex));
      if (charIndex >= fullText.length) {
        clearInterval(typeTimer);
        setIsTyping(false);

        setDisplayedMessages((prev) => [
          ...prev,
          { sender: currentStep.sender, text: currentStep.text },
        ]);
        setTypingText('');

        if (currentStep.extractedDraft) {
          setCurrentDraft(currentStep.extractedDraft);
        }

        timerRef.current = setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
        }, adjustedStepDelay);
      }
    }, Math.max(15, charInterval));

    return () => {
      clearInterval(typeTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStepIndex, isPlaying, isOpen, selectedTrack, speedMultiplier]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Floating Immediate Exit Button - Always visible regardless of scrolling or iframe */}
      <button
        onClick={onClose}
        className="fixed top-3 left-3 sm:top-5 sm:left-5 z-[999999] px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-2xl shadow-rose-950/90 border-2 border-white/90 cursor-pointer active:scale-95 transition-all hover:scale-105"
        title="اضغط للخروج فوراً من الديمو والرجوع للبرنامج (أو اضغط زرار Esc)"
      >
        <X className="w-5 h-5 text-white stroke-[3]" />
        <span>خروج من الديمو ❌</span>
      </button>

      <div className="relative w-full max-w-6xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  العرض التجريبي التفاعلي الحي: متجر HBB Store
                </h3>
                <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  بالجنيه المصري (EGP) حصراً
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                محاكاة حية بالعامية المصرية: تفاوض بيعي ذكي، ترشيح مقاسات، وتأكيد أوردر مع إشعار التاجر فورياً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Track Switcher */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => restartTour('hoodies')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer ${
                  selectedTrack === 'hoodies'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>هودي وكارغو</span>
              </button>
              <button
                onClick={() => restartTour('sneakers')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer ${
                  selectedTrack === 'sneakers'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>نايكي دانك</span>
              </button>
            </div>

            {/* High Visibility Exit Button */}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-rose-950/60 active:scale-95 border border-rose-500"
              title="إغلاق العرض والرجوع للوحة التحكم (Esc)"
            >
              <X className="w-4 h-4" />
              <span>خروج من الديمو (Esc)</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-1.5 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 shadow-sm"
            style={{ width: `${Math.min(100, Math.round(((currentStepIndex + (isTyping ? 0.5 : 1)) / steps.length) * 100))}%` }}
          />
        </div>

        {/* Playback Controls */}
        <div className="bg-slate-950/70 px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل العرض'}</span>
            </button>

            <button
              onClick={() => restartTour()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة البدء</span>
            </button>

            <button
              onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono flex items-center gap-1 transition cursor-pointer"
              title="تغيير سرعة العرض"
            >
              <FastForward className="w-3.5 h-3.5 text-cyan-400" />
              <span>{speedMultiplier}x السرعة</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {formatTime(elapsedSeconds)} / {formatTime(estimatedTotalSeconds)} دقيقة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">الخطوة:</span>
            <span className="font-bold text-white">
              {Math.min(currentStepIndex + 1, steps.length)} من {steps.length}
            </span>
            <div className="hidden md:block text-slate-400 max-w-md truncate bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              <strong className="text-emerald-400 ml-1.5">الهدف:</strong>
              {steps[Math.min(currentStepIndex, steps.length - 1)]?.highlightNote}
            </div>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[480px]">
          {/* Chat Mockup (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b141a] flex flex-col border-l border-slate-800 relative" dir="rtl">
            <div className="bg-[#1f2c34] text-white px-4 py-3 flex items-center justify-between border-b border-slate-700/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow text-base">
                  👕
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight text-slate-100">
                    HBB Store (الخط الرسمي)
                  </h4>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>نشط الآن • ذكاء اصطناعي بالعامية المصرية (EGP)</span>
                  </span>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md" dir="ltr">
                +20 113 204 4823
              </div>
            </div>

            {/* Chat Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3.5"
              style={{
                backgroundImage:
                  'radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #0b141a 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {displayedMessages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-[#202c33] text-slate-100 rounded-br-xs border border-slate-700/40'
                          : 'bg-[#005c4b] text-white rounded-bl-xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px]">
                        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        <span>{isUser ? 'العميل' : 'مساعد HBB Store الذكي'}</span>
                      </div>
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div
                  className={`flex ${
                    steps[currentStepIndex]?.sender === 'user' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md leading-relaxed whitespace-pre-wrap animate-pulse ${
                      steps[currentStepIndex]?.sender === 'user'
                        ? 'bg-[#202c33] text-slate-100 rounded-br-xs border border-slate-700/40'
                        : 'bg-[#005c4b] text-white rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px]">
                      {steps[currentStepIndex]?.sender === 'user' ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                      <span>
                        {steps[currentStepIndex]?.sender === 'user' ? 'العميل يكتب...' : 'الذكاء الاصطناعي يحلل الكتالوج ويرد...'}
                      </span>
                    </div>
                    {typingText}
                    <span className="inline-block w-1.5 h-3 mr-0.5 bg-emerald-400 animate-ping" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="bg-[#1f2c34] px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>بيئة تجريبية تفاعلية • بدون استهلاك رصيد WhatsApp حقيقي</span>
              </span>
              <span className="font-mono text-emerald-400">زمن الاستجابة: 240ms</span>
            </div>
          </div>

          {/* POS & Order Extraction Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950 p-5 flex flex-col justify-between overflow-y-auto space-y-4" dir="rtl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>تذكرة تفاصيل الطلب واستخراج البيانات (POS)</span>
                </h4>
                {currentDraft?.status && (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      currentDraft.status === 'confirmed'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : currentDraft.status === 'ready_to_confirm'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {currentDraft.status === 'confirmed'
                      ? '✓ تم تأكيد الحجز وإشعار التاجر'
                      : currentDraft.status === 'ready_to_confirm'
                        ? '⚡ جاهز للتأكيد النهائي'
                        : '⚡ جاري استخراج البيانات'}
                  </span>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  المنتجات المحددة من المحادثة:
                </span>
                {currentDraft?.items && currentDraft.items.length > 0 ? (
                  <div className="space-y-2">
                    {currentDraft.items.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-white block">{item.name}</strong>
                          <span className="text-[11px] text-slate-400">{item.sizeOrColor}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">
                          {item.quantity} × {item.price} ج.م
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                    في انتظار تحديد العميل للقطع والمقاسات من الكتالوج...
                  </div>
                )}
              </div>

              {/* Delivery & Payment Details */}
              {currentDraft?.address && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2.5 shadow-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">عنوان الشحن المعتمد:</span>
                      <span className="text-white font-medium">{currentDraft.address}</span>
                    </div>
                  </div>

                  {currentDraft.paymentMethod && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">طريقة السداد:</span>
                      <span className="text-white font-medium text-[11px]">{currentDraft.paymentMethod}</span>
                    </div>
                  )}

                  {currentDraft.prepTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">موعد الشحن والتوصيل:</span>
                      <span className="text-amber-300 font-medium text-[11px]">{currentDraft.prepTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Price */}
              {currentDraft?.totalEstimated ? (
                <div className="bg-gradient-to-l from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between text-xs shadow-md">
                  <div>
                    <span className="text-emerald-300 font-medium block">الإجمالي بالجنيه المصري:</span>
                    <span className="text-[10px] text-slate-400">شامل مصاريف الشحن والمعاينة المجانية</span>
                  </div>
                  <span className="text-xl font-bold font-mono text-emerald-300">
                    {Math.round(currentDraft.totalEstimated)} جنيه مصري
                  </span>
                </div>
              ) : null}

              {/* Instant Alert Format Preview */}
              {currentDraft?.status === 'confirmed' && (
                <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="text-amber-400 font-bold block text-[11px]">
                    🚨 نص رسالة التنبيه المرسلة فوراً لموبايل صاحب المحل:
                  </span>
                  <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-line border border-slate-800">
                    {`🚨 طلب جديد محجوز عبر RADDAD AI!
👤 العميل: أحمد محمود
📞 رقم العميل: 01012345678
📍 العنوان: ${currentDraft.address || 'القاهرة - المعادي شارع 9'}
🛒 الطلبات: ${currentDraft.items?.map((it: any) => `${it.name} (${it.sizeOrColor})`).join(' + ')}
💰 الإجمالي: ${Math.round(currentDraft.totalEstimated)} جنيه مصري`}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Callout */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <a
                href="https://wa.me/201132044823?text=%D9%85%D8%B3%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AE%D9%8A%D8%B1%D8%8C%20%D8%B9%D8%A7%D9%8A%D8%B2%20%D8%A3%D8%AC%D8%B1%D8%A8%20%D8%A8%D9%88%D8%AA%20HBB%20Store%20%D8%B9%D9%84%D9%89%20%D9%88%D8%A7%D8%AA%D8%B3%D8%A7%D8%A8"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>تجربة حية على واتساب المحل (+20 113 204 4823)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer shadow-md"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>إغلاق العرض التجريبي والرجوع للوحة التحكم (Esc)</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                نظام SaaS متكامل لإدارة مبيعات محلات الملابس والسنيكرز في مصر 🇪🇬
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
