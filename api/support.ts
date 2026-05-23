import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reflection, supportType, lang } = req.body;

    function getSupportFallback(type: string, language: string): string {
      if (language === 'bn') {
        switch (type) {
          case 'motivation':
            return "আপনার ভেতরের মহাজাগতিক অগ্নিকে কখনোই নিভতে দেবেন না। আপনি সমস্ত প্রতিকূলতা জয় করে মহিমান্বিতভাবে জেগে উঠবেন; আজই আপনার বিজয়ের দিন!";
          case 'happy':
            return "মহাবিশ্ব আপনার হৃদয়ের কোমল সুর ও আনন্দধারাকে উদযাপন করছে। এই প্রশান্তি ও সুখের আলো ছড়িয়ে দিন সবার মাঝে!";
          case 'strong':
            return "অবিচল থাকুন পরম শক্তির এক মহতী দুর্গের মতো। কোনো জাগতিক ঝড় আপনার এই আত্মিক ভিত্তিকে বিন্দুমাত্র টলাতে পারবে না।";
          case 'emotional':
          default:
            return "আপনার অনুভূতিগুলোর গভীরতা এক পবিত্র অনুনাদ সৃষ্টি করছে যা আপনাকে আরও পরিপূর্ণ করবে। এই কোমলতা ও আধ্যাত্মিক সংযোগে আস্থা রাখুন।";
        }
      } else {
        switch (type) {
          case 'motivation':
            return "Awaken the sovereign fire lying dormant inside your spirit. The cosmos is waiting for you to conquer the shadow and claim your throne today!";
          case 'happy':
            return "The universe is vibrating in alignment with your sparkling joy and light. Keep radiating this beautiful, life-giving warmth to everyone around you!";
          case 'strong':
            return "You stand as an immovable fortress of divine strength. No temporary earth-storm can shake the eternal mountains of your spirit.";
          case 'emotional':
          default:
            return "The exquisite depth of your heavy feeling is a sacred bridge to higher empathy. Embrace your sensitivity; it is your ultimate superpower.";
        }
      }
    }
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not configured on the server. Deploying support fallback.");
      return res.json({ message: getSupportFallback(supportType || 'emotional', lang || 'en') });
    }

    const systemInstruction = `
      You are MindMirror support companion. 
      Given the user's current mood analysis: "${reflection}", generate a ${supportType} message.
      Response must be in ${lang === 'bn' ? 'Bengali' : 'English'}.
      
      Support Types:
      - "motivation": Inspiring and energetic speech to lift them up.
      - "happy": lighthearted, joyful, and reassuring message.
      - "strong": Empowering, resilient, and grounding message.
      - "emotional": Deeply empathetic, poetic, and understanding message.
      
      Keep it concise (2-3 sentences).
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate my " + supportType + " card content based on reflection: " + reflection,
        config: {
          systemInstruction,
        },
      });

      if (response && response.text) {
        return res.json({ message: response.text });
      }
    } catch (e) {
      console.warn("[API Support Warning] Gemini support failed, using offline fallback:", e);
    }

    res.json({ message: getSupportFallback(supportType || 'emotional', lang || 'en') });
  } catch (error: any) {
    console.error("Gemini Support Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate support message." });
  }
}
