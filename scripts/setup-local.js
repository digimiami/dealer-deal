const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Setting up local development environment...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from env.example...');
  fs.copyFileSync('env.example', '.env');
  console.log('✅ .env file created\n');
  console.log('⚠️  Please edit .env file with your database credentials before continuing.\n');
}

// Check PostgreSQL
console.log('🔍 Checking PostgreSQL installation...');
try {
  execSync('psql --version', { stdio: 'ignore' });
  console.log('✅ PostgreSQL is installed\n');
  
  // Try to connect to database
  const dbName = process.env.DB_NAME || 'dealer_leads';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;
  
  console.log(`📊 Checking database connection...`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUser}`);
  console.log(`   Host: ${dbHost}:${dbPort}\n`);
  
  // Try to create database if it doesn't exist
  try {
    execSync(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "SELECT 1;"`, { stdio: 'ignore' });
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.log('⚠️  Database does not exist or connection failed.');
    console.log('   Attempting to create database...\n');
    try {
      execSync(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${dbName};"`, { stdio: 'inherit' });
      console.log('✅ Database created successfully\n');
    } catch (createError) {
      console.log('❌ Could not create database automatically.');
      console.log(`   Please create it manually: createdb ${dbName}\n`);
    }
  }
  
  // Run migrations
  console.log('🗄️  Running database migrations...');
  try {
    require('./migrate.js');
    console.log('✅ Migrations completed\n');
  } catch (error) {
    console.log('⚠️  Migration failed. You may need to run it manually: npm run migrate\n');
  }
  
} catch (error) {
  console.log('❌ PostgreSQL is not installed or not in PATH\n');
  console.log('📦 To install PostgreSQL on Windows:');
  console.log('   1. Download from: https://www.postgresql.org/download/windows/');
  console.log('   2. Or use Chocolatey: choco install postgresql');
  console.log('   3. Or use Docker: docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres\n');
  console.log('💡 Alternative: You can use Docker for PostgreSQL:');
  console.log('   docker run --name dealer-leads-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dealer_leads -p 5432:5432 -d postgres\n');
}

console.log('✨ Setup complete!');
console.log('\n📋 Next steps:');
console.log('   1. Make sure PostgreSQL is running');
console.log('   2. Update .env with your database credentials');
console.log('   3. Run: npm run migrate (if migrations didn\'t run automatically)');
console.log('   4. Run: npm run dev (to start development server)\n');
