import { Response } from 'express';
import { InsightsService } from '../services/insight.service';
import { AuthRequest } from '../types/auth.types';
import { logger } from '../utils/logger';
import { formatDate } from '../utils/dateUtils';

const insightsService = new InsightsService();

export class InsightsController {
    /**
     * GET /api/v1/insights?weekStart=YYYY-MM-DD
     * Get existing insight for a week
     */
    async getInsight(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }

            const weekStart = req.query.weekStart as string;

            const insight = await insightsService.getInsight(userId, weekStart);

            if (!insight) {
                res.status(404).json({
                    success: false,
                    error: 'No insight found for this week',
                });
                return;
            }

            res.json({
                success: true,
                data: insight,
            });
        } catch (error: any) {
            logger.error('Error in getInsight controller:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch insight',
            });
        }
    }

    /**
     * POST /api/v1/insights/generate
     * Generate new insight (or return cached)
     */
    async generateInsight(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }

            const { weekStart } = req.body;

            const insight = await insightsService.generateInsight(userId, weekStart);

            res.json({
                success: true,
                data: insight,
            });
        } catch (error: any) {
            logger.error('Error in generateInsight controller:', error);

            // Return appropriate error status
            const status = error.message?.includes('not found') ? 404 : 500;

            res.status(status).json({
                success: false,
                error: error.message || 'Failed to generate insight',
            });
        }
    }
}
