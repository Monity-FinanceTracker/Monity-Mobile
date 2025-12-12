# 🔧 Network Troubleshooting Guide

## Problem: Mobile app cannot connect to backend server

Error: `"Sem conexão com a internet. Verifique sua rede e tente novamente."`

Even though both devices are on the same network, the mobile app cannot reach the backend at `http://192.168.1.182:3001`.

---

## ✅ Quick Checks

### 1. Verify Both Devices Are on the Same Network

**On your Mac:**
```bash
# Check your Mac's IP and network
ifconfig | grep "inet " | grep -v 127.0.0.1
# Should show: 192.168.1.182
```

**On your mobile device:**
- Go to WiFi settings
- Check the connected network name
- Verify it's the **exact same network** as your Mac (not a guest network)

### 2. Test Server Accessibility

**From your Mac:**
```bash
# Test if server is reachable
curl http://192.168.1.182:3001/health
# Should return: {"status":"healthy",...}
```

**From your mobile device:**
- Open a browser
- Try: `http://192.168.1.182:3001/health`
- If this doesn't work, the problem is network connectivity, not the app

---

## 🔍 Common Issues & Solutions

### Issue 1: Router AP Isolation (Most Common)

**Problem:** Many routers have "AP Isolation" or "Client Isolation" enabled, which prevents devices from communicating with each other.

**Solution:**
1. Access your router admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Look for "AP Isolation", "Client Isolation", or "Wireless Isolation"
3. **Disable** this feature
4. Save and reboot router if needed

### Issue 2: Guest Network

**Problem:** Mobile device is connected to a guest network, which is isolated from the main network.

**Solution:**
- Connect mobile device to the **main WiFi network** (not guest network)

### Issue 3: macOS Firewall

**Problem:** macOS firewall is blocking incoming connections.

**Solution:**
```bash
# Check firewall status
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If enabled, add Node.js to allowed apps
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Issue 4: IP Address Changed

**Problem:** Your Mac's IP address changed after restart or network reconnection.

**Solution:**
1. Check current IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Update `app.json` with the new IP:
   ```json
   "apiUrl": "http://NEW_IP_HERE:3001/api/v1"
   ```
3. Restart Expo/React Native app

### Issue 5: Different Network Segments

**Problem:** Devices are on different subnets (e.g., `192.168.1.x` vs `192.168.0.x`).

**Solution:**
- Ensure both devices get IPs from the same subnet
- Check router DHCP settings

---

## 🚀 Alternative Solutions

### Solution 1: Use ngrok (Easiest for Development)

ngrok creates a public URL that tunnels to your local server.

1. **Install ngrok:**
   ```bash
   brew install ngrok
   # or download from https://ngrok.com/
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 3001
   ```

3. **Update app.json with the ngrok URL:**
   ```json
   "apiUrl": "https://YOUR-NGROK-URL.ngrok.io/api/v1"
   ```

4. **Restart your mobile app**

**Pros:** Works regardless of network settings
**Cons:** Requires internet connection, URL changes each time (unless paid plan)

### Solution 2: Use Expo Dev Tunnel

If using Expo, you can use Expo's development tunnel.

1. **Start Expo with tunnel:**
   ```bash
   npx expo start --tunnel
   ```

2. **Update backend CORS to allow Expo tunnel origins**

### Solution 3: Use Localhost with ADB (Android Only)

For Android emulators, you can use `10.0.2.2` to access the host machine.

**Update app.json:**
```json
"apiUrl": "http://10.0.2.2:3001/api/v1"
```

### Solution 4: Use Your Mac's Hostname

Sometimes hostnames work better than IPs:

1. **Find your Mac's hostname:**
   ```bash
   hostname
   # e.g., "Leos-MacBook.local"
   ```

2. **Update app.json:**
   ```json
   "apiUrl": "http://Leos-MacBook.local:3001/api/v1"
   ```

**Note:** This requires mDNS/Bonjour to be working on both devices.

---

## 🔧 Testing Connectivity

### Test from Mobile Browser

1. Make sure your mobile device and Mac are on the same WiFi
2. Open mobile browser
3. Navigate to: `http://192.168.1.182:3001/health`
4. If this works, the network is fine - check app configuration
5. If this doesn't work, it's a network/router issue

### Test with Network Scanner

Use a network scanner app on your mobile to verify:
- Your Mac is visible on the network
- The IP address is correct
- Port 3001 is accessible

---

## 📱 App Configuration

### Current Configuration

In `Monity-Mobile/frontend/Monity/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.182:3001/api/v1"
    }
  }
}
```

### After Changing Configuration

1. **Stop the Expo/React Native app**
2. **Clear cache:**
   ```bash
   npx expo start -c
   ```
3. **Rebuild if necessary**

---

## 🎯 Recommended Solution for Development

**For easiest development experience:**

1. **Disable AP Isolation on your router** (if possible)
2. **Use ngrok for consistent URLs** (or Expo tunnel)
3. **Or use a static IP** for your Mac in router settings

**For production:**
- Use a deployed backend URL (Railway, Heroku, etc.)
- Never use local IPs in production builds

---

## 🐛 Debug Steps

1. ✅ Server is running and accessible locally
2. ✅ Firewall is not blocking (or Node.js is allowed)
3. ✅ Both devices on same network
4. ✅ Test from mobile browser - does it work?
5. ✅ Check router AP isolation settings
6. ✅ Try ngrok as a workaround

---

## 💡 Quick Fix Command

If your IP changed, quickly update it:

```bash
# Get current IP
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

# Update app.json (requires manual edit or script)
echo "Current IP: $IP"
echo "Update app.json with: http://$IP:3001/api/v1"
```

---

## 📞 Still Not Working?

1. Try ngrok (works around all network issues)
2. Check router logs for blocked connections
3. Try a different WiFi network
4. Use mobile hotspot to test (connect Mac to phone's hotspot)

---

**Last Updated:** December 2025

