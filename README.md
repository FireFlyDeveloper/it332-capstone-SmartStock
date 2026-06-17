# SmartStock

> An Inventory and Delivery Tracking System with AI-Assisted Analytics for **Glassram Glass and Aluminum Supply**

**IT332 Capstone Project** — Kim Eduard Saludes · Luraine Villaranda · Hazel

---

## System Description

SmartStock is a centralized desktop-based inventory and delivery management system designed to automate and optimize operations for Glassram Glass and Aluminum Supply. The system transitions the business from manual, error-prone processes to a unified digital platform. It provides real-time monitoring of stock levels, streamlines order and delivery logistics, and incorporates AI-Assisted Analytics to empower business owners with actionable insights for strategic decision-making.

A core component of the system is its AI-Assisted analytics module, which analyzes historical sales data to forecast future product demand, visualize sales trends, and classify inventory into fast- and slow-moving categories. By integrating inventory control, logistics transparency, and predictive intelligence, SmartStock supports proactive stock management, reduces operational costs, and promotes data-driven business growth.

---

## Main Features

### 1. Automated Inventory Management *(Luraine)*

Digitalizes the recording and monitoring of glass and aluminum stock levels, ensuring data accuracy and eliminating redundancies associated with manual bookkeeping. The system provides real-time stock visibility and automated low-stock alerts to prevent stockouts and overstocking.

### 2. Integrated Order and Delivery Tracking *(Luraine)*

Provides real-time status updates for orders (`Processing` → `In Transit` → `Delivered`) for both staff and customers through a public tracking portal. Enhances logistics efficiency by offering recommended delivery sequences based on location and schedule, improving route and operations efficiency.

### 3. AI-Driven Analytics for Business Intelligence *(Luraine)*

Analyzes monthly sales and transaction trends to visualize business performance. Identifies top-selling materials on an annual basis, classifies inventory as fast- or slow-moving, and applies predictive modeling using historical sales data to forecast future demand, enabling proactive inventory planning.

---

## System Architecture and Technologies *(Kim)*

The system is developed using modern web and desktop technologies to ensure performance, scalability, and a unified user experience.

| Layer | Tech |
| --- | --- |
| Frontend (Desktop + Web Portal) | Electron, React |
| Backend | Node.js / Bun, Hono |
| Database | PostgreSQL |
| AI & Automation | DeepSeek API, n8n |
| Deployment | Render (backend + DB), Vercel (web portal) |
| Version Control | Git, GitHub |

---

## System Development Methodology *(Hazel)*

This study adopts the **Agile Development Methodology** to guide the design and development of the SmartStock system. Agile is selected due to its iterative development approach, flexibility in accommodating evolving system requirements, and emphasis on continuous client feedback and integration.

### Six-Phase Process

1. **Planning Phase** — Define scope; analyze manual inventory + lack of centralized tracking. Identify modules with the store owner.
2. **Design Phase** — Architecture, DB structure, UI. Wireframes + flow diagrams validated with the client.
3. **Development Phase** — Incremental via Agile sprints. Each sprint ships a working module.
4. **Testing Phase** — Functional, usability, performance. Issues fixed before sign-off.
5. **Deployment Phase** — Packaged as Electron desktop app + web portal; users guided through transition.
6. **Review Phase** — Post-deployment evaluation with Admin/Owner + Staff. Feeds future enhancements.

### Client Involvement

Throughout development, the client (Admin/Owner) actively participates in requirements validation, feature evaluation, and system testing to ensure the final product accurately reflects the operational workflows and needs of Glassram Glass and Aluminum Supply.

---

## Team Workflow

| Branch | Owner | GitHub Account | Section Owned |
| --- | --- | --- | --- |
| `main` | — | (integration) | All sections combined |
| `Kim` | Kim Eduard Saludes | `FireFlyDeveloper` | Architecture & deployment |
| `Luraine` | Luraine Villaranda | `ure23` | Features & AI analytics |
| `Hazel` | Hazel | `HAZEL-2B` | Methodology & process |

Each teammate works on their own branch. Open Pull Requests into `main` for review and integration.
