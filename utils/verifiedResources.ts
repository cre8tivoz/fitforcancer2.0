/**
 * Verified Resource URLs for COSA/ESSA/Peter MacCallum smart chips.
 *
 * This is the single source of truth for citation URLs referenced by
 * the AI assistant. Every citation shorthand used in constants.ts
 * (Recipe.citation, Movement.citation) maps to a URL here.
 *
 * The system instruction injected into Gemini's prompt reads from this
 * map so the AI can include clickable "### Verified Resources" links
 * in every response.
 *
 * Last updated: 2026-05-24
 * Maintainer: Claudia / Camillo @ Witch Daddy Labs
 */

export interface VerifiedResource {
  key: string;             // Shorthand used in data, e.g. "COSA 2020"
  title: string;           // Human-readable link text
  url: string;             // Actual URL
  category: 'exercise' | 'nutrition' | 'general' | 'mental-health';
  description: string;     // Brief description for context
}

export const VERIFIED_RESOURCES: Record<string, VerifiedResource> = {
  'COSA 2020': {
    key: 'COSA 2020',
    title: 'COSA Position Statement on Exercise in Cancer Care',
    url: 'https://www.cosa.org.au/groups/exercise-cancer-care/position-statement/',
    category: 'exercise',
    description: 'Foundational Australian document mandating exercise as standard cancer care to counteract fatigue.',
  },
  COSA: {
    key: 'COSA',
    title: 'COSA Position Statement on Exercise in Cancer Care',
    url: 'https://www.cosa.org.au/groups/exercise-cancer-care/position-statement/',
    category: 'exercise',
    description: 'Foundational Australian document mandating exercise as standard cancer care.',
  },
  'COSA Malnutrition Toolkit': {
    key: 'COSA Malnutrition Toolkit',
    title: 'COSA Cancer-Related Malnutrition Toolkit',
    url: 'https://www.cosa.org.au/groups/nutrition/malnutrition-toolkit/',
    category: 'nutrition',
    description: 'Clinical implementation guide for screening and treating nutrition-impact symptoms.',
  },
  ESSA: {
    key: 'ESSA',
    title: 'ESSA — Exercise & Sports Science Australia',
    url: 'https://www.essa.org.au/Public/Public/News/ESSA_Position_Statement_on_Exercise_and_Cancer.aspx',
    category: 'exercise',
    description: 'Clinical framework for Accredited Exercise Physiologists (AEPs) to prescribe tailored movement.',
  },
  'Cancer Council AU': {
    key: 'Cancer Council AU',
    title: 'Cancer Council Australia — Exercise after Cancer',
    url: 'https://www.cancer.org.au/support-and-services/after-treatment/exercise-for-people-living-with-cancer',
    category: 'general',
    description: 'Detailed guidance on managing side effects through exercise during and after cancer treatment.',
  },
  'Cancer Council': {
    key: 'Cancer Council',
    title: 'Cancer Council Australia — Nutrition after Cancer',
    url: 'https://www.cancer.org.au/support-and-services/after-treatment/nutrition-and-cancer',
    category: 'nutrition',
    description: 'Evidence-based nutrition support during and after cancer treatment.',
  },
  'Cancer Council AU Nutrition': {
    key: 'Cancer Council AU Nutrition',
    title: 'Cancer Council Victoria — Nutrition for People Living with Cancer',
    url: 'https://www.cancervic.org.au/get-support/nutrition-and-cancer',
    category: 'nutrition',
    description: 'Defines the Nourishing Diet (High Protein High Energy) for managing treatment-induced malnutrition.',
  },
  'Peter Mac': {
    key: 'Peter Mac',
    title: 'Peter MacCallum Cancer Centre — Nutrition Resources',
    url: 'https://www.petermac.org/services/support-services/nutrition/nutrition-resources',
    category: 'nutrition',
    description: 'Australian guidelines for nourishing diets during chemotherapy and steroid cycles.',
  },
  APA: {
    key: 'APA',
    title: 'Australian Physiotherapy Association — Five Facts on Cancer',
    url: 'https://australian.physio/',
    category: 'exercise',
    description: 'Establishes exercise as the number one treatment for cancer-related fatigue (CRF).',
  },
  'Myeloma Australia': {
    key: 'Myeloma Australia',
    title: 'Myeloma Australia — Exercise & Myeloma',
    url: 'https://myeloma.org.au/resources/exercise-and-myeloma/',
    category: 'exercise',
    description: 'Evidence-based justifications for supervised, individualised exercise programmes prioritising bone health.',
  },
  ESPEN: {
    key: 'ESPEN',
    title: 'ESPEN Practical Guideline: Clinical Nutrition in Cancer',
    url: 'https://www.espen.org/guidelines-home/espen-guidelines',
    category: 'nutrition',
    description: 'Peer-reviewed evidence supporting protein intake and energy requirement management in cancer care.',
  },
  'Leukaemia Foundation': {
    key: 'Leukaemia Foundation',
    title: 'Leukaemia Foundation Australia',
    url: 'https://www.leukaemia.org.au/',
    category: 'general',
    description: 'Support for people living with blood cancer, including leukaemia, lymphoma, and myeloma.',
  },
  BeyondBlue: {
    key: 'BeyondBlue',
    title: 'Beyond Blue — Cancer and Mental Health',
    url: 'https://www.beyondblue.org.au/the-facts/cancer-and-mental-health',
    category: 'mental-health',
    description: 'Information and support for mental health challenges related to cancer.',
  },
} as const;

/**
 * Builds the markdown resource block to inject into the Gemini system
 * instruction. The AI will use these URLs when constructing its
 * ### Verified Resources section.
 */
export const buildVerifiedResourcesPromptBlock = (): string => {
  const exerciseResources = Object.values(VERIFIED_RESOURCES)
    .filter((r) => r.category === 'exercise')
    .map((r) => `  - [${r.title}](${r.url})`);
  const nutritionResources = Object.values(VERIFIED_RESOURCES)
    .filter((r) => r.category === 'nutrition')
    .map((r) => `  - [${r.title}](${r.url})`);
  const generalResources = Object.values(VERIFIED_RESOURCES)
    .filter((r) => r.category === 'general' || r.category === 'mental-health')
    .map((r) => `  - [${r.title}](${r.url})`);

  return [
    '### Verified Resources (Available URLs)',
    '',
    'When you use any of the following citation shorthands, you MUST include the corresponding link in your ### Verified Resources section.',
    '',
    '**Exercise:**',
    ...exerciseResources,
    '',
    '**Nutrition:**',
    ...nutritionResources,
    '',
    '**General Support:**',
    ...generalResources,
    '',
    'Example:',
    '```',
    '### Verified Resources',
    '- [COSA Position Statement on Exercise in Cancer Care](https://www.cosa.org.au/groups/exercise-cancer-care/position-statement/)',
    '- [Peter MacCallum Nutrition Resources](https://www.petermac.org/services/support-services/nutrition/nutrition-resources)',
    '```',
  ].join('\n');
};
