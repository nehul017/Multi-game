import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin';
import { validate } from '../middleware/validate';
import { banUserValidator, resolveReportValidator, broadcastValidator, settingValidator } from '../validators/admin.validator';

const router = Router();

router.use(authenticate, adminOnly);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', adminController.getDashboardStats);

router.get('/users', adminController.getUsers);
router.post('/users/:id/ban', banUserValidator, validate, adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/active-games', adminController.getActiveGames);

router.get('/reports', adminController.getReports);
router.put('/reports/:id/resolve', resolveReportValidator, validate, adminController.resolveReport);

router.post('/broadcast', broadcastValidator, validate, adminController.broadcastAnnouncement);

router.get('/health', adminController.getServerHealth);

router.get('/settings', adminController.getSettings);
router.put('/settings', settingValidator, validate, adminController.updateSetting);

export default router;
