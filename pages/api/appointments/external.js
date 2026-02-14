import { createSupabaseAdmin } from '../../../lib/supabase-server';
import { z } from 'zod';

const appointmentSchema = z.object({
  leadId: z.number().optional(),
  externalDealerId: z.number(),
  externalVehicleId: z.number().optional(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  customerZipcode: z.string().optional(),
  preferredDate: z.string(),
  preferredTime: z.string(),
  appointmentType: z.enum(['test_drive', 'viewing', 'consultation']).default('test_drive'),
  notes: z.string().optional(),
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = appointmentSchema.parse(req.body);
    const supabase = createSupabaseAdmin();

    // Get dealer information
    const { data: dealer, error: dealerError } = await supabase
      .from('external_dealers')
      .select('*')
      .eq('id', validatedData.externalDealerId)
      .single();

    if (dealerError || !dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    // Create appointment record
    const { data: appointment, error: appointmentError } = await supabase
      .from('external_appointments')
      .insert({
        lead_id: validatedData.leadId || null,
        external_dealer_id: validatedData.externalDealerId,
        external_vehicle_id: validatedData.externalVehicleId || null,
        customer_name: validatedData.customerName,
        customer_email: validatedData.customerEmail,
        customer_phone: validatedData.customerPhone,
        customer_zipcode: validatedData.customerZipcode || null,
        preferred_date: validatedData.preferredDate,
        preferred_time: validatedData.preferredTime,
        appointment_type: validatedData.appointmentType,
        status: 'pending',
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError);
      return res.status(500).json({
        error: 'Failed to create appointment',
        message: appointmentError.message,
      });
    }

    // Try to submit appointment to dealer's website (if they have an API)
    // This would integrate with the dealer's booking system
    let dealerConfirmation = null;
    try {
      dealerConfirmation = await submitToDealerWebsite(dealer, appointment);
      
      if (dealerConfirmation) {
        // Update appointment with dealer confirmation URL
        await supabase
          .from('external_appointments')
          .update({
            dealer_confirmation_url: dealerConfirmation.url,
            status: dealerConfirmation.status || 'confirmed',
          })
          .eq('id', appointment.id);
      }
    } catch (error) {
      console.error('Error submitting to dealer website:', error);
      // Appointment is still saved, just not confirmed with dealer yet
    }

    // Send confirmation emails (if configured)
    try {
      await sendAppointmentConfirmation(appointment, dealer);
    } catch (error) {
      console.error('Error sending confirmation:', error);
    }

    return res.status(201).json({
      success: true,
      appointment: {
        id: appointment.id,
        dealerName: dealer.name,
        dealerWebsite: dealer.website_url,
        preferredDate: appointment.preferred_date,
        preferredTime: appointment.preferred_time,
        status: appointment.status,
        confirmationUrl: dealerConfirmation?.url || null,
      },
      message: 'Appointment created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Appointment creation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Submit appointment to dealer's website
 */
async function submitToDealerWebsite(dealer, appointment) {
  // This would integrate with the dealer's booking API
  // Each dealer might have a different system
  
  // Option 1: If dealer has an API endpoint
  if (dealer.booking_api_url) {
    try {
      const response = await fetch(dealer.booking_api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealer.api_key}`,
        },
        body: JSON.stringify({
          customer: {
            name: appointment.customer_name,
            email: appointment.customer_email,
            phone: appointment.customer_phone,
          },
          appointment: {
            date: appointment.preferred_date,
            time: appointment.preferred_time,
            type: appointment.appointment_type,
            vehicleId: appointment.external_vehicle_id,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.confirmationUrl,
          status: 'confirmed',
        };
      }
    } catch (error) {
      console.error('Dealer API error:', error);
    }
  }

  // Option 2: Use web scraping to fill dealer's booking form
  // This is more complex and would require browser automation (Puppeteer, Playwright)
  
  return null;
}

/**
 * Send appointment confirmation emails
 */
async function sendAppointmentConfirmation(appointment, dealer) {
  // Send email to customer
  // Send email to dealer
  // Implementation depends on your email service (SendGrid, AWS SES, etc.)
}
