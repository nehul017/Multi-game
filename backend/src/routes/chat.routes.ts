import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageValidator } from '../validators/chat.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/chat/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Chat]
 */
router.post('/messages', sendMessageValidator, validate, chatController.sendMessage);

router.get('/messages/:userId', chatController.getMessages);
router.get('/room/:roomId', chatController.getRoomMessages);
router.get('/conversations', chatController.getConversations);
router.put('/read/:senderId', chatController.markAsRead);
router.get('/unread', chatController.getUnreadCount);
router.delete('/messages/:id', chatController.deleteMessage);

export default router;
