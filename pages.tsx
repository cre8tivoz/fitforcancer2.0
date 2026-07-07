import React, { useState } from 'react';
import { AppTab, Recipe, Movement, CancerTypeOption } from './types';
import { RECIPES, MOVEMENTS } from './constants';
import MovementCard from './components/MovementCard';
import NutritionCard from './components/NutritionCard';
import { getFatigueZone } from './utils/fatigueScore';
import { Search, Filter, X, Zap, AlertCircle, UtensilsCrossed, Droplets, Coffee, MessageCircle, Activity, Utensils, ShieldCheck, BookOpen } from 'lucide-react';

// ─── HOME PAGE ──────────────────────────────────────────────
export const HomePage: React.FC<{
  fatigueScore: number | null;
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  onNavigate: (tab: AppTab) => void;
}> = ({ fatigueScore, fatigueZone, onNavigate }) => (
  <div className="space-y-8">
    {/* Hero */}
    <header className={`${
      fatigueZone === '🔴 Red' ? 'bg-rose-500 text-white shadow-rose-200' :
      fatigueZone === '🟡 Yellow' ? 'bg-amber-400 text-amber-950 shadow-amber-100' :
      'bg-neon-blue text-neon-dark shadow-neon-blue/20'
    } rounded-2xl p-8 shadow-lg transition-shadow transition-transform duration-500 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold">Welcome to Fit For Cancer</h1>
          {fatigueZone && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
              <span className="text-lg leading-none">{fatigueZone.split(' ')[0]}</span>
              <span className="text-xs font-bold uppercase tracking-widest">{fatigueZone.split(' ')[1]} Zone Active</span>
            </div>
          )}
        </div>
        <p className="opacity-90 max-w-xl text-lg font-medium leading-relaxed">
          {!fatigueZone
            ? "Evidence-based exercise and nutrition support tailored for your journey in Australia."
            : fatigueZone === '🟢 Green'
              ? "Your energy levels are high today! It's a great time to focus on building strength and stamina."
              : fatigueZone === '🟡 Yellow'
                ? "Your energy is dipping a bit. We've modified your recommendations to help you stay active without draining your battery."
                : "You're in the recovery zone today. Focus on restorative movements and nourishing foods to help your body recharge."
          }
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <button
            onClick={() => onNavigate(AppTab.ASSISTANT)}
            className={`${
              fatigueZone === '🔴 Red' ? 'bg-white text-rose-600' :
              fatigueZone === '🟡 Yellow' ? 'bg-amber-950 text-amber-400' :
              'bg-neon-dark text-neon-blue'
            } px-6 py-3 font-bold rounded-full hover:opacity-90 transition-shadow transition-transform transition-colors hover:scale-105 shadow-md flex items-center gap-2`}
          >
            <MessageCircle className="w-4 h-4" />
            Talk to Health Assistant
          </button>
          {fatigueZone && (
            <button
              onClick={() => onNavigate(AppTab.ASSISTANT)}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 font-bold rounded-full hover:bg-white/20 transition-shadow transition-transform transition-colors"
            >
              Update Fatigue Score
            </button>
          )}
        </div>
      </div>
    </header>

    {/* How it Works */}
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>How it Works</span>
          <span className="text-lg">🟢🟡🔴</span>
        </h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Managing your energy during treatment can feel like a moving target. Fit For Cancer is your evidence-based companion.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">1</div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Check Your Battery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Use our simple 0–10 Fatigue Tracker.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">2</div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Get Your Zone</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Based on your score, we update your Traffic Light Zone.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">3</div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Smart Recommendations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Your panels refresh to show the safest, most effective options.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* 3 Pillars */}
    <section>
      <h2 className="text-2xl font-bold mb-4">The 3 Pillars of Support</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-[color:var(--color-accent)]/25 text-[color:var(--color-nav)] rounded-full flex items-center justify-center mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Movement</h3>
          <p className="text-slate-600 text-sm">Gentle, safe, and effective exercises designed to combat cancer-related fatigue.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] rounded-full flex items-center justify-center mb-4">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Nourishment</h3>
          <p className="text-slate-600 text-sm">Recipes that manage treatment side-effects like nausea and low appetite.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-[color:var(--color-tertiary)]/15 text-[color:var(--color-tertiary)] rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Evidence-Based</h3>
          <p className="text-slate-600 text-sm">Advice aligned with COSA guidelines and Australian oncology standards.</p>
        </div>
      </div>
    </section>

    {/* Featured Movement */}
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Featured Movement</h2>
        <button onClick={() => onNavigate(AppTab.EXERCISE)} className="text-neon-blue font-semibold hover:underline">View All</button>
      </div>
      <MovementCard movement={MOVEMENTS[0]} />
    </section>
  </div>
);

// ─── EXERCISE PAGE ──────────────────────────────────────────
export const ExercisePage: React.FC<{
  fatigueScore: number | null;
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  exerciseZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null;
  isMyelomaPatient: boolean;
  onExerciseZoneFilterChange: (zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => void;
}> = ({ fatigueScore, fatigueZone, exerciseZoneFilter, isMyelomaPatient, onExerciseZoneFilterChange }) => {
  const currentExerciseZone = exerciseZoneFilter === 'All' ? null : (exerciseZoneFilter || fatigueZone);
  const filteredMovements = MOVEMENTS.filter(m => {
    if (exerciseZoneFilter === 'All') return true;
    if (!currentExerciseZone) return true;
    const zoneKey = currentExerciseZone.split(' ')[1] as 'Green' | 'Yellow' | 'Red';
    return m.intensity === zoneKey;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Safe Movements</h1>
          <p className="text-slate-600">These movements are designed for various energy levels. Always listen to your body.</p>
        </div>
      </div>

      {currentExerciseZone && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-slate-800">
            {currentExerciseZone === '🟢 Green' && `Because you're in the 🟢 Green Zone (Score ${fatigueScore ?? 'X'}/10), these 'Standard Movements' focus on building your strength.`}
            {currentExerciseZone === '🟡 Yellow' && `Because you're in the 🟡 Yellow Zone (Score ${fatigueScore ?? 'X'}/10), these 'Modified Movements' keep your circulation moving without draining your battery.`}
            {currentExerciseZone === '🔴 Red' && `Because you're in the 🔴 Red Zone (Score ${fatigueScore ?? 'X'}/10), we are focusing on 'Restorative Movement' to protect your energy.`}
          </p>
        </div>
      )}

      {isMyelomaPatient && (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
          <span className="text-xl">🦴</span>
          <div className="space-y-1">
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Myeloma Care Note</p>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Please ensure your haematologist has cleared you for weight-bearing exercise.
              {currentExerciseZone === '🔴 Red' && " For Red Zone days, please avoid 'Bed Rotations' if you are experiencing any new or localised back pain."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span id="exercise-zone-filter-label" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Energy Zone Filter:</span>
        <div role="radiogroup" aria-labelledby="exercise-zone-filter-label" className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
          <button type="button" role="radio" aria-checked={exerciseZoneFilter === 'All'} onClick={() => onExerciseZoneFilterChange(exerciseZoneFilter === 'All' ? 'All' : 'All')} className={`min-h-[44px] px-3 py-1 rounded-full text-xs font-bold transition-shadow transition-transform transition-colors ${exerciseZoneFilter === 'All' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}>
            All
          </button>
          {(['🟢 Green', '🟡 Yellow', '🔴 Red'] as const).map((zone) => {
            const isActive = exerciseZoneFilter === zone || (exerciseZoneFilter === null && fatigueZone === zone);
            return (
              <button key={zone} type="button" role="radio" aria-checked={isActive} onClick={() => onExerciseZoneFilterChange(exerciseZoneFilter === zone ? 'All' : zone)} className={`min-h-[44px] px-3 py-1 rounded-full text-xs font-bold transition-shadow transition-transform transition-colors flex items-center gap-1.5 ${isActive ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}>
                {zone}
              </button>
            );
          })}
        </div>
      </div>

      {exerciseZoneFilter === '🟢 Green' && fatigueZone === '🔴 Red' && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-xs text-rose-700 font-medium">
            I'm showing you the Green Zone exercises, but please proceed with caution as your current fatigue is high.
          </p>
        </div>
      )}

      {currentExerciseZone === '🔴 Red' && (
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 space-y-4">
          <h3 className="font-bold text-amber-900 flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            Energy Conservation: The 3 P's
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-amber-800 text-sm">Pacing</p>
              <p className="text-xs text-amber-700 leading-relaxed">Rest before you feel exhausted. Break tasks into smaller chunks.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-amber-800 text-sm">Prioritising</p>
              <p className="text-xs text-amber-700 leading-relaxed">Skip non-essential tasks today. Focus your energy on what matters most.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-amber-800 text-sm">Positioning</p>
              <p className="text-xs text-amber-700 leading-relaxed">Perform movements while sitting or lying down to reduce the work of the heart.</p>
            </div>
          </div>
        </div>
      )}

      {filteredMovements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMovements.map((m) => (
            <MovementCard key={m.id} movement={m} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <h3 className="text-lg font-bold text-slate-800">No movements found for this zone</h3>
          <button onClick={() => onExerciseZoneFilterChange('All')} className="mt-2 text-neon-blue font-semibold hover:underline">View all movements</button>
        </div>
      )}

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mt-8">
        <h3 className="font-bold text-blue-800 mb-2">Evidence Note</h3>
        <p className="text-blue-700 text-sm">COSA guidelines recommend that all people with cancer should avoid inactivity and be as physically active as their current condition allows.</p>
      </div>
    </div>
  );
};

