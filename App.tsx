import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { AppTab, Recipe } from './types';
import BrandLockup from './components/BrandLockup';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage, NutritionPage } from './pages';
import ExercisePage from './components/ExercisePage';
import AthenaChatPage from './components/AthenaChatPage';
import {
  DAILY_CHECKIN_STORAGE_KEY,
  FATIGUE_STORAGE_KEY,
  FATIGUE_ZONE_STORAGE_KEY,
  FatigueState,
  useFatigueState,
} from './hooks/useFatigueState';
import { clearEnergyHistory, clearPatientContext } from './utils/patientContextStorage';
import { BookOpen, ChartColumnIncreasing, Dumbbell, House, Menu, MessageSquare, UtensilsCrossed, X } from 'lucide-react';

const EnergyBank = React.lazy(() => import('./components/EnergyBank'));
const Resources = React.lazy(() => import('./components/Resources'));
const WhyThisIsFree = React.lazy(() => import('./components/WhyThisIsFree'));

const TAB_PATHS: Record<AppTab, string> = {
  [AppTab.HOME]: '/',
  [AppTab.EXERCISE]: '/exercise',
  [AppTab.NUTRITION]: '/nutrition',
  [AppTab.ENERGY_BANK]: '/energy-bank',
  [AppTab.ASSISTANT]: '/assistant',
  [AppTab.RESOURCES]: '/resources',
};

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/exercise', label: 'Exercise' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/energy-bank', label: 'Energy Bank' },
  { to: '/assistant', label: 'ATHENA' },
  { to: '/resources', label: 'Resources' },
];

const mobileNavItems = [
  { to: '/', label: 'Home', description: 'Today at a glance', icon: House },
  { to: '/exercise', label: 'Movement', description: 'Energy-aware movement', icon: Dumbbell },
  { to: '/nutrition', label: 'Nutrition', description: 'Low-effort food ideas', icon: UtensilsCrossed },
  { to: '/energy-bank', label: 'Energy Bank', description: 'See your recent check-ins', icon: ChartColumnIncreasing },
  { to: '/assistant', label: 'ATHENA', description: 'Your treatment-day companion', icon: MessageSquare },
  { to: '/resources', label: 'Resources', description: 'Evidence, support and privacy', icon: BookOpen },
];

const CONTROL_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]';

