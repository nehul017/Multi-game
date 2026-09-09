import { Router } from 'express';
import { gameController } from '../controllers/game.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin';

const router = Router();

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Get all active games
 *     tags: [Games]
 */
router.get('/', gameController.getGames);
router.get('/playable', gameController.getPlayableGames);

/**
 * @swagger
 * /api/games/slug/{slug}:
 *   get:
 *     summary: Get game by slug
 *     tags: [Games]
 */
router.get('/slug/:slug', gameController.getGameBySlug);

/**
 * @swagger
 * /api/games/{id}:
 *   get:
 *     summary: Get game by ID
 *     tags: [Games]
 */
router.get('/:id', gameController.getGameById);

router.post('/', authenticate, adminOnly, gameController.createGame);
router.put('/:id', authenticate, adminOnly, gameController.updateGame);
router.delete('/:id', authenticate, adminOnly, gameController.deleteGame);

export default router;
