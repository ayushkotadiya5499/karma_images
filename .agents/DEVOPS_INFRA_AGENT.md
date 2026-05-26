# ⚙️ Webelight DevOps, Infrastructure & Integration Agent

> **Purpose**: This is the 3rd and final agent. It covers everything **NOT** in the Backend or Frontend agents: Docker, Docker Compose, Nginx, environment management, CI/CD pipelines, code quality tooling, security, monitoring, database seeding, the API contract between backend & frontend, and the full system orchestration that ties all services together. **Using all 3 agents together, you can build any full-stack system from scratch.**

---

## 📋 Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Full Project Root — Every File Explained](#2-full-project-root--every-file-explained)
3. [Environment Management Strategy](#3-environment-management-strategy)
4. [Backend Dockerfiles](#4-backend-dockerfiles)
5. [Frontend Dockerfiles](#5-frontend-dockerfiles)
6. [Docker Compose — Local Development](#6-docker-compose--local-development)
7. [Docker Compose — Production](#7-docker-compose--production)
8. [Nginx Configuration](#8-nginx-configuration)
9. [Backend ↔ Frontend Integration Contract](#9-backend--frontend-integration-contract)
10. [CORS & API Proxy Configuration](#10-cors--api-proxy-configuration)
11. [Health Checks & Readiness](#11-health-checks--readiness)
12. [Database Seeding Scripts](#12-database-seeding-scripts)
13. [Code Quality — Pre-commit Hooks](#13-code-quality--pre-commit-hooks)
14. [Code Quality — MegaLinter](#14-code-quality--megalinter)
15. [Code Quality — Pylint & Tool Configs](#15-code-quality--pylint--tool-configs)
16. [Code Quality — SonarQube](#16-code-quality--sonarqube)
17. [Security Practices](#17-security-practices)
18. [Monitoring & Error Tracking (Sentry)](#18-monitoring--error-tracking-sentry)
19. [Cloud Logging (AWS CloudWatch)](#19-cloud-logging-aws-cloudwatch)
20. [Secret Management (Infisical)](#20-secret-management-infisical)
21. [Git Workflow & .gitignore](#21-git-workflow--gitignore)
22. [Dependency Management](#22-dependency-management)
23. [App Lifecycle & Startup Sequence](#23-app-lifecycle--startup-sequence)
24. [Complete Development Workflow](#24-complete-development-workflow)
25. [Complete Production Deployment Workflow](#25-complete-production-deployment-workflow)
26. [Full System Bootstrap — From Zero to Running](#26-full-system-bootstrap--from-zero-to-running)
27. [Anti-Patterns to Avoid](#27-anti-patterns-to-avoid)
28. [Master Checklist — New Full-Stack Project](#28-master-checklist--new-full-stack-project)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                   (React SPA on :3000)                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │  /api/*
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      NGINX (Production)                          │
│              or Vite Dev Proxy (Development)                     │
│                                                                  │
│  Static files → /usr/share/nginx/html   (frontend dist/)         │
│  /api/*        → proxy_pass backend:80   (strip /api prefix)     │
│  /health       → 200 "healthy"                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FASTAPI APP (:80)                              │
│                                                                  │
│  /           → root health response                              │
│  /healthcheck→ health check endpoint                             │
│  /docs       → Swagger UI                                        │
│  /api/...    → All API routes                                    │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐       │
│  │ Middleware  │  │  Routers   │  │  Exception Handlers  │       │
│  │ (CORS,     │  │ (per module│  │  (Custom, Validation,│       │
│  │  RateLimit)│  │  /api/*)   │  │   Unexpected)        │       │
│  └────────────┘  └────────────┘  └──────────────────────┘       │
│                                                                  │
│  Lifespan: scheduler.start() + FastAPILimiter.init(redis)        │
└──────────┬─────────────┬─────────────┬──────────────────────────┘
           │             │             │
           ▼             ▼             ▼
┌──────────────┐ ┌───────────┐ ┌──────────────────┐
│  PostgreSQL  │ │   Redis   │ │  Celery Worker   │
│  :5432       │ │   :6379   │ │  (same image,    │
│              │ │           │ │   different CMD)  │
│  • Models    │ │ • Broker  │ │  • Background    │
│  • Migrations│ │ • Cache   │ │    tasks         │
│  • Sessions  │ │ • Rate    │ │  • Beat schedule │
│              │ │   Limit   │ │  • Async bridge  │
└──────────────┘ └───────────┘ └──────────────────┘
```

### Service Inventory (5 containers in production):

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **app** | Custom (Python 3.12 Alpine) | 80 (mapped to `DOCKER_PORT`) | FastAPI backend |
| **postgresql** | `postgres:alpine3.19` | 5432 | Primary database |
| **redis-cache** | `redis:alpine3.19` | 6379 | Celery broker + rate limiter + cache |
| **celery-worker** | Same as app image | — | Background task processor |
| **frontend** | Custom (Node 20 → Nginx) | 3000 | React SPA served by Nginx |

---

## 2. Full Project Root — Every File Explained

```
project-root/
│
├── .env                          # All secrets/config (NEVER committed)
├── env.example                   # Template with ALL variables (committed)
├── .gitignore                    # Ignore rules
│
├── main.py                       # Root entry → delegates to src/main.py
├── alembic.ini                   # Alembic config → script_location = src/migrations
├── pyproject.toml                # Poetry deps + tool configs (black, ruff, isort, interrogate)
├── poetry.lock                   # Locked dependency versions
│
├── app.dockerfile                # Production backend: multi-stage, non-root user, healthcheck
├── app-dev.dockerfile            # Dev backend: includes Infisical for secret injection
├── docker-compose.yml            # Production: app + postgres + redis + celery (AWS logging)
├── docker-compose-local.yml      # Local dev: postgres + redis + celery only (app runs natively)
│
├── .pre-commit-config.yaml       # Pre-commit hooks: black, ruff, isort, interrogate, security
├── .mega-linter.yaml             # MegaLinter: pylint, bandit, mypy, hadolint, gitleaks, checkov
├── .pylintrc                     # Pylint: disabled rules, max line length 120
├── sonar-project.properties      # SonarQube: project key, Python 3.11, quality gate
│
├── scripts/                      # Database seeding & utility scripts
│   ├── seed_whitelist.py         # Seed whitelisted emails
│   └── seed_team.py              # Seed teams and team members
│
├── src/                          # Backend source (see BACKEND_AGENT.md)
├── frontend/                     # Frontend source (see FRONTEND_AGENT.md)
│   ├── Dockerfile                # Frontend production: Node → build → Nginx
│   ├── Dockerfile.dev            # Frontend dev: Node + hot reload
│   ├── nginx.conf                # Nginx: gzip, security headers, SPA fallback, caching
│   ├── .dockerignore             # Docker ignore for frontend
│   └── env.example               # Frontend env template (VITE_* vars)
│
├── tests/                        # Test suite (pytest + pytest-asyncio)
└── docs/                         # Additional documentation
```

---

## 3. Environment Management Strategy

### Three Environment Tiers

| Tier | `ENV` Value | Docker Usage | Secrets Source |
|------|-------------|--------------|----------------|
| **Local** | `Local` | `docker-compose-local.yml` (infra only) + native `python main.py run` | `.env` file |
| **Development** | `Development` | `app-dev.dockerfile` (full containers) | Infisical secret manager |
| **Production** | `Production` | `app.dockerfile` + `docker-compose.yml` | `.env` file baked into image |

### Backend `env.example` — Complete Variable Inventory

```bash
# ──────────── APP ────────────
ENV=Local                        # Local | Development | Production
APP_NAME=MyProject
NAME=myproject                   # Used for Docker container naming
APP_VERSION=1.0.0
APP_HOST=0.0.0.0
APP_PORT=8080
APP_DEBUG=True                   # Enables /redoc, debug mode
DECRYPT_REQUEST_TIME_CHECK=False # True in production (timestamp validation)
DOCKER_PORT=8080                 # Host port mapped to container :80

# ──────────── JWT ────────────
JWT_SECRET_KEY=your-256-bit-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXP=3600            # 1 hour
REFRESH_TOKEN_EXP=86400          # 24 hours
COOKIES_DOMAIN=localhost

# ──────────── DATABASE ────────────
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=myproject_db
DATABASE_HOST=localhost           # 'postgresql' inside Docker network
DATABASE_PORT=5432

# ──────────── REDIS ────────────
REDIS_URL=redis://localhost:6379/ # 'redis://redis-cache:6379/' inside Docker

# ──────────── WEBHOOKS ────────────
GITHUB_WEBHOOK_SECRET=
GITLAB_WEBHOOK_SECRET=
BITBUCKET_WEBHOOK_SECRET=

# ──────────── AI / LLM ────────────
GEMINI_API_KEY=
GEMINI_API_KEY_SECONDARY=        # Fallback key for rate limiting
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=300
GEMINI_MAX_RETRIES=3
GEMINI_MAX_OUTPUT_TOKENS=8192
GEMINI_TEMPERATURE=0.0
AI_MODEL=gemini-2.5-flash

# ──────────── COST TRACKING ────────────
COST_INPUT_TOKEN=0.0
COST_OUTPUT_TOKEN=0.0
COST_CACHE_READ_TOKEN=0.0

# ──────────── PGADMIN ────────────
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin

# ──────────── KEYS ────────────
PUBLIC_KEY_PATH=public_key.pem
PRIVATE_PUBLIC_KEY_PATH=private_key.pem

# ──────────── DOCKER ────────────
DOCKER_COMPOSE_IMAGE_NAME=myproject:latest
AWS_LOG_GROUP=/ecs/myproject     # CloudWatch log group

# ──────────── SENTRY ────────────
SENTRY_SDK_DSN=                  # Production error tracking
```

### Frontend `env.example`

```bash
# API Backend (embedded at BUILD time, not runtime!)
VITE_API_URL=https://your-api-domain.com

# Firebase Auth (NOT secret — visible in built JS)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Key Rules:
- `.env` is **NEVER** committed (listed in `.gitignore`)
- `env.example` is **ALWAYS** committed with all keys, no values
- Frontend vars must be prefixed with `VITE_` (Vite injects them at build time)
- Inside Docker networks: use **service names** (`postgresql`, `redis-cache`) not `localhost`
- Use `DOCKER_PORT` for host port mapping, container always runs on `:80`

---

## 4. Backend Dockerfiles

### Production (`app.dockerfile`) — Multi-stage Build

```dockerfile
# Stage 1: Builder — install dependencies
FROM python:3.12-alpine as builder

RUN --mount=type=cache,target=/var/cache/apk,sharing=shared \
    apk add build-base libffi-dev

COPY ./alembic.ini ./poetry.lock ./pyproject.toml /code/
COPY ./.env /code/.env
COPY ./src /code
COPY ./scripts /code/scripts

WORKDIR /code
RUN --mount=type=cache,target=/root/.cache,sharing=shared \
    pip install --no-cache-dir pip==23.3.1 &&\
    pip install --no-cache-dir poetry==1.8.3 &&\
    poetry export -f requirements.txt --output requirements.txt --without-hashes &&\
    pip install --no-cache-dir -r requirements.txt &&\
    pip uninstall -y poetry &&\
    rm -rf requirements.txt

# Stage 2: Runner — minimal image
FROM python:3.12-alpine as runner

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONPATH "/code/src:${PYTHONPATH}"

COPY --from=builder /code /code
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

RUN apk add --no-cache curl

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/healthcheck || exit 1

# Security: non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

WORKDIR /code
ENTRYPOINT ["/bin/sh", "-c", "python main.py migrate && python main.py run"]
```

### Key Patterns:
- **Multi-stage build**: Builder stage installs deps, runner stage is minimal
- **Poetry → requirements.txt**: Poetry exports deps, then is uninstalled (smaller image)
- **Build cache mounts**: `--mount=type=cache` for faster rebuilds
- **PYTHONPATH**: Set to include `/code/src` so imports work
- **Non-root user**: `app:app` user for security
- **Health check**: Curls `/healthcheck` endpoint every 10s
- **Entrypoint**: Runs migrations THEN starts server: `python main.py migrate && python main.py run`

### Development (`app-dev.dockerfile`) — With Infisical Secrets

```dockerfile
FROM python:3.12-alpine as builder

RUN --mount=type=cache,target=/var/cache/apk,sharing=shared \
    apk update && apk add build-base libffi-dev bash && \
    curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.alpine.sh' | bash && \
    apk add infisical

ARG INFISICAL_API_URL
ARG INFISICAL_TOKEN
ARG INSIFICAL_ENV

# ... same pip/poetry install ...

# Inject secrets from Infisical into .env at build time
RUN infisical export -e=$INSIFICAL_ENV --token=$INFISICAL_TOKEN --domain=$INFISICAL_API_URL > .env

FROM python:3.12-alpine as runner
# ... same as production but with --debug flag
ENTRYPOINT python main.py migrate && python main.py run 0.0.0.0 80 --debug
```

---

## 5. Frontend Dockerfiles

### Production (`frontend/Dockerfile`) — Multi-stage Build

```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Accept environment variables as build args (embedded at build time!)
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
# ... all VITE_ vars set as ENV

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Development (`frontend/Dockerfile.dev`) — Hot Reload

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### Frontend `.dockerignore`

```
node_modules
dist
.git
.gitignore
README.md
.env
.env.local
.DS_Store
*.log
```

### Key Rule:
- Frontend env vars are **embedded at build time** via `ARG` → `ENV`
- After changing `VITE_*` vars, you **MUST** rebuild: `docker compose build --no-cache frontend`
- These vars are NOT secret (visible in built JS) — security comes from Firebase rules

---

## 6. Docker Compose — Local Development

```yaml
# docker-compose-local.yml
# Start ONLY infrastructure services. Run backend natively.
services:
  postgresql:
    image: "postgres:alpine3.19"
    container_name: "myproject-postgresql"
    env_file: [.env]
    environment:
      - "POSTGRES_USER=${DATABASE_USER}"
      - "POSTGRES_PASSWORD=${DATABASE_PASSWORD}"
      - "POSTGRES_DB=${DATABASE_NAME}"
    volumes:
      - postgresql:/var/lib/postgresql/data
    ports:
      - "5432:5432"                  # Exposed to host for native backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER} -d ${DATABASE_NAME}"]
      start_period: 5s
      interval: 10s
      timeout: 5s

  redis-cache:
    image: redis:alpine3.19
    hostname: redis-cache
    container_name: "myproject-redis"
    restart: on-failure
    ports:
      - "6380:6379"                  # Different host port to avoid conflicts
    command: redis-server
    volumes:
      - cache:/data

  celery-worker:
    build:
      context: .
      dockerfile: app.dockerfile
    container_name: "myproject-celery-worker"
    depends_on:
      postgresql: { condition: service_healthy }
      redis-cache: { condition: service_started }
    env_file: [.env]
    environment:
      - DATABASE_HOST=postgresql     # Override to use Docker network
      - REDIS_URL=redis://redis-cache:6379/
    working_dir: /code
    volumes:
      - ./scripts:/code/scripts      # Mount scripts for live updates

networks:
  default:
    name: "myproject-network"
    driver: bridge

volumes:
  postgresql:
    name: "myproject-postgresql"
  cache:
    name: "myproject-redis"
```

### Local Dev Commands:
```bash
# 1. Start infrastructure
docker compose -f docker-compose-local.yml up -d

# 2. Run backend natively (with hot-reload)
cd src/
python main.py run --host=0.0.0.0 --port=8080 --debug

# 3. Run frontend natively
cd frontend/
npm run dev

# 4. Run celery worker natively (optional — or use Docker)
cd src/
python main.py worker --loglevel=info
```

---

## 7. Docker Compose — Production

```yaml
# docker-compose.yml
services:
  app:
    image: ${DOCKER_COMPOSE_IMAGE_NAME}       # Pre-built image
    container_name: "${NAME}"
    depends_on:
      postgresql: { condition: service_healthy }
    env_file: [.env]
    ports:
      - "${DOCKER_PORT}:80"                   # Dynamic port mapping
      - "6900:80"                             # Additional port
    logging:
      driver: "awslogs"                       # AWS CloudWatch logging
      options:
        awslogs-region: "us-east-1"
        awslogs-group: "${AWS_LOG_GROUP}"
        awslogs-create-group: "true"
        tag: "{{.Name}}"

  postgresql:
    image: "postgres:alpine3.19"
    container_name: "${NAME}-postgresql"
    environment:
      - "POSTGRES_USER=${DATABASE_USER}"
      - "POSTGRES_PASSWORD=${DATABASE_PASSWORD}"
      - "POSTGRES_DB=${DATABASE_NAME}"
    volumes:
      - postgresql:/var/lib/postgresql/data
    env_file: [.env]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER} -d ${DATABASE_NAME}"]
      start_period: 5s
      interval: 10s
      timeout: 5s

  redis-cache:
    image: redis:alpine3.19
    hostname: redis-cache
    container_name: redis-cache
    restart: on-failure
    ports: ["6379:6379"]
    command: redis-server
    volumes:
      - cache:/data

  celery-worker:
    image: ${DOCKER_COMPOSE_IMAGE_NAME}       # SAME image as app
    container_name: "${NAME}-celery-worker"
    depends_on:
      postgresql: { condition: service_healthy }
      redis-cache: { condition: service_started }
    env_file: [.env]
    # NOTE: Override entrypoint to run celery worker instead of server

networks:
  default:
    name: "${NAME}-backend"
    driver: bridge

volumes:
  cache:
    name: "cache"
```

### Key Patterns:
- `${NAME}` variable used for all container naming (consistent)
- App and celery-worker use the **SAME Docker image** — different entrypoints
- PostgreSQL has a health check — app `depends_on: { condition: service_healthy }`
- Redis has `restart: on-failure` for resilience
- AWS CloudWatch logging driver for production log management
- Named volumes for data persistence across container restarts

---

## 8. Nginx Configuration

```nginx
# frontend/nginx.conf
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # ── Compression ──
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # ── Security Headers ──
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ── Static Asset Caching (1 year) ──
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ── SPA Routing ──
    location / {
        try_files $uri $uri/ /index.html;   # Always serve index.html for client routes
    }

    # ── Health Check ──
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Nginx Features:
| Feature | Implementation |
|---------|---------------|
| **Gzip compression** | All text/JS/CSS/JSON compressed at 1024+ bytes |
| **Security headers** | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection |
| **Static caching** | JS/CSS/images cached for 1 year with `immutable` |
| **SPA routing** | `try_files` falls back to `index.html` for client-side routes |
| **Health check** | `/health` endpoint returns 200 (for load balancers) |

---

## 9. Backend ↔ Frontend Integration Contract

### API Response Wrapper

**EVERY** backend API response follows this format:

```json
{
  "status": "SUCCESS",        // "SUCCESS" or "Error"
  "code": 200,                // HTTP status code
  "data": { ... }             // Actual payload (any shape)
}
```

The frontend **ALWAYS** unwraps this via `unwrapApiData()`:
```typescript
function unwrapApiData<T>(body: unknown): T {
  if (body && 'data' in body && 'status' in body) {
    return normalizeKeys(body.data) as T;
  }
  return normalizeKeys(body) as T;
}
```

### Key Case Convention

| Layer | Format | Example |
|-------|--------|---------|
| Backend Models | `snake_case` | `created_at`, `user_id` |
| Backend Schemas (JSON) | `camelCase` (via `CamelCaseModel`) | `createdAt`, `userId` |
| Frontend receives | `camelCase` | `createdAt` |
| Frontend normalizes to BOTH | `camelCase` + `snake_case` | `createdAt` AND `created_at` |
| Frontend types use | `snake_case` | `created_at: string` |

### Auth Token Flow

```
1. User logs in via Firebase (Google OAuth or Email/Password)
2. Firebase returns User object with .email
3. Frontend injects X-User-Email header via axios interceptor
4. Backend verifies email against whitelist
5. On 403 → Frontend auto-signs-out and redirects to /login
```

### Error Response Format

```json
{
  "status": "Error",
  "code": 422,
  "message": [{"email": "value is not a valid email address"}]
}
```

```json
{
  "status": "Error",
  "code": 404,
  "message": "User not found"
}
```

### Key Rules:
- Backend schemas use `CamelCaseModel` → JSON is always camelCase
- Frontend normalizes to both formats for backwards compatibility
- Auth is header-based (`X-User-Email`), not cookie-based for API calls
- All routes are prefixed with `/api/` on the frontend proxy

---

## 10. CORS & API Proxy Configuration

### Development (Vite Proxy)

```typescript
// frontend/vite.config.ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://backend:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),  // Strip /api prefix
    }
  }
}
```

Frontend calls `/api/reviews` → Vite proxies to `http://backend:8080/reviews`

### Backend CORS

```python
# apps/server.py
_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Production (Nginx Proxy)

In production, Nginx can handle API proxying if frontend and backend are on the same domain:
```nginx
location /api/ {
    proxy_pass http://backend:80/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Or set `VITE_API_URL` to the backend's direct URL for cross-domain API calls.

---

## 11. Health Checks & Readiness

### Backend Health Checks

```python
# apps/server.py
@_app.get("/healthcheck", include_in_schema=False)
def healthcheck():
    return JSONResponse(status_code=200, content={"message": "SUCCESS"})

@_app.get("/", include_in_schema=False)
def root():
    return JSONResponse(status_code=200, content={"message": "SUCCESS"})
```

### Docker Health Checks

**Backend** (`app.dockerfile`):
```dockerfile
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/healthcheck || exit 1
```

**Frontend** (Nginx):
```nginx
location /health {
    access_log off;
    return 200 "healthy\n";
}
```

### PostgreSQL Health Check:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER} -d ${DATABASE_NAME} -h localhost -p 5432"]
  start_period: 5s
  interval: 10s
  timeout: 5s
```

### Celery Health Check:
```python
# Celery task
@celery_app.task(name="health_check")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}
```

---

## 12. Database Seeding Scripts

Scripts live in `scripts/` directory and are mounted into Docker containers.

### Pattern:

```python
# scripts/seed_whitelist.py
import sys
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import asyncio
from loguru import logger
from core.db import async_session as AsyncSessionLocal
from apps.users.models.whitelist import WhitelistedEmail
from sqlalchemy import select, text

# Data to seed
DEFAULT_WHITELISTED_EMAILS = [
    {"email": "admin@company.com", "added_by": "system", "notes": "Admin", "is_active": True},
]

async def seed_whitelist():
    async with AsyncSessionLocal() as session:
        try:
            # Reset sequence to avoid PK conflicts after dump/restore
            await reset_sequence(session)

            for email_data in DEFAULT_WHITELISTED_EMAILS:
                # Check if exists
                existing = await session.execute(
                    select(WhitelistedEmail).where(WhitelistedEmail.email == email_data["email"])
                )
                if existing.scalar_one_or_none():
                    logger.info(f"Skipping existing: {email_data['email']}")
                    continue

                session.add(WhitelistedEmail(**email_data))
                logger.info(f"Added: {email_data['email']}")

            await session.commit()
            logger.success("Seeding completed!")
        except Exception as e:
            logger.error(f"Error: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(seed_whitelist())
```

### Key Rules:
- Scripts add `src/` to `sys.path` to import app modules
- Use `async_session` from `core.db` (same session factory as the app)
- Always check for existing records before inserting (idempotent)
- Reset PostgreSQL sequences after dump/restore to avoid PK conflicts
- Run with: `python scripts/seed_whitelist.py`

---

## 13. Code Quality — Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
exclude: (src/migrations)            # Don't lint auto-generated migrations
repos:
  # General file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: check-added-large-files   # Prevent large file commits
      - id: check-case-conflict       # Check filename case conflicts
      - id: check-merge-conflict      # Detect merge conflict markers
      - id: detect-private-key        # 🔐 Detect committed private keys
      - id: fix-byte-order-marker     # Fix BOM issues
      - id: end-of-file-fixer         # Ensure newline at EOF

  # Import sorting
  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: [--settings-path=./pyproject.toml]

  # Code formatting
  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks:
      - id: black
        args: [--config=./pyproject.toml]

  # Linting
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.9
    hooks:
      - id: ruff
        args: [--config=./pyproject.toml]

  # Docstring coverage (100% required!)
  - repo: https://github.com/econchick/interrogate
    rev: 1.7.0
    hooks:
      - id: interrogate
        args: [--config=./pyproject.toml]
```

### Setup Commands:
```bash
pip install pre-commit
pre-commit install             # Install hooks into .git/hooks
pre-commit run --all-files     # Run manually on all files
```

---

## 14. Code Quality — MegaLinter

```yaml
# .mega-linter.yaml
APPLY_FIXES: none              # Report only, don't auto-fix
ENABLE_LINTERS:
  # Python
  - PYTHON_PYLINT              # Structural linting
  - PYTHON_BANDIT              # 🔐 Security vulnerability scanner
  - PYTHON_MYPY                # Type checking

  # Security
  - REPOSITORY_GITLEAKS        # 🔐 Detect secrets in git history
  - REPOSITORY_CHECKOV         # Infrastructure-as-code security
  - REPOSITORY_DUSTILOCK       # Dependency vulnerability scanning

  # Docker
  - DOCKERFILE_HADOLINT        # Dockerfile best practices

  # Config files
  - YAML_PRETTIER
  - MARKDOWN_MARKDOWNLINT
  - JSON_PRETTIER
  - HTML_HTMLHINT
  - ENV_DOTENV_LINTER

  # Shell scripts
  - BASH_SHELLCHECK
  - BASH_EXEC
  - BASH_SHFMT

FILTER_REGEX_EXCLUDE: /src/migration   # Skip auto-generated migrations
SHOW_ELAPSED_TIME: true
VALIDATE_ALL_CODEBASE: true

# Exclude false positives
PYTHON_BANDIT_FILTER_REGEX_EXCLUDE: '/src/constants/messages\.py'
```

### Run locally:
```bash
npx mega-linter-runner
```

---

## 15. Code Quality — Pylint & Tool Configs

### `.pylintrc`

```ini
[MESSAGES CONTROL]
disable=C0114,E0401,R0903,W0311,R0913,W0107,C0303,E0213,W0707,R1705,R0801,R0914

[FORMAT]
max-line-length=120

[main]
max-public-methods=25
```

### `pyproject.toml` Tool Configs

```toml
[tool.isort]
profile = "black"                    # Compatible with Black formatting

[tool.black]
skip-magic-trailing-comma = true
verbose = true

[tool.ruff]
line-length = 89                     # Slightly under Black's 88

[tool.interrogate]
ignore-module = true                 # Don't require module-level docstrings
ignore-init-method = true
ignore-init-module = true
fail-under = 100                     # 100% docstring coverage required!
verbose = 2
```

---

## 16. Code Quality — SonarQube

```properties
# sonar-project.properties
sonar.projectKey=code-review-agent
sonar.qualitygate.wait=true          # Block pipeline if quality gate fails
sonar.python.version=3.11
```

---

## 17. Security Practices

| Practice | Implementation |
|----------|---------------|
| **Non-root Docker user** | `RUN addgroup -S app && adduser -S app -G app` + `USER app` |
| **Secret detection** | `detect-private-key` pre-commit hook + `REPOSITORY_GITLEAKS` in MegaLinter |
| **Security scanning** | `PYTHON_BANDIT` for Python + `REPOSITORY_CHECKOV` for IaC |
| **Dependency scanning** | `REPOSITORY_DUSTILOCK` in MegaLinter |
| **Nginx security headers** | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` |
| **Webhook signature verification** | `GITHUB_WEBHOOK_SECRET`, `GITLAB_WEBHOOK_SECRET` env vars |
| **JWT rotation** | Separate access (1h) and refresh (24h) tokens |
| **Request encryption** | Optional AES payload encryption with timestamp checking |
| **Rate limiting** | `FastAPILimiter` with Redis (10 requests / 5 seconds) |
| **CORS** | Configurable allowed origins |
| **Gitignore** | `.env`, `*.pem`, `__pycache__`, IDE configs all excluded |
| **Infisical** | Dev environment uses Infisical for centralized secret management |

### `.gitignore` Pattern

```
.env                    # Secrets
*.idea                  # IDE
*__pycache__*           # Python bytecode
.ruff_cache             # Linter cache
megalinter-reports      # Linter reports
redis_ca.pem            # TLS certs
public_key.pem          # Crypto keys
private_key.pem
.vscode                 # IDE
.agents                 # AI agent configs
.claude / .cursor       # AI tool configs
.github                 # CI/CD (if using different platform)
cloned_repos            # Runtime data
worktrees               # Git worktrees
```

---

## 18. Monitoring & Error Tracking (Sentry)

```python
# Configured in settings
SENTRY_SDK_DSN = settings.SENTRY_SDK_DSN

# Initialize in app startup
import sentry_sdk
sentry_sdk.init(
    dsn=settings.SENTRY_SDK_DSN,
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)
```

### Key Rules:
- `SENTRY_SDK_DSN` env var — leave empty for local dev (disables Sentry)
- Sentry integrates with both FastAPI (HTTP errors) and Celery (task failures)
- Use `sentry-sdk` package (already in `pyproject.toml`)

---

## 19. Cloud Logging (AWS CloudWatch)

```yaml
# docker-compose.yml (production only)
app:
  logging:
    driver: "awslogs"
    options:
      awslogs-region: "us-east-1"
      awslogs-group: "${AWS_LOG_GROUP}"    # e.g., /ecs/myproject
      awslogs-create-group: "true"        # Auto-create log group
      tag: "{{.Name}}"                    # Tag with container name
```

### Key Rules:
- Only enable `awslogs` driver in production compose
- Local dev uses default Docker logging (`docker logs <container>`)
- Set `AWS_LOG_GROUP` in `.env`
- AWS credentials must be configured on the host (IAM role or env vars)

---

## 20. Secret Management (Infisical)

Development environments use **Infisical** for centralized secret management:

```dockerfile
# app-dev.dockerfile
ARG INFISICAL_API_URL
ARG INFISICAL_TOKEN
ARG INSIFICAL_ENV

RUN infisical export -e=$INSIFICAL_ENV --token=$INFISICAL_TOKEN --domain=$INFISICAL_API_URL > .env
```

### Build command:
```bash
docker build \
  --build-arg INFISICAL_API_URL=https://app.infisical.com/api \
  --build-arg INFISICAL_TOKEN=st.xxx \
  --build-arg INSIFICAL_ENV=dev \
  -f app-dev.dockerfile .
```

---

## 21. Git Workflow & .gitignore

### Branch Strategy:
| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `development` | Integration branch |
| `feature/*` | New features |
| `bugfix/*` | Bug fixes |
| `hotfix/*` | Emergency production fixes |

### Commit Quality:
- Pre-commit hooks run on every `git commit`
- Hooks: format (black), lint (ruff), sort imports (isort), docstrings (interrogate), security (detect-private-key)
- Migrations directory excluded from linting

---

## 22. Dependency Management

### Backend (Poetry)

```bash
# Initialize
poetry init

# Add dependency
poetry add fastapi sqlalchemy[postgresql-asyncpg] alembic

# Add dev dependency
poetry add --group dev black pre-commit pytest

# Install all
poetry install

# Export for Docker
poetry export -f requirements.txt --output requirements.txt --without-hashes

# Update
poetry update
```

### Frontend (npm)

```bash
# Initialize
npm init -y

# Add dependency
npm install react react-dom @tanstack/react-query axios

# Add dev dependency
npm install -D typescript @types/react vite @vitejs/plugin-react

# Install all
npm install

# Build
npm run build
```

### `package.json` Scripts:
```json
{
  "scripts": {
    "dev": "vite",           // Development server with HMR
    "build": "vite build",   // Production build to dist/
    "preview": "vite preview", // Preview production build
    "start": "vite"          // Alias for dev
  }
}
```

---

## 23. App Lifecycle & Startup Sequence

### Backend Startup Order

```
1. Docker starts PostgreSQL container
2. PostgreSQL health check passes (pg_isready)
3. Docker starts app container (depends_on: postgresql)
4. Entrypoint runs: python main.py migrate (Alembic)
5. Entrypoint runs: python main.py run
6. CLI creates FastAPI app via create_app()
7. Lifespan context manager initializes:
   a. APScheduler starts (for cron jobs)
   b. FastAPILimiter.init(redis) (rate limiting)
8. CORS middleware attached
9. Exception handlers registered
10. Routers mounted under /api prefix
11. Uvicorn starts serving on 0.0.0.0:80
12. Docker HEALTHCHECK starts polling /healthcheck
```

### FastAPI App Factory (`apps/server.py`)

```python
def create_app(debug: bool = False) -> FastAPI:
    _app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc" if debug else None,    # Only in debug
        swagger_ui_parameters={
            "defaultModelsExpandDepth": -1,
            "displayRequestDuration": True,
            "tryItOutEnabled": True,
            "requestSnippetsEnabled": True,
            "withCredentials": True,
            "persistAuthorization": True,
        },
        lifespan=lifespan,
    )
    init_routers(_app)            # Mount all module routers
    root_health_path(_app)        # Add / and /healthcheck
    init_middlewares(_app)        # CORS
    start_exception_handlers(_app) # Custom + validation + unexpected
    return _app

# Environment-based app creation
if settings.ENV != AppEnvironment.PRODUCTION:
    debug_app = create_app(debug=True)
else:
    production_app = create_app()
```

---

## 24. Complete Development Workflow

```bash
# ── 1. Clone & Setup ──
git clone <repo-url>
cd project-name
cp env.example .env
# Edit .env with local values

# ── 2. Backend Setup ──
poetry install
pre-commit install

# ── 3. Start Infrastructure ──
docker compose -f docker-compose-local.yml up -d

# ── 4. Database Setup ──
cd src/
python main.py make-migrations --message "initial"
python main.py migrate

# ── 5. Seed Data ──
python scripts/seed_whitelist.py

# ── 6. Start Backend ──
python main.py run --host=0.0.0.0 --port=8080 --debug

# ── 7. Frontend Setup (new terminal) ──
cd frontend/
cp env.example .env
npm install
npm run dev

# ── 8. Start Celery (new terminal) ──
cd src/
python main.py worker --loglevel=info

# ── 9. Access ──
# Backend API: http://localhost:8080/docs
# Frontend:    http://localhost:3000
# PgAdmin:     http://localhost:5050
```

---

## 25. Complete Production Deployment Workflow

```bash
# ── 1. Build Backend Image ──
docker build -f app.dockerfile -t myproject:latest .

# ── 2. Build Frontend Image (with env vars!) ──
cd frontend/
docker build \
  --build-arg VITE_API_URL=https://api.myproject.com \
  --build-arg VITE_FIREBASE_API_KEY=AIza... \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com \
  --build-arg VITE_FIREBASE_PROJECT_ID=myproject \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=myproject.appspot.com \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=123... \
  --build-arg VITE_FIREBASE_APP_ID=1:123...:web:abc... \
  -t myproject-frontend:latest .

# ── 3. Configure .env ──
cp env.example .env
# Fill in production values

# ── 4. Deploy ──
docker compose up -d

# ── 5. Verify ──
docker compose ps
docker compose logs -f app
curl http://localhost:${DOCKER_PORT}/healthcheck
```

---

## 26. Full System Bootstrap — From Zero to Running

### When you receive a request to build a new system, follow these steps using all 3 agents:

```
Phase 1: Infrastructure (THIS AGENT)
├── Create project directory
├── Create .env and env.example
├── Create .gitignore
├── Create docker-compose-local.yml
├── Create docker-compose.yml
├── Create app.dockerfile
├── Create app-dev.dockerfile
├── Create .pre-commit-config.yaml
├── Create .mega-linter.yaml
├── Create .pylintrc
├── Create sonar-project.properties
├── Initialize git repo
└── Start infrastructure: docker compose -f docker-compose-local.yml up -d

Phase 2: Backend (BACKEND_AGENT.md)
├── poetry init + install dependencies
├── Create src/ directory structure
├── Create config.py, core/db.py, core/exceptions.py
├── Create core/auth.py, core/utils/
├── Create constants/
├── Create apps/server.py + handlers.py
├── Create cli.py with all commands
├── Create alembic.ini + migrations/env.py
├── Create first module: python main.py startapp <name>
├── Define models, schemas, services, controllers
├── Register models in apps/__init__.py
├── Register routers in apps/server.py
├── Run migrations: python main.py make-migrations && python main.py migrate
├── Create seed scripts in scripts/
└── Verify: python main.py run --debug

Phase 3: Frontend (FRONTEND_AGENT.md)
├── Create frontend/ directory
├── npx create-vite . --template react-ts
├── Install all dependencies (Radix, TanStack, Tailwind, etc.)
├── Configure vite.config.ts, tsconfig.json, tailwind.config.js
├── Create src/ directory structure
├── Create contexts (Auth, Theme)
├── Create services/api.ts with interceptors
├── Create types/
├── Create components (Layout, ProtectedRoute, UI primitives)
├── Create pages
├── Wire up App.tsx with providers + routes
├── Create Dockerfile, Dockerfile.dev, nginx.conf
├── Create env.example
└── Verify: npm run dev

Phase 4: Integration Testing (THIS AGENT)
├── Verify frontend proxy hits backend (/api/* → backend)
├── Verify auth flow (Firebase → X-User-Email header → backend)
├── Verify BaseResponse unwrapping works
├── Verify health checks respond
├── Build production images
├── docker compose up -d (full stack)
└── End-to-end smoke test
```

---

## 27. Anti-Patterns to Avoid

| ❌ Don't | ✅ Do |
|----------|-------|
| Commit `.env` files | Use `env.example` as template, `.env` in `.gitignore` |
| Run containers as root | Create non-root user in Dockerfile |
| Skip health checks | Add `/healthcheck` endpoint + Docker `HEALTHCHECK` |
| Use `latest` tag in production | Pin specific image versions |
| Hardcode service URLs | Use env vars + Docker service names |
| Skip migration on deploy | Entrypoint: `migrate && run` |
| Use `docker compose up` for local dev | Use `docker-compose-local.yml` (infra only) + native dev servers |
| Build frontend without env vars | Pass `VITE_*` as `--build-arg` |
| Skip pre-commit setup | `pre-commit install` on first clone |
| Mix production and dev Docker configs | Separate `docker-compose.yml` and `docker-compose-local.yml` |
| Put seed data in migrations | Use standalone `scripts/` directory |
| Log to files inside containers | Use Docker logging drivers (awslogs, json-file) |
| Skip `depends_on` conditions | Use `condition: service_healthy` for database deps |
| Copy `node_modules` into Docker | Use `.dockerignore` to exclude it |

---

## 28. Master Checklist — New Full-Stack Project

### Infrastructure Files
- [ ] `.env` + `env.example` (backend)
- [ ] `frontend/.env` + `frontend/env.example`
- [ ] `.gitignore` (with all exclusions from Section 21)
- [ ] `alembic.ini` (pointing to `src/migrations`)
- [ ] `pyproject.toml` (with Poetry deps + tool configs)

### Docker Files
- [ ] `app.dockerfile` (production: multi-stage, non-root, healthcheck)
- [ ] `app-dev.dockerfile` (development: with debug + optional Infisical)
- [ ] `frontend/Dockerfile` (production: Node build → Nginx)
- [ ] `frontend/Dockerfile.dev` (development: hot reload)
- [ ] `frontend/.dockerignore`
- [ ] `frontend/nginx.conf` (gzip, security headers, SPA fallback, cache)

### Docker Compose
- [ ] `docker-compose-local.yml` (PostgreSQL + Redis + Celery, exposed ports)
- [ ] `docker-compose.yml` (production: all services, AWS logging, named network)

### Code Quality
- [ ] `.pre-commit-config.yaml` (black, ruff, isort, interrogate, security hooks)
- [ ] `.mega-linter.yaml` (pylint, bandit, mypy, hadolint, gitleaks, checkov)
- [ ] `.pylintrc` (disabled rules, line length, max methods)
- [ ] `sonar-project.properties` (project key, quality gate, Python version)

### Security
- [ ] Non-root user in all Dockerfiles
- [ ] `detect-private-key` pre-commit hook enabled
- [ ] `REPOSITORY_GITLEAKS` in MegaLinter
- [ ] Webhook secret env vars defined
- [ ] Rate limiter configured (Redis-backed)
- [ ] Nginx security headers set

### Scripts
- [ ] `scripts/seed_whitelist.py` (or equivalent)
- [ ] `scripts/seed_team.py` (if applicable)

### Integration
- [ ] Frontend Vite proxy → backend (dev)
- [ ] Frontend Nginx proxy → backend (prod) OR direct API URL
- [ ] `BaseResponse` wrapper on all backend endpoints
- [ ] `unwrapApiData()` + `normalizeKeys()` on frontend
- [ ] `X-User-Email` header interceptor
- [ ] 403 handler (auto-logout)
- [ ] Health checks on all services

### Monitoring
- [ ] Sentry SDK configured (production only)
- [ ] AWS CloudWatch logging driver (production only)
- [ ] `loguru` logger used in all backend services

---

> **This agent completes the trio. Together with BACKEND_AGENT.md and FRONTEND_AGENT.md, these three agents provide a complete blueprint for building any full-stack system with the exact same architecture, patterns, and quality standards established in this project.**
