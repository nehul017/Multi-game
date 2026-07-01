import { Document, Types } from 'mongoose';

export type NotificationType =
  | 'friend_request'
  | 'match_invite'
  | 'tournament'
  | 'achievement'
  | 'message'
  | 'system';

export interface INotification {
  _id: string;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends Omit<INotification, '_id'>, Document {}
