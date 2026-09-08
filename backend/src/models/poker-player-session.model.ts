import mongoose, { Schema } from 'mongoose';
import { IPokerPlayerSessionDocument } from '../interfaces/poker.interface';

const pokerPlayerSessionSchema = new Schema<IPokerPlayerSessionDocument>(
  {
    tableId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    seatIndex: { type: Number, required: true },
    buyIn: { type: Number, required: true },
    chips: { type: Number, required: true },
    status: { type: String, enum: ['seated', 'left'], default: 'seated' },
    joinedAt: { type: Date, required: true, default: Date.now },
    leftAt: { type: Date },
  },
  { timestamps: false }
);

pokerPlayerSessionSchema.index({ tableId: 1, userId: 1, status: 1 });
pokerPlayerSessionSchema.index({ userId: 1, status: 1 });

export const PokerPlayerSession = mongoose.model<IPokerPlayerSessionDocument>(
  'PokerPlayerSession',
  pokerPlayerSessionSchema
);
