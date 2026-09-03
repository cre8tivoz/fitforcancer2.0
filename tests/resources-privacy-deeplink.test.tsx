import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Resources from '../components/Resources';

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Resources privacy deep link', () => {
  it('opens and positions the privacy card for /resources#privacy', () => {
    render(
      <MemoryRouter initialEntries={['/resources#privacy']}>
        <Resources onClearSavedData={vi.fn()} />
      </MemoryRouter>,
    );

    const privacyButton = screen.getByRole('button', { name: /privacy & sensitive data handling/i });
    expect(privacyButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/ATHENA messages are processed by Google Gemini/i)).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  });

  it('keeps the privacy card collapsed on a normal Resources visit', () => {
    render(
      <MemoryRouter initialEntries={['/resources']}>
        <Resources onClearSavedData={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /privacy & sensitive data handling/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
