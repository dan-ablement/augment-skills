# Augment Skills - MVP Definition (Ultra-Simplified)

**Version:** 2.0 (Simplified)
**Target Timeline:** 3-4 weeks
**Target Users:** Admins/Managers only (view-only dashboard)

---

## MVP Vision

**Core Value Proposition**: Prove that a heatmap dashboard provides value for visualizing team GTM readiness.

**Success Criteria**:
- Dashboard displays skill data in an intuitive heatmap format
- Data can be imported from Google Forms, Google Sheets, or CSV
- Stakeholders can view and understand team readiness in under 5 seconds
- Positive feedback from 3-5 managers validates the concept

---

## What's IN the MVP

### 1. Admin-Only Authentication (MUST HAVE)

**Ultra-Simple Login**:
- Single admin username/password (hardcoded or environment variable)
- No user management system
- No roles, no permissions - everyone who logs in sees everything
- Session-based authentication (simple cookie)
- HTTPS for security

**Why**: Proves dashboard value without building complex auth system

### 2. Heatmap Dashboard (MUST HAVE)

**Simple Visualization**:
- **Left Column**: List of skills (flat list, alphabetical)
- **Top Row**: Employee names (alphabetical)
- **Grid Cells**: Color-coded scores
  - **Red**: 0-74% (Not Proficient)
  - **Yellow**: 75-84% (Approaching Proficient)
  - **Green**: 85-100% (Proficient)
  - **Gray**: No data / Not assessed
- **Hover Tooltip**: Show score and date when hovering over cell
- **No Click Interactions**: View-only dashboard

**Basic Filters** (Optional):
- Search employees by name
- Search skills by name
- That's it - keep it simple

**Why**: This is the core value - visual representation of team readiness

### 3. Data Import (MUST HAVE)

**Three Import Methods**:

#### Option A: CSV Upload
- Admin uploads CSV file with format:
  ```
  employee_name, employee_email, skill_name, score, assessment_date
  John Doe, john@company.com, Cloud Architecture, 92, 2026-01-15
  Jane Smith, jane@company.com, Cloud Architecture, 88, 2026-01-14
  ```
- System validates and imports data
- Shows success/error messages
- Overwrites existing scores (no merge logic in MVP)

#### Option B: Google Sheets Integration
- Admin provides Google Sheet URL (publicly readable or with API key)
- Sheet must follow same format as CSV
- "Import from Google Sheets" button
- System reads sheet and imports data
- Manual trigger (no automatic sync in MVP)

#### Option C: Google Forms Integration
- Admin provides Google Form responses sheet URL
- Admin maps form columns to data fields (one-time setup):
  - Which column = employee email?
  - Which column = skill name?
  - Which column = score?
  - Which column = date?
- "Import from Google Forms" button
- System reads responses and imports

**Why**: Flexibility to work with existing data sources without complex integrations

### 4. Simple Data Management (MUST HAVE)

**Database Schema** (Minimal):
- `employees` table: id, name, email
- `skills` table: id, name
- `employee_skills` table: employee_id, skill_id, score, assessment_date

**No History Tracking in MVP**: Just current state

**Admin Pages**:
- **View Employees**: Simple table showing all employees
- **View Skills**: Simple table showing all skills
- **Import Data**: Upload CSV or connect to Google Sheets/Forms

**Auto-Creation**:
- When importing data, automatically create employees and skills if they don't exist
- No manual employee/skill creation needed

**Why**: Minimize admin work - let the import handle everything

### 5. Basic Export (NICE TO HAVE)

**Simple Export**:
- "Export as CSV" button on dashboard
- Downloads current heatmap data as CSV file
- That's it

**Why**: Allows sharing data with stakeholders who don't have login access

---

## What's OUT of the MVP

### Explicitly Excluded (Build Later)

