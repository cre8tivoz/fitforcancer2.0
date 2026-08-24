import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const SupportThisApp: React.FC = () => {
  return (
    <section className="rounded-2xl border border-rose-100 bg-rose-50/60 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
        <div className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Support Fit For Cancer</h2>
          <p className="text-sm leading-6 text-slate-600">
            Fit For Cancer is free. If you would like to help keep it running, contributions help cover hosting and AI usage as more people use the app.
          </p>
          <Link
            to="/support"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-rose-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
          >
            Find out more or support the app →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SupportThisApp;
