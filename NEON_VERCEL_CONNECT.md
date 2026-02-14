# Connect Neon Database to Vercel

## Your Neon Database Info
- **Neon ID**: `restless-thunder-79467640`
- **Status**: Created but not connected to Vercel

## Step-by-Step Connection

### Option 1: Connect via Vercel Dashboard (Recommended)

1. **Go to Vercel Project Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `dealer-deal` project

2. **Add Database Integration**
   - Go to: **Settings** → **Storage** (or **Integrations**)
   - Click **"Connect Database"** or **"Add Integration"**
   - Search for **"Neon"**
   - Click **"Connect"** or **"Add"**

3. **Link Existing Neon Database**
   - Select **"Link existing database"**
   - Enter your Neon project details:
     - Neon Project ID: `restless-thunder-79467640`
     - Or select from your Neon projects
   - Vercel will automatically create environment variables

### Option 2: Manual Connection String Setup

If Option 1 doesn't work, set up manually:

1. **Get Connection String from Neon**
   - Go to: https://console.neon.tech
   - Select your project: `restless-thunder-79467640`
   - Go to **"Connection Details"** or **"Dashboard"**
   - Copy the **Connection String**
   - Format: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

2. **Add to Vercel Environment Variables**
   - Go to: Vercel Project → **Settings** → **Environment Variables**
   - Click **"Add New"**
   - **Name**: `DATABASE_URL`
   - **Value**: Paste your Neon connection string
   - **Environment**: Check all (Production, Preview, Development)
   - Click **"Save"**

3. **Alternative: Use POSTGRES_URL**
   - If Vercel creates `POSTGRES_URL` automatically, that works too
   - Our code detects it automatically

### Option 3: Use Neon Dashboard Directly

1. **Get Connection Details from Neon**
   - Visit: https://console.neon.tech
   - Login and select project `restless-thunder-79467640`
   - Go to **"Connection Details"**
   - You'll see:
     - Host
     - Database name
     - User
     - Password
     - Port (usually 5432)

2. **Set Individual Variables in Vercel**
   - Go to: Vercel → Settings → Environment Variables
   - Add these variables:
     ```
     DB_HOST=your-host.neon.tech
     DB_PORT=5432
     DB_NAME=neondb (or your database name)
     DB_USER=your-username
     DB_PASSWORD=your-password
     DB_SSL=true
     ```

## Verify Connection

After setting up:

1. **Redeploy Application**
   - Go to: Vercel → Deployments
   - Click **"Redeploy"** on latest deployment
   - Or push a new commit

2. **Check Logs**
   - Go to: Vercel → Deployments → Click deployment → Functions
   - Look for: "Database connected" in logs
   - If you see errors, check connection string format

3. **Test the Application**
   - Visit: https://dealer-deal.vercel.app
   - Submit the form - should save to database
   - Check `/vehicles` - should show vehicles (after seeding)

## Run Migrations

After connecting, set up your database schema:

1. **Go to Neon SQL Editor**
   - Visit: https://console.neon.tech
   - Select your project
   - Click **"SQL Editor"**

2. **Run Schema**
   - Copy contents of `database/schema.sql`
   - Paste in SQL Editor
   - Click **"Run"**

3. **Run Migrations**
   - Copy contents of `database/migrations/002_vehicles_and_appointments.sql`
   - Paste and run

4. **Seed Data**
   - Copy contents of `database/seed.sql`
   - Paste and run
   - Copy contents of `database/seed-vehicles.sql`
   - Paste and run (update dealer IDs if needed)

## Troubleshooting

### "Database not configured" error?
- Verify `DATABASE_URL` or `POSTGRES_URL` is set in Vercel
- Check environment variables are saved
- Redeploy after adding variables

### Connection timeout?
- Verify SSL is enabled (`?sslmode=require` in connection string)
- Check firewall settings in Neon
- Verify host/port are correct

### Authentication failed?
- Check username/password are correct
- Verify database name matches
- Try resetting password in Neon dashboard

## Quick Checklist

- [ ] Neon database created (✅ Done: `restless-thunder-79467640`)
- [ ] Connection string obtained from Neon
- [ ] Environment variable added to Vercel (`DATABASE_URL` or `POSTGRES_URL`)
- [ ] Application redeployed
- [ ] Database schema run (migrations)
- [ ] Sample data seeded
- [ ] Tested form submission
- [ ] Tested vehicle search

## Next Steps

1. Get connection string from Neon
2. Add to Vercel environment variables
3. Redeploy
4. Run migrations
5. Test!
