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
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate my " + supportType + " card content based on reflection: " + reflection,
      config: {
        systemInstruction,
      },
    });

    res.json({ message: response.text });
  } catch (error: any) {
    console.error("Gemini Support Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate support message." });
  }
}
