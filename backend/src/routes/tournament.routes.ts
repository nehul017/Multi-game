import { Router } from 'express';
import { tournamentController } from '../controllers/tournament.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin';
import { validate } from '../middleware/validate';
import { createTournamentValidator } from '../validators/tournament.validator';

const router = Router();

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
router.get('/:id', tournamentController.getTournament);
router.get('/:id/results', tournamentController.getResults);

router.use(authenticate);

router.post('/', createTournamentValidator, validate, tournamentController.createTournament);
router.post('/:id/join', tournamentController.joinTournament);
router.post('/:id/leave', tournamentController.leaveTournament);
router.post('/:id/brackets', adminOnly, tournamentController.generateBrackets);
router.delete('/:id', tournamentController.deleteTournament);

export default router;
