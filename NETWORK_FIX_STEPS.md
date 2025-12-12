# Network Connection Fix - Step by Step

## The Problem

Your phone cannot reach the backend at `http://192.168.18.86:3001`. The error happens in ~6ms, which means the connection is being refused immediately.

## Root Cause

The app is trying to connect but the network request fails. This is **NOT a code issue** - it's a network connectivity problem.

## Solutions (Try in Order)

### Solution 1: Verify Same Network

**On your Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Should show: 192.168.18.86
```

**On your iPhone:**
1. Go to Settings > Wi-Fi
2. Tap the (i) icon next to your network
3. Check the IP address - it should start with `192.168.18.x`
4. If it's different (like `192.168.1.x` or `10.0.x.x`), you're on a different network

**Fix:** Connect both devices to the **exact same WiFi network** (not guest network)

### Solution 2: Test Connection from Phone Browser

1. On your iPhone, open Safari
2. Navigate to: `http://192.168.18.86:3001/api/v1/health` (or any endpoint)
3. If this **doesn't work**, the problem is network/router, not the app
4. If this **works**, the problem is the app configuration

### Solution 3: Rebuild the App

The app might have the old URL cached. Rebuild it:

```bash
cd Monity-Mobile/frontend/Monity
npx expo run:ios
```

This will rebuild the app with the current `app.json` configuration.

### Solution 4: Use Tunnel Mode for Backend (Alternative)

If LAN doesn't work, you can use ngrok to tunnel your backend:

1. **Install ngrok:**
   ```bash
   brew install ngrok
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 3001
   ```

3. **Update app.json** with the ngrok URL:
   ```json
   "apiUrl": "https://YOUR-NGROK-URL.ngrok.io/api/v1"
   ```

4. **Rebuild the app:**
   ```bash
   npx expo run:ios
   ```

### Solution 5: Check Router AP Isolation

Many routers have "AP Isolation" or "Client Isolation" enabled, which prevents devices from talking to each other.

1. Access your router admin (usually `192.168.1.1` or `192.168.0.1`)
2. Look for "AP Isolation", "Client Isolation", or "Wireless Isolation"
3. **Disable** this feature
4. Save and reboot router

### Solution 6: Use Mobile Hotspot

1. Turn on Personal Hotspot on your iPhone
2. Connect your Mac to the iPhone's hotspot
3. Get the new IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
4. Update `app.json` with the new IP
5. Rebuild the app

## Quick Diagnostic Commands

**Check if backend is running:**
```bash
lsof -ti:3001 && echo "✅ Backend running" || echo "❌ Backend not running"
```

**Test backend from Mac:**
```bash
curl http://192.168.18.86:3001/api/v1/auth/profile
# Should return 401 (unauthorized) - this is GOOD, means backend is reachable
```

**Get current Mac IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```

## Most Likely Fix

**90% of the time, this is one of these:**

1. **Phone and Mac on different networks** → Connect to same WiFi
2. **Router AP Isolation enabled** → Disable in router settings
3. **App needs rebuild** → Run `npx expo run:ios` to rebuild with new URL

## After Fixing

Once you fix the network issue:
1. The app should connect successfully
2. You'll see successful API requests in the logs
3. The "Sem conexão com a internet" error will disappear

