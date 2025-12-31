import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rag-app';

        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            minPoolSize: 5,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
        });

        logger.info('✅ MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
};
