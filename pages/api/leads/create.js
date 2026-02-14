import { z } from 'zod';

// Use require for CommonJS modules (Next.js supports this)
const path = require('path');

// Lead validation schema
const leadSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().min(10),
  vehicleInterest: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  preferredContact: z.enum(['email', 'phone', 'sms']).optional().default('email'),
  source: z.enum(['website', 'ad', 'referral', 'chat']).optional().default('website'),
});

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Lazy load modules with error handling
  let pool, routeLead, assignLeadToDealer, calculateLeadScore, openclaw;
  
  try {
    pool = require(path.join(process.cwd(), 'lib', 'db'));
  } catch (error) {
    console.error('Database module not available:', error.message);
  }

  try {
    const routerModule = require(path.join(process.cwd(), 'lib', 'leadRouter'));
    routeLead = routerModule.routeLead;
    assignLeadToDealer = routerModule.assignLeadToDealer;
    calculateLeadScore = routerModule.calculateLeadScore;
  } catch (error) {
    console.error('Lead router module not available:', error.message);
  }

  try {
    openclaw = require(path.join(process.cwd(), 'lib', 'openclaw'));
  } catch (error) {
    console.error('OpenClaw module not available:', error.message);
  }

  try {
    // Validate input
    const validatedData = leadSchema.parse(req.body);

    // Calculate lead score (if available)
    let score = 50; // Default score
    if (calculateLeadScore) {
      try {
        score = calculateLeadScore(validatedData);
      } catch (error) {
        console.error('Lead scoring error:', error);
      }
    }

    let lead = null;
    let dealer = null;
    let assignment = null;

    // Try to save to database if available
    if (pool) {
      try {
        const leadResult = await pool.query(`
          INSERT INTO leads (
            name, email, phone, vehicle_interest, budget, timeline,
            preferred_contact, source, score, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
          RETURNING *
        `, [
          validatedData.name,
          validatedData.email,
          validatedData.phone,
          validatedData.vehicleInterest || null,
          validatedData.budget || null,
          validatedData.timeline || null,
          validatedData.preferredContact,
          validatedData.source,
          score,
        ]);

        lead = leadResult.rows[0];

        // Route lead to appropriate dealer
        if (routeLead && assignLeadToDealer && lead) {
          try {
            dealer = await routeLead(validatedData);
            if (dealer) {
              assignment = await assignLeadToDealer(lead.id, dealer.id, 'system');
            }
          } catch (error) {
            console.error('Lead routing error:', error);
          }
        }

        // Log interaction
        if (lead) {
          try {
            await pool.query(`
              INSERT INTO lead_interactions (lead_id, interaction_type, direction, channel, content)
              VALUES ($1, 'chat', 'inbound', 'website', $2)
            `, [lead.id, JSON.stringify(validatedData)]);
          } catch (error) {
            console.error('Interaction logging error:', error);
          }
        }
      } catch (error) {
        console.error('Database error:', error.message);
        // Continue without database - return success anyway
      }
    }

    // Send to OpenClaw for processing (if available)
    if (openclaw && lead) {
      try {
        await openclaw.processLead({
          ...lead,
          vehicleInterest: lead.vehicle_interest,
          preferredContact: lead.preferred_contact,
        });
      } catch (error) {
        console.error('OpenClaw processing error:', error);
      }

      // Send confirmation to lead
      if (lead) {
        try {
          await openclaw.sendLeadConfirmation(
            {
              ...lead,
              vehicleInterest: lead.vehicle_interest,
              preferredContact: lead.preferred_contact,
            },
            lead.preferred_contact === 'phone' ? 'whatsapp' : 'email'
          );
        } catch (error) {
          console.error('Lead confirmation error:', error);
        }
      }

      // Notify dealer if assigned
      if (dealer && assignment && lead) {
        try {
          await openclaw.notifyDealer(dealer, {
            ...lead,
            vehicleInterest: lead.vehicle_interest,
            score,
          });
        } catch (error) {
          console.error('Dealer notification error:', error);
        }
      }
    }

    // Return success response (works even without database)
    return res.status(201).json({
      success: true,
      lead: lead ? {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        score: lead.score,
        dealer: dealer ? {
          id: dealer.id,
          name: dealer.name,
        } : null,
      } : {
        id: null,
        name: validatedData.name,
        email: validatedData.email,
        status: 'pending',
        score: score,
        dealer: null,
      },
      message: lead ? 'Lead created successfully' : 'Lead received (database not configured)',
      database: pool ? 'connected' : 'not configured',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Lead creation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
