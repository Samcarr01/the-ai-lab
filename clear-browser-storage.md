# Fix Corrupted Browser Storage

## Problem
You're seeing these errors:
```
Multiple GoTrueClient instances detected
Failed to parse cookie string: JSON Parse error: Unexpected identifier "base64"
```

## Solution: Clear Browser Storage

### Method 1: Chrome DevTools (Recommended)
1. **Open DevTools**: Press `F12` or `Cmd+Option+I`
2. **Go to Application Tab**
3. **Clear Storage**:
   - **Local Storage** → `localhost:3000` → Delete all entries
   - **Session Storage** → `localhost:3000` → Delete all entries  
   - **Cookies** → `localhost:3000` → Delete all cookies
4. **Refresh Page**: `Cmd+R` or `F5`

### Method 2: Chrome Settings
1. **Open Chrome Settings** → Privacy and Security → Site Settings
2. **View permissions and data stored across sites**
3. **Search for "localhost"**
4. **Click on localhost:3000** → **Delete data**

### Method 3: Incognito Mode
1. **Open Incognito Window**: `Cmd+Shift+N`
2. **Go to** `http://localhost:3000/plan`
3. **Test buttons** - should work without storage conflicts

## After Clearing Storage
1. **Login again** to your account
2. **Test plan page buttons** - they should work without page reloads
3. **Check console** - no more cookie parsing errors

## Prevention
- **Single Supabase Client**: Code has been updated to use consistent client creation
- **Proper Session Management**: Authentication flows now use standardized methods