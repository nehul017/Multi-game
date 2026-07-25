import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin';
import { validate } from '../middleware/validate';
import { banUserValidator, resolveReportValidator, broadcastValidator, updateSettingsValidator } from '../validators/admin.validator';

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
router.put('/settings', updateSettingsValidator, validate, adminController.updateSettings);

router.post('/users/:id/coins', adminController.adjustCoins);

router.get('/store/items', adminController.getStoreItems);
router.post('/store/items', adminController.createStoreItem);
router.put('/store/items/:id', adminController.updateStoreItem);
router.delete('/store/items/:id', adminController.deleteStoreItem);

router.get('/store/packs', adminController.getCoinPacks);
router.post('/store/packs', adminController.createCoinPack);
router.put('/store/packs/:id', adminController.updateCoinPack);
router.delete('/store/packs/:id', adminController.deleteCoinPack);

router.get('/missions', adminController.getMissions);
router.post('/missions', adminController.createMission);
router.put('/missions/:id', adminController.updateMission);
router.delete('/missions/:id', adminController.deleteMission);

export default router;
