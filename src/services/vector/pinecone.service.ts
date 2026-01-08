import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '../../utils/logger';

/**
 * Vector metadata structure for Pinecone records
 */
export interface VectorMetadata {
    type: 'journal' | 'goal' | 'insight';
    date?: string;
    [key: string]: any;
}

/**
 * Request to upsert a single vector
 */
export interface UpsertVectorRequest {
    userId: string;
    id: string;
    values: number[];
    metadata?: VectorMetadata;
}

/**
 * Request to query vectors
 */
export interface QueryVectorsRequest {
    userId: string;
    vector: number[];
    topK?: number;
}

/**
 * Query result item
 */
export interface QueryResult {
    id: string;
    score: number;
    metadata?: Record<string, any>;
}

/**
 * Request to delete a vector
 */
export interface DeleteVectorRequest {
    userId: string;
    id: string;
}

/**
 * Pinecone Vector Service
 * Direct integration with Pinecone SDK (no abstractions)
 * Manages vector storage with per-user namespace isolation
 */
class PineconeVectorService {
    private pinecone: Pinecone;
    private indexName: string;

    constructor() {
        const apiKey = process.env.PINECONE_API_KEY;

        if (!apiKey) {
            throw new Error('PINECONE_API_KEY is not set in environment variables');
        }

        this.pinecone = new Pinecone({
            apiKey,
        });

        this.indexName = process.env.PINECONE_INDEX_NAME || 'journal-rag';

        logger.info(`PineconeVectorService initialized with index: ${this.indexName}`);
    }

    /**
     * Upsert (create or update) a vector in Pinecone
     * Uses userId as namespace for data isolation
     * @param request UpsertVectorRequest with userId, id, values, and optional metadata
     * @throws Error if upsert fails
     */
    async upsertVector(request: UpsertVectorRequest): Promise<void> {
        const { userId, id, values, metadata } = request;

        try {
            const index = this.pinecone.Index(this.indexName);
            const ns = index.namespace(userId);

            await ns.upsert([
                {
                    id,
                    values,
                    metadata: metadata || {},
                },
            ]);

            logger.debug(`Vector ${id} upserted for user ${userId}`);
        } catch (error) {
            logger.error(`Error upserting vector ${id} for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Upsert multiple vectors in batch
     * More efficient than individual upserts for bulk operations
     * @param userId User ID (namespace)
     * @param vectors Array of vectors to upsert
     * @throws Error if batch upsert fails
     */
    async upsertVectorsBatch(
        userId: string,
        vectors: Array<{
            id: string;
            values: number[];
            metadata?: VectorMetadata;
        }>
    ): Promise<void> {
        if (vectors.length === 0) {
            return;
        }

        try {
            const index = this.pinecone.Index(this.indexName);
            const ns = index.namespace(userId);

            // Process in batches of 100 (Pinecone limit is 1000, but 100 is safer)
            const batchSize = 100;
            for (let i = 0; i < vectors.length; i += batchSize) {
                const batch = vectors.slice(i, i + batchSize).map((v) => ({
                    id: v.id,
                    values: v.values,
                    metadata: v.metadata || {},
                }));

                await ns.upsert(batch);
            }

            logger.info(`Batch upserted ${vectors.length} vectors for user ${userId}`);
        } catch (error) {
            logger.error(`Error batch upserting vectors for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Query vectors by similarity in Pinecone
     * Uses userId as namespace for data isolation
     * @param request QueryVectorsRequest with userId, vector, and optional topK
     * @returns Promise resolving to array of QueryResult objects (sorted by similarity)
     * @throws Error if query fails
     */
    async queryVectors(request: QueryVectorsRequest): Promise<QueryResult[]> {
        const { userId, vector, topK = 5 } = request;

        try {
            const index = this.pinecone.Index(this.indexName);
            const ns = index.namespace(userId);

            const results = await ns.query({
                vector,
                topK,
                includeMetadata: true,
            });

            return (
                results.matches?.map((match) => ({
                    id: match.id,
                    score: match.score || 0,
                    metadata: match.metadata || {},
                })) || []
            );
        } catch (error) {
            logger.error(`Error querying vectors for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a single vector from Pinecone
     * @param request DeleteVectorRequest with userId and id
     * @throws Error if deletion fails
     */
    async deleteVector(request: DeleteVectorRequest): Promise<void> {
        const { userId, id } = request;

        try {
            const index = this.pinecone.Index(this.indexName);
            const ns = index.namespace(userId);

            await ns.deleteMany([id]);

            logger.debug(`Vector ${id} deleted for user ${userId}`);
        } catch (error) {
            logger.error(`Error deleting vector ${id} for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Delete multiple vectors in batch
     * @param userId User ID (namespace)
     * @param ids Array of vector IDs to delete
     * @throws Error if batch deletion fails
     */
    async deleteVectorsBatch(userId: string, ids: string[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        try {
            const index = this.pinecone.Index(this.indexName);
            const ns = index.namespace(userId);

            // Process in batches of 100
            const batchSize = 100;
            for (let i = 0; i < ids.length; i += batchSize) {
                const batch = ids.slice(i, i + batchSize);
                await ns.deleteMany(batch);
            }

            logger.info(`Batch deleted ${ids.length} vectors for user ${userId}`);
        } catch (error) {
            logger.error(`Error batch deleting vectors for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Delete all vectors for a user (e.g., account deletion)
     * WARNING: This deletes the entire namespace
     * @param userId User ID (namespace)
     * @throws Error if deletion fails
     */
    async deleteUserVectors(userId: string): Promise<void> {
        try {
            const index = this.pinecone.Index(this.indexName);
            const ns = index.namespace(userId);

            await ns.deleteAll();

            logger.info(`All vectors deleted for user ${userId}`);
        } catch (error) {
            logger.error(`Error deleting all vectors for user ${userId}:`, error);
            throw error;
        }
    }
}

// Singleton instance
let vectorService: PineconeVectorService;

export function getPineconeVectorService(): PineconeVectorService {
    if (!vectorService) {
        vectorService = new PineconeVectorService();
    }
    return vectorService;
}

/**
 * RAG Flow Participation:
 *
 * 1. Document Ingestion Pipeline:
 *    - Document → EmbeddingService.embedText() → PineconeVectorService.upsertVector()
 *    - Stores journal entries, goals, insights as vectors in Pinecone
 *    - Namespace = userId (multi-tenant isolation)
 *
 * 2. Query/Retrieval Pipeline:
 *    - User Query → EmbeddingService.embedText() → PineconeVectorService.queryVectors()
 *    - Retrieves relevant context from Pinecone
 *    - Results passed to LLM for response generation
 *
 * 3. Deletion Workflow:
 *    - Entity deleted → PineconeVectorService.deleteVector()/deleteVectorsBatch()
 *    - Maintains consistency between MongoDB and Pinecone
 *
 * Call Chain Example (in service orchestration):
 *
 * Document Ingestion:
 *   journal.controller
 *   → journal.service.createEntry()
 *   → embedding.service.embedText(content)
 *   → pinecone.service.upsertVector({ userId, id, values, metadata })
 *
 * Query/Retrieval:
 *   chat.controller.askQuestion()
 *   → chat.service.generateContextualResponse()
 *   → embedding.service.embedText(question)
 *   → pinecone.service.queryVectors({ userId, vector, topK })
 *   → [context documents passed to LLM via LangGraph/LangChain]
 */
