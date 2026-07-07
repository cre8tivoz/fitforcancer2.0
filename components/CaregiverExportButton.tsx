import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { generateCaregiverPdf } from '../utils/caregiverPdf';
import { usePdfGenerating } from '../hooks/usePdfGenerating';

interface CaregiverExportButtonProps {
  currentFatigueScore: number | null;
}

const CaregiverExportButton: React.FC<CaregiverExportButtonProps> = ({ currentFatigueScore }) => {
  const { generating, handleGenerate } = usePdfGenerating({
    onGenerate: () => generateCaregiverPdf(currentFatigueScore),
  });

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-50"
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
