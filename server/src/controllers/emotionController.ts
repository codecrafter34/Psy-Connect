import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Emotion } from '../models/Emotion';
import { analyzeFaceImage } from '../services/rekognitionService';

export const getEmotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const emotions = await Emotion.find({ userId: req.userId }).sort({ timestamp: -1 });
    
    // Map normalizedEmotion back to emotion for the frontend
    const mappedEmotions = emotions.map(e => ({
      ...e.toObject(),
      emotion: e.normalizedEmotion
    }));

    res.json(mappedEmotions);
  } catch (error) {
    console.error('Error fetching emotions:', error);
    res.status(500).json({ message: 'Server error fetching emotions' });
  }
};

export const analyzeEmotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    
    if (!image) {
      res.status(400).json({ message: 'Base64 image string is required in the body' });
      return;
    }

    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      res.status(400).json({ message: 'Invalid image format. Expected a base64 data URL.' });
      return;
    }

    // Rough check for 5MB limit (base64 string length ~1.37x actual size)
    // 5 * 1024 * 1024 * 1.37 = ~7182000
    if (image.length > 7182000) {
      res.status(400).json({ message: 'Image size exceeds the 5MB limit.' });
      return;
    }

    const result = await analyzeFaceImage(image, req.userId as string);
    
    if (!result.success) {
      // 429 Too Many Requests for rate limits, 400 for bad input
      const status = result.code?.includes('LIMIT') ? 429 : 400;
      res.status(status).json(result);
      return;
    }

    res.status(201).json(result.data);
  } catch (error: any) {
    console.error('Error analyzing emotion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Emotion analysis unavailable. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const getEmotionSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = await Emotion.countDocuments({ 
      userId: req.userId,
      timestamp: { $gte: today }
    });
    
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
    
    const weeklyEmotions = await Emotion.find({
      userId: req.userId,
      timestamp: { $gte: sevenDaysAgo }
    });

    let wellnessScore = null;
    const weeklyTrends = [];

    if (totalSessions > 0) {
      const allEmotions = await Emotion.find({ userId: req.userId });
      const positiveEmotions = ['Happy', 'Neutral', 'Surprised'];
      const positiveCount = allEmotions.filter(e => positiveEmotions.includes(e.normalizedEmotion)).length;
      wellnessScore = Math.round((positiveCount / allEmotions.length) * 100);
    }

    if (weeklyEmotions.length > 0) {
      const counts: Record<string, number> = {};
      weeklyEmotions.forEach(e => {
        counts[e.normalizedEmotion] = (counts[e.normalizedEmotion] || 0) + 1;
      });
      for (const [emotion, count] of Object.entries(counts)) {
        weeklyTrends.push({
          emotion,
          percentage: Math.round((count / weeklyEmotions.length) * 100)
        });
      }
      weeklyTrends.sort((a, b) => b.percentage - a.percentage);
    }

    res.json({
      todaySessions,
      totalSessions,
      dominantMood,
      wellnessScore,
      weeklyTrends,
    });
  } catch (error) {
    console.error('Error getting emotion summary:', error);
    res.status(500).json({ message: 'Server error getting summary' });
  }
};

import { getUsageStats } from '../services/rekognitionService';

export const getUserUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getUsageStats(req.userId as string);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ message: 'Server error fetching usage stats' });
  }
};
