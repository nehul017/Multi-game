export const SOCKET_EVENTS = {
  CHAT: {
    SEND_MESSAGE: 'chat:sendMessage',
    TYPING: 'chat:typing',
    STOP_TYPING: 'chat:stopTyping',
    JOIN_ROOM: 'chat:joinRoom',
    LEAVE_ROOM: 'chat:leaveRoom',
    NEW_MESSAGE: 'chat:newMessage',
    USER_TYPING: 'chat:userTyping',
    USER_STOP_TYPING: 'chat:userStopTyping',
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
    MATCHMAKING: 'game:matchmaking',
    CANCEL_MATCHMAKING: 'game:cancelMatchmaking',
    ROOM_CREATED: 'game:roomCreated',
    MATCH_FOUND: 'game:matchFound',
    PLAYER_JOINED: 'game:playerJoined',
    PLAYER_LEFT: 'game:playerLeft',
    GAME_START: 'game:gameStart',
    MOVE_MADE: 'game:moveMade',
    GAME_OVER: 'game:gameOver',
    DRAW_OFFERED: 'game:drawOffered',
    SPECTATOR_JOINED: 'game:spectatorJoined',
    COUNTDOWN: 'game:countdown',
    RECONNECTED: 'game:reconnected',
  },

  NOTIFICATION: {
    SUBSCRIBE: 'notification:subscribe',
    NEW: 'notification:new',
    UNREAD_COUNT: 'notification:unreadCount',
    FRIEND_REQUEST: 'notification:friendRequest',
  },

  PLATFORM: {
    SUBSCRIBE: 'platform:subscribe',
    STATUS: 'platform:status',
  },

  PRESENCE: {
    USER_ONLINE: 'presence:userOnline',
    USER_OFFLINE: 'presence:userOffline',
    ONLINE_USERS: 'presence:onlineUsers',
  },
} as const;
