// Using native fetch (Node.js 18+)
require('dotenv').config();

const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

/**
 * OpenClaw Integration Client
 * Handles communication with OpenClaw gateway
 */

/**
 * Send message to OpenClaw agent
 * @param {Object} options - Message options
 * @returns {Promise<Object>} Response from OpenClaw
 */
async function sendToAgent(options) {
  const {
    message,
    name = 'LeadProcessor',
    deliver = true,
    channel = 'whatsapp',
    to,
    sessionKey,
    wakeMode = 'now',
  } = options;

  const payload = {
    name,
    message,
    deliver,
    channel,
    wakeMode,
  };

  if (to) payload.to = to;
  if (sessionKey) payload.sessionKey = sessionKey;

  try {
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/hooks/agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OpenClaw API error:', error);
    throw error;
  }
}

/**
 * Process new lead through OpenClaw
 * @param {Object} lead - Lead data
 * @returns {Promise<Object>} OpenClaw response
 */
async function processLead(lead) {
  const messageTemplate = `New lead received:
Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone}
Vehicle Interest: ${lead.vehicleInterest || 'Not specified'}
Budget: ${lead.budget || 'Not specified'}
Timeline: ${lead.timeline || 'Not specified'}
Preferred Contact: ${lead.preferredContact || 'email'}
Source: ${lead.source || 'website'}

Please qualify this lead and determine next steps.`;

  return sendToAgent({
    message: messageTemplate,
    name: 'LeadQualifier',
    sessionKey: `lead:${lead.id}`,
    deliver: true,
    channel: 'whatsapp', // Default channel, can be overridden
  });
}

/**
 * Send notification to dealer via OpenClaw
 * @param {Object} dealer - Dealer data
 * @param {Object} lead - Lead data
 * @returns {Promise<Object>} OpenClaw response
 */
async function notifyDealer(dealer, lead) {
  const message = `New Lead Assigned to You:

Name: ${lead.name}
Contact: ${lead.email} / ${lead.phone}
Vehicle Interest: ${lead.vehicleInterest}
Budget: ${lead.budget}
Timeline: ${lead.timeline}
Lead Score: ${lead.score}/100

Please contact this lead as soon as possible.`;

  return sendToAgent({
    message,
    name: 'DealerNotification',
    deliver: true,
    channel: 'whatsapp',
    to: dealer.phone,
  });
}

/**
 * Send confirmation to lead
 * @param {Object} lead - Lead data
 * @param {string} channel - Communication channel ('email', 'sms', 'whatsapp')
 * @returns {Promise<Object>} OpenClaw response
 */
async function sendLeadConfirmation(lead, channel = 'email') {
  const message = `Hi ${lead.name},

Thank you for your interest in ${lead.vehicleInterest || 'our vehicles'}!

We've received your inquiry and one of our specialists will contact you shortly at ${lead.preferredContact === 'phone' ? lead.phone : lead.email}.

If you have any immediate questions, feel free to reply to this message.

Best regards,
Carforsales.net Team`;

  return sendToAgent({
    message,
    name: 'LeadConfirmation',
    deliver: true,
    channel,
    to: channel === 'email' ? lead.email : lead.phone,
  });
}

/**
 * Schedule follow-up via OpenClaw
 * @param {Object} lead - Lead data
 * @param {Date} scheduledAt - When to follow up
 * @param {string} followupType - Type of follow-up ('call', 'email', 'sms')
 * @returns {Promise<Object>} OpenClaw response
 */
async function scheduleFollowUp(lead, scheduledAt, followupType = 'call') {
  const message = `Schedule a ${followupType} follow-up with ${lead.name} (${lead.phone}) on ${scheduledAt.toISOString()}.
    
Lead details:
- Vehicle Interest: ${lead.vehicleInterest}
- Budget: ${lead.budget}
- Timeline: ${lead.timeline}

Prepare to discuss their interest and answer any questions.`;

  return sendToAgent({
    message,
    name: 'FollowUpScheduler',
    sessionKey: `followup:${lead.id}`,
    deliver: true,
    channel: followupType === 'call' ? 'voice-call' : followupType === 'sms' ? 'whatsapp' : 'email',
    to: lead.phone,
  });
}

module.exports = {
  sendToAgent,
  processLead,
  notifyDealer,
  sendLeadConfirmation,
  scheduleFollowUp,
};
