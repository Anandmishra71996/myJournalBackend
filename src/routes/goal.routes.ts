import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createGoalSchema, updateGoalSchema, updateStatusSchema } from '../validators/goal.validator';

const router = Router();
const goalController = new GoalController();

// Get all goals for authenticated user
router.get('/', authenticate, goalController.getGoals);

// Get goal statistics
router.get('/stats', authenticate, goalController.getGoalStats);

// Get single goal by ID
router.get('/:id', authenticate, goalController.getGoalById);

// Create new goal
router.post('/', authenticate, validateRequest(createGoalSchema), goalController.createGoal);

// Update goal
router.put('/:id', authenticate, validateRequest(updateGoalSchema), goalController.updateGoal);

// Update goal status (PATCH for partial update)
router.patch('/:id/status', authenticate, validateRequest(updateStatusSchema), goalController.updateGoalStatus);

// Delete (archive) goal
router.delete('/:id', authenticate, goalController.deleteGoal);

export default router;
