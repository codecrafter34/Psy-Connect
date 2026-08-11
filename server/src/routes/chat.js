import { Router } from 'express';
import { handleChat } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', handleChat);

export default router;
