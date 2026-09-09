import { body } from 'express-validator';

export const createMatchValidator = [
  body('gameType')
    .notEmpty().withMessage('Game type is required')
    .isString().withMessage('Game type must be a string'),
  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object'),
];

export const startSessionValidator = [
  body('gameType')
    .optional()
    .isString().withMessage('Game type must be a string'),
  body('gameId')
    .optional()
    .isString().withMessage('Game id must be a string'),
  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object'),
  body().custom((_, { req }) => {
    if (!req.body?.gameType && !req.body?.gameId) {
      throw new Error('Game type is required');
    }
    return true;
  }),
];

export const completeMatchValidator = [
  body('score').optional().isFloat({ min: 0, max: 10000000 }),
  body('lines').optional().isInt({ min: 0, max: 100000 }),
  body('level').optional().isInt({ min: 1, max: 1000 }),
  body('durationMs').optional().isInt({ min: 0 }),
  body('result').optional().isIn(['win', 'loss', 'draw', 'completed']),
  body('reason').optional().isString().isLength({ max: 40 }),
  body('moves').optional().isInt({ min: 0, max: 10000 }),
  body('mode').optional().isString().isLength({ max: 32 }),
];
