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

export const RANK_TIERS = {
  BRONZE: { min: 0, max: 1399, name: 'Bronze' },
  SILVER: { min: 1400, max: 1599, name: 'Silver' },
  GOLD: { min: 1600, max: 1799, name: 'Gold' },
  PLATINUM: { min: 1800, max: 1999, name: 'Platinum' },
  DIAMOND: { min: 2000, max: 2199, name: 'Diamond' },
  MASTER: { min: 2200, max: 2399, name: 'Master' },
  GRANDMASTER: { min: 2400, max: Infinity, name: 'Grandmaster' },
};

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
  },

  NOTIFICATION: {
    SUBSCRIBE: 'notification:subscribe',
    NEW: 'notification:new',
    FRIEND_REQUEST: 'notification:friendRequest',
    MATCH_INVITE: 'notification:matchInvite',
    TOURNAMENT_UPDATE: 'notification:tournamentUpdate',
    ACHIEVEMENT_UNLOCKED: 'notification:achievementUnlocked',
  },

  PRESENCE: {
    USER_ONLINE: 'presence:userOnline',
    USER_OFFLINE: 'presence:userOffline',
    ONLINE_USERS: 'presence:onlineUsers',
    HEARTBEAT: 'presence:heartbeat',
  },
};
