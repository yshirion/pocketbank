import { Router } from 'express';
import { requireAuth, requireParent } from '../middleware/auth';
import { getFamily, updateInterests } from '../controllers/family.controller';

const router = Router();

router.get('/:id', requireAuth, getFamily);
router.patch('/:id/interests', requireAuth, requireParent, updateInterests);

export default router;
