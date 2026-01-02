import { getLLM } from '../config/openai';
import { logger } from '../utils/logger';

/**
 * Call AI with a prompt and get text response
 */
export async function callAI(prompt: string): Promise<string> {
    try {
        const llm = getLLM(0.7, 'gpt-4-turbo-preview');
        const response = await llm.invoke(prompt);

        if (typeof response.content === 'string') {
            return response.content;
        }

        throw new Error('Invalid AI response format');
    } catch (error: any) {
        logger.error('Error calling AI:', error);
        throw new Error(error.message || 'Failed to call AI service');
    }
}
