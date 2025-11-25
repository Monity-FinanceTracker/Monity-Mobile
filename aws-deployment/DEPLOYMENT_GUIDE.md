# Monity Mobile Backend - AWS Deployment Guide

Complete guide for deploying the Monity Mobile backend to AWS using EC2 + Docker with automated CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [Create ECR Repository](#create-ecr-repository)
4. [Launch EC2 Instance](#launch-ec2-instance)
5. [Configure EC2](#configure-ec2)
6. [Set Up Load Balancer & SSL](#set-up-load-balancer--ssl)
7. [Configure DNS with Route 53](#configure-dns-with-route-53)
8. [GitHub Secrets Configuration](#github-secrets-configuration)
9. [First Deployment](#first-deployment)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)
12. [Cost Optimization](#cost-optimization)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] AWS account with billing enabled
- [ ] Domain name (for SSL certificate)
- [ ] GitHub repository with admin access
- [ ] AWS CLI installed locally ([Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- [ ] Basic terminal/command line knowledge
- [ ] All environment variables ready (see `.env.production.template`)

**Estimated Time**: 2-3 hours for first-time setup

**Estimated Monthly Cost**: ~$40-60/month

---

## AWS Account Setup

### 1. Create IAM User for CI/CD

1. **Log in to AWS Console** → Navigate to IAM

2. **Create new user**:
   - Username: `monity-mobile-cicd`
   - Access type: ✅ Programmatic access

3. **Attach policies**:
   - `AmazonEC2ContainerRegistryPowerUser` (for ECR)
   - `AmazonEC2ReadOnlyAccess` (for deployment)

4. **Save credentials**:
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   ```
   ⚠️ **IMPORTANT**: Save these securely - you won't see them again!

### 2. Create IAM Role for EC2

1. **IAM** → **Roles** → **Create role**

2. **Trusted entity**: AWS service → EC2

3. **Attach policies**:
   - `AmazonEC2ContainerRegistryReadOnly` (pull Docker images)
   - `CloudWatchAgentServerPolicy` (monitoring)

4. **Name**: `monity-mobile-backend-ec2-role`

5. **Create role**

---

## Create ECR Repository

Amazon ECR (Elastic Container Registry) stores your Docker images.

### Using AWS Console

1. **Navigate to ECR** → **Repositories** → **Create repository**

2. **Settings**:
   - **Repository name**: `monity-mobile-backend`
   - **Visibility**: Private
   - **Tag immutability**: Disabled
   - **Scan on push**: ✅ Enabled (recommended for security)
   - **Encryption**: AES-256 (default)

3. **Create repository**

4. **Note the URI**: `<aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/monity-mobile-backend`

### Using AWS CLI

```bash
aws ecr create-repository \
    --repository-name monity-mobile-backend \
    --image-scanning-configuration scanOnPush=true \
    --region us-east-1
```

---

## Launch EC2 Instance

### Recommended Instance Type

For production workload:
- **Instance type**: `t3.medium` (2 vCPU, 4GB RAM)
- **Alternative budget option**: `t3.small` (2 vCPU, 2GB RAM)

### Step-by-Step Launch

1. **EC2 Dashboard** → **Launch Instance**

2. **Name**: `monity-mobile-backend-prod`

3. **Application and OS Images**:
   - **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   - **Architecture**: 64-bit (x86)

4. **Instance type**: `t3.medium`

5. **Key pair**:
   - Create new key pair or use existing
   - **Name**: `monity-mobile-backend-key`
   - **Type**: RSA
   - **Format**: `.pem` (for OpenSSH)
   - **Download and save securely** (you'll need this for SSH)

6. **Network settings**:
   - **VPC**: Default VPC (or create custom)
   - **Subnet**: No preference
   - **Auto-assign public IP**: ✅ Enable
   - **Firewall (Security Group)**: Create new
     - **Security group name**: `monity-mobile-backend-sg`
     - **Rules**:
       ```
       Type            Protocol   Port    Source
       SSH             TCP        22      Your IP (My IP)
       HTTP            TCP        80      0.0.0.0/0
       HTTPS           TCP        443     0.0.0.0/0
       Custom TCP      TCP        3001    0.0.0.0/0 (or ALB security group)
       ```

7. **Configure storage**:
   - **Size**: 20 GB (minimum)
   - **Type**: gp3 (General Purpose SSD)
   - **IOPS**: 3000 (default)

8. **Advanced details**:
   - **IAM instance profile**: Select `monity-mobile-backend-ec2-role`
   - **User data** (optional - for automatic setup):
     ```bash
     #!/bin/bash
     # This will run on first boot
     apt-get update
     apt-get upgrade -y
     ```

9. **Launch instance**

10. **Wait for instance to be running** (usually 1-2 minutes)

11. **Note the Public IP address** (e.g., `54.123.45.67`)

---

## Configure EC2

### Connect to EC2

```bash
# Make key file secure
chmod 400 monity-mobile-backend-key.pem

# Connect via SSH
ssh -i monity-mobile-backend-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Run Setup Script

1. **Copy setup script to EC2**:
   ```bash
   # From your local machine
   scp -i monity-mobile-backend-key.pem \
       aws-deployment/ec2-setup.sh \
       ubuntu@<EC2-PUBLIC-IP>:/tmp/
   ```

2. **SSH into EC2 and run setup**:
   ```bash
   ssh -i monity-mobile-backend-key.pem ubuntu@<EC2-PUBLIC-IP>

   # Run setup script
   sudo bash /tmp/ec2-setup.sh
   ```

3. **Wait for completion** (5-10 minutes)

4. **Verify installation**:
   ```bash
   docker --version
   # Output: Docker version 24.x.x

   aws --version
   # Output: aws-cli/2.x.x
   ```

5. **Logout and log back in** (to apply docker group membership):
   ```bash
   exit
   ssh -i monity-mobile-backend-key.pem ubuntu@<EC2-PUBLIC-IP>
   ```

---

## Set Up Load Balancer & SSL

An Application Load Balancer (ALB) provides:
- HTTPS/SSL termination
- Health checks
- High availability (if you scale to multiple instances)

### Create Target Group

1. **EC2 Dashboard** → **Target Groups** → **Create target group**

2. **Choose target type**: Instances

3. **Target group name**: `monity-mobile-backend-tg`

4. **Protocol**: HTTP
   **Port**: 3001

5. **VPC**: Same as your EC2 instance

6. **Health check**:
   - **Protocol**: HTTP
   - **Path**: `/api/v1/`
   - **Healthy threshold**: 2
   - **Unhealthy threshold**: 3
   - **Timeout**: 5 seconds
   - **Interval**: 30 seconds

7. **Create target group**

8. **Register targets**:
   - Select your EC2 instance
   - Port: 3001
   - **Include as pending below**
   - **Create target group**

### Request SSL Certificate (AWS Certificate Manager)

1. **Certificate Manager** → **Request certificate**

2. **Certificate type**: Public certificate

3. **Domain names**:
   - `api.yourdomain.com` (or `mobile-api.yourdomain.com`)
   - *Optional*: `*.yourdomain.com` (wildcard)

4. **Validation method**: DNS validation (recommended)

5. **Request certificate**

6. **Complete DNS validation**:
   - Copy the CNAME record name and value
   - Add to your domain's DNS (Route 53 or your DNS provider)
   - Wait for validation (5-30 minutes)

### Create Application Load Balancer

1. **EC2 Dashboard** → **Load Balancers** → **Create Load Balancer**

2. **Type**: Application Load Balancer

3. **Name**: `monity-mobile-backend-alb`

4. **Scheme**: Internet-facing

5. **IP address type**: IPv4

6. **Network mapping**:
   - **VPC**: Same as EC2
   - **Mappings**: Select at least 2 availability zones

7. **Security groups**:
   - Create new or select existing
   - **Allow**: HTTP (80), HTTPS (443) from 0.0.0.0/0

8. **Listeners and routing**:

   **Listener 1** (HTTP → HTTPS redirect):
   - Protocol: HTTP
   - Port: 80
   - Default action: Redirect to HTTPS (port 443)

   **Listener 2** (HTTPS):
   - Protocol: HTTPS
   - Port: 443
   - Default action: Forward to `monity-mobile-backend-tg`
   - **Certificate**: Select your ACM certificate

9. **Create load balancer**

10. **Note the DNS name**: `monity-mobile-backend-alb-123456789.us-east-1.elb.amazonaws.com`

---

## Configure DNS with Route 53

### If Using Route 53 for DNS

1. **Route 53** → **Hosted zones** → Select your domain

2. **Create record**:
   - **Record name**: `api` (for `api.yourdomain.com`)
   - **Record type**: A
   - **Alias**: ✅ Yes
   - **Route traffic to**:
     - Alias to Application and Classic Load Balancer
     - Region: us-east-1
     - Select your ALB
   - **Create records**

### If Using External DNS Provider

1. Create a CNAME record:
   ```
   Type: CNAME
   Name: api
   Value: monity-mobile-backend-alb-123456789.us-east-1.elb.amazonaws.com
   TTL: 300
   ```

2. Wait for DNS propagation (5-60 minutes)

3. **Verify**:
   ```bash
   dig api.yourdomain.com
   # Should show your ALB DNS
   ```

---

## GitHub Secrets Configuration

GitHub Secrets store sensitive environment variables for CI/CD.

### Navigate to Repository Settings

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**

### Add Required Secrets

#### AWS Configuration

```
AWS_ACCESS_KEY_ID
Value: AKIA... (from IAM user creation)

AWS_SECRET_ACCESS_KEY
Value: ... (from IAM user creation)

EC2_HOST
Value: <EC2-PUBLIC-IP> or api.yourdomain.com

EC2_USER
Value: ubuntu

EC2_SSH_KEY
Value: (paste entire contents of .pem file)
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----

API_URL
Value: https://api.yourdomain.com
```

#### Application Environment Variables

Copy from your `.env.production` file:

```
NODE_ENV
Value: production

PORT
Value: 3001

HOST
Value: 0.0.0.0

SUPABASE_URL
Value: https://eeubnmpetzhjcludrjwz.supabase.co

SUPABASE_ANON_KEY
Value: eyJhbGc...

SUPABASE_KEY
Value: eyJhbGc... (service_role key)

ENCRYPTION_KEY
Value: <32-character-hex-string>

HASH_SALT
Value: <random-hex-string>

CLIENT_URL
Value: https://yourfrontend.com

FRONTEND_URL
Value: monity://auth/callback

GEMINI_API_KEY
Value: AIza... (optional)

STRIPE_SECRET_KEY
Value: sk_live_... (optional)

STRIPE_WEBHOOK_SECRET
Value: whsec_... (optional)

STRIPE_PRICE_PREMIUM_MONTHLY
Value: price_... (optional)

GOOGLE_PLAY_PACKAGE_NAME
Value: com.widechain.monity (optional)

GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
Value: {...} (optional)

APP_STORE_BUNDLE_ID
Value: com.Monity (optional)

APP_STORE_SHARED_SECRET
Value: ... (optional)
```

**Total Secrets**: Approximately 20+ secrets

---

## First Deployment

### Option 1: Automatic Deployment (Recommended)

1. **Commit and push to `main` or `develop` branch**:
   ```bash
   git add .
   git commit -m "Add AWS deployment configuration"
   git push origin main
   ```

2. **Monitor GitHub Actions**:
   - Go to **Actions** tab in GitHub
   - Watch the deployment workflow
   - Should take 5-10 minutes

3. **Verify deployment**:
   ```bash
   curl https://api.yourdomain.com/api/v1/
   # Expected: {"message":"Monity API v1 is running",...}
   ```

### Option 2: Manual Deployment

1. **Create `.env.production` file** in `aws-deployment/`:
   ```bash
   cd aws-deployment
   cp production.env.template .env.production
   # Edit .env.production with your values
   ```

2. **Run deployment script**:
   ```bash
   ./deploy.sh production
   ```

3. **Wait for completion** (5-15 minutes)

4. **Verify**:
   ```bash
   ssh -i monity-mobile-backend-key.pem ubuntu@<EC2-PUBLIC-IP>
   docker ps
   # Should show monity-mobile-backend container running
   ```

---

## Monitoring & Maintenance

### CloudWatch Monitoring

1. **CloudWatch** → **Metrics** → **Monity/MobileBackend**

   Available metrics:
   - CPU_IDLE
   - DISK_USED
   - MEM_USED

2. **CloudWatch** → **Log groups** → `/aws/ec2/monity-mobile-backend`

   View system logs and errors

### Set Up Alarms

1. **CloudWatch** → **Alarms** → **Create alarm**

2. **Example: High CPU Alert**:
   - Metric: `Monity/MobileBackend` → `CPU_IDLE`
   - Condition: Less than 20% (means CPU usage > 80%)
   - Period: 5 minutes
   - Datapoints: 2 out of 3
   - Notification: SNS topic → Your email

3. **Recommended alarms**:
   - CPU usage > 80%
   - Memory usage > 90%
   - Disk usage > 80%
   - ALB unhealthy target count > 0

### Container Logs

```bash
# SSH into EC2
ssh -i monity-mobile-backend-key.pem ubuntu@<EC2-PUBLIC-IP>

# View live logs
docker logs -f monity-mobile-backend

# View last 100 lines
docker logs --tail 100 monity-mobile-backend

# View logs with timestamps
docker logs --timestamps monity-mobile-backend
```

### Container Management

```bash
# Check container status
docker ps

# Restart container
docker restart monity-mobile-backend

# Stop container
docker stop monity-mobile-backend

# Remove container
docker rm monity-mobile-backend

# View container resource usage
docker stats monity-mobile-backend
```

### Manual Rollback

If a deployment fails:

1. **Find previous working image**:
   ```bash
   # On EC2
   docker images
   ```

2. **Stop current container**:
   ```bash
   docker stop monity-mobile-backend
   docker rm monity-mobile-backend
   ```

3. **Start with previous image**:
   ```bash
   docker run -d \
     --name monity-mobile-backend \
     --restart unless-stopped \
     -p 3001:3001 \
     --env-file /opt/monity/.env \
     <PREVIOUS-IMAGE-TAG>
   ```

---

## Troubleshooting

### Container Won't Start

**Check logs**:
```bash
docker logs monity-mobile-backend
```

**Common issues**:
1. **Missing environment variables**
   - Verify all required vars in GitHub Secrets
   - Check if variables are passed correctly in workflow

2. **Port already in use**
   - Check: `sudo lsof -i :3001`
   - Kill process: `sudo kill <PID>`

3. **Out of memory**
   - Check: `free -h`
   - Consider upgrading instance type

### Health Check Failing

1. **SSH into EC2**:
   ```bash
   ssh -i monity-mobile-backend-key.pem ubuntu@<EC2-PUBLIC-IP>
   ```

2. **Test locally**:
   ```bash
   curl http://localhost:3001/api/v1/
   ```

3. **Check security group**:
   - Ensure port 3001 is open from ALB

4. **Check target group health**:
   - EC2 → Target Groups → Health status

### SSL Certificate Issues

1. **Verify DNS validation**:
   - Certificate Manager → Check status
   - Ensure CNAME records are correct

2. **Check ALB listener**:
   - Ensure certificate is attached
   - Verify HTTPS listener on port 443

### GitHub Actions Failing

1. **Check workflow logs** in GitHub Actions tab

2. **Common issues**:
   - **SSH connection failed**: Verify EC2_SSH_KEY secret
   - **ECR login failed**: Check AWS credentials
   - **Image build failed**: Review Dockerfile

### Unable to Connect via SSH

1. **Verify security group**:
   - Ensure port 22 is open from your IP

2. **Check key permissions**:
   ```bash
   chmod 400 monity-mobile-backend-key.pem
   ```

3. **Verify instance is running**:
   - EC2 Dashboard → Instance state should be "running"

### High Memory Usage

1. **Monitor**:
   ```bash
   free -h
   docker stats
   ```

2. **Solutions**:
   - Restart container: `docker restart monity-mobile-backend`
   - Upgrade instance: t3.medium → t3.large
   - Optimize application (check for memory leaks)

---

## Cost Optimization

### Current Estimated Costs (us-east-1, per month)

| Service | Configuration | Cost |
|---------|--------------|------|
| EC2 (t3.medium) | 730 hours/month | ~$30 |
| EBS (gp3) | 20 GB | ~$2 |
| ALB | ~2.2M LCUs/month | ~$20 |
| ECR | 1GB storage | ~$0.10 |
| Data transfer | ~10GB/month | ~$1 |
| CloudWatch | Logs + metrics | ~$5 |
| **Total** | | **~$58/month** |

### Optimization Tips

1. **Use Reserved Instances** (1-year commitment):
   - Save up to 40% on EC2 costs
   - Total: ~$40/month instead of $58

2. **Right-size your instance**:
   - Start with t3.small ($15/month) if traffic is low
   - Upgrade only when needed

3. **Enable ALB access logs deletion**:
   - Set S3 lifecycle policy to delete logs after 7 days

4. **Clean up old Docker images**:
   ```bash
   # Keep only last 3 images in ECR
   # Delete old images manually or via lifecycle policy
   ```

5. **Use spot instances** (development/staging):
   - Save up to 90% on non-production environments

6. **Monitor actual usage**:
   - Review AWS Cost Explorer monthly
   - Set up billing alerts

### Cost Alerts

1. **AWS Budgets** → **Create budget**

2. **Budget type**: Cost budget

3. **Set amount**: $100/month (or your threshold)

4. **Alert thresholds**:
   - 80% of budget
   - 100% of budget

5. **Notifications**: Your email

---

## Additional Resources

### AWS Documentation

- [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [ECR User Guide](https://docs.aws.amazon.com/ecr/)
- [ALB User Guide](https://docs.aws.amazon.com/elasticloadbalancing/)
- [CloudWatch User Guide](https://docs.aws.amazon.com/cloudwatch/)

### Support

- **GitHub Issues**: [Report bugs](https://github.com/Monity-FinanceTracker/Monity-Mobile/issues)
- **AWS Support**: Available in AWS Console
- **Community**: [AWS Forums](https://forums.aws.amazon.com/)

### Maintenance Schedule

- **Daily**: Monitor CloudWatch metrics and logs
- **Weekly**: Review container logs for errors
- **Monthly**: Check AWS bill and optimize costs
- **Quarterly**: Review security groups and access
- **Annually**: Renew SSL certificates (automatic with ACM)

---

## Checklist

Before going live:

- [ ] All environment variables configured in GitHub Secrets
- [ ] SSL certificate validated and attached to ALB
- [ ] DNS record pointing to ALB
- [ ] CloudWatch alarms set up
- [ ] Billing alerts configured
- [ ] IAM roles and policies reviewed
- [ ] Security groups restricted to necessary ports
- [ ] SSH key backed up securely
- [ ] First deployment successful
- [ ] Health checks passing
- [ ] API accessible via HTTPS
- [ ] Mobile app updated with production API URL
- [ ] Monitoring dashboard created
- [ ] Rollback procedure tested

---

**Deployment completed successfully!**

Your Monity Mobile Backend is now running on AWS. Monitor the health checks and logs for the first 24-48 hours to ensure stability.

For any issues, refer to the [Troubleshooting](#troubleshooting) section or check the container logs.
