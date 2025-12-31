import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    avatar?: string;
    role: 'user' | 'admin';
    isActive: boolean;
    isProfileCompleted: boolean;
    lastLogin?: Date;
    // Profile fields for AI insights
    current_role?: string;
    whyUsingApp?: 'Improve consistency' | 'Mental clarity' | 'Goal tracking' | 'Self awareness' | 'Reduce stress' | 'Personal growth';
    focusAreas?: string[];
    lifePhase?: 'Student' | 'Working professional' | 'Founder' | 'Career transition' | 'Parent' | 'Other';
    biggestConstraint?: 'Time' | 'Energy' | 'Motivation' | 'Stress' | 'Clarity';
    insightStyle?: 'gentle' | 'practical' | 'analytical';
    insightFrequency?: 'weekly' | 'monthly' | 'on-demand';
    aiEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: {
            type: String,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isProfileCompleted: {
            type: Boolean,
            default: false,
        },
        lastLogin: {
            type: Date,
        },
        // Profile fields for AI insights
        current_role: {
            type: String,
            trim: true,
        },
        whyUsingApp: {
            type: String,
            enum: ['Improve consistency', 'Mental clarity', 'Goal tracking', 'Self awareness', 'Reduce stress', 'Personal growth'],
        },
        focusAreas: {
            type: [String],
            validate: {
                validator: function (v: string[]) {
                    return !v || v.length <= 3;
                },
                message: 'You can select a maximum of 3 focus areas',
            },
        },
        lifePhase: {
            type: String,
            enum: ['Student', 'Working professional', 'Founder', 'Career transition', 'Parent', 'Other'],
        },
        biggestConstraint: {
            type: String,
            enum: ['Time', 'Energy', 'Motivation', 'Stress', 'Clarity'],
        },
        insightStyle: {
            type: String,
            enum: ['gentle', 'practical', 'analytical'],
        },
        insightFrequency: {
            type: String,
            enum: ['weekly', 'monthly', 'on-demand'],
        },
        aiEnabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
