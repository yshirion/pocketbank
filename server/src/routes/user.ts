import { Router } from 'express';
import { requireAuth, requireParent } from '../middleware/auth';
import { getMe, getFamilyChildren, getFamilyParents, promoteToParent, deleteUser, confirmChild } from '../controllers/user.controller';

const router = Router();

router.get('/me', requireAuth, getMe);
router.get('/family/:familyId/children', requireAuth, getFamilyChildren);
router.get('/family/:familyId/parents', requireAuth, getFamilyParents);
router.patch('/:id/confirm', requireAuth, requireParent, confirmChild);
router.patch('/:id/promote', requireAuth, requireParent, promoteToParent);
router.delete('/:id', requireAuth, requireParent, deleteUser);

export default router;
