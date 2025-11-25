#!/bin/bash

# Diagnose Monity Backend Status on EC2

set -e

# Configuration
ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}→ $1${NC}"; }
echo_success() { echo -e "${GREEN}✓ $1${NC}"; }
echo_error() { echo -e "${RED}✗ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo_error "$ENV_FILE not found! Please ensure you are in the 'Monity-Mobile/aws-deployment' directory and the file exists."
    echo_info "Current directory: $(pwd)"
    exit 1
fi

# Load environment variables
echo_info "Loading environment variables from $ENV_FILE..."
export $(cat $ENV_FILE | grep -v '^#' | xargs)

if [ -z "$EC2_HOST" ] || [ -z "$EC2_USER" ] || [ -z "$EC2_SSH_KEY_PATH" ]; then
    echo_error "Missing required EC2 configuration in $ENV_FILE"
    echo "EC2_HOST: $EC2_HOST"
    echo "EC2_USER: $EC2_USER"
    echo "EC2_SSH_KEY_PATH: $EC2_SSH_KEY_PATH"
    exit 1
fi

# Verify SSH key file exists
if [ ! -f "$EC2_SSH_KEY_PATH" ]; then
    echo_error "SSH key file not found at path: '$EC2_SSH_KEY_PATH'"
    echo_info "Please update EC2_SSH_KEY_PATH in $ENV_FILE to point to your valid .pem file."
    exit 1
fi

# Fix permissions if needed (must be 400 or 600)
chmod 400 "$EC2_SSH_KEY_PATH" 2>/dev/null || true

CONTAINER_NAME="monity-mobile-backend"

echo_info "Connecting to EC2 ($EC2_HOST)..."

# Create a temporary script to run on the remote server
cat > /tmp/remote_diagnose.sh << 'EOF'
#!/bin/bash

CONTAINER_NAME="monity-mobile-backend"
APP_PORT=3001

echo "========================================================"
echo "MONITY BACKEND DIAGNOSTICS"
echo "========================================================"
echo "Time: $(date)"
echo "Host: $(hostname)"
echo ""

echo "--- 1. DOCKER STATUS ---"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is NOT INSTALLED."
else
    echo "✅ Docker is installed: $(docker --version)"
    
    if docker ps | grep -q $CONTAINER_NAME; then
        echo "✅ Container '$CONTAINER_NAME' is RUNNING."
        docker ps --filter "name=$CONTAINER_NAME" --format "ID: {{.ID}}\nImage: {{.Image}}\nStatus: {{.Status}}\nPorts: {{.Ports}}"
    else
        echo "❌ Container '$CONTAINER_NAME' is NOT RUNNING."
        echo "Status of all containers:"
        docker ps -a
    fi
fi
echo ""

echo "--- 2. APPLICATION LOGS (Last 50 lines) ---"
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "Fetching logs..."
    docker logs $CONTAINER_NAME --tail 50 2>&1
else
    echo "Container not found, cannot fetch logs."
fi
echo ""

echo "--- 3. NETWORK STATUS ---"
if command -v lsof &> /dev/null; then
    if sudo lsof -i :$APP_PORT; then
        echo "✅ Port $APP_PORT is in use."
    else
        echo "❌ Port $APP_PORT is NOT in use."
    fi
else
    echo "⚠ lsof not found, checking with netstat..."
    if netstat -tuln | grep ":$APP_PORT "; then
        echo "✅ Port $APP_PORT is listening."
    else
        echo "❌ Port $APP_PORT is NOT listening."
    fi
fi
echo ""

echo "--- 4. LOCAL CONNECTIVITY TEST ---"
echo "Attempting curl to http://localhost:$APP_PORT/api/v1/ ..."
if curl -v --max-time 5 http://localhost:$APP_PORT/api/v1/ 2>&1; then
    echo ""
    echo "✅ Local connectivity test PASSED."
else
    RET=$?
    echo ""
    echo "❌ Local connectivity test FAILED (Exit code: $RET)."
fi

echo ""
echo "--- 5. SYSTEM RESOURCES ---"
echo "Memory:"
free -h
echo ""
echo "Disk Space:"
df -h /
echo ""
EOF

# Copy script to EC2
echo_info "Copying diagnostic script to EC2..."
if ! scp -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no /tmp/remote_diagnose.sh ${EC2_USER}@${EC2_HOST}:/tmp/remote_diagnose.sh; then
    echo_error "Failed to copy script to EC2. Please check your SSH key and connection."
    rm /tmp/remote_diagnose.sh
    exit 1
fi

# Execute script on EC2
echo_info "Running diagnostics on EC2..."
ssh -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "bash /tmp/remote_diagnose.sh"

# Cleanup
rm /tmp/remote_diagnose.sh
