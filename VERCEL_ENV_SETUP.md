# Vercel Environment Variables Setup

## Required Environment Variables

Add these to Vercel → Settings → Environment Variables:

### Supabase (Already Configured)
```
NEXT_PUBLIC_SUPABASE_URL=https://txawnoihhkbztvdecnat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YXdub2loaGtienR2ZGVjbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODE4NjgsImV4cCI6MjA4NjY1Nzg2OH0.3SA7QSAurmf5JCP8HEKWqHcC9JezUdNCwII93uLveQ0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YXdub2loaGtienR2ZGVjbmF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4MTg2OCwiZXhwIjoyMDg2NjU3ODY4fQ.DwdUlQQsZvd2FTtEW-L4vY0EKS_vcj9ey-b5tjD3arc
```

### Brave Search API (NEW - Required for Dealer Search)
```
BRAVE_SEARCH_API_KEY=BSAiy3SBLUXhmMKa5H5ssdSxBh_W_aQ
```

## How to Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project: `dealer-deal`
3. Go to: **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add each variable:
   - **Name**: `BRAVE_SEARCH_API_KEY`
   - **Value**: `BSAiy3SBLUXhmMKa5H5ssdSxBh_W_aQ`
   - **Environment**: Check all (Production, Preview, Development)
6. Click **"Save"**
7. **Redeploy** your application

## Verify Setup

After adding variables:
1. Redeploy: Vercel → Deployments → Click "Redeploy"
2. Test: Submit form with zipcode
3. Check logs: Vercel → Deployments → Functions → Check for dealer search activity

## Local Development

The key is already in `.env.local` for local development.

To test locally:
```bash
npm run dev
```

Then submit a form with a zipcode to test dealer search.

## Security Note

⚠️ **Never commit API keys to Git!**
- The key is in `.env.local` (which is gitignored)
- The key is NOT in the repository
- Only add to Vercel environment variables
