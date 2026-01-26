# Augment Skills

A Learning Management System (LMS) focused on tracking go-to-market (GTM) readiness for sales teams and solution architects.

## 🎯 Overview

Augment Skills provides a visual heatmap dashboard that shows employee skill proficiency at a glance. Skills are listed on the left, employees across the top, with color-coded cells indicating proficiency levels.

**Color Coding:**
- 🟢 Green: 85-100% (Proficient)
- 🟡 Yellow: 75-84% (Approaching Proficient)
- 🔴 Red: 0-74% (Not Proficient)
- ⚪ Gray: No data / Not assessed

## 📋 MVP Features

The MVP focuses on proving the core value proposition with minimal complexity:

- **Admin-Only Access**: Simple password-based login (no SSO)
- **Data Import**: CSV upload, Google Sheets, and Google Forms integration
- **Heatmap Dashboard**: Visual representation of team skill readiness
- **CSV Export**: Download current skill data
- **No Notifications**: Focus on visualization first

## 🏗️ Architecture

- **Local Development**: PostgreSQL via Docker
- **Production**: GCP Cloud Run + Cloud SQL
- **Backend**: Node.js + Express (or Python + Flask)
- **Frontend**: React or simple HTML templates
- **Database**: PostgreSQL 14+

## 🚀 Getting Started

**New to this project? Start here:**

1. 📖 **[PROJECT_PHASES.md](./PROJECT_PHASES.md)** - Overview of all 4 weeks
2. 🎯 **[WEEK_1_GETTING_STARTED.md](./WEEK_1_GETTING_STARTED.md)** - ⭐ **Start here!** Detailed Week 1 guide
3. ⚠️ **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** - **MUST READ** before coding

## 📚 Documentation

### Getting Started Guides
- **[PROJECT_PHASES.md](./PROJECT_PHASES.md)** - 4-week project timeline and phases
- **[WEEK_1_GETTING_STARTED.md](./WEEK_1_GETTING_STARTED.md)** - Detailed Week 1 setup guide
- **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** - ⭐ **Mandatory standards** (secrets, config, testing, logging)

### Technical Documentation
- **[MVP_DEFINITION.md](./MVP_DEFINITION.md)** - Complete MVP specification with local development and GCP deployment guide
- **[LOCAL_TO_GCP_QUICKSTART.md](./LOCAL_TO_GCP_QUICKSTART.md)** - Quick reference for developers
- **[PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md)** - Full product vision and roadmap
- **[INTEGRATION_MODULES_SUMMARY.md](./INTEGRATION_MODULES_SUMMARY.md)** - Google Classroom and Slack integration specs

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+ (or Python 3.9+)
- Google Cloud SDK
- GCP account (free tier)

### ⚠️ Before You Start - Read Development Standards
**All developers must read [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md) before contributing.**

Key requirements:
- 🔐 All secrets in `.env` files (never in code)
- ⚙️ All config in config files (no magic numbers)
- 📚 Document all features and code
- 🧪 Write unit tests and test before committing
- 🐍 Python virtual environments outside repo (`~/.virtualenvs/`)
- 📊 Use structured logging for all operations

### Local Development

#### Node.js Setup
```bash
# 1. Clone repository
git clone https://github.com/dan-ablement/augment-skills.git
cd augment-skills

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Start PostgreSQL
docker-compose up -d

# 4. Install dependencies
npm install

# 5. Run migrations
npm run migrate

# 6. Start development server
npm run dev

# 7. Access application
open http://localhost:3000
```

#### Python Setup
```bash
# 1. Clone repository
git clone https://github.com/dan-ablement/augment-skills.git
cd augment-skills

# 2. Create virtual environment (OUTSIDE repo)
python -m venv ~/.virtualenvs/augment-skills
source ~/.virtualenvs/augment-skills/bin/activate

# 3. Set up environment
cp .env.example .env
# Edit .env with your values

# 4. Start PostgreSQL
docker-compose up -d

# 5. Install dependencies
pip install -r requirements.txt

# 6. Run migrations
python manage.py migrate

# 7. Start development server
python app.py

# 8. Access application
open http://localhost:3000
```

## 📅 Development Timeline

- **Week 1**: Local setup, database, basic auth
- **Week 2**: Data import (CSV, Google Sheets)
- **Week 3**: Heatmap dashboard
- **Week 4**: Google Forms integration + GCP deployment

## 💰 Cost Estimate

- **Cloud Run**: Free tier (2M requests/month)
- **Cloud SQL**: ~$10-15/month (db-f1-micro)
- **Total**: ~$10-20/month for MVP

## 📖 License

MIT

## 👥 Contributing

This is currently a private project. Contributions welcome after MVP launch.

## 📧 Contact

For questions or feedback, please open an issue.

