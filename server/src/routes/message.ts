import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getInbox, getSent, sendMessage, markRead } from '../controllers/message.controller';

const router = Router();

router.get('/inbox/:userId', requireAuth, getInbox);
router.get('/sent/:userId', requireAuth, getSent);
router.post('/', requireAuth, sendMessage);
router.patch('/read', requireAuth, markRead);

export default router;
