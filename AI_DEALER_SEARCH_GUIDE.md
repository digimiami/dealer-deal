# AI-Powered Dealer Search & Vehicle Aggregation System

## Overview

This system uses AI and web scraping to:
1. Find car dealers near a customer's zipcode
2. Scrape vehicle listings from dealer websites
3. Aggregate vehicles with pictures/videos and prices
4. Allow customers to book appointments with external dealers

## Architecture

### Components

1. **Dealer Search API** (`/api/dealers/search`)
   - Takes zipcode and vehicle interest
   - Uses web search to find dealer websites
   - Uses AI to extract dealer information
   - Saves dealers to database

2. **Vehicle Scraping** (`lib/dealerSearch.js`)
   - Scrapes vehicle listings from dealer websites
   - Extracts: make, model, year, price, images, videos
   - Uses AI to parse unstructured HTML

3. **Appointment Booking** (`/api/appointments/external`)
   - Creates appointment with external dealer
   - Attempts to submit to dealer's booking system
   - Sends confirmations to customer and dealer

## Setup Requirements

### 1. Web Search APIs

You need at least one of these:

**Option A: Google Custom Search**
```env
GOOGLE_SEARCH_API_KEY=your_api_key
GOOGLE_SEARCH_ENGINE_ID=your_engine_id
```

Get from: https://developers.google.com/custom-search/v1/overview

**Option B: Bing Search API**
```env
BING_SEARCH_API_KEY=your_api_key
```

Get from: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api

### 2. Geocoding API (Optional but Recommended)

**Option A: Google Maps API**
```env
GOOGLE_MAPS_API_KEY=your_api_key
```

**Option B: OpenStreetMap Nominatim** (Free, no key needed)
- Already implemented as fallback

### 3. AI/LLM Provider (for HTML extraction)

**Option A: OpenAI**
```env
OPENAI_API_KEY=your_api_key
```

**Option B: Anthropic Claude**
```env
ANTHROPIC_API_KEY=your_api_key
```

**Option C: Use existing OpenClaw integration**

### 4. Web Scraping Tools

For advanced scraping, consider:
- **Puppeteer** - Headless browser automation
- **Playwright** - Modern browser automation
- **Cheerio** - Server-side HTML parsing

## Database Schema

New tables added:
- `external_dealers` - Dealers found via web search
- `external_vehicles` - Vehicles scraped from dealer sites
- `external_vehicle_media` - Images/videos from external vehicles
- `external_appointments` - Appointments with external dealers

## Workflow

### 1. Customer Submits Form
```
Customer fills form with zipcode → Form submitted → Lead created
```

### 2. Dealer Search (Automatic)
```
System searches for dealers near zipcode → Finds dealer websites → Extracts dealer info
```

### 3. Vehicle Scraping
```
For each dealer → Scrape website → Extract vehicles → Save to database
```

### 4. Display Vehicles
```
Show aggregated vehicles from all dealers → Customer browses → Clicks on vehicle
```

### 5. Appointment Booking
```
Customer clicks "Book Test Drive" → System creates appointment → 
Attempts to submit to dealer's system → Sends confirmations
```

## Implementation Steps

### Step 1: Run Database Migration
```sql
-- Run in Supabase SQL Editor
\i database/migrations/004_zipcode_and_external_dealers.sql
```

### Step 2: Add Environment Variables
Add to `.env.local` and Vercel:
```env
GOOGLE_SEARCH_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
GOOGLE_MAPS_API_KEY=...
# OR
BING_SEARCH_API_KEY=...
```

### Step 3: Install Additional Dependencies (if needed)
```bash
npm install puppeteer cheerio
# OR
npm install playwright
```

### Step 4: Test Dealer Search
```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/dealers/search \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "33101", "radius": 25}'
```

## AI Integration Options

### Option 1: Use OpenAI for HTML Extraction
```javascript
const openai = require('openai');
const client = new openai({ apiKey: process.env.OPENAI_API_KEY });

async function aiExtractVehicles(html, baseUrl) {
  const response = await client.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Extract vehicle listings from this HTML. Return JSON array with: make, model, year, price, images, description"
    }, {
      role: "user",
      content: html.substring(0, 50000) // Limit HTML size
    }]
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### Option 2: Use OpenClaw (Already Integrated)
```javascript
// Use OpenClaw to intelligently parse dealer websites
const openclaw = require('./lib/openclaw');
const vehicles = await openclaw.extractVehiclesFromWebsite(websiteUrl);
```

### Option 3: Use Structured Data (Schema.org)
Many dealer websites use structured data (JSON-LD, microdata). Parse this first before AI extraction.

## Challenges & Solutions

### Challenge 1: Different Dealer Website Structures
**Solution**: Use AI to adapt to different structures, or maintain a list of known dealer website patterns.

### Challenge 2: Rate Limiting
**Solution**: 
- Cache dealer data
- Use queues for scraping
- Respect robots.txt
- Add delays between requests

### Challenge 3: Dynamic Content (JavaScript)
**Solution**: Use Puppeteer/Playwright to render JavaScript before scraping.

### Challenge 4: Dealer Booking Integration
**Solution**: 
- Maintain list of dealer booking APIs
- Use web automation for form submission
- Fallback to email/phone contact

## Security & Legal Considerations

1. **Respect robots.txt** - Check before scraping
2. **Rate Limiting** - Don't overwhelm dealer websites
3. **Terms of Service** - Review dealer website ToS
4. **Data Privacy** - Handle customer data securely
5. **Caching** - Cache scraped data to reduce load

## Next Steps

1. ✅ Add zipcode to form
2. ✅ Create database schema
3. ✅ Build dealer search API
4. ⏳ Implement web scraping
5. ⏳ Add AI extraction
6. ⏳ Build appointment booking
7. ⏳ Add vehicle display with external dealers
8. ⏳ Test end-to-end flow

## Testing

Test the flow:
1. Submit form with zipcode
2. Check `/api/dealers/search` returns dealers
3. Verify vehicles are scraped
4. Test appointment booking
5. Verify confirmations sent
