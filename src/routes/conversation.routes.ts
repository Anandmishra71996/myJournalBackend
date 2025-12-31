import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const conversationController = new ConversationController();

router.use(authenticate);

router.post(
    '/',
    conversationController.createConversation
);

router.get(
    '/',
    conversationController.getConversations
);

router.get(
    '/:id',
    conversationController.getConversationById
);

router.delete(
    '/:id',
    conversationController.deleteConversation
);

router.put(
    '/:id',
    conversationController.updateConversation
);

export default router;
