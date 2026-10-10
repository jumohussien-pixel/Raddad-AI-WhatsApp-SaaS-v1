import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  RotateCcw,
  ShoppingBag,
  MapPin,
  CreditCard,
  Sparkles,
  CheckCheck,
  Loader2,
  Camera,
  Mic,
  Image as ImageIcon,
  Square,
  Volume2,
} from 'lucide-react';
import { ChatMessage, OrderDraft, StoreProfile } from '../types';

interface WhatsAppSimulatorProps {
  businessType: 'restaurant' | 'clothing' | 'sneakers';
  storeId?: string;
  activeStore?: StoreProfile | null;
  onSessionUpdated?: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  businessType,
  storeId,
  activeStore,
  onSessionUpdated,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('201132044823');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImagePreview, setAttachedImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingMsgIdx, setPlayingMsgIdx] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real TTS Playback of AI responses
  const handlePlayTts = async (text: string, idx: number) => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
      if (playingMsgIdx === idx) {
        setPlayingMsgIdx(null);
        return;
      }
    }

    setPlayingMsgIdx(idx);
    try {
      const res = await fetch('/api/chat/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          ttsAudioRef.current = audio;
          audio.onended = () => {
            setPlayingMsgIdx(null);
            ttsAudioRef.current = null;
          };
          audio.onerror = () => {
            setPlayingMsgIdx(null);
            ttsAudioRef.current = null;
          };
          await audio.play();
        }
      }
    } catch (e) {
      console.error('TTS error:', e);
      setPlayingMsgIdx(null);
    }
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load session from server or send initial greeting
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          const existing = data.sessions?.find((s: any) => s.phoneNumber === phoneNumber);
          if (existing && existing.messages?.length > 0) {
            setMessages(existing.messages);
            setOrderDraft(existing.orderDraft || null);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      }

      // Default welcome message for HBB Store (100% Egyptian Arabic)
      const storeName = activeStore?.name || 'HBB Store';
      const defaultWelcome =
        `أهلاً بحضرتك يا فندم في متجر ${storeName}! 👕👟\nأفضل خامات ملابس شبابي عصرية وسنيكرز ماستر كواليتي، بأسعار الجنيه المصري مع ميزة المعاينة والقياس مجاناً مع المندوب قبل ما تدفع أي جنيه! 🛡️\nتحب تشوف الهوديز، التيشيرتات، الكارغو، ولا السنيكرز؟ ✨`;

      setMessages([{ role: 'model', content: defaultWelcome, timestamp: Date.now() }]);
      setOrderDraft(null);
    };

    fetchSession();
  }, [businessType, phoneNumber, storeId, activeStore?.id]);

  const handleSendMessage = async (
    textToSend?: string,
    mediaOptions?: { mediaBase64?: string; mediaType?: 'image' | 'audio'; mimeType?: string; label?: string }
  ) => {
    const text = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if ((!text && !mediaOptions?.mediaBase64 && !attachedImagePreview) || isLoading) return;

    setInputMessage('');
    const userTimestamp = Date.now();

    const currentImage = mediaOptions?.mediaBase64 || attachedImagePreview;
    const mediaType = mediaOptions?.mediaType || (currentImage ? 'image' : undefined);
    setAttachedImagePreview(null);

    const displayContent = mediaOptions?.label
      ? mediaOptions.label
      : currentImage
      ? `[Image Attached] ${text || 'Is this model in stock? What are the sizes and prices?'}`
      : text;

    // Optimistically update message
    const newMsgList: ChatMessage[] = [
      ...messages,
      { role: 'user', content: displayContent, timestamp: userTimestamp },
    ];
    setMessages(newMsgList.slice(-10)); // Local sliding window preview
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          message: text || (mediaType === 'image' ? 'Customer shared a product photo inquiring about availability and pricing' : ''),
          businessType,
          storeId: storeId || activeStore?.id,
          mediaBase64: currentImage || undefined,
          mediaType,
          mediaMimeType: mediaOptions?.mimeType || (mediaType === 'image' ? 'image/jpeg' : undefined),
        }),
      });

      const data = await response.json();
      if (data.history) {
        setMessages(data.history);
      } else if (data.reply) {
        setMessages((prev) => [...prev, { role: 'model' as const, content: data.reply, timestamp: Date.now() }].slice(-10));
      }

      if (data.orderDraft) {
        setOrderDraft(data.orderDraft);
      }

      if (onSessionUpdated) {
        onSessionUpdated();
      }
    } catch (err) {
      console.error('Failed to send simulated message:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model' as const,
          content: 'Sorry, an error occurred while connecting to the server. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachedImagePreview(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone recording is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          setIsLoading(true);
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: '🎙️ [Processing Voice Recording...]', timestamp: Date.now() },
          ]);

          try {
            const res = await fetch('/api/chat/voice-simulate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: phoneNumber,
                base64Audio: base64Data,
                mimeType: mediaRecorder.mimeType || 'audio/webm',
                storeId: storeId || activeStore?.id,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setMessages((prev) => {
                const list = [...prev];
                const lastIdx = list.length - 1;
                if (lastIdx >= 0 && list[lastIdx].role === 'user') {
                  list[lastIdx] = {
                    ...list[lastIdx],
                    content: `🎙️ [Voice Note Transcribed]: "${data.transcription}"`,
                  };
                }
                return [...list, { role: 'model', content: data.reply, timestamp: Date.now() }];
              });

              if (data.orderDraft) {
                setOrderDraft(data.orderDraft);
              }
              if (onSessionUpdated) onSessionUpdated();

              // Auto-play AI voice reply if generated
              if (data.audioReplyBase64) {
                try {
                  const replyAudio = new Audio(`data:${data.audioMimeType || 'audio/wav'};base64,${data.audioReplyBase64}`);
                  ttsAudioRef.current = replyAudio;
                  replyAudio.play().catch(() => {});
                } catch (e) {}
              }
            }
          } catch (err) {
            console.error('Failed to send voice note:', err);
          } finally {
            setIsLoading(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start microphone:', err);
      alert('Could not access microphone. Please allow microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendSampleVoiceNote = () => {
    handleSendMessage('[Voice note from customer]: I weigh 185 lbs and I am 5 feet 10 inches tall. Which size fits me for an oversized tee and cargo pants?', {
      mediaType: 'audio',
      label: '🎙️ [Voice Note 0:15] I weigh 185 lbs and I am 5\'10". Recommend my size for oversized t-shirts and cargo pants.',
    });
  };

  const handleSendSampleCargoPantsPhoto = () => {
    // 1x1 clean png pixel image base64 as test payload
    const sampleImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    handleSendMessage('[Photo of cargo pants attached]: Is this cargo pants model available in stock? What are the sizes and prices?', {
      mediaBase64: sampleImageBase64,
      mediaType: 'image',
      mimeType: 'image/png',
      label: '📸 [Photo Attachment] Is this utility cargo pants in stock, and what are the available colors and fabrics?',
    });
  };

  const handleReset = async () => {
    try {
      await fetch(`/api/sessions/${phoneNumber}`, { method: 'DELETE' });
      await handleSendMessage('Reset conversation history');
    } catch (e) {
      console.error('Failed to reset session:', e);
    }
  };

  const isSneakers = businessType === 'sneakers' || activeStore?.category === 'sneakers';
  const storeName = activeStore?.name || 'HBB Store';

  const quickPrompts = [
    'عايز اعرف اسعار الهوديز والسنيكرز المتاحة بالجنيه المصري',
    'وزني 76 كجم وطولي 178، ايه انسب مقاس ليا في الهودي الأوفر سايز؟',
    'عندكم كوتشي نايكي دانك باندا مقاس 43؟',
    'هل المعاينة والقياس مجانية مع المندوب قبل ما ادفع؟',
    'الشحن للقاهرة والجيزة كام وبياخد وقت أد ايه؟',
    'أحمد محمود - القاهرة المعادي شارع 9 - 01012345678 - دفع كاش عند الاستلام',
  ];

  return (
    <div id="whatsapp-simulator-wrapper" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left / Main: WhatsApp Chat Mockup */}
      <div className="lg:col-span-8 flex flex-col items-center">
        {/* Phone Mockup Frame */}
        <div className="w-full max-w-xl bg-slate-900 rounded-3xl p-3 shadow-2xl border border-slate-800">
          {/* Top Speaker / Camera Notch */}
          <div className="flex justify-center items-center pb-2">
            <div className="w-20 h-4 bg-slate-800 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-700 mr-2" />
              <div className="w-3 h-1.5 rounded-full bg-slate-700" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="bg-[#0b141a] rounded-2xl overflow-hidden flex flex-col h-[640px] border border-slate-800">
            {/* WhatsApp Header Bar */}
            <div className="bg-[#1f2c34] text-white px-4 py-3 flex items-center justify-between border-b border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-inner text-base">
                    {businessType === 'restaurant' ? '🍲' : isSneakers ? '👟' : '👔'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#1f2c34]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm leading-tight text-slate-100">
                    {storeName}
                  </h3>
                  <span className="text-xs text-emerald-400 font-medium">
                    {isSneakers ? 'Footwear Specialist • Inspect Before Pay' : 'Online • Gemini AI Assistant'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                  Memory: <span className="text-emerald-400 font-mono">{messages.length}</span>/10
                </div>
                <button
                  id="reset-chat-btn"
                  onClick={handleReset}
                  title="Clear chat history and start over"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body with WhatsApp Doodle Background Pattern */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-opacity-95 text-slate-100"
              style={{
                backgroundImage:
                  'radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #0b141a 1px)',
                backgroundSize: '24px 24px',
              }}
              dir="ltr"
            >
              {/* Encrypted Disclaimer */}
              <div className="flex justify-center my-1">
                <span className="text-[11px] bg-[#182229] text-amber-300/80 px-3 py-1 rounded-lg border border-amber-500/20 text-center max-w-xs shadow-sm">
                  🔒 Messages are secure & processed via Express.js & Gemini AI
                </span>
              </div>

              {/* Messages Flow */}
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md relative text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#005c4b] text-slate-100 rounded-tr-none'
                          : 'bg-[#202c33] text-slate-200 rounded-tl-none border border-slate-700/50'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans break-words">{msg.content}</div>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handlePlayTts(msg.content, idx)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2a3942] hover:bg-[#32444f] text-emerald-400 text-[10px] border border-emerald-500/20 cursor-pointer transition-colors"
                            title="Play voice reply via Gemini TTS"
                          >
                            <Volume2 className={`w-3 h-3 ${playingMsgIdx === idx ? 'animate-pulse text-amber-300' : ''}`} />
                            <span>{playingMsgIdx === idx ? 'Playing Voice...' : 'Listen 🔊'}</span>
                          </button>
                        )}
                        <div
                          className={`flex items-center gap-1 text-[10px] ${
                            isUser ? 'text-emerald-200/70 ml-auto' : 'text-slate-400 ml-auto'
                          }`}
                        >
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-end animate-pulse">
                  <div className="bg-[#202c33] rounded-2xl rounded-tl-none px-4 py-3 border border-slate-700/50 flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-medium">AI Agent is typing a response...</span>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Egyptian Prompts Bar */}
            <div className="bg-[#111b21] px-3 py-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none flex gap-2" dir="ltr">
              {businessType === 'clothing' && (
                <>
                  <button
                    onClick={handleSendSampleCargoPantsPhoto}
                    disabled={isLoading}
                    className="text-xs whitespace-nowrap bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-200 px-3 py-1.5 rounded-full border border-indigo-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                    title="Simulate sending a cargo pants image to trigger Gemini Vision processing"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    <span>📸 Cargo Pants Photo (Vision AI)</span>
                  </button>

                  <button
                    onClick={handleSendSampleVoiceNote}
                    disabled={isLoading}
                    className="text-xs whitespace-nowrap bg-sky-950/70 hover:bg-sky-900 text-sky-300 hover:text-sky-200 px-3 py-1.5 rounded-full border border-sky-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                    title="Simulate sending a voice note to trigger Gemini Audio processing"
                  >
                    <Mic className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    <span>🎙️ Voice Note (Audio AI)</span>
                  </button>
                </>
              )}

              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="text-xs whitespace-nowrap bg-[#202c33] hover:bg-[#2a3942] text-emerald-300 hover:text-emerald-200 px-3 py-1.5 rounded-full border border-emerald-500/20 transition-all flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {prompt}
                </button>
              ))}
            </div>

            {/* Attached Image Preview Bar */}
            {attachedImagePreview && (
              <div className="bg-[#1f2c34] px-4 py-2 flex items-center justify-between border-t border-slate-700/50" dir="ltr">
                <div className="flex items-center gap-2">
                  <img src={attachedImagePreview} alt="Attached" className="w-10 h-10 object-cover rounded-lg border border-emerald-500/50" />
                  <span className="text-xs text-slate-200">Product photo attached (ready to send)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImagePreview(null)}
                  className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Message Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="bg-[#202c33] p-2.5 flex items-center gap-2 border-t border-slate-700/50"
              dir="ltr"
            >
              {/* File Input for Customer Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelected}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach product or menu photo"
                className="w-9 h-9 rounded-xl bg-[#2a3942] hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              </button>

              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 text-xs font-bold animate-pulse cursor-pointer shrink-0 shadow-md"
                  title="Click to Stop Recording and Transcribe Audio with Gemini"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{recordSeconds}s Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  title="Record Voice Note via your Microphone (Live Gemini STT)"
                  className="w-9 h-9 rounded-xl bg-[#2a3942] hover:bg-slate-700 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-emerald-400" />
                </button>
              )}

              <input
                id="whatsapp-message-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type customer message in English or Arabic, or send photo/voice note..."
                disabled={isLoading}
                className="flex-1 bg-[#2a3942] text-slate-100 placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                id="send-whatsapp-message-btn"
                type="submit"
                disabled={(!inputMessage.trim() && !attachedImagePreview) || isLoading}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column: Order Extractor & Session Status */}
      <div className="lg:col-span-4 space-y-4" dir="ltr">
        {/* Customer Profile & Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-slate-200">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center justify-between pb-2 border-b border-slate-800">
            <span>Simulation & Customer Data</span>
            <span className="text-xs font-mono text-emerald-400">Node.js Session</span>
          </h4>

          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Customer Phone Number (WhatsApp Sender):</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Sliding Window Memory:</span>
                <span className="font-semibold text-emerald-400">Last 10 messages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saved Messages:</span>
                <span className="font-semibold text-slate-200">{messages.length} messages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI Foundation Model:</span>
                <span className="font-mono text-cyan-400">Gemini 3.8 Flash</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Extracted Order Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Extracted Customer Order (POS/Draft)</span>
            </h4>
            {orderDraft?.status && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  orderDraft.status === 'confirmed' || orderDraft.status === 'ready_to_confirm'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
                }`}
              >
                {orderDraft.status === 'confirmed' ? 'Confirmed' : 'Collecting Info'}
              </span>
            )}
          </div>

          {orderDraft && orderDraft.items && orderDraft.items.length > 0 ? (
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-medium">Requested Items:</span>
                {orderDraft.items.map((it, idx) => (
                  <div key={idx} className="bg-slate-950 p-2 rounded-lg text-xs flex justify-between items-center border border-slate-800/80">
                    <div>
                      <span className="font-medium text-slate-100">{it.name}</span>
                      {it.sizeOrColor && <span className="text-slate-400 mr-1">({it.sizeOrColor})</span>}
                    </div>
                    <span className="font-mono text-emerald-400">
                      {it.quantity} × {it.price ? `${Math.round(Number(it.price))} جنيه مصري` : '-'}
                    </span>
                  </div>
                ))}
              </div>

              {orderDraft.address && (
                <div className="p-2 bg-slate-950 rounded-lg text-xs border border-slate-800/80 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block">عنوان التوصيل:</span>
                    <span className="text-slate-200 font-medium">{orderDraft.address}</span>
                  </div>
                </div>
              )}

              {orderDraft.paymentMethod && (
                <div className="p-2 bg-slate-950 rounded-lg text-xs border border-slate-800/80 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <span className="text-slate-400">طريقة الدفع:</span>{' '}
                    <span className="text-slate-200 font-medium">{orderDraft.paymentMethod}</span>
                  </div>
                </div>
              )}

              {orderDraft.totalEstimated ? (
                <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30 flex justify-between items-center text-xs">
                  <span className="font-medium text-emerald-300">الإجمالي التقديري:</span>
                  <span className="text-sm font-bold font-mono text-emerald-200">
                    {Math.round(Number(orderDraft.totalEstimated))} جنيه مصري
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 py-8 text-center text-slate-500 text-xs">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <span>No order items extracted yet. Start messaging the assistant and Gemini will automatically extract item details.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
