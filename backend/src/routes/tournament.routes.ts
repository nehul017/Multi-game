import { Router } from 'express';
import { tournamentController } from '../controllers/tournament.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin';
import { validate } from '../middleware/validate';
import { createTournamentValidator } from '../validators/tournament.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/tournaments:
 *   get:
 *     summary: Get all tournaments
 *     tags: [Tournaments]
 *   post:
 *     summary: Create tournament
 *     tags: [Tournaments]
 */
router.get('/', tournamentController.getTournaments);
router.post('/', createTournamentValidator, validate, tournamentController.createTournament);

router.get('/:id', tournamentController.getTournament);
router.post('/:id/join', tournamentController.joinTournament);
router.post('/:id/leave', tournamentController.leaveTournament);
router.post('/:id/brackets', authenticate, adminOnly, tournamentController.generateBrackets);
router.get('/:id/results', tournamentController.getResults);
router.delete('/:id', tournamentController.deleteTournament);

export default router;
