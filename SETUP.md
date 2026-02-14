# Setup Guide

This guide will walk you through setting up the Auto Dealer Lead Generation System step by step.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- OpenClaw installed (see OpenClaw setup below)
- VPS or server for deployment (optional for local development)

## Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

## Step 2: Database Setup

1. **Create PostgreSQL database:**
   ```bash
   createdb dealer_leads
   ```

2. **Configure database connection:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Run migrations:**
   ```bash
   npm run migrate
   ```

4. **Seed sample data (optional):**
   ```bash
   psql dealer_leads < database/seed.sql
   ```

## Step 3: OpenClaw Setup

1. **Install OpenClaw on your VPS:**
   ```bash
   curl -fsSL https://openclaw.ai/install.sh | bash
   openclaw onboard --install-daemon
   ```

2. **Configure OpenClaw:**
   - Copy `openclaw/config.json` to your OpenClaw configuration directory
   - Update the configuration with your tokens and settings
   - Place agent prompts from `openclaw/prompts/` into OpenClaw workspace

3. **Set OpenClaw environment variables in `.env`:**
   ```env
   OPENCLAW_GATEWAY_URL=http://localhost:18789
   OPENCLAW_TOKEN=your_token_here
   OPENCLAW_WEBHOOK_TOKEN=your_webhook_secret_here
   ```

## Step 4: Email Configuration

1. **For Gmail:**
   - Enable 2-factor authentication
   - Generate an app password
   - Use the app password in `.env`

2. **Update `.env` with SMTP settings:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

## Step 5: Test the System

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Visit http://localhost:3000**

3. **Submit a test lead through the form**

4. **Check:**
   - Lead appears in database
   - OpenClaw receives the lead
   - Dealer gets notified (if dealers are configured)
   - Lead receives confirmation

## Step 6: Production Deployment

### On Your VPS:

1. **Install Node.js and PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql postgresql-contrib
   ```

2. **Clone your repository:**
   ```bash
   git clone <your-repo-url>
   cd dealer-lead-system
   ```

3. **Set up environment:**
   ```bash
   npm install --production
   cp env.example .env
   # Edit .env with production values
   ```

4. **Set up database:**
   ```bash
   sudo -u postgres createdb dealer_leads
   npm run migrate
   ```

5. **Set up Nginx reverse proxy:**
   ```bash
   sudo apt-get install nginx
   ```

   Create `/etc/nginx/sites-available/carforsales.net`:
   ```nginx
   server {
       listen 80;
       server_name carforsales.net;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
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

6. **Set up SSL:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d carforsales.net
   ```

7. **Deploy with PM2:**
   ```bash
   npm install -g pm2
   npm run build
   pm2 start npm --name "dealer-leads" -- start
   pm2 save
   pm2 startup
   ```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection string in `.env`
- Verify database exists: `psql -l | grep dealer_leads`

### OpenClaw Connection Issues
- Verify OpenClaw gateway is running: `curl http://localhost:18789/health`
- Check token in `.env` matches OpenClaw config
- Verify firewall allows port 18789

### Email Not Sending
- Verify SMTP credentials
- Check spam folder
- For Gmail, ensure app password is used (not regular password)
- Check SMTP port (587 for TLS, 465 for SSL)

### Leads Not Routing
- Verify dealers exist in database
- Check dealer specialties match lead vehicle interest
- Verify dealer capacity is not exceeded

## Next Steps

- Add more dealers to the system
- Customize lead scoring algorithm
- Configure additional communication channels
- Set up analytics and reporting
- Implement admin dashboard

## Support

For issues, check:
- Database logs: `sudo journalctl -u postgresql`
- Application logs: `pm2 logs dealer-leads`
- OpenClaw logs: Check OpenClaw documentation
