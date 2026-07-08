import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

// Interface to extend Express Request to hold the logged-in user details
export interface AuthenticatedRequest extends Request {
  currentUser?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): any => {
  // 1. Attempt to get token from req.cookies
  let token = req.cookies?.token;

  // Fallback: check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Token not provided. Access denied.' });
  }

  try {
    // 2. Verify the token using the secret key from env configuration, enforcing the algorithm
    const verified = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as { id: string; email: string };

    // 3. Save the user details in the 'req' object for downstream handlers
    req.currentUser = { id: verified.id, email: verified.email };

    return next();

  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};