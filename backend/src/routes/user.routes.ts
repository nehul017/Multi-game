import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileValidator, changePasswordValidator } from '../validators/user.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get own profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/users/profile/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 */
router.get('/profile/:id', userController.getProfile);

/**
 * @swagger
 * /api/users/update:
 *   put:
 *     summary: Update profile
 *     tags: [Users]
 */
router.put('/update', updateProfileValidator, validate, userController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Users]
 */
router.put('/change-password', changePasswordValidator, validate, userController.changePassword);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 */
router.get('/search', userController.searchUsers);

/**
 * @swagger
 * /api/users/friends:
 *   get:
 *     summary: Get friends list
 *     tags: [Users]
 */
router.get('/friends', userController.getFriends);

/**
 * @swagger
 * /api/users/friend-requests/pending:
 *   get:
 *     summary: Get pending friend requests
 *     tags: [Users]
 */
router.get('/friend-requests/pending', userController.getPendingFriendRequests);

/**
 * @swagger
 * /api/users/friend-requests/sent:
 *   get:
 *     summary: Get sent friend requests
 *     tags: [Users]
 */
router.get('/friend-requests/sent', userController.getSentFriendRequests);

router.post('/friend-request/:userId', userController.sendFriendRequest);
router.put('/friend-request/:requestId/accept', userController.acceptFriendRequest);
router.put('/friend-request/:requestId/reject', userController.rejectFriendRequest);
router.delete('/friends/:friendId', userController.removeFriend);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get own stats
 *     tags: [Users]
 */
router.get('/stats', userController.getUserStats);
router.get('/stats/:id', userController.getUserStats);

/**
 * @swagger
 * /api/users/match-history:
 *   get:
 *     summary: Get match history
 *     tags: [Users]
 */
router.get('/match-history', userController.getMatchHistory);
router.get('/match-history/:id', userController.getMatchHistory);

export default router;
