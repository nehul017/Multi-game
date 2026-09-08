import mongoose, { Schema } from 'mongoose';
import { ITransactionDocument } from '../interfaces/economy.interface';

const transactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'match_win',
        'match_loss',
        'match_draw',
        'daily_login',
        'mission',
        'achievement',
        'referral',
        'pack_purchase',
        'store_purchase',
        'admin_grant',
        'admin_deduct',
        'refund',
        'welcome',
        'slot_bet',
        'slot_win',
        'poker_buyin',
        'poker_win',
        'poker_refund',
      ],
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, maxlength: 300 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', transactionSchema);
