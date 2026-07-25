import mongoose, { Schema } from 'mongoose';
import { IMissionDocument, IUserMissionProgressDocument } from '../interfaces/economy.interface';

const missionSchema = new Schema<IMissionDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 300 },
    type: { type: String, enum: ['daily', 'weekly'], required: true, index: true },
    condition: {
      type: {
        type: String,
        enum: ['wins', 'games_played', 'login', 'friends_added', 'spend_coins', 'earn_coins'],
        required: true,
      },
      value: { type: Number, required: true, min: 1 },
      gameType: { type: String },
    },
    coinReward: { type: Number, required: true, min: 0 },
    xpReward: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const userMissionProgressSchema = new Schema<IUserMissionProgressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
    progress: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    claimed: { type: Boolean, default: false },
    periodKey: { type: String, required: true },
  },
  { timestamps: true }
);

userMissionProgressSchema.index({ userId: 1, missionId: 1, periodKey: 1 }, { unique: true });
userMissionProgressSchema.index({ userId: 1, periodKey: 1 });

export const Mission = mongoose.model<IMissionDocument>('Mission', missionSchema);
export const UserMissionProgress = mongoose.model<IUserMissionProgressDocument>(
  'UserMissionProgress',
  userMissionProgressSchema
);
