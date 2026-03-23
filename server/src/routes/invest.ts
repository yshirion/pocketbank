import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getInvests, createInvest, withdrawInvests } from '../controllers/invest.controller';

const router = Router();

router.get('/:userId', requireAuth, getInvests);
router.post('/', requireAuth, createInvest);
router.delete('/', requireAuth, withdrawInvests);

export default router;
