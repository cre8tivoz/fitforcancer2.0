import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';

import App from '../App';

const RouteLocationProbe = () => {
  const location = useLocation();
  return <output data-testid="router-location">{location.pathname}</output>;
};

const renderRoute = (initialRoute: string) =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
      <RouteLocationProbe />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('About and Support information architecture', () => {
  it('exposes About and Support as secondary mobile navigation destinations', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));
    const menu = document.querySelector('#mobile-navigation-menu') as HTMLElement;

    expect(within(menu).getByRole('link', { name: /About/i })).toHaveAttribute('href', '/about');
    expect(within(menu).getByRole('link', { name: /Support Fit For Cancer/i })).toHaveAttribute('href', '/support');
  });

  it('renders the refreshed About story and keeps support optional', async () => {
    renderRoute('/about');

    expect(await screen.findByRole('heading', { name: 'About Fit For Cancer' })).toBeInTheDocument();
    expect(screen.getByText(/Because I wish it existed when I needed it/i)).toBeInTheDocument();
    expect(screen.getByText(/Energy Bank, treatment-aware movement and food ideas, and ATHENA/i)).toBeInTheDocument();
    expect(screen.getByText(/There is no pressure to contribute/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Support Fit For Cancer/i })).toHaveAttribute('href', '/support');
  });

  it('uses Ko-fi as the dedicated support destination without a fake fundraising meter', async () => {
    renderRoute('/support');

    expect(await screen.findByRole('heading', { name: 'Support Fit For Cancer' })).toBeInTheDocument();
    expect(screen.getByText(/Contributions help cover hosting and AI usage as more people use the app/i)).toBeInTheDocument();

    const koFi = screen.getByRole('link', { name: /Support on Ko-fi/i });
    expect(koFi).toHaveAttribute('href', 'https://ko-fi.com/fitforcancer');
    expect(koFi).toHaveAttribute('target', '_blank');

    expect(screen.queryByText(/goal this month/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$50/i)).not.toBeInTheDocument();
  });

  it('keeps the old why-free URL working by redirecting to canonical About', async () => {
    renderRoute('/why-free');

    expect(await screen.findByRole('heading', { name: 'About Fit For Cancer' })).toBeInTheDocument();
    expect(screen.getByTestId('router-location')).toHaveTextContent('/about');
  });

  it('states the paid Gemini and 14-day ATHENA log policy in Resources', async () => {
    const user = userEvent.setup();
    renderRoute('/resources');

    await user.click(await screen.findByRole('button', { name: /Privacy & Sensitive Data Handling/i }));

    expect(screen.getByText(/billing-enabled paid Gemini API service/i)).toBeInTheDocument();
    expect(screen.getByText(/not used to improve Google products by default/i)).toBeInTheDocument();
    expect(screen.getByText(/14-day retention period/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Gemini logging & retention/i })).toHaveAttribute(
      'href',
      'https://ai.google.dev/gemini-api/docs/logs-policy',
    );
  });
});
