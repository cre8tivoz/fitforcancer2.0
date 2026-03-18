import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SmartChipProps {
  title: string;
  url: string;
}

const SmartChip: React.FC<SmartChipProps> = ({ title, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
  >
    <span className="truncate">{title}</span>
    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
  </a>
);

export default SmartChip;
