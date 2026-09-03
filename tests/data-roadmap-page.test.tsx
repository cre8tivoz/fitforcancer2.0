import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter } from 'react-router-dom';

import DataRoadmapPage from '../components/DataRoadmapPage';

const scrollIntoView = vi.fn();
const scrollTo = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  scrollTo.mockClear();

  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  });
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: scrollTo,
  });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
});

const renderPage = (initialEntry = '/') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DataRoadmapPage />
    </MemoryRouter>,
  );

const renderPageWithSameRouteLink = () =>
  render(
    <MemoryRouter initialEntries={['/data#developers']}>
      <Link to="/data">Back to Data top</Link>
      <DataRoadmapPage />
    </MemoryRouter>,
  );

describe('Data & Roadmap page', () => {
  it('keeps the landing view compact and honest before live metrics exist', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Fit For Cancer, in the open' })).toBeInTheDocument();
    expect(screen.getByText(/analytics collection began in september 2026/i)).toBeInTheDocument();
    expect(screen.getAllByText('Collecting now')).toHaveLength(4);
    expect(screen.getByText('Useful data, not personal profiles.')).toBeInTheDocument();
    expect(screen.queryByText('Our annual snapshot')).not.toBeInTheDocument();
  });

  it('resets a normal unfragmented page entry to the top', () => {
    renderPage('/data');

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('resets to the top when navigating to /data again without remounting', async () => {
    const user = userEvent.setup();
    renderPageWithSameRouteLink();

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    scrollTo.mockClear();

    await user.click(screen.getByRole('link', { name: 'Back to Data top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('provides stable section navigation anchors', () => {
    renderPage();

    const nav = screen.getByRole('navigation', { name: 'Data and Roadmap sections' });
    expect(within(nav).getByRole('link', { name: 'Data' })).toHaveAttribute('href', '#data');
    expect(within(nav).getByRole('link', { name: 'Roadmap' })).toHaveAttribute('href', '#roadmap');
    expect(within(nav).getByRole('link', { name: 'Wrapped' })).toHaveAttribute('href', '#wrapped');
    expect(within(nav).getByRole('link', { name: 'Developers' })).toHaveAttribute('href', '#developers');
  });

  it('scrolls to a direct section fragment after the lazy page mounts', () => {
    renderPage('/data#roadmap');

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('uses one controlled Roadmap accordion instead of showing every section at once', async () => {
    const user = userEvent.setup();
    renderPage();

    const built = screen.getByRole('button', { name: /what we’ve built/i });
    const next = screen.getByRole('button', { name: /what’s next/i });
    const crystal = screen.getByRole('button', { name: /in the crystal ball/i });

    expect(built).toHaveAttribute('aria-expanded', 'false');
    expect(next).toHaveAttribute('aria-expanded', 'false');
    expect(crystal).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('ATHENA rebuilt from the ground up')).not.toBeInTheDocument();

    await user.click(built);

    expect(built).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('ATHENA rebuilt from the ground up')).toBeInTheDocument();

    scrollIntoView.mockClear();
    await user.click(next);

    expect(built).toHaveAttribute('aria-expanded', 'false');
    expect(next).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText('ATHENA rebuilt from the ground up')).not.toBeInTheDocument();
    expect(screen.getByText('More recipes')).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });

    await user.click(crystal);

    expect(next).toHaveAttribute('aria-expanded', 'false');
    expect(crystal).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText('More recipes')).not.toBeInTheDocument();
    expect(screen.getByText('Lightweight accounts')).toBeInTheDocument();
  });

  it('keeps researcher and developer detail collapsed until requested', async () => {
    const user = userEvent.setup();
    renderPage();

    const researchers = screen.getByRole('button', { name: /for researchers/i });
    const developers = screen.getByRole('button', { name: /for developers/i });

    expect(researchers).toHaveAttribute('aria-expanded', 'false');
    expect(developers).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('How ATHENA works')).not.toBeInTheDocument();

    await user.click(developers);

    expect(developers).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('How ATHENA works')).toBeInTheDocument();
    expect(screen.getByText('Privacy boundary')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view the code/i })).toHaveAttribute(
      'href',
      'https://github.com/cre8tivoz/fitforcancer2.0',
    );
  });

  it('keeps methodology and running-cost detail behind disclosure controls', async () => {
    const user = userEvent.setup();
    renderPage();

    const counting = screen.getByRole('button', { name: /how we count this/i });
    const costs = screen.getByRole('button', { name: /running costs/i });
    const privacy = screen.getByRole('button', { name: /privacy and limitations/i });

    expect(counting).toHaveAttribute('aria-expanded', 'false');
    expect(costs).toHaveAttribute('aria-expanded', 'false');

    await user.click(counting);

    expect(counting).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/recipe opens are counted when someone chooses to view a recipe/i)).toBeInTheDocument();

    await user.click(privacy);
    expect(screen.getByRole('link', { name: /read the privacy details/i })).toHaveAttribute(
      'href',
      '/resources#privacy',
    );
  });
});