❌ **Any Notifications** - No emails, no Slack, nothing
❌ **User Management** - No employee/manager logins
❌ **Role-Based Access** - Everyone who logs in is an admin
❌ **SSO/SAML** - Simple password only
❌ **Historical Tracking** - Only current state, no skill_history table
❌ **Skill Expiration** - No expiration dates or tracking
❌ **Skill Categories** - Flat list only
❌ **Click-Through Details** - View-only heatmap
❌ **Individual Employee Views** - Only team heatmap
❌ **Advanced Filtering** - Just basic search
❌ **Automatic Sync** - Manual import only
❌ **Data Validation** - Basic validation only
❌ **Error Recovery** - Simple error messages
❌ **Mobile Responsive** - Desktop only
❌ **Advanced Analytics** - Just the heatmap
❌ **Reporting** - Just CSV export
❌ **API** - No API endpoints
❌ **Webhooks** - No real-time updates
❌ **Multi-tenancy** - Single organization only

---

## MVP User Stories

### Admin (Only User Type)
1. **As an admin**, I want to import skill data from CSV, so I can populate the dashboard quickly
2. **As an admin**, I want to import from Google Sheets, so I can use existing data sources
3. **As an admin**, I want to import from Google Forms, so I can use assessment results
4. **As an admin**, I want to view a heatmap of team skills, so I can see readiness at a glance
5. **As an admin**, I want to export the heatmap as CSV, so I can share with stakeholders
6. **As an admin**, I want to search for specific employees or skills, so I can find information quickly

---

## MVP Technical Stack (Local Development → GCP Cloud Run)

### Backend
- **Framework**: Node.js with Express (or Python with Flask/FastAPI)
- **Database**: PostgreSQL 14+ (local via Docker, production via Cloud SQL)
- **ORM**: Prisma (Node.js) or SQLAlchemy (Python) - recommended for migrations
- **Authentication**: Simple session middleware (express-session or similar)
- **File Upload**: Multer (Node.js) or similar for CSV uploads
- **Configuration**: Environment variables via dotenv (local) and Secret Manager (GCP)

### Frontend
- **Framework**: React 18 (or even vanilla JavaScript with a template engine)
- **UI Library**: Tailwind CSS or Bootstrap (keep it simple)
- **State Management**: None needed - just fetch and display
- **Heatmap**: CSS Grid with colored divs (no fancy library needed)
- **File Upload**: Standard HTML form with file input

### Local Development Infrastructure
- **Database**: PostgreSQL via Docker (docker-compose)
- **Container**: Docker for consistent dev/prod environments
- **Version Control**: GitHub
- **Environment**: .env files for local configuration

### GCP Production Infrastructure
- **Compute**: Cloud Run (serverless containers, auto-scaling)
- **Database**: Cloud SQL for PostgreSQL (managed database)
- **Secrets**: Secret Manager (admin password, session secret, DB credentials)
- **Container Registry**: Google Container Registry (GCR) or Artifact Registry
- **APIs**: Google Sheets API (enabled in GCP project)
- **Storage**: Cloud Storage (optional - for CSV file retention)

### External APIs
- Google Sheets API (for Google Sheets/Forms import)
- Google Cloud SQL Admin API (for database management)

### Cost Estimate (GCP)
- **Cloud Run**: Free tier covers ~2M requests/month, then $0.00002400/request
- **Cloud SQL**: db-f1-micro instance ~$10-15/month (smallest option)
- **Cloud Storage**: Negligible for MVP (<$1/month)
- **Total**: ~$10-20/month for MVP with light usage

---

## MVP Development Timeline (3-4 Weeks)

### Week 1: Local Setup & Foundation
**Goal**: Get local development environment running with database

**Tasks**:
- Set up local development environment
  - Install Docker Desktop
  - Create docker-compose.yml for PostgreSQL
  - Set up Node.js/Python project structure
- Create GCP project (for Google Sheets API, even though not deploying yet)
  - Enable Google Sheets API
  - Create service account and download credentials JSON
- Initialize database
  - Create 3 tables (employees, skills, employee_skills)
  - Write migration scripts
- Build basic Express/Flask app
  - Environment variable configuration (.env file)
  - Database connection with connection pooling
  - Simple session-based authentication
- Create simple login page (admin password from .env)
- Basic admin layout/navigation

