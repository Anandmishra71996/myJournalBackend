import mongoose, { Document, Schema } from 'mongoose';

export interface IGoalSummary {
    goalId: mongoose.Types.ObjectId;
    goalTitle: string;
    status: 'aligned' | 'partially_aligned' | 'needs_adjustment';
    explanation: string;
}

export interface IWeeklyInsight extends Document {
    userId: mongoose.Types.ObjectId;
    weekStart: Date;
    weekEnd: Date;
    journalCount: number;
    reflection: string[];
    goalSummaries: IGoalSummary[];
    suggestion?: string;
    generatedAt: Date;
    sourceVersion: number;
}

const GoalSummarySchema = new Schema<IGoalSummary>({
    goalId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Goal',
    },
    goalTitle: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['aligned', 'partially_aligned', 'needs_adjustment'],
        required: true,
    },
    explanation: {
        type: String,
        required: true,
        trim: true,
    },
}, { _id: false });

const WeeklyInsightSchema = new Schema<IWeeklyInsight>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    weekStart: {
        type: Date,
        required: true,
    },
    weekEnd: {
        type: Date,
        required: true,
    },
    journalCount: {
        type: Number,
        required: true,
        default: 0,
    },
    reflection: {
        type: [String],
        required: true,
        validate: {
            validator: function (v: string[]) {
                return v.length >= 4 && v.length <= 6;
            },
            message: 'Reflection must have between 4 and 6 bullet points',
        },
    },
    goalSummaries: {
        type: [GoalSummarySchema],
        required: true,
        default: [],
    },
    suggestion: {
        type: String,
        trim: true,
    },
    generatedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    sourceVersion: {
        type: Number,
        required: true,
        default: 1,
    },
}, {
    timestamps: true,
});

// Unique compound index
WeeklyInsightSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklyInsight = mongoose.model<IWeeklyInsight>('WeeklyInsight', WeeklyInsightSchema);
