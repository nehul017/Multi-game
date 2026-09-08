import { body, query } from 'express-validator';

const GAME_TYPES = ['texas-holdem', 'omaha', 'omaha-hi-lo', 'five-card-draw'];

export const pokerCreateTableValidator = [
  body('gameType').isIn(GAME_TYPES).withMessage('Invalid poker game type'),
  body('name').optional().isString().isLength({ min: 2, max: 60 }),
  body('maxSeats').optional().isInt({ min: 2, max: 9 }).toInt(),
  body('smallBlind').optional().isInt({ min: 1, max: 10000 }).toInt(),
  body('bigBlind').optional().isInt({ min: 2, max: 20000 }).toInt(),
  body('buyInMin').optional().isInt({ min: 1 }).toInt(),
  body('buyInMax').optional().isInt({ min: 1 }).toInt(),
  body('fillBots').optional().isBoolean().toBoolean(),
];

export const pokerSitValidator = [
  body('tableId').isString().isLength({ min: 8, max: 80 }),
  body('buyIn').isInt({ min: 1, max: 1_000_000 }).toInt(),
  body('seatIndex').optional().isInt({ min: 0, max: 8 }).toInt(),
];

export const pokerHistoryValidator = [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
  query('tableId').optional().isString().isLength({ min: 8, max: 80 }),
];
