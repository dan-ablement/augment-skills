# =============================================================================
# Unified Dockerfile — builds both backend and frontend into a single image.
# The Express backend serves the API and the Next.js frontend on one port (3001).
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install all dependencies
# ---------------------------------------------------------------------------
FROM node:18-alpine AS deps
WORKDIR /app

COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN cd backend && npm ci
RUN cd frontend && npm ci

# ---------------------------------------------------------------------------
# Stage 2: Build frontend (Next.js)
# ---------------------------------------------------------------------------
FROM node:18-alpine AS frontend-builder
WORKDIR /app

COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend/ ./frontend/

RUN cd frontend && npm run build

# ---------------------------------------------------------------------------
# Stage 3: Build backend (TypeScript)
# ---------------------------------------------------------------------------
FROM node:18-alpine AS backend-builder
WORKDIR /app

COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

RUN cd backend && npm run build

# ---------------------------------------------------------------------------
# Stage 4: Production image
# ---------------------------------------------------------------------------
FROM node:18-alpine
WORKDIR /app

# Backend — production deps + compiled JS
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Frontend — production deps + Next.js build output + config files
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --only=production
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY frontend/next.config.js ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/tailwind.config.js ./frontend/

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_DIR=/app/frontend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "backend/dist/server.js"]

