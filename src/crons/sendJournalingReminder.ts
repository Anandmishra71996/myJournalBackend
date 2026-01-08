import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { Journal } from '../models/journal.model';
import { User } from '../models/user.model';
import pushService from '../services/push.service';

/**
 * Cron Job: Send Journaling Reminders
 * 
 * Sends push notifications to users who haven't written a journal entry today.
 * Runs independently and can be scheduled separately.
 * 
 * Usage:
 *   ts-node src/crons/sendJournalingReminder.ts
 * 
 * Or via package.json script:
 *   npm run cron:send-journaling-reminder
 */

async function sendJournalingReminder(): Promise<void> {
    try {
        // Connect to MongoDB
        const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/rag-app';
        await mongoose.connect(mongoUrl);
        logger.info('Connected to MongoDB for cron job: sendJournalingReminder');

        // Get today's date (start and end of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        logger.info(
            `Checking for users without journal entries between ${today.toISOString()} and ${tomorrow.toISOString()}`
        );

        // Find all users with push subscriptions enabled
        const usersWithPushEnabled = await User.find({
            pushNotificationsEnabled: true,
            deletedAt: null, // Exclude deleted users
        }).select('_id email');

        logger.info(`Found ${usersWithPushEnabled.length} users with push notifications enabled`);

        let remindersSent = 0;
        let remindersSkipped = 0;

        // For each user, check if they've written a journal entry today
        for (const user of usersWithPushEnabled) {
            try {
                const entryTodayCount = await Journal.countDocuments({
                    userId: user._id,
                    createdAt: {
                        $gte: today,
                        $lt: tomorrow,
                    },
                });

                // Only send reminder if user hasn't written an entry yet
                if (entryTodayCount === 0) {
                    logger.debug(`No journal entry for user ${user._id}. Sending reminder.`);

                    // Send push notification reminder
                    try {
                        await pushService.sendNotificationToUser(user._id.toString(), {
                            title: '📔 Time to Journal!',
                            body: "It's been a while! Share your thoughts and reflections for today.",
                            icon: '/icons/journal-icon.png',
                            data: {
                                action: 'open_journal',
                                timestamp: new Date().toISOString(),
                            },
                        });

                        remindersSent++;
                        logger.info(`Journaling reminder sent to user ${user._id}`);
                    } catch (notifError) {
                        logger.warn(
                            `Failed to send notification to user ${user._id}:`,
                            notifError
                        );
                    }
                } else {
                    remindersSkipped++;
                    logger.debug(`User ${user._id} already has ${entryTodayCount} journal entry/entries today`);
                }
            } catch (userError) {
                logger.error(`Error processing user ${user._id}:`, userError);
            }
        }

        logger.info(
            `Journaling reminder cron job completed: ${remindersSent} reminders sent, ${remindersSkipped} skipped`
        );
    } catch (error) {
        logger.error('Error in sendJournalingReminder cron job:', error);
        throw error;
    } finally {
        // Close MongoDB connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            logger.info('Disconnected from MongoDB');
        }
    }
}

// Run the cron job if this file is executed directly
if (require.main === module) {
    sendJournalingReminder()
        .then(() => {
            logger.info('Cron job completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Cron job failed:', error);
            process.exit(1);
        });
}

export { sendJournalingReminder };
