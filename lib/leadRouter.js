const pool = require('./db');

/**
 * Lead Router - Routes leads to appropriate dealers based on various criteria
 */

/**
 * Calculate lead score based on lead data
 * @param {Object} lead - Lead data
 * @returns {number} Score from 0-100
 */
function calculateLeadScore(lead) {
  let score = 0;

  // Budget scoring (higher budget = higher score)
  if (lead.budget) {
    const budget = lead.budget.toLowerCase();
    if (budget.includes('100k') || budget.includes('100000')) score += 30;
    else if (budget.includes('50k') || budget.includes('50000')) score += 20;
    else if (budget.includes('30k') || budget.includes('30000')) score += 15;
    else if (budget.includes('20k') || budget.includes('20000')) score += 10;
    else score += 5;
  }

  // Timeline scoring (sooner = higher score)
  if (lead.timeline) {
    const timeline = lead.timeline.toLowerCase();
    if (timeline.includes('immediate') || timeline.includes('now') || timeline.includes('week')) score += 25;
    else if (timeline.includes('month')) score += 15;
    else if (timeline.includes('2-3') || timeline.includes('few')) score += 10;
    else score += 5;
  }

  // Contact preference (phone = more engaged)
  if (lead.preferredContact === 'phone') score += 15;
  else if (lead.preferredContact === 'sms') score += 10;
  else score += 5;

  // Source scoring
  if (lead.source === 'referral') score += 10;
  else if (lead.source === 'ad') score += 8;
  else score += 5;

  // Has all required fields
  if (lead.name && lead.email && lead.phone && lead.vehicleInterest) score += 10;

  return Math.min(100, score);
}

/**
 * Find matching dealers based on lead criteria
 * @param {Object} lead - Lead data
 * @returns {Promise<Array>} Array of matching dealers
 */
async function findMatchingDealers(lead) {
  const vehicleInterest = lead.vehicleInterest?.toLowerCase() || '';
  
  // Build query to find dealers matching vehicle interest
  let query = `
    SELECT d.*, 
           COUNT(la.id) as current_assignments,
           (d.capacity - d.current_load) as available_capacity
    FROM dealers d
    LEFT JOIN lead_assignments la ON d.id = la.dealer_id 
      AND la.status IN ('pending', 'accepted')
    WHERE d.active = true
  `;

  const params = [];
  
  // Match by specialty if vehicle interest is specified
  if (vehicleInterest) {
    // Map common vehicle terms to specialties
    const specialtyMap = {
      'sedan': 'sedan',
      'suv': 'suv',
      'truck': 'truck',
      'luxury': 'luxury',
      'electric': 'electric',
      'ev': 'electric',
      'tesla': 'electric',
      'bmw': 'luxury',
      'mercedes': 'luxury',
      'audi': 'luxury',
    };

    const matchedSpecialties = [];
    for (const [term, specialty] of Object.entries(specialtyMap)) {
      if (vehicleInterest.includes(term)) {
        matchedSpecialties.push(specialty);
      }
    }

    if (matchedSpecialties.length > 0) {
      params.push(matchedSpecialties);
      query += ` AND (d.specialties && $${params.length}::text[])`;
    }
  }

  query += `
    GROUP BY d.id
    HAVING (d.capacity - d.current_load) > 0
    ORDER BY d.priority DESC, available_capacity DESC, d.current_load ASC
    LIMIT 5
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Route lead to best matching dealer
 * @param {Object} lead - Lead data
 * @returns {Promise<Object>} Assignment result
 */
async function routeLead(lead) {
  const matchingDealers = await findMatchingDealers(lead);
  
  if (matchingDealers.length === 0) {
    // No matching dealers, use round-robin or highest priority
    const result = await pool.query(`
      SELECT * FROM dealers 
      WHERE active = true 
      AND (capacity - current_load) > 0
      ORDER BY priority DESC, current_load ASC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      throw new Error('No available dealers');
    }
    
    return result.rows[0];
  }

  // Return best match (first in sorted list)
  return matchingDealers[0];
}

/**
 * Assign lead to dealer
 * @param {number} leadId - Lead ID
 * @param {number} dealerId - Dealer ID
 * @param {string} assignedBy - Who assigned it ('system', 'admin', 'openclaw')
 * @returns {Promise<Object>} Assignment record
 */
async function assignLeadToDealer(leadId, dealerId, assignedBy = 'system') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create assignment
    const assignmentResult = await client.query(`
      INSERT INTO lead_assignments (lead_id, dealer_id, assigned_by, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [leadId, dealerId, assignedBy]);

    // Update lead
    await client.query(`
      UPDATE leads 
      SET dealer_id = $1, status = 'qualified', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [dealerId, leadId]);

    // Update dealer load
    await client.query(`
      UPDATE dealers 
      SET current_load = current_load + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [dealerId]);

    await client.query('COMMIT');
    return assignmentResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  calculateLeadScore,
  findMatchingDealers,
  routeLead,
  assignLeadToDealer,
};
