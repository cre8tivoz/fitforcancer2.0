import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../types';
import AthenaRecommendationCard from './AthenaRecommendationCard';

const MarkdownMessage = React.lazy(() => import('./MarkdownMessage'));

interface AthenaTranscriptProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const BOTTOM_THRESHOLD_PX = 72;

const AthenaTranscript: React.FC<AthenaTranscriptProps> = ({ messages, isLoading }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);

  const updateLiveEdge = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    setIsAtLiveEdge(distanceFromBottom <= BOTTOM_THRESHOLD_PX);
  };

  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    setIsAtLiveEdge(true);
  };

  useLayoutEffect(() => {
    const previousCount = previousMessageCountRef.current;
    const hasNewMessage = messages.length > previousCount;
    const latestMessage = messages[messages.length - 1];

    if (hasNewMessage && latestMessage?.role === 'user') {
      scrollToLatest('smooth');
    } else if (hasNewMessage && isAtLiveEdge) {
      scrollToLatest('smooth');
    }

    previousMessageCountRef.current = messages.length;
  }, [messages, isAtLiveEdge]);

  useEffect(() => {
    if (isLoading && isAtLiveEdge) scrollToLatest('smooth');
  }, [isLoading, isAtLiveEdge]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        ref={viewportRef}
        onScroll={updateLiveEdge}
        role="region"
        aria-label="ATHENA conversation"
        tabIndex={0}
        className="h-full min-h-[22rem] max-h-[60vh] overflow-y-auto overscroll-contain px-3 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neon-blue sm:px-5"
      >
        <div role="log" aria-live="polite" aria-relevant="additions" aria-busy={isLoading} className="space-y-5">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-neon-blue shadow-sm"
                  aria-hidden="true"
                >
                  <Sparkles className="h-4 w-4" />
                </div>
              )}

              <div className={`min-w-0 ${msg.role === 'user' ? 'max-w-[82%]' : 'max-w-[88%] sm:max-w-[82%]'}`}>
                <div
                  className={
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-md bg-neon-blue px-4 py-3 text-neon-dark shadow-sm'
                      : 'rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800'
                  }
                >
                  {msg.role === 'model' ? (
                    <div className="space-y-3">
                      <React.Suspense
                        fallback={
                          <div className="space-y-2" aria-label="Loading message">
                            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                          </div>
                        }
                      >
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
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2.5" aria-label="ATHENA is thinking">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-neon-blue shadow-sm" aria-hidden="true">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-neon-blue" />
                  ATHENA is thinking…
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isAtLiveEdge && (
        <button
          type="button"
          onClick={() => scrollToLatest('smooth')}
          className="absolute bottom-3 left-1/2 inline-flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-lg hover:border-neon-blue hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2"
          aria-label="Jump to latest ATHENA message"
        >
          <ArrowDown className="h-4 w-4" />
          Latest
        </button>
      )}
    </div>
  );
};

export default AthenaTranscript;
