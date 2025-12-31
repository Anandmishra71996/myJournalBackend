import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';

export const getLLM = (temperature = 0.7, modelName = 'gpt-4-turbo-preview') => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }

    return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName,
        temperature,
        maxTokens: 2000,
        streaming: true,
    });
};

export const getEmbeddings = () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }

    return new OpenAIEmbeddings({
        openAIApiKey: apiKey,
        modelName: 'text-embedding-3-small',
        batchSize: 512,
    });
};

export const openAIConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
    maxRetries: 3,
    timeout: 30000,
};
