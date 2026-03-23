import { Router } from 'express';
import { login, registerParent, registerChild, logout } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register/parent', registerParent);
router.post('/register/child', registerChild);
router.post('/logout', logout);

export default router;
