import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Not authorized. No token provided.', 401));
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return next(new AppError('Token expired. Please log in again.', 401));
      }
      if (err instanceof jwt.JsonWebTokenError) {
        return next(new AppError('Invalid token. Please log in again.', 401));
      }
      return next(new AppError('Authentication failed.', 401));
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User not found.', 401));
    }

    if (user.isBanned) {
      return next(new AppError('Your account has been banned.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Authentication failed.', 401));
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
      const user = await User.findById(decoded.id);
      if (user && !user.isBanned) {
        req.user = user;
      }
    }

    next();
  } catch {
    next();
  }
};
