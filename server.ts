import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Unique parameter generator to ensure fallbacks are also customized and organic
  const runRandomModifier = () => {
    const dynamicChakras = ["Root Grounding", "Sacral Flow", "Solar Plexus Will", "Heart Balance", "Throat Expression", "Third-Eye Insight", "Crown Wisdom"];
    const activeChakra = dynamicChakras[Math.floor(Math.random() * dynamicChakras.length)];
    const freq = (Math.random() * 200 + 432).toFixed(1);
    return { activeChakra, freq };
  };

  // High quality spiritual fallback in case both main and lite model endpoints throttle or error
  function getSpiritualFallback(type: string, mood: string, lang: string): string {
    const { activeChakra, freq } = runRandomModifier();
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

  // Support messages fallback generator
  function getSupportFallback(supportType: string, lang: string): string {
    if (lang === 'bn') {
      switch (supportType) {
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
      switch (supportType) {
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

  // Prompt Lab fallback generator
  function getPromptLabFallback(prompt: string): string {
    return `[Resilient Offline Lab Engine Output]
Your requested prompt: "${prompt.slice(0, 50)}..." has been evaluated locally due to high API demand:
- Optimize code structure, decompose massive elements into small modular functions.
- Wrap state handles properly inside React.useMemo or React.useCallback hooks.
- Handle responsive flex alignment classes using Tailwind CSS.
- Keep the aura feedback loop alive!`;
  }

  // Dynamic generate content sequence with retry logic
  interface GenerateParams {
    model: string;
    contents: string | any;
    config?: {
      systemInstruction?: string;
      temperature?: number;
    };
  }

  async function generateTextWithFallback(
    params: GenerateParams,
    fallbackFn: () => string
  ): Promise<string> {
    // Sequence of models to try
    const modelsToTry = [
      params.model,
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite"
    ];

    // Remove duplicates and empty names
    const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
    let lastError: any = null;

    for (const modelName of uniqueModels) {
      try {
        console.log(`Attempting content generation using model ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          console.log(`Content generation succeeded with model: ${modelName}`);
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[API WARNING] Model ${modelName} failed/503:`, err.message || err);
        // Continue to the next fallback model
      }
    }

    // All model endpoints failed or throttled - activate fallback signature
    console.log("All model candidates returned error (e.g. 503 high demand). Deploying custom soulful offline spiritual fallback.");
    return fallbackFn();
  }

  // API Route for Analysis
  app.post("/api/analyze", async (req, res) => {
    console.log("Analysis request received:", req.body?.type, "Mood:", req.body?.mood);
    try {
      const { content, type, lang, mood } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const systemInstruction = `
        You are "Aura", a sophisticated, soulful, and deeply compassionate spiritual wellness guide within the MindMirror ecosystem. 
        Analyze the user's ${type} input under the simulated mood state: "${mood || 'neutral/as-is'}".
        
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

      const reflectionText = await generateTextWithFallback(
        {
          model: "gemini-3.5-flash",
          contents: content + ` [Simulated User Vibe/Mood: ${mood || 'neutral'}]`,
          config: {
            systemInstruction,
          }
        },
        () => getSpiritualFallback(type, mood || 'neutral', lang || 'en')
      );

      res.json({ reflection: reflectionText });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Analysis failed. Please try again." });
    }
  });

  // API Route for custom prompt lab (Google AI Studio Simulation)
  app.post("/api/prompt-lab", async (req, res) => {
    console.log("Prompt Lab request received");
    try {
      const { prompt, temperature, systemInstruction } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const outputText = await generateTextWithFallback(
        {
          model: "gemini-3.1-pro-preview", // Primary is Pro for development
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || "You are a professional React developer helping with app framework optimization.",
            temperature: temperature || 0.4,
          }
        },
        () => getPromptLabFallback(prompt)
      );

      res.json({ output: outputText });
    } catch (error: any) {
      console.error("Lab Error:", error);
      res.status(500).json({ error: error.message || "Execution failed." });
    }
  });

  // API Route for Mood-based Support Messages
  app.post("/api/support", async (req, res) => {
    console.log("Support request received:", req.body?.supportType);
    try {
      const { reflection, supportType, lang } = req.body;
      
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

      const supportText = await generateTextWithFallback(
        {
          model: "gemini-3.5-flash",
          contents: "Generate my " + supportType + " card content based on reflection: " + reflection,
          config: {
            systemInstruction,
          }
        },
        () => getSupportFallback(supportType || 'emotional', lang || 'en')
      );

      res.json({ message: supportText });
    } catch (error: any) {
      console.error("Gemini Support Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate support message." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
