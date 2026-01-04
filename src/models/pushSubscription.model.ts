import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
    userId: mongoose.Types.ObjectId;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        endpoint: {
            type: String,
            required: true,
            unique: true,
        },
        keys: {
            p256dh: {
                type: String,
                required: true,
            },
            auth: {
                type: String,
                required: true,
            },
        },
        enabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
pushSubscriptionSchema.index({ userId: 1, enabled: 1 });

export default mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
