# Augment Skills - Local to GCP Quick Start

**Goal**: Develop locally, deploy to GCP Cloud Run
**Stack**: Node.js + TypeScript (Express backend, Next.js frontend), PostgreSQL, Redis

---

## 🚀 Quick Commands Reference

### Local Development

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Start backend (terminal 1)
cd backend && npm install && npm run dev
# API runs on http://localhost:3001

# Start frontend (terminal 2)
cd frontend && npm install && npm run dev
# Frontend runs on http://localhost:3000

# Stop services
docker-compose down
```

### GCP Deployment

```bash
# Build and push container
docker build -t gcr.io/augment-skills-test/augment-skills:latest .
docker push gcr.io/augment-skills-test/augment-skills:latest

# Deploy to Cloud Run (see full command in GCP Deployment section below)
gcloud run deploy augment-skills \
  --image gcr.io/augment-skills-test/augment-skills:latest \
  --region us-central1 \
  ...
```

---

## 📁 Project Files Reference

### 1. `docker-compose.yml` (Local PostgreSQL + Redis)
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
  redis:
    image: redis:7-alpine
    container_name: augment-skills-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
volumes:
  postgres_data:
  redis_data:
```

### 2. `.env` (Local Config — DO NOT COMMIT)

Key variables from `.env.example`:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=augment_skills
DB_USER=postgres
DB_PASSWORD=localdev123
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
SESSION_SECRET=your-session-secret-min-32-characters-long-change-this
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. `Dockerfile` (Unified Multi-Stage Build)

The Dockerfile uses a 4-stage build to produce a single image that serves both the API and the Next.js frontend:

1. **deps** — Installs all npm dependencies for backend and frontend
2. **frontend-builder** — Builds the Next.js frontend (`npm run build`)
3. **backend-builder** — Compiles the TypeScript backend (`npm run build`)
4. **production** — Copies only production deps + compiled output; runs `node backend/dist/server.js` on port 3001

```bash
docker build -t augment-skills .
docker run -p 3001:3001 --env-file .env augment-skills
```

### 4. `.dockerignore`
```
**/node_modules
**/.next
**/dist
**/.env
.git
**/logs
**/*.md
```

### 5. `database/init.sql` (Database Schema)

The schema includes the following tables:

- **employees** — with `manager_id` for org hierarchy
- **skills** — with category and description
- **employee_skills** — junction table with scores, assessment dates, confidence levels
- **validation_events** — external assessment events (role plays, quizzes)
- **observation_scores** — per-competency scores from validation events
- **api_keys** — API key management
- **saved_views** (Phase 2) — saved/shared dashboard states
- **app_settings** (Phase 2) — admin-configurable settings (color thresholds, etc.)
- **assessment_snapshots** (Phase 2) — point-in-time score snapshots

---

## 🔧 One-Time Setup

### Prerequisites
- Docker Desktop
- Node.js 18+
- Google Cloud SDK

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/dan-ablement/augment-skills.git
cd augment-skills

# 2. Copy environment file
cp .env.example .env
# Edit .env with your values

# 3. Start PostgreSQL and Redis
docker-compose up -d

# 4. Start backend (terminal 1)
cd backend && npm install && npm run dev

# 5. Start frontend (terminal 2)
cd frontend && npm install && npm run dev

# 6. Open the app
open http://localhost:3000
```

---

## 🌐 GCP Deployment

### Architecture

- **Project**: `augment-skills-test`
- **Region**: `us-central1`
- **Cloud Run**: Single service serving API + frontend on port 3001
- **Cloud SQL**: `augment-skills-db` (PostgreSQL 14, private IP)
- **Memorystore Redis**: `10.163.34.203:6379`
- **VPC Connector**: `projects/augment-skills-test/locations/us-central1/connectors/augment-skills-connector`
- **DB User**: `augment_skills_user` (not `postgres`)
- **Live URL**: https://augment-skills-656706478564.us-central1.run.app

### Step 1: Create Cloud SQL

```bash
gcloud sql instances create augment-skills-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --no-assign-ip \
  --network=default

gcloud sql databases create augment_skills --instance=augment-skills-db
```

### Step 2: Store Secrets

```bash
echo -n "your-db-password" | gcloud secrets create db-password --data-file=-
echo -n "your-admin-password" | gcloud secrets create admin-password --data-file=-
echo -n "your-session-secret" | gcloud secrets create session-secret --data-file=-
echo -n "your-google-client-id" | gcloud secrets create augment-skills-google-client-id --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create augment-skills-google-client-secret --data-file=-
```

### Step 3: Build and Push

```bash
docker build -t gcr.io/augment-skills-test/augment-skills:latest .
docker push gcr.io/augment-skills-test/augment-skills:latest
```

### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy augment-skills \
  --image gcr.io/augment-skills-test/augment-skills:latest \
  --region us-central1 \
  --add-cloudsql-instances augment-skills-test:us-central1:augment-skills-db \
  --vpc-connector projects/augment-skills-test/locations/us-central1/connectors/augment-skills-connector \
  --set-secrets "DB_PASSWORD=db-password:latest,ADMIN_PASSWORD=admin-password:latest,SESSION_SECRET=session-secret:latest,GOOGLE_CLIENT_ID=augment-skills-google-client-id:latest,GOOGLE_CLIENT_SECRET=augment-skills-google-client-secret:latest" \
  --set-env-vars "NODE_ENV=production,PORT=3001,DB_HOST=PRIVATE_IP_OF_CLOUD_SQL,DB_PORT=5432,DB_NAME=augment_skills,DB_USER=augment_skills_user,REDIS_HOST=10.163.34.203,REDIS_PORT=6379" \
  --allow-unauthenticated
```

### Step 5: Migrate Database

```bash
# Export local data
pg_dump -h localhost -U postgres augment_skills > backup.sql

# Import to Cloud SQL (using Cloud SQL Auth Proxy)
./cloud-sql-proxy augment-skills-test:us-central1:augment-skills-db &
psql -h 127.0.0.1 -U augment_skills_user augment_skills < backup.sql
```

---

## 💰 Cost Estimate

- **Cloud Run**: Free tier (2M requests/month) — single service for API + frontend
- **Cloud SQL**: ~$10-15/month (db-f1-micro PostgreSQL)
- **Memorystore (Redis)**: ~$15-25/month (Basic tier, 1GB)
- **VPC Connector**: ~$7/month (f1-micro instances)
- **Total**: ~$35-50/month for production deployment

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
- Ensure VPC connector is configured and Cloud SQL has a private IP
- Check `--add-cloudsql-instances` and `--vpc-connector` flags

**DB permission denied on Cloud SQL**:
- Use `augment_skills_user` as the DB user, not `postgres`
- Verify the user has been granted access to the `augment_skills` database

**Auth redirect shows error before login**:
- Check that the `isRedirecting` state is handled in the frontend auth flow
- Verify Google OAuth client ID and redirect URIs are configured correctly

**Secrets not working**:
```bash
gcloud secrets list
gcloud secrets get-iam-policy admin-password
# Ensure the Cloud Run service account has Secret Accessor role
```

