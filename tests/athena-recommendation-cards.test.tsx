import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AthenaRecommendationCard from '../components/AthenaRecommendationCard';
import ExercisePage from '../components/ExercisePage';
import NutritionPage from '../components/NutritionPage';
import type { Recipe } from '../types';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}{location.search}</div>;
};

const mockMatchMedia = (matches: boolean) => (query: string) => ({
  matches,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => false),
});

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: mockMatchMedia(false),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ATHENA recommendation cards', () => {
  it('renders canonical movement metadata and opens the exact Movement item', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/assistant']}>
        <LocationProbe />
        <AthenaRecommendationCard recommendation={{ kind: 'movement', id: '1' }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Brisk Walking')).toBeInTheDocument();
    expect(screen.getByText(/15–30 mins · Aerobic fitness/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open in movement/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/exercise?athena=1');
  });

  it('renders canonical recipe metadata and opens the exact Nutrition item', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/assistant']}>
        <LocationProbe />
        <AthenaRecommendationCard recommendation={{ kind: 'recipe', id: '10' }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Hydrating Watermelon & Mint Cooler')).toBeInTheDocument();
    expect(screen.getByText(/3 mins prep · Hydrating/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open in nutrition/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/nutrition?athena=10');
  });

  it('does not render a stale or unknown recommendation ref', () => {
    const { container } = render(
      <MemoryRouter>
        <AthenaRecommendationCard recommendation={{ kind: 'movement', id: '9999' }} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ATHENA recommendation destinations', () => {
  it('keeps a linked movement visible against an older filter, focuses it, then restores normal filtering after user input', async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [zone, setZone] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>('🔴 Red');
      return (
        <>
          <LocationProbe />
          <ExercisePage
            fatigueZone="🔴 Red"
            exerciseZoneFilter={zone}
            isMyelomaPatient={false}
            onExerciseZoneFilterChange={setZone}
          />
        </>
      );
    };

    render(
      <MemoryRouter initialEntries={['/exercise?athena=1']}>
        <Harness />
      </MemoryRouter>,
    );

    expect(screen.getByText(/highlighted below/i)).toHaveTextContent('Brisk Walking');
    expect(screen.getByText('Brisk Walking')).toBeInTheDocument();
    const target = screen.getByLabelText('ATHENA recommendation: Brisk Walking');
    await waitFor(() => expect(document.activeElement).toBe(target));

    await user.click(screen.getByRole('radio', { name: '🟡 Yellow' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/exercise');
    expect(screen.queryByText(/From ATHENA:/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Brisk Walking')).not.toBeInTheDocument();
  });

  it('uses immediate target scrolling when reduced motion is requested', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: mockMatchMedia(true),
    });

    const Harness = () => {
      const [zone, setZone] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>('🔴 Red');
      return (
        <ExercisePage
          fatigueZone="🔴 Red"
          exerciseZoneFilter={zone}
          isMyelomaPatient={false}
          onExerciseZoneFilterChange={setZone}
        />
      );
    };

    render(
      <MemoryRouter initialEntries={['/exercise?athena=1']}>
        <Harness />
      </MemoryRouter>,
    );

    const target = screen.getByLabelText('ATHENA recommendation: Brisk Walking');
    await waitFor(() => expect(document.activeElement).toBe(target));

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    });
  });

  it('keeps a linked recipe visible against older filters, focuses it, then restores normal filtering after search input', async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [zone, setZone] = useState<'🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null>('🔴 Red');
      const [category, setCategory] = useState<Recipe['category'] | 'All'>('Zero-Prep');
      const [search, setSearch] = useState('custard');
      return (
        <>
          <LocationProbe />
          <NutritionPage
            fatigueZone="🔴 Red"
            recipeZoneFilter={zone}
            recipeCategoryFilter={category}
            recipeSearchQuery={search}
            onRecipeZoneFilterChange={setZone}
            onCategoryFilterChange={setCategory}
            onSearchChange={setSearch}
          />
        </>
      );
    };

    render(
      <MemoryRouter initialEntries={['/nutrition?athena=5']}>
        <Harness />
      </MemoryRouter>,
    );

    expect(screen.getByText(/highlighted below/i)).toHaveTextContent('Poached Chicken & Steamed Greens');
    expect(screen.getByText('Poached Chicken & Steamed Greens')).toBeInTheDocument();
    const target = screen.getByLabelText('ATHENA recommendation: Poached Chicken & Steamed Greens');
    await waitFor(() => expect(document.activeElement).toBe(target));

    await user.type(screen.getByRole('textbox', { name: /search recipes/i }), 'x');

    expect(screen.getByTestId('location')).toHaveTextContent('/nutrition');
    expect(screen.queryByText(/From ATHENA:/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Poached Chicken & Steamed Greens')).not.toBeInTheDocument();
  });
});
