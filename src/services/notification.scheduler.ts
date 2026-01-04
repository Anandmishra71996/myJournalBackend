import pushService from './push.service';
import { Journal } from '../models/journal.model';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';

class NotificationScheduler {
    /**
     * Send daily journal reminder to users who haven't journaled today
     */
    async sendDailyJournalReminders(): Promise<void> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get all users
            const users = await User.find({ isProfileCompleted: true });

            for (const user of users) {
                // Check if user has journaled today
                const todayJournal = await Journal.findOne({
                    userId: user._id,
                    date: { $gte: today },
                });

                if (!todayJournal) {
                    // User hasn't journaled today, send reminder
                    await pushService.sendNotificationToUser(user._id.toString(), {
                        title: '📝 Daily Journal Reminder',
                        body: 'Take a moment to reflect on your day. Your future self will thank you!',
                        url: '/journal',
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/icon-192x192.png',
                    });

                    logger.info(`Daily journal reminder sent to user: ${user._id}`);
                }
            }

            logger.info('Daily journal reminders completed');
        } catch (error) {
            logger.error('Error sending daily journal reminders:', error);
        }
    }

    /**
     * Send weekly insights notification
     */
    async sendWeeklyInsightsNotification(): Promise<void> {
        try {
            // Get all users with profile completed
            const users = await User.find({ isProfileCompleted: true });

            const userIds = users.map((user) => user._id.toString());

            await pushService.sendNotificationToUsers(userIds, {
                title: '✨ Weekly Insights Ready',
                body: 'Your weekly reflection and insights are ready to view!',
                url: '/insights',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
            });

            logger.info(`Weekly insights notification sent to ${userIds.length} users`);
        } catch (error) {
            logger.error('Error sending weekly insights notification:', error);
        }
    }

    /**
     * Send goal milestone notification
     */
    async sendGoalMilestoneNotification(userId: string, goalTitle: string, milestone: string): Promise<void> {
        try {
            await pushService.sendNotificationToUser(userId, {
                title: '🎉 Goal Milestone Achieved!',
                body: `Congratulations! You've reached ${milestone} for "${goalTitle}"`,
                url: '/goals',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
            });

            logger.info(`Goal milestone notification sent to user: ${userId}`);
        } catch (error) {
            logger.error('Error sending goal milestone notification:', error);
        }
    }

    /**
     * Send motivational message
     */
    async sendMotivationalMessage(userId: string): Promise<void> {
        const messages = [
            'Keep up the great work! Your consistency is inspiring.',
            'Every entry brings you closer to understanding yourself better.',
            'Your journey of self-reflection is making a difference.',
            'Great job staying committed to your journaling practice!',
            'Your dedication to growth is admirable. Keep going!',
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        try {
            await pushService.sendNotificationToUser(userId, {
                title: '💪 You\'re doing great!',
                body: randomMessage,
                url: '/journal',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
            });

            logger.info(`Motivational message sent to user: ${userId}`);
        } catch (error) {
            logger.error('Error sending motivational message:', error);
        }
    }
}

export default new NotificationScheduler();
