import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, CheckCircle, Trophy, Play, Undo, Sparkles, 
  Gamepad2, RefreshCw, Star, Info, ChevronRight, Check,
  AlertCircle, Volume2, VolumeX, Flame, Award
} from 'lucide-react';

interface GameDefinition {
  id: number; // 1 to 22
  titleEn: string;
  titleBn: string;
  emoji: string;
  descEn: string;
  descBn: string;
  category: string;
}

const ALL_GAMES: GameDefinition[] = [
  { id: 1, titleEn: "Memory Cards Match", titleBn: "স্মৃতিশক্তি কার্ড খেলা", emoji: "🃏", descEn: "Find matching element pairs to tune your mental coherence.", descBn: "মানসিক সামঞ্জস্য বজায় রাখতে একই উপাদানের কার্ড জোড়া মেলান।", category: "Memory" },
  { id: 2, titleEn: "Classic Tic-Tac-Toe", titleBn: "টিক-ট্যাক-টো যুদ্ধ", emoji: "❌", descEn: "Outsmart the cosmic AI in an ancient tactical indoor clash.", descBn: "একটি প্রাচীন রণকৌশল খেলায় কসমিক এআই-কে পরাস্ত করুন।", category: "Strategy" },
  { id: 3, titleEn: "Word Scramble Quest", titleBn: "বর্ণের গোলকধাঁধা", emoji: "🧩", descEn: "Unscramble wellness words to sharpen root linguistic pathways.", descBn: "ল Linguistic পাথওয়ে সক্রিয় করতে এলোমেলো অক্ষর সাজিয়ে অর্থপূর্ণ শব্দ তৈরি করুন।", category: "Cognitive" },
  { id: 4, titleEn: "Stroop Sensory Match", titleBn: "স্ট্রুপ রঙের পরীক্ষা", emoji: "🎨", descEn: "Verify if the visual text meaning matches its actual ink color under speed limits.", descBn: "দ্রুতগতির চাপ সামলে রঙের নাম ও লেখার রঙের সংযোগটি নিখুঁতভাবে মেলান।", category: "Sensory" },
  { id: 5, titleEn: "Zen Math Speed Run", titleBn: "গতিশীল গণিত সাধনা", emoji: "🔢", descEn: "Perform rapid basic arithmetic calculations to expand calculation channels.", descBn: "আপনার গাণিতিক ক্ষমতা বৃদ্ধি করার জন্য দ্রুত বেসিক সরল সমাধান করুন।", category: "Logic" },
  { id: 6, titleEn: "Aura Reflex Star Tap", titleBn: "কসমিক রিফ্লেক্স ট্যাপ", emoji: "⭐", descEn: "Tap expanding volatile star energy nodes before they shrink back into dust.", descBn: "মহাজাগতিক নক্ষত্রগুলো মহাশূন্যে মিলিয়ে যাওয়ার আগেই সেগুলোর উপর ট্যাপ করুন।", category: "Reflex" },
  { id: 7, titleEn: "Ludo Dice Race Simulator", titleBn: "লুডো ডাইস রেস", emoji: "🎲", descEn: "Roll dice to race your virtual pawn against a competitive AI on a track.", descBn: "১৫ ধাপের একটি বোর্ডে এআই-এর বিরুদ্ধে ডাইস চালনা করে লড়াই করুন।", category: "Board Game" },
  { id: 8, titleEn: "Simon Sequence Recall", titleBn: "ক্রমানুসারী আলোকচক্র", emoji: "💡", descEn: "Watch the glowing energy sequence and replay it in exact rhythm.", descBn: "অনন্ত আলোকরশ্মির প্যাটার্নটি দেখুন এবং নিখুঁত সিকোয়েন্সে পুনরাবৃত্তি করুন।", category: "Memory" },
  { id: 9, titleEn: "Sliding Tile Puzzle", titleBn: "টাইলস মেলানোর ধাঁধা", emoji: "🖼️", descEn: "Slide numbered blocks orderly to reconstitute the cosmic geometric layout.", descBn: "কসমিক জ্যামিতিক বিন্যাসটি সাজানোর জন্য নম্বরযুক্ত টাইলস স্লাইড করুন।", category: "Logic" },
  { id: 10, titleEn: "Zen Elemental Predictor", titleBn: "আধ্যাত্মিক কার্ড অনুধাবন", emoji: "🔮", descEn: "Harness your gut intuition to correctly predict hidden elemental crystals.", descBn: "আপনার স্বজ্ঞাত প্রবৃত্তিকে কাজে লাগিয়ে লুকানো ক্রিস্টাল অনুমান করুন।", category: "Intuition" },
  { id: 11, titleEn: "Mini Chess Tactics", titleBn: "মিনি দাবার কৌশল", emoji: "♟️", descEn: "Defeat local black pawns on a mini board using basic movement values.", descBn: "একটি ক্ষুদ্র দাবার বোর্ডে এআই-এর ঘুঁটিগুলোকে ফাঁকি দিয়ে জয়ী হোন।", category: "Strategy" },
  { id: 12, titleEn: "Illuminated Maze Runner", titleBn: "আলোকিত গোলকধাঁধা", emoji: "🌀", descEn: "Guide a golden light particle through nested maze blocks to the exit gate.", descBn: "একটি সোনালী আলোর কণা গোলকধাঁধার আঁকাবাঁকা পথ এড়িয়ে বের করে আনুন।", category: "Visual-Engine" },
  { id: 13, titleEn: "Typing Serenity Test", titleBn: "ধ্যানমগ্ন টাইপিং টেস্ট", emoji: "⌨️", descEn: "Type profound, peaceful quotes correctly against a tight cosmic timer.", descBn: "কড়া সময়ের ব্যবধানে পবিত্র ও শান্তিমূলক বাণীগুলো নিখুঁত টাইপ করুন।", category: "Speed" },
  { id: 14, titleEn: "Word Search Matrix", titleBn: "লুকানো শব্দ সন্ধান", emoji: "🔍", descEn: "Locate hidden positive words within a matrix grid of random spiritual letters.", descBn: "এলোমেলো লেটার গ্রিডের ভেতর থেকে ইতিবাচক শব্দগুলো খুঁজে বের করুন।", category: "Visual" },
  { id: 15, titleEn: "Dots & Boxes Connect", titleBn: "বিন্দু সংযোগ খেলা", emoji: "▫️", descEn: "Connect neighboring nodes with barriers to secure maximum tactical box territories.", descBn: "বিন্দুগুলোকে জুড়ে ঘর বানিয়ে কসমিক এআই-এর থেকে বেশি সীমানা অর্জন করুন।", category: "Indoor Board" },
  { id: 16, titleEn: "Tower of Hanoi Stack", titleBn: "হ্যানয়ের রহস্যময় টাওয়ার", emoji: "🗼", descEn: "Move disks of sizes from peg to peg so they stack in decreasing perfect logic.", descBn: "যুক্তি মেনে একের পর এক ডিস্ক সরিয়ে হ্যানয়ের আধ্যাত্মিক টাওয়ার সাজান।", category: "Logic" },
  { id: 17, titleEn: "Karma Saviours (Hangman)", titleBn: "ঝুলন্ত শব্দ উদ্ধার", emoji: "🕯️", descEn: "Solve a hidden mental health word bank before your guide's cosmic light burns out.", descBn: "আপনার গাইড মোমবাতি নিভে যাওয়ার পূর্বে গোপন শব্দটি উদ্ধার করুন।", category: "Cognitive" },
  { id: 18, titleEn: "Cosmic Rock Paper Scissors", titleBn: "মহাজাগতিক প্রতীক যুদ্ধ", emoji: "✊", descEn: "Challenge the deep-space AI with standard patterns of hand gestures.", descBn: "কসমিক এআই-কে স্ট্যান্ডার্ড সংকেতের সাহায্যে বিশ্বস্ত জয়-পরাজয়ে প্রতিদ্বন্দ্বিতা করুন।", category: "Decision" },
  { id: 19, titleEn: "Reaction Calibrator", titleBn: "তাত্ক্ষণিক প্রতিক্রিয়া যাচাই", emoji: "⏱️", descEn: "Wait for the cosmic screen to turn neon green and tap in milliseconds.", descBn: "স্ক্রিন সম্পূর্ণ সাদা থেকে সবুজ হওয়ার মুহূর্তেই নিখুঁত মিলি-সেকেন্ডে চাপুন।", category: "Reflex" },
  { id: 20, titleEn: "Visuo-Spiritual Spot-it", titleBn: "ভিন্ন রূপের সন্ধান", emoji: "👁️", descEn: "Identify the subtle odd spiritual icon out of an grid of identical ones.", descBn: "একই রকম দেখতে গ্রিডের প্রতীকগুলোর মধ্যে সূক্ষ্ম অমিলটি খুঁজে বের করুন।", category: "Visual" },
  { id: 21, titleEn: "Lung Rhythms Regulator", titleBn: "ফুসফুস ছন্দ নিয়ন্ত্রণ", emoji: "🫁", descEn: "Align with expandable visual lung bellows, matching hold and release cycle rates.", descBn: "প্রসারণশীল ছন্দের সাথে শ্বাস নেওয়া, ধরে রাখা এবং ছাড়ার গতি বজায় রাখুন।", category: "Sensory" },
  { id: 22, titleEn: "Cosmic Bubble Pop Quest", titleBn: "মহাজাগতিক বুদবুদ কোয়েস্ট", emoji: "🧼", descEn: "Pop ascending positive orbs while avoiding the dark radioactive shadow.", descBn: "রেডিওঅ্যাকটিভ শ্যাডো এড়িয়ে উপরের দিকে ভেসে ওঠা এনার্জি বাবলগুলো পপ করুন।", category: "Reflex" },
];

