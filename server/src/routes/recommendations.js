import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getRecommendations);

export default router;
