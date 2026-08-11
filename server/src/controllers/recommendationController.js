import { Emotion } from '../models/Emotion.js';
import { GoogleGenAI } from '@google/genai';

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const emotions = await Emotion.find({ userId }).sort({ timestamp: -1, createdAt: -1 }).limit(10);
    
    let recentEmotionsStr = "Neutral";
    if (emotions.length > 0) {
      recentEmotionsStr = emotions.map(e => e.normalizedEmotion || e.emotion || e.rawEmotion).join(', ');
    } else {
      return res.status(200).json({
        success: true,
        noData: true,
        message: "No emotions tracked yet."
      });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ 
        success: true,
        fallback: true,
        data: {
          music: "Calm lo-fi beats",
          food: "A warm cup of chamomile tea",
          activity: "Take a 5-minute stretching break",
          social: "Text a close friend",
          mental: "Write down one thing you are grateful for today"
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are MindMirror's expert AI Wellness & Lifestyle Coach.
The user's most recent emotions are: [${recentEmotionsStr}]. 

Your task is to provide a highly personalized, vibrant, and uplifting 5-step action plan to balance their current mood.
CRITICAL RULES:
1. NEVER repeat generic advice (e.g. no "listen to calm music", no "go for a walk").
2. Be extremely specific and creative. Use exact names of songs, real-world dishes, and unique psychological exercises.
3. Match the tone of the emotions: if they are Sad, offer gentle comforts. If Angry, offer energy-releasing activities. If Happy, offer ways to sustain the joy.

Provide exactly 5 recommendations in this JSON format:
{
  "music": "Exact Song Name by Artist - Brief reason why it helps their current mood",
  "food": "Specific dish or unique snack recipe - Brief reason why it's good for them right now",
  "activity": "A highly specific 5-10 minute physical or creative activity (e.g., 'Progressive Muscle Relaxation', 'Shadow Boxing')",
  "social": "A specific social action (e.g., 'Send a 10-second voice note to your best friend')",
  "mental": "A unique cognitive exercise (e.g., 'Write 3 things you are grateful for on a sticky note')"
}

Return ONLY the valid JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text;
    const parsedData = JSON.parse(jsonText);

    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ success: false, message: 'Failed to generate recommendations. Please try again.' });
  }
};
