import React from 'react';
import { ExternalLink, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const KO_FI_URL = 'https://ko-fi.com/fitforcancer';

const SupportPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Heart className="h-7 w-7 text-rose-500" />
          <h1 className="text-3xl font-bold text-slate-900">Support Fit For Cancer</h1>
        </div>
        <p className="text-lg font-semibold leading-relaxed text-slate-700">
          Fit For Cancer is free, and I want it to stay that way.
        </p>
      </header>

      <div className="space-y-5 text-base leading-7 text-slate-700">
        <p>
          There are no subscriptions, ads or paid features. If Fit For Cancer has been useful to you, or you simply want to help keep it available for someone else, you can contribute a few dollars through Ko-fi.
        </p>
        <p>
          Contributions help cover hosting and AI usage as more people use the app.
        </p>
        <p>
          There is no expectation to donate. If you are dealing with cancer yourself, please just use the app. That is what it is here for.
        </p>
      </div>

      <section className="rounded-2xl border border-rose-100 bg-rose-50/60 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-slate-900">Support through Ko-fi</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Ko-fi keeps support for Fit For Cancer separate from my other work and gives people a simple way to chip in without creating an account inside the app.
              </p>
            </div>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
            >
              <Heart className="h-5 w-5" />
              Support on Ko-fi
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <p className="text-sm leading-6 text-slate-500">
        Want to know why the app exists?{' '}
        <Link
          to="/about"
          className="font-semibold text-[color:var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
        >
          Read the story behind Fit For Cancer.
        </Link>
      </p>
    </div>
  );
};

export default SupportPage;
