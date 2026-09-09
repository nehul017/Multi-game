import mongoose, { Schema } from 'mongoose';
import { IMatchDocument } from '../interfaces/match.interface';

const matchPlayerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    elo: { type: Number, required: true },
    result: { type: String, enum: ['win', 'loss', 'draw', 'pending'], default: 'pending' },
  },
  { _id: false }
);

const matchMoveSchema = new Schema(
  {
    player: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const matchSchema = new Schema<IMatchDocument>(
  {
    gameType: { type: String, required: [true, 'Game type is required'], index: true },
    players: { type: [matchPlayerSchema], validate: [arrayMinLength(1), 'At least one player required'] },
    roomId: { type: String, required: true, unique: true, index: true },
    moves: [matchMoveSchema],
    winner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['waiting', 'playing', 'finished', 'draw', 'aborted'],
      default: 'waiting',
      index: true,
    },
    spectators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    replayData: { type: Schema.Types.Mixed, default: {} },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

function arrayMinLength(min: number) {
  return function (val: unknown[]) {
    return val.length >= min;
  };
}

matchSchema.index({ 'players.userId': 1 });
matchSchema.index({ createdAt: -1 });
matchSchema.index({ gameType: 1, status: 1 });

matchSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    if (ret.settings && typeof ret.settings === 'object') {
      const settings = { ...(ret.settings as Record<string, unknown>) };
      delete settings._deckSeed;
      delete settings.deckSeed;
      ret.settings = settings;
    }
    return ret;
  },
});

export const Match = mongoose.model<IMatchDocument>('Match', matchSchema);
