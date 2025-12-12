# SSH Authentication Troubleshooting Guide

This guide helps you diagnose and fix SSH connection issues with your EC2 instance for the Monity Mobile backend deployment.

## Quick Diagnosis

Run the verification script to quickly check your SSH setup:

```bash
cd aws-deployment
./verify-ssh.sh production
```

This will test:
- Private key file exists and is valid
- Public key extraction
- EC2 reachability
- SSH port accessibility
- SSH authentication
- Remote authorized_keys configuration

## Common Issues

### 1. "Permission denied (publickey)"

**Symptom**: SSH connection fails with "Permission denied (publickey)" error.

**Cause**: The public key (corresponding to your private key) is not in the EC2 instance's `~/.ssh/authorized_keys` file.

**Fix**:

1. **Extract public key from your private key**:
   ```bash
   ssh-keygen -y -f /Users/leostuart/Downloads/Monity-Mobile-Backend-Key.pem > public_key.pub
   cat public_key.pub
   ```

2. **Connect to EC2 using EC2 Instance Connect**:
   - Go to AWS Console → EC2 → Instances
   - Select your instance
   - Click "Connect" → "EC2 Instance Connect" → "Connect"

3. **Add the public key on EC2**:
   ```bash
   # Backup existing keys
   cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup.$(date +%Y%m%d-%H%M%S)

   # Add your public key (paste the output from step 1)
   echo "ssh-rsa AAAAB3Nza..." >> ~/.ssh/authorized_keys

   # Set proper permissions
   chmod 600 ~/.ssh/authorized_keys
   ```

4. **Test the connection**:
   ```bash
   ssh -i /Users/leostuart/Downloads/Monity-Mobile-Backend-Key.pem ubuntu@34.204.183.139
   ```

### 2. "Connection timed out"

**Symptom**: SSH connection hangs and times out.

**Cause**: EC2 security group doesn't allow SSH from your IP or GitHub Actions IPs.

**Fix**:

1. **Get GitHub Actions IP ranges**:
   ```bash
   curl https://api.github.com/meta | jq '.actions'
   ```

2. **Update EC2 Security Group**:
   - Go to AWS Console → EC2 → Security Groups
   - Select your security group
   - Add inbound rule:
     - Type: SSH
     - Protocol: TCP
     - Port: 22
     - Source: 0.0.0.0/0 (for testing) or specific GitHub Actions IPs

3. **Verify the port is open**:
   ```bash
   nc -zv 34.204.183.139 22
   ```

### 3. "Host key verification failed"

**Symptom**: SSH connection fails with host key verification error.

**Cause**: SSH host key has changed (instance recreated or man-in-the-middle attack).

**Fix**:

```bash
# Remove old host key
ssh-keygen -R 34.204.183.139

# Or use StrictHostKeyChecking=no (less secure, but works for CI/CD)
ssh -o StrictHostKeyChecking=no -i key.pem ubuntu@34.204.183.139
```

**Note**: The workflows already use `-o StrictHostKeyChecking=no` to avoid this issue.

### 4. Wrong permissions on key file

**Symptom**: "WARNING: UNPROTECTED PRIVATE KEY FILE!" error.

**Cause**: Private key file has permissions that are too open (not 600).

**Fix**:

```bash
chmod 600 /Users/leostuart/Downloads/Monity-Mobile-Backend-Key.pem
```

### 5. Wrong username

**Symptom**: "Permission denied" or "User does not exist" error.

**Cause**: Using the wrong username for SSH connection.

**Fix**:

- For **Ubuntu AMI**: Use `ubuntu`
- For **Amazon Linux**: Use `ec2-user`
- For **CentOS**: Use `centos`
- For **Debian**: Use `admin`

Check your EC2_USER secret is set to `ubuntu`.

### 6. EC2 instance is stopped or terminated

**Symptom**: Connection timeout or "No route to host" error.

**Cause**: EC2 instance is not running.

**Fix**:

1. Check instance state in AWS Console
2. Start the instance if stopped
3. If terminated, you'll need to create a new instance

### 7. GitHub Actions SSH failure

**Symptom**: GitHub Actions workflow fails at SSH connection step.

**Cause**: GitHub Secrets not properly configured or SSH key format issue.

**Fix**:

1. **Verify GitHub Secrets**:
   - Go to Repository → Settings → Secrets and variables → Actions
   - Ensure these secrets exist:
     - `EC2_HOST`: 34.204.183.139
     - `EC2_USER`: ubuntu
     - `EC2_SSH_KEY`: Complete private key (including headers/footers)

2. **Check EC2_SSH_KEY format**:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA...
   ...
   -----END RSA PRIVATE KEY-----
   ```

3. **Run the test workflow**:
   - Go to Actions → Test SSH Connection → Run workflow
   - This will show detailed diagnostics

## Recovery Procedures

### If you lost the private key

**Option A: Use EC2 Instance Connect**
- No key required
- Available in AWS Console
- Temporary access to fix authorized_keys

**Option B: Generate new key pair**

1. **Generate new key pair locally**:
   ```bash
   ssh-keygen -t rsa -b 4096 -f monity-mobile-backend-key-new.pem -C "monity-deployment"
   ```

2. **Add public key to EC2** (via Instance Connect):
   ```bash
   cat monity-mobile-backend-key-new.pem.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Update GitHub Secret**:
   - Copy contents of `monity-mobile-backend-key-new.pem`
   - Update `EC2_SSH_KEY` secret in repository settings

**Option C: Stop instance and edit volume**

1. Stop the EC2 instance
2. Detach the root volume
3. Attach volume to another EC2 instance
4. Mount and edit `authorized_keys`
5. Unmount and reattach to original instance
6. Start instance

