
export enum AppTab {
  HOME = 'home',
  EXERCISE = 'exercise',
  NUTRITION = 'nutrition',
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
  citation?: string;
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
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatContext {
  fatigueScore: number | null;
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  isMyelomaPatient: boolean;
  cancerType?: string;
}
