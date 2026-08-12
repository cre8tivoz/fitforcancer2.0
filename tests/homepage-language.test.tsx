import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HomePage from '../components/HomePage';

describe('HomePage language', () => {
  afterEach(() => cleanup());

  it('uses plain evidence-informed language before a check-in', () => {
    render(<HomePage fatigueZone={null} onNavigate={vi.fn()} />);

    expect(screen.getByText(/practical, evidence-informed support for cancer-related fatigue/i)).toBeInTheDocument();
    expect(screen.getByText(/green, yellow and red sort ideas by effort\. they are not a diagnosis/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /evidence-informed/i })).toBeInTheDocument();

    expect(screen.queryByText(/safest, most effective/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/australian oncology standards/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/designed to combat cancer-related fatigue/i)).not.toBeInTheDocument();
  });

  it('keeps a Red day practical without implying failure or clinical severity', () => {
    render(<HomePage fatigueZone="🔴 Red" onNavigate={vi.fn()} />);

    expect(screen.getByText(/low-battery day\. we'll put the easiest options first\. rest counts too/i)).toBeInTheDocument();
  });

  it('keeps a Green day grounded rather than turning it into a fitness target', () => {
    render(<HomePage fatigueZone="🟢 Green" onNavigate={vi.fn()} />);

    expect(screen.getByText(/without turning the day into a fitness test/i)).toBeInTheDocument();
  });
});
