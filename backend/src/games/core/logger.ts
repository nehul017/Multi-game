type GameLogEvent =
  | 'game_created'
  | 'player_joined'
  | 'player_left'
  | 'game_started'
  | 'action_accepted'
  | 'action_rejected'
  | 'player_disconnected'
  | 'player_reconnected'
  | 'game_finished'
  | 'result_persisted'
  | 'redis_error'
  | 'mongodb_error'
  | 'socket_error'
  | 'GAME_SESSION_CREATED'
  | 'GAME_STARTED'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'GAME_ACTION'
  | 'GAME_COMPLETED'
  | 'GAME_RESULT_SAVED'
  | 'SOCKET_CONNECTED'
  | 'SOCKET_DISCONNECTED';

const SENSITIVE_KEY = /(password|token|secret|authorization|cookie|jwt)/i;

const redact = (value: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = '[redacted]';
    } else if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      out[key] = redact(nested as Record<string, unknown>);
    } else {
      out[key] = nested;
    }
  }
  return out;
};

export const gameLogger = {
  info(event: GameLogEvent, fields: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ level: 'info', event, ...redact(fields), ts: new Date().toISOString() }));
  },
  warn(event: GameLogEvent, fields: Record<string, unknown> = {}): void {
    console.warn(JSON.stringify({ level: 'warn', event, ...redact(fields), ts: new Date().toISOString() }));
  },
  error(event: GameLogEvent, fields: Record<string, unknown> = {}): void {
    console.error(JSON.stringify({ level: 'error', event, ...redact(fields), ts: new Date().toISOString() }));
  },
};
