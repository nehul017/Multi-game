import mongoose, { Schema } from 'mongoose';
import { IPokerHandDocument } from '../interfaces/poker.interface';

const pokerHandSchema = new Schema<IPokerHandDocument>(
  {
    handId: { type: String, required: true, unique: true, index: true },
    tableId: { type: String, required: true, index: true },
    gameType: {
      type: String,
      required: true,
      enum: ['texas-holdem', 'omaha', 'omaha-hi-lo', 'five-card-draw'],
    },
    players: [
      {
        userId: { type: String, required: true },
        username: { type: String, required: true },
        seatIndex: { type: Number, required: true },
        startingChips: { type: Number, required: true },
        endingChips: { type: Number },
      },
    ],
    dealerPosition: { type: Number, required: true },
    blinds: {
      small: { type: Number, required: true },
      big: { type: Number, required: true },
    },
    communityCards: { type: [String], default: [] },
    result: { type: Schema.Types.Mixed },
    pots: { type: Schema.Types.Mixed },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  { timestamps: false }
);

pokerHandSchema.index({ tableId: 1, startedAt: -1 });
pokerHandSchema.index({ 'players.userId': 1, startedAt: -1 });

export const PokerHand = mongoose.model<IPokerHandDocument>('PokerHand', pokerHandSchema);
