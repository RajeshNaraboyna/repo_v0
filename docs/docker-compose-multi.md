# Docker Compose — Multi-Service Deployment

Deploys each service as a separate container for production-style isolation and independent scaling.

## File

- **Compose file:** `docker-compose.yml` (repo root)
- **Env template:** `.env.example`

## Services

| Service | Container | Image | Ports | Depends On |
|---------|-----------|-------|-------|------------|
| PostgreSQL | `scl-postgres` | `postgres:16-alpine` | 5432 | — |
| etcd | `scl-milvus-etcd` | `quay.io/coreos/etcd:v3.5.18` | — | — |
| MinIO | `scl-milvus-minio` | `minio/minio` | 9000, 9001 | — |
| Milvus | `scl-milvus-standalone` | `milvusdb/milvus:v2.4.17` | 19530, 9091 | etcd, MinIO |
| SCL API | `scl-api` | built from `./scl-api` | 4002 | PostgreSQL |
| SCL RAG | `scl-rag` | built from `./scl-rag` | 4003 | Milvus |
| SCL Frontend | `scl-frontend` | built from `./scl-frontend` | 4001→80 | SCL API |

## Quick Start

```bash
# 1. Create your environment file
cp .env.example .env
# Edit .env — at minimum change SECRET_KEY and POSTGRES_PASSWORD

# 2. Build and start everything
docker compose up -d --build

# 3. Verify all containers are healthy
docker compose ps

# 4. Open the application
#    Frontend:  http://localhost:4001
#    API docs:  http://localhost:4002/docs
#    RAG docs:  http://localhost:4003/docs
```

## Startup Order

Docker Compose health checks enforce the following startup order:

```
postgres (healthy) ──────────────▶ scl-api (healthy) ──▶ scl-frontend
etcd (healthy) ┐
               ├──▶ milvus (healthy) ──▶ scl-rag
minio (healthy)┘
```

All dependencies use `condition: service_healthy` so downstream services only start after their databases are ready.

## Common Operations

### View logs

```bash
# All services
docker compose logs -f

# Single service
docker compose logs -f scl-api
```

### Rebuild a single service

```bash
docker compose up -d --build scl-api
```

### Stop everything

```bash
docker compose down
```

### Stop and destroy all data

```bash
docker compose down -v
```

### Run database migrations

```bash
docker compose exec scl-api alembic upgrade head
```

### Scale a service

```bash
docker compose up -d --scale scl-api=3
```

> **Note:** When scaling `scl-api`, remove the `container_name` field or you'll get conflicts.

## Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | PostgreSQL data files |
| `etcd_data` | Milvus metadata store |
| `minio_data` | Milvus object storage |
| `milvus_data` | Milvus vector index data |

## Networking

All services join the default Compose network. Services reference each other by name:

- API → PostgreSQL: `postgres:5432`
- API → RAG: `scl-rag:4003`
- RAG → Milvus: `milvus:19530`
- Frontend (nginx) → API: `scl-api:4002`

## Production Considerations

1. **Secrets:** Use Docker secrets or an external vault instead of `.env` for `SECRET_KEY` and `POSTGRES_PASSWORD`.
2. **Persistent storage:** The Compose file uses local volume drivers. For production, consider using named volumes backed by external storage.
3. **Resource limits:** Add `deploy.resources.limits` to each service in the Compose file.
4. **TLS:** Place a reverse proxy (Traefik, Caddy) in front for HTTPS termination.
5. **Backups:** Schedule `pg_dump` for PostgreSQL and Milvus backup routines.
