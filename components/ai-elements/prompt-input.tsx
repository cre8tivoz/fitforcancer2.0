import React, { useEffect, useRef } from 'react';
import { ArrowUp, LoaderCircle } from 'lucide-react';

// Adapted from Vercel AI Elements' official PromptInput component for ATHENA's
// existing controlled input/session state. Attachments, model selection and AI
// SDK status types are intentionally omitted; the composable form/body/footer
// API and Enter/Shift+Enter behaviour are retained.
// Upstream: https://github.com/vercel/ai-elements/blob/main/packages/elements/src/prompt-input.tsx

export type PromptInputMessage = {
  text: string;
};

export type PromptInputStatus = 'ready' | 'submitted' | 'streaming' | 'error';

export type PromptInputProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  onSubmit?: (message: PromptInputMessage, event: React.FormEvent<HTMLFormElement>) => void;
};

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  className = '',
  children,
  ...props
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const text = String(formData.get('message') ?? '');
    onSubmit?.({ text }, event);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:border-neon-blue focus-within:ring-2 focus-within:ring-neon-blue/20 ${className}`}
      {...props}
    >
      {children}
    </form>
  );
};

export type PromptInputBodyProps = React.HTMLAttributes<HTMLDivElement>;

export const PromptInputBody: React.FC<PromptInputBodyProps> = ({
  className = '',
  ...props
}) => <div className={`flex items-end gap-2 px-3 pt-3 ${className}`} {...props} />;

export type PromptInputTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
  maxHeight?: number;
};

export const PromptInputTextarea: React.FC<PromptInputTextareaProps> = ({
  className = '',
  minRows = 1,
  maxHeight = 160,
  onKeyDown,
  value,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, maxHeight]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      name="message"
      rows={minRows}
      value={value}
      onKeyDown={handleKeyDown}
      className={`max-h-40 min-h-11 flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 ${className}`}
      {...props}
    />
  );
};

export type PromptInputFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const PromptInputFooter: React.FC<PromptInputFooterProps> = ({
  className = '',
  ...props
}) => (
  <div
    className={`flex min-h-12 items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 ${className}`}
    {...props}
  />
);

export type PromptInputToolsProps = React.HTMLAttributes<HTMLDivElement>;

export const PromptInputTools: React.FC<PromptInputToolsProps> = ({
  className = '',
  ...props
}) => <div className={`flex items-center gap-1.5 ${className}`} {...props} />;

export type PromptInputButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const PromptInputButton: React.FC<PromptInputButtonProps> = ({
  className = '',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-transparent px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 ${className}`}
    {...props}
  />
);

export type PromptInputSubmitProps = Omit<PromptInputButtonProps, 'type'> & {
  status?: PromptInputStatus;
};

export const PromptInputSubmit: React.FC<PromptInputSubmitProps> = ({
  status = 'ready',
  className = '',
  children,
  disabled,
  ...props
}) => {
  const isBusy = status === 'submitted' || status === 'streaming';

  return (
    <PromptInputButton
      type="submit"
      disabled={disabled || isBusy}
      aria-label={isBusy ? 'ATHENA is responding' : 'Send message to ATHENA'}
      className={`bg-neon-blue text-neon-dark hover:bg-neon-blue/90 hover:text-neon-dark ${className}`}
      {...props}
    >
      {children ?? (
        isBusy
          ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          : <ArrowUp className="h-5 w-5" aria-hidden="true" />
      )}
    </PromptInputButton>
  );
};
