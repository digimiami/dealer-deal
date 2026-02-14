const path = require('path');
const pool = require(path.join(process.cwd(), 'lib', 'db'));
const { routeLead, assignLeadToDealer, calculateLeadScore } = require(path.join(process.cwd(), 'lib', 'leadRouter'));
const openclaw = require(path.join(process.cwd(), 'lib', 'openclaw'));
const { z } = require('zod');

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate input
    const validatedData = leadSchema.parse(req.body);

    // Calculate lead score
    const score = calculateLeadScore(validatedData);

    // Insert lead into database
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

    const lead = leadResult.rows[0];

    // Route lead to appropriate dealer
    let dealer = null;
    let assignment = null;
    
    try {
      dealer = await routeLead(validatedData);
      if (dealer) {
        assignment = await assignLeadToDealer(lead.id, dealer.id, 'system');
      }
    } catch (error) {
      console.error('Lead routing error:', error);
      // Continue even if routing fails - lead is still saved
    }

    // Send to OpenClaw for processing
    let openclawResponse = null;
    try {
      openclawResponse = await openclaw.processLead({
        ...lead,
        vehicleInterest: lead.vehicle_interest,
        preferredContact: lead.preferred_contact,
      });
    } catch (error) {
      console.error('OpenClaw processing error:', error);
      // Continue even if OpenClaw fails
    }

    // Send confirmation to lead
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

    // Notify dealer if assigned
    if (dealer && assignment) {
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

    // Log interaction
    try {
      await pool.query(`
        INSERT INTO lead_interactions (lead_id, interaction_type, direction, channel, content)
        VALUES ($1, 'chat', 'inbound', 'website', $2)
      `, [lead.id, JSON.stringify(validatedData)]);
    } catch (error) {
      console.error('Interaction logging error:', error);
    }

    return res.status(201).json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        score: lead.score,
        dealer: dealer ? {
          id: dealer.id,
          name: dealer.name,
        } : null,
      },
      message: 'Lead created successfully',
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
