import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Download } from 'lucide-react';
import SmartChip from './SmartChip';
import { parseMessageWithChips } from '../utils/parseMessageWithChips';

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  const { cleanText, links } = parseMessageWithChips(content);
  const [exported, setExported] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  const handleExport = () => {
    const exportText = `Fit For Cancer - Support Plan\nDate: ${new Date().toLocaleDateString()}\n\n${cleanText}`;
    const blob = new Blob([exportText], { type: 'text/plain' });
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');

    downloadLink.href = objectUrl;
    downloadLink.download = 'FitForCancer_Plan.txt';
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(objectUrl);

    setExported(true);

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setExported(false);
      resetTimerRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

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
        }}
      >
        {cleanText}
      </ReactMarkdown>

      {(links.length > 0 || cleanText.trim()) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <SmartChip key={link.url} title={link.title} url={link.url} />
            ))}
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label={exported ? 'Download started' : 'Download support plan'}
          >
            {exported ? <Check className="h-4 w-4 text-emerald-600" /> : <Download className="h-4 w-4" />}
            <span>{exported ? 'Saved' : 'Download'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MarkdownMessage;
