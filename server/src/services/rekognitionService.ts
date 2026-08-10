import { RekognitionClient, DetectFacesCommand, Emotion as AwsEmotion } from '@aws-sdk/client-rekognition';
import { ApiUsage } from '../models/ApiUsage';
import { Emotion } from '../models/Emotion';

const LIMITS = {
  MONTHLY: parseInt(process.env.AWS_MONTHLY_ANALYSIS_LIMIT || '800', 10),
  DAILY_USER: parseInt(process.env.AWS_DAILY_ANALYSIS_LIMIT_PER_USER || '20', 10)
};

// Initialize Rekognition client safely (lazy init to allow env vars to be loaded first if needed)
let rekognitionClient: RekognitionClient | null = null;
const getClient = () => {
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

// Deterministic emotion mapping
const normalizeEmotion = (raw: string): string => {
  const map: Record<string, string> = {
    HAPPY: 'Happy',
    SAD: 'Sad',
    ANGRY: 'Angry',
    CALM: 'Neutral',
    CONFUSED: 'Neutral',
    UNKNOWN: 'Neutral',
    DISGUSTED: 'Angry',
    FEAR: 'Sad',
    SURPRISED: 'Neutral'
  };
  return map[raw] || 'Neutral';
};

export const analyzeFaceImage = async (imageBase64: string, userId: string) => {
  const now = new Date();
  
  // 1. Check Global Monthly Limit
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const usageDoc = await ApiUsage.findOne({
    month: monthKey,
    provider: 'aws-rekognition',
    operation: 'DetectFaces'
  });
  
  const currentMonthlyUsage = usageDoc?.count || 0;
  if (currentMonthlyUsage >= LIMITS.MONTHLY) {
    return {
      success: false,
      code: 'MONTHLY_LIMIT_REACHED',
      message: 'Monthly emotion analysis limit reached. Please try again next month.'
    };
  }

  // 2. Check Daily Per-User Limit
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const userDailyCount = await Emotion.countDocuments({
    userId,
    timestamp: { $gte: startOfDay }
  });

  if (userDailyCount >= LIMITS.DAILY_USER) {
    return {
      success: false,
      code: 'DAILY_LIMIT_REACHED',
      message: 'Daily emotion analysis limit reached. Please try again tomorrow.'
    };
  }

  // 3. Process Image
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  if (imageBuffer.length === 0) {
    throw new Error('Empty image data provided.');
  }

  // 4. Call AWS Rekognition
  const command = new DetectFacesCommand({
    Image: {
      Bytes: imageBuffer
    },
    Attributes: ["EMOTIONS"]
  });

  const response = await getClient().send(command);

  // 5. Select Best Face
  if (!response.FaceDetails || response.FaceDetails.length === 0) {
    return {
      success: false,
      code: 'NO_FACE',
      message: 'No face detected. Please position your face inside the camera.'
    };
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
    return {
      success: false,
      code: 'NO_EMOTION_DATA',
      message: 'Face detected, but no emotions could be determined. Please move closer and face the camera directly.'
    };
  }

  // Sort by confidence to get the primary emotion
  emotions.sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0));
  const primaryEmotion = emotions[0];
  
  if (!primaryEmotion.Type || primaryEmotion.Confidence === undefined) {
    throw new Error('AWS returned incomplete emotion data.');
  }

  // Reject very low confidence emotion classifications
  if (primaryEmotion.Confidence < 40) {
    return {
      success: false,
      code: 'LOW_CONFIDENCE',
      message: 'Emotion unclear. Please ensure good lighting and look directly at the camera.'
    };
  }

  const rawEmotion = primaryEmotion.Type;
  const normalizedEmotion = normalizeEmotion(rawEmotion);
  const confidence = primaryEmotion.Confidence; // Using actual AWS confidence

  // 6. Save to DB
  const newRecord = await Emotion.create({
    userId,
    rawEmotion,
    normalizedEmotion,
    confidence,
    provider: 'aws-rekognition',
    timestamp: now
  });

  // 7. Increment Application Usage Counter Atomically
  await ApiUsage.findOneAndUpdate(
    { month: monthKey, provider: 'aws-rekognition', operation: 'DetectFaces' },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  return {
    success: true,
    data: {
      id: newRecord._id,
      emotion: newRecord.normalizedEmotion, // returned mapped for frontend compatibility
      rawEmotion: newRecord.rawEmotion,
      confidence: newRecord.confidence,
      timestamp: newRecord.timestamp
    }
  };
};

export const getUsageStats = async (userId: string) => {
  const now = new Date();
  
  // Global Monthly
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const usageDoc = await ApiUsage.findOne({
    month: monthKey,
    provider: 'aws-rekognition',
    operation: 'DetectFaces'
  });
  
  // User Daily
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const userDailyCount = await Emotion.countDocuments({
    userId,
    timestamp: { $gte: startOfDay }
  });

  return {
    monthly: {
      used: usageDoc?.count || 0,
      limit: LIMITS.MONTHLY
    },
    daily: {
      used: userDailyCount,
      limit: LIMITS.DAILY_USER
    }
  };
};
