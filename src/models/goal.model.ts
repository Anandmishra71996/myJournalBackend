import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    type: 'weekly' | 'monthly' | 'yearly';
    category: 'Health' | 'Career' | 'Learning' | 'Mindset' | 'Relationships' | 'Personal';
    why?: string;
    trackingMethods: string[];
    journalSignals: string[];
    successDefinition?: string;
    status: 'active' | 'completed' | 'paused' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        type: {
            type: String,
            enum: ['weekly', 'monthly', 'yearly'],
            required: true,
        },
        category: {
            type: String,
            enum: ['Health', 'Career', 'Learning', 'Mindset', 'Relationships', 'Personal'],
            required: true,
        },
        why: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        trackingMethods: {
            type: [String],
            validate: {
                validator: function (v: string[]) {
                    return v.length <= 3;
                },
                message: 'You can select a maximum of 3 tracking methods',
            },
        },
        journalSignals: {
            type: [String],
            validate: {
                validator: function (v: string[]) {
                    return v.length <= 3;
                },
                message: 'You can select a maximum of 3 journal signals',
            },
        },
        successDefinition: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'paused', 'archived'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient querying
GoalSchema.index({ userId: 1, status: 1, type: 1 });

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
