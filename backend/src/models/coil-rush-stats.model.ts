import mongoose, { Schema } from 'mongoose';
import { ICoilRushStatsDocument } from '../interfaces/coil-rush-stats.interface';

const coilRushStatsSchema = new Schema<ICoilRushStatsDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    gamesPlayed: { type: Number, default: 0, min: 0 },
    gamesWon: { type: Number, default: 0, min: 0 },
    totalScore: { type: Number, default: 0, min: 0 },
    highestScore: { type: Number, default: 0, min: 0 },
    highestLength: { type: Number, default: 0, min: 0 },
    playersEliminated: { type: Number, default: 0, min: 0 },
    totalSurvivalTimeMs: { type: Number, default: 0, min: 0 },
    favoriteSkin: { type: String, default: 'fire', trim: true, maxlength: 32 },
    bestRank: { type: Number, default: 0, min: 0 },
    lastPlayedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

coilRushStatsSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    return ret;
  },
});

export const CoilRushStats = mongoose.model<ICoilRushStatsDocument>('CoilRushStats', coilRushStatsSchema);
