import { body } from 'express-validator';
import { SETTING_API_KEYS } from '../utils/settings.constants';

export const banUserValidator = [
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
];

export const resolveReportValidator = [
  body('resolution')
    .notEmpty().withMessage('Resolution is required'),
  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['resolved', 'dismissed']).withMessage('Invalid action'),
];

export const broadcastValidator = [
  body('title')
    .notEmpty().withMessage('Title is required'),
  body('message')
    .notEmpty().withMessage('Message is required'),
];

export const updateSettingsValidator = [
  body('maintenanceMode').optional().isBoolean().withMessage('maintenanceMode must be a boolean'),
  body('registrationOpen').optional().isBoolean().withMessage('registrationOpen must be a boolean'),
  body('emailVerification').optional().isBoolean().withMessage('emailVerification must be a boolean'),
  body('rateLimit').optional().isInt({ min: 1 }).withMessage('rateLimit must be a positive integer'),
  body('loginAttempts').optional().isInt({ min: 1 }).withMessage('loginAttempts must be a positive integer'),
  body('lockoutDuration').optional().isInt({ min: 1 }).withMessage('lockoutDuration must be a positive integer'),
  body('smtpHost').optional().isString().withMessage('smtpHost must be a string'),
  body('smtpPort').optional().isInt({ min: 1 }).withMessage('smtpPort must be a positive integer'),
  body('fromEmail')
    .optional({ values: 'falsy' })
    .isEmail()
    .withMessage('fromEmail must be a valid email'),
  body().custom((_, { req }) => {
    const providedKeys = SETTING_API_KEYS.filter((key) => req.body[key] !== undefined);
    if (providedKeys.length === 0) {
      throw new Error('At least one setting is required');
    }
    return true;
  }),
];
