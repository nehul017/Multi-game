import { body } from 'express-validator';

export const createMatchValidator = [
  body('gameType')
    .notEmpty().withMessage('Game type is required')
    .isString().withMessage('Game type must be a string'),
  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object'),
];
