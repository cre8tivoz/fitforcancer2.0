import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  clearAnalyticsLocalState,
  trackAthenaCheckInCompleted,
  trackAthenaMessageSent,
  trackCancerTypeSelected,
  trackNutritionRecipeOpened,
  trackPageView,
  trackRepeatAthenaCheckInIfReached,
} from '../utils/analytics';

const getCountMock = () => window.goatcounter?.count as ReturnType<typeof vi.fn>;
const setReferrer = (value: string) => {
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    value,
  });
};

describe('privacy-first analytics', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.goatcounter = { count: vi.fn() };
    setReferrer('');
  });

  afterEach(() => {
    window.localStorage.clear();
    delete window.goatcounter;
    vi.restoreAllMocks();
  });

  it('tracks only known SPA routes and never accepts query strings as routes', () => {
    trackPageView('/nutrition');
    trackPageView('/data');
    trackPageView('/nutrition?cancer=breast');
    trackPageView('/unknown');

    expect(getCountMock()).toHaveBeenCalledTimes(2);
    expect(getCountMock()).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: '/nutrition', title: 'Nutrition' }),
    );
    expect(getCountMock()).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: '/data', title: 'Data & Roadmap' }),
    );
  });

  it('reduces external referrers to origin only', () => {
    setReferrer('https://external.example/patients/alice@example.com/treatment/123?source=private');

    trackPageView('/assistant');

    expect(getCountMock()).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/assistant',
        referrer: 'https://external.example',
      }),
    );
    expect(JSON.stringify(getCountMock().mock.calls)).not.toContain('alice@example.com');
    expect(JSON.stringify(getCountMock().mock.calls)).not.toContain('/treatment/123');
  });

  it('keeps only the pathname for same-origin referrers', () => {
    setReferrer(`${window.location.origin}/nutrition?cancer=breast#private`);

    trackPageView('/assistant');

    expect(getCountMock()).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/assistant',
        referrer: '/nutrition',
      }),
    );
  });

  it('tracks recipe opens using only a bounded canonical-looking id', () => {
    trackNutritionRecipeOpened('3');
    trackNutritionRecipeOpened('3?fatigue=8');
    trackNutritionRecipeOpened('x'.repeat(65));

    expect(getCountMock()).toHaveBeenCalledTimes(1);
    expect(getCountMock()).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'nutrition-recipe-open-3',
        event: true,
      }),
    );
  });

  it('counts every ATHENA message without accepting message content', () => {
    trackAthenaMessageSent();

    expect(getCountMock()).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'athena-message-sent',
        event: true,
        no_session: true,
      }),
    );
    expect(JSON.stringify(getCountMock().mock.calls)).not.toContain('message content');
  });

  it('tracks check-ins without sending fatigue data', () => {
    trackAthenaCheckInCompleted();

    const payload = getCountMock().mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        path: 'athena-checkin-completed',
        event: true,
      }),
    );
    expect(payload).not.toHaveProperty('fatigueScore');
    expect(payload).not.toHaveProperty('fatigueZone');
  });

  it('maps explicit cancer selections to fixed aggregate event names', () => {
    trackCancerTypeSelected('breast');
    trackCancerTypeSelected('blood_myeloma');

    expect(getCountMock()).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: 'cancer-type-breast', event: true }),
    );
    expect(getCountMock()).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: 'cancer-type-blood-myeloma', event: true }),
    );
  });

  it('does not mark same-day Energy Bank entries as repeat engagement', () => {
    window.localStorage.setItem(
      'energy_history',
      JSON.stringify([
        { id: 1, date: '2026-09-01T08:00:00.000Z', score: 4, note: '' },
        { id: 2, date: '2026-09-01T12:00:00.000Z', score: 6, note: '' },
      ]),
    );

    expect(trackRepeatAthenaCheckInIfReached()).toBe(false);
    expect(getCountMock()).not.toHaveBeenCalled();
  });

  it('emits the repeat-engagement milestone once after check-ins on different local days', () => {
    window.localStorage.setItem(
      'energy_history',
      JSON.stringify([
        { id: 1, date: '2026-09-01T02:00:00.000Z', score: 4, note: '' },
        { id: 2, date: '2026-09-03T02:00:00.000Z', score: 5, note: '' },
      ]),
    );

    expect(trackRepeatAthenaCheckInIfReached()).toBe(true);
    expect(trackRepeatAthenaCheckInIfReached()).toBe(false);
    expect(getCountMock()).toHaveBeenCalledTimes(1);
    expect(getCountMock()).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'athena-repeat-checkin', event: true }),
    );

    clearAnalyticsLocalState();
    expect(window.localStorage.getItem('fit-for-cancer-analytics-repeat-checkin-tracked')).toBeNull();
  });

  it('never lets an analytics provider failure affect the app', () => {
    window.goatcounter = {
      count: vi.fn(() => {
        throw new Error('blocked');
      }),
    };

    expect(() => trackPageView('/assistant')).not.toThrow();
    expect(() => trackAthenaMessageSent()).not.toThrow();
  });

  it('keeps the pinned tracker and both CSP layers aligned', () => {
    const html = readFileSync('index.html', 'utf8');
    const vercel = readFileSync('vercel.json', 'utf8');

    expect(html).toContain('https://gc.zgo.at/count.v5.js');
    expect(html).toContain('sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ');
    expect(html).toContain('"no_onload":true');
    expect(html).toContain('"no_events":true');

    for (const policy of [html, vercel]) {
      expect(policy).toContain("script-src 'self' https://gc.zgo.at");
      expect(policy).toContain("connect-src 'self' https://witchdaddylabs.goatcounter.com");
    }
  });
});
