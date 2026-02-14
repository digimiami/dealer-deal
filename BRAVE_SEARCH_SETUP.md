# Brave Search API Setup Guide

## Why Brave Search?

- ✅ **Privacy-focused** - No tracking, no user profiling
- ✅ **Independent** - Own search index (not Google/Bing)
- ✅ **Affordable** - Competitive pricing
- ✅ **Fast** - Low latency API
- ✅ **No CORS issues** - Works well with server-side requests

## Step 1: Get Brave Search API Key

1. Go to: https://brave.com/search/api/
2. Sign up for a Brave Search API account
3. Create a new API key
4. Copy your API key

## Step 2: Add to Environment Variables

### Local Development (`.env.local`)
```env
BRAVE_SEARCH_API_KEY=BSA_your_api_key_here
```

### Vercel (Production)
1. Go to: Vercel → Your Project → Settings → Environment Variables
2. Add:
   - **Name**: `BRAVE_SEARCH_API_KEY`
   - **Value**: Your Brave API key
   - **Environment**: Production, Preview, Development (check all)
3. Click **Save**

## Step 3: Test the API

The dealer search will automatically use Brave Search API if the key is configured.

### Test Endpoint
```bash
curl -X POST http://localhost:3000/api/dealers/search \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "33101", "radius": 25, "vehicleInterest": "Toyota Camry"}'
```

## API Usage

### Request Format
```javascript
const response = await fetch(
  `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&safesearch=moderate`,
  {
    headers: {
      'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY,
      'Accept': 'application/json',
    },
  }
);
```

### Response Format
```json
{
  "web": {
    "results": [
      {
        "url": "https://example-dealer.com",
        "title": "Dealer Name",
        "description": "Dealer description..."
      }
    ]
  }
}
```

## Pricing

Brave Search API offers:
- **Free Tier**: Limited requests per month
- **Paid Plans**: Based on requests/month
- Check current pricing: https://brave.com/search/api/pricing

## Features Used

1. **Web Search** - Find dealer websites
2. **Safe Search** - Filter inappropriate content
3. **Result Count** - Control number of results
4. **Query Encoding** - Proper URL encoding

## Fallback Options

If Brave Search API is not configured, the system will try:
1. Google Custom Search API (if configured)
2. Bing Search API (if configured)
3. AI-powered search (if configured)

## Example Queries

The system automatically generates queries like:
- `car dealers near 33101 Toyota Camry`
- `auto dealerships Miami FL`
- `used car dealers zipcode 33101`

## Rate Limiting

Brave Search API has rate limits based on your plan:
- Free tier: ~2,000 queries/month
- Paid plans: Higher limits

The system caches dealer results to minimize API calls.

## Troubleshooting

### "No dealers found"
- Check API key is correct
- Verify API key has sufficient quota
- Check query format
- Review API response in logs

### "API key invalid"
- Verify key format: Should start with `BSA_`
- Check key is active in Brave dashboard
- Ensure key is set in environment variables

### Rate limit errors
- Check your API usage in Brave dashboard
- Consider upgrading plan
- Implement caching to reduce calls

## Integration Status

✅ **Implemented** - Brave Search is now the primary search method
✅ **Fallback** - Google/Bing still work as fallbacks
✅ **Error Handling** - Graceful fallback if Brave fails

## Next Steps

1. Get Brave Search API key
2. Add to `.env.local` and Vercel
3. Test dealer search
4. Monitor API usage
5. Adjust caching as needed
