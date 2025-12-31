import { Request, Response } from 'express';
import { ConversationService } from '../services/conversation.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

export class ConversationController {
    private conversationService: ConversationService;

    constructor() {
        this.conversationService = new ConversationService();
    }

    createConversation = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { title, metadata } = req.body;

            const conversation = await this.conversationService.createConversation(
                userId!,
                title,
                metadata
            );

            res.status(201).json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            logger.error('Error in createConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create conversation',
            });
        }
    };

    getConversations = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { page = 1, limit = 20 } = req.query;

            const conversations = await this.conversationService.getConversations(
                userId!,
                Number(page),
                Number(limit)
            );

            res.status(200).json({
                success: true,
                data: conversations,
            });
        } catch (error) {
            logger.error('Error in getConversations:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch conversations',
            });
        }
    };

    getConversationById = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const conversation = await this.conversationService.getConversationById(id, userId!);

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation not found',
                });
            }

            res.status(200).json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            logger.error('Error in getConversationById:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch conversation',
            });
        }
    };

    deleteConversation = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            await this.conversationService.deleteConversation(id, userId!);

            res.status(200).json({
                success: true,
                message: 'Conversation deleted successfully',
            });
        } catch (error) {
            logger.error('Error in deleteConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete conversation',
            });
        }
    };

    updateConversation = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const updates = req.body;

            const conversation = await this.conversationService.updateConversation(
                id,
                userId!,
                updates
            );

            res.status(200).json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            logger.error('Error in updateConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update conversation',
            });
        }
    };
}
