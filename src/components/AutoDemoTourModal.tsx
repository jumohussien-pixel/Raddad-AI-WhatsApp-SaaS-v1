/**
 * Auto-Play Interactive Product Tour Modal for Raddad AI WhatsApp SaaS Engine
 * 
 * Purpose:
 * Provides an automated, self-running video-like demonstration of the conversational
 * AI sales engine, restaurant sizing/upselling, and POS order extraction without
 * requiring manual screen recording.
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
  ArrowRight,
  X,
  FastForward,
  Utensils,
  Footprints,
  Smartphone,
  ExternalLink,
  Bot,
  User,
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

const PIZZA_TOUR_STEPS: TourStep[] = [
  {
    sender: 'user',
    text: 'Good evening! Can I see your pizza menu and delivery options please?',
    delayMs: 1400,
    highlightNote: 'Step 1: Customer initiates inquiry with location intent.',
  },
  {
    sender: 'model',
    text: 'Welcome to Bella Roma Pizza & Pastas! 🍕🔥 We bake authentic Italian stone-oven pizzas fresh to order in ~20 mins. Our top sellers tonight:\n• Pepperoni Supreme Stuffed Crust (Single: $14.99 | Combo: $19.99 | Family Box: $28.99)\n• Quattro Formaggi Truffle Pizza (Single: $15.99 | Combo: $20.99)\n• Creamy Chicken Alfredo Pasta ($13.99)\n\nWe deliver piping hot in 25–35 mins! Would you like a Single or a Combo meal with seasoned fries & drink?',
    delayMs: 2200,
    highlightNote: 'Step 2: AI welcomes customer, outlines portion tiers (Single/Combo/Family) & confirms delivery zone.',
    extractedDraft: {
      items: [],
      status: 'collecting',
    },
  },
  {
    sender: 'user',
    text: 'Awesome, I want 1 Pepperoni Supreme Combo with extra mozzarella, and 1 loaded cheesy fries.',
    delayMs: 1600,
    highlightNote: 'Step 3: Customer picks meal tier and up-sells extra cheese add-on.',
    extractedDraft: {
      items: [
        { name: 'Pepperoni Supreme Pizza', sizeOrColor: 'Combo (+ Fries & Drink)', quantity: 1, price: 19.99 },
        { name: 'Extra Mozzarella Stuffed Crust', sizeOrColor: 'Add-on', quantity: 1, price: 2.99 },
        { name: 'Texas Loaded Cheesy Bacon Fries', sizeOrColor: 'Side', quantity: 1, price: 6.99 },
      ],
      totalEstimated: 29.97,
      status: 'collecting',
    },
  },
  {
    sender: 'model',
    text: 'Delicious choice! 🍕✨ Stuffed crust with extra melted mozzarella is incredible. Would you like your meal regular or spicy with jalapeno slices?\n\nTo send this straight to our kitchen, please share your delivery address and name!',
    delayMs: 2000,
    highlightNote: 'Step 4: AI clarifies cooking instructions (spicy preference) and asks for checkout details.',
  },
  {
    sender: 'user',
    text: 'Make it mildly spicy please. Address: 742 Evergreen Terrace, Apt 4. Name: Karim Mansour, phone +1 555 100 0001. I will pay cash on delivery.',
    delayMs: 1800,
    highlightNote: 'Step 5: Customer sends name, detailed address, contact phone, and payment preference.',
    extractedDraft: {
      items: [
        { name: 'Pepperoni Supreme Pizza (Mild Spicy)', sizeOrColor: 'Combo (+ Fries & Drink)', quantity: 1, price: 19.99 },
        { name: 'Extra Mozzarella Stuffed Crust', sizeOrColor: 'Add-on', quantity: 1, price: 2.99 },
        { name: 'Texas Loaded Cheesy Bacon Fries', sizeOrColor: 'Side', quantity: 1, price: 6.99 },
      ],
      address: '742 Evergreen Terrace, Apt 4',
      paymentMethod: 'Cash on Delivery (COD)',
      prepTime: '20 - 25 mins (ETA: 35 mins)',
      totalEstimated: 34.97, // 29.97 + 5.00 delivery fee
      status: 'confirmed',
    },
  },
  {
    sender: 'model',
    text: '🎉 Order confirmed, Karim! Your order is now sizzling in the stone oven at Bella Roma!\n\n📋 Order Summary:\n• 1x Pepperoni Supreme Combo ($19.99)\n• 1x Extra Mozzarella Stuffed Crust ($2.99)\n• 1x Texas Loaded Cheesy Bacon Fries ($6.99)\n• Delivery to: 742 Evergreen Terrace, Apt 4\n• Total: $34.97 (includes $5.00 delivery fee)\n• Payment: Cash on Delivery\n• Estimated Delivery: 25 - 35 minutes.\n\nOur courier will notify you upon arrival. Enjoy your meal! 🍕❤️',
    delayMs: 2400,
    highlightNote: 'Step 6: Order atomically confirmed, dispatched to POS kitchen queue with real-time ETA.',
  },
];

const SNEAKERS_TOUR_STEPS: TourStep[] = [
  {
    sender: 'user',
    text: 'Hi! Do you have Air Jordan 1 Retro in size 43 in stock? Can I inspect and try it on before paying?',
    delayMs: 1500,
    highlightNote: 'Step 1: Customer asks for specific shoe model, size 43, and courier inspection policy.',
  },
  {
    sender: 'model',
    text: 'Hello and welcome to HML Sneakers! 👟🔥 Yes, we have Air Jordan 1 Retro in size 43 (US 9.5) ready for immediate dispatch!\n\nAvailable colorways in 43:\n1. Chicago Classic (Red/White/Black) — $129.99\n2. Mocha Travis Edition (Brown/White) — $139.99\n3. Shadow Grey / Panda — $119.99\n\n🛡️ 100% Try-Before-You-Pay Guarantee: Our courier will wait with you while you inspect the master-quality leather and try on the size before paying a single dollar! Which color do you prefer?',
    delayMs: 2100,
    highlightNote: 'Step 2: AI confirms size 43 availability, lists colors with prices, and eliminates buyer anxiety with courier inspection guarantee.',
    extractedDraft: {
      items: [{ name: 'Air Jordan 1 Retro', sizeOrColor: 'Size 43', quantity: 1, price: 129.99 }],
      status: 'collecting',
    },
  },
  {
    sender: 'user',
    text: 'I want the Chicago Classic in size 43. Deliver to: 120 Broadway St, New York, Apt 8B. Name: Tarek Zaki, phone +1 555 987 6543.',
    delayMs: 1700,
    highlightNote: 'Step 3: Customer selects Chicago edition and provides delivery address.',
    extractedDraft: {
      items: [{ name: 'Air Jordan 1 Retro (Chicago Red/White)', sizeOrColor: 'Size 43', quantity: 1, price: 129.99 }],
      address: '120 Broadway St, New York, Apt 8B',
      paymentMethod: 'Cash on Delivery after Inspection',
      prepTime: 'Dispatches today (Delivery in 24 hours)',
      totalEstimated: 139.99, // 129.99 + 10.00 Express shipping
      status: 'confirmed',
    },
  },
  {
    sender: 'model',
    text: 'Perfect choice, Tarek! 👟🔥 Air Jordan 1 Chicago in size 43 is booked under your name.\n\n📦 Order Details:\n• Air Jordan 1 High Chicago (Size 43 / US 9.5)\n• Subtotal: $129.99 + $10.00 Express Shipping = $139.99 Total\n• Delivery Address: 120 Broadway St, New York, Apt 8B\n• Courier Policy: Inspect and try on first!\n\nYour package dispatches today and will arrive within 24 hours. Thank you for shopping with HML!',
    delayMs: 2200,
    highlightNote: 'Step 4: POS draft extracted, customer details locked, shipping ticket generated.',
  },
];

export const AutoDemoTourModal: React.FC<AutoDemoTourModalProps> = ({ isOpen, onClose }) => {
  const [selectedTrack, setSelectedTrack] = useState<'pizza' | 'sneakers'>('pizza');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [displayedMessages, setDisplayedMessages] = useState<{ sender: 'user' | 'model'; text: string }[]>([]);
  const [typingText, setTypingText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentDraft, setCurrentDraft] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const steps = selectedTrack === 'pizza' ? PIZZA_TOUR_STEPS : SNEAKERS_TOUR_STEPS;

  // Reset and restart tour
  const restartTour = (track = selectedTrack) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelectedTrack(track);
    setCurrentStepIndex(0);
    setDisplayedMessages([]);
    setTypingText('');
    setIsTyping(false);
    setCurrentDraft(null);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isOpen) {
      restartTour();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isOpen]);

  // Main step-by-step playback engine
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    if (currentStepIndex >= steps.length) {
      // Finished all steps
      setIsPlaying(false);
      return;
    }

    const currentStep = steps[currentStepIndex];
    const fullText = currentStep.text;
    const isUser = currentStep.sender === 'user';

    // Simulate typing effect
    setIsTyping(true);
    let charIndex = 0;
    const typingIntervalMs = (isUser ? 25 : 12) / speedMultiplier;

    const charTimer = setInterval(() => {
      charIndex += 2;
      if (charIndex >= fullText.length) {
        clearInterval(charTimer);
        setIsTyping(false);
        setTypingText('');
        setDisplayedMessages((prev) => [...prev, { sender: currentStep.sender, text: fullText }]);

        if (currentStep.extractedDraft) {
          setCurrentDraft(currentStep.extractedDraft);
        }

        // Wait before advancing to next step
        const pauseDelay = currentStep.delayMs / speedMultiplier;
        timerRef.current = setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
        }, pauseDelay);
      } else {
        setTypingText(fullText.slice(0, charIndex));
      }
    }, typingIntervalMs);

    return () => {
      clearInterval(charTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStepIndex, isPlaying, isOpen, selectedTrack, speedMultiplier]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages, typingText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Raddad AI Engine — Interactive Auto-Play Tour
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  Self-Running Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Experience simulated customer conversations and instant POS order drafting with zero configuration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Track Switcher */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => restartTour('pizza')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer ${
                  selectedTrack === 'pizza'
                    ? 'bg-amber-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Pizza & Food (F&B)</span>
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
                <span>Sneakers (Retail)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Top Progress Bar */}
        <div className="w-full bg-slate-950 h-1.5 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 h-full transition-all duration-300 shadow-sm"
            style={{ width: `${Math.min(100, Math.round(((currentStepIndex + (isTyping ? 0.5 : 1)) / steps.length) * 100))}%` }}
          />
        </div>

        {/* Step Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2 px-6 bg-slate-950/80 border-b border-slate-800/80 text-[11px]">
          <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider mr-1 shrink-0">
            Tour Milestones:
          </span>
          {steps.map((s, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setDisplayedMessages(steps.slice(0, idx).map((st) => ({ sender: st.sender, text: st.text })));
                  if (steps[idx]?.extractedDraft) setCurrentDraft(steps[idx].extractedDraft);
                }}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition font-medium cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40 ring-1 ring-emerald-300'
                    : isCompleted
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {idx + 1}. {idx === 0 ? 'Inquiry' : idx === 1 ? 'Combos & Tiers' : idx === 2 ? 'Upselling Add-ons' : idx === 3 ? 'Cooking Notes' : idx === 4 ? 'Address & ETA' : 'Confirmed'}
              </button>
            );
          })}
        </div>

        {/* Playback Controls & Tour Progress Indicator */}
        <div className="bg-slate-950/70 px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play Tour'}</span>
            </button>

            <button
              onClick={() => restartTour()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            <button
              onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono flex items-center gap-1 transition cursor-pointer"
              title="Toggle playback speed"
            >
              <FastForward className="w-3.5 h-3.5 text-cyan-400" />
              <span>{speedMultiplier}x Speed</span>
            </button>
          </div>

          {/* Current Step Highlight */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Step:</span>
            <span className="font-bold text-white">
              {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
            </span>
            <div className="hidden md:block text-slate-400 max-w-md truncate bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              <strong className="text-emerald-400 mr-1.5">Focus:</strong>
              {steps[Math.min(currentStepIndex, steps.length - 1)]?.highlightNote}
            </div>
          </div>
        </div>

        {/* Main Body: 2-Column Split Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[480px]">
          {/* Left Column: WhatsApp Simulator Chat Mockup (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b141a] flex flex-col border-r border-slate-800 relative">
            {/* Chat Header */}
            <div className="bg-[#1f2c34] text-white px-4 py-3 flex items-center justify-between border-b border-slate-700/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow text-base">
                  {selectedTrack === 'pizza' ? '🍕' : '👟'}
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight text-slate-100">
                    {selectedTrack === 'pizza' ? 'Bella Roma Pizza & Pastas' : 'HML Sneakers & Footwear'}
                  </h4>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active • Gemini 3.8 Flash Engine</span>
                  </span>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                +20 113 204 4823
              </div>
            </div>

            {/* Chat Messages Body */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
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
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs shadow-md leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-[#202c33] text-slate-100 rounded-bl-xs border border-slate-700/40'
                          : 'bg-[#005c4b] text-white rounded-br-xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px]">
                        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        <span>{isUser ? 'Customer' : 'Raddad AI Assistant'}</span>
                      </div>
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {/* In-Progress Live Typing Bubble */}
              {isTyping && (
                <div
                  className={`flex ${
                    steps[currentStepIndex]?.sender === 'user' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs shadow-md leading-relaxed whitespace-pre-wrap animate-pulse ${
                      steps[currentStepIndex]?.sender === 'user'
                        ? 'bg-[#202c33] text-slate-100 rounded-bl-xs border border-slate-700/40'
                        : 'bg-[#005c4b] text-white rounded-br-xs'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px]">
                      {steps[currentStepIndex]?.sender === 'user' ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                      <span>
                        {steps[currentStepIndex]?.sender === 'user' ? 'Customer typing...' : 'AI thinking...'}
                      </span>
                    </div>
                    {typingText}
                    <span className="inline-block w-1.5 h-3 ml-0.5 bg-emerald-400 animate-ping" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Bottom Footer Notification */}
            <div className="bg-[#1f2c34] px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Simulated in-memory sandbox session</span>
              </span>
              <span className="font-mono text-emerald-400">Latency: 280ms</span>
            </div>
          </div>

          {/* Right Column: Real-Time POS Draft & Extracted Order Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time POS Draft Extractor</span>
                </h4>
                {currentDraft?.status && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentDraft.status === 'confirmed'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {currentDraft.status === 'confirmed' ? '✓ Order Confirmed' : '⚡ Extracting Draft'}
                  </span>
                )}
              </div>

              {/* Order Items Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Detected Line Items & Modifiers:
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
                          {item.quantity} × ${Number(item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                    Waiting for customer to specify dishes or items...
                  </div>
                )}
              </div>

              {/* Extracted Customer Meta Details */}
              {currentDraft?.address && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Address:</span>
                      <span className="text-white font-medium">{currentDraft.address}</span>
                    </div>
                  </div>

                  {currentDraft.paymentMethod && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">Payment:</span>
                      <span className="text-white font-medium text-[11px]">{currentDraft.paymentMethod}</span>
                    </div>
                  )}

                  {currentDraft.prepTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">Kitchen Prep:</span>
                      <span className="text-amber-300 font-medium text-[11px]">{currentDraft.prepTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Calculation */}
              {currentDraft?.totalEstimated ? (
                <div className="bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-emerald-300 font-medium block">Total Order Value:</span>
                    <span className="text-[10px] text-slate-400">Includes taxes & delivery</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-emerald-300">
                    ${Number(currentDraft.totalEstimated).toFixed(2)}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Bottom Callout & Live WhatsApp Link */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <a
                href="https://wa.me/201132044823?text=Hi%2C%20I%20would%20like%20to%20test%20the%20Raddad%20WhatsApp%20AI%20sales%20agent%21"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Test Live on WhatsApp (+20 113 204 4823)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[11px] text-slate-400 text-center">
                Commercial Turn-Key SaaS • Ready for Acquire.com / Flippa Handover
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
