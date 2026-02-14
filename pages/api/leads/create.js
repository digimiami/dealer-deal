import { z } from 'zod';
import { createSupabaseAdmin } from '../../../lib/supabase-server';

// Lead validation schema
const leadSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().min(10),
  zipcode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zipcode format').optional(),
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

  try {
    // Validate input
    const validatedData = leadSchema.parse(req.body);

    // Get Supabase client
    const supabase = createSupabaseAdmin();

    // Calculate lead score (simple scoring)
    let score = 50; // Default score
    if (validatedData.budget && validatedData.budget !== '') score += 10;
    if (validatedData.timeline && validatedData.timeline !== '') score += 10;
    if (validatedData.vehicleInterest && validatedData.vehicleInterest !== '') score += 10;

    // Insert lead into database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        zipcode: validatedData.zipcode || null,
        vehicle_interest: validatedData.vehicleInterest || null,
        budget: validatedData.budget || null,
        timeline: validatedData.timeline || null,
        preferred_contact: validatedData.preferredContact,
        source: validatedData.source,
        score: score,
        status: 'new',
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return res.status(500).json({
        error: 'Failed to create lead',
        message: leadError.message,
      });
    }

    // Try to route lead to dealer (if dealers exist)
    let dealer = null;
    let assignment = null;

    if (lead) {
      // Get available dealers (simple routing - first available dealer)
      const { data: dealers } = await supabase
        .from('dealers')
        .select('id, name, email, phone, specialties, capacity, current_load')
        .eq('active', true)
        .order('priority', { ascending: false })
        .limit(1);

      if (dealers && dealers.length > 0) {
        dealer = dealers[0];

        // Assign lead to dealer
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('lead_assignments')
          .insert({
            lead_id: lead.id,
            dealer_id: dealer.id,
            assigned_by: 'system',
            status: 'pending',
          })
          .select()
          .single();

        if (!assignmentError) {
          assignment = assignmentData;

          // Update lead with dealer_id
          await supabase
            .from('leads')
            .update({ dealer_id: dealer.id })
            .eq('id', lead.id);
        }
      }

      // Log interaction
      await supabase
        .from('lead_interactions')
        .insert({
          lead_id: lead.id,
          interaction_type: 'form_submission',
          direction: 'inbound',
          channel: 'website',
          content: 'Lead submitted via website form',
        });

      // Try to send to OpenClaw (if configured)
      try {
        const path = require('path');
        const openclaw = require(path.join(process.cwd(), 'lib', 'openclaw'));
        if (openclaw && openclaw.processLead) {
          await openclaw.processLead(lead, dealer);
        }
      } catch (error) {
        console.log('OpenClaw not configured:', error.message);
      }
    }

    return res.status(201).json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        dealer_id: lead.dealer_id || dealer?.id || null,
      },
      dealer: dealer ? {
        id: dealer.id,
        name: dealer.name,
        email: dealer.email,
      } : null,
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
