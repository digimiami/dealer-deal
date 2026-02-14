import { z } from 'zod';
const path = require('path');

const auth = require(path.join(process.cwd(), 'lib', 'auth'));

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2).max(255),
  phone: z.string().optional(),
  userType: z.enum(['customer', 'dealer']).default('customer'),
  dealerId: z.number().optional(), // Required if userType is 'dealer'
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = signupSchema.parse(req.body);

    let user;

    if (validatedData.userType === 'dealer') {
      if (!validatedData.dealerId) {
        return res.status(400).json({ error: 'Dealer ID is required for dealer signup' });
      }
      user = await auth.createDealerAccount({
        dealerId: validatedData.dealerId,
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
      });
    } else {
      user = await auth.createUser({
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
        phone: validatedData.phone,
      });
    }

    // Generate token
    const token = auth.generateToken({
      id: user.id,
      email: user.email,
      type: validatedData.userType === 'dealer' ? 'dealer' : 'user',
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: validatedData.userType === 'dealer' ? 'dealer' : 'user',
      },
      token,
      message: 'Account created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Signup error:', error);
    return res.status(400).json({
      error: error.message || 'Failed to create account',
    });
  }
}
