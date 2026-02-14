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

  // Verify webhook token if configured
  const webhookToken = req.headers['x-webhook-token'] || req.query.token;
  if (process.env.OPENCLAW_WEBHOOK_TOKEN && webhookToken !== process.env.OPENCLAW_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!pool) {
    return res.json({ 
      success: true, 
      received: true,
      message: 'Webhook received but database not configured',
    });
  }

  try {
    const payload = req.body;
    const { sessionKey, message, action, metadata } = payload;

    // Extract lead ID from session key (format: "lead:123")
    if (sessionKey && sessionKey.startsWith('lead:')) {
      const leadId = parseInt(sessionKey.split(':')[1]);

      // Log interaction
      try {
        await pool.query(`
          INSERT INTO lead_interactions (lead_id, interaction_type, direction, channel, content, metadata)
          VALUES ($1, $2, 'inbound', 'openclaw', $3, $4)
        `, [
          leadId,
          metadata?.channel || 'chat',
          message,
          JSON.stringify(metadata || {}),
        ]);
      } catch (error) {
        console.error('Error logging interaction:', error);
      }

      // Update lead based on action
      if (action === 'qualified') {
        try {
          await pool.query(`
            UPDATE leads 
            SET status = 'qualified', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [leadId]);
        } catch (error) {
          console.error('Error updating lead status:', error);
        }
      } else if (action === 'scheduled_followup') {
        try {
          const scheduledAt = metadata?.scheduledAt ? new Date(metadata.scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
          await pool.query(`
            INSERT INTO lead_followups (lead_id, scheduled_at, followup_type, status)
            VALUES ($1, $2, $3, 'scheduled')
          `, [leadId, scheduledAt, metadata?.followupType || 'call']);
        } catch (error) {
          console.error('Error scheduling followup:', error);
        }
      }
    }

    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}