const Layout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 sm:px-6 pb-6">
      <nav className="sticky top-0 z-50 bg-[color:var(--color-nav)] backdrop-blur-md border-b border-white/10 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 ${CONTROL_FOCUS_CLASS}`}
            aria-label="Fit For Cancer home"
          >
            <BrandLockup compact variant="dark" className="h-10 w-auto max-w-[190px]" />
          </Link>

          <div className="hidden sm:flex bg-white/5 p-1 rounded-full border border-white/10">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`inline-flex min-h-11 items-center px-4 py-2 rounded-full text-sm font-semibold transition-all ${location.pathname === to ? 'bg-neon-blue text-neon-dark shadow-lg shadow-neon-blue/20' : 'text-white/75 hover:text-white hover:bg-white/10'} ${CONTROL_FOCUS_CLASS}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="sm:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-nav)]"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div id="mobile-navigation-menu" className="sm:hidden border-t border-white/10 px-3 pb-3 pt-2">
            <div className="grid grid-cols-1 gap-1 rounded-2xl bg-white/5 p-2">
              {mobileNavItems.map(({ to, label, description, icon: Icon }) => {
                const isCurrent = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue ${isCurrent ? 'bg-neon-blue text-neon-dark' : 'text-white hover:bg-white/10'}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isCurrent ? 'bg-neon-dark/10' : 'bg-white/10'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-sm font-bold">{label}</span>
                      <span className={`block text-xs ${isCurrent ? 'text-neon-dark/70' : 'text-white/55'}`}>{description}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 py-4">
        <Outlet />
      </main>

      <footer className="mt-12 mb-8 p-8 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          <BrandLockup variant="light" className="w-64 max-w-full h-auto" />
          <Link to="/resources" className={CONTROL_FOCUS_CLASS}>View Evidence Base & Resources</Link>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const { state: fatigueState, setState: setFatigueState } = useFatigueState();
  const [exerciseZoneFilter, setExerciseZoneFilter] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>(null);
  const [recipeZoneFilter, setRecipeZoneFilter] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>(null);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<Recipe['category'] | 'All'>('All');
  const [energyHistoryRefreshKey, setEnergyHistoryRefreshKey] = useState(0);

  const onExerciseZoneFilterChange = useCallback((zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => {
    setExerciseZoneFilter((prev) => prev === zone ? null : zone);
  }, []);

  const clearSavedData = useCallback(() => {
    clearPatientContext();
    clearEnergyHistory();

    [FATIGUE_STORAGE_KEY, FATIGUE_ZONE_STORAGE_KEY, DAILY_CHECKIN_STORAGE_KEY].forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });

    setFatigueState({
      score: null,
      zone: null,
      cancerType: undefined,
      exerciseZoneFilter: null,
      recipeZoneFilter: null,
      hasLoggedDailyCheckIn: false,
    });
    setExerciseZoneFilter(null);
    setRecipeZoneFilter(null);
    setEnergyHistoryRefreshKey((current) => current + 1);
  }, [setFatigueState]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePageContainer fatigueState={fatigueState} />} />
          <Route
            path="/exercise"
            element={
              <ExercisePageContainer
                fatigueState={fatigueState}
                exerciseZoneFilter={exerciseZoneFilter}
                onExerciseZoneFilterChange={onExerciseZoneFilterChange}
              />
            }
          />
          <Route
            path="/nutrition"
            element={
              <NutritionPageContainer
                fatigueState={fatigueState}
                recipeZoneFilter={recipeZoneFilter}
                recipeCategoryFilter={recipeCategoryFilter}
                recipeSearchQuery={recipeSearchQuery}
                onRecipeZoneFilterChange={(zone) => setRecipeZoneFilter((prev) => prev === zone ? null : zone)}
                onCategoryFilterChange={setRecipeCategoryFilter}
                onSearchChange={setRecipeSearchQuery}
              />
            }
          />
          <Route path="/energy-bank" element={<React.Suspense fallback={<div>Loading...</div>}><EnergyBank refreshKey={energyHistoryRefreshKey} currentFatigueScore={fatigueState.score} /></React.Suspense>} />
          <Route
            path="/assistant"
            element={
              <AthenaChatPage
                fatigueState={fatigueState}
                setFatigueState={setFatigueState}
                onEnergyHistoryChange={() => setEnergyHistoryRefreshKey((current) => current + 1)}
              />
            }
          />
          <Route path="/resources" element={<React.Suspense fallback={<div>Loading...</div>}><Resources onClearSavedData={clearSavedData} /></React.Suspense>} />
          <Route path="/why-free" element={<React.Suspense fallback={<div>Loading...</div>}><WhyThisIsFree /></React.Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

const HomePageContainer: React.FC<{ fatigueState: FatigueState }> = ({ fatigueState }) => {
  const navigate = useNavigate();
  return (
    <HomePage
      fatigueScore={fatigueState.score}
      fatigueZone={fatigueState.zone}
      onNavigate={(tab) => navigate(TAB_PATHS[tab])}
    />
  );
};

interface ExercisePageContainerProps {
  fatigueState: FatigueState;
  exerciseZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null;
  onExerciseZoneFilterChange: (zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => void;
}

const ExercisePageContainer: React.FC<ExercisePageContainerProps> = ({ fatigueState, exerciseZoneFilter, onExerciseZoneFilterChange }) => {
  return (
    <ExercisePage
      fatigueScore={fatigueState.score}
      fatigueZone={fatigueState.zone}
      exerciseZoneFilter={exerciseZoneFilter}
      isMyelomaPatient={fatigueState.cancerType === 'blood_myeloma'}
      onExerciseZoneFilterChange={onExerciseZoneFilterChange}
    />
  );
};

interface NutritionPageContainerProps {
  fatigueState: FatigueState;
  recipeZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null;
  recipeCategoryFilter: Recipe['category'] | 'All';
  recipeSearchQuery: string;
  onRecipeZoneFilterChange: (zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => void;
  onCategoryFilterChange: (cat: Recipe['category'] | 'All') => void;
  onSearchChange: (q: string) => void;
}

const NutritionPageContainer: React.FC<NutritionPageContainerProps> = ({
  fatigueState,
  recipeZoneFilter,
  recipeCategoryFilter,
  recipeSearchQuery,
  onRecipeZoneFilterChange,
  onCategoryFilterChange,
  onSearchChange,
}) => {
  return (
    <NutritionPage
      fatigueZone={fatigueState.zone}
      recipeZoneFilter={recipeZoneFilter}
      recipeCategoryFilter={recipeCategoryFilter}
      recipeSearchQuery={recipeSearchQuery}
      onRecipeZoneFilterChange={onRecipeZoneFilterChange}
      onCategoryFilterChange={onCategoryFilterChange}
      onSearchChange={onSearchChange}
    />
  );
};

export default App;
