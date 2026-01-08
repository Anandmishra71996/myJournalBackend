import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../../utils/logger';

/**
 * Embedding Service
 * Wraps LangChain's OpenAI embeddings for text-to-vector conversion
 * Used in RAG pipelines to vectorize journal entries, goals, and queries
 */
class EmbeddingService {
    private embeddings: OpenAIEmbeddings;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }

        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: apiKey,
            model: 'text-embedding-3-small',
        });

        logger.info('EmbeddingService initialized with text-embedding-3-small model');
    }

    /**
     * Embed a single text string into a vector
     * @param text The text to embed
     * @returns Promise resolving to a number array (embedding vector)
     * @throws Error if embedding fails
     */
    async embedText(text: string): Promise<number[]> {
        try {
            const vector = await this.embeddings.embedQuery(text);
            return vector;
        } catch (error) {
            logger.error('Error embedding text:', error);
            throw new Error('Failed to generate embedding');
        }
    }

    /**
     * Embed multiple texts (batched)
     * @param texts Array of texts to embed
     * @returns Promise resolving to array of embedding vectors
     * @throws Error if embedding fails
     */
    async embedTexts(texts: string[]): Promise<number[][]> {
        try {
            const vectors = await this.embeddings.embedDocuments(texts);
            return vectors;
        } catch (error) {
            logger.error('Error embedding batch texts:', error);
            throw new Error('Failed to generate embeddings');
        }
    }
}

// Singleton instance
let embeddingService: EmbeddingService;

export function getEmbeddingService(): EmbeddingService {
    if (!embeddingService) {
        embeddingService = new EmbeddingService();
    }
    return embeddingService;
}

/**
 * RAG Flow Participation:
 * 1. Used during document ingestion: embedText() converts journal entries → vectors
 * 2. Used during query time: embedText() converts user queries → vectors
 * 3. Vectors are passed to PineconeService for storage/retrieval
 *
 * Call Chain:
 * Document Ingestion: controller → journal.service → embedding.service + pinecone.service
 * Query: chat.service → embedding.service (query) + pinecone.service (retrieval)
 */