**Deliverable**: Can run app locally, log in, and see empty dashboard

**Commands**:
```bash
docker-compose up -d  # Start PostgreSQL
npm run dev           # Start app locally
# Access at http://localhost:3000
```

### Week 2: Data Import (Local Testing)
**Goal**: Get data into the system from multiple sources

**Tasks**:
- CSV upload functionality
  - File upload form
  - Parse CSV with csv-parser or pandas
  - Validate data (required fields, email format, score range)
  - Insert into database (auto-create employees/skills)
  - Show success/error messages
- Google Sheets import
  - Use Google Sheets API with service account
  - Read public or shared sheets
  - Parse and validate data
  - Import button with status feedback
- Error handling and logging
- Test with sample data (50-100 employees, 10-20 skills)

**Deliverable**: Can import data from CSV and Google Sheets locally

**Test Data**: Create sample CSV and Google Sheet with realistic data

### Week 3: Heatmap Dashboard (Local Testing)
**Goal**: Visualize the data in heatmap format

**Tasks**:
- Build heatmap grid layout
  - CSS Grid or HTML table
  - Responsive design (desktop-first)
  - Skills column (left), employee row (top)
- Color-code cells based on scores
  - Red: 0-74%, Yellow: 75-84%, Green: 85-100%, Gray: no data
  - Calculate colors server-side or client-side
- Add hover tooltips
  - Show score, date, employee name, skill name
  - Use CSS or lightweight tooltip library
- Basic search/filter
  - Search employees by name
  - Search skills by name
  - Filter by proficiency status
- Performance testing
  - Test with 100 employees x 50 skills
  - Optimize database queries if needed

**Deliverable**: Working heatmap dashboard showing imported data locally

### Week 4: Polish, Google Forms & GCP Deployment
**Goal**: Add Google Forms import and deploy to GCP Cloud Run

**Tasks**:
- Google Forms integration
  - Read Google Forms response sheet
  - Column mapping interface
  - Import responses as skill data
- CSV export functionality
  - Export current heatmap data as CSV
  - Download button
- Bug fixes and UI polish
- **GCP Infrastructure Setup**:
  - Create Cloud SQL PostgreSQL instance
  - Configure Cloud SQL connection
  - Set up Secret Manager for credentials
  - Create Dockerfile for containerization
  - Build and push container to GCR/Artifact Registry
- **Deploy to Cloud Run**:
  - Deploy container to Cloud Run
  - Configure Cloud SQL connection
  - Set environment variables
  - Test in production
- **Database Migration**:
  - Export local PostgreSQL data
  - Import to Cloud SQL
- Final testing and documentation
- Demo to stakeholders

**Deliverable**: MVP deployed to GCP Cloud Run and ready for stakeholder demo

**GCP Deployment Commands**:
```bash
# Build container
docker build -t gcr.io/PROJECT_ID/augment-skills .

# Push to GCR
docker push gcr.io/PROJECT_ID/augment-skills

# Deploy to Cloud Run
gcloud run deploy augment-skills \
  --image gcr.io/PROJECT_ID/augment-skills \
  --region us-central1 \
  --add-cloudsql-instances PROJECT_ID:us-central1:augment-skills-db \
  --allow-unauthenticated
```

---

## MVP Success Metrics (Simplified)

### Validation Metrics
- **Target**: 3-5 managers/stakeholders review the dashboard
- **Target**: 80%+ say "this is useful" or "I would use this"
- **Target**: Dashboard loads in <3 seconds with 100 employees x 20 skills
- **Target**: Data import works successfully 90%+ of the time

### Value Metrics
- **Target**: Stakeholders can understand team readiness in <5 seconds
- **Target**: Importing data takes <5 minutes (vs. hours of manual work)
- **Target**: Dashboard accurately reflects imported data (100% accuracy)

### Decision Criteria
**Proceed to Phase 2 if**:
✅ Stakeholders find the heatmap visualization valuable
✅ Data import works reliably from at least 2 sources
✅ Technical foundation is solid (no major rewrites needed)
✅ Clear demand for additional features (notifications, user logins, etc.)

