const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dealer_leads',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function runMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✓ Migrated: ${path.basename(filePath)}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Migration failed: ${path.basename(filePath)}`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function migrate(direction = 'up') {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (direction === 'up') {
    console.log('Running migrations...');
    for (const file of files) {
      await runMigration(path.join(migrationsDir, file));
    }
    console.log('All migrations completed!');
  } else {
    console.log('Rollback not implemented yet. Please restore from backup.');
  }
}

migrate(process.argv[2] || 'up')
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
