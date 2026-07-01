import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const adminOnly = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Not authorized.', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required.', 403));
  }

  next();
};
