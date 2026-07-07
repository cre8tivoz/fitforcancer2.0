import React, { useState, useCallback, Suspense } from 'react';
import { AppTab } from './types';
import AppShell from './AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage, ExercisePage, NutritionPage, ChatPage } from './pages';
import { useFatigueState } from './hooks/useFatigueState';

// Lazy-loaded feature pages
const EnergyBank = React.lazy(() => import('./components/EnergyBank'));
const Resources = React.lazy(() => import('./components/Resources'));
const WhyThisIsFree = React.lazy(() => import('./components/WhyThisIsFree'));

const App: React.FC = () => {
  const { state: fatigueState } = useFatigueState();
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [exerciseZoneFilter, setExerciseZoneFilter] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>(null);
  const [recipeZoneFilter, setRecipeZoneFilter] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>(null);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<'High Protein' | 'Anti-Nausea' | 'Easy to Digest' | 'Hydrating' | 'Zero-Prep' | 'Quick Assembly' | 'Balanced Fuel' | 'All'>('All');

  // Standalone route: /why-free
  if (typeof window !== 'undefined' && window.location.pathname === '/why-free') {
    return (
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <WhyThisIsFree />
      </Suspense>
    );
  }

  const onExerciseZoneFilterChange = useCallback((zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => {
    setExerciseZoneFilter((prev) => prev === zone ? null : zone);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.HOME:
        return (
          <HomePage
            fatigueScore={fatigueState.score}
            fatigueZone={fatigueState.zone}
            onNavigate={setActiveTab}
          />
        );
      case AppTab.EXERCISE:
        return (
          <ExercisePage
            fatigueScore={fatigueState.score}
            fatigueZone={fatigueState.zone}
            exerciseZoneFilter={exerciseZoneFilter}
            isMyelomaPatient={fatigueState.cancerType === 'blood_myeloma'}
            onExerciseZoneFilterChange={onExerciseZoneFilterChange}
          />
        );
      case AppTab.NUTRITION:
        return (
          <NutritionPage
            fatigueZone={fatigueState.zone}
            recipeZoneFilter={recipeZoneFilter}
            recipeCategoryFilter={recipeCategoryFilter}
            recipeSearchQuery={recipeSearchQuery}
            onRecipeZoneFilterChange={(zone) => setRecipeZoneFilter((prev) => prev === zone ? null : zone)}
            onCategoryFilterChange={setRecipeCategoryFilter}
            onSearchChange={setRecipeSearchQuery}
          />
        );
      case AppTab.ENERGY_BANK:
        return (
          <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading Energy Bank...</div>}>
            <EnergyBank refreshKey={0} currentFatigueScore={fatigueState.score} />
          </Suspense>
        );
      case AppTab.ASSISTANT:
        return (
          <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading Health Assistant...</div>}>
            <ChatPage />
          </Suspense>
        );
      case AppTab.RESOURCES:
        return (
          <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading resources...</div>}>
            <Resources onClearSavedData={() => {}} />
          </Suspense>
        );
      default:
        return (
          <HomePage
            fatigueScore={fatigueState.score}
            fatigueZone={fatigueState.zone}
            onNavigate={setActiveTab}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </AppShell>
    </ErrorBoundary>
  );
};

export default App;
