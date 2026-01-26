# Week 1: Getting Started - Foundation & Local Setup

**Goal**: Get local development environment running with database and basic authentication

**Timeline**: 5-7 days  
**Deliverable**: Can run app locally, log in, and see empty dashboard

---

## 📋 Week 1 Checklist

### Day 1-2: Environment Setup

#### ✅ Task 1.1: Install Prerequisites
- [ ] Install Docker Desktop
  - Download from: https://www.docker.com/products/docker-desktop
  - Verify: `docker --version` and `docker-compose --version`
- [ ] Install Node.js 18+ OR Python 3.9+
  - Node.js: https://nodejs.org/ (LTS version)
  - Python: https://www.python.org/downloads/
  - Verify: `node --version` or `python --version`
- [ ] Install Google Cloud SDK
  - Download from: https://cloud.google.com/sdk/docs/install
  - Verify: `gcloud --version`
- [ ] Install Git (if not already installed)
  - Verify: `git --version`

#### ✅ Task 1.2: Clone Repository
```bash
# Clone the repository
git clone https://github.com/dan-ablement/augment-skills.git
cd augment-skills

# Create a new branch for Week 1 work
git checkout -b week-1-foundation
```

#### ✅ Task 1.3: Set Up GCP Project (for Google Sheets API)
```bash
# Initialize gcloud
gcloud init

# Create new GCP project
gcloud projects create augment-skills-dev --name="Augment Skills Dev"

# Set project
gcloud config set project augment-skills-dev

# Enable required APIs
gcloud services enable sheets.googleapis.com

# Create service account
gcloud iam service-accounts create augment-skills-sa \
  --display-name="Augment Skills Service Account"

# Create and download service account key
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=augment-skills-sa@augment-skills-dev.iam.gserviceaccount.com

# Move key to project root (it's in .gitignore)
# Verify the file exists: ls -la service-account-key.json
```

---

### Day 2-3: Database & Project Structure

#### ✅ Task 1.4: Create Docker Compose for PostgreSQL

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
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

#### ✅ Task 1.5: Create Database Schema

Create `database/init.sql`:
```sql
-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employee_skills table
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

#### ✅ Task 1.6: Start PostgreSQL
```bash
# Create database directory
mkdir -p database

# Copy init.sql to database/ directory (created in Task 1.5)

# Start PostgreSQL
docker-compose up -d

# Verify it's running
docker-compose ps

# Check logs
docker-compose logs db

# Connect to database to verify schema
docker exec -it augment-skills-db psql -U postgres -d augment_skills -c "\dt"
```

---

### Day 3-4: Application Setup (Choose Node.js OR Python)

#### Option A: Node.js + Express

**Task 1.7a: Initialize Node.js Project**
```bash
# Initialize package.json
npm init -y

# Install dependencies
npm install express pg express-session dotenv bcrypt ejs
npm install --save-dev nodemon jest supertest

# Install logging
npm install winston
```

**Create project structure:**
```
augment-skills/
├── config/
│   ├── database.config.js
│   ├── app.config.js
│   └── logger.config.js
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── utils/
├── views/
│   ├── login.ejs
│   └── dashboard.ejs
├── public/
│   ├── css/
│   └── js/
├── tests/
│   └── unit/
├── database/
│   └── init.sql
├── logs/
├── server.js
├── .env
├── .env.example
└── docker-compose.yml
```

#### Option B: Python + Flask

**Task 1.7b: Initialize Python Project**
```bash
# Create virtual environment (OUTSIDE repo)
python -m venv ~/.virtualenvs/augment-skills
source ~/.virtualenvs/augment-skills/bin/activate

# Create requirements.txt
cat > requirements.txt << EOF
Flask==3.0.0
psycopg2-binary==2.9.9
python-dotenv==1.0.0
bcrypt==4.1.2
structlog==24.1.0
pytest==7.4.3
EOF

# Install dependencies
pip install -r requirements.txt
```

**Create project structure:**
```
augment-skills/
├── config/
│   ├── database_config.py
│   ├── app_config.py
│   └── logger_config.py
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── utils/
├── templates/
│   ├── login.html
│   └── dashboard.html
├── static/
│   ├── css/
│   └── js/
├── tests/
│   └── unit/
├── database/
│   └── init.sql
├── logs/
├── app.py
├── .env
├── .env.example
└── docker-compose.yml
```

---

### Day 4-5: Configuration Files

#### ✅ Task 1.8: Create Environment Configuration

Copy `.env.example` to `.env` and fill in values:
```bash
cp .env.example .env
```

Edit `.env`:
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
ADMIN_PASSWORD=admin123  # Change this!
SESSION_SECRET=your-secret-key-min-32-characters-long

# Google API Configuration
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=console
```

---

## 📦 Deliverables for Week 1

By end of Week 1, you should have:

1. ✅ **Local environment set up**
   - Docker Desktop running
   - Node.js/Python installed
   - GCP SDK installed

2. ✅ **PostgreSQL running locally**
   - Database created with 3 tables
   - Can connect via `docker exec`

3. ✅ **GCP project created**
   - Google Sheets API enabled
   - Service account created
   - Credentials downloaded

4. ✅ **Project structure created**
   - All directories in place
   - Configuration files ready
   - .env file configured

5. ✅ **Ready for Week 2**
   - Can start building features
   - Database is ready for data import
   - Authentication framework ready

---

## 🧪 Testing Week 1 Setup

Run these commands to verify everything is working:

```bash
# 1. Check Docker
docker-compose ps
# Should show: augment-skills-db running

# 2. Check database
docker exec -it augment-skills-db psql -U postgres -d augment_skills -c "SELECT COUNT(*) FROM employees;"
# Should return: 0 (empty table)

# 3. Check GCP credentials
cat service-account-key.json | grep "project_id"
# Should show your project ID

# 4. Check environment
cat .env | grep DB_HOST
# Should show: DB_HOST=localhost
```

---

## 🚀 Next Steps

After completing Week 1, you'll move to **Week 2: Data Import** where you'll build:
- CSV upload functionality
- Google Sheets import
- Data validation and insertion

---

**Questions or issues? Check DEVELOPMENT_STANDARDS.md or create an issue on GitHub.**

