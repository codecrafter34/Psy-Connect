import mongoose from 'mongoose';
import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { Emotion } from '../models/Emotion.js';
import { ApiUsage } from '../models/ApiUsage.js';

const LIMITS = {
  MONTHLY: parseInt(process.env.AWS_MONTHLY_ANALYSIS_LIMIT || '800', 10),
  // Per-user AWS calls per day before the analysis is handed to the free Flask
  // model. Override with AWS_DAILY_ANALYSIS_LIMIT_PER_USER if needed.
  DAILY_USER: parseInt(process.env.AWS_DAILY_ANALYSIS_LIMIT_PER_USER || '20', 10)
};

// Where the Python (Flask/FER) emotion model lives. Localhost in development;
// in production set ML_SERVICE_URL to the deployed service, e.g.
// https://psyconnect-ml.onrender.com — trailing slash is trimmed so the join
// below never produces a double slash.
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');

let rekognitionClient = null;
const getAWSClient = () => {
  if (!rekognitionClient) {
    rekognitionClient = new RekognitionClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }
  return rekognitionClient;
};

const normalizeEmotion = (raw) => {
  const map = {
    HAPPY: 'Happy', 
    SAD: 'Sad', 
    ANGRY: 'Angry',
    CALM: 'Neutral', 
    CONFUSED: 'Confused', 
    UNKNOWN: 'Neutral',
    DISGUSTED: 'Disgusted', 
    FEAR: 'Fear', 
    SURPRISED: 'Surprised'
  };
  return map[raw] || 'Neutral';
};

const callAWSRekognition = async (imageBase64) => {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const command = new DetectFacesCommand({
    Image: { Bytes: imageBuffer },
    Attributes: ['EMOTIONS']
  });

  const response = await getAWSClient().send(command);

  if (!response.FaceDetails || response.FaceDetails.length === 0) {
    return { success: false, code: 'NO_FACE', message: 'No face detected. Please position your face inside the camera.' };
  }

  let largestFace = response.FaceDetails[0];
  if (response.FaceDetails.length > 1) {
    largestFace = response.FaceDetails.reduce((prev, current) => {
      const prevArea = (prev.BoundingBox?.Width || 0) * (prev.BoundingBox?.Height || 0);
      const currArea = (current.BoundingBox?.Width || 0) * (current.BoundingBox?.Height || 0);
      return currArea > prevArea ? current : prev;
    });
  }

  const emotions = largestFace.Emotions;
  if (!emotions || emotions.length === 0) {
    return { success: false, code: 'NO_EMOTION_DATA', message: 'Face detected, but no emotions could be determined.' };
  }

  emotions.sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0));
  
  if (emotions[0].Confidence < 40) {
    return { success: false, code: 'LOW_CONFIDENCE', message: 'Emotion unclear. Please ensure good lighting.' };
  }

  const top3 = emotions.slice(0, 3);

  let rawEmotion = emotions[0].Type;
  let normalizedEmotion = normalizeEmotion(rawEmotion);
  let confidence = emotions[0].Confidence;

  // AWS Rekognition systematically under-ranks expressive faces: a furrowed-brow
  // "Angry" frequently reads as "Calm" or "Sad" and is buried below the top
  // result. Scan the WHOLE reading (not just the top 3) and give the expressive
  // emotions a lower bar so they are not lost under a bland winner.
  const EXPRESSIVE = ['ANGRY', 'DISGUSTED', 'FEAR', 'SURPRISED'];
  const expressive = emotions
    .filter((e) => EXPRESSIVE.includes(e.Type) && (e.Confidence || 0) > 5)
    .sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0))[0];
  if (expressive) {
    rawEmotion = expressive.Type;
    normalizedEmotion = normalizeEmotion(rawEmotion);
    confidence = expressive.Confidence;
  }

  // Anger is the most under-reported emotion of all, so it gets the lowest bar:
  // any clear trace of it anywhere in the reading wins. This is what makes an
  // angry face at the camera actually register as "Angry".
  const angry = emotions.find((e) => e.Type === 'ANGRY');
  if (angry && (angry.Confidence || 0) >= 7) {
    rawEmotion = 'ANGRY';
    normalizedEmotion = 'Angry';
    confidence = angry.Confidence;
  }

  // Bonus Logic for Complex Emotions
  const hasHighFear = top3.find(e => e.Type === 'FEAR' && e.Confidence > 20);
  const hasHighSad = top3.find(e => e.Type === 'SAD' && e.Confidence > 20);
  const hasHighConfused = top3.find(e => e.Type === 'CONFUSED' && e.Confidence > 20);
  const hasHighAngry = top3.find(e => e.Type === 'ANGRY' && e.Confidence > 20);

  if ((hasHighFear && hasHighSad) || (hasHighConfused && hasHighAngry)) {
    rawEmotion = 'COMPLEX_STRESS';
    normalizedEmotion = 'Stressed';
    const relevantEmotions = [hasHighFear, hasHighSad, hasHighConfused, hasHighAngry].filter(Boolean);
    if (relevantEmotions.length >= 2) {
       confidence = (relevantEmotions[0].Confidence + relevantEmotions[1].Confidence) / 2;
    }
  }

  return { success: true, rawEmotion, normalizedEmotion, confidence, provider: 'aws-rekognition' };
};

