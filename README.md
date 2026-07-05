# SmartStock

> **An Inventory and Delivery Tracking System with AI-Assisted Analytics for Glassram Glass and Aluminum Supply**

IT332 Capstone Project · Kim Eduard Saludes · Luraine Villaranda · Hazel

[![Repo](https://img.shields.io/badge/repo-FireFlyDeveloper%2Fit332--capstone--SmartStock-blue)](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock)
[![License](https://img.shields.io/badge/license-Academic-lightgrey)]()

---

## 📑 Overview

SmartStock is a centralized desktop-based inventory and delivery management system designed to automate and optimize operations for **Glassram Glass and Aluminum Supply**. It transitions the business from manual, error-prone processes to a unified digital platform, providing real-time stock visibility, streamlined delivery logistics, and **AI-assisted analytics** for demand forecasting and inventory classification.

---

## 🤝 Team Workflow

We collaborate directly on **`main`** — pull, modify, push. No branch-per-section split, no PRs.

> Demo build for IT332 capstone presentation — frontend is polished; backend is offline by design. Use the demo credentials on the login screen.

```bash
git pull origin main
# edit files (e.g. db/schema.sql under your section header)
git add .
git commit -m "feat(db): <what you changed>"
git push origin main
```

Each teammate uses their own SSH key — push attempts are authenticated as the
committer. To avoid conflicts, **stay in your own section** of any shared file
(see `db/README.md` for the section ownership table) and keep the
`Last touched:` line at the top of your section header up to date.

| GitHub | Teammate | Section / file area |
| --- | --- | --- |
| [`FireFlyDeveloper`](https://github.com/FireFlyDeveloper) | Kim Eduard Saludes | Architecture & Technologies, top-level README |
| [`ure23`](https://github.com/ure23) | Luraine Villaranda | System Features & AI Analytics |
| [`HAZEL-2B`](https://github.com/HAZEL-2B) | Hazel | Development Methodology |

---

## 📂 Repository layout

| Path | What's in it |
| --- | --- |
| `db/schema.sql` | The single canonical PostgreSQL schema (all 3 sections, one transaction) |
| `db/README.md` | Section ownership, conventions, apply instructions |
| `README.kim.md` | Kim's chapter write-up — Architecture & Technologies |
| `README.luraine.md` | Luraine's chapter write-up — System Features & AI Analytics |
| `README.hazel.md` | Hazel's chapter write-up — Development Methodology |

---

## 📄 Chapter Sections

### 1. System Description
Centralized desktop inventory + delivery management for Glassram Glass and Aluminum Supply. AI-assisted analytics forecast demand, visualize trends, and classify inventory into fast- and slow-moving categories.

### 2. Main Features — _see [`README.luraine.md`](./README.luraine.md)_
- **Automated Inventory Management** — real-time stock visibility, low-stock alerts
- **Integrated Order & Delivery Tracking** — public portal, status updates, recommended routes
- **AI-Driven Analytics** — sales trends, top materials, fast/slow classification, demand forecasting

### 3. System Architecture & Technologies — _see [`README.kim.md`](./README.kim.md)_
- Frontend: **Electron + React**
- Backend: **Node.js / Bun + Hono**
- Database: **PostgreSQL**
- AI & Automation: **DeepSeek API + n8n**
- Deployment: **Render + Vercel**

### 4. System Development Methodology — _see [`README.hazel.md`](./README.hazel.md)_
- **Agile Development** across six phases: Planning → Design → Development → Testing → Deployment → Review
- Active client (Admin/Owner) participation throughout

---

## 🛠️ Tech Stack (summary)

| Layer | Tech |
| --- | --- |
| Desktop App | Electron |
| Web Portal | React, deployed on Vercel |
| Backend API | Node.js / Bun + Hono |
| Database | PostgreSQL, deployed on Render |
| AI Layer | DeepSeek API + n8n |
| Version Control | Git + GitHub |

Full architecture write-up: [`README.kim.md`](./README.kim.md)

---

## 📜 License

Academic capstone project — all rights reserved by the team and Glassram Glass and Aluminum Supply.
