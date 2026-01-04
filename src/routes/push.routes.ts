import express from 'express';
import pushController from '../controllers/push.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /push/subscribe
 * @desc    Subscribe to push notifications
 * @access  Private
 */
router.post('/subscribe', pushController.subscribe);

/**
 * @route   POST /push/unsubscribe
 * @desc    Unsubscribe from push notifications
 * @access  Private
 */
router.post('/unsubscribe', pushController.unsubscribe);

/**
 * @route   POST /push/send-test
 * @desc    Send a test notification
 * @access  Private
 */
router.post('/send-test', pushController.sendTest);

/**
 * @route   GET /push/public-key
 * @desc    Get VAPID public key
 * @access  Private
 */
router.get('/public-key', pushController.getPublicKey);

/**
 * @route   GET /push/subscriptions
 * @desc    Get user's subscriptions
 * @access  Private
 */
router.get('/subscriptions', pushController.getSubscriptions);

/**
 * @route   DELETE /push/subscription
 * @desc    Delete a subscription
 * @access  Private
 */
router.delete('/subscription', pushController.deleteSubscription);

export default router;
