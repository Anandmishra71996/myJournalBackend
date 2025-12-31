import { Router } from 'express';
import { JournalController } from '../controllers/journal.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const journalController = new JournalController();

// All journal routes require authentication
router.use(authenticate);

router.post('/', journalController.createJournal);
router.get('/', journalController.getJournals);
router.get('/today', journalController.getTodayJournal);
router.get('/by-date', journalController.getJournalByDate);
router.get('/weekly', journalController.getWeeklyJournals);
router.get('/monthly', journalController.getMonthlyJournals);
router.get('/:id', journalController.getJournalById);
router.put('/:id', journalController.updateJournal);
router.delete('/:id', journalController.deleteJournal);

export default router;
