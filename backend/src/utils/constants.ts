export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const ELO = {
  DEFAULT: 1000,
  K_FACTOR_NEW: 40,
  K_FACTOR_STANDARD: 20,
  K_FACTOR_HIGH: 10,
  HIGH_ELO_THRESHOLD: 2400,
  NEW_PLAYER_GAMES: 30,
};

export const XP_REWARDS = {
  WIN: 50,
  LOSS: 10,
  DRAW: 25,
  ACHIEVEMENT: 100,
  GAME_PLAYED: 5,
};

export const COIN_REWARDS = {
  WELCOME: 500,
  WIN: 50,
  LOSS: 10,
  DRAW: 20,
  DAILY_LOGIN_BASE: 25,
  DAILY_LOGIN_STREAK_BONUS: 5,
  DAILY_LOGIN_MAX_STREAK_BONUS: 50,
  REFERRAL_REFERRER: 200,
  REFERRAL_REFERRED: 100,
  ACHIEVEMENT_DEFAULT: 50,
};

export const ECONOMY = {
  MAX_PACK_PURCHASES_PER_DAY: 5,
  MIN_BALANCE: 0,
};

export const RANK_TIERS = {
  BRONZE: { min: 0, max: 1399, name: 'Bronze' },
  SILVER: { min: 1400, max: 1599, name: 'Silver' },
  GOLD: { min: 1600, max: 1799, name: 'Gold' },
  PLATINUM: { min: 1800, max: 1999, name: 'Platinum' },
  DIAMOND: { min: 2000, max: 2199, name: 'Diamond' },
  MASTER: { min: 2200, max: 2399, name: 'Master' },
  GRANDMASTER: { min: 2400, max: Infinity, name: 'Grandmaster' },
};

export {
  FILL_BOT_GAMES,
  GAME_PLAYER_LIMITS,
  HIGH_FREQUENCY_GAMES,
  JOIN_IN_PROGRESS_GAMES,
  maxPlayersFor,
  minPlayersToStart,
} from '../games/core/limits';

export const BOT_FILL_MS = 60_000;

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  CHAT: {
    SEND_MESSAGE: 'chat:sendMessage',
    TYPING: 'chat:typing',
    STOP_TYPING: 'chat:stopTyping',
    JOIN_ROOM: 'chat:joinRoom',
    LEAVE_ROOM: 'chat:leaveRoom',
    MARK_READ: 'chat:markRead',
    NEW_MESSAGE: 'chat:newMessage',
    USER_TYPING: 'chat:userTyping',
    USER_STOP_TYPING: 'chat:userStopTyping',
    MESSAGE_READ: 'chat:messageRead',
    UNREAD_COUNT: 'chat:unreadCount',
  },

  GAME: {
    CREATE_ROOM: 'game:createRoom',
    JOIN_ROOM: 'game:joinRoom',
    LEAVE_ROOM: 'game:leaveRoom',
    READY: 'game:ready',
    MAKE_MOVE: 'game:makeMove',
    SURRENDER: 'game:surrender',
    OFFER_DRAW: 'game:offerDraw',
    ACCEPT_DRAW: 'game:acceptDraw',
    SPECTATE: 'game:spectate',
    ROOM_CREATED: 'game:roomCreated',
    PLAYER_JOINED: 'game:playerJoined',
    PLAYER_LEFT: 'game:playerLeft',
    GAME_START: 'game:gameStart',
    MOVE_MADE: 'game:moveMade',
    GAME_OVER: 'game:gameOver',
    DRAW_OFFERED: 'game:drawOffered',
    SPECTATOR_JOINED: 'game:spectatorJoined',
    COUNTDOWN: 'game:countdown',
    RECONNECTED: 'game:reconnected',
    MATCHMAKING: 'game:matchmaking',
    CANCEL_MATCHMAKING: 'game:cancelMatchmaking',
    MATCH_FOUND: 'game:matchFound',
    FILL_BOT: 'game:fillBot',
    JOIN: 'game:join',
    LEAVE: 'game:leave',
    STATE: 'game:state',
    SPIN: 'game:spin',
    SPIN_RESULT: 'game:spin:result',
    BALANCE: 'game:balance',
    HISTORY: 'game:history',
    ERROR: 'game:error',
    CREATE: 'game:create',
    ACTION: 'game:action',
    RECONNECT: 'game:reconnect',
    START: 'game:start',
    FINISH: 'game:finish',
    PAUSE: 'game:pause',
    RESUME: 'game:resume',
    CREATED: 'game:created',
    STARTED: 'game:started',
    FINISHED: 'game:finished',
    PLAYER_JOINED_ALIAS: 'game:player_joined',
    PLAYER_LEFT_ALIAS: 'game:player_left',
    SCORE: 'game:score',
  },

  POKER: {
    LOBBY: 'poker:lobby',
    TABLE_CREATE: 'poker:table:create',
    TABLE_JOIN: 'poker:table:join',
    TABLE_LEAVE: 'poker:table:leave',
    TABLE_STATE: 'poker:table:state',
    PLAYER_JOINED: 'poker:player:joined',
    PLAYER_LEFT: 'poker:player:left',
    HAND_START: 'poker:hand:start',
    CARDS_DEALT: 'poker:cards:dealt',
    COMMUNITY_UPDATE: 'poker:community:update',
    ACTION: 'poker:action',
    ACTION_ACCEPTED: 'poker:action:accepted',
    ACTION_REJECTED: 'poker:action:rejected',
    TURN: 'poker:turn',
    BET: 'poker:bet',
    RAISE: 'poker:raise',
    CALL: 'poker:call',
    CHECK: 'poker:check',
    FOLD: 'poker:fold',
    ALL_IN: 'poker:all-in',
    DRAW: 'poker:draw',
    DRAW_COMPLETE: 'poker:draw:complete',
    SHOWDOWN: 'poker:showdown',
    HAND_RESULT: 'poker:hand:result',
    POT_UPDATE: 'poker:pot:update',
    BALANCE_UPDATE: 'poker:balance:update',
    TIMER: 'poker:timer',
    ERROR: 'poker:error',
    RECONNECT: 'poker:reconnect',
  },

  NOTIFICATION: {
    SUBSCRIBE: 'notification:subscribe',
    NEW: 'notification:new',
    UNREAD_COUNT: 'notification:unreadCount',
    FRIEND_REQUEST: 'notification:friendRequest',
    MATCH_INVITE: 'notification:matchInvite',
    TOURNAMENT_UPDATE: 'notification:tournamentUpdate',
    ACHIEVEMENT_UNLOCKED: 'notification:achievementUnlocked',
  },

  PLATFORM: {
    SUBSCRIBE: 'platform:subscribe',
    STATUS: 'platform:status',
  },

  PRESENCE: {
    USER_ONLINE: 'presence:userOnline',
    USER_OFFLINE: 'presence:userOffline',
    ONLINE_USERS: 'presence:onlineUsers',
    HEARTBEAT: 'presence:heartbeat',
  },
};
