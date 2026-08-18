import React from 'react';

// Adapted from Vercel AI Elements' official Suggestion component. The Radix
// ScrollArea dependency is replaced with native horizontal overflow so this
// Vite app can adopt the component without a dependency migration.
// Upstream: https://github.com/vercel/ai-elements/blob/main/packages/elements/src/suggestion.tsx

export type SuggestionsProps = React.HTMLAttributes<HTMLDivElement>;

export const Suggestions: React.FC<SuggestionsProps> = ({
  className = '',
  children,
  ...props
}) => (
  <div className="w-full overflow-x-auto whitespace-nowrap no-scrollbar" {...props}>
    <div className={`flex w-max flex-nowrap items-center gap-2 px-1 pb-2 ${className}`}>
      {children}
    </div>
  </div>
);

export type SuggestionProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion: React.FC<SuggestionProps> = ({
  suggestion,
  onClick,
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    onClick={() => onClick?.(suggestion)}
    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-neon-blue hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 ${className}`}
    {...props}
  >
    {children ?? suggestion}
  </button>
);
