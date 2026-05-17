/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Version: 1.0.3 - README added & Core Sync Fix
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  MessageSquare, 
  Mic, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Heart,
  Zap,
  Globe,
  LogOut,
  User as UserIcon,
  CloudRain,
  Trees,
  Trophy,
  Flame,
  Star,
  LayoutDashboard,
  History,
  BookOpen,
  Settings,
  ChevronRight,
  CheckCircle,
  Clock,
  Waves,
  Brain,
  Wind,
  Trash2,
  Menu,
  X,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, getDocs, query, orderBy, limit, increment, deleteDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logOut, OperationType, handleFirestoreError } from './lib/firebase';
import sadGirl from './assets/images/sad_girl_emotion_1779010959620.png';
import happyGirl from './assets/images/happy_girl_emotion_1779011011196.png';
import tiredGirl from './assets/images/tired_girl_emotion_1779010995009.png';

interface UserData {
  uid: string;
  points: number;
  streak: number;
  lastCheckIn?: any;
  sessionStartedAt?: any;
  sessionCooldownUntil?: any;
  badges: string[];
  displayName?: string;
  photoURL?: string;
  gameProgress?: Record<string, number>;
  createdAt?: any;
}

interface CheckInRecord {
  id: string;
  reflection: string;
  timestamp: any;
  type: 'face' | 'voice' | 'text';
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string | null>(null);
  const [onCooldown, setOnCooldown] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<'camera' | 'analyzing' | 'result'>('camera');
  const [aiReflection, setAiReflection] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'exercises' | 'games' | 'coach' | 'lab'>('dashboard');
  const [labPrompt, setLabPrompt] = useState('');
  const [labTemperature, setLabTemperature] = useState(0.4);
  const [labOutput, setLabOutput] = useState('');
  const [isExecutingLab, setIsExecutingLab] = useState(false);
  const [activeGame, setActiveGame] = useState<'memory' | 'focus' | null>(null);
  const [hasUnlockedDeepMirror, setHasUnlockedDeepMirror] = useState(false);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  const [analysisOutputs, setAnalysisOutputs] = useState<{text?: string, voice?: string, face?: string}>({});
  const [memoryCards, setMemoryCards] = useState<{ id: number, symbol: string, isFlipped: boolean, isMatched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [gameScore, setGameScore] = useState(0);
  const [focusTarget, setFocusTarget] = useState<{ x: number, y: number, id: number } | null>(null);
  const [focusHits, setFocusHits] = useState(0);
  const [history, setHistory] = useState<CheckInRecord[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanMode, setScanMode] = useState<'photo' | 'video'>('photo');
  const [analysisType, setAnalysisType] = useState<'face' | 'text' | 'voice'>('face');
  const [journalText, setJournalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedSupportType, setSelectedSupportType] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [generatingSupport, setGeneratingSupport] = useState(false);
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(0);
  const [dailyAffirmation, setDailyAffirmation] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [coachInput, setCoachInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [activeSound, setActiveSound] = useState<'none' | 'rain' | 'forest' | 'ocean'>('none');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleSound = (sound: 'rain' | 'forest' | 'ocean') => {
    if (activeSound === sound) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setActiveSound('none');
    } else {
      if (audioRef.current) audioRef.current.pause();
      const soundUrls: Record<string, string> = {
        rain: 'https://assets.mixkit.co/active_storage/sfx/2437/2437-preview.mp3',
        forest: 'https://assets.mixkit.co/active_storage/sfx/2439/2439-preview.mp3',
        ocean: 'https://assets.mixkit.co/active_storage/sfx/2441/2441-preview.mp3'
      };
      const audio = new Audio(soundUrls[sound]);
      audio.loop = true;
      audio.play();
      audioRef.current = audio;
      setActiveSound(sound);
    }
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const recordingIntervalRef = useRef<any>(null);

  const t = {
    bn: {
      appName: "MindMirror",
      dashboard: "সেশন ড্যাশবোর্ড",
      history: "আমার ইতিহাস",
      exercises: "গাইডেড এক্সারসাইজ",
      sessionStart: "Session Start করুন",
      faceScan: "Face Scanning (৫০ Points)",
      journaling: "Journaling",
      voiceAnalysis: "Voice Analysis",
      streak: "বর্তমান স্ট্রিক",
      points: "মোট পয়েন্ট",
      badges: "অর্জিত ব্যাজ",
      heroTitlePart1: "আপনার ",
      heroTitlePart2: "ফেস আর ভয়েস",
      heroTitlePart3: " রিড করে মনের অবস্থা বলে দেবে AI",
      heroDesc: "রিয়েল-টাইমে মনের স্ট্রেস লেয়ার বুঝুন একদম অ্যানোনিমাসলি। আপনার পার্সোনাল ডেটা ১০০% সিকিউর থাকে ডিভাইসের ভেতরেই।",
      getStarted: "Get Started Free",
      howItWorks: "কিভাবে কাজ করে?",
      noJudgement: "No Judgement",
      noJudgementDesc: "কোনো মানুষ আপনাকে বিচার করবে না। এটি এককভাবে আপনার ব্যক্তিগত স্পেস।",
      privacyFirst: "Privacy First",
      privacyFirstDesc: "আপনার ডেটা কোথাও স্টোর হয় না যদি না আপনি ক্লাউড ব্যাকআপ অন করেন।",
      scienceBacked: "Scientifically Backed",
      scienceBackedDesc: "Meaningful Conversations এবং ফেস এনালাইসিস এলগরিদম ব্যবহার করা হয়েছে স্ট্রেস লেভেল ডিটেকশনে।",
      loginWithGoogle: "Google Login",
      logout: "Log Out",
      sessionRemaining: "সেশন বাকি:",
      cooldown: "Cooldown:",
      readyToAnalyze: "Ready to analyze",
      systemLocked: "System Locked",
      alignFace: "Align your face",
      scanning: "MindMirror Scanning...",
      decoding: "Decoding Emotional Layers...",
      processingVideo: "Decoding Video Layers...",
      processingImage: "Decoding Image Layers...",
      collectPoints: "৫০ Points সংগ্রহ করুন",
      cancel: "Cancel",
      nextGoal: "Next Goal",
      unlockingVoice: "Unlocking Voice Layer",
      analysisReady: "MindMirror AI is ready",
      listening: "MindMirror Listening...",
      recordingVoice: "Recording your voice...",
      writeJournal: "আপনার মনের কথা লিখে জানান...",
      analyzeText: "Analyze Text",
      voiceHint: "কথা বলুন, আমরা আপনার টোন এনালাইসিস করছি...",
      pointsSuccess: "৫০ Points পয়েন্ট সংগ্রহ সফল হয়েছে!",
      sessionWarning: "প্রথমে সেশন Start করুন!",
      cameraError: "ক্যামেরা এক্সেস করা সম্ভব হচ্ছে না!",
      sessionEnd: "আপনার ১ ঘন্টার সেশন শেষ। এখন ৩ ঘন্টা কোoldown পিরিয়ড।",
      sessionStarted: "আপনার ১ ঘন্টার সেশন শুরু হয়েছে!",
      faceAnalysis: "ফেস এনালাইসিস",
      faceAnalysisDesc: "আপনার চেহারার মাইক্রো-এক্সপ্রেশন ডিটেক্ট করে আপনার মুড এর ইনস্ট্যান্ট ফিডব্যাক দেবে। AI বুঝবে কখন আপনি ক্লান্ত আর কখন ফোকাসড।",
      textJournal: "টেক্সট জার্নাল",
      textJournalDesc: "আপনার মনের কথা লিখে জানান। আমাদের Meaningful Conversations ইঞ্জিন আপনার ল্যাঙ্গুয়েজের প্যাটার্ন দেখে স্ট্রেস লেভেল প্রেডিক্ট করবে।",
      voiceTone: "ভয়েস টোন",
      voiceToneDesc: "আপনার গলার স্বরের কম্পাঙ্ক থেকেও AI বুজতে পারবে আপনার ভেতরে চাপা থাকা বড় কোনো এনজাইটি আছে কি না।",
      quote: "সুস্থ মন, সফল জীবন।",
      sidebarDesc: "MindMirror আপনাকে প্রতিদিন আরও গভীরভাবে নিজেকে চিনতে সাহায্য করে। আজ আপনার অনুভূতি শেয়ার করুন।",
      historyTitle: "আপনার মেন্টাল লগ",
      noRecords: "এখনো কোনো রেকর্ড নেই। আজই আপনার প্রথম স্ক্যান শুরু করুন।",
      exercisePlaceholder: "নতুন সেশন শীঘ্রই আসছে",
      deleteSuccess: "রেকর্ডটি মুছে ফেলা হয়েছে",
      emotion: "আবেগ:",
      motivation: "Motivation Speech",
      happy: "Happy Message",
      strong: "Strong Message",
      emotional: "Deeply Emotional",
      chooseCard: "আপনার সেশন মুডের উপর ভিত্তি করে একটি কার্ড বেছে নিন:",
      backToReflection: "ফিরে যান",
      affirmationTitle: "আজকের অনুপ্রেরণা",
      quickCalm: "কুইক কাম",
      breathing: "শ্বাস নিন",
      hold: "ধরে রাখুন",
      exhale: "শ্বাস ছাড়ুন",
      exerciseComplete: "ব্যায়াম শেষ! দারুণ করেছেন!",
      nextStep: "পরবর্তী ধাপ",
      gratitudeTitle: "কৃতজ্ঞতা প্রকাশ",
      groundingTitle: "গ্রাউন্ডিং টেকনিক",
      powerPauseTitle: "পাওয়ার পজ",
      coachTitle: "24/7 Empathetic Companion",
      coachPlaceholder: "আপনার কম্প্যানিয়নকে কিছু জিজ্ঞাসা করুন...",
      send: "পাঠান",
      moodTrends: "মুড ট্রেন্স",
      guideTitle: "কিভাবে শুরু করবেন?",
      guideStep1: "১. সেশন স্টার্ট করুন: উপরের 'Start Session' বাটনে ক্লিক করে আপনার প্রতিদিনের ১ ঘন্টার উইন্ডোটি একটিভ করুন।",
      guideStep2: "২. পছন্দের মিরর বেছে নিন: আপনি ফেস স্ক্যান, ভয়েস এনালাইসিস বা টেক্সট জার্নালিং বেছে নিতে পারেন।",
      guideStep3: "৩. AI ফিডব্যাক ও পয়েন্ট: আপনার সেশনের পর MindMirror আপনাকে একটি ডিপ রিফ্লেকশন দেবে এবং আপনি ৫০ পয়েন্ট পাবেন।",
      guideStep4: "৪. ডেইলি এক্সারসাইজ: মন শান্ত রাখতে গাইডেড ব্রিদিং বা মাইন্ডফুল স্ক্যান প্র্যাকটিস করুন।",
      audioOutput: "অডিও আউটপুট",
      stopAudio: "অডিও বন্ধ করুন",
      landingSubtitle: "আপনার মনের প্রতিফলন দেখুন এক নতুন আঙ্গিকে।",
      landingFeaturesTitle: "অ্যাডভান্সড এআই ফিচারসমূহ",
      featVisual: "ভিজ্যুয়াল স্ক্যান",
      featVisualDesc: "মাইক্রো-এক্সপ্রেশন এনালাইসিস করে আপনার মুড চিহ্নিত করে।",
      featVocal: "ভয়েস রিফ্লেকশন",
      featVocalDesc: "কণ্ঠস্বরের টোন এবং ফ্রিকুয়েন্সি থেকে স্ট্রেস লেভেল বুজতে পারে।",
      featVerbal: "টেক্সট জার্নালিং",
      featVerbalDesc: "আপনার লেখা থেকে আপনার মনের গভীরের অনুভূতিগুলো বের করে আনে।",
      sadText: "মন যখন ভারাক্রান্ত...",
      happyText: "আনন্দের মুহূর্তগুলো...",
      celebrateText: "সাফল্যের উল্লাস!",
      sukheMone: "সুস্থ মন, সফল জীবন।",
      auraName: "Aura (অরা)",
      auraStatus: "আপনার চেতনার সাথে যুক্ত",
      auraIntro: "স্বাগতম। আমি অরা, আপনার আত্মিক পথপ্রদর্শক। আজ আপনার ভেতরে কেমন অনুভব করছেন?",
      oceanSound: "সমুদ্রের ঢেউ",
      gamesTitle: "ব্রেইন ব্যালান্স",
      gamesSubtitle: "কগনিটিভ স্কিল বৃদ্ধি করুন",
      memoryGame: "মেমোরি ফ্লো",
      memoryDesc: "আপনার স্মরণশক্তি ও মনোযোগ পরীক্ষা করুন",
      focusGame: "জেন ফোকাস",
      focusDesc: "নিখুঁত লক্ষ্যে মনোযোগ স্থির রাখুন",
      reflexesGame: "কসমিক রিফ্লেক্স",
      reflexesDesc: "আপনার প্রতিক্রিয়ার গতি পরীক্ষা করুন",
      locked: "লক করা",
      unlockReq: "আগের গেমে ৩ বার জিতুন",
      newGameUnlocked: "অভিনন্দন! নতুন গেম আনলক করা হয়েছে!",
      score: "স্কোর",
      playNow: "খেলুন",
      gameComplete: "খেলা শেষ! দারুণ করেছেন!",
      privacyBadge: "জিরো-রেকর্ডিং ট্রাস্ট ব্যাজ",
      privacyDisclaimer: "কোনো ভিডিও রেকর্ড করা হচ্ছে না। আমাদের লোকাল এআই মডেল শুধুমাত্র রিয়েল-টাইমে আবেগ প্রতিফলিত করার জন্য পিক্সেল রিড করে।",
      unlockedTitle: "আপনি দ্য ডিপ মিরর আনলক করেছেন!",
      unlockedDesc: "৫ সেকেন্ডের কুইক স্ক্যান দিয়ে দেখুন আপনার এনার্জি লেভেল আপনার কথার সাথে মিলছে কি না।",
      pricingTitle: "মূল্য নির্ধারণ",
      successPlan: "আপনার সাকসেস প্ল্যান",
      plan1Title: "দ্য ক্ল্যারিটি ফাউন্ডেশন",
      plan1Outcome: "দৈনিক মুড ট্র্যাকিং এবং সচেতনতা",
      plan1Features: ["আনলিমিটেড জার্নালিং", "টেক্সট এনালাইসিস", "বেসিক ইতিহাস", "প্রতিদিনের অনুপ্রেরণা"],
      plan2Title: "দ্য ইমোশনাল রেজিলিয়েন্স প্রো",
      plan2Outcome: "রিয়েল-টাইম স্ট্রেস ম্যানেজমেন্ট",
      plan2Features: ["ফাউন্ডেশন প্ল্যানের সবকিছু+", "ভয়েস টোন এনালাইসিস", "দ্য ডিপ মিরর (ফেস)", "গাইডেড সাপোর্ট AI"],
      plan3Title: "দ্য পিক পারফরম্যান্স স্যুট",
      plan3Outcome: "ইমোশনাল ইন্টেলিজেন্স ও ফোকাস",
      plan3Features: ["প্রো প্ল্যানের সবকিছু+", "অ্যাডভান্সড ট্রেন্ড ইনসাইটস", "ব্রেইন ব্যালেন্স গেমস", "প্রায়োরিটি কম্প্যানিয়ন এক্সেস"],
      bestValue: "সেরা পছন্দ",
      privacy: "প্রাইভেসি",
      terms: "টার্মস",
      support: "সাপোর্ট",
      copyright: "© ২০২৬ MindMirror AI. আবেগের ঊর্ধ্বে।",
      recordingLabel: "রেকর্ড হচ্ছে...",
      listeningLabel: "শুনছি...",
      dismiss: "বন্ধ করুন",
    },
    en: {
      appName: "MindMirror",
      dashboard: "Session Dashboard",
      history: "My History",
      exercises: "Guided Exercises",
      sessionStart: "Start Session",
      faceScan: "Face Scan (+50 Pts)",
      journaling: "Journaling",
      voiceAnalysis: "Voice Analysis",
      streak: "Current Streak",
      points: "Total Points",
      badges: "Badges Earned",
      heroTitlePart1: "AI reads your ",
      heroTitlePart2: "Face & Voice",
      heroTitlePart3: " to reveal your state of mind",
      heroDesc: "Understand your mental stress layers in real-time, completely anonymously. Your personal data stays secure on your device.",
      getStarted: "Get Started Free",
      howItWorks: "How it works?",
      noJudgement: "No Judgement",
      noJudgementDesc: "No human will judge you. This is strictly your personal space.",
      privacyFirst: "Privacy First",
      privacyFirstDesc: "Your data is not stored anywhere unless you enable cloud backup.",
      scienceBacked: "Scientifically Backed",
      scienceBackedDesc: "Meaningful Conversations and face analysis algorithms are used for stress level detection.",
      loginWithGoogle: "Google Login",
      logout: "Log Out",
      sessionRemaining: "Session Left:",
      cooldown: "Cooldown:",
      readyToAnalyze: "Ready to analyze",
      systemLocked: "System Locked",
      alignFace: "Align your face",
      scanning: "MindMirror Scanning...",
      decoding: "Decoding Emotional Layers...",
      processingVideo: "Decoding Video Layers...",
      processingImage: "Decoding Image Layers...",
      collectPoints: "Collect 50 Points",
      cancel: "Cancel",
      nextGoal: "Next Goal",
      unlockingVoice: "Unlocking Voice Layer",
      analysisReady: "MindMirror AI is ready",
      listening: "MindMirror Listening...",
      recordingVoice: "Recording your voice...",
      writeJournal: "Write down your thoughts...",
      analyzeText: "Analyze Text",
      voiceHint: "Speak naturally, we're analyzing your tone...",
      pointsSuccess: "Successfully collected 50 points!",
      sessionWarning: "Please start a session first!",
      cameraError: "Unable to access camera!",
      sessionEnd: "Your 1 hour session is over. 3 hours cooldown period starts now.",
      sessionStarted: "Your 1 hour session has started!",
      faceAnalysis: "Face Analysis",
      faceAnalysisDesc: "Detects micro-expressions to give instant feedback on mood and focus.",
      textJournal: "Text Journal",
      textJournalDesc: "Share your thoughts. Our Meaningful Conversations engine predicts stress from language patterns.",
      voiceTone: "Voice Tone",
      voiceToneDesc: "AI analyzes frequency and tone to detect hidden anxiety.",
      quote: "Healthy mind, successful life.",
      sidebarDesc: "MindMirror helps you know yourself deeper every day. Share your feelings today.",
      historyTitle: "Your Mental Log",
      noRecords: "No records yet. Start your first scan today.",
      exercisePlaceholder: "New sessions coming soon",
      deleteSuccess: "Record deleted successfully",
      emotion: "Emotion:",
      motivation: "Motivation Speech",
      happy: "Happy Message",
      strong: "Strong Message",
      emotional: "Deeply Emotional",
      chooseCard: "Choose a card based on your session mood:",
      backToReflection: "Go Back",
      affirmationTitle: "Daily Affirmation",
      quickCalm: "Quick Calm",
      breathing: "Inhale",
      hold: "Hold",
      exhale: "Exhale",
      exerciseComplete: "Exercise Complete! Well done!",
      nextStep: "Next Step",
      gratitudeTitle: "Grateful Heart",
      groundingTitle: "Grounding Technique",
      powerPauseTitle: "Power Pause",
      coachTitle: "24/7 Empathetic Companion",
      coachPlaceholder: "Ask your companion anything...",
      send: "Send",
      moodTrends: "Mood Trends",
      guideTitle: "How to get started?",
      guideStep1: "1. Start Session: Enable your daily 1-hour active window by clicking 'Start Session'.",
      guideStep2: "2. Choose a Mirror: Select from face scanning, voice analysis, or text journaling.",
      guideStep3: "3. AI Feedback & Points: After your session, MindMirror provides deep reflection and grants +50 points.",
      guideStep4: "1. Daily Exercises: Practice guided breathing or mindful scans to maintain your wellness streak.",
      audioOutput: "Audio Output",
      stopAudio: "Stop Audio",
      landingSubtitle: "Reflect, Analyze, and Evolve with AI.",
      landingFeaturesTitle: "Unrivaled Insight Modules",
      featVisual: "Visual Mirror",
      featVisualDesc: "Detecting the unseen shifts in your facial micro-expressions.",
      featVocal: "Vocal Resonance",
      featVocalDesc: "Frequency-based stress detection from the core of your voice.",
      featVerbal: "Verbal Patterns",
      featVerbalDesc: "Deep Meaningful Conversations analysis of your journal to find hidden emotional cues.",
      sadText: "In moments of shadow...",
      happyText: "Radiate your light...",
      celebrateText: "Savor the victory!",
      sukheMone: "Healthy Mind, Successful Life.",
      auraName: "Aura",
      auraStatus: "Connected to your consciousness",
      auraIntro: "Welcome back. I am Aura, your spiritual guide. What are you holding within today?",
      oceanSound: "Ocean Waves",
      gamesTitle: "Brain Balance",
      gamesSubtitle: "Boost your cognitive skills",
      memoryGame: "Memory Flow",
      memoryDesc: "Test your memory and focus limits",
      focusGame: "Zen Focus",
      focusDesc: "Master your concentration with precision",
      reflexesGame: "Cosmic Reflexes",
      reflexesDesc: "Test your super-sonic reaction speeds",
      locked: "Locked",
      unlockReq: "Win previous game 3 times",
      newGameUnlocked: "Congratulations! New Game Unlocked!",
      score: "Score",
      playNow: "Play Now",
      gameComplete: "Game Over! Great job!",
      privacyBadge: "Zero-Recording Trust Badge",
      privacyDisclaimer: "No video is being recorded. Our local AI model only reads pixels to mirror emotions in real-time.",
      unlockedTitle: "You unlocked The Deep Mirror!",
      unlockedDesc: "View how your energy levels match your words with a 5-second quick scan.",
      pricingTitle: "Pricing",
      successPlan: "Your Success Plan",
      plan1Title: "The Clarity Foundation",
      plan1Outcome: "Daily Mood Tracking & Awareness",
      plan1Features: ["Unlimited Journaling", "Text Analysis", "Basic History", "Daily Affirmations"],
      plan2Title: "The Emotional Resilience Pro",
      plan2Outcome: "Real-time Stress Management & Support",
      plan2Features: ["Everything in Foundation+", "Voice Tone Analysis", "The Deep Mirror (Face)", "Guided Support AI"],
      plan3Title: "The Peak Performance Suite",
      plan3Outcome: "Emotional Intelligence & Focus Suite",
      plan3Features: ["Everything in Pro+", "Advanced Trend Insights", "Brain Balance Games", "Priority Companion Access"],
      bestValue: "Best Value",
      privacy: "Privacy",
      terms: "Terms",
      support: "Support",
      copyright: "© 2026 MindMirror AI. Beyond Emotions.",
      recordingLabel: "RECORDING...",
      listeningLabel: "LISTENING...",
      dismiss: "DISMISS",
    },
  };

  const currentT = t[lang];

  const translatedLayers = [
    {
      id: 'phase-1',
      title: 'Essential Mirror',
      subtitle: currentT.faceAnalysis,
      description: currentT.faceAnalysisDesc,
      icon: <Camera className="w-5 h-5" />,
      color: 'bg-sage/10 text-sage'
    },
    {
      id: 'phase-2',
      title: 'Deep Mirror',
      subtitle: currentT.textJournal,
      description: currentT.textJournalDesc,
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'bg-sage/10 text-sage'
    },
    {
      id: 'phase-3',
      title: 'Holistic Mirror',
      subtitle: currentT.voiceTone,
      description: currentT.voiceToneDesc,
      icon: <Mic className="w-5 h-5" />,
      color: 'bg-sage/10 text-sage'
    }
  ];

  const exercises = [
    {
      id: 'focus-game',
      title: lang === 'bn' ? 'ফোকাস টার্গেট' : 'Focus Target',
      duration: '৫ মিনিট',
      description: 'আপনার মনোযোগ বাড়ানোর একটি ছোট খেলা।',
      descriptionEn: 'A short game to improve your concentration.',
      icon: <Zap className="w-6 h-6 text-orange-400" />,
      color: 'bg-orange-500/10 text-orange-400',
      steps: [
        { text: "স্ক্রিনের যেকোনো এক জায়গায় ৫ সেকেন্ড তাকিয়ে থাকুন", textEn: "Stare at one spot for 5 seconds", duration: 5 },
        { text: "পাপড়ি না ফেলে তাকিয়ে থাকুন", textEn: "Try not to blink", duration: 10 },
        { text: "গভীর শ্বাস নিন", textEn: "Take a deep breath", duration: 5 }
      ]
    },
    {
      id: 'box-breathing',
      title: 'Box Breathing',
      duration: '৪ মিনিট',
      description: 'নার্ভ শান্ত করতে এবং ফোকাস বাড়াতে সাহায্য করে।',
      descriptionEn: 'Helps calm nerves and improve focus.',
      icon: <Wind className="w-6 h-6" />,
      color: 'bg-blue-500/10 text-blue-400',
      steps: [
        { text: "শ্বাস নিন (৪ সেকেন্ড)", textEn: "Inhale (4s)", duration: 4 },
        { text: "ধরে রাখুন (৪ সেকেন্ড)", textEn: "Hold (4s)", duration: 4 },
        { text: "শ্বাস ছাড়ুন (৪ সেকেন্ড)", textEn: "Exhale (4s)", duration: 4 },
        { text: "ধরে রাখুন (৪ সেকেন্ড)", textEn: "Hold (4s)", duration: 4 }
      ]
    },
    {
      id: 'shadow-boxing',
      title: lang === 'bn' ? 'শ্যাড বক্সিং' : 'Shadow Boxing',
      duration: '৫ মিনিট',
      description: 'শরীরের বাড়তি এনার্জি বের করে দিন।',
      descriptionEn: 'Release pent-up energy and stress.',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-orange-500/10 text-orange-400',
      steps: [
        { text: "হালকা জাম্প করুন", textEn: "Light bouncing", duration: 10 },
        { text: "বাম হাত দিয়ে পাঞ্চ (৫ বার)", textEn: "Left hand punch (x5)", duration: 10 },
        { text: "ডান হাত দিয়ে পাঞ্চ (৫ বার)", textEn: "Right hand punch (x5)", duration: 10 }
      ]
    },
    {
      id: 'mindful-scan',
      title: 'Mindful Scan',
      duration: '৮ মিনিট',
      description: 'শরীরের প্রতিটি অংশকে অনুভব করে টেনশন রিলিজ করুন।',
      descriptionEn: 'Release tension by scanning each part of your body.',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-purple-500/10 text-purple-400',
      steps: [
        { text: "চোখ বন্ধ করুন", textEn: "Close your eyes", duration: 5 },
        { text: "পায়ের আঙ্গুলগুলো অনুভব করুন", textEn: "Feel your toes", duration: 10 },
        { text: "হাত আর ঘাড়ের টেনশন ছাড়ুন", textEn: "Release tension in shoulders", duration: 10 }
      ]
    },
    {
      id: 'memory-game',
      title: lang === 'bn' ? 'মেমোরি স্পার্ক' : 'Memory Spark',
      duration: '৩ মিনিট',
      description: 'ফোকাস বাড়ানোর জন্য একটি ছোট খেলা।',
      descriptionEn: 'A small game to sharpen your focus.',
      icon: <Star className="w-6 h-6" />,
      color: 'bg-yellow-500/10 text-yellow-400',
      steps: [
        { text: "আপনার সামনে ৩টি জিনিসের দিকে তাকান", textEn: "Look at 3 objects in front of you", duration: 10 },
        { text: "চোখ বন্ধ করে তাদের রঙ মনে করুন", textEn: "Close eyes and recall their colors", duration: 10 }
      ]
    },
    {
      id: 'gratitude',
      title: lang === 'bn' ? 'কৃতজ্ঞতা প্রকাশ' : 'Grateful Heart',
      duration: '৩ মিনিট',
      description: 'তিনটি জিনিসের কথা ভাবুন যার জন্য আপনি কৃতজ্ঞ।',
      descriptionEn: 'Think of 3 things you are grateful for.',
      icon: <Heart className="w-6 h-6" />,
      color: 'bg-pink-500/10 text-pink-400',
      steps: [
        { text: "একটি ছোট সুখের কথা ভাবুন", textEn: "Think of one small joy", duration: 10 },
        { text: "একজন প্রিয় মানুষের কথা ভাবুন", textEn: "Think of a person you love", duration: 10 }
      ]
    },
    {
      id: 'grounding',
      title: lang === 'bn' ? '৫-৪-৩-২-১ গ্রাউন্ডিং' : '5-4-3-2-1 Grounding',
      duration: '৬ মিনিট',
      description: 'বর্তমানের সাথে নিজেকে যুক্ত করার জন্য ৫টি ইন্দ্রিয় ব্যবহার করুন।',
      descriptionEn: 'Connect to the present using your 5 senses.',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'bg-amber-500/10 text-amber-400',
      steps: [
        { text: "৫টি জিনিস দেখুন যা আপনার সামনে আছে", textEn: "See 5 things around you", duration: 15 },
        { text: "৪টি জিনিস স্পর্শ করুন", textEn: "Touch 4 things", duration: 15 }
      ]
    }
  ];

  const SESSION_DURATION = 60 * 60 * 1000;
  const COOLDOWN_DURATION = 3 * 60 * 60 * 1000;

  const startCamera = async (withAudio = false) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: withAudio 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowNotification({ message: currentT.cameraError, type: 'error' });
      setIsScanning(false);
    }
  };

