import { Router } from 'express';
import { matchController } from '../controllers/match.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { completeMatchValidator, createMatchValidator, startSessionValidator } from '../validators/match.validator';

const router = Router();

router.use(authenticate);

router.post('/session', startSessionValidator, validate, matchController.startSession);
router.post('/:id/complete', completeMatchValidator, validate, matchController.completeMatch);
router.post('/:id/score', completeMatchValidator, validate, matchController.recordScore);
router.post('/:id/abort', matchController.abortMatch);

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
router.get('/:id/result', matchController.getMatchResult);
router.post('/:id/join', matchController.joinMatch);
router.post('/:id/leave', matchController.leaveMatch);
router.get('/waiting/:gameType', matchController.getWaitingMatches);

export default router;
