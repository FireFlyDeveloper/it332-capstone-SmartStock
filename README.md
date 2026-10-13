# SmartStock

> **An Inventory and Delivery Tracking System with AI-Assisted Analytics for Glassram Glass and Aluminum Supply**  
> Batangas State University · IT332 Capstone Project · 2026

[![Repo](https://img.shields.io/badge/repo-FireFlyDeveloper%2Fit332--capstone--SmartStock-blue)](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock)
[![Backend Tests](https://img.shields.io/badge/tests-72%2F72%20passing-brightgreen)](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock)
[![Database](https://img.shields.io/badge/database-PostgreSQL%2014%2B-blue)](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock)
[![API](https://img.shields.io/badge/API-Hono.js%20(Node%2FBun)-orange)](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-61dafb)](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock)
[![License](https://img.shields.io/badge/license-Academic-lightgrey)]()

---

## 📑 Executive Overview

**SmartStock** is a comprehensive, full-stack inventory management, delivery tracking, and business intelligence platform designed specifically for **Glassram Glass and Aluminum Supply**. 

Historically, Glassram operated using manual logbooks and fragmented spreadsheets, resulting in inventory inaccuracies, lack of real-time stock visibility, uncoordinated dispatching, and absence of data-driven forecasting. SmartStock eliminates these operational bottlenecks through:

1. **Automated Inventory Control** with real-time stock deduction, low-stock threshold alerts, and granular inward/outward movement auditing.
2. **Synchronized Order & Delivery Tracking** with automated route sequencing, status workflows, and a public tracking portal featuring privacy-preserving customer data masking.
3. **AI-Assisted Analytics & Predictive Forecasting** providing monthly sales trends, fast-moving vs. slow-moving stock classification, and proactive replenishment suggestions.
4. **Dual-Tier Enterprise Persistence** combining high-performance in-memory cache operations with synchronous PostgreSQL write-through persistence.
5. **Role-Based Access Control (RBAC)** delineating administrative governance from daily operational counter actions.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer"]
        Web["Web Portal (React 19 + Vite + Tailwind CSS)"]
        Desktop["Desktop Application (Electron)"]
        PublicPortal["Public Tracking Portal (/track)"]
    end

    subgraph ApiLayer ["Backend API Layer (Hono.js / Node.js)"]
        Router["Hono Router & CORS Middleware"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
        
        subgraph Modules ["Service Modules"]
            AuthMod["Auth Service (bcrypt + JWT)"]
            InvMod["Inventory & Movements Service"]
            OrdMod["Order & Payment Service"]
            DelMod["Delivery & Route Dispatch Service"]
            RepMod["Reporting Engine (PDFKit & ExcelJS)"]
            AIMod["AI & Analytics Service"]
        end
    end

    subgraph DataLayer ["Dual-Tier Persistence Layer"]
        MemStore["In-Memory State Store (Low Latency Cache)"]
        SyncState["Write-Through Sync Coordinator"]
        PG[(PostgreSQL Database)]
    end

    subgraph ExternalServices ["External Integrations"]
        DeepSeek["DeepSeek AI API (Forecasting & Advice)"]
        n8n["n8n Webhook Automation"]
    end

    Web --> Router
    Desktop --> Router
    PublicPortal --> Router

    Router --> AuthMiddleware
    AuthMiddleware --> Modules

    InvMod <--> MemStore
    OrdMod <--> MemStore
    DelMod <--> MemStore
    AuthMod <--> MemStore

    MemStore --> SyncState
    SyncState --> PG

    AIMod --> DeepSeek
    Modules -.-> n8n
```

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries | Purpose |
| :--- | :--- | :--- |
| **Web Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts | Interactive single-page management application |
| **Desktop App** | Electron, TypeScript | Dedicated on-premise workstation application |
| **Backend API** | Node.js / Bun, Hono.js (`@hono/node-server`), TypeScript | High-performance, lightweight REST API |
| **Database** | PostgreSQL (`pg` connection pool) | Relational persistence across 30 tables |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` | Secure session handling and role-based access control |
| **Reporting** | PDFKit, ExcelJS | Server-side binary generation of PDF audit sheets and Excel workbooks |
| **AI & Automation** | DeepSeek API, n8n webhooks | Intelligent inventory categorization, demand forecasting, event notifications |
| **Testing & Tooling** | Vitest, TypeScript (`tsc`), Oxlint | Automated unit and integration testing with 100% suite pass rate |

---

## 🔑 Role-Based Access Control (RBAC) & Default Accounts

SmartStock enforces strict role segregation according to operational responsibilities:

| Capability | Administrator (`admin`) | Operations Staff (`staff`) | Public Customer |
| :--- | :---: | :---: | :---: |
| Full Catalog Creation & Deletion | ✅ | ❌ | ❌ |
| Record Inbound Restocking Receipts | ✅ | ✅ | ❌ |
| Create Commercial Orders | ✅ | ✅ | ❌ |
| Apply Payments & Process Refunds | ✅ | ✅ | ❌ |
| Advance Delivery Status Steps | ✅ | ✅ | ❌ |
| Export Audit Reports (PDF & Excel) | ✅ | ❌ | ❌ |
| User Administration & Role Changes | ✅ | ❌ | ❌ |
| Track Delivery Status (Masked PII) | ✅ | ✅ | ✅ |

### Default System Accounts

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator (Owner)** | `admin` | `admin@smartstock.local` | `admin123` |
| **Operations Staff** | `staff` | `staff@smartstock.local` | `staff123` |

> **Public Tracking Reference Codes**: Anyone can access public tracking without logging in using reference numbers such as `SS-2026-00001`, `DEL-001`, or any active order ID. Customer names and sensitive details are automatically masked (e.g., `Ana C.`).

---

## 📦 Database Schema & Seed Data

The schema is defined in [`db/schema.sql`](./db/schema.sql) and encompasses 30 interconnected tables. Key operational entities include:

- **`users`**: System credentials, full name, role (`admin` or `staff`), timestamps.
- **`products`**: Catalog items with category, unit, current stock, threshold, min stock, unit price, and description.
- **`orders`** & **`order_items`**: Commercial sales records with order number, customer details, fulfillment status, payment status, items, subtotal, and tax.
- **`deliveries`**: Logistical dispatch tracking, delivery address, driver details, delivery status, and scheduling.
- **`stock_movements`**: Immutable audit log of all inventory changes (`inbound`, `outbound`, `adjustment`) with balance after movement and user references.
- **`notifications`**: System alerts for critical thresholds, restocks, and delivery milestones.

### Live Seed Dataset
The system includes seed data reflecting authentic glass and aluminum operations:
- **120 Products**: Float glass (Clear, Bronze, Dark Grey), Tempered architectural glass, Aluminum profiles (Tubular, Sliding, Casement), and installation hardware.
- **120 Orders**: Commercial transactions spanning recent operating months.
- **105 Deliveries**: Dispatches across Batangas, Laguna, and surrounding areas.
- **456 Stock Movements**: Complete historical transaction audit trail.

---

## 🚀 Key Functional Modules

### 1. Real-Time Inventory Control
- Live catalog visibility with instant stock counts.
- Reorder threshold alerts triggered when quantity falls below safety stock.
- Dual-direction stock movements: Staff can receive inbound shipments (`POST /products/:id/stock/inbound`), while confirmed orders automatically decrement stock and log audit movements.

### 2. Commercial Order Management & Payments
- Itemized orders calculating unit costs, subtotals, and total amounts.
- Multi-status lifecycle: `Pending` → `Processing` → `Completed` (or `Cancelled`).
- Payment recording: `Unpaid` → `Partial` → `Paid` with support for payment adjustments and refunds.

### 3. Delivery Route Dispatch & Public Portal
- Driver assignment and logistical dispatch status transitions: `Pending` → `In Transit` → `Delivered` → `Failed`.
- Automated route sequence suggestions based on destination groupings.
- Public tracking endpoint (`/tracking/:trackingNumber`) accessible to clients without authentication, returning sanitized tracking data and milestone timestamps.

### 4. AI-Driven Analytics & Decision Support
- **Turnover Analysis**: Identifies fast-moving vs. slow-moving inventory to mitigate dead stock.
- **Sales Trends**: Aggregates monthly revenue curves, category distribution, and quarterly performance metrics directly from real orders.
- **Predictive Replenishment**: Heuristic and DeepSeek AI-assisted alerts forecasting demand and recommending reorder batches.

### 5. Multi-Format Report Generation
- **PDF Reports**: Formatted inventory stock summaries and financial reports generated on the fly using PDFKit.
- **Excel Workbooks**: Multi-column spreadsheets generated via ExcelJS for accounting and auditing.
- Protected behind Admin-only authentication.

---

## 📡 Core API Reference

All protected endpoints require an `Authorization: Bearer <token>` header obtained from `/auth/login`.

| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/auth/login` | `POST` | Public | Authenticates credentials and returns a signed JWT |
| `/auth/register` | `POST` | Admin | Registers a new staff or admin user |
| `/auth/profile` | `GET` | Authenticated | Returns currently authenticated user details |
| `/products` | `GET` | Authenticated | Returns all products with category and stock counts |
| `/products/:id` | `GET` | Authenticated | Retrieves product details by ID or SKU |
| `/products` | `POST` | Admin | Creates a new product in the catalog |
| `/products/:id` | `PUT` / `PATCH` | Admin | Updates product specifications or price |
| `/products/:id` | `DELETE` | Admin | Removes a product from the catalog |
| `/products/:id/stock/inbound` | `POST` | Staff / Admin | Records an inbound restock shipment and updates inventory |
| `/products/:id/movements` | `GET` | Authenticated | Returns movement history for a specific product |
| `/orders` | `GET` | Authenticated | Retrieves order history with item breakdowns |
| `/orders/:id` | `GET` | Authenticated | Returns single order details |
| `/orders` | `POST` | Staff / Admin | Creates a new commercial order and reserves stock |
| `/orders/:id/payment` | `POST` | Staff / Admin | Records a payment against an order |
| `/orders/:id/refund` | `POST` | Staff / Admin | Processes an order refund |
| `/deliveries` | `GET` | Authenticated | Retrieves delivery assignments and statuses |
| `/deliveries/:id` | `PATCH` / `PUT` | Staff / Admin | Updates delivery progress (e.g., mark `In Transit` / `Delivered`) |
| `/deliveries/routes/optimize` | `GET` | Staff / Admin | Returns suggested delivery order by location grouping |
| `/tracking/:trackingNumber` | `GET` | Public | Returns sanitized delivery progress for customer tracking |
| `/reports/export` | `GET` | Admin | Generates dynamic binary exports (`?type=inventory\|sales&format=pdf\|xlsx`) |
| `/analytics/kpis` | `GET` | Authenticated | Returns aggregated live KPIs (revenue, orders, stock counts) |
| `/health` | `GET` | Public | Returns server status |
| `/health/db` | `GET` | Public | Checks PostgreSQL database connection health |

---

## ⚙️ Getting Started & Installation

### Prerequisites
- **Node.js**: v20.x or higher
- **PostgreSQL**: v14.x or higher
- **npm** or **bun**

### 1. Database Setup
Create the database and apply the canonical schema:

```bash
# Create the PostgreSQL database
createdb smartstock

# Apply the canonical schema
psql -d smartstock -f db/schema.sql
```

### 2. Environment Configuration
Create a `.env` file in the project root:

```ini
DATABASE_URL=postgresql://user:password@localhost:5432/smartstock
JWT_SECRET=your-secure-jwt-secret-key-2026
PORT=3000
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
```

*(Note: If connecting via a local Unix socket, you can use `postgresql:///smartstock?host=/var/run/postgresql&port=5433`)*

### 3. Backend Setup & Startup
Install dependencies and run the API server:

```bash
cd backend
npm install
npm run dev
```

The backend server starts on **`http://localhost:3000`**. On initial startup with an empty database, it will automatically hydrate and seed the full catalog and transaction history.

Verify database health:
```bash
curl http://localhost:3000/health/db
# Output: {"mode":"postgres","ok":true}
```

### 4. Frontend Setup & Startup
Install dependencies and launch the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

The web application opens at **`http://localhost:5173`**. The Vite development server automatically proxies `/api` and backend routes to `http://localhost:3000`.

### 5. Desktop Application (Electron)
To launch the desktop application:

```bash
cd desktop
npm install
npm start
```

---

## 🧪 Testing & Verification

The backend includes a comprehensive Vitest test suite covering authentication, inventory mutations, order processing, delivery lifecycles, report generation, and database health.

Run all tests:
```bash
cd backend
npm test
```

Expected output:
```
 ✓ src/inventory/inventory.test.ts (11 tests)
 ✓ src/orders/orders.test.ts (7 tests)
 ✓ src/delivery/delivery.test.ts (6 tests)
 ✓ src/auth/auth.test.ts (12 tests)
 ✓ src/reports/reports.test.ts (10 tests)
 ✓ src/analytics/analytics.test.ts (9 tests)
 ✓ src/ai/ai.test.ts (6 tests)
 ✓ src/tracking/tracking.test.ts (3 tests)
 ✓ src/notifications/hooks.test.ts (4 tests)
 ✓ src/notifications/webhook.test.ts (3 tests)
 ✓ src/db/health.test.ts (1 test)

 Test Files  11 passed (11)
      Tests  72 passed (72)
```

Run frontend typecheck and production build:
```bash
cd frontend
npm run build
# Compiles TypeScript with 0 errors and generates production bundle
```

---

## 👥 Team & Chapter Documentation

This project was developed for the IT332 Capstone at Batangas State University. Each team member authored a dedicated chapter write-up:

| Teammate | GitHub Profile | Chapter Scope & Documentation |
| :--- | :--- | :--- |
| **Kim Eduard Saludes** | [`@FireFlyDeveloper`](https://github.com/FireFlyDeveloper) | **System Architecture & Technologies** — [`README.kim.md`](./README.kim.md) |
| **Luraine Villaranda** | [`@ure23`](https://github.com/ure23) | **System Features & AI Analytics** — [`README.luraine.md`](./README.luraine.md) |
| **Hazel** | [`@HAZEL-2B`](https://github.com/HAZEL-2B) | **Development Methodology** — [`README.hazel.md`](./README.hazel.md) |

### Repository Layout

```
it332-capstone-SmartStock/
├── backend/
│   ├── src/
│   │   ├── ai/            # DeepSeek integration & AI prompts
│   │   ├── analytics/     # Turnover calculations & KPI aggregation
│   │   ├── auth/          # JWT tokens, bcrypt, RBAC middleware, users store
│   │   ├── db/            # PostgreSQL client, config, syncState, postgresStore, seedData
│   │   ├── delivery/      # Delivery routes, dispatch store, route optimization
│   │   ├── inventory/     # Product catalog, stock adjustments, movements store
│   │   ├── notifications/ # Event webhooks & alerts
│   │   ├── orders/        # Commercial order creation, payments, refunds store
│   │   ├── reports/       # PDF and Excel binary export engines
│   │   ├── tracking/      # Public customer tracking portal service
│   │   └── index.ts       # Main Hono application entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Navigation, UI components, live DataContext
│   │   ├── pages/         # Dashboard, Inventory, Orders, Deliveries, Analytics, Tracking, Reports
│   │   └── App.tsx
│   └── package.json
├── desktop/               # Electron desktop wrapper
├── db/
│   ├── schema.sql         # Canonical PostgreSQL schema (30 tables)
│   └── auth_schema.sql    # Standalone auth schema reference
├── scripts/
│   └── generate-seed.mjs  # Catalog seed generator script
├── README.md              # Unified system documentation (this file)
├── README.kim.md          # Architecture & Technologies write-up
├── README.luraine.md      # Features & AI Analytics write-up
└── README.hazel.md        # Agile Development Methodology write-up
```

---

## 📜 License & Acknowledgments

This software is developed as an academic capstone project at **Batangas State University** for **Glassram Glass and Aluminum Supply**. All rights reserved by the development team and Glassram Glass and Aluminum Supply.
