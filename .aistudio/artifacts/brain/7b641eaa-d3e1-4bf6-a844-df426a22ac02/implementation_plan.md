# Implementation Plan: Fix Order Duplication, Accurate Customer Phone, Merchant Onboarding Wizard & Multi-Store QR Codes

Address the root causes of ghost order duplication, fix phone number extraction (resolving WhatsApp LIDs), enable store merchants to configure their own products, delivery timeframe (hours/days) and store details, and provide dedicated WhatsApp QR codes for multiple stores.

## User Decisions & Clarifications Confirmed
- **Store Configuration**: Form wizard in mobile portal for products, delivery times (hours/days), and store profile.
- **Ghost/Automatic Orders**: Completely eliminate automatic mock/duplicate orders and keep only real customer orders with session deduplication.
- **Multi-Store WhatsApp Connection**: Dedicated QR code card and independent connection session for each store.

---

## 1. Root Cause Analysis & Problem Diagnosis

### Problem 1: Ghost / Automatic Orders Appearing Repeatedly
- **Root Cause**: In `baileysService.ts` and `greenApiPoller.ts`, `extractOrderDetails()` runs on every incoming message. Once a customer has provided an address, any subsequent follow-up message ("شكراً", "هيوصل امتى؟", "تمام") triggers `orderManager.createOrderFromDraft()` again, creating duplicate orders with new IDs every few minutes.
- **Fix**: 
  - Add session locking in `memoryManager`: track `session.confirmedOrderId` and `session.orderPlacedAt`.
  - Only create an order once per confirmed buying cycle.
  - Clear out mock demo seed orders from `data/orders.json` so the merchant only sees genuine orders.

### Problem 2: Inaccurate Customer Phone Number
- **Root Cause**: WhatsApp Multi-Device sends messages with internal LIDs (Linked Device Identifiers, e.g. `31577321042040@lid`), which are device IDs, not telephone numbers. Additionally, when a customer types their Egyptian number in the message text (`010...` or `011...`), the system was relying on the JID user part rather than extracting the customer's phone from their message.
- **Fix**:
  - Implement a phone extraction engine using Egyptian mobile regex `/(?:01|201|\+201)[0125]\d{8}/`.
  - If incoming JID is a LID or non-phone identifier, prioritize the validated phone number extracted from the customer's conversation text.

### Problem 3: Delivery Time & Dynamic Merchant Catalog (No Hallucinated Estimates)
- **Root Cause**: Delivery times (e.g. 24-48 hours) and catalog items were partially hardcoded in system prompt strings.
- **Fix**:
  - Expand `StoreProfile` in `storeRegistry.ts` to include granular merchant settings:
    - `deliveryHoursOrDays`: Exact delivery duration for Cairo/Giza, Alexandria, and Upper Egypt (e.g. "خلال 24 ساعة" or "خلال 2 يوم عمل").
    - `deliveryFees`: Shipping cost per zone.
    - `products`: Dynamic catalog items added by the merchant via the UI.
  - Dynamically inject the merchant's exact delivery duration into `buildEgyptianSystemInstruction()`.
  - When the customer asks "هيوصل في قد إيه؟" or confirms an order, the AI replies with the merchant's exact configured timeframe, and explicitly sends the confirmation message:
    `"تم تأكيد الأوردر بتاعك وهيصلك خلال [مدة التوصيل المحددة] مع إمكانية المعاينة والقياس قبل الدفع."`

### Problem 4: Multi-Store WhatsApp QR Code Visibility
- **Root Cause**: In the UI, the Baileys QR code was single-instance or tied to a single active store, making it unclear where to find or scan the QR code when adding a new store.
- **Fix**:
  - Enhance `BaileysStoreManager.tsx` and `MultiStoreManager.tsx` so each store card prominently features its own WhatsApp QR code button, pairing status, and connection terminal.
  - Provide a dedicated QR card per store with clear Arabic instructions.

---

## 2. Technical Architecture & Component Changes

