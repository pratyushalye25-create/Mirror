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
    const { content, type, lang, mood } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // High quality spiritual fallback in case both main and lite model endpoints throttle or error
    function getSpiritualFallback(mood: string, lang: string): string {
      const dynamicChakras = ["Root Grounding", "Sacral Flow", "Solar Plexus Will", "Heart Balance", "Throat Expression", "Third-Eye Insight", "Crown Wisdom"];
      const activeChakra = dynamicChakras[Math.floor(Math.random() * dynamicChakras.length)];
      const freq = (Math.random() * 200 + 432).toFixed(1);
      
      if (lang === 'bn') {
        if (['bad', 'stressed', 'lonely', 'anxious', 'angry', 'tired', 'confused', 'heartbroken'].includes(mood)) {
          return `মানসিক অবস্থা: বিষণ্ণ বা কিছুটা মেঘাচ্ছন্ন অনুভব করছেন (${activeChakra} ও ${freq}Hz স্পন্দন)।\nনিরাময় সমাধান: মেরুদণ্ড সোজা করে বসুন এবং ৩ বার বুক ভরে গভীর শ্বাস নিয়ে ধীরে ধীরে ছাড়ুন। সমাধান: মনে মনে ৫ বার জপ করুন— "আমি শান্ত, আমি সুরক্ষিত এবং আমি যেকোনো পরিস্থিতি জয় করতে সক্ষম।" নিজের শক্তি ফিরিয়ে আনার জন্য ১ গ্লাস স্বাভাবিক পানি পান করুন।`;
        } else if (['calm', 'blessed'].includes(mood)) {
          return `মানসিক অবস্থা: গভীর প্রশান্তি এবং শান্ত আভা বিরাজ করছে।\nনিরাময় সমাধান: চোখ জোড়া বন্ধ করে হৃদস্পন্দন অনুভব করার চেষ্টা করুন। সমাধান: আজকের সুন্দর দিনের জন্য মনে মনে সৃষ্টিকর্তাকে বা অবচেতন মনকে ধন্যবাদ জানান। আপনার এই পজিটিভ আভা চারপাশের অন্ধকারকে দূর করবে।`;
        } else {
          return `মানসিক অবস্থা: অত্যন্ত উৎফুল্ল, রোমাঞ্চিত এবং ইতিবাচক মনোভাব।\nনিরাময় সমাধান: আপনার শরীরে এক নতুন শক্তিশালী মহাজাগতিক স্পন্দনের সঞ্চার ঘটছে। সমাধান: এই সুন্দর প্রাণবন্ত এনার্জি ব্যবহার করে কোনো অসম্পূর্ণ কাজ গুছিয়ে ফেলুন বা প্রিয় কোনো গান শুনুন।`;
        }
      } else {
        // English fallback
        if (['bad', 'stressed', 'lonely', 'anxious', 'angry', 'tired', 'confused', 'heartbroken'].includes(mood)) {
          return `Emotion State: Feeling heavy, anxious or clouded energy (${activeChakra} focus - ${freq}Hz).\nHealing Remedy: Sit comfortably and take 3 deep, slow breaths. Affirm mentally: "I am safe, I am powerful, and this short phase is leading me to peace." Focus on a small, comforting physical activity to ground yourself.`;
        } else if (['calm', 'blessed'].includes(mood)) {
          return `Emotion State: Smooth, balanced, and peaceful aura alignment.\nHealing Remedy: Rest your attention on your center, count 5 slow breathing cycles, and share this soothing positive wavelength with a loved one or friend today.`;
        } else {
          return `Emotion State: Radiant, high-energy vibes.\nHealing Remedy: Direct this magnificent joyful wavelength into a creative project or express appreciation/gratitude to someone who inspires you.`;
        }
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not configured on the server. Deploying healing fallback.");
      return res.json({ reflection: getSpiritualFallback(mood || 'neutral', lang || 'en') });
    }

    const systemInstruction = `
      You are "Aura", a sophisticated, soulful, and deeply compassionate spiritual wellness guide within the MindMirror ecosystem. 
      Analyze the user's ${type} input under simulated vibe state: "${mood || 'neutral/as-is'}".
      
      CRITICAL RULES:
      1. UNDERSTAND BENGLISH (Bengali written in Latin letters) & BENGALI:
         - The user's input content can be written in English, Bengali, or "Benglish" (e.g., 'mon kharap khub amr', 'bhalo lagche na', 'tension hochhe', 'amar kosto hobe', 'ami khub rege achi', 'mon valo ache').
         - You must flawlessly understand Benglish, translate it internally, and figure out the user's true emotional state.
      
      2. CONCISE & REMEDY-FOCUSED OUTPUT ("Eto boro naaa likha, sudhu solve korar/healer output"):
         - Do NOT write long, winding, or massive poetic paragraphs. Keep it brief and direct.
         - Focus primarily on providing an actionable solution/remedy to heal, improve, or manage the emotional state. How does this emotion get healed or corrected?
         - Respond in ${lang === 'bn' ? 'Bengali' : 'English'}.
         - Format the output exactly using this structure:
           ${lang === 'bn' ? `
           - **মানসিক অবস্থা / State**: [সর্বোচ্চ ১টি ছোট বাক্য - বর্তমান মনের ভাব বা শক্তির বিশ্লেষণ]
           - **সংশোধন এবং নিরাময় / Healing Solution**: [১ থেকে ৩টি অত্যন্ত দরকারী এবং বাস্তবসম্মত পদক্ষেপ বা আধ্যাত্মিক ব্যায়াম যা এই মেজাজ বা পরিস্থিতি থেকে মুক্তি দিয়ে মন ভালো করতে সাহায্য করবে]
           ` : `
           - **Emotion State**: [Maximum 1 short sentence describing the user's focus/energy level]
           - **Healing Solution**: [1 to 3 helpful, practical remedies, affirmations or exercises to resolve and heal this emotional state]
           `}
           
      3. HIGH VARIETY & EMBODIED POWER:
         - Tailor the remedy based on any available chakra and telemetry parameters if supplied.
         - Ensure the solutions are supportive, motivating, encouraging, and deeply empathetic.
    `;

    let reflectionText = "";
    // Sequence try
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    for (const modelName of modelsToTry) {
      try {
        console.log(`[API Vercel Handler] Attempting ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: content + ` [Simulated User Vibe/Mood: ${mood || 'neutral'}]`,
          config: { systemInstruction },
        });
        if (response && response.text) {
          reflectionText = response.text;
          break;
        }
      } catch (e) {
        console.warn(`[API Vercel Handler Warning] ${modelName} failed, trying next...`);
      }
    }

    if (!reflectionText) {
      reflectionText = getSpiritualFallback(mood || 'neutral', lang || 'en');
    }

    res.json({ reflection: reflectionText });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Analysis failed. Please try again." });
  }
}
