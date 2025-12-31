import { Response } from 'express';
import { GoalService } from '../services/goal.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

export class GoalController {
    private goalService: GoalService;

    constructor() {
        this.goalService = new GoalService();
    }

    getGoals = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;

            const goals = await this.goalService.getGoals(userId!);

            res.status(200).json({
                success: true,
                data: goals,
            });
        } catch (error: any) {
            logger.error('Error in getGoals:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch goals',
            });
        }
    };

    getGoalById = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            const goal = await this.goalService.getGoalById(userId!, id);

            res.status(200).json({
                success: true,
                data: goal,
            });
        } catch (error: any) {
            logger.error('Error in getGoalById:', error);
            res.status(error.message === 'Goal not found' ? 404 : 500).json({
                success: false,
                error: error.message || 'Failed to fetch goal',
            });
        }
    };

    createGoal = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const goalData = req.body;

            const goal = await this.goalService.createGoal(userId!, goalData);

            res.status(201).json({
                success: true,
                data: goal,
            });
        } catch (error: any) {
            logger.error('Error in createGoal:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to create goal',
            });
        }
    };

    updateGoal = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const updates = req.body;

            const goal = await this.goalService.updateGoal(userId!, id, updates);

            res.status(200).json({
                success: true,
                data: goal,
            });
        } catch (error: any) {
            logger.error('Error in updateGoal:', error);
            res.status(error.message === 'Goal not found' ? 404 : 400).json({
                success: false,
                error: error.message || 'Failed to update goal',
            });
        }
    };

    updateGoalStatus = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { status } = req.body;

            const goal = await this.goalService.updateGoalStatus(userId!, id, status);

            res.status(200).json({
                success: true,
                data: goal,
            });
        } catch (error: any) {
            logger.error('Error in updateGoalStatus:', error);
            res.status(error.message === 'Goal not found' ? 404 : 400).json({
                success: false,
                error: error.message || 'Failed to update goal status',
            });
        }
    };

    deleteGoal = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            await this.goalService.deleteGoal(userId!, id);

            res.status(200).json({
                success: true,
                message: 'Goal archived successfully',
            });
        } catch (error: any) {
            logger.error('Error in deleteGoal:', error);
            res.status(error.message === 'Goal not found' ? 404 : 500).json({
                success: false,
                error: error.message || 'Failed to delete goal',
            });
        }
    };

    getGoalStats = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;

            const stats = await this.goalService.getGoalStats(userId!);

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            logger.error('Error in getGoalStats:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch goal stats',
            });
        }
    };
}