**Pivot or stop if**:
❌ Stakeholders don't find heatmap useful
❌ Data import is too complex or unreliable
❌ No clear path to user adoption

---

## MVP Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Data format inconsistency | Provide clear CSV template and examples |
| Google Sheets/Forms API complexity | Start with public sheets (no auth), add API later if needed |
| Heatmap performance with large datasets | Test with realistic data (100 employees x 50 skills) |
| Scope creep | Strict "no" to any features not in this document |
| Low stakeholder interest | Get commitment from 3-5 managers before building |

---

## Post-MVP Roadmap (If MVP Succeeds)

### Phase 2: User Access & Automation (4-6 weeks)
**Add if stakeholders want it**:
1. **Employee/Manager Logins** - Let people view their own data
2. **Role-Based Access** - Managers see their team, employees see themselves
3. **Automatic Sync** - Schedule Google Sheets/Forms imports
4. **Historical Tracking** - Add skill_history table to track changes over time
5. **Email Notifications** - Basic alerts for skill updates

### Phase 3: Advanced Features (8-12 weeks)
**Add based on demand**:
1. **Slack Notifications** - Real-time updates in Slack
2. **Skill Expiration Tracking** - Track certification expiration dates
3. **Skill Categories** - Organize skills into groups
4. **Click-Through Details** - Drill down into individual skill records
5. **Advanced Analytics** - Charts, trends, forecasting
6. **Google Classroom Integration** - Full OAuth integration with automatic sync

### Phase 4: Enterprise Features (3-6 months)
**For scaling to larger organizations**:
1. **SSO/SAML** - Enterprise authentication
2. **SCORM Integration** - LMS content tracking
3. **REST API** - Programmatic access
4. **Multi-tenancy** - Support multiple organizations
5. **Advanced Reporting** - Custom reports, scheduled exports

---

## MVP Feature Comparison

| Feature | MVP (v1) | Phase 2 | Phase 3 | Full Product |
|---------|----------|---------|---------|--------------|
| **Authentication** | Single admin password | Multi-user with roles | SSO | SSO + MFA |
| **Dashboard** | View-only heatmap | Interactive heatmap | Advanced filters | Custom dashboards |
| **Data Import** | Manual CSV/Sheets | Scheduled imports | API integrations | Real-time sync |
| **Notifications** | None | Email | Slack | Multi-channel |
| **History** | Current state only | Basic history | Full audit trail | Advanced analytics |
| **Users** | Admins only | Employees + Managers | All roles | Enterprise RBAC |
| **Timeline** | 3-4 weeks | +4-6 weeks | +8-12 weeks | +3-6 months |

---

## Sample CSV Format for Import

```csv
employee_name,employee_email,skill_name,score,assessment_date
John Doe,john.doe@company.com,Cloud Architecture,92,2026-01-15
John Doe,john.doe@company.com,Sales Methodology,88,2026-01-10
Jane Smith,jane.smith@company.com,Cloud Architecture,95,2026-01-14
Jane Smith,jane.smith@company.com,Product Knowledge,78,2026-01-12
Bob Johnson,bob.johnson@company.com,Sales Methodology,91,2026-01-13
```

**Rules**:
- Header row required
- employee_email must be unique per employee
- score must be 0-100
- assessment_date in YYYY-MM-DD format
- If employee doesn't exist, create them
- If skill doesn't exist, create it
- If employee_skill exists, overwrite with new score

---

## Sample Google Sheets Setup

**Sheet Name**: "Skill Assessments"

| A | B | C | D | E |
|---|---|---|---|---|
| Employee Name | Employee Email | Skill Name | Score | Date |
| John Doe | john.doe@company.com | Cloud Architecture | 92 | 2026-01-15 |
| Jane Smith | jane.smith@company.com | Sales Methodology | 88 | 2026-01-10 |

**Setup**:
1. Create Google Sheet with above format
2. Share sheet as "Anyone with link can view"
3. Copy sheet URL
4. In Augment Skills, paste URL and click "Import from Google Sheets"

---

