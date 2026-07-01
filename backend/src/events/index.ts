import { EventEmitter } from 'events';

class GameEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

export const gameEvents = new GameEventEmitter();

export const EVENTS = {
  USER_REGISTERED: 'user:registered',
  USER_LOGGED_IN: 'user:loggedIn',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  MATCH_CREATED: 'match:created',
  MATCH_STARTED: 'match:started',
  MATCH_ENDED: 'match:ended',
  MATCH_MOVE: 'match:move',

  FRIEND_REQUEST_SENT: 'friend:requestSent',
  FRIEND_REQUEST_ACCEPTED: 'friend:requestAccepted',

  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',

  TOURNAMENT_STARTED: 'tournament:started',
  TOURNAMENT_ROUND_COMPLETE: 'tournament:roundComplete',
  TOURNAMENT_ENDED: 'tournament:ended',
};
