# Augment Skills - Project Phases

**Total Timeline**: 3-4 weeks for MVP  
**Deployment Target**: GCP Cloud Run

---

## 🎯 MVP Overview

Build an admin-only LMS with:
- Heatmap dashboard showing employee skill proficiency
- Data import from CSV, Google Sheets, and Google Forms
- Simple password-based authentication
- PostgreSQL database
- Deploy to GCP Cloud Run

---

## 📅 Project Phases

### **Week 1: Foundation & Local Setup** ⬅️ **START HERE**
**Status**: Ready to begin  
**Guide**: [WEEK_1_GETTING_STARTED.md](./WEEK_1_GETTING_STARTED.md)

**Goals**:
- Set up local development environment
- Install Docker, Node.js/Python, GCP SDK
- Create PostgreSQL database with 3 tables
- Set up GCP project and Google Sheets API
- Create project structure and configuration files

**Deliverables**:
- ✅ PostgreSQL running in Docker
- ✅ Database schema created (employees, skills, employee_skills)
- ✅ GCP project with service account credentials
- ✅ Project structure with config files
- ✅ .env file configured

**Time**: 5-7 days

---

### **Week 2: Data Import**
**Status**: Not started  
**Prerequisites**: Week 1 complete

**Goals**:
- Build CSV upload functionality
- Implement Google Sheets import
- Add data validation
- Auto-create employees and skills
- Error handling and user feedback

**Deliverables**:
- ✅ CSV file upload and parsing
- ✅ Google Sheets API integration
- ✅ Data validation (email format, score range)
- ✅ Insert data into PostgreSQL
- ✅ Success/error messages

**Time**: 5-7 days

---

### **Week 3: Heatmap Dashboard**
**Status**: Not started  
**Prerequisites**: Week 2 complete

**Goals**:
- Build heatmap grid layout
- Color-code cells based on proficiency scores
- Add hover tooltips
- Implement search/filter
- Performance optimization

**Deliverables**:
- ✅ Heatmap grid (skills on left, employees on top)
- ✅ Color coding (red/yellow/green/gray)
- ✅ Tooltips showing score and date
- ✅ Search employees and skills
- ✅ Handles 100+ employees x 50 skills

**Time**: 5-7 days

---

### **Week 4: Polish & GCP Deployment**
**Status**: Not started  
**Prerequisites**: Week 3 complete

**Goals**:
- Add Google Forms integration
- Build CSV export functionality
- Create Dockerfile
- Set up Cloud SQL
- Deploy to Cloud Run
- Migrate database to production

**Deliverables**:
- ✅ Google Forms column mapping and import
- ✅ CSV export of current data
- ✅ Cloud SQL PostgreSQL instance
- ✅ Secrets in Secret Manager
- ✅ Container deployed to Cloud Run
- ✅ Production database migrated
- ✅ Demo-ready application

**Time**: 5-7 days

---

## 🚀 Getting Started

### Step 1: Read the Documentation
Before writing any code, read these documents:

1. **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** ⭐ **MANDATORY**
   - Secrets management (.env files)
   - Configuration management (no magic numbers)
   - Documentation requirements
   - Testing requirements (write tests before committing)
   - Python virtual environment setup
   - Logging standards

2. **[MVP_DEFINITION.md](./MVP_DEFINITION.md)**
   - Complete MVP specification
   - Technical stack details
   - Database schema
   - GCP deployment guide

3. **[LOCAL_TO_GCP_QUICKSTART.md](./LOCAL_TO_GCP_QUICKSTART.md)**
   - Quick reference for commands
   - Required files
   - Deployment steps

### Step 2: Start Week 1
Follow the detailed guide: **[WEEK_1_GETTING_STARTED.md](./WEEK_1_GETTING_STARTED.md)**

### Step 3: Choose Your Stack
Decide on:
- **Backend**: Node.js + Express OR Python + Flask
- **Frontend**: React OR simple HTML templates (EJS/Jinja)

Both options are documented in Week 1 guide.

---

## 📊 Success Criteria

After 4 weeks, the MVP should:

1. ✅ **Run locally** with Docker Compose
2. ✅ **Import data** from CSV, Google Sheets, and Google Forms
3. ✅ **Display heatmap** with color-coded proficiency levels
4. ✅ **Export data** as CSV
5. ✅ **Deploy to GCP** Cloud Run
6. ✅ **Pass all tests** (80%+ coverage)
7. ✅ **Demo-ready** for stakeholders

---

## 🎯 First Batch: Week 1 Tasks

Here's what you need to do **right now** to start:

### Day 1-2: Environment Setup
```bash
# 1. Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# 2. Install Node.js 18+ or Python 3.9+
# Node.js: https://nodejs.org/
# Python: https://www.python.org/

# 3. Install Google Cloud SDK
# Download from: https://cloud.google.com/sdk/docs/install

# 4. Clone repository
git clone https://github.com/dan-ablement/augment-skills.git
cd augment-skills
git checkout -b week-1-foundation

# 5. Create GCP project
gcloud projects create augment-skills-dev
gcloud config set project augment-skills-dev
gcloud services enable sheets.googleapis.com
```

### Day 2-3: Database Setup
```bash
# 1. Create docker-compose.yml (see WEEK_1_GETTING_STARTED.md)
# 2. Create database/init.sql (see WEEK_1_GETTING_STARTED.md)
# 3. Start PostgreSQL
docker-compose up -d

# 4. Verify database
docker exec -it augment-skills-db psql -U postgres -d augment_skills -c "\dt"
```

### Day 3-5: Project Structure
```bash
# 1. Choose Node.js or Python
# 2. Create project structure (see WEEK_1_GETTING_STARTED.md)
# 3. Set up .env file
cp .env.example .env
# Edit .env with your values

# 4. Install dependencies
npm install  # or pip install -r requirements.txt
```

---

## 📚 Additional Resources

- **[PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md)** - Full product vision (post-MVP)
- **[INTEGRATION_MODULES_SUMMARY.md](./INTEGRATION_MODULES_SUMMARY.md)** - Google Classroom & Slack (Phase 2+)
- **[README.md](./README.md)** - Project overview

---

## 💡 Tips for Success

1. **Follow the standards** - Read DEVELOPMENT_STANDARDS.md first
2. **Test as you go** - Write unit tests before committing
3. **Commit frequently** - Small, focused commits
4. **Document everything** - Add JSDoc/docstrings
5. **Ask questions** - Create GitHub issues if stuck

---

**Ready to start? Go to [WEEK_1_GETTING_STARTED.md](./WEEK_1_GETTING_STARTED.md)!**

