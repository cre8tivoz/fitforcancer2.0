
export enum AppTab {
  HOME = 'home',
  EXERCISE = 'exercise',
  NUTRITION = 'nutrition',
  ENERGY_BANK = 'energy_bank',
  ASSISTANT = 'assistant',
  RESOURCES = 'resources'
}

export interface Recipe {
  id: string;
  title: string;
  category: 'High Protein' | 'Easy to Digest' | 'Hydrating' | 'Anti-Nausea' | 'Zero-Prep' | 'Quick Assembly' | 'Balanced Fuel';
  ingredients: string[];
  instructions: string[];
  imageUrl: string;
  prepTime: string;
  cookTime: string;
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red';
  nutritionalBenefit: string;
  safetyNote?: string;
  citation?: string;
  sourceUrl?: string;
}

export interface Movement {
  id: string;
  title: string;
  intensity: 'Green' | 'Yellow' | 'Red';
  duration: string;
  benefit: string;
  mentalWellbeingBenefit: string;
  strengthBenefit: string;
  description: string;
  safetyNote: string;
  imageUrl?: string;
  citation?: string;
  sourceUrl?: string;
}

export type AthenaRecommendationKind = 'movement' | 'recipe';

export interface AthenaRecommendationRef {
  kind: AthenaRecommendationKind;
  id: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  recommendations?: AthenaRecommendationRef[];
}

export type CancerTypeOption =
  | 'bowel'
  | 'melanoma'
  | 'breast'
  | 'prostate'
  | 'lung'
  | 'blood_myeloma'
  | 'other';

export interface PersistedPatientContext {
  cancerType?: CancerTypeOption;
}

export interface StoredPatientContextRecord {
  timestamp: number;
  context: PersistedPatientContext;
}

export interface EnergyHistoryEntry {
  id: number;
  date: string;
  score: number;
  note: string;
}

export interface ChatContext {
  fatigueScore: number | null;
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  isMyelomaPatient: boolean;
  cancerType?: CancerTypeOption;
}
