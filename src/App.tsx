import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Infinity, 
  Menu, 
  X, 
  Activity, 
  Lock, 
  Unlock, 
  Sparkles, 
  CheckCircle, 
  CreditCard, 
  ArrowRight,
  ArrowLeft,
  Flame, 
  User, 
  Compass, 
  Brain, 
  Award, 
  Send, 
  Camera, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Clock,
  RefreshCw,
  Plus,
  Info,
  LayoutDashboard,
  LogOut,
  Mic,
  FileText,
  Gamepad2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { auth, db, signInWithGoogle, logOut } from './lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import MindGames from './components/MindGames';

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4';

// 9 types of guided breathing exercises
const guidedExercises = [
  {
    id: 'box',
    nameEn: "Sama Vritti (Box Breathing)",
    nameBn: "সমবৃত্তি (বক্স ব্রিদিং)",
    descEn: "Standard 4-segment balancing pattern. Clears mental static.",
    descBn: "৪-ধাপের ফুসফুসীয় সমতা নির্ধারণকারী রিদম। মস্তিষ্ক শান্ত করে।",
    inhale: 4, hold: 4, exhale: 4, rest: 4,
    benefitEn: "Balances nervous system & center of focus.",
    benefitBn: "স্নায়ুতন্ত্রের ক্লান্তি ও একাগ্রতাহীনতা দূর করে।"
  },
  {
    id: 'sleep',
    nameEn: "4-7-8 Deep Sleep Method",
    nameBn: "৪-৭-৮ গভীর ঘুম পদ্ধতি",
    descEn: "Celebrated tranquilizing style to switch off adrenaline rushes.",
    descBn: "ঘুমের পূর্বে অতিরিক্ত ক্লান্তি বা উত্তেজনা কমানোর প্রাকৃতিক পদ্ধতি।",
    inhale: 4, hold: 7, exhale: 8, rest: 0,
    benefitEn: "Deep cellular oxygenation & stress shutdown.",
    benefitBn: "গভীর সেলুলার অক্সিজেনেশন এবং মানসিক চাপ নিষ্ক্রিয়করণ।"
  },
  {
    id: 'coherent',
    nameEn: "Primal Coherent Breathing",
    nameBn: "প্রাইমাল কোহেরেন্ট ব্রিদিং",
    descEn: "Equidistant inhalation and exhalation. Builds raw stability.",
    descBn: "সমান মেয়াদের জটিল শ্বাসক্রিয়া। হৃদস্পন্দনের ভারসাম্য বৃদ্ধি করে।",
    inhale: 5, hold: 0, exhale: 5, rest: 0,
    benefitEn: "Regulates heart-rate variability & raw focus.",
    benefitBn: "হৃদস্পন্দন রিদম এবং শারীরিক স্থায়িত্ব বাড়ায়।"
  },
  {
    id: 'resilience',
    nameEn: "Grounding Resilience Cycle",
    nameBn: "গ্রাউন্ডিং রেজিলিয়েন্স চক্র",
    descEn: "Elongated exhalations to amplify immediate calmness.",
    descBn: "শ্বাস ছাড়ার দীর্ঘায়িত প্রক্রিয়া দিয়ে আকস্মিক উত্তেজনা উপশম করা।",
    inhale: 6, hold: 4, exhale: 7, rest: 2,
    benefitEn: "Activates the parasympathetic nervous system.",
    benefitBn: "প্যারাসিমপ্যাথেটিক স্নায়ুতন্ত্রকে অবিলম্বে সক্রিয় করে।"
  },
  {
    id: 'energizer',
    nameEn: "Kapalabhati Aura Energizer",
    nameBn: "কপালভাতি অরা এনার্জাইজার",
    descEn: "Rapid active exhalations paired with short passive inhalations.",
    descBn: "দ্রুত ও সক্রিয় নিঃশ্বাস ত্যাগের মাধ্যমে ফোকাস দ্বিগুণের পদ্ধতি।",
    inhale: 2, hold: 0, exhale: 2, rest: 0,
    benefitEn: "Elevates mental alertness & unlocks fresh chi/prana.",
    benefitBn: "মানসিক সতর্কতা বাড়ায় এবং ফ্রেশ প্রাণশক্তি বৃদ্ধি করে।"
  },
  {
    id: 'zen',
    nameEn: "Zen Mind Clarity Flow",
    nameBn: "জেন মাইন্ড ক্ল্যারিটি ফ্লো",
    descEn: "Steady deep breaths for visual and cognitive calibration.",
    descBn: "ভিজ্যুয়াল এবং মানসিক একাগ্রতা ফিরে পাওয়ার শান্ত ধ্যান ফ্লো।",
    inhale: 5, hold: 2, exhale: 5, rest: 2,
    benefitEn: "Calms sensory overstimulation & overthinking.",
    benefitBn: "ইন্দ্রিয়ের অতিরিক্ত উত্তেজনা ও ওভারথিংকিং শান্ত করে।"
  },
  {
    id: 'resonance',
    nameEn: "Sudarshan Cosmic Resonance",
    nameBn: "সুদর্শন কসমিক রেজোন্যান্স",
    descEn: "Deep rhythmic breathing to match spiritual core vibration.",
    descBn: "মেডিটেটিভ কসমিক ছন্দে আত্মিক চেতনা প্রসারিত করার পদ্ধতি।",
    inhale: 6, hold: 6, exhale: 6, rest: 0,
    benefitEn: "Harmonizes internal spiritual flows and energy lanes.",
    benefitBn: "আভ্যন্তরীণ আধ্যাত্মিক চক্র এবং শক্তি প্রবাহে সামঞ্জস্য আনে।"
  },
  {
    id: 'anulom',
    nameEn: "Anulom Vilom (Hemisphere Balance)",
    nameBn: "অনুলোম বিলোম (মস্তিষ্ক হ্যামিস্ফিয়ার ব্যালেন্স)",
    descEn: "Alternating dual sensory channels to balance left/right brain.",
    descBn: "মস্তিষ্কের ডান ও বাম অংশের মধ্যে কোঅর্ডিনেশন বা ভারসাম্য বজায় রাখা।",
    inhale: 4, hold: 4, exhale: 6, rest: 0,
    benefitEn: "Coordinates logical and creative cognitive pathways.",
    benefitBn: "যৌক্তিক এবং সৃজনশীল স্নায়বিক পথগুলির সমন্বয় সাধন করে।"
  },
  {
    id: 'transcendental',
    nameEn: "Cosmic Transcendental Path",
    nameBn: "কসমিক ট্রান্সেন্ডেন্টাল পাথ",
    descEn: "Exceedingly deep respiratory holds for absolute aura alignment.",
    descBn: "গভীর আধ্যাত্মিক আভা এবং কসমিক চ্যানেল উন্মুক্ত করার উচ্চ মাত্রার শ্বাসক্রিয়া।",
    inhale: 7, hold: 3, exhale: 7, rest: 1,
    benefitEn: "Deep core self-transcendence & mindfulness alignment.",
    benefitBn: "উচ্চ ধ্যানাবস্থা অর্জন এবং সুপ্ত প্রতিভা উজ্জীবিত করা।"
  }
];

// 6 Mystical Motivation Mystery Cards for diagnostics
const MYSTERY_CARDS = [
  {
    id: 1,
    titleEn: "Card of Renewal",
    titleBn: "নবজাগরণের কার্ড",
    descEn: "Within your heavy hours, a bright star is aligning to illuminate your courage. Rise high!",
    descBn: "আপনার অন্ধকারের মাঝেও একটি উজ্জ্বল নক্ষত্র আপনার সাহসকে প্রজ্বলিত করছে। জেগে উঠুন!",
    color: "from-pink-500/20 via-purple-500/15 to-pink-500/5",
    borderColor: "border-pink-500/40",
    glow: "shadow-pink-500/20"
  },
  {
    id: 2,
    titleEn: "Card of Cosmic Fire",
    titleBn: "মহাজাগতিক অগ্নির কার্ড",
    descEn: "The spiritual spark inside you cannot be dimmed by earthly clouds. Reclaim your crown!",
    descBn: "আপনার ভেতরের আধ্যাত্মিক স্ফুলিঙ্গ পার্থিব মেঘের দ্বারা ম্লান হবে না। নিজের মুকুট পুনরুদ্ধার করুন!",
    color: "from-orange-500/20 via-red-500/15 to-orange-500/5",
    borderColor: "border-orange-500/40",
    glow: "shadow-orange-500/20"
  },
  {
    id: 3,
    titleEn: "Card of Ocean Serenity",
    titleBn: "সমুদ্র প্রশান্তির কার্ড",
    descEn: "Let the vast ocean of deep peace dissolve your limits. You are complete and free.",
    descBn: "গভীর প্রশান্তির মহাসাগর আপনার সমস্ত সীমাবদ্ধতা দ্রবীভূত করুক। আপনি সম্পূর্ণ এবং মুক্ত।",
    color: "from-cyan-500/20 via-blue-500/15 to-blue-500/5",
    borderColor: "border-blue-500/40",
    glow: "shadow-blue-500/20"
  },
  {
    id: 4,
    titleEn: "Card of Golden Guidance",
    titleBn: "সোনালী পথপ্রদর্শকের কার্ড",
    descEn: "Trust the unseen cosmic coordinate. Everything is falling beautifully into place for you.",
    descBn: "অদৃশ্য মহাজাগতিক সংযোগের ওপর আস্থা রাখুন। আপনার জন্য সবকিছুই সুন্দরভাবে প্রস্তুত হচ্ছে।",
    color: "from-yellow-500/20 via-amber-500/15 to-amber-500/5",
    borderColor: "border-yellow-500/40",
    glow: "shadow-yellow-500/20"
  },
  {
    id: 5,
    titleEn: "Card of Core Grounding",
    titleBn: "ভিত্তি সংযোগের কার্ড",
    descEn: "In quietness, you discover raw power. Breathe in your soul reserves, you are steady.",
    descBn: "নীরবতার মাঝে আপনি অসীম শক্তির সন্ধান পাবেন। গভীর শ্বাস নিন, আপনি স্থির ও শক্তিশালী।",
    color: "from-teal-500/20 via-emerald-500/15 to-emerald-500/5",
    borderColor: "border-emerald-500/40",
    glow: "shadow-emerald-500/20"
  },
  {
    id: 6,
    titleEn: "Card of Cosmic Rebirth",
    titleBn: "আত্মিক পুনর্জন্মের কার্ড",
    descEn: "Every breath is a clean sheet. Yesterday is dust, today you write a glorious saga.",
    descBn: "প্রতিটি শ্বাস এক একটি নতুন সূচনার ইঙ্গিত। অতীতকে ছাড়ুন, আজ আপনার বিজয়ের মহাকাব্য লিখুন।",
    color: "from-purple-500/20 via-indigo-500/15 to-indigo-500/5",
    borderColor: "border-indigo-500/40",
    glow: "shadow-indigo-500/20"
  }
];

// App translations
const translations = {
  en: {
    title: "MindMirror - Pratyusha's Edition",
    pricingTitle: "Pricing Options",
    successPlan: "Your Success Plan",
    readyToAnalyze: "Ready to Analyze",
    systemLocked: "System Locked",
    cameraError: "Camera permission denied or unavailable",
    sessionEnd: "Mindful check-in complete",
    sessionStarted: "Check-in initiated. Embrace peace.",
    deleteSuccess: "Journal entry deleted.",
    pointsSuccess: "Points and blessings collected (+100 MW)",
    newGameUnlocked: "Congratulations! Cosmic Reflexes game unlocked!",
    gameComplete: "Reflexes complete! Energy level heightened (+150 MW)",
    gameLocked: "Locked! Reach Level 2 or earn 200 MindPower to unlock.",
    sessionWarning: "Take a deep breath and wait for cooling down.",
    getStarted: "Begin Now",
    privacyBadge: "Zero-Recording Trust Badge",
    privacyDisclaimer: "No video is recorded or sent to any server. Our local AI model reads frame pixels completely on-device to reflect your energy level.",
    tabDashboard: "Dashboard",
    tabMirror: "The Deep Mirror",
    tabCoach: "Aura Coach",
    tabJournal: "Reflection Log",
    tabPlayground: "Mind Playground",
    welcome: "Welcome to MindMirror",
    subtitle: "Premium AI-powered mental wellness companion",
    scanStart: "Begin Scanner",
    scanEyesClose: "Phase 1: Close your eyes and breathe...",
    scanEyesOpen: "Phase 2: Open eyes, focus into the deep mirror...",
    scanAnalyzing: "Hues matching aura frequency. Formulating guidance...",
    coachWelcome: "Peace be with you. I am Aura, your mentor and spiritual sanctuary guide. How are you carrying your soul today?",
    coachPlaceholder: "Tell Aura your thoughts or feelings...",
    coachingResponse: "Spiritual Reflection",
    speakMute: "Mute voice guidance",
    speakUnmute: "Enable companion voice",
    journalHeading: "Spiritual Notebook",
    journalPlaceholder: "Pour your heart onto this digital parchment. Aura will reflect back the whispers of your raw thoughts...",
    journalAddBtn: "Imprint into History",
    historyTitle: "Past Echoes",
    noHistory: "No reflections etched yet. Take a scanner check-in or write a diary.",
    focusBreathing: "Focus Breath Cycle",
    focusBreathingDesc: "Harmonize your nervous system with quantum respiratory feedback loops.",
    reflexesGame: "Cosmic Reflexes",
    reflexesDesc: "Calibrate your coordination by tapping volatile star energy nodes.",
    reflexesBtn: "Ignite Cosmic Reflexes"
  },
  bn: {
    title: "মাইন্ডমিরর - প্রত্যুষা এডিশন",
    pricingTitle: "মূল্য নির্ধারণ",
    successPlan: "আপনার সাকসেস প্ল্যান",
    readyToAnalyze: "বিশ্লেষণ করতে প্রস্তুত",
    systemLocked: "সিস্টেম লকড",
    cameraError: "ক্যামেরা পারমিশন পাওয়া যায়নি বা ডিভাইস ব্লকড",
    sessionEnd: "মাইন্ডফুল চেক-ইন সম্পন্ন হয়েছে",
    sessionStarted: "চেক-ইন শুরু হয়েছে। শান্তি অনুভব করুন।",
    deleteSuccess: "জার্নাল ডায়েরি মুছে ফেলা হয়েছে।",
    pointsSuccess: "পয়েন্ট এবং আশীর্বাদ অর্জিত হয়েছে (+১০০ MW)",
    newGameUnlocked: "অভিনন্দন! কসমিক রিফ্লেক্সেস গেমটি আনলক হয়েছে!",
    gameComplete: "রিফ্লেক্সেস সম্পন্ন! মানসিক শক্তি বৃদ্ধি পেয়েছে (+১৫০ MW)",
    gameLocked: "লকড! লেভেল ২ অর্জন করুন অথবা ২০০ মাইন্ডপাওয়ার আয় করুন।",
    sessionWarning: "অনুগ্রহ করে শান্ত হয়ে ঠান্ডা হওয়া পর্যন্ত অপেক্ষা করুন।",
    getStarted: "শুরু করুন",
    privacyBadge: "জিরো-রেকর্ডিং ট্রাস্ট ব্যাজ",
    privacyDisclaimer: "কোনো ভিডিও রেকর্ড করা হচ্ছে না। আমাদের লোকাল এআই মডেল শুধুমাত্র রিয়েল-টাইমে আবেগ প্রতিফলিত করার জন্য পিক্সেল রিড করে।",
    tabDashboard: "ড্যাশবোর্ড",
    tabMirror: "দ্য ডিপ মিরর",
    tabCoach: "অরা কোচ",
    tabJournal: "রিফ্লেকশন লগ",
    tabPlayground: "মাইন্ড প্লেগ্রাউন্ড",
    welcome: "মাইন্ডমিররে স্বাগতম",
    subtitle: "এআই চালিত প্রিমিয়াম মানসিক সুস্থতার সহচর",
    scanStart: "স্ক্যানার শুরু করুন",
    scanEyesClose: "১ম ধাপ: চোখ বন্ধ রাখুন এবং শ্বাস নিন...",
    scanEyesOpen: "২য় ধাপ: চোখ খুলুন এবং গভীর আয়নায় তাকান...",
    scanAnalyzing: "আভা শনাক্ত হচ্ছে। আধ্যাত্মিক দিকনির্দেশনা তৈরি করা হচ্ছে...",
    coachWelcome: "আপনার উপর শান্তি বর্ষিত হোক। আমি অরা, আপনার আত্মিক মেন্টর। আজ আপনার মনের অনুভূতি কেমন?",
    coachPlaceholder: "অরাকে আপনার মনের গোপন কথা বলুন...",
    coachingResponse: "আত্মিক প্রতিফলন",
    speakMute: "কণ্ঠস্বর বন্ধ করুন",
    speakUnmute: "সহচরের কণ্ঠ সচল করুন",
    journalHeading: "আধ্যাত্মিক নোটবুক",
    journalPlaceholder: "এই ডিজিটাল পার্চমেন্টে আপনার মনের কথা উজাড় করে লিখুন। অরা আপনার কাঁচা চিন্তাগুলোর প্রতিধ্বনি প্রতিফলিত করবে...",
    journalAddBtn: "ইতিহাসে খোদাই করুন",
    historyTitle: "অতীতের প্রতিধ্বনি",
    noHistory: "এখনো কোনো প্রতিফলন খোদাই করা হয়নি। স্ক্যানার বা ডায়েরি দিয়ে প্রথম প্রতিফলন যোগ করুন।",
    focusBreathing: "ফোকাস ব্রিদিং চক্র",
    focusBreathingDesc: "কোয়ান্টাম শ্বাস-প্রশ্বাসের ফিডব্যাক লুপ দিয়ে আপনার স্নায়ুতন্ত্রকে সামঞ্জস্য করুন।",
    reflexesGame: "কসমিক রিফ্লেক্সেস",
    reflexesDesc: "উড়ন্ত নক্ষত্র শক্তি নোডগুলিতে আলতো চাপ দিয়ে আপনার একাগ্রতা পরীক্ষা করুন।",
    reflexesBtn: "কসমিক রিফ্লেক্সেস খেলুন"
  }
};

interface LoginRequiredViewProps {
  tab: string;
  lang: 'en' | 'bn';
  currentT: any;
  onSignIn: () => Promise<any>;
}

