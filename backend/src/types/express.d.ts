import { IUserDocument } from '../interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

export {};
