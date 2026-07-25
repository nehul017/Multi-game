import mongoose, { Schema } from 'mongoose';
import { ICoinPackDocument } from '../interfaces/economy.interface';

const coinPackSchema = new Schema<ICoinPackDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 300 },
    coins: { type: Number, required: true, min: 1 },
    bonusCoins: { type: Number, default: 0, min: 0 },
    priceLabel: { type: String, required: true, maxlength: 40 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

coinPackSchema.index({ isActive: 1, sortOrder: 1 });

export const CoinPack = mongoose.model<ICoinPackDocument>('CoinPack', coinPackSchema);
