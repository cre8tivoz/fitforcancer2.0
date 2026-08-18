import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

const renderAthena = () =>
  render(
    <MemoryRouter initialEntries={['/assistant']}>
      <App />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ATHENA chat regressions', () => {
  it('uses a definite scrollable transcript viewport instead of clipping a max-height box', () => {
    renderAthena();

    const log = screen.getByRole('log', { name: /ATHENA conversation/i });
    expect(log).toHaveClass('overflow-y-auto');
    expect(log.parentElement?.className).toContain('h-[clamp(24rem,62dvh,48rem)]');
  });

  it('renders streamed response text incrementally and keeps per-message PDF actions out of replies', async () => {
    const user = userEvent.setup();
    const encoder = new TextEncoder();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(nextController) {
        controller = nextController;
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderAthena();
    await user.click(screen.getByRole('button', { name: /set energy score to 1/i }));
    await user.type(screen.getByRole('textbox', { name: /message ATHENA/i }), 'How should I approach today?');
    await user.click(screen.getByRole('button', { name: /send message to ATHENA/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    controller.enqueue(encoder.encode('event: delta\ndata: {"text":"Start gently"}\n\n'));
    expect(await screen.findByText('Start gently')).toBeInTheDocument();

    controller.enqueue(encoder.encode('event: delta\ndata: {"text":" and see how you feel."}\n\n'));
    controller.enqueue(encoder.encode('event: done\ndata: {"recommendations":[]}\n\n'));
    controller.close();

    expect(await screen.findByText('Start gently and see how you feel.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download health plan pdf/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export full ATHENA conversation/i })).toBeInTheDocument();
  });
});
