import mongoose, { Schema } from 'mongoose';
import { IPokerActionDocument } from '../interfaces/poker.interface';

const pokerActionSchema = new Schema<IPokerActionDocument>(
  {
    handId: { type: String, required: true, index: true },
    tableId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    amount: { type: Number },
    street: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

pokerActionSchema.index({ handId: 1, timestamp: 1 });
pokerActionSchema.index({ tableId: 1, timestamp: -1 });

export const PokerAction = mongoose.model<IPokerActionDocument>('PokerAction', pokerActionSchema);
