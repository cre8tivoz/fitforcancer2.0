
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe } from '../types';
import { X, Clock, ChefHat, Info, ExternalLink, TriangleAlert } from 'lucide-react';

interface NutritionCardProps {
  recipe: Recipe;
}

const NutritionCard: React.FC<NutritionCardProps> = ({ recipe }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen) {
      modalRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [isModalOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else if (document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow transition-transform transition-colors group flex flex-col h-full"
      >
        <div className="relative overflow-hidden h-48 bg-slate-50">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[color:var(--color-accent)]/20 text-[color:var(--color-nav)] rounded-full border border-[color:var(--color-accent)]/40">
              {recipe.category}
            </span>
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              {recipe.fatigueZone}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Prep: {recipe.prepTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="w-3 h-3" />
              <span>Cook: {recipe.cookTime}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold mb-3 text-slate-900 leading-tight">{recipe.title}</h3>

          <div className="mb-4 flex-1">
            <div className="flex items-center gap-1.5 mb-2 text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Nutritional Benefit</h4>
            </div>
            <p className="text-xs text-slate-600 font-medium line-clamp-2 mb-3">
              {recipe.nutritionalBenefit}
            </p>

            <div className="flex items-center gap-1.5 mb-2 text-slate-400">
              <ChefHat className="w-3.5 h-3.5" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Key Ingredients</h4>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 italic">
              {recipe.ingredients.slice(0, 3).join(', ')}{recipe.ingredients.length > 3 ? '...' : ''}
            </p>
          </div>

          <motion.button
            ref={triggerRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 bg-neon-blue text-neon-dark rounded-xl font-bold text-sm hover:bg-neon-blue/90 transition-shadow transition-transform transition-colors shadow-sm shadow-neon-blue/20 flex items-center justify-center gap-2"
            onClick={() => setIsModalOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isModalOpen}
          >
            <ChefHat className="w-4 h-4" />
            View Recipe
          </motion.button>

          {recipe.citation && (
            recipe.sourceUrl ? (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 hover:text-neon-blue"
                aria-label={`Open source for ${recipe.title} (opens in new tab)`}
              >
                {recipe.citation}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                {recipe.citation}
              </p>
            )
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onKeyDown={handleKeyDown}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`recipe-title-${recipe.id}`}
              aria-describedby={`recipe-benefit-${recipe.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col outline-none"
            >
              <div className="relative h-48 sm:h-64 shrink-0">
                <img
                  src={recipe.imageUrl}
                  alt=""
                  className="w-full h-full object-cover object-center bg-slate-50"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex gap-2 mb-2">
                    <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-neon-blue text-neon-dark rounded-full">
                      {recipe.category}
                    </span>
                    <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white rounded-full border border-white/20">
                      {recipe.fatigueZone}
                    </span>
                  </div>
                  <h2 id={`recipe-title-${recipe.id}`} className="text-2xl sm:text-3xl font-bold text-white">{recipe.title}</h2>
                  <div className="flex items-center gap-4 mt-2 text-white/80 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>Prep: {recipe.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4" />
                      <span>Cook: {recipe.cookTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
                <div id={`recipe-benefit-${recipe.id}`} className="p-4 bg-neon-blue/5 rounded-2xl border border-neon-blue/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-neon-blue" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-neon-blue">Nutritional Benefit</h4>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">
                    {recipe.nutritionalBenefit}
                  </p>
                </div>

                {recipe.safetyNote && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-2 text-amber-800">
                      <TriangleAlert className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">Treatment-side-effect note</h4>
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {recipe.safetyNote}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-neon-blue/10 rounded-lg flex items-center justify-center text-neon-blue">
                        <Info className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">Ingredients</h3>
                    </div>
                    <ul className="space-y-3">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-1.5 shrink-0" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-[color:var(--color-tertiary)]/12 rounded-lg flex items-center justify-center text-[color:var(--color-tertiary)]">
                        <ChefHat className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">Instructions</h3>
                    </div>
                    <div className="space-y-6">
                      {recipe.instructions.map((step, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-600 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500 italic text-center">
                    Measurements are in Australian metric units. Adjust portions as needed based on your appetite and nutritional requirements.
                  </p>
                  {recipe.citation && (
                    recipe.sourceUrl ? (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 hover:text-neon-blue"
                        aria-label={`Open source for ${recipe.title} (opens in new tab)`}
                      >
                        {recipe.citation}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                        {recipe.citation}
                      </p>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NutritionCard;