// ─── NUTRITION PAGE ─────────────────────────────────────────
export const NutritionPage: React.FC<{
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  recipeZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null;
  recipeCategoryFilter: Recipe['category'] | 'All';
  recipeSearchQuery: string;
  onRecipeZoneFilterChange: (zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => void;
  onCategoryFilterChange: (cat: Recipe['category'] | 'All') => void;
  onSearchChange: (q: string) => void;
}> = ({ fatigueZone, recipeZoneFilter, recipeCategoryFilter, recipeSearchQuery, onRecipeZoneFilterChange, onCategoryFilterChange, onSearchChange }) => {
  const currentRecipeZone = recipeZoneFilter === 'All' ? null : (recipeZoneFilter || fatigueZone);
  const filteredRecipes = RECIPES.filter(recipe => {
    const matchesCategory = recipeCategoryFilter === 'All' || recipe.category === recipeCategoryFilter;
    const matchesSearch = recipe.title.toLowerCase().includes(recipeSearchQuery.toLowerCase()) ||
      recipe.ingredients.some(ing => ing.toLowerCase().includes(recipeSearchQuery.toLowerCase()));
    let matchesFatigue = true;
    if (recipeZoneFilter === 'All') matchesFatigue = true;
    else if (currentRecipeZone) matchesFatigue = recipe.fatigueZone === currentRecipeZone;
    return matchesCategory && matchesSearch && matchesFatigue;
  });

  const categories: (Recipe['category'] | 'All')[] = ['All', 'High Protein', 'Anti-Nausea', 'Easy to Digest', 'Hydrating', 'Zero-Prep', 'Quick Assembly'];
  const isFiltering = recipeCategoryFilter !== 'All' || recipeSearchQuery !== '' || recipeZoneFilter !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Recovery Nutrition</h1>
            <p className="text-slate-600 mt-1">Nourishing recipes that are easy to prepare and digest during treatment.</p>
          </div>
          <div className="w-full md:w-72">
            <label htmlFor="nutrition-search" className="mb-1.5 ml-1 block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Search recipes</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input id="nutrition-search" type="text" placeholder="Search ingredients or recipes..." value={recipeSearchQuery} onChange={(e) => onSearchChange(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm transition-shadow transition-transform transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue" />
              {recipeSearchQuery && (
                <button type="button" onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2" aria-label="Clear recipe search">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Energy Zone</span>
                <div role="radiogroup" aria-label="Nutrition energy zone filter" className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                  <button type="button" role="radio" aria-checked={recipeZoneFilter === 'All'} onClick={() => onRecipeZoneFilterChange(recipeZoneFilter === 'All' ? 'All' : 'All')} className={`min-h-[44px] px-4 py-1.5 rounded-full text-xs font-bold transition-shadow transition-transform transition-colors ${recipeZoneFilter === 'All' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}>
                    All
                  </button>
                  {(['🟢 Green', '🟡 Yellow', '🔴 Red'] as const).map((zone) => {
                    const isActive = recipeZoneFilter === zone || (recipeZoneFilter === null && fatigueZone === zone);
                    return (
                      <button key={zone} type="button" role="radio" aria-checked={isActive} onClick={() => onRecipeZoneFilterChange(recipeZoneFilter === zone ? 'All' : zone)} className={`min-h-[44px] px-4 py-1.5 rounded-full text-xs font-bold transition-shadow transition-transform transition-colors flex items-center gap-1.5 ${isActive ? 'bg-white shadow-md text-slate-900 border border-slate-100' : 'text-slate-400 hover:text-slate-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}>
                        {zone}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Category</span>
                <div role="radiogroup" aria-label="Recipe category filter" className="flex gap-2 overflow-x-auto pb-2 pt-1 pr-1 md:flex-wrap md:overflow-visible scroll-fade-right">
                  {categories.map(cat => (
                    <button key={cat} type="button" role="radio" aria-checked={recipeCategoryFilter === cat} onClick={() => onCategoryFilterChange(recipeCategoryFilter === cat ? 'All' : cat)} className={`min-h-11 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-shadow transition-transform transition-colors border ${recipeCategoryFilter === cat ? 'bg-neon-blue text-neon-dark border-neon-blue shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-neon-blue hover:text-neon-blue'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {isFiltering && (
              <button type="button" onClick={() => { onSearchChange(''); onCategoryFilterChange('All'); onRecipeZoneFilterChange('All'); }} className="text-[10px] font-black text-neon-pink hover:underline uppercase tracking-[0.2em] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2">
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

      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((r) => (
            <NutritionCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No recipes found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or filters.</p>
          <button onClick={() => { onSearchChange(''); onCategoryFilterChange('All'); }} className="mt-4 text-neon-blue font-semibold hover:underline">Clear all filters</button>
        </div>
      )}
    </div>
  );
};

// ─── CHAT PAGE (uses internal hooks) ───────────────────────
export const ChatPage: React.FC<{ placeholder?: boolean }> = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: "Hello, I'm your Fit For Cancer assistant. I can provide evidence-based tips for managing side effects like fatigue, nausea, or taste changes. How can I support you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fatigueScore, setFatigueScore] = useState<number | null>(null);
  const [cancerType, setCancerType] = useState<CancerTypeOption | undefined>(undefined);

  const onSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Simulated response for now — hook into useChat later
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'model', content: "Thanks for your message. The AI assistant will respond here." }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 overscroll-contain">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Health Assistant</h1>
      </div>

      {/* Fatigue Score Prompt */}
      {fatigueScore === null && (
        <div className="mb-3 bg-white rounded-xl border border-neon-blue shadow-md overflow-hidden">
          <div className="p-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-blue" />
              Check Your Battery (0-10)
            </h3>
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button key={score} type="button" onClick={() => setFatigueScore(score)} className={`min-h-[44px] rounded-lg font-bold text-xs transition-shadow transition-transform transition-colors border ${fatigueScore === score ? 'ring-2 ring-slate-900/15 scale-[1.03]' : ''} ${score >= 7 ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500' : score >= 4 ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-400 hover:text-amber-950 hover:border-amber-400' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}>
                  {score}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-neon-blue text-neon-dark rounded-tr-none shadow-md' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none border border-slate-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); onSendMessage(); }} className="mt-4 space-y-2">
        <label htmlFor="assistant-message" className="ml-1 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
          {fatigueScore === null ? 'Quick Note' : 'Health Assistant message'}
        </label>
        <div className="flex gap-2">
          <input id="assistant-message" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={fatigueScore === null ? 'Add a Quick Note about today...' : 'Ask about fatigue, nausea, appetite...'} className="flex-1 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-neon-blue shadow-sm transition-shadow transition-transform transition-colors" />
          <button type="submit" disabled={isLoading} className="p-4 bg-neon-blue text-neon-dark rounded-xl shadow-md hover:bg-neon-blue/90 disabled:opacity-50 transition-shadow transition-transform transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
};
