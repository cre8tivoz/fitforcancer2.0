import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AthenaRecommendationCard from '../components/AthenaRecommendationCard';
import ExercisePage from '../components/ExercisePage';
import NutritionPage from '../components/NutritionPage';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}{location.search}</div>;
};

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
  it('keeps a linked movement visible even when an older manual zone filter conflicts', () => {
    render(
      <MemoryRouter initialEntries={['/exercise?athena=1']}>
        <ExercisePage
          fatigueZone="🔴 Red"
          exerciseZoneFilter="🔴 Red"
          isMyelomaPatient={false}
          onExerciseZoneFilterChange={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/From ATHENA:/i)).toHaveTextContent('Brisk Walking');
    expect(screen.getByText('Brisk Walking')).toBeInTheDocument();
    expect(screen.getByText('ATHENA recommendation')).toBeInTheDocument();
  });

  it('keeps a linked recipe visible even when older search/category/zone filters conflict', () => {
    render(
      <MemoryRouter initialEntries={['/nutrition?athena=5']}>
        <NutritionPage
          fatigueZone="🔴 Red"
          recipeZoneFilter="🔴 Red"
          recipeCategoryFilter="Zero-Prep"
          recipeSearchQuery="custard"
          onRecipeZoneFilterChange={vi.fn()}
          onCategoryFilterChange={vi.fn()}
          onSearchChange={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/From ATHENA:/i)).toHaveTextContent('Poached Chicken & Steamed Greens');
    expect(screen.getByText('Poached Chicken & Steamed Greens')).toBeInTheDocument();
    expect(screen.getByText('ATHENA recommendation')).toBeInTheDocument();
  });
});
