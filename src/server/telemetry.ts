export interface WebhookEventLog {
  id: string;
  timestamp: string;
  method: string;
  provider: string;
  fromPhone?: string;
  userMessage?: string;
  botReply?: string;
  status: 'received' | 'processed' | 'ignored' | 'error';
  rawBody: any;
  durationMs?: number;
  error?: string;
}

const webhookLogs: WebhookEventLog[] = [];
const MAX_LOGS = 50;

export function logWebhookEvent(event: Omit<WebhookEventLog, 'id' | 'timestamp'>) {
  const log: WebhookEventLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  webhookLogs.unshift(log);
  if (webhookLogs.length > MAX_LOGS) {
    webhookLogs.pop();
  }
  return log;
}

export function getWebhookLogs(): WebhookEventLog[] {
  return [...webhookLogs];
}

export function clearWebhookLogs(): void {
  webhookLogs.length = 0;
}
