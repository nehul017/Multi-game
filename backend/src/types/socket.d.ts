import { IUserDocument } from '../interfaces/user.interface';

declare module 'socket.io' {
  interface Socket {
    user?: IUserDocument;
  }
}

export {};