### If you can't access EC2 at all

**Last resort: Create new instance**

1. Launch new EC2 instance with same configuration
2. During launch, select or create a new key pair
3. Update deployment configuration with new instance details
4. Update GitHub Secrets with new credentials
5. Migrate any data from old instance (if possible via snapshots)

## Verification Tools

### 1. Local Verification Script

Run `verify-ssh.sh` to check your local SSH configuration:

```bash
cd /Users/leostuart/Downloads/Monity-All/Monity-Mobile/aws-deployment
./verify-ssh.sh production
```

Expected output:
```
✅ Private key file exists
✅ SSH port 22 is open and accessible
✅ SSH authentication successful
✅ Public key FOUND in remote authorized_keys
✅ All checks passed!
```

### 2. GitHub Actions Test Workflow

Manually trigger the SSH test workflow:

1. Go to Actions tab in GitHub
2. Select "Test SSH Connection" workflow
3. Click "Run workflow" → "Run workflow"
4. Wait for results

This workflow will:
- Display key fingerprints
- Test SSH connection
- Show remote configuration
- Provide detailed error messages if it fails

### 3. Manual SSH Test

Test connection from your local machine:

```bash
# Verbose SSH connection (shows detailed debug info)
ssh -vvv -i /Users/leostuart/Downloads/Monity-Mobile-Backend-Key.pem ubuntu@34.204.183.139

# If successful, test a command
ssh -i /Users/leostuart/Downloads/Monity-Mobile-Backend-Key.pem ubuntu@34.204.183.139 "docker ps"
```

## Best Practices

### 1. Security

- **Rotate SSH keys** every 90 days
- **Use separate keys** for different environments (prod/staging)
- **Restrict security group** SSH access to specific IPs when possible
- **Enable MFA** for AWS console access
- **Use AWS Systems Manager** Session Manager as backup access method

### 2. Key Management

- **Store keys securely** - use password managers or secrets vaults
- **Never commit keys** to version control
- **Use GitHub Secrets** for CI/CD - never hardcode
- **Document key locations** for team members
- **Have a backup key** stored securely for emergencies

### 3. Monitoring

- **Set up CloudWatch alarms** for failed SSH attempts
- **Monitor GitHub Actions** workflow failures
- **Review EC2 auth logs** regularly: `sudo tail -f /var/log/auth.log`
- **Enable CloudTrail** for AWS API auditing

### 4. Automation

- **Use the pre-flight check** - it catches issues early
- **Run verify-ssh.sh** before manual deployments
- **Automate key rotation** with scheduled workflows
- **Document recovery procedures** for team

## Key Rotation Guide

To rotate SSH keys (recommended every 90 days):

1. **Generate new key pair**:
   ```bash
   ssh-keygen -t rsa -b 4096 -f monity-mobile-backend-key-$(date +%Y%m).pem
   ```

2. **Add new public key to EC2**:
   ```bash
   # Keep old key, add new one
   ssh-keygen -y -f monity-mobile-backend-key-$(date +%Y%m).pem >> ~/.ssh/authorized_keys
   ```

3. **Update GitHub Secret** with new private key

4. **Test deployment** with new key

5. **Remove old key** from authorized_keys after confirming new key works

6. **Archive old key** securely (don't delete immediately in case of rollback)

## Diagnostic Commands Reference

```bash
# Check if EC2 is reachable
ping -c 3 34.204.183.139

# Check if SSH port is open
nc -zv 34.204.183.139 22

# Test SSH connection with verbose output
ssh -vvv -i key.pem ubuntu@34.204.183.139

# Extract public key from private key
ssh-keygen -y -f key.pem

# Get key fingerprint
ssh-keygen -lf key.pem

# Check local key permissions
ls -la /Users/leostuart/Downloads/Monity-Mobile-Backend-Key.pem

# Check remote authorized_keys (if you have access)
ssh -i key.pem ubuntu@34.204.183.139 "cat ~/.ssh/authorized_keys"
ssh -i key.pem ubuntu@34.204.183.139 "ls -la ~/.ssh/authorized_keys"

# View SSH auth logs on EC2 (if you have access)
ssh -i key.pem ubuntu@34.204.183.139 "sudo tail -50 /var/log/auth.log"

# Get GitHub Actions IP ranges
curl https://api.github.com/meta | jq '.actions'
```

## Getting Help

If you're still stuck after trying these troubleshooting steps:

1. **Run the verification script** and save the output
2. **Check GitHub Actions logs** for detailed error messages
3. **Review EC2 auth logs** for server-side errors
4. **Verify all secrets** are correctly configured
5. **Try the test-ssh workflow** for additional diagnostics

## Common Questions

**Q: Can I use password authentication instead of SSH keys?**
A: Not recommended for security reasons. GitHub Actions requires non-interactive authentication anyway.

**Q: How do I know which key is currently in use?**
A: Run `verify-ssh.sh` - it will show fingerprints of both local and remote keys.

**Q: Can multiple keys work with the same EC2 instance?**
A: Yes! You can have multiple public keys in `authorized_keys`, one per line.

**Q: What if EC2 Instance Connect is not available?**
A: Use AWS Systems Manager Session Manager or the volume detach method described above.

**Q: Should I use the same key for all environments?**
A: No - use separate keys for production, staging, and development for better security.

## Resources

- [AWS EC2 Key Pairs Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
- [GitHub Actions IP Ranges](https://api.github.com/meta)
- [SSH Best Practices](https://www.ssh.com/academy/ssh/best-practices)
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)

---

**Last Updated**: 2025-12-12
**Maintained by**: Monity DevOps Team
