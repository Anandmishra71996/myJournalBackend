import { Router } from 'express';
import userRoutes from './user.routes';
import journalRoutes from './journal.routes';
import goalRoutes from './goal.routes';
import insightRoutes from './insight.routes';
import pushRoutes from './push.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/journals', journalRoutes);
router.use('/goals', goalRoutes);
router.use('/insights', insightRoutes);
router.use('/push', pushRoutes);

export default router;
