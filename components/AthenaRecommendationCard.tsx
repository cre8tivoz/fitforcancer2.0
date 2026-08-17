import React from 'react';
import { ArrowRight, Dumbbell, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RECIPES } from '../constants';
import { MOVEMENTS } from '../movements';
import type { AthenaRecommendationRef } from '../types';

interface AthenaRecommendationCardProps {
  recommendation: AthenaRecommendationRef;
}

const movementZoneLabel = (intensity: 'Green' | 'Yellow' | 'Red') => {
  if (intensity === 'Green') return '🟢 Green';
  if (intensity === 'Yellow') return '🟡 Yellow';
  return '🔴 Red';
};

const AthenaRecommendationCard: React.FC<AthenaRecommendationCardProps> = ({ recommendation }) => {
  const navigate = useNavigate();

  if (recommendation.kind === 'movement') {
    const movement = MOVEMENTS.find((item) => item.id === recommendation.id);
    if (!movement) return null;

    return (
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
              <Dumbbell className="h-3.5 w-3.5" />
              Movement · {movementZoneLabel(movement.intensity)}
            </div>
            <h4 className="text-sm font-bold leading-snug text-slate-900">{movement.title}</h4>
            <p className="mt-1 text-xs text-slate-600">{movement.duration} · {movement.benefit}</p>
          </div>
        </div>
        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-600">Safety:</span> {movement.safetyNote}
          </p>
          <button
            type="button"
            onClick={() => navigate(`/exercise?athena=${encodeURIComponent(movement.id)}`)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
          >
            Open in Movement
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    );
  }

  const recipe = RECIPES.find((item) => item.id === recommendation.id);
  if (!recipe) return null;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex gap-3 p-3">
        <img
          src={recipe.imageUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Nutrition · {recipe.fatigueZone}
          </div>
          <h4 className="text-sm font-bold leading-snug text-slate-900">{recipe.title}</h4>
          <p className="mt-1 text-xs text-slate-600">{recipe.prepTime} prep · {recipe.category}</p>
        </div>
      </div>
      <div className="border-t border-slate-100 px-3 py-2.5">
        {recipe.safetyNote && (
          <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-600">Safety:</span> {recipe.safetyNote}
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate(`/nutrition?athena=${encodeURIComponent(recipe.id)}`)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
        >
          Open in Nutrition
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

export default AthenaRecommendationCard;
