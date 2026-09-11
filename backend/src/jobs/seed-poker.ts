import mongoose from 'mongoose';
import { env } from '../config/env';
import { CASH_LOBBY_TABLES } from '../games/poker/config';
import { Game } from '../models/game.model';
import { PokerPlayerSession } from '../models/poker-player-session.model';
import { PokerTable } from '../models/poker-table.model';

const pokerGame = {
  name: 'Poker Room',
  slug: 'poker',
  description: 'Texas Hold’em, Omaha, Omaha Hi-Lo, and 5 Card Draw on a shared casino table.',
  minPlayers: 2,
  maxPlayers: 9,
  category: 'arcade',
  settings: {
    variants: ['texas-holdem', 'omaha', 'omaha-hi-lo', 'five-card-draw'],
    smallBlind: 5,
    bigBlind: 10,
  },
  thumbnail: '/images/games/poker.jpg',
  isActive: true,
};

const pokerTables = CASH_LOBBY_TABLES.map((table) => ({
  ...table,
  fillBots: false,
}));

const seedPoker = async (): Promise<void> => {
  await mongoose.connect(env.mongodbUri);
  console.log(`Connected to ${env.mongodbUri}`);

  const existingGame = await Game.findOne({ slug: 'poker' });
  if (!existingGame) {
    await Game.create(pokerGame);
    console.log('Game created: Poker Room');
  } else {
    existingGame.name = pokerGame.name;
    existingGame.description = pokerGame.description;
    existingGame.minPlayers = pokerGame.minPlayers;
    existingGame.maxPlayers = pokerGame.maxPlayers;
    existingGame.category = pokerGame.category;
    existingGame.thumbnail = pokerGame.thumbnail;
    existingGame.settings = pokerGame.settings;
    existingGame.isActive = true;
    await existingGame.save();
    console.log('Game updated: Poker Room');
  }

  for (const table of pokerTables) {
    const payload = {
      ...table,
      smallBlind: 5,
      bigBlind: 10,
      buyInMin: 200,
      buyInMax: 2000,
      actionTimeoutMs: 15000,
      status: 'open' as const,
      seatedCount: 0,
    };
    const existing = await PokerTable.findOne({ tableId: table.tableId });
    if (!existing) {
      await PokerTable.create(payload);
      console.log(`Poker table created: ${table.name}`);
    } else {
      Object.assign(existing, payload);
      await existing.save();
      console.log(`Poker table updated: ${table.name}`);
    }
  }

  const retired = await PokerTable.updateMany(
    { $or: [{ fillBots: true }, { tableId: /practice/i }] },
    { $set: { status: 'closed', fillBots: false, seatedCount: 0 } }
  );
  if (retired.modifiedCount) {
    console.log(`Closed ${retired.modifiedCount} practice poker table(s)`);
  }
  const leftBots = await PokerPlayerSession.updateMany(
    { userId: /^bot:/, status: 'seated' },
    { $set: { status: 'left', leftAt: new Date() } }
  );
  if (leftBots.modifiedCount) {
    console.log(`Cleared ${leftBots.modifiedCount} bot seat(s)`);
  }

  const game = await Game.findOne({ slug: 'poker' }).lean();
  const tables = await PokerTable.find({ status: { $in: ['open', 'playing'] } }).lean();
  console.log(JSON.stringify({ game, tables: tables.map((row) => ({ tableId: row.tableId, name: row.name })) }, null, 2));

  await mongoose.connection.close();
};

seedPoker()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Poker seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
