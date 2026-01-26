# Augment Skills - Local to GCP Quick Start

**Goal**: Develop locally, deploy to GCP Cloud Run  
**Timeline**: 3-4 weeks

---

## 🚀 Quick Commands Reference

### Local Development (Weeks 1-3)

```bash
# Start PostgreSQL
docker-compose up -d

# Start application
npm run dev  # or python app.py

# Access app
open http://localhost:3000

# Stop everything
docker-compose down
```

### GCP Deployment (Week 4)

```bash
# Build container
docker build -t gcr.io/PROJECT_ID/augment-skills:latest .

# Push to GCR
docker push gcr.io/PROJECT_ID/augment-skills:latest

# Deploy to Cloud Run
gcloud run deploy augment-skills \
  --image gcr.io/PROJECT_ID/augment-skills:latest \
  --region us-central1 \
  --add-cloudsql-instances PROJECT_ID:us-central1:augment-skills-db \
  --allow-unauthenticated
```

---

## 📁 Required Files

### 1. `docker-compose.yml` (Local PostgreSQL)
```yaml
version: '3.8'
services:
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: augment_skills
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: localdev123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
volumes:
  postgres_data:
```

### 2. `.env` (Local Config - DO NOT COMMIT)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=augment_skills
DB_USER=postgres
DB_PASSWORD=localdev123
PORT=3000
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
SESSION_SECRET=local-dev-secret
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

### 3. `Dockerfile` (For GCP Cloud Run)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

### 4. `.dockerignore`
```
node_modules
.env
.git
*.md
docker-compose.yml
```

### 5. `init.sql` (Database Schema)
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE employee_skills (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  skill_id INTEGER REFERENCES skills(id),
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  assessment_date DATE,
  UNIQUE(employee_id, skill_id)
);

CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);
```

---

## 🔧 One-Time Setup

### Week 1: Initial Setup

```bash
# 1. Install prerequisites
# - Docker Desktop
# - Node.js 18+ or Python 3.9+
# - Google Cloud SDK

# 2. Create GCP project
gcloud projects create augment-skills-PROJECT_ID
gcloud config set project augment-skills-PROJECT_ID

# 3. Enable APIs
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  secretmanager.googleapis.com sheets.googleapis.com

# 4. Create service account for Google Sheets
gcloud iam service-accounts create augment-skills-sa
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=augment-skills-sa@PROJECT_ID.iam.gserviceaccount.com

# 5. Clone/create project
git clone <your-repo> augment-skills
cd augment-skills

# 6. Copy environment file
cp .env.example .env
# Edit .env with your values

# 7. Start local development
docker-compose up -d
npm install
npm run dev
```

---

## 🌐 Week 4: GCP Deployment

### Step 1: Create Cloud SQL
```bash
gcloud sql instances create augment-skills-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create augment_skills --instance=augment-skills-db
```

### Step 2: Store Secrets
```bash
echo -n "your-admin-password" | gcloud secrets create admin-password --data-file=-
echo -n "your-session-secret" | gcloud secrets create session-secret --data-file=-
echo -n "your-db-password" | gcloud secrets create db-password --data-file=-
```

### Step 3: Migrate Database
```bash
# Export local data
pg_dump -h localhost -U postgres augment_skills > backup.sql

# Import to Cloud SQL (using Cloud SQL Proxy)
./cloud-sql-proxy PROJECT_ID:us-central1:augment-skills-db &
psql -h 127.0.0.1 -U postgres augment_skills < backup.sql
```

### Step 4: Deploy
```bash
# Build and push
docker build -t gcr.io/PROJECT_ID/augment-skills:latest .
docker push gcr.io/PROJECT_ID/augment-skills:latest

# Deploy to Cloud Run
gcloud run deploy augment-skills \
  --image gcr.io/PROJECT_ID/augment-skills:latest \
  --region us-central1 \
  --add-cloudsql-instances PROJECT_ID:us-central1:augment-skills-db \
  --set-env-vars "DB_HOST=/cloudsql/PROJECT_ID:us-central1:augment-skills-db" \
  --set-secrets "ADMIN_PASSWORD=admin-password:latest" \
  --allow-unauthenticated
```

---

## 💰 Cost Estimate

- **Cloud Run**: Free tier (2M requests/month), then ~$0.024/1K requests
- **Cloud SQL**: db-f1-micro ~$10-15/month
- **Total**: ~$10-20/month for MVP

**Tip**: Stop Cloud SQL when not in use to save money:
```bash
gcloud sql instances patch augment-skills-db --activation-policy=NEVER
```

---

## 🐛 Common Issues

**Can't connect to local PostgreSQL**:
```bash
docker-compose down
docker-compose up -d
docker-compose logs db
```

**Cloud Run can't connect to Cloud SQL**:
- Verify connection name: `gcloud sql instances describe augment-skills-db`
- Check `--add-cloudsql-instances` flag is correct

**Secrets not working**:
```bash
gcloud secrets list
gcloud secrets get-iam-policy admin-password
```

---

## 📚 Full Documentation

See `MVP_DEFINITION.md` for complete details on:
- Detailed setup instructions
- Database schema
- Development timeline
- Troubleshooting guide
- Success metrics

