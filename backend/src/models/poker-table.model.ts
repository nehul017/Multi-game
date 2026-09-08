import mongoose, { Schema } from 'mongoose';
import { IPokerTableDocument } from '../interfaces/poker.interface';

const pokerTableSchema = new Schema<IPokerTableDocument>(
  {
    tableId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    gameType: {
      type: String,
      required: true,
      enum: ['texas-holdem', 'omaha', 'omaha-hi-lo', 'five-card-draw'],
      index: true,
    },
    maxSeats: { type: Number, required: true, min: 2, max: 9 },
    smallBlind: { type: Number, required: true, min: 1 },
    bigBlind: { type: Number, required: true, min: 2 },
    buyInMin: { type: Number, required: true, min: 1 },
    buyInMax: { type: Number, required: true, min: 1 },
    actionTimeoutMs: { type: Number, required: true, default: 15000 },
    fillBots: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'playing', 'closed'], default: 'open', index: true },
    seatedCount: { type: Number, default: 0 },
    createdBy: { type: String },
  },
  { timestamps: true }
);

pokerTableSchema.index({ gameType: 1, status: 1, updatedAt: -1 });

export const PokerTable = mongoose.model<IPokerTableDocument>('PokerTable', pokerTableSchema);
