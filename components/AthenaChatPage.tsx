import React, { useEffect, useState } from 'react';
import { Activity, Download, MessageCircle, Mic, Sparkles, Utensils } from 'lucide-react';
import { CancerTypeOption, ChatContext } from '../types';
import { getFatigueZone } from '../utils/fatigueScore';
import { getGeminiStreamingResponsePayload } from '../services/geminiService';
import { saveDailyCheckIn } from '../utils/patientContextStorage';
import { DAILY_CHECKIN_STORAGE_KEY, FatigueState } from '../hooks/useFatigueState';
import {
  AthenaSessionState,
  INITIAL_ATHENA_MESSAGE,
  buildInitialAthenaMessages,
} from '../hooks/useAthenaSession';
import { UseSpeech } from '../hooks/useSpeech';
import CaregiverExportButton from './CaregiverExportButton';
import AthenaRecommendationCard from './AthenaRecommendationCard';
import { exportConversationAsText } from '../utils/chatExport';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  useConversation,
} from './ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from './ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from './ai-elements/prompt-input';
import { Suggestion, Suggestions } from './ai-elements/suggestion';

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

const ConversationFollower: React.FC<{
  messageCount: number;
  latestRole: 'user' | 'model' | undefined;
}> = ({ messageCount, latestRole }) => {
  const { scrollToBottom } = useConversation();

  useEffect(() => {
    if (latestRole === 'user') scrollToBottom('smooth');
  }, [latestRole, messageCount, scrollToBottom]);

  return null;
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

interface AthenaChatPageProps {
  fatigueState: FatigueState;
  setFatigueState: React.Dispatch<React.SetStateAction<FatigueState>>;
  onEnergyHistoryChange: () => void;
  session: AthenaSessionState;
}

const AthenaChatPage: React.FC<AthenaChatPageProps> = ({ fatigueState, setFatigueState, onEnergyHistoryChange, session }) => {
  const {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    setIsLoading,
    hasStartedConversation,
    setHasStartedConversation,
    getGeneration,
    isCurrentGeneration,
    reset: resetSession,
  } = session;
  const [cancerType, setCancerType] = useState<CancerTypeOption | undefined>(fatigueState.cancerType);
  const [isEnergyPromptMinimized, setIsEnergyPromptMinimized] = useState(false);
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
      setMessages(buildInitialAthenaMessages(fatigueState.score));
    }
  }, [fatigueState.score, hasStartedConversation, messages, setMessages]);

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
          content: `Got it — I've updated your fatigue to ${score}/10 for the rest of this chat.`,
        },
      ]);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: 'model',
        content: `I see you've selected ${score}/10 for fatigue today. What would you like help with first — nutrition, movement, or just a chat?`,
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
    resetSession(null);
    setCancerType(undefined);
    setIsEnergyPromptMinimized(false);
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

    const requestGeneration = getGeneration();
    speech.stopListening();
    setHasStartedConversation(true);

    const userMessage = { role: 'user' as const, content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages([
      ...newMessages,
      {
        role: 'model',
        content: '',
      },
    ]);
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

    const replaceStreamingMessage = (content: string) => {
      if (!isCurrentGeneration(requestGeneration)) return;
      setMessages((current) => {
        const last = current[current.length - 1];
        const nextMessage = { role: 'model' as const, content };
        if (last?.role !== 'model') return [...current, nextMessage];
        return [...current.slice(0, -1), { ...last, content }];
      });
    };

    try {
      const aiResponse = await getGeminiStreamingResponsePayload(
        newMessages,
        context,
        replaceStreamingMessage,
      );
      if (!isCurrentGeneration(requestGeneration)) return;
      setMessages((current) => {
        const last = current[current.length - 1];
        const completedMessage = {
          role: 'model' as const,
          content: aiResponse.text,
          ...(aiResponse.recommendations.length > 0 ? { recommendations: aiResponse.recommendations } : {}),
        };
        if (last?.role !== 'model') return [...current, completedMessage];
        return [...current.slice(0, -1), completedMessage];
      });
    } catch (error) {
      if (!isCurrentGeneration(requestGeneration)) return;
      console.error('ATHENA chat error:', error);
      setMessages((current) => {
        const errorMessage = {
          role: 'model' as const,
          content: 'There was an error connecting to ATHENA. Please check your connection.',
        };
        const last = current[current.length - 1];
        if (last?.role !== 'model') return [...current, errorMessage];
        return [...current.slice(0, -1), errorMessage];
      });
    } finally {
      if (isCurrentGeneration(requestGeneration)) {
        setIsLoading(false);
      }
    }
  };

  const showStarterChoices = fatigueState.score !== null && !hasStartedConversation;
  const showEnergyPicker = fatigueState.score === null || isEditingEnergy;
  const latestMessage = messages[messages.length - 1];
  const latestRole = latestMessage?.role;
  const followerRole = isLoading && latestRole === 'model' && !latestMessage?.content ? 'user' : latestRole;
  const showThinking = isLoading && latestRole === 'model' && !latestMessage?.content;

  return (
    <div className="flex flex-1 flex-col min-h-0 overscroll-contain">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold">ATHENA</h1>
          <p className="mt-1 text-sm text-slate-500">Your treatment-day companion</p>
        </div>
        <div className="flex items-center gap-3">
          <CaregiverExportButton currentFatigueScore={fatigueState.score} />
          {(fatigueState.score !== null || cancerType) && (
            <button
              type="button"
              onClick={resetAthena}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center text-[10px] font-bold text-slate-400 hover:text-neon-pink uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Reset ATHENA conversation and fatigue check-in"
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
                  ? 'Expand to set your fatigue score'
                  : isEditingEnergy
                    ? `Update Your Fatigue (currently ${fatigueState.score}/10)`
                    : 'Check Your Fatigue (0–10)'}
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
                    aria-label={`Set fatigue score to ${score}`}
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
                    : 'Choose how fatigued you feel today: 0 means no fatigue and 10 means the worst fatigue. ATHENA will use it quietly in the background and save the check-in to your Energy Bank.'}
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
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Fatigue:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">{fatigueState.zone?.split(' ')[0] || '⚪'}</span>
                <span className="text-[10px] font-bold">{fatigueState.score}/10</span>
              </div>
              <button
                type="button"
                onClick={changeEnergyScore}
                disabled={isLoading || isEditingEnergy}
                className="ml-1 text-[9px] font-bold uppercase tracking-wider text-white/55 hover:text-white underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Change fatigue score"
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
        <div className="relative z-10 mb-3 shrink-0">
          <span className="mb-2 ml-1 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">What would help first?</span>
          <Suggestions aria-label="ATHENA conversation starters">
            {ATHENA_STARTERS.map(({ label, icon: Icon, prompt }) => (
              <Suggestion
                key={label}
                suggestion={prompt}
                onClick={onSendMessage}
                disabled={isLoading}
              >
                <Icon className="h-4 w-4 text-neon-blue" aria-hidden="true" />
                <span>{label}</span>
              </Suggestion>
            ))}
          </Suggestions>
        </div>
      )}

      <div className="relative min-h-0 flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Conversation className="h-[clamp(24rem,62dvh,48rem)] bg-white">
          <ConversationFollower messageCount={messages.length} latestRole={followerRole} />
          <ConversationContent className="gap-5">
            {messages.map((msg, index) => {
              if (msg.role === 'model' && !msg.content.trim() && (!msg.recommendations || msg.recommendations.length === 0)) {
                return null;
              }

              const from = msg.role === 'user' ? 'user' : 'assistant';

              return (
                <Message from={from} key={`${msg.role}-${index}`}>
                  {from === 'assistant' && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-neon-blue" aria-hidden="true">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      ATHENA
                    </div>
                  )}
                  <MessageContent from={from}>
                    {msg.role === 'model' ? (
                      <MessageResponse className="space-y-3">
                        <React.Suspense fallback={<div className="animate-pulse space-y-2"><div className="h-3 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-200 rounded w-1/2" /></div>}>
                          <MarkdownMessage content={msg.content} />
                        </React.Suspense>
                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="space-y-2 border-t border-slate-200 pt-3" aria-label="ATHENA recommendations from Fit for Cancer">
                            {msg.recommendations.map((recommendation) => (
                              <AthenaRecommendationCard
                                key={`${recommendation.kind}:${recommendation.id}`}
                                recommendation={recommendation}
                              />
                            ))}
                          </div>
                        )}
                      </MessageResponse>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </MessageContent>
                </Message>
              );
            })}

            {showThinking && (
              <Message from="assistant" aria-label="ATHENA is thinking">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-neon-blue" aria-hidden="true">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  ATHENA
                </div>
                <MessageContent from="assistant">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-neon-blue" aria-hidden="true" />
                    Thinking…
                  </div>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="mt-3 shrink-0">
        <label htmlFor="athena-message" className="sr-only">Message ATHENA</label>
        <PromptInput
          aria-label="Message ATHENA"
          onSubmit={({ text }) => onSendMessage(text)}
        >
          <PromptInputBody>
            <PromptInputTextarea
              id="athena-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={fatigueState.score === null}
              aria-label="Message ATHENA"
              placeholder={
                fatigueState.score === null
                  ? 'Choose your fatigue score above to start chatting with ATHENA.'
                  : 'Ask for help, or just tell ATHENA how the day is going...'
              }
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              {speech.isSupported && (
                <PromptInputButton
                  onClick={speech.toggleListening}
                  disabled={isLoading || fatigueState.score === null}
                  aria-label={speech.isListening ? 'Stop voice dictation' : 'Start voice dictation for ATHENA message'}
                  aria-pressed={speech.isListening}
                  className={speech.isListening ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-500 hover:text-white' : ''}
                >
                  <Mic className="h-5 w-5" aria-hidden="true" />
                </PromptInputButton>
              )}
              <span className="hidden text-[10px] text-slate-400 sm:inline">
                {fatigueState.score === null ? 'Choose a fatigue score above to begin' : 'Enter to send · Shift+Enter for a new line'}
              </span>
            </PromptInputTools>
            <PromptInputSubmit
              status={isLoading ? 'submitted' : 'ready'}
              disabled={fatigueState.score === null || !input.trim()}
            />
          </PromptInputFooter>
        </PromptInput>

        {messages.length > 1 && (
          <button
            type="button"
            onClick={() => exportConversationAsText(messages)}
            className="mt-2 inline-flex min-h-11 max-w-full items-center gap-1.5 text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900"
            aria-label="Download ATHENA chat transcript as text"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">Download chat transcript (.txt)</span>
          </button>
        )}
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-800">Who is ATHENA?</summary>
        <div className="mt-3 space-y-3 leading-relaxed">
          <p>
            ATHENA is Fit for Cancer&apos;s treatment-day companion. The name nods to Athena from Greek mythology, traditionally associated with wisdom and practical strategy — a good fit for an assistant built to help make manageable choices on low-energy days.
          </p>
          <p>
            <strong className="text-slate-800">How is she tuned?</strong> ATHENA uses your selected fatigue score and optional cancer context quietly in the background. She is tuned around Fit for Cancer&apos;s evidence-informed movement, nutrition and fatigue-support content, Australian sources, and firm safety guardrails. Replies are kept concise by default, and sources come forward when you ask for them rather than being dumped into every conversation.
          </p>
        </div>
      </details>
    </div>
  );
};

export default AthenaChatPage;
