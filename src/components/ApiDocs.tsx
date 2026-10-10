import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, ShieldCheck, Code2 } from 'lucide-react';

export const ApiDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlMeta = `curl -X POST http://localhost:3000/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "messages": [{
            "from": "14155552671",
            "id": "wamid.TEST_123",
            "text": { "body": "Hi, I would like to order a large Pepperoni Supreme Pizza with extra mozzarella" },
            "type": "text"
          }]
        }
      }]
    }]
  }'`;

  const curlGreenApi = `curl -X POST http://localhost:3000/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "typeWebhook": "incomingMessageReceived",
    "instanceData": {
      "idInstance": 710722741559,
      "wid": "14155552671@c.us"
    },
    "timestamp": ${Math.floor(Date.now() / 1000)},
    "idMessage": "BAE5TEST_${Date.now()}",
    "senderData": {
      "chatId": "14155552671@c.us",
      "sender": "14155552671@c.us",
      "senderName": "Customer"
    },
    "messageData": {
      "typeMessage": "textMessage",
      "textMessageData": {
        "textMessage": "I want to order a Double Smash Angus Burger combo with fries and a cola"
      }
    }
  }'`;

  const curlHandshake = `curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=raddad_saas_secure_token_2026&hub.challenge=1158201444"`;

  const curlDirectSim = `curl -X POST http://localhost:3000/api/chat/simulate \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "14155552671",
    "message": "Do you have the Nike Dunk Low Panda in size US 10 / EU 43?",
    "businessType": "sneakers"
  }'`;

  return (
    <div id="api-docs-root" className="space-y-6" dir="ltr">
      {/* Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span>API Integration Guide & cURL Commands (Production Ready)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Ready-to-use commands for Terminal testing, automated tests, and connecting Meta Cloud API, Green-API, and Whapi.cloud webhooks.
        </p>
      </div>

      {/* Code Blocks */}
      <div className="space-y-4">
        {/* Green API Post Webhook cURL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-emerald-400">1. Inbound WhatsApp Message via Green-API (POST /webhook)</span>
            <button
              onClick={() => copyToClipboard(curlGreenApi, 'curlGreenApi')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 transition-colors"
            >
              {copiedKey === 'curlGreenApi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curlGreenApi' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="mt-3 p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto" dir="ltr">
            {curlGreenApi}
          </pre>
        </div>

        {/* Meta Post Webhook cURL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200">2. Inbound WhatsApp Message via Meta Cloud API (POST /webhook)</span>
            <button
              onClick={() => copyToClipboard(curlMeta, 'curlMeta')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 transition-colors"
            >
              {copiedKey === 'curlMeta' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curlMeta' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="mt-3 p-3 bg-slate-950 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto" dir="ltr">
            {curlMeta}
          </pre>
        </div>

        {/* Handshake GET cURL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200">3. Meta Security Handshake Verification (GET /webhook)</span>
            <button
              onClick={() => copyToClipboard(curlHandshake, 'curlHandshake')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 transition-colors"
            >
              {copiedKey === 'curlHandshake' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curlHandshake' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="mt-3 p-3 bg-slate-950 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto" dir="ltr">
            {curlHandshake}
          </pre>
        </div>

        {/* Direct Chat API cURL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200">4. Direct In-Memory Simulator Endpoint (POST /api/chat/simulate)</span>
            <button
              onClick={() => copyToClipboard(curlDirectSim, 'curlDirectSim')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 transition-colors"
            >
              {copiedKey === 'curlDirectSim' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curlDirectSim' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="mt-3 p-3 bg-slate-950 rounded-xl text-xs font-mono text-purple-300 overflow-x-auto" dir="ltr">
            {curlDirectSim}
          </pre>
        </div>
      </div>

      {/* Production Deployment Guidelines */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-xs space-y-3">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Meta Developers Dashboard Webhook Configuration Steps:</span>
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
          <li>Navigate to your Meta for Developers dashboard for your WhatsApp Business App.</li>
          <li>Under WhatsApp, select <strong>Configuration</strong> &gt; <strong>Webhook</strong>.</li>
          <li>Set Callback URL: <code className="text-emerald-400 font-mono">https://YOUR_DOMAIN/webhook</code> (or store webhook: <code className="text-emerald-400 font-mono">/webhook/hbb</code>).</li>
          <li>Set Verify Token to your .env value: <code className="text-emerald-400 font-mono">raddad_saas_secure_token_2026</code>.</li>
          <li>Subscribe to the Webhook field named <code className="text-emerald-400 font-mono">messages</code>.</li>
        </ol>
      </div>
    </div>
  );
};
