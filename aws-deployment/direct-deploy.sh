#!/bin/bash

################################################################################
# Direct Deployment Script for Monity Backend to EC2
#
# This script deploys the backend WITHOUT using ECR by:
# - Copying source code to EC2
# - Building Docker image directly on EC2
# - Running container with environment variables
#
# Usage: ./direct-deploy.sh [environment]
#   environment: production or staging (default: production)
################################################################################

set -e  # Exit on error

# Configuration
ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"
CONTAINER_NAME="monity-mobile-backend"
APP_PORT=3001
REMOTE_BUILD_DIR="/tmp/monity-backend-build"
REMOTE_APP_DIR="/opt/monity"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_success() { echo -e "${GREEN}✓ $1${NC}"; }
echo_error() { echo -e "${RED}✗ $1${NC}"; exit 1; }
echo_info() { echo -e "${BLUE}→ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo_error "$ENV_FILE not found! Please create it first."
fi

# Load environment variables
echo_info "Loading environment variables from $ENV_FILE..."
export $(cat $ENV_FILE | grep -v '^#' | grep -v '^$' | xargs)
echo_success "Environment variables loaded"

# Verify required variables
REQUIRED_VARS=(
    "EC2_HOST"
    "EC2_USER"
    "EC2_SSH_KEY_PATH"
    "SUPABASE_URL"
    "SUPABASE_KEY"
    "ENCRYPTION_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo_error "Required variable $var is not set in $ENV_FILE"
    fi
done

echo_success "All required variables are set"

# Verify SSH key exists
if [ ! -f "$EC2_SSH_KEY_PATH" ]; then
    echo_error "SSH key file not found at: $EC2_SSH_KEY_PATH"
fi

# Fix SSH key permissions
chmod 400 "$EC2_SSH_KEY_PATH" 2>/dev/null || true

# Verify backend directory exists
BACKEND_DIR="../backend"
if [ ! -d "$BACKEND_DIR" ]; then
    echo_error "Backend directory not found at: $BACKEND_DIR"
fi

echo_info "Backend directory: $(cd $BACKEND_DIR && pwd)"

# Create tarball of backend code
echo_info "Creating tarball of backend code..."
cd ../backend
tar -czf /tmp/monity-backend.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.log' \
    .
cd ../aws-deployment
echo_success "Tarball created"

# Copy tarball to EC2
echo_info "Copying backend code to EC2..."
scp -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no \
    /tmp/monity-backend.tar.gz \
    ${EC2_USER}@${EC2_HOST}:/tmp/
echo_success "Backend code copied"

# Prepare environment variables for remote execution
ENV_VARS="NODE_ENV='${NODE_ENV:-production}'
PORT='${PORT:-3001}'
HOST='${HOST:-0.0.0.0}'
SUPABASE_URL='$SUPABASE_URL'
SUPABASE_ANON_KEY='$SUPABASE_ANON_KEY'
SUPABASE_KEY='$SUPABASE_KEY'
ENCRYPTION_KEY='$ENCRYPTION_KEY'
HASH_SALT='$HASH_SALT'
CLIENT_URL='$CLIENT_URL'
FRONTEND_URL='${FRONTEND_URL:-monity://auth/callback}'
GEMINI_API_KEY='$GEMINI_API_KEY'
STRIPE_SECRET_KEY='$STRIPE_SECRET_KEY'
STRIPE_WEBHOOK_SECRET='$STRIPE_WEBHOOK_SECRET'
STRIPE_PRICE_PREMIUM_MONTHLY='$STRIPE_PRICE_PREMIUM_MONTHLY'
GOOGLE_PLAY_PACKAGE_NAME='$GOOGLE_PLAY_PACKAGE_NAME'
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'
APP_STORE_BUNDLE_ID='$APP_STORE_BUNDLE_ID'
APP_STORE_SHARED_SECRET='$APP_STORE_SHARED_SECRET'"

# Create .env file content
cat > /tmp/monity.env << EOF
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-3001}
HOST=${HOST:-0.0.0.0}
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_KEY=$SUPABASE_KEY
ENCRYPTION_KEY=$ENCRYPTION_KEY
HASH_SALT=$HASH_SALT
CLIENT_URL=$CLIENT_URL
FRONTEND_URL=${FRONTEND_URL:-monity://auth/callback}
GEMINI_API_KEY=$GEMINI_API_KEY
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PREMIUM_MONTHLY=$STRIPE_PRICE_PREMIUM_MONTHLY
GOOGLE_PLAY_PACKAGE_NAME=$GOOGLE_PLAY_PACKAGE_NAME
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
APP_STORE_BUNDLE_ID=$APP_STORE_BUNDLE_ID
APP_STORE_SHARED_SECRET=$APP_STORE_SHARED_SECRET
EOF

# Copy .env file to EC2
echo_info "Copying environment variables to EC2..."
scp -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no \
    /tmp/monity.env \
    ${EC2_USER}@${EC2_HOST}:/tmp/
echo_success "Environment variables copied"

# Create deployment script for EC2
cat > /tmp/deploy_on_ec2.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

CONTAINER_NAME="monity-mobile-backend"
APP_PORT=3001
BUILD_DIR="/tmp/monity-backend-build"
APP_DIR="/opt/monity"

echo "=========================================="
echo "DEPLOYING MONITY BACKEND ON EC2"
echo "=========================================="

# Create build directory
echo "→ Creating build directory..."
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
cd $BUILD_DIR

# Extract tarball
echo "→ Extracting backend code..."
tar -xzf /tmp/monity-backend.tar.gz

# Verify Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "✗ Dockerfile not found!"
    exit 1
fi

# Stop and remove old container
echo "→ Stopping old container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Remove old images
echo "→ Cleaning up old images..."
docker images | grep monity-backend | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# Build Docker image
echo "→ Building Docker image..."
docker build -t monity-backend:latest .

# Create app directory with proper permissions
echo "→ Creating app directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
cp /tmp/monity.env $APP_DIR/.env
chmod 644 $APP_DIR/.env

# Run container
echo "→ Starting container..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $APP_PORT:$APP_PORT \
  --env-file $APP_DIR/.env \
  monity-backend:latest

# Wait for container to start
echo "→ Waiting for container to start..."
sleep 10

# Check container status
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ Container is running!"
    docker ps --filter "name=$CONTAINER_NAME"
    echo ""
    echo "→ Container logs (last 30 lines):"
    docker logs $CONTAINER_NAME --tail 30
else
    echo "❌ Container failed to start!"
    echo "→ Container logs:"
    docker logs $CONTAINER_NAME --tail 100
    exit 1
fi

# Test local connectivity
echo ""
echo "→ Testing local connectivity..."
sleep 5
if curl -f http://localhost:$APP_PORT/api/v1/ > /dev/null 2>&1; then
    echo "✅ API is responding locally!"
else
    echo "⚠ API not responding yet (may need more time to start)"
fi

# Cleanup
echo "→ Cleaning up build files..."
rm -rf $BUILD_DIR
rm -f /tmp/monity-backend.tar.gz
rm -f /tmp/monity.env

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
DEPLOY_SCRIPT

# Copy deployment script to EC2
echo_info "Copying deployment script to EC2..."
scp -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no \
    /tmp/deploy_on_ec2.sh \
    ${EC2_USER}@${EC2_HOST}:/tmp/
echo_success "Deployment script copied"

# Execute deployment on EC2
echo_info "Executing deployment on EC2..."
echo_info "This may take 5-10 minutes..."
ssh -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no \
    ${EC2_USER}@${EC2_HOST} \
    "bash /tmp/deploy_on_ec2.sh"

# Cleanup local files
rm -f /tmp/monity-backend.tar.gz
rm -f /tmp/monity.env
rm -f /tmp/deploy_on_ec2.sh

# Health check
echo ""
echo_info "Performing health check..."
sleep 10

API_URL=${API_URL:-http://${EC2_HOST}:${APP_PORT}}
if curl -f "$API_URL/api/v1/" > /dev/null 2>&1; then
    echo_success "Health check passed!"
    echo ""
    echo_success "================================================"
    echo_success "DEPLOYMENT COMPLETE!"
    echo_success "================================================"
    echo ""
    echo_info "API URL: $API_URL/api/v1/"
    echo_info "Environment: $ENVIRONMENT"
    echo ""
    echo_info "Your API should now be accessible at:"
    echo_info "  - http://${EC2_HOST}:${APP_PORT}/api/v1/"
    if [ ! -z "$API_URL" ] && [ "$API_URL" != "http://${EC2_HOST}:${APP_PORT}" ]; then
        echo_info "  - ${API_URL}/api/v1/"
    fi
    echo ""
else
    echo_warning "Health check failed or still starting up."
    echo_info "Check logs with:"
    echo "  ssh -i $EC2_SSH_KEY_PATH ${EC2_USER}@${EC2_HOST} 'docker logs $CONTAINER_NAME'"
    echo ""
    echo_info "The application may need a few more minutes to fully start."
fi

