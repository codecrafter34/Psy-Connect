import { Router } from 'express';
import { getEmotions, analyzeEmotion, getEmotionSummary, getUserUsage } from '../controllers/emotionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getEmotions);
router.post('/analyze', analyzeEmotion);
router.get('/summary', getEmotionSummary);
router.get('/usage', getUserUsage);

export default router;
