import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router-dom';

import ExercisePage from '../components/ExercisePage';
import NutritionPage from '../components/NutritionPage';

const noop = () => {};

const findCssBlockEnd = (css: string, blockStart: number): number => {
  const openingBrace = css.indexOf('{', blockStart);
  if (openingBrace < 0) return -1;

  let depth = 0;
  for (let index = openingBrace; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
};

afterEach(cleanup);

describe('mobile responsive interaction regressions', () => {
  it('keeps the mobile 16px focus guard outside Tailwind layers without disabling page zoom', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

    const baseLayerStart = css.indexOf('@layer base');
    const baseLayerEnd = findCssBlockEnd(css, baseLayerStart);
    const focusGuardStart = css.indexOf('Mobile form-control focus zoom guard');
    const mobileRuleStart = css.indexOf('@media (max-width: 767px)', focusGuardStart);

    expect(baseLayerStart).toBeGreaterThanOrEqual(0);
    expect(baseLayerEnd).toBeGreaterThan(baseLayerStart);
    expect(focusGuardStart).toBeGreaterThan(baseLayerEnd);
    expect(mobileRuleStart).toBeGreaterThan(focusGuardStart);

    const mobileRule = css.slice(mobileRuleStart);
    expect(mobileRule).toMatch(/input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\)[\s\S]*textarea[\s\S]*select[\s\S]*font-size: 16px/);

    expect(html).toContain('width=device-width, initial-scale=1.0');
    expect(html).not.toMatch(/maximum-scale|user-scalable/i);
  });

  it('stacks and wraps ATHENA header actions within the mobile viewport', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    const athena = readFileSync(new URL('../components/AthenaChatPage.tsx', import.meta.url), 'utf8');

    expect(athena).toContain('aria-label="Reset ATHENA conversation and energy check-in"');
    expect(css).toContain("div:has(> div > button[aria-label='Reset ATHENA conversation and energy check-in'])");
    expect(css).toContain("div:has(> button[aria-label='Reset ATHENA conversation and energy check-in'])");

    const headerRuleStart = css.indexOf("div:has(> div > button[aria-label='Reset ATHENA conversation and energy check-in'])");
    const actionRuleStart = css.indexOf("div:has(> button[aria-label='Reset ATHENA conversation and energy check-in'])");
    const headerRuleEnd = findCssBlockEnd(css, headerRuleStart);
    const actionRuleEnd = findCssBlockEnd(css, actionRuleStart);

    const headerRule = css.slice(headerRuleStart, headerRuleEnd + 1);
    const actionRule = css.slice(actionRuleStart, actionRuleEnd + 1);

    expect(headerRule).toContain('flex-direction: column');
    expect(headerRule).toContain('max-width: 100%');
    expect(actionRule).toContain('flex-wrap: wrap');
    expect(actionRule).toContain('max-width: 100%');
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
