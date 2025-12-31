import mongoose, { Schema, Document } from 'mongoose';

export interface IVectorStore extends Document {
    documentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    chunkIndex: number;
    content: string;
    embedding: number[];
    metadata: {
        pageNumber?: number;
        chunkSize: number;
        source: string;
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}

const VectorStoreSchema = new Schema<IVectorStore>(
    {
        documentId: {
            type: Schema.Types.ObjectId,
            ref: 'Document',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        chunkIndex: {
            type: Number,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        embedding: {
            type: [Number],
            required: true,
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

VectorStoreSchema.index({ documentId: 1, chunkIndex: 1 });
VectorStoreSchema.index({ userId: 1 });
VectorStoreSchema.index({ embedding: '2dsphere' }); // For similarity search

export const VectorStore = mongoose.model<IVectorStore>('VectorStore', VectorStoreSchema);
