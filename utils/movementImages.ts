import type { Movement } from '../types';
import supportedBalancePracticeImage from '../media/exercises/supported-balance-practice.webp';
import seatedHamstringStretchImage from '../media/exercises/seated-hamstring-stretch.webp';

const movementImageOverrides: Record<string, string> = {
  '15': supportedBalancePracticeImage,
  '21': seatedHamstringStretchImage,
};

export const getMovementImage = (movement: Movement): string | undefined =>
  movement.imageUrl ?? movementImageOverrides[movement.id];
