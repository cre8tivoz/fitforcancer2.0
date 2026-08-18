import React, { useEffect } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RECIPES } from '../constants';
import { Recipe } from '../types';
import NutritionCard from './NutritionCard';

interface NutritionPageProps {
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  recipeZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null;
  recipeCategoryFilter: Recipe['category'] | 'All';
  recipeSearchQuery: string;
  onRecipeZoneFilterChange: (zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => void;
  onCategoryFilterChange: (cat: Recipe['category'] | 'All') => void;
  onSearchChange: (q: string) => void;
}

const RED_ZONE_RECIPE_ORDER: Record<string, number> = {
  'Energy Blitz Greek Yoghurt': 0,
  'Custard & Pear Cup': 1,
  'Creamed Rice Cup': 2,
  'Fortified Milky Drink': 3,
  'The "Crash" Shake': 4,
  'Hydrating Watermelon & Mint Cooler': 5,
};

const NutritionPage: React.FC<NutritionPageProps> = ({
  fatigueZone,
  recipeZoneFilter,
  recipeCategoryFilter,
  recipeSearchQuery,
  onRecipeZoneFilterChange,
  onCategoryFilterChange,
  onSearchChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const athenaTargetId = searchParams.get('athena');
  const athenaTarget = athenaTargetId ? RECIPES.find((recipe) => recipe.id === athenaTargetId) : undefined;
  const currentRecipeZone = recipeZoneFilter === 'All' ? null : (recipeZoneFilter || fatigueZone);

  const clearAthenaTarget = () => {
    if (!searchParams.has('athena')) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('athena');
    setSearchParams(nextParams, { replace: true });
  };

  const changeRecipeZoneFilter = (zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => {
    clearAthenaTarget();
    onRecipeZoneFilterChange(zone);
  };

  const changeCategoryFilter = (category: Recipe['category'] | 'All') => {
    clearAthenaTarget();
    onCategoryFilterChange(category);
  };

  const changeSearch = (query: string) => {
    clearAthenaTarget();
    onSearchChange(query);
  };

  const clearAllFilters = () => {
    clearAthenaTarget();
    onSearchChange('');
    onCategoryFilterChange('All');
    onRecipeZoneFilterChange('All');
  };

  const filteredRecipes = RECIPES.filter((recipe) => {
    if (recipe.id === athenaTarget?.id) return true;

    const matchesCategory = recipeCategoryFilter === 'All' || recipe.category === recipeCategoryFilter;
    const matchesSearch = recipe.title.toLowerCase().includes(recipeSearchQuery.toLowerCase()) ||
      recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(recipeSearchQuery.toLowerCase()));

    let matchesFatigue = true;
    if (recipeZoneFilter === 'All') matchesFatigue = true;
    else if (currentRecipeZone) matchesFatigue = recipe.fatigueZone === currentRecipeZone;

    return matchesCategory && matchesSearch && matchesFatigue;
  });

  const orderedRecipes = currentRecipeZone === '🔴 Red'
    ? [...filteredRecipes].sort((a, b) => {
        const aOrder = RED_ZONE_RECIPE_ORDER[a.title] ?? Number.MAX_SAFE_INTEGER;
        const bOrder = RED_ZONE_RECIPE_ORDER[b.title] ?? Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      })
    : filteredRecipes;

  useEffect(() => {
    if (!athenaTarget) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`recipe-${athenaTarget.id}`);
      if (!target) return;
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [athenaTarget]);

  const categories: (Recipe['category'] | 'All')[] = ['All', 'High Protein', 'Anti-Nausea', 'Easy to Digest', 'Hydrating', 'Zero-Prep', 'Quick Assembly'];
  const isFiltering = recipeCategoryFilter !== 'All' || recipeSearchQuery !== '' || recipeZoneFilter !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Recovery Nutrition</h1>
            <p className="text-slate-600 mt-1">Low-effort, treatment-aware food ideas for different energy levels and common side effects.</p>
          </div>
          <div className="w-full md:w-72">
            <label htmlFor="nutrition-search" className="mb-1.5 ml-1 block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Search recipes</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input id="nutrition-search" type="text" placeholder="Search ingredients or recipes..." value={recipeSearchQuery} onChange={(event) => changeSearch(event.target.value)} className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm transition-shadow transition-transform transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue" />
              {recipeSearchQuery && (
                <button type="button" onClick={() => changeSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2" aria-label="Clear recipe search">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {athenaTarget && (
          <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/5 px-4 py-3 text-sm text-slate-700">
            <span className="font-bold text-slate-900">From ATHENA:</span> {athenaTarget.title} is highlighted below. It stays visible here even if an older search or filter would otherwise hide it.
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Energy Zone</span>
                <div role="radiogroup" aria-label="Nutrition energy zone filter" className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                  <button type="button" role="radio" aria-checked={recipeZoneFilter === 'All'} onClick={() => changeRecipeZoneFilter('All')} className={`min-h-[44px] px-4 py-1.5 rounded-full text-xs font-bold transition-shadow transition-transform transition-colors ${recipeZoneFilter === 'All' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}>
                    All
                  </button>
                  {(['🟢 Green', '🟡 Yellow', '🔴 Red'] as const).map((zone) => {
                    const isActive = recipeZoneFilter === zone || (recipeZoneFilter === null && fatigueZone === zone);
                    return (
                      <button key={zone} type="button" role="radio" aria-checked={isActive} onClick={() => changeRecipeZoneFilter(recipeZoneFilter === zone ? 'All' : zone)} className={`min-h-[44px] px-4 py-1.5 rounded-full text-xs font-bold transition-shadow transition-transform transition-colors flex items-center gap-1.5 ${isActive ? 'bg-white shadow-md text-slate-900 border border-slate-100' : 'text-slate-400 hover:text-slate-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}>
                        {zone}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Category</span>
                <div role="radiogroup" aria-label="Recipe category filter" className="flex gap-2 overflow-x-auto pb-2 pt-1 pr-1 md:flex-wrap md:overflow-visible scroll-fade-right">
                  {categories.map((category) => (
                    <button key={category} type="button" role="radio" aria-checked={recipeCategoryFilter === category} onClick={() => changeCategoryFilter(recipeCategoryFilter === category ? 'All' : category)} className={`min-h-11 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-shadow transition-transform transition-colors border ${recipeCategoryFilter === category ? 'bg-neon-blue text-neon-dark border-neon-blue shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-neon-blue hover:text-neon-blue'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}>
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {isFiltering && (
              <button type="button" onClick={clearAllFilters} className="text-[10px] font-black text-neon-pink hover:underline uppercase tracking-[0.2em] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2">
                <X className="w-3 h-3" />
                Clear All Filters
              </button>
            )}
          </div>
          {recipeZoneFilter === null && fatigueZone && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-blue/5 border border-neon-blue/10 rounded-lg">
              <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" />
              <span className="sr-only">Following your current zone.</span>
              <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">Dynamic Mode Active: Following your {fatigueZone} Zone</span>
            </div>
          )}
        </div>
      </div>

      {orderedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orderedRecipes.map((recipe) => {
            const isAthenaTarget = recipe.id === athenaTarget?.id;
            return (
              <div
                key={recipe.id}
                id={`recipe-${recipe.id}`}
                tabIndex={isAthenaTarget ? -1 : undefined}
                aria-label={isAthenaTarget ? `ATHENA recommendation: ${recipe.title}` : undefined}
                className={`scroll-mt-24 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-4 ${isAthenaTarget ? 'ring-2 ring-neon-blue ring-offset-4 ring-offset-[color:var(--color-bg)]' : ''}`}
              >
                {isAthenaTarget && (
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-neon-blue">ATHENA recommendation</div>
                )}
                <NutritionCard recipe={recipe} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No recipes found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or filters.</p>
          <button onClick={clearAllFilters} className="mt-4 text-neon-blue font-semibold hover:underline">Clear all filters</button>
        </div>
      )}
    </div>
  );
};

export default NutritionPage;