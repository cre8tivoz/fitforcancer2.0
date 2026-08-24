import React from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-[color:var(--color-primary)]" />
          <h1 className="text-3xl font-bold text-slate-900">About Fit For Cancer</h1>
        </div>
        <p className="text-lg font-semibold leading-relaxed text-slate-700">
          Because I wish it existed when I needed it.
        </p>
      </header>

      <div className="space-y-5 text-base leading-7 text-slate-700">
        <p>
          About a decade ago, I was diagnosed with a blood disorder. I still live with it, and I&apos;m still on active treatment.
        </p>
        <p>
          When I was first diagnosed, there was plenty of medical information, but very little that helped with the ordinary day-to-day questions: how much should I move when I&apos;m wiped out, what can I eat when treatment makes food difficult, and how do I make sense of a day when my energy has completely disappeared?
        </p>
        <p>
          I remember thinking that someone should build something simple for that gap. Eventually, I did.
        </p>
        <p>
          Fit For Cancer started as a practical fatigue, movement and nutrition tool. It has grown into the Energy Bank, treatment-aware movement and food ideas, and ATHENA — a conversational companion for the questions and uncertainties that come up between appointments.
        </p>
        <p>
          It is still built around the same idea: useful information should be easy to reach when you are tired, overwhelmed, or simply trying to get through treatment without turning every decision into another project.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">Free, private by design, and practical</h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
          <p>
            Fit For Cancer has no ads, subscriptions or account requirement. Core check-in history stays in your browser, and the app is designed to collect as little personal information as possible.
          </p>
          <p>
            It is an evidence-informed support tool, not a medical service or a replacement for your treating team. The aim is to make the space between appointments a little easier to navigate.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-100 bg-rose-50/60 p-6">
        <div className="flex items-start gap-3">
          <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900">Help keep it free</h2>
            <p className="text-sm leading-6 text-slate-600">
              Contributions help cover hosting and AI usage as more people use the app. There is no pressure to contribute — Fit For Cancer is here to be used.
            </p>
            <Link
              to="/support"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-rose-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
            >
              Support Fit For Cancer →
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold text-slate-900">Billy</p>
        <p className="text-xs text-slate-500">Melbourne, 2026</p>
      </div>
    </div>
  );
};

export default AboutPage;
