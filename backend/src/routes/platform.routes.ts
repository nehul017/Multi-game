import { Router } from 'express';
import { platformController } from '../controllers/platform.controller';

const router = Router();

router.get('/status', platformController.getStatus);

export default router;
