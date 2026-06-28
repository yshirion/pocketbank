import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createMission,
  listMissions,
  completeMission,
  approveMission,
  deactivateMission,
  getNotifications,
  markNotificationsSeen,
} from '../controllers/mission.controller';

const router = Router();

router.get(    '/',                      requireAuth, listMissions          );
router.post(   '/',                      requireAuth, createMission         );
router.post(   '/:id/complete',          requireAuth, completeMission       );
router.post(   '/completions/:cid/approve', requireAuth, approveMission     );
router.patch(  '/:id/deactivate',        requireAuth, deactivateMission     );
router.get(    '/notifications',         requireAuth, getNotifications      );
router.post(   '/notifications/seen',    requireAuth, markNotificationsSeen );

export default router;
