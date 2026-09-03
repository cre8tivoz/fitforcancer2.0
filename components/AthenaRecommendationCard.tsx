import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Dumbbell, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RECIPES } from '../constants';
import { MOVEMENTS } from '../movements';
import type { AthenaRecommendationRef } from '../types';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface AthenaRecommendationCardProps {
  recommendation: AthenaRecommendationRef;
}

const AthenaRecommendationCard: React.FC<AthenaRecommendationCardProps> = ({ recommendation }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();

  const cardMotion = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } };

  if (recommendation.kind === 'movement') {
    const movement = MOVEMENTS.find((item) => item.id === recommendation.id);
    if (!movement) return null;

    return (
      <motion.article
        {...cardMotion}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex gap-3 p-3">
          {movement.imageUrl && (
            <img
              src={movement.imageUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
              loading="lazy"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
              Movement
            </div>
            <h4 className="text-sm font-bold leading-snug text-slate-900">{movement.title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{movement.duration} · {movement.benefit}</p>
          </div>
        </div>
        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-600">Safety:</span> {movement.safetyNote}
          </p>
          <motion.button
            type="button"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={() => navigate(`/exercise?athena=${encodeURIComponent(movement.id)}`)}
            className="group/cta inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
          >
            <span>Open in Movement</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover/cta:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
          </motion.button>
        </div>
      </motion.article>
    );
  }

  const recipe = RECIPES.find((item) => item.id === recommendation.id);
  if (!recipe) return null;

  return (
    <motion.article
      {...cardMotion}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex gap-3 p-3">
        <img
          src={recipe.imageUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
            Nutrition
          </div>
          <h4 className="text-sm font-bold leading-snug text-slate-900">{recipe.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{recipe.prepTime} prep · {recipe.category}</p>
        </div>
      </div>
      <div className="border-t border-slate-100 px-3 py-2.5">
        {recipe.safetyNote && (
          <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-600">Safety:</span> {recipe.safetyNote}
          </p>
        )}
        <motion.button
          type="button"
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          onClick={() => navigate(`/nutrition?athena=${encodeURIComponent(recipe.id)}`)}
          className="group/cta inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
        >
          <span>Open in Nutrition</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover/cta:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
        </motion.button>
      </div>
    </motion.article>
  );
};

export default AthenaRecommendationCard;
