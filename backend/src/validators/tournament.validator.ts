import { body } from 'express-validator';

export const createTournamentValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('gameType')
    .notEmpty().withMessage('Game type is required'),
  body('format')
    .notEmpty().withMessage('Format is required')
    .isIn(['single_elimination', 'double_elimination', 'round_robin'])
    .withMessage('Invalid format'),
  body('maxParticipants')
    .notEmpty().withMessage('Max participants is required')
    .isInt({ min: 2, max: 256 }).withMessage('Max participants must be between 2 and 256'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('prize')
    .optional()
    .isString(),
];

export const joinTournamentValidator = [
  body('tournamentId')
    .optional()
    .isMongoId().withMessage('Invalid tournament ID'),
];
