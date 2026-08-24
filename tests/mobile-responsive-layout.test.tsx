import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router-dom';

import ExercisePage from '../components/ExercisePage';
import NutritionPage from '../components/NutritionPage';

const noop = () => {};

afterEach(cleanup);

describe('mobile responsive interaction regressions', () => {
  it('keeps focusable mobile form controls at 16px without disabling page zoom', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\)[\s\S]*textarea[\s\S]*select[\s\S]*font-size: 16px/);
    expect(html).toContain('width=device-width, initial-scale=1.0');
    expect(html).not.toMatch(/maximum-scale|user-scalable/i);
  });

  it('constrains Nutrition filter scrollers to the mobile viewport', () => {
    render(
      <MemoryRouter>
        <NutritionPage
          fatigueZone="🟡 Yellow"
          recipeZoneFilter={null}
          recipeCategoryFilter="All"
          recipeSearchQuery=""
          onRecipeZoneFilterChange={noop}
          onCategoryFilterChange={noop}
          onSearchChange={noop}
        />
      </MemoryRouter>,
    );

    const categoryGroup = screen.getByRole('radiogroup', { name: /recipe category filter/i });
    expect(categoryGroup).toHaveClass('w-full', 'min-w-0', 'max-w-full', 'overflow-x-auto');
    expect(categoryGroup.parentElement).toHaveClass('w-full', 'min-w-0');

    const zoneGroup = screen.getByRole('radiogroup', { name: /nutrition energy zone filter/i });
    expect(zoneGroup).toHaveClass('max-w-full', 'overflow-x-auto');
  });

  it('keeps the Movement energy filter within narrow mobile viewports', () => {
    render(
      <MemoryRouter>
        <ExercisePage
          fatigueZone="🟡 Yellow"
          exerciseZoneFilter={null}
          isMyelomaPatient={false}
          onExerciseZoneFilterChange={noop}
        />
      </MemoryRouter>,
    );

    const zoneGroup = screen.getByRole('radiogroup', { name: /energy filter/i });
    expect(zoneGroup).toHaveClass('max-w-full', 'overflow-x-auto');
    expect(zoneGroup.parentElement).toHaveClass('w-full', 'min-w-0');
  });
});
