# Deployment Guide

This guide covers deploying the Carforsales.net application to production.

## Repository Setup

The application is configured to deploy to: https://github.com/digimiami/dealer-deal.git

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel provides seamless Next.js deployment with zero configuration.

#### Steps:

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/digimiami/dealer-deal.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import the `digimiami/dealer-deal` repository
   - Vercel will auto-detect Next.js settings
   - Add environment variables (see below)
   - Click "Deploy"

3. **Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - For production, use production database credentials

#### Vercel Environment Variables:
```
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=dealer_leads
DB_USER=your-db-user
DB_PASSWORD=your-db-password
OPENCLAW_GATEWAY_URL=your-openclaw-url
OPENCLAW_TOKEN=your-token
OPENCLAW_WEBHOOK_TOKEN=your-webhook-token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password
```

### Option 2: Your Own VPS/Server

#### Prerequisites:
- VPS with Ubuntu 20.04+
- Node.js 18+ installed
- PostgreSQL installed
- Nginx installed
- Domain name configured

#### Steps:

1. **Clone repository on server:**
   ```bash
   git clone https://github.com/digimiami/dealer-deal.git
   cd dealer-deal
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Set up environment:**
   ```bash
   cp env.example .env
   nano .env  # Edit with your production values
   ```

4. **Set up database:**
   ```bash
   createdb dealer_leads
   npm run migrate
   ```

5. **Build application:**
   ```bash
   npm run build
   ```

6. **Install PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "dealer-deal" -- start
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx:**
   Create `/etc/nginx/sites-available/carforsales.net`:
   ```nginx
   server {
       listen 80;
       server_name carforsales.net www.carforsales.net;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/carforsales.net /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d carforsales.net -d www.carforsales.net
   ```

### Option 3: Docker Deployment

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DB_HOST=db
         - DB_PORT=5432
         - DB_NAME=dealer_leads
         - DB_USER=postgres
         - DB_PASSWORD=postgres
       depends_on:
         - db
     
     db:
       image: postgres:14
       environment:
         - POSTGRES_DB=dealer_leads
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=postgres
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy:**
   ```bash
   docker-compose up -d
   ```

## GitHub Actions CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
- Automatically builds on push to main
- Can deploy to Vercel or your VPS
- Runs tests (if configured)

### Setup GitHub Secrets:
1. Go to repository Settings → Secrets and variables → Actions
2. Add required secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - Or VPS credentials if deploying to your server

## Database Setup

### Production Database:

1. **Create database:**
   ```sql
   CREATE DATABASE dealer_leads;
   ```

2. **Run migrations:**
   ```bash
   npm run migrate
   ```

3. **Seed initial data (optional):**
   ```bash
   psql dealer_leads < database/seed.sql
   psql dealer_leads < database/seed-vehicles.sql
   ```

## Environment Variables

Copy `env.example` to `.env` and fill in production values:

```env
# Database
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=dealer_leads
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# OpenClaw
OPENCLAW_GATEWAY_URL=https://your-openclaw-instance.com
OPENCLAW_TOKEN=your-production-token
OPENCLAW_WEBHOOK_TOKEN=your-webhook-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application
NODE_ENV=production
PORT=3000
```

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] SSL certificate installed (if using own server)
- [ ] Domain DNS configured
- [ ] OpenClaw gateway accessible
- [ ] Email/SMTP configured and tested
- [ ] Test form submission
- [ ] Test vehicle finder
- [ ] Test chatbot
- [ ] Test appointment booking
- [ ] Monitor error logs
- [ ] Set up monitoring/analytics

## Monitoring

### PM2 Monitoring (VPS):
```bash
pm2 status
pm2 logs dealer-deal
pm2 monit
```

### Vercel Monitoring:
- Check Vercel dashboard for deployment status
- View function logs in dashboard
- Set up alerts for errors

## Troubleshooting

### Build Fails:
- Check Node.js version (needs 18+)
- Verify all dependencies installed
- Check for TypeScript errors

### Database Connection Issues:
- Verify database is accessible
- Check firewall rules
- Verify credentials in `.env`

### OpenClaw Not Working:
- Verify gateway URL is accessible
- Check token is correct
- Verify webhook endpoint is reachable

## Support

For deployment issues, check:
- Application logs
- Database logs
- Nginx logs (if applicable)
- Vercel/VPS provider logs