function LoginRequiredView({ tab, lang, currentT, onSignIn }: LoginRequiredViewProps) {
  const tabName = 
    tab === 'mirror' ? (lang === 'bn' ? 'দ্য ডিপ মিরর (The Deep Mirror)' : 'The Deep Mirror') :
    tab === 'coach' ? (lang === 'bn' ? 'অরা কোচ (Aura Coach)' : 'Aura Coach') :
    tab === 'journal' ? (lang === 'bn' ? 'রিফ্লেকশন লগ (Reflection Log)' : 'Reflection Log') :
    (lang === 'bn' ? 'মাইন্ড প্লেগ্রাউন্ড (Mind Playground)' : 'Mind Playground');

  const titleText = lang === 'bn' ? "প্রবেশাধিকার অবরুদ্ধ" : "Access Restricted";
  const descText = lang === 'bn' 
    ? `অনুগ্রহ করে লগইন করুন। ${tabName} ফিচারটি দেখতে ও ব্যবহার করতে গুগল একাউন্ট সংযোগ করা আবশ্যক। এটি সম্পূর্ণ ফ্রি এবং আপনার ডেটা সুরক্ষিত রাখে।` 
    : `Please log in to continue. Connecting your Google account is required to view and unlock ${tabName} features securely.`;
  
  const buttonText = lang === 'bn' ? "গুগল অ্যাকাউন্ট সংযুক্ত করুন" : "Connect Google Account";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto my-12 p-8 sm:p-10 rounded-[36px] bg-[#0d0d1e]/85 border border-white/5 shadow-2xl backdrop-blur-3xl text-center space-y-6 flex flex-col items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
      
      {/* Locked animated icon badge */}
      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 relative group">
        <div className="absolute inset-0 rounded-full border border-rose-500/5 bg-rose-500/5 animate-pulse" />
        <Lock size={26} strokeWidth={2.5} className="group-hover:scale-110 transition-transform duration-300" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-white uppercase tracking-tight">{titleText}</h3>
        <p className="text-[10px] text-rose-400 font-black tracking-widest uppercase">{lang === 'bn' ? 'সহজ লগইন সংযোগ' : 'LOGIN TO CONTINUE'}</p>
      </div>

      <p className="text-[12px] text-white/70 leading-relaxed font-serif max-w-sm">
        {descText}
      </p>

      <button
        onClick={async () => {
          try {
            await onSignIn();
          } catch (e) {
            console.error(e);
          }
        }}
        className="w-full h-14 bg-white hover:bg-white/90 text-black font-extrabold uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-white/5 active:scale-95 transition-all cursor-pointer"
      >
        <User size={14} strokeWidth={2.5} />
        <span>{buttonText}</span>
      </button>

      <div className="text-[10px] text-white/35">
        🔒 {lang === 'bn' ? 'আপনার ব্যক্তিগত ডায়েরি ও রিফ্লেকশন লগ চিরকাল সুরক্ষিত থাকবে।' : 'Your digital reflections and notes are strictly confidential & secure.'}
      </div>
    </motion.div>
  );
}

const extractOnlySolution = (text: string): string => {
  if (!text) return "";
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const solIndex = lines.findIndex(l => 
    l.toLowerCase().startsWith('solution:') || 
    l.startsWith('সমাধান:')
  );
  
  if (solIndex !== -1) {
    const joined = lines.slice(solIndex).join(' ');
    return joined.replace(/^(solution:|সমাধান:)\s*/i, '').trim();
  }
  
  const stateIndex = lines.findIndex(l => 
    l.toLowerCase().startsWith('state:') || 
    l.startsWith('অবস্থা:')
  );
  
  if (stateIndex !== -1 && lines.length > 1) {
    const remaining = lines.filter((_, idx) => idx !== stateIndex);
    return remaining.join(' ').replace(/^(solution:|সমাধান:)\s*/i, '').trim();
  }
  
  return text.replace(/^(solution:|সমাধান:|state:|অবস্থা:)\s*/gi, '').trim();
};

const extractOnlyState = (text: string): string => {
  if (!text) return "";
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const stateIndex = lines.findIndex(l => 
    l.toLowerCase().startsWith('state:') || 
    l.startsWith('অবস্থা:')
  );
  
  if (stateIndex !== -1) {
    const matched = lines[stateIndex];
    return matched.replace(/^(state:|অবস্থা:)\s*/i, '').trim();
  }
  
  const solIndex = lines.findIndex(l => 
    l.toLowerCase().startsWith('solution:') || 
    l.startsWith('সমাধান:')
  );
  if (solIndex !== -1 && solIndex > 0) {
    return lines.slice(0, solIndex).join(' ').trim();
  }
  
  return "";
};

