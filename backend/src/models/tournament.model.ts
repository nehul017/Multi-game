import mongoose, { Schema } from 'mongoose';
import { ITournamentDocument } from '../interfaces/tournament.interface';

const bracketMatchSchema = new Schema(
  {
    round: { type: Number, required: true },
    matchNumber: { type: Number, required: true },
    player1: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    player2: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    winner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    score1: { type: Number, default: 0 },
    score2: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'playing', 'completed'], default: 'pending' },
  },
  { _id: false }
);

const tournamentSchema = new Schema<ITournamentDocument>(
  {
    name: { type: String, required: [true, 'Tournament name is required'], trim: true },
    description: { type: String, default: '' },
    gameType: { type: String, required: [true, 'Game type is required'], index: true },
    format: {
      type: String,
      enum: ['single_elimination', 'double_elimination', 'round_robin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'registration', 'in_progress', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    maxParticipants: { type: Number, required: true, min: 2 },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    brackets: [bracketMatchSchema],
    rounds: { type: Number, default: 0 },
    currentRound: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    prize: { type: String, default: '' },
    rules: { type: String, default: '' },
  },
  { timestamps: true }
);

tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ createdBy: 1 });

export const Tournament = mongoose.model<ITournamentDocument>('Tournament', tournamentSchema);
