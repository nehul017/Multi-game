import { Document, Types } from 'mongoose';

export interface IDeviceInfo {
  browser: string;
  os: string;
  device: string;
}

export interface ISession {
  _id: string;
  userId: Types.ObjectId;
  socketId: string;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionDocument extends Omit<ISession, '_id'>, Document {}
