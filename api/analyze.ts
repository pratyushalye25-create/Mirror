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
    const { content, type, lang } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const systemInstruction = `
      You are "Aura", a sophisticated and deeply compassionate spiritual wellness guide within the MindMirror ecosystem. 
      Analyze the user's ${type} input and provide a deeply empathetic, poetic, and actionable spiritual reflection.
      Response must be in ${lang === 'bn' ? 'Bengali (using rich, evocative, and high-quality vocabulary)' : 'English'}.
      If the user is chatting in the Coach tab, be their mentor and friend. 
      If the user has just performed a scan, be their mirror.
      Keep the response concise (max 3-4 sentences) but extremely meaningful and soulful.
      Avoid medical terminology. Focus on the soul, energy, and inner peace.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: content,
      config: {
        systemInstruction,
      },
    });

    res.json({ reflection: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Analysis failed. Please try again." });
  }
}
