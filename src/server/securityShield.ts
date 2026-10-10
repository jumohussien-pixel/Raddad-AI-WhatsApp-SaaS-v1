/**
 * Advanced Cyber Security & Anti-Hacking Shield for WhatsApp AI SaaS
 * 
 * Defenses implemented:
 * 1. Prompt Injection & Jailbreak Defense (LLM Security OWASP Top 10)
 * 2. Anti-Replay & Message Deduplication Cache (LRU + Nonce/MessageId)
 * 3. Token Bucket Rate Limiting per Phone Number (DDoS/Spam protection)
 * 4. Secret & Token Exfiltration Firewall (Outbound Data Leakage Prevention)
 * 5. Input Sanitization & Attack Pattern Detection
 */

export interface SecurityStats {
  totalScanned: number;
  blockedInjections: number;
  rateLimitHits: number;
  deduplicatedReplays: number;
  exfiltrationBlocked: number;
  lastIncident?: {
    type: string;
    fromPhone: string;
    snippet: string;
    timestamp: string;
  };
}

const stats: SecurityStats = {
  totalScanned: 0,
  blockedInjections: 0,
  rateLimitHits: 0,
  deduplicatedReplays: 0,
  exfiltrationBlocked: 0,
};

// 1. Anti-Replay Deduplication Cache (TTL: 10 minutes)
const seenMessages = new Map<string, number>();
const REPLAY_TTL_MS = 10 * 60 * 1000;

// 2. Token Bucket Rate Limiter per Phone Number (Max 8 messages / 30 seconds)
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}
const rateLimitBuckets = new Map<string, RateLimitBucket>();
const MAX_TOKENS = 8;
const REFILL_RATE_MS = 30000; // 30 seconds to restore full bucket

/**
 * Prompt Injection and Jailbreak Adversarial Patterns (OWASP LLM01:2025)
 */
const INJECTION_PATTERNS = [
  // Direct Prompt Override
  /ignore\s+(all\s+)?(previous\s+|prior\s+)?(instructions|rules|prompts|commands|directives)/i,
  /تجاهل\s+(جميع\s+|كل\s+)?(التعليمات|الأوامر|القواعد|السيستم)/i,
  /انسى\s+(كل\s+|جميع\s+)?(اللي\s+فات|الأوامر|التعليمات|إنك\s+محل)/i,
  
  // System Prompt Exfiltration
  /leak\s+(your\s+)?(system\s+prompt|instructions|api\s+keys?|rules|initial\s+prompt)/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions|api\s+keys?|rules|initial\s+prompt)/i,
  /what\s+(is|are)\s+your\s+(exact\s+)?(instructions|system\s+prompt|rules|secret)/i,
  /اطبع\s+(التعليمات|البرومبت|السيستم\s+برومبت|الأوامر\s+الأولى)/i,
  /وريني\s+(البرومبت|تعليماتك|الأوامر\s+السرية|كودك)/i,

  // Roleplay / Jailbreak / DAN / Uncensored personas
  /(you\s+are\s+now|pretend\s+to\s+be|act\s+as)\s+(an\s+uncensored|dan|developer\s+mode|root|admin)/i,
  /انت\s+دلوقتي\s+(مش\s+محل\s+ملابس|أدمن|هاكر|نظام\s+مفتوح)/i,

  // Technical Exploit Payloads (SQLi, XSS, Path Traversal, Shell)
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /(\bselect\b|\bunion\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)\s+.*(\bfrom\b|\btable\b)/i,
  /(\.\.\/|\.\.\\){2,}/,
  /(;|&&|\|\|)\s*(rm\s+-rf|cat\s+\/etc\/passwd|wget|curl\s+http)/i,
];

/**
 * Checks if an incoming message is a duplicate or replay attack
 */
export function isReplayAttack(messageId?: string): boolean {
  if (!messageId) return false;

  const now = Date.now();
  // Cleanup old entries
  if (seenMessages.size > 2000) {
    for (const [id, time] of seenMessages.entries()) {
      if (now - time > REPLAY_TTL_MS) {
        seenMessages.delete(id);
      }
    }
  }

  if (seenMessages.has(messageId)) {
    stats.deduplicatedReplays++;
    return true;
  }

  seenMessages.set(messageId, now);
  return false;
}

/**
 * Checks if a phone number is exceeding the acceptable message rate
 */
export function isRateLimited(phoneNumber: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(phoneNumber);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    rateLimitBuckets.set(phoneNumber, bucket);
  }

  // Refill tokens based on elapsed time
  const timeElapsed = now - bucket.lastRefill;
  if (timeElapsed >= REFILL_RATE_MS) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    stats.rateLimitHits++;
    const remainingTime = Math.ceil((REFILL_RATE_MS - timeElapsed) / 1000);
    return { limited: true, retryAfterSec: Math.max(1, remainingTime) };
  }

  bucket.tokens--;
  return { limited: false, retryAfterSec: 0 };
}

/**
 * Validates text against adversarial injection, jailbreaking, and exploits
 */
export function inspectSecurityThreats(
  text: string,
  fromPhone = 'unknown'
): { isThreat: boolean; reason?: string; safeReplacement?: string } {
  stats.totalScanned++;

  if (!text || typeof text !== 'string') {
    return { isThreat: false };
  }

  const clean = text.trim();

  // Check against all injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(clean)) {
      stats.blockedInjections++;
      stats.lastIncident = {
        type: 'Prompt Injection / Adversarial Payload Blocked',
        fromPhone,
        snippet: clean.length > 50 ? clean.slice(0, 50) + '...' : clean,
        timestamp: new Date().toISOString(),
      };

      console.warn(`\n🚨 [SECURITY SHIELD BLOCKED ATTACK] From: ${fromPhone} | Match: ${pattern}`);
      console.warn(`🚨 Payload Snippet: "${clean.slice(0, 100)}"`);

      return {
        isThreat: true,
        reason: 'Prompt Injection / Security Payload Detected',
        safeReplacement:
          'Hello and welcome! 🌸 I am your dedicated AI retail & customer support specialist, here exclusively to help you browse our collections, select the perfect sizes and styles, and confirm your orders! ✨ How may I assist you with our catalog today? 🛍️',
      };
    }
  }

  return { isThreat: false };
}

/**
 * Scans outbound messages to ensure no system secrets, tokens, or internals leak
 */
export function sanitizeOutboundMessage(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Patterns for potential secrets (API Keys, Tokens, Env vars)
  const SECRET_PATTERNS = [
    /AIzaSy[A-Za-z0-9_-]{8,64}/g, // Google Gemini API Key pattern
    /[a-f0-9]{50,64}/gi,        // Green API Token (64 hex characters)
    /710722741559/g,            // Direct internal instance IDs
    /process\.env\.[A-Za-z0-9_]+/g,
    /\/app\/applet\/[^\s]+/g,   // Internal server file paths
  ];

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(sanitized)) {
      stats.exfiltrationBlocked++;
      sanitized = sanitized.replace(pattern, '[ENCRYPTED_AND_PROTECTED]');
    }
  }

  return sanitized;
}

export function getSecurityStats(): SecurityStats {
  return { ...stats };
}
