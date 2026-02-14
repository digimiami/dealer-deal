const path = require('path');
const { z } = require('zod');

const appointmentSchema = z.object({
  leadId: z.number().optional(),
  vehicleId: z.number().min(1),
  dealerId: z.number().min(1),
  customerName: z.string().min(2).max(255),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  alternativeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  alternativeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().optional(),
});

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

  if (!pool) {
    return res.status(503).json({ 
      error: 'Database not configured',
      message: 'Please set up PostgreSQL to create appointments.',
    });
  }

  try {
    const validatedData = appointmentSchema.parse(req.body);

    // Get vehicle and dealer info
    const vehicleResult = await pool.query(`
      SELECT v.*, d.name as dealer_name, d.email as dealer_email, d.phone as dealer_phone
      FROM vehicles v
      JOIN dealers d ON v.dealer_id = d.id
      WHERE v.id = $1 AND d.id = $2
    `, [validatedData.vehicleId, validatedData.dealerId]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle or dealer not found' });
    }

    const vehicle = vehicleResult.rows[0];
    const dealer = {
      id: validatedData.dealerId,
      name: vehicle.dealer_name,
      email: vehicle.dealer_email,
      phone: vehicle.dealer_phone,
    };

    // Create appointment
    const appointmentResult = await pool.query(`
      INSERT INTO test_drive_appointments (
        lead_id, vehicle_id, dealer_id,
        customer_name, customer_email, customer_phone,
        preferred_date, preferred_time, alternative_date, alternative_time,
        notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `, [
      validatedData.leadId || null,
      validatedData.vehicleId,
      validatedData.dealerId,
      validatedData.customerName,
      validatedData.customerEmail,
      validatedData.customerPhone,
      validatedData.preferredDate,
      validatedData.preferredTime,
      validatedData.alternativeDate || null,
      validatedData.alternativeTime || null,
      validatedData.notes || null,
    ]);

    const appointment = appointmentResult.rows[0];

    // Send notification to dealer via OpenClaw (if available)
    if (openclaw) {
      try {
        const dealerMessage = `New Test Drive Appointment Request:

Customer: ${validatedData.customerName}
Email: ${validatedData.customerEmail}
Phone: ${validatedData.customerPhone}

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Price: $${vehicle.price.toLocaleString()}

Preferred Date/Time: ${validatedData.preferredDate} at ${validatedData.preferredTime}
${validatedData.alternativeDate ? `Alternative: ${validatedData.alternativeDate} at ${validatedData.alternativeTime || 'flexible'}` : ''}

${validatedData.notes ? `Notes: ${validatedData.notes}` : ''}

Please confirm this appointment as soon as possible.`;

        await openclaw.sendToAgent({
          message: dealerMessage,
          name: 'DealerNotification',
          deliver: true,
          channel: 'whatsapp',
          to: dealer.phone,
        });
      } catch (error) {
        console.error('Error sending dealer notification:', error);
      }

      // Send confirmation to customer
      try {
        const customerMessage = `Hi ${validatedData.customerName},

Thank you for requesting a test drive!

We've received your request for:
${vehicle.year} ${vehicle.make} ${vehicle.model}
Preferred time: ${validatedData.preferredDate} at ${validatedData.preferredTime}

${dealer.name} will contact you shortly to confirm the appointment.

If you have any questions, feel free to contact us.

Best regards,
Carforsales.net`;

        await openclaw.sendToAgent({
          message: customerMessage,
          name: 'CustomerConfirmation',
          deliver: true,
          channel: 'email',
          to: validatedData.customerEmail,
        });
      } catch (error) {
        console.error('Error sending customer confirmation:', error);
      }
    }

    return res.status(201).json({
      success: true,
      appointment: {
        id: appointment.id,
        status: appointment.status,
        preferredDate: appointment.preferred_date,
        preferredTime: appointment.preferred_time,
      },
      message: 'Test drive appointment requested successfully',
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
