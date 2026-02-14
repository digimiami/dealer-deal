#!/bin/bash

# Deployment script for VPS
# Run this script on your VPS to deploy the application

set -e

echo "🚀 Starting deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Build application
echo "🔨 Building application..."
npm run build

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Restart application with PM2
echo "🔄 Restarting application..."
pm2 restart dealer-leads || pm2 start npm --name "dealer-leads" -- start

echo "✅ Deployment complete!"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs dealer-leads"
