# Augment Skills

A Learning Management System (LMS) focused on tracking go-to-market (GTM) readiness for sales teams and solution architects.

## 🌐 Deployed Application

The application is deployed as a single Docker image on Google Cloud Platform:

- **Application**: https://augment-skills-656706478564.us-central1.run.app

A single Express server serves both the API (`/api/v1/*`) and the Next.js frontend on port 3001.

## 🎯 Overview

Augment Skills provides a visual heatmap dashboard that shows employee skill proficiency at a glance. Skills are listed on the left, employees across the top, with color-coded cells indicating proficiency levels. Managers can drill into their org hierarchy to assess team readiness across multiple dimensions.

**Color Coding** (admin-configurable thresholds):
- 🟢 Green: 85-100% (Proficient)
- 🟡 Yellow: 75-84% (Approaching Proficient)
- 🔴 Red: 0-74% (Not Proficient)
- ⚪ Gray: No data / Not assessed

## 🔐 Authentication

The application supports two authentication methods:

- **Google OAuth Login**: Available for authorized users
- **Admin Login**: Password-based admin access for application management
- **Role-Based Permissions**: Non-admin users see only their permitted org subtree

## 📋 Features

- **Google OAuth + Admin Access**: Secure login for authorized team members
- **Data Import**: CSV upload, Google Sheets, and Google Forms integration
- **Heatmap Dashboard**: Visual representation of team skill readiness
- **Hierarchical Org Drill-Down**: Expand/collapse manager hierarchies to explore team structure
- **Three Scoring Modes**: Average, Team Readiness (25th percentile), Coverage % (≥70 threshold)
- **Multi-Dimensional Filtering**: Filter by skills, roles, and teams with AND logic
- **Team Isolation**: View a single manager's branch of the org tree
- **Overall + Filtered Metrics**: Side-by-side comparison of full team vs. filtered results
- **Saved Views**: Save, load, and share named dashboard states
- **CSV and PDF Export**: Export data reflecting current filters and scoring mode
- **Auto-Refresh with Idle Detection**: Dashboard stays current without unnecessary polling
- **Admin Settings**: Configurable color thresholds and "Not Assessed" handling
- **Admin Employee Management**: Create, edit, and archive employees with restore capability
- **Admin Skills Management**: Create, edit, and archive skills — archived skills are hidden from the dashboard
- **Role-Based Permissions**: Non-admin users see only their permitted org subtree

## 🏗️ Architecture

### Tech Stack (Updated: February 2026)

**Backend**:
- **Framework**: Node.js + Express + TypeScript
- **Job Queue**: Bull + Redis
- **Authentication**: Google OAuth 2.0 + Session-based admin auth

**Frontend**:
- **Framework**: Next.js 14+ with TypeScript
- **UI Library**: Tailwind CSS
- **Data Visualization**: Recharts (heatmap and charts)
- **State Management**: React Context API

**Database & Cache**:
- **Primary Database**: PostgreSQL 14+
- **Cache/Sessions**: Redis 7+
- **Local Development**: Docker Compose

**Deployment**:
- **Docker**: Single image (`docker build -t augment-skills .`) — serves API + frontend on port 3001
- **Compute**: Cloud Run (single service)
- **Database**: Cloud SQL (PostgreSQL) with private IP
- **Cache/Sessions**: Memorystore (Redis) for session management
- **Networking**: VPC Connector for private networking

**Why This Stack?**
- ✅ **Modular**: Easy to add new data source integrations
- ✅ **Scalable**: Cloud Run auto-scaling + Redis caching for fast dashboards
- ✅ **Type-Safe**: TypeScript across frontend and backend
- ✅ **Secure**: Private networking, managed SSL, OAuth authentication

## 📚 Documentation

- **[LOCAL_TO_GCP_QUICKSTART.md](./LOCAL_TO_GCP_QUICKSTART.md)** - Quick reference for local dev and GCP deployment
- **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** - Mandatory standards (secrets, config, testing, logging)
- **[PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md)** - Full product vision and roadmap

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+
- Google Cloud SDK (for GCP deployment)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/dan-ablement/augment-skills.git
cd augment-skills

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Start PostgreSQL and Redis
docker-compose up -d

# 4. Start backend (terminal 1)
cd backend && npm install && npm run dev
# Backend API runs on http://localhost:3001

# 5. Start frontend (terminal 2)
cd frontend && npm install && npm run dev
# Frontend runs on http://localhost:3000

# 6. Open the app
open http://localhost:3000
```

> **Note:** In local development, the Next.js frontend runs on port 3000 and proxies API requests to the backend on port 3001. In production, a single Express server serves both the API and the built Next.js frontend on port 3001.

### Running Tests

```bash
# Backend tests (82 tests)
cd backend && npx jest --verbose

# Frontend tests (37 tests)
cd frontend && npx jest --verbose
```

### TypeScript Compilation

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

### Docker (Production Build)

```bash
# Build the unified image
docker build -t augment-skills .

# Run locally
docker run -p 3001:3001 --env-file .env augment-skills

# Access at http://localhost:3001
```

## 📅 Development Timeline

- **Phase 1**: Local setup, database schema, authentication (Google OAuth + admin), CSV/Google Sheets/Google Forms data import, heatmap dashboard, CSV export, GCP Cloud Run deployment
- **Phase 2**: Hierarchical org drill-down, three scoring modes, multi-dimensional filtering, team isolation, saved views, CSV/PDF export with filters, auto-refresh, admin settings, role-based permissions, assessment snapshots
- **Phase 3**: Admin panel enhancements — employee archive/restore, skills CRUD with archive/restore, admin navigation update

## 💰 Cost Estimate

- **Cloud Run**: Free tier (2M requests/month) — single service for API + frontend
- **Cloud SQL**: ~$10-15/month (db-f1-micro PostgreSQL)
- **Memorystore (Redis)**: ~$15-25/month (Basic tier, 1GB)
- **VPC Connector**: ~$7/month (f1-micro instances)
- **Total**: ~$35-50/month for production deployment

## 📖 License

MIT

## 👥 Contributing

This is currently a private project. Contributions welcome after launch.

## 📧 Contact

For questions or feedback, please open an issue.

