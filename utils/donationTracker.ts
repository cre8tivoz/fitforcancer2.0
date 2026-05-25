const STORAGE_KEY = 'fit-for-cancer-fund-status';
const GOAL = 50;

interface FundStatus {
  raised: number;
  goal: number;
  month: string;
}

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getStoredStatus = (): FundStatus | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FundStatus;
  } catch {
    return null;
  }
};

const writeStatus = (status: FundStatus): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
};

export const getFundStatus = (): { raised: number; goal: number; month: string } => {
  const currentMonth = getCurrentMonth();
  const stored = getStoredStatus();

  // Auto-reset on month change
  if (!stored || stored.month !== currentMonth) {
    const fresh: FundStatus = { raised: 0, goal: GOAL, month: currentMonth };
    writeStatus(fresh);
    return fresh;
  }

  return stored;
};

export const recordDonation = (amount: number): void => {
  const currentMonth = getCurrentMonth();
  const stored = getStoredStatus();

  if (!stored || stored.month !== currentMonth) {
    writeStatus({ raised: amount, goal: GOAL, month: currentMonth });
  } else {
    writeStatus({ ...stored, raised: stored.raised + amount });
  }
};

export const resetFundStatus = (): void => {
  const currentMonth = getCurrentMonth();
  writeStatus({ raised: 0, goal: GOAL, month: currentMonth });
};
