import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
    userId: mongoose.Types.ObjectId;
    date: Date;
    tasks: Array<{
        _id?: mongoose.Types.ObjectId;
        title: string;
        description?: string;
        priority: 'high' | 'medium' | 'low';
        category?: string;
        completed: boolean;
        completedAt?: Date;
    }>;
    intentions: string[];
    focusAreas: string[];
    affirmations: string[];
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
    },
    category: String,
    completed: {
        type: Boolean,
        default: false,
    },
    completedAt: Date,
});

const PlanSchema = new Schema<IPlan>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        tasks: [TaskSchema],
        intentions: [String],
        focusAreas: [String],
        affirmations: [String],
    },
    {
        timestamps: true,
    }
);

PlanSchema.index({ userId: 1, date: -1 });
PlanSchema.index({ userId: 1, 'tasks.completed': 1 });

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
