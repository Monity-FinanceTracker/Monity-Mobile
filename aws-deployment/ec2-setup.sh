#!/bin/bash

################################################################################
# EC2 Instance Setup Script for Monity Backend
#
# This script should be run on a fresh Ubuntu EC2 instance to:
# - Install Docker and AWS CLI
# - Configure security and firewall
# - Set up auto-restart on reboot
# - Prepare for container deployment
#
# Usage: sudo bash ec2-setup.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo_error "Please run as root (use sudo)"
    exit 1
fi

echo_info "Starting EC2 setup for Monity Backend..."

# Update system
echo_info "Updating system packages..."
apt-get update
apt-get upgrade -y
echo_success "System updated"

# Install dependencies
echo_info "Installing dependencies..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    unzip \
    git \
    htop \
    vim
echo_success "Dependencies installed"

# Install Docker
echo_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Set up stable repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    echo_success "Docker installed successfully"
else
    echo_success "Docker already installed"
fi

# Add ubuntu user to docker group (if exists)
if id "ubuntu" &>/dev/null; then
    usermod -aG docker ubuntu
    echo_success "Added ubuntu user to docker group"
fi

# Install AWS CLI v2
echo_info "Installing AWS CLI..."
if ! command -v aws &> /dev/null; then
    cd /tmp
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
    echo_success "AWS CLI installed successfully"
else
    echo_success "AWS CLI already installed"
fi

# Configure AWS CLI credentials (optional - will use IAM role if attached)
echo_info "Checking AWS configuration..."
if aws sts get-caller-identity &> /dev/null; then
    echo_success "AWS credentials configured (using IAM role or credentials)"
else
    echo_info "No AWS credentials found. Make sure to attach an IAM role to this instance."
fi

# Configure firewall
echo_info "Configuring firewall..."
# Allow SSH (22), HTTP (80), HTTPS (443), and app port (3001)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp
ufw --force enable
echo_success "Firewall configured"

# Increase file descriptor limits for Docker
echo_info "Configuring system limits..."
cat > /etc/security/limits.d/docker.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF
echo_success "System limits configured"

# Configure log rotation for Docker
echo_info "Configuring Docker log rotation..."
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker
echo_success "Docker log rotation configured"

# Create deployment directory
echo_info "Creating deployment directory..."
mkdir -p /opt/monity
chown -R ubuntu:ubuntu /opt/monity
echo_success "Deployment directory created at /opt/monity"

# Create systemd service for auto-restart
echo_info "Creating systemd service..."
cat > /etc/systemd/system/monity-mobile-backend.service << 'EOF'
[Unit]
Description=Monity Mobile Backend Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStartPre=-/usr/bin/docker stop monity-mobile-backend
ExecStartPre=-/usr/bin/docker rm monity-mobile-backend
ExecStart=/bin/bash -c 'docker ps | grep monity-mobile-backend || echo "Container will be started by deployment"'
ExecStop=/usr/bin/docker stop monity-mobile-backend

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable monity-mobile-backend.service
echo_success "Systemd service created and enabled"

# Install CloudWatch agent (optional but recommended)
echo_info "Installing CloudWatch agent..."
cd /tmp
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb
echo_success "CloudWatch agent installed"

# Create CloudWatch config
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'EOF'
{
  "metrics": {
    "namespace": "Monity/MobileBackend",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "/aws/ec2/monity-mobile-backend",
            "log_stream_name": "{instance_id}/syslog"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent (will fail if IAM role not attached)
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json || echo_info "CloudWatch agent not started (IAM role may be missing)"

# Print Docker version
echo_info "Installed versions:"
docker --version
aws --version

# Print final instructions
echo ""
echo_success "================================================"
echo_success "EC2 Setup Complete!"
echo_success "================================================"
echo ""
echo_info "Next steps:"
echo "  1. Attach an IAM role to this instance with permissions for:"
echo "     - ECR: ecr:GetAuthorizationToken, ecr:BatchGetImage, ecr:GetDownloadUrlForLayer"
echo "     - CloudWatch: cloudwatch:PutMetricData, logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents"
echo ""
echo "  2. Add this instance's public IP to GitHub Secrets:"
echo "     EC2_HOST: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "     EC2_USER: ubuntu"
echo "     EC2_SSH_KEY: <paste your private SSH key>"
echo ""
echo "  3. Configure your GitHub repository secrets with all environment variables"
echo ""
echo "  4. Push to main/develop branch to trigger deployment"
echo ""
echo_info "Instance is ready for deployment!"
