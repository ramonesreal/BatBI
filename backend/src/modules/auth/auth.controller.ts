import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../database'; // Main Prisma client connection
import { env } from '../../config/env';

export const authController = {
  // 1. SIGNUP ROUTE
  async signup(req: Request, res: Response): Promise<any> {
    try {
      const { name, email, password } = req.body;

      // Basic validation for required fields
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please fill in all fields.' });
      }

      // Check password complexity (minimum 8 characters)
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      // Check if email is already registered in the database
      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        return res.status(400).json({ error: 'This email is already in use.' });
      }

      // Hash the password with 10 salt rounds
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save the new user in the database
      const newUser = await prisma.user.create({
        data: {
          nome: name,
          email,
          senha: hashedPassword,
        },
      });

      // Return success without exposing the hashed password
      return res.status(201).json({
        message: 'User created successfully!',
        user: { id: newUser.id, name: newUser.nome, email: newUser.email }
      });

    } catch (error: any) {
      console.error('Signup error:', error.message);
      return res.status(500).json({ error: 'Internal server error while registering user.' });
    }
  },
  // 2. SIGNIN / LOGIN ROUTE
  async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;

      // Check for required fields
      if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password.' });
      }

      // 1. Find user by email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // 2. Compare password hashes
      const isPasswordCorrect = await bcrypt.compare(password, user.senha);
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // 3. Generate JWT Token containing user ID and Email, expiring in 1 day
      const token = jwt.sign(
        { id: user.id, email: user.email },
        env.jwtSecret,
        { expiresIn: '1d', algorithm: 'HS256' }
      );

      // Set JWT token as HTTP-Only, Secure, SameSite=Strict cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      // 4. Return user info (token is not sent in the JSON body anymore for security)
      return res.json({
        message: 'Login successful!',
        user: {
          id: user.id,
          name: user.nome,
          email: user.email
        }
      });

    } catch (error: any) {
      console.error('Login error:', error.message);
      return res.status(500).json({ error: 'Internal server error during login.' });
    }
  },
  // 3. LOGOUT ROUTE
  async logout(_req: Request, res: Response): Promise<any> {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.json({ message: 'Logout successful!' });
  }
};