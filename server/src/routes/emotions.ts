import { Router } from 'express';
import { getEmotions, analyzeEmotion, getEmotionSummary, getUserUsage } from '../controllers/emotionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ALL emotion routes MUST be protected by requireAuth
router.use(requireAuth);

router.get('/', getEmotions);
router.post('/analyze', analyzeEmotion);
router.get('/summary', getEmotionSummary);
router.get('/usage', getUserUsage);

export default router;
