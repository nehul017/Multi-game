import { Router } from 'express';
import { fruitSlotsController } from '../controllers/fruit-slots.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { fruitSlotsHistoryValidator } from '../validators/fruit-slots.validator';

const router = Router();

/**
 * @swagger
 * /api/games/classic-fruit-slots:
 *   get:
 *     summary: Get Classic Fruit Slots catalog info and public config
 *     tags: [Slots]
 */
router.get('/', fruitSlotsController.getGame);

/**
 * @swagger
 * /api/games/classic-fruit-slots/config:
 *   get:
 *     summary: Get public fruit-slots configuration (no internal weights)
 *     tags: [Slots]
 */
router.get('/config', fruitSlotsController.getConfig);

/**
 * @swagger
 * /api/games/classic-fruit-slots/history:
 *   get:
 *     summary: Get the current user's fruit-slots spin history
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', authenticate, fruitSlotsHistoryValidator, validate, fruitSlotsController.getHistory);

export default router;
