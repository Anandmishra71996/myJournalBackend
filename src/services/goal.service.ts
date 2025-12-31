import { Goal, IGoal } from '../models/goal.model';
import { logger } from '../utils/logger';

const MAX_GOALS = {
    weekly: 3,
    monthly: 5,
    yearly: 3,
};

export class GoalService {
    async getGoals(userId: string) {
        try {
            const goals = await Goal.find({
                userId,
                status: { $ne: 'archived' },
            }).sort({ createdAt: -1 });

            return goals;
        } catch (error) {
            logger.error('Error in getGoals service:', error);
            throw error;
        }
    }

    async getGoalById(userId: string, goalId: string) {
        try {
            const goal = await Goal.findOne({ _id: goalId, userId });

            if (!goal) {
                throw new Error('Goal not found');
            }

            return goal;
        } catch (error) {
            logger.error('Error in getGoalById service:', error);
            throw error;
        }
    }

    async createGoal(userId: string, goalData: Partial<IGoal>) {
        try {
            // Check max goals limit
            const activeGoalsCount = await Goal.countDocuments({
                userId,
                type: goalData.type,
                status: 'active',
            });

            const maxAllowed = MAX_GOALS[goalData.type as keyof typeof MAX_GOALS];
            if (activeGoalsCount >= maxAllowed) {
                throw new Error(
                    `You have reached the maximum limit of ${maxAllowed} active ${goalData.type} goals`
                );
            }

            const goal = await Goal.create({
                ...goalData,
                userId,
            });

            return goal;
        } catch (error) {
            logger.error('Error in createGoal service:', error);
            throw error;
        }
    }

    async updateGoal(userId: string, goalId: string, updates: Partial<IGoal>) {
        try {
            const goal = await Goal.findOne({ _id: goalId, userId });

            if (!goal) {
                throw new Error('Goal not found');
            }

            // If changing type, check max goals for new type
            if (updates.type && updates.type !== goal.type && updates.status === 'active') {
                const activeGoalsCount = await Goal.countDocuments({
                    userId,
                    type: updates.type,
                    status: 'active',
                    _id: { $ne: goalId },
                });

                const maxAllowed = MAX_GOALS[updates.type as keyof typeof MAX_GOALS];
                if (activeGoalsCount >= maxAllowed) {
                    throw new Error(
                        `You have reached the maximum limit of ${maxAllowed} active ${updates.type} goals`
                    );
                }
            }

            Object.assign(goal, updates);
            await goal.save();

            return goal;
        } catch (error) {
            logger.error('Error in updateGoal service:', error);
            throw error;
        }
    }

    async updateGoalStatus(userId: string, goalId: string, status: string) {
        try {
            const goal = await Goal.findOne({ _id: goalId, userId });

            if (!goal) {
                throw new Error('Goal not found');
            }

            // If activating, check max goals limit
            if (status === 'active' && goal.status !== 'active') {
                const activeGoalsCount = await Goal.countDocuments({
                    userId,
                    type: goal.type,
                    status: 'active',
                    _id: { $ne: goalId },
                });

                const maxAllowed = MAX_GOALS[goal.type as keyof typeof MAX_GOALS];
                if (activeGoalsCount >= maxAllowed) {
                    throw new Error(
                        `You have reached the maximum limit of ${maxAllowed} active ${goal.type} goals`
                    );
                }
            }

            goal.status = status as any;
            await goal.save();

            return goal;
        } catch (error) {
            logger.error('Error in updateGoalStatus service:', error);
            throw error;
        }
    }

    async deleteGoal(userId: string, goalId: string) {
        try {
            const goal = await Goal.findOne({ _id: goalId, userId });

            if (!goal) {
                throw new Error('Goal not found');
            }

            // Soft delete by setting status to archived
            goal.status = 'archived';
            await goal.save();

            return goal;
        } catch (error) {
            logger.error('Error in deleteGoal service:', error);
            throw error;
        }
    }

    async getGoalStats(userId: string) {
        try {
            const stats = await Goal.aggregate([
                {
                    $match: {
                        userId: userId as any,
                        status: { $ne: 'archived' },
                    },
                },
                {
                    $group: {
                        _id: { type: '$type', status: '$status' },
                        count: { $sum: 1 },
                    },
                },
            ]);

            return stats;
        } catch (error) {
            logger.error('Error in getGoalStats service:', error);
            throw error;
        }
    }
}
