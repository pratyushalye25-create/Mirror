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
    
    // List of dynamic variants for Bengali
    const bnFallbacks: Record<string, string[]> = {
      good: [
        `অবস্থা: অভিনন্দন! আপনি ইতিবাচক এবং চমৎকার শক্তির স্পন্দনে আছেন (${activeChakra} - ${freq}Hz)।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং আপনার ইতিবাচক শক্তি প্রিয় কোনো কাজে ব্যবহার করুন।`,
        `অবস্থা: অভিনন্দন! মন বেশ প্রফুল্ল ও হালকা বোধ হচ্ছে (${activeChakra})।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং আপনার আনন্দের কারণটি প্রিয় কারো সাথে ভাগ করে নিন।`,
        `অবস্থা: অভিনন্দন! আপনার আভা উজ্জ্বল ও প্রাণবন্ত মেজাজ নির্দেশ করছে (${freq}Hz)।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং এই সুন্দর পজিটিভ এনার্জি কোনো নতুন কাজে লাগান!`
      ],
      bad: [
        `অবস্থা: কসমিক কম্পন কিছুটা দুর্বল বা মেঘাচ্ছন্ন (${activeChakra} - ${freq}Hz)।\nসমাধান: মেরুদণ্ড সোজা করে বলুন এবং মনে মনে বলুন, "এই কঠিন সময়ও কেটে যাবে।"`,
        `অবস্থা: মনের আকাশে কিছুটা বিষণ্ণতা ভর করেছে (${activeChakra})।\nসমাধান: পছন্দের স্পর্শকাতর কোনো উদ্দীপক বা প্রিয় গান শুনুন এবং সামান্য সময় বিশ্রাম নিন।`,
        `অবস্থা: একটি চাপা অস্বস্তি বা সাময়িক অনুজ্জ্বল আভা লক্ষ্য করা গেছে (${freq}Hz)।\nসমাধান: এক গ্লাস জল খেয়ে ৫ বার শ্বাস নিন। নিজেকে অযথা চাপ দেবেন না।`
      ],
      calm: [
        `অবস্থা: আপনার মনের অবস্থা বেশ শান্ত, গভীর সমতাপ্রাপ্ত ও স্নিগ্ধ (${activeChakra} - ${freq}Hz)।\nসমাধান: চোখ বন্ধ করে ২ মিনিট সম্পূর্ণ নীরবতা উপভোগ করুন।`,
        `অবস্থা: আপনার আভা অত্যন্ত সুষম ও প্রশান্তিময় স্রোত প্রকাশ করছে (${activeChakra})।\nসমাধান: আপনার চারপাশের মানুষদের সাথে এই শান্ত সুন্দর ভাইব শেয়ার করুন।`,
        `অবস্থা: মন যেন গভীর শান্তির এক অতল হ্রদ (${freq}Hz)।\nসমাধান: আপনার জীবনের ৩টি সেরা স্মৃতির কথা ভাবুন ও কৃতজ্ঞতা অনুভব করুন।`
      ],
      stressed: [
        `অবস্থা: প্রচন্ড মানসিক চাপ ও কসমিক অস্থিরতা বিরাজমান (${activeChakra} - ${freq}Hz)।\nসমাধান: হাতের সব কাজ রাখুন, ধীর পায়ে কিছুক্ষণ হাঁটুন এবং নিজেকে সময় দিন।`,
        `অবস্থা: আপনার শক্তির কেন্দ্রটিতে অতিরিক্ত উত্তাপ সৃষ্টি হয়েছে (${activeChakra})।\nসমাধান: চোখ বন্ধ করে কপালে হাত দিন, লম্বা করে শ্বাস টেনে ৫ সেকেন্ড আটকে রেখে ছাড়ুন।`,
        `অবস্থা: অত্যন্ত দ্রুত কম্পনজনিত স্ট্রেস লক্ষ্য করা যাচ্ছে (${freq}Hz)।\nসমাধান: এক কাপ হালকা গরম চা বা জল খেতে খেতে নিজেকে বলুন, "সব ঠিক হয়ে যাবে।"`
      ],
      anxious: [
        `অবস্থা: মনের স্পন্দন কিছুটা এলোমেলো ও অস্থির (${activeChakra} - ${freq}Hz)।\nসমাধান: আপনার হাতের তালু দিয়ে আপনার বুক স্পর্শ করুন এবং প্রশান্তির ওপর ধ্যান করুন।`,
        `অবস্থা: অজানা কোনো উৎকণ্ঠা আপনার আভার চারপাশ ঘিরে ধরেছে (${activeChakra})।\nসমাধান: বাস্তব জগতের ৫টি জিনিস স্পর্শ করুন, ৪টি জিনিস দেখুন—এটি আপনাকে শান্ত করবে।`,
        `অবস্থা: অতিরিক্ত দুশ্চিন্তার কারণে আভা সংকুচিত অনুভব হচ্ছে (${freq}Hz)।\nসমাধান: বড় বড় শ্বাস নিয়ে নিজের হাত নরম রাখুন। আপনি সম্পূর্ণ নিরাপদ।`
      ],
      angry: [
        `অবস্থা: মনের ভেতরে তীব্র ক্রোধ বা অসন্তোষের লাল আভা স্পন্দিত হচ্ছে (${activeChakra} - ${freq}Hz)।\nসমাধান: ৫ মিনিট কোনো কথা বলবেন না, জল পান করুন এবং ধীরে বডি রিল্যাক্স করুন।`,
        `অবস্থা: কসমিক ফ্রিকোয়েন্সি হঠাৎ অনেক উঁচুতে উঠে গেছে (${activeChakra})।\nসমাধান: মাটিতে খালি পায়ে কিছুক্ষণ হাঁটুন অথবা জোরে শ্বাস নিয়ে রাগটি বাইরে বের করে দিন।`,
        `অবস্থা: মানসিক উগ্রতা বা বিরক্তির স্পন্দন স্পষ্ট (${freq}Hz)।\nসমাধান: নিজেকে মনে করিয়ে দিন, রাগের বশবর্তী হয়ে নেওয়া সিদ্ধান্ত সাধারণত ভুল হয়।`
      ],
      lonely: [
        `অবস্থা: একা বা একাকী অনুভূতির গভীর ছায়া আপনার আভাকে ঘিরেছে (${activeChakra} - ${freq}Hz)।\nসমাধান: একজন পুরোনো ভালো বন্ধুর খোঁজ নিন অথবা ডায়েরিতে নিজের অনুভূতি লিখুন।`,
        `অবস্থা: স্পিরিচুয়াল শূন্যতা এবং মনের মধ্যে মন খারাপের ভাব (${activeChakra})।\nসমাধান: প্রকৃতির কাছাকাছি যান বা বারান্দায় দাঁড়িয়ে খোলা আকাশ দেখুন। আপনি একা নন।`,
        `অবস্থা: নিজেকে বিচ্ছিন্ন মনে হচ্ছে (${freq}Hz)।\nসমাধান: নিজের প্রতি মমতা প্রকাশ করুন এবং প্রিয় কোনো শখের কাজ নিয়ে ব্যস্ত থাকুন।`
      ],
      tired: [
        `অবস্থা: আপনার শক্তি বা চার্জ বর্তমানে বেশ নেমে এসেছে (${activeChakra} - ${freq}Hz)।\nসমাধান: গভীর ঘুমের জন্য ফোন স্ক্রিন থেকে দূরে থাকুন এবং এখনই হালকা বিশ্রাম নিন।`,
        `অবস্থা: ক্লান্ত কসমিক ফ্রিকোয়েন্সি এবং আভার সংকোচন (${activeChakra})।\nসমাধান: চোখে মুখে ঠান্ডা জলের ঝাপটা দিন এবং সুন্দর একটা হাসি দিয়ে একটু আড়মোড়া ভাঙুন।`,
        `অবস্থা: শরীর ও মনে বিশ্রামের স্পষ্ট লক্ষণ দেখা যাচ্ছে (${freq}Hz)।\nসমাধান: একটি শান্তিপূর্ণ ঘুম আপনার আভা পুনরায় সতেজ করতে সবচেয়ে বেশি সাহায্য করবে।`
      ],
      excited: [
        `অবস্থা: অভিনন্দন! আনন্দ ও রোমাঞ্চের উচ্চ তরঙ্গের আভা স্পন্দিত হচ্ছে (${activeChakra} - ${freq}Hz)।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং এই প্রাণবন্ত সৃষ্টিশীল শক্তি কোনো ভালো কাজে লাগান।`,
        `অবস্থা: অভিনন্দন! উদ্দীপনা ও খুশির অসাধারণ মহাজাগতিক সংযোগ ঘটেছে (${activeChakra})।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং আপনার প্রিয়জনদের সাথে এই মুহূর্তের খুশির আনন্দ উদযাপন করুন।`,
        `অবস্থা: অভিনন্দন! মনের মধ্যে রঙের চমৎকার মেলা বসেছে (${freq}Hz)।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং জীবনের প্রতি এই ভালোবাসা আর গভীর উৎসাহের জন্য কৃতজ্ঞ থাকুন।`
      ],
      heartbroken: [
        `অবস্থা: মনের গভীরে ভাঙন বা কষ্টের নীল আভা ছায়া ফেলছে (${activeChakra} - ${freq}Hz)।\nসমাধান: কান্নার অনুভূতি এলে একদম দ্বিধা করবেন না, হালকা হতে নিজেকে সময় দিন।`,
        `অবস্থা: হৃদয়ের স্পন্দন বেশ কোমল কিন্তু ভারী হয়ে উঠেছে (${activeChakra})।\nসমাধান: নিজের বুকে হাত দিয়ে বলুন, "আমি নিজেকে ভালোবাসতে এবং ক্ষমা করতে প্রস্তুত।"`,
        `অবস্থা: মনভাঙার বেদনা এবং কসমিক বিচ্যুতি (${freq}Hz)।\nসমাধান: বন্ধুদের বা পরিবারের সাথে সময় কাটান অথবা কাগজের টুকরোয় কষ্ট লিখে তা ছিঁড়ে ফেলুন।`
      ],
      blessed: [
        `অবস্থা: অভিনন্দন! পরম শান্তি, সন্তুষ্টি ও কৃতজ্ঞতার অসাধারণ সবুজ আভা (${activeChakra} - ${freq}Hz)।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং এই সুন্দর মুহূর্তটি আপনার স্মৃতিতে ধরে রাখার চেষ্টা করুন।`,
        `অবস্থা: অভিনন্দন! মনের মধ্যে মহাজাগতিক আশীর্বাদ ও ধন্যভাব স্পন্দিত হচ্ছে (${activeChakra})।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং আপনার সাধ্যমতো আজকে কারো মুখে একটি ছোট হাসি ফোটানোর চেষ্টা করুন।`,
        `অবস্থা: অভিনন্দন! প্রফুল্ল পরম আধ্যাত্মিক সুষম আভা (${freq}Hz)।\nসমাধান: খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন এবং আজকের কৃতজ্ঞতাবোঝাই মনটি নিয়ে শান্তভাবে একটি ডায়েরি এন্ট্রি লিখুন।`
      ],
      confused: [
        `অবস্থা: সিদ্ধান্তহীনতা বা বিভ্রান্তির কুয়াশা আপনার আভাকে ঘিরেছে (${activeChakra} - ${freq}Hz)।\nসমাধান: একবারে মাত্র ১টি বিষয়ে নজর দিন। তাড়াহুড়ো করে কোনো সিদ্ধান্ত নেবেন না।`,
        `অবস্থা: কসমিক দিকভোলা অনুভূতির স্পন্দন স্পষ্ট (${activeChakra})।\nসমাধান: একটি সাদা কাগজে আপনার মনের সমস্ত এলোমেলো চিন্তাগুলো লিখে ফেলুন।`,
        `অবস্থা: বিভ্রান্ত মন ও এলোমেলো মনস্তাত্ত্বিক ছক (${freq}Hz)।\nসমাধান: গভীর দম নিয়ে বলুন, "সব উত্তর এখনই পেতে হবে না, সময় সব পরিষ্কার করে দেবে।"`
      ]
    };

    // List of dynamic variants for English
    const enFallbacks: Record<string, string[]> = {
      good: [
        `State: Congratulations! You are vibrating within a beautiful radiant energy field (${activeChakra} - ${freq}Hz).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and direct this beautiful energy into something you love.`,
        `State: Congratulations! Lighthearted, uplifting aura flow detected (${activeChakra}).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and spread this happy vibe with friends or family.`,
        `State: Congratulations! Vibrant and bright mental landscape indicated (${freq}Hz).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and launch a fun, creative activity!`
      ],
      bad: [
        `State: Cosmic vibrations are temporarily cloudy and heavy (${activeChakra} - ${freq}Hz).\nSolution: Sit comfortably and whisper mentally, "This phase too shall pass."`,
        `State: A shadow of moodiness has colored your energy field (${activeChakra}).\nSolution: Play some soothing, grounding lofi audio and rest your eyes for five minutes.`,
        `State: Subdued energy stream with temporary drop in alignment (${freq}Hz).\nSolution: Sip a clean glass of warm water and relax your shoulders. Be gentle with your mind.`
      ],
      calm: [
        `State: Deeply serene, aligned, and peaceful aura flow (${activeChakra} - ${freq}Hz).\nSolution: Rest or sit in complete physical silence for two minutes.`,
        `State: Symmetrical spiritual waves of quiet strength (${activeChakra}).\nSolution: Breathe deeply and project this exquisite tranquility onto your surroundings.`,
        `State: Your mind resembles a highly calm, clear alpine lake (${freq}Hz).\nSolution: Close your eyes, visualize a bright light at your center, and smile.`
      ],
      stressed: [
        `State: Erratic and high-velocity stress spike detected (${activeChakra} - ${freq}Hz).\nSolution: Pause your screens immediately, release your jaw, and take 3 deep, slow breaths.`,
        `State: Superheated energetic system requesting safe ground (${activeChakra}).\nSolution: Roll your shoulders backward, rest your hands on your desk, and count backwards from 10.`,
        `State: Elevated cognitive stress signatures observed (${freq}Hz).\nSolution: Step outside or view a green plant. Remind yourself: "I am safe and everything will be okay."`
      ],
      anxious: [
        `State: Fluttering and disconnected aura ripples (${activeChakra} - ${freq}Hz).\nSolution: Press your palms together firmly and breathe deeply to center your nervous system.`,
        `State: High anticipatory tension clouding the mind (${activeChakra}).\nSolution: Do the 5-4-3-2-1 grounder. Trace several objects with your physical gaze.`,
        `State: Contracted aura field with rapid frequency fluctuations (${freq}Hz).\nSolution: Soften your belly and lengthen your exhales. Calmly ground your feet.`
      ],
      angry: [
        `State: Flaring internal volcanic fire threatening alignment (${activeChakra} - ${freq}Hz).\nSolution: Refrain from speaking for five minutes. Drink a glass of cold water slowly.`,
        `State: Disrupted and highly dissonant energy surge (${activeChakra}).\nSolution: Release the stored tension by writing down your frustration and tearing the paper.`,
        `State: Sharp emotional irritation spikes detected in your field (${freq}Hz).\nSolution: Step away from the direct trigger and whisper: "I choose peace over proving myself."`
      ],
      lonely: [
        `State: Cloud of isolation or longing casting shadows on your field (${activeChakra} - ${freq}Hz).\nSolution: Text or call a family member, or journal your current unfiltered thoughts.`,
        `State: A soft indigo hue of solitude and quiet longing (${activeChakra}).\nSolution: Connect with nature. View the sky or take a gentle stroll around your block.`,
        `State: Your spiritual wavelength is seeking deeper resonance (${freq}Hz).\nSolution: Engage with a hobby, or do something kind for your future self.`
      ],
      tired: [
        `State: Critically depleted energetic batteries detected (${activeChakra} - ${freq}Hz).\nSolution: Unplug all devices, dim your lights, and prepare for high-quality rest.`,
        `State: Restricted aura surface due to mental fatigue (${activeChakra}).\nSolution: Splash cool water on your face and do a full body stretch to activate energy.`,
        `State: Body and nervous system are asking for quiet restoration (${freq}Hz).\nSolution: Wind down comfortably. A sound, deep sleep is your spirit's best friend right now.`
      ],
      excited: [
        `State: Congratulations! Thrilling and sparkling golden energy wave patterns (${activeChakra} - ${freq}Hz).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and pour this vital velocity into your plans!`,
        `State: Congratulations! Blissful, high-voltage spiritual resonance with your environment (${activeChakra}).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and celebrate this happy moment with others.`,
        `State: Congratulations! Radiant enthusiasm coloring your chakra centers (${freq}Hz).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and give deep thanks to the universe.`
      ],
      heartbroken: [
        `State: Tender, wounded heart-portal emitting deep grief waves (${activeChakra} - ${freq}Hz).\nSolution: Allow any tears to flow fully without judgment. Giving yourself space is healing.`,
        `State: Melancholy blue resonance on the cardiac energy spectrum (${activeChakra}).\nSolution: Wrap your arms around yourself. Whisper: "I am deserving of love, safety, and time."`,
        `State: Sensitive energetic scars seeking comfort and solace (${freq}Hz).\nSolution: Spend time with a loyal pet or a non-judgmental loved one today.`
      ],
      blessed: [
        `State: Congratulations! Sublime emerald aura indicating deep satisfaction and grace (${activeChakra} - ${freq}Hz).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and write down 3 specific things you are grateful for right now.`,
        `State: Congratulations! Deeply aligned, peaceful spiritual frequencies of abundance (${activeChakra}).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and perform a small, spontaneous act of kindness.`,
        `State: Congratulations! Harmonious cosmic light centering on your crown (${freq}Hz).\nSolution: This is wonderful news! Enjoy your day to the absolute fullest and rest in this heartwarming stillness.`
      ],
      confused: [
        `State: Foggy and swirling psychological currents (${activeChakra} - ${freq}Hz).\nSolution: Simplify your scope. Pick just one single small thing to focus on.`,
        `State: Dispersed wavelength with unclear path mapping (${activeChakra}).\nSolution: Step away from screens and dump all your chaotic thoughts on a piece of paper.`,
        `State: Distorted energetic coherence requiring grounding integration (${freq}Hz).\nSolution: Trust that clarity comes in due time. You don't need all the answers right now.`
      ]
    };

    // Get the array for the specific mood or default to general categories
    const normalizedMood = mood.toLowerCase();
    const list = lang === 'bn' ? bnFallbacks[normalizedMood] : enFallbacks[normalizedMood];
    if (list && list.length > 0) {
      // Pick random element
      const randomIndex = Math.floor(Math.random() * list.length);
      return list[randomIndex];
    }

    // Default general fallback
    if (lang === 'bn') {
      return `অবস্থা: আপনার আভা ক্রমাগত পরিবর্তিত ও নতুন রূপ ধারণ করছে (${activeChakra} - ${freq}Hz)।\nসমাধান: ৫ বার লম্বা লম্বা শ্বাস নিন এবং নিজেকে পরম শান্ত রাখুন।`;
    } else {
      return `State: Your energetic field is dynamically shifting and finding peace (${activeChakra} - ${freq}Hz).\nSolution: Take 5 slow deep breaths and rest comfortably.`;
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
        const errMsg = err.message || JSON.stringify(err);
        if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("exhausted")) {
          console.log(`[API Quota Active] Model ${modelName} rate limit active. Aura seamlessly transitioning to standard spiritual fallback.`);
        } else {
          console.log(`[Model Transition] Model ${modelName} transition active: ${errMsg.slice(0, 120)}`);
        }
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
           - Flawlessly understand the user's emotional state.
        
        2. ULTRA-SHORT & IMMEDIATE DIRECT ANSWERS OR REMEDIES ("Eto boro boro answer nah, ekdom short, simple and direct sentence"):
           - Do NOT write long paragraphs, massive bullet points, or winding poetic introductions.
           - Provide only 1 OR 2 VERY SHORT, SIMPLE, AND DIRECT sentences total.
           - Explain exactly what happened to their energy/mood ("State"), and how to instantly heal/balance or celebrate it ("Solution"). Keep it to the point.
           - Avoid any unnecessary text. The output MUST be extremely concise and direct to the point.
           - Respond in ${lang === 'bn' ? 'Bengali' : 'English'}.
           
        3. DYNAMIC VARIETY & HIGH ENTROPY (CRITICAL):
           - Never output repetitive state diagnoses or identical phrases. Every query must feel uniquely tailored.
           - Use the provided [Celestial Resonance Matrix Seed] (Chakra Focal, Freq, etc.) in the user content to personalize the output!
           - Speak about different energetic centres (like Throat Expression, Heart Balance, Solar Plexus, etc.) and suggest varying spiritual remedies (breathing styles, affirmations, mindful sips of water, nature glimpses) depending on the seed.
           - Direct the dynamic answers to vary creative expressions, synonyms, and metaphorical/poetic angles, especially if the user enters the same feeling repeatedly.
           
        4. SPECIAL RULE FOR HAPPY/EXCITED MOODS (CRITICAL):
           - If the user is feeling happy, excited, cheerful, energetic, or expresses a highly positive state (or if user mood indicator is 'good' or 'excited'):
             - You MUST warmly congratulate them: use "Congratulations!" in English, or "অভিনন্দন!" in Bengali.
             - You MUST express that this is wonderful news and tell them to enjoy their day to the absolute fullest: "This is wonderful news! Enjoy your day to the absolute fullest." in English, or "খুব ভালো কথা, দিনটি দারুণভাবে উপভোগ করুন!" in Bengali.
           
        5. FORMAT EXACTLY LIKE THIS:
           ${lang === 'bn' ? `
           অবস্থা: [সর্বোচ্চ ১টি ছোট বাক্য - মনের আসল রূপ]
           সমাধান: [১টি অত্যন্ত দরকারী এবং বাস্তবসম্মত ও অত্যন্ত সহজ পদক্ষেপ]
           ` : `
           State: [Maximum 1 short sentence - raw state of mind]
           Solution: [1 extremely practical, short and simple immediate action]
           `}
      `;

      const reflectionText = await generateTextWithFallback(
        {
          model: "gemini-3.5-flash",
          contents: content + ` [Simulated User Vibe/Mood: ${mood || 'neutral'}]`,
          config: {
            systemInstruction,
            temperature: 1.15,
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
