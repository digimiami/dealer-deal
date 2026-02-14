const { Pool } = require('pg');
require('dotenv').config();

// Vercel automatically creates environment variables when you add a database
// The format is: {PREFIX}_URL, {PREFIX}_HOST, etc.
// Default prefix is usually the database name or "STORAGE"
// Common prefixes: POSTGRES, DATABASE, STORAGE, NEON, etc.

// Priority order for connection:
// 1. DATABASE_URL (standard connection string)
// 2. {PREFIX}_URL (Vercel auto-generated, e.g., POSTGRES_URL, NEON_URL, STORAGE_URL)
// 3. Individual variables (DB_HOST, DB_PORT, etc.)
// 4. Vercel auto-generated individual variables ({PREFIX}_HOST, etc.)

function getDatabaseConfig() {
  // Check for standard DATABASE_URL first
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }

  // Check for Vercel auto-generated URL (common prefixes)
  const prefixes = ['POSTGRES', 'NEON', 'SUPABASE', 'STORAGE', 'DATABASE', 'PRISMA'];
  for (const prefix of prefixes) {
    const urlVar = `${prefix}_URL`;
    if (process.env[urlVar]) {
      return {
        connectionString: process.env[urlVar],
        ssl: { rejectUnauthorized: false },
      };
    }
  }

  // Try to find any _URL variable (in case custom prefix was used)
  for (const key in process.env) {
    if (key.endsWith('_URL') && key.startsWith('POSTGRES')) {
      return {
        connectionString: process.env[key],
        ssl: { rejectUnauthorized: false },
      };
    }
  }

  // Fall back to individual variables
  // Check for Vercel auto-generated individual variables
  const hostVar = process.env.POSTGRES_HOST || process.env.NEON_HOST || process.env.SUPABASE_HOST || process.env.DB_HOST;
  const portVar = process.env.POSTGRES_PORT || process.env.NEON_PORT || process.env.SUPABASE_PORT || process.env.DB_PORT;
  const dbVar = process.env.POSTGRES_DATABASE || process.env.NEON_DATABASE || process.env.SUPABASE_DATABASE || process.env.DB_NAME;
  const userVar = process.env.POSTGRES_USER || process.env.NEON_USER || process.env.SUPABASE_USER || process.env.DB_USER;
  const passVar = process.env.POSTGRES_PASSWORD || process.env.NEON_PASSWORD || process.env.SUPABASE_PASSWORD || process.env.DB_PASSWORD;

  if (hostVar && dbVar && userVar && passVar) {
    return {
      host: hostVar,
      port: portVar ? parseInt(portVar) : 5432,
      database: dbVar,
      user: userVar,
      password: passVar,
      ssl: process.env.DB_SSL === 'true' || process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  }

  // Final fallback to defaults
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'dealer_leads',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: false,
  };
}

const poolConfig = {
  ...getDatabaseConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});

module.exports = pool;
