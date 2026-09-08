import mongoose, { Schema } from 'mongoose';
import { IGameSessionDocument } from '../interfaces/slots.interface';

const gameSessionSchema = new Schema<IGameSessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gameId: { type: String, required: true, index: true },
    status: { type: String, enum: ['active', 'left'], default: 'active', index: true },
    lastBet: { type: Number, default: 0, min: 0 },
    lastWin: { type: Number, default: 0, min: 0 },
    lastReels: { type: Schema.Types.Mixed, default: null },
    lastWinningLines: { type: Schema.Types.Mixed, default: [] },
    lastSpinId: { type: String, default: null },
    lastRequestId: { type: String, default: null },
  },
  { timestamps: true }
);

gameSessionSchema.index({ userId: 1, gameId: 1, status: 1 });
gameSessionSchema.index({ userId: 1, createdAt: -1 });
gameSessionSchema.index({ gameId: 1, createdAt: -1 });

export const GameSession = mongoose.model<IGameSessionDocument>('GameSession', gameSessionSchema);
