import { body } from 'express-validator';

export const sendMessageValidator = [
  body('content')
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
  body('receiver')
    .optional()
    .isMongoId().withMessage('Invalid receiver ID'),
  body('room')
    .optional()
    .isString().withMessage('Room must be a string'),
  body('type')
    .optional()
    .isIn(['text', 'emoji', 'system']).withMessage('Invalid message type'),
];
