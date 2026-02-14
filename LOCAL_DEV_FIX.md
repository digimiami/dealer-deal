# Fixing 404 Errors in Local Development

## Common Causes

1. **Corrupted `.next` directory** - Build cache issues
2. **Port conflicts** - Another process using port 3000
3. **Missing dependencies** - `node_modules` not installed
4. **Environment variables** - Missing Supabase config

## Quick Fix Steps

### Step 1: Clean Build Cache
```powershell
# Windows PowerShell
Remove-Item -Recurse -Force .next
```

Or manually delete the `.next` folder.

### Step 2: Reinstall Dependencies (if needed)
```bash
npm install
```

### Step 3: Create `.env.local` File
Copy `env.example` to `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://txawnoihhkbztvdecnat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Restart Dev Server
```bash
npm run dev
```

## If Still Getting 404 Errors

### Check Port 3000
```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000
```

If something is using it, either:
- Kill that process
- Use a different port: `npm run dev -- -p 3001`

### Clear Browser Cache
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache completely

### Check Console for Specific Errors
- Open browser DevTools (F12)
- Check Console tab for specific error messages
- Check Network tab to see which files are 404

### Verify File Structure
Make sure these files exist:
- `pages/_app.js`
- `pages/_document.js`
- `styles/globals.css`

## Alternative: Use Production Build

If dev server keeps having issues:

```bash
npm run build
npm start
```

This runs the production build locally on port 3000.

## Common Issues

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

### "Cannot find module" errors
- Check file paths are correct
- Verify imports use correct paths

### Supabase connection errors
- Verify `.env.local` has correct Supabase credentials
- Check Supabase project is active
- Verify API keys are correct
