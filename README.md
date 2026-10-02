# Raddad (ردّاد) — Production-Ready AI WhatsApp SaaS Engine for Retail & F&B Multi-Tenancy

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Gemini%20AI-3.8%20Flash-orange?logo=google)](https://ai.google.dev/)
[![React 19](https://img.shields.io/badge/React-19-cyan?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Docker Ready](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)](https://www.docker.com/)
[![License: Commercial Turnkey](https://img.shields.io/badge/License-Commercial%20Turnkey-purple)](https://acquire.com)

> **Autonomous B2B Conversational Commerce & Customer Support Infrastructure Powered by Google Gemini 3.8 Flash, Multi-Tenant Express Router, and Dual Meta Cloud / Green API WhatsApp Gateways.**

---

## 🌟 Live Interactive Demo & Buyer Sandbox (Test Right Now)

Buyers on **Acquire.com**, **Flippa**, or **GitHub** can test the fully functional production system immediately without setting up or installing anything:

| Channel | Direct Access Link | Experience & Capability |
| :--- | :--- | :--- |
| 🌐 **Live Web Control Center** | [https://ais-pre-a3vdaa3zytu2fvakzvh656-913581071420.europe-west2.run.app](https://ais-pre-a3vdaa3zytu2fvakzvh656-913581071420.europe-west2.run.app) | Full English dashboard. Click **"Auto-Play Demo Walkthrough"** for a self-running 60s tour! |
| 📱 **Live Production WhatsApp Bot** | [https://wa.me/201132044823](https://wa.me/201132044823?text=Hi%2C%20I%20would%20like%20to%20test%20the%20Raddad%20WhatsApp%20AI%20engine%21) | Chat on phone (`+20 113 204 4823`) to experience real sub-second Egyptian/English AI responses. |
| 🧪 **In-Memory Local Sandbox** | `/api/chat/simulate` in Dashboard | Test unlimited conversations with zero SMS or external WhatsApp fees. |

---

## 1. Executive Summary & Core Value Proposition

**Raddad (ردّاد)** is an enterprise-grade, turn-key conversational AI SaaS engine built to automate high-volume sales, order collection, sizing consultations, and customer care on WhatsApp. Designed specifically to eliminate 6+ months of complex full-stack engineering, it provides businesses with an end-to-end, multi-tenant solution ready for immediate commercial monetization.

### Why Buyers Choose Raddad:
* 🚀 **True Turn-Key SaaS:** Pre-loaded with working production store profiles across **Restaurants & F&B (Pizza, Smash Burgers)** and **Retail/Footwear (Sneakers, Apparel)**.
* ⚡ **Ultra-Low Latency & High Concurrency:** Sub-2.0s conversational response pipeline with a local fallback circuit breaker that guarantees 100% uptime during upstream LLM latency spikes.
* 🗣️ **Localized Intelligence (Egyptian Dialect & Multilingual):** Fluent in authentic Egyptian Arabic (friendly, persuasive, culturally nuanced), Franco-Arabic, and professional English.
* 🛡️ **Enterprise Security Shield:** Defends against prompt injection attacks, LLM jailbreaks, system prompt exfiltration, and replay exploits.
* 💰 **High Commercial Valuation:** Built for B2B SaaS founders and agencies looking to onboard hundreds of merchant subscribers on a single server cluster or deploy custom white-label instances.

---

## 2. Primary Live Demo Contact

Test the live production engine directly on WhatsApp without installing anything:

* 📱 **WhatsApp Live Demo Number:** `+20 113 204 4823`
* 🔗 **Instant Click-to-Chat:** [https://wa.me/201132044823](https://wa.me/201132044823?text=Hi%2C%20I%20would%20like%20to%20test%20the%20Raddad%20WhatsApp%20AI%20engine%21)
* 💡 **What to test:** Ask about pizza meal deals (Single vs Combo), request burger add-ons, inquire about sneakers sizes (e.g., *Air Jordan 1 size 43*), or ask about inspect-before-pay delivery policies.

---

## 3. System Architecture

```text
                                  +-------------------------------------------------------+
                                  |            Incoming WhatsApp Ingestion                |
                                  |   [Meta Cloud API]           [Green API Gateway]      |
                                  +--------------------------+----------------------------+
                                                             |
                                                             v
+-------------------------------------------------------------------------------------------------------------------------+
|                                    Express.js Multi-Tenant Webhook Ingestion Router                                     |
|     /webhook/pizza-store          /webhook/burger-joint          /webhook/hml          /webhook/hpp                     |
+------------------------------------------------------------+------------------------------------------------------------+
                                                             |
                                                             v
+-------------------------------------------------------------------------------------------------------------------------+
|                                              Enterprise Security Shield                                                 |
|   - Anti-Replay Cache (Message ID)         - Token Bucket Rate Limiter          - Prompt Injection Sanitizer            |
+------------------------------------------------------------+------------------------------------------------------------+
                                                             |
                                                             v
+-------------------------------------------------------------------------------------------------------------------------+
|                                 Concurrency Manager: Per-Phone Mutex Lock & Worker Pool                                 |
|                               (Guarantees strictly sequential order processing per customer)                            |
+------------------------------------------------------------+------------------------------------------------------------+
                                                             |
                                                             v
+-------------------------------------------------------------------------------------------------------------------------+
|                                              Sliding Window Memory Store                                                |
|                                    (Maintains last 10 contextual messages per tenant)                                   |
+------------------------------------------------------------+------------------------------------------------------------+
                                                             |
                                                             v
+-------------------------------------------------------------------------------------------------------------------------+
|                                           Dual AI Engine Orchestrator                                                   |
|             Primary: Google Gemini 3.8 Flash SDK           <--->           Fallback: Local Rule-Based Engine            |
|             (System instructions + Catalog context)                        (2.2s Circuit Breaker Fast Response)         |
+------------------------------------------------------------+------------------------------------------------------------+
                                                             |
                                                             v
+-------------------------------------------------------------------------------------------------------------------------+
|                                      POS / Draft Order Structured Extractor                                             |
|                     (Captures: Items, Portion Sizes, Add-ons, Address, Phone, Total EGP, Delivery ETA)                 |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

## 4. Key Architectural Features

### 🏢 Multi-Tenancy & Store Isolation Engine
* **Dedicated Webhook Endpoints:** Each tenant receives a distinct webhook route (`/webhook/:tenantId`, e.g., `/webhook/pizza-store`, `/webhook/burger-joint`, `/webhook/hml`, `/webhook/hpp`, `/webhook/nine`).
* **Zero Cross-Talk Guarantee:** Catalogs, inventory levels, order draft histories, conversational memory, and business hours are isolated per store slug.
* **Dynamic Tenant Registry:** Manage tenants via `src/server/storeRegistry.ts` and persistent JSON storage (`data/stores-registry.json`). Stores can be added, edited, or deactivated in real time through the dashboard or REST APIs.

### 🍔 Food & Beverage (F&B / Restaurant) Module
* **Portion Sizes & Meal Formats:**
  * **Single:** Standard individual sandwich or pizza.
  * **Combo:** Automatically prompts upselling for seasoned fries and a soft drink.
  * **Family / Party Box:** Value bundles with multiple mains, sharing sides, and 1L beverages.
* **Toppings & Add-ons Upselling:**
  * Suggests melted mozzarella stuffed crust, cheddar dips, loaded bacon fries, jalapeño slices, and gourmet sauces.
* **Kitchen Instructions & Allergies:**
  * Detects special cooking notes ("spicy level", "no onions", "extra pickles on the side", food sensitivities).
* **Preparation & ETA Calculation:**
  * Calculates realistic cooking prep time (e.g., 15–25 mins) plus zone-based courier delivery ETA.

### 👟 Retail & Footwear Sizing Intelligence
* **European Shoe Sizing (EU 40–46):** Intelligently checks requested sizes, suggests alternatives when out of stock, and confirms colorways.
* **Fashion Apparel Specs:** Categorizes heavyweight cotton (240 GSM), linen, and cargo pants with weight-to-size recommendations (M, L, XL, XXL, 3XL).
* **Objection Handling (Try Before You Pay):** Proactively reassures hesitant online shoppers that couriers permit opening, inspecting, and trying on items before paying a single pound.

### 🎛️ Unified Control Center (All-in-One Dashboard)
* **Single-Screen Management:** Clean, executive-level English interface designed to eliminate multi-screen confusion for non-technical store managers.
* **Visual Menu & Catalog Editor:** Easily add and edit items, pricing, portion tiers, toppings, and image URLs with live image previews.
* **1-Click "Save & Deploy":** Updates live catalog items and propagates them immediately to the active AI prompts without restarting the server.
* **3-Step Store Setup Wizard:** Streamlined onboarding flow for launching new restaurant or retail tenants in under 60 seconds.

### 🧪 Integrated WhatsApp Simulator (Zero-Cost Local Sandbox)
* **In-Memory Local Testing:** Located at `/api/chat/simulate`.
* **Zero Outbound SMS/WhatsApp Costs:** Simulates the complete conversational loop, order extraction, and memory sliding window entirely within the server's sandbox without consuming external Green API or Meta credits.
* **Multimodal Playground:** Supports attaching product photos, uploading menu snapshots, and testing mock voice notes directly in the browser.

---

## 5. Enterprise Cyber Security Shield

Raddad includes a dedicated security layer designed to prevent malicious exploits and LLM vulnerabilities:

| Security Module | Defense Mechanism | Benefit |
| :--- | :--- | :--- |
| **Prompt Injection Firewall** | Sanitizes user inputs against `Ignore previous instructions`, `System prompt leak`, and roleplay overrides. | Prevents bot manipulation and brand hijacking. |
| **Anti-Replay Attack Filter** | Deduplicates incoming message IDs (`wamid`) across a 10-minute sliding cache window. | Blocks network replay and double-ordering bugs. |
| **Token-Bucket Rate Limiter** | Enforces per-phone and per-IP thresholds (e.g., max 15 requests / 60 seconds). | Protects against DDoS and automated spam floods. |
| **Secret Exfiltration Shield** | Filters model responses to ensure API keys, internal IDs, and raw system instructions are never revealed. | Zero risk of credential leaks via conversational trickery. |
| **Per-Phone Mutex Lock** | Queues incoming messages from the same sender to ensure atomic sequential processing. | Eliminates race conditions in order placement. |

---

## 6. Technology Stack

* **Runtime & Backend:** Node.js (v20+), Express.js (v4.21), TypeScript (v5.6)
* **AI Orchestration:** Google Gen AI SDK (`@google/genai`), Gemini 3.8 Flash
* **Frontend UI:** React 19, Tailwind CSS v4, Lucide Icons, Vite
* **WhatsApp Connectivity:** Meta Official Cloud API & Green API Gateway (dual-mode)
* **Storage & Persistence:** In-Memory Worker Pools, Local JSON Registry, Extensible SQLite/PostgreSQL hook
* **DevOps & Containerization:** Docker, Google Cloud Run, PM2 ready

---

## 7. Quick Start & Deployment Guide

### Prerequisites
* Node.js v20.x or higher
* npm v10+
* A valid Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
* *(Optional for live WhatsApp)* Green API or Meta Cloud API credentials

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/your-username/raddad-whatsapp-ai-saas.git
cd raddad-whatsapp-ai-saas
npm install
```

### Step 2: Configure Environment Variables
Copy the example environment template and populate your keys:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=production
APP_URL=https://your-domain.run.app

# Gemini AI Engine
GEMINI_API_KEY=your_gemini_api_key_here

# Meta Cloud API (Official WhatsApp API)
META_WA_TOKEN=your_meta_token_here
META_PHONE_NUMBER_ID=your_phone_number_id_here
WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_here

# Green API (Alternative Instance Gateway)
GREEN_API_INSTANCE_ID=your_instance_id_here
GREEN_API_TOKEN=your_token_here
GREEN_API_HOST=https://7105.api.greenapi.com

# Active Provider ('green_api' | 'meta')
WHATSAPP_API_PROVIDER=green_api
```

### Step 3: Run in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Unified Control Center, switch between stores, and test conversations in the Integrated Simulator.

### Step 4: Build for Production
```bash
npm run build
npm start
```

---

## 8. Docker & Cloud Deployment

### Docker Build & Run
```bash
# Build Docker image
docker build -t raddad-whatsapp-ai .

# Run container on port 3000
docker run -p 3000:3000 --env-file .env raddad-whatsapp-ai
```

### 1-Click Google Cloud Run Deployment
```bash
gcloud run deploy raddad-engine \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars GEMINI_API_KEY="your_key"
```

---

## 9. API & Webhook Specifications

### Inbound WhatsApp Webhook Endpoints
* `POST /webhook/:tenantId` — Dynamic webhook router for specific stores (e.g., `/webhook/pizza-store`, `/webhook/burger-joint`, `/webhook/hml`).
* `GET /webhook` — Meta Webhook challenge and verification handshake.

### Management & Control REST APIs
* `GET /api/stores` — Returns all registered store tenants, active profiles, and catalogs.
* `POST /api/stores` — Create or update a store profile and its WhatsApp configuration.
* `POST /api/stores/active` — Switch the globally active context store.
* `POST /api/chat/simulate` — Local zero-cost simulation endpoint for sandbox testing.
* `GET /api/security/stats` — Real-time security telemetry and attack mitigation metrics.
* `GET /api/health` — Platform health check, memory usage, and gateway latency.

---

## 10. Commercial Handover & Acquisition Note

This codebase is packaged specifically for **commercial acquisition, white-label SaaS distribution, or direct client deployment**:

* **Clean Architecture:** Modular directory structure, strict TypeScript types, zero spaghetti code.
* **100% English Executive Dashboard:** Universal SaaS UX ready for international buyers on **Acquire.com** and **Flippa**.
* **IP Transfer Ready:** Full ownership rights, clean commit history, and zero proprietary external SDK lock-ins.
* **Immediate Revenue Opportunity:** Sell monthly WhatsApp AI subscriptions to local restaurants, burger chains, sneaker boutiques, and fashion brands ($100–$500/month per merchant).

---

## 📄 License & Commercial Terms

Distributed under a **Commercial Turnkey License**. For acquisition inquiries, source code licensing, or partnership opportunities, contact the development team via WhatsApp at `+20 113 204 4823`.
