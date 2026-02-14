# Vercel Deployment Fixes

## Issues Fixed

### 1. API Route 405 Error
**Problem**: API routes returning 405 Method Not Allowed

**Solution**: 
- Updated API routes to use ES6 imports instead of CommonJS
- Added proper CORS handling
- Made database connections optional (graceful degradation)
- Added error handling for missing modules

### 2. Favicon 404 Error
**Problem**: Missing favicon.ico file

**Solution**:
- Created `public/favicon.ico` (placeholder)
- Created `public/favicon.svg` (SVG favicon)
- Added favicon links in `_document.js`

## Changes Made

### 1. Updated `pages/api/leads/create.js`
- Converted to ES6 modules
- Added lazy loading for database modules
- Made database optional (works without DB for testing)
- Better error handling

### 2. Created `pages/_document.js`
- Added favicon links
- Proper HTML structure

### 3. Created `public/favicon.svg`
- SVG favicon for modern browsers

### 4. Updated `next.config.js`
- Added serverActions experimental feature

## Testing

After deploying these fixes:

1. **Test API Route:**
   ```bash
   curl -X POST https://dealer-deal.vercel.app/api/leads/create \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","phone":"1234567890"}'
   ```

2. **Check Favicon:**
   - Visit https://dealer-deal.vercel.app/favicon.ico
   - Should return 200 (not 404)

## Environment Variables Needed

Make sure these are set in Vercel:

```
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=dealer_leads
DB_USER=your-db-user
DB_PASSWORD=your-db-password
```

**Note**: The API will work without database (returns success but doesn't save), but for full functionality, you need PostgreSQL configured.

## Next Steps

1. **Push these changes:**
   ```bash
   git add .
   git commit -m "Fix API routes and add favicon for Vercel"
   git push origin main
   ```

2. **Vercel will auto-deploy** (if GitHub integration is set up)

3. **Or manually redeploy** in Vercel dashboard

4. **Test the form** on the live site

## Database Setup for Vercel

For full functionality, you need a PostgreSQL database. Options:

1. **Vercel Postgres** (Recommended)
   - Add in Vercel dashboard
   - Automatically configured

2. **External Database**
   - Use services like:
     - Supabase (free tier available)
     - Railway
     - Neon
     - AWS RDS

3. **Connection String Format:**
   ```
   postgresql://user:password@host:port/database
   ```

## Troubleshooting

### Still getting 405 errors?
- Check Vercel function logs
- Verify the route file exists at `pages/api/leads/create.js`
- Check Next.js version (should be 14+)

### Database connection issues?
- Verify environment variables are set
- Check database is accessible from Vercel
- Review connection string format
- Check firewall rules

### Favicon still 404?
- Clear browser cache
- Check `public/favicon.ico` exists
- Verify `_document.js` is in `pages/` directory
