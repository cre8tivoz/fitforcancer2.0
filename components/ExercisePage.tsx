import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MOVEMENTS } from '../movements';
import MovementCard from './MovementCard';

interface ExercisePageProps {
  fatigueScore?: number | null;
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  exerciseZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null;
  isMyelomaPatient: boolean;
  onExerciseZoneFilterChange: (zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => void;
}

const ExercisePage: React.FC<ExercisePageProps> = ({
  fatigueZone,
  exerciseZoneFilter,
  isMyelomaPatient,
  onExerciseZoneFilterChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const athenaTargetId = searchParams.get('athena');
  const athenaTarget = athenaTargetId ? MOVEMENTS.find((movement) => movement.id === athenaTargetId) : undefined;
  const currentExerciseZone = exerciseZoneFilter === 'All' ? null : (exerciseZoneFilter || fatigueZone);

  const clearAthenaTarget = () => {
    if (!searchParams.has('athena')) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('athena');
    setSearchParams(nextParams, { replace: true });
  };

  const changeExerciseZoneFilter = (zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All') => {
    clearAthenaTarget();
    onExerciseZoneFilterChange(zone);
  };

  const filteredMovements = MOVEMENTS.filter((movement) => {
    if (movement.id === athenaTarget?.id) return true;
    if (exerciseZoneFilter === 'All' || !currentExerciseZone) return true;
    const zoneKey = currentExerciseZone.split(' ')[1] as 'Green' | 'Yellow' | 'Red';
    return movement.intensity === zoneKey;
  });

  useEffect(() => {
    if (!athenaTarget) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`movement-${athenaTarget.id}`);
      if (!target) return;
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [athenaTarget]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Movement</h1>
        <p className="mt-2 text-slate-600">
          Evidence-informed movement ideas matched to how much energy you have today. The zones are an effort guide, not a medical severity rating.
        </p>
      </div>

      {athenaTarget && (
        <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/5 px-4 py-3 text-sm text-slate-700">
          <span className="font-bold text-slate-900">From ATHENA:</span> {athenaTarget.title} is highlighted below. It stays visible here even if an older manual filter would otherwise hide it.
        </div>
      )}

      {currentExerciseZone && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-slate-800">
            {currentExerciseZone === '🟢 Green' && 'Green shows options for days when you have more capacity for walking, strength and coordination.'}
            {currentExerciseZone === '🟡 Yellow' && 'Yellow keeps the options shorter, supported or easier to scale back.'}
            {currentExerciseZone === '🔴 Red' && 'Red starts with small seated or lying-down movements. Doing less — or resting — is completely valid.'}
          </p>
        </div>
      )}

      {isMyelomaPatient && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
          <span className="text-xl">🦴</span>
          <div className="space-y-1">
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Myeloma & bone health</p>
            <p className="text-xs text-indigo-800 leading-relaxed">
              If myeloma has affected your bones, movement is not automatically off-limits, but loading and range should take the location and stability of affected bones into account. New or localised bone/back pain is a reason to stop that movement and check in with your treating team. An exercise physiologist or physiotherapist can tailor this properly.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span id="exercise-zone-filter-label" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Energy filter:</span>
        <div role="radiogroup" aria-labelledby="exercise-zone-filter-label" className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
          <button
            type="button"
            role="radio"
            aria-checked={exerciseZoneFilter === 'All'}
            onClick={() => changeExerciseZoneFilter('All')}
            className={`min-h-[44px] px-3 py-1 rounded-full text-xs font-bold transition-colors ${exerciseZoneFilter === 'All' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}
          >
            All
          </button>
          {(['🟢 Green', '🟡 Yellow', '🔴 Red'] as const).map((zone) => {
            const isActive = exerciseZoneFilter === zone || (exerciseZoneFilter === null && fatigueZone === zone);
            return (
              <button
                key={zone}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => changeExerciseZoneFilter(exerciseZoneFilter === zone ? 'All' : zone)}
                className={`min-h-[44px] px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${isActive ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2`}
              >
                {zone}
              </button>
            );
          })}
        </div>
      </div>

      {exerciseZoneFilter === '🟢 Green' && fatigueZone === '🔴 Red' && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-xs text-rose-700 font-medium">
            You asked to see the higher-energy options while your current check-in is Red. Treat these as ideas to browse, not a target you need to hit today.
          </p>
        </div>
      )}

      {currentExerciseZone === '🔴 Red' && (
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 space-y-4">
          <h3 className="font-bold text-amber-900">Low-battery day: keep it small</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-amber-800 text-sm">Pace</p>
              <p className="text-xs text-amber-700 leading-relaxed">Break things into smaller pieces and stop before you are completely spent.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-amber-800 text-sm">Prioritise</p>
              <p className="text-xs text-amber-700 leading-relaxed">Use your limited energy on what matters today. Non-essential things can wait.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-amber-800 text-sm">Position</p>
              <p className="text-xs text-amber-700 leading-relaxed">Sitting or lying down can make a movement require less effort and remove some balance demand.</p>
            </div>
          </div>
        </div>
      )}

      {filteredMovements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMovements.map((movement) => {
            const isAthenaTarget = movement.id === athenaTarget?.id;
            return (
              <div
                key={movement.id}
                id={`movement-${movement.id}`}
                tabIndex={isAthenaTarget ? -1 : undefined}
                aria-label={isAthenaTarget ? `ATHENA recommendation: ${movement.title}` : undefined}
                className={`scroll-mt-24 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-4 ${isAthenaTarget ? 'ring-2 ring-neon-blue ring-offset-4 ring-offset-[color:var(--color-bg)]' : ''}`}
              >
                {isAthenaTarget && (
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-neon-blue">ATHENA recommendation</div>
                )}
                <MovementCard movement={movement} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <h3 className="text-lg font-bold text-slate-800">No movements found for this zone</h3>
          <button onClick={() => changeExerciseZoneFilter('All')} className="mt-2 text-neon-blue font-semibold hover:underline">View all movements</button>
        </div>
      )}

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mt-8">
        <h3 className="font-bold text-blue-800 mb-2">Evidence note</h3>
        <p className="text-blue-700 text-sm">
          Current Australian guidance encourages people with cancer to be as active as their abilities and circumstances allow. There is no single exercise dose that is right for everyone, so these cards are starting points rather than a prescription.
        </p>
      </div>
    </div>
  );
};

export default ExercisePage;
