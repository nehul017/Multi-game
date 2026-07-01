import { Document } from 'mongoose';

export interface ISettings {
  _id: string;
  key: string;
  value: unknown;
  category: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingsDocument extends Omit<ISettings, '_id'>, Document {}