## Sample Google Forms Setup

**Form Questions**:
1. What is your email address? (Short answer)
2. What skill did you complete? (Dropdown: Cloud Architecture, Sales Methodology, etc.)
3. What was your score? (Short answer, 0-100)
4. When did you complete this? (Date)

**Responses Sheet**:
Form automatically creates a sheet with responses. Admin maps columns:
- Column B (email) → employee_email
- Column C (skill) → skill_name
- Column D (score) → score
- Column E (date) → assessment_date

---

## Local Development Setup Guide

### Prerequisites
- Docker Desktop installed
- Node.js 18+ (or Python 3.9+)
- Git
- GCP account (free tier is fine)
- Text editor (VS Code recommended)

### Step 1: Project Setup

#### Option A: Node.js + Express + React
```bash
# Create project directory
mkdir augment-skills
cd augment-skills

# Initialize Node.js project
npm init -y

# Install backend dependencies
npm install express pg express-session multer csv-parser dotenv googleapis

# Install dev dependencies
npm install --save-dev nodemon

# Create frontend (optional - can use simple HTML templates instead)
npx create-react-app client
cd client
npm install
cd ..
```

#### Option B: Python + Flask
```bash
# Create project directory
mkdir augment-skills
cd augment-skills

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install flask psycopg2-binary pandas python-dotenv google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

# Create requirements.txt
pip freeze > requirements.txt
```

### Step 2: Docker Compose for PostgreSQL

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    container_name: augment-skills-db
    environment:
      POSTGRES_DB: augment_skills
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: localdev123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Step 3: Environment Configuration

Create `.env` file (DO NOT commit to Git):
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=augment_skills
DB_USER=postgres
DB_PASSWORD=localdev123

# Application Configuration
PORT=3000
NODE_ENV=development

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
SESSION_SECRET=local-dev-secret-change-in-production

# Google API (get from GCP Console)
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

Create `.env.example` (commit this to Git):
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=augment_skills
DB_USER=postgres
DB_PASSWORD=your_password_here

# Application Configuration
PORT=3000
NODE_ENV=development

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
SESSION_SECRET=your_session_secret

# Google API
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

### Step 4: Database Schema

Create `init.sql`:
```sql
-- Create tables
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_skills (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  assessment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, skill_id)
);

-- Create indexes for performance
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_skills_name ON skills(name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_skills_updated_at BEFORE UPDATE ON employee_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 5: Dockerfile for GCP Cloud Run

Create `Dockerfile`:
```dockerfile
# Use official Node.js runtime (or python:3.9-slim for Python)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build frontend if using React (optional)
# RUN cd client && npm ci && npm run build && cd ..

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start application
CMD ["node", "server.js"]
```

Create `.dockerignore`:
```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
docker-compose.yml
*.md
.vscode
.DS_Store
```

### Step 6: Start Local Development

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Verify database is running
docker-compose ps

# 3. Start application
npm run dev  # or python app.py

# 4. Access application
# Open browser to http://localhost:3000
```

### Step 7: GCP Setup (Do this in Week 1)

```bash
# 1. Install Google Cloud SDK
# Download from: https://cloud.google.com/sdk/docs/install

# 2. Initialize gcloud
gcloud init

# 3. Create new GCP project
gcloud projects create augment-skills-PROJECT_ID --name="Augment Skills"

# 4. Set project
gcloud config set project augment-skills-PROJECT_ID

# 5. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  sheets.googleapis.com \
  containerregistry.googleapis.com

# 6. Create service account for Google Sheets API
gcloud iam service-accounts create augment-skills-sa \
  --display-name="Augment Skills Service Account"

# 7. Create and download service account key
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=augment-skills-sa@augment-skills-PROJECT_ID.iam.gserviceaccount.com

# 8. Enable Google Sheets API for service account
# Go to: https://console.cloud.google.com/apis/library/sheets.googleapis.com
# Click "Enable"
```

---

## GCP Cloud Run Deployment Guide (Week 4)

### Step 1: Create Cloud SQL Instance

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create augment-skills-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=CHANGE_THIS_PASSWORD

