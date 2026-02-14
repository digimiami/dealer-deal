import { createSupabaseAdmin } from '../../../lib/supabase-server';

const path = require('path');

// Lazy load dealer search
let dealerSearch;
try {
  dealerSearch = require(path.join(process.cwd(), 'lib', 'dealerSearch'));
} catch (error) {
  console.error('Dealer search module not available:', error.message);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zipcode, radius = 25, vehicleInterest = '' } = req.body;

    if (!zipcode) {
      return res.status(400).json({ error: 'Zipcode is required' });
    }

    if (!dealerSearch) {
      return res.status(503).json({
        error: 'Dealer search service not configured',
        message: 'Please configure web search APIs (Google Search, Bing, etc.)',
      });
    }

    // Search for dealers near zipcode
    const dealers = await dealerSearch.searchDealersNearZipcode(
      zipcode,
      radius,
      vehicleInterest
    );

    // For each dealer, scrape their vehicles
    const dealersWithVehicles = [];
    for (const dealer of dealers) {
      try {
        const vehicles = await dealerSearch.scrapeDealerVehicles(
          dealer.id,
          dealer.website_url
        );
        dealersWithVehicles.push({
          ...dealer,
          vehicles: vehicles || [],
          vehicleCount: vehicles?.length || 0,
        });
      } catch (error) {
        console.error(`Error scraping vehicles for dealer ${dealer.id}:`, error);
        dealersWithVehicles.push({
          ...dealer,
          vehicles: [],
          vehicleCount: 0,
          scrapeError: error.message,
        });
      }
    }

    return res.json({
      success: true,
      dealers: dealersWithVehicles,
      count: dealersWithVehicles.length,
      zipcode,
      radius,
    });
  } catch (error) {
    console.error('Dealer search error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
