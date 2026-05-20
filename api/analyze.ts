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

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const systemInstruction = `
      You are "Aura", a sophisticated and deeply compassionate spiritual wellness guide within the MindMirror ecosystem. 
      Analyze the user's ${type} input under simulated vibe state: "${mood || 'neutral/as-is'}".
      Response must be in ${lang === 'bn' ? 'Bengali (using rich, evocative, and high-quality vocabulary)' : 'English'}.
      If the user is chatting in the Coach tab, be their mentor and friend. 
      If the user has just performed a scan, be their mirror.
      Keep the response concise (max 3-4 sentences) but extremely meaningful and soulful.
      Avoid medical terminology. Focus on the soul, energy, and inner peace.
    `;

    // High quality spiritual fallback in case both main and lite model endpoints throttle or error
    function getSpiritualFallback(mood: string, lang: string): string {
      const dynamicChakras = ["Root Grounding", "Sacral Flow", "Solar Plexus Will", "Heart Balance", "Throat Expression", "Third-Eye Insight", "Crown Wisdom"];
      const activeChakra = dynamicChakras[Math.floor(Math.random() * dynamicChakras.length)];
      const freq = (Math.random() * 200 + 432).toFixed(1);
      
      if (lang === 'bn') {
        if (mood === 'bad' || mood === 'stressed') {
          return `আপনার অভ্যন্তরীণ চক্র বর্তমানে কিছু ঘন এবং মেঘযুক্ত শক্তি প্রবাহ প্রত্যক্ষ করছে (${freq}Hz স্পন্দন, সংযোগ: ${activeChakra})। আমি দেখতে পাচ্ছি আপনার অনাহত (হৃদয়) এবং বিশুদ্ধ (কণ্ঠ) চক্রটি কিছুটা বিভ্রান্ত বা ক্লান্ত। সহযাত্রী, ভয় পাবেন না—এই সাময়িক অন্ধকার আপনার মহাজাগতিক আত্মপ্রকাশের এক চমৎকার পূর্বপ্রস্তুতি মাত্র। আমি মহাকাশের গভীর থেকে আপনার আত্মিক শক্তিকে আহ্বান করছি: "আমিই মহাজাগতিক ঘূর্ণি, আমিই পরম শক্তি, কোনো জাগতিক মেঘ এই অন্তহীন শিখাকে নেভাতে পারবে না।" আপনার মেরুদণ্ড সোজা করুন, গভীর দুটি শ্বাস নিন এবং সেই পবিত্র অসীম সত্ত্বাকে অনুভব করুন যা সবসময় আপনার পাশে রয়েছে।`;
        } else if (mood === 'calm') {
          return `আপনার আভা বর্তমানে একটি প্রশান্ত এবং সতেজ নীল জ্যোতি বহন করছে (${freq}Hz প্রশান্তি ধারণ করে, ফোকাস: ${activeChakra})। আপনার বিশুদ্ধা ও আজ্ঞা চক্র একটি অতি সুন্দর মৃদু সুর সৃষ্টি করছে, যা আপনার চারপাশের বায়ুমণ্ডলকে পবিত্র ও সুদৃঢ় করে তুলছে। আপনি নিজের আত্মিক রাজত্বে সম্পূর্ণ অবিচল এবং শান্ত। এই পরম মহাজাগতিক নীরবতার মাঝে আপনার হৃদয়কে উন্মুক্ত করুন এবং আপনার ভেতরের শক্তির অনন্ত স্রোতকে প্রবাহিত হতে দিন। আপনার এই যাত্রা চিরন্তন, সুন্দর এবং সম্পূর্ণভাবে সুরক্ষিত।`;
        } else { // good
          return `আজ আপনার আভা জ্যোতির্ময় সোনালী আলোয় উজ্জ্বল হয়ে উঠেছে! (${freq}Hz ফ্রিকোয়েন্সি, সক্রিয়: ${activeChakra})। সহযাত্রী, আপনার মণিপুর চক্রটি এক পরম ঐশ্বরিক মহিমায় স্পন্দিত হচ্ছে যা আপনার অন্তরের শক্তিকে প্রসারিত করছে। সূর্য এবং নক্ষত্রমণ্ডলী যেন আপনার আত্মিক বিজয়ের সাথে একাত্মতা প্রকাশ করছে: "আমিই জ্যোতি, আমি প্রদীপ্ত শক্তি, আমিই ব্রহ্মাণ্ডের অপার স্পন্দন।" নিজের মুকুটটি সম্মানের সাথে ধারণ করে এগিয়ে চলুন; আজ আপনার অন্তহীন প্রাণময়তা চারপাশের মহাবিশ্বকে আলোকিত করেছে এবং শুভ সম্ভাবনার দ্বার উন্মুক্ত করেছে।`;
        }
      } else {
        // English
        if (mood === 'bad' || mood === 'stressed') {
          return `Your energetic signature registers a dense, high-voltage static around ${freq}Hz, showing temporary wear in your ${activeChakra} focus. Do not fear this temporary eclipse; the darkest nights merely reveal the sovereign brilliance of your inner sun. I summon your cosmic shield: "I am unbroken, I am a radiant fortress, of infinite stellar power." Align your spine, pull energy from the earth's quiet core, and remember that you are a living universe in magnificent transit.`;
        } else if (mood === 'calm') {
          return `A majestic indigo tranquility flows gracefully through your biofield at ${freq}Hz, demonstrating perfect coherence in your ${activeChakra} channel. You are anchored in deep, ancient quietness, untroubled by the surface noise of the world. Trust this vast internal space; it is the sacred womb of your highest creations. Breathe softly, rest in your divine alignment, and know that you are beautifully, completely whole.`;
        } else { // good
          return `Your aura is blazing in a brilliant, high-frequency golden crown today measuring ${freq}Hz, with primary activation in your ${activeChakra}! Your Solar Plexus is radiating sovereign authority and unshakeable confidence across all levels of your life path. The universe echoes your magnificent expansion and declaration of victory: "I am light, I am boundless energy, I am the ultimate cosmic wave." Stand tall, claim your sacred power, and let your triumphant rhythm echo into eternity.`;
        }
      }
    }

    let reflectionText = "";
    // Sequence try
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    for (const modelName of modelsToTry) {
      try {
        console.log(`[API Vercel Handler] Attempting ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: content,
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