  const startTranscription = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscription(prev => prev + ' ' + finalTranscript);
        }
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setTranscription('');
    startTranscription();
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 120) {
          stopRecording();
          return 120;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    stopTranscription();
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setScanStep('analyzing');
    analyzeResult();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    stopTranscription();
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (scanMode === 'video') {
      if (isRecording) stopRecording();
      else startRecording();
    } else {
      setScanStep('analyzing');
      analyzeResult();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'bn' ? 'bn-IN' : 'en-US'; // Use bn-IN for better Bengali support in most browsers
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const analyzeResult = async (customText?: string) => {
    const input = customText || journalText || transcription || "User shared their feelings through visual/video cues.";
    try {
      const response = await fetch(`${window.location.origin}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input, type: analysisType, lang: lang })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
      const data = await response.json();
      
      // Hybrid Engine Logic: Update analysis outputs
      const newOutputs = { ...analysisOutputs, [analysisType]: data.reflection };
      setAnalysisOutputs(newOutputs);

      // Simple weighted aggregation if multiple inputs exist
      let finalReflection = data.reflection;
      if (Object.keys(newOutputs).length > 1) {
        // In a real scenario, we'd send all context to AI. 
        // Here we simulate the weighting by prioritizing text (50%)
        finalReflection = (lang === 'bn' ? "হাইব্রিড এনালাইসিস রেজাল্ট: " : "Hybrid Analysis Result: ") + (newOutputs.text || newOutputs.voice || newOutputs.face);
      }

      setAiReflection(finalReflection || "আপনার চোখে কিছুটা ক্লান্তি দেখা যাচ্ছে, কিন্তু ফোকাসটা দারুণ!");
      setScanStep('result');
      stopCamera();
      if (autoSpeak) speakText(finalReflection || (lang === 'bn' ? "আপনার চোখে কিছুটা ক্লান্তি দেখা যাচ্ছে, কিন্তু ফোকাসটা দারুণ!" : "I see a bit of tiredness in your eyes, but your focus is amazing!"));
    } catch (error) {
      console.error("Analysis error:", error);
      setShowNotification({ message: error instanceof Error ? error.message : "Analysis failed", type: 'error' });
      setAiReflection("আপনার চোখে কিছুটা ক্লান্তি দেখা যাচ্ছে, কিন্তু ফোকাসটা দারুণ!");
      setScanStep('result');
      stopCamera();
    }
  };

  useEffect(() => {
    if (!userData) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      if (userData.sessionCooldownUntil) {
        let cooldownEnd = userData.sessionCooldownUntil.toDate ? userData.sessionCooldownUntil.toDate().getTime() : new Date(userData.sessionCooldownUntil).getTime();
        if (now < cooldownEnd) {
          const diff = cooldownEnd - now;
          const h = Math.floor(diff / (1000 * 3600));
          const m = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setSessionTimeLeft(`${h}h ${m}m ${s}s`);
          setOnCooldown(true);
          return;
        }
      }
      if (userData.sessionStartedAt) {
        let sessionStart = userData.sessionStartedAt.toDate ? userData.sessionStartedAt.toDate().getTime() : new Date(userData.sessionStartedAt).getTime();
        const sessionEnd = sessionStart + SESSION_DURATION;
        if (now < sessionEnd) {
          const diff = sessionEnd - now;
          const m = Math.floor(diff / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setSessionTimeLeft(`${m}m ${s}s`);
          setOnCooldown(false);
        } else {
          handleSessionEnd();
        }
      } else {
        setSessionTimeLeft(null);
        setOnCooldown(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [userData]);

  const handleSessionEnd = async () => {
    if (!user || !userData) return;
    const now = new Date().getTime();
    try {
      const userRef = doc(db, 'users', user.uid);
      const cooldownEnd = new Date(now + COOLDOWN_DURATION);
      await updateDoc(userRef, { sessionCooldownUntil: cooldownEnd, sessionStartedAt: null });
      setUserData(prev => prev ? { ...prev, sessionCooldownUntil: { toDate: () => cooldownEnd }, sessionStartedAt: null } : null);
      setShowNotification({ message: currentT.sessionEnd, type: 'error' });
    } catch (error) { console.error(error); }
  };

  const startSession = async () => {
    if (!user || !userData || onCooldown) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const now = new Date();
      await updateDoc(userRef, { sessionStartedAt: serverTimestamp(), sessionCooldownUntil: null });
      setUserData(prev => prev ? { ...prev, sessionStartedAt: { toDate: () => now }, sessionCooldownUntil: null } : null);
      setShowNotification({ message: currentT.sessionStarted, type: 'success' });
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`); }
  };

  const fetchHistory = async (uid: string) => {
    try {
      const q = query(collection(db, 'users', uid, 'checkins'), orderBy('timestamp', 'desc'), limit(20));
      const querySnapshot = await getDocs(q);
      const records: CheckInRecord[] = [];
      querySnapshot.forEach((doc) => records.push({ id: doc.id, ...doc.data() } as CheckInRecord));
      setHistory(records);
    } catch (error) { console.error(error); }
  };

  const deleteHistoryRecord = async (recordId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'checkins', recordId));
      setHistory(prev => prev.filter(r => r.id !== recordId));
      setShowNotification({ message: currentT.deleteSuccess, type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/checkins/${recordId}`);
    }
  };

  const generateSupportMessage = async (type: string) => {
    setSelectedSupportType(type);
    setGeneratingSupport(true);
    try {
      const response = await fetch(`${window.location.origin}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflection: aiReflection, supportType: type, lang: lang })
      });
      if (!response.ok) throw new Error("Failed to generate support message");
      const data = await response.json();
      setSupportMessage(data.message);
    } catch (error) {
      console.error("Support generation error:", error);
      setSupportMessage(lang === 'bn' ? "আপনার ভেতরের আলো আপনাকে সঠিক পথে নিয়ে যাবে।" : "An internal reflection helps illuminate your path forward. Keep moving with grace.");
    } finally {
      setGeneratingSupport(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !userData || isCollecting) return;
    setIsCollecting(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let newStreak = 1;
    if (userData.lastCheckIn) {
      let lastDate = userData.lastCheckIn.toDate ? userData.lastCheckIn.toDate() : new Date(userData.lastCheckIn);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) newStreak = (userData.streak || 0) + 1;
      else if (diffDays === 0) newStreak = (userData.streak || 1);
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await addDoc(collection(db, 'users', user.uid, 'checkins'), { reflection: aiReflection, timestamp: serverTimestamp(), type: analysisType });
      await updateDoc(userRef, { points: increment(50), streak: newStreak, lastCheckIn: serverTimestamp() });
      setUserData(prev => prev ? { ...prev, points: (prev.points || 0) + 50, streak: newStreak, lastCheckIn: { toDate: () => today } } : null);
      fetchHistory(user.uid);
      setShowNotification({ message: currentT.pointsSuccess, type: 'success' });
      setIsScanning(false);
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`); }
    finally { setIsCollecting(false); }
  };

  useEffect(() => {
    const affirmations = lang === 'bn' ? [
      "আমি আজ শান্ত এবং ধীরস্থির থাকব।",
      "আমার শক্তি আসে আমার ভেতর থেকে।",
      "প্রতিটি শ্বাস আমাকে নতুন করে গড়ে তুলে।",
      "আমি আমার আবেগকে নিয়ন্ত্রণ করতে পারি।",
      "আজকের দিনটি নতুন সম্ভাবনার।",
      "আমি নিজের প্রতি সদয় এবং আজ আমি জিতবই।",
      "আমার মন একটি শান্ত সমুদ্রের মতো গভীর।"
    ] : [
      "I am calm and at peace today.",
      "My strength comes from within.",
      "Every breath renews me.",
      "I am in control of my emotions.",
      "Today is a new possibility.",
      "I am kind to myself and I will succeed.",
      "My mind is as deep and calm as the ocean."
    ];
    setDailyAffirmation(affirmations[Math.floor(Math.random() * affirmations.length)]);
  }, [lang]);

  useEffect(() => {
    if (!activeExercise) return;
    setExerciseStep(0);
    setExerciseTimeLeft(activeExercise.steps[0].duration);
  }, [activeExercise]);

  useEffect(() => {
    if (!activeExercise || exerciseTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setExerciseTimeLeft(prev => {
        if (prev <= 1) {
          if (exerciseStep < activeExercise.steps.length - 1) {
            setExerciseStep(s => s + 1);
            return activeExercise.steps[exerciseStep + 1].duration;
          } else {
            return 0; // Completed
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExercise, exerciseTimeLeft, exerciseStep]);

  const startMemoryGame = () => {
    const symbols = ['🧘', '🌊', '🌱', '🌙', '🧠', '✨', '🧘', '🌊', '🌱', '🌙', '🧠', '✨'];
    const shuffled = symbols.sort(() => Math.random() - 0.5).map((s, i) => ({
      id: i,
      symbol: s,
      isFlipped: false,
      isMatched: false
    }));
    setMemoryCards(shuffled);
    setFlippedIndices([]);
    setGameScore(0);
    setActiveGame('memory');
  };

  const flipCard = (index: number) => {
    if (flippedIndices.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;
    
    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);
    
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (newCards[first].symbol === newCards[second].symbol) {
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setMemoryCards(newCards);
        setFlippedIndices([]);
        setGameScore(s => s + 1);
        if (newCards.every(c => c.isMatched)) {
          handleGameCompletion();
        }
      } else {
        setTimeout(() => {
          const resetCards = [...memoryCards];
          if (resetCards[first]) resetCards[first].isFlipped = false;
          if (resetCards[second]) resetCards[second].isFlipped = false;
          setMemoryCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const handleGameCompletion = async () => {
    if (user && userData) {
      const gId = activeGame!;
      const currentWins = (userData.gameProgress?.[gId] || 0) + 1;
      const newProgress = {
        ...(userData.gameProgress || {}),
        [gId]: currentWins
      };
      
      const newPoints = (userData.points || 0) + (gId === 'focus' ? 30 : 20);
      const updatedData = { ...userData, points: newPoints, gameProgress: newProgress };
      setUserData(updatedData);

      // Check for unlock
      if (currentWins === 3) {
        setShowNotification({ message: (currentT as any).newGameUnlocked, type: 'success' });
      } else {
        setShowNotification({ message: currentT.gameComplete, type: 'success' });
      }
      
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: newPoints,
          gameProgress: newProgress
        });
      } catch (err) {
        console.error("Error updating game progress:", err);
      }
    } else {
      setShowNotification({ message: currentT.gameComplete, type: 'success' });
    }

    setTimeout(() => {
      setActiveGame(null);
    }, 2000);
  };

  const startFocusGame = () => {
    setFocusHits(0);
    setGameScore(0);
    spawnTarget();
    setActiveGame('focus');
  };

  const spawnTarget = () => {
    setFocusTarget({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      id: Math.random()
    });
  };

  const handleFocusHit = () => {
    setFocusHits(prev => {
      const next = prev + 1;
      setGameScore(next * 10);
      if (next >= 10) {
        handleGameCompletion();
        setFocusTarget(null);
      } else {
        spawnTarget();
      }
      return next;
    });
  };

  const startExercise = (exercise: any) => {
    setActiveExercise(exercise);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login caught in handleLogin:", error);
      let errorMsg = lang === 'bn' ? "লগইন করতে সমস্যা হয়েছে।" : "Login failed. Please try again.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMsg = lang === 'bn' 
          ? "এই ডোমেইনটি অথোরাইজড নয়। দয়া করে ফায়ারবেস কনসোলে ডোমেইনটি এড করুন।" 
          : "Domain not authorized. Please add this URL to Authorized Domains in Firebase Console.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = lang === 'bn' 
          ? "পপ-আপ ব্লক করা হয়েছে। দয়া করে এলাও করুন।" 
          : "Popup blocked by browser. Please allow popups for this site.";
      }
      
      setShowNotification({ message: errorMsg, type: 'error' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const triggerScan = (type: 'face' | 'text' | 'voice') => {
    if (!userData?.sessionStartedAt) {
      setShowNotification({ message: currentT.sessionWarning, type: 'error' });
      return;
    }
    setAnalysisType(type);
    setScanStep(type === 'text' ? 'analyzing' : 'camera');
    setIsScanning(true);
    if (type !== 'text') {
      startCamera(type === 'voice');
    }
  };

  const askCoach = async () => {
    if (!coachInput.trim() || isChatting) return;
    const userMsg = coachInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setCoachInput('');
    setIsChatting(true);

    try {
      const response = await fetch(`${window.location.origin}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: userMsg, 
          type: 'text', 
          lang: lang,
          context: 'chat'
        })
      });
      if (!response.ok) throw new Error("Coach failed to respond");
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reflection }]);
      if (autoSpeak) speakText(data.reflection);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'assistant', text: lang === 'bn' ? "আমি দুঃখিত, আমি এই মুহূর্তে কানেক্ট করতে পারছি না।" : "I'm sorry, I'm unable to connect right now." }]);
    } finally {
      setIsChatting(false);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData({ uid: user.uid, ...userDoc.data() } as UserData);
        } else {
          const initialData: UserData = {
            uid: user.uid,
            points: 0,
            streak: 0,
            badges: [],
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            gameProgress: { memory: 0, focus: 0 },
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'users', user.uid), initialData);
          // Set local state with a JS date for immediate UI use
          setUserData({ ...initialData, createdAt: new Date() });
        }
        fetchHistory(user.uid);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
        <Sparkles className="w-12 h-12 text-sage" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-sage selection:text-black font-sans overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/50 backdrop-blur-2xl border-b border-white/5 px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
           <div className="flex items-center gap-3 sm:gap-5">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-3 bg-sage/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sage rounded-2xl sm:rounded-[1.25rem] flex items-center justify-center text-black shadow-[0_10px_30px_rgba(163,230,53,0.3)] relative group-hover:scale-110 transition-transform duration-500"><Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-serif font-black tracking-tighter text-white uppercase leading-none">{currentT.appName}</span>
                <span className="text-[7px] sm:text-[8px] font-black tracking-[0.4em] text-sage uppercase mt-1">Experimental AI Lab</span>
              </div>
           </div>
           
           <div className="flex items-center gap-2 sm:gap-6">
              <button 
                onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} 
                className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all shadow-inner"
              >
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
              </button>
              
              <div className="hidden sm:block">
                {user ? (
                  <div className="flex items-center gap-3 sm:gap-6">
                     <div className="hidden sm:flex flex-col items-end mr-2">
                       <div className="flex items-center gap-2 mb-1">
                         <div className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse shadow-[0_0_10px_#a3e635]" />
                         <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">{userData?.points || 0} PTS</span>
                       </div>
                       <span className="text-sm font-serif font-black text-white leading-none tracking-tight">{user.displayName}</span>
                     </div>
                     <div className="relative group">
                       <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                       <button onClick={logOut} className="relative p-2.5 sm:p-3.5 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl text-white/40 hover:text-white transition-all border border-white/5 active:scale-95 shadow-xl"><LogOut className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                     </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleLogin} 
                    disabled={isLoggingIn}
                    className="relative group overflow-hidden bg-white text-black px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.08)] flex items-center gap-2 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Zap className="w-4 h-4 text-sage" />
                      </motion.div>
                    ) : (
                      <Sparkles className="w-4 h-4 text-sage relative z-10" />
                    )}
                    <span className="relative z-10">{isLoggingIn ? (lang === 'bn' ? 'লগইন হচ্ছে...' : 'LOGGING IN...') : currentT.loginWithGoogle}</span>
                  </button>
                )}
              </div>

              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all active:scale-95"
                id="mobile-menu-button"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
           </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-bg/95 backdrop-blur-3xl border-b border-white/10 p-6 sm:p-8 space-y-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[85vh]"
            >
              <div className="space-y-4">
                 <div className="text-[10px] font-black text-sage uppercase tracking-[0.4em] mb-4 opacity-40">{lang === 'bn' ? 'মেনু' : 'NAVIGATION'}</div>
                 {[
                   { id: 'dashboard', icon: <LayoutDashboard />, label: currentT.dashboard },
                   { id: 'history', icon: <History />, label: currentT.history },
                   { id: 'exercises', icon: <Wind />, label: currentT.exercises },
                   { id: 'coach', icon: <Brain />, label: currentT.coachTitle },
                   { id: 'games', icon: <Zap />, label: (currentT as any).gamesTitle }
                 ].map(item => (
                   <button 
                    key={item.id} 
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMenuOpen(false);
                    }} 
                    className={`w-full flex items-center gap-5 p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${activeTab === item.id ? 'bg-white text-black border-white' : 'text-white/40 border-transparent hover:bg-white/5'}`}
                   >
                     <span className="w-5 h-5">{item.icon}</span> {item.label}
                   </button>
                 ))}
              </div>

              <div className="pt-8 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-sage uppercase tracking-[0.4em] opacity-40">{lang === 'bn' ? 'সেটিংস' : 'SETTINGS'}</div>
                  <button 
                    onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
                  </button>
                </div>

                  {user ? (
                    <div className="space-y-6">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-[10px] font-black text-sage uppercase tracking-widest leading-none mb-1">{userData?.points || 0} PTS</div>
                          <div className="text-lg font-serif font-black text-white">{user.displayName}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          logOut();
                          setIsMenuOpen(false);
                        }} 
                        className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 font-black text-xs uppercase tracking-widest"
                      >
                        <LogOut className="w-5 h-5" /> {lang === 'bn' ? 'লগ-আউট' : 'LOGOUT'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleLogin} 
                      disabled={isLoggingIn}
                      className="w-full h-20 rounded-[28px] bg-white text-black font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <Zap className="w-5 h-5 text-sage" />
                        </motion.div>
                      ) : (
                        <Sparkles className="w-5 h-5 text-sage" />
                      )}
                      <span>{isLoggingIn ? (lang === 'bn' ? 'লগইন হচ্ছে...' : 'LOGGING IN...') : currentT.loginWithGoogle}</span>
                    </button>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {user && userData ? (
        <main className="pt-24 sm:pt-32 pb-40 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start mb-20">
             <div className="hidden lg:block lg:w-80 w-full shrink-0 space-y-3 sm:space-y-4">
                {[
                  { id: 'dashboard', icon: <LayoutDashboard />, label: currentT.dashboard },
                  { id: 'history', icon: <History />, label: currentT.history },
                  { id: 'exercises', icon: <Wind />, label: currentT.exercises },
                  { id: 'coach', icon: <Brain />, label: currentT.coachTitle },
                  { id: 'games', icon: <Zap />, label: (currentT as any).gamesTitle }
                ].map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 sm:gap-6 px-6 sm:px-8 py-5 sm:py-6 rounded-2xl sm:rounded-[32px] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all border ${activeTab === item.id ? 'bg-white text-black shadow-2xl scale-[1.02] border-white' : 'text-white/30 hover:text-white hover:bg-white/5 border-transparent'}`}>
                    <span className="w-5 h-5 sm:w-6 sm:h-6">{item.icon}</span> {item.label}
                  </button>
                ))}
             </div>

             <div className="flex-1 w-full">
               <AnimatePresence mode="wait">
                 {activeTab === 'dashboard' && (
              <motion.div key="dashboard-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
                <div className="space-y-10">
                  {/* Daily Affirmation Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 p-6 sm:p-8 rounded-[36px] border border-white/10 relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 p-6 sm:p-8"><Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-sage/20" /></div>
                      <div className="text-[9px] sm:text-[10px] font-black text-sage uppercase tracking-[0.4em] mb-4">{currentT.affirmationTitle}</div>
                      <p className="text-lg sm:text-xl font-serif italic text-white/80 leading-snug">"{dailyAffirmation}"</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-sage p-6 sm:p-8 rounded-[36px] relative overflow-hidden h-full flex flex-col justify-between group cursor-pointer active:scale-95 transition-all shadow-[0_20px_40px_rgba(132,204,22,0.2)]" onClick={() => startExercise(exercises[1])}>
                      <div className="absolute top-0 right-0 p-6 sm:p-8 text-black/10"><Wind className="w-12 h-12 sm:w-16 sm:h-16 group-hover:scale-110 transition-transform" /></div>
                      <div className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-[0.4em] mb-2 opacity-40">{currentT.quickCalm}</div>
                      <h4 className="text-xl sm:text-2xl font-serif font-black text-black tracking-tighter leading-none mb-4">Box Breathing</h4>
                      <div className="text-[9px] sm:text-[10px] font-black text-black/60 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> {lang === 'bn' ? 'তাতক্ষনিক প্রশান্তি' : 'INSTANT CALM'}</div>
                    </motion.div>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-3xl p-6 sm:p-12 rounded-[40px] border border-white/10 relative overflow-hidden group perspective-1000 shadow-2xl">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-sage/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                     <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                        <div>
                          <h2 className="text-xl sm:text-4xl font-serif font-black mb-2 sm:mb-3 tracking-tighter text-white">{lang === 'bn' ? 'আপনার আজকের মিরর...' : 'Your Mirror Today...'}</h2>
                          <p className="text-ink/60 text-xs sm:text-sm max-w-md font-medium uppercase tracking-widest leading-loose">{lang === 'bn' ? 'মুড এনালাইসিস এবং স্ট্রেস ট্র্যাকিং সেশন শুরু করুন।' : 'Start your mood analysis and stress tracking session.'}</p>
                        </div>
                        {sessionTimeLeft && (
                          <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border ${onCooldown ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-sage/10 text-sage border-sage/20'}`}>
                            {onCooldown ? currentT.cooldown : currentT.sessionRemaining} {sessionTimeLeft}
                          </div>
                        )}
                     </div>

                     <div className="relative py-12 flex items-center justify-center">
                        <motion.div whileHover={{ rotateY: 15, rotateX: -10, scale: 1.05 }} animate={{ scale: onCooldown ? 1 : [1, 1.05, 1], opacity: onCooldown ? 0.3 : 1 }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-56 h-56 sm:w-80 sm:h-80 rounded-full border-4 border-white/10 flex items-center justify-center p-8 text-center relative shadow-[0_0_80px_rgba(163,230,53,0.15)] bg-white/[0.04]">
                           <div className="absolute inset-4 rounded-full border border-sage/30 animate-pulse" />
                           <div className="space-y-6">
                             <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}><Sparkles className={`w-14 h-14 mx-auto ${onCooldown ? 'text-ink/20' : 'text-sage'}`} /></motion.div>
                             <div className="text-[12px] font-black text-sage uppercase tracking-[0.5em]">{onCooldown ? currentT.systemLocked : currentT.readyToAnalyze}</div>
                           </div>
                        </motion.div>
                     </div>

                     <div className="mt-8">
                       {!onCooldown && !userData?.sessionStartedAt && (
                          <button onClick={startSession} className="w-full bg-sage text-black h-20 rounded-3xl font-black text-lg uppercase tracking-tight shadow-[0_20px_40px_rgba(163,230,53,0.3)] active:scale-95 group flex items-center justify-center gap-4 transition-all hover:scale-[1.02]">
                            <Zap className="w-6 h-6 fill-current group-hover:animate-pulse" /> {currentT.sessionStart}
                          </button>
                       )}
                       {userData?.sessionStartedAt && (
                         <div className="space-y-4 sm:space-y-6">
                            {/* Progressive Disclosure: Prioritize Text Journaling First */}
                            <button onClick={() => triggerScan('text')} className="w-full bg-white/10 p-5 sm:p-8 rounded-3xl border border-white/10 hover:border-sage transition-all text-left flex items-center justify-between group">
                              <div className="flex items-center gap-4 sm:gap-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sage/20 rounded-2xl flex items-center justify-center text-sage group-hover:scale-110 transition-transform"><MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" /></div>
                                <div>
                                  <div className="text-[8px] sm:text-[10px] font-black text-sage uppercase tracking-widest mb-1">{currentT.textJournal}</div>
                                  <div className="text-lg sm:text-xl font-serif font-black">{lang === 'bn' ? 'মনের কথা শেয়ার করুন' : 'Share your thoughts'}</div>
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white/20 group-hover:translate-x-2 transition-transform" />
                            </button>

                            {/* Unlocked Features */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                               {userData.streak >= 3 ? (
                                 <>
                                   <button onClick={() => triggerScan('face')} className="bg-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-sage transition-all text-center group">
                                     <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sage/20 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 text-sage group-hover:scale-110 transition-transform"><Camera className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                                     <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-tight text-white/80">{currentT.faceAnalysis}</div>
                                   </button>
                                   <button onClick={() => triggerScan('voice')} className="bg-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-sage transition-all text-center group">
                                     <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sage/20 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 text-sage group-hover:scale-110 transition-transform"><Mic className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                                     <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-tight text-white/80">{currentT.voiceTone}</div>
                                   </button>
                                 </>
                               ) : (
                                 <div className="col-span-2 p-5 sm:p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl sm:rounded-3xl text-center">
                                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white/10 mx-auto mb-2 sm:mb-3" />
                                    <p className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase tracking-widest">{lang === 'bn' ? `আরও ${3 - userData.streak} দিন জার্নাল করুন 'দ্য ডিপ মিরর' আনলক করতে!` : `Journal for ${3 - userData.streak} more days to unlock 'The Deep Mirror'!`}</p>
                                 </div>
                               )}
                            </div>
                         </div>
                       )}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                     <div className="bg-white/5 p-8 rounded-[36px] border border-white/10 group hover:border-sage/40 transition-colors relative overflow-hidden">
                        <motion.div 
                          animate={{ rotate: 360 }} 
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          className="absolute -right-4 -top-4 w-20 h-20 bg-clay/5 rounded-full border border-clay/10 border-dashed"
                        />
                        <Flame className="w-8 h-8 text-clay mb-6 group-hover:scale-110 transition-transform relative z-10" />
                        <div className="text-3xl font-serif font-black mb-1 relative z-10">{userData.streak} <span className="text-sm font-sans text-white/20">{lang === 'bn' ? 'দিন' : 'Days'}</span></div>
                        <div className="text-[10px] font-black text-clay uppercase tracking-widest relative z-10">{currentT.streak}</div>
                     </div>
                     <div className="bg-white/5 p-8 rounded-[36px] border border-white/10 group hover:border-sage/40 transition-colors">
                        <Trophy className="w-8 h-8 text-sage mb-6 group-hover:rotate-12 transition-transform" />
                        <div className="text-3xl font-serif font-black mb-1">{userData.points}</div>
                        <div className="text-[10px] font-black text-sage uppercase tracking-widest">{currentT.points}</div>
                     </div>
                     <div className="bg-white/5 p-8 rounded-[36px] border border-white/10 group hover:border-sage/40 transition-colors hidden sm:block">
                        <Star className="w-8 h-8 text-purple-400 mb-6 group-hover:scale-125 transition-transform" />
                        <div className="text-3xl font-serif font-black mb-1">{userData.badges.length}</div>
                        <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{currentT.badges}</div>
                     </div>
                  </div>
                </div>

                <div className="space-y-8 lg:sticky lg:top-32">
                   <div className="bg-white/10 p-8 rounded-[40px] text-white relative overflow-hidden shadow-2xl border border-white/5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-sage/10 blur-[60px] rounded-full" />
                      <h3 className="text-xl font-serif italic mb-3 text-white relative z-10">"{currentT.quote}"</h3>
                      <p className="text-xs text-white/70 leading-relaxed mb-8 relative z-10 font-medium uppercase tracking-tight">{currentT.sidebarDesc}</p>
                      <div className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-xl">
                        <div className="w-12 h-12 rounded-2xl bg-sage flex items-center justify-center shadow-lg"><Brain className="w-6 h-6 text-black" /></div>
                        <div>
                          <div className="text-[10px] font-black text-sage uppercase tracking-widest mb-0.5">{currentT.nextGoal}</div>
                          <div className="text-sm font-black tracking-tight">{currentT.unlockingVoice}</div>
                        </div>
                      </div>
                   </div>
                    <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-8">
                       <h4 className="text-[12px] font-black text-sage uppercase tracking-[0.3em] flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4" /> {currentT.guideTitle}
                       </h4>
                       <div className="space-y-6">
                          {[currentT.guideStep1, currentT.guideStep2, currentT.guideStep3, currentT.guideStep4].map((step, i) => (
                             <div key={i} className="flex gap-4 group">
                                <div className="w-6 h-6 rounded-lg bg-sage/10 text-sage flex items-center justify-center font-black text-[10px] shrink-0 border border-sage/20 group-hover:bg-sage group-hover:text-black transition-colors">{i+1}</div>
                                <p className="text-xs text-white/50 leading-relaxed font-medium group-hover:text-white transition-colors">{step}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history-view" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-12 max-w-5xl mx-auto">
                {history.length > 0 && (
                  <div className="bg-white/5 p-8 rounded-[48px] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-3xl">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                         <h2 className="text-4xl font-serif font-black tracking-tighter uppercase mb-2">{currentT.historyTitle}</h2>
                         <div className="text-[10px] font-black text-sage uppercase tracking-widest">{currentT.moodTrends}</div>
                       </div>
                       <div className="flex gap-2">
                          {['Focus', 'Calm', 'Stress'].map(label => (
                            <div key={label} className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded-lg text-white/40 border border-white/5">{label}</div>
                          ))}
                       </div>
                    </div>
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={history.slice(0, 7).reverse().map((h, i) => ({ 
                           name: i + 1, 
                           val: h.type === 'face' ? 85 : h.type === 'voice' ? 65 : 45 
                         }))}>
                           <defs>
                             <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                           <XAxis dataKey="name" hide />
                           <YAxis hide domain={[0, 100]} />
                           <Tooltip 
                            contentStyle={{ background: '#0a0f0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '16px' }}
                            itemStyle={{ color: '#a3e635', fontWeight: 'bold', fontSize: '12px' }}
                           />
                           <Area type="monotone" dataKey="val" stroke="#a3e635" fillOpacity={1} fill="url(#colorVal)" strokeWidth={4} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="max-w-3xl mx-auto space-y-6">
                {history.length === 0 ? (
                  <div className="bg-white/5 p-16 rounded-[48px] border border-white/10 text-center space-y-6 backdrop-blur-3xl">
                    <History className="w-16 h-16 text-white/10 mx-auto" />
                    <p className="text-white/20 font-black uppercase tracking-[0.2em]">{currentT.noRecords}</p>
                  </div>
                ) : (
                  history.map((record, index) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} key={record.id} className="bg-white/5 p-8 rounded-[36px] border border-white/10 flex items-start gap-6 group hover:border-sage/40 transition-all backdrop-blur-3xl relative">
                      <button 
                        onClick={() => deleteHistoryRecord(record.id)}
                        className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-14 h-14 bg-sage/10 rounded-2xl flex items-center justify-center text-sage shrink-0 group-hover:scale-110 transition-transform">
                        {record.type === 'face' ? <Camera className="w-6 h-6" /> : record.type === 'voice' ? <Mic className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-sage uppercase tracking-[0.3em]">
                           <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(record.timestamp?.toDate ? record.timestamp.toDate() : record.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</div>
                           <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> ANALYZED</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{currentT.emotion}</span>
                          <p className="text-xl italic text-white font-serif leading-relaxed line-clamp-3">"{record.reflection}"</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                </div>
              </motion.div>
            )}

            {activeTab === 'exercises' && (
              <motion.div key="exercises-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {exercises.map((ex, i) => (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={ex.id} className="bg-white/5 p-10 rounded-[48px] border border-white/10 group hover:border-sage/40 transition-all flex flex-col h-full backdrop-blur-3xl shadow-2xl">
                     <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 shadow-lg ${ex.color}`}>{ex.icon}</div>
                     <h3 className="text-xl font-serif font-black mb-3 tracking-tight">{lang === 'bn' ? ex.title : ex.title}</h3>
                     <div className="text-[10px] font-black text-sage uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Clock className="w-4 h-4" /> {lang === 'bn' ? ex.duration : ex.duration.replace('মিনিট', 'MIN')}</div>
                     <p className="text-sm text-white/40 leading-relaxed mb-10 flex-1 font-medium uppercase tracking-tight">{lang === 'bn' ? ex.description : ex.descriptionEn}</p>
                     <button onClick={() => startExercise(ex)} className="w-full h-16 rounded-[24px] bg-white/5 text-white font-black text-[12px] uppercase tracking-widest hover:bg-sage hover:text-black transition-all shadow-inner active:scale-95">{lang === 'bn' ? 'সেশন শুরু করুন' : 'START SESSION'}</button>
                   </motion.div>
                 ))}
                 <div className="bg-white/[0.02] p-10 rounded-[48px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-6">
                    <Sparkles className="w-12 h-12 text-white/10" />
                    <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">{currentT.exercisePlaceholder}</p>
                 </div>
              </motion.div>
            )}

            {activeTab === 'coach' && (
              <motion.div key="coach-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto h-[600px] sm:h-[700px] flex flex-col bg-white/[0.02] rounded-[32px] sm:rounded-[56px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-sage/5 blur-[150px] pointer-events-none" />
                 <div className="p-6 sm:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-4 sm:gap-6">
                       <motion.div 
                         animate={{ 
                           boxShadow: ["0 0 0px #a3e635", "0 0 40px #a3e635", "0 0 0px #a3e635"],
                           scale: [1, 1.05, 1]
                         }}
                         transition={{ duration: 4, repeat: Infinity }}
                         className="w-12 h-12 sm:w-16 sm:h-16 bg-sage rounded-[16px] sm:rounded-[24px] flex items-center justify-center text-black shadow-2xl"
                       >
                         <Brain className="w-6 h-6 sm:w-8 sm:h-8" />
                       </motion.div>
                       <div>
                           <h2 className="text-lg sm:text-xl font-serif font-black tracking-tighter text-white">{(currentT as any).auraName}</h2>
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse" />
                             <div className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{(currentT as any).auraStatus}</div>
                           </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={() => setChatMessages([])} className="p-2 sm:p-3 hover:bg-white/5 rounded-2xl text-white/20 transition-all"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 sm:space-y-8 flex flex-col no-scrollbar">
                    {chatMessages.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                         <div className="space-y-4">
                            <Sparkles className="w-16 h-16 text-sage/20 mx-auto" />
                            <p className="font-serif italic text-xl text-white/40 max-w-md">"{(currentT as any).auraIntro}"</p>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                           {[
                             lang === 'bn' ? 'আজ আমার খুব খুশি লাগছে' : 'I am feeling very happy today',
                             lang === 'bn' ? 'কাজের চাপে আমি খুব ক্লান্ত' : 'Work is making me exhausted',
                             lang === 'bn' ? 'কিভাবে মন শান্ত রাখব?' : 'How to keep mind calm?',
                             lang === 'bn' ? 'পজিটিভ থাকার উপায় কি?' : 'Ways to stay positive?'
                           ].map(text => (
                             <button key={text} onClick={() => { setCoachInput(text); }} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white transition-all text-left">
                               {text}
                             </button>
                           ))}
                         </div>
                      </motion.div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[85%] p-8 rounded-[40px] relative ${msg.role === 'user' ? 'bg-sage text-black ml-auto rounded-tr-sm shadow-2xl' : 'bg-white/5 text-white mr-auto rounded-tl-sm border border-white/5 shadow-inner'}`}>
                         <p className="text-base font-medium leading-relaxed tracking-tight">{msg.text}</p>
                         {msg.role === 'assistant' && <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-sage/20 hidden lg:flex items-center justify-center"><Sparkles className="w-4 h-4 text-sage" /></div>}
                      </motion.div>
                    ))}
                    {isChatting && (
                      <div className="p-8 bg-white/5 rounded-[40px] w-24 flex gap-3 justify-center mr-auto animate-pulse">
                        <div className="w-2 h-2 bg-sage rounded-full" />
                        <div className="w-2 h-2 bg-sage rounded-full" />
                        <div className="w-2 h-2 bg-sage rounded-full" />
                      </div>
                    )}
                 </div>

                 {/* Nature Sounds Control */}
                 <div className="px-10 py-6 flex flex-wrap gap-4 bg-white/[0.01] border-t border-white/5">
                    <button 
                      onClick={() => toggleSound('rain')} 
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSound === 'rain' ? 'bg-blue-500 text-white shadow-xl' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    >
                      <CloudRain className="w-5 h-5" /> {lang === 'bn' ? 'বৃষ্টি' : 'RAIN'}
                    </button>
                    <button 
                      onClick={() => toggleSound('forest')} 
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSound === 'forest' ? 'bg-green-600 text-white shadow-xl' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    >
                      <Trees className="w-5 h-5" /> {lang === 'bn' ? 'বন' : 'FOREST'}
                    </button>
                    <button 
                      onClick={() => toggleSound('ocean')} 
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSound === 'ocean' ? 'bg-cyan-500 text-white shadow-xl' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    >
                      <Waves className="w-5 h-5" /> {(currentT as any).oceanSound}
                    </button>
                 </div>

                 <div className="p-10 border-t border-white/5 bg-black/20">
                    <div className="flex gap-6">
                      <input 
                        value={coachInput} 
                        onChange={(e) => setCoachInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && askCoach()}
                        placeholder={currentT.coachPlaceholder} 
                        className="flex-1 bg-white/5 border border-white/10 rounded-[32px] px-8 py-6 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-sage/40 transition-all shadow-inner"
                      />
                      <button onClick={askCoach} className="bg-sage text-black px-10 rounded-[32px] font-black uppercase text-xs tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(163,230,53,0.2)]">{currentT.send}</button>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'games' && (
              <motion.div key="games-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-4xl font-serif font-black tracking-tighter uppercase mb-2">{(currentT as any).gamesTitle}</h2>
                    <div className="text-[10px] font-black text-sage uppercase tracking-widest">{(currentT as any).gamesSubtitle}</div>
                  </div>
                  <div className="flex gap-4">
                     <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-sage" />
                        <span className="text-xs font-black uppercase tracking-widest text-white/40">{(currentT as any).score}: {gameScore}</span>
                     </div>
                  </div>
                </div>

                {!activeGame ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      { id: 'memory', title: (currentT as any).memoryGame, desc: (currentT as any).memoryDesc, icon: <Sparkles className="w-10 h-10" />, winsKey: 'memory', req: 0, action: startMemoryGame },
                      { id: 'focus', title: (currentT as any).focusGame, desc: (currentT as any).focusDesc, icon: <Zap className="w-10 h-10" />, winsKey: 'focus', req: 3, prevKey: 'memory', action: startFocusGame },
                      { id: 'reflexes', title: (currentT as any).reflexesGame, desc: (currentT as any).reflexesDesc, icon: <Activity className="w-10 h-10" />, winsKey: 'reflexes', req: 3, prevKey: 'focus', action: () => setShowNotification({ message: 'Cosmic Reflexes coming soon!', type: 'info' }) }
                    ].map((game) => {
                      const isUnlocked = game.req === 0 || (userData?.gameProgress?.[game.prevKey!] || 0) >= game.req;
                      
                      return (
                        <motion.div 
                          key={game.id}
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          whileHover={isUnlocked ? { y: -5 } : {}}
                          className={`p-12 rounded-[56px] border transition-all flex flex-col items-center text-center space-y-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden ${isUnlocked ? 'bg-white/5 border-white/10 group hover:border-sage/40 cursor-pointer' : 'bg-white/[0.02] border-white/5 grayscale'}`}
                        >
                           <div className="absolute top-0 right-0 p-8 opacity-5">
                             {game.id === 'memory' ? <Brain className="w-32 h-32 text-sage" /> : game.id === 'focus' ? <Zap className="w-32 h-32 text-clay" /> : <Activity className="w-32 h-32 text-purple-400" />}
                           </div>
                           <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center transition-transform ${isUnlocked ? 'bg-sage/10 text-sage group-hover:scale-110' : 'bg-white/5 text-white/10'}`}>
                             {isUnlocked ? game.icon : <Lock className="w-8 h-8" />}
                           </div>
                           <div className="space-y-4">
                             <div className="flex items-center justify-center gap-3">
                               <h3 className={`text-3xl font-serif font-black ${isUnlocked ? 'text-white' : 'text-white/20'}`}>{game.title}</h3>
                               {!isUnlocked && <Lock className="w-4 h-4 text-white/10" />}
                             </div>
                             <p className={`text-sm font-medium uppercase tracking-widest ${isUnlocked ? 'text-white/30' : 'text-white/10'}`}>
                               {isUnlocked ? game.desc : `${(currentT as any).unlockReq} (${userData?.gameProgress?.[game.prevKey!] || 0}/${game.req})`}
                             </p>
                           </div>
                           {isUnlocked ? (
                             <button onClick={game.action} className="w-full bg-sage text-black h-16 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all">{(currentT as any).playNow}</button>
                           ) : (
                             <div className="w-full bg-white/5 text-white/10 h-16 rounded-[24px] flex items-center justify-center font-black text-[10px] uppercase tracking-widest">{(currentT as any).locked}</div>
                           )}
                           
                           {isUnlocked && game.winsKey && (
                             <div className="text-[9px] font-black text-sage uppercase tracking-[0.3em] opacity-40">
                               {lang === 'bn' ? `${userData?.gameProgress?.[game.winsKey] || 0} বার জয়ী` : `${userData?.gameProgress?.[game.winsKey] || 0} Wins`}
                             </div>
                           )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-12">
                     {activeGame === 'memory' && (
                       <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
                          {memoryCards.map((card, i) => (
                             <motion.div 
                               key={card.id} 
                               whileHover={{ scale: 1.05 }} 
                               whileTap={{ scale: 0.95 }}
                               onClick={() => flipCard(i)} 
                               className={`aspect-square rounded-[32px] cursor-pointer flex items-center justify-center text-4xl transition-all duration-500 perspective-1000 ${card.isFlipped || card.isMatched ? 'bg-sage border-sage shadow-[0_20px_40px_rgba(163,230,53,0.2)]' : 'bg-white/5 border border-white/10 hover:border-sage shadow-inner'}`}
                             >
                                <div className={`transition-all duration-500 ${card.isFlipped || card.isMatched ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'}`}>
                                  {card.symbol}
                                </div>
                                {!(card.isFlipped || card.isMatched) && <Sparkles className="w-6 h-6 text-white/10" />}
                             </motion.div>
                          ))}
                       </div>
                     )}

                     {activeGame === 'focus' && (
                       <div className="relative w-full h-[400px] bg-white/5 border border-white/10 rounded-[48px] overflow-hidden cursor-crosshair">
                          <div className="absolute top-6 left-6 text-white/20 font-black uppercase text-[10px] tracking-widest">
                             Hits: {focusHits} / 10
                          </div>
                          <AnimatePresence>
                             {focusTarget && (
                                <motion.button
                                  key={focusTarget.id}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 1.5, opacity: 0 }}
                                  onClick={handleFocusHit}
                                  className="absolute w-16 h-16 bg-sage rounded-full shadow-[0_0_30px_rgba(163,230,53,0.4)] flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-crosshair group"
                                  style={{ left: `${focusTarget.x}%`, top: `${focusTarget.y}%` }}
                                >
                                  <div className="w-8 h-8 rounded-full border-2 border-black/20 animate-ping" />
                                  <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:scale-110 transition-transform" />
                                </motion.button>
                             )}
                          </AnimatePresence>
                       </div>
                     )}

                     <button onClick={() => setActiveGame(null)} className="mx-auto block text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors">{currentT.cancel}</button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
             </div>
          </div>
        </main>
      ) : (
        <div className="min-h-screen bg-bg selection:bg-sage selection:text-black">
          {/* Panoramic Hero Section */}
          <section className="relative px-4 sm:px-6 pt-24 sm:pt-32 pb-32 sm:pb-40 lg:pt-56 lg:pb-72 mx-auto overflow-hidden">
             <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-sage/10 blur-[150px] rounded-full -translate-y-1/2 opacity-20" />
             <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-blue-500/5 blur-[180px] rounded-full translate-y-1/2 opacity-10" />
             
             <div className="max-w-7xl mx-auto space-y-16 sm:space-y-24">
                <div className="max-w-4xl space-y-8 sm:space-y-12">
                   <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
                      <div className="inline-flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 border border-white/10 text-sage text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] mb-8 sm:mb-12 shadow-2xl backdrop-blur-md">
                         <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {lang === 'bn' ? 'আবেগীয় বুদ্ধিমত্তার ভবিষ্যৎ' : 'The Future of Emotional Intelligence'}
                      </div>
                      <h1 className="text-3xl xs:text-4xl sm:text-6xl lg:text-[7rem] font-serif font-black leading-[0.9] sm:leading-[0.8] tracking-tighter mb-8 sm:mb-10 text-white antialiased">
                         {currentT.heroTitlePart1} <span className="text-sage italic font-light">{currentT.heroTitlePart2}</span> <span className="block mt-2 sm:mt-4">{currentT.heroTitlePart3}</span>
                      </h1>
                      <div className="flex flex-wrap items-center gap-6 sm:gap-10 mb-12 sm:mb-16">
                        <div className="flex items-center gap-4 sm:gap-6">
                           <div className="w-8 sm:w-12 h-px bg-white/20" />
                           <p className="text-base sm:text-xl text-white/40 max-w-xl leading-relaxed font-light italic tracking-tight">
                             {currentT.heroDesc}
                           </p>
                        </div>
                        {/* New Floating Cartoon Guide */}
                        <motion.div 
                          animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="w-24 h-24 sm:w-32 sm:h-32 relative hidden lg:block"
                        >
                           {/* Cartoon Head */}
                           <div className="w-16 h-16 bg-sage rounded-full mx-auto relative z-10 border-2 border-black/20 shadow-2xl">
                             <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-black rounded-full" />
                             <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-black rounded-full" />
                             <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-3 border-b-2 border-black rounded-full" />
                           </div>
                           {/* Cartoon Body */}
                           <div className="w-20 h-24 bg-white/10 rounded-[32px] -mt-6 mx-auto relative overflow-hidden backdrop-blur-3xl border border-white/20">
                              <div className="absolute top-0 left-0 w-full h-2 bg-sage/40" />
                              <Sparkles className="w-8 h-8 text-sage/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                           </div>
                           {/* Floating Hands */}
                           <motion.div animate={{ rotate: [0, 20, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -left-6 top-12 w-10 h-6 bg-sage/20 rounded-full border border-sage/40" />
                           <motion.div animate={{ rotate: [0, -20, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -right-6 top-12 w-10 h-6 bg-sage/20 rounded-full border border-sage/40" />
                        </motion.div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-8 items-center">
                         <button onClick={signInWithGoogle} className="group bg-sage text-black h-12 px-8 rounded-2xl font-black text-sm uppercase tracking-tighter shadow-[0_15px_30px_rgba(163,230,53,0.15)] hover:scale-[1.05] hover:shadow-[0_15px_40px_rgba(163,230,53,0.25)] transition-all active:scale-95 flex items-center justify-center gap-2.5">
                           {currentT.getStarted} <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                         </button>
                         <div className="text-white font-serif text-xl sm:text-2xl font-black italic ml-4 opacity-80">
                           {currentT.sukheMone}
                         </div>
                      </div>
                   </motion.div>
                </div>

                {/* Animated Emotional Characters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative">
                   {/* Sad/Melancholy Character */}
                   <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white/[0.02] border border-white/10 p-8 sm:p-12 rounded-[48px] sm:rounded-[72px] aspect-square xs:aspect-[4/5] flex flex-col items-center justify-center text-center space-y-6 sm:space-y-10 backdrop-blur-3xl relative group overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 bg-blue-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                      <div className="relative">
                         <motion.div animate={{ y: [0, 8, 0], scale: [1, 1.02, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative w-36 h-36 sm:w-48 sm:h-48 flex flex-col items-center justify-center">
                            <div className="absolute inset-0 bg-blue-400/5 blur-[50px] rounded-full animate-pulse" />
                            <img src={sadGirl} alt="Sad" className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] mix-blend-lighten" referrerPolicy="no-referrer" />
                         </motion.div>
                      </div>
                      <div className="space-y-2 sm:space-y-4 relative z-10">
                        <div className="text-[9px] sm:text-[11px] font-black text-blue-400 uppercase tracking-[0.5em]">{currentT.sadText}</div>
                        <p className="text-white/30 text-[10px] sm:text-xs italic font-medium leading-relaxed max-w-[220px] mx-auto tracking-tight">{lang === 'bn' ? 'কালো আকাশেও নক্ষত্র থাকে।' : 'Every storm eventually runs out of rain.'}</p>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />
                   </motion.div>

                   {/* Happy/Party Character */}
                   <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-sage p-8 sm:p-12 rounded-[48px] sm:rounded-[72px] aspect-square xs:aspect-[4/5] flex flex-col items-center justify-center text-center space-y-6 sm:space-y-10 relative overflow-hidden group shadow-[0_40px_100px_rgba(163,230,53,0.15)] border-4 border-white/10">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <motion.div 
                        animate={{ 
                          y: [0, -30, 0], 
                          rotate: [0, -5, 5, 0],
                          scale: [1, 1.1, 1]
                        }} 
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} 
                        className="w-40 h-40 sm:w-56 sm:h-56 flex flex-col items-center justify-center"
                      >
                         <img src={happyGirl} alt="Happy" className="w-full h-full object-contain drop-shadow-[0_15px_40px_rgba(0,0,0,0.4)]" referrerPolicy="no-referrer" />
                      </motion.div>
                      <div className="space-y-2 sm:space-y-4 relative z-10">
                        <div className="text-[9px] sm:text-[11px] font-black text-black uppercase tracking-[0.5em]">{currentT.celebrateText}</div>
                        <p className="text-black/50 text-[8px] sm:text-[10px] font-black italic uppercase tracking-widest">{lang === 'bn' ? 'একসাথে ডানা মেলুন।' : 'Let\'s radiate your light together.'}</p>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" />
                   </motion.div>

                   {/* Tired/Exhausted Character */}
                   <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white/[0.02] border border-white/10 p-8 sm:p-12 rounded-[48px] sm:rounded-[72px] aspect-square xs:aspect-[4/5] flex flex-col items-center justify-center text-center space-y-6 sm:space-y-10 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
                      <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 pointer-events-none"><Zap className="w-24 h-24 sm:w-40 sm:h-40 text-red-500" /></div>
                      <motion.div animate={{ rotate: [0, 1, -1, 0], y: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-40 h-40 sm:w-56 sm:h-56 flex flex-col items-center justify-center">
                         <div className="absolute inset-0 bg-red-500/5 blur-[60px] rounded-full animate-pulse" />
                         <img src={tiredGirl} alt="Tired" className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_40px_rgba(0,0,0,0.5)] mix-blend-lighten" referrerPolicy="no-referrer" />
                      </motion.div>
                      <div className="space-y-2 sm:space-y-4 z-10 relative">
                        <div className="text-[9px] sm:text-[11px] font-black text-red-400 uppercase tracking-[0.5em]">{lang === 'bn' ? 'বিশ্রাম প্রয়োজন' : 'RECHARGE REQUIRED'}</div>
                        <p className="text-white/20 text-[8px] sm:text-[10px] font-medium uppercase tracking-widest leading-loose">{lang === 'bn' ? 'শান্ত হওয়ার সময় এসেছে' : 'Finding calm amidst the noise'}</p>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-900/5 to-transparent pointer-events-none" />
                   </motion.div>
                </div>
             </div>
          </section>

          {/* Features Cinematic Grid */}
          <section className="px-4 sm:px-6 py-24 sm:py-32 lg:py-56 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
             <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-end mb-20 lg:mb-40">
                   <div className="space-y-6 sm:space-y-10">
                      <div className="text-sage font-black text-[10px] sm:text-[12px] uppercase tracking-[0.6em]">{currentT.landingSubtitle}</div>
                      <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tighter text-white leading-none">{currentT.landingFeaturesTitle}</h2>
                   </div>
                   <p className="text-lg sm:text-2xl text-white/30 font-light italic leading-relaxed max-w-xl">{lang === 'bn' ? 'আমরা আপনার মনের গহীন স্তরে লুকানো আবেগগুলো এআই এর মাধ্যমে উন্মোচন করি।' : 'We leverage advanced AI to decode the intricate layers of your emotional landscape.'}</p>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-12">
                   {[
                     { title: currentT.featVisual, desc: currentT.featVisualDesc, icon: <Camera className="w-8 h-8 sm:w-10 sm:h-10" />, color: 'text-sage', bg: 'bg-sage/10', delay: 0 },
                     { title: currentT.featVocal, desc: currentT.featVocalDesc, icon: <Mic className="w-8 h-8 sm:w-10 sm:h-10" />, color: 'text-blue-400', bg: 'bg-blue-500/10', delay: 0.1 },
                     { title: currentT.featVerbal, desc: currentT.featVerbalDesc, icon: <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />, color: 'text-clay', bg: 'bg-clay/10', delay: 0.2 },
                     { title: currentT.coachTitle, desc: lang === 'bn' ? 'আপনার ব্যক্তিগত এআই মেন্টর সবসময় পাশে আছে।' : 'Your personal AI mentor, available 24/7 for you.', icon: <Brain className="w-8 h-8 sm:w-10 sm:h-10" />, color: 'text-purple-400', bg: 'bg-purple-500/10', delay: 0.3 },
                     { title: currentT.exercises, desc: lang === 'bn' ? 'মন শান্ত করার জন্য গাইডেড গেমস এবং ব্রিদিং।' : 'Guided games and breathing to calm your soul.', icon: <Wind className="w-8 h-8 sm:w-10 sm:h-10" />, color: 'text-orange-400', bg: 'bg-orange-500/10', delay: 0.4 },
                     { title: currentT.historyTitle, desc: lang === 'bn' ? 'আপনার মানসিক পরিবর্তনের ইতিহাস দেখুন গ্রাফে।' : 'Track your mental trends with high-precision logs.', icon: <History className="w-8 h-8 sm:w-10 sm:h-10" />, color: 'text-ink', bg: 'bg-white/10', delay: 0.5 }
                   ].map((feature, i) => (
                     <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: feature.delay }} className="group p-8 sm:p-14 rounded-[48px] sm:rounded-[64px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all space-y-6 sm:space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 ${feature.bg} ${feature.color} rounded-2xl sm:rounded-[28px] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl`}>{feature.icon}</div>
                        <div className="space-y-3 sm:space-y-6">
                           <h2 className="text-xl sm:text-2xl font-serif font-black text-white">{feature.title}</h2>
                           <p className="text-xs sm:text-sm text-white/30 leading-relaxed font-medium uppercase tracking-tight">{feature.desc}</p>
                        </div>
                     </motion.div>
                   ))}
                </div>
             </div>
          </section>

          {/* Outcomes & Pricing Section */}
          <section id="pricing" className="px-4 sm:px-6 py-24 sm:py-32 lg:py-56 relative overflow-hidden">
             <div className="max-w-7xl mx-auto">
                <div className="text-center space-y-4 sm:space-y-8 mb-16 sm:mb-32">
                   <div className="text-sage font-black text-[10px] sm:text-[12px] uppercase tracking-[0.6em]">{lang === 'bn' ? 'মূল্য নির্ধারণ' : 'PRICING'}</div>
                   <h2 className="text-4xl sm:text-6xl lg:text-8xl font-serif font-black tracking-tighter text-white leading-none">{lang === 'bn' ? 'আপনার সাকসেস প্ল্যান' : 'Your Success Plan'}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                   {[
                     { 
                       title: lang === 'bn' ? "ক্ল্যারিটি ফাউন্ডেশন" : "The Clarity Foundation", 
                       outcome: lang === 'bn' ? "দৈনিক মুড ট্র্যাকিং" : "Daily Mood Tracking & Awareness",
                       price: "$0",
                       features: lang === 'bn' ? ["আনলিমিটেড জার্নালিং", "টেক্সট এনালাইসিস", "বেসিক ইতিহাস", "দৈনিক অনুপ্রেরণা"] : ["Unlimited Journaling", "Text Analysis", "Basic History", "Daily Affirmations"],
                       color: "border-white/10 bg-white/[0.02]"
                     },
                     { 
                       title: lang === 'bn' ? "ইমোশনাল রেজিলিয়েন্স প্রো" : "The Emotional Resilience Pro", 
                       outcome: lang === 'bn' ? "রিয়েল-টাইম স্ট্রেস ম্যানেজমেন্ট" : "Real-time Stress Management & Support",
                       price: "$12",
                       featured: true,
                       features: lang === 'bn' ? ["ফাউন্ডেশনের সবকিছু+", "ভয়েস টোন এনালাইসিস", "ডিপ মিরর (ফেস)", "গাইডেড সাপোর্ট এআই"] : ["Everything in Foundation+", "Voice Tone Analysis", "The Deep Mirror (Face)", "Guided Support AI"],
                       color: "border-sage bg-sage/5"
                     },
                     { 
                       title: lang === 'bn' ? "পিক পারফরম্যান্স স্যুট" : "The Peak Performance Suite", 
                       outcome: lang === 'bn' ? "ইমোশনাল ইন্টেলিজেন্স স্যুট" : "Emotional Intelligence & Focus Suite",
                       price: "$24",
                       features: lang === 'bn' ? ["প্রো এর সবকিছু+", "অ্যাডভান্সড ট্রেন্ড ইনসাইটস", "ব্রেইন ব্যালান্স গেমস", "প্রায়োরিটি কম্প্যানিয়ন এক্সেস"] : ["Everything in Pro+", "Advanced Trend Insights", "Brain Balance Games", "Priority Companion Access"],
                       color: "border-purple-500/20 bg-purple-500/5"
                     }
                   ].map((plan, i) => (
                     <motion.div key={i} whileHover={{ y: -10 }} className={`p-8 sm:p-12 rounded-[48px] sm:rounded-[64px] border ${plan.color} relative overflow-hidden flex flex-col justify-between`}>
                        {plan.featured && <div className="absolute top-8 sm:top-12 right-8 sm:right-12 bg-sage text-black px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{lang === 'bn' ? 'সেরা অফার' : 'BEST VALUE'}</div>}
                        <div className="space-y-6 sm:space-y-10">
                           <div>
                             <h3 className="text-xl sm:text-2xl font-serif font-black mb-2 sm:mb-4">{plan.title}</h3>
                             <p className="text-sage text-xs sm:text-sm font-black uppercase tracking-widest">{plan.outcome}</p>
                           </div>
                           <div className="text-5xl sm:text-6xl font-black">{plan.price}<span className="text-lg sm:text-xl text-white/20 font-medium">/mo</span></div>
                           <div className="space-y-3 sm:space-y-4">
                              {plan.features.map((f, j) => (
                                <div key={j} className="flex items-center gap-2 sm:gap-3 text-xs text-white/40 font-medium uppercase tracking-tight">
                                   <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sage" /> {f}
                                </div>
                              ))}
                           </div>
                        </div>
                        <button className={`w-full h-16 sm:h-20 rounded-2xl sm:rounded-[32px] mt-8 sm:mt-12 font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all ${plan.featured ? 'bg-sage text-black shadow-xl shadow-sage/20' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                           {currentT.getStarted}
                        </button>
                     </motion.div>
                   ))}
                </div>
             </div>
          </section>

          <footer className="px-4 sm:px-6 py-12 sm:py-24 bg-bg border-t border-white/5 text-center mt-10 sm:mt-20 relative z-10">
             <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
                <div className="font-serif text-2xl sm:text-3xl font-black italic text-sage opacity-10 tracking-widest">{currentT.appName}</div>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-12 font-black uppercase tracking-[0.3em] text-[8px] sm:text-[10px] text-white/20">
                   <span className="hover:text-sage transition-colors cursor-pointer">Privacy</span>
                   <span className="hover:text-sage transition-colors cursor-pointer">Terms</span>
                   <span className="hover:text-sage transition-colors cursor-pointer">Support</span>
                </div>
                <p className="text-[8px] sm:text-[10px] text-white/10 font-black uppercase tracking-widest">&copy; 2026 {currentT.appName} AI. Beyond Emotions.</p>
             </div>
          </footer>
        </div>
      )}

      <AnimatePresence>
        {activeExercise && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-bg flex items-center justify-center p-6">
             <div className="max-w-2xl w-full text-center space-y-12">
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-sage/10 flex items-center justify-center mx-auto text-sage mb-8"><Brain className="w-10 h-10" /></div>
                  <h2 className="text-3xl font-serif font-black uppercase tracking-tighter">{activeExercise.title}</h2>
                </div>

                <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
                   <motion.div 
                     animate={{ 
                       scale: [1, 1.8, 1],
                       opacity: [0.1, 0.4, 0.1]
                     }} 
                     transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute inset-0 bg-sage rounded-full" 
                   />
                   <div className="w-64 h-64 rounded-full border-4 border-sage/20 flex flex-col items-center justify-center relative z-10 bg-bg">
                      <div className="text-5xl font-serif font-black text-sage transition-all">{exerciseTimeLeft > 0 ? exerciseTimeLeft : '0'}</div>
                      <div className="text-[10px] font-black text-sage/40 uppercase tracking-[0.4em] mt-2">SECONDS</div>
                   </div>
                </div>

                <div className="space-y-8 min-h-[120px]">
                   <AnimatePresence mode="wait">
                     {exerciseTimeLeft > 0 ? (
                       <motion.div key={exerciseStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                          <p className="text-2xl font-serif italic text-white">"{lang === 'bn' ? activeExercise.steps[exerciseStep].text : activeExercise.steps[exerciseStep].textEn}"</p>
                          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">{currentT.nextStep}: {lang === 'bn' ? (activeExercise.steps[exerciseStep + 1]?.text || '...') : (activeExercise.steps[exerciseStep + 1]?.textEn || '...')}</div>
                       </motion.div>
                     ) : (
                       <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                          <p className="text-3xl font-serif italic text-sage">{currentT.exerciseComplete}</p>
                          <button onClick={() => setActiveExercise(null)} className="bg-sage text-black px-12 h-16 rounded-[24px] font-black uppercase tracking-widest text-[12px]">{lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'BACK TO DASHBOARD'}</button>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>

                {exerciseTimeLeft > 0 && (
                   <button onClick={() => setActiveExercise(null)} className="text-white/20 hover:text-white font-black uppercase tracking-[0.5em] text-[10px]">{currentT.cancel}</button>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>



      <AnimatePresence>
        {isScanning && (
          <motion.div key="scanning-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-bg/95 backdrop-blur-3xl flex items-center justify-center p-6 text-white overflow-y-auto">
            <div className="max-w-xl w-full text-center py-20">
              {scanStep === 'camera' && (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-8 sm:space-y-12">
                    <div className="relative w-64 h-64 xs:w-72 xs:h-72 md:w-96 md:h-96 mx-auto rounded-[48px] sm:rounded-[64px] overflow-hidden bg-black border-2 border-white/10 shadow-[0_0_120px_rgba(132,204,22,0.2)]">
                       <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                       <div className="absolute inset-0 border-8 border-white/5 rounded-[60px] pointer-events-none" />
                       
                       {/* Zero-Recording Trust Badge */}
                       <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[85%] z-20">
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/20 backdrop-blur-md border border-green-500/30 px-6 py-3 rounded-2xl flex items-center gap-3">
                             <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                             <div className="space-y-0.5">
                                <div className="text-[10px] font-black text-green-500 uppercase tracking-widest">{(currentT as any).privacyBadge}</div>
                                <div className="text-[8px] text-white/60 font-medium leading-tight uppercase">{(currentT as any).privacyDisclaimer}</div>
                             </div>
                          </motion.div>
                       </div>

                       <motion.div animate={{ top: isRecording ? ['0%', '100%', '0%'] : '50%' }} transition={isRecording ? { duration: 3, repeat: Infinity, ease: "linear" } : {}} className={`absolute left-0 right-0 h-1 z-10 ${isRecording ? 'bg-red-500 shadow-[0_0_40px_red]' : 'bg-sage shadow-[0_0_40px_rgba(132,204,22,1)]'}`} />
                       {isRecording && <div className="absolute top-8 right-8 bg-red-600 px-5 thick:py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3"><div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" /> {Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}</div>}
                    </div>
                   <div className="space-y-8">
                      <h2 className="text-4xl font-serif font-black uppercase tracking-tighter">{isRecording ? (currentT as any).recordingLabel : currentT.alignFace}</h2>
                      {transcription && <p className="text-white/40 text-sm max-w-sm mx-auto font-medium tracking-tight uppercase line-clamp-2">"{transcription}"</p>}
                      {!isRecording && (
                        <div className="flex justify-center gap-6">
                           <div className="flex bg-white/5 rounded-full p-1.5 border border-white/10">
                              <button onClick={() => setScanMode('photo')} className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${scanMode === 'photo' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Snapshot</button>
                              <button onClick={() => setScanMode('video')} className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${scanMode === 'video' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Journey</button>
                           </div>
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-10">
                         <button onClick={capturePhoto} className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${scanMode === 'video' ? 'border-red-500/20' : 'border-white/10'}`}>
                            <div className={`w-16 h-16 rounded-full shadow-2xl ${isRecording ? 'bg-red-600 animate-pulse rounded-2xl' : (scanMode === 'video' ? 'bg-red-600/40' : 'bg-sage')}`} />
                         </button>
                         <button onClick={() => { stopCamera(); setIsScanning(false); }} className="text-white/20 hover:text-white font-black uppercase tracking-[0.5em] text-[12px]">{currentT.cancel}</button>
                      </div>
                   </div>
                </motion.div>
              )}

              {scanStep === 'analyzing' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 w-full max-w-xl mx-auto">
                   {analysisType === 'text' ? (
                     <div className="space-y-12">
                        <div className="text-center space-y-4">
                           <div className="w-20 h-20 bg-sage/5 rounded-[32px] flex items-center justify-center mx-auto shadow-inner"><MessageSquare className="w-10 h-10 text-sage" /></div>
                           <h2 className="text-5xl font-serif font-black tracking-tighter uppercase">{currentT.textJournal}</h2>
                        </div>
                        <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder={currentT.writeJournal} className="w-full h-72 bg-white/[0.03] border border-white/10 rounded-[48px] p-10 text-2xl text-white placeholder:text-white/10 focus:outline-none focus:border-sage/30 transition-all resize-none shadow-2xl" />
                        <div className="flex gap-6">
                           <button onClick={() => setIsScanning(false)} className="flex-1 h-24 rounded-[32px] border-2 border-white/5 text-white/20 font-black uppercase tracking-widest text-[14px] hover:text-white transition-all">{currentT.cancel}</button>
                           <button onClick={() => { if (!journalText.trim()) return; setScanStep('analyzing'); analyzeResult(); setJournalText(''); }} className="flex-[2] bg-sage text-black h-24 rounded-[32px] font-black uppercase tracking-tighter text-2xl shadow-3xl shadow-sage/20 active:scale-95">{currentT.analyzeText}</button>
                        </div>
                     </div>
                   ) : analysisType === 'voice' ? (
                     <div className="space-y-16">
                        <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
                           <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.1, 0, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-sage rounded-full" />
                           <motion.div animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-10 border-4 border-sage/20 rounded-full" />
                           <div className={`w-40 h-40 rounded-full flex items-center justify-center z-10 transition-all ${isRecording ? 'bg-red-600 scale-90 shadow-[0_0_100px_rgba(220,38,38,0.5)]' : 'bg-sage shadow-[0_0_100px_rgba(132,204,22,0.5)]'}`} onClick={() => isRecording && stopRecording()}><Mic className="w-20 h-20 text-black" /></div>
                        </div>
                        <div className="space-y-8">
                           <h2 className="text-5xl font-serif font-black tracking-tighter uppercase">{isRecording ? (currentT as any).listeningLabel : currentT.listening}</h2>
                           {isRecording && <div className="text-red-500 font-black text-4xl tracking-[0.3em]">{Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}</div>}
                           <p className="text-white/20 font-black uppercase tracking-[0.5em] text-[14px]">{currentT.voiceHint}</p>
                        </div>
                        <button onClick={() => { setIsRecording(false); setIsScanning(false); stopCamera(); }} className="text-white/10 hover:text-white font-black uppercase tracking-[0.6em] text-[12px]">{currentT.cancel}</button>
                     </div>
                   ) : (
                     <div className="space-y-16 py-20">
                        <div className="flex justify-center gap-4">
                           {[0, 1, 2].map(i => <motion.div key={i} animate={{ scale: [1, 2.5, 1], opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-6 h-6 bg-sage rounded-full" />)}
                        </div>
                        <div className="space-y-6">
                           <h2 className="text-5xl font-serif font-black tracking-tighter uppercase">{scanMode === 'video' ? currentT.processingVideo : currentT.processingImage}</h2>
                           <p className="text-white/10 font-black uppercase tracking-[0.5em] text-[14px]">{currentT.decoding}</p>
                        </div>
                     </div>
                   )}
                </motion.div>
              )}

              {scanStep === 'result' && (
                <motion.div initial={{ opacity: 0, scale: 0.8, rotateY: 15 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} className="space-y-12">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 12 }} className="w-32 h-32 bg-sage rounded-[40px] mx-auto flex items-center justify-center shadow-3xl shadow-sage/40"><Sparkles className="w-16 h-16 text-black" /></motion.div>
                  
                  <div className="bg-white/5 p-12 md:p-16 rounded-[80px] border border-white/10 backdrop-blur-3xl shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 text-white/[0.02] p-16"><Star className="w-64 h-64" /></div>
                    
                    <AnimatePresence mode="wait">
                      {!selectedSupportType ? (
                        <motion.div key="reflection-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                           <p className="text-2xl md:text-4xl font-serif italic leading-tight text-white tracking-tighter antialiased">
                             "{aiReflection}"
                           </p>
                           <div className="flex gap-4">
                             {isSpeaking ? (
                               <button onClick={stopSpeaking} className="bg-red-500/10 text-red-400 px-6 h-12 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-red-500/20 active:scale-95">
                                 <Mic className="w-4 h-4 animate-pulse" /> {currentT.stopAudio}
                               </button>
                             ) : (
                               <button onClick={() => speakText(aiReflection)} className="bg-sage/10 text-sage px-6 h-12 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-sage/20 active:scale-95 hover:bg-sage/20">
                                 <Mic className="w-4 h-4" /> {currentT.audioOutput}
                               </button>
                             )}
                             <button onClick={() => setAutoSpeak(!autoSpeak)} className={`px-6 h-12 rounded-full font-black text-[10px] uppercase tracking-widest border transition-all ${autoSpeak ? 'bg-sage text-black border-sage' : 'bg-white/5 text-white/40 border-white/10'}`}>
                               Auto-Play {autoSpeak ? 'ON' : 'OFF'}
                             </button>
                           </div>
                        </motion.div>
                      ) : (
                        <motion.div key="support-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                           <div className="flex items-center gap-2 text-sage text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                              <Sparkles className="w-4 h-4" /> 
                              {selectedSupportType === 'motivation' ? currentT.motivation : 
                               selectedSupportType === 'happy' ? currentT.happy : 
                               selectedSupportType === 'strong' ? currentT.strong : currentT.emotional}
                           </div>
                           {generatingSupport ? (
                             <div className="flex gap-2">
                               {[0,1,2].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: i*0.2 }} className="w-3 h-3 bg-sage rounded-full" />)}
                             </div>
                           ) : (
                             <p className="text-xl md:text-3xl font-serif italic leading-tight text-sage tracking-tight antialiased">
                               "{supportMessage}"
                             </p>
                           )}
                           <button onClick={() => setSelectedSupportType(null)} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">{currentT.backToReflection}</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {!selectedSupportType && (
                    <div className="space-y-6">
                      <h4 className="text-[12px] font-black text-white/20 uppercase tracking-[0.3em]">{currentT.chooseCard}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'motivation', label: currentT.motivation, icon: <Zap /> },
                          { id: 'happy', label: currentT.happy, icon: <Heart /> },
                          { id: 'strong', label: currentT.strong, icon: <ShieldCheck /> },
                          { id: 'emotional', label: currentT.emotional, icon: <Waves /> }
                        ].map(support => (
                          <button 
                            key={support.id}
                            onClick={() => generateSupportMessage(support.id)}
                            className="bg-white/5 p-6 rounded-[32px] border border-white/10 hover:border-sage transition-all text-center group flex flex-col items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-xl bg-sage/5 flex items-center justify-center text-sage group-hover:scale-110 transition-transform">{support.icon}</div>
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-tight">{support.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-8">
                    <button disabled={isCollecting} onClick={handleCheckIn} className={`w-full bg-sage text-black h-28 rounded-[48px] font-black text-3xl uppercase tracking-tighter shadow-3xl shadow-sage/30 transition-all flex items-center justify-center gap-8 ${isCollecting ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}>
                       {isCollecting ? <div className="w-10 h-10 border-8 border-black/10 border-t-black rounded-full animate-spin" /> : <>{currentT.collectPoints} <Zap className="w-8 h-8 fill-current" /></>}
                    </button>
                    <button onClick={() => setIsScanning(false)} className="text-white/10 hover:text-white font-black uppercase tracking-[0.8em] text-[14px]">{(currentT as any).dismiss}</button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showNotification && (
        <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className={`fixed bottom-10 left-1/2 z-[300] px-8 py-5 rounded-[24px] shadow-3xl flex items-center gap-4 border ${showNotification.type === 'success' ? 'bg-sage text-black border-sage' : 'bg-red-500 text-white border-red-400'}`}>
          {showNotification.type === 'success' ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          <span className="font-black uppercase tracking-tight text-[12px]">{showNotification.message}</span>
          <button onClick={() => setShowNotification(null)} className="ml-8 font-black uppercase text-[10px] tracking-widest opacity-40 hover:opacity-100">Close</button>
        </motion.div>
      )}

      {/* Version Footer */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-20">
        <span className="text-[8px] font-black uppercase tracking-widest text-white">v1.0.2</span>
      </div>
    </div>
  );
}
