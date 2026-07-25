import mongoose, { Schema } from 'mongoose';
import { IStoreItemDocument } from '../interfaces/economy.interface';

const storeItemSchema = new Schema<IStoreItemDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 500 },
    type: {
      type: String,
      required: true,
      enum: ['avatar', 'theme', 'frame', 'badge', 'premium', 'consumable'],
      index: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    preview: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    stock: { type: Number, default: -1 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

storeItemSchema.index({ type: 1, isActive: 1, price: 1 });

export const StoreItem = mongoose.model<IStoreItemDocument>('StoreItem', storeItemSchema);
