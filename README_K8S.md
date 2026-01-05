# Beautiful Garden - Kubernetes Deployment Guide

This document details the changes, configuration, and deployment procedures for the **Beautiful Garden** application on SAP Kyma Kubernetes cluster.

## Table of Contents
- [Overview of Changes](#overview-of-changes)
- [Infrastructure Architecture](#infrastructure-architecture)
- [Files Configuration](#files-configuration)
- [Key Commands](#key-commands)
- [SSL Certificate (Manual Setup)](#ssl-certificate-manual-setup)
- [Troubleshooting](#troubleshooting)

### Overview of Changes
We transformed the application from a local Docker setup to a production-ready Kubernetes deployment with the following key features:
1.  **In-Memory Mode**: Switched from MongoDB to In-Memory DB with JSON file persistence to resolve Docker image compatibility issues.
2.  **Persistence**: Configured Persistent Volumes (PVC) for `/app/data` (JSON DB) and `/app/public/uploads` (Media) to ensure data survives restarts.
3.  **Custom SSL**: Implemented manual Let's Encrypt SSL for `garden.srinivaskona.life` using a custom Istio Gateway.
4.  **Resource Optimization**: Reduced CPU/Memory limits to minimal functioning levels.

### Infrastructure Architecture

#### Storage
- **Protocol**: EBS CSI (AWS)
- **Claim**: `beautiful-garden-pvc` (10Gi) -> Shared for Data and Uploads
- **Mounts**:
    - `/app/data`: Stores `plants.json`
    - `/app/public/uploads`: Stores user uploaded images

#### Networking
- **Ingress**: Istio Ingress Gateway
- **Gateway Resource**: Custom `Gateway` in `garden` namespace matching `garden.srinivaskona.life`.
- **Termination**: SSL terminated at Gateway using `beautiful-garden-tls` secret.

### Files Configuration

| File Path | Description |
|-----------|-------------|
| `Dockerfile` | Optimized multi-stage build using `node:18-alpine`. Modified to create `/app/data` with correct permissions. |
| `helm/beautiful-garden/values.yaml` | Main configuration: Image tag (`v1.0.2`), Resource limits, Persistence (`enabled: true`), APIRule (`gateway: garden/beautiful-garden-gateway`). |
| `helm/.../templates/gateway.yaml` | **[NEW]** Custom Istio Gateway resource to handle manual SSL credentials (`beautiful-garden-tls`). |
| `helm/.../templates/deployment.yaml` | Updated `volumeMounts` logic to robustness handle persistence and backups simultaneously. |
| `helm/.../templates/pvc.yaml` | Defines the `PersistentVolumeClaim` for application data. |

### Key Commands

#### 1. Build and Push Image
```bash
docker build -t sriniv7654/garden:v1.0.2 .
docker push sriniv7654/garden:v1.0.2
```

#### 2. Deploy Application
```bash
helm upgrade --install beautiful-garden ./helm/beautiful-garden \
  --kubeconfig kubeconfig-trail.yaml \
  --create-namespace \
  --namespace garden
```

#### 3. Verify Deployment
```bash
# Check Pods
kubectl get pods -n garden --kubeconfig kubeconfig-trail.yaml

# Check Gateway
kubectl get gateway -n garden --kubeconfig kubeconfig-trail.yaml

# Check HTTPS Access
curl -I https://garden.srinivaskona.life
```

### SSL Certificate (Automated)
We use **Cert-Manager** with Let's Encrypt (HTTP-01 Challenge) for fully automated renewal. Can be verified with:
```bash
kubectl get certificate -n garden
```

**Architecture:**
- **ClusterIssuer**: `letsencrypt-prod` (HTTP-01 Solver via Istio)
- **Certificate**: `beautiful-garden-letsencrypt` (Managed by Helm)
- **Secret**: `beautiful-garden-tls` (Auto-updated)

### Monitoring (Skooner Dashboard)
A lightweight dashboard is deployed in the `garden` namespace.

**Access Instructions:**
1.  **Open URL**: [https://skooner.c-47380fd.kyma.ondemand.com](https://skooner.c-47380fd.kyma.ondemand.com)
2.  **Login**: Use the specific ServiceAccount token.
    Generate a new token with:
    ```bash
    kubectl create token skooner-sa -n garden --duration=24h --kubeconfig kubeconfig-trail.yaml
    ```

*This dashboard shows real-time CPU/Memory usage and cluster health.*


### Troubleshooting

#### Connection Reset (SSL Error)
If `curl` returns `Recv failure: Connection reset by peer`:
1.  Check if the Secret exists in `istio-system`: `kubectl get secret beautiful-garden-tls -n istio-system`
2.  Check if Gateway references the secret: `kubectl describe gateway -n garden`
3.  Ensure Gateway selector matches the ingress: `istio: ingressgateway`

#### Pod Not Ready (503)
If `/health/ready` returns 503:
- The app might be checking for MongoDB.
- **Fix**: We updated `readinessProbe` path to `/health/live` in `values.yaml` to bypass DB check for In-Memory mode.

### Resource Optimization
The application is configured to run on minimal resources:
- **CPU Request**: `10m` (0.01 cores)
- **Memory Limit**: `192Mi`

This ensures the application uses negligible cluster capacity while maintaining performance.

## 🚀 Deployment & Release Strategy

### One-Command Release (Recommended)
To build, push, and deploy a specific version:
```bash
# Deploys version from package.json (currently v1.0.3)
npm run release

# Deploy a specific custom version
npm run release -- v1.0.4
```

### Individual Commands
For granular control:
```bash
# Build (Important: Force AMD64 for cluster compatibility)
docker build --platform linux/amd64 -t sriniv7654/garden:v1.0.3 .

# Push
docker push sriniv7654/garden:v1.0.3

# Deploy (Helm)
helm upgrade --install beautiful-garden ./helm/beautiful-garden \
  --namespace garden \
  --set image.tag=v1.0.3 \
  --kubeconfig kubeconfig-trail.yaml
```

### ⏪ Rollback Strategy
If a new deployment fails or has bugs, you can instantly roll back to the previous stable version.

1.  **Check History**:
    ```bash
    helm history beautiful-garden -n garden --kubeconfig kubeconfig-trail.yaml
    ```
2.  **Rollback**:
    ```bash
    # Rollback to the immediate previous version
    helm rollback beautiful-garden -n garden --kubeconfig kubeconfig-trail.yaml

    # Rollback to specific revision (e.g., revision 10)
    helm rollback beautiful-garden 10 -n garden --kubeconfig kubeconfig-trail.yaml
    ```

