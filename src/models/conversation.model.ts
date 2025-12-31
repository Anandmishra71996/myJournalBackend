import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
        metadata?: Record<string, any>;
    }>;
    metadata?: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
});

const ConversationSchema = new Schema<IConversation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        messages: [MessageSchema],
        metadata: {
            type: Schema.Types.Mixed,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

ConversationSchema.index({ userId: 1, createdAt: -1 });
ConversationSchema.index({ userId: 1, isActive: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
