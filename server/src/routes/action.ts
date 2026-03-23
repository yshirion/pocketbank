import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getActions, createAction } from '../controllers/action.controller';

const router = Router();

router.get('/:userId', requireAuth, getActions);
router.post('/', requireAuth, createAction);

export default router;
