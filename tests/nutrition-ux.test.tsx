import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import NutritionPage from '../components/NutritionPage';

const noop = () => {};

const renderNutritionPage = (recipeZoneFilter: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | 'All' | null = 'All') => render(
  <NutritionPage
    fatigueZone={null}
    recipeZoneFilter={recipeZoneFilter}
    recipeCategoryFilter="All"
    recipeSearchQuery=""
    onRecipeZoneFilterChange={noop}
    onCategoryFilterChange={noop}
    onSearchChange={noop}
  />
);

describe('Nutrition UX', () => {
  afterEach(cleanup);

  it('uses plain-language benefit wording and the fatigue-first page intro', () => {
    renderNutritionPage();

    expect(screen.getByText(/Low-effort, treatment-aware food ideas/i)).toBeInTheDocument();
    expect(screen.getAllByText('Why it may help').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nutritional Benefit')).not.toBeInTheDocument();
  });

  it('orders Red recipes from lowest-effort options first', () => {
    renderNutritionPage('🔴 Red');

    const recipeTitles = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);

    expect(recipeTitles).toEqual([
      'Energy Blitz Greek Yoghurt',
      'Custard & Pear Cup',
      'Creamed Rice Cup',
      'Fortified Milky Drink',
      'The "Crash" Shake',
      'Hydrating Watermelon & Mint Cooler',
    ]);
  });
});
