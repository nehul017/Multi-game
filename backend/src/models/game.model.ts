import mongoose, { Schema } from 'mongoose';
import { IGameDocument } from '../interfaces/game.interface';

const gameSchema = new Schema<IGameDocument>(
  {
    name: { type: String, required: [true, 'Game name is required'], unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: [true, 'Description is required'], maxlength: 1000 },
    minPlayers: { type: Number, required: true, min: 1, default: 2 },
    maxPlayers: { type: Number, required: true, min: 1, default: 2 },
    isActive: { type: Boolean, default: true, index: true },
    settings: { type: Schema.Types.Mixed, default: {} },
    thumbnail: { type: String, default: '' },
    category: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

gameSchema.index({ name: 'text', description: 'text' });

export const Game = mongoose.model<IGameDocument>('Game', gameSchema);
