import { z } from 'zod';
const path = require('path');

const auth = require(path.join(process.cwd(), 'lib', 'auth'));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await auth.authenticateUser(validatedData.email, validatedData.password);

    // Generate token
    const token = auth.generateToken({
      id: user.id,
      email: user.email,
      type: user.type,
      role: user.role,
      dealerId: user.dealerId || null,
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        role: user.role,
        dealerId: user.dealerId || null,
        dealerName: user.dealerName || null,
      },
      token,
      message: 'Login successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Login error:', error);
    return res.status(401).json({
      error: error.message || 'Invalid credentials',
    });
  }
}