# Create database
gcloud sql databases create augment_skills \
  --instance=augment-skills-db

# Get connection name (you'll need this)
gcloud sql instances describe augment-skills-db \
  --format="value(connectionName)"
# Output: PROJECT_ID:us-central1:augment-skills-db
```

### Step 2: Store Secrets in Secret Manager

```bash
# Create secrets
echo -n "your-admin-password" | gcloud secrets create admin-password --data-file=-
echo -n "your-session-secret-min-32-chars" | gcloud secrets create session-secret --data-file=-
echo -n "CHANGE_THIS_PASSWORD" | gcloud secrets create db-password --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding admin-password \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding session-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Migrate Database from Local to Cloud SQL

```bash
# Option A: Using Cloud SQL Proxy
# 1. Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# 2. Start proxy
./cloud-sql-proxy PROJECT_ID:us-central1:augment-skills-db &

# 3. Export local database
pg_dump -h localhost -p 5432 -U postgres augment_skills > local_backup.sql

# 4. Import to Cloud SQL
psql -h 127.0.0.1 -p 5432 -U postgres -d augment_skills < local_backup.sql

# Option B: Using Cloud Storage
# 1. Export local database
pg_dump -h localhost -p 5432 -U postgres augment_skills > local_backup.sql

# 2. Upload to Cloud Storage
gsutil mb gs://augment-skills-backups
gsutil cp local_backup.sql gs://augment-skills-backups/

# 3. Import to Cloud SQL
gcloud sql import sql augment-skills-db gs://augment-skills-backups/local_backup.sql \
  --database=augment_skills
```

### Step 4: Build and Push Container

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker

# Build container
docker build -t gcr.io/PROJECT_ID/augment-skills:latest .

# Test container locally (optional)
docker run -p 8080:8080 \
  -e DB_HOST=/cloudsql/PROJECT_ID:us-central1:augment-skills-db \
  -e PORT=8080 \
  gcr.io/PROJECT_ID/augment-skills:latest

# Push to Google Container Registry
docker push gcr.io/PROJECT_ID/augment-skills:latest
```

### Step 5: Deploy to Cloud Run

```bash
# Deploy with Cloud SQL connection and secrets
gcloud run deploy augment-skills \
  --image gcr.io/PROJECT_ID/augment-skills:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:us-central1:augment-skills-db \
  --set-env-vars "DB_HOST=/cloudsql/PROJECT_ID:us-central1:augment-skills-db,DB_NAME=augment_skills,DB_USER=postgres,NODE_ENV=production" \
  --set-secrets "ADMIN_PASSWORD=admin-password:latest,SESSION_SECRET=session-secret:latest,DB_PASSWORD=db-password:latest" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0

# Get the service URL
gcloud run services describe augment-skills \
  --region us-central1 \
  --format="value(status.url)"
```

### Step 6: Verify Deployment

```bash
# Check service status
gcloud run services describe augment-skills --region us-central1

# View logs
gcloud run services logs read augment-skills --region us-central1

# Test the application
curl https://augment-skills-HASH-uc.a.run.app
```

### Step 7: Update Application (Future Deployments)

```bash
# 1. Make code changes locally
# 2. Test locally with docker-compose

# 3. Build new container
docker build -t gcr.io/PROJECT_ID/augment-skills:latest .

# 4. Push to GCR
docker push gcr.io/PROJECT_ID/augment-skills:latest

# 5. Deploy to Cloud Run (same command as Step 5)
gcloud run deploy augment-skills \
  --image gcr.io/PROJECT_ID/augment-skills:latest \
  --region us-central1
