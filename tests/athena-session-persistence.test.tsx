import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';

const nav = () => document.querySelector('nav') as HTMLElement;

describe('ATHENA in-memory session continuity', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
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

    await user.click(screen.getByRole('button', { name: /set energy score to 8/i }));
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
});
