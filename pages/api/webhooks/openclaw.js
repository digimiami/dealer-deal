const path = require('path');
const pool = require(path.join(process.cwd(), 'lib', 'db'));
const openclaw = require(path.join(process.cwd(), 'lib', 'openclaw'));

/**
 * Webhook endpoint for OpenClaw to send updates back
 * This handles responses from OpenClaw agents
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook token if configured
  const webhookToken = req.headers['x-webhook-token'] || req.query.token;
  if (process.env.OPENCLAW_WEBHOOK_TOKEN && webhookToken !== process.env.OPENCLAW_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body;
    const { sessionKey, message, action, metadata } = payload;

    // Extract lead ID from session key (format: "lead:123")
    if (sessionKey && sessionKey.startsWith('lead:')) {
      const leadId = parseInt(sessionKey.split(':')[1]);

      // Log interaction
      await pool.query(`
        INSERT INTO lead_interactions (lead_id, interaction_type, direction, channel, content, metadata)
        VALUES ($1, $2, 'inbound', 'openclaw', $3, $4)
      `, [
        leadId,
        metadata?.channel || 'chat',
        message,
        JSON.stringify(metadata || {}),
      ]);

      // Update lead based on action
      if (action === 'qualified') {
        await pool.query(`
          UPDATE leads 
          SET status = 'qualified', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [leadId]);
      } else if (action === 'scheduled_followup') {
        const scheduledAt = metadata?.scheduledAt ? new Date(metadata.scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        await pool.query(`
          INSERT INTO lead_followups (lead_id, scheduled_at, followup_type, status)
          VALUES ($1, $2, $3, 'scheduled')
        `, [leadId, scheduledAt, metadata?.followupType || 'call']);
      }
    }

    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
