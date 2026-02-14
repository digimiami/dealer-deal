const path = require('path');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Lazy load modules
  let pool, openclaw;
  try {
    pool = require(path.join(process.cwd(), 'lib', 'db'));
  } catch (error) {
    console.error('Database module not available:', error.message);
  }

  try {
    openclaw = require(path.join(process.cwd(), 'lib', 'openclaw'));
  } catch (error) {
    console.error('OpenClaw module not available:', error.message);
  }

  try {
    const { message, leadId, sessionKey, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context from conversation history
    const context = conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Get lead information if available
    let leadInfo = '';
    if (leadId && pool) {
      try {
        const leadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        if (leadResult.rows.length > 0) {
          const lead = leadResult.rows[0];
          leadInfo = `\nCustomer Information:\n- Name: ${lead.name}\n- Budget: ${lead.budget || 'Not specified'}\n- Timeline: ${lead.timeline || 'Not specified'}\n- Vehicle Interest: ${lead.vehicle_interest || 'Not specified'}\n`;
        }
      } catch (error) {
        console.error('Error fetching lead info:', error);
      }
    }

    // Search for vehicles based on message
    let vehicleRecommendations = [];
    const messageLower = message.toLowerCase();
    
    // Extract vehicle search terms
    const searchTerms = {
      make: ['toyota', 'honda', 'ford', 'chevrolet', 'bmw', 'mercedes', 'audi', 'tesla'],
      bodyType: ['sedan', 'suv', 'truck', 'coupe', 'convertible'],
      price: message.match(/\$?(\d+)k?/gi),
    };

    if (pool) {
      let vehicleQuery = 'SELECT v.*, d.name as dealer_name FROM vehicles v JOIN dealers d ON v.dealer_id = d.id WHERE v.status = $1';
      const vehicleParams = ['available'];
      let paramCount = 2;

      // Try to match vehicles
      for (const make of searchTerms.make) {
        if (messageLower.includes(make)) {
          vehicleQuery += ` AND LOWER(v.make) = LOWER($${paramCount++})`;
          vehicleParams.push(make);
          break;
        }
      }

      for (const bodyType of searchTerms.bodyType) {
        if (messageLower.includes(bodyType)) {
          vehicleQuery += ` AND LOWER(v.body_type) = LOWER($${paramCount++})`;
          vehicleParams.push(bodyType);
          break;
        }
      }

      if (searchTerms.price && searchTerms.price.length > 0) {
        const maxPrice = parseInt(searchTerms.price[0].replace(/[^0-9]/g, '')) * 1000;
        if (maxPrice > 0) {
          vehicleQuery += ` AND v.price <= $${paramCount++}`;
          vehicleParams.push(maxPrice);
        }
      }

      vehicleQuery += ' ORDER BY v.featured DESC, v.price ASC LIMIT 5';

      try {
        const vehicleResult = await pool.query(vehicleQuery, vehicleParams);
        vehicleRecommendations = vehicleResult.rows;
      } catch (error) {
        console.error('Error searching vehicles:', error);
      }
    }

    // Build prompt for OpenClaw
    const systemPrompt = `You are a friendly and knowledgeable AI car shopping assistant for Carforsales.net. Your role is to help customers find their perfect vehicle.

${leadInfo}

${context ? `Previous conversation:\n${context}\n` : ''}

Current customer message: ${message}

${vehicleRecommendations.length > 0 ? `Available vehicles matching their interest:\n${vehicleRecommendations.map((v, i) => `${i + 1}. ${v.year} ${v.make} ${v.model} - $${v.price.toLocaleString()} (${v.dealer_name})`).join('\n')}\n` : ''}

Instructions:
1. Be friendly, helpful, and conversational
2. Ask clarifying questions if needed (budget, preferences, features)
3. If vehicles are available, mention them naturally in your response
4. Guide customers to view vehicle details
5. Help schedule test drives when ready
6. Keep responses concise (2-3 sentences max)

Respond naturally to the customer's message.`;

    // Send to OpenClaw
    let aiResponse = '';
    if (openclaw) {
      try {
        const openclawResponse = await openclaw.sendToAgent({
          message: systemPrompt,
          name: 'CarShoppingAssistant',
          sessionKey: sessionKey || `chat:${Date.now()}`,
          deliver: false, // Don't deliver externally, just get response
        });

        // Handle different response formats from OpenClaw
        if (typeof openclawResponse === 'string') {
          aiResponse = openclawResponse;
        } else if (openclawResponse?.response) {
          aiResponse = openclawResponse.response;
        } else if (openclawResponse?.message) {
          aiResponse = openclawResponse.message;
        } else if (openclawResponse?.content) {
          aiResponse = openclawResponse.content;
        } else {
          aiResponse = 'I can help you find the perfect vehicle! What are you looking for?';
        }
      } catch (error) {
        console.error('OpenClaw error:', error);
        // Fallback response
        if (vehicleRecommendations.length > 0) {
          aiResponse = `I found ${vehicleRecommendations.length} vehicle(s) that might interest you! Would you like to see the details?`;
        } else {
          aiResponse = 'I can help you find the perfect vehicle! Could you tell me more about what you\'re looking for? (e.g., make, model, budget, type of vehicle)';
        }
      }
    } else {
      // Fallback if OpenClaw not available
      if (vehicleRecommendations.length > 0) {
        aiResponse = `I found ${vehicleRecommendations.length} vehicle(s) that might interest you! Would you like to see the details?`;
      } else {
        aiResponse = 'I can help you find the perfect vehicle! Could you tell me more about what you\'re looking for? (e.g., make, model, budget, type of vehicle)';
      }
    }

    return res.json({
      response: aiResponse,
      vehicles: vehicleRecommendations.length > 0 ? vehicleRecommendations.map(v => ({
        id: v.id,
        year: v.year,
        make: v.make,
        model: v.model,
        price: parseFloat(v.price),
        dealer_name: v.dealer_name,
      })) : null,
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
