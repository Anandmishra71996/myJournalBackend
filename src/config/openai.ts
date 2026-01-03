import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../utils/logger';

export const getLLM = (temperature = 0, modelName = 'gpt-4o-mini') => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
        throw new Error('OPENAI_API_KEY has invalid format. It should start with "sk-"');
    }

    logger.info(`Initializing LLM with model: ${modelName}`);

    return new ChatOpenAI({
        model: modelName,
        temperature,
        apiKey: apiKey,
        configuration: {
            organization: process.env.OPENAI_ORG_ID as string, // if applicable
        },

    });
};

export const getEmbeddings = () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }

    return new OpenAIEmbeddings({
        model: 'text-embedding-3-small',
        batchSize: 512,
    });
};

export const openAIConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
    maxRetries: 3,
    timeout: 30000,
};
