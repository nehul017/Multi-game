import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/user.model';
import { Game } from '../models/game.model';
import { Achievement } from '../models/achievement.model';
import { Settings } from '../models/settings.model';

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
        name: 'Snake Multiplayer',
        slug: 'snake-multiplayer',
        description: 'Multiplayer snake game. Eat food, grow longer, and outlast your opponents!',
        minPlayers: 2,
        maxPlayers: 4,
        category: 'arcade',
        settings: { gridSize: 30, tickRate: 150 },
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
    ];

    for (const game of games) {
      const existing = await Game.findOne({ slug: game.slug });
      if (!existing) {
        await Game.create(game);
        console.log(`Game created: ${game.name}`);
      }
    }

    const achievements = [
      { name: 'First Blood', description: 'Win your first game', icon: '🎯', category: 'general', condition: { type: 'wins', value: 1 }, xpReward: 50, rarity: 'common' },
      { name: 'Veteran', description: 'Play 100 games', icon: '🎖️', category: 'general', condition: { type: 'games_played', value: 100 }, xpReward: 200, rarity: 'uncommon' },
      { name: 'Champion', description: 'Win 50 games', icon: '🏆', category: 'general', condition: { type: 'wins', value: 50 }, xpReward: 500, rarity: 'rare' },
      { name: 'Rising Star', description: 'Reach ELO 1200', icon: '⭐', category: 'ranking', condition: { type: 'elo', value: 1200 }, xpReward: 100, rarity: 'common' },
      { name: 'Gold Player', description: 'Reach Gold rank (ELO 1600)', icon: '🥇', category: 'ranking', condition: { type: 'elo', value: 1600 }, xpReward: 300, rarity: 'uncommon' },
      { name: 'Diamond Player', description: 'Reach Diamond rank (ELO 2000)', icon: '💎', category: 'ranking', condition: { type: 'elo', value: 2000 }, xpReward: 800, rarity: 'epic' },
      { name: 'Grandmaster', description: 'Reach Grandmaster rank (ELO 2400)', icon: '👑', category: 'ranking', condition: { type: 'elo', value: 2400 }, xpReward: 2000, rarity: 'legendary' },
      { name: 'Social Butterfly', description: 'Add 10 friends', icon: '🦋', category: 'social', condition: { type: 'friends', value: 10 }, xpReward: 150, rarity: 'uncommon' },
      { name: 'Level 10', description: 'Reach level 10', icon: '📊', category: 'general', condition: { type: 'level', value: 10 }, xpReward: 200, rarity: 'uncommon' },
      { name: 'Level 25', description: 'Reach level 25', icon: '📈', category: 'general', condition: { type: 'level', value: 25 }, xpReward: 500, rarity: 'rare' },
      { name: 'On Fire', description: 'Win 5 games in a row', icon: '🔥', category: 'general', condition: { type: 'win_streak', value: 5 }, xpReward: 250, rarity: 'rare' },
      { name: 'Unstoppable', description: 'Win 10 games in a row', icon: '⚡', category: 'general', condition: { type: 'win_streak', value: 10 }, xpReward: 1000, rarity: 'epic' },
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
