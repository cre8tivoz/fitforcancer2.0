import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SmartChip from './SmartChip';
import { parseMessageWithChips } from '../utils/parseMessageWithChips';

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  const { cleanText, links } = parseMessageWithChips(content);

  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0 text-sm leading-7 text-inherit">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1.5 text-sm leading-7">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1.5 text-sm leading-7">{children}</ol>,
          li: ({ children }) => <li className="pl-1 marker:text-[color:var(--color-primary)]">{children}</li>,
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 font-display text-base font-extrabold uppercase tracking-[0.08em] text-[color:var(--color-primary)] first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[color:var(--color-tertiary)] first:mt-0">
              {children}
            </h4>
          ),
          strong: ({ children }) => <strong className="font-semibold text-[color:var(--color-text)]">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white/70">
              <table className="min-w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[color:var(--color-bg)] text-slate-700">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em]">{children}</th>,
          td: ({ children }) => <td className="border-t border-slate-200 px-3 py-2 align-top text-sm leading-6">{children}</td>,
          code: ({ children }) => (
            <code className="rounded-md bg-slate-200/70 px-1.5 py-0.5 font-medium text-[13px] text-slate-700">
              {children}
            </code>
          ),
          // Model-authored links outside the controlled resource-chip section
          // are rendered as text, not navigable destinations.
          a: ({ children }) => <span>{children}</span>,
        }}
      >
        {cleanText}
      </ReactMarkdown>

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <SmartChip key={link.url} title={link.title} url={link.url} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkdownMessage;
