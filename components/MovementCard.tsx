import React from 'react';
import { motion } from 'motion/react';
import { Movement } from '../types';
import { Brain, Dumbbell, ShieldAlert, Clock, CheckCircle2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface MovementCardProps {
  movement: Movement;
}

const MovementCard: React.FC<MovementCardProps> = ({ movement }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const intensityMap = {
    Green: {
      label: 'More Energy',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    Yellow: {
      label: 'Take It Easier',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    Red: {
      label: 'Low Battery',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
    },
  } as const;

  const zone = intensityMap[movement.intensity];

  return (
    <motion.article
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden border-b border-slate-100 bg-slate-50">
        {movement.imageUrl ? (
          <img
            src={movement.imageUrl}
            alt={movement.title}
            className="h-full w-full object-cover object-center transition-transform duration-200 motion-safe:group-hover:scale-[1.015] motion-reduce:transform-none"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
            <ImageIcon className="h-10 w-10 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Visual Guide Coming Soon</span>
          </div>
        )}

        <div className="absolute left-4 top-4 z-10">
          <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm backdrop-blur-md ${zone.color}`}>
            {zone.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold leading-tight text-slate-900">{movement.title}</h3>
          {movement.citation && (
            movement.sourceUrl ? (
              <a
                href={movement.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex shrink-0 items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 transition-colors duration-200 hover:text-slate-600"
                aria-label={`Open source for ${movement.title}`}
              >
                Source <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="mt-1 shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Source</span>
            )
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[color:var(--color-primary)]" aria-hidden="true" />
            <span>{movement.duration}</span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--color-primary)]" aria-hidden="true" />
            <span>{movement.benefit}</span>
          </div>
        </div>

        <p className="mb-5 text-sm font-medium leading-relaxed text-slate-600">
          {movement.description}
        </p>

        <section className="mb-5 border-t border-slate-100 pt-4" aria-label={`Why ${movement.title} may help`}>
          <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Why it may help</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]">
                <Brain className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mind & Mood</p>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600">{movement.mentalWellbeingBenefit}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-tertiary)]/10 text-[color:var(--color-tertiary)]">
                <Dumbbell className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Body & Strength</p>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600">{movement.strengthBenefit}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-auto rounded-xl border border-amber-100 bg-amber-50/70 p-4" aria-label={`Safety notes for ${movement.title}`}>
          <div className="mb-2 flex items-center gap-2 text-amber-700">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Things to watch</h4>
          </div>
          <p className="text-xs font-medium leading-relaxed text-amber-800">{movement.safetyNote}</p>
          {movement.citation && (
            <p className="mt-3 text-[10px] leading-relaxed text-amber-900/65">
              {movement.citation}
            </p>
          )}
        </section>
      </div>
    </motion.article>
  );
};

export default MovementCard;
