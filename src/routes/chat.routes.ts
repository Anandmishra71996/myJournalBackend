import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { chatValidationSchema } from '../validators/chat.validator';

const router = Router();
const chatController = new ChatController();

// All chat routes require authentication
router.use(authenticate);

router.post(
    '/message',
    validateRequest(chatValidationSchema),
    chatController.sendMessage
);

router.post(
    '/stream',
    validateRequest(chatValidationSchema),
    chatController.streamMessage
);

router.get(
    '/history/:conversationId',
    chatController.getChatHistory
);

export default router;
