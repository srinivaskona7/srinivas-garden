#!/bin/bash
#===============================================================================
# Beautiful Garden - MongoDB Backup Script
# Creates a backup of the MongoDB database and stores it in the local backups folder
#===============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="beautiful-garden-backup-${TIMESTAMP}"

# Default values
MONGODB_HOST="${MONGODB_HOST:-localhost}"
MONGODB_PORT="${MONGODB_PORT:-27017}"
MONGODB_DATABASE="${MONGODB_DATABASE:-beautiful-garden}"
MONGODB_USERNAME="${MONGODB_USERNAME:-}"
MONGODB_PASSWORD="${MONGODB_PASSWORD:-}"
KUBERNETES_MODE="${KUBERNETES_MODE:-false}"
NAMESPACE="${NAMESPACE:-default}"
RELEASE_NAME="${RELEASE_NAME:-beautiful-garden}"

# Print banner
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🌿 Beautiful Garden - Database Backup 🌿           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Print usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host          MongoDB host (default: localhost)"
    echo "  -p, --port          MongoDB port (default: 27017)"
    echo "  -d, --database      Database name (default: beautiful-garden)"
    echo "  -u, --username      MongoDB username"
    echo "  -P, --password      MongoDB password"
    echo "  -k, --kubernetes    Enable Kubernetes mode"
    echo "  -n, --namespace     Kubernetes namespace (default: default)"
    echo "  -r, --release       Helm release name (default: beautiful-garden)"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Local backup"
    echo "  $0 -h localhost -p 27017 -d beautiful-garden"
    echo ""
    echo "  # Kubernetes backup"
    echo "  $0 -k -n default -r beautiful-garden"
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            MONGODB_HOST="$2"
            shift 2
            ;;
        -p|--port)
            MONGODB_PORT="$2"
            shift 2
            ;;
        -d|--database)
            MONGODB_DATABASE="$2"
            shift 2
            ;;
        -u|--username)
            MONGODB_USERNAME="$2"
            shift 2
            ;;
        -P|--password)
            MONGODB_PASSWORD="$2"
            shift 2
            ;;
        -k|--kubernetes)
            KUBERNETES_MODE="true"
            shift
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -r|--release)
            RELEASE_NAME="$2"
            shift 2
            ;;
        --help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${BLUE}📅 Backup timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}📁 Backup directory: ${BACKUP_DIR}${NC}"

# Kubernetes mode
if [ "$KUBERNETES_MODE" = "true" ]; then
    echo -e "${YELLOW}☸️  Running in Kubernetes mode${NC}"
    
    # Get MongoDB pod name
    MONGODB_POD=$(kubectl get pods -n "${NAMESPACE}" -l "app.kubernetes.io/name=mongodb,app.kubernetes.io/instance=${RELEASE_NAME}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$MONGODB_POD" ]; then
        echo -e "${RED}❌ Error: Could not find MongoDB pod in namespace ${NAMESPACE}${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔍 Found MongoDB pod: ${MONGODB_POD}${NC}"
    
    # Get MongoDB credentials from secret
    if [ -z "$MONGODB_USERNAME" ]; then
        MONGODB_USERNAME=$(kubectl get secret -n "${NAMESPACE}" "${RELEASE_NAME}-mongodb" -o jsonpath='{.data.mongodb-username}' 2>/dev/null | base64 -d)
        [ -z "$MONGODB_USERNAME" ] && MONGODB_USERNAME="garden"
    fi
    
    if [ -z "$MONGODB_PASSWORD" ]; then
        MONGODB_PASSWORD=$(kubectl get secret -n "${NAMESPACE}" "${RELEASE_NAME}-mongodb" -o jsonpath='{.data.mongodb-passwords}' 2>/dev/null | base64 -d | cut -d',' -f1)
        [ -z "$MONGODB_PASSWORD" ] && MONGODB_PASSWORD=$(kubectl get secret -n "${NAMESPACE}" "${RELEASE_NAME}-mongodb" -o jsonpath='{.data.mongodb-root-password}' 2>/dev/null | base64 -d)
    fi
    
    echo -e "${BLUE}💾 Creating backup inside pod...${NC}"
    
    # Create backup inside the pod
    kubectl exec -n "${NAMESPACE}" "${MONGODB_POD}" -- mongodump \
        --username="${MONGODB_USERNAME}" \
        --password="${MONGODB_PASSWORD}" \
        --authenticationDatabase="${MONGODB_DATABASE}" \
        --db="${MONGODB_DATABASE}" \
        --out="/tmp/${BACKUP_NAME}" \
        --gzip
    
    # Create archive inside pod
    kubectl exec -n "${NAMESPACE}" "${MONGODB_POD}" -- tar -czvf "/tmp/${BACKUP_NAME}.tar.gz" -C "/tmp" "${BACKUP_NAME}"
    
    # Copy backup from pod to local
    echo -e "${BLUE}📥 Copying backup to local...${NC}"
    kubectl cp "${NAMESPACE}/${MONGODB_POD}:/tmp/${BACKUP_NAME}.tar.gz" "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    
    # Cleanup inside pod
    kubectl exec -n "${NAMESPACE}" "${MONGODB_POD}" -- rm -rf "/tmp/${BACKUP_NAME}" "/tmp/${BACKUP_NAME}.tar.gz"
    
else
    echo -e "${YELLOW}🖥️  Running in local mode${NC}"
    
    # Check if mongodump is available
    if ! command -v mongodump &> /dev/null; then
        echo -e "${RED}❌ Error: mongodump is not installed${NC}"
        echo "Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools"
        exit 1
    fi
    
    # Build connection string
    AUTH_STRING=""
    if [ -n "$MONGODB_USERNAME" ] && [ -n "$MONGODB_PASSWORD" ]; then
        AUTH_STRING="--username=${MONGODB_USERNAME} --password=${MONGODB_PASSWORD} --authenticationDatabase=${MONGODB_DATABASE}"
    fi
    
    echo -e "${BLUE}💾 Creating backup...${NC}"
    
    # Create backup
    mongodump \
        --host="${MONGODB_HOST}" \
        --port="${MONGODB_PORT}" \
        ${AUTH_STRING} \
        --db="${MONGODB_DATABASE}" \
        --out="${BACKUP_DIR}/${BACKUP_NAME}" \
        --gzip
    
    # Create compressed archive
    echo -e "${BLUE}📦 Compressing backup...${NC}"
    cd "${BACKUP_DIR}"
    tar -czvf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
    rm -rf "${BACKUP_NAME}"
fi

# Verify backup
if [ -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "${GREEN}📁 Backup file: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz${NC}"
    echo -e "${GREEN}📊 Backup size: ${BACKUP_SIZE}${NC}"
    
    # Create a symlink to latest backup
    ln -sf "${BACKUP_NAME}.tar.gz" "${BACKUP_DIR}/latest.tar.gz"
    echo -e "${GREEN}🔗 Latest backup symlink updated${NC}"
    
    # Cleanup old backups (keep last 10)
    echo ""
    echo -e "${BLUE}🧹 Cleaning up old backups (keeping last 10)...${NC}"
    cd "${BACKUP_DIR}"
    ls -t beautiful-garden-backup-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    
    echo ""
    echo -e "${GREEN}🎉 Backup process completed!${NC}"
else
    echo -e "${RED}❌ Error: Backup file not found${NC}"
    exit 1
fi
