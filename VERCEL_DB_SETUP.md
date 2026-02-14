# Vercel Database Setup Guide

## Recommended Database Options

For this application, you need **PostgreSQL**. Here are the best options from Vercel:

### 🥇 Best Options (Recommended)

1. **Neon** (Serverless Postgres) ⭐ **RECOMMENDED**
   - Click "Create" button
   - Free tier available
   - Serverless, scales automatically
   - Easy setup
   - Perfect for Next.js applications

2. **Supabase** (Postgres backend)
   - Click "Create" button
   - Free tier available
   - Includes authentication and real-time features
   - Great developer experience

3. **Prisma Postgres** (Instant Serverless Postgres)
   - Click "Create" button
   - Optimized for Prisma (though we're using raw SQL)
   - Fast setup

### Alternative Options

- **AWS** - More complex setup, but enterprise-grade
- **Turso** - SQLite-based (would require schema changes)
- **MongoDB Atlas** - NoSQL (would require complete rewrite)

## Step-by-Step Setup (Using Neon - Recommended)

### 1. Create Neon Database

1. In Vercel dashboard, go to your project
2. Click "Storage" tab
3. Click "Create database"
4. Select **Neon**
5. Click "Create"
6. Follow the setup wizard:
   - Choose a name for your database
   - Select a region (closest to your users)
   - Choose a plan (Free tier is fine to start)

### 2. Get Connection Details

After creating, Vercel will show you:
- Connection string (or you can get it from Neon dashboard)
- Database name
- User
- Password
- Host
- Port

### 3. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

Add these variables:

```
DB_HOST=your-neon-host.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=your-username
DB_PASSWORD=your-password
```

**OR** if Neon provides a connection string:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

If using `DATABASE_URL`, you'll need to update `lib/db.js` to parse it.

### 4. Update Database Connection (if using DATABASE_URL)

If Neon provides a `DATABASE_URL` instead of separate variables, update `lib/db.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  // Fallback to individual variables
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dealer_leads',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 5. Run Migrations

You have two options:

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migrations (you'll need to create a script)
vercel env pull .env.local
npm run migrate
```

**Option B: Using Neon Dashboard**
1. Go to Neon dashboard
2. Open SQL Editor
3. Copy contents of `database/schema.sql`
4. Paste and run
5. Then run `database/migrations/002_vehicles_and_appointments.sql`

**Option C: Using psql (if you have it installed)**
```bash
# Get connection string from Neon dashboard
psql "your-connection-string"

# Then run:
\i database/schema.sql
\i database/migrations/002_vehicles_and_appointments.sql
```

### 6. Seed Initial Data

After migrations, seed sample data:

```sql
-- Run in Neon SQL Editor or via psql
-- First, update dealer IDs in seed files to match your actual dealers
\i database/seed.sql
\i database/seed-vehicles.sql
```

Or manually:
1. Go to Neon SQL Editor
2. Copy contents of `database/seed.sql`
3. Paste and run
4. Repeat for `database/seed-vehicles.sql`

### 7. Redeploy Application

After setting environment variables:
1. Go to Vercel dashboard
2. Your project → Deployments
3. Click "Redeploy" on the latest deployment
4. Or push a new commit to trigger auto-deploy

## Alternative: Supabase Setup

If you choose Supabase instead:

1. Click "Create" on Supabase
2. Follow setup wizard
3. Get connection details from Supabase dashboard
4. Set environment variables (same as above)
5. Run migrations in Supabase SQL Editor

## Testing the Connection

After setup, test by:
1. Visiting your site: https://dealer-deal.vercel.app
2. Submitting the lead form - should save to database
3. Visiting `/vehicles` - should show vehicles (if seeded)

## Troubleshooting

### Connection Errors
- Verify environment variables are set correctly
- Check that SSL is enabled (Neon requires SSL)
- Verify database is accessible from Vercel

### Migration Errors
- Make sure you run `schema.sql` first
- Then run migration files in order
- Check for syntax errors in SQL

### No Vehicles Showing
- Verify vehicles table exists: `SELECT * FROM vehicles LIMIT 1;`
- Check if seed data was inserted
- Verify environment variables are correct

## Quick Start Checklist

- [ ] Create Neon (or Supabase) database in Vercel
- [ ] Copy connection details
- [ ] Set environment variables in Vercel
- [ ] Run database migrations
- [ ] Seed sample data
- [ ] Redeploy application
- [ ] Test form submission
- [ ] Test vehicle search

## Need Help?

- Check Vercel logs: Project → Deployments → Click deployment → Functions
- Check Neon logs: Neon dashboard → Logs
- Verify environment variables: Vercel → Settings → Environment Variables
