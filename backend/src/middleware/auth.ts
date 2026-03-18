/**
 * JWT Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../supabase.config';

// Use config file first, fallback to environment variables
const JWT_SECRET = jwtConfig.secret || process.env.JWT_SECRET || 'demo-secret-key-for-testing';

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone?: string;
    iat?: number;
    exp?: number;
  };
}

// JWT Token interface
interface JwtPayload {
  id: string;
  phone?: string;
}

// Verify JWT token middleware
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('[Auth Middleware] Token received:', token ? `${token.substring(0, 30)}...` : 'none');
  console.log('[Auth Middleware] JWT_SECRET:', JWT_SECRET);

  if (!token) {
    res.status(401).json({
      error: {
        message: 'Access token required'
      }
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('[Auth Middleware] Decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Token verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: {
          message: 'Token expired'
        }
      });
    } else {
      res.status(403).json({
        error: {
          message: 'Invalid token'
        }
      });
    }
  }
};

// Generate JWT token
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify token without middleware (for internal use)
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

console.log('JWT Authentication middleware initialized');