```

---

## MVP Checklist (Updated for GCP)

### Before You Start
- [ ] Get commitment from 3-5 stakeholders to review MVP
- [ ] Gather sample data (CSV or Google Sheet with real/realistic data)
- [ ] Define success criteria with stakeholders
- [ ] Choose tech stack (Node.js vs Python)
- [ ] Create GCP account and project
- [ ] Install Docker Desktop
- [ ] Install Google Cloud SDK

### Week 1: Local Setup
- [ ] Set up project repository (GitHub)
- [ ] Create docker-compose.yml for PostgreSQL
- [ ] Create .env and .env.example files
- [ ] Create database schema (init.sql with 3 tables)
- [ ] Set up GCP project and enable APIs
- [ ] Create service account for Google Sheets API
- [ ] Download service account credentials
- [ ] Build login page (password from .env)
- [ ] Create basic admin layout
- [ ] Test: Can run locally with `docker-compose up` and `npm run dev`

### Week 2: Data Import (Local)
- [ ] CSV upload functionality
- [ ] Parse and validate CSV data
- [ ] Insert data into database (auto-create employees/skills)
- [ ] Google Sheets import (using service account)
- [ ] Test with sample data (50-100 employees, 10-20 skills)
- [ ] Error handling and user feedback
- [ ] Test: Can import data from both CSV and Google Sheets

### Week 3: Heatmap Dashboard (Local)
- [ ] Build heatmap grid layout (CSS Grid)
- [ ] Color-code cells based on scores (red/yellow/green/gray)
- [ ] Add hover tooltips (score, date)
- [ ] Add search/filter (employees and skills)
- [ ] Test with 100+ employees x 50 skills
- [ ] Optimize database queries if needed
- [ ] Test: Dashboard loads in <3 seconds

### Week 4: GCP Deployment
- [ ] Google Forms integration (column mapping)
- [ ] CSV export functionality
- [ ] Create Dockerfile
- [ ] Test Docker build locally
- [ ] Create Cloud SQL instance
- [ ] Store secrets in Secret Manager
- [ ] Migrate database from local to Cloud SQL
- [ ] Build and push container to GCR
- [ ] Deploy to Cloud Run
- [ ] Test production deployment
- [ ] Bug fixes and polish
- [ ] Write README/documentation
- [ ] Demo to stakeholders
- [ ] Gather feedback
- [ ] Decide: proceed to Phase 2 or pivot?

### Post-Deployment
- [ ] Monitor Cloud Run logs
- [ ] Monitor Cloud SQL performance
- [ ] Set up billing alerts (optional)
- [ ] Document deployment process
- [ ] Plan Phase 2 features based on feedback

---

## Troubleshooting Common Issues

### Local Development

**Issue**: Can't connect to PostgreSQL
```bash
# Check if container is running
docker-compose ps

# Check logs
docker-compose logs db

# Restart containers
docker-compose down
docker-compose up -d
```

**Issue**: Port 5432 already in use
```bash
# Stop local PostgreSQL if running
# Or change port in docker-compose.yml to 5433:5432
```

### GCP Deployment

**Issue**: Cloud Run can't connect to Cloud SQL
```bash
# Verify Cloud SQL connection name
gcloud sql instances describe augment-skills-db --format="value(connectionName)"

# Check Cloud Run service has correct connection
gcloud run services describe augment-skills --region us-central1
```

**Issue**: Secrets not accessible
```bash
# Verify secrets exist
gcloud secrets list

# Check IAM permissions
gcloud secrets get-iam-policy admin-password
```

**Issue**: Container fails to start
```bash
# Check logs
gcloud run services logs read augment-skills --region us-central1 --limit 50

# Test container locally
docker run -p 8080:8080 gcr.io/PROJECT_ID/augment-skills:latest
```

---

## Cost Optimization Tips

1. **Cloud Run**: Set `--min-instances 0` to scale to zero when not in use
2. **Cloud SQL**: Use smallest instance (db-f1-micro) for MVP
3. **Cloud SQL**: Stop instance when not actively developing (can restart anytime)
4. **Container Registry**: Clean up old images periodically
5. **Set Billing Alerts**: Get notified if costs exceed $20/month

```bash
# Stop Cloud SQL instance (saves ~$10/month)
gcloud sql instances patch augment-skills-db --activation-policy=NEVER

# Start Cloud SQL instance
gcloud sql instances patch augment-skills-db --activation-policy=ALWAYS
```

---

**END OF MVP DEFINITION**

