import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { generateCaregiverPdf } from '../utils/caregiverPdf';

interface CaregiverExportButtonProps {
  currentFatigueScore: number | null;
}

const CaregiverExportButton: React.FC<CaregiverExportButtonProps> = ({ currentFatigueScore }) => {
  const [generating, setGenerating] = useState(false);

  const handleExport = () => {
    if (generating) return;
    setGenerating(true);
    try {
      generateCaregiverPdf(currentFatigueScore);
    } finally {
      setTimeout(() => setGenerating(false), 1000);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={generating}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-50"
      aria-label="Export caregiver summary PDF"
    >
      {generating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5" />
      )}
      <span>{generating ? 'Generating…' : 'Caregiver PDF'}</span>
    </button>
  );
};

export default CaregiverExportButton;
