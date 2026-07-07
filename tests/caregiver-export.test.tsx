import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaregiverExportButton from '../components/CaregiverExportButton';

vi.mock('../utils/caregiverPdf', () => ({
  generateCaregiverPdf: vi.fn(),
}));

import { generateCaregiverPdf } from '../utils/caregiverPdf';

describe('CaregiverExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders with correct aria-label', () => {
    render(<CaregiverExportButton currentFatigueScore={5} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls generateCaregiverPdf on click', async () => {
    const user = userEvent.setup();
    render(<CaregiverExportButton currentFatigueScore={5} />);
    await user.click(screen.getByRole('button'));
    expect(generateCaregiverPdf).toHaveBeenCalledWith(5);
  });

  it('renders passing null score', () => {
    render(<CaregiverExportButton currentFatigueScore={null} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
