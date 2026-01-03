import { WeeklyInsight, IWeeklyInsight } from '../models/weeklyInsight.model';
import { Journal } from '../models/journal.model';
import { Goal } from '../models/goal.model';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';
import { getWeekStart, getWeekEnd, parseDate, normalizeDate } from '../utils/dateUtils';
import { callAI } from './ai.service';

const CURRENT_VERSION = 1;

interface AIInsightResponse {
    reflection: string[];
    goalSummaries: Array<{
        goalId: string;
        status: 'aligned' | 'partially_aligned' | 'needs_adjustment';
        explanation: string;
    }>;
    suggestion: string;
}

export class InsightsService {
    /**
     * Get existing insight for a week
     */
    async getInsight(userId: string, weekStartStr: string): Promise<IWeeklyInsight | null> {
        try {
            const weekStartDate = normalizeDate(parseDate(weekStartStr));

            const insight = await WeeklyInsight.findOne({
                userId,
                weekStart: weekStartDate,
            });

            return insight;
        } catch (error: any) {
            logger.error('Error in getInsight:', error);
            throw new Error('Failed to fetch insight');
        }
    }

    /**
     * Generate or return cached insight
     */
    async generateInsight(userId: string, weekStartStr: string): Promise<IWeeklyInsight> {
        try {
            const weekStartDate = normalizeDate(parseDate(weekStartStr));
            const weekEndDate = normalizeDate(getWeekEnd(weekStartDate));

            // Check for existing cached insight
            const existingInsight = await WeeklyInsight.findOne({
                userId,
                weekStart: weekStartDate,
            });

            // Return cached if version matches
            if (existingInsight && existingInsight.sourceVersion === CURRENT_VERSION) {
                logger.info(`Returning cached insight for user ${userId}, week ${weekStartStr}`);
                return existingInsight;
            }

            // Generate new insight
            logger.info(`Generating new insight for user ${userId}, week ${weekStartStr}`);

            // Fetch data for the week
            const journals = await Journal.find({
                userId,
                date: {
                    $gte: weekStartDate,
                    $lte: weekEndDate,
                },
            }).sort({ date: 1 });

            const goals = await Goal.find({
                userId,
                status: { $in: ['active', 'completed', 'paused'] },
            });

            const user = await User.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            // Generate AI insights
            const aiResponse = await this.callAIForInsights(
                journals,
                goals,
                user,
                weekStartDate,
                weekEndDate
            );

            // Prepare goal summaries - filter out invalid goal IDs
            const goalSummaries = aiResponse.goalSummaries
                .map((gs) => {
                    const goal = goals.find((g) => g._id.toString() === gs.goalId);
                    if (!goal) {
                        logger.warn(`Goal ID ${gs.goalId} not found in user's goals, skipping`);
                        return null;
                    }
                    return {
                        goalId: gs.goalId,
                        goalTitle: goal.title,
                        status: gs.status,
                        explanation: gs.explanation,
                    };
                })
                .filter((summary): summary is NonNullable<typeof summary> => summary !== null);

            // Create or update insight
            const insightData = {
                userId,
                weekStart: weekStartDate,
                weekEnd: weekEndDate,
                journalCount: journals.length,
                reflection: aiResponse.reflection,
                goalSummaries,
                suggestion: aiResponse.suggestion,
                generatedAt: new Date(),
                sourceVersion: CURRENT_VERSION,
            };

            const insight = await WeeklyInsight.findOneAndUpdate(
                { userId, weekStart: weekStartDate },
                insightData,
                { upsert: true, new: true }
            );

            return insight;
        } catch (error: any) {
            logger.error('Error in generateInsight:', error);
            throw new Error(error.message || 'Failed to generate insight');
        }
    }

