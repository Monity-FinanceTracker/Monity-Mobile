# AWS Deployment for Monity Mobile Backend

Complete AWS deployment setup with automated CI/CD pipelines for the Monity Mobile backend.

## Quick Links

- **[Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Comprehensive step-by-step instructions
- **[Environment Template](./production.env.template)** - Production environment variables
- **[GitHub Actions Workflow](../.github/workflows/deploy-aws.yml)** - Automated CI/CD

## Architecture

```
┌─────────────┐
│   GitHub    │
│  (Code Repo)│
└──────┬──────┘
       │ Push to main/develop
       │
       ▼
┌─────────────┐
│GitHub Actions│
│   CI/CD     │
└──────┬──────┘
       │ 1. Build Docker Image
       │ 2. Push to ECR
       │ 3. Deploy to EC2
       │
       ▼
┌─────────────┐      ┌─────────────┐
│    ECR      │─────▶│     EC2     │
│ (Container  │      │  (t3.medium)│
│  Registry)  │      │   Docker    │
└─────────────┘      └──────┬──────┘
                            │ Port 3001
                            │
                     ┌──────▼──────┐
                     │     ALB     │
                     │  (HTTPS/SSL)│
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │  Route 53   │
                     │  (DNS/CDN)  │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │   Users     │
                     │ (Mobile App)│
                     └─────────────┘

External Services:
├── Supabase (PostgreSQL + Auth)
├── Stripe (Payments)
└── Google Gemini (AI)
```

## Files in This Directory

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE.md` | Complete deployment instructions |
| `production.env.template` | Environment variables template |
| `ec2-setup.sh` | Initial EC2 instance setup script |
| `deploy.sh` | Manual deployment script |

## Deployment Options

### Option 1: Automated (Recommended)

Push to `main` or `develop` branch → GitHub Actions handles everything automatically.

**Prerequisites**:
- GitHub Secrets configured (see guide)
- EC2 instance running with IAM role
- ECR repository created

**Steps**:
1. Configure GitHub Secrets (see [guide](./DEPLOYMENT_GUIDE.md#github-secrets-configuration))
2. Push code to `main` branch
3. Monitor deployment in GitHub Actions tab
4. Verify at `https://api.yourdomain.com/api/v1/`

### Option 2: Manual

Deploy manually from your local machine.

**Prerequisites**:
- AWS CLI configured
- SSH access to EC2
- `.env.production` file created

**Steps**:
```bash
cd aws-deployment
cp production.env.template .env.production
# Edit .env.production with your values
./deploy.sh production
```

## Quick Start Guide

### 1. AWS Infrastructure Setup (One-time)

```bash
# Create ECR repository
aws ecr create-repository \
    --repository-name monity-mobile-backend \
    --region us-east-1

# Launch EC2 instance (via AWS Console)
# - Instance type: t3.medium
# - OS: Ubuntu 22.04 LTS
# - Security group: Allow ports 22, 80, 443, 3001
# - IAM role: monity-mobile-backend-ec2-role
```

### 2. Configure EC2 Instance

```bash
# Copy setup script to EC2
scp -i your-key.pem ec2-setup.sh ubuntu@<EC2-IP>:/tmp/

# SSH and run setup
ssh -i your-key.pem ubuntu@<EC2-IP>
sudo bash /tmp/ec2-setup.sh
```

### 3. Configure GitHub Secrets

Add all variables from `production.env.template` to:
**Repository → Settings → Secrets and variables → Actions**

Required secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- All app environment variables (Supabase, etc.)

### 4. Deploy

```bash
git add .
git commit -m "Configure AWS deployment"
git push origin main
```

Monitor deployment: **Actions** tab in GitHub

## Cost Estimate

| Component | Monthly Cost |
|-----------|--------------|
| EC2 (t3.medium) | ~$30 |
| Application Load Balancer | ~$20 |
| EBS Storage (20GB) | ~$2 |
| ECR (1GB) | ~$0.10 |
| Data Transfer (10GB) | ~$1 |
| CloudWatch | ~$5 |
| **Total** | **~$58/month** |

**Cost Savings**:
- Use Reserved Instance: Save ~$15/month
- Start with t3.small: Save ~$15/month
- Total optimized: **~$30-40/month**

## Monitoring

### CloudWatch Logs

```bash
# View in AWS Console
CloudWatch → Log groups → /aws/ec2/monity-mobile-backend
```

### Container Logs

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<EC2-IP>

# View live logs
docker logs -f monity-mobile-backend
```

### Metrics

Available in CloudWatch under namespace: `Monity/MobileBackend`
- CPU Usage
- Memory Usage
- Disk Usage

## Common Commands

### EC2 Management

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@<EC2-IP>

# Check container status
docker ps

# View logs
docker logs monity-mobile-backend

# Restart container
docker restart monity-mobile-backend

# Update deployment manually
cd aws-deployment
./deploy.sh production
```

### GitHub Actions

```bash
# Trigger manual deployment
# Go to: Actions → Deploy to AWS EC2 → Run workflow

# View deployment logs
# Actions → Latest workflow run → build-and-deploy
```

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs**: Actions → Latest run
2. **Verify GitHub Secrets**: Settings → Secrets and variables → Actions
3. **Check EC2 access**: `ssh -i your-key.pem ubuntu@<EC2-IP>`
4. **View container logs**: `docker logs monity-mobile-backend`

### Health Check Fails

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<EC2-IP>

# Test locally
curl http://localhost:3001/api/v1/

# Check logs
docker logs monity-mobile-backend

# Restart if needed
docker restart monity-mobile-backend
```

### Container Won't Start

```bash
# View logs
docker logs monity-mobile-backend

# Common issues:
# - Missing environment variables
# - Port 3001 already in use
# - Out of memory

# Check resources
free -h
docker stats
```

## Security Checklist

Before going live:

- [ ] All GitHub Secrets configured
- [ ] SSH key has restricted permissions (`chmod 400`)
- [ ] Security group limits SSH to your IP only
- [ ] SSL certificate validated and attached
- [ ] Environment variables not committed to git
- [ ] Supabase `service_role` key used (not `anon` key)
- [ ] Stripe production keys configured
- [ ] CloudWatch alarms set up
- [ ] Billing alerts configured

## Support

- **Deployment Issues**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting)
- **AWS Documentation**: https://docs.aws.amazon.com/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Project Issues**: https://github.com/Monity-FinanceTracker/Monity-Mobile/issues

## Next Steps

After successful deployment:

1. **Update mobile app** with production API URL
2. **Test all endpoints** via Postman or mobile app
3. **Monitor logs** for first 24-48 hours
4. **Set up CloudWatch alarms**
5. **Configure auto-scaling** (if needed)
6. **Enable backups** (Supabase handles DB backups)
7. **Document any custom configurations**

---

**Last Updated**: November 2025

For detailed instructions, see the [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md).
