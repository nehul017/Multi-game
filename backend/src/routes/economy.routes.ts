import { Router } from 'express';
import { economyController } from '../controllers/economy.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/wallet', economyController.getWallet);
router.get('/transactions', economyController.getTransactions);
router.get('/daily-login', economyController.getDailyLogin);
router.post('/daily-login/claim', economyController.claimDailyLogin);
router.get('/packs', economyController.getCoinPacks);
router.post('/packs/:packId/purchase', economyController.purchasePack);
router.get('/missions', economyController.getMissions);
router.post('/missions/:missionId/claim', economyController.claimMission);
router.get('/store', economyController.getCatalog);
router.post('/store/:itemId/purchase', economyController.purchaseItem);
router.get('/inventory', economyController.getInventory);
router.post('/inventory/:itemId/equip', economyController.equipItem);
router.post('/inventory/:itemId/unequip', economyController.unequipItem);

export default router;
