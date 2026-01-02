import { Router } from 'express';
import { InsightsController } from '../controllers/insight.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { getInsightSchema, generateInsightSchema } from '../validators/insight.validator';

const router = Router();
const insightsController = new InsightsController();

// All routes require authentication
router.use(authenticate);

// GET /insights?weekStart=YYYY-MM-DD - Get existing insight
router.get(
    '/',
    validateRequest(getInsightSchema, 'query'),
    insightsController.getInsight.bind(insightsController)
);

// POST /insights/generate - Generate new insight
router.post(
    '/generate',
    validateRequest(generateInsightSchema, 'body'),
    insightsController.generateInsight.bind(insightsController)
);

export default router;
