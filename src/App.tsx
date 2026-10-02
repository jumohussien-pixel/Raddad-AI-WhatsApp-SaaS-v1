/**
 * WhatsApp AI Customer Service SaaS Dashboard & Multi-Store Suite
 * 
 * Features:
 * - Multi-Store Architecture (HML Sneakers, HPP Fashion, Nine Kicks)
 * - 1-Click Copy Master Sneakers AI System Prompt for Google Sheets & Bot config
 * - Live WhatsApp chat simulator with Egyptian Arabic sales assistant (Gemini Flash)
 * - Multi-provider webhook testing console (Meta Cloud, Green API, Whapi)
 * - Sliding window memory inspector (last 10 messages per phone number)
 * - Egyptian SMB product catalogs (Sneakers & Apparel inventories)
 * - Integration docs & cURL snippets
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Terminal,
  Database,
  Code,
  Utensils,
  Shirt,
  Sparkles,
  Smartphone,
  Store,
  Footprints,
  Layers,
} from 'lucide-react';

import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { GreenApiManager } from './components/GreenApiManager';
import { WebhookConsole } from './components/WebhookConsole';
import { MemoryInspector } from './components/MemoryInspector';
import { CatalogViewer } from './components/CatalogViewer';
import { ApiDocs } from './components/ApiDocs';
import { SecurityShieldPanel } from './components/SecurityShieldPanel';
import { MultiStoreManager } from './components/MultiStoreManager';
import { UnifiedControlCenter } from './components/UnifiedControlCenter';
import { AutoDemoTourModal } from './components/AutoDemoTourModal';
import { Play } from 'lucide-react';
import { UserSession, WebhookLog, ServerHealth, StoreProfile } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'control_center' | 'stores' | 'simulator' | 'green_api' | 'security' | 'webhook' | 'memory' | 'catalog' | 'docs'>('control_center');
  const [showAutoDemo, setShowAutoDemo] = useState(false);
  const [businessType, setBusinessType] = useState<'restaurant' | 'clothing' | 'sneakers'>('restaurant');
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('pizza-store');
  const [activeStore, setActiveStore] = useState<StoreProfile | null>(null);

  // Fetch stores
  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
        if (data.activeStoreId) {
          setActiveStoreId(data.activeStoreId);
        }
        if (data.activeStore) {
          setActiveStore(data.activeStore);
          if (data.activeStore.category === 'sneakers') {
            setBusinessType('sneakers');
          } else if (data.activeStore.category === 'clothing') {
            setBusinessType('clothing');
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch stores in App:', err);
    }
  };

  // Switch store handler
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
        if (data.activeStore?.category === 'sneakers') {
          setBusinessType('sneakers');
        } else if (data.activeStore?.category === 'clothing') {
          setBusinessType('clothing');
        }
        fetchSessions();
      }
    } catch (err) {
      console.error('Failed to switch store:', err);
    }
  };

  // Fetch server health status
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Sessions fetch failed:', err);
    }
  };

  // Fetch webhook logs
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/webhook/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Logs fetch failed:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchStores();
    fetchSessions();
    fetchLogs();

    const interval = setInterval(() => {
      checkHealth();
      fetchLogs();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070d12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Global Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <MessageSquare className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  WhatsApp AI Multi-Tenant SaaS Engine
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  🍕 F&B • 👟 Footwear • 👕 Retail
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous B2B Sales & Customer Support Engine for WhatsApp • Multi-Tenant Architecture & Domain AI
              </p>
            </div>
          </div>

          {/* Live WhatsApp Demo Badge & Multi-Store Switcher */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Auto-Play Interactive Tour Button */}
            <button
              id="btn-auto-play-demo"
              onClick={() => setShowAutoDemo(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 flex items-center gap-2 text-xs font-bold shadow-lg shadow-orange-950/40 transition-all cursor-pointer ring-1 ring-amber-400/50 hover:scale-105 active:scale-95"
              title="Launch hands-free self-running demo of the AI engine"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Auto-Play Demo Walkthrough</span>
            </button>

            {/* Live WhatsApp Demo Number Callout */}
            <a
              href="https://wa.me/201132044823?text=Hi%2C%20I%20would%20like%20to%20test%20the%20WhatsApp%20AI%20sales%20agent%21"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs font-semibold shadow-sm transition-all"
              title="Click to chat live with our production bot on WhatsApp"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live WhatsApp Demo: <strong className="font-mono text-white">+20 113 204 4823</strong></span>
            </a>

            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              {stores.map((s) => {
                const isSelected = s.id === activeStoreId;
                const isRes = s.category === 'restaurant';
                const isSnk = s.category === 'sneakers';
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSwitchStore(s.id)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-medium cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={s.tagline}
                  >
                    {isRes ? <Utensils className="w-3.5 h-3.5 text-amber-400" /> : isSnk ? <Footprints className="w-3.5 h-3.5 text-emerald-400" /> : <Shirt className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{s.id.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>

            {/* Server Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-slate-300 font-mono">
                {health?.status === 'healthy' ? 'Active' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto scrollbar-none border-t border-slate-800/60" dir="ltr">
          <nav className="flex space-x-2 py-2">
            <button
              id="tab-control-center"
              onClick={() => setActiveTab('control_center')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'control_center'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Control Center (All-in-One)</span>
              <span className="bg-emerald-900/60 text-emerald-200 font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-400/30">
                Turn-Key
              </span>
            </button>

            <button
              id="tab-stores"
              onClick={() => setActiveTab('stores')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'stores'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tenant Architecture</span>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                5 Stores
              </span>
            </button>

            <button
              id="tab-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Interactive Simulator ({activeStore?.name?.split(' ')[0] || 'Store'})</span>
            </button>

            <button
              id="tab-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {activeStore?.category === 'sneakers' ? (
                <Footprints className="w-4 h-4 text-emerald-400" />
              ) : (
                <Shirt className="w-4 h-4 text-emerald-400" />
              )}
              <span>
                {activeStore?.category === 'sneakers' ? 'Sneakers Inventory' : 'Product Inventory Catalog'}
              </span>
            </button>

            <button
              id="tab-green-api"
              onClick={() => setActiveTab('green_api')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'green_api'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Integration Setup</span>
            </button>

            <button
              id="tab-security"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Cyber Security Shield</span>
            </button>

            <button
              id="tab-webhook"
              onClick={() => setActiveTab('webhook')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'webhook'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Webhook Tester Console</span>
            </button>

            <button
              id="tab-memory"
              onClick={() => {
                setActiveTab('memory');
                fetchSessions();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'memory'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Memory & Session Manager</span>
              {sessions.length > 0 && (
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                  {sessions.length}
                </span>
              )}
            </button>

            <button
              id="tab-docs"
              onClick={() => setActiveTab('docs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>API Integration & Docs</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'control_center' && (
          <UnifiedControlCenter
            onStoreSwitched={(s) => {
              setActiveStoreId(s.id);
              setActiveStore(s);
              if (s.category === 'restaurant') setBusinessType('restaurant');
              else if (s.category === 'sneakers') setBusinessType('sneakers');
              else if (s.category === 'clothing') setBusinessType('clothing');
              fetchSessions();
            }}
            onViewDevOps={() => setActiveTab('security')}
            onLaunchAutoDemo={() => setShowAutoDemo(true)}
          />
        )}

        {activeTab === 'stores' && (
          <MultiStoreManager
            onStoreSwitched={(s) => {
              setActiveStoreId(s.id);
              setActiveStore(s);
              if (s.category === 'sneakers') setBusinessType('sneakers');
              else if (s.category === 'clothing') setBusinessType('clothing');
              fetchSessions();
            }}
          />
        )}

        {activeTab === 'security' && <SecurityShieldPanel />}

        {activeTab === 'green_api' && (
          <GreenApiManager onConfigChanged={checkHealth} />
        )}

        {activeTab === 'simulator' && (
          <WhatsAppSimulator
            businessType={businessType}
            storeId={activeStoreId}
            activeStore={activeStore}
            onSessionUpdated={fetchSessions}
          />
        )}

        {activeTab === 'webhook' && (
          <WebhookConsole logs={logs} onRefreshLogs={fetchLogs} businessType={businessType as any} />
        )}

        {activeTab === 'memory' && (
          <MemoryInspector sessions={sessions} onRefreshSessions={fetchSessions} />
        )}

        {activeTab === 'catalog' && (
          <CatalogViewer
            storeId={activeStoreId}
            activeStore={activeStore}
            onStoreUpdated={fetchStores}
          />
        )}

        {activeTab === 'docs' && <ApiDocs />}
      </main>

      {/* Footer Bar */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>WhatsApp Customer Service SaaS Backend for Egyptian SMBs • Express.js & Gemini 3.8 Flash</span>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>PORT: 3000</span>
            <span>•</span>
            <span>VERIFY_TOKEN: egypt_saas_secure_token_2026</span>
          </div>
        </div>
      </footer>
      {/* Interactive Auto-Demo Tour Modal */}
      <AutoDemoTourModal
        isOpen={showAutoDemo}
        onClose={() => setShowAutoDemo(false)}
      />
    </div>
  );
}
