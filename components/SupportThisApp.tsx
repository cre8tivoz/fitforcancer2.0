import React, { useEffect, useState } from 'react';
import { Heart, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { getFundStatus, recordDonation } from '../utils/donationTracker';

const KO_FI_URL = 'https://ko-fi.com/fitforcancer';

const SupportThisApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fundStatus, setFundStatus] = useState(() => getFundStatus());
  const contentId = React.useId();

  useEffect(() => {
    setFundStatus(getFundStatus());
  }, []);

  const handleDonation = (amount: number) => {
    recordDonation(amount);
    setFundStatus(getFundStatus());
    window.open(KO_FI_URL, '_blank', 'noopener,noreferrer');
  };

  const progressPercent = Math.min(100, Math.round((fundStatus.raised / fundStatus.goal) * 100));

  const getProgressColor = () => {
    if (progressPercent >= 80) return 'bg-emerald-500';
    if (progressPercent >= 40) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full items-center justify-between bg-slate-50 px-6 py-5 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
      >
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Support This App</h2>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>

      {isOpen && (
        <div id={contentId} className="animate-slide-down border-t border-slate-100 p-6 space-y-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Fit For Cancer is completely free for patients — no ads, no subscriptions, no gating. 
            If you find this helpful and want to keep it alive for the next person who needs it, 
            chipping in a few dollars helps cover hosting and model costs.
          </p>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                ${fundStatus.raised} raised
              </span>
              <span className="text-slate-500">
                ${fundStatus.goal} goal this month
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Donation buttons */}
          <div className="flex flex-wrap gap-3">
            {[2, 5, 10].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleDonation(amount)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 hover:text-rose-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Story link */}
          <a
            href="/why-free"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
          >
            Read the story →
          </a>
        </div>
      )}
    </div>
  );
};

export default SupportThisApp;
