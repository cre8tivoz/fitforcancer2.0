import React, { useCallback, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { AppTab, Recipe } from './types';
import BrandLockup from './components/BrandLockup';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage, ExercisePage, NutritionPage, ChatPage } from './pages';
import {
  DAILY_CHECKIN_STORAGE_KEY,
  FATIGUE_STORAGE_KEY,
  FATIGUE_ZONE_STORAGE_KEY,
  FatigueState,
  useFatigueState,
} from './hooks/useFatigueState';
import { clearEnergyHistory, clearPatientContext } from './utils/patientContextStorage';
import { BookOpen, ChartColumnIncreasing, Dumbbell, House, MessageSquare, UtensilsCrossed } from 'lucide-react';

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
  { to: '/', label: 'Home', icon: House },
  { to: '/exercise', label: 'Move', icon: Dumbbell },
  { to: '/nutrition', label: 'Eat', icon: UtensilsCrossed },
  { to: '/energy-bank', label: 'Trends', icon: ChartColumnIncreasing },
  { to: '/assistant', label: 'ATHENA', icon: MessageSquare },
  { to: '/resources', label: 'Resources', icon: BookOpen },
];

const CONTROL_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]';

const Layout: React.FC = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 sm:px-6 pb-20 sm:pb-6">
      <nav className="sticky top-0 z-50 py-4 bg-[color:var(--color-nav)] backdrop-blur-md flex justify-between items-center px-4 sm:px-8 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <BrandLockup compact variant="dark" className="h-10 w-auto" />
        </Link>
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 hidden sm:flex">
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
      </nav>

      <main className="flex-1 py-4">
        <Outlet />
      </main>

      <footer className="mt-12 mb-24 sm:mb-8 p-8 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          <BrandLockup variant="light" className="w-64 max-w-full h-auto" />
          <Link to="/resources" className={CONTROL_FOCUS_CLASS}>View Evidence Base & Resources</Link>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 bg-[color:var(--color-surface)]/95 backdrop-blur-md border-t border-[color:var(--color-primary)]/10 px-4 py-3 flex justify-between sm:hidden z-50 shadow-[0_-10px_30px_-18px_rgba(26,40,33,0.35)]">
        {mobileNavItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-current={location.pathname === to ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 transition-shadow transition-transform transition-colors ${location.pathname === to ? 'text-neon-blue' : 'text-white/50 grayscale'} ${CONTROL_FOCUS_CLASS}`}
          >
            <span className="text-xl"><Icon className="w-4 h-4" /></span>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-white">{label}</span>
          </Link>
        ))}
      </div>
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
              <ChatPage
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
