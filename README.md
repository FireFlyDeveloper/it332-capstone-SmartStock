# SmartStock

> **An Inventory and Delivery Tracking System with AI-Assisted Analytics for Glassram Glass and Aluminum Supply**

IT332 Capstone Project · Kim Eduard Saludes · Luraine Villaranda · Hazel

[![Repo](https://img.shields.io/badge/repo-FireFlyDeveloper%2Fit332--capstone--SmartStock-blue)](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock)
[![Branches](https://img.shields.io/badge/branches-4-success)]() [![License](https://img.shields.io/badge/license-Academic-lightgrey)]()

---

## 📑 Overview

SmartStock is a centralized desktop-based inventory and delivery management system designed to automate and optimize operations for **Glassram Glass and Aluminum Supply**. It transitions the business from manual, error-prone processes to a unified digital platform, providing real-time stock visibility, streamlined delivery logistics, and **AI-assisted analytics** for demand forecasting and inventory classification.

The full chapter is split across the team's branches. **Each section lives in its own branch and PRs into `main` for review.**

---

## 🌿 Branches

| Branch | Owner | GitHub | Section |
| --- | --- | --- | --- |
| [`Kim`](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/tree/Kim) | Kim Eduard Saludes | [`FireFlyDeveloper`](https://github.com/FireFlyDeveloper) | [Architecture & Technologies](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/blob/Kim/README.md) |
| [`Luraine`](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/tree/Luraine) | Luraine Villaranda | [`ure23`](https://github.com/ure23) | [System Features & AI Analytics](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/blob/Luraine/README.md) |
| [`Hazel`](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/tree/Hazel) | Hazel | [`HAZEL-2B`](https://github.com/HAZEL-2B) | [Development Methodology](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/blob/Hazel/README.md) |
| `main` | — | — | This overview · integration branch |

---

## 📄 Chapter Sections

The chapter (rendered across the branches) covers:

### 1. System Description
Centralized desktop inventory + delivery management for Glassram Glass and Aluminum Supply. AI-assisted analytics forecast demand, visualize trends, and classify inventory into fast- and slow-moving categories. → *Main branch (this README)*

### 2. Main Features — _see [`Luraine`](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/blob/Luraine/README.md)_
- **Automated Inventory Management** — real-time stock visibility, low-stock alerts
- **Integrated Order & Delivery Tracking** — public portal, status updates, recommended routes
- **AI-Driven Analytics** — sales trends, top materials, fast/slow classification, demand forecasting

### 3. System Architecture & Technologies — _see [`Kim`](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/blob/Kim/README.md)_
- Frontend: **Electron + React**
- Backend: **Node.js / Bun + Hono**
- Database: **PostgreSQL**
- AI & Automation: **DeepSeek API + n8n**
- Deployment: **Render + Vercel**

### 4. System Development Methodology — _see [`Hazel`](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/blob/Hazel/README.md)_
- **Agile Development** across six phases: Planning → Design → Development → Testing → Deployment → Review
- Active client (Admin/Owner) participation throughout

---

## 🤝 Team Workflow

```bash
# Clone
git clone git@github.com:FireFlyDeveloper/it332-capstone-SmartStock.git
cd it332-capstone-SmartStock

# Pick your branch
git checkout Kim      # or Luraine / Hazel

# Work, commit, push to your branch
git add .
git commit -m "docs: ..."
git push -u origin <your-branch>

# Open a PR into main when ready for integration
gh pr create --base main --reviewer FireFlyDeveloper
```

Each teammate pushes to their **own branch** (via SSH configured for their GitHub account). PRs into `main` are reviewed and merged for integration.

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

Full architecture write-up: [`Kim` branch →](https://github.com/FireFlyDeveloper/it332-capstone-SmartStock/blob/Kim/README.md)

---

## 📜 License

Academic capstone project — all rights reserved by the team and Glassram Glass and Aluminum Supply.
