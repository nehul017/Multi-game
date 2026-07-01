import { Router } from 'express';
import { matchController } from '../controllers/match.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createMatchValidator } from '../validators/match.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Create a new match
 *     tags: [Matches]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', createMatchValidator, validate, matchController.createMatch);

/**
 * @swagger
 * /api/matches/{id}:
 *   get:
 *     summary: Get match by ID
 *     tags: [Matches]
 */
router.get('/:id', matchController.getMatch);

router.get('/user/:userId', matchController.getMatchesByUser);
router.get('/game/:gameType', matchController.getMatchesByGame);
router.get('/:id/replay', matchController.getReplay);
router.get('/waiting/:gameType', matchController.getWaitingMatches);

export default router;