const callFlaskFallback = async (imageBase64) => {
  // A cold (asleep) free-tier ML instance can take a while to answer, but we
  // must not hang the request forever, so cap the wait.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  let flaskResponse;
  try {
    flaskResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }

  const flaskResult = await flaskResponse.json();

  if (!flaskResponse.ok || !flaskResult.success) {
    throw new Error(flaskResult.message || 'Flask ML service error');
  }

  const { emotion, rawEmotion, confidence } = flaskResult.data;
  return { success: true, rawEmotion, normalizedEmotion: emotion, confidence, provider: 'flask-ml' };
};

export const getEmotions = async (req, res) => {
  try {
    const emotions = await Emotion.find({ userId: req.userId }).sort({ timestamp: -1, createdAt: -1 });
    const mappedEmotions = emotions.map(e => {
      const obj = e.toObject();
      return {
        ...obj,
        emotion: e.normalizedEmotion || obj.emotion || obj.rawEmotion || 'Neutral',
        timestamp: obj.timestamp || obj.createdAt || new Date(),
        confidence: obj.confidence || 0
      };
    });
    res.json(mappedEmotions);
  } catch (error) {
    console.error('Error fetching emotions:', error);
    res.status(500).json({ message: 'Server error fetching emotions' });
  }
};

export const analyzeEmotion = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.userId;

    if (!image) {
      res.status(400).json({ message: 'Base64 image string is required in the body' });
      return;
    }

    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      res.status(400).json({ message: 'Invalid image format. Expected a base64 data URL.' });
      return;
    }

    if (image.length > 7182000) {
      res.status(400).json({ message: 'Image size exceeds the 5MB limit.' });
      return;
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usageDoc = await ApiUsage.findOne({ month: monthKey, provider: 'aws-rekognition', operation: 'DetectFaces' });
    const currentMonthlyUsage = usageDoc?.count || 0;
    const awsMonthlyLimitReached = currentMonthlyUsage >= LIMITS.MONTHLY;

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Only AWS calls count toward the per-user daily cap. Flask is self-hosted
    // and free, so it is never rate-limited.
    const userAwsDailyCount = await Emotion.countDocuments({
      userId,
      provider: 'aws-rekognition',
      timestamp: { $gte: startOfDay }
    });
    const awsDailyLimitReached = userAwsDailyCount >= LIMITS.DAILY_USER;

    // Neither limit refuses the request any more. When the AWS budget (monthly,
    // global) OR the per-user daily cap is spent, the analysis is handed to the
    // free Flask ML model instead of returning an error.
    const useFlaskOnly = awsMonthlyLimitReached || awsDailyLimitReached;

    let result = null;
    let awsSoftFail = null; // a real business answer from AWS (e.g. "no face"), not a crash

    // PRIMARY: AWS Rekognition — skipped once a limit is spent so the free tier
    // is never overrun. The request is NOT refused; it falls through to Flask.
    if (useFlaskOnly) {
      console.warn(`[AWS] Skipped (${awsMonthlyLimitReached ? 'monthly' : 'daily'} limit reached) — using Flask ML.`);
    } else {
      try {
        result = await callAWSRekognition(image);
        if (result.success) {
          console.log(`[AWS] Emotion: ${result.normalizedEmotion} | Confidence: ${result.confidence.toFixed(2)}%`);
        } else {
          awsSoftFail = result; // NO_FACE / LOW_CONFIDENCE — try Flask, but keep this as the fallback message
          result = null;
        }
      } catch (awsError) {
        console.warn(`[AWS] Failed: ${awsError.message}. Switching to Flask ML fallback...`);
      }
    }

    // FALLBACK: Flask ML when AWS is over budget, errored, or saw no usable face.
    if (!result) {
      try {
        result = await callFlaskFallback(image);
        console.log(`[FALLBACK] Flask ML used — Emotion: ${result.normalizedEmotion} | Confidence: ${result.confidence.toFixed(2)}%`);
      } catch (flaskError) {
        console.error(`[FALLBACK] Flask ML unavailable: ${flaskError.message}`);
        // If AWS gave a clear business answer (no face / unclear), surface that
        // rather than a generic failure.
        if (awsSoftFail) {
          res.status(400).json({ success: false, code: awsSoftFail.code, message: awsSoftFail.message });
          return;
        }
        const message = useFlaskOnly
          ? 'The cloud analysis limit was reached and the backup ML service is not reachable right now. Please try again later.'
          : 'Emotion analysis is temporarily unavailable. Please try again in a moment.';
        res.status(503).json({ success: false, code: 'ML_UNAVAILABLE', message });
        return;
      }
    }

    const newRecord = await Emotion.create({
      userId,
      rawEmotion: result.rawEmotion,
      normalizedEmotion: result.normalizedEmotion,
      confidence: result.confidence,
      provider: result.provider,
      timestamp: now
    });

    await ApiUsage.findOneAndUpdate(
      { month: monthKey, provider: result.provider, operation: 'DetectFaces' },
      { $inc: { count: 1 } },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(201).json({
      success: true,
      data: {
        id: newRecord._id,
        emotion: newRecord.normalizedEmotion,
        rawEmotion: newRecord.rawEmotion,
        confidence: newRecord.confidence,
        provider: newRecord.provider,
        timestamp: newRecord.timestamp
      }
    });

  } catch (error) {
    console.error('Error analyzing emotion:', error);
    res.status(500).json({
      success: false,
      message: 'Emotion analysis unavailable. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getEmotionSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = await Emotion.countDocuments({ userId: req.userId, timestamp: { $gte: today } });
    const totalSessions = await Emotion.countDocuments({ userId: req.userId });

    const dominantMoodResult = await Emotion.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: '$normalizedEmotion', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const dominantMood = dominantMoodResult.length > 0 ? dominantMoodResult[0]._id : null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyEmotions = await Emotion.find({ userId: req.userId, timestamp: { $gte: sevenDaysAgo } });

    let wellnessScore = null;
    const weeklyTrends = [];

    if (totalSessions > 0) {
      const allEmotions = await Emotion.find({ userId: req.userId });
      const positiveEmotions = ['Happy', 'Neutral', 'Surprised'];
      const positiveCount = allEmotions.filter(e => positiveEmotions.includes(e.normalizedEmotion)).length;
      wellnessScore = Math.round((positiveCount / allEmotions.length) * 100);
    }

    if (weeklyEmotions.length > 0) {
      const counts = {};
      weeklyEmotions.forEach(e => {
        const emo = e.normalizedEmotion || e.get('emotion') || e.rawEmotion || 'Neutral';
        counts[emo] = (counts[emo] || 0) + 1;
      });
      for (const [emotion, count] of Object.entries(counts)) {
        weeklyTrends.push({ emotion, percentage: Math.round((count / weeklyEmotions.length) * 100) });
      }
      weeklyTrends.sort((a, b) => b.percentage - a.percentage);
    }

    res.json({ todaySessions, totalSessions, dominantMood, wellnessScore, weeklyTrends });
  } catch (error) {
    console.error('Error getting emotion summary:', error);
    res.status(500).json({ message: 'Server error getting summary' });
  }
};

export const getUserUsage = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.userId;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const awsUsageDoc = await ApiUsage.findOne({ month: monthKey, provider: 'aws-rekognition', operation: 'DetectFaces' });
    const flaskUsageDoc = await ApiUsage.findOne({ month: monthKey, provider: 'flask-ml', operation: 'DetectFaces' });

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const userDailyCount = await Emotion.countDocuments({ userId, timestamp: { $gte: startOfDay } });

    res.json({
      monthly: {
        used: (awsUsageDoc?.count || 0) + (flaskUsageDoc?.count || 0),
        limit: LIMITS.MONTHLY
      },
      daily: {
        used: userDailyCount,
        limit: LIMITS.DAILY_USER
      }
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ message: 'Server error fetching usage stats' });
  }
};
