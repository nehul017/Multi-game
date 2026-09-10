import { Types } from 'mongoose';
import { CoilRushStats } from '../models/coil-rush-stats.model';

export interface CoilRushRunInput {
  score?: number;
  length?: number;
  kills?: number;
  durationMs?: number;
  rank?: number;
  won?: boolean;
  skin?: string;
}

const asFinite = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const recordCoilRushRun = async (userId: string, input: CoilRushRunInput): Promise<void> => {
  if (!userId || userId.startsWith('bot:') || !Types.ObjectId.isValid(userId)) return;

  const score = Math.floor(asFinite(input.score));
  const length = Math.floor(asFinite(input.length));
  const kills = Math.floor(asFinite(input.kills));
  const durationMs = Math.floor(asFinite(input.durationMs));
  const rank = Math.floor(asFinite(input.rank));
  const skin = typeof input.skin === 'string' ? input.skin.slice(0, 32) : undefined;

  await CoilRushStats.findOneAndUpdate(
    { user: userId },
    {
      $inc: {
        gamesPlayed: 1,
        gamesWon: input.won ? 1 : 0,
        totalScore: score,
        playersEliminated: kills,
        totalSurvivalTimeMs: durationMs,
      },
      $max: {
        highestScore: score,
        highestLength: length,
      },
      $set: {
        lastPlayedAt: new Date(),
        ...(skin ? { favoriteSkin: skin } : {}),
        ...(rank > 0 ? {} : {}),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (rank > 0) {
    await CoilRushStats.updateOne(
      {
        user: userId,
        $or: [{ bestRank: 0 }, { bestRank: { $gt: rank } }],
      },
      { $set: { bestRank: rank } }
    );
  }
};
