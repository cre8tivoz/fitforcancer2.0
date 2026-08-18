import React from 'react';

// Adapted from Vercel AI Elements' official Message component for ATHENA's
// existing ChatMessage model. Branching/actions/Streamdown are intentionally
// omitted because Fit for Cancer already owns markdown rendering and has no
// alternate-response workflow.
// Upstream: https://github.com/vercel/ai-elements/blob/main/packages/elements/src/message.tsx

export type MessageFrom = 'user' | 'assistant';

export type MessageProps = React.HTMLAttributes<HTMLDivElement> & {
  from: MessageFrom;
};

export const Message: React.FC<MessageProps> = ({
  from,
  className = '',
  ...props
}) => (
  <div
    className={`group flex w-full max-w-[95%] flex-col gap-2 ${
      from === 'user' ? 'is-user ml-auto items-end' : 'is-assistant items-start'
    } ${className}`}
    data-from={from}
    {...props}
  />
);

export type MessageContentProps = React.HTMLAttributes<HTMLDivElement> & {
  from: MessageFrom;
};

export const MessageContent: React.FC<MessageContentProps> = ({
  from,
  className = '',
  children,
  ...props
}) => (
  <div
    className={`min-w-0 max-w-full text-sm leading-relaxed ${
      from === 'user'
        ? 'w-fit max-w-[85%] rounded-2xl rounded-br-md bg-neon-blue px-4 py-3 text-neon-dark shadow-sm'
        : 'w-full max-w-[92%] text-slate-800 sm:max-w-[88%]'
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

export type MessageResponseProps = React.HTMLAttributes<HTMLDivElement>;

export const MessageResponse: React.FC<MessageResponseProps> = ({
  className = '',
  ...props
}) => (
  <div
    className={`min-w-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${className}`}
    {...props}
  />
);
