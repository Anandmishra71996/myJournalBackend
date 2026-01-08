import { getLLM } from '../config/openai';
import { logger } from '../utils/logger';


/**
 * Call AI with a prompt and get text response
 */
export async function callAI(prompt: string): Promise<string> {
    try {
        logger.info('Initializing LLM for AI call');
        const llm = getLLM(0, 'gpt-4o-mini');

        const response = await llm.invoke(prompt);

        if (typeof response.content === 'string') {
            logger.info('Successfully received AI response');
            return response.content;
        }

        throw new Error('Invalid AI response format');
    } catch (error: any) {
        logger.error('Error calling AI:', {
            message: error.message,
            status: error.status,
            code: error.code,
        });

        // Provide specific error messages
        if (error.status === 403) {
            throw new Error('OpenAI API Key is invalid, expired, or does not have access to the model. Please check your OPENAI_API_KEY.');
        }
        if (error.status === 401) {
            throw new Error('OpenAI API Key is missing or invalid. Please set OPENAI_API_KEY in your environment.');
        }
        if (error.status === 429) {
            throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        }

        throw new Error(error.message || 'Failed to call AI service');
    }
}
