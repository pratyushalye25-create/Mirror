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

  // API Route for Analysis
  app.post("/api/analyze", async (req, res) => {
    console.log("Analysis request received:", req.body?.type);
    try {
      const { content, type, lang } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
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
  });

  // API Route for custom prompt lab (Google AI Studio Simulation)
  app.post("/api/prompt-lab", async (req, res) => {
    console.log("Prompt Lab request received");
    try {
      const { prompt, temperature, systemInstruction } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview", // Use Pro for the Lab
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are a professional React developer helping with app framework optimization.",
          temperature: temperature || 0.4,
        },
      });

      res.json({ output: response.text });
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
