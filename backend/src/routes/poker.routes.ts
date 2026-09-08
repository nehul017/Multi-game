import { Router } from 'express';
import { pokerController } from '../controllers/poker.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  pokerCreateTableValidator,
  pokerHistoryValidator,
  pokerSitValidator,
} from '../validators/poker.validator';

const router = Router();

/**
 * @swagger
 * /api/games/poker:
 *   get:
 *     summary: Get Poker Room catalog info and public config
 *     tags: [Poker]
 */
router.get('/', pokerController.getGame);

/**
 * @swagger
 * /api/games/poker/config:
 *   get:
 *     summary: Get public poker variants and table defaults
 *     tags: [Poker]
 */
router.get('/config', pokerController.getConfig);

/**
 * @swagger
 * /api/games/poker/tables:
 *   get:
 *     summary: List open poker tables
 *     tags: [Poker]
 */
router.get('/tables', pokerController.listTables);

/**
 * @swagger
 * /api/games/poker/tables/{tableId}:
 *   get:
 *     summary: Get a sanitized poker table snapshot
 *     tags: [Poker]
 */
router.get('/tables/:tableId', optionalAuth, pokerController.getTable);

/**
 * @swagger
 * /api/games/poker/tables:
 *   post:
 *     summary: Create a poker table
 *     tags: [Poker]
 *     security:
 *       - bearerAuth: []
 */
router.post('/tables', authenticate, pokerCreateTableValidator, validate, pokerController.createTable);

/**
 * @swagger
 * /api/games/poker/sit:
 *   post:
 *     summary: Sit at a poker table with a coin buy-in
 *     tags: [Poker]
 *     security:
 *       - bearerAuth: []
 */
router.post('/sit', authenticate, pokerSitValidator, validate, pokerController.sit);

/**
 * @swagger
 * /api/games/poker/history:
 *   get:
 *     summary: Get the current user's poker hand history
 *     tags: [Poker]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', authenticate, pokerHistoryValidator, validate, pokerController.history);

export default router;
