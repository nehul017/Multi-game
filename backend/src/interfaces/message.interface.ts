import { Document, Types } from 'mongoose';

export type MessageType = 'text' | 'emoji' | 'system';

export interface IMessage {
  _id: string;
  sender: Types.ObjectId;
  receiver: Types.ObjectId | null;
  room: string | null;
  content: string;
  type: MessageType;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument extends Omit<IMessage, '_id'>, Document {}
