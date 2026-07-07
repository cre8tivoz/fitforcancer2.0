import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { AppTab } from './types';
import BrandLockup from './components/BrandLockup';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage, ExercisePage, NutritionPage, ChatPage } from './pages';
import { useFatigueState } from './hooks/useFatigueState';

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
  { to: '/assistant', label: 'AI Chat' },
  { to: '/resources', label: 'Resources' },
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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePageContainer />} />
          <Route path="/exercise" element={<ExercisePageContainer />} />
          <Route path="/nutrition" element={<NutritionPageContainer />} />
          <Route path="/energy-bank" element={<React.Suspense fallback={<div>Loading...</div>}><EnergyBank /></React.Suspense>} />
          <Route path="/assistant" element={<ChatPage />} />
          <Route path="/resources" element={<React.Suspense fallback={<div>Loading...</div>}><Resources onClearSavedData={() => {}} /></React.Suspense>} />
          <Route path="/why-free" element={<React.Suspense fallback={<div>Loading...</div>}><WhyThisIsFree /></React.Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

const HomePageContainer: React.FC = () => {
  const navigate = useNavigate();
  const { state: fatigueState } = useFatigueState();
  return (
    <HomePage
      fatigueScore={fatigueState.score}
      fatigueZone={fatigueState.zone}
      onNavigate={(tab) => navigate(TAB_PATHS[tab])}
    />
  );
};

const ExercisePageContainer: React.FC = () => {
  const { state: fatigueState } = useFatigueState();
  return (
    <ExercisePage
      fatigueScore={fatigueState.score}
      fatigueZone={fatigueState.zone}
      exerciseZoneFilter={null}
      isMyelomaPatient={fatigueState.cancerType === 'blood_myeloma'}
      onExerciseZoneFilterChange={() => {}}
    />
  );
};

const NutritionPageContainer: React.FC = () => {
  const { state: fatigueState } = useFatigueState();
  return (
    <NutritionPage
      fatigueZone={fatigueState.zone}
      recipeZoneFilter={null}
      recipeCategoryFilter="All"
      recipeSearchQuery=""
      onRecipeZoneFilterChange={() => {}}
      onCategoryFilterChange={() => {}}
      onSearchChange={() => {}}
    />
  );
};

export default App;
