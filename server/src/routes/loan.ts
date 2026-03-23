import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getLoans, createLoan, repayLoans } from '../controllers/loan.controller';

const router = Router();

router.get('/:userId', requireAuth, getLoans);
router.post('/', requireAuth, createLoan);
router.delete('/', requireAuth, repayLoans);

export default router;
