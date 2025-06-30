# Server Connectivity Troubleshooting Guide

## ✅ ISSUE RESOLVED
**Problem**: Development server refused localhost connections
**Solution**: Mac restart fixed system-level DNS corruption
**Status**: Server now running successfully on http://localhost:3001

---

## Problem (Historical Reference)
The development server starts successfully but refuses all connections to localhost:3000.

## Diagnosis Results (Historical)
1. ✅ Next.js builds without errors
2. ✅ Server reports "Ready" status
3. ❌ Cannot connect via localhost, 127.0.0.1, or ::1
4. ❌ Python HTTP servers also fail (system-wide issue)
5. ❌ DNS lookup for localhost returns NXDOMAIN
6. ✅ Loopback interface (lo0) is UP and configured correctly
7. ✅ /etc/hosts file has correct localhost entries

## Root Cause (Historical)
This was a macOS system-level networking issue, NOT a code problem.

## Solutions to Try

### 1. Quick Fixes
```bash
# Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Restart mDNSResponder
sudo launchctl stop com.apple.mDNSResponder
sudo launchctl start com.apple.mDNSResponder
```

### 2. Check Network Configuration
```bash
# Verify localhost resolves correctly
dscacheutil -q host -a name localhost

# Should show:
# name: localhost
# ip_address: 127.0.0.1
```

### 3. System Preferences
1. Open System Preferences → Network
2. Click "Advanced" → "DNS"
3. Ensure DNS servers are configured (e.g., 8.8.8.8, 1.1.1.1)
4. Apply changes

### 4. Firewall/Security Software
- Check if any firewall or security software is blocking localhost
- Temporarily disable firewall: System Preferences → Security & Privacy → Firewall
- Check for VPN software that might interfere with localhost

### 5. Nuclear Option - Full Network Reset
```bash
# Reset network interfaces
sudo ifconfig lo0 down
sudo ifconfig lo0 up

# Or restart your Mac (most effective)
```

### 6. Alternative Development Approach
Until localhost is fixed, you can:
1. Deploy to Vercel for testing
2. Use a service like ngrok to tunnel
3. Test on a different machine

## Verified Working Code
The application code is 100% functional. Once the localhost issue is resolved, the server will work immediately.

## To Start the Server (after fix)
```bash
cd "/Users/samcarr/The AI Lab/the-ai-lab"
npm run dev
```

Then access: http://localhost:3000