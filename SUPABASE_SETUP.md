# Supabase Setup Guide

## Why Supabase?

Supabase provides:
- ✅ **Built-in Authentication** - No need for custom JWT/auth code
- ✅ **PostgreSQL Database** - Same schema works!
- ✅ **Real-time Features** - Live updates
- ✅ **Auto-generated APIs** - REST and GraphQL
- ✅ **Storage** - File uploads
- ✅ **Row Level Security** - Database-level security
- ✅ **Better Next.js Integration** - Official client library

## Step 1: Create Supabase Project

1. Go to: https://supabase.com
2. Sign up / Sign in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `dealer-lead-system` (or your choice)
   - **Database Password**: (save this!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup

## Step 2: Get API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Set Environment Variables in Vercel

1. Go to: Vercel → Your Project → **Settings** → **Environment Variables**
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key - keep secret!)
```

**Important:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for anon key)
- `SUPABASE_SERVICE_ROLE_KEY` should NOT have `NEXT_PUBLIC_` prefix (server-only)

3. Check all environments (Production, Preview, Development)
4. Click **"Save"**

## Step 4: Run Database Schema in Supabase

1. Go to Supabase dashboard → **SQL Editor**
2. Copy contents of `database/run-in-neon.sql`
3. Paste into SQL Editor
4. Click **"Run"**
5. Verify tables were created:
   - Go to **Table Editor** → You should see: `dealers`, `leads`, `vehicles`, `users`, `dealer_accounts`, etc.

## Step 5: Enable Row Level Security (RLS)

Supabase uses Row Level Security for database access. We need to set up policies:

### For `users` table:
```sql
-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = user_id);
```

### For `dealer_accounts` table:
```sql
-- Allow dealers to read their own data
CREATE POLICY "Dealers can read own data" ON dealer_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Allow dealers to update their own data
CREATE POLICY "Dealers can update own data" ON dealer_accounts
  FOR UPDATE USING (auth.uid() = user_id);
```

### For `leads` table:
```sql
-- Allow users to read their own leads (by email match)
CREATE POLICY "Users can read own leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.email = leads.email
    )
  );

-- Allow dealers to read assigned leads
CREATE POLICY "Dealers can read assigned leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dealer_accounts da
      JOIN dealers d ON da.dealer_id = d.id
      WHERE da.user_id = auth.uid()
      AND d.id = leads.dealer_id
    )
  );

-- Allow public to create leads (for form submission)
CREATE POLICY "Public can create leads" ON leads
  FOR INSERT WITH CHECK (true);
```

### For `vehicles` table:
```sql
-- Allow public to read available vehicles
CREATE POLICY "Public can read available vehicles" ON vehicles
  FOR SELECT USING (status = 'available');

-- Allow dealers to manage their own vehicles
CREATE POLICY "Dealers can manage own vehicles" ON vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dealer_accounts da
      WHERE da.user_id = auth.uid()
      AND da.dealer_id = vehicles.dealer_id
    )
  );
```

**Note:** You can run all these policies in the SQL Editor, or set them up via the Supabase dashboard → **Authentication** → **Policies**.

## Step 6: Update Database Schema

The schema needs a small update to link with Supabase Auth:

```sql
-- Add user_id column to link with Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE dealer_accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_dealer_accounts_user_id ON dealer_accounts(user_id);
```

## Step 7: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 8: Redeploy

1. Push changes to GitHub
2. Vercel will auto-deploy
3. Or manually redeploy in Vercel dashboard

## Step 9: Test

1. Visit: https://your-app.vercel.app/signup
2. Create an account
3. Sign in
4. Check dashboard

## Migration from Custom Auth

The code has been updated to use Supabase Auth. Key changes:

- ✅ No more `bcryptjs` or `jsonwebtoken`
- ✅ Uses Supabase Auth for signup/login
- ✅ Session management handled by Supabase
- ✅ Database queries use Supabase client
- ✅ RLS policies for security

## Troubleshooting

### "Missing Supabase environment variables"
- Check Vercel environment variables are set
- Verify variable names are correct
- Redeploy after adding variables

### "Row Level Security policy violation"
- Check RLS policies are set up correctly
- Verify user is authenticated
- Check user has correct permissions

### "User not found in database"
- Make sure `user_id` column exists in `users`/`dealer_accounts` tables
- Verify user was created in both Supabase Auth and database
- Check signup process completed successfully

## Benefits of Supabase

1. **Less Code** - No custom auth logic
2. **More Secure** - Built-in security features
3. **Real-time** - Live updates out of the box
4. **Scalable** - Handles scaling automatically
5. **Free Tier** - Generous free plan
6. **Better DX** - Great developer experience

## Next Steps

- Set up email templates in Supabase
- Configure OAuth providers (Google, etc.)
- Enable real-time subscriptions
- Set up storage buckets for vehicle images
