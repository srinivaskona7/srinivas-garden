#!/bin/bash
#===============================================================================
# Beautiful Garden - MongoDB Restore Script
# Restores the MongoDB database from a backup file in the local backups folder
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

# Default values
MONGODB_HOST="${MONGODB_HOST:-localhost}"
MONGODB_PORT="${MONGODB_PORT:-27017}"
MONGODB_DATABASE="${MONGODB_DATABASE:-beautiful-garden}"
MONGODB_USERNAME="${MONGODB_USERNAME:-}"
MONGODB_PASSWORD="${MONGODB_PASSWORD:-}"
KUBERNETES_MODE="${KUBERNETES_MODE:-false}"
NAMESPACE="${NAMESPACE:-default}"
RELEASE_NAME="${RELEASE_NAME:-beautiful-garden}"
BACKUP_FILE=""
DROP_EXISTING="${DROP_EXISTING:-true}"

# Print banner
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🌿 Beautiful Garden - Database Restore 🌿           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Print usage
usage() {
    echo "Usage: $0 [OPTIONS] <backup-file>"
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
    echo "  --no-drop           Don't drop existing collections before restore"
    echo "  --latest            Use the latest backup (latest.tar.gz symlink)"
    echo "  --list              List available backups"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Restore from specific backup file"
    echo "  $0 ./backups/beautiful-garden-backup-20240101_120000.tar.gz"
    echo ""
    echo "  # Restore latest backup"
    echo "  $0 --latest"
    echo ""
    echo "  # Kubernetes restore"
    echo "  $0 -k -n default --latest"
    exit 1
}

# List available backups
list_backups() {
    echo -e "${BLUE}📂 Available backups in ${BACKUP_DIR}:${NC}"
    echo ""
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR"/*.tar.gz 2>/dev/null)" ]; then
        ls -lth "$BACKUP_DIR"/*.tar.gz 2>/dev/null | while read -r line; do
            filename=$(echo "$line" | awk '{print $NF}')
            size=$(echo "$line" | awk '{print $5}')
            date=$(echo "$line" | awk '{print $6, $7, $8}')
            basename=$(basename "$filename")
            echo -e "  ${GREEN}📦${NC} ${basename} (${size}, ${date})"
        done
    else
        echo -e "  ${YELLOW}No backups found${NC}"
    fi
    exit 0
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
        --no-drop)
            DROP_EXISTING="false"
            shift
            ;;
        --latest)
            BACKUP_FILE="${BACKUP_DIR}/latest.tar.gz"
            shift
            ;;
        --list)
            list_backups
            ;;
        --help)
            usage
            ;;
        -*)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: No backup file specified${NC}"
    echo ""
    usage
fi

# Resolve symlinks
if [ -L "$BACKUP_FILE" ]; then
    BACKUP_FILE=$(readlink -f "$BACKUP_FILE")
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_FILE}${NC}"
    echo ""
    list_backups
    exit 1
fi

echo -e "${BLUE}📦 Backup file: ${BACKUP_FILE}${NC}"
echo -e "${BLUE}🗄️  Target database: ${MONGODB_DATABASE}${NC}"

# Confirm restore
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will restore the database from the backup.${NC}"
if [ "$DROP_EXISTING" = "true" ]; then
    echo -e "${YELLOW}   Existing data in the database will be REPLACED.${NC}"
fi
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

# Create temp directory for extraction
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo ""
echo -e "${BLUE}📂 Extracting backup...${NC}"
tar -xzvf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the backup folder
BACKUP_FOLDER=$(ls -d "$TEMP_DIR"/beautiful-garden-backup-* 2>/dev/null | head -1)
if [ -z "$BACKUP_FOLDER" ]; then
    BACKUP_FOLDER="$TEMP_DIR"
fi

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
    
    # Copy backup to pod
    echo -e "${BLUE}📤 Copying backup to pod...${NC}"
    kubectl cp "$BACKUP_FOLDER" "${NAMESPACE}/${MONGODB_POD}:/tmp/restore-data"
    
    # Build restore options
    RESTORE_OPTIONS="--gzip"
    if [ "$DROP_EXISTING" = "true" ]; then
        RESTORE_OPTIONS="$RESTORE_OPTIONS --drop"
    fi
    
    echo -e "${BLUE}💾 Restoring database...${NC}"
    
    # Restore inside the pod
    kubectl exec -n "${NAMESPACE}" "${MONGODB_POD}" -- mongorestore \
        --username="${MONGODB_USERNAME}" \
        --password="${MONGODB_PASSWORD}" \
        --authenticationDatabase="${MONGODB_DATABASE}" \
        --db="${MONGODB_DATABASE}" \
        $RESTORE_OPTIONS \
        "/tmp/restore-data/${MONGODB_DATABASE}"
    
    # Cleanup inside pod
    kubectl exec -n "${NAMESPACE}" "${MONGODB_POD}" -- rm -rf "/tmp/restore-data"
    
else
    echo -e "${YELLOW}🖥️  Running in local mode${NC}"
    
    # Check if mongorestore is available
    if ! command -v mongorestore &> /dev/null; then
        echo -e "${RED}❌ Error: mongorestore is not installed${NC}"
        echo "Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools"
        exit 1
    fi
    
    # Build connection string
    AUTH_STRING=""
    if [ -n "$MONGODB_USERNAME" ] && [ -n "$MONGODB_PASSWORD" ]; then
        AUTH_STRING="--username=${MONGODB_USERNAME} --password=${MONGODB_PASSWORD} --authenticationDatabase=${MONGODB_DATABASE}"
    fi
    
    # Build restore options
    RESTORE_OPTIONS="--gzip"
    if [ "$DROP_EXISTING" = "true" ]; then
        RESTORE_OPTIONS="$RESTORE_OPTIONS --drop"
    fi
    
    echo -e "${BLUE}💾 Restoring database...${NC}"
    
    # Restore backup
    mongorestore \
        --host="${MONGODB_HOST}" \
        --port="${MONGODB_PORT}" \
        ${AUTH_STRING} \
        --db="${MONGODB_DATABASE}" \
        $RESTORE_OPTIONS \
        "${BACKUP_FOLDER}/${MONGODB_DATABASE}"
fi

echo ""
echo -e "${GREEN}✅ Database restore completed successfully!${NC}"
echo -e "${GREEN}🌿 Beautiful Garden database has been restored.${NC}"
echo ""
echo -e "${BLUE}📊 To verify the restore, you can:${NC}"
echo "   1. Start the application: npm start"
echo "   2. Access the app: http://localhost:3000"
echo "   3. Check that your plants and gardens are restored"
