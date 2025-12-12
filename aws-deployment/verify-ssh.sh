#!/bin/bash
# SSH Configuration Verification Script
# Usage: ./verify-ssh.sh [production|staging]

set -e

ENV_FILE=".env.${1:-production}"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file not found: $ENV_FILE"
    echo "Usage: ./verify-ssh.sh [production|staging]"
    exit 1
fi

# Load environment
export $(cat $ENV_FILE | grep -v '^#' | xargs)

echo "=========================================="
echo "   SSH Configuration Verification"
echo "=========================================="
echo ""
echo "Environment: ${1:-production}"
echo "EC2 Host: $EC2_HOST"
echo "EC2 User: $EC2_USER"
echo ""

# Check private key file
echo "1. Checking private key file..."
if [ -f "$EC2_SSH_KEY_PATH" ]; then
    echo "✅ Private key file exists: $EC2_SSH_KEY_PATH"
    chmod 600 "$EC2_SSH_KEY_PATH"

    # Extract public key
    echo ""
    echo "2. Extracting public key from private key..."
    ssh-keygen -y -f "$EC2_SSH_KEY_PATH" > /tmp/extracted_public_key.pub

    echo "Public key fingerprint:"
    ssh-keygen -lf /tmp/extracted_public_key.pub

    echo ""
    echo "Public key content (add this to EC2 if missing):"
    echo "---"
    cat /tmp/extracted_public_key.pub
    echo "---"
else
    echo "❌ Private key not found at: $EC2_SSH_KEY_PATH"
    exit 1
fi

# Test connectivity
echo ""
echo "3. Testing EC2 reachability..."
if ping -c 3 $EC2_HOST > /dev/null 2>&1; then
    echo "✅ EC2 host is reachable via ping"
else
    echo "⚠️  Ping failed (may be blocked by firewall, trying SSH anyway...)"
fi

# Test SSH port
echo ""
echo "4. Testing SSH port..."
if nc -zv $EC2_HOST 22 -w 5 2>&1 | grep -q succeeded; then
    echo "✅ SSH port 22 is open and accessible"
else
    echo "❌ SSH port 22 is not accessible"
    echo "Please check EC2 security group allows SSH from your IP"
    exit 1
fi

# Test authentication
echo ""
echo "5. Testing SSH authentication..."
if ssh -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
    $EC2_USER@$EC2_HOST "echo '✅ SSH authentication successful'" 2>/dev/null; then

    echo "✅ SSH authentication successful"

    # Check remote authorized_keys
    echo ""
    echo "6. Checking remote authorized_keys..."
    ssh -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no \
        $EC2_USER@$EC2_HOST "cat ~/.ssh/authorized_keys" > /tmp/remote_keys 2>/dev/null

    echo "Remote authorized_keys fingerprints:"
    ssh-keygen -lf /tmp/remote_keys 2>/dev/null || echo "Could not read remote keys"

    # Check if our key is present
    echo ""
    if grep -qF "$(cat /tmp/extracted_public_key.pub)" /tmp/remote_keys 2>/dev/null; then
        echo "✅ Public key FOUND in remote authorized_keys"
    else
        echo "⚠️  Public key NOT found in remote authorized_keys"
        echo ""
        echo "To fix, run on EC2 (via EC2 Instance Connect):"
        echo "---"
        echo "echo '$(cat /tmp/extracted_public_key.pub)' >> ~/.ssh/authorized_keys"
        echo "chmod 600 ~/.ssh/authorized_keys"
        echo "---"
    fi

    # Test Docker
    echo ""
    echo "7. Checking Docker on EC2..."
    if ssh -i "$EC2_SSH_KEY_PATH" -o StrictHostKeyChecking=no \
        $EC2_USER@$EC2_HOST "docker --version" 2>/dev/null; then
        echo "✅ Docker is installed"
    else
        echo "⚠️  Docker not found or not accessible"
    fi

else
    echo "❌ SSH authentication failed"
    echo ""
    echo "=== TROUBLESHOOTING ==="
    echo ""
    echo "Likely causes:"
    echo "1. Public key not in ~/.ssh/authorized_keys on EC2 (most common)"
    echo "2. Wrong EC2_USER (currently: $EC2_USER)"
    echo "3. Wrong EC2_HOST (currently: $EC2_HOST)"
    echo "4. Wrong private key in EC2_SSH_KEY_PATH"
    echo ""
    echo "To fix:"
    echo "1. Use AWS Console → EC2 → Connect → EC2 Instance Connect"
    echo "2. In the terminal, run:"
    echo "   echo '$(cat /tmp/extracted_public_key.pub)' >> ~/.ssh/authorized_keys"
    echo "   chmod 600 ~/.ssh/authorized_keys"
    echo "3. Run this script again to verify"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "   ✅ All checks passed!"
echo "=========================================="
echo ""
echo "Your SSH configuration is correct."
echo "GitHub Actions deployment should work now."

# Cleanup
rm -f /tmp/extracted_public_key.pub /tmp/remote_keys
