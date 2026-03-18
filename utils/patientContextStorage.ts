import { PersistedPatientContext, StoredPatientContextRecord } from '../types';

const PATIENT_CONTEXT_STORAGE_KEY = 'fit-for-cancer-patient-context';
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

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
