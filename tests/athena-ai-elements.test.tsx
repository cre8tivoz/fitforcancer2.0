import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '../components/ai-elements/conversation';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const renderAthena = () =>
  render(
    <MemoryRouter initialEntries={['/assistant']}>
      <App />
    </MemoryRouter>,
  );

describe('ATHENA AI Elements chat surface', () => {
  it('renders an accessible conversation region and keeps catalogue recommendations inside the reply', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        text: 'A Green-day option already in Fit for Cancer is below.',
        recommendations: [{ kind: 'movement', id: '1' }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAthena();

    await user.click(screen.getByRole('button', { name: /set fatigue score to 1/i }));

    expect(screen.getByRole('log', { name: /ATHENA conversation/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /message ATHENA/i }).tagName).toBe('TEXTAREA');

    await user.click(screen.getByRole('button', { name: 'Movement' }));

    expect(await screen.findByText(/Green-day option already in Fit for Cancer/i)).toBeInTheDocument();
    expect(screen.getByText('Brisk Walking')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open in movement/i })).toBeInTheDocument();
  });

  it('uses Enter to send and Shift+Enter to keep writing a multiline draft', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'Got it.', recommendations: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAthena();
    await user.click(screen.getByRole('button', { name: /set fatigue score to 1/i }));

    const input = screen.getByRole('textbox', { name: /message ATHENA/i });
    await user.type(input, 'First line{Shift>}{Enter}{/Shift}second line');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(input).toHaveValue('First line\nsecond line');

    await user.type(input, '{Enter}');

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Got it.')).toBeInTheDocument();
  });

  it('keeps the composer focused and editable while ATHENA is responding', async () => {
    const user = userEvent.setup();
    let resolveFetch: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderAthena();
    await user.click(screen.getByRole('button', { name: /set fatigue score to 1/i }));

    const input = screen.getByRole('textbox', { name: /message ATHENA/i });
    await user.type(input, 'First question{Enter}');

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(input).toBeEnabled();
    expect(input).toHaveFocus();

    await user.type(input, 'Next thought while I wait');
    expect(input).toHaveValue('Next thought while I wait');
    expect(screen.getByRole('button', { name: /ATHENA is responding/i })).toBeDisabled();

    resolveFetch?.({
      ok: true,
      status: 200,
      json: async () => ({ text: 'First reply.', recommendations: [] }),
    });

    expect(await screen.findByText('First reply.')).toBeInTheDocument();
    expect(input).toHaveValue('Next thought while I wait');
  });

  it('keeps the jump-to-latest control outside the scrolling log viewport', async () => {
    render(
      <Conversation className="h-40">
        <ConversationContent>
          <div>Earlier message</div>
          <div>Latest message</div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>,
    );

    const log = screen.getByRole('log', { name: /ATHENA conversation/i });
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(log, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(log, 'scrollTop', { configurable: true, writable: true, value: 100 });

    fireEvent.scroll(log);

    const jump = await screen.findByRole('button', { name: /jump to latest ATHENA message/i });
    expect(log.contains(jump)).toBe(false);
    expect(log.parentElement?.contains(jump)).toBe(true);
  });

  it('keeps the existing voice control and send-state semantics in the new composer', async () => {
    const user = userEvent.setup();
    renderAthena();

    await user.click(screen.getByRole('button', { name: /set fatigue score to 1/i }));

    const input = screen.getByRole('textbox', { name: /message ATHENA/i });
    const send = screen.getByRole('button', { name: /send message to ATHENA/i });

    expect(send).toBeDisabled();
    await user.type(input, 'Something useful');
    expect(send).toBeEnabled();
  });
});
