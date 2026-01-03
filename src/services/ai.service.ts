import { getLLM } from '../config/openai';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

/**
 * Test OpenAI API key by making a direct call to OpenAI SDK
 */
export async function testAPIKey(): Promise<{ success: boolean; message: string }> {
    try {
        logger.info('Testing OpenAI API key directly with OpenAI SDK...');

        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Reply with OK" }],
            max_tokens: 10,
        });

        const content = response.choices[0]?.message?.content;

        if (content) {
            logger.info('API key test successful!');
            return {
                success: true,
                message: `API key is valid. Response: ${content}`
            };
        }

        return {
            success: false,
            message: 'Invalid response format from API'
        };
    } catch (error: any) {
        logger.error('API key test failed:', {
            message: error.message,
            status: error.status,
            code: error.code,
            type: error.type,
        });

        if (error.status === 403) {
            return {
                success: false,
                message: 'API Key is invalid, expired, or does not have access to the model.'
            };
        }
        if (error.status === 401) {
            return {
                success: false,
                message: 'API Key is missing or invalid.'
            };
        }
        if (error.status === 429) {
            return {
                success: false,
                message: 'API rate limit exceeded.'
            };
        }

        return {
            success: false,
            message: error.message || 'API key test failed'
        };
    }
}

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
