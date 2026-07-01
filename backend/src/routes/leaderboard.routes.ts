import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/leaderboard/{gameType}:
 *   get:
 *     summary: Get leaderboard for a game
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: path
 *         name: gameType
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [daily, weekly, monthly, all_time] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 */
router.get('/:gameType', optionalAuth, leaderboardController.getLeaderboard);

router.get('/:gameType/rank', authenticate, leaderboardController.getRank);
router.get('/:gameType/rank/:userId', optionalAuth, leaderboardController.getRank);

export default router;
