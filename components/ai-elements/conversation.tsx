import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ArrowDown } from 'lucide-react';

// Adapted from Vercel AI Elements' official Conversation component for this
// existing Vite/Gemini app. The public composition model is retained while the
// AI SDK-specific download typing and use-stick-to-bottom dependency are omitted.
// Upstream: https://github.com/vercel/ai-elements/blob/main/packages/elements/src/conversation.tsx

type ConversationContextValue = {
  isAtBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
};

const ConversationContext = createContext<ConversationContextValue | null>(null);

const BOTTOM_THRESHOLD_PX = 72;

export type ConversationProps = React.HTMLAttributes<HTMLDivElement>;

export const Conversation: React.FC<ConversationProps> = ({
  className = '',
  children,
  ...props
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentObserverRef = useRef<ResizeObserver | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);

  const updateBottomState = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const nextIsAtBottom = distance <= BOTTOM_THRESHOLD_PX;
    isAtBottomRef.current = nextIsAtBottom;
    setIsAtBottom(nextIsAtBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') return;

    contentObserverRef.current?.disconnect();
    const content = viewport.firstElementChild;
    if (!content) return;

    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) scrollToBottom('smooth');
      else updateBottomState();
    });
    observer.observe(content);
    contentObserverRef.current = observer;

    return () => observer.disconnect();
  }, [scrollToBottom, updateBottomState]);

  return (
    <ConversationContext.Provider value={{ isAtBottom, scrollToBottom }}>
      <div
        ref={viewportRef}
        onScroll={updateBottomState}
        role="log"
        aria-label="ATHENA conversation"
        aria-live="polite"
        aria-relevant="additions text"
        className={`relative min-h-0 flex-1 overflow-y-auto overscroll-contain ${className}`}
        {...props}
      >
        {children}
      </div>
    </ConversationContext.Provider>
  );
};

export type ConversationContentProps = React.HTMLAttributes<HTMLDivElement>;

export const ConversationContent: React.FC<ConversationContentProps> = ({
  className = '',
  ...props
}) => (
  <div className={`flex min-h-full flex-col gap-6 p-4 sm:p-5 ${className}`} {...props} />
);

export type ConversationScrollButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const ConversationScrollButton: React.FC<ConversationScrollButtonProps> = ({
  className = '',
  children,
  ...props
}) => {
  const context = useContext(ConversationContext);
  if (!context || context.isAtBottom) return null;

  return (
    <button
      type="button"
      onClick={() => context.scrollToBottom('smooth')}
      aria-label="Jump to latest ATHENA message"
      className={`absolute bottom-4 left-1/2 z-10 inline-flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-lg transition-colors hover:border-neon-blue hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDown className="h-4 w-4" />
          Latest
        </>
      )}
    </button>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) throw new Error('useConversation must be used inside Conversation');
  return context;
};
