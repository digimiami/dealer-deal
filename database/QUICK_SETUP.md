# Quick Database Setup for Vercel

## 🚀 Fastest Setup (5 minutes)

### Step 1: Create Database in Vercel

1. Go to your Vercel project dashboard
2. Click **"Storage"** tab
3. Click **"Create database"**
4. Choose **Neon** (or Supabase)
5. Click **"Create"**
6. Follow the wizard (choose free tier)

### Step 2: Get Connection String

After creation, Neon/Supabase will provide:
- **Connection String** (looks like: `postgresql://user:pass@host/dbname`)

### Step 3: Add to Vercel Environment Variables

1. Go to: Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the connection string from Step 2
   - **Environment**: Production, Preview, Development (check all)
3. Click **"Save"**

### Step 4: Run Migrations

**Option A: Using Neon SQL Editor (Easiest)**

1. Go to Neon dashboard
2. Click **"SQL Editor"**
3. Copy and paste contents of `database/schema.sql`
4. Click **"Run"**
5. Copy and paste contents of `database/migrations/002_vehicles_and_appointments.sql`
6. Click **"Run"**

**Option B: Using psql**

```bash
# Get connection string from Neon dashboard
psql "your-connection-string-here"

# Then in psql:
\i database/schema.sql
\i database/migrations/002_vehicles_and_appointments.sql
```

### Step 5: Seed Sample Data

In Neon SQL Editor:

1. Copy contents of `database/seed.sql`
2. Paste and run
3. Copy contents of `database/seed-vehicles.sql`
4. Paste and run

**Note**: Update dealer IDs in seed files if needed.

### Step 6: Redeploy

1. Go to Vercel → Deployments
2. Click **"Redeploy"** on latest deployment
3. Or push a commit to trigger auto-deploy

### Step 7: Test

1. Visit: https://dealer-deal.vercel.app
2. Submit the form - should work!
3. Visit `/vehicles` - should show vehicles!

## ✅ Done!

Your database is now connected and working!

## Troubleshooting

**"Database not configured" message?**
- Check environment variables are set
- Verify `DATABASE_URL` is correct
- Make sure you redeployed after adding env vars

**No vehicles showing?**
- Check if migrations ran successfully
- Verify seed data was inserted
- Check Neon dashboard → Tables → vehicles

**Connection errors?**
- Verify connection string format
- Check SSL is enabled (required for Neon)
- Verify database is accessible

## Which Database to Choose?

- **Neon**: Best for serverless, free tier, easy setup ⭐
- **Supabase**: Includes auth, real-time, free tier
- **Prisma Postgres**: Optimized for Prisma
- **AWS**: Enterprise-grade, more complex

**Recommendation**: Start with **Neon** - it's the easiest and works perfectly!
