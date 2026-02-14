// AI-powered dealer website search and scraping
// Uses web search APIs and AI to find and extract dealer information

const path = require('path');

// Lazy load Supabase
let supabaseAdmin;
try {
  const { createSupabaseAdmin } = require(path.join(process.cwd(), 'lib', 'supabase-server'));
  supabaseAdmin = createSupabaseAdmin();
} catch (error) {
  console.error('Supabase not available:', error.message);
}

/**
 * Search for dealers near a zipcode using AI-powered web search
 */
async function searchDealersNearZipcode(zipcode, radius = 25, vehicleInterest = '') {
  if (!supabaseAdmin) {
    throw new Error('Database not configured');
  }

  // First, try to get location from zipcode (using a geocoding service)
  const location = await geocodeZipcode(zipcode);
  if (!location) {
    throw new Error('Invalid zipcode');
  }

  // Search for dealers using web search API (Google Custom Search, Bing, etc.)
  const searchQuery = `car dealers near ${zipcode} ${vehicleInterest ? vehicleInterest : ''}`;
  const dealerWebsites = await searchDealerWebsites(searchQuery);

  // Process each dealer website
  const dealers = [];
  for (const website of dealerWebsites) {
    try {
      const dealerInfo = await extractDealerInfo(website.url, location);
      if (dealerInfo) {
        dealers.push(dealerInfo);
      }
    } catch (error) {
      console.error(`Error processing dealer ${website.url}:`, error.message);
    }
  }

  // Save to database
  const savedDealers = [];
  for (const dealer of dealers) {
    const { data, error } = await supabaseAdmin
      .from('external_dealers')
      .upsert({
        name: dealer.name,
        website_url: dealer.website,
        phone: dealer.phone,
        email: dealer.email,
        address: dealer.address,
        city: dealer.city,
        state: dealer.state,
        zipcode: dealer.zipcode,
        latitude: dealer.latitude,
        longitude: dealer.longitude,
        verified: false,
        scrape_status: 'pending',
      }, {
        onConflict: 'website_url',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (!error && data) {
      savedDealers.push(data);
    }
  }

  return savedDealers;
}

/**
 * Geocode zipcode to get latitude/longitude
 */
async function geocodeZipcode(zipcode) {
  // Option 1: Use a free geocoding API (like OpenStreetMap Nominatim)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zipcode}&country=US&format=json&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        city: data[0].address?.city || data[0].address?.town || '',
        state: data[0].address?.state || '',
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  // Option 2: Use Google Geocoding API (if API key is available)
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${googleApiKey}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          city: extractCityFromAddress(data.results[0].address_components),
          state: extractStateFromAddress(data.results[0].address_components),
        };
      }
    } catch (error) {
      console.error('Google Geocoding error:', error);
    }
  }

  return null;
}

/**
 * Search for dealer websites using web search
 */
async function searchDealerWebsites(query) {
  const websites = [];

  // Option 1: Use Brave Search API (Recommended - Privacy-focused)
  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (braveApiKey) {
    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&safesearch=moderate`,
        {
          headers: {
            'X-Subscription-Token': braveApiKey,
            'Accept': 'application/json',
          },
        }
      );
      const data = await response.json();

      if (data.web && data.web.results) {
        for (const result of data.web.results) {
          websites.push({
            url: result.url,
            title: result.title,
            snippet: result.description,
          });
        }
      }
    } catch (error) {
      console.error('Brave Search error:', error);
    }
  }

  // Option 2: Use Google Custom Search API (fallback)
  const googleSearchKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (googleSearchKey && googleSearchEngineId && websites.length === 0) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${googleSearchKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&num=10`
      );
      const data = await response.json();

      if (data.items) {
        for (const item of data.items) {
          websites.push({
            url: item.link,
            title: item.title,
            snippet: item.snippet,
          });
        }
      }
    } catch (error) {
      console.error('Google Search error:', error);
    }
  }

  // Option 3: Use Bing Search API (fallback)
  const bingApiKey = process.env.BING_SEARCH_API_KEY;
  if (bingApiKey && websites.length === 0) {
    try {
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': bingApiKey,
          },
        }
      );
      const data = await response.json();

      if (data.webPages && data.webPages.value) {
        for (const page of data.webPages.value) {
          websites.push({
            url: page.url,
            title: page.name,
            snippet: page.snippet,
          });
        }
      }
    } catch (error) {
      console.error('Bing Search error:', error);
    }
  }

  // Option 4: Use AI-powered search (OpenAI, Anthropic, etc.) as last resort
  if (websites.length === 0) {
    websites.push(...await aiSearchDealers(query));
  }

  return websites;
}

/**
 * Use AI to search for dealers (fallback method)
 */
async function aiSearchDealers(query) {
  // This would use OpenAI, Anthropic, or similar to search
  // For now, return empty array - implement based on your AI provider
  return [];
}

/**
 * Extract dealer information from website
 */
