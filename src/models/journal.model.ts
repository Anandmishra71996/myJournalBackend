import mongoose, { Schema, Document } from 'mongoose';

export interface IJournal extends Document {
    userId: mongoose.Types.ObjectId;
    date: Date;
    type: 'morning' | 'evening' | 'anytime';
    content: {
        whatHappened?: string;
        wins?: string[];
        challenges?: string[];
        emotions?: string[];
        lessonsLearned?: string;
        gratitude?: string[];
    };
    mood: {
        score?: number;
        energy?: number;
        emotions?: string[];
    };
    plan?: {
        tasks?: Array<{
            title: string;
            priority: 'high' | 'medium' | 'low';
            completed?: boolean;
        }>;
        intentions?: string[];
        focusAreas?: string[];
    };
    tags: string[];
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const JournalSchema = new Schema<IJournal>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        type: {
            type: String,
            enum: ['morning', 'evening', 'anytime'],
            default: 'anytime',
        },
        content: {
            whatHappened: String,
            wins: [String],
            challenges: [String],
            emotions: [String],
            lessonsLearned: String,
            gratitude: [String],
        },
        mood: {
            score: {
                type: Number,
                min: 1,
                max: 10,
            },
            energy: {
                type: Number,
                min: 1,
                max: 10,
            },
            emotions: [String],
        },
        plan: {
            tasks: [{
                title: String,
                priority: {
                    type: String,
                    enum: ['high', 'medium', 'low'],
                    default: 'medium',
                },
                completed: {
                    type: Boolean,
                    default: false,
                },
            }],
            intentions: [String],
            focusAreas: [String],
        },
        tags: [String],
        isPrivate: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

JournalSchema.index({ userId: 1, date: -1 });
JournalSchema.index({ userId: 1, createdAt: -1 });
JournalSchema.index({ tags: 1 });

export const Journal = mongoose.model<IJournal>('Journal', JournalSchema);
