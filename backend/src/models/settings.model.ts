import mongoose, { Schema } from 'mongoose';
import { ISettingsDocument } from '../interfaces/settings.interface';

const settingsSchema = new Schema<ISettingsDocument>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettingsDocument>('Settings', settingsSchema);
