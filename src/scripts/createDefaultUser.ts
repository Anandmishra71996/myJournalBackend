import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';

const createDefaultUser = async () => {
    try {
        await connectDatabase();
        logger.info('Connected to database');

        const defaultUser = {
            email: 'test@journal.com',
            password: 'Test@123',
            name: 'Test User'
        };

        const existingUser = await User.findOne({ email: defaultUser.email });

        if (existingUser) {
            logger.info('Default user already exists');
            logger.info(`Email: ${defaultUser.email}`);
            logger.info(`Password: ${defaultUser.password}`);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(defaultUser.password, 10);
        const user = await User.create({
            email: defaultUser.email,
            password: hashedPassword,
            name: defaultUser.name
        });

        logger.info('Default user created successfully!');
        logger.info(`Email: ${defaultUser.email}`);
        logger.info(`Password: ${defaultUser.password}`);
        logger.info(`User ID: ${user._id}`);

        process.exit(0);
    } catch (error) {
        logger.error('Error creating default user:', error);
        process.exit(1);
    }
};

createDefaultUser();
