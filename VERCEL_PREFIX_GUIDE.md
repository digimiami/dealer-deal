# Vercel Database Custom Prefix Guide

## What is Custom Prefix?

When you create a database in Vercel, it automatically generates environment variables for the connection. The **Custom Prefix** lets you customize the variable names.

## Default Behavior

If you leave the prefix empty or use the default, Vercel creates variables like:
- `POSTGRES_URL` (connection string)
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

## Custom Prefix Examples

### Example 1: Prefix = "STORAGE"
Vercel creates:
- `STORAGE_URL`
- `STORAGE_HOST`
- `STORAGE_PORT`
- `STORAGE_DATABASE`
- `STORAGE_USER`
- `STORAGE_PASSWORD`

### Example 2: Prefix = "NEON"
Vercel creates:
- `NEON_URL`
- `NEON_HOST`
- `NEON_PORT`
- `NEON_DATABASE`
- `NEON_USER`
- `NEON_PASSWORD`

### Example 3: Prefix = "DB" (or empty)
Vercel creates:
- `DB_URL` (or `POSTGRES_URL` by default)
- `DB_HOST`
- `DB_PORT`
- etc.

## Recommendation

### ✅ Best Practice: Use Default or Simple Prefix

**Recommended prefixes:**
- **Empty/Default** → Creates `POSTGRES_URL` (works automatically)
- **"POSTGRES"** → Creates `POSTGRES_URL` (explicit, works automatically)
- **"DATABASE"** → Creates `DATABASE_URL` (standard name, works automatically)

**Avoid:**
- Very long prefixes
- Special characters
- Spaces

## How Our Code Handles It

The updated `lib/db.js` automatically detects and uses:

1. **Standard connection string**: `DATABASE_URL`
2. **Vercel auto-generated URLs**: 
   - `POSTGRES_URL`
   - `NEON_URL`
   - `SUPABASE_URL`
   - `STORAGE_URL`
   - `DATABASE_URL`
   - `PRISMA_URL`
3. **Any custom prefix**: If you use a custom prefix like `MYDB`, it will look for `MYDB_URL`
4. **Individual variables**: Falls back to `DB_HOST`, `DB_PORT`, etc.

## Setup Instructions

### Option 1: Use Default (Recommended)

1. Create database in Vercel
2. **Leave Custom Prefix empty** or use "POSTGRES"
3. Vercel creates `POSTGRES_URL` automatically
4. **No additional setup needed!** Our code will detect it automatically

### Option 2: Use Custom Prefix

1. Create database in Vercel
2. Enter custom prefix (e.g., "STORAGE", "NEON", "MYDB")
3. Vercel creates `{PREFIX}_URL` automatically
4. Our code will automatically detect and use it

### Option 3: Manual Setup

If you want to use a different name:

1. Create database in Vercel
2. Copy the connection string from the generated variable (e.g., `STORAGE_URL`)
3. Go to Environment Variables
4. Create new variable: `DATABASE_URL`
5. Paste the connection string value
6. Our code will use `DATABASE_URL` (highest priority)

## Verification

After setup, check Vercel Environment Variables:

1. Go to: Project → Settings → Environment Variables
2. You should see variables like:
   - `POSTGRES_URL` (or your custom prefix)
   - `POSTGRES_HOST`
   - etc.

## Testing

After setting up:

1. Redeploy your application
2. Check Vercel function logs
3. You should see: "Database connected" in logs
4. Test the form - should save to database
5. Test vehicle search - should show vehicles

## Troubleshooting

### "Database not configured" error?

1. Check Environment Variables in Vercel
2. Verify the `_URL` variable exists
3. Check the variable name matches what our code looks for
4. If using custom prefix, verify it's one of: POSTGRES, NEON, SUPABASE, STORAGE, DATABASE, PRISMA

### Custom prefix not working?

If you used a very custom prefix (not in our list), you can:

1. **Option A**: Create `DATABASE_URL` manually and copy the value from your custom variable
2. **Option B**: Update `lib/db.js` to include your custom prefix in the prefixes array

## Summary

- **Default/Empty prefix** = `POSTGRES_URL` ✅ (works automatically)
- **"POSTGRES" prefix** = `POSTGRES_URL` ✅ (works automatically)
- **"DATABASE" prefix** = `DATABASE_URL` ✅ (works automatically)
- **"STORAGE" prefix** = `STORAGE_URL` ✅ (works automatically)
- **Any other prefix** = `{PREFIX}_URL` (may need manual `DATABASE_URL` setup)

**Recommendation**: Use default or "POSTGRES" - it works automatically with our code!
