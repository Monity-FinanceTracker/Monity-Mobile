# IAM Permissions Fix for ECR Access

## Problem

The deployment script (`deploy.sh`) failed with the following error:

```
An error occurred (AccessDeniedException) when calling the GetAuthorizationToken operation: 
User: arn:aws:iam::664607861061:user/monity-deployer is not authorized to perform: 
ecr:GetAuthorizationToken on resource: * because no identity-based policy allows the 
ecr:GetAuthorizationToken action
```

## Root Cause

The IAM user `monity-deployer` lacks the necessary permissions to:
1. Authenticate with Amazon ECR (Elastic Container Registry)
2. Push Docker images to ECR
3. Pull Docker images from ECR

## Solution: Add ECR Permissions to IAM User

### Option 1: Using AWS Console (Recommended)

1. **Log in to AWS Console** → Navigate to **IAM**

2. **Find the user**:
   - Go to **Users** → Search for `monity-deployer`
   - Click on the username

3. **Add permissions**:
   - Click **Add permissions** → **Attach policies directly**
   
4. **Attach the following AWS managed policy**:
   - Search for and select: `AmazonEC2ContainerRegistryPowerUser`
   - This policy provides full access to ECR (push, pull, list, delete images)

5. **Click "Add permissions"**

### Option 2: Using AWS CLI

```bash
aws iam attach-user-policy \
    --user-name monity-deployer \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
```

### Option 3: Create Custom Policy (More Restrictive)

If you want to grant only the minimum required permissions:

1. **Create a custom policy** in IAM:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload"
            ],
            "Resource": "arn:aws:ecr:us-east-1:664607861061:repository/monity-mobile-backend"
        }
    ]
}
```

2. **Attach this policy to the `monity-deployer` user**

## Verification

After adding the permissions, verify they work:

```bash
# Test ECR authentication
aws ecr get-login-password --region us-east-1

# If successful, you should see a long token string
```

## Alternative: Direct Deployment (Current Workaround)

If you cannot modify IAM permissions immediately, use the `direct-deploy.sh` script instead:

```bash
cd Monity-Mobile/aws-deployment
./direct-deploy.sh production
```

This script:
- Bypasses ECR entirely
- Copies source code directly to EC2
- Builds the Docker image on the EC2 instance
- Runs the container with environment variables

**Pros:**
- Works without ECR permissions
- Faster for small deployments
- No AWS credentials needed for deployment

**Cons:**
- Slower build times (builds on EC2 instead of locally)
- Uses EC2 disk space for builds
- Not suitable for CI/CD pipelines
- No image versioning/history in ECR

## Recommended Long-term Solution

1. **Fix IAM permissions** (using Option 1 or 2 above)
2. **Use the standard `deploy.sh` script** for deployments
3. **Set up GitHub Actions CI/CD** for automated deployments
4. **Keep `direct-deploy.sh`** as a backup/emergency deployment method

## Related Files

- `deploy.sh` - Standard deployment script (requires ECR access)
- `direct-deploy.sh` - Alternative deployment without ECR
- `DEPLOYMENT_GUIDE.md` - Complete deployment documentation
- `.env.production` - Environment variables configuration

## AWS Resources

- IAM User: `monity-deployer` (arn:aws:iam::664607861061:user/monity-deployer)
- AWS Account ID: `664607861061`
- ECR Repository: `monity-mobile-backend`
- Region: `us-east-1`

## Next Steps

1. ✅ Use `direct-deploy.sh` to get the backend running immediately
2. ⏳ Request AWS admin to add ECR permissions to `monity-deployer`
3. ⏳ Test `deploy.sh` after permissions are added
4. ⏳ Set up GitHub Actions for automated deployments