async function extractDealerInfo(websiteUrl, location) {
  // Use web scraping or AI to extract dealer info
  // This is a simplified version - in production, use proper scraping tools
  
  try {
    // Option 1: Use AI to extract structured data from website
    const dealerInfo = await aiExtractDealerInfo(websiteUrl);
    
    if (dealerInfo) {
      return {
        name: dealerInfo.name,
        website: websiteUrl,
        phone: dealerInfo.phone,
        email: dealerInfo.email,
        address: dealerInfo.address,
        city: dealerInfo.city || location.city,
        state: dealerInfo.state || location.state,
        zipcode: dealerInfo.zipcode,
        latitude: dealerInfo.latitude || location.latitude,
        longitude: dealerInfo.longitude || location.longitude,
      };
    }
  } catch (error) {
    console.error('Error extracting dealer info:', error);
  }

  return null;
}

/**
 * Use AI to extract dealer information from website HTML
 */
async function aiExtractDealerInfo(websiteUrl) {
  // Fetch website HTML
  try {
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const html = await response.text();

    // Use AI (OpenAI, Anthropic, etc.) to extract structured data
    // This would parse HTML and extract: name, phone, email, address, etc.
    
    // For now, return basic structure - implement with your AI provider
    return {
      name: extractNameFromHTML(html),
      phone: extractPhoneFromHTML(html),
      email: extractEmailFromHTML(html),
      address: extractAddressFromHTML(html),
    };
  } catch (error) {
    console.error('Error fetching website:', error);
    return null;
  }
}

/**
 * Scrape vehicles from dealer website
 */
async function scrapeDealerVehicles(dealerId, websiteUrl) {
  if (!supabaseAdmin) {
    throw new Error('Database not configured');
  }

  try {
    // Fetch dealer website
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const html = await response.text();

    // Use AI to extract vehicle listings
    const vehicles = await aiExtractVehicles(html, websiteUrl);

    // Save vehicles to database
    const savedVehicles = [];
    for (const vehicle of vehicles) {
      const { data, error } = await supabaseAdmin
        .from('external_vehicles')
        .insert({
          external_dealer_id: dealerId,
          source_url: vehicle.sourceUrl,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          price: vehicle.price,
          mileage: vehicle.mileage,
          vin: vehicle.vin,
          description: vehicle.description,
          images: vehicle.images || [],
          videos: vehicle.videos || [],
          features: vehicle.features || [],
          status: 'available',
        })
        .select()
        .single();

      if (!error && data) {
        savedVehicles.push(data);

        // Save media
        if (vehicle.images && vehicle.images.length > 0) {
          for (let i = 0; i < vehicle.images.length; i++) {
            await supabaseAdmin
              .from('external_vehicle_media')
              .insert({
                external_vehicle_id: data.id,
                media_type: 'image',
                url: vehicle.images[i],
                display_order: i,
                is_primary: i === 0,
              });
          }
        }
      }
    }

    // Update dealer scrape status
    await supabaseAdmin
      .from('external_dealers')
      .update({
        last_scraped: new Date().toISOString(),
        scrape_status: 'success',
      })
      .eq('id', dealerId);

    return savedVehicles;
  } catch (error) {
    console.error('Error scraping vehicles:', error);
    
    // Update dealer scrape status to failed
    await supabaseAdmin
      .from('external_dealers')
      .update({
        scrape_status: 'failed',
        scrape_error: error.message,
      })
      .eq('id', dealerId);

    throw error;
  }
}

/**
 * Use AI to extract vehicles from HTML
 */
async function aiExtractVehicles(html, baseUrl) {
  // This would use AI to parse HTML and extract vehicle listings
  // Return array of vehicle objects with: make, model, year, price, images, etc.
  
  // Simplified - implement with your AI provider
  return [];
}

// Helper functions for HTML extraction
function extractNameFromHTML(html) {
  // Extract dealer name from HTML
  const nameMatch = html.match(/<title>(.*?)<\/title>/i) || 
                   html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return nameMatch ? nameMatch[1].trim() : null;
}

function extractPhoneFromHTML(html) {
  // Extract phone number using regex
  const phoneMatch = html.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  return phoneMatch ? phoneMatch[1] : null;
}

function extractEmailFromHTML(html) {
  // Extract email using regex
  const emailMatch = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  return emailMatch ? emailMatch[1] : null;
}

function extractAddressFromHTML(html) {
  // Extract address - this is more complex, might need AI
  return null;
}

function extractCityFromAddress(components) {
  for (const component of components) {
    if (component.types.includes('locality')) {
      return component.long_name;
    }
  }
  return '';
}

function extractStateFromAddress(components) {
  for (const component of components) {
    if (component.types.includes('administrative_area_level_1')) {
      return component.short_name;
    }
  }
  return '';
}

module.exports = {
  searchDealersNearZipcode,
  scrapeDealerVehicles,
  geocodeZipcode,
};
