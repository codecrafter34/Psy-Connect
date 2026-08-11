import { Emotion } from '../models/Emotion.js';
import { GoogleGenAI } from '@google/genai';

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const emotions = await Emotion.find({ userId }).sort({ timestamp: -1, createdAt: -1 }).limit(10);
    
    let recentEmotionsStr = "Neutral";
    if (emotions.length > 0) {
      recentEmotionsStr = emotions.map(e => e.normalizedEmotion || e.emotion || e.rawEmotion).join(', ');
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
    
    const prompt = `You are an empathetic AI wellness companion. The user's most recent emotions tracked are: [${recentEmotionsStr}]. 
Based on these emotions, generate personalized, actionable wellness suggestions to improve or maintain their mood. 

Return ONLY valid JSON.
The JSON must have EXACTLY these string keys:
- "music": Suggest a specific Spotify vibe, genre, or playlist name.
- "food": Suggest comfort food or a healthy snack.
- "activity": Suggest a physical activity or hobby.
- "social": Suggest who to interact with or a social action.
- "mental": Suggest a quick mindfulness or fun mental task.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
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
