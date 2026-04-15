# Building Docker Images

This guide covers building the individual Docker images for each service and the all-in-one image.

## Prerequisites

- Docker 20.10+ (BuildKit enabled)
- All commands run from the **repository root** (`scl-mgmt/`)

---

## Individual Service Images

### SCL API

```bash
docker build -t scl-api:latest ./scl-api
```

| Detail | Value |
|--------|-------|
| Dockerfile | `scl-api/Dockerfile` |
| Base | `python:3.11-slim` (multi-stage) |
| Exposed port | `4002` |
| Entrypoint | `uvicorn app.main:app --host 0.0.0.0 --port 4002` |
| Health check | `GET /health` |

**What's included:** Application code, Alembic migrations, Python dependencies.  
**What's excluded:** tests, `.venv`, dev dependencies (see `.dockerignore`).

### SCL Frontend

```bash
docker build -t scl-frontend:latest ./scl-frontend
```

| Detail | Value |
|--------|-------|
| Dockerfile | `scl-frontend/Dockerfile` |
| Build stage | `node:20-alpine` (runs `npm ci && npm run build`) |
| Runtime stage | `nginx:1.27-alpine` |
| Exposed port | `80` |
| Health check | `wget http://localhost:80/` |

**Nginx config:** `scl-frontend/nginx.conf` — serves the SPA, proxies `/api/` to `scl-api:4002`, gzip-compresses assets.

### SCL RAG

```bash
docker build -t scl-rag:latest ./scl-rag
```

| Detail | Value |
|--------|-------|
| Dockerfile | `scl-rag/Dockerfile` |
| Base | `python:3.11-slim` (multi-stage) |
| Exposed port | `4003` |
| Entrypoint | `uvicorn app.main:app --host 0.0.0.0 --port 4003` |
| Health check | `GET /health` |

> **Note:** The RAG image includes `sentence-transformers`, which downloads the embedding model (~90 MB) on first startup. Plan for a longer initial boot.

---

## All-in-One Image

Bundles all three services (API + Frontend + RAG) into a single container using `supervisord`.

```bash
docker build -f Dockerfile.allinone -t scl-mgmt:latest .
```

| Detail | Value |
|--------|-------|
| Dockerfile | `Dockerfile.allinone` (repo root) |
| Processes | nginx (port 80), uvicorn API (port 4002), uvicorn RAG (port 4003) |
| Process manager | `supervisord` |
| Health check | `GET /health` on ports 4002 and 4003 |

**Run standalone (no external DB):**
```bash
docker run -p 4001:80 -p 4002:4002 -p 4003:4003 scl-mgmt:latest
```

---

## Build Tips

### Caching

Docker BuildKit layer caching is leveraged — `pyproject.toml` / `package.json` are copied before source so dependency layers are reused.

### Tagging for a Registry

```bash
# Tag and push
REGISTRY=ghcr.io/yourorg

docker build -t $REGISTRY/scl-api:v0.1.0 ./scl-api
docker push $REGISTRY/scl-api:v0.1.0

docker build -t $REGISTRY/scl-frontend:v0.1.0 ./scl-frontend
docker push $REGISTRY/scl-frontend:v0.1.0

docker build -t $REGISTRY/scl-rag:v0.1.0 ./scl-rag
docker push $REGISTRY/scl-rag:v0.1.0

docker build -f Dockerfile.allinone -t $REGISTRY/scl-mgmt:v0.1.0 .
docker push $REGISTRY/scl-mgmt:v0.1.0
```

### Multi-Platform Build

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t scl-api:latest ./scl-api --push
```

---

## Image Sizes (Approximate)

| Image | Approximate Size |
|-------|-----------------|
| `scl-api` | ~180 MB |
| `scl-frontend` | ~30 MB |
| `scl-rag` | ~1.5 GB (includes sentence-transformers + PyTorch) |
| `scl-mgmt` (all-in-one) | ~1.8 GB |
