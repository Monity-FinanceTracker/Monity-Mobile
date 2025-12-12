#!/bin/bash

# Network Connection Test Script for Monity Mobile Development
# This script helps diagnose why the mobile app cannot connect to the backend

echo "🔍 Monity Network Connection Diagnostics"
echo "========================================"
echo ""

# Get current IP
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
PORT=3001

echo "📍 Network Information:"
echo "   Current IP: $IP"
echo "   Port: $PORT"
echo ""

# Check if server is running
echo "🔌 Checking if server is running..."
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "   ✅ Server is running on port $PORT"
else
    echo "   ❌ Server is NOT running on port $PORT"
    echo "   → Start the server first: cd Monity-Mobile/backend && npm run dev"
    exit 1
fi

# Check if server is accessible locally
echo ""
echo "🌐 Testing local server accessibility..."
if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "   ✅ Server is accessible locally"
else
    echo "   ❌ Server is NOT accessible locally"
    echo "   → Check if the server started correctly"
    exit 1
fi

# Check if server is accessible via network IP
echo ""
echo "🌍 Testing network IP accessibility..."
if curl -s http://$IP:$PORT/health > /dev/null 2>&1; then
    echo "   ✅ Server is accessible via network IP ($IP:$PORT)"
else
    echo "   ⚠️  Server is NOT accessible via network IP"
    echo "   → This might be a firewall or network binding issue"
fi

# Check firewall status
echo ""
echo "🛡️  Checking macOS Firewall..."
FIREWALL_STATE=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null | grep -o "enabled\|disabled" || echo "unknown")
if [ "$FIREWALL_STATE" = "disabled" ]; then
    echo "   ✅ Firewall is disabled"
elif [ "$FIREWALL_STATE" = "enabled" ]; then
    echo "   ⚠️  Firewall is ENABLED - this might block connections"
    echo "   → You may need to allow Node.js through the firewall"
else
    echo "   ⚠️  Could not determine firewall status"
fi

# Show current app.json configuration
echo ""
echo "📱 Current Mobile App Configuration:"
APP_JSON_PATH="Monity-Mobile/frontend/Monity/app.json"
if [ -f "$APP_JSON_PATH" ]; then
    CURRENT_URL=$(grep -A 1 '"apiUrl"' "$APP_JSON_PATH" | grep -o 'http://[^"]*' || echo "not found")
    echo "   API URL in app.json: $CURRENT_URL"
    
    if [ "$CURRENT_URL" != "http://$IP:$PORT/api/v1" ]; then
        echo "   ⚠️  WARNING: app.json IP ($CURRENT_URL) doesn't match current IP ($IP)"
        echo "   → Update app.json with: http://$IP:$PORT/api/v1"
    fi
else
    echo "   ⚠️  Could not find app.json"
fi

# Recommendations
echo ""
echo "💡 Recommendations:"
echo "=================="

if [ "$FIREWALL_STATE" = "enabled" ]; then
    echo "1. Add Node.js to firewall allowed apps:"
    echo "   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node"
    echo "   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node"
    echo ""
fi

echo "2. Test from your mobile device:"
echo "   Open browser on mobile and go to: http://$IP:$PORT/health"
echo "   If this doesn't work, check router AP isolation settings"
echo ""

echo "3. Common fixes:"
echo "   - Disable AP Isolation in router settings"
echo "   - Ensure both devices are on the same network (not guest network)"
echo "   - Try using ngrok: ngrok http $PORT"
echo ""

echo "4. Quick test commands:"
echo "   Test from Mac: curl http://$IP:$PORT/health"
echo "   Test from mobile browser: http://$IP:$PORT/health"
echo ""

echo "📚 See NETWORK_TROUBLESHOOTING.md for detailed solutions"
echo ""

