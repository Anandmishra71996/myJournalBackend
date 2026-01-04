import webpush from 'web-push';
import PushSubscription, { IPushSubscription } from '../models/pushSubscription.model';
import { logger } from '../utils/logger';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@journalingapp.com',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

interface SubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    data?: any;
}

class PushService {
    /**
     * Subscribe a user to push notifications
     */
    async subscribe(userId: string, subscriptionData: SubscriptionData): Promise<IPushSubscription> {
        try {
            // Check if subscription already exists
            let subscription = await PushSubscription.findOne({ endpoint: subscriptionData.endpoint });

            if (subscription) {
                // Update existing subscription
                subscription.userId = userId as any;
                subscription.keys = subscriptionData.keys;
                subscription.enabled = true;
                await subscription.save();
                logger.info(`Push subscription updated for user: ${userId}`);
            } else {
                // Create new subscription
                subscription = await PushSubscription.create({
                    userId,
                    endpoint: subscriptionData.endpoint,
                    keys: subscriptionData.keys,
                    enabled: true,
                });
                logger.info(`Push subscription created for user: ${userId}`);
            }

            return subscription;
        } catch (error) {
            logger.error('Error subscribing to push notifications:', error);
            throw new Error('Failed to subscribe to push notifications');
        }
    }

    /**
     * Unsubscribe a user from push notifications
     */
    async unsubscribe(userId: string, endpoint?: string): Promise<void> {
        try {
            if (endpoint) {
                // Unsubscribe specific endpoint
                await PushSubscription.findOneAndUpdate(
                    { userId, endpoint },
                    { enabled: false }
                );
                logger.info(`Push subscription disabled for user: ${userId}, endpoint: ${endpoint}`);
            } else {
                // Unsubscribe all endpoints for user
                await PushSubscription.updateMany(
                    { userId },
                    { enabled: false }
                );
                logger.info(`All push subscriptions disabled for user: ${userId}`);
            }
        } catch (error) {
            logger.error('Error unsubscribing from push notifications:', error);
            throw new Error('Failed to unsubscribe from push notifications');
        }
    }

    /**
     * Send push notification to a specific user
     */
    async sendNotificationToUser(userId: string, payload: NotificationPayload): Promise<void> {
        try {
            // Get all enabled subscriptions for user
            const subscriptions = await PushSubscription.find({ userId, enabled: true });

            if (subscriptions.length === 0) {
                logger.warn(`No active push subscriptions found for user: ${userId}`);
                return;
            }

            // Send notification to all user's subscriptions
            const sendPromises = subscriptions.map(async (sub) => {
                return this.sendToSubscription(sub, payload);
            });

            await Promise.allSettled(sendPromises);
            logger.info(`Push notifications sent to user: ${userId}`);
        } catch (error) {
            logger.error('Error sending push notification to user:', error);
            throw new Error('Failed to send push notification');
        }
    }

    /**
     * Send push notification to multiple users
     */
    async sendNotificationToUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
        try {
            const sendPromises = userIds.map((userId) =>
                this.sendNotificationToUser(userId, payload)
            );

            await Promise.allSettled(sendPromises);
            logger.info(`Push notifications sent to ${userIds.length} users`);
        } catch (error) {
            logger.error('Error sending push notifications to users:', error);
            throw new Error('Failed to send push notifications');
        }
    }

    /**
     * Send notification to a specific subscription
     */
    private async sendToSubscription(
        subscription: IPushSubscription,
        payload: NotificationPayload
    ): Promise<void> {
        try {
            const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            };

            const notificationPayload = JSON.stringify({
                title: payload.title,
                body: payload.body,
                icon: payload.icon || '/icons/icon-192x192.png',
                badge: payload.badge || '/icons/icon-192x192.png',
                url: payload.url || '/',
                data: payload.data || {},
            });

            await webpush.sendNotification(pushSubscription, notificationPayload);
            logger.debug(`Push notification sent to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
        } catch (error: any) {
            logger.error('Error sending to subscription:', error);

            // Handle expired or invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
                logger.warn(`Subscription expired or not found, disabling: ${subscription._id}`);
                await PushSubscription.findByIdAndUpdate(subscription._id, { enabled: false });
            }

            // Don't throw error for individual subscription failures
        }
    }

    /**
     * Get user's active subscriptions
     */
    async getUserSubscriptions(userId: string): Promise<IPushSubscription[]> {
        try {
            return await PushSubscription.find({ userId, enabled: true });
        } catch (error) {
            logger.error('Error getting user subscriptions:', error);
            throw new Error('Failed to get user subscriptions');
        }
    }

    /**
     * Delete a subscription
     */
    async deleteSubscription(userId: string, endpoint: string): Promise<void> {
        try {
            await PushSubscription.findOneAndDelete({ userId, endpoint });
            logger.info(`Push subscription deleted for user: ${userId}, endpoint: ${endpoint}`);
        } catch (error) {
            logger.error('Error deleting subscription:', error);
            throw new Error('Failed to delete subscription');
        }
    }

    /**
     * Get VAPID public key
     */
    getVapidPublicKey(): string {
        return process.env.VAPID_PUBLIC_KEY || '';
    }
}

export default new PushService();
