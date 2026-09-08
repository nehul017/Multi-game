import mongoose, { Schema } from 'mongoose';
import { ISpinDocument } from '../interfaces/slots.interface';

const spinSchema = new Schema<ISpinDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gameId: { type: String, required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
    requestId: { type: String, required: true },
    bet: { type: Number, required: true, min: 1 },
    reels: { type: Schema.Types.Mixed, required: true },
    winningLines: { type: Schema.Types.Mixed, default: [] },
    winAmount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

spinSchema.index({ userId: 1, createdAt: -1 });
spinSchema.index({ gameId: 1, createdAt: -1 });
spinSchema.index({ createdAt: -1 });
spinSchema.index({ userId: 1, requestId: 1 }, { unique: true });

export const Spin = mongoose.model<ISpinDocument>('Spin', spinSchema);
