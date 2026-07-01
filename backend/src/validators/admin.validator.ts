import { body } from 'express-validator';

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

export const settingValidator = [
  body('key')
    .notEmpty().withMessage('Key is required'),
  body('value')
    .exists().withMessage('Value is required'),
  body('category')
    .notEmpty().withMessage('Category is required'),
];
