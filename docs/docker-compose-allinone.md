# Docker Compose — All-in-One Deployment

Runs the API, Frontend, and RAG service inside a **single container** using `supervisord`, alongside PostgreSQL and Milvus infrastructure.

## File

- **Compose file:** `docker-compose.allinone.yml` (repo root)
- **Dockerfile:** `Dockerfile.allinone` (repo root)
- **Env template:** `.env.example`

## Services

| Service | Container | Ports | Description |
|---------|-----------|-------|-------------|
| PostgreSQL | `scl-postgres` | 5432 | Relational database |
| etcd | `scl-milvus-etcd` | — | Milvus metadata |
| MinIO | `scl-milvus-minio` | 9000, 9001 | Milvus object storage |
| Milvus | `scl-milvus-standalone` | 19530, 9091 | Vector database |
| **SCL App** | `scl-app` | **4001→80**, 4002, 4003 | All-in-one (nginx + API + RAG) |

## What Runs Inside `scl-app`

The container uses `supervisord` to manage three processes:

| Process | Role | Internal Port |
|---------|------|---------------|
| **nginx** | Serves React SPA, proxies `/api/` and `/rag/` | 80 |
| **scl-api** | FastAPI backend | 4002 |
| **scl-rag** | RAG / vector search service | 4003 |

Nginx routing inside the container:

```
http://localhost:80/            → React SPA (static files)
http://localhost:80/api/*       → 127.0.0.1:4002 (scl-api)
http://localhost:80/rag/*       → 127.0.0.1:4003 (scl-rag)
```

## Quick Start

```bash
# 1. Create your environment file
cp .env.example .env

# 2. Build and start
docker compose -f docker-compose.allinone.yml up -d --build

# 3. Verify
docker compose -f docker-compose.allinone.yml ps

# 4. Open the application
#    Frontend:          http://localhost:4001
#    API (via nginx):   http://localhost:4001/api/v1/...
#    API (direct):      http://localhost:4002/docs
#    RAG (direct):      http://localhost:4003/docs
```

## Startup Order

```
postgres (healthy) ──┐
                     ├──▶ scl-app
milvus (healthy) ────┘
  ├── etcd
  └── minio
```

The `scl-app` container waits for both PostgreSQL and Milvus to be healthy before starting.

## Common Operations

### View logs

```bash
# All containers
docker compose -f docker-compose.allinone.yml logs -f

# Just the app
docker compose -f docker-compose.allinone.yml logs -f scl-app
```

### Check supervisor process status

```bash
docker exec scl-app supervisorctl status
```

Expected output:
```
nginx                            RUNNING   pid 10, uptime 0:05:00
scl-api                          RUNNING   pid 11, uptime 0:05:00
scl-rag                          RUNNING   pid 12, uptime 0:05:00
```

### Restart a single process inside the container

```bash
docker exec scl-app supervisorctl restart scl-api
docker exec scl-app supervisorctl restart scl-rag
docker exec scl-app supervisorctl restart nginx
```

### Rebuild and restart

```bash
docker compose -f docker-compose.allinone.yml up -d --build scl-app
```

### Run database migrations

```bash
docker exec scl-app sh -c "cd /app/scl-api && alembic upgrade head"
```

### Stop everything

```bash
docker compose -f docker-compose.allinone.yml down
```

### Destroy all data

```bash
docker compose -f docker-compose.allinone.yml down -v
```

## When to Use All-in-One vs Multi-Service

| Criteria | All-in-One | Multi-Service |
|----------|-----------|---------------|
| Simplicity | Fewer containers to manage | More containers |
| Scaling | Cannot scale services independently | Scale API, RAG, frontend separately |
| Resource isolation | Shared CPU/memory | Independent limits per service |
| Failure isolation | One crash can affect all | Services restart independently |
| Best for | Dev, staging, demos, small deployments | Production, high availability |

## Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | PostgreSQL data files |
| `etcd_data` | Milvus metadata store |
| `minio_data` | Milvus object storage |
| `milvus_data` | Milvus vector index data |
