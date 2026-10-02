import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, Terminal, RefreshCw, Send } from 'lucide-react';
import { WebhookLog } from '../types';

interface WebhookConsoleProps {
  logs: WebhookLog[];
  onRefreshLogs: () => void;
  businessType: 'restaurant' | 'clothing';
}

export const WebhookConsole: React.FC<WebhookConsoleProps> = ({ logs, onRefreshLogs, businessType }) => {
  const [selectedFormat, setSelectedFormat] = useState<'meta' | 'green_api' | 'whapi' | 'handshake'>('meta');
  const [payloadText, setPayloadText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  // Preset payloads
  const metaSample = JSON.stringify(
    {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '10982348509382',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: businessType === 'restaurant' ? '201012345678' : '201012345672',
                  phone_number_id: '839201948271',
                },
                contacts: [{ profile: { name: 'John Doe' }, wa_id: '201099887766' }],
                messages: [
                  {
                    from: '201099887766',
                    id: `wamid.HBgM${Date.now()}`,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    text: {
                      body:
                        businessType === 'restaurant'
                          ? 'Hello, I want to order 2 Al-Prins special Koshary and a coke to Maadi please.'
                          : 'Good evening! Do you have the Basic Oversized Heavy Cotton Tee in Black, size XL in stock?',
                    },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    },
    null,
    2
  );

  const greenApiSample = JSON.stringify(
    {
      typeWebhook: 'incomingMessageReceived',
      instanceData: { idInstance: 1101823901, wid: '201012345678@c.us', typeInstance: 'whatsapp' },
      timestamp: Math.floor(Date.now() / 1000),
      idMessage: `BAE5${Date.now().toString(16).toUpperCase()}`,
      senderData: {
        chatId: '201122334455@c.us',
        sender: '201122334455@c.us',
        senderName: 'Amr Mostafa',
      },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: {
          textMessage:
            businessType === 'restaurant'
              ? 'Could I get the prices for oriental grills and the baked pasta?'
              : 'How long does shipping to Alexandria take, and what is the shipping fee?',
        },
      },
    },
    null,
    2
  );

  const whapiSample = JSON.stringify(
    {
      messages: [
        {
          id: `whapi_${Date.now()}`,
          chat_id: '201555444333@s.whatsapp.net',
          from: '201555444333',
          from_me: false,
          type: 'text',
          timestamp: Math.floor(Date.now() / 1000),
          text: {
            body:
              businessType === 'restaurant'
                ? 'Do you deliver to El-Nasr Street in Maadi?'
                : 'I want to inquire about your try-before-buy inspection and exchange policy.',
          },
        },
      ],
    },
    null,
    2
  );

  // Set initial payload when format changes
  React.useEffect(() => {
    if (selectedFormat === 'meta') setPayloadText(metaSample);
    else if (selectedFormat === 'green_api') setPayloadText(greenApiSample);
    else if (selectedFormat === 'whapi') setPayloadText(whapiSample);
    else if (selectedFormat === 'handshake') {
      setPayloadText('GET /webhook?hub.mode=subscribe&hub.verify_token=egypt_saas_secure_token_2026&hub.challenge=1158201444');
    }
  }, [selectedFormat, businessType]);

  const handleExecuteWebhook = async () => {
    setIsSending(true);
    setLastResponse(null);

    try {
      if (selectedFormat === 'handshake') {
        const url = `/webhook?hub.mode=subscribe&hub.verify_token=egypt_saas_secure_token_2026&hub.challenge=${encodeURIComponent(
          'CHALLENGE_' + Date.now()
        )}`;
        const res = await fetch(url);
        const text = await res.text();
        setLastResponse({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          body: text,
        });
      } else {
        const parsedBody = JSON.parse(payloadText);
        const res = await fetch(`/webhook?businessType=${businessType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedBody),
        });

        const textResponse = await res.text();
        let data: any;
        try {
          data = JSON.parse(textResponse);
        } catch {
          data = textResponse;
        }
        setLastResponse({
          status: res.status,
          statusText: res.statusText,
          body: data,
        });
      }

      onRefreshLogs();
    } catch (err: any) {
      setLastResponse({
        status: 'Client Error',
        error: err.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="webhook-console-root" className="space-y-6" dir="ltr">
      {/* Top Controls: Format Selection & Dispatch */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>Multi-Provider Webhook Simulation Console</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Trigger raw payload handshakes and incoming requests from different providers (Meta Business API, Green API, Whapi) to audit how the AI orchestrates the replies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteWebhook}
              disabled={isSending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-transform active:scale-95"
            >
              {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>Execute Mock Webhook</span>
            </button>
          </div>
        </div>

        {/* Format Switcher Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedFormat('meta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedFormat === 'meta'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Meta Cloud API (Official)
          </button>
          <button
            onClick={() => setSelectedFormat('green_api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedFormat === 'green_api'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Green API (Webhooks)
          </button>
          <button
            onClick={() => setSelectedFormat('whapi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedFormat === 'whapi'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Whapi.cloud API
          </button>
          <button
            onClick={() => setSelectedFormat('handshake')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedFormat === 'handshake'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            GET /webhook Handshake (Meta Verify)
          </button>
        </div>

        {/* Payload Editor & Live Response Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* JSON Payload Editor */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-1">
              <span>Request Body JSON (POST Payload):</span>
              <span className="font-mono text-emerald-400">POST /webhook</span>
            </div>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={12}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y"
              dir="ltr"
            />
          </div>

          {/* Response Inspector */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-1">
              <span>HTTP Response:</span>
              {lastResponse && (
                <span
                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                    lastResponse.status === 200
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  HTTP {lastResponse.status}
                </span>
              )}
            </div>
            <div
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono overflow-auto max-h-[300px]"
              dir="ltr"
            >
              {lastResponse ? (
                <pre className="text-slate-200 whitespace-pre-wrap">{JSON.stringify(lastResponse, null, 2)}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                  <Send className="w-6 h-6 mb-2 opacity-30" />
                  <span>Execute Mock Webhook to inspect HTTP payload headers and Gemini AI replies.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Activity Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Live Inbound Webhook Telemetry Logs</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {logs.length} Events
              </span>
            </h4>
          </div>
          <button
            onClick={onRefreshLogs}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          {logs.length > 0 ? (
            <table className="w-full text-left text-xs" dir="ltr">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Customer Phone</th>
                  <th className="py-2.5 px-3">Incoming Message</th>
                  <th className="py-2.5 px-3">Generated AI Reply (Gemini)</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[11px]">
                        {log.provider}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 whitespace-nowrap">+{log.fromPhone || '-'}</td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-200" title={log.userMessage}>
                      {log.userMessage || '-'}
                    </td>
                    <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-300" title={log.botReply}>
                      {log.botReply || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {log.durationMs ? `${log.durationMs}ms` : '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {log.status === 'processed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Processed
                        </span>
                      )}
                      {log.status === 'ignored' && (
                        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full text-[10px]">Ignored</span>
                      )}
                      {log.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">No logs recorded yet. Message the bot from the simulator or trigger mock payloads above to generate logs.</div>
          )}
        </div>
      </div>
    </div>
  );
};
