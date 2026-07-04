
import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppTab, ChatMessage, Recipe, ChatContext, CancerTypeOption } from './types';
import { RECIPES, MOVEMENTS } from './constants';
import NutritionCard from './components/NutritionCard';
import MovementCard from './components/MovementCard';
import BrandLockup from './components/BrandLockup';
import { getGeminiResponse } from './services/geminiService';
import { clearPatientContext, loadPatientContext, saveDailyCheckIn, savePatientContext } from './utils/patientContextStorage';
import { detectFatigueScore, getFatigueZone } from './utils/fatigueScore';
import CaregiverExportButton from './components/CaregiverExportButton';
import WhyThisIsFree from './components/WhyThisIsFree';
import { Search, Filter, X, BookOpen, Activity, WifiOff, Zap, UtensilsCrossed, Droplets, Coffee, AlertCircle, MessageCircle, House, Dumbbell, Utensils, ShieldCheck, Mic, ChartColumnIncreasing, Globe, CheckCircle2, Download } from 'lucide-react';

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: {
    readonly transcript: string;
  };
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const SIDE_EFFECT_SHORTCUTS = [
  { 
    label: 'Fatigue', 
    icon: <Zap className="w-4 h-4" />, 
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    prompt: 'How can I use exercise and food to help with cancer-related fatigue?' 
  },
  { 
    label: 'Nausea', 
    icon: <AlertCircle className="w-4 h-4" />, 
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    prompt: 'I am feeling nauseous from treatment. What are some food and gentle movement tips?' 
  },
  { 
    label: 'Taste Changes', 
    icon: <UtensilsCrossed className="w-4 h-4" />, 
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    prompt: 'Food tastes like metal lately. What can I do with my diet or routine?' 
  },
  { 
    label: 'Low Appetite', 
    icon: <Coffee className="w-4 h-4" />, 
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    prompt: 'I have no appetite. How can I stay nourished and stimulate hunger?' 
  },
  { 
    label: 'Dry Mouth', 
    icon: <Droplets className="w-4 h-4" />, 
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    prompt: 'I have a very dry mouth from treatment. What foods or drinks can help?' 
  }
];

const FATIGUE_SCORE_STORAGE_KEY = 'fit-for-cancer-fatigue-score';
const FATIGUE_ZONE_STORAGE_KEY = 'fit-for-cancer-fatigue-zone';
const DAILY_CHECKIN_LOGGED_STORAGE_KEY = 'fit-for-cancer-daily-checkin-logged';

const CANCER_TYPE_OPTIONS: Array<{ value: CancerTypeOption; label: string }> = [
  { value: 'bowel', label: 'Bowel' },
  { value: 'melanoma', label: 'Melanoma' },
  { value: 'breast', label: 'Breast' },
  { value: 'prostate', label: 'Prostate' },
  { value: 'lung', label: 'Lung' },
  { value: 'blood_myeloma', label: 'Blood/Myeloma' },
  { value: 'other', label: 'Other/Prefer not to say' },
];

const CANCER_TYPE_LABELS: Record<CancerTypeOption, string> = {
  bowel: 'Bowel',
  melanoma: 'Melanoma',
  breast: 'Breast',
  prostate: 'Prostate',
  lung: 'Lung',
  blood_myeloma: 'Blood/Myeloma',
  other: 'Other/Prefer not to say',
};

const TAB_PATHS: Record<AppTab, string> = {
  [AppTab.HOME]: '/',
  [AppTab.EXERCISE]: '/exercise',
  [AppTab.NUTRITION]: '/nutrition',
  [AppTab.ENERGY_BANK]: '/energy-bank',
  [AppTab.ASSISTANT]: '/assistant',
  [AppTab.RESOURCES]: '/resources',
};

const CONTROL_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]';

const getTabFromLocation = (): AppTab => {
  if (typeof window === 'undefined') {
    return AppTab.HOME;
  }

  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/exercise') return AppTab.EXERCISE;
  if (normalizedPath === '/nutrition') return AppTab.NUTRITION;
  if (normalizedPath === '/energy-bank') return AppTab.ENERGY_BANK;
  if (normalizedPath === '/assistant') return AppTab.ASSISTANT;
  if (normalizedPath === '/resources') return AppTab.RESOURCES;

  return AppTab.HOME;
};

const detectCancerTypeFromText = (text: string): CancerTypeOption | undefined => {
  const normalizedText = text.toLowerCase();

  if (normalizedText.includes('myeloma') || normalizedText.includes('blood cancer')) return 'blood_myeloma';
  if (normalizedText.includes('bowel cancer') || normalizedText.includes('colorectal cancer') || normalizedText.includes('colon cancer')) return 'bowel';
  if (normalizedText.includes('melanoma')) return 'melanoma';
  if (normalizedText.includes('breast cancer')) return 'breast';
  if (normalizedText.includes('prostate cancer')) return 'prostate';
  if (normalizedText.includes('lung cancer')) return 'lung';

  return undefined;
};

const INITIAL_ASSISTANT_MESSAGE =
  "Hello, I'm your Fit For Cancer assistant. I provide evidence-based oncology exercise and nutrition guidance.\n\nTo get started, **on a scale of 0-10, how is your fatigue today?**\n\n| Score | Zone | Guidance |\n| :--- | :--- | :--- |\n| 🟢 0-3 | Green | Mild: Energy levels are good |\n| 🟡 4-6 | Yellow | Moderate: Energy is dipping |\n| 🔴 7-10 | Red | Severe: Critical fatigue |\n\nPlease also provide a **Quick Note** about your current context (e.g., 'Post-treatment' or 'Poor sleep').";

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    role: 'model',
    content: INITIAL_ASSISTANT_MESSAGE,
  },
];

