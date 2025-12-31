import { Conversation } from '../models/conversation.model';
import { logger } from '../utils/logger';

export class ConversationService {
    async createConversation(userId: string, title?: string, metadata?: any) {
        try {
            const conversation = await Conversation.create({
                userId,
                title: title || 'New Conversation',
                messages: [],
                metadata,
            });

            return conversation;
        } catch (error) {
            logger.error('Error creating conversation:', error);
            throw error;
        }
    }

    async getConversations(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [conversations, total] = await Promise.all([
            Conversation.find({ userId, isActive: true })
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-messages'), // Exclude messages for list view
            Conversation.countDocuments({ userId, isActive: true }),
        ]);

        return {
            conversations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async getConversationById(conversationId: string, userId: string) {
        return await Conversation.findOne({
            _id: conversationId,
            userId,
            isActive: true,
        });
    }

    async deleteConversation(conversationId: string, userId: string) {
        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId,
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Soft delete
        conversation.isActive = false;
        await conversation.save();

        logger.info(`Conversation ${conversationId} deleted`);
    }

    async updateConversation(conversationId: string, userId: string, updates: any) {
        const conversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        return conversation;
    }
}
