import { Document, Types } from 'mongoose';

export type FriendStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface IFriend {
  _id: string;
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: FriendStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFriendDocument extends Omit<IFriend, '_id'>, Document {}