    /**
     * Call AI service with structured prompt
     */
    private async callAIForInsights(
        journals: any[],
        goals: any[],
        user: any,
        weekStart: Date,
        weekEnd: Date
    ): Promise<AIInsightResponse> {
        const prompt = this.buildInsightPrompt(journals, goals, user, weekStart, weekEnd);

        try {
            const aiResponseText = await callAI(prompt);

            // Parse AI response
            const cleanedResponse = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanedResponse);

            // Validate response structure
            if (!Array.isArray(parsed.reflection) || parsed.reflection.length < 4 || parsed.reflection.length > 6) {
                throw new Error('Invalid reflection format');
            }

            if (!Array.isArray(parsed.goalSummaries)) {
                throw new Error('Invalid goalSummaries format');
            }

            return parsed as AIInsightResponse;
        } catch (error: any) {
            logger.error('Error parsing AI response:', error);
            throw new Error('Failed to parse AI insights');
        }
    }

    /**
     * Build human-readable prompt for AI
     */
    private buildInsightPrompt(
        journals: any[],
        goals: any[],
        user: any,
        weekStart: Date,
        weekEnd: Date
    ): string {
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        let prompt = `You are a thoughtful journaling coach integrated in a jounal app which  providing weekly insights. and give meaningfull suggestion to user. on journaling page we asked multiple question which is mentioned below \n\n`;
        prompt += `Week: ${weekStartStr} to ${weekEndStr}\n`;
        prompt += `User: ${user.name || 'User'}\n`;

        if (user.current_role) prompt += `Role: ${user.current_role}\n`;
        if (user.lifePhase) prompt += `Life Phase: ${user.lifePhase}\n`;
        if (user.focusAreas && user.focusAreas.length > 0) {
            prompt += `Focus Areas: ${user.focusAreas.join(', ')}\n`;
        }

        prompt += `\n`;
        prompt += `JOURNALS THIS WEEK (${journals.length}):\n`;

        if (journals.length === 0) {
            prompt += `No journal entries this week.\n`;
        } else {
            journals.forEach((journal, index) => {
                const date = new Date(journal.date).toISOString().split('T')[0];
                prompt += `\n[${index + 1}] ${date}:\n`;

                // Add what happened
                if (journal.content?.whatHappened) {
                    prompt += `What Happened: ${journal.content.whatHappened.substring(0, 300)}\n`;
                }

                // Add wins
                if (journal.content?.wins && journal.content.wins.length > 0) {
                    prompt += `Wins: ${journal.content.wins.join(', ')}\n`;
                }

                // Add challenges
                if (journal.content?.challenges && journal.content.challenges.length > 0) {
                    prompt += `Challenges: ${journal.content.challenges.join(', ')}\n`;
                }

                // Add gratitude
                if (journal.content?.gratitude && journal.content.gratitude.length > 0) {
                    prompt += `Gratitude: ${journal.content.gratitude.join(', ')}\n`;
                }

                // Add lessons learned
                if (journal.content?.lessonsLearned) {
                    prompt += `Lessons Learned: ${journal.content.lessonsLearned}\n`;
                }

                // Add mood and energy
                if (journal.mood?.score) {
                    prompt += `Mood Score: ${journal.mood.score}/10\n`;
                }
                if (journal.mood?.energy) {
                    prompt += `Energy Level: ${journal.mood.energy}/10\n`;
                }
            });
        }

        prompt += `\nACTIVE GOALS:\n`;
        if (goals.length === 0) {
            prompt += `No active goals.\n`;
        } else {
            goals.forEach((goal, index) => {
                prompt += `\n[${index + 1}] ID: ${goal._id.toString()}\n`;
                prompt += `Title: ${goal.title}\n`;
                prompt += `Type: ${goal.type}, Status: ${goal.status}\n`;
                prompt += `Category: ${goal.category}\n`;
                if (goal.why) prompt += `Why: ${goal.why}\n`;
            });
        }

        prompt += `\n---\n`;
        prompt += `Please provide a weekly insight in STRICT JSON format:\n\n`;
        prompt += `{\n`;
        prompt += `  "reflection": [\n`;
        prompt += `    "4-6 thoughtful bullet points about this week's journaling patterns, emotions, or themes"\n`;
        prompt += `  ],\n`;
        prompt += `  "goalSummaries": [\n`;
        prompt += `    {\n`;
        prompt += `      "goalId": "USE THE EXACT ID FROM THE GOALS LIST ABOVE",\n`;
        prompt += `      "status": "aligned | partially_aligned | needs_adjustment",\n`;
        prompt += `      "explanation": "brief explanation of how journals relate to this goal"\n`;
        prompt += `    }\n`;
        prompt += `  ],\n`;
        prompt += `  "suggestion": "ONE gentle, actionable suggestion for next week"\n`;
        prompt += `}\n\n`;
        prompt += `Guidelines:\n`;
        prompt += `- Be warm, encouraging, and specific\n`;
        prompt += `- Reference actual journal content when possible\n`;
        prompt += `- Keep explanations concise (1-2 sentences)\n`;
        prompt += `- Suggestion should be practical and achievable\n`;
        prompt += `- For goalSummaries, use the EXACT goal ID from the list above (e.g., "67775f1e8a2b3c4d5e6f7890")\n`;
        prompt += `- Only include goals that are actually mentioned or related to the journal entries\n`;
        prompt += `- Return ONLY valid JSON, no additional text\n`;

        return prompt;
    }

    /**
     * Invalidate insight when data changes
     */
    async invalidateInsight(userId: string, weekStartStr: string): Promise<void> {
        try {
            const weekStartDate = normalizeDate(parseDate(weekStartStr));

            await WeeklyInsight.findOneAndUpdate(
                { userId, weekStart: weekStartDate },
                { sourceVersion: CURRENT_VERSION - 1 } // Make it stale
            );

            logger.info(`Invalidated insight for user ${userId}, week ${weekStartStr}`);
        } catch (error: any) {
            logger.error('Error invalidating insight:', error);
        }
    }
}
