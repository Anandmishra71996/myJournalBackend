import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const documentController = new DocumentController();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, TXT, and DOCX are allowed.'));
        }
    },
});

router.use(authenticate);

router.post(
    '/upload',
    upload.single('file'),
    documentController.uploadDocument
);

router.get(
    '/',
    documentController.getDocuments
);

router.get(
    '/:id',
    documentController.getDocumentById
);

router.delete(
    '/:id',
    documentController.deleteDocument
);

router.post(
    '/:id/process',
    documentController.processDocument
);

export default router;
