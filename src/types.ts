export interface MenuItem {
  id: string;
  name: string;
  category: string; // e.g., 'Pizzas' | 'Burgers' | 'Appetizers' | 'Drinks' | 'Desserts'
  price: number; // Base price in USD ($)
  description: string;
  portionSizes?: { size: 'Single' | 'Combo' | 'Family' | string; price: number }[];
  addOns?: { name: string; price: number }[];
  prepTime?: string; // e.g. "20-30 mins"
  imageUrl?: string;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  inStock: boolean;
}

export interface SneakerItem {
  id: string;
  name: string;
  brand: string;
  category: 'Sneakers' | 'Running' | 'Casual Shoes' | 'Streetwear' | string;
  price: number; // in USD ($)
  sizes: string[];
  colors: string[];
  description: string;
  soleMaterial?: string;
  upperMaterial?: string;
  imageUrl?: string;
  inStock: boolean;
  featured?: boolean;
}

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  price: number; // in USD ($)
  sizes: string[];
  colors: string[];
  description: string;
  fabric?: string;
  care?: string;
  imageUrl?: string;
  inStock: boolean;
}

export interface StoreProfile {
  id: string;
  name: string;
  tagline: string;
  category: 'restaurant' | 'sneakers' | 'clothing' | 'general';
  currency?: string; // e.g. 'USD' ($)
  phone: string;
  vodafoneCash?: string;
  instapay?: string;
  location: string;
  workingHours: string;
  prepTime?: string; // Estimated preparation time (e.g. "20-30 mins")
  deliveryZones: { zone: string; fee: number; eta: string }[];
  paymentMethods: string[];
  policy: string;
  greenApi?: {
    instanceId?: string;
    apiToken?: string;
    host?: string;
  };
  systemPrompt?: string;
  items: Array<any>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
  sizeOrColor?: string;
  portionSize?: 'Single' | 'Combo' | 'Family' | string;
  addOns?: string[];
  specialInstructions?: string; // e.g. "No onions, extra ranch"
}

export interface OrderDraft {
  items: OrderItem[];
  customerName?: string;
  phone?: string;
  address?: string;
  paymentMethod?: string;
  deliveryFee?: number;
  totalEstimated?: number;
  prepTime?: string;
  specialInstructions?: string;
  status: 'inquiry' | 'collecting_info' | 'ready_to_confirm' | 'confirmed';
  notes?: string;
  updatedAt: number;
}

export interface UserSession {
  phoneNumber: string;
  businessType: 'restaurant' | 'clothing' | 'sneakers';
  tenantId: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActive: number;
  orderDraft: OrderDraft;
}

export interface WebhookLog {
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
}

export interface ServerHealth {
  status: string;
  uptime: number;
  timestamp: string;
  geminiConfigured: boolean;
  webhookVerifyTokenConfigured: boolean;
  whatsappProvider: string;
}
