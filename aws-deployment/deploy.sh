#!/bin/bash

################################################################################
# Manual Deployment Script for Monity Backend to EC2
#
# This script deploys your backend to EC2 using Docker and ECR
#
# Prerequisites:
# - AWS CLI configured with credentials
# - SSH access to EC2 instance
# - ECR repository created
# - .env file with production variables
#
# Usage: ./deploy.sh [environment]
#   environment: production or staging (default: production)
################################################################################

set -e  # Exit on error

# Configuration
ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY=${ECR_REPOSITORY:-monity-mobile-backend}
CONTAINER_NAME=monity-mobile-backend
APP_PORT=3001

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
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    echo_error ".env.${ENVIRONMENT} file not found! Please create it first."
fi

# Load environment variables
echo_info "Loading environment variables from .env.${ENVIRONMENT}..."
export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
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
        echo_error "Required variable $var is not set in .env.${ENVIRONMENT}"
    fi
done

echo_success "All required variables are set"

# Get AWS account ID
echo_info "Getting AWS account information..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
FULL_IMAGE_NAME="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

echo_success "AWS Account ID: $AWS_ACCOUNT_ID"
echo_info "ECR Registry: $ECR_REGISTRY"
echo_info "Image: $FULL_IMAGE_NAME"

# Login to ECR
echo_info "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
echo_success "Logged in to ECR"

# Build Docker image
echo_info "Building Docker image..."
cd ../backend
docker build -t $FULL_IMAGE_NAME .
docker tag $FULL_IMAGE_NAME ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
cd ../aws-deployment
echo_success "Docker image built"

# Push to ECR
echo_info "Pushing image to ECR..."
docker push $FULL_IMAGE_NAME
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
echo_success "Image pushed to ECR"

# Prepare deployment script
echo_info "Preparing deployment script..."
cat > /tmp/deploy_remote.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull latest image
echo "Pulling Docker image..."
docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

# Stop and remove old container
echo "Stopping old container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Run new container
echo "Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $APP_PORT:$APP_PORT \
  -e NODE_ENV="$NODE_ENV" \
  -e PORT="$PORT" \
  -e HOST="$HOST" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e SUPABASE_KEY="$SUPABASE_KEY" \
  -e ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  -e HASH_SALT="$HASH_SALT" \
  -e CLIENT_URL="$CLIENT_URL" \
  -e FRONTEND_URL="$FRONTEND_URL" \
  -e GEMINI_API_KEY="$GEMINI_API_KEY" \
  -e STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  -e STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  -e STRIPE_PRICE_PREMIUM_MONTHLY="$STRIPE_PRICE_PREMIUM_MONTHLY" \
  -e GOOGLE_PLAY_PACKAGE_NAME="$GOOGLE_PLAY_PACKAGE_NAME" \
  -e GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON" \
  -e APP_STORE_BUNDLE_ID="$APP_STORE_BUNDLE_ID" \
  -e APP_STORE_SHARED_SECRET="$APP_STORE_SHARED_SECRET" \
  ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

# Clean up old images
echo "Cleaning up old images..."
docker image prune -f

# Wait for container
echo "Waiting for container to start..."
sleep 10

# Check container status
if docker ps | grep -q $CONTAINER_NAME; then
  echo "✅ Container is running"
  docker logs $CONTAINER_NAME --tail 50
else
  echo "❌ Container failed to start"
  docker logs $CONTAINER_NAME --tail 100
  exit 1
fi
DEPLOY_SCRIPT

# Export all environment variables for the remote script
REMOTE_ENV="export AWS_REGION='$AWS_REGION' && \
export ECR_REGISTRY='$ECR_REGISTRY' && \
export ECR_REPOSITORY='$ECR_REPOSITORY' && \
export CONTAINER_NAME='$CONTAINER_NAME' && \
export APP_PORT='$APP_PORT' && \
export NODE_ENV='${NODE_ENV:-production}' && \
export PORT='${PORT:-3001}' && \
export HOST='${HOST:-0.0.0.0}' && \
export SUPABASE_URL='$SUPABASE_URL' && \
export SUPABASE_ANON_KEY='$SUPABASE_ANON_KEY' && \
export SUPABASE_KEY='$SUPABASE_KEY' && \
export ENCRYPTION_KEY='$ENCRYPTION_KEY' && \
export HASH_SALT='$HASH_SALT' && \
export CLIENT_URL='$CLIENT_URL' && \
export FRONTEND_URL='${FRONTEND_URL:-monity://auth/callback}' && \
export GEMINI_API_KEY='$GEMINI_API_KEY' && \
export STRIPE_SECRET_KEY='$STRIPE_SECRET_KEY' && \
export STRIPE_WEBHOOK_SECRET='$STRIPE_WEBHOOK_SECRET' && \
export STRIPE_PRICE_PREMIUM_MONTHLY='$STRIPE_PRICE_PREMIUM_MONTHLY' && \
export GOOGLE_PLAY_PACKAGE_NAME='$GOOGLE_PLAY_PACKAGE_NAME' && \
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON' && \
export APP_STORE_BUNDLE_ID='$APP_STORE_BUNDLE_ID' && \
export APP_STORE_SHARED_SECRET='$APP_STORE_SHARED_SECRET'"

# Copy deployment script to EC2
echo_info "Copying deployment script to EC2..."
scp -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no /tmp/deploy_remote.sh ${EC2_USER}@${EC2_HOST}:/tmp/
echo_success "Deployment script copied"

# Execute deployment on EC2
echo_info "Executing deployment on EC2..."
ssh -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "$REMOTE_ENV && bash /tmp/deploy_remote.sh"
echo_success "Deployment executed"

# Cleanup
rm -f /tmp/deploy_remote.sh

# Health check
echo_info "Performing health check..."
sleep 15

API_URL=${API_URL:-http://${EC2_HOST}:${APP_PORT}}
if curl -f "$API_URL/api/v1/" > /dev/null 2>&1; then
    echo_success "Health check passed!"
    echo ""
    echo_success "================================================"
    echo_success "Deployment Complete!"
    echo_success "================================================"
    echo ""
    echo_info "API URL: $API_URL/api/v1/"
    echo_info "Image: $FULL_IMAGE_NAME"
    echo_info "Environment: $ENVIRONMENT"
    echo ""
else
    echo_warning "Health check failed. Check logs with:"
    echo "  ssh -i $EC2_SSH_KEY_PATH ${EC2_USER}@${EC2_HOST} 'docker logs $CONTAINER_NAME'"
fi
