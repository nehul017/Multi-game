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
        description: 'A sharper, ranked take on the original grid duel. Get three in a row.',
        minPlayers: 2,
        maxPlayers: 2,
        category: 'puzzle',
        settings: { boardSize: 3 },
        thumbnail: '/images/games/tic-tac-toe.jpg',
      },
      {
        name: 'Connect Four',
        slug: 'connect-four',
        description: 'Drop, block, and connect four under pressure in this ranked duel.',
        minPlayers: 2,
        maxPlayers: 2,
        category: 'puzzle',
        settings: { rows: 6, cols: 7 },
        thumbnail: '/images/games/connect-four.jpg',
      },
      {
        name: 'Chess',
        slug: 'chess',
        description: 'The classic mind sport, rebuilt for ranked play. Outthink opponents, watch the clock, and climb the board.',
        minPlayers: 2,
        maxPlayers: 2,
        category: 'strategy',
        settings: { timeControl: 600 },
        thumbnail: '/images/games/chess.jpg',
      },
      {
        name: 'Coil Rush',
        slug: 'snake-multiplayer',
        description: 'Original slither battle. Steer, boost, eat pellets, and cut rival coils. Friends can join a live arena.',
        minPlayers: 1,
        maxPlayers: 8,
        category: 'arcade',
        settings: { worldSize: 2400, tickRate: 50 },
        thumbnail: '/images/games/snake.jpg',
      },
      {
        name: 'Ludo',
        slug: 'ludo',
        description: 'Race your tokens home in a modern multiplayer classic for 2-4 players.',
        minPlayers: 2,
        maxPlayers: 4,
        category: 'arcade',
        settings: { tokensPerPlayer: 4 },
        thumbnail: '/images/games/ludo.jpg',
      },
      {
        name: 'Quiz Battle',
        slug: 'quiz-battle',
        description: 'Rapid-fire trivia battles. Answer fast, climb the room, and outscore the lobby.',
        minPlayers: 2,
        maxPlayers: 8,
        category: 'puzzle',
        settings: { rounds: 10, timePerQuestion: 20 },
        thumbnail: '/images/games/quiz.jpg',
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
      {
        name: 'Classic Fruit Slots',
        slug: 'classic-fruit-slots',
        description: 'A classic 5-reel fruit slot machine. Spin cherries, bells, and lucky sevens for line wins.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'arcade',
        settings: { reels: 5, rows: 3, minBet: 10, maxBet: 500 },
        thumbnail: '/images/games/classic-fruit-slots.svg',
      },
      {
        name: 'Cyber Strike',
        slug: 'cyber-strike',
        description: 'Breach neon megacities in fast tactical raids with live squads.',
        minPlayers: 2,
        maxPlayers: 8,
        category: 'action',
        thumbnail: '/images/games/cyber-strike.jpg',
      },
      {
        name: 'Battle Arena',
        slug: 'battle-arena',
        description: 'Read the field, time your strike, and outplay rivals in a live arena.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'action',
        thumbnail: '/images/games/battle-arena.jpg',
      },
      {
        name: 'Shadow Warriors',
        slug: 'shadow-warriors',
        description: 'Silent takedowns and close-quarters combat across a city of shadows.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'action',
        thumbnail: '/images/games/shadow-warriors.jpg',
      },
      {
        name: 'Zombie Survival',
        slug: 'zombie-survival',
        description: 'Scavenge, fortify, and last the night against endless hordes.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'action',
        thumbnail: '/images/games/zombie-survival.jpg',
      },
      {
        name: 'Warzone Legends',
        slug: 'warzone-legends',
        description: 'Large-scale firefights where positioning and loadouts decide the round.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'action',
        thumbnail: '/images/games/warzone-legends.jpg',
      },
      {
        name: 'Mystic Valley',
        slug: 'mystic-valley',
        description: 'Wander luminous wilds, uncover ruins, and follow the valley’s secrets.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'adventure',
        thumbnail: '/images/games/mystic-valley.jpg',
      },
      {
        name: 'Lost Kingdom',
        slug: 'lost-kingdom',
        description: 'Restore a forgotten realm through exploration, quests, and alliances.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'adventure',
        thumbnail: '/images/games/lost-kingdom.jpg',
      },
      {
        name: 'Island Explorer',
        slug: 'island-explorer',
        description: 'Chart unmapped islands, gather relics, and survive shifting tides.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'adventure',
        thumbnail: '/images/games/island-explorer.jpg',
      },
      {
        name: 'Dragon Quest',
        slug: 'dragon-quest',
        description: 'A legendary journey across kingdoms threatened by ancient dragons.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'adventure',
        thumbnail: '/images/games/dragon-quest.jpg',
      },
      {
        name: 'Neon Racers',
        slug: 'neon-racers',
        description: 'Night circuits, nitro lines, and razor-thin finishes in a neon city.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'racing',
        thumbnail: '/images/games/neon-racers.jpg',
      },
      {
        name: 'Street Velocity',
        slug: 'street-velocity',
        description: 'Illegal midnight runs through tight streets and wet asphalt.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'racing',
        thumbnail: '/images/games/street-velocity.jpg',
      },
      {
        name: 'Turbo Legends',
        slug: 'turbo-legends',
        description: 'Classic machines, modern handling, and championship-grade rivalries.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'racing',
        thumbnail: '/images/games/turbo-legends.jpg',
      },
      {
        name: 'Drift Masters',
        slug: 'drift-masters',
        description: 'Hold the slide, score the line, and own every hairpin.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'racing',
        thumbnail: '/images/games/drift-masters.jpg',
      },
      {
        name: 'Shadow Quest',
        slug: 'shadow-quest',
        description: 'Forge a hero, hunt relics, and unravel a conspiracy in the dark.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'rpg',
        thumbnail: '/images/games/shadow-quest.jpg',
      },
      {
        name: 'Legend of Heroes',
        slug: 'legend-of-heroes',
        description: 'Party-based battles and branching stories across a living continent.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'rpg',
        thumbnail: '/images/games/legend-of-heroes.jpg',
      },
      {
        name: 'Dragon Realms',
        slug: 'dragon-realms',
        description: 'Raise a dragon companion and carve a path through rival clans.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'rpg',
        thumbnail: '/images/games/dragon-realms.jpg',
      },
      {
        name: 'Dark Kingdom',
        slug: 'dark-kingdom',
        description: 'Reclaim a cursed throne through dungeon delves and hard choices.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'rpg',
        thumbnail: '/images/games/dark-kingdom.jpg',
      },
      {
        name: 'Galaxy Warriors',
        slug: 'galaxy-warriors',
        description: 'Orbital dogfights and boarding raids across a fractured galaxy.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'shooter',
        thumbnail: '/images/games/galaxy-warriors.jpg',
      },
      {
        name: 'Cyber Assault',
        slug: 'cyber-assault',
        description: 'Objective-based firefights in a rain-soaked cyber district.',
        minPlayers: 4,
        maxPlayers: 12,
        category: 'shooter',
        thumbnail: '/images/games/cyber-assault.jpg',
      },
      {
        name: 'Space Force',
        slug: 'space-force',
        description: 'Zero-g combat, breach charges, and precision orbital strikes.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'shooter',
        thumbnail: '/images/games/space-force.jpg',
      },
      {
        name: 'Battle Front',
        slug: 'battle-front',
        description: 'Frontline warfare with vehicles, squads, and shifting objectives.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'shooter',
        thumbnail: '/images/games/battle-front.jpg',
      },
      {
        name: 'Empire Wars',
        slug: 'empire-wars',
        description: 'Expand your empire, manage supply lines, and win the long war.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'strategy',
        thumbnail: '/images/games/empire-wars.jpg',
      },
      {
        name: 'Battle Tactics',
        slug: 'battle-tactics',
        description: 'Turn-based campaigns where every unit placement matters.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'strategy',
        thumbnail: '/images/games/battle-tactics.jpg',
      },
      {
        name: 'Kingdom Clash',
        slug: 'kingdom-clash',
        description: 'Build, siege, and negotiate in a contest of rival crowns.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'strategy',
        thumbnail: '/images/games/kingdom-clash.jpg',
      },
      {
        name: 'War Command',
        slug: 'war-command',
        description: 'Issue real-time orders across a theater of modern conflict.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'strategy',
        thumbnail: '/images/games/war-command.jpg',
      },
      {
        name: 'Football Legends',
        slug: 'football-legends',
        description: 'Club rivalries, last-minute goals, and a season built for glory.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'sports',
        thumbnail: '/images/games/football-legends.jpg',
      },
      {
        name: 'Basketball Pro',
        slug: 'basketball-pro',
        description: 'Pick-and-roll mastery and highlight dunks in a pro league sim.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'sports',
        thumbnail: '/images/games/basketball-pro.jpg',
      },
      {
        name: 'Tennis Champions',
        slug: 'tennis-champions',
        description: 'Serve, volley, and grind out five-set classics on tour.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'sports',
        thumbnail: '/images/games/tennis-champions.jpg',
      },
      {
        name: 'Street Cricket',
        slug: 'street-cricket',
        description: 'Tape-ball energy, rooftop catches, and neighborhood bragging rights.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'sports',
        thumbnail: '/images/games/street-cricket.jpg',
      },
      {
        name: 'Puzzle World',
        slug: 'puzzle-world',
        description: 'A growing atlas of clever rooms, riddles, and satisfying snaps.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'puzzle',
        thumbnail: '/images/games/puzzle-world.jpg',
      },
      {
        name: 'Brain Challenge',
        slug: 'brain-challenge',
        description: 'Daily logic gauntlets that get sharper the longer you last.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'puzzle',
        thumbnail: '/images/games/brain-challenge.jpg',
      },
      {
        name: 'Color Quest',
        slug: 'color-quest',
        description: 'Match hues, chase combos, and unwind through vibrant boards.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'puzzle',
        thumbnail: '/images/games/color-quest.jpg',
      },
      {
        name: 'Pixel Builder',
        slug: 'pixel-builder',
        description: 'Place every block with intent and watch a tiny world come alive.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'simulation',
        thumbnail: '/images/games/pixel-builder.jpg',
      },
      {
        name: 'City Builder',
        slug: 'city-builder',
        description: 'Zone, budget, and grow a skyline that actually works.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'simulation',
        thumbnail: '/images/games/city-builder.jpg',
      },
      {
        name: 'Farm Life',
        slug: 'farm-life',
        description: 'Plant, harvest, and turn a quiet plot into a thriving homestead.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'simulation',
        thumbnail: '/images/games/farm-life.jpg',
      },
      {
        name: 'Airport Manager',
        slug: 'airport-manager',
        description: 'Keep gates moving, runways clear, and passengers on time.',
        minPlayers: 1,
        maxPlayers: 1,
        category: 'simulation',
        thumbnail: '/images/games/airport-manager.jpg',
      },
    ];

    for (const game of games) {
      const existing = await Game.findOne({ slug: game.slug });
      if (!existing) {
        await Game.create(game);
        console.log(`Game created: ${game.name}`);
        continue;
      }

      existing.name = game.name;
      existing.description = game.description;
      existing.minPlayers = game.minPlayers;
      existing.maxPlayers = game.maxPlayers;
      existing.category = game.category;
      existing.thumbnail = game.thumbnail;
      existing.isActive = true;
      if (game.settings) {
        existing.settings = game.settings;
      }
      await existing.save();
      console.log(`Game updated: ${game.name}`);
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
