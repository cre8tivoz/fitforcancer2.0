import { useState, useEffect } from 'react';
import { CancerTypeOption } from '../types';
import { loadPatientContext, savePatientContext, clearPatientContext } from '../utils/patientContextStorage';
import { getFatigueZone } from '../utils/fatigueScore';

export interface FatigueState {
  score: number | null;
  zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  cancerType: CancerTypeOption | undefined;
  exerciseZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null;
  recipeZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null;
  hasLoggedDailyCheckIn: boolean;
}

export const FATIGUE_STORAGE_KEY = 'fit-for-cancer-fatigue-score';
export const FATIGUE_ZONE_STORAGE_KEY = 'fit-for-cancer-fatigue-zone';
export const DAILY_CHECKIN_STORAGE_KEY = 'fit-for-cancer-daily-checkin-logged';

export function useFatigueState() {
  const [state, setState] = useState<FatigueState>({
    score: null,
    zone: null,
    cancerType: undefined,
    exerciseZoneFilter: null,
    recipeZoneFilter: null,
    hasLoggedDailyCheckIn: false,
  });

  // Hydrate from storage
  useEffect(() => {
    const storedScore =
      window.sessionStorage.getItem(FATIGUE_STORAGE_KEY) ||
      window.localStorage.getItem(FATIGUE_STORAGE_KEY);
    const storedZone =
      window.sessionStorage.getItem(FATIGUE_ZONE_STORAGE_KEY) ||
      window.localStorage.getItem(FATIGUE_ZONE_STORAGE_KEY);
    const hasLoggedCheckIn =
      window.sessionStorage.getItem(DAILY_CHECKIN_STORAGE_KEY) === 'true' ||
      window.localStorage.getItem(DAILY_CHECKIN_STORAGE_KEY) === 'true';
    const storedContext = loadPatientContext();

    setState((prev) => ({
      ...prev,
      score: storedScore != null && !Number.isNaN(Number(storedScore)) ? Number(storedScore) : null,
      zone: storedZone === '🟢 Green' || storedZone === '🟡 Yellow' || storedZone === '🔴 Red' ? storedZone : null,
      cancerType: storedContext?.cancerType,
      hasLoggedDailyCheckIn: hasLoggedCheckIn,
    }));
  }, []);

  // If saved fatigue data is cleared in another tab, discard this tab's
  // session copies as well so a later refresh cannot restore stale values.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      const isClearedFatigueKey =
        event.newValue === null &&
        (event.key === FATIGUE_STORAGE_KEY ||
          event.key === FATIGUE_ZONE_STORAGE_KEY ||
          event.key === DAILY_CHECKIN_STORAGE_KEY);

      if (!isClearedFatigueKey) return;

      window.sessionStorage.removeItem(FATIGUE_STORAGE_KEY);
      window.sessionStorage.removeItem(FATIGUE_ZONE_STORAGE_KEY);
      window.sessionStorage.removeItem(DAILY_CHECKIN_STORAGE_KEY);

      setState({
        score: null,
        zone: null,
        cancerType: undefined,
        exerciseZoneFilter: null,
        recipeZoneFilter: null,
        hasLoggedDailyCheckIn: false,
      });
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Persist fatigue score
  useEffect(() => {
    if (state.score === null) {
      window.sessionStorage.removeItem(FATIGUE_STORAGE_KEY);
      window.localStorage.removeItem(FATIGUE_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(FATIGUE_STORAGE_KEY, String(state.score));
      window.localStorage.setItem(FATIGUE_STORAGE_KEY, String(state.score));
    }
  }, [state.score]);

  // Persist fatigue zone
  useEffect(() => {
    if (!state.zone) {
      window.sessionStorage.removeItem(FATIGUE_ZONE_STORAGE_KEY);
      window.localStorage.removeItem(FATIGUE_ZONE_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(FATIGUE_ZONE_STORAGE_KEY, state.zone);
      window.localStorage.setItem(FATIGUE_ZONE_STORAGE_KEY, state.zone);
    }
  }, [state.zone]);

  // Persist cancer type
  useEffect(() => {
    if (!state.cancerType) clearPatientContext();
    else savePatientContext({ cancerType: state.cancerType });
  }, [state.cancerType]);

  return { state, setState };
}

export function setFatigueScore(score: number, state: FatigueState, setState: React.Dispatch<React.SetStateAction<FatigueState>>) {
  const zone = getFatigueZone(score);
  setState({
    ...state,
    score,
    zone,
    exerciseZoneFilter: null,
    recipeZoneFilter: null,
  });
}

export function toggleExerciseZone(zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All', state: FatigueState, setState: React.Dispatch<React.SetStateAction<FatigueState>>) {
  setState({ ...state, exerciseZoneFilter: state.exerciseZoneFilter === zone ? null : zone });
}

export function toggleRecipeZone(zone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All', state: FatigueState, setState: React.Dispatch<React.SetStateAction<FatigueState>>) {
  setState({ ...state, recipeZoneFilter: state.recipeZoneFilter === zone ? null : zone });
}