const MAP_POSITIONS = [
  { left: "50%", bottom: "5%" },
  { left: "30%", bottom: "13%" },
  { left: "22%", bottom: "22%" },
  { left: "42%", bottom: "30%" },
  { left: "70%", bottom: "36%" },
  { left: "78%", bottom: "45%" },
  { left: "55%", bottom: "53%" },
  { left: "28%", bottom: "60%" },
  { left: "20%", bottom: "69%" },
  { left: "45%", bottom: "76%" },
  { left: "75%", bottom: "82%" },
  { left: "72%", bottom: "91%" },
  { left: "48%", bottom: "100%" },
  { left: "25%", bottom: "108%" },
  { left: "18%", bottom: "117%" },
  { left: "38%", bottom: "125%" },
  { left: "68%", bottom: "131%" },
  { left: "76%", bottom: "140%" },
  { left: "56%", bottom: "148%" },
  { left: "32%", bottom: "155%" },
  { left: "20%", bottom: "164%" },
  { left: "50%", bottom: "172%" },
];

interface MindGamesProps {
  lang: 'en' | 'bn';
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  triggerNotification: (msg: string, type: 'success' | 'info' | 'error') => void;
  langDict: any;
}

export default function MindGames({ lang, points, setPoints, triggerNotification, langDict }: MindGamesProps) {
  // --- STATE FOR MOUNTING OR PROGRESS ---
  const [gameProgress, setGameProgress] = useState<Record<number, { beginner: boolean; pro: boolean; advance: boolean }>>(() => {
    const saved = localStorage.getItem('mind_games_progress_v3');
    let progress: Record<number, { beginner: boolean; pro: boolean; advance: boolean }> = {
      1: { beginner: false, pro: false, advance: false }
    };
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          progress = { ...progress, ...parsed };
          if (!progress[1]) {
            progress[1] = { beginner: false, pro: false, advance: false };
          }
        }
      } catch (e) { /* ignore */ }
    }
    return progress;
  });

  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [activePlayDifficulty, setActivePlayDifficulty] = useState<'beginner' | 'pro' | 'advance'>('beginner');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameSuccess, setGameSuccess] = useState<boolean | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Scroll to bottom helper for map container
  const mapScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Save progress to local storage
    localStorage.setItem('mind_games_progress_v3', JSON.stringify(gameProgress));
  }, [gameProgress]);

  // Check if a specific level is unlocked
  // Helper to verify if game N is fully cleared
  const isLevelCleared = (id: number) => {
    const prog = gameProgress[id];
    return prog ? (prog.beginner && prog.pro && prog.advance) : false;
  };

  const isLevelUnlocked = (id: number) => {
    if (id === 1) return true;
    const previousId = id - 1;
    return isLevelCleared(previousId);
  };

  // Get active unlocked levels count
  const unlockedIndex = ALL_GAMES.filter(g => isLevelUnlocked(g.id)).length;

  const currentLevel = ALL_GAMES.find(g => g.id === selectedGameId);

  // Resets the state of progress map
  const handleResetProgress = () => {
    if (confirm(lang === 'bn' ? "আপনি কি নিশ্চিত যে আপনার সমস্ত খেলার অগ্রগতি মুছে দিতে চান?" : "Are you sure you want to reset all game progression?")) {
      const initial = { 1: { beginner: false, pro: false, advance: false } };
      setGameProgress(initial);
      setSelectedGameId(null);
      setIsPlaying(false);
      triggerNotification(lang === 'bn' ? "অগ্রগতি সফলভাবে পুনরুদ্ধার করা হয়েছে!" : "Progression reset successfully!", 'success');
    }
  };

  // Safe reward allocation
  const handleMarkDifficultyComplete = (difficulty: 'beginner' | 'pro' | 'advance') => {
    if (!selectedGameId) return;
    
    // Copy the records
    const newProgress = { ...gameProgress };
    if (!newProgress[selectedGameId]) {
      newProgress[selectedGameId] = { beginner: false, pro: false, advance: false };
    }
    
    // Check if it was already resolved
    const alreadyCompleted = newProgress[selectedGameId][difficulty];
    newProgress[selectedGameId][difficulty] = true;

    // If all three difficulties are cleared for selectedGameId, unlock selectedGameId + 1
    const nextId = selectedGameId + 1;
    if (newProgress[selectedGameId].beginner && newProgress[selectedGameId].pro && newProgress[selectedGameId].advance) {
      if (nextId <= ALL_GAMES.length && !newProgress[nextId]) {
        newProgress[nextId] = { beginner: false, pro: false, advance: false };
        triggerNotification(
          lang === 'bn' 
            ? `চমৎকার! ${ALL_GAMES.find(g => g.id === nextId)?.titleBn || 'নতুন লেভেল'} আনলক হয়েছে!` 
            : `Phenomenal! ${ALL_GAMES.find(g => g.id === nextId)?.titleEn || 'Next Level'} is Unlocked on the map!`,
          'success'
        );
      }
    }

    setGameProgress(newProgress);
    setGameSuccess(true);

    if (!alreadyCompleted) {
      let coinsToAdd = 50;
      if (difficulty === 'pro') coinsToAdd = 100;
      if (difficulty === 'advance') coinsToAdd = 150;
      
      setPoints(prev => prev + coinsToAdd);
      triggerNotification(
        lang === 'bn' 
          ? `অভিনন্দন! আপনি ${difficulty === 'beginner' ? 'সহজ' : difficulty === 'pro' ? 'প্রো' : 'অ্যাডভান্স'} সংস্করণ জিতেছেন! (+${coinsToAdd} MW)` 
          : `Match won! You successfully resolved the ${difficulty.toUpperCase()} test. (+${coinsToAdd} MindPower MW)`, 
        'success'
      );
    }
  };

  // Play Again logic resets the status
  const handleStartGamePlay = () => {
    setIsPlaying(true);
    setGameSuccess(null);
    setRewardClaimed(false);
  };

  return (
    <div id="mind-games-workspace" className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
      
      {/* HEADER SECTION (SPAN ALL COLUMNS) */}
      <div className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 md:p-6 rounded-[24px] backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-500/20 to-sage/30 border border-sage/20 rounded-xl flex items-center justify-center text-sage">
            <Gamepad2 size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
              {lang === 'bn' ? 'কসমিক গেম ম্যাপ' : 'Cosmic Mind Map'}
              <span className="text-[10px] bg-sage/20 font-black border border-sage text-sage px-2 py-0.5 rounded-full tracking-wider">
                {unlockedIndex}/{ALL_GAMES.length} {lang === 'bn' ? 'আনলকড' : 'UNLOCKED'}
              </span>
            </h1>
            <p className="text-xs text-white/60 tracking-wider">
              {lang === 'bn' 
                ? 'ক্যান্ডি ক্রাশ রোডম্যাপে ২২টি অনন্য মাইন্ড গেম সম্পূর্ণ করুন। প্রতিটি ধাপে বিগিনার, প্রো এবং অ্যাডভান্স ৩টি মুডেই খেলতে হবে।' 
                : 'Conquer 22 distinct mental challenges on a Candy Crush-styled progression trail. Lock/unlock is linked to clearing all 3 difficulty tiers.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleResetProgress}
            className="px-3.5 py-1.5 rounded-xl border border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/20 bg-white/[0.02] hover:bg-red-500/5 transition-all text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} />
            {lang === 'bn' ? 'রিসেট করুন' : 'Reset Path'}
          </button>
          
          <div className="bg-sage px-4 py-2 rounded-2xl flex items-center gap-2 border border-sage/40 text-black shadow-lg shadow-sage/10 shrink-0">
            <Award size={16} />
            <div className="text-right">
              <p className="text-[9px] font-black leading-none opacity-60 uppercase">{lang === 'bn' ? 'মোট ব্যালেন্স' : 'Total Power'}</p>
              <p className="text-sm font-black tracking-tight">{points} MW</p>
            </div>
          </div>
        </div>
      </div>

      {/* ROADMAP TRAILS (LEFT 5 COLUMNS ON DESKTOP) */}
      <div className="col-span-12 lg:col-span-5 flex flex-col h-[700px] bg-neutral-950 border border-white/5 rounded-[28px] relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-radial-gradient from-[#0c0814] to-black opacity-90" />
        {/* Sky Stars Background decorations */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600&auto=format&fit=crop')] bg-cover opacity-10 bg-center" />
        
        {/* Title for map container */}
        <div className="relative z-10 p-4 border-b border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest text-[#A7C7E7] uppercase flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {lang === 'bn' ? 'মাইন্ড ট্রেইল ম্যাপ' : 'Orbital Roadmap'}
          </span>
          <span className="text-[10px] text-white/50 font-bold">
            {lang === 'bn' ? 'উপরে স্ক্রল করুন' : 'Scroll Up to Progress'}
          </span>
        </div>

        {/* Level Path Trail Container scrollable */}
        <div 
          ref={mapScrollRef}
          className="relative flex-1 overflow-y-auto overflow-x-hidden p-6 select-none scrollbar-thin scrollbar-thumb-white/10"
          style={{ display: "flex", flexDirection: "column-reverse" }} // So users visually starts scroll at bottom!
        >
          <div className="relative w-full h-[1550px] min-h-[1500px]">
            {/* Connecting Svg Lines Snaking Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#acdf87" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#8A2BE2" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FF1493" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              {/* Build curved path tracing level coordinates */}
              <path 
                d={ALL_GAMES.map((g, idx) => {
                  const pos = MAP_POSITIONS[idx];
                  const left = parseFloat(pos.left);
                  const bottom = parseFloat(pos.bottom);
                  // Calculate raw container top based on bottom %
                  // For svg we can trace relative x, y coordinates
                  // Map total h is 1550px. bottom: 5% of 1550 is 1550*0.05 = 77.5px from bottom.
                  const y = 1550 - (1550 * (bottom / 185)); // Normalize spacing
                  const x = (left / 100) * 360; // Approximating width around 360px
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="url(#glowGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 6"
                className="animate-[dash_10s_linear_infinite]"
              />
            </svg>

            {/* Spawn levels */}
            {ALL_GAMES.map((game, idx) => {
              const unlocked = isLevelUnlocked(game.id);
              const cleared = isLevelCleared(game.id);
              const selected = selectedGameId === game.id;
              const pos = MAP_POSITIONS[idx];
              const progObj = gameProgress[game.id] || { beginner: false, pro: false, advance: false };
              
              // Count how many keys completed
              const completedModesCount = [progObj.beginner, progObj.pro, progObj.advance].filter(v => v).length;

              return (
                <div 
                  key={game.id}
                  style={{
                    position: "absolute",
                    left: pos.left,
                    bottom: pos.bottom,
                    transform: "translate(-50%, 50%)",
                  }}
                  className="z-10"
                >
                  <button 
                    type="button"
                    onClick={() => {
                      if (unlocked) {
                        setSelectedGameId(game.id);
                        setIsPlaying(false);
                        setGameSuccess(null);
                        
                        // Select the first incomplete difficulty
                        const pObj = gameProgress[game.id] || { beginner: false, pro: false, advance: false };
                        if (!pObj.beginner) {
                          setActivePlayDifficulty('beginner');
                        } else if (!pObj.pro) {
                          setActivePlayDifficulty('pro');
                        } else if (!pObj.advance) {
                          setActivePlayDifficulty('advance');
                        } else {
                          setActivePlayDifficulty('beginner');
                        }
                      } else {
                        triggerNotification(
                          lang === 'bn' 
                            ? `পূর্ববর্তী স্তরগুলি সফলভাবে ৩বার সম্পন্ন করার পর এই স্তরটি আনলক হবে!`
                            : `This level is locked! Earn all 3 standard difficulty badges in preceding level ${game.id - 1} to unlock.`, 
                          'error'
                        );
                      }
                    }}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                      cleared 
                        ? 'bg-gradient-to-tr from-emerald-500 to-green-400 border-2 border-emerald-300 ring-4 ring-emerald-500/20 text-black font-black active:scale-95'
                        : unlocked 
                          ? selected
                            ? 'bg-gradient-to-tr from-amber-500 to-orange-400 border-2 border-white ring-4 ring-amber-500/40 text-black font-extrabold scale-110'
                            : 'bg-gradient-to-tr from-purple-600 to-indigo-500 border-2 border-indigo-400 ring-4 ring-purple-500/20 text-white font-extrabold hover:scale-[1.08] active:scale-95'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-sm font-black">{game.emoji}</span>

                    {/* Badge showing completed/3 */}
                    {unlocked && !cleared && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#8A2BE2] border border-purple-400 text-[8px] px-1 rounded-full font-black text-white leading-tight">
                        {completedModesCount}/3
                      </span>
                    )}

                    {/* Small number below node */}
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase tracking-widest text-white/50">
                      Level {game.id}
                    </span>

                    {/* Check icon for fully cleared levels */}
                    {cleared && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border border-emerald-400">
                        <Check size={8} className="text-emerald-500" strokeWidth={4} />
                      </div>
                    )}

                    {/* Padlock icon for locked level */}
                    {!unlocked && (
                      <div className="absolute inset-0 bg-neutral-900/60 rounded-full flex items-center justify-center text-neutral-500">
                        <Lock size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                    
                  {/* Visual glow ring for active level */}
                  {unlocked && !cleared && (
                    <div className="absolute inset-0 -m-1 border border-sage/40 rounded-full animate-ping pointer-events-none opacity-40" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVE GAME CONTROL CENTER (RIGHT 7 COLUMNS ON DESKTOP) */}
      <div className="col-span-12 lg:col-span-7 flex flex-col min-h-[500px] h-[700px] bg-neutral-900/40 border border-white/5 rounded-[28px] overflow-hidden relative shadow-2xl">
        
        {/* If no level selected */}
        {!currentLevel ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(138,43,226,0.04)_0%,transparent_70%)]" />
            
            <div className="relative w-24 h-24 mb-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20">
              <Gamepad2 size={56} strokeWidth={1} />
            </div>
            
            <h3 className="text-lg font-black text-white/95 uppercase tracking-wide">
              {lang === 'bn' ? 'কোনো গেম নির্বাচিত নেই' : 'Select a Challenge Level'}
            </h3>
            <p className="max-w-xs text-xs text-white/50 mt-2 leading-relaxed">
              {lang === 'bn' 
                ? 'বামে অবস্থিত কসমিক রোডম্যাপ থেকে যেকোনো আনলকড স্তরে ক্লিক করুন এবং খেলা শুরু করুন।' 
                : 'Click on any unlocked energy node from the starry roadmap on the left to begin your interactive challenge.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            {/* Play/Detail Control layout */}
            <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentLevel.emoji}</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest text-sage border border-sage/20 px-1.5 py-0.5 rounded-full uppercase">
                      Level {currentLevel.id}
                    </span>
                    <span className="text-[10px] text-white/40 font-bold uppercase">{currentLevel.category}</span>
                  </div>
                  <h2 className="text-base md:text-lg font-black text-white leading-tight">
                    {lang === 'bn' ? currentLevel.titleBn : currentLevel.titleEn}
                  </h2>
                </div>
              </div>

              {isPlaying && (
                <button 
                  type="button"
                  onClick={() => setIsPlaying(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Undo size={11} />
                  {lang === 'bn' ? 'ম্যাপে ফিরুন' : 'Exit Game'}
                </button>
              )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-4 md:p-6 flex flex-col overflow-y-auto">
              {!isPlaying ? (
                // GAME DETAIL GATEWAY SCREEN
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Game banner/card */}
                    <div className="relative p-5 rounded-2xl bg-white/[0.02] border border-white/5 mb-6 overflow-hidden">
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 text-white/[0.02] transform rotate-12">
                        <Gamepad2 size={128} />
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed font-medium">
                        {lang === 'bn' ? currentLevel.descBn : currentLevel.descEn}
                      </p>
                    </div>

                    {/* Unlock Status Badges beginner, pro, advance */}
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-[#A7C7E7] mb-3">
                      {lang === 'bn' ? '১. খেলা সম্পন্ন করুন (৩টি মুড):' : '1. Clear All 3 Game Difficulties:'}
                    </h4>

                    {(() => {
                      const prog = gameProgress[currentLevel.id] || { beginner: false, pro: false, advance: false };
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                          {[
                            { key: 'beginner' as const, label: lang === 'bn' ? 'বিগিনার' : 'Beginner', points: '+50 MW', class: 'border-yellow-500/20 text-yellow-300 bg-yellow-500/5', colorCode: 'yellow' },
                            { key: 'pro' as const, label: lang === 'bn' ? 'প্রো' : 'Pro', points: '+100 MW', class: 'border-cyan-500/20 text-cyan-300 bg-cyan-500/5', colorCode: 'cyan' },
                            { key: 'advance' as const, label: lang === 'bn' ? 'অ্যাডভান্স' : 'Advance', points: '+150 MW', class: 'border-purple-500/20 text-purple-300 bg-purple-500/5', colorCode: 'purple' }
                          ].map((tier) => {
                            const completed = prog[tier.key];
                            const isTierUnlocked = (() => {
                              if (tier.key === 'beginner') return true;
                              if (tier.key === 'pro') return prog.beginner;
                              if (tier.key === 'advance') return prog.pro;
                              return false;
                            })();

                            return (
                              <button
                                key={tier.key}
                                type="button"
                                onClick={() => {
                                  if (isTierUnlocked) {
                                    setActivePlayDifficulty(tier.key);
                                  } else {
                                    triggerNotification(
                                      lang === 'bn' 
                                        ? `এই অসুবিধাটি লকড রয়েছে! এটি আনলক করতে আগের ধাপটি সম্পন্ন করুন।`
                                        : `This difficulty is locked! Perfect the previous tier to unlock this mode.`, 
                                      'error'
                                    );
                                  }
                                }}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-between gap-2.5 transition-all text-center cursor-pointer ${
                                  !isTierUnlocked 
                                    ? 'opacity-50 border-white/5 bg-black/40 cursor-not-allowed'
                                    : activePlayDifficulty === tier.key 
                                      ? 'border-sage bg-sage/10 scale-[1.03] shadow-lg shadow-sage/5' 
                                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-h-[22px]">
                                  {completed ? (
                                    <CheckCircle size={14} className="text-emerald-400" />
                                  ) : !isTierUnlocked ? (
                                    <Lock size={12} className="text-white/35" />
                                  ) : (
                                    <Star size={14} className="text-amber-400 animate-pulse" />
                                  )}
                                  <span className={`text-xs font-black uppercase tracking-wider ${activePlayDifficulty === tier.key && isTierUnlocked ? 'text-sage' : 'text-white'}`}>
                                    {tier.label}
                                  </span>
                                </div>
                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/50 border border-white/5">
                                  {tier.points}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${completed ? 'text-emerald-400' : isTierUnlocked ? 'text-white/40' : 'text-red-400/60'}`}>
                                  {completed 
                                    ? (lang === 'bn' ? 'সম্পন্ন' : 'CLEARED') 
                                    : isTierUnlocked 
                                      ? (lang === 'bn' ? 'খেলুন' : 'PLAYABLE') 
                                      : (lang === 'bn' ? 'লকড' : 'LOCKED')}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Game Rules / Instructions Summary */}
                    <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/10 flex items-start gap-3">
                      <Info size={16} className="text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-left text-xs text-purple-300/80 leading-relaxed">
                        <p className="font-extrabold text-[#A7C7E7] uppercase text-[9px] tracking-wider mb-1">
                          {lang === 'bn' ? 'খেলার নিয়ম এবং শর্তাবলী:' : 'Active Level Guidelines:'}
                        </p>
                        <p>
                          {lang === 'bn' 
                            ? 'আপনি বিগিনার মুড সম্পন্ন করে প্রো এবং প্রো সম্পন্ন করে অ্যাডভান্সড মুড আনলক করতে পারবেন। ৩টি মুডেই ১ বার করে জয়ী হওয়ার পর পরবর্তী লেভেলটি স্বয়ংক্রিয়ভাবে আনলকড হয়ে যাবে!'
                            : `Play through the difficulties in order: Win Beginner to unlock Pro, and win Pro to unlock Advance! Unlock the next cosmic level once all three tiers are successfully cleared!`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Play Action */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-2">
                    <button 
                      type="button"
                      onClick={handleStartGamePlay}
                      className="flex-1 min-h-[52px] py-3.5 px-6 rounded-2xl bg-sage hover:bg-sage/90 text-black font-black uppercase tracking-widest text-[11px] shadow-lg shadow-sage/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Play className="fill-black text-black shrink-0" size={14} />
                      <span className="truncate">{lang === 'bn' ? 'খেলা আরম্ভ করুন' : 'Launch Level Arena'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                // DYNAMIC ACTIVE GAME ENGINE INJECTED!
                <div className="flex-1 flex flex-col justify-between">
                  <div className="p-2 border border-white/5 rounded-2xl bg-black/60 backdrop-blur-md mb-4 flex items-center justify-between">
                    <span className="text-[9px] font-black tracking-widest text-[#A7C7E7] uppercase">
                      {lang === 'bn' ? 'খেলা চলছে' : 'Active Field Arena'}: {activePlayDifficulty.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-white/50">
                      Reward: {activePlayDifficulty === 'beginner' ? '50' : activePlayDifficulty === 'pro' ? '100' : '150'} MW
                    </span>
                  </div>

                  {/* Render actual mini games depending on level id */}
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[340px] p-3 rounded-2xl bg-[#09060f] border border-white/5 relative">
                    {gameSuccess !== null ? (
                      // Game End Screen / Victory Indicator inside frame
                      <div className="flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                          <Trophy size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">
                          {lang === 'bn' ? 'পরীক্ষায় উত্তীর্ণ!' : 'Session Complete!'}
                        </h3>
                        <p className="text-xs text-white/60 max-w-xs mt-2 leading-relaxed">
                          {lang === 'bn' 
                            ? `অভিনন্দন! আপনি সফলভাবে এই মুডটি জয় করতে সক্ষম হয়েছেন এবং শক্তি বৃদ্ধি পেয়েছেন।` 
                            : `Excellent cognitive work! We have fully recorded your balance, coordination parameters and validated success.`}
                        </p>

                        <div className="mt-6 flex gap-3">
                          <button 
                            type="button"
                            onClick={() => {
                              setIsPlaying(false);
                              setGameSuccess(null);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-sage hover:bg-sage/80 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            {lang === 'bn' ? 'ম্যাপে ফিরে যান' : 'Back to Trails'}
                          </button>
                          <button 
                            type="button"
                            onClick={handleStartGamePlay}
                            className="px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            {lang === 'bn' ? 'আবার খেলুন' : 'Play Again'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Launch Game Wrapper
                      <div className="w-full h-full flex flex-col justify-between">
                        <ActiveGameArena 
                          levelId={currentLevel.id} 
                          difficulty={activePlayDifficulty} 
                          lang={lang} 
                          onWin={() => handleMarkDifficultyComplete(activePlayDifficulty)}
                          onLose={() => {
                            triggerNotification(lang === 'bn' ? "খেলা শেষ! আবার চেষ্টা করুন।" : "Goal missed! Try again.", "error");
                            setGameSuccess(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Manual fallback trigger for development or difficult blocks */}
                  {gameSuccess === null && (
                    <div className="mt-4 flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[9px] text-white/40 italic font-medium">
                        {lang === 'bn' 
                          ? 'যদি কোনো বাগ হয় তবে কসমিক ফোর্স দিয়ে লেভেল শেষ করতে পারেন:' 
                          : 'Stuck or completed? Safely submit status:'}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleMarkDifficultyComplete(activePlayDifficulty)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        {lang === 'bn' ? 'সরাসরি সম্পূর্ণ করুন' : 'Force Solved status'}
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// =========================================================================
// INTERACTIVE GAME COMPONENT SWITCHING
// =========================================================================
interface GameArenaProps {
  levelId: number;
  difficulty: 'beginner' | 'pro' | 'advance';
  lang: 'en' | 'bn';
  onWin: () => void;
  onLose: () => void;
}

function ActiveGameArena({ levelId, difficulty, lang, onWin, onLose }: GameArenaProps) {
  switch (levelId) {
    case 1:
      return <MemoryCardGame difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
    case 2:
      return <TicTacToeGame difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
    case 3:
      return <WordScrambleGame difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
    case 4:
      return <StroopSensoryGame difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
    case 5:
      return <ZenMathGame difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
    case 6:
      return <AuraStarTapGame difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
    case 7:
      return <LudoDiceGame difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
    case 8:
      return <SimonSaysGame difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
    default:
      // Fallback puzzle to cover 9-22 beautifully and unified with active parameters
      return <UnifiedCosmicPuzzle levelId={levelId} difficulty={difficulty} lang={lang} onWin={onWin} onLose={onLose} />;
  }
}

// =========================================================================
// GAME 1: MEMORY CARD GAME (FULLY FUNCTIONAL)
// =========================================================================
function MemoryCardGame({ difficulty, lang, onWin, onLose }: Omit<GameArenaProps, 'levelId'>) {
  const [cards, setCards] = useState<{ id: number; symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  // Emojis mapping
  const symbols = ['⭐', '🔮', '🧘', '🌟', '🧩', '🎨', '🔢', '🎲'];

  useEffect(() => {
    // Beginner: 4 cards (2 pairs), Pro: 8 cards (4 pairs), Advance: 12 cards (6 pairs)
    const pairsCount = difficulty === 'beginner' ? 2 : difficulty === 'pro' ? 4 : 6;
    const gameSymbols = symbols.slice(0, pairsCount);
    let deck = [...gameSymbols, ...gameSymbols].map((sym, idx) => ({
      id: idx,
      symbol: sym,
      flipped: false,
      matched: false
    }));
    // Randomize shuffle
    deck.sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelected([]);
    setMoves(0);
  }, [difficulty]);

  const handleCardClick = (id: number) => {
    if (selected.length === 2 || cards[id].flipped || cards[id].matched) return;

    // Flip card
    const deck = [...cards];
    deck[id].flipped = true;
    setCards(deck);

    const newSelected = [...selected, id];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const [firstIdx, secondIdx] = newSelected;
      if (deck[firstIdx].symbol === deck[secondIdx].symbol) {
        // Match!
        deck[firstIdx].matched = true;
        deck[secondIdx].matched = true;
        setCards(deck);
        setSelected([]);

        // Check win
        if (deck.every(c => c.matched)) {
          setTimeout(() => onWin(), 400);
        }
      } else {
        // Reset flip
        setTimeout(() => {
          deck[firstIdx].flipped = false;
          deck[secondIdx].flipped = false;
          setCards(deck);
          setSelected([]);
        }, 800);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-white text-xs mb-3 flex justify-between w-full font-bold">
        <span>Moves: {moves}</span>
        <span>{difficulty === 'beginner' ? '4 Cards' : difficulty === 'pro' ? '8 Cards' : '12 Cards'}</span>
      </div>
      <div className={`grid gap-3 ${difficulty === 'beginner' ? 'grid-cols-2' : difficulty === 'pro' ? 'grid-cols-4' : 'grid-cols-4'}`}>
        {cards.map(card => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleCardClick(card.id)}
            className={`w-16 h-16 rounded-xl border flex items-center justify-center text-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
              card.flipped || card.matched
                ? 'bg-sage text-black font-black rotate-180 border-sage shadow-md'
                : 'bg-white/[0.03] text-transparent border-white/5 hover:bg-white/5'
            }`}
          >
            {(card.flipped || card.matched) ? card.symbol : "❓"}
          </button>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// GAME 2: TIC TAC TOE (FULLY FUNCTIONAL VS INTUITIVE COGNITIVE AI)
// =========================================================================
function TicTacToeGame({ difficulty, lang, onWin, onLose }: Omit<GameArenaProps, 'levelId'>) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.every(sq => sq !== null) ? 'Draw' : null;
  };

  const handleSquareClick = (idx: number) => {
    if (board[idx] || checkWinner(board) || !isXNext) return;

    // Player Move
    const copy = [...board];
    copy[idx] = 'X';
    setBoard(copy);
    setIsXNext(false);

    const winner = checkWinner(copy);
    if (winner === 'X') {
      setTimeout(() => onWin(), 500);
      return;
    } else if (winner === 'Draw') {
      setTimeout(() => onLose(), 500); // Trigger restart or failure
      return;
    }

    // AI Move
    setTimeout(() => {
      const aiCopy = [...copy];
      let move = -1;

      if (difficulty === 'beginner') {
        // Random move
        const available = aiCopy.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
        if (available.length > 0) move = available[Math.floor(Math.random() * available.length)];
      } else {
        // Smart AI
        // 1. Can win?
        for (let i = 0; i < 9; i++) {
          if (aiCopy[i] === null) {
            const test = [...aiCopy];
            test[i] = 'O';
            if (checkWinner(test) === 'O') { move = i; break; }
          }
        }
        // 2. Must block player?
        if (move === -1) {
          for (let i = 0; i < 9; i++) {
            if (aiCopy[i] === null) {
              const test = [...aiCopy];
              test[i] = 'X';
              if (checkWinner(test) === 'X') { move = i; break; }
            }
          }
        }
        // 3. Middle spot priority
        if (move === -1 && aiCopy[4] === null) {
          move = 4;
        }
        // 4. Random fallback
        if (move === -1) {
          const available = aiCopy.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
          if (available.length > 0) move = available[Math.floor(Math.random() * available.length)];
        }
      }

      if (move !== -1) {
        aiCopy[move] = 'O';
        setBoard(aiCopy);
        setIsXNext(true);

        const aiWinner = checkWinner(aiCopy);
        if (aiWinner === 'O') {
          setTimeout(() => onLose(), 500);
        } else if (aiWinner === 'Draw') {
          // Draw in tick tack toe counts as secondary victory under pro to prevent stress
          setTimeout(() => onWin(), 500);
        }
      }
    }, 400);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <p className="text-white text-xs mb-3 font-semibold uppercase tracking-wider text-center">
        {lang === 'bn' ? 'আপনি (X) বনাম কসমিক এআই (O)' : 'You (X) vs Cosmic AI (O)'}
      </p>
      <div className="grid grid-cols-3 gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/5 max-w-[200px]">
        {board.map((sq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSquareClick(idx)}
            className={`w-14 h-14 rounded-xl text-xl font-black flex items-center justify-center transition-all cursor-pointer ${
              sq === 'X' 
                ? 'bg-sage text-black font-black' 
                : sq === 'O' 
                  ? 'bg-purple-600 text-white font-black' 
                  : 'bg-black hover:bg-white/[0.03] border border-white/5 hover:border-white/10 text-transparent'
            }`}
          >
            {sq || "?"}
          </button>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// GAME 3: WORD SCRAMBLE
// =========================================================================
function WordScrambleGame({ difficulty, lang, onWin, onLose }: Omit<GameArenaProps, 'levelId'>) {
  const dictionary = [
    { word: "PEACE", scrambled: "EACPE", hint: "Quiet state of absolute relaxation." },
    { word: "SOUL", scrambled: "ULSO", hint: "The spiritual metadata inside of you." },
    { word: "CHAKRA", scrambled: "RKAHAC", hint: "Pranic cosmic energy centers within the spine." },
    { word: "BREATHE", scrambled: "HETBAER", hint: "Inhale, hold, exhale." },
    { word: "ENERGY", scrambled: "YNEGER", hint: "Quantum dynamic biofield power." },
    { word: "SILENCE", scrambled: "ECESILN", hint: "Absent of mental noise." },
  ];

  const [activeItem, setActiveItem] = useState<{ word: string; scrambled: string; hint: string } | null>(null);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    const item = dictionary[Math.floor(Math.random() * dictionary.length)];
    setActiveItem(item);
    setUserInput("");
  }, [difficulty]);

  const handleSubmit = () => {
    if (!activeItem) return;
    if (userInput.toUpperCase().trim() === activeItem.word) {
      onWin();
    } else {
      onLose();
    }
  };

  return (
    <div className="w-full flex flex-col items-center p-2 text-center">
      {activeItem && (
        <div className="flex-1 w-full flex flex-col items-center justify-between">
          <div>
            <span className="text-3xl tracking-widest font-black text-sage uppercase select-text">
              {activeItem.scrambled}
            </span>
            <p className="text-[10px] text-white/50 max-w-xs mt-3 select-text italic text-center">
              Hint: "{activeItem.hint}"
            </p>
          </div>

          <div className="w-full max-w-xs mt-8 flex flex-col gap-2">
            <input 
              type="text"
              placeholder={lang === 'bn' ? 'সঠিক বানান লিখুন...' : 'Type solved word...'}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-center text-white text-sm font-extrabold uppercase focus:outline-none focus:border-sage tracking-widest placeholder:normal-case placeholder:tracking-normal"
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2.5 rounded-xl bg-sage font-black text-xs text-black uppercase cursor-pointer"
            >
              {lang === 'bn' ? 'উত্তর মেলান' : 'Submit Answer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// GAME 4: STROOP COLOR MATCH
// =========================================================================
function StroopSensoryGame({ difficulty, lang, onWin, onLose }: Omit<GameArenaProps, 'levelId'>) {
  const dataset = [
    { text: "RED", textColor: "text-rose-500", rawColorName: "red", match: true },
    { text: "GREEN", textColor: "text-emerald-500", rawColorName: "green", match: true },
    { text: "BLUE", textColor: "text-blue-500", rawColorName: "blue", match: true },
    { text: "RED", textColor: "text-blue-500", rawColorName: "blue", match: false },
    { text: "GREEN", textColor: "text-rose-500", rawColorName: "red", match: false },
    { text: "BLUE", textColor: "text-emerald-500", rawColorName: "green", match: false },
  ];

  const [active, setActive] = useState<typeof dataset[0] | null>(null);
  const [score, setScore] = useState(0);
  const targetScore = difficulty === 'beginner' ? 3 : difficulty === 'pro' ? 5 : 7;

  useEffect(() => {
    loadNext();
    setScore(0);
  }, [difficulty]);

  const loadNext = () => {
    const item = dataset[Math.floor(Math.random() * dataset.length)];
    setActive(item);
  };

  const handleDecision = (clickedYes: boolean) => {
    if (!active) return;
    const isCorrect = clickedYes === active.match;
    if (isCorrect) {
      const nextScore = score + 1;
      setScore(nextScore);
      if (nextScore >= targetScore) {
        onWin();
      } else {
        loadNext();
      }
    } else {
      onLose();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-between p-2 h-full">
      <div className="text-white text-[10px] font-bold text-center flex justify-between w-full">
        <span>Score: {score}/{targetScore}</span>
        <span>Stroke Test</span>
      </div>

      {active && (
        <div className="my-8 py-5 px-8 rounded-3xl bg-white/[0.02] border border-white/5">
          <span className={`text-4xl font-extrabold uppercase tracking-widest ${active.textColor}`}>
            {active.text}
          </span>
        </div>
      )}

      <p className="text-[10px] text-white/40 tracking-wider text-center max-w-xs leading-normal mb-6">
        {lang === 'bn' ? 'প্রশ্ন: লেখার অর্থ কি কালির রঙের সাথে মিলছে?' : 'Is the written name of color SAME as the text font color?'}
      </p>

      <div className="w-full max-w-xs flex gap-3">
        <button
          type="button"
          onClick={() => handleDecision(true)}
          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs rounded-xl cursor-pointer"
        >
          {lang === 'bn' ? 'হ্যাঁ' : 'YES'}
        </button>
        <button
          type="button"
          onClick={() => handleDecision(false)}
          className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-xs rounded-xl cursor-pointer"
        >
          {lang === 'bn' ? 'না' : 'NO'}
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// GAME 5: ZEN MATH SPEED RUN
// =========================================================================
function ZenMathGame({ difficulty, lang, onWin, onLose }: Omit<GameArenaProps, 'levelId'>) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [correctValue, setCorrectValue] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const target = difficulty === 'beginner' ? 3 : difficulty === 'pro' ? 5 : 8;

  const generateQuestion = () => {
    let n1 = 0;
    let n2 = 0;
    let op = '+';
    let ans = 0;

    if (difficulty === 'beginner') {
      n1 = Math.floor(Math.random() * 9) + 1;
      n2 = Math.floor(Math.random() * 9) + 1;
      op = Math.random() > 0.5 ? '+' : '-';
      ans = op === '+' ? n1 + n2 : n1 - n2;
    } else if (difficulty === 'pro') {
      n1 = Math.floor(Math.random() * 20) + 5;
      n2 = Math.floor(Math.random() * 15) + 3;
      op = Math.random() > 0.4 ? '+' : Math.random() > 0.5 ? '-' : '*';
      ans = op === '+' ? n1 + n2 : op === '-' ? n1 - n2 : n1 * n2;
    } else {
      n1 = Math.floor(Math.random() * 50) + 10;
      n2 = Math.floor(Math.random() * 30) + 10;
      op = Math.random() > 0.6 ? '*' : Math.random() > 0.3 ? '-' : '+';
      ans = op === '+' ? n1 + n2 : op === '-' ? n1 - n2 : n1 * n2;
    }

    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setCorrectValue(ans);

    // Create 4 distinct options containing direct match
    const alt1 = ans + (Math.floor(Math.random() * 4) + 1);
    const alt2 = ans - (Math.floor(Math.random() * 4) + 1);
    const alt3 = ans + 10;
    const opts = [ans, alt1, alt2, alt3].sort(() => Math.random() - 0.5);
    setOptions(opts);
  };

  useEffect(() => {
    generateQuestion();
    setAnsweredCount(0);
  }, [difficulty]);

  const handleChooseOption = (val: number) => {
    if (val === correctValue) {
      const next = answeredCount + 1;
      setAnsweredCount(next);
      if (next >= target) {
        onWin();
      } else {
        generateQuestion();
      }
    } else {
      onLose();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-2">
      <div className="text-white text-[10px] font-bold text-center flex justify-between w-full">
        <span>Cleared: {answeredCount}/{target}</span>
        <span>Mental Math</span>
      </div>

      <div className="my-6 text-center select-text">
        <span className="text-4xl font-black text-sage tracking-wider">
          {num1} {operator} {num2} = ?
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {options.map((opt, id) => (
          <button
            key={id}
            type="button"
            onClick={() => handleChooseOption(opt)}
            className="py-3 px-2 bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/10 text-white rounded-xl text-xs font-extrabold focus:outline-none focus:border-sage transition-all cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// GAME 6: CLICK REFLEX
// =========================================================================
function AuraStarTapGame({ difficulty, lang, onWin, onLose }: Omit<GameArenaProps, 'levelId'>) {
  const [starPosition, setStarPosition] = useState({ top: "50%", left: "50%" });
  const [tapCount, setTapCount] = useState(0);
  const target = difficulty === 'beginner' ? 4 : difficulty === 'pro' ? 8 : 12;

  const moveStar = () => {
    const randomTop = Math.floor(Math.random() * 70) + 15; // Percent
    const randomLeft = Math.floor(Math.random() * 70) + 15;
    setStarPosition({ top: `${randomTop}%`, left: `${randomLeft}%` });
  };

  useEffect(() => {
    moveStar();
    setTapCount(0);
  }, [difficulty]);

  const handleStarTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= target) {
      onWin();
    } else {
      moveStar();
    }
  };

  return (
    <div className="w-full flex flex-col justify-between items-center h-full p-2 relative overflow-hidden">
      <div className="text-white text-[10px] font-bold text-center flex justify-between w-full z-10">
        <span>Tapped: {tapCount}/{target}</span>
        <span>Spiritual Reflexes</span>
      </div>

      <div className="absolute inset-0 z-0">
        <button
          type="button"
          onClick={handleStarTap}
          style={{
            position: "absolute",
            top: starPosition.top,
            left: starPosition.left,
            transform: "translate(-50%, -50%)",
          }}
          className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-full flex items-center justify-center text-xl shadow-lg ring-8 ring-amber-500/20 active:scale-90 transition-transform duration-100 cursor-pointer"
        >
          ✨
        </button>
      </div>

      <p className="text-[10px] text-white/30 tracking-wider text-center mt-auto z-10 pointers-events-none">
        {lang === 'bn' ? 'দ্রুত চলমান সোনালী তারকার উপরে আলতো চাপুন!' : 'Tap instantly on the flashing active cosmic star element!'}
      </p>
    </div>
  );
}

// =========================================================================
// GAME 7: LUDO DICE SIMULATOR
// =========================================================================
function LudoDiceGame({ difficulty, lang, onWin, onLose }: Omit<GameArenaProps, 'levelId'>) {
  const [playerPos, setPlayerPos] = useState(0);
  const [aiPos, setAiPos] = useState(0);
  const [activeDice, setActiveDice] = useState<number>(1);
  const [gameLog, setGameLog] = useState("");
  const [isAiRolling, setIsAiRolling] = useState(false);

  // Roll dice action
  const handleRollDice = () => {
    if (isAiRolling) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    setActiveDice(roll);
    
    const nextPos = playerPos + roll;
    if (nextPos >= 15) {
      setPlayerPos(15);
      setGameLog(lang === 'bn' ? "অভিনন্দন! আপনি লুডো রেসে বিজয়ী!" : "Amazing! You reached final quadrant before the AI.");
      setTimeout(() => onWin(), 1000);
      return;
    } else {
      setPlayerPos(nextPos);
      setGameLog(lang === 'bn' ? `আপনি পান ${roll} এবং সামনে এগোচ্ছেন!` : `You rolled a ${roll}! Stepping forward on the board.`);
    }

    // Trigger AI response path and values
    setIsAiRolling(true);
    setTimeout(() => {
      // Pro/Advance AI can roll slightly better offsets
      const aiAdd = difficulty === 'advance' ? 1.2 : 0;
      const aiRoll = Math.min(6, Math.max(1, Math.floor(Math.random() * 6 + aiAdd) + 1));
      
      const nextAiPos = aiPos + aiRoll;
      if (nextAiPos >= 15) {
        setAiPos(15);
        setGameLog(lang === 'bn' ? "হায়! এআই শেষ সীমানায় পৌঁছে জিতে গেছে।" : "Oh no! AI rolled a perfect count and claimed the race.");
        setTimeout(() => onLose(), 1000);
      } else {
        setAiPos(nextAiPos);
        setGameLog(lang === 'bn' ? `এআই চালের পর ওড়ালো ${aiRoll}!` : `Cosmic AI rolled ${aiRoll}! Catch up!`);
      }
      setIsAiRolling(false);
    }, 1000);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-2">
      <div className="flex justify-between w-full text-white text-[10px] font-bold">
        <span>Board Length: 15 Tiles</span>
        <span>Ludo Race</span>
      </div>

      {/* Track visuals */}
      <div className="w-full flex flex-col gap-2 bg-white/[0.02] p-3 rounded-2xl border border-white/5 my-4">
        {/* Track Player */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] min-w-[50px] uppercase font-bold text-sage">YOU (🟢):</span>
          <div className="flex-1 h-3 bg-neutral-900 border border-white/5 rounded-full relative flex items-center">
            <div 
              style={{ left: `${(playerPos / 15) * 90}%` }}
              className="absolute w-5 h-5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[10px] shadow-md transition-all duration-300"
            >
              🟢
            </div>
          </div>
        </div>

        {/* Track AI */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] min-w-[50px] uppercase font-bold text-purple-400">AI (🔴):</span>
          <div className="flex-1 h-3 bg-neutral-900 border border-white/5 rounded-full relative flex items-center box-content">
            <div 
              style={{ left: `${(aiPos / 15) * 90}%` }}
              className="absolute w-5 h-5 rounded-full bg-rose-500 border border-white flex items-center justify-center text-[10px] shadow-md transition-all duration-300 animate-pulse"
            >
              🔴
            </div>
          </div>
        </div>
      </div>

      <div className="text-center bg-black/40 px-4 py-2 rounded-xl text-[10px] border border-white/5 text-slate-300 font-bold min-h-[36px] max-w-sm">
        {gameLog || (lang === 'bn' ? "ডাইসটি ঘুরিয়ে খেলা আরম্ভ করুন!" : "Press Dice Trigger below and race to final block 15 first!")}
      </div>

      <div className="my-4 flex flex-col items-center">
        <button
          type="button"
          disabled={isAiRolling}
          onClick={handleRollDice}
          className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-white to-neutral-200 border border-white text-black text-2xl font-black flex items-center justify-center cursor-pointer active:scale-95 shadow-lg relative ${isAiRolling ? 'opacity-40 cursor-wait' : ''}`}
        >
          {activeDice === 1 ? '⚀' : activeDice === 2 ? '⚁' : activeDice === 3 ? '⚂' : activeDice === 4 ? '⚃' : activeDice === 5 ? '⚄' : '⚅'}
        </button>
        <span className="text-[9px] text-[#A7C7E7] font-bold tracking-widest uppercase mt-2">
          {isAiRolling ? (lang === 'bn' ? "এআই চাল নিচ্ছে..." : "AI Rolling...") : (lang === 'bn' ? "ডাইস রোল করুন" : "ROLL DICE")}
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// GAME 8: SIMON SAYS (SEQUENCE RECALL)
// =========================================================================
function SimonSaysGame({ difficulty, lang, onWin, onLose }: Omit<GameArenaProps, 'levelId'>) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [activeLight, setActiveLight] = useState<number | null>(null);
  const targetLength = difficulty === 'beginner' ? 3 : difficulty === 'pro' ? 5 : 7;

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const startNewGame = () => {
    const initialSeq = [Math.floor(Math.random() * 4)];
    setSequence(initialSeq);
    setUserSequence([]);
    playSequence(initialSeq);
  };

  const playSequence = (seq: number[]) => {
    setIsPlayingSeq(true);
    let i = 0;
    const interval = setInterval(() => {
      setActiveLight(seq[i]);
      setTimeout(() => setActiveLight(null), 400);
      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setTimeout(() => setIsPlayingSeq(false), 500);
      }
    }, 750);
  };

  const handlePadClick = (id: number) => {
    if (isPlayingSeq) return;
    
    // Light up effect
    setActiveLight(id);
    setTimeout(() => setActiveLight(null), 200);

    const newUserSeq = [...userSequence, id];
    setUserSequence(newUserSeq);

    // Verify
    const currentStepIndex = newUserSeq.length - 1;
    if (newUserSeq[currentStepIndex] !== sequence[currentStepIndex]) {
      // Mistake!
      onLose();
      return;
    }

    if (newUserSeq.length === sequence.length) {
      if (sequence.length >= targetLength) {
        // Safe Victory
        onWin();
      } else {
        // Next stack
        const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(nextSeq);
        setUserSequence([]);
        setTimeout(() => playSequence(nextSeq), 800);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-2">
      <div className="flex justify-between w-full text-white text-[10px] font-bold">
        <span>Step: {sequence.length}/{targetLength}</span>
        <span>Color Memory</span>
      </div>

      <p className="text-[10px] text-white/50 tracking-wider text-center max-w-xs mb-3">
        {isPlayingSeq ? (lang === 'bn' ? "মনোযোগ দিয়ে কালার প্যাটার্ন দেখুন..." : "Observe key sequence patterns carefully...") : (lang === 'bn' ? "আপনার চাল! প্যাটার্নটি পুনরাবৃত্তি করুন" : "Your turn! Tap pads in exact sequence pattern")}
      </p>

      {/* Grid of colors */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-950 border border-white/5 rounded-2xl w-full max-w-[180px] aspect-square">
        {[
          { id: 0, color: "bg-red-500", glow: "bg-red-300 ring-4 ring-red-500/50" },
          { id: 1, color: "bg-emerald-500", glow: "bg-emerald-300 ring-4 ring-emerald-500/50" },
          { id: 2, color: "bg-blue-500", glow: "bg-blue-300 ring-4 ring-blue-500/50" },
          { id: 3, color: "bg-yellow-500", glow: "bg-yellow-300 ring-4 ring-yellow-500/50" }
        ].map(pad => (
          <button
            key={pad.id}
            type="button"
            disabled={isPlayingSeq}
            onClick={() => handlePadClick(pad.id)}
            className={`w-16 h-16 rounded-xl transition-all border border-black cursor-pointer ${
              activeLight === pad.id ? `${pad.glow} scale-105` : `${pad.color} opacity-30 hover:opacity-55`
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// UNIFIED COSMIC PUZZLE FALLBACK (COVERS LEVEL 9 to 22 INTERACTIVELY)
// =========================================================================
function UnifiedCosmicPuzzle({ levelId, difficulty, lang, onWin, onLose }: GameArenaProps) {
  const [guessVal, setGuessVal] = useState<number[]>([]);
  const [targetItem, setTargetItem] = useState<{ label: string; offset: number }>({ label: "", offset: 5 });
  const [score, setScore] = useState(0);

  const optionsMap = [
    { label: "Positive Coherence Sync (স্থিতিশীলতা অনুনাদ)", offset: 12 },
    { label: "Neural Pathways Calibrations (নিউরাল ত্বরিত চালনা)", offset: 8 },
    { label: "Third-Eye Gaze Target (আজ্ঞা চক্র ট্র্যাকিং)", offset: 15 },
    { label: "Aura Density Deflector (আভা ফিল্টার সমাধান)", offset: 20 },
    { label: "Resilience Breath Metric (ফুসফুসের আধ্যাত্মিক ভারসাম্য)", offset: 3 },
  ];

  const generateNewQuestion = () => {
    const item = optionsMap[levelId % optionsMap.length];
    setTargetItem(item);
    // Create random list
    const factor = difficulty === 'beginner' ? 3 : difficulty === 'pro' ? 5 : 7;
    const array: number[] = [];
    for (let i = 0; i < 4; i++) {
      array.push(Math.floor(Math.random() * factor) + item.offset);
    }
    // inject guaranteed matching target
    const correctGuess = array[Math.floor(Math.random() * 4)];
    setTargetItem({ label: item.label, offset: correctGuess });
    setGuessVal(array);
  };

  useEffect(() => {
    generateNewQuestion();
    setScore(0);
  }, [levelId, difficulty]);

  const handleGuess = (val: number) => {
    if (val === targetItem.offset) {
      const next = score + 1;
      setScore(next);
      const goal = difficulty === 'beginner' ? 1 : difficulty === 'pro' ? 2 : 3;
      if (next >= goal) {
        onWin();
      } else {
        generateNewQuestion();
      }
    } else {
      onLose();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-2 select-text">
      <div className="flex justify-between w-full text-white text-[10px] font-bold">
        <span>Level: {levelId} / 22 Core</span>
        <span>Goal: Cosmic Resonance</span>
      </div>

      <div className="my-6 text-center select-text">
        <span className="text-[10px] uppercase tracking-widest text-[#A7C7E7] font-black leading-none block mb-2">
          {targetItem.label}
        </span>
        <p className="text-white text-xs max-w-xs mx-auto leading-normal">
          {lang === 'bn' ? `প্রশ্ন: কোয়ান্টাম সিগন্যাল টার্গেট করুন মূল সংখ্যাটি:` : `Question: Set validation field match target to index:`}
        </p>
        <span className="text-3xl font-black text-sage tracking-wider mt-2 inline-block select-all">
          {targetItem.offset} Hz
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {guessVal.map((val, id) => (
          <button
            key={id}
            type="button"
            onClick={() => handleGuess(val)}
            className="py-3 px-2 bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/10 text-white rounded-xl text-xs font-extrabold focus:outline-none focus:border-sage transition-all cursor-pointer"
          >
            {val} Hz
          </button>
        ))}
      </div>
    </div>
  );
}
