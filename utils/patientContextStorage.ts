import { EnergyHistoryEntry, PersistedPatientContext, StoredPatientContextRecord } from '../types';

const PATIENT_CONTEXT_STORAGE_KEY = 'fit-for-cancer-patient-context';
const ENERGY_HISTORY_STORAGE_KEY = 'energy_history';
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ENERGY_HISTORY_ENTRIES = 30;

const canUseLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const savePatientContext = (context: PersistedPatientContext): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  const record: StoredPatientContextRecord = {
    timestamp: Date.now(),
    context,
  };

  window.localStorage.setItem(PATIENT_CONTEXT_STORAGE_KEY, JSON.stringify(record));
};

export const loadPatientContext = (): PersistedPatientContext | null => {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawRecord = window.localStorage.getItem(PATIENT_CONTEXT_STORAGE_KEY);
  if (!rawRecord) {
    return null;
  }

  try {
    const parsedRecord = JSON.parse(rawRecord) as StoredPatientContextRecord;
    if (
      !parsedRecord ||
      typeof parsedRecord.timestamp !== 'number' ||
      !parsedRecord.context ||
      typeof parsedRecord.context !== 'object'
    ) {
      clearPatientContext();
      return null;
    }

    if (Date.now() - parsedRecord.timestamp > FOURTEEN_DAYS_MS) {
      clearPatientContext();
      return null;
    }

    return parsedRecord.context;
  } catch {
    clearPatientContext();
    return null;
  }
};

export const clearPatientContext = (): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(PATIENT_CONTEXT_STORAGE_KEY);
};

export const getEnergyHistory = (): EnergyHistoryEntry[] => {
  if (!canUseLocalStorage()) {
    return [];
  }

  const rawHistory = window.localStorage.getItem(ENERGY_HISTORY_STORAGE_KEY);
  if (!rawHistory) {
    return [];
  }

  try {
    const parsedHistory = JSON.parse(rawHistory) as EnergyHistoryEntry[];
    if (!Array.isArray(parsedHistory)) {
      window.localStorage.removeItem(ENERGY_HISTORY_STORAGE_KEY);
      return [];
    }

    return parsedHistory.filter((entry) => {
      return (
        typeof entry?.id === 'number' &&
        typeof entry?.date === 'string' &&
        typeof entry?.score === 'number' &&
        typeof entry?.note === 'string'
      );
    });
  } catch {
    window.localStorage.removeItem(ENERGY_HISTORY_STORAGE_KEY);
    return [];
  }
};

export const clearEnergyHistory = (): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(ENERGY_HISTORY_STORAGE_KEY);
};

export const saveDailyCheckIn = (score: number, note: string): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  const nextEntry: EnergyHistoryEntry = {
    id: Date.now(),
    date: new Date().toISOString(),
    score,
    note,
  };

  const nextHistory = [...getEnergyHistory(), nextEntry].slice(-MAX_ENERGY_HISTORY_ENTRIES);
  window.localStorage.setItem(ENERGY_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
};