const MarkdownMessage = lazy(() => import('./components/MarkdownMessage'));
const EnergyBank = lazy(() => import('./components/EnergyBank'));
const Resources = lazy(() => import('./components/Resources'));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(() => getTabFromLocation());
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      content: "Hello, I'm your Fit For Cancer assistant. I provide evidence-based oncology exercise and nutrition guidance.\n\nTo get started, **on a scale of 0–10, how is your fatigue today?**\n\n| Score | Zone | Guidance |\n| :--- | :--- | :--- |\n| 🟢 0-3 | Green | Mild: Energy levels are good |\n| 🟡 4-6 | Yellow | Moderate: Energy is dipping |\n| 🔴 7-10 | Red | Severe: Critical fatigue |\n\nPlease also provide a **Quick Note** about your current context (e.g., 'Post-treatment' or 'Poor sleep')." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fatigueScore, setFatigueScore] = useState<number | null>(null);
  const [fatigueZone, setFatigueZone] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | null>(null);
  const [cancerType, setCancerType] = useState<CancerTypeOption | undefined>(undefined);
  const [exerciseZoneFilter, setExerciseZoneFilter] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>(null);
  const [recipeZoneFilter, setRecipeZoneFilter] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>(null);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<Recipe['category'] | 'All'>('All');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasLoggedDailyCheckIn, setHasLoggedDailyCheckIn] = useState(false);
  const [energyHistoryRefreshKey, setEnergyHistoryRefreshKey] = useState(0);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [isFatiguePromptMinimized, setIsFatiguePromptMinimized] = useState(false);
  const isMyelomaPatient = cancerType === 'blood_myeloma';
  const appScrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const prevActiveTabRef = useRef<AppTab>(activeTab);

  useEffect(() => {
    // Try sessionStorage first (survives tab switches), then localStorage (survives page kills)
    const storedFatigueScore = window.sessionStorage.getItem(FATIGUE_SCORE_STORAGE_KEY)
      || window.localStorage.getItem(FATIGUE_SCORE_STORAGE_KEY);
    const storedFatigueZone = window.sessionStorage.getItem(FATIGUE_ZONE_STORAGE_KEY)
      || window.localStorage.getItem(FATIGUE_ZONE_STORAGE_KEY) as '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
    const hasLoggedCheckIn = window.sessionStorage.getItem(DAILY_CHECKIN_LOGGED_STORAGE_KEY) === 'true'
      || window.localStorage.getItem(DAILY_CHECKIN_LOGGED_STORAGE_KEY) === 'true';
    const storedPatientContext = loadPatientContext();

    if (storedFatigueScore !== null) {
      const parsedScore = Number(storedFatigueScore);
      if (!Number.isNaN(parsedScore)) {
        setFatigueScore(parsedScore);
      }
    }

    if (storedFatigueZone === '🟢 Green' || storedFatigueZone === '🟡 Yellow' || storedFatigueZone === '🔴 Red') {
      setFatigueZone(storedFatigueZone);
    }

    if (storedPatientContext?.cancerType && storedPatientContext.cancerType in CANCER_TYPE_LABELS) {
      setCancerType(storedPatientContext.cancerType);
    }

    if (hasLoggedCheckIn) {
      setHasLoggedDailyCheckIn(true);
    }
  }, []);

  useEffect(() => {
    if (fatigueScore === null) {
      window.sessionStorage.removeItem(FATIGUE_SCORE_STORAGE_KEY);
      window.localStorage.removeItem(FATIGUE_SCORE_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(FATIGUE_SCORE_STORAGE_KEY, String(fatigueScore));
      window.localStorage.setItem(FATIGUE_SCORE_STORAGE_KEY, String(fatigueScore));
    }
  }, [fatigueScore]);

  useEffect(() => {
    if (!fatigueZone) {
      window.sessionStorage.removeItem(FATIGUE_ZONE_STORAGE_KEY);
      window.localStorage.removeItem(FATIGUE_ZONE_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(FATIGUE_ZONE_STORAGE_KEY, fatigueZone);
      window.localStorage.setItem(FATIGUE_ZONE_STORAGE_KEY, fatigueZone);
    }
  }, [fatigueZone]);

  useEffect(() => {
    if (!cancerType) {
      clearPatientContext();
    } else {
      savePatientContext({ cancerType });
    }
  }, [cancerType]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromLocation());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-AU';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();

      if (transcript) {
        setInput(transcript);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsSpeechSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const container = appScrollContainerRef.current;
    if (!container) {
      return;
    }

    // Capture the PREVIOUS tab value BEFORE updating the ref
    const prevTab = prevActiveTabRef.current;
    const prevTabKey = TAB_PATHS[prevTab] || '/';
    scrollPositionsRef.current[prevTabKey] = container.scrollTop;

    // Update the ref for NEXT tab switch
    prevActiveTabRef.current = activeTab;

    // Restore scroll position after tab content renders
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextPath = TAB_PATHS[activeTab];
        const savedPosition = nextPath ? scrollPositionsRef.current[nextPath] : undefined;
        if (savedPosition !== undefined && savedPosition > 0) {
          container?.scrollTo({ top: savedPosition, left: 0, behavior: 'auto' });
        } else {
          container?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
      });
    });
  }, [activeTab]);

  // Scroll to bottom when new chat messages arrive (assistant tab only)
  useEffect(() => {
    if (activeTab !== AppTab.ASSISTANT) return;
    const container = appScrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, left: 0, behavior: 'smooth' });
  }, [messages, activeTab]);

  useEffect(() => {
    const nextPath = TAB_PATHS[activeTab];
    if (typeof window === 'undefined' || window.location.pathname === nextPath) {
      return;
    }
    // Don't overwrite standalone routes like /why-free
    if (window.location.pathname === '/why-free') {
      return;
    }
    window.history.pushState({ tab: activeTab }, '', nextPath);
  }, [activeTab]);

  useEffect(() => {
    if (!isAccessibilityModalOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccessibilityModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAccessibilityModalOpen]);

  const handleTabLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, tab: AppTab) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    setActiveTab(tab);
  };

  const resetHealthAssistant = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setMessages(INITIAL_CHAT_MESSAGES);
    setInput('');
    setIsLoading(false);
    setFatigueScore(null);
    setFatigueZone(null);
    setCancerType(undefined);
    setHasLoggedDailyCheckIn(false);
    window.sessionStorage.removeItem(DAILY_CHECKIN_LOGGED_STORAGE_KEY);
    window.localStorage.removeItem(DAILY_CHECKIN_LOGGED_STORAGE_KEY);
    window.localStorage.removeItem(FATIGUE_SCORE_STORAGE_KEY);
    window.localStorage.removeItem(FATIGUE_ZONE_STORAGE_KEY);
  };

  const clearSavedPatientData = () => {
    clearPatientContext();
    setCancerType(undefined);
  };

  const handleFatigueScoreSelect = (score: number) => {
    setFatigueScore(score);

    const zone = getFatigueZone(score);

    setFatigueZone(zone);
    setExerciseZoneFilter(null);
    setRecipeZoneFilter(null);
  };

  const handleSendMessage = async (userPrompt?: string) => {
    const isInitialCheckIn = fatigueScore !== null && !hasLoggedDailyCheckIn;
    const quickNote = userPrompt ? '' : input.trim();
    const textToSend =
      userPrompt
      || (
        isInitialCheckIn
          ? `My fatigue score today is ${fatigueScore}/10.${quickNote ? ` Quick note: ${quickNote}` : ''}`
          : input
      );
    if ((!textToSend.trim() && !isInitialCheckIn) || isLoading) return;

    recognitionRef.current?.stop();
    setIsListening(false);

    const userMessage: ChatMessage = { role: 'user', content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Update context based on current message before sending to AI
    let updatedCancerType = cancerType;
    let updatedScore = fatigueScore;
    let updatedZone = fatigueZone;

    const detectedCancerType = detectCancerTypeFromText(textToSend);
    if (detectedCancerType) {
      updatedCancerType = detectedCancerType;
      setCancerType(detectedCancerType);
    }

    if (!isOnline) {
      const offlineMsg: ChatMessage = { 
        role: 'model', 
        content: "I'm currently offline. I can't access my AI brain without an internet connection, but you can still use the Exercise and Nutrition tabs to find evidence-based support!" 
      };
      setMessages(prev => [...prev, offlineMsg]);
      setIsLoading(false);
      return;
    }

    const detectedScore = detectFatigueScore(textToSend);
    if (detectedScore !== null) {
      updatedScore = detectedScore;
      handleFatigueScoreSelect(detectedScore);
      updatedZone = getFatigueZone(detectedScore);
    }

    if (isInitialCheckIn && updatedScore !== null) {
      saveDailyCheckIn(updatedScore, quickNote);
      setHasLoggedDailyCheckIn(true);
      setEnergyHistoryRefreshKey((current) => current + 1);
      window.sessionStorage.setItem(DAILY_CHECKIN_LOGGED_STORAGE_KEY, 'true');
    }

    const context: ChatContext = {
      fatigueScore: updatedScore,
      fatigueZone: updatedZone,
      isMyelomaPatient: updatedCancerType === 'blood_myeloma',
      cancerType: updatedCancerType,
    };

    const aiResponse = await getGeminiResponse(newMessages, context);
    
    // Proactive notification if zone changed to Red
    if (updatedZone === '🔴 Red' && fatigueZone !== '🔴 Red') {
      const proactiveMsg: ChatMessage = { 
        role: 'model', 
        content: `I've updated your Exercise Panel to the 🔴 Red Zone (Score ${updatedScore}/10). We are pausing strength training today to focus on recovery and gentle stretching.` 
      };
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }, proactiveMsg]);
      setIsLoading(false);
      return;
    }

    setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    setIsLoading(false);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleExportConversation = () => {
    if (messages.length === 0) return;

    const lines: string[] = [
      'Fit For Cancer — Conversation Export',
      `Exported: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      '',
      '─'.repeat(60),
      '',
    ];

    for (const msg of messages) {
      const roleLabel = msg.role === 'user' ? 'YOU' : 'ASSISTANT';
      lines.push(`[${roleLabel}]`);
      lines.push('');
      // Split content into paragraphs for readability
      const paragraphs = msg.content.split('\n').filter(Boolean);
      for (const para of paragraphs) {
        lines.push(`  ${para}`);
      }
      lines.push('');
      lines.push('─'.repeat(60));
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');

    downloadLink.href = objectUrl;
    downloadLink.download = 'FitForCancer_Conversation.txt';
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(objectUrl);
  };

  const toggleVoiceDictation = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();
  };

  const renderContent = () => {
    return (
      <motion.div
        key={typeof window !== 'undefined' && window.location.pathname === '/why-free' ? 'why-free' : activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
          {(() => {
            // /why-free route is a standalone page (no nav tabs)
            if (typeof window !== 'undefined' && window.location.pathname === '/why-free') {
              return <WhyThisIsFree />;
            }
            switch (activeTab) {
              case AppTab.HOME:
                return (
                  <div className="space-y-8">
            <header className={`${
              fatigueZone === '🔴 Red' ? 'bg-rose-500 text-white shadow-rose-200' : 
              fatigueZone === '🟡 Yellow' ? 'bg-amber-400 text-amber-950 shadow-amber-100' : 
              'bg-neon-blue text-neon-dark shadow-neon-blue/20'
            } rounded-2xl p-8 shadow-lg transition-all duration-500 relative overflow-hidden`}>
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h1 className="text-3xl font-bold">Welcome to Fit For Cancer</h1>
                  {fatigueZone && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                      <span className="text-lg leading-none">{fatigueZone.split(' ')[0]}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">{fatigueZone.split(' ')[1]} Zone Active</span>
                    </div>
                  )}
                </div>
                
                <p className="opacity-90 max-w-xl text-lg font-medium leading-relaxed">
                  {!fatigueZone 
                    ? "Evidence-based exercise and nutrition support tailored for your journey in Australia."
                    : fatigueZone === '🟢 Green' 
                      ? "Your energy levels are high today! It's a great time to focus on building strength and stamina with our standard movements."
                      : fatigueZone === '🟡 Yellow'
                        ? "Your energy is dipping a bit. We've modified your recommendations to help you stay active without draining your battery."
                        : "You're in the recovery zone today. Focus on restorative movements and nourishing foods to help your body recharge."
                  }
                </p>
                
                <div className="flex flex-wrap gap-3 mt-8">
                  <button 
                    onClick={() => setActiveTab(AppTab.ASSISTANT)}
                    className={`${
                      fatigueZone === '🔴 Red' ? 'bg-white text-rose-600' : 
                      fatigueZone === '🟡 Yellow' ? 'bg-amber-950 text-amber-400' : 
                      'bg-neon-dark text-neon-blue'
                    } px-6 py-3 font-bold rounded-full hover:opacity-90 transition-all hover:scale-105 shadow-md flex items-center gap-2`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Talk to Health Assistant
                  </button>
                  
                  {fatigueZone && (
                    <button 
                      onClick={() => setActiveTab(AppTab.ASSISTANT)}
                      className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 font-bold rounded-full hover:bg-white/20 transition-all"
                    >
                      Update Fatigue Score
                    </button>
                  )}
                </div>
              </div>
            </header>

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>How it Works</span>
                  <span className="text-lg">🟢🟡🔴</span>
                </h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Managing your energy during treatment can feel like a moving target. Fit For Cancer is your evidence-based companion, designed to help you match your daily activity and nutrition to your current "energy budget".
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">1</div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1">Check Your Battery</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">Use our simple 0–10 Fatigue Tracker to tell us how you are feeling.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">2</div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1">Get Your Zone</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">Based on your score, the app instantly updates your Traffic Light Zone—Green, Yellow, or Red.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">3</div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1">Smart Recommendations</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">Your Exercise and Nutrition panels automatically refresh to show the safest, most effective options.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">The 3 Pillars of Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-[color:var(--color-accent)]/25 text-[color:var(--color-nav)] rounded-full flex items-center justify-center mb-4">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Movement</h3>
                  <p className="text-slate-600 text-sm">Gentle, safe, and effective exercises designed to combat cancer-related fatigue.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] rounded-full flex items-center justify-center mb-4">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Nourishment</h3>
                  <p className="text-slate-600 text-sm">Recipes that manage treatment side-effects like nausea and low appetite.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-[color:var(--color-tertiary)]/15 text-[color:var(--color-tertiary)] rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Evidence-Based</h3>
                  <p className="text-slate-600 text-sm">Advice aligned with COSA guidelines and Australian oncology standards.</p>
                </div>
              </div>
            </section>

                    <section>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Featured Movement</h2>
                        <button onClick={() => setActiveTab(AppTab.EXERCISE)} className="text-neon-blue font-semibold hover:underline">View All</button>
                      </div>
                      <MovementCard movement={MOVEMENTS[0]} />
                    </section>
                  </div>
                );
              case AppTab.EXERCISE:
        const currentExerciseZone = exerciseZoneFilter === 'All' ? null : (exerciseZoneFilter || fatigueZone);
        const filteredMovements = MOVEMENTS.filter(m => {
          if (exerciseZoneFilter === 'All') return true;
          if (!currentExerciseZone) return true;
          const zoneKey = currentExerciseZone.split(' ')[1] as 'Green' | 'Yellow' | 'Red';
          return m.intensity === zoneKey;
        });

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Safe Movements</h1>
                <p className="text-slate-600">These movements are designed for various energy levels. Always listen to your body and pace yourself.</p>
                
                {/* Humanized Zone Explanation */}
                {currentExerciseZone && (
                  <div className="mt-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <p className="text-sm font-medium text-slate-800">
                      {currentExerciseZone === '🟢 Green' && `Because you're in the 🟢 Green Zone (Score ${fatigueScore ?? 'X'}/10), these 'Standard Movements' focus on building your strength and stamina while your energy is high.`}
                      {currentExerciseZone === '🟡 Yellow' && `Because you're in the 🟡 Yellow Zone (Score ${fatigueScore ?? 'X'}/10), these 'Modified Movements' keep your circulation moving without draining your battery.`}
                      {currentExerciseZone === '🔴 Red' && `Because you're in the 🔴 Red Zone (Score ${fatigueScore ?? 'X'}/10), we are focusing on 'Restorative Movement' to protect your energy and maintain circulation while you recover.`}
                    </p>
                  </div>
                )}

                {/* Myeloma Specific Guardrail */}
                {isMyelomaPatient && (
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
                    <span className="text-xl">🦴</span>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Myeloma Care Note</p>
                      <p className="text-xs text-indigo-800 leading-relaxed">
                        Please ensure your haematologist has cleared you for weight-bearing exercise, as bone health is a priority in Myeloma care.
                        {currentExerciseZone === '🔴 Red' && " For Red Zone days, please avoid 'Bed Rotations' if you are experiencing any new or localised back pain."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Energy Zone Toggle */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span id="exercise-zone-filter-label" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Energy Zone Filter:</span>
                  <div
                    role="radiogroup"
                    aria-labelledby="exercise-zone-filter-label"
                    className="flex bg-slate-100 p-1 rounded-full border border-slate-200"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={exerciseZoneFilter === 'All'}
                      onClick={() => setExerciseZoneFilter(exerciseZoneFilter === 'All' ? null : 'All')}
                      className={`min-h-[44px] px-3 py-1 rounded-full text-xs font-bold transition-all ${exerciseZoneFilter === 'All'
                          ? 'bg-white shadow-sm text-slate-900 border border-slate-200' 
                          : 'text-slate-400 hover:text-slate-600'
                      } ${CONTROL_FOCUS_CLASS}`}
                    >
                      All
                    </button>
                    {(['🟢 Green', '🟡 Yellow', '🔴 Red'] as const).map((zone) => {
                      const isActive = exerciseZoneFilter === zone || (exerciseZoneFilter === null && fatigueZone === zone);
                      return (
                        <button
                          key={zone}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          onClick={() => setExerciseZoneFilter(exerciseZoneFilter === zone ? null : zone)}
                          className={`min-h-[44px] px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isActive 
                              ? 'bg-white shadow-sm text-slate-900 border border-slate-200' 
                              : 'text-slate-400 hover:text-slate-600'
                          } ${CONTROL_FOCUS_CLASS}`}
                        >
                          {zone}
                        </button>
                      );
                    })}
                  </div>
                  {(exerciseZoneFilter !== null) && (
                    <button 
                      type="button"
                      onClick={() => setExerciseZoneFilter(null)}
                      className={`ml-1 text-[10px] font-bold text-neon-blue hover:underline uppercase tracking-widest ${CONTROL_FOCUS_CLASS}`}
                    >
                      Reset to Dynamic
                    </button>
                  )}
                </div>

                {/* Safety Guardrail */}
                {exerciseZoneFilter === '🟢 Green' && fatigueZone === '🔴 Red' && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 animate-pulse">
                    <span className="text-xl">⚠️</span>
                    <p className="text-xs text-rose-700 font-medium">
                      I'm showing you the Green Zone exercises, but please proceed with caution as your current fatigue is high. Listen to your body.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Red Zone Energy Conservation Tips */}
            {currentExerciseZone === '🔴 Red' && (
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 space-y-4">
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  Energy Conservation: The 3 P's
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-amber-800 text-sm">Pacing</p>
                    <p className="text-xs text-amber-700 leading-relaxed">Rest before you feel exhausted. Break tasks into smaller chunks.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-amber-800 text-sm">Prioritising</p>
                    <p className="text-xs text-amber-700 leading-relaxed">Skip non-essential tasks today. Focus your energy on what matters most.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-amber-800 text-sm">Positioning</p>
                    <p className="text-xs text-amber-700 leading-relaxed">Perform movements while sitting or lying down to reduce the work of the heart.</p>
                  </div>
                </div>
              </div>
            )}

            {filteredMovements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMovements.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MovementCard movement={m} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <h3 className="text-lg font-bold text-slate-800">No movements found for this zone</h3>
                <button 
                  onClick={() => setExerciseZoneFilter(null)}
                  className="mt-2 text-neon-blue font-semibold hover:underline"
                >
                  View all movements
                </button>
              </div>
            )}

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mt-8">
              <h3 className="font-bold text-blue-800 mb-2">Evidence Note</h3>
              <p className="text-blue-700 text-sm">COSA guidelines recommend that all people with cancer should avoid inactivity and be as physically active as their current condition allows.</p>
            </div>
          </div>
        );
      case AppTab.NUTRITION:
        const currentRecipeZone = recipeZoneFilter === 'All' ? null : (recipeZoneFilter || fatigueZone);
        const filteredRecipes = RECIPES.filter(recipe => {
          const matchesCategory = recipeCategoryFilter === 'All' || recipe.category === recipeCategoryFilter;
          const matchesSearch = recipe.title.toLowerCase().includes(recipeSearchQuery.toLowerCase()) || 
                                recipe.ingredients.some(ing => ing.toLowerCase().includes(recipeSearchQuery.toLowerCase()));
          
          let matchesFatigue = true;
          if (recipeZoneFilter === 'All') {
            matchesFatigue = true;
          } else if (currentRecipeZone) {
            matchesFatigue = recipe.fatigueZone === currentRecipeZone;
          }
          
          return matchesCategory && matchesSearch && matchesFatigue;
        });

        const categories: (Recipe['category'] | 'All')[] = ['All', 'High Protein', 'Anti-Nausea', 'Easy to Digest', 'Hydrating', 'Zero-Prep', 'Quick Assembly'];

        const isFiltering = recipeCategoryFilter !== 'All' || recipeSearchQuery !== '' || recipeZoneFilter !== null;

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">Recovery Nutrition</h1>
                  <p className="text-slate-600 mt-1">Nourishing recipes that are easy to prepare and digest during treatment.</p>
                </div>
                
                <div className="w-full md:w-72">
                  <label htmlFor="nutrition-search" className="mb-1.5 ml-1 block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    Search recipes
                  </label>
                  <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="nutrition-search"
                    type="text"
                    placeholder="Search ingredients or recipes..."
                    value={recipeSearchQuery}
                    onChange={(e) => setRecipeSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue shadow-sm transition-all text-sm"
                  />
                  {recipeSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setRecipeSearchQuery('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ${CONTROL_FOCUS_CLASS}`}
                      aria-label="Clear recipe search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Energy Zone</span>
                      <div
                        role="radiogroup"
                        aria-label="Nutrition energy zone filter"
                        className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={recipeZoneFilter === 'All'}
                          onClick={() => setRecipeZoneFilter(recipeZoneFilter === 'All' ? null : 'All')}
                          className={`min-h-[44px] px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            recipeZoneFilter === 'All' 
                              ? 'bg-slate-900 text-white shadow-md' 
                              : 'text-slate-400 hover:text-slate-600'
                          } ${CONTROL_FOCUS_CLASS}`}
                        >
                          All
                        </button>
                        {(['🟢 Green', '🟡 Yellow', '🔴 Red'] as const).map((zone) => {
                          const isActive = recipeZoneFilter === zone || (recipeZoneFilter === null && fatigueZone === zone);
                          return (
                            <button
                              key={zone}
                              type="button"
                              role="radio"
                              aria-checked={isActive}
                              onClick={() => setRecipeZoneFilter(recipeZoneFilter === zone ? null : zone)}
                              className={`min-h-[44px] px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isActive 
                                  ? 'bg-white shadow-md text-slate-900 border border-slate-100' 
                                  : 'text-slate-400 hover:text-slate-600'
                              } ${CONTROL_FOCUS_CLASS}`}
                            >
                              {zone}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Category</span>
                      <div className="relative">
                      <div
                        role="radiogroup"
                        aria-label="Recipe category filter"
                        className="flex gap-2 overflow-x-auto pb-2 pt-1 pr-1 md:flex-wrap md:overflow-visible scroll-fade-right"
                      >
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            role="radio"
                            aria-checked={recipeCategoryFilter === cat}
                            onClick={() => setRecipeCategoryFilter(cat)}
                            className={`min-h-11 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                              recipeCategoryFilter === cat 
                                ? 'bg-neon-blue text-neon-dark border-neon-blue shadow-md' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-neon-blue hover:text-neon-blue'
                            } ${CONTROL_FOCUS_CLASS}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      </div>
                    </div>

                  </div>

                  {isFiltering && (
                    <button 
                      type="button"
                      onClick={() => {
                        setRecipeZoneFilter(null);
                        setRecipeCategoryFilter('All');
                        setRecipeSearchQuery('');
                      }}
                      className={`text-[10px] font-black text-neon-pink hover:underline uppercase tracking-[0.2em] flex items-center gap-1.5 ${CONTROL_FOCUS_CLASS}`}
                    >
                      <X className="w-3 h-3" />
                      Clear All Filters
                    </button>
                  )}
                </div>

                {recipeZoneFilter === null && fatigueZone && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-blue/5 border border-neon-blue/10 rounded-lg">
                    <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" />
                    <span className="sr-only">Following your current zone.</span>
                    <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">
                      Dynamic Mode Active: Following your {fatigueZone} Zone
                    </span>
                  </div>
                )}
              </div>
            </div>

            {filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <NutritionCard recipe={r} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No recipes found</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                <button 
                  onClick={() => { setRecipeSearchQuery(''); setRecipeCategoryFilter('All'); }}
                  className="mt-4 text-neon-blue font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        );
      case AppTab.ENERGY_BANK:
        return (
          <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading Energy Bank...</div>}>
            <EnergyBank refreshKey={energyHistoryRefreshKey} currentFatigueScore={fatigueScore} />
          </Suspense>
        );
      case AppTab.ASSISTANT:
        return (
          <div className="flex flex-1 flex-col min-h-0 overscroll-contain">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Health Assistant</h1>
              <div className="flex items-center gap-3">
                {messages.length > 1 && (
                  <button
                    onClick={handleExportConversation}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Export full conversation"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </button>
                )}
                <CaregiverExportButton currentFatigueScore={fatigueScore} />
                {(fatigueScore !== null || cancerType || isMyelomaPatient) && (
                  <button 
                    onClick={resetHealthAssistant}
                    className="inline-flex min-h-11 items-center text-[10px] font-bold text-slate-400 hover:text-neon-pink uppercase tracking-widest transition-colors"
                    aria-label="Reset health assistant conversation"
                  >
                    Reset Health Assistant
                  </button>
                )}
              </div>
            </div>
            
            {/* Fatigue Score Prompt — Collapsible */}
            {fatigueScore === null && (
              <div className="mb-3 bg-white rounded-xl border border-neon-blue shadow-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsFatiguePromptMinimized(!isFatiguePromptMinimized)}
                  className="w-full flex items-center justify-between p-3 hover:bg-neon-blue/5 transition-colors"
                  aria-expanded={!isFatiguePromptMinimized}
                  aria-controls="fatigue-score-panel"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neon-blue" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isFatiguePromptMinimized ? 'Expand to set your fatigue score' : 'Check Your Battery (0-10)'}
                    </h3>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isFatiguePromptMinimized ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                
                {!isFatiguePromptMinimized && (
                  <div id="fatigue-score-panel" className="px-3 pb-3 animate-in slide-in-from-top-2 duration-300">
                    <label className="mb-3 block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Cancer Type (Optional)
                      </span>
                      <select
                        value={cancerType ?? ''}
                        onChange={(e) => {
                          const nextValue = e.target.value as CancerTypeOption | '';
                          const normalizedValue = nextValue || undefined;
                          setCancerType(normalizedValue);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-neon-blue"
                      >
                        <option value="">Select a cancer type</option>
                        {CANCER_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleFatigueScoreSelect(score)}
                          className={`min-h-[44px] rounded-lg font-bold text-xs transition-all border ${
                            fatigueScore === score ? 'ring-2 ring-slate-900/15 scale-[1.03]' : ''
                          } ${
                            score >= 7 ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500' :
                            score >= 4 ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-400 hover:text-amber-950 hover:border-amber-400' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-slate-500">
                      Select your score, add an optional Quick Note below, then press send to start the assistant and save your check-in.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Context Banner */}
            {(fatigueScore !== null || cancerType || isMyelomaPatient) && (
              <div className="mb-3 p-2 bg-slate-900 text-white rounded-lg border border-white/10 shadow-md flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                {fatigueScore !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Zone:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{fatigueZone?.split(' ')[0] || '⚪'}</span>
                      <span className="text-[10px] font-bold">{fatigueScore}/10</span>
                    </div>
                  </div>
                )}
                
                {(cancerType || isMyelomaPatient) && (
                  <div className={`flex items-center gap-2 ${fatigueScore !== null ? 'border-l border-white/20 pl-3' : ''}`}>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Focus:</span>
                    <span className="text-[10px] font-bold text-neon-blue">
                      {cancerType ? CANCER_TYPE_LABELS[cancerType] : 'Blood/Myeloma'}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Side Effect Shortcuts */}
            <div className="relative z-10 mb-4 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Quick Advice</span>
              </div>
              <div className="flex gap-2 overflow-x-auto px-1 pb-2 no-scrollbar">
                {SIDE_EFFECT_SHORTCUTS.map((sc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(sc.prompt)}
                    className={`flex min-h-11 items-center gap-2 rounded-full border border-slate-100 px-4 py-2 shadow-sm transition-all hover:border-neon-blue whitespace-nowrap ${sc.bg}`}
                  >
                    <div className={`${sc.color}`}>{sc.icon}</div>
                    <span className="text-[10px] font-bold text-slate-700">{sc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-neon-blue text-neon-dark rounded-tr-none shadow-md' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                  }`}>
                    {msg.role === 'model' ? (
                      <Suspense fallback={<div className="animate-pulse space-y-2"><div className="h-3 bg-slate-200 rounded w-3/4"></div><div className="h-3 bg-slate-200 rounded w-1/2"></div><div className="h-3 bg-slate-200 rounded w-5/6"></div></div>}>
                        <MarkdownMessage content={msg.content} />
                      </Suspense>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none border border-slate-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={onFormSubmit} className="mt-4 space-y-2">
              <label htmlFor="assistant-message" className="ml-1 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                {fatigueScore === null ? 'Quick Note' : 'Health Assistant message'}
              </label>
              <div className="flex gap-2">
                <input
                  id="assistant-message"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={fatigueScore === null ? "Add a Quick Note about today..." : "Ask about fatigue, nausea, appetite..."}
                  className="flex-1 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-neon-blue shadow-sm transition-all"
                />
                {isSpeechSupported && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={toggleVoiceDictation}
                    aria-label={
                      isListening
                        ? 'Stop voice dictation'
                        : fatigueScore === null
                          ? 'Start voice dictation for Quick Note'
                          : 'Start voice dictation for Health Assistant message'
                    }
                    aria-pressed={isListening}
                    className={`p-4 rounded-xl border shadow-sm transition-all ${isListening ? 'bg-rose-500 text-white border-rose-500 animate-pulse' : 'bg-white text-slate-600 border-slate-200 hover:border-neon-blue hover:text-neon-blue'} ${CONTROL_FOCUS_CLASS}`}
                  >
                    <Mic className="w-5 h-5" />
                  </motion.button>
                )}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading}
                  aria-label={fatigueScore === null ? 'Send Quick Note to start the health assistant' : 'Send message to the health assistant'}
                  className={`p-4 bg-neon-blue text-neon-dark rounded-xl shadow-md hover:bg-neon-blue/90 disabled:opacity-50 transition-all ${CONTROL_FOCUS_CLASS}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </motion.button>
              </div>
            </form>
          </div>
        );
      case AppTab.RESOURCES:
        return (
          <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading resources...</div>}>
            <Resources onClearSavedData={clearSavedPatientData} />
          </Suspense>
        );
      default:
        return null;
    }
  })()}
</motion.div>
);
};

  return (
    <div ref={appScrollContainerRef} className="h-dvh w-screen overflow-x-hidden overflow-y-auto">
      <div className="min-h-dvh flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 pb-20 sm:pb-6">
      <nav className="sticky top-0 z-50 py-4 bg-[color:var(--color-nav)] backdrop-blur-md flex justify-between items-center px-4 sm:px-8 border-b border-white/10">
        <a
          href={TAB_PATHS[AppTab.HOME]}
          onClick={(event) => handleTabLinkClick(event, AppTab.HOME)}
          aria-current={activeTab === AppTab.HOME ? 'page' : undefined}
          className={`flex items-center gap-3 group ${CONTROL_FOCUS_CLASS}`}
        >
          <div className="flex flex-col">
            <BrandLockup compact variant="dark" className="h-10 w-auto transition-transform group-hover:scale-[1.02]" />
            {!isOnline && (
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <WifiOff className="w-2.5 h-2.5" />
                Offline Mode
              </span>
            )}
          </div>
        </a>
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 hidden sm:flex">
          <TabButton href={TAB_PATHS[AppTab.HOME]} active={activeTab === AppTab.HOME} onClick={(event) => handleTabLinkClick(event, AppTab.HOME)}>Home</TabButton>
          <TabButton href={TAB_PATHS[AppTab.EXERCISE]} active={activeTab === AppTab.EXERCISE} onClick={(event) => handleTabLinkClick(event, AppTab.EXERCISE)}>Exercise</TabButton>
          <TabButton href={TAB_PATHS[AppTab.NUTRITION]} active={activeTab === AppTab.NUTRITION} onClick={(event) => handleTabLinkClick(event, AppTab.NUTRITION)}>Nutrition</TabButton>
          <TabButton href={TAB_PATHS[AppTab.ENERGY_BANK]} active={activeTab === AppTab.ENERGY_BANK} onClick={(event) => handleTabLinkClick(event, AppTab.ENERGY_BANK)}>Energy Bank</TabButton>
          <TabButton href={TAB_PATHS[AppTab.ASSISTANT]} active={activeTab === AppTab.ASSISTANT} onClick={(event) => handleTabLinkClick(event, AppTab.ASSISTANT)}>AI Chat</TabButton>
          <TabButton href={TAB_PATHS[AppTab.RESOURCES]} active={activeTab === AppTab.RESOURCES} onClick={(event) => handleTabLinkClick(event, AppTab.RESOURCES)}>Resources</TabButton>
        </div>
      </nav>

      <main className="flex-1 min-h-0 py-4">
        {renderContent()}
      </main>

      {/* TGA Compliance Footer */}
      <footer className="mt-12 mb-24 sm:mb-8 p-8 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          <BrandLockup variant="light" className="w-64 max-w-full h-auto" />
          
          <div className="text-center space-y-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TGA Compliance & Clinical Safety</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Important Medical Disclaimer:</strong> This application is designed to <strong>complement</strong>, rather than replace, professional medical advice. All exercise and nutrition guidance is aligned with Australian oncology standards (COSA & ESSA), but it does not account for your specific clinical contraindications.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Always consult your <strong>medical oncologist, haematologist, or specialised physiotherapist</strong> before starting new exercise routines or making significant dietary changes, especially if you are currently undergoing active treatment.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <a
                href={TAB_PATHS[AppTab.RESOURCES]}
                onClick={(event) => handleTabLinkClick(event, AppTab.RESOURCES)}
                aria-current={activeTab === AppTab.RESOURCES ? 'page' : undefined}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:border-neon-blue hover:text-neon-blue transition-all shadow-sm uppercase tracking-wider ${CONTROL_FOCUS_CLASS}`}
              >
                <BookOpen className="w-3 h-3" />
                View Evidence Base & Resources
              </a>
              
              <div className="pt-4 border-t border-slate-200 w-full max-w-xs">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Copyright 2026. Designed by <a href="https://jaquescreative.com/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-neon-pink transition-colors">jaques creative</a>
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsAccessibilityModalOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isAccessibilityModalOpen}
                aria-controls="accessibility-statement-dialog"
                className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-700 ${CONTROL_FOCUS_CLASS}`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Committed to WCAG 2.2 AA Accessibility</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isAccessibilityModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 py-6"
            onClick={() => setIsAccessibilityModalOpen(false)}
          >
            <motion.div
              id="accessibility-statement-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="accessibility-statement-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    <Globe className="h-3.5 w-3.5" />
                    Accessibility Statement
                  </span>
                  <div>
                    <h2 id="accessibility-statement-title" className="text-2xl font-bold text-slate-900">
                      Our accessibility commitment
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Fit For Cancer is designed to meet WCAG 2.2 AA expectations and support Australian digital inclusion standards.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAccessibilityModalOpen(false)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 ${CONTROL_FOCUS_CLASS}`}
                  aria-label="Close accessibility statement"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-primary)]" />
                  <p>We design mobile-first interfaces with readable typography, clear labels, and touch-friendly controls so people can use the app more comfortably during treatment.</p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-primary)]" />
                  <p>We aim to support keyboard navigation, visible focus states, screen-reader-friendly semantics, and reduced cognitive load across exercise, nutrition, and assistant flows.</p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-primary)]" />
                  <p>Accessibility is an ongoing commitment. We continue refining the product with user feedback, especially for people experiencing fatigue, treatment side effects, or fluctuating concentration.</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAccessibilityModalOpen(false)}
                  className={`inline-flex min-h-11 items-center rounded-2xl bg-[color:var(--color-nav)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-primary)] ${CONTROL_FOCUS_CLASS}`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[color:var(--color-surface)]/95 backdrop-blur-md border-t border-[color:var(--color-primary)]/10 px-4 py-3 flex justify-between sm:hidden z-50 shadow-[0_-10px_30px_-18px_rgba(26,40,33,0.35)]">
        <MobileTabButton href={TAB_PATHS[AppTab.HOME]} label="Home" icon={<House className="w-4 h-4" />} active={activeTab === AppTab.HOME} onClick={(event) => handleTabLinkClick(event, AppTab.HOME)} />
        <MobileTabButton href={TAB_PATHS[AppTab.EXERCISE]} label="Move" icon={<Dumbbell className="w-4 h-4" />} active={activeTab === AppTab.EXERCISE} onClick={(event) => handleTabLinkClick(event, AppTab.EXERCISE)} />
        <MobileTabButton href={TAB_PATHS[AppTab.NUTRITION]} label="Eat" icon={<Utensils className="w-4 h-4" />} active={activeTab === AppTab.NUTRITION} onClick={(event) => handleTabLinkClick(event, AppTab.NUTRITION)} />
        <MobileTabButton href={TAB_PATHS[AppTab.ENERGY_BANK]} label="Trends" icon={<ChartColumnIncreasing className="w-4 h-4" />} active={activeTab === AppTab.ENERGY_BANK} onClick={(event) => handleTabLinkClick(event, AppTab.ENERGY_BANK)} />
        <MobileTabButton href={TAB_PATHS[AppTab.ASSISTANT]} label="Chat" icon={<MessageCircle className="w-4 h-4" />} active={activeTab === AppTab.ASSISTANT} onClick={(event) => handleTabLinkClick(event, AppTab.ASSISTANT)} />
        <MobileTabButton href={TAB_PATHS[AppTab.RESOURCES]} label="Resources" icon={<BookOpen className="w-4 h-4" />} active={activeTab === AppTab.RESOURCES} onClick={(event) => handleTabLinkClick(event, AppTab.RESOURCES)} />
      </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ href: string; active: boolean; onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void; children: React.ReactNode }> = ({ href, active, onClick, children }) => (
  <a
    href={href}
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`inline-flex min-h-11 items-center px-4 py-2 rounded-full text-sm font-semibold transition-all ${active ? 'bg-neon-blue text-neon-dark shadow-lg shadow-neon-blue/20' : 'text-white/75 hover:text-white hover:bg-white/10'} ${CONTROL_FOCUS_CLASS}`}
  >
    {children}
  </a>
);

const MobileTabButton: React.FC<{ href: string; label: string; icon: React.ReactNode; active: boolean; onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void }> = ({ href, label, icon, active, onClick }) => (
  <a
    href={href}
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex min-w-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 transition-all ${active ? 'text-[color:var(--color-nav)]' : 'text-slate-400'} ${CONTROL_FOCUS_CLASS}`}
  >
    <span className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${active ? 'bg-[color:var(--color-accent)] border-[color:var(--color-accent)] shadow-sm' : 'bg-white border-slate-200'}`}>{icon}</span>
    <span className="text-[11px] font-semibold">{label}</span>
  </a>
);

export default App;




