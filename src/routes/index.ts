import { Router } from 'express';
import userRoutes from './user.routes';
import journalRoutes from './journal.routes';
import goalRoutes from './goal.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/journals', journalRoutes);
router.use('/goals', goalRoutes);

export default router;
