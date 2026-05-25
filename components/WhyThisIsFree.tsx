import React from 'react';
import { Heart, ArrowLeft, ExternalLink } from 'lucide-react';

const KO_FI_URL = 'https://ko-fi.com/cre8tiv';

const WhyThisIsFree: React.FC = () => {
  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10 sm:px-6 animate-fade-in">
      {/* Back link */}
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to app
      </a>

      {/* Title */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Heart className="h-7 w-7 text-rose-500" />
          <h1 className="text-3xl font-bold text-slate-900">Why This Is Free</h1>
        </div>
        <p className="text-lg font-semibold leading-relaxed text-slate-700">
          Because I wish it existed when I needed it.
        </p>
      </div>

      {/* Story */}
      <div className="space-y-5 text-base leading-7 text-slate-700">
        <p>
          About a decade ago, I was diagnosed with a blood disorder. I still live with it. I'm still 
          on active treatment.
        </p>
        <p>
          When I was first diagnosed, there were no tools to help me navigate the day-to-day — the 
          fatigue, the nutrition, the exercise. I had to piece it together from scraps of advice, 
          and I remember thinking: <em>someone should build something simple for this.</em>
        </p>
        <p>
          So I did. Fit For Cancer is that thing.
        </p>
        <p>
          It's built for patients, not profits. There are no ads, no subscriptions, no data mining. 
          It will always be free for anyone who needs it.
        </p>
        <p>
          The only costs are the servers and the AI model usage — about $50 a month. If you're a 
          carer, a family member, or someone who can spare a few dollars, chipping in helps keep 
          this alive for the next person who needs a hand finding the right movement, the right 
          meal, or just the right words.
        </p>
        <p>
          No pressure. Just passing it forward.
        </p>
      </div>

      {/* Signature */}
      <div className="border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold text-slate-900">Billy</p>
        <p className="text-xs text-slate-500">Melbourne, 2026</p>
      </div>

      {/* CTA */}
      <a
        href={KO_FI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
      >
        <Heart className="h-5 w-5" />
        Support on Ko-fi
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
};

export default WhyThisIsFree;
