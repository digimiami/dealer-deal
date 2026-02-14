# Testing Guide

## Local Testing Setup

### 1. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 2. Test the Frontend

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the lead capture form
3. Fill out the form and submit a test lead

### 3. Test the API Endpoints

#### Test Lead Creation

```bash
curl -X POST http://localhost:3000/api/leads/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "vehicleInterest": "2024 Toyota Camry",
    "budget": "$30k-$50k",
    "timeline": "This month",
    "preferredContact": "phone",
    "source": "website"
  }'
```

#### Test Get Lead

```bash
curl http://localhost:3000/api/leads/1
```

#### Test List Leads

```bash
curl http://localhost:3000/api/leads/list
```

#### Test List Dealers

```bash
curl http://localhost:3000/api/dealers/list
```

### 4. Database Testing

**Note:** You need PostgreSQL running for full functionality.

#### Option A: Use Docker (Recommended for Testing)

```bash
docker run --name dealer-leads-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dealer_leads \
  -p 5432:5432 \
  -d postgres
```

Then update `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dealer_leads
DB_USER=postgres
DB_PASSWORD=postgres
```

Run migrations:
```bash
npm run migrate
```

#### Option B: Install PostgreSQL Locally

1. Download from https://www.postgresql.org/download/windows/
2. Install and set password
3. Create database: `createdb dealer_leads`
4. Update `.env` with your credentials
5. Run migrations: `npm run migrate`

### 5. Expected Behavior

#### Without Database
- Frontend form will load
- Form submission will fail with database connection error
- API will return 500 errors

#### With Database
- Frontend form loads and submits successfully
- Lead is saved to database
- Lead is scored automatically
- Lead is routed to matching dealer (if dealers exist)
- API returns success with lead details

### 6. Testing OpenClaw Integration

**Note:** OpenClaw is optional for local testing. The system will work without it, but lead processing and notifications won't be sent.

To test with OpenClaw:
1. Install OpenClaw on your system
2. Configure `openclaw/config.json`
3. Set `OPENCLAW_GATEWAY_URL` and `OPENCLAW_TOKEN` in `.env`
4. Start OpenClaw gateway
5. Submit a lead - it should be processed by OpenClaw

### 7. Common Issues

#### "Module not found" errors
- Make sure all dependencies are installed: `npm install`
- Check that `lib/` directory exists with all files

#### Database connection errors
- Verify PostgreSQL is running
- Check `.env` file has correct database credentials
- Ensure database exists: `psql -l | grep dealer_leads`

#### Port 3000 already in use
- Change port in `.env`: `PORT=3001`
- Or stop the process using port 3000

#### Build errors
- Clear `.next` directory: `rm -rf .next` (Linux/Mac) or `Remove-Item -Recurse -Force .next` (Windows)
- Rebuild: `npm run build`

### 8. Manual Testing Checklist

- [ ] Frontend form loads
- [ ] Form validation works (try submitting empty form)
- [ ] Form submission works
- [ ] Success message displays
- [ ] Lead appears in database (if DB connected)
- [ ] API endpoints return correct responses
- [ ] Lead scoring works (check score in response)
- [ ] Lead routing works (check dealer assignment)
- [ ] Error handling works (test with invalid data)

### 9. Automated Testing

Run the test script (requires Node.js 18+ or node-fetch):

```bash
node scripts/test-api.js
```

Or with custom API URL:

```bash
API_URL=http://localhost:3001 node scripts/test-api.js
```
