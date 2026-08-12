import React, { useEffect, useState } from 'react';
import { Activity, Download, MessageCircle, Mic, Utensils } from 'lucide-react';
import { CancerTypeOption, ChatContext, ChatMessage } from '../types';
import { getFatigueZone } from '../utils/fatigueScore';
import { getGeminiResponse } from '../services/geminiService';
import { saveDailyCheckIn } from '../utils/patientContextStorage';
import { DAILY_CHECKIN_STORAGE_KEY, FatigueState } from '../hooks/useFatigueState';
import { UseSpeech } from '../hooks/useSpeech';
import CaregiverExportButton from './CaregiverExportButton';
import { exportConversationAsText } from '../utils/chatExport';

const MarkdownMessage = React.lazy(() => import('./MarkdownMessage'));

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

const ATHENA_STARTERS = [
  {
    label: 'Nutrition',
    icon: Utensils,
    prompt: "I'd like help with nutrition.",
  },
  {
    label: 'Movement',
    icon: Activity,
    prompt: "I'd like help with movement.",
  },
  {
    label: 'Just a chat',
    icon: MessageCircle,
    prompt: "I'd just like to chat about my treatment or day.",
  },
];

const INITIAL_ATHENA_MESSAGE =
  "Hi, I'm ATHENA — your treatment-day companion. How's your energy today? Choose a number from 0–10 and we'll go from there.";

const buildInitialMessages = (score: number | null): ChatMessage[] => [
  {
    role: 'model',
    content:
      score === null
        ? INITIAL_ATHENA_MESSAGE
        : `Hi, I'm ATHENA — your treatment-day companion. I see your energy is set to ${score} today. What would you like help with first — nutrition, movement, or just a chat?`,
  },
];

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

interface AthenaChatPageProps {
  fatigueState: FatigueState;
  setFatigueState: React.Dispatch<React.SetStateAction<FatigueState>>;
  onEnergyHistoryChange: () => void;
}

