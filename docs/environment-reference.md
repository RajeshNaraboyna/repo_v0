# Environment Variable Reference

Complete reference of all environment variables used by the School Management System services.

---

## SCL API (`scl-api`)

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `school-management-api` | Application name (appears in health checks) |
| `APP_ENV` | `development` | Environment: `development`, `staging`, `production` |
| `DEBUG` | `true` | Enable debug mode and verbose SQL logging |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `4002` | Server port |
| `DATABASE_URL` | `sqlite+aiosqlite:///./school_mgmt.db` | Async database URL. Use `postgresql+asyncpg://user:pass@host:5432/db` for production |
| `SECRET_KEY` | `your-secret-key-change-in-production` | JWT signing secret. **Must change in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT token lifetime in minutes |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `CORS_ORIGINS` | `["http://localhost:4001", "http://localhost:5173"]` | JSON array of allowed CORS origins |
| `RAG_SERVICE_URL` | `http://localhost:4003` | URL of the RAG service |
| `GUEST_ACCESS_ENABLED` | `true` | Allow guest (unauthenticated) access |
| `GUEST_TOKEN_EXPIRE_MINUTES` | `60` | Guest token lifetime in minutes |

### Database URL Examples

| Backend | URL Format |
|---------|-----------|
| SQLite (dev) | `sqlite+aiosqlite:///./school_mgmt.db` |
| PostgreSQL | `postgresql+asyncpg://scluser:sclpass@localhost:5432/school_mgmt` |
| Docker Compose | `postgresql+asyncpg://scluser:sclpass@postgres:5432/school_mgmt` |
| Kubernetes | `postgresql+asyncpg://scluser:sclpass@postgresql:5432/school_mgmt` |

---

## SCL RAG (`scl-rag`)

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `scl-rag-service` | Application name |
| `APP_ENV` | `development` | Environment |
| `DEBUG` | `true` | Enable debug mode |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `4003` | Server port |
| `CORS_ORIGINS` | `["http://localhost:4001", "http://localhost:4002", "http://localhost:5173"]` | Allowed CORS origins |
| `MILVUS_HOST` | `localhost` | Milvus server hostname |
| `MILVUS_PORT` | `19530` | Milvus gRPC port |
| `MILVUS_COLLECTION_NAME` | `student_results` | Milvus collection for storing vectors |
| `MILVUS_DB_NAME` | `default` | Milvus database name |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence-transformer model name |
| `EMBEDDING_DIMENSION` | `384` | Embedding vector dimension (must match model) |

---

## SCL Frontend (`scl-frontend`)

The frontend is a static React build served by Nginx. Configuration is **compile-time** via Vite:

| Build-Time Variable | Default | Description |
|---------------------|---------|-------------|
| `VITE_API_URL` | `/api` | API base URL (relative path uses nginx proxy) |

At runtime, Nginx proxies `/api/` requests to the backend. The proxy target is configured in `nginx.conf` (Docker) or via Kubernetes Service DNS.

---

## Docker Compose Variables (`.env`)

These variables are used by `docker-compose.yml` and `docker-compose.allinone.yml`:

| Variable | Default | Used By |
|----------|---------|---------|
| `POSTGRES_USER` | `scluser` | PostgreSQL container + API `DATABASE_URL` |
| `POSTGRES_PASSWORD` | `sclpass` | PostgreSQL container + API `DATABASE_URL` |
| `POSTGRES_DB` | `school_mgmt` | PostgreSQL container + API `DATABASE_URL` |
| `SECRET_KEY` | `change-me-in-production` | API JWT signing |

### Setup

```bash
cp .env.example .env
# Edit .env with your values
```

---

## Infrastructure Services

### PostgreSQL

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `scluser` | Database superuser |
| `POSTGRES_PASSWORD` | `sclpass` | Database password |
| `POSTGRES_DB` | `school_mgmt` | Default database name |

### Milvus

| Variable | Default | Description |
|----------|---------|-------------|
| `ETCD_ENDPOINTS` | `etcd:2379` | etcd connection |
| `MINIO_ADDRESS` | `minio:9000` | MinIO object storage |

### MinIO (Milvus storage backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |

---

## Per-Deployment Cheat Sheet

### Local Development

```bash
# No .env needed — defaults work for local dev
cd scl-api && uv run uvicorn app.main:app --reload --port 4002
```

### Docker Compose (Multi-Service)

```env
POSTGRES_USER=scluser
POSTGRES_PASSWORD=a-strong-password
POSTGRES_DB=school_mgmt
SECRET_KEY=a-random-64-char-string
```

### Docker Compose (All-in-One)

Same as multi-service `.env` above — the compose file passes them to the container.

### Kubernetes / Helm

Set via `values.yaml` or `--set` flags:

```bash
helm install scl-mgmt ./helm -n school \
  --set scl-api.env.DATABASE_URL="postgresql+asyncpg://user:pass@postgresql:5432/school_mgmt" \
  --set scl-api.env.SECRET_KEY="your-production-secret" \
  --set scl-rag.env.MILVUS_HOST="milvus"
```

For production, use Kubernetes Secrets instead of plain-text env vars in values.yaml.

---

## Security Notes

1. **`SECRET_KEY`** — Generate a strong random value: `openssl rand -hex 32`
2. **`POSTGRES_PASSWORD`** — Use a strong password, never the default in production.
3. **`MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`** — Change from defaults if MinIO is exposed.
4. **`DEBUG`** — Always set to `false` in production (disables SQL logging and stack traces).
5. **`CORS_ORIGINS`** — Restrict to your actual domain(s) in production.
