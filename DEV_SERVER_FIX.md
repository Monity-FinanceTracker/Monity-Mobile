# Fix Development Server Connection - Development Build

## The Problem

When using **expo-dev-client** (development builds), the app caches the dev server URL. Even if you restart the server, the app might still try to connect to the old URL.

## Solution 1: Use Dev Menu to Set URL Manually (FASTEST)

1. **Start Expo server** (already running in tunnel mode):
   ```bash
   cd Monity-Mobile/frontend/Monity
   npx expo start --tunnel --clear
   ```

2. **On your iPhone:**
   - Shake your device (or press `Cmd + D` in simulator)
   - Tap **"Enter URL manually"** or **"Configure Bundler"**
   - Enter the URL shown in your terminal (should be something like `exp://...` or `http://...`)
   - Or scan the QR code if available

3. **The app should reload and connect**

## Solution 2: Rebuild the Development Build

If the dev menu doesn't work, rebuild the app:

```bash
cd Monity-Mobile/frontend/Monity

# For iOS
npx expo run:ios

# This will rebuild and pick up the new dev server URL
```

## Solution 3: Use Tunnel Mode (Current Setup)

Tunnel mode is already running. This should work across any network.

**To check the tunnel URL:**
- Look at the terminal where `expo start --tunnel` is running
- You should see a URL like: `exp://aav5-bg-leo-stuart-8081.exp.direct:80`
- Use this URL in the dev menu

## Solution 4: Clear App Data and Reinstall

If nothing works:

1. **Delete the app from your iPhone**
2. **Rebuild and reinstall:**
   ```bash
   cd Monity-Mobile/frontend/Monity
   npx expo run:ios
   ```

## Quick Commands

**Start server (tunnel mode - works everywhere):**
```bash
cd Monity-Mobile/frontend/Monity
npx expo start --tunnel --clear
```

**Start server (LAN mode - same WiFi only):**
```bash
cd Monity-Mobile/frontend/Monity
npx expo start --lan --clear
```

**Check if server is running:**
```bash
lsof -ti:8081 && echo "Running" || echo "Not running"
```

## Why This Happens

Development builds (expo-dev-client) store the dev server URL when they're built. When you change the server URL or restart it, the app doesn't automatically know about the change. You need to either:
- Use the dev menu to update it manually
- Rebuild the app
- Use tunnel mode which provides a stable URL

## Current Status

✅ Expo server is running in **tunnel mode**
✅ Server should be accessible from any network
✅ Use the dev menu on your phone to connect

