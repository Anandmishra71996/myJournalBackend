import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

export class DocumentController {
    private documentService: DocumentService;

    constructor() {
        this.documentService = new DocumentService();
    }

    uploadDocument = async (req: AuthRequest, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                });
            }

            const userId = req.user?.id;
            const { name, description } = req.body;

            const document = await this.documentService.uploadDocument(
                req.file,
                userId!,
                name,
                description
            );

            res.status(201).json({
                success: true,
                data: document,
            });
        } catch (error) {
            logger.error('Error in uploadDocument:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload document',
            });
        }
    };

    getDocuments = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { page = 1, limit = 10 } = req.query;

            const documents = await this.documentService.getDocuments(
                userId!,
                Number(page),
                Number(limit)
            );

            res.status(200).json({
                success: true,
                data: documents,
            });
        } catch (error) {
            logger.error('Error in getDocuments:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch documents',
            });
        }
    };

    getDocumentById = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const document = await this.documentService.getDocumentById(id, userId!);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    error: 'Document not found',
                });
            }

            res.status(200).json({
                success: true,
                data: document,
            });
        } catch (error) {
            logger.error('Error in getDocumentById:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch document',
            });
        }
    };

    deleteDocument = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            await this.documentService.deleteDocument(id, userId!);

            res.status(200).json({
                success: true,
                message: 'Document deleted successfully',
            });
        } catch (error) {
            logger.error('Error in deleteDocument:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete document',
            });
        }
    };

    processDocument = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            await this.documentService.processDocument(id, userId!);

            res.status(200).json({
                success: true,
                message: 'Document processing started',
            });
        } catch (error) {
            logger.error('Error in processDocument:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process document',
            });
        }
    };
}
