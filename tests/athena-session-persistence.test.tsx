import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
import {
  DAILY_CHECKIN_STORAGE_KEY,
  FATIGUE_STORAGE_KEY,
  FATIGUE_ZONE_STORAGE_KEY,
} from '../hooks/useFatigueState';

const nav = () => document.querySelector('nav') as HTMLElement;

describe('ATHENA in-memory session continuity', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('presents the 0–10 check-in as fatigue severity', () => {
    render(
      <MemoryRouter initialEntries={['/assistant']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText(/How's your fatigue today/i)).toBeInTheDocument();
    expect(screen.getByText(/0 means no fatigue and 10 means the worst fatigue/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set fatigue score to 0/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set fatigue score to 10/i })).toBeInTheDocument();
  });

  it('keeps the conversation and draft when navigating away and back', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'We can keep this very gentle today.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/assistant']}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /set fatigue score to 8/i }));
    const messageInput = screen.getByRole('textbox', { name: /message ATHENA/i });
    await user.type(messageInput, 'My body feels achy today');
    await user.click(screen.getByRole('button', { name: /send message to ATHENA/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/keep this very gentle today/i)).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /message ATHENA/i }), 'Maybe something seated');

    await user.click(within(nav()).getByText('Exercise'));
    expect(screen.getByRole('heading', { name: 'Movement' })).toBeInTheDocument();

    await user.click(within(nav()).getByText('ATHENA'));

    expect(screen.getByText('My body feels achy today')).toBeInTheDocument();
    expect(screen.getByText(/keep this very gentle today/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /message ATHENA/i })).toHaveValue('Maybe something seated');
  });

  it('does not remove saved fatigue keys while hydrating a newly opened tab', async () => {
    window.localStorage.setItem(FATIGUE_STORAGE_KEY, '8');
    window.localStorage.setItem(FATIGUE_ZONE_STORAGE_KEY, '🔴 Red');
    window.localStorage.setItem(DAILY_CHECKIN_STORAGE_KEY, 'true');

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    render(
      <MemoryRouter initialEntries={['/assistant']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(window.sessionStorage.getItem(FATIGUE_STORAGE_KEY)).toBe('8');
      expect(window.sessionStorage.getItem(FATIGUE_ZONE_STORAGE_KEY)).toBe('🔴 Red');
    });

    const fatigueKeys = new Set([
      FATIGUE_STORAGE_KEY,
      FATIGUE_ZONE_STORAGE_KEY,
      DAILY_CHECKIN_STORAGE_KEY,
    ]);
    const removedFatigueKeys = removeItemSpy.mock.calls
      .map(([key]) => key)
      .filter((key) => fatigueKeys.has(String(key)));

    expect(removedFatigueKeys).toEqual([]);
    expect(window.localStorage.getItem(FATIGUE_STORAGE_KEY)).toBe('8');
    expect(window.localStorage.getItem(FATIGUE_ZONE_STORAGE_KEY)).toBe('🔴 Red');
    expect(window.localStorage.getItem(DAILY_CHECKIN_STORAGE_KEY)).toBe('true');
  });

  it('does not restore a cleared conversation when an old reply finishes late', async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: unknown) => void;
    const responseJson = vi.fn().mockResolvedValue({ text: 'This reply belongs to the cleared chat.' });
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/assistant']}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /set fatigue score to 8/i }));
    await user.type(screen.getByRole('textbox', { name: /message ATHENA/i }), 'This conversation should be cleared');
    await user.click(screen.getByRole('button', { name: /send message to ATHENA/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await user.click(within(nav()).getByText('Resources'));
    await user.click(await screen.findByRole('button', { name: /Privacy & Sensitive Data Handling/i }));
    await user.click(screen.getByRole('button', { name: /Clear Saved Browser Data/i }));
    expect(screen.getByText(/Saved browser data cleared/i)).toBeInTheDocument();

    resolveFetch({ ok: true, status: 200, json: responseJson });
    await waitFor(() => expect(responseJson).toHaveBeenCalledTimes(1));

    await user.click(within(nav()).getByText('ATHENA'));

    expect(screen.queryByText('This conversation should be cleared')).not.toBeInTheDocument();
    expect(screen.queryByText(/This reply belongs to the cleared chat/i)).not.toBeInTheDocument();
    expect(screen.getByText(/How's your fatigue today/i)).toBeInTheDocument();
  });

  it('clears ATHENA and invalidates a pending reply when another tab clears fatigue data', async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: unknown) => void;
    const responseJson = vi.fn().mockResolvedValue({ text: 'This reply belongs to the other-tab-cleared chat.' });
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/assistant']}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /set fatigue score to 8/i }));
    await user.type(screen.getByRole('textbox', { name: /message ATHENA/i }), 'This chat is open in another tab too');
    await user.click(screen.getByRole('button', { name: /send message to ATHENA/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await user.click(within(nav()).getByText('Exercise'));
    expect(screen.getByRole('heading', { name: 'Movement' })).toBeInTheDocument();

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: FATIGUE_STORAGE_KEY,
        oldValue: '8',
        newValue: null,
      }),
    );

    resolveFetch({ ok: true, status: 200, json: responseJson });
    await waitFor(() => expect(responseJson).toHaveBeenCalledTimes(1));

    await user.click(within(nav()).getByText('ATHENA'));

    expect(screen.queryByText('This chat is open in another tab too')).not.toBeInTheDocument();
    expect(screen.queryByText(/other-tab-cleared chat/i)).not.toBeInTheDocument();
    expect(screen.getByText(/How's your fatigue today/i)).toBeInTheDocument();
  });
});
