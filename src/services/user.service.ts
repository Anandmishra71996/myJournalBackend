import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';

export class UserService {
    async register(email: string, password: string, name: string) {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error('User already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await User.create({
                email,
                password: hashedPassword,
                name,
            });

            // Generate token
            const token = this.generateToken(user._id.toString());

            return {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                token,
            };
        } catch (error) {
            logger.error('Error in register service:', error);
            throw error;
        }
    }

    async login(email: string, password: string) {
        try {
            // Find user with password
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate token
            const token = this.generateToken(user._id.toString());

            return {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isProfileCompleted: user.isProfileCompleted,
                },
                token,
            };
        } catch (error) {
            logger.error('Error in login service:', error);
            throw error;
        }
    }

    async getUserById(userId: string) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            isProfileCompleted: user.isProfileCompleted,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            // Profile fields
            current_role: user.current_role,
            whyUsingApp: user.whyUsingApp,
            focusAreas: user.focusAreas,
            lifePhase: user.lifePhase,
            biggestConstraint: user.biggestConstraint,
            insightStyle: user.insightStyle,
            insightFrequency: user.insightFrequency,
            aiEnabled: user.aiEnabled,
        };
    }

    async updateUser(userId: string, updates: any) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            isProfileCompleted: user.isProfileCompleted,
            // Profile fields
            current_role: user.current_role,
            whyUsingApp: user.whyUsingApp,
            focusAreas: user.focusAreas,
            lifePhase: user.lifePhase,
            biggestConstraint: user.biggestConstraint,
            insightStyle: user.insightStyle,
            insightFrequency: user.insightFrequency,
            aiEnabled: user.aiEnabled,
        };
    }

    private generateToken(userId: string): string {
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        return jwt.sign(
            { id: userId } as object,
            secret,
            { expiresIn } as jwt.SignOptions
        );
    }

    verifyToken(token: string): any {
        try {
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            return jwt.verify(token, secret);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}
