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
        1. Tone and Mood Adaptation:
           - If the mood is "bad" or "clouded/stressed/low", analyze and reflect their heavy, low-frequency, or clouded biofield realistically. It's okay to describe their struggles as dense or gloomy, but immediately pivot into a deeply empowering, passionate motivational speech or a mini-spiritual revolutionary manifesto to awaken their spiritual fire, dissolve fear, and help them rise from the density.
           - If the mood is "good" or "joyful/inspired/radiant", celebrate their bright, high-frequency, golden state of mind with beautiful cosmic imagery. Give them a highly inspiring, glowing motivational speech/manifesto to expand their alignment further.
        2. Delivery & Style:
           - Response must be written in ${lang === 'bn' ? 'Bengali (using rich, poetic, evocative, and high-quality vocabulary)' : 'English'}.
           - Must include motivational speeches, manifestos, or encouraging universal declarations of power (e.g. "I am resilient...", "আমিই শক্তি...").
           - Make it extremely soulful, deep, poetic, and meaningful (4-6 robust sentences).
           - Do not use clinical or medical terminology. Focus purely on aura energy, chakras, soul path, and inner power.
        3. HIGH VARIETY AND UNIQUENESS:
           - CRITICAL: Never start the response with same phrases! Change opening structures completely.
           - Use the dynamic telemetry and seed coordinates provided in the content block to inspire varied spiritual advice.
           - Generate a completely fresh and unique reflection every single time.
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
