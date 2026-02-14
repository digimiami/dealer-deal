# Fix 404 on Root Path (http://localhost:3000/)

## The Problem
Getting 404 errors when accessing `http://localhost:3000/` even though the dev server is running.

## Solution Steps

### 1. Stop All Node Processes
```powershell
# Find all node processes
Get-Process -Name node | Stop-Process -Force
```

Or manually:
- Press `Ctrl + C` in all terminal windows running `npm run dev`
- Or use Task Manager to kill Node processes

### 2. Clean Build Cache
```powershell
Remove-Item -Recurse -Force .next
```

### 3. Verify Files Exist
Make sure these files exist:
- `pages/index.js` ✅
- `pages/_app.js` ✅
- `pages/_document.js` ✅
- `styles/globals.css` ✅

### 4. Check .env.local
Make sure `.env.local` exists with Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://txawnoihhkbztvdecnat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### 5. Restart Dev Server
```bash
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### 6. Clear Browser Cache
- **Hard Refresh**: `Ctrl + Shift + R` (Windows) or `Ctrl + F5`
- **Or**: Clear browser cache completely
- **Or**: Try incognito/private mode

### 7. Check Terminal Output
Look for errors in the terminal where `npm run dev` is running:
- Should see "Compiled successfully"
- Should see "Ready on http://localhost:3000"
- If you see errors, fix them first

## Common Issues

### Port Already in Use
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /F /PID <PID>
```

### Missing Dependencies
```bash
npm install
```

### Build Errors
```bash
npm run build
```
Check for any build errors and fix them.

### Browser Extension Interference
The `(index):5` errors with `check` function suggest a browser extension might be interfering. Try:
- Disable browser extensions
- Use incognito mode
- Try a different browser

## Verify It's Working

1. Open http://localhost:3000 in browser
2. Should see the landing page (not 404)
3. Check browser console - should have no 404 errors
4. Check Network tab - all requests should be 200 OK

## Still Not Working?

1. Check terminal for specific error messages
2. Verify Next.js version: `npm list next`
3. Try production build: `npm run build && npm start`
4. Check if there are any syntax errors in `pages/index.js`
