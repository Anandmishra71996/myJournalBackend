import { Request, Response } from 'express';
import pushService from '../services/push.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

class PushController {
    /**
     * Subscribe to push notifications
     */
    async subscribe(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const { endpoint, keys } = req.body;

            if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required subscription data',
                });
                return;
            }

            const subscription = await pushService.subscribe(userId, { endpoint, keys });

            res.status(200).json({
                success: true,
                message: 'Successfully subscribed to push notifications',
                data: {
                    id: subscription._id,
                    enabled: subscription.enabled,
                },
            });
        } catch (error) {
            logger.error('Push subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to subscribe to push notifications',
            });
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const { endpoint } = req.body;

            await pushService.unsubscribe(userId, endpoint);

            res.status(200).json({
                success: true,
                message: 'Successfully unsubscribed from push notifications',
            });
        } catch (error) {
            logger.error('Push unsubscribe error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unsubscribe from push notifications',
            });
        }
    }

    /**
     * Send a test notification
     */
    async sendTest(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const { title, body, url } = req.body;

            await pushService.sendNotificationToUser(userId, {
                title: title || 'Test Notification',
                body: body || 'This is a test notification from your Journaling App',
                url: url || '/journal',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
            });

            res.status(200).json({
                success: true,
                message: 'Test notification sent successfully',
            });
        } catch (error) {
            logger.error('Send test notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send test notification',
            });
        }
    }

    /**
     * Get VAPID public key
     */
    getPublicKey(req: Request, res: Response): void {
        try {
            const publicKey = pushService.getVapidPublicKey();

            res.status(200).json({
                success: true,
                data: {
                    publicKey,
                },
            });
        } catch (error) {
            logger.error('Get public key error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get public key',
            });
        }
    }

    /**
     * Get user's subscriptions
     */
    async getSubscriptions(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const subscriptions = await pushService.getUserSubscriptions(userId);

            res.status(200).json({
                success: true,
                data: subscriptions.map((sub) => ({
                    id: sub._id,
                    endpoint: sub.endpoint,
                    enabled: sub.enabled,
                    createdAt: sub.createdAt,
                })),
            });
        } catch (error) {
            logger.error('Get subscriptions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get subscriptions',
            });
        }
    }

    /**
     * Delete a subscription
     */
    async deleteSubscription(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const { endpoint } = req.body;

            if (!endpoint) {
                res.status(400).json({
                    success: false,
                    message: 'Endpoint is required',
                });
                return;
            }

            await pushService.deleteSubscription(userId, endpoint);

            res.status(200).json({
                success: true,
                message: 'Subscription deleted successfully',
            });
        } catch (error) {
            logger.error('Delete subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete subscription',
            });
        }
    }
}

export default new PushController();
