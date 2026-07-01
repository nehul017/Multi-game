import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user.model';
import { env } from '../../config/env';

interface JwtPayload {
  id: string;
  role: string;
}

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    if (user.isBanned) {
      return next(new Error('Account banned'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};
