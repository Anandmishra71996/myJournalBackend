import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

export class ChatController {
    private chatService: ChatService;

    constructor() {
        this.chatService = new ChatService();
    }

    sendMessage = async (req: AuthRequest, res: Response) => {
        try {
            const { message, conversationId, systemPrompt } = req.body;
            const userId = req.user?.id;

            const response = await this.chatService.chat(
                message,
                userId!,
                conversationId,
                systemPrompt
            );

            res.status(200).json({
                success: true,
                data: response,
            });
        } catch (error) {
            logger.error('Error in sendMessage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process message',
            });
        }
    };

    streamMessage = async (req: AuthRequest, res: Response) => {
        try {
            const { message, conversationId, systemPrompt } = req.body;
            const userId = req.user?.id;

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            await this.chatService.streamChat(
                message,
                userId!,
                conversationId,
                systemPrompt,
                (chunk) => {
                    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
                }
            );

            res.write('data: [DONE]\n\n');
            res.end();
        } catch (error) {
            logger.error('Error in streamMessage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to stream message',
            });
        }
    };

    getChatHistory = async (req: AuthRequest, res: Response) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user?.id;

            const history = await this.chatService.getChatHistory(conversationId, userId!);

            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            logger.error('Error in getChatHistory:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch chat history',
            });
        }
    };
}
