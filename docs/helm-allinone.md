# Helm — All-in-One Deployment

Deploys the School Management System on Kubernetes as a **single pod** containing all three services (API + Frontend + RAG) managed by `supervisord`.

## Chart Structure

```
helm-allinone/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl
    ├── deployment.yaml     # Single deployment with 3 ports
    ├── service.yaml        # ClusterIP exposing http(80), api(4002), rag(4003)
    ├── ingress.yaml        # Optional ingress → port 80
    └── hpa.yaml            # Optional horizontal pod autoscaler
```

## Prerequisites

- Kubernetes 1.25+
- Helm 3.10+
- `scl-mgmt` Docker image pushed to an accessible registry  
  (built from `Dockerfile.allinone`)
- PostgreSQL and Milvus available in the cluster

## Quick Start

```bash
# 1. Build and push the all-in-one image
REGISTRY=ghcr.io/yourorg
docker build -f Dockerfile.allinone -t $REGISTRY/scl-mgmt:v0.1.0 .
docker push $REGISTRY/scl-mgmt:v0.1.0

# 2. Install
helm install scl-mgmt ./helm-allinone \
  -n school --create-namespace \
  --set image.repository=$REGISTRY/scl-mgmt \
  --set image.tag=v0.1.0
```

## What Gets Deployed

| Resource | Ports | Description |
|----------|-------|-------------|
| Deployment | 80, 4002, 4003 | Single pod running nginx + API + RAG |
| Service (ClusterIP) | 80 (`http`), 4002 (`api`), 4003 (`rag`) | Internal access |
| Ingress (optional) | 80 | External HTTP/HTTPS access |
| HPA (optional) | — | CPU-based autoscaling |

### Internal Pod Architecture

```
┌─── Pod ─────────────────────────────────┐
│  supervisord                            │
│  ├── nginx        :80   (frontend+proxy)│
│  ├── scl-api      :4002 (FastAPI)       │
│  └── scl-rag      :4003 (FastAPI)       │
└─────────────────────────────────────────┘
```

Nginx routes:
- `/` → React SPA (static files)
- `/api/*` → `127.0.0.1:4002`
- `/rag/*` → `127.0.0.1:4003`

## Configuration

Edit `helm-allinone/values.yaml`:

```yaml
replicaCount: 1

image:
  repository: ghcr.io/yourorg/scl-mgmt
  tag: v0.1.0

env:
  APP_ENV: production
  DEBUG: "false"
  DATABASE_URL: postgresql+asyncpg://scluser:sclpass@postgresql:5432/school_mgmt
  SECRET_KEY: your-production-secret
  RAG_SERVICE_URL: http://127.0.0.1:4003
  MILVUS_HOST: milvus
  MILVUS_PORT: "19530"

resources:
  requests: { cpu: 200m, memory: 512Mi }
  limits:   { cpu: "1",  memory: 1Gi }
```

### Enable Ingress

```yaml
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: school.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: school-tls
      hosts:
        - school.example.com
```

### Enable Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80
```

## Common Operations

### Upgrade

```bash
helm upgrade scl-mgmt ./helm-allinone -n school \
  --set image.tag=v0.2.0
```

### Preview manifests (dry run)

```bash
helm template scl-mgmt ./helm-allinone -n school
```

### Check status

```bash
helm status scl-mgmt -n school
kubectl get pods -n school
```

### View supervisor status inside the pod

```bash
kubectl exec -n school deploy/scl-mgmt-scl-mgmt-allinone -- supervisorctl status
```

### Restart a single process without restarting the pod

```bash
kubectl exec -n school deploy/scl-mgmt-scl-mgmt-allinone -- supervisorctl restart scl-api
```

### Run database migrations

```bash
kubectl exec -n school deploy/scl-mgmt-scl-mgmt-allinone -- \
  sh -c "cd /app/scl-api && alembic upgrade head"
```

### Uninstall

```bash
helm uninstall scl-mgmt -n school
```

## Health Probes

| Probe | Path | Port | Behavior |
|-------|------|------|----------|
| Startup | `GET /health` | 4002 (api) | Up to 50s for initial boot (10 retries × 5s) |
| Liveness | `GET /health` | 4002 (api) | Restart pod if API unresponsive |
| Readiness | `GET /health` | 4002 (api) | Remove from service until ready |

## Infrastructure

See the [Multi-Service Helm guide](helm-multi.md#infrastructure) for PostgreSQL and Milvus installation instructions — they are shared between both Helm approaches.

## Trade-offs vs Multi-Service Helm

| Aspect | All-in-One | Multi-Service |
|--------|-----------|---------------|
| Pod count | 1 | 3+ |
| Independent scaling | No | Yes |
| Resource granularity | Shared | Per-service limits |
| Deployment complexity | Lower | Higher |
| Failure blast radius | Larger | Isolated |
| Best for | Dev/staging, small clusters | Production, HA |
