/**
 * Memory Management System for WhatsApp Conversations
 * 
 * Scalable sliding window session store that maintains the last 10 messages per customer.
 * Built with an interface-driven architecture so that replacing the in-memory Map
 * with a Redis or MongoDB adapter requires zero changes to business logic.
 */

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface OrderDraft {
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
    sizeOrColor?: string;
    notes?: string;
  }>;
  customerName?: string;
  phone?: string;
  address?: string;
  paymentMethod?: string;
  deliveryFee?: number;
  totalEstimated?: number;
  status: 'inquiry' | 'collecting_info' | 'ready_to_confirm' | 'confirmed';
  notes?: string;
  updatedAt: number;
}

export interface UserSession {
  phoneNumber: string;
  businessType: 'restaurant' | 'clothing';
  tenantId: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActive: number;
  orderDraft: OrderDraft;
  metadata?: Record<string, unknown>;
}

export interface SessionStoreAdapter {
  getSession(phoneNumber: string, businessType?: 'restaurant' | 'clothing', tenantId?: string): Promise<UserSession>;
  addMessage(phoneNumber: string, role: 'user' | 'model', content: string): Promise<UserSession>;
  getHistory(phoneNumber: string): Promise<ChatMessage[]>;
  clearSession(phoneNumber: string): Promise<boolean>;
  updateOrderDraft(phoneNumber: string, draft: Partial<OrderDraft>): Promise<UserSession>;
  getAllSessions(): Promise<UserSession[]>;
  cleanupExpired(ttlMs: number): Promise<number>;
}

export class InMemorySessionStore implements SessionStoreAdapter {
  private sessions: Map<string, UserSession> = new Map();
  private readonly MAX_MESSAGES = 10;
  private readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours TTL

  constructor() {
    // Run periodic eviction every 15 minutes to prevent memory leaks in production
    setInterval(() => {
      this.cleanupExpired(this.DEFAULT_TTL_MS).catch((err) => {
        console.error('Session eviction routine error:', err);
      });
    }, 15 * 60 * 1000);
  }

  /**
   * Retrieves an existing session or initializes a fresh session for a phone number
   */
  async getSession(
    phoneNumber: string,
    businessType: 'restaurant' | 'clothing' = 'restaurant',
    tenantId = 'default_tenant'
  ): Promise<UserSession> {
    const cleanPhone = this.sanitizePhoneNumber(phoneNumber);
    let session = this.sessions.get(cleanPhone);

    if (!session) {
      session = {
        phoneNumber: cleanPhone,
        businessType,
        tenantId,
        messages: [],
        createdAt: Date.now(),
        lastActive: Date.now(),
        orderDraft: {
          items: [],
          status: 'inquiry',
          updatedAt: Date.now(),
        },
      };
      this.sessions.set(cleanPhone, session);
    } else {
      session.lastActive = Date.now();
      if (businessType && session.businessType !== businessType) {
        session.businessType = businessType;
      }
    }

    return session;
  }

  /**
   * Appends a message to the conversation and maintains a strict 10-message sliding window.
   */
  async addMessage(phoneNumber: string, role: 'user' | 'model', content: string): Promise<UserSession> {
    const cleanPhone = this.sanitizePhoneNumber(phoneNumber);
    const session = await this.getSession(cleanPhone);

    const message: ChatMessage = {
      role,
      content,
      timestamp: Date.now(),
    };

    session.messages.push(message);

    // Strictly enforce the sliding window: Keep only the most recent MAX_MESSAGES (10)
    if (session.messages.length > this.MAX_MESSAGES) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES);
    }

    session.lastActive = Date.now();
    this.sessions.set(cleanPhone, session);
    return session;
  }

  /**
   * Returns the conversation history formatted for context injection
   */
  async getHistory(phoneNumber: string): Promise<ChatMessage[]> {
    const session = await this.getSession(phoneNumber);
    return [...session.messages];
  }

  /**
   * Clears conversational history for the given phone number (triggered by user or timeout)
   */
  async clearSession(phoneNumber: string): Promise<boolean> {
    const cleanPhone = this.sanitizePhoneNumber(phoneNumber);
    return this.sessions.delete(cleanPhone);
  }

  /**
   * Updates partial order draft fields
   */
  async updateOrderDraft(phoneNumber: string, draft: Partial<OrderDraft>): Promise<UserSession> {
    const session = await this.getSession(phoneNumber);
    session.orderDraft = {
      ...session.orderDraft,
      ...draft,
      updatedAt: Date.now(),
    };
    session.lastActive = Date.now();
    return session;
  }

  /**
   * Returns all active in-memory sessions for monitoring and debug telemetry
   */
  async getAllSessions(): Promise<UserSession[]> {
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }

  /**
   * Evicts sessions inactive beyond the specified TTL duration (prevents memory leak)
   */
  async cleanupExpired(ttlMs: number): Promise<number> {
    const now = Date.now();
    let removedCount = 0;

    for (const [phone, session] of this.sessions.entries()) {
      if (now - session.lastActive > ttlMs) {
        this.sessions.delete(phone);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`[MemoryManager] Evicted ${removedCount} stale WhatsApp sessions.`);
    }

    return removedCount;
  }

  /**
   * Normalizes phone number formatting (e.g. removes spaces, plus signs, dashes)
   */
  private sanitizePhoneNumber(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }
}

// Export singleton instance ready for use across the application
export const memoryManager = new InMemorySessionStore();