const AthenaChatPage: React.FC<AthenaChatPageProps> = ({ fatigueState, setFatigueState, onEnergyHistoryChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => buildInitialMessages(fatigueState.score));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cancerType, setCancerType] = useState<CancerTypeOption | undefined>(fatigueState.cancerType);
  const [isEnergyPromptMinimized, setIsEnergyPromptMinimized] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [isEditingEnergy, setIsEditingEnergy] = useState(false);

  useEffect(() => {
    setCancerType(fatigueState.cancerType);
  }, [fatigueState.cancerType]);

  useEffect(() => {
    if (
      fatigueState.score !== null &&
      !hasStartedConversation &&
      messages.length === 1 &&
      messages[0]?.content === INITIAL_ATHENA_MESSAGE
    ) {
      setMessages(buildInitialMessages(fatigueState.score));
    }
  }, [fatigueState.score, hasStartedConversation, messages]);

  const speech = UseSpeech((transcript) => {
    setInput((current) => [current, transcript].filter(Boolean).join(' '));
  });

  const updateCancerType = (nextCancerType: CancerTypeOption | undefined) => {
    if (isLoading) return;

    setCancerType(nextCancerType);
    setFatigueState((current) => ({
      ...current,
      cancerType: nextCancerType,
    }));
  };

  const selectEnergyScore = (score: number) => {
    if (isLoading || (fatigueState.score !== null && !isEditingEnergy)) return;

    const zone = getFatigueZone(score);
    const isReplacement = isEditingEnergy && fatigueState.score !== null;
    const shouldSaveCheckIn = isReplacement || !fatigueState.hasLoggedDailyCheckIn;

    setFatigueState((current) => ({
      ...current,
      score,
      zone,
      exerciseZoneFilter: null,
      recipeZoneFilter: null,
      hasLoggedDailyCheckIn: true,
    }));

    if (shouldSaveCheckIn) {
      saveDailyCheckIn(score, '');
      onEnergyHistoryChange();
      window.sessionStorage.setItem(DAILY_CHECKIN_STORAGE_KEY, 'true');
      window.localStorage.setItem(DAILY_CHECKIN_STORAGE_KEY, 'true');
    }

    setIsEditingEnergy(false);
    setIsEnergyPromptMinimized(false);

    if (isReplacement) {
      setMessages((current) => [
        ...current,
        {
          role: 'model',
          content: `Got it — I've updated your energy to ${score} for the rest of this chat.`,
        },
      ]);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: 'model',
        content: `I see you've selected ${score} today. What would you like help with first — nutrition, movement, or just a chat?`,
      },
    ]);
  };

  const changeEnergyScore = () => {
    if (isLoading) return;

    setIsEditingEnergy(true);
    setIsEnergyPromptMinimized(false);
  };

  const cancelEnergyChange = () => {
    if (isLoading) return;
    setIsEditingEnergy(false);
    setIsEnergyPromptMinimized(false);
  };

  const resetAthena = () => {
    if (isLoading) return;

    speech.stopListening();
    setMessages(buildInitialMessages(null));
    setInput('');
    setIsLoading(false);
    setCancerType(undefined);
    setIsEnergyPromptMinimized(false);
    setHasStartedConversation(false);
    setIsEditingEnergy(false);
    setFatigueState((current) => ({
      ...current,
      score: null,
      zone: null,
      cancerType: undefined,
      exerciseZoneFilter: null,
      recipeZoneFilter: null,
      hasLoggedDailyCheckIn: false,
    }));
    window.sessionStorage.removeItem(DAILY_CHECKIN_STORAGE_KEY);
    window.localStorage.removeItem(DAILY_CHECKIN_STORAGE_KEY);
  };

  const onSendMessage = async (userPrompt?: string) => {
    const textToSend = (userPrompt || input).trim();
    if (!textToSend || isLoading || fatigueState.score === null) return;

    speech.stopListening();
    setHasStartedConversation(true);

    const userMessage = { role: 'user' as const, content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let updatedCancerType = cancerType;
    const detectedCancerType = detectCancerTypeFromText(textToSend);
    if (detectedCancerType) {
      updatedCancerType = detectedCancerType;
      setCancerType(detectedCancerType);
      setFatigueState((current) => ({
        ...current,
        cancerType: detectedCancerType,
      }));
    }

    const context: ChatContext = {
      fatigueScore: fatigueState.score,
      fatigueZone: fatigueState.zone,
      isMyelomaPatient: updatedCancerType === 'blood_myeloma',
      cancerType: updatedCancerType,
    };

    try {
      const aiResponse = await getGeminiResponse(newMessages, context);
      setMessages((current) => [...current, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error('ATHENA chat error:', error);
      setMessages((current) => [
        ...current,
        {
          role: 'model',
          content: 'There was an error connecting to ATHENA. Please check your connection.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const showStarterChoices = fatigueState.score !== null && !hasStartedConversation;
  const showEnergyPicker = fatigueState.score === null || isEditingEnergy;

  return (
    <div className="flex flex-1 flex-col min-h-0 overscroll-contain">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold">ATHENA</h1>
          <p className="mt-1 text-sm text-slate-500">Your treatment-day companion</p>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => exportConversationAsText(messages)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Export full ATHENA conversation"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          )}
          <CaregiverExportButton currentFatigueScore={fatigueState.score} />
          {(fatigueState.score !== null || cancerType) && (
            <button
              type="button"
              onClick={resetAthena}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center text-[10px] font-bold text-slate-400 hover:text-neon-pink uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Reset ATHENA conversation and energy check-in"
            >
              Reset ATHENA
            </button>
          )}
        </div>
      </div>

      {showEnergyPicker && (
        <div className="mb-3 bg-white rounded-xl border border-neon-blue shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => setIsEnergyPromptMinimized(!isEnergyPromptMinimized)}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-3 hover:bg-neon-blue/5 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            aria-expanded={!isEnergyPromptMinimized}
            aria-controls="athena-energy-score-panel"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-neon-blue" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isEnergyPromptMinimized
                  ? 'Expand to set your energy score'
                  : isEditingEnergy
                    ? `Update Your Energy (currently ${fatigueState.score}/10)`
                    : 'Check Your Battery (0–10)'}
              </h3>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isEnergyPromptMinimized ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {!isEnergyPromptMinimized && (
            <div id="athena-energy-score-panel" className="px-3 pb-3 animate-in slide-in-from-top-2 duration-300">
              <label className="mb-3 block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Cancer Type (Optional)
                </span>
                <select
                  value={cancerType ?? ''}
                  onChange={(e) => updateCancerType((e.target.value as CancerTypeOption | '') || undefined)}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition-shadow transition-transform transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:cursor-not-allowed disabled:opacity-60"
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
                    onClick={() => selectEnergyScore(score)}
                    disabled={isLoading}
                    aria-label={`Set energy score to ${score}`}
                    className={`min-h-[44px] rounded-lg font-bold text-xs transition-shadow transition-transform transition-colors border disabled:cursor-not-allowed disabled:opacity-50 ${fatigueState.score === score ? 'ring-2 ring-slate-900/20' : ''} ${score >= 7 ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500' : score >= 4 ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-400 hover:text-amber-950 hover:border-amber-400' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] leading-5 text-slate-500">
                  {isEditingEnergy
                    ? `Your current ${fatigueState.score}/10 stays active until you choose a replacement.`
                    : 'Choose the number that best matches your energy today. ATHENA will use it quietly in the background and save the check-in to your Energy Bank.'}
                </p>
                {isEditingEnergy && (
                  <button
                    type="button"
                    onClick={cancelEnergyChange}
                    disabled={isLoading}
                    className="min-h-11 rounded-full border border-slate-200 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Keep {fatigueState.score}/10
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {(fatigueState.score !== null || cancerType) && (
        <div className="mb-3 p-2 bg-slate-900 text-white rounded-lg border border-white/10 shadow-md flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          {fatigueState.score !== null && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Energy:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">{fatigueState.zone?.split(' ')[0] || '⚪'}</span>
                <span className="text-[10px] font-bold">{fatigueState.score}/10</span>
              </div>
              <button
                type="button"
                onClick={changeEnergyScore}
                disabled={isLoading || isEditingEnergy}
                className="ml-1 text-[9px] font-bold uppercase tracking-wider text-white/55 hover:text-white underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Change energy score"
              >
                Change
              </button>
            </div>
          )}

          {cancerType && (
            <div className={`flex items-center gap-2 ${fatigueState.score !== null ? 'border-l border-white/20 pl-3' : ''}`}>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Focus:</span>
              <span className="text-[10px] font-bold text-neon-blue">{CANCER_TYPE_LABELS[cancerType]}</span>
            </div>
          )}
        </div>
      )}

      {showStarterChoices && (
        <div className="relative z-10 mb-4 shrink-0">
          <span className="mb-2 block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">What would help first?</span>
          <div className="flex gap-2 overflow-x-auto px-1 pb-2 no-scrollbar">
            {ATHENA_STARTERS.map(({ label, icon: Icon, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => onSendMessage(prompt)}
                disabled={isLoading}
                className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition-shadow transition-transform transition-colors hover:border-neon-blue whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon className="w-4 h-4 text-neon-blue" />
                <span className="text-xs font-bold text-slate-700">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-neon-blue text-neon-dark rounded-tr-none shadow-md' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
              {msg.role === 'model' ? (
                <React.Suspense fallback={<div className="animate-pulse space-y-2"><div className="h-3 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-200 rounded w-1/2" /></div>}>
                  <MarkdownMessage content={msg.content} />
                </React.Suspense>
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
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      {fatigueState.score !== null && (
        <form onSubmit={(e) => { e.preventDefault(); onSendMessage(); }} className="mt-4 space-y-2">
          <label htmlFor="athena-message" className="ml-1 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
            Message ATHENA
          </label>
          <div className="flex gap-2">
            <input
              id="athena-message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for help, or just tell ATHENA how the day is going..."
              className="flex-1 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-neon-blue shadow-sm transition-shadow transition-transform transition-colors"
            />
            {speech.isSupported && (
              <button
                type="button"
                onClick={speech.toggleListening}
                disabled={isLoading}
                aria-label={speech.isListening ? 'Stop voice dictation' : 'Start voice dictation for ATHENA message'}
                aria-pressed={speech.isListening}
                className={`p-4 rounded-xl border shadow-sm transition-shadow transition-transform transition-colors ${speech.isListening ? 'bg-rose-500 text-white border-rose-500 animate-pulse' : 'bg-white text-slate-600 border-slate-200 hover:border-neon-blue hover:text-neon-blue'} disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message to ATHENA"
              className="p-4 bg-neon-blue text-neon-dark rounded-xl shadow-md hover:bg-neon-blue/90 disabled:opacity-50 transition-shadow transition-transform transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      )}

      <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-800">Who is ATHENA?</summary>
        <div className="mt-3 space-y-3 leading-relaxed">
          <p>
            ATHENA is Fit for Cancer&apos;s treatment-day companion. The name nods to Athena from Greek mythology, traditionally associated with wisdom and practical strategy — a good fit for an assistant built to help make manageable choices on low-energy days.
          </p>
          <p>
            <strong className="text-slate-800">How is she tuned?</strong> ATHENA uses your selected energy score and optional cancer context quietly in the background. She is tuned around Fit for Cancer&apos;s evidence-informed movement, nutrition and fatigue-support content, Australian sources, and firm safety guardrails. Replies are kept concise by default, and sources come forward when you ask for them rather than being dumped into every conversation.
          </p>
        </div>
      </details>
    </div>
  );
};

export default AthenaChatPage;