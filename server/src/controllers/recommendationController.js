import { Emotion } from '../models/Emotion.js';
import { GoogleGenAI } from '@google/genai';

// A real, current Gemini model. The code previously asked for "gemini-3.5-flash",
// which does not exist, so every call errored and the page fell back to
// "Unable to load recommendations". Override with GEMINI_MODEL if needed.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Mood-specific safety net used whenever Gemini is unreachable (no key, quota,
// network). Keyed by the normalised moods the detector produces, so the AI
// Action Plan always shows something that fits how the user actually feels
// instead of dead-ending on an error.
const FALLBACK_PLANS = {
  Happy: {
    music: "'Good as Hell' by Lizzo — keeps an upbeat mood riding high.",
    food: "A bright fruit bowl with berries and dark chocolate — sustains the good energy without a sugar crash.",
    activity: "A 10-minute dance to two of your favourite songs to lock in the joy.",
    social: "Send a friend a voice note sharing one good thing that happened today.",
    mental: "Write down three things going well so you can revisit them on a harder day."
  },
  Sad: {
    music: "'Weightless' by Marconi Union — clinically designed to lower anxiety and soften a low mood.",
    food: "A warm bowl of oatmeal with banana and honey — comforting and steadies blood sugar.",
    activity: "Five minutes of slow box-breathing (in 4, hold 4, out 4, hold 4).",
    social: "Text one person 'thinking of you' — a tiny connection counts.",
    mental: "Write one gentle sentence to yourself as if comforting a good friend."
  },
  Angry: {
    music: "'Lose Yourself' by Eminem — channels the charge into focus instead of friction.",
    food: "A crunchy snack — carrots or an apple — the chewing itself discharges tension.",
    activity: "Two minutes of shadow boxing or fast squats to burn off the adrenaline.",
    social: "Step away and message someone neutral about something unrelated for 60 seconds.",
    mental: "Name the feeling out loud: 'I feel angry because…' — labelling it lowers its grip."
  },
  Fear: {
    music: "'Clair de Lune' by Debussy — a slow, grounding piece that steadies a racing mind.",
    food: "Warm chamomile or peppermint tea — the warmth signals safety to your nervous system.",
    activity: "The 5-4-3-2-1 grounding scan: name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste.",
    social: "Tell one trusted person exactly what you're worried about — saying it shrinks it.",
    mental: "Write the worry down, then one realistic 'most likely' outcome beside it."
  },
  Surprised: {
    music: "'Here Comes the Sun' by The Beatles — an easy reset for a jolted moment.",
    food: "A glass of cold water and a handful of almonds — settles you and steadies focus.",
    activity: "A slow 2-minute stretch, rolling the shoulders and neck to release the startle.",
    social: "Share what surprised you with someone — talking it through makes sense of it.",
    mental: "Jot one line about what you learned from the unexpected moment."
  },
  Disgusted: {
    music: "'Put Your Records On' by Corinne Bailey Rae — light and clearing.",
    food: "A citrus snack — orange slices — the sharp, clean taste resets the senses.",
    activity: "Wash your hands and face with cool water, then take three slow breaths.",
    social: "Change your surroundings for a few minutes and message a friend a light meme.",
    mental: "Redirect attention: describe one pleasant object near you in full detail."
  },
  Stressed: {
    music: "'Weightless' by Marconi Union — proven to reduce stress markers.",
    food: "A square of dark chocolate with green tea — supports calm focus.",
    activity: "Progressive muscle relaxation: tense and release each muscle group for 5 minutes.",
    social: "Ask one person for help with one small thing on your plate.",
    mental: "Brain-dump every open task onto paper, then circle only the next single step."
  },
  Neutral: {
    music: "'Sunday Morning' by Maroon 5 — an easy, balanced backdrop.",
    food: "A balanced snack — Greek yoghurt with nuts — keeps energy level.",
    activity: "A 10-minute walk to reset attention and get light movement.",
    social: "Reach out to someone you haven't spoken to in a while.",
    mental: "Set one small, clear intention for the rest of your day."
  }
};

const planFor = (mood) => FALLBACK_PLANS[mood] || FALLBACK_PLANS.Neutral;

export const getRecommendations = async (req, res) => {
  const userId = req.userId;

  // Resolve the mood first so both the AI path and the fallback can use it.
  const emotions = await Emotion.find({ userId })
    .sort({ timestamp: -1, createdAt: -1 })
    .limit(10);

  if (emotions.length === 0) {
    return res.status(200).json({ success: true, noData: true, message: 'No emotions tracked yet.' });
  }

  const moodOf = (e) => e.normalizedEmotion || e.emotion || e.rawEmotion || 'Neutral';
  const currentMood = moodOf(emotions[0]);                    // the most recent detection
  const recentEmotionsStr = emotions.map(moodOf).join(', ');  // newest-first history

  // No key configured: serve the mood-based plan rather than an error.
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.status(200).json({ success: true, mood: currentMood, fallback: true, data: planFor(currentMood) });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are PsyConnect's expert AI Wellness & Lifestyle Coach.
The user's CURRENT mood, just detected from their face, is: "${currentMood}".
Their recent mood history (newest first) is: [${recentEmotionsStr}].

Craft a highly personalized, uplifting 5-step action plan for someone feeling "${currentMood}" RIGHT NOW.
CRITICAL RULES:
1. Tailor everything to "${currentMood}" specifically: if Sad, gentle comforts; if Angry, safe energy-release; if Fear/anxious, grounding; if Happy, ways to sustain the joy; if Neutral, a gentle lift.
2. Be specific and creative: use exact song names with artists, real dishes, and named psychological exercises. No vague advice.
3. Keep each field to one or two warm, encouraging sentences.

Return ONLY a valid JSON object in exactly this shape:
{
  "music": "Exact Song by Artist - why it fits their current mood",
  "food": "Specific dish or snack - why it helps right now",
  "activity": "A specific 5-10 minute physical or creative activity",
  "social": "A specific small social action",
  "mental": "A specific cognitive/reflection exercise"
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.9,
        responseMimeType: 'application/json'
      }
    });

    // responseMimeType asks for clean JSON, but strip a stray code fence just in
    // case a model wraps it, so a good answer is never lost to a parse error.
    let jsonText = (response.text || '').trim();
    jsonText = jsonText.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    const parsedData = JSON.parse(jsonText);
    return res.json({ success: true, mood: currentMood, data: parsedData });
  } catch (error) {
    console.error('Error generating recommendations:', error.message);
    // Never dead-end the page: fall back to the mood-appropriate plan.
    return res.status(200).json({ success: true, mood: currentMood, fallback: true, data: planFor(currentMood) });
  }
};
