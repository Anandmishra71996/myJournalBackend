import { Document } from '../models/document.model';
import { VectorStore } from '../models/vectorStore.model';
import { getEmbeddings } from '../config/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export class DocumentService {
    private embeddings;
    private textSplitter;
    private uploadDir = './uploads';

    constructor() {
        this.embeddings = getEmbeddings();
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadDocument(
        file: Express.Multer.File,
        userId: string,
        name?: string,
        description?: string
    ) {
        try {
            // Save file to disk
            const fileName = `${Date.now()}-${file.originalname}`;
            const filePath = path.join(this.uploadDir, fileName);
            fs.writeFileSync(filePath, file.buffer);

            // Create document record
            const document = await Document.create({
                userId,
                name: name || file.originalname,
                description,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                storagePath: filePath,
                status: 'pending',
            });

            // Process document asynchronously
            this.processDocument(document._id.toString(), userId).catch((error) => {
                logger.error('Error processing document:', error);
            });

            return document;
        } catch (error) {
            logger.error('Error uploading document:', error);
            throw error;
        }
    }

    async processDocument(documentId: string, userId: string) {
        try {
            const document = await Document.findOne({ _id: documentId, userId });
            if (!document) {
                throw new Error('Document not found');
            }

            document.status = 'processing';
            await document.save();

            // Load document based on type
            let loader;
            if (document.mimeType === 'application/pdf') {
                loader = new PDFLoader(document.storagePath);
            } else if (document.mimeType === 'text/plain') {
                loader = new TextLoader(document.storagePath);
            } else if (document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                loader = new DocxLoader(document.storagePath);
            } else {
                throw new Error('Unsupported file type');
            }

            // Load and split document
            const docs = await loader.load();
            const chunks = await this.textSplitter.splitDocuments(docs);

            // Generate embeddings and store
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const embedding = await this.embeddings.embedQuery(chunk.pageContent);

                await VectorStore.create({
                    documentId: document._id,
                    userId,
                    chunkIndex: i,
                    content: chunk.pageContent,
                    embedding,
                    metadata: {
                        ...chunk.metadata,
                        chunkSize: chunk.pageContent.length,
                        source: document.name,
                    },
                });
            }

            document.status = 'completed';
            document.chunkCount = chunks.length;
            await document.save();

            logger.info(`Document ${documentId} processed successfully`);
        } catch (error: any) {
            logger.error('Error processing document:', error);

            const document = await Document.findById(documentId);
            if (document) {
                document.status = 'failed';
                document.processingError = error.message;
                await document.save();
            }

            throw error;
        }
    }

    async getDocuments(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [documents, total] = await Promise.all([
            Document.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Document.countDocuments({ userId }),
        ]);

        return {
            documents,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async getDocumentById(documentId: string, userId: string) {
        return await Document.findOne({ _id: documentId, userId });
    }

    async deleteDocument(documentId: string, userId: string) {
        const document = await Document.findOne({ _id: documentId, userId });
        if (!document) {
            throw new Error('Document not found');
        }

        // Delete file from disk
        if (fs.existsSync(document.storagePath)) {
            fs.unlinkSync(document.storagePath);
        }

        // Delete vector embeddings
        await VectorStore.deleteMany({ documentId: document._id });

        // Delete document record
        await document.deleteOne();

        logger.info(`Document ${documentId} deleted successfully`);
    }
}
