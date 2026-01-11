# Beautiful Garden 🌿

A beautiful plant and garden management application built with Node.js, Express, MongoDB, and deployed on Kubernetes.

## Features

- 🌱 **Plant Management**: Add, edit, and track your plants
- 💧 **Watering Schedules**: Never forget to water your plants
- 🏡 **Garden Planning**: Organize plants into different gardens
- 📊 **Health Tracking**: Monitor your plants' health status
- 🎨 **Beautiful UI**: Modern, responsive design with animations

## Quick Start

### 🚀 Easiest Way - One Command!

Just run this in the project folder:

```bash
docker-compose up
```

That's it! Open http://localhost:3000 🎉

This will:
- Start MongoDB with sample data (plants & gardens pre-loaded)
- Build and run the application
- Everything works together automatically!

**For development with hot reload:**
```bash
docker-compose -f docker-compose.dev.yml up
```

### Prerequisites

- Node.js 18+
- MongoDB (local or remote)
- Docker (for containerization)
- Kubernetes cluster (for deployment)
- Helm 3+ (for Kubernetes deployment)

### Local Development

1. **Clone and install dependencies**
   ```bash
   cd sri-garden
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Docker

### Build the image
```bash
docker build -t sriniv7654/garden:kubectl .
```

### Run locally with Docker
```bash
# Start MongoDB
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Run the application
docker run -d \
  --name beautiful-garden \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/beautiful-garden \
  sriniv7654/garden:kubectl
```

### Push to Docker Hub
```bash
docker login
docker push sriniv7654/garden:kubectl
```

### Supported Images

| Image Tag | Features & Use Case |
|-----------|---------------------|
| `sriniv7654/garden:kubectl` | **Admin / Debug Mode**<br>• Pre-installed `kubectl` and `helm`<br>• Full Terminal access via Web UI<br>• Useful for cluster management directly from the app |
| `sriniv7654/garden:latest` | **Production Ready**<br>• Standard application release<br>• Optimized for performance<br>• Includes all core features (Plants, Gardens, Auth) |
| `sriniv7654/garden:1.0.x` | **Stable Version**<br>• Specific version snapshots<br>• Use for reproducible deployments |

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud provider)
- Helm 3+
- kubectl configured

### Deploy with Helm

1. **Add the Bitnami repository** (for MongoDB chart)
   ```bash
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm repo update
   ```

2. **Update Helm dependencies**
   ```bash
   cd helm/beautiful-garden
   helm dependency update
   ```

3. **Deploy the application**
   ```bash
   helm install beautiful-garden ./helm/beautiful-garden
   ```

4. **Check deployment status**
   ```bash
   kubectl get pods,svc,pvc
   ```

5. **Access the application**
   ```bash
   # Get the NodePort
   kubectl get svc beautiful-garden -o jsonpath='{.spec.ports[0].nodePort}'
   
   # For minikube
   minikube service beautiful-garden --url
   ```

### Configuration

Edit `helm/beautiful-garden/values.yaml` to customize:

- Image repository and tag
- Resource limits
- MongoDB credentials
- Persistence settings
- Ingress configuration

### Upgrade deployment
```bash
helm upgrade beautiful-garden ./helm/beautiful-garden
```

### Uninstall
```bash
helm uninstall beautiful-garden
```

## Backup & Restore

### Create a backup

```bash
# Local backup
./scripts/backup.sh

# Kubernetes backup
./scripts/backup.sh -k -n default -r beautiful-garden
```

Backups are stored in the `./backups` directory with timestamps.

### Restore from backup

```bash
# List available backups
./scripts/restore.sh --list

# Restore latest backup
./scripts/restore.sh --latest

# Restore specific backup
./scripts/restore.sh ./backups/beautiful-garden-backup-20240101_120000.tar.gz

# Kubernetes restore
./scripts/restore.sh -k -n default --latest
```

## API Endpoints

### Plants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plants` | Get all plants |
| GET | `/api/plants/:id` | Get plant by ID |
| POST | `/api/plants` | Create new plant |
| PUT | `/api/plants/:id` | Update plant |
| PATCH | `/api/plants/:id/water` | Water a plant |
| DELETE | `/api/plants/:id` | Delete plant |
| GET | `/api/plants/status/needs-water` | Get plants needing water |

### Gardens

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gardens` | Get all gardens |
| GET | `/api/gardens/:id` | Get garden by ID |
| POST | `/api/gardens` | Create new garden |
| PUT | `/api/gardens/:id` | Update garden |
| POST | `/api/gardens/:id/plants/:plantId` | Add plant to garden |
| DELETE | `/api/gardens/:id/plants/:plantId` | Remove plant from garden |
| DELETE | `/api/gardens/:id` | Delete garden |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health status |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

## Project Structure

```
sri-garden/
├── config/             # Configuration files
├── models/             # MongoDB models
├── routes/             # API routes
├── views/              # EJS templates
├── public/             # Static assets
│   ├── css/
│   └── js/
├── helm/               # Kubernetes Helm charts
│   └── beautiful-garden/
├── scripts/            # Backup & restore scripts
├── backups/            # Local backup storage
├── Dockerfile
├── package.json
└── server.js
```

## License

MIT License - feel free to use this for your own garden! 🌻
