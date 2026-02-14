const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Lazy load database
let pool;
try {
  pool = require(path.join(process.cwd(), 'lib', 'db'));
} catch (error) {
  console.error('Database module not available:', error.message);
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash a password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Create user account
 */
async function createUser(userData) {
  if (!pool) {
    throw new Error('Database not configured');
  }

  const { email, password, name, phone } = userData;
  
  // Check if user already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = await pool.query(`
    INSERT INTO users (email, password_hash, name, phone, role)
    VALUES ($1, $2, $3, $4, 'customer')
    RETURNING id, email, name, phone, role, created_at
  `, [email, passwordHash, name, phone || null]);

  return result.rows[0];
}

/**
 * Create dealer account
 */
async function createDealerAccount(dealerData) {
  if (!pool) {
    throw new Error('Database not configured');
  }

  const { dealerId, email, password, name } = dealerData;

  // Check if dealer account already exists
  const existing = await pool.query(
    'SELECT id FROM dealer_accounts WHERE email = $1 OR dealer_id = $2',
    [email, dealerId]
  );
  if (existing.rows.length > 0) {
    throw new Error('Dealer account already exists');
  }

  // Verify dealer exists
  const dealer = await pool.query('SELECT id FROM dealers WHERE id = $1', [dealerId]);
  if (dealer.rows.length === 0) {
    throw new Error('Dealer not found');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create dealer account
  const result = await pool.query(`
    INSERT INTO dealer_accounts (dealer_id, email, password_hash, name, role)
    VALUES ($1, $2, $3, $4, 'dealer')
    RETURNING id, dealer_id, email, name, role, created_at
  `, [dealerId, email, passwordHash, name]);

  return result.rows[0];
}

/**
 * Authenticate user login
 */
async function authenticateUser(email, password) {
  if (!pool) {
    throw new Error('Database not configured');
  }

  // Try users table first
  let user = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND active = true',
    [email]
  );

  if (user.rows.length > 0) {
    const isValid = await verifyPassword(password, user.rows[0].password_hash);
    if (isValid) {
      // Update last login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.rows[0].id]
      );
      return {
        id: user.rows[0].id,
        email: user.rows[0].email,
        name: user.rows[0].name,
        role: user.rows[0].role,
        type: 'user',
      };
    }
  }

  // Try dealer accounts
  const dealer = await pool.query(`
    SELECT da.*, d.name as dealer_name, d.id as dealer_id
    FROM dealer_accounts da
    JOIN dealers d ON da.dealer_id = d.id
    WHERE da.email = $1 AND da.active = true
  `, [email]);

  if (dealer.rows.length > 0) {
    const isValid = await verifyPassword(password, dealer.rows[0].password_hash);
    if (isValid) {
      // Update last login
      await pool.query(
        'UPDATE dealer_accounts SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [dealer.rows[0].id]
      );
      return {
        id: dealer.rows[0].id,
        dealerId: dealer.rows[0].dealer_id,
        email: dealer.rows[0].email,
        name: dealer.rows[0].name,
        dealerName: dealer.rows[0].dealer_name,
        role: dealer.rows[0].role,
        type: 'dealer',
      };
    }
  }

  throw new Error('Invalid email or password');
}

/**
 * Get user by ID
 */
async function getUserById(userId, userType = 'user') {
  if (!pool) {
    return null;
  }

  if (userType === 'user') {
    const result = await pool.query(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } else if (userType === 'dealer') {
    const result = await pool.query(`
      SELECT da.*, d.name as dealer_name, d.id as dealer_id
      FROM dealer_accounts da
      JOIN dealers d ON da.dealer_id = d.id
      WHERE da.id = $1
    `, [userId]);
    return result.rows[0] || null;
  }

  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  createUser,
  createDealerAccount,
  authenticateUser,
  getUserById,
};
