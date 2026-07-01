import { Router } from 'express';
import { achievementController } from '../controllers/achievement.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     summary: Get all achievements
 *     tags: [Achievements]
 */
router.get('/', optionalAuth, achievementController.getAchievements);

router.get('/user/:userId', achievementController.getUserAchievements);
router.get('/mine', authenticate, achievementController.getUserAchievements);

export default router;
