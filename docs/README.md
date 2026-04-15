# Deployment Documentation

This folder contains deployment guides for the **School Management System (SCL)**.

## Deployment Options

| Guide | Description | Best For |
|-------|-------------|----------|
| [Docker Images](docker-images.md) | Building individual Docker images | CI/CD pipelines, image registries |
| [Docker Compose — Multi-Service](docker-compose-multi.md) | Each service in its own container | Production, scaling individual services |
| [Docker Compose — All-in-One](docker-compose-allinone.md) | All services in a single container | Dev/staging, simple single-host setups |
| [Helm — Multi-Service](helm-multi.md) | Kubernetes with separate pods per service | Production Kubernetes clusters |
| [Helm — All-in-One](helm-allinone.md) | Kubernetes with a single pod | Small clusters, dev namespaces |
| [Environment Reference](environment-reference.md) | All environment variables | Configuration reference |

## Architecture Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│  Frontend    │──────▶│  SCL API    │──────▶│  PostgreSQL     │
│  (React/Nginx)│  /api │  (FastAPI)  │       │  (port 5432)    │
│  port 80     │       │  port 4002  │       └─────────────────┘
└─────────────┘       │             │
                      │             │──────▶┌─────────────────┐
                      └─────────────┘       │  SCL RAG        │
                                            │  (FastAPI)      │
                                            │  port 4003      │
                                            │       │         │
                                            └───────┼─────────┘
                                                    │
                                            ┌───────▼─────────┐
                                            │  Milvus         │
                                            │  (port 19530)   │
                                            │  ├── etcd       │
                                            │  └── MinIO      │
                                            └─────────────────┘
```

## Quick Start

```bash
# Fastest path — all-in-one with Docker Compose
cp .env.example .env
docker compose -f docker-compose.allinone.yml up -d --build
# Open http://localhost:4001
```
