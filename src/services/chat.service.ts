import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { getLLM, getEmbeddings } from '../config/openai';
import { VectorStore } from '../models/vectorStore.model';
import { Conversation } from '../models/conversation.model';
import { logger } from '../utils/logger';

export class ChatService {
    private llm;
    private embeddings;
    private textSplitter;

    constructor() {
        this.llm = getLLM();
        this.embeddings = getEmbeddings();
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
    }

    async chat(
        message: string,
        userId: string,
        conversationId?: string,
        systemPrompt?: string
    ) {
        try {
            // Get relevant context from vector store
            const context = await this.getRelevantContext(message, userId);

            // Get conversation history
            let conversation;
            if (conversationId) {
                conversation = await Conversation.findById(conversationId);
            } else {
                // Create new conversation
                conversation = await Conversation.create({
                    userId,
                    title: message.substring(0, 50),
                    messages: [],
                });
            }

            // Build chat history
            const chatHistory = conversation?.messages.slice(-10).map((msg) => ({
                role: msg.role,
                content: msg.content,
            })) || [];

            // Create prompt
            const prompt = PromptTemplate.fromTemplate(`
${systemPrompt || 'You are a helpful AI assistant with access to a knowledge base.'}

Context from knowledge base:
{context}

Chat History:
{chat_history}

User Question: {question}

Answer:`);

            // Create chain
            const chain = RunnableSequence.from([
                prompt,
                this.llm,
                new StringOutputParser(),
            ]);

            // Generate response
            const response = await chain.invoke({
                context: context,
                chat_history: this.formatChatHistory(chatHistory),
                question: message,
            });

            // Save to conversation
            conversation.messages.push(
                { role: 'user', content: message, timestamp: new Date() },
                { role: 'assistant', content: response, timestamp: new Date() }
            );
            await conversation.save();

            return {
                message: response,
                conversationId: conversation._id,
                context: context,
            };
        } catch (error) {
            logger.error('Error in chat service:', error);
            throw error;
        }
    }

    async streamChat(
        message: string,
        userId: string,
        conversationId: string | undefined,
        systemPrompt: string | undefined,
        onChunk: (chunk: string) => void
    ) {
        try {
            const context = await this.getRelevantContext(message, userId);

            let conversation;
            if (conversationId) {
                conversation = await Conversation.findById(conversationId);
            } else {
                conversation = await Conversation.create({
                    userId,
                    title: message.substring(0, 50),
                    messages: [],
                });
            }

            const chatHistory = conversation?.messages.slice(-10) || [];

            const prompt = PromptTemplate.fromTemplate(`
${systemPrompt || 'You are a helpful AI assistant with access to a knowledge base.'}

Context: {context}
Chat History: {chat_history}
User Question: {question}

Answer:`);

            const chain = RunnableSequence.from([prompt, this.llm]);

            let fullResponse = '';

            const stream = await chain.stream({
                context: context,
                chat_history: this.formatChatHistory(chatHistory),
                question: message,
            });

            for await (const chunk of stream) {
                const content = chunk.content || '';
                fullResponse += content;
                onChunk(content);
            }

            conversation.messages.push(
                { role: 'user', content: message, timestamp: new Date() },
                { role: 'assistant', content: fullResponse, timestamp: new Date() }
            );
            await conversation.save();

        } catch (error) {
            logger.error('Error in stream chat:', error);
            throw error;
        }
    }

    async getRelevantContext(query: string, userId: string, topK: number = 5): Promise<string> {
        try {
            // Generate embedding for the query
            const queryEmbedding = await this.embeddings.embedQuery(query);

            // Find similar documents using cosine similarity
            const similarDocs = await VectorStore.aggregate([
                {
                    $match: { userId: userId }
                },
                {
                    $addFields: {
                        similarity: {
                            $let: {
                                vars: {
                                    dotProduct: {
                                        $reduce: {
                                            input: { $range: [0, { $size: '$embedding' }] },
                                            initialValue: 0,
                                            in: {
                                                $add: [
                                                    '$$value',
                                                    {
                                                        $multiply: [
                                                            { $arrayElemAt: ['$embedding', '$$this'] },
                                                            { $arrayElemAt: [queryEmbedding, '$$this'] }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                },
                                in: '$$dotProduct'
                            }
                        }
                    }
                },
                { $sort: { similarity: -1 } },
                { $limit: topK }
            ]);

            // Format context
            const context = similarDocs
                .map((doc) => doc.content)
                .join('\n\n---\n\n');

            return context || 'No relevant context found.';
        } catch (error) {
            logger.error('Error getting relevant context:', error);
            return '';
        }
    }

    async getChatHistory(conversationId: string, userId: string) {
        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId,
        });

        return conversation?.messages || [];
    }

    private formatChatHistory(history: any[]): string {
        return history
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join('\n');
    }
}
