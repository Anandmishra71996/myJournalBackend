import mongoose, { Schema } from 'mongoose';

export interface IDocument {
    userId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    originalName: string;
    mimeType: string;
    size: number;
    storagePath: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processingError?: string;
    chunkCount?: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        storagePath: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        processingError: {
            type: String,
        },
        chunkCount: {
            type: Number,
            default: 0,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ status: 1 });

export const Document = mongoose.model<IDocument>('Document', DocumentSchema);
