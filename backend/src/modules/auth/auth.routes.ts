import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';

const authRoutes = Router();

// 🔒 Security rate limiter configuration for signups
const accountCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit to 5 signups per IP per hour
  message: { error: 'Too many accounts created from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Signup Route
authRoutes.post('/signup', accountCreationLimiter, authController.signup);

// Signin/Login Route
authRoutes.post('/login', authController.login);

// Logout Route
authRoutes.post('/logout', authController.logout);

export default authRoutes;