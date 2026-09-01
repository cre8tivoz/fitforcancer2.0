import { CancerTypeOption } from '../types';
import { getEnergyHistory } from './patientContextStorage';

interface GoatCounterCountOptions {
  path: string;
  title?: string;
  referrer?: string;
  event?: boolean;
  no_session?: boolean;
}

declare global {
  interface Window {
    goatcounter?: {
      count?: (options?: GoatCounterCountOptions) => void;
    };
  }
}

const TRACKED_ROUTE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/exercise': 'Movement',
  '/nutrition': 'Nutrition',
  '/energy-bank': 'Energy Bank',
  '/assistant': 'ATHENA',
  '/resources': 'Evidence & Resources',
  '/about': 'About',
  '/support': 'Support Fit For Cancer',
};

const CANCER_TYPE_EVENTS: Record<CancerTypeOption, { path: string; title: string }> = {
  bowel: { path: 'cancer-type-bowel', title: 'Cancer type selected: Bowel' },
  melanoma: { path: 'cancer-type-melanoma', title: 'Cancer type selected: Melanoma' },
  breast: { path: 'cancer-type-breast', title: 'Cancer type selected: Breast' },
  prostate: { path: 'cancer-type-prostate', title: 'Cancer type selected: Prostate' },
  lung: { path: 'cancer-type-lung', title: 'Cancer type selected: Lung' },
  blood_myeloma: { path: 'cancer-type-blood-myeloma', title: 'Cancer type selected: Blood/Myeloma' },
  other: { path: 'cancer-type-other', title: 'Cancer type selected: Other/Prefer not to say' },
};

const SAFE_CONTENT_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const REPEAT_CHECKIN_TRACKED_KEY = 'fit-for-cancer-analytics-repeat-checkin-tracked';

const sanitiseReferrer = (): string | undefined => {
  if (typeof document === 'undefined' || !document.referrer) return undefined;

  try {
    const referrer = new URL(document.referrer);
    return `${referrer.origin}${referrer.pathname}`;
  } catch {
    return undefined;
  }
};

const count = (options: GoatCounterCountOptions): void => {
  if (typeof window === 'undefined') return;

  try {
    window.goatcounter?.count?.({
      ...options,
      referrer: sanitiseReferrer(),
    });
  } catch {
    // Analytics must never interfere with the app when blocked or unavailable.
  }
};

const localDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const trackPageView = (pathname: string): void => {
  const title = TRACKED_ROUTE_TITLES[pathname];
  if (!title) return;

  count({ path: pathname, title });
};

export const trackNutritionRecipeOpened = (recipeId: string): void => {
  if (!SAFE_CONTENT_ID.test(recipeId)) return;

  count({
    path: `nutrition-recipe-open-${recipeId}`,
    title: `Nutrition recipe opened: ${recipeId}`,
    event: true,
  });
};

export const trackAthenaMessageSent = (): void => {
  count({
    path: 'athena-message-sent',
    title: 'ATHENA message sent',
    event: true,
    no_session: true,
  });
};

export const trackAthenaCheckInCompleted = (): void => {
  count({
    path: 'athena-checkin-completed',
    title: 'ATHENA fatigue check-in recorded',
    event: true,
  });
};

export const trackCancerTypeSelected = (cancerType: CancerTypeOption): void => {
  const event = CANCER_TYPE_EVENTS[cancerType];
  count({ ...event, event: true });
};

export const trackRepeatAthenaCheckInIfReached = (): boolean => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return false;
  if (window.localStorage.getItem(REPEAT_CHECKIN_TRACKED_KEY) === 'true') return false;

  const uniqueDays = new Set(
    getEnergyHistory()
      .map((entry) => new Date(entry.date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map(localDay),
  );

  if (uniqueDays.size < 2) return false;

  window.localStorage.setItem(REPEAT_CHECKIN_TRACKED_KEY, 'true');
  count({
    path: 'athena-repeat-checkin',
    title: 'ATHENA repeat check-in reached',
    event: true,
  });
  return true;
};

export const clearAnalyticsLocalState = (): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  window.localStorage.removeItem(REPEAT_CHECKIN_TRACKED_KEY);
};
