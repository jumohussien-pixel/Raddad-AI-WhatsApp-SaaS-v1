import React, { useState } from 'react';
import { Database, Trash2, Clock, MessageSquare, RefreshCw, Cpu, Layers } from 'lucide-react';
import { UserSession } from '../types';

interface MemoryInspectorProps {
  sessions: UserSession[];
  onRefreshSessions: () => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({ sessions, onRefreshSessions }) => {
  const [selectedPhone, setSelectedPhone] = useState<string>(sessions[0]?.phoneNumber || '');
  const [isClearing, setIsClearing] = useState(false);

  // Sync selected phone if current selected phone is absent
  React.useEffect(() => {
    if (!selectedPhone && sessions.length > 0) {
      setSelectedPhone(sessions[0].phoneNumber);
    }
  }, [sessions, selectedPhone]);

  const activeSession = sessions.find((s) => s.phoneNumber === selectedPhone) || sessions[0];

  const handleClearSession = async (phone: string) => {
    if (!confirm(`Are you sure you want to clear the session memory for phone number: +${phone}?`)) return;
    setIsClearing(true);
    try {
      await fetch(`/api/sessions/${phone}`, { method: 'DELETE' });
      onRefreshSessions();
    } catch (e) {
      console.error('Failed to clear session:', e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div id="memory-inspector-root" className="space-y-6" dir="ltr">
      {/* Overview & Architecture Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Sliding Window Session Memory Manager</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Maintains the last 10 messages of conversational history per user to provide context-aware sales replies while utilizing automatic TTL-based clearing to prevent memory leakages.
            </p>
          </div>

          <button
            onClick={onRefreshSessions}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Active Sessions</span>
          </button>
        </div>

        {/* Scalability Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Layers className="w-4 h-4" />
              <span>Sliding Context Window</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Discards messages older than the last 10 turns to conserve LLM input tokens and keep model responses ultra-focused.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Clock className="w-4 h-4" />
              <span>Automatic 24-Hour TTL Eviction</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Background cron job sweeps idle sessions, evicting them from RAM to sustain high-performance scalability across millions of active numbers.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Redis & MongoDB Adaptable</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Standardized on a clean <code className="text-purple-300 font-mono">SessionStoreAdapter</code> interface, enabling a painless transition from in-memory RAM storage to enterprise databases like Redis or MongoDB.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Sessions List & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Sessions Directory */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-slate-200">Active Buyers ({sessions.length})</h4>
            <span className="text-[11px] text-slate-400 font-mono">Active Phone Numbers</span>
          </div>

          <div className="mt-3 space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {sessions.length > 0 ? (
              sessions.map((sess) => {
                const isSelected = sess.phoneNumber === activeSession?.phoneNumber;
                return (
                  <div
                    key={sess.phoneNumber}
                    onClick={() => setSelectedPhone(sess.phoneNumber)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-slate-100 shadow-sm'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-mono text-sm font-semibold text-emerald-400" dir="ltr">
                        +{sess.phoneNumber}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {sess.messages?.length || 0} / 10 msgs
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span>Store Type: {sess.businessType === 'restaurant' ? 'Restaurant' : 'Fashion Store'}</span>
                      <span className="font-mono">
                        {new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No active buyer sessions. Send a message from the simulator or via real WhatsApp to initiate a session.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Message Sliding Window Visualizer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          {activeSession ? (
            <div>
              {/* Session Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100 font-mono" dir="ltr">
                      +{activeSession.phoneNumber}
                    </span>
                    <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      {activeSession.businessType === 'restaurant' ? 'Restaurant' : 'Fashion'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-1">
                    Last Active:{' '}
                    {new Date(activeSession.lastActive).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>

                <button
                  onClick={() => handleClearSession(activeSession.phoneNumber)}
                  disabled={isClearing}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Memory Session</span>
                </button>
              </div>

              {/* Messages Array (Sliding Window Table) */}
              <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
                <div className="text-xs text-slate-400 font-medium mb-1">
                  Saved Context Messages (Maximum 10 Allowed):
                </div>

                {activeSession.messages && activeSession.messages.length > 0 ? (
                  activeSession.messages.map((m, idx) => {
                    const isUser = m.role === 'user';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          isUser
                            ? 'bg-slate-950 border-emerald-500/20 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-slate-800/80">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                              isUser ? 'bg-emerald-900/60 text-emerald-300' : 'bg-purple-900/60 text-purple-300'
                            }`}
                          >
                            {isUser ? '👤 Customer (User)' : '🤖 Sales AI Agent (Model)'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            #{idx + 1} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">No active messages recorded for this session.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 text-sm">
              Select a phone number from the directory panel to audit its sliding window context tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