const detectFaceFromVideo = (video: HTMLVideoElement | null): boolean => {
  if (!video) return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    let totalR = 0, totalG = 0, totalB = 0;
    let maxVal = 0, minVal = 255;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const gray = (r + g + b) / 3;
      if (gray > maxVal) maxVal = gray;
      if (gray < minVal) minVal = gray;
      totalR += r;
      totalG += g;
      totalB += b;
    }
    
    const count = data.length / 4;
    const avgGray = (totalR + totalG + totalB) / (3 * count);
    
    if (maxVal - minVal < 20) {
      console.warn("Face check: Low contrast.");
      return false;
    }
    
    if (avgGray < 15) {
      console.warn("Face check: Ambient is total black.");
      return false;
    }
    
    return true;
  } catch (e) {
    console.error("Face detection failed, defaulting to true:", e);
    return true;
  }
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mirror' | 'coach' | 'journal' | 'playground' | 'games'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  // User status/Gamification
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [points, setPoints] = useState(350);
  const [streak, setStreak] = useState(5);
  const [badges, setBadges] = useState<string[]>(["Clarity Initiate", "Brave Observer"]);
  const [gameUnlocked, setGameUnlocked] = useState(false);

  // Scanner States
  const [scannerActive, setScannerActive] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'close' | 'open' | 'analyzing' | 'done'>('idle');
  const [scanCountdown, setScanCountdown] = useState(0);
  const [scanReflection, setScanReflection] = useState<string>("");
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerMode, setScannerMode] = useState<'camera' | 'voice' | 'text'>('camera');
  const [scanMood, setScanMood] = useState<string>('good');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSecs, setVoiceSecs] = useState(0);
  const [textScanInput, setTextScanInput] = useState("");
  const [cameraClickFlash, setCameraClickFlash] = useState(false);
  const [cameraRecording, setCameraRecording] = useState(false);
  const [cameraRecordingSecs, setCameraRecordingSecs] = useState(0);

  // Popup / Diagnostic & Motivation Card states
  const [tempReflection, setTempReflection] = useState<string>("");
  const [showDiagnosticPopup, setShowDiagnosticPopup] = useState(false);
  const [popupSubStep, setPopupSubStep] = useState<'choice' | 'cards'>('choice');
  const [ttsOption, setTtsOption] = useState<'speak' | 'read' | null>(null);
  const [selectedMysteryCard, setSelectedMysteryCard] = useState<number | null>(null);

  // Quantum resonance core matrix telemetry state
  const [telemetryChakra, setTelemetryChakra] = useState<string>("Heart Balance");
  const [telemetryFreq, setTelemetryFreq] = useState<string>("432.000");
  const [telemetryCoherence, setTelemetryCoherence] = useState<string>("85.5");
  const [telemetrySignature, setTelemetrySignature] = useState<string>("CE61FD");

  // Video streams
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio / voice analyzer status and refs
  const [hasDetectedAudio, setHasDetectedAudio] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioAnimationRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const startVolumeAnalysis = (stream: MediaStream) => {
    try {
      setHasDetectedAudio(false);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        setHasDetectedAudio(true);
        return;
      }
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      audioAnalyserRef.current = analyser;
      audioSourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        if (average > 1) {
          setHasDetectedAudio(true);
        }

        audioAnimationRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn("Audio volume analyzer error, fallback to true:", e);
      setHasDetectedAudio(true);
    }
  };

  const startSpeechRecognition = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("Speech recognition is not supported in this browser.");
        return;
      }
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = lang === 'bn' ? 'bn-BD' : 'en-IN';
      
      let finalTranscript = "";
      rec.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const fullText = (finalTranscript + interimTranscript).trim();
        if (fullText) {
          setVoiceTranscript(fullText);
          setHasDetectedAudio(true);
        }
      };
      
      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
      };
      
      rec.onend = () => {
        console.log("Speech recognition ended.");
      };
      
      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping speech recognition:", e);
      }
      recognitionRef.current = null;
    }
  };

  const stopVolumeAnalysis = () => {
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
      audioAnimationRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    stopSpeechRecognition();
  };

  // Coach states
  const [coachMessages, setCoachMessages] = useState<Array<{role: 'user' | 'aura', text: string}>>([]);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Journal Notebook States
  const [journalInput, setJournalInput] = useState("");
  const [journalHistory, setJournalHistory] = useState<Array<{ id: string; timestamp: string; reflection: string; type: string; score: number }>>([]);
  const [journalLoading, setJournalLoading] = useState(false);

  // Guided Exercises State (9 types)
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);

  // Breathing game
  const [breathingStep, setBreathingStep] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [breathingSecs, setBreathingSecs] = useState(4);

  // Sequentially Unlocked Games State
  const [activeGameId, setActiveGameId] = useState<'reflexes' | 'harmony' | 'sequence'>('reflexes');
  const [game1Plays, setGame1Plays] = useState<number>(0);
  const [game2Plays, setGame2Plays] = useState<number>(0);
  const [game3Plays, setGame3Plays] = useState<number>(0);

  // Game 2 (Aura Shifting Harmony / Stroop Match) States
  const [isPlayingGame2, setIsPlayingGame2] = useState(false);
  const [game2Score, setGame2Score] = useState(0);
  const [game2TimeLeft, setGame2TimeLeft] = useState(15);
  const [stroopWord, setStroopWord] = useState<'SAGE' | 'PURPLE' | 'BLUE' | 'ORANGE'>('SAGE');
  const [stroopColor, setStroopColor] = useState<'SAGE' | 'PURPLE' | 'BLUE' | 'ORANGE'>('SAGE');

  // Game 3 (Cosmic Path Sequence Memory / Simon) States
  const [isPlayingGame3, setIsPlayingGame3] = useState(false);
  const [game3Score, setGame3Score] = useState(0);
  const [memorySequence, setMemorySequence] = useState<number[]>([]);
  const [userAttempt, setUserAttempt] = useState<number[]>([]);
  const [activeSequenceFlash, setActiveSequenceFlash] = useState<number | null>(null);
  const [sequenceStep, setSequenceStep] = useState<'show' | 'input' | 'failed' | 'idle'>('idle');

  // Reflexes Game States
  const [isPlayingReflex, setIsPlayingReflex] = useState(false);
  const [reflexScore, setReflexScore] = useState(0);
  const [reflexTimeLeft, setReflexTimeLeft] = useState(15);
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });

  // Notifications
  const [showNotification, setShowNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Pricing / Checkout state
  const [viewingPlan, setViewingPlan] = useState<any>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);

  const currentT = translations[lang];

  // Dynamic sound ambient loop (HTML5 Audio Synthesis)
  const [isMuted, setIsMuted] = useState(true);

  // Plan Details data
  const pricingPlans = [
    {
      id: 'foundation',
      title: lang === 'bn' ? "ক্ল্যারিটি ফাউন্ডেশন" : "The Clarity Foundation",
      outcome: lang === 'bn' ? "দৈনিক মুড ট্র্যাকিং" : "Daily Mood Tracking & Awareness",
      price: "$0",
      features: lang === 'bn' ? ["আনলিমিটেড জার্নালিং", "টেক্সট এনালাইসিস", "বেসিক ইতিহাস", "দৈনিক অনুপ্রেরণা"] : ["Unlimited Journaling", "Text Analysis", "Basic History", "Daily Affirmations"],
      description: lang === 'bn' ? "আপনার মানসিক স্বাস্থ্যের যাত্রার প্রথম ধাপ। একদম ফ্রি।" : "The first step in your mental health journey. Completely free.",
      color: "border-white/10 bg-white/[0.02]"
    },
    {
      id: 'pro',
      title: lang === 'bn' ? "দ্য ইমোショナル রেজিলিয়েন্স প্রো" : "Emotional Resilience Pro",
      outcome: lang === 'bn' ? "রিয়েল-টাইম স্ট্রেস ম্যানেজমেন্ট" : "Real-time Stress Management & Scans",
      price: "$12",
      featured: true,
      features: lang === 'bn' ? ["ফাউন্ডেশনের সবকিছু+", "ভয়েস টোন এনালাইসিস", "ডিপ মিরর (ফেস)", "গাইডেড সাপোর্ট এআই"] : ["Everything in Foundation+", "Voice Tone Analysis", "The Deep Mirror (Face)", "Guided Support AI"],
      description: lang === 'bn' ? "গভীর বিশ্লেষণের মাধ্যমে নিজের আবেগকে নিয়ন্ত্রণ করার জন্য ডিজাইন করা হয়েছে। এতে থাকছে ভয়েস এবং ফেস এনালাইসিস।" : "Designed to master your emotions through deep computer-vision analysis. Includes predictive on-demand checks.",
      color: "border-sage bg-sage/5"
    },
    {
      id: 'suite',
      title: lang === 'bn' ? "ইমোショナル ইন্টেলিজেন্স স্যুট" : "Emotional Intelligence Suite",
      outcome: lang === 'bn' ? "ইন্টেলিজেন্স ও ফোকাস স্যুট" : "Emotional Intelligence & Focus Suite",
      price: "$24",
      features: lang === 'bn' ? ["প্রো এর সবকিছু+", "অ্যাডভান্সড ট্রেন্ড ইনসাইটস", "ব্রেইন ব্যালান্স গেমস", "প্রায়োরিটি কম্প্যানিয়ন এক্সেস"] : ["Everything in Pro+", "Advanced Trend Insights", "Brain Balance Games", "Priority Companion Access"],
      description: lang === 'bn' ? "যারা নিজেদের সেরাটা দিতে চান তাদের জন্য। অ্যাডভান্সড ইনসাইটস এবং স্পেশাল গেমস এর মাধ্যমে আপনার পারফরম্যান্স বাড়ান।" : "Ultimate toolkit for biofield analytics, mental stress metrics, priority companion guidance and advanced sensory brain training.",
      color: "border-purple-500/20 bg-purple-500/5"
    }
  ];

  // Auth & Initial load sync
  useEffect(() => {
    // Local persistence fallback
    const savedPoints = localStorage.getItem('mm_points');
    const savedStreak = localStorage.getItem('mm_streak');
    const savedBadges = localStorage.getItem('mm_badges');
    const savedHistory = localStorage.getItem('mm_journal_history');
    const savedG1 = localStorage.getItem('mm_g1plays');
    const savedG2 = localStorage.getItem('mm_g2plays');
    const savedG3 = localStorage.getItem('mm_g3plays');

    if (savedPoints) setPoints(parseInt(savedPoints));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedBadges) setBadges(JSON.parse(savedBadges));
    if (savedHistory) setJournalHistory(JSON.parse(savedHistory));
    if (savedG1) setGame1Plays(parseInt(savedG1));
    if (savedG2) setGame2Plays(parseInt(savedG2));
    if (savedG3) setGame3Plays(parseInt(savedG3));

    const unsubscribe = onAuthStateChanged(auth, async (gUser) => {
      if (gUser) {
        setUser(gUser);
        // Load data from Firebase
        const userDocRef = doc(db, 'users', gUser.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setPoints(data.points || 350);
            setStreak(data.streak || 5);
            setBadges(data.badges || ["Clarity Initiate"]);
            setGame1Plays(data.game1Plays || 0);
            setGame2Plays(data.game2Plays || 0);
            setGame3Plays(data.game3Plays || 0);
          } else {
            // Save initial profile
            await setDoc(userDocRef, {
              uid: gUser.uid,
              displayName: gUser.displayName,
              email: gUser.email,
              photoURL: gUser.photoURL,
              points: 350,
              streak: 5,
              badges: ["Clarity Initiate"],
              game1Plays: 0,
              game2Plays: 0,
              game3Plays: 0,
              createdAt: new Date().toISOString()
            });
          }

          // Fetch database checkins
          const checkinsRef = collection(db, 'users', gUser.uid, 'checkins');
          const checkinsSnap = await getDocs(checkinsRef);
          const rawHist: any[] = [];
          checkinsSnap.forEach((d) => {
            rawHist.push({ id: d.id, ...d.data() });
          });
          if (rawHist.length > 0) {
            setJournalHistory(rawHist);
          }
        } catch (e) {
          console.error("Firestore Loading error, using local fallback", e);
        }
      } else {
        setUser(null);
      }
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync state with localstorage on updates
  useEffect(() => {
    localStorage.setItem('mm_points', points.toString());
    localStorage.setItem('mm_streak', streak.toString());
    localStorage.setItem('mm_badges', JSON.stringify(badges));
    localStorage.setItem('mm_journal_history', JSON.stringify(journalHistory));
    localStorage.setItem('mm_g1plays', game1Plays.toString());
    localStorage.setItem('mm_g2plays', game2Plays.toString());
    localStorage.setItem('mm_g3plays', game3Plays.toString());

    // Unlock Reflexes if points >= 500
    if (points >= 500 && !gameUnlocked) {
      setGameUnlocked(true);
      triggerNotification(currentT.newGameUnlocked, 'success');
    }
  }, [points, streak, badges, journalHistory, game1Plays, game2Plays, game3Plays]);

  // Clean text for text-to-speech to read clean sentences
  const cleanTextForSpeech = (rawText: string, language: 'en' | 'bn'): string => {
    if (!rawText) return "";
    let clean = rawText;
    
    // Remove Markdown formatting
    clean = clean.replace(/[*#`_~]/g, "").trim();

    // Replace common labels/headings globally anywhere in the texts, supporting voluntary spaces, tags, or dashes
    clean = clean.replace(/(state|solution|status|reflection|aura|message|coach)\s*[:\-\u2013\u2014]\s*/gi, " ");
    clean = clean.replace(/(অবস্থা|সমাধান|বার্তা|উপদেশ|অরা|উৎস|আভা)\s*[:\-\u2013\u2014]\s*/gi, " ");

    if (language === 'bn') {
      // Remove all parentheses and contents within them, e.g. (Throat - 340Hz)
      clean = clean.replace(/\([^)]*\)/g, " ");
      
      // Remove all square brackets and contents within them
      clean = clean.replace(/\[[^\]]*\]/g, " ");
      
      // Remove ALL English letters/words (A-Z and a-z) completely, so they don't break Bengali TTS synthesis
      clean = clean.replace(/[a-zA-Z]+/g, " ");
      
      // Remove english numbers or non-bengali symbol sequences that trigger browser speech-engine silence
      clean = clean.replace(/[\-%&/\\#+]/g, " ");

      // Convert English numerals 0-9 to Bengali numerals ০-৯ so the Bengali TTS engine can speak them perfectly
      const englishToBengaliMap: Record<string, string> = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
      };
      clean = clean.replace(/[0-9]/g, (match) => englishToBengaliMap[match] || match);
    }
    
    // Return clean spaces
    return clean.replace(/\s+/g, " ").trim();
  };

  // Coach speak synthesis
  const speakNow = (text: string, force: boolean = false) => {
    if (!autoSpeak && !force) return;
    const cleanedText = cleanTextForSpeech(text, lang);
    if (!cleanedText) return;

    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      if (lang === 'bn') {
        utterance.lang = 'bn-BD';
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
          const bengaliVoice = voices.find(v => {
            const l = v.lang.toLowerCase().replace('_', '-');
            const n = v.name.toLowerCase();
            return l === 'bn-bd' || l === 'bn-in' || l.startsWith('bn-') || l === 'bn' || n.includes('bengali') || n.includes('bangla');
          });
          if (bengaliVoice) {
            utterance.voice = bengaliVoice;
            utterance.lang = bengaliVoice.lang;
          } else {
            // Chrome standard Bengali voice code fallback
            utterance.lang = 'bn-IN';
          }
        }
      } else {
        utterance.lang = 'en-IN'; // Indian English voice
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
          // Look for an Indian voice (such as Google UK English Male/Female, but specifically India / en-IN)
          const indianVoice = voices.find(v => {
            const l = v.lang.toLowerCase().replace('_', '-');
            const n = v.name.toLowerCase();
            return l === 'en-in' || l.startsWith('en-in') || n.includes('india') || n.includes('indian');
          });
          if (indianVoice) {
            utterance.voice = indianVoice;
            utterance.lang = indianVoice.lang;
          }
        }
      }
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        setIsSpeaking(false);
      };
      
      // Delay speech synthesis speak to let cancel() finish safely (avoids browser locking up or playing silent audio)
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const triggerNotification = (message: string, type: 'success' | 'error') => {
    setShowNotification({ message, type });
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Breathing cadence
  useEffect(() => {
    const currentExec = guidedExercises[activeExerciseIdx];
    const timer = setInterval(() => {
      setBreathingSecs((prev) => {
        if (prev <= 1) {
          if (breathingStep === 'inhale') {
            if (currentExec.hold > 0) {
              setBreathingStep('hold');
              return currentExec.hold;
            } else {
              setBreathingStep('exhale');
              return currentExec.exhale;
            }
          } else if (breathingStep === 'hold') {
            setBreathingStep('exhale');
            return currentExec.exhale;
          } else if (breathingStep === 'exhale') {
            if (currentExec.rest > 0) {
              setBreathingStep('rest');
              return currentExec.rest;
            } else {
              setBreathingStep('inhale');
              return currentExec.inhale;
            }
          } else {
            // from rest
            setBreathingStep('inhale');
            return currentExec.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breathingStep, activeExerciseIdx]);

  // Reflex timing
  useEffect(() => {
    let interval: any;
    if (isPlayingReflex && reflexTimeLeft > 0) {
      interval = setInterval(() => {
        setReflexTimeLeft(t => t - 1);
      }, 1000);
    } else if (isPlayingReflex && reflexTimeLeft === 0) {
      setIsPlayingReflex(false);
      const bonus = reflexScore * 10;
      const award = bonus + 150;
      setPoints(p => p + award);
      
      const newG1Plays = game1Plays + 1;
      setGame1Plays(newG1Plays);
      localStorage.setItem('mm_g1plays', newG1Plays.toString());

      triggerNotification(`${currentT.gameComplete}: +${award} MW! (${newG1Plays}/3 plays)`, 'success');

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, {
          points: points + award,
          game1Plays: newG1Plays
        }).catch(e => {});
      }
    }
    return () => clearInterval(interval);
  }, [isPlayingReflex, reflexTimeLeft, reflexScore, game1Plays, user, points]);

  // Game 2 (Aura Stroop Harmony Matching) Round Generator
  const generateStroopRound = () => {
    const list = ['SAGE', 'PURPLE', 'BLUE', 'ORANGE'];
    const word = list[Math.floor(Math.random() * list.length)] as any;
    const color = list[Math.floor(Math.random() * list.length)] as any;
    setStroopWord(word);
    setStroopColor(color);
  };

  const startStroopGame = () => {
    setGame2Score(0);
    setGame2TimeLeft(15);
    setIsPlayingGame2(true);
    generateStroopRound();
  };

  // Game 2 Timing
  useEffect(() => {
    let interval: any;
    if (isPlayingGame2 && game2TimeLeft > 0) {
      interval = setInterval(() => {
        setGame2TimeLeft(t => t - 1);
      }, 1000);
    } else if (isPlayingGame2 && game2TimeLeft === 0) {
      setIsPlayingGame2(false);
      const bonus = game2Score * 15;
      const award = bonus + 150;
      setPoints(p => p + award);
      
      const newG2Plays = game2Plays + 1;
      setGame2Plays(newG2Plays);
      localStorage.setItem('mm_g2plays', newG2Plays.toString());

      triggerNotification(
        lang === 'bn' 
          ? `অরা হারমনি সম্পন্ন! অর্জিত: +${award} MW (${newG2Plays}/৩ সমাপ্ত)` 
          : `Aura Harmony complete! Received: +${award} MW (${newG2Plays}/3 plays)`, 
        'success'
      );

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, {
          points: points + award,
          game2Plays: newG2Plays
        }).catch(e => {});
      }
    }
    return () => clearInterval(interval);
  }, [isPlayingGame2, game2TimeLeft, game2Score, game2Plays, user, points, lang]);

  // Game 3 (Cosmic Path Sequence Memory)
  const startMemoryGameLevel = () => {
    setIsPlayingGame3(true);
    setGame3Score(0);
    const nextSeq = [Math.floor(Math.random() * 4) + 1];
    setMemorySequence(nextSeq);
    setUserAttempt([]);
    triggerSequenceFlash(nextSeq);
  };

  const triggerSequenceFlash = (seq: number[]) => {
    setSequenceStep('show');
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= seq.length) {
        clearInterval(interval);
        setActiveSequenceFlash(null);
        setSequenceStep('input');
        return;
      }
      setActiveSequenceFlash(seq[idx]);
      setTimeout(() => {
        setActiveSequenceFlash(null);
      }, 500);
      idx++;
    }, 850);
  };

  const onMemoryNodeClick = (nodeVal: number) => {
    if (sequenceStep !== 'input' || !isPlayingGame3) return;
    
    const nextAttempt = [...userAttempt, nodeVal];
    setUserAttempt(nextAttempt);

    const activeIndex = nextAttempt.length - 1;
    if (nodeVal !== memorySequence[activeIndex]) {
      // Failed! Game over
      setSequenceStep('failed');
      setIsPlayingGame3(false);
      const award = game3Score * 50 + 150;
      setPoints(curr => curr + award);
      
      const newG3Plays = game3Plays + 1;
      setGame3Plays(newG3Plays);
      localStorage.setItem('mm_g3plays', newG3Plays.toString());
      
      triggerNotification(
        lang === 'bn'
          ? `ভুল প্রতীক! সিকোয়েন্স অফলাইন। পেয়েছেন: +${award} MW (${newG3Plays}/৩ সমাপ্ত)`
          : `Sequence mismatch! Path offline. Received: +${award} MW (${newG3Plays}/3 plays)`,
        'error'
      );

      if (autoSpeak) {
        speakNow(lang === 'bn' ? "ভুল সংযোগ, আপনার কসমিক পাথ ভারসাম্য বজায় রাখুন।" : "Sequence offline. Recalibrate focus sanctuary.");
      }

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, {
          points: points + award,
          game3Plays: newG3Plays
        }).catch(e => {});
      }
      return;
    }

    // Check if user completed the current level sequence
    if (nextAttempt.length === memorySequence.length) {
      const nextScore = game3Score + 1;
      setGame3Score(nextScore);
      triggerNotification(lang === 'bn' ? `লেভেল ${nextScore} সফল!` : `Path Level ${nextScore} Sync completed!`, 'success');

      // Add check point check for completed sequence to count as a play even if they want to stop or play long
      if (nextScore === 3) {
        const newG3Plays = game3Plays + 1;
        setGame3Plays(newG3Plays);
        localStorage.setItem('mm_g3plays', newG3Plays.toString());
        triggerNotification(lang === 'bn' ? "অভিনন্দন! আপনি ৩ লেভেল পার করেছেন এবং কসমিক মাস্টার শিরোপার ১টি ধাপ অর্জন করেছেন।" : "Congratulations! Level 3 achieved, score tracked!", 'success');
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          updateDoc(userDocRef, { game3Plays: newG3Plays }).catch(() => {});
        }
      }

      setTimeout(() => {
        const nextSeq = [...memorySequence, Math.floor(Math.random() * 4) + 1];
        setMemorySequence(nextSeq);
        setUserAttempt([]);
        triggerSequenceFlash(nextSeq);
      }, 1000);
    }
  };

  // Prompt game coordinate move
  const moveReflexTarget = () => {
    const top = Math.floor(Math.random() * 70 + 15) + '%';
    const left = Math.floor(Math.random() * 75 + 10) + '%';
    setTargetPos({ top, left });
  };

  const onTargetHit = () => {
    setReflexScore(s => s + 1);
    moveReflexTarget();
  };

  // Trigger Photo click capture
  const triggerPhotoClick = async () => {
    setCameraClickFlash(true);
    triggerNotification(lang === 'bn' ? "ছবি তোলা হচ্ছে..." : "Capturing photo snap...", 'success');
    
    // Auto turn stream on if not already active to show lens aperture animation
    if (!scannerActive) {
      try {
        const liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = liveStream;
        if (videoRef.current) {
          videoRef.current.srcObject = liveStream;
        }
        setScannerActive(true);
      } catch (e) {
        console.warn(e);
      }
    }

    setTimeout(() => {
      setCameraClickFlash(false);
      
      const faceIsDetected = detectFaceFromVideo(videoRef.current);
      if (!faceIsDetected) {
        triggerNotification(
          lang === 'bn' 
            ? "চেহারা সনাক্ত করা যায়নি। অনুগ্রহ করে আলোতে বসুন এবং আবার চেষ্টা করুন।" 
            : "Face not detected. Please sit in a lit area, ensure your lens is clean, and try again.", 
          'error'
        );
        setScanStep('idle');
        return;
      }

      setScanStep('analyzing');
      submitAnalysis('face');
    }, 450);
  };

  // Trigger Video Recording session
  const triggerVideoRecord = async () => {
    if (cameraRecording) return;
    setCameraRecording(true);
    setCameraRecordingSecs(120);
    triggerNotification(lang === 'bn' ? "২ মিনিটের ভিডিও রেকর্ড শুরু হচ্ছে..." : "Starting 2-minute video recording...", 'success');

    // Auto turn stream on if not already active
    if (!scannerActive) {
      try {
        const liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = liveStream;
        if (videoRef.current) {
          videoRef.current.srcObject = liveStream;
        }
        setScannerActive(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Camera checkin mechanics
  const startCameraScan = async () => {
    setScannerActive(true);
    setScanStep('close');
    setScanCountdown(5);
    setScanReflection("");
    triggerNotification(currentT.sessionStarted, 'success');

    try {
      const liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = liveStream;
      if (videoRef.current) {
        videoRef.current.srcObject = liveStream;
      }
    } catch (e) {
      console.warn("Camera streaming is locked or simulator frame active:", e);
    }
  };

  // Scan simulation countdown timers
  useEffect(() => {
    let interval: any;
    if (scannerActive && scanCountdown > 0) {
      interval = setInterval(() => {
        setScanCountdown(c => c - 1);
      }, 1000);
    } else if (scannerActive && scanCountdown === 0) {
      if (scanStep === 'close') {
        setScanStep('open');
        setScanCountdown(10);
      } else if (scanStep === 'open') {
        const faceIsDetected = detectFaceFromVideo(videoRef.current);
        if (!faceIsDetected) {
          triggerNotification(
            lang === 'bn' 
              ? "চেহারা সনাক্ত করা যায়নি। অনুগ্রহ করে আলোতে বসুন এবং আবার চেষ্টা করুন।" 
              : "Face not detected. Please sit in a lit area, ensure your lens is clean, and try again.", 
            'error'
          );
          setScanStep('idle');
          return;
        }
        setScanStep('analyzing');
        submitAnalysis('face');
      }
    }
    return () => clearInterval(interval);
  }, [scannerActive, scanCountdown, scanStep, lang]);

  // Voice Recording simulation timer
  useEffect(() => {
    let timer: any;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setVoiceSecs((prev) => {
          if (prev >= 120) {
            clearInterval(timer);
            setIsRecordingVoice(false);
            stopVolumeAnalysis();

            if (!hasDetectedAudio) {
              triggerNotification(
                lang === 'bn' 
                  ? "কোনো শব্দ বা কথা শোনা যায়নি। আবার চেষ্টা করুন।" 
                  : "Voice not detected. Please speak clearly into your microphone and try again.", 
                'error'
              );
              setScanStep('idle');
              return 0;
            }

            setScanStep('analyzing');
            submitAnalysis('voice');
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice, hasDetectedAudio, lang]);

  // Video recording simulation timer
  useEffect(() => {
    let timer: any;
    if (cameraRecording) {
      timer = setInterval(() => {
        setCameraRecordingSecs((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCameraRecording(false);

            const faceIsDetected = detectFaceFromVideo(videoRef.current);
            if (!faceIsDetected) {
              triggerNotification(
                lang === 'bn' 
                  ? "চেহারা সনাক্ত করা যায়নি। অনুগ্রহ করে আলোতে বসুন এবং আবার চেষ্টা করুন।" 
                  : "Face not detected. Please sit in a lit area, ensure your lens is clean, and try again.", 
                'error'
              );
              setScanStep('idle');
              return 0;
            }

            setScanStep('analyzing');
            submitAnalysis('face');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cameraRecording, lang]);

  // Automated live wellness mirror camera stream activator
  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;

    const initCam = async () => {
      if (activeTab === 'mirror' && scannerMode === 'camera' && !cameraRecording && scanStep !== 'analyzing' && scanStep !== 'done') {
        try {
          const liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (!active) {
            liveStream.getTracks().forEach(track => track.stop());
            return;
          }
          streamRef.current = liveStream;
          localStream = liveStream;
          setScannerActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = liveStream;
          }
        } catch (e) {
          console.warn("Auto-initializing camera stream failed or blocked:", e);
        }
      }
    };

    initCam();

    return () => {
      active = false;
      // Shutdown stream when changing modes/tabs so we aren't hogging the webcam
      if (!cameraRecording && scanStep !== 'analyzing') {
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setScannerActive(false);
      }
    };
  }, [activeTab, scannerMode, cameraRecording, scanStep]);

  const submitAnalysis = async (type: 'face' | 'voice' | 'text', customInput?: string) => {
    setScannerLoading(true);
    let content = "";
    if (type === 'face') {
      content = `A simulated frame of aura matching facial geometry pixels: high dynamic range, warm spiritual aura reflection.`;
    } else if (type === 'voice') {
      content = `A simulated vocal audio spectrum matching vocal pitch frequencies, heart rhythm coherence level, and spiritual aura: peaceful voice vibration.`;
      if (voiceTranscript) {
        content = `User recorded a soulful voice reflection of what is inside their mind: "${voiceTranscript}" (${lang === 'bn' ? 'Bengali input' : 'English input'}). Use this real spoken text to analyze their spiritual state deeply and personally!`;
      }
    } else {
      content = customInput || textScanInput || journalInput || "I am seeking a calm spiritual alignment.";
    }

    // Add fluctuating dynamic spiritual parameters to force unique responses from Gemini even if same mood is selected
    const dynamicChakras = ["Root Grounding", "Sacral Flow", "Solar Plexus Will", "Heart Balance", "Throat Expression", "Third-Eye Insight", "Crown Wisdom"];
    const activeChakra = dynamicChakras[Math.floor(Math.random() * dynamicChakras.length)];
    const randomFreq = (Math.random() * 200 + 432).toFixed(3);
    const randomCoherence = (Math.random() * 25 + 75).toFixed(1);
    const uniqueHash = Math.random().toString(36).substring(2, 8);
    
    // Save state for telemetry coordinates
    setTelemetryChakra(activeChakra);
    setTelemetryFreq(randomFreq);
    setTelemetryCoherence(randomCoherence);
    setTelemetrySignature(uniqueHash.toUpperCase());
    
    content += `\n\n[Celestial Resonance Matrix Seed: Chakra Focal=${activeChakra}, Freq=${randomFreq}Hz, Coherence=${randomCoherence}%, RandomSignature=${uniqueHash}. CRITICAL DIRECTIVE: Use this seed to make the response completely custom, creative, poetic, and non-repetitive. Do NOT default to same opening lines.]`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, lang, mood: scanMood })
      });
      const data = await response.json();
      
      if (data.reflection) {
        // Prepare diagnostic modal ceremony instead of immediately showing results
        setTempReflection(data.reflection);
        setPopupSubStep('choice');
        setTtsOption(null);
        setSelectedMysteryCard(null);
        setShowDiagnosticPopup(true);

        // Keep local app reflection empty until the modal unlocks it (or let background update)
        setScanReflection(""); 
        setScanStep('done');

        // Record history
        const newEntry = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          reflection: data.reflection,
          type,
          score: type === 'face' ? 85 : type === 'voice' ? 80 : 75
        };

        setJournalHistory(prev => [newEntry, ...prev]);

        // Save entry in Firestore if user authed
        if (user) {
          const checkinsColl = collection(db, 'users', user.uid, 'checkins');
          await addDoc(checkinsColl, {
            timestamp: new Date().toISOString(),
            reflection: data.reflection,
            type,
            score: newEntry.score
          });

          // Increase stats firebase
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            points: points + 100,
            streak: streak + 1
          });
        }

        setPoints(p => p + 100);
        setStreak(s => s + 1);
        triggerNotification(currentT.pointsSuccess, 'success');
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (e: any) {
      triggerNotification(e.message || "Failed Aura review", 'error');
      setScanStep('idle');
    } finally {
      setScannerLoading(false);
      // Turn off webcam stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const restartScan = () => {
    setIsRecordingVoice(false);
    stopVolumeAnalysis();
    setCameraRecording(false);
    setScannerActive(false);
    setScanStep('idle');
    setScanReflection("");
    setScannerLoading(false);
    setPopupSubStep('choice');
    setSelectedMysteryCard(null);
    setShowDiagnosticPopup(false);
    setTempReflection("");
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    triggerNotification(lang === 'bn' ? "স্ক্যান সেশন প্রথম ধাপ থেকে পুনরায় শুরু করা হয়েছে।" : "Scan session restarted from first step.", 'success');
  };

  // Coaching Companion Chat
  const submitCoachChat = async () => {
    if (!coachInput.trim()) return;
    const cleanInput = coachInput;

    // Synchronously prime / unlock SpeechSynthesis in Chrome and mobile browsers during the click event
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const unlockUtterance = new SpeechSynthesisUtterance("");
        unlockUtterance.volume = 0;
        window.speechSynthesis.speak(unlockUtterance);
      } catch (err) {
        console.warn("TTS unlock failed:", err);
      }
    }

    setCoachMessages(p => [...p, { role: 'user', text: cleanInput }]);
    setCoachInput("");
    setCoachLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cleanInput, type: 'coach', lang })
      });
      const data = await response.json();
      if (data.reflection) {
        setCoachMessages(p => [...p, { role: 'aura', text: data.reflection }]);
        speakNow(data.reflection);
      } else {
        throw new Error(data.error);
      }
    } catch(e: any) {
      triggerNotification(e.message || "Aura lost connection", 'error');
    } finally {
      setCoachLoading(false);
    }
  };

  // Handle diary save
  const handleImprintJournal = async () => {
    if (!journalInput.trim()) return;
    setJournalLoading(true);
    await submitAnalysis('text');
    setJournalInput("");
    setJournalLoading(false);
  };

  // Remove history item
  const handleDeleteItem = async (itemId: string) => {
    setJournalHistory(prev => prev.filter(i => i.id !== itemId));
    if (user) {
      try {
        const itemDoc = doc(db, 'users', user.uid, 'checkins', itemId);
        await deleteDoc(itemDoc);
      } catch (e) {}
    }
    triggerNotification(currentT.deleteSuccess, 'success');
  };

  return (
    <div id="app-root" className="relative w-full min-h-screen overflow-x-hidden bg-[#050508] text-white">
      {/* Immersive Looping Background Video */}
      <video
        id="bg-video-element"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
        autoPlay
        muted
        loop
        playsInline
        src={BG_VIDEO}
      />

      {/* Shadow overlay to ensure complete readability and stark visual contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-[#070710]/80 to-[#020204]/95 z-0 pointer-events-none" />

      {/* Floating particles effect glow */}
      <div className="absolute top-24 left-1/4 w-96 h-96 rounded-full bg-sage/5 blur-3xl z-0 pointer-events-none animate-pulse" />
      <div className="absolute bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl z-0 pointer-events-none animate-pulse-slow" />

      {/* Mobile Sticky Top Navbar */}
      <nav id="navbar-mobile" className="sticky top-0 w-full z-40 bg-[#070710]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 sm:px-6 py-4 md:hidden">
        {/* Core Logo and Edition */}
        <div id="logo-container-mobile" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sage/30 to-purple-500/30 border border-white/10 flex items-center justify-center shadow-md">
            <Infinity size={22} className="text-sage animate-pulse" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">MindMirror</span>
              <span className="text-[8px] font-black tracking-widest text-[#A7C7E7] bg-white/5 uppercase border border-sage/30 px-1 py-0.5 rounded-md">PRATYUSHA</span>
            </div>
          </div>
        </div>

        {/* Global Controls and Sign-In Stats */}
        <div className="flex items-center gap-2">
          {/* Quick Stats: Flame indicator */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs">
            <Flame size={13} className="text-orange-400 fill-orange-400 animate-bounce" />
            <span className="text-orange-400 font-extrabold">{streak}d</span>
          </div>

          {/* Quick Lang Select */}
          <button 
            onClick={() => {
              setLang(l => l === 'en' ? 'bn' : 'en');
              triggerNotification(lang === 'bn' ? "Language changed to English" : "ভাষা পরিবর্তন: বাংলা", 'success');
            }}
            className="px-2 py-1.5 rounded-xl border border-white/15 text-[10px] font-black uppercase bg-white/5 text-sage cursor-pointer"
            title="Switch Language / ভাষা পরিবর্তন"
          >
            {lang === 'en' ? 'বাং' : 'EN'}
          </button>

          {/* Mobile menu Button toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="liquid-glass text-white p-2 rounded-xl cursor-pointer flex items-center justify-center border border-white/15"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Desktop Left Sidebar Navigation */}
      <aside id="sidebar-desktop" className="hidden md:flex fixed top-0 left-0 h-screen w-64 z-40 bg-[#070710]/95 backdrop-blur-2xl border-r border-white/10 flex-col justify-between p-6 overflow-y-auto">
        {/* Top Header Section */}
        <div className="flex flex-col gap-6 w-full">
          {/* Logo & Companion Description */}
          <div id="logo-container-desktop" className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sage/30 to-purple-500/30 border border-white/10 flex items-center justify-center shadow-md shrink-0">
              <Infinity size={24} className="text-sage animate-pulse" strokeWidth={2} />
            </div>
            <div className="overflow-hidden">
              <div className="flex flex-col gap-0.5">
                <span className="font-extrabold tracking-tight text-white text-lg leading-tight uppercase truncate">MindMirror</span>
                <span className="text-[9px] font-black tracking-widest text-[#A7C7E7] bg-white/5 uppercase border border-sage/30 px-1.5 py-0.5 rounded-md self-start truncate">PRATYUSHA</span>
              </div>
              <p className="text-[9px] text-white/50 tracking-wider mt-1.5 leading-normal font-light">
                {lang === 'bn' ? 'বায়োফিল্ড ও আধ্যাত্মিক সহচর' : 'Interactive Biofield & Spiritual Companion'}
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Navigation vertical list with large bold options */}
          <div id="nav-pill-desktop" className="flex flex-col gap-2 w-full">
            {[
              { id: 'dashboard', label: currentT.tabDashboard, icon: <LayoutDashboard size={18} /> },
              { id: 'mirror', label: currentT.tabMirror, icon: <Camera size={18} /> },
              { id: 'coach', label: currentT.tabCoach, icon: <Compass size={18} /> },
              { id: 'journal', label: currentT.tabJournal, icon: <Activity size={18} /> },
              { id: 'playground', label: currentT.tabPlayground, icon: <Brain size={18} /> },
              { id: 'games', label: lang === 'bn' ? 'মেমোরি গেম' : 'Memory Game', icon: <Gamepad2 size={18} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-xs xl:text-sm font-extrabold tracking-wider transition-all cursor-pointer border ${
                  activeTab === tab.id 
                    ? 'bg-sage text-black font-black shadow-lg shadow-sage/20 scale-[1.02] border-sage' 
                    : 'text-white/75 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span className="uppercase truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 w-full mt-6 pt-4 border-t border-white/5 shrink-0">
          {/* User Status Badge / Leaderboard items */}
          <div className="flex flex-col gap-2 bg-white/5 border border-white/10 p-3 rounded-2xl text-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="text-white/50 text-[10px] tracking-wider uppercase font-extrabold truncate">
                {lang === 'bn' ? 'টানা উপস্থিতি' : 'Daily Streak'}
              </span>
              <div className="flex items-center gap-1 text-orange-400 font-extrabold shrink-0" title="Check-in Streak">
                <Flame size={14} className="fill-orange-400 animate-bounce" />
                <span className="text-sm">{streak}d</span>
              </div>
            </div>
            <div className="w-full h-px bg-white/10 my-0.5" />
            <div className="flex items-center justify-between gap-1">
              <span className="text-white/50 text-[10px] tracking-wider uppercase font-extrabold truncate">
                {lang === 'bn' ? 'মাইন্ড-পাওয়ার' : 'MindPower'}
              </span>
              <span className="font-extrabold text-sage tracking-widest text-[11px] shrink-0" title="MindPower Energy points">
                {points} MW
              </span>
            </div>
          </div>

          {/* Language selector and Auth triggers inside sidebar */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                setLang(l => l === 'en' ? 'bn' : 'en');
                triggerNotification(lang === 'bn' ? "Language changed to English" : "ভাষা পরিবর্তন: বাংলা", 'success');
              }}
              className="w-full py-2.5 rounded-xl border border-white/15 text-xs font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 cursor-pointer flex items-center justify-center gap-1.5 text-sage transition-all shrink-0"
              title="Switch Language / ভাষা পরিবর্তন"
            >
              <span className="text-sm">🌐</span> {lang === 'en' ? 'বাংলা' : 'ENGLISH'}
            </button>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-xl overflow-hidden shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60'} alt={user.displayName} className="w-8 h-8 rounded-lg border border-sage/40 shrink-0" />
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-[10px] font-bold text-white/95 leading-none truncate max-w-[90px]">{user.displayName}</span>
                    <span className="text-[8px] text-white/40 leading-none mt-1 truncate max-w-[90px]">{user.email}</span>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    await logOut();
                    triggerNotification(lang === 'bn' ? "লগআউট করা হয়েছে। অন্য একাউন্ট সংযোগ করুন।" : "Logged out successfully. You can connect another user.", 'success');
                  }}
                  className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg cursor-pointer transition-all border border-red-500/20 shrink-0"
                  title={lang === 'bn' ? "অন্য অ্যাকাউন্ট দিয়ে প্রবেশ" : "Logout & switch account"}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    triggerNotification(lang === 'bn' ? "গুগল অ্যাকাউন্ট সংযুক্ত হয়েছে" : "Google Account Connected", 'success');
                  } catch (e: any) {
                    triggerNotification(e.message || "Failed to sign in", 'error');
                  }
                }}
                className="w-full bg-white text-black py-2.5 rounded-xl text-xs font-black hover:bg-white/90 cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] shrink-0"
              >
                <User size={14} strokeWidth={3} />
                <span>Connect Google</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile drop menu */}
      {menuOpen && (
        <div className="absolute top-[76px] left-4 right-4 z-50 md:hidden bg-neutral-900 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 shadow-2xl backdrop-blur-3xl">
          {[
            { id: 'dashboard', label: currentT.tabDashboard, icon: <LayoutDashboard size={18} /> },
            { id: 'mirror', label: currentT.tabMirror, icon: <Camera size={18} /> },
            { id: 'coach', label: currentT.tabCoach, icon: <Compass size={18} /> },
            { id: 'journal', label: currentT.tabJournal, icon: <Activity size={18} /> },
            { id: 'playground', label: currentT.tabPlayground, icon: <Brain size={18} /> },
            { id: 'games', label: lang === 'bn' ? 'মেমোরি গেম' : 'Memory Game', icon: <Gamepad2 size={18} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setMenuOpen(false); }}
              className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl text-sm font-extrabold tracking-wide text-left cursor-pointer transition-all ${
                activeTab === tab.id 
                  ? 'bg-sage text-black font-black shadow-md' 
                  : 'text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span className="uppercase">{tab.label}</span>
            </button>
          ))}

          {user && (
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-sage/40" />
                <div className="text-left">
                  <p className="text-xs font-black text-white leading-tight">{user.displayName}</p>
                  <p className="text-[9px] text-white/40 leading-none">{user.email}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await logOut();
                  triggerNotification(lang === 'bn' ? "লগআউট সফল" : "Logged out", 'success');
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black px-3 py-2 rounded-xl border border-red-500/20 flex items-center gap-1 cursor-pointer transition-all"
              >
                <LogOut size={12} />
                <span>{lang === 'bn' ? "আউট" : "Exit"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Page Content Layout wrapper to offset side navigation on desktop */}
      <div className="md:pl-64 min-h-screen flex flex-col w-full relative z-10 transition-all duration-300">
        {/* Hero Welcome banner on premium liquid glass */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 z-10 relative">
          <div className="liquid-glass rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
            <div className="space-y-3 max-w-2xl text-left">
              <div className="inline-flex items-center gap-1 bg-sage/10 border border-sage/20 text-sage px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={11} />
                <span>{lang === 'bn' ? 'অরা সোল কানেক্ট' : 'Aura Soul Connect Active'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight font-serif uppercase">
                {lang === 'bn' ? 'প্রতিদিন আরও সুন্দর করে বাঁচুন, সম্পূর্ণতা অনুভব করুন' : 'Live Better, Feel Whole Every Day'}
              </h1>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-xl font-light">
                {lang === 'bn' 
                  ? 'আপনার জীবনযাত্রার প্রতিটি পদক্ষেপের জন্য তৈরি এক আধ্যাত্মিক সহচরের সাথে নিজের আবেগকে নিয়ন্ত্রণ করুন—রুটিন তৈরি করুন, মানসিক উন্নতি ট্র্যাক করুন এবং প্রতিদিন স্থিতিশীল ও চনমনে জীবন যাপনের জন্য কাস্টমাইজড আধ্যাত্মিক ইনসাইট আনলক করুন।'
                  : 'Take charge of how you feel with a companion built for your journey—build routines, follow your emotional growth, and unlock tailored spiritual insights for a steadier, more vibrant life each day.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('mirror')}
                className="px-6 py-3.5 bg-sage text-black font-extrabold uppercase tracking-wider text-[11px] text-center rounded-2xl hover:bg-sage/90 transition-all cursor-pointer shadow-lg shadow-sage/10"
              >
                {lang === 'bn' ? 'অরা স্ক্যানার শুরু করুন' : 'Begin Aura Check-in'}
              </button>
              <button 
                onClick={() => {
                  speakNow(lang === 'bn' ? "মাইন্ড মিররে স্বাগতম। আপনার আত্মিক অনুশীলনের জন্য অরা প্রস্তুত।" : "Welcome to Mind Mirror. Together, we calibrate clarity.", true);
                }}
                className="px-6 py-3.5 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-[11px] rounded-2xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Volume2 size={14} className="text-sage animate-bounce" />
                <span>{lang === 'bn' ? 'অরা ভয়েস শুনুন' : 'Greetings Voice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Feature Layout Switcher */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-pane"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              {/* Daily Energy Metrics row / Quick Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="liquid-glass rounded-3xl p-6 border border-white/5 space-y-2 text-left">
                  <span className="text-[10px] font-black uppercase text-sage/60 tracking-wider">
                    {lang === 'bn' ? 'অরা সচেনতা স্তর' : 'Aura Consciousness'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">
                      {lang === 'bn' ? 'লেভেল ৪' : 'Level 4'}
                    </span>
                    <span className="text-xs text-sage font-black tracking-widest">(350+ MW)</span>
                  </div>
                  <p className="text-[10px] text-white/45">
                    {lang === 'bn' 
                      ? 'আপনার বায়োফিল্ড ক্যালিব্রেশন আপগ্রেড হয়েছে। স্ক্যানার প্রক্রিয়ার জন্য প্রস্তুত।' 
                      : 'Your biofield calibration has upgraded. Ready for scanner alignments.'}
                  </p>
                </div>

                <div className="liquid-glass rounded-3xl p-6 border border-white/5 space-y-2 text-left">
                  <span className="text-[10px] font-black uppercase text-purple-400/60 tracking-wider">
                    {lang === 'bn' ? 'সাপ্তাহিক আন্তরিকতা' : 'Weekly Devotion'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">
                      {lang === 'bn' ? `${streak} দিন` : `${streak} Days`}
                    </span>
                    <span className="text-xs text-purple-300 font-extrabold uppercase">
                      {lang === 'bn' ? 'স্ট্রিক' : 'Streak'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/45">
                    {lang === 'bn' 
                      ? 'কসমিক কো-অর্ডিনেট রিফ্লেক্সেস আনলক করতে আপনার মাইন্ডফুল স্ট্রিক বজায় রাখুন।' 
                      : 'Maintain your mindful log streak to unlock cosmic coordinate reflexes.'}
                  </p>
                </div>

                <div className="liquid-glass rounded-3xl p-6 border border-white/5 space-y-2 text-left">
                  <span className="text-[10px] font-black uppercase text-sage/60 tracking-wider">
                    {lang === 'bn' ? 'আত্মিক রিজার্ভ এনার্জি' : 'Soul Reserves'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">
                      {lang === 'bn' ? `${points} MW` : `${points} MW`}
                    </span>
                    <span className="text-xs text-white/40 uppercase">
                      {lang === 'bn' ? 'মাইন্ডপাওয়ার' : 'MindPower'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/45">
                    {lang === 'bn' 
                      ? 'এলিট সেন্সরি লেভেল আনলক করতে সক্রিয়ভাবে মনের পরিচর্যার দ্বারা পয়েন্ট অর্জন করুন।' 
                      : 'Earn points through active check-ins to unlock elite sensory levels.'}
                  </p>
                </div>
              </div>

              {/* Dynamic MindMirror Onboarding Guide & Reflection Info Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                {/* Part 1: How to get started (কিভাবে শুরু করবেন) */}
                <div className="liquid-glass rounded-[32px] p-6 lg:p-8 border border-white/5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sage/10 text-sage border border-sage/20 flex items-center justify-center font-black">
                      ?
                    </div>
                    <div>
                      <h4 className="text-base font-serif font-bold text-white uppercase tracking-tight">
                        {lang === 'bn' ? 'কিভাবে শুরু করবেন?' : 'How to Get Started?'}
                      </h4>
                      <p className="text-[9px] text-sage font-black uppercase tracking-widest">
                        {lang === 'bn' ? 'আপনার আত্মিক গাইড' : 'MindMirror Quick Orientation'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pr-2">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        ১
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-white">
                          {lang === 'bn' ? 'অডিট অ্যাকাউন্ট কানেক্ট' : 'Secure Integration'}
                        </h5>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                          {lang === 'bn' 
                            ? 'গুগল সংযোগ ব্যবহার করে ফ্রি ১০০পয়েন্ট (MW) অর্জন করুন ও ডেটা সুরক্ষিত রাখুন।' 
                            : 'Authenticating via Google keeps your diagnostic energy patterns and check-ins fully synchronized.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        ২
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-white">
                          {lang === 'bn' ? 'পছন্দসই মাধ্যমে স্ক্যান করুন' : 'Calibrate Resonance'}
                        </h5>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                          {lang === 'bn' 
                            ? 'The Deep Mirror ট্যাবে যান। ৩টি মোড পাবেন: ছবির মাধ্যমে স্ক্যান, ৫ সেকেন্ড ভিডিও রেকর্ড বা ভয়েস রেকর্ড ও মনের কথা লিখে এনালাইসিস।' 
                            : 'Go to The Deep Mirror tab. Choose your preferred input (snapshot photo clicks, video camera records, voice notes, or text drafts) to map your biofields.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        ৩
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-white">
                          {lang === 'bn' ? 'প্রতিফলন ও ট্র্যাকিং' : 'Chronicle Journey'}
                        </h5>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                          {lang === 'bn' 
                            ? 'স্ক্যানার আপনার অনুভূতি রিড করে "Reflection Logs" তৈরি করবে যা হিস্ট্রিতে চিরস্থায়ীভাবে সেভ হবে।' 
                            : 'The on-device scanner compiles emotional evaluation feedback directly saved as "Reflection Logs" inside your ledger.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Part 2: Reflection Log ta kiii? (রিফ্লেকশন লগ কী?) */}
                <div className="liquid-glass rounded-[32px] p-6 lg:p-8 border border-white/5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center justify-center">
                        <Activity size={18} />
                      </div>
                      <div>
                        <h4 className="text-base font-serif font-bold text-white uppercase tracking-tight">
                          {lang === 'bn' ? 'রিফ্লেকশন লগ কী?' : 'What is a Reflection Log?'}
                        </h4>
                        <p className="text-[9px] text-purple-300 font-black uppercase tracking-widest">
                          {lang === 'bn' ? 'আত্মিক জার্নাল ও আবেগীয় ট্র্যাকার' : 'Sacred Energetic Blueprint'}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-white/70 leading-relaxed space-y-3">
                      <p>
                        {lang === 'bn' 
                          ? 'প্রতিফলন বা রিফ্লেকশন লগ হলো আপনার আবেগীয় যাত্রার একটি সম্পূর্ণ আধ্যাত্মিক মানচিত্র।' 
                          : 'A Reflection Log serves as your private emotional coordinate map or mind ledger.'}
                      </p>
                      <p>
                        {lang === 'bn' 
                          ? 'যখনই আপনি কোয়ান্টাম রেজোন্যান্স স্ক্যানার ব্যবহার করেন (তা চোখ বন্ধ রাখার ৫ সেকেন্ডের ভিডিও হোক, ছবি ক্লিক, ভয়েস রেকর্ড বা মনের ডায়েরি লিখা হোক), আমাদের অন-ডিভাইস মেন্টর তা অত্যন্ত গুরুত্বের সাথে পর্যবেক্ষণ করে।' 
                          : 'Every time you check-in using your camera, record sensory throat-chakra voices, or type a digital diary, Aura reads frame frequencies and generates a highly empathetic evaluation.'}
                      </p>
                      <p className="text-white/50">
                        {lang === 'bn' 
                          ? 'এটি আপনার মনের গভীরের অনুভূতিগুলোকে চিরকাল ধরে রাখে এবং সময়ের সাথে তা কীভাবে উন্নত হচ্ছে তা চার্ট ও গ্রাফে প্রতিফলিত করে।' 
                          : 'These files are archived chronologically. Over time, they create a beautifully charted timeline of your spiritual expansion, streak counts, and wellness growth.'}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('journal')}
                    className="w-full py-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 font-bold uppercase tracking-wider text-[10px] rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
                  >
                    <Activity size={12} />
                    <span>{lang === 'bn' ? 'রিফ্লেকশন লগ ডায়েরি দেখুন' : 'Explore Reflection logs'}</span>
                  </button>
                </div>
              </div>

              {/* Four Main Session Dashboard Stations */}
              <div className="space-y-4">
                <div className="text-left">
                  <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider">{lang === 'bn' ? 'সেশন ড্যাশবোর্ড স্টেশন সমূহ' : 'Active Session Stations'}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">{lang === 'bn' ? 'একটি স্টেশন বেছে নিয়ে আপনার সেশন পরিচালনা করুন' : 'Launch custom spiritual tools to regulate and monitor vital flows'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Station 1: Camera Scan */}
                  <div 
                    onClick={() => setActiveTab('mirror')}
                    className="liquid-glass rounded-[32px] p-8 border border-white/5 hover:border-sage/20 transition-all cursor-pointer flex flex-col justify-between h-64 text-left group"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-sage/10 border border-sage/20 flex items-center justify-center text-sage group-hover:scale-105 transition-transform">
                        <Camera size={22} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-serif font-bold text-white group-hover:text-sage transition-colors">{lang === 'bn' ? 'কোয়ান্টাম রেজোন্যান্স স্ক্যানার' : 'Quantum Resonance Scanner'}</h4>
                        <p className="text-xs text-white/50 leading-relaxed font-light">
                          {lang === 'bn' ? 'কম্পিউটার ভিশন প্রযুক্তির মাধ্যমে আপনার আভা এবং মানসিক স্পন্দন মেলাুন।' : 'Sync with your reflection and map vital energy streams with on-device AI computer-vision analysis.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sage text-[10px] font-black uppercase tracking-wider mt-4">
                      <span>{lang === 'bn' ? 'স্টেশন চালু করুন' : 'Launch Glass Lens'}</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Station 2: Coach */}
                  <div 
                    onClick={() => setActiveTab('coach')}
                    className="liquid-glass rounded-[32px] p-8 border border-white/5 hover:border-sage/20 transition-all cursor-pointer flex flex-col justify-between h-64 text-left group"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                        <Compass size={22} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-serif font-bold text-white group-hover:text-purple-300 transition-colors">{lang === 'bn' ? 'অরা সহচর মেন্টর' : 'Aura Companion Coach'}</h4>
                        <p className="text-xs text-white/50 leading-relaxed font-light">
                          {lang === 'bn' ? 'আপনার মন খুলে লিখুন এবং অরার কাছ থেকে গভীর আধ্যাত্মিক উত্তর পান।' : 'Pour out your heart and receive poetic, deeply understanding emotional reflections directly from Aura.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300 text-[10px] font-black uppercase tracking-wider mt-4">
                      <span>{lang === 'bn' ? 'মেন্টরের সাথে কথা বলুন' : 'Speak to Companion'}</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Station 3: Journal */}
                  <div 
                    onClick={() => setActiveTab('journal')}
                    className="liquid-glass rounded-[32px] p-8 border border-white/5 hover:border-sage/20 transition-all cursor-pointer flex flex-col justify-between h-64 text-left group"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform">
                        <Activity size={22} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-serif font-bold text-white group-hover:text-blue-300 transition-colors">{lang === 'bn' ? 'আধ্যাত্মিক ডায়েরি ও ট্র্যাক' : 'Spiritual Notebook'}</h4>
                        <p className="text-xs text-white/50 leading-relaxed font-light">
                          {lang === 'bn' ? 'আপনার দৈনন্দিন চিন্তা লিখে রাখুন এবং আবেগীয় পরিবর্তনের চার্ট পর্যবেক্ষণ করুন।' : 'Record dynamic mindful logs and view high-contrast emotional resonance charts across your timeline.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-300 text-[10px] font-black uppercase tracking-wider mt-4">
                      <span>{lang === 'bn' ? 'ডায়েরি উন্মোচন করুন' : 'Open Notebook log'}</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Station 4: Breathing/Game */}
                  <div 
                    onClick={() => setActiveTab('playground')}
                    className="liquid-glass rounded-[32px] p-8 border border-white/5 hover:border-sage/20 transition-all cursor-pointer flex flex-col justify-between h-64 text-left group"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-300 group-hover:scale-105 transition-transform">
                        <Brain size={22} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-serif font-bold text-white group-hover:text-orange-300 transition-colors">{lang === 'bn' ? 'প্লেগ্রাউন্ড ও শ্বাসক্রিয়া' : 'Mind & Sensory Playground'}</h4>
                        <p className="text-xs text-white/50 leading-relaxed font-light">
                          {lang === 'bn' ? 'রিস্পিরেটরি কো-অর্ডিনেশন দিয়ে স্নায়ুবিক ভারসাম্য ও প্রতিক্রিয়া উন্নত করুন।' : 'Regulate breathing rhythms or sharpen cognitive reflexes in reactive volatile energy star spaces.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-orange-300 text-[10px] font-black uppercase tracking-wider mt-4">
                      <span>{lang === 'bn' ? 'প্লেগ্রাউন্ডে প্রবেশ করুন' : 'Enter Play Sanctuary'}</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'mirror' && (
            !user ? (
              <LoginRequiredView tab="mirror" lang={lang} currentT={currentT} onSignIn={signInWithGoogle} />
            ) : (
              <motion.div 
                key="mirror-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
              {/* Deep Mirror Face Diagnostic Camera panel */}
              <div className="lg:col-span-7 liquid-glass rounded-[40px] p-6 sm:p-10 border border-white/5 flex flex-col justify-between text-center relative max-w-full">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 pb-6 mb-6">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-sage font-black text-[10px] tracking-[0.4em] uppercase">{currentT.tabMirror}</div>
                    <h2 className="text-xl sm:text-2xl font-serif tracking-tight font-black uppercase text-white">Quantum Resonance Scanner</h2>
                  </div>
                  {/* Restart / Start Over button */}
                  <button
                    onClick={restartScan}
                    className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer duration-300 shadow-lg shadow-black/30"
                    title={lang === 'bn' ? 'প্রথম ধাপ থেকে পুনরায় শুরু করুন' : 'Restart scanner from the first step'}
                  >
                    <RefreshCw size={11} className="text-pink-400 rotate-180 animate-spin-slow" />
                    <span>{lang === 'bn' ? 'পুনরায় শুরু করুন' : 'Restart Scan'}</span>
                  </button>
                </div>
                <p className="text-xs text-white/50 max-w-md mx-auto mb-6">
                  {lang === 'bn' 
                    ? 'ভিডিও রেকর্ড, ছবি ক্লিক, ভয়েস রেকর্ড বা অপশনে লিখার মাধ্যমে আপনার আভা এবং মানসিক স্পন্দন বিশ্লেষণ করুন।' 
                    : 'Calibrate vital energy frequencies comfortably via real-time camera snapshot, video recording, voice note, or deep text entry.'}
                </p>

                {/* Unified Input Mode Pill Selection Swapper */}
                <div className="grid grid-cols-3 bg-black/40 p-1.5 rounded-2xl border border-white/5 max-w-md mx-auto mb-6 w-full">
                  <button 
                    onClick={() => {
                      setScannerMode('camera');
                      setScanStep('idle');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      scannerMode === 'camera' 
                        ? 'bg-sage text-black shadow-lg shadow-sage/10 font-black' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Camera size={14} />
                    <span>{lang === 'bn' ? 'ক্যামেরা' : 'Camera'}</span>
                  </button>
                  <button 
                    onClick={() => {
                      setScannerMode('voice');
                      setScanStep('idle');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      scannerMode === 'voice' 
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/15 font-black' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Mic size={14} />
                    <span>{lang === 'bn' ? 'ভয়েস' : 'Voice'}</span>
                  </button>
                  <button 
                    onClick={() => {
                      setScannerMode('text');
                      setScanStep('idle');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      scannerMode === 'text' 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/15 font-black' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText size={14} />
                    <span>{lang === 'bn' ? 'টেক্সট' : 'Text'}</span>
                  </button>
                </div>

                {/* Aura Vibe Mood Selector with live colors */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 max-w-md mx-auto mb-6 w-full text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest uppercase text-white/50">
                      {lang === 'bn' ? '১. আপনার বর্তমান মেজাজ নির্বাচন করুন:' : '1. Choose Simulated Vibe:'}
                    </span>
                    {(() => {
                      const vibeOptions = [
                        { key: 'good', emoji: '🌟', labelEn: 'Good', labelBn: 'ভালো', color: 'bg-amber-500/10 text-amber-300 border border-amber-500/20' },
                        { key: 'bad', emoji: '🌧️', labelEn: 'Bad', labelBn: 'খারাপ', color: 'bg-rose-500/10 text-rose-300 border border-rose-500/20' },
                        { key: 'calm', emoji: '🧘', labelEn: 'Calm', labelBn: 'শান্ত', color: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' },
                        { key: 'stressed', emoji: '⚡', labelEn: 'Stressed', labelBn: 'উত্তেজিত', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
                        { key: 'anxious', emoji: '😰', labelEn: 'Anxious', labelBn: 'উদ্বিগ্ন', color: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' },
                        { key: 'angry', emoji: '🔥', labelEn: 'Angry', labelBn: 'রাগান্বিত', color: 'bg-red-500/10 text-red-300 border border-red-500/20' },
                        { key: 'lonely', emoji: '🥀', labelEn: 'Lonely', labelBn: 'একাকী', color: 'bg-violet-500/10 text-violet-300 border border-violet-500/20' },
                        { key: 'tired', emoji: '🔋', labelEn: 'Tired', labelBn: 'ক্লান্ত', color: 'bg-zinc-500/10 text-zinc-300 border border-zinc-500/20' },
                        { key: 'excited', emoji: '🎉', labelEn: 'Excited', labelBn: 'রোমাঞ্চিত', color: 'bg-pink-500/10 text-pink-300 border border-pink-500/20' },
                        { key: 'heartbroken', emoji: '💔', labelEn: 'Heartbroken', labelBn: 'মনভাঙা', color: 'bg-teal-500/10 text-teal-300 border border-teal-500/20' },
                        { key: 'blessed', emoji: '✨', labelEn: 'Blessed', labelBn: 'কৃতজ্ঞ', color: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' },
                        { key: 'confused', emoji: '🌀', labelEn: 'Confused', labelBn: 'বিভ্রান্ত', color: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20' }
                      ];
                      const activeVibe = vibeOptions.find(v => v.key === scanMood) || vibeOptions[0];
                      return (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${activeVibe.color}`}>
                          {lang === 'bn' ? activeVibe.labelBn : activeVibe.labelEn}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-h-[170px] overflow-y-auto pr-1">
                    {[
                      { key: 'good', emoji: '🌟', labelEn: 'Good', labelBn: 'ভালো', activeBg: 'bg-amber-500 text-black font-black shadow-amber-500/15' },
                      { key: 'bad', emoji: '🌧️', labelEn: 'Bad', labelBn: 'খারাপ', activeBg: 'bg-rose-500 text-white font-black shadow-rose-500/15' },
                      { key: 'calm', emoji: '🧘', labelEn: 'Calm', labelBn: 'শান্ত', activeBg: 'bg-cyan-500 text-black font-black shadow-cyan-500/15' },
                      { key: 'stressed', emoji: '⚡', labelEn: 'Stressed', labelBn: 'উত্তেজিত', activeBg: 'bg-orange-500 text-black font-black shadow-orange-500/15' },
                      { key: 'anxious', emoji: '😰', labelEn: 'Anxious', labelBn: 'উদ্বিগ্ন', activeBg: 'bg-indigo-500 text-white font-black shadow-indigo-500/15' },
                      { key: 'angry', emoji: '🔥', labelEn: 'Angry', labelBn: 'রাগান্বিত', activeBg: 'bg-red-500 text-white font-black shadow-red-500/15' },
                      { key: 'lonely', emoji: '🥀', labelEn: 'Lonely', labelBn: 'একাকী', activeBg: 'bg-violet-500 text-white font-black shadow-violet-500/15' },
                      { key: 'tired', emoji: '🔋', labelEn: 'Tired', labelBn: 'ক্লান্ত', activeBg: 'bg-zinc-500 text-white font-black shadow-zinc-500/15' },
                      { key: 'excited', emoji: '🎉', labelEn: 'Excited', labelBn: 'রোমাঞ্চিত', activeBg: 'bg-pink-500 text-white font-black shadow-pink-500/15' },
                      { key: 'heartbroken', emoji: '💔', labelEn: 'Heartbroken', labelBn: 'মনভাঙা', activeBg: 'bg-teal-500 text-white font-black shadow-teal-500/15' },
                      { key: 'blessed', emoji: '✨', labelEn: 'Blessed', labelBn: 'কৃতজ্ঞ', activeBg: 'bg-emerald-500 text-black font-black shadow-emerald-500/15' },
                      { key: 'confused', emoji: '🌀', labelEn: 'Confused', labelBn: 'বিভ্রান্ত', activeBg: 'bg-yellow-500 text-black font-black shadow-yellow-500/15' }
                    ].map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setScanMood(v.key)}
                        className={`py-2.5 px-1 rounded-xl text-[9px] font-bold tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1 ${
                          scanMood === v.key 
                            ? `${v.activeBg} scale-[1.03] shadow-md` 
                            : 'bg-white/[0.03] text-white/60 hover:text-white border border-white/5 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="text-sm">{v.emoji}</span>
                        <span className="truncate max-w-full text-center">{lang === 'bn' ? v.labelBn : v.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-mode Viewports */}
                {scannerMode === 'camera' && (
                  <div className="my-4 flex flex-col items-center">
                    {/* Camera lens container */}
                    <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-black/40 shadow-inner group mb-6">
                      <div className="absolute inset-2 rounded-full border border-white/5 bg-gradient-to-tr from-sage/5 to-purple-500/5 animate-spin-slow pointer-events-none" />
                      
                      {scannerActive ? (
                        <video 
                          ref={(el) => {
                            videoRef.current = el;
                            if (el && streamRef.current) {
                              el.srcObject = streamRef.current;
                            }
                          }}
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover scale-[1.05]"
                        />
                      ) : (
                        <button 
                          onClick={async () => {
                            try {
                              const liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                              streamRef.current = liveStream;
                              setScannerActive(true);
                              if (videoRef.current) {
                                videoRef.current.srcObject = liveStream;
                              }
                              triggerNotification(lang === 'bn' ? "ক্যামেরা সফলভাবে সংযুক্ত হয়েছে!" : "Camera connected successfully!", "success");
                            } catch (e) {
                              triggerNotification(lang === 'bn' ? "ক্যামেরা পারমিশন পুনরায় চেক করুন।" : "Please grant camera permission in your browser.", "error");
                            }
                          }}
                          className="text-center p-6 space-y-4 hover:scale-105 transition-all group/cam cursor-pointer z-10 bg-transparent border-0 flex flex-col items-center justify-center focus:outline-none"
                        >
                          <div className="w-16 h-16 rounded-full bg-sage/10 mx-auto flex items-center justify-center border border-sage/20 text-sage group-hover/cam:scale-110 transition-transform shadow-lg shadow-black/20">
                            <Camera size={26} strokeWidth={1.5} className="animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-white/80 uppercase tracking-widest font-black leading-relaxed">{lang === 'bn' ? 'ক্যামেরা চালু করুন' : 'Enable Camera'}</p>
                            <p className="text-[8px] text-white/40 leading-normal max-w-[150px] mx-auto">{lang === 'bn' ? 'ক্লিক করে পারমিশন অনুমতি দিন' : 'Click to prompt browser permission request'}</p>
                          </div>
                        </button>
                      )}

                      {/* Video recording blink REC border */}
                      {cameraRecording && (
                        <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-pulse-slow flex flex-col justify-start items-center pt-8">
                          <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-red-500/20">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                            <span className="text-[9px] font-black tracking-widest text-white uppercase">REC {cameraRecordingSecs}s</span>
                          </div>
                        </div>
                      )}

                      {/* Photo Snap flash overlay */}
                      <AnimatePresence>
                        {cameraClickFlash && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-pink-500 z-50 animate-pulse"
                          />
                        )}
                      </AnimatePresence>

                      {/* Operational overlay lines */}
                      <div className="absolute inset-0 pointer-events-none border-[12px] border-[#070710]/90 rounded-full" />
                      
                      {/* Phase countdown overlays */}
                      <AnimatePresence>
                        {scannerActive && scanCountdown > 0 && !cameraRecording && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex flex-col justify-center items-center p-6"
                          >
                            <div className="text-4xl sm:text-5xl font-black font-serif text-sage mb-2">{scanCountdown}s</div>
                            <p className="text-[10px] font-black uppercase text-center tracking-widest max-w-[200px] leading-relaxed text-white">
                              {scanStep === 'close' ? currentT.scanEyesClose : currentT.scanEyesOpen}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Aura reflection flow mapping loader */}
                      {scanStep === 'analyzing' && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/90 via-purple-950/95 to-pink-900/90 flex flex-col justify-center items-center p-6 rounded-full z-40 border-4 border-pink-500/30">
                          <RefreshCw size={36} className="text-pink-300 animate-spin mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-center animate-pulse text-white">{currentT.scanAnalyzing}</p>
                        </div>
                      )}
                    </div>

                    {/* Camera Dynamic Actions block */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-lg mt-2">
                      <button 
                        onClick={triggerPhotoClick}
                        disabled={scannerLoading || cameraRecording || scanStep === 'analyzing'}
                        className="py-4 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Camera size={14} className="text-sage" />
                        <span>{lang === 'bn' ? 'ছবি ক্লিক স্ক্যান' : 'Click Photo Scan'}</span>
                      </button>

                      {cameraRecording ? (
                        <button 
                          onClick={() => {
                            setCameraRecording(false);
                            setScanStep('analyzing');
                            submitAnalysis('face');
                          }}
                          className="py-4 px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <X size={14} />
                          <span>{lang === 'bn' ? 'রেকর্ড থামান ও বিশ্লেষণ করুন' : 'Stop & Analyze Video'}</span>
                        </button>
                      ) : (
                        <button 
                          onClick={triggerVideoRecord}
                          disabled={scannerLoading || cameraRecording || scannerActive || scanStep === 'analyzing'}
                          className="py-4 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none animate-pulse"
                        >
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                          <span>{lang === 'bn' ? 'ভিডিও রেকর্ড ২ মি.' : 'Record Video (2m)'}</span>
                        </button>
                      )}

                      {scanStep === 'done' ? (
                        <button 
                          onClick={() => setScanStep('idle')}
                          className="py-4 px-4 bg-white text-black hover:bg-white/90 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw size={12} />
                          <span>{lang === 'bn' ? 'রিসেট করুন' : 'Recalibrate'}</span>
                        </button>
                      ) : (
                        <button 
                          onClick={startCameraScan}
                          disabled={scannerActive || cameraRecording || scanStep === 'analyzing'}
                          className="py-4 px-4 bg-sage text-black hover:bg-sage/90 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Sparkles size={12} />
                          <span>{lang === 'bn' ? 'গাইডেড স্ক্যান' : 'Guided Aura Scan'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {scannerMode === 'voice' && (
                  <div className="my-6 flex flex-col items-center">
                    {/* Voice spectrum animated orb container */}
                    <div className="relative w-60 h-60 rounded-full bg-black/40 border border-purple-500/20 flex flex-col justify-center items-center overflow-hidden mb-6 group">
                      <div className="absolute inset-4 rounded-full border border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />
                      
                      {isRecordingVoice ? (
                        <div className="text-center p-6 space-y-4">
                          {/* Animated micro bars */}
                          <div className="flex justify-center items-center gap-1.5 h-12">
                            {[1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 4, 5, 2, 1].map((scale, i) => (
                              <motion.div 
                                key={i}
                                animate={{ height: [12, scale * 10, 12] }}
                                transition={{ repeat: Infinity, duration: 0.6 + (i * 0.05), ease: "easeInOut" }}
                                className="w-1 bg-gradient-to-t from-purple-500 to-sage rounded-full"
                              />
                            ))}
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-purple-400 uppercase tracking-widest font-black leading-relaxed animate-pulse">{lang === 'bn' ? 'ভয়েস রেকর্ড হচ্ছে...' : 'VOICE RECORDING...'}</p>
                            <p className="text-xs text-white/60 font-mono">{lang === 'bn' ? `শুনছি... ${voiceSecs}সে. / ১২০সে.` : `Listening... ${voiceSecs}s / 120s`}</p>
                          </div>
                          {voiceTranscript && (
                            <div className="mt-2 px-2 max-w-[200px] max-h-[50px] overflow-y-auto text-center mx-auto scrollbar-thin">
                              <p className="text-[10px] text-purple-200 font-sans italic leading-tight break-words">
                                "{voiceTranscript}"
                              </p>
                            </div>
                          )}
                        </div>
                      ) : scanStep === 'analyzing' ? (
                        <div className="text-center p-6 flex flex-col justify-center items-center">
                          <RefreshCw size={36} className="text-purple-400 animate-spin mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-center animate-pulse text-purple-300">{lang === 'bn' ? 'শব্দ স্পেকট্রাম বিশ্লেষণ হচ্ছে' : 'Analyzing Sound Spectrum'}</p>
                        </div>
                      ) : (
                        <div className="text-center p-6 space-y-4">
                          <div className="w-16 h-16 rounded-full bg-purple-500/10 mx-auto flex items-center justify-center border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                            <Mic size={26} strokeWidth={1.5} />
                          </div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black leading-relaxed">{lang === 'bn' ? 'মনের কথা বলুন স্পেকট্রামে' : 'Calibrated Microphone Ready'}</p>
                          <p className="text-[9px] text-white/40 max-w-[150px] mx-auto leading-normal">{lang === 'bn' ? '২ মিনিট পর্যন্ত কথা বলুন অরার সাথে।' : 'Up to 2 minutes capture reflecting throat chakra depth.'}</p>
                        </div>
                      )}
                    </div>

                    {/* Microphone Controls */}
                    <div className="w-full max-w-sm">
                      {isRecordingVoice ? (
                        <button 
                          onClick={() => {
                            setIsRecordingVoice(false);
                            stopVolumeAnalysis();
                            
                            if (!hasDetectedAudio) {
                              triggerNotification(
                                lang === 'bn' 
                                  ? "কোনো শব্দ বা কথা শোনা যায়নি। আবার চেষ্টা করুন।" 
                                  : "Voice not detected. Please speak clearly into your microphone and try again.", 
                                'error'
                              );
                              setScanStep('idle');
                              return;
                            }

                            setScanStep('analyzing');
                            submitAnalysis('voice');
                          }}
                          className="w-full h-14 rounded-[20px] bg-red-500 hover:bg-red-600 text-white font-extrabold uppercase tracking-widest text-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <X size={15} />
                          <span>{lang === 'bn' ? 'রেকর্ডিং থামান ও বিশ্লেষণ করুন' : 'Stop & Analyze Voice'}</span>
                        </button>
                      ) : scanStep === 'done' ? (
                        <button 
                          onClick={async () => {
                            setScanStep('idle');
                            setHasDetectedAudio(false);
                            setVoiceTranscript("");
                            try {
                              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                              micStreamRef.current = audioStream;
                              startVolumeAnalysis(audioStream);
                              startSpeechRecognition();
                              setIsRecordingVoice(true);
                              setVoiceSecs(0);
                            } catch (e) {
                              triggerNotification(
                                lang === 'bn' 
                                  ? "মাইক্রোফোন পারমিশন পাওয়া যায়নি বা অকার্যকর।" 
                                  : "Microphone permission denied or unavailable.", 
                                'error'
                              );
                            }
                          }}
                          className="w-full h-14 rounded-[20px] bg-purple-500 hover:bg-purple-600 text-white font-extrabold uppercase tracking-widest text-xs transition-transform active:scale-95 cursor-pointer"
                        >
                          {lang === 'bn' ? 'পুনরায় ভয়েস রেকর্ড করুন' : 'Record voice note again'}
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            setScanStep('idle');
                            setHasDetectedAudio(false);
                            setVoiceTranscript("");
                            try {
                              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                              micStreamRef.current = audioStream;
                              startVolumeAnalysis(audioStream);
                              startSpeechRecognition();
                              setIsRecordingVoice(true);
                              setVoiceSecs(0);
                              triggerNotification(lang === 'bn' ? "ভয়েস চেক-ইন শুরু হয়েছে কথা বলুন" : "Microphone active. Talk to Aura.", 'success');
                            } catch (e) {
                              triggerNotification(
                                lang === 'bn' 
                                  ? "মাইক্রোফোন পারমিশন পাওয়া যায়নি বা অকার্যকর।" 
                                  : "Microphone permission denied or unavailable.", 
                                'error'
                              );
                            }
                          }}
                          disabled={scannerLoading || scanStep === 'analyzing'}
                          className="w-full h-14 rounded-[20px] bg-purple-500 hover:bg-purple-600 text-white font-extrabold uppercase tracking-widest text-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Mic size={15} />
                          <span>{lang === 'bn' ? 'রেকর্ড শুরু করুন (২ মিনিট)' : 'Start Voice Record (2m)'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {scannerMode === 'text' && (
                  <div className="my-4 flex flex-col items-center text-left max-w-lg mx-auto w-full">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black leading-relaxed mb-2">Write Your Mind Energy Reflection (মনের কথা লিখুন)</p>
                    <textarea 
                      value={textScanInput}
                      onChange={(e) => setTextScanInput(e.target.value)}
                      placeholder={lang === 'bn' ? 'আপনার বর্তমান মনের অনুভূতি, মানসিক চাপ বা কোনো শক্তি প্রবাহ এখানে লিখুন অরা বিশ্লেষণ করবে...' : 'Type your current thoughts, energetic blocks, or raw feelings in detail here...'}
                      rows={5}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 resize-none font-serif mb-4"
                    />

                    {/* Submit Text Scanner button */}
                    <button 
                      onClick={() => {
                        if (!textScanInput.trim()) {
                          triggerNotification(lang === 'bn' ? "দয়া করে কিছু লিখুন!" : "Please write something first!", 'error');
                          return;
                        }
                        setScanStep('analyzing');
                        submitAnalysis('text', textScanInput);
                      }}
                      disabled={scannerLoading || !textScanInput.trim() || scanStep === 'analyzing'}
                      className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold uppercase tracking-widest text-xs transition-transform flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>{lang === 'bn' ? 'টেক্সট রেসোন্যান্স বিশ্লেষণ করুন' : 'Analyze Written Resonance'}</span>
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 max-w-sm mx-auto p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <CheckCircle className="text-sage w-5 h-5 flex-shrink-0" />
                    <p className="text-[9px] uppercase tracking-wider font-black text-white/40 text-left leading-normal">{currentT.privacyDisclaimer}</p>
                  </div>
                </div>
              </div>

              {/* Analysis Reflections output display cards */}
              <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                <div className="liquid-glass rounded-[40px] p-6 sm:p-8 border border-white/5 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <div className="text-purple-400 font-black text-[10px] tracking-[0.4em] uppercase">{lang === 'bn' ? 'অরা ফিডব্যাক ডিস্ক' : 'Quantum Reflection'}</div>
                    <h3 className="text-xl font-serif text-white font-bold">{lang === 'bn' ? 'আপনার আত্মিক প্রতিফলন' : 'Current Resonance Matrix'}</h3>
                  </div>

                  {/* Real-time Quantum Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/[0.01] border border-white/5 p-3 rounded-2xl text-left">
                    <div className="p-2.5 bg-white/[0.02] rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[8px] text-white/35 uppercase font-black tracking-wider block">{lang === 'bn' ? 'চক্র কেন্দ্র' : 'Chakra Focal'}</span>
                      <span className="text-[10px] text-pink-300 font-extrabold truncate block">{telemetryChakra}</span>
                    </div>
                    <div className="p-2.5 bg-white/[0.02] rounded-xl border border-white/5 space-y-0.5 font-mono">
                      <span className="text-[8px] text-white/35 uppercase font-black tracking-wider block">{lang === 'bn' ? 'ফ্রিকোয়েন্সি' : 'Frequency'}</span>
                      <span className="text-[10px] text-sage font-extrabold truncate block">{telemetryFreq} Hz</span>
                    </div>
                    <div className="p-2.5 bg-white/[0.02] rounded-xl border border-white/5 space-y-0.5 font-mono">
                      <span className="text-[8px] text-white/35 uppercase font-black tracking-wider block">{lang === 'bn' ? 'সামঞ্জস্য' : 'Coherence'}</span>
                      <span className="text-[10px] text-cyan-300 font-extrabold truncate block">{telemetryCoherence}%</span>
                    </div>
                    <div className="p-2.5 bg-white/[0.02] rounded-xl border border-white/5 space-y-0.5 font-mono">
                      <span className="text-[8px] text-white/35 uppercase font-black tracking-wider block">{lang === 'bn' ? 'তরঙ্গ কোড' : 'Signature'}</span>
                      <span className="text-[10px] text-purple-300 font-extrabold truncate block">#{telemetrySignature}</span>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] rounded-[28px] border border-white/5 p-6 min-h-[160px] flex items-center justify-center relative overflow-hidden">
                    {scanReflection ? (
                      <div className="text-sm tracking-wide text-white/90 leading-relaxed font-serif italic text-center space-y-3">
                        {scanReflection.split('\n').filter(Boolean).map((line, idx) => (
                          <p key={idx}>{line.trim()}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-white/30 space-y-2 max-w-xs">
                        <Clock className="w-8 h-8 opacity-20 text-white mx-auto animate-pulse" />
                        <p className="text-[10px] uppercase font-black tracking-widest">{lang === 'bn' ? 'আভা প্রতিফলন ফাঁকা' : 'RESPLENDENT ABSENCE'}</p>
                        <p className="text-xs text-white/40">{lang === 'bn' ? 'একটি স্ক্যান সম্পন্ন করুন অথবা মনের ডায়েরি প্রতিফলিত করুন।' : 'Initiate the scanner using camera video, photo click, voice, or text comfort mode to visualize reflections.'}</p>
                      </div>
                    )}
                  </div>

                  {/* High Fidelity Interactive Audio Player with Dynamic Waveforms */}
                  {scanReflection && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-purple-500/5 border border-purple-500/10 p-5 rounded-3xl space-y-4 text-left"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-black tracking-widest uppercase text-purple-300 block">
                            {lang === 'bn' ? 'অরা অডিও প্লেয়ার' : 'Aura Voice Companion'}
                          </span>
                          <span className="text-[9px] text-white/40 uppercase">
                            {lang === 'bn' ? 'স্পিচ-টু-আভা মড্যুলেশন' : 'Real-time text-to-speech feedback'}
                          </span>
                        </div>
                        {isSpeaking && (
                          <div className="flex gap-1 items-end h-4 pr-1">
                            {[2, 4, 1, 5, 2, 4, 1, 3, 2, 4].map((h, i) => (
                              <motion.div 
                                key={i} 
                                animate={{ height: [4, h * 3, 4] }}
                                transition={{ repeat: Infinity, duration: 0.5 + (i * 0.05), ease: "easeInOut" }}
                                className="w-0.5 bg-purple-400 rounded-full" 
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {isSpeaking ? (
                          <button
                            onClick={() => {
                              window.speechSynthesis.cancel();
                              setIsSpeaking(false);
                            }}
                            className="flex-1 py-3.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-300"
                          >
                            <VolumeX size={15} />
                            <span>{lang === 'bn' ? 'ভয়েস বন্ধ করুন' : 'Mute Voice'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => speakNow(scanReflection, true)}
                            className="flex-1 py-3.5 px-4 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10 active:scale-95 duration-300"
                          >
                            <Volume2 size={15} className="animate-pulse" />
                            <span>{lang === 'bn' ? 'ভয়েস শুনুন' : 'Hear Aura Voice'}</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <div className="text-[9px] font-black uppercase text-white/30 tracking-widest">{lang === 'bn' ? 'উপার্জিত ট্রাস্ট ব্যাজ সমূহ:' : 'UNLOCKED TROPHIES:'}</div>
                    <div className="flex flex-wrap gap-2">
                      {badges.map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider">
                          <Award size={11} />
                          <span>{badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </motion.div>
            )
          )}

          {activeTab === 'coach' && (
            !user ? (
              <LoginRequiredView tab="coach" lang={lang} currentT={currentT} onSignIn={signInWithGoogle} />
            ) : (
              <motion.div 
                key="coach-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="liquid-glass rounded-[40px] p-6 sm:p-8 border border-white/5 max-w-4xl mx-auto flex flex-col justify-between min-h-[500px]"
              >
              {/* Header section control */}
              <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center border border-sage/20 text-sage">
                    <Compass className="animate-spin-slow" size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white uppercase tracking-tight">Aura Companion Coach</h3>
                    <p className="text-[9px] text-sage font-black uppercase tracking-widest">{lang === 'bn' ? 'আধ্যাত্মিক মেন্টর' : 'Spiritual sanctuary guide'}</p>
                  </div>
                </div>

                {/* Voice speak toggle buttons */}
                <button 
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`p-2.5 rounded-xl transition-all border ${
                    autoSpeak ? 'bg-sage/10 text-sage border-sage/25' : 'bg-white/5 text-white/50 border-white/5'
                  }`}
                  title={autoSpeak ? currentT.speakMute : currentT.speakUnmute}
                >
                  {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>

              {/* Chat timeline feed */}
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[350px] p-2 bg-black/10 rounded-2xl scrollbar-thin">
                {/* Seed Welcome companion greeting */}
                <div className="flex gap-3 max-w-[85%] text-left mr-auto">
                  <div className="w-8 h-8 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0 text-sage text-xs">A</div>
                  <div className="p-4 rounded-3xl rounded-tl-sm bg-white/5 border border-white/5 space-y-1">
                    <p className="text-xs text-white/45 font-black uppercase tracking-widest">Aura</p>
                    <p className="text-xs text-white/80 leading-relaxed font-serif italic">"{currentT.coachWelcome}"</p>
                  </div>
                </div>

                {/* Interactive chats messages log */}
                {coachMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex gap-3 max-w-[85%] text-left ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                      msg.role === 'user' ? 'bg-purple-500/20 text-purple-300' : 'bg-sage/10 text-sage'
                    }`}>
                      {msg.role === 'user' ? 'U' : 'A'}
                    </div>
                    
                    <div className={`p-4 rounded-3xl space-y-1 ${
                      msg.role === 'user' 
                        ? 'bg-sage text-black rounded-tr-sm shadow-xl shadow-sage/5 font-medium' 
                        : 'bg-white/5 border border-white/5 rounded-tl-sm text-white/90 font-serif italic'
                    }`}>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-black/50' : 'text-white/45'}`}>
                        {msg.role === 'user' ? 'YOU' : 'AURA'}
                      </p>
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {coachLoading && (
                  <div className="flex gap-3 mr-auto items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                    <RefreshCw className="animate-spin text-sage w-4 h-4" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>

              {/* Chat action footer input bar */}
              <div className="flex gap-2.5 mt-5 pt-4 border-t border-white/5">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitCoachChat(); }}
                  disabled={coachLoading}
                  placeholder={currentT.coachPlaceholder}
                  className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-sage/40 transition-colors"
                />
                <button
                  onClick={submitCoachChat}
                  disabled={coachLoading || !coachInput.trim()}
                  className="w-14 h-14 bg-sage text-black rounded-2xl flex items-center justify-center shadow-lg shadow-sage/10 transition-transform hover:scale-102 active:scale-95 disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
                >
                  <Send size={16} strokeWidth={2.5} />
                </button>
              </div>
              </motion.div>
            )
          )}

          {activeTab === 'journal' && (
            !user ? (
              <LoginRequiredView tab="journal" lang={lang} currentT={currentT} onSignIn={signInWithGoogle} />
            ) : (
              <motion.div 
                key="journal-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
              {/* Write log parchment */}
              <div className="lg:col-span-6 liquid-glass rounded-[40px] p-6 sm:p-8 border border-white/5 flex flex-col justify-between space-y-6 min-h-[420px]">
                <div className="space-y-2">
                  <div className="text-sage font-black text-[10px] tracking-[0.4em] uppercase">{currentT.journalHeading}</div>
                  <h3 className="text-xl font-serif text-white font-bold">{lang === 'bn' ? 'নতুন প্রতিফলন খোদাই করুন' : 'Etch Mindful Diary Input'}</h3>
                </div>

                <div className="flex-1 min-h-[180px]">
                  <textarea
                    value={journalInput}
                    onChange={(e) => setJournalInput(e.target.value)}
                    placeholder={currentT.journalPlaceholder}
                    disabled={journalLoading}
                    className="w-full h-full bg-white/[0.02] border border-white/5 rounded-3xl p-5 text-sm font-serif italic text-white placeholder-white/25 focus:outline-none focus:border-sage/20 resize-none leading-relaxed transition-colors"
                  />
                </div>

                <button
                  onClick={handleImprintJournal}
                  disabled={journalLoading || !journalInput.trim()}
                  className="w-full h-14 bg-white text-black font-extrabold uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  {journalLoading ? <RefreshCw className="animate-spin text-black w-4 h-4" /> : <Plus size={14} strokeWidth={2.5} />}
                  <span>{currentT.journalAddBtn}</span>
                </button>
              </div>

              {/* Sentiment chart analysis and past records list */}
              <div className="lg:col-span-6 space-y-6">
                {/* Small graph timeline */}
                <div className="liquid-glass rounded-[40px] p-6 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-bold uppercase tracking-wide">{lang === 'bn' ? 'মানসিক স্পন্দন প্রবাহ' : 'Aura Resonance Wave'}</h4>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest">{lang === 'bn' ? 'রিয়েল-টাইম মুড ইনসাইট' : 'Mood analytics timeline'}</p>
                    </div>
                    <span className="text-[10px] font-black text-sage border border-sage/20 px-2.5 py-1 rounded">HEALTHY WAVE</span>
                  </div>
                  
                  {/* Dynamic Area Recharts Chart */}
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={journalHistory.length > 0 ? [...journalHistory].reverse() : [{ score: 50 }, { score: 65 }, { score: 55 }, { score: 80 }]}>
                        <defs>
                          <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#acdf87" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#acdf87" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="score" stroke="#acdf87" strokeWidth={1.5} fillOpacity={1} fill="url(#colorWave)" />
                        <Tooltip contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '9px' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Log history list items */}
                <div className="liquid-glass rounded-[40px] p-6 sm:p-8 border border-white/5 space-y-4 max-h-[290px] overflow-y-auto">
                  <h4 className="font-serif text-sm font-bold uppercase text-white tracking-widest mb-2 border-b border-white/5 pb-2">{currentT.historyTitle}</h4>
                  
                  {journalHistory.length === 0 ? (
                    <div className="text-center py-6 text-white/30 space-y-1">
                      <Clock className="w-5 h-5 mx-auto opacity-20" />
                      <p className="text-[10px] uppercase font-black tracking-wider leading-relaxed">{currentT.noHistory}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {journalHistory.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center justify-between p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl transition-all">
                          <div className="flex-1 space-y-1 text-left">
                            <p className="text-xs text-white/80 leading-relaxed font-serif italic truncate">"{item.reflection.replace(/\n+/g, " ").trim()}"</p>
                            <p className="text-[8px] uppercase tracking-widest text-white/40 font-black">{new Date(item.timestamp).toLocaleDateString()} via {item.type}</p>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2.5 rounded-xl text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                            title="Purge reflection record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </motion.div>
            )
          )}

          {activeTab === 'playground' && (
            !user ? (
              <LoginRequiredView tab="playground" lang={lang} currentT={currentT} onSignIn={signInWithGoogle} />
            ) : (
              <motion.div 
                key="playground-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-center md:text-left text-white max-w-7xl mx-auto px-4"
              >
              {/* Column 1: Cadence breathing assistant & 9 Guided Exercises (span 5) */}
              <div className="lg:col-span-5 liquid-glass rounded-[32px] p-6 border border-white/10 flex flex-col justify-between items-center space-y-6">
                <div className="space-y-2 text-center w-full">
                  <div className="text-sage font-black text-[10px] tracking-[0.4em] uppercase">{currentT.focusBreathing}</div>
                  <h3 className="text-xl font-serif text-white font-bold">{lang === 'bn' ? 'কোয়ান্টাম ব্রিদিং মন্ডল' : 'Breathing Cadence Harmony'}</h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">{lang === 'bn' ? '৯টি পবিত্র প্রাণায়াম চক্রের সাহায্যে আপনার আত্মিক তরঙ্গ স্থির করুন।' : 'Calibrate 9 sacred styles of pranayama and respiratory cadences.'}</p>
                </div>

                {/* Interactive Breathing Ring Helper */}
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center my-2">
                  <motion.div 
                    animate={{
                      scale: breathingStep === 'inhale' ? 1.45 : breathingStep === 'hold' ? 1.45 : breathingStep === 'exhale' ? 0.95 : 0.85,
                      opacity: breathingStep === 'inhale' ? 0.35 : breathingStep === 'hold' ? 0.65 : breathingStep === 'exhale' ? 0.25 : 0.15
                    }}
                    transition={{ duration: guidedExercises[activeExerciseIdx]?.inhale || 4, ease: "easeInOut" }}
                    className={`absolute inset-0 bg-sage rounded-full blur-2xl ${
                      breathingStep === 'inhale' ? 'bg-sage' : breathingStep === 'hold' ? 'bg-purple-500' : breathingStep === 'exhale' ? 'bg-blue-400' : 'bg-neutral-600'
                    }`}
                  />

                  <motion.div 
                    animate={{
                      scale: breathingStep === 'inhale' ? 1.15 : breathingStep === 'hold' ? 1.15 : 0.9
                    }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className="absolute inset-2 border border-sage/30 rounded-full flex items-center justify-center"
                  />

                  <div className="z-10 text-center space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-sage border border-sage/20 px-3 py-1 bg-black/75 rounded-full">
                      {breathingStep === 'inhale' ? (lang === 'bn' ? 'শ্বাস নিন' : 'INHALE') : 
                       breathingStep === 'hold' ? (lang === 'bn' ? 'ধরে রাখুন' : 'HOLD') : 
                       breathingStep === 'exhale' ? (lang === 'bn' ? 'শ্বাস ছাড়ুন' : 'EXHALE') : 
                       (lang === 'bn' ? 'বিশ্রাম' : 'REST')}
                    </span>
                    <div className="text-4xl font-extrabold text-white">{breathingSecs}s</div>
                  </div>
                </div>

                {/* Selected Exercise Detail */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-center space-y-1">
                  <p className="text-xs font-black text-sage">
                    {lang === 'bn' ? guidedExercises[activeExerciseIdx].nameBn : guidedExercises[activeExerciseIdx].nameEn}
                  </p>
                  <p className="text-[10px] text-white/50">
                    {lang === 'bn' ? guidedExercises[activeExerciseIdx].descBn : guidedExercises[activeExerciseIdx].descEn}
                  </p>
                  <p className="text-[9px] text-[#A7C7E7] font-serif italic mt-1 bg-indigo-500/10 py-1 px-2 rounded-md">
                    ✨ {lang === 'bn' ? guidedExercises[activeExerciseIdx].benefitBn : guidedExercises[activeExerciseIdx].benefitEn}
                  </p>
                </div>

                {/* 9 Types of Guided Exercises List Selector */}
                <div className="w-full space-y-2">
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 text-center">
                    {lang === 'bn' ? "৯টি নিশ্বাস অনুশীলন ধরণ চয়ন করুন" : "Browse 9 Respiratory Dimensions"}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 text-left select-none">
                    {guidedExercises.map((ex, index) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          setActiveExerciseIdx(index);
                          setBreathingStep('inhale');
                          setBreathingSecs(ex.inhale);
                          const speakText = lang === 'bn' 
                            ? `আসুন শুরু করি ${ex.nameBn}।` 
                            : `Let us begin ${ex.nameEn} training. Adjust your posture and soul.`;
                          if (autoSpeak) {
                            speakNow(speakText);
                          }
                          triggerNotification(lang === 'bn' ? `${ex.nameBn} সক্রিয় হয়েছে` : `${ex.nameEn} active!`, 'success');
                        }}
                        className={`p-2 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                          activeExerciseIdx === index 
                            ? 'bg-sage text-black border-sage font-semibold shadow-lg shadow-sage/10' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/80'
                        }`}
                      >
                        <span className="text-[9px] font-extrabold tracking-wide truncate">
                          {lang === 'bn' ? ex.nameBn : ex.nameEn}
                        </span>
                        <span className={`text-[8px] mt-1 opacity-70 ${activeExerciseIdx === index ? 'text-black/80' : 'text-[#A7C7E7]'}`}>
                          {ex.inhale}-{ex.hold}-{ex.exhale}{ex.rest > 0 ? `-${ex.rest}` : ''}s
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Sensory & Brain Balance Playground - Sequentially Unlocked Games (span 7) */}
              <div className="lg:col-span-7 liquid-glass rounded-[32px] p-6 border border-white/10 flex flex-col justify-between items-center space-y-6 relative overflow-hidden">
                
                {/* Header Information */}
                <div className="text-center w-full space-y-1">
                  <div className="text-purple-400 font-extrabold text-[10px] tracking-[0.4em] uppercase">{lang === 'bn' ? 'ব্রেইন ব্যালেন্স ও একাগ্রতা' : 'Brain Balance Core'}</div>
                  <h3 className="text-xl font-serif text-white font-bold">{lang === 'bn' ? 'নিউরন ও আত্মিক ফোকাস গেমস' : 'Hemisphere Synapse Harmonizer'}</h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    {lang === 'bn' ? '৩ বার করে খেলুন এবং পরবর্তী চ্যালেঞ্জ আনলক করুন কসমিক ক্ষমতায়।' : 'Train left/right brain balance. Complete 3 sessions of each step sequentially to unlock.'}
                  </p>
                </div>

                {/* Progressive Sequential Locking Navigation Pills */}
                <div className="w-full">
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/45 rounded-2xl border border-white/5">
                    {[
                      { id: 'reflexes', nameEn: "1. Reflexes", nameBn: "১. রিফ্লেক্স", lock: false, plays: game1Plays },
                      { id: 'harmony', nameEn: "2. Aura Stroop", nameBn: "২. অরা স্ট্রেপ", lock: game1Plays < 3, plays: game2Plays },
                      { id: 'sequence', nameEn: "3. Zen Path", nameBn: "৩. জেন পাথ", lock: game2Plays < 3, plays: game3Plays }
                    ].map((g) => {
                      const isLocked = g.lock;
                      const isButtonActive = activeGameId === g.id && !isLocked;
                      return (
                        <button
                          key={g.id}
                          onClick={() => {
                            if (isLocked) {
                              const alertMsg = lang === 'bn' 
                                ? `গেমটি লকড! পূর্ববর্তী গেমটি অন্তত ৩ বার খেলুন (বর্তমানে ${g.plays}/৩ কমপ্লিট)।` 
                                : `This training is locked! Play preceding step 3 times (currently completed: ${g.plays}/3).`;
                              triggerNotification(alertMsg, 'error');
                              return;
                            }
                            setActiveGameId(g.id as any);
                          }}
                          className={`py-2 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                            isButtonActive
                              ? 'bg-purple-600 text-white font-black shadow-lg border border-purple-400/30'
                              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            {isLocked && <Lock size={10} className="text-red-400" />}
                            {lang === 'bn' ? g.nameBn : g.nameEn}
                          </span>
                          <span className="text-[8px] opacity-60 mt-0.5">
                            {isLocked ? (lang === 'bn' ? "লকড" : "Locked") : `${g.plays}/৩`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* GAME CONTAINER FRAME VIEWPORTS */}
                <div className="relative w-full h-72 sm:h-80 border border-white/5 bg-black/40 rounded-3xl overflow-hidden shadow-inner flex flex-col justify-center items-center p-4">
                  
                  {/* GAME 1: COSMIC COORDINATE REFLEXES VIEWPORT */}
                  {activeGameId === 'reflexes' && (
                    <div className="relative w-full h-full">
                      {isPlayingReflex ? (
                        <div className="w-full h-full relative">
                          {/* Score and Timer header items inside reflexes board */}
                          <div className="absolute top-2 left-2 right-2 flex justify-between px-3 py-1.5 rounded-xl bg-black/60 border border-white/5 text-[9px] font-black text-sage z-10">
                            <span>HITS: {reflexScore}</span>
                            <span>TIME LEFT: {reflexTimeLeft}s</span>
                          </div>

                          <motion.button
                            layout
                            onClick={onTargetHit}
                            style={{ top: targetPos.top, left: targetPos.left }}
                            className="absolute w-10 h-10 rounded-full bg-gradient-to-r from-sage to-purple-400 border border-white/50 flex items-center justify-center shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-20"
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            <Sparkles size={14} className="text-black" />
                          </motion.button>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 space-y-4">
                          <div className="p-3 w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center mx-auto">
                            <Sparkles size={24} className="animate-pulse text-sage" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{lang === 'bn' ? 'কসমিক রিফ্লেক্সেস' : 'Cosmic Coordinate Reflexes'}</h4>
                            <p className="text-[10px] text-white/50 mt-1 max-w-sm">
                              {lang === 'bn' ? 'স্ক্রিনে উড়ন্ত নক্ষত্রগুলিকে ফোকাস বজায় রেখে দ্রুত স্পর্শ করুন।' : 'Calibrate reaction speed by quickly tapping cosmic star coordinates as they shift.'}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setIsPlayingReflex(true);
                              setReflexScore(0);
                              setReflexTimeLeft(15);
                              moveReflexTarget();
                              if (autoSpeak) {
                                speakNow(lang === 'bn' ? "রিফ্লেক্স ট্রেনিং শুরু হলো।" : "Reflex calibration initializing. Maintain clear breathing.");
                              }
                            }}
                            className="px-6 py-2.5 bg-sage text-black font-extrabold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer hover:bg-sage/90"
                          >
                            {lang === 'bn' ? 'রিফ্লেক্স সেশন শুরু করুন' : 'Ignite Reflex Sequence'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}


                  {/* GAME 2: AURA SHIFTING HARMONY STROOP MATCH VIEWPORT */}
                  {activeGameId === 'harmony' && (
                    <div className="w-full h-full flex flex-col justify-center items-center text-center">
                      {isPlayingGame2 ? (
                        <div className="w-full h-full flex flex-col justify-between p-2">
                          
                          {/* HUD Bar */}
                          <div className="flex justify-between px-3 py-1.5 rounded-xl bg-black/60 border border-white/5 text-[9px] font-black text-purple-300 w-full mb-2">
                            <span>CORRECT MATCHES: {game2Score}</span>
                            <span>TIME: {game2TimeLeft}s</span>
                          </div>

                          <div className="bg-black/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center my-auto space-y-3">
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                              {lang === 'bn' ? "নিচের বাটনে লেখাটির গায়ের রঙ স্পর্শ করুন:" : "TAP THE PHYSICAL FONT COLOR:"}
                            </p>
                            
                            {/* The Stroop Display word */}
                            <motion.h1 
                              key={stroopWord + stroopColor}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-4xl font-extrabold uppercase tracking-wide px-4 py-2"
                              style={{ 
                                color: stroopColor === 'SAGE' ? '#A7C7E7' : 
                                       stroopColor === 'PURPLE' ? '#C084FC' : 
                                       stroopColor === 'BLUE' ? '#60A5FA' : '#FB923C'
                              }}
                            >
                              {lang === 'bn' ? 
                                (stroopWord === 'SAGE' ? 'ধূসর সবুজ' : stroopWord === 'PURPLE' ? 'বেগুনি' : stroopWord === 'BLUE' ? 'নীল' : 'কমলা') : 
                                stroopWord}
                            </motion.h1>
                          </div>

                          {/* Options grid */}
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {['SAGE', 'PURPLE', 'BLUE', 'ORANGE'].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  if (opt === stroopColor) {
                                    setGame2Score((s) => s + 1);
                                    triggerNotification(lang === 'bn' ? "একদম সঠিক!" : "Correct Alignment!", "success");
                                    generateStroopRound();
                                  } else {
                                    triggerNotification(lang === 'bn' ? "ভুল সংযোগ! রঙের লিখা লক্ষ্য করুন" : "Wrong! Tap text color, not word spelling.", "error");
                                    generateStroopRound();
                                  }
                                }}
                                className="py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black tracking-widest uppercase text-white cursor-pointer transition-all active:scale-95"
                              >
                                {lang === 'bn' ? 
                                  (opt === 'SAGE' ? 'ধূসর সবুজ' : opt === 'PURPLE' ? 'বেগুনি' : opt === 'BLUE' ? 'নীল' : 'কমলা') : 
                                  opt}
                              </button>
                            ))}
                          </div>

                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 space-y-4">
                          <div className="p-3 w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto">
                            <Brain size={24} className="animate-pulse text-[#A7C7E7]" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{lang === 'bn' ? 'অরা স্ট্রেপ হারমনি' : 'Aura Shifting Harmony'}</h4>
                            <p className="text-[10px] text-white/50 mt-1 max-w-sm">
                              {lang === 'bn' ? 'শব্দের বানান নয়, বরং শব্দের রঙটি লক্ষ্য করে সঠিক বোতামটি নির্বাচন করুন। ব্রেইন হ্যামিস্ফিয়ার ব্যালেন্স টেস্ট!' : 'Tests hemispheric sync. Click the button matching the physical font COLOR, ignoring the written word spelling.'}
                            </p>
                          </div>
                          <button
                            onClick={startStroopGame}
                            className="px-6 py-2.5 bg-purple-600 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer hover:bg-purple-700"
                          >
                            {lang === 'bn' ? 'স্ট্রেপ সেশন শুরু করুন' : 'Begin Stroop Training'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}


                  {/* GAME 3: COSMIC SEQUENCE SIMON MEMORY VIEWPORT */}
                  {activeGameId === 'sequence' && (
                    <div className="w-full h-full flex flex-col justify-center items-center text-center">
                      {isPlayingGame3 ? (
                        <div className="w-full h-full flex flex-col justify-between p-2">
                          
                          {/* HUD bar */}
                          <div className="flex justify-between px-3 py-1.5 rounded-xl bg-black/60 border border-white/5 text-[9px] font-black w-full mb-2">
                            <span className="text-orange-300">ZEN PATH LEVEL: {game3Score}</span>
                            <span className={sequenceStep === 'show' ? "text-amber-400 animate-pulse font-extrabold" : "text-green-400 font-extrabold"}>
                              {sequenceStep === 'show' ? (lang === 'bn' ? 'স্মরণ করুন...' : 'REMEMBER SEQUENCE...') : (lang === 'bn' ? 'আপনার সেশন...' : 'TAP CORRESPONDING SEQUENCE!')}
                            </span>
                          </div>

                          {/* 4 Large Simon node Quadrants */}
                          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mx-auto my-auto aspect-square">
                            {[
                              { label: 1, colorClass: 'border-[#A7C7E7]', activeClass: 'bg-[#A7C7E7] shadow-lg shadow-[#A7C7E7]/40 ring-4 ring-[#A7C7E7]/25 scale-105', idleClass: 'bg-[#A7C7E7]/15 hover:bg-[#A7C7E7]/25' },
                              { label: 2, colorClass: 'border-[#C084FC]', activeClass: 'bg-[#C084FC] shadow-lg shadow-[#C084FC]/40 ring-4 ring-[#C084FC]/25 scale-105', idleClass: 'bg-[#C084FC]/15 hover:bg-[#C084FC]/25' },
                              { label: 3, colorClass: 'border-[#60A5FA]', activeClass: 'bg-[#60A5FA] shadow-lg shadow-[#60A5FA]/40 ring-4 ring-[#60A5FA]/25 scale-105', idleClass: 'bg-[#60A5FA]/15 hover:bg-[#60A5FA]/25' },
                              { label: 4, colorClass: 'border-[#FB923C]', activeClass: 'bg-[#FB923C] shadow-lg shadow-[#FB923C]/40 ring-4 ring-[#FB923C]/25 scale-105', idleClass: 'bg-[#FB923C]/15 hover:bg-[#FB923C]/25' }
                            ].map((node) => {
                              const isFlashed = activeSequenceFlash === node.label;
                              return (
                                <button
                                  key={node.label}
                                  onClick={() => onMemoryNodeClick(node.label)}
                                  disabled={sequenceStep !== 'input'}
                                  className={`border rounded-2xl transition-all cursor-pointer flex items-center justify-center text-[#90A5A9] text-xs font-black ${node.colorClass} ${
                                    isFlashed ? node.activeClass : node.idleClass
                                  }`}
                                >
                                  <span className="text-white text-lg font-black">{node.label}</span>
                                </button>
                              );
                            })}
                          </div>

                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 space-y-4">
                          <div className="p-3 w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
                            <Infinity size={24} className="animate-spin text-orange-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{lang === 'bn' ? 'জেন পাথ মেমোরি সিকোয়েন্স' : 'Cosmic Path Memory Sequence'}</h4>
                            <p className="text-[10px] text-white/50 mt-1 max-w-sm">
                              {lang === 'bn' ? '৪টি রঙিন এনার্জি নোডের ক্রমানুসারে জ্বলে ওঠার প্যাটার্নটি হুবহু পুনরায় স্পর্শ করে স্মরণ শক্তি বাড়ান।' : 'Supercharge working memory. Watch the generated sequence of energy nodes and replicate it exactly.'}
                            </p>
                          </div>
                          <button
                            onClick={startMemoryGameLevel}
                            className="px-6 py-2.5 bg-orange-500 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer hover:bg-orange-600"
                          >
                            {lang === 'bn' ? 'জেন সিকোয়েন্স শুরু করুন' : 'Align Cosmic Memory Path'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                <div className="text-[9px] uppercase tracking-widest font-black text-rose-400">
                  {lang === 'bn' ? '৩ বার সেশন কমপ্লিট করার পরে নতুন গেম স্বয়ংক্রিয়ভাবে খুলে যাবে।' : 'Every completed session adds gameplay counters. Master the aura!'}
                </div>
              </div>

              </motion.div>
            )
          )}

          {activeTab === 'games' && (
            <motion.div
              key="games-pane"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-7xl mx-auto"
            >
              <MindGames 
                lang={lang} 
                points={points} 
                setPoints={setPoints} 
                triggerNotification={(msg, type) => triggerNotification(msg, type === 'info' ? 'success' : type)}
                langDict={currentT}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Subscription Pricing Grid Panel with Premium Modals */}
      {activeTab === 'dashboard' && (
        <section id="pricing" className="px-4 sm:px-6 py-20 relative overflow-hidden z-10 border-t border-white/5 bg-black/40">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center space-y-3">
              <div className="text-sage font-black text-[10px] tracking-[0.5em] uppercase">{currentT.pricingTitle}</div>
              <h2 className="text-3xl sm:text-5xl font-serif tracking-tight font-black uppercase text-white leading-none">
                {currentT.successPlan}
              </h2>
              <p className="text-xs text-white/45 max-w-sm mx-auto">{lang === 'bn' ? 'আপনার মানসিক সুস্থতা যাত্রা সহজ করতে বেছে নিন সেরা প্ল্যান।' : 'Calibrate your daily wellness flow with our advanced modular packages.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan) => (
                <motion.div 
                  key={plan.id} 
                  whileHover={{ y: -6 }} 
                  onClick={() => setViewingPlan(plan)}
                  className={`p-8 rounded-[36px] border ${plan.color} relative overflow-hidden flex flex-col justify-between text-left cursor-pointer transition-all group`}
                >
                  {plan.featured && (
                    <div className="absolute top-6 right-6 bg-sage text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider">
                      {lang === 'bn' ? 'সেরা অফার' : 'BEST VALUE'}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Plan Top */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xl font-serif font-black text-white uppercase">{plan.title}</h3>
                        <Info className="w-4 h-4 text-white/20 group-hover:text-sage transition-colors" />
                      </div>
                      <p className="text-sage text-[10px] font-black uppercase tracking-widest">{plan.outcome}</p>
                    </div>

                    {/* Pricing tier */}
                    <div className="space-y-1">
                      <div className="text-4xl font-extrabold text-white">{plan.price}</div>
                      <div className="text-[9px] text-white/30 uppercase tracking-widest">per month / billed annually</div>
                    </div>

                    {/* Brief Description */}
                    <p className="text-xs text-white/50 leading-relaxed font-light font-serif italic">
                      "{plan.description}"
                    </p>

                    <div className="w-full h-px bg-white/5" />

                    {/* Quick features checkboxes list */}
                    <div className="space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/20">WHAT\'S INCLUDED:</span>
                      <div className="space-y-2.5">
                        {plan.features.slice(0, 3).map((feat, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
                            <div className="w-4 h-4 rounded-md bg-sage/15 flex items-center justify-center border border-sage/20 text-sage">
                              <CheckCircle size={10} />
                            </div>
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setCheckoutPlan(plan); }}
                    className={`w-full h-14 rounded-2xl mt-8 font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer ${
                      plan.featured 
                        ? 'bg-sage text-black shadow-lg shadow-sage/10 hover:bg-sage/90' 
                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {currentT.getStarted}
                  </button>
                </motion.div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* Plan Details modal panel (Liquid Glass aesthetic) */}
      <AnimatePresence>
        {viewingPlan && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setViewingPlan(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#0b0c10]/95 border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative z-10"
            >
              {/* Close trigger button */}
              <button 
                onClick={() => setViewingPlan(null)} 
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="p-8 sm:p-10 space-y-6">
                <div className="space-y-2">
                  <div className="text-sage font-black text-[9px] tracking-[0.4em] uppercase">{lang === 'bn' ? 'প্ল্যান বিস্তারিত' : 'PLAN DETAILS'}</div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-white uppercase">{viewingPlan.title}</h2>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{viewingPlan.outcome} — {viewingPlan.price}/month</p>
                </div>

                {/* Plan outcome quote block */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-left">
                  <p className="text-sm font-serif italic text-white/85 leading-relaxed">"{viewingPlan.description}"</p>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">{lang === 'bn' ? 'ফিচারসমূহ:' : 'WHAT\'S EXTRA INCLUDED:'}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                    {viewingPlan.features.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 text-[10px] font-bold text-white/75 uppercase tracking-wider">
                        <div className="w-5 h-5 bg-sage/10 rounded-lg flex items-center justify-center border border-sage/20"><CheckCircle size={11} className="text-sage" /></div>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => { setCheckoutPlan(viewingPlan); setViewingPlan(null); }}
                  className="w-full h-14 mt-4 rounded-2xl bg-sage text-black font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-sage/10 cursor-pointer"
                >
                  {currentT.getStarted} - {viewingPlan.price}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout secure payment option popup modal (requested by user) */}
      <AnimatePresence>
        {checkoutPlan && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setCheckoutPlan(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#070710]/95 border border-white/10 w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl relative z-10 text-center"
            >
              {/* Close trigger button */}
              <button 
                onClick={() => setCheckoutPlan(null)} 
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="p-8 sm:p-10 space-y-8">
                <div className="space-y-2">
                  <div className="text-sage font-black text-[9px] tracking-[0.4em] uppercase">{lang === 'bn' ? 'পেমেন্ট সম্পন্ন করুন' : 'COMPLETE TRANSACTION'}</div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-white uppercase">{checkoutPlan.title}</h2>
                  <div className="text-3xl font-extrabold text-white">{checkoutPlan.price}<span className="text-xs text-white/30 font-medium">/mo</span></div>
                </div>

                <div className="space-y-3.5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block">{lang === 'bn' ? 'পেমেন্ট মেথড বেছে নিন' : 'CHOOSE PAYMENT GATEWAY'}</span>
                  
                  {/* bKash Integration option */}
                  <button 
                    onClick={() => { triggerNotification("bKash API loaded: Simulating secure checkout...", "success"); setCheckoutPlan(null); }}
                    className="w-full h-16 bg-[#E2136E]/10 border border-[#E2136E]/20 rounded-2xl flex items-center px-5 gap-3.5 hover:bg-[#E2136E]/15 transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-[#E2136E] rounded-xl flex items-center justify-center font-extrabold text-white text-sm">b</div>
                    <div className="flex-1 text-left font-black text-[#E2136E] uppercase tracking-widest text-[9px]">bKash Checkout</div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E2136E] opacity-0 group-hover:opacity-100 transition-all translate-x-[-5px] group-hover:translate-x-0" />
                  </button>

                  {/* Card transaction option */}
                  <button 
                    onClick={() => { triggerNotification("Card Processor loaded: Simulating secure checkout...", "success"); setCheckoutPlan(null); }}
                    className="w-full h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center px-5 gap-3.5 hover:bg-blue-500/15 transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white"><CreditCard size={15} /></div>
                    <div className="flex-1 text-left font-black text-blue-400 uppercase tracking-widest text-[9px]">{lang === 'bn' ? 'কার্ডে পেমেন্ট' : 'Credit / Debit Card'}</div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-all translate-x-[-5px] group-hover:translate-x-0" />
                  </button>

                  {/* Google Pay option */}
                  <button 
                    onClick={() => { triggerNotification("Google Pay initialized: Simulating secure checkout...", "success"); setCheckoutPlan(null); }}
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center px-5 gap-3.5 hover:bg-white/10 transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center font-extrabold text-white text-[11px]">G</div>
                    <div className="flex-1 text-left font-black text-white/70 uppercase tracking-widest text-[9px]">Google Pay</div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/50 opacity-0 group-hover:opacity-100 transition-all translate-x-[-5px] group-hover:translate-x-0" />
                  </button>
                </div>

                <p className="text-[8px] text-white/30 font-black uppercase tracking-widest leading-loose">
                  {lang === 'bn' ? 'আপনার সেশন সুরক্ষিত এবং এনক্রিপ্ট করা।' : 'Your digital biofields and payments are fully encrypted.'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* Diagnostic & Mystical Mystery Card Modal Popup (requested by user) */}
      <AnimatePresence>
        {showDiagnosticPopup && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/95 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0b0b18]/95 border border-purple-500/20 w-full max-w-2xl rounded-[40px] shadow-2xl shadow-purple-500/10 relative z-10 overflow-hidden text-center max-h-[90vh] flex flex-col"
            >
              {/* Close Button at top right */}
              <button
                onClick={restartScan}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer z-50 focus:outline-none"
                title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              >
                <X size={14} />
              </button>

              {/* Top ambient colored light beam */}
              <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-purple-500/15 via-pink-500/5 to-transparent pointer-events-none" />

              <div className="p-6 sm:p-10 flex-1 overflow-y-auto space-y-6 sm:space-y-8 flex flex-col justify-between">
                
                {/* SUB-STEP 1: CHOICE OF HEAR OR READ */}
                {popupSubStep === 'choice' && (
                  <div className="my-auto space-y-8 py-4">
                    <div className="space-y-3.5">
                      <div className="text-pink-400 font-extrabold text-[10px] tracking-[0.5em] uppercase">
                        {lang === 'bn' ? 'আভা প্রতিফলন প্রস্তুতি' : 'AURA RESONANCE READY'}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-serif font-black text-white leading-tight">
                        {lang === 'bn' ? 'আপনার আভা প্রতিবেদন প্রস্তুত!' : 'Your Quantum Feedback is Ready'}
                      </h2>
                      <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
                        {lang === 'bn' 
                          ? 'অরা আজকে আপনার এই ফ্রেম বা ভয়েস থেকে আপনার আধ্যাত্মিক স্পন্দন বিশ্লেষণ করেছে। আপনি এটি কিভাবে গ্রহণ করতে চান?' 
                          : 'Aura has successfully mapped your life force vibration for this millisecond. How would you like to receive it?'}
                      </p>

                      {tempReflection && extractOnlyState(tempReflection) && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 max-w-md mx-auto relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
                          <span className="text-[9px] uppercase tracking-[0.2em] text-pink-400 font-extrabold block mb-1">
                            {lang === 'bn' ? 'শনাক্তকৃত অবস্থা (Detected State)' : 'Detected State'}
                          </span>
                          <p className="text-xs sm:text-sm text-white/90 font-serif italic leading-relaxed">
                            "{extractOnlyState(tempReflection)}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                      {/* Option 1: Hear Guidance */}
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.speechSynthesis) {
                            try {
                              const unlockUtterance = new SpeechSynthesisUtterance("");
                              unlockUtterance.volume = 0;
                              window.speechSynthesis.speak(unlockUtterance);
                            } catch (e) {
                              console.warn("TTS unlock failed:", e);
                            }
                          }
                          setTtsOption('speak');
                          setPopupSubStep('cards');
                        }}
                        className="p-6 sm:p-8 rounded-3xl bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-400/40 text-center space-y-4 group transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col items-center justify-center"
                      >
                        <div className="w-14 h-14 bg-purple-500/15 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                          <Volume2 size={24} className="animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">
                            {lang === 'bn' ? 'ভয়েস শুনুন' : 'Listen to Aura'}
                          </h4>
                          <p className="text-[10px] text-white/40 leading-normal max-w-[180px] mx-auto">
                            {lang === 'bn' ? 'অরা সহচরের ভয়েস দিয়ে আপনার প্রতিফলন শুনুন।' : 'Let Aura companion speak your diagnostic evaluation aloud.'}
                          </p>
                        </div>
                      </button>

                      {/* Option 2: Read Silence */}
                      <button
                        onClick={() => {
                          setTtsOption('read');
                          setPopupSubStep('cards');
                        }}
                        className="p-6 sm:p-8 rounded-3xl bg-pink-500/5 hover:bg-pink-500/10 border border-pink-500/20 hover:border-pink-400/40 text-center space-y-4 group transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col items-center justify-center"
                      >
                        <div className="w-14 h-14 bg-pink-500/15 border border-pink-500/20 rounded-2xl flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
                          <FileText size={24} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">
                            {lang === 'bn' ? 'লেখা পড়ুন' : 'Read Text Only'}
                          </h4>
                          <p className="text-[10px] text-white/40 leading-normal max-w-[180px] mx-auto">
                            {lang === 'bn' ? 'গভীর ধ্যান ও নীরবতার মাঝে আপনার প্রতিফলন রিপোর্টটি পড়ুন।' : 'Read your spiritual report in complete quiet mindfulness.'}
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="pt-2">
                       <button
                         onClick={restartScan}
                         className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer mx-auto duration-300"
                       >
                         <RefreshCw size={11} className="text-pink-400 rotate-180" />
                         <span>{lang === 'bn' ? 'পুনরায় শুরু করুন' : 'Restart / Try Again'}</span>
                       </button>
                    </div>
                  </div>
                )}

                {/* SUB-STEP 2: ENERGETIC MYSTERY CARDS */}
                {popupSubStep === 'cards' && (
                  <div className="space-y-6 flex flex-col justify-between flex-1 md:py-4">
                    <div className="space-y-2">
                      <div className="text-pink-400 font-extrabold text-[10px] tracking-[0.5em] uppercase">
                        {lang === 'bn' ? 'অনুপ্রেরণা রহস্য কার্ড' : 'MYSTIC ALIGNMENT GATEWAY'}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-white uppercase">
                        {lang === 'bn' ? 'একটি অনুপ্রেরণা কার্ড চয়ন করুন' : 'Unlock Your Healing Coordinate'}
                      </h2>
                      <p className="text-[10px] text-white/50 max-w-sm mx-auto leading-normal">
                        {lang === 'bn'
                          ? 'আপনার অভ্যন্তরীণ শক্তি প্রবাহ উন্মোচন করতে এবং মূল ডায়াগনস্টিক নোট দেখতে নিচের যেকোনো একটি কার্ড স্পর্শ করুন।'
                          : 'Select exactly one sacred mystery card below to reveal your daily soul-alignment advice.'}
                      </p>
                    </div>

                    {/* Mystery Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto w-full py-2">
                      {MYSTERY_CARDS.map((card) => {
                        const isSelected = selectedMysteryCard === card.id;
                        return (
                          <motion.div
                            key={card.id}
                            onClick={() => setSelectedMysteryCard(card.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative h-32 rounded-2xl border cursor-pointer p-3 sm:p-4 flex flex-col justify-center items-center overflow-hidden transition-all duration-300 ${card.color} ${card.borderColor} ${
                              isSelected 
                                ? `ring-2 ring-pink-400 bg-opacity-30 ${card.glow}` 
                                : 'opacity-80 hover:opacity-100'
                            }`}
                          >
                            <AnimatePresence mode="wait">
                              {!isSelected ? (
                                <motion.div 
                                  key="front"
                                  initial={{ opacity: 0 }} 
                                  animate={{ opacity: 1 }} 
                                  exit={{ opacity: 0 }}
                                  className="text-center space-y-1"
                                >
                                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-pink-300">
                                    <Sparkles size={12} className="animate-pulse" />
                                  </div>
                                  <div className="text-[9px] font-black uppercase tracking-widest text-white mt-1 pt-0.5">
                                    {lang === 'bn' ? 'রহস্য কার্ড' : 'MYSTERY'}
                                  </div>
                                  <div className="text-[8px] text-pink-400/60 uppercase tracking-widest font-mono">
                                    #{card.id}0{card.id}
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.div 
                                  key="back"
                                  initial={{ opacity: 0, rotateY: 180 }} 
                                  animate={{ opacity: 1, rotateY: 0 }} 
                                  exit={{ opacity: 0 }}
                                  className="text-center flex flex-col items-center justify-center w-full h-full"
                                >
                                  <div className="text-[9px] font-black uppercase text-pink-300 border-b border-pink-400/20 pb-0.5 mb-1.5 truncate max-w-full">
                                    {lang === 'bn' ? card.titleBn : card.titleEn}
                                  </div>
                                  <p className="text-[9px] text-white/90 leading-normal line-clamp-3 font-serif italic">
                                    "{lang === 'bn' ? card.descBn : card.descEn}"
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Bottom Action reveal trigger */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto justify-center">
                      <button
                        onClick={() => {
                          setPopupSubStep('choice');
                          setSelectedMysteryCard(null);
                        }}
                        className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer duration-300"
                        title={lang === 'bn' ? 'আগের ধাপে যান' : 'Go back to choices'}
                      >
                        <ArrowLeft size={11} className="text-purple-400" />
                        <span>{lang === 'bn' ? 'পেছনে ফিরুন' : 'Go Back'}</span>
                      </button>
                      <button
                        onClick={restartScan}
                        className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer duration-300"
                      >
                        <RefreshCw size={11} className="text-pink-400 animate-spin-slow" />
                        <span>{lang === 'bn' ? 'পুনরায় শুরু' : 'Restart Scan'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (selectedMysteryCard === null) {
                            triggerNotification(lang === 'bn' ? "অনুগ্রহ করে আগে যেকোনো একটি রহস্য কার্ড নির্বাচন করুন!" : "Please select a mystery card first!", "error");
                            return;
                          }
                          // Proceed and Reveal the feedback!
                          setScanReflection(tempReflection);
                          setShowDiagnosticPopup(false);
                          
                          // Explicit speak trigger if chosen
                          if (ttsOption === 'speak') {
                            speakNow(tempReflection, true);
                          }
                          triggerNotification(lang === 'bn' ? "অভিনন্দন! আপনার মানসিক আভা প্রতিবেদন খোলা হয়েছে।" : "Inspiration Unlocked! Aura evaluation revealed below.", "success");
                        }}
                        disabled={selectedMysteryCard === null}
                        className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedMysteryCard !== null
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 font-extrabold text-white animate-pulse shadow-lg shadow-pink-500/20'
                            : 'bg-white/5 border border-white/10 text-white/30 disabled:pointer-events-none'
                        }`}
                      >
                        <Sparkles size={11} />
                        <span>{lang === 'bn' ? 'আভা বিশ্লেষণ উন্মুক্ত করুন' : 'Reveal Diagnostic'}</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Notifications Banner */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: 20, x: '-50%' }} 
            className={`fixed bottom-8 left-1/2 z-[100] px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 border ${
              showNotification.type === 'success' ? 'bg-sage text-black border-sage' : 'bg-red-500 text-white border-red-400'
            }`}
          >
            {showNotification.type === 'success' ? <Sparkles size={16} /> : <Lock size={16} />}
            <span className="font-extrabold uppercase tracking-wider text-[10px]">{showNotification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed bottom version label and watermarks */}
      <div className="fixed bottom-4 right-4 z-40 pointer-events-none opacity-25">
        <span className="text-[8px] font-black uppercase tracking-widest text-white">v1.1.0 — Aura Activated</span>
      </div>
    </div>
  );
}