```
┌────────────────────────────────────────────────────────┐
│               MERCHANT MOBILE PORTAL (PWA)             │
│  • Store Onboarding Wizard (Name, Phone, Delivery Time)│
│  • Products & Price Catalog Editor                     │
│  • Dedicated QR Code Scanner & Connection Status       │
│  • Live Takeover Switch & Clean Real Orders Pipeline   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 BACKEND SAAS CONTROLLERS               │
│  • orderManager.ts: Deduplication & Valid Phone Filter │
│  • memoryManager.ts: Order Confirmation Lock           │
│  • storeRegistry.ts: Store Delivery Windows & Products │
│  • geminiService.ts: Exact Merchant Delivery Prompt    │
│  • baileysService.ts: Multi-Store Session Manager      │
└────────────────────────────────────────────────────────┘
```

### Proposed Changes

#### A. Backend & Data Layer
1. **`src/server/memoryManager.ts`**:
   - Add `lastConfirmedOrderId?: string` and `orderConfirmedTimestamp?: number` to `UserSession`.
   - Prevent duplicate order creation if an order was confirmed within the current session until explicitly reset.

2. **`src/server/orderManager.ts`**:
   - Clean up demo mock seed orders.
   - Implement `extractValidEgyptianPhone(text, fromJid)` to accurately parse phone numbers from text and discard internal WhatsApp LIDs.
   - Deduplicate order creation: if identical items/customer was created in the last 15 minutes, update instead of duplicating.

3. **`src/server/storeRegistry.ts` & `src/server/catalogData.ts`**:
   - Add fields: `deliveryTimeframeCairo`, `deliveryTimeframeDelta`, `deliveryTimeframeUpperEgypt`, `workingHours`, `merchantPhone`.
   - Add APIs to update delivery timeframes and products directly from the merchant portal.

4. **`src/server/geminiService.ts`**:
   - Update `buildEgyptianSystemInstruction()` to use the store's exact delivery duration and confirmation template.
   - Update order confirmation response to guarantee:
     `"تم تأكيد حجز الأوردر بتاعك وهيصلك خلال [المدة] مع ميزة المعاينة والقياس قبل الدفع!"`

5. **`src/server/whatsapp/baileysService.ts`**:
   - Pass multi-store identifiers and support multi-session auth directories (`data/baileys_auth_{storeId}`).
   - Pass real customer phone (not LID) to `orderManager.createOrderFromDraft`.

#### B. Frontend & UI Layer
6. **`src/components/MerchantMobilePortal.tsx`**:
   - Add new **Store Setup & Delivery Wizard** tab (`إعدادات المتجر والتوصيل`):
     - Form to set Store Name, Official WhatsApp Phone, Delivery duration (in hours or days per zone).
     - Product Catalog manager: Add products with price (EGP), sizes, colors, and stock.
     - QR Code card for connecting this specific store.
   - Clean up orders tab to show only genuine customer orders with real phone numbers and zero duplicate entries.

7. **`src/components/MultiStoreManager.tsx` & `src/components/BaileysStoreManager.tsx`**:
   - Add a dedicated WhatsApp QR card for each store in the store list.
   - Allow switching active QR session or scanning per-store.

---

## 3. Verification & Testing Plan

1. **Order Deduplication Verification**:
   - Simulate a customer confirming an order, followed by sending 3 additional conversational messages ("تمام", "شكراً", "هيوصل امتى؟").
   - Verify that only **1 order** is created in `orders.json` and merchant receives **1 alert**.
2. **Customer Phone Accuracy Verification**:
   - Test payload with WhatsApp LID (`31577321042040@lid`) where customer writes `"رقمي 01012345678"`.
   - Verify extracted `customerPhone` is `201012345678` (not the LID).
3. **Delivery Timeframe AI Verification**:
   - Configure a store with delivery timeframe: `"خلال 12 ساعة في القاهرة"`.
   - Ask the bot: `"الأوردر هيوصلني في قد إيه؟"`.
   - Verify the bot answers with the exact 12-hour timeframe.
4. **Multi-Store QR Code Verification**:
   - Create a second store `"Alex Sneaker Hub"`.
   - Verify that a distinct QR connection card is visible and accessible for both stores.
5. **Senior Test Suite Execution**:
   - Run `runSeniorTestSuite()` to ensure 100% health score is maintained.
