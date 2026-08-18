import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
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

  it('scrolls Movement to top when an ATHENA deep-link becomes normal navigation without remounting', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, 'scrollTo');

    const Harness = () => {
      const navigate = useNavigate();
      return (
        <>
          <button type="button" onClick={() => navigate('/exercise')}>Normal Movement</button>
          <ExercisePage
            fatigueZone="🟢 Green"
            exerciseZoneFilter={null}
            isMyelomaPatient={false}
            onExerciseZoneFilterChange={() => undefined}
          />
        </>
      );
    };

    render(
      <MemoryRouter initialEntries={['/exercise?athena=1']}>
        <Harness />
      </MemoryRouter>,
    );

    expect(scrollTo).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Normal Movement' }));
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' }));
  });

  it('scrolls Nutrition to top when an ATHENA deep-link becomes normal navigation without remounting', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, 'scrollTo');

    const Harness = () => {
      const navigate = useNavigate();
      return (
        <>
          <button type="button" onClick={() => navigate('/nutrition')}>Normal Nutrition</button>
          <NutritionPage
            fatigueZone="🔴 Red"
            recipeZoneFilter={null}
            recipeCategoryFilter="All"
            recipeSearchQuery=""
            onRecipeZoneFilterChange={() => undefined}
            onCategoryFilterChange={() => undefined}
            onSearchChange={() => undefined}
          />
        </>
      );
    };

    render(
      <MemoryRouter initialEntries={['/nutrition?athena=10']}>
        <Harness />
      </MemoryRouter>,
    );

    expect(scrollTo).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Normal Nutrition' }));
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' }));
  });

  it('does not snap Movement to top when a filter locally clears the ATHENA target', async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByRole('radio', { name: '🟡 Yellow' }));
    await waitFor(() => expect(screen.queryByText(/From ATHENA:/i)).not.toBeInTheDocument());
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('does not snap Nutrition to top when search locally clears the ATHENA target', async () => {
    const user = userEvent.setup();
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

    await user.type(screen.getByRole('textbox', { name: /search recipes/i }), 'x');
    await waitFor(() => expect(screen.queryByText(/From ATHENA:/i)).not.toBeInTheDocument());
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
