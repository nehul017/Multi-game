import mongoose, { Schema } from 'mongoose';
import { ISessionDocument } from '../interfaces/session.interface';

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    socketId: { type: String, required: true },
    deviceInfo: {
      browser: { type: String, default: 'unknown' },
      os: { type: String, default: 'unknown' },
      device: { type: String, default: 'unknown' },
    },
    ipAddress: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ socketId: 1 });

export const Session = mongoose.model<ISessionDocument>('Session', sessionSchema);
