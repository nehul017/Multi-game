import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/user.model';
import { Game } from '../models/game.model';
import { Achievement } from '../models/achievement.model';
import { Settings } from '../models/settings.model';
import { StoreItem } from '../models/store-item.model';
import { CoinPack } from '../models/coin-pack.model';
import { Mission } from '../models/mission.model';
import { generateReferralCode } from '../utils/helpers';

const seedDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('Connected to MongoDB for seeding');

    const adminData = {
      username: 'admin',
      email: 'admin@multigame.com',
      password: 'Admin@123',
      role: 'admin' as const,
      isVerified: true,
      avatar: '',
      bio: 'Platform Administrator',
    };

    const existingAdmin = await User.findOne({ email: adminData.email }).select('+password');
    if (!existingAdmin) {
      await User.create(adminData);
      console.log('Admin user created (admin@multigame.com / Admin@123)');
    } else {
      existingAdmin.password = adminData.password;
      await existingAdmin.save();
      console.log('Admin user password reset (admin@multigame.com / Admin@123)');
    }

    const games = [
      {
        name: 'Tic Tac Toe',
        slug: 'tic-tac-toe',
        description: 'Classic 3x3 grid game. Get three in a row to win!',
        minPlayers: 2,
        maxPlayers: 2,
        category: 'board',
        settings: { boardSize: 3 },
        thumbnail: '/images/games/tic-tac-toe.png',
      },
      {
        name: 'Connect Four',
        slug: 'connect-four',
        description: 'Drop discs to get four in a row - horizontally, vertically, or diagonally!',
        minPlayers: 2,
        maxPlayers: 2,
        category: 'board',
        settings: { rows: 6, cols: 7 },
        thumbnail: '/images/games/connect-four.png',
      },
      {
        name: 'Chess',
        slug: 'chess',
        description: 'The classic strategy board game. Checkmate your opponent to win!',
        minPlayers: 2,
        maxPlayers: 2,
        category: 'board',
        settings: { timeControl: 600 },
        thumbnail: '/images/games/chess.png',
      },
      {
        name: 'Coil Rush',
        slug: 'snake-multiplayer',
        description: 'Original slither battle. Steer, boost, eat pellets, and cut rival coils. Friends can join a live arena.',
        minPlayers: 1,
        maxPlayers: 8,
        category: 'arcade',
        settings: { worldSize: 2400, tickRate: 50 },
        thumbnail: '/images/games/snake.png',
      },
      {
        name: 'Ludo',
        slug: 'ludo',
        description: 'Classic board game for 2-4 players. Roll the dice and race to the finish!',
        minPlayers: 2,
        maxPlayers: 4,
        category: 'board',
        settings: { tokensPerPlayer: 4 },
        thumbnail: '/images/games/ludo.png',
      },
      {
        name: 'Quiz Battle',
        slug: 'quiz-battle',
        description: 'Test your knowledge in a real-time quiz battle against other players!',
        minPlayers: 2,
        maxPlayers: 8,
        category: 'trivia',
        settings: { rounds: 10, timePerQuestion: 20 },
        thumbnail: '/images/games/quiz.png',
      },
      {
        name: 'Block Master',
        slug: 'block-master',
        description: 'Stack, rotate, and clear under rising pressure.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'puzzle',
        settings: { cols: 10, rows: 20 },
        thumbnail: '/images/games/block-master.jpg',
      },
    ];

    for (const game of games) {
      const existing = await Game.findOne({ slug: game.slug });
      if (!existing) {
        await Game.create(game);
        console.log(`Game created: ${game.name}`);
      } else if (game.slug === 'snake-multiplayer' && existing.minPlayers !== game.minPlayers) {
        existing.minPlayers = game.minPlayers;
        existing.description = game.description;
        await existing.save();
        console.log(`Game updated: ${game.name}`);
      }
    }

    const achievements = [
      { name: 'First Blood', description: 'Win your first game', icon: '🎯', category: 'general', condition: { type: 'wins', value: 1 }, xpReward: 50, coinReward: 50, rarity: 'common' },
      { name: 'Veteran', description: 'Play 100 games', icon: '🎖️', category: 'general', condition: { type: 'games_played', value: 100 }, xpReward: 200, coinReward: 150, rarity: 'uncommon' },
      { name: 'Champion', description: 'Win 50 games', icon: '🏆', category: 'general', condition: { type: 'wins', value: 50 }, xpReward: 500, coinReward: 400, rarity: 'rare' },
      { name: 'Rising Star', description: 'Reach ELO 1200', icon: '⭐', category: 'ranking', condition: { type: 'elo', value: 1200 }, xpReward: 100, coinReward: 75, rarity: 'common' },
      { name: 'Gold Player', description: 'Reach Gold rank (ELO 1600)', icon: '🥇', category: 'ranking', condition: { type: 'elo', value: 1600 }, xpReward: 300, coinReward: 200, rarity: 'uncommon' },
      { name: 'Diamond Player', description: 'Reach Diamond rank (ELO 2000)', icon: '💎', category: 'ranking', condition: { type: 'elo', value: 2000 }, xpReward: 800, coinReward: 500, rarity: 'epic' },
      { name: 'Grandmaster', description: 'Reach Grandmaster rank (ELO 2400)', icon: '👑', category: 'ranking', condition: { type: 'elo', value: 2400 }, xpReward: 2000, coinReward: 1500, rarity: 'legendary' },
      { name: 'Social Butterfly', description: 'Add 10 friends', icon: '🦋', category: 'social', condition: { type: 'friends', value: 10 }, xpReward: 150, coinReward: 100, rarity: 'uncommon' },
      { name: 'Level 10', description: 'Reach level 10', icon: '📊', category: 'general', condition: { type: 'level', value: 10 }, xpReward: 200, coinReward: 150, rarity: 'uncommon' },
      { name: 'Level 25', description: 'Reach level 25', icon: '📈', category: 'general', condition: { type: 'level', value: 25 }, xpReward: 500, coinReward: 400, rarity: 'rare' },
      { name: 'On Fire', description: 'Win 5 games in a row', icon: '🔥', category: 'general', condition: { type: 'win_streak', value: 5 }, xpReward: 250, coinReward: 200, rarity: 'rare' },
      { name: 'Unstoppable', description: 'Win 10 games in a row', icon: '⚡', category: 'general', condition: { type: 'win_streak', value: 10 }, xpReward: 1000, coinReward: 750, rarity: 'epic' },
    ];

    for (const achievement of achievements) {
      const existing = await Achievement.findOne({ name: achievement.name });
      if (!existing) {
        await Achievement.create(achievement);
        console.log(`Achievement created: ${achievement.name}`);
      }
    }

    const settings = [
      { key: 'maintenance_mode', value: false, category: 'system', description: 'Enable maintenance mode' },
      { key: 'max_concurrent_games', value: 1000, category: 'game', description: 'Maximum concurrent games' },
      { key: 'default_elo', value: 1000, category: 'ranking', description: 'Default ELO for new players' },
      { key: 'registration_enabled', value: true, category: 'auth', description: 'Allow new registrations' },
      { key: 'email_verification', value: true, category: 'auth', description: 'Require email verification' },
      { key: 'rate_limit', value: 100, category: 'system', description: 'API rate limit per minute' },
      { key: 'login_attempts', value: 5, category: 'auth', description: 'Max login attempts' },
      { key: 'lockout_duration', value: 15, category: 'auth', description: 'Lockout duration in minutes' },
      { key: 'smtp_host', value: '', category: 'email', description: 'SMTP host' },
      { key: 'smtp_port', value: 587, category: 'email', description: 'SMTP port' },
      { key: 'from_email', value: '', category: 'email', description: 'From email address' },
      { key: 'chat_enabled', value: true, category: 'chat', description: 'Enable chat feature' },
      { key: 'tournament_enabled', value: true, category: 'tournament', description: 'Enable tournaments' },
    ];

    for (const setting of settings) {
      const existing = await Settings.findOne({ key: setting.key });
      if (!existing) {
        await Settings.create(setting);
        console.log(`Setting created: ${setting.key}`);
      }
    }

    const storeItems = [
      { name: 'Neon Avatar', description: 'Electric neon profile look', type: 'avatar', rarity: 'uncommon', price: 150, image: '/images/store/avatar-neon.svg', isPremium: false },
      { name: 'Champion Avatar', description: 'Gold champion silhouette', type: 'avatar', rarity: 'rare', price: 300, image: '/images/store/avatar-champion.svg', isPremium: false },
      { name: 'Midnight Theme', description: 'Deep midnight arena theme', type: 'theme', rarity: 'rare', price: 250, image: '/images/store/theme-midnight.svg', metadata: { themeKey: 'midnight' } },
      { name: 'Ember Theme', description: 'Warm ember glow theme', type: 'theme', rarity: 'epic', price: 450, image: '/images/store/theme-ember.svg', metadata: { themeKey: 'ember' }, isPremium: true },
      { name: 'Silver Frame', description: 'Polished silver avatar frame', type: 'frame', rarity: 'common', price: 100, image: '/images/store/frame-silver.svg' },
      { name: 'Ruby Frame', description: 'Premium ruby avatar frame', type: 'frame', rarity: 'epic', price: 500, image: '/images/store/frame-ruby.svg', isPremium: true },
      { name: 'Rookie Badge', description: 'Show your rising status', type: 'badge', rarity: 'common', price: 75, image: '/images/store/badge-rookie.svg' },
      { name: 'Legend Badge', description: 'For elite competitors', type: 'badge', rarity: 'legendary', price: 1000, image: '/images/store/badge-legend.svg', isPremium: true },
      { name: 'XP Boost (1 match)', description: 'Double XP on your next match', type: 'consumable', rarity: 'uncommon', price: 120, image: '/images/store/boost-xp.svg', metadata: { effect: 'xp_boost', matches: 1 } },
    ];

    for (const item of storeItems) {
      const existing = await StoreItem.findOne({ name: item.name });
      if (!existing) {
        await StoreItem.create(item);
        console.log(`Store item created: ${item.name}`);
      }
    }

    const packs = [
      { name: 'Starter Pack', description: 'A boost of coins to get going', coins: 500, bonusCoins: 50, priceLabel: 'Claim', isFeatured: true, sortOrder: 1 },
      { name: 'Competitor Pack', description: 'Solid coin bundle for ranked play', coins: 1500, bonusCoins: 250, priceLabel: 'Claim', isFeatured: false, sortOrder: 2 },
      { name: 'Champion Pack', description: 'Large coin haul with bonus', coins: 4000, bonusCoins: 1000, priceLabel: 'Claim', isFeatured: true, sortOrder: 3 },
    ];

    for (const pack of packs) {
      const existing = await CoinPack.findOne({ name: pack.name });
      if (!existing) {
        await CoinPack.create(pack);
        console.log(`Coin pack created: ${pack.name}`);
      }
    }

    const missions = [
      { title: 'Daily Login', description: 'Claim your daily login reward', type: 'daily', condition: { type: 'login', value: 1 }, coinReward: 30, xpReward: 20 },
      { title: 'Win One Match', description: 'Win any multiplayer match today', type: 'daily', condition: { type: 'wins', value: 1 }, coinReward: 60, xpReward: 40 },
      { title: 'Play Three Games', description: 'Complete 3 matches today', type: 'daily', condition: { type: 'games_played', value: 3 }, coinReward: 80, xpReward: 50 },
      { title: 'Weekly Warrior', description: 'Win 10 matches this week', type: 'weekly', condition: { type: 'wins', value: 10 }, coinReward: 400, xpReward: 200 },
      { title: 'Active Week', description: 'Play 20 matches this week', type: 'weekly', condition: { type: 'games_played', value: 20 }, coinReward: 350, xpReward: 180 },
      { title: 'Big Spender', description: 'Spend 500 coins in the store this week', type: 'weekly', condition: { type: 'spend_coins', value: 500 }, coinReward: 200, xpReward: 100 },
    ];

    for (const mission of missions) {
      const existing = await Mission.findOne({ title: mission.title });
      if (!existing) {
        await Mission.create(mission);
        console.log(`Mission created: ${mission.title}`);
      }
    }

    // Ensure admin has referral code and starting coins
    const admin = await User.findOne({ email: 'admin@multigame.com' });
    if (admin) {
      if (!admin.referralCode) {
        admin.referralCode = generateReferralCode(admin.username);
      }
      if ((admin.coins ?? 0) < 1000) {
        admin.coins = 5000;
      }
      await admin.save();
    }

    console.log('\nSeed completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
