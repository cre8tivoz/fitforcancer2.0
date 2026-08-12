import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';

const renderApp = (initialRoute = '/') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  );

describe('mobile navigation', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('opens a header menu with all primary destinations', async () => {
    const user = userEvent.setup();
    renderApp('/');

    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('#mobile-navigation-menu')).toBeNull();

    await user.click(menuButton);

    expect(screen.getByRole('button', { name: /close navigation menu/i })).toHaveAttribute('aria-expanded', 'true');
    const mobileMenu = document.querySelector('#mobile-navigation-menu') as HTMLElement;
    expect(mobileMenu).toBeTruthy();

    expect(within(mobileMenu).getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: /movement/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: /nutrition/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: /energy bank/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: /athena/i })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: /resources/i })).toBeInTheDocument();
  });

  it('navigates from the mobile menu and closes it after selection', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));
    const mobileMenu = document.querySelector('#mobile-navigation-menu') as HTMLElement;
    await user.click(within(mobileMenu).getByRole('link', { name: /nutrition/i }));

    expect(document.querySelector('#mobile-navigation-menu')).toBeNull();
    expect(screen.getByRole('heading', { name: /recovery nutrition/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
