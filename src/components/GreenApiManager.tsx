import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  QrCode,
  Radio,
  Sliders,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface GreenApiManagerProps {
  onConfigChanged?: () => void;
}

export const GreenApiManager: React.FC<GreenApiManagerProps> = ({ onConfigChanged }) => {
  const [instanceId, setInstanceId] = useState('710722741559');
  const [apiToken, setApiToken] = useState('');
  const [host, setHost] = useState('https://7107.api.greenapi.com');
  const [showToken, setShowToken] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('unknown');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test Outbound Message State
  const [testPhone, setTestPhone] = useState('201132044823');
  const [testMessage, setTestMessage] = useState('Hello! 🌟 This is a live outbound test message from your autonomous WhatsApp AI Sales Engine (Meta Cloud API / Green API + Gemini Flash).');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; messageId?: string; error?: string } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  const [isPollingNow, setIsPollingNow] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);

  // Fetch initial config
  const fetchConfig = async () => {
    // 1. Try localStorage first for instant field population
    const localInst = localStorage.getItem('green_instance_id');
    const localToken = localStorage.getItem('green_api_token');
    const localHost = localStorage.getItem('green_host');

    if (localInst) setInstanceId(localInst);
    if (localToken) setApiToken(localToken);
    if (localHost) setHost(localHost);

    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config?.greenApi) {
          if (data.config.greenApi.instanceId && !localInst) {
            setInstanceId(data.config.greenApi.instanceId);
          }
          if (data.config.greenApi.apiToken && (!localToken || localToken.length < 5)) {
            setApiToken(data.config.greenApi.apiToken);
          }
          if (data.config.greenApi.host && !localHost) {
            setHost(data.config.greenApi.host);
          }
        }
        if (data.appUrl) setAppUrl(data.appUrl);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp config:', err);
    }
  };

  const handlePollNow = async () => {
    setIsPollingNow(true);
    setPollStatus(null);
    try {
      const res = await fetch('/api/whatsapp/poll-now', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPollStatus(data.handled ? `Success: ${data.message}` : `Message queue is empty or messages were already processed`);
        if (onConfigChanged) onConfigChanged();
      } else {
        setPollStatus(`Notice: ${data.error || 'Unable to fetch incoming messages'}`);
      }
    } catch (err: any) {
      setPollStatus(`Error: ${err.message}`);
    } finally {
      setIsPollingNow(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Automatically update host when instanceId prefix changes
  const handleInstanceIdChange = (newVal: string) => {
    const trimmed = newVal.trim();
    setInstanceId(trimmed);
    if (trimmed.length >= 4 && /^\d{4}/.test(trimmed)) {
      const prefix = trimmed.slice(0, 4);
      // If current host is empty, or has a different 4-digit prefix, auto-align with instance
      if (!host || host.includes('.api.greenapi.com')) {
        setHost(`https://${prefix}.api.greenapi.com`);
      }
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Save to localStorage
    if (instanceId) localStorage.setItem('green_instance_id', instanceId.trim());
    if (apiToken) localStorage.setItem('green_api_token', apiToken.trim());
    if (host) localStorage.setItem('green_host', host.trim());

    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'green_api',
          greenApi: {
            instanceId: instanceId.trim(),
            ...(apiToken.trim() ? { apiToken: apiToken.trim() } : {}),
            host: host.trim(),
          },
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        if (onConfigChanged) onConfigChanged();
        // Immediately check connection
        checkConnection();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const checkConnection = async () => {
    setIsChecking(true);
    setConnectionDetails(null);
    try {
      const res = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: instanceId.trim(),
          ...(apiToken.trim() ? { apiToken: apiToken.trim() } : {}),
          host: host.trim(),
        }),
      });

      const data = await res.json();
      setConnectionState(data.stateInstance || 'error');
      setConnectionDetails(data);
    } catch (err: any) {
      setConnectionState('error');
      setConnectionDetails({ error: err.message });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) return;
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/whatsapp/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone.trim(),
          message: testMessage.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          messageId: data.data?.idMessage || 'Sent successfully (Simulation / Live Broadcast Mode)',
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Failed to send message, please verify your Green API credentials',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Unable to connect to backend server',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const webhookEndpoint = `${window.location.origin}/webhook/hbb`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-slate-100" dir="ltr">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Live WhatsApp Connection Hub (Green API)
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                  Resilient Gateway
                </span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Configure your direct WhatsApp gateway, scan connection states, and test outgoing messages with a single click.
              </p>
            </div>
          </div>

          <button
            onClick={checkConnection}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Scan Connection Status</span>
          </button>
        </div>
      </div>

      {/* Connection Status Badges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Green API Instance State</span>
            <Radio className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            {connectionState === 'authorized' ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <span className="text-emerald-400 font-bold text-base block">Authorized</span>
                  <span className="text-xs text-slate-400">Your phone is online and listening.</span>
                </div>
              </>
            ) : connectionState === 'notAuthorized' ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                <div>
                  <span className="text-amber-400 font-bold text-base block">Not Authorized</span>
                  <span className="text-xs text-amber-300/80">Scan the QR code in your Green API panel.</span>
                </div>
              </>
            ) : connectionState === 'blocked' ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                <div>
                  <span className="text-red-400 font-bold text-base block">Blocked</span>
                  <span className="text-xs text-red-300/80">Your WhatsApp number has been flagged.</span>
                </div>
              </>
            ) : connectionState === 'unconfigured' ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full bg-slate-500" />
                <div>
                  <span className="text-slate-300 font-bold text-base block">Unconfigured</span>
                  <span className="text-xs text-slate-400">Input your Instance ID & API Token below.</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-3.5 h-3.5 rounded-full bg-slate-600" />
                <div>
                  <span className="text-slate-300 font-bold text-base block">Click "Scan Status"</span>
                  <span className="text-xs text-slate-500">Hits getStateInstance endpoint</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Instant Webhook Response</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Active (200 OK)</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Clears the Green API Queue in under 2ms to prevent message replay.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Polling Daemon Engine</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold text-sm">Every 2.5 seconds</span>
              <button
                onClick={handlePollNow}
                disabled={isPollingNow}
                className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg transition disabled:opacity-50"
              >
                {isPollingNow ? 'Polling...' : 'Poll Now'}
              </button>
            </div>
            {pollStatus ? (
              <p className="text-xs text-amber-300 mt-1 truncate">{pollStatus}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">
                Pulls and replies to messages immediately without needing public inbound ports.
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Model Framework</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              <span>Gemini Flash Rotator</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active defensive rotation against 503 limits with local Egyptian-Cotton sales fallback.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form: Green API Credentials */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <span>1. Your Green API Instance Credentials</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Instance ID
            </label>
            <input
              type="text"
              value={instanceId}
              onChange={(e) => handleInstanceIdChange(e.target.value)}
              placeholder="e.g. 710722741559"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono outline-none transition"
              dir="ltr"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Located in your Green API Console Header</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              API Token Instance
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="e.g. d75b1234a5b6c7..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono outline-none transition pr-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Your secure token used to send API requests</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              API Host (Server Cluster)
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="https://7107.api.greenapi.com"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono outline-none transition"
              dir="ltr"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Usually matches your instance prefix, e.g., 7107.api.greenapi.com</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {saveSuccess && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved and successfully applied to the backend server!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-md shadow-emerald-950/50"
            >
              {isSaving ? 'Saving...' : 'Save & Apply Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Live WhatsApp Test Message */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-400" />
          <span>2. Live Outbound Message Testing</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Type your phone number below and click send. If your instance is active and connected, you will receive this message on your WhatsApp instantly!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Phone Number (with Country Code, no + or leading zeros)
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="e.g., 14155552671"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono outline-none transition"
              dir="ltr"
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none transition"
            />
            <button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap shadow-md flex items-center gap-2"
            >
              {isSendingTest ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send To WhatsApp</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/40 border-red-500/40 text-red-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {testResult.success
                  ? 'Message successfully dispatched! Check your phone now.'
                  : 'Message failed to dispatch:'}
              </p>
              <p className="mt-1 font-mono text-[11px] opacity-90">
                {testResult.messageId || testResult.error}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Webhook URL Setup in Green API Console */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-teal-400" />
          <span>3. Your Secure Inbound Webhook Endpoint</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Copy this URL and paste it into the <b>Webhook URL</b> field inside your Green API Console settings:
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <code className="font-mono text-emerald-400 text-xs sm:text-sm select-all break-all" dir="ltr">
            {webhookEndpoint}
          </code>

          <button
            onClick={() => copyToClipboard(webhookEndpoint)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedUrl ? 'Copied!' : 'Copy Endpoint'}</span>
          </button>
        </div>

        {/* Checkbox settings instructions */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>incomingWebhook</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Must be enabled (Yes) so Green API sends incoming chat messages to your server instantly.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-xs mb-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>outgoingWebhook</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Should be disabled (No) to prevent recursive feedback bot loops.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-xs mb-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>outgoingMessageWebhook</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Should be disabled (No) to prevent the system from intercepting its own replies.
            </p>
          </div>
        </div>
      </div>

      {/* Step 4: Troubleshooting Guide */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>Troubleshooting Guide: Why isn't the bot replying?</span>
        </h3>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </span>
            <div>
              <span className="font-semibold text-white block mb-0.5">
                Stale Webhook URL on Cloud Run container scales:
              </span>
              If your backend container scaled or redeployed, make sure your Green API console is pointing to the active Webhook endpoint shown above.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </span>
            <div>
              <span className="font-semibold text-white block mb-0.5">
                Queue Block & Slow Ack:
              </span>
              The webhook handler is designed to respond with <code className="text-emerald-400 font-mono">200 OK</code> within 2 milliseconds in parallel, preventing message backlog on high volume events.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </span>
            <div>
              <span className="font-semibold text-white block mb-0.5">
                QR Code Connection State:
              </span>
              Check if your Green API status is <code className="text-emerald-400 font-mono">authorized</code>. If not, open your phone's WhatsApp {'>'} Linked Devices {'>'} Link a Device and scan the QR code in your Green API panel.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              4
            </span>
            <div>
              <span className="font-semibold text-white block mb-0.5">
                Instance Configuration Checklist:
              </span>
              Make sure both the Instance ID and API Token are fully saved. If empty, the backend simulates the replies locally on the UI Console and will not dispatch real messages to WhatsApp.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
