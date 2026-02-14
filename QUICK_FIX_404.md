# Quick Fix for 404 Errors

## Immediate Steps

1. **Stop the dev server** (Ctrl+C in terminal)

2. **Delete `.next` folder**:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. **Create `.env.local` file** (copy from `env.example`):
   ```powershell
   Copy-Item env.example .env.local
   ```
   Then edit `.env.local` and add your Supabase credentials.

4. **Restart dev server**:
   ```bash
   npm run dev
   ```

5. **Hard refresh browser**:
   - Press `Ctrl + Shift + R` (Windows)
   - Or `Ctrl + F5`

## If Still Not Working

### Check Browser Console
Open DevTools (F12) and check:
- **Console tab** - Look for specific error messages
- **Network tab** - See which files are returning 404

### Verify Dev Server is Running
- Check terminal for "Ready on http://localhost:3000"
- Visit http://localhost:3000 directly
- Check for any error messages in terminal

### Common Issues

**Port 3000 already in use:**
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Missing environment variables:**
- Make sure `.env.local` exists
- Check it has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after adding env vars

**Browser cache:**
- Clear browser cache completely
- Try incognito/private mode
- Try different browser

## Still Having Issues?

1. Check `pages/_app.js` exists and is valid
2. Check `styles/globals.css` exists
3. Verify all dependencies installed: `npm install`
4. Try production build: `npm run build && npm start`
