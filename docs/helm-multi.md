# Helm — Multi-Service Deployment

Deploys the School Management System on Kubernetes with **separate pods** for each service using an umbrella Helm chart.

## Chart Structure

```
helm/
├── Chart.yaml                    # Umbrella chart (depends on 3 sub-charts)
├── values.yaml                   # Global overrides
└── charts/
    ├── scl-api/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/
    │       ├── _helpers.tpl
    │       ├── deployment.yaml
    │       ├── service.yaml
    │       └── hpa.yaml
    ├── scl-frontend/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/
    │       ├── _helpers.tpl
    │       ├── deployment.yaml
    │       ├── service.yaml
    │       ├── ingress.yaml
    │       └── hpa.yaml
    └── scl-rag/
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
            ├── _helpers.tpl
            ├── deployment.yaml
            ├── service.yaml
            └── hpa.yaml
```

## Prerequisites

- Kubernetes 1.25+
- Helm 3.10+
- Container images pushed to an accessible registry
- PostgreSQL and Milvus available in the cluster (see [Infrastructure](#infrastructure) below)

## Quick Start

```bash
# 1. Build and push images to your registry
REGISTRY=ghcr.io/yourorg
docker build -t $REGISTRY/scl-api:v0.1.0 ./scl-api
docker build -t $REGISTRY/scl-frontend:v0.1.0 ./scl-frontend
docker build -t $REGISTRY/scl-rag:v0.1.0 ./scl-rag
docker push $REGISTRY/scl-api:v0.1.0
docker push $REGISTRY/scl-frontend:v0.1.0
docker push $REGISTRY/scl-rag:v0.1.0

# 2. Update dependency charts
cd helm
helm dependency update .

# 3. Install (customize values as needed)
helm install scl-mgmt . \
  -n school --create-namespace \
  --set scl-api.image.repository=$REGISTRY/scl-api \
  --set scl-api.image.tag=v0.1.0 \
  --set scl-frontend.image.repository=$REGISTRY/scl-frontend \
  --set scl-frontend.image.tag=v0.1.0 \
  --set scl-rag.image.repository=$REGISTRY/scl-rag \
  --set scl-rag.image.tag=v0.1.0
```

## What Gets Deployed

| Resource | Service | Ports |
|----------|---------|-------|
| Deployment + Service | `scl-api` | 4002 (ClusterIP) |
| Deployment + Service | `scl-frontend` | 80 (ClusterIP) |
| Deployment + Service | `scl-rag` | 4003 (ClusterIP) |
| Ingress (optional) | `scl-frontend` | HTTP/HTTPS → port 80 |
| HPA (optional) | All three | CPU-based autoscaling |

## Configuration

Edit `helm/values.yaml` for global overrides — each key maps to a sub-chart:

### SCL API

```yaml
scl-api:
  replicaCount: 2
  image:
    repository: ghcr.io/yourorg/scl-api
    tag: v0.1.0
  env:
    DATABASE_URL: postgresql+asyncpg://user:pass@postgresql:5432/school_mgmt
    SECRET_KEY: your-production-secret
    RAG_SERVICE_URL: http://scl-rag:4003
  resources:
    requests: { cpu: 100m, memory: 256Mi }
    limits:   { cpu: 500m, memory: 512Mi }
```

### SCL Frontend

```yaml
scl-frontend:
  replicaCount: 2
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

### SCL RAG

```yaml
scl-rag:
  replicaCount: 1
  env:
    MILVUS_HOST: milvus
    MILVUS_PORT: "19530"
  resources:
    requests: { cpu: 200m, memory: 512Mi }
    limits:   { cpu: "1",  memory: 1Gi }
```

## Common Operations

### Upgrade after code changes

```bash
helm upgrade scl-mgmt ./helm -n school \
  --set scl-api.image.tag=v0.2.0
```

### Dry run to preview manifests

```bash
helm template scl-mgmt ./helm -n school
```

### Check status

```bash
helm status scl-mgmt -n school
kubectl get pods -n school
```

### Uninstall

```bash
helm uninstall scl-mgmt -n school
```

### Enable autoscaling

```yaml
scl-api:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
```

## Infrastructure

The Helm chart assumes PostgreSQL and Milvus are already available. Common approaches:

### PostgreSQL (Bitnami Helm Chart)

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgresql bitnami/postgresql -n school \
  --set auth.username=scluser \
  --set auth.password=sclpass \
  --set auth.database=school_mgmt
```

### Milvus (Official Helm Chart)

```bash
helm repo add milvus https://zilliztech.github.io/milvus-helm
helm install milvus milvus/milvus -n school \
  --set cluster.enabled=false \
  --set standalone.enabled=true
```

## Health Probes

All deployments include:

| Probe | Path | Port | Purpose |
|-------|------|------|---------|
| Liveness | `/health` | service port | Restart unhealthy pods |
| Readiness | `/health` | service port | Remove from service endpoints until ready |

The frontend uses `/` on port 80 since it serves static HTML.
