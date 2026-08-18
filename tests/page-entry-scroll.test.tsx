import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExercisePage from '../components/ExercisePage';
import NutritionPage from '../components/NutritionPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Movement and Nutrition page entry scroll', () => {
  it('starts a normal Movement page entry at the top of the document', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');

    render(
      <MemoryRouter initialEntries={['/exercise']}>
        <ExercisePage
          fatigueZone={null}
          exerciseZoneFilter={null}
          isMyelomaPatient={false}
          onExerciseZoneFilterChange={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('starts a normal Nutrition page entry at the top of the document', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');

    render(
      <MemoryRouter initialEntries={['/nutrition']}>
        <NutritionPage
          fatigueZone={null}
          recipeZoneFilter={null}
          recipeCategoryFilter="All"
          recipeSearchQuery=""
          onRecipeZoneFilterChange={() => undefined}
          onCategoryFilterChange={() => undefined}
          onSearchChange={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('does not override an explicit ATHENA Movement deep-link with a top reset', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');

    render(
      <MemoryRouter initialEntries={['/exercise?athena=1']}>
        <ExercisePage
          fatigueZone="🟢 Green"
          exerciseZoneFilter={null}
          isMyelomaPatient={false}
          onExerciseZoneFilterChange={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('does not override an explicit ATHENA Nutrition deep-link with a top reset', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');

    render(
      <MemoryRouter initialEntries={['/nutrition?athena=10']}>
        <NutritionPage
          fatigueZone="🔴 Red"
          recipeZoneFilter={null}
          recipeCategoryFilter="All"
          recipeSearchQuery=""
          onRecipeZoneFilterChange={() => undefined}
          onCategoryFilterChange={() => undefined}
          onSearchChange={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
