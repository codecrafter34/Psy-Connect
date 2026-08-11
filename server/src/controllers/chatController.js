import { GoogleGenAI } from '@google/genai';

export const handleChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.json({ 
        success: true, 
        reply: "Hello! I am MindMirror's AI wellness companion. Please add a valid Gemini API Key to your server's .env file to start our conversation."
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const systemPrompt = `You are an empathetic, professional AI mental wellness companion for MindMirror. 
Your goal is to support the user, validate their feelings, and offer brief, actionable wellness advice when appropriate. 
Keep your responses conversational, supportive, and relatively short. Do not provide medical diagnoses.`;

    const chatHistory = history && Array.isArray(history) 
      ? history.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n') 
      : '';
    
    const prompt = `${systemPrompt}\n\nConversation History:\n${chatHistory}\n\nUser: ${message}\nAI:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ success: true, reply: response.text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to process chat. Please try again.' });
  }
};
