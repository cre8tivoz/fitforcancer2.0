import type { CancerTypeOption, ChatMessage } from '../types';

export type BloodCancerFamily = 'myeloma' | 'leukaemia' | 'lymphoma_cll';

type TreatmentKey = Exclude<CancerTypeOption, 'other' | 'blood_myeloma'> | 'blood_generic' | BloodCancerFamily;

interface TreatmentSource {
  title: string;
  url: string;
}

interface TreatmentInformation {
  label: string;
  overview: string;
  sources: TreatmentSource[];
}

const TREATMENT_INFORMATION: Record<TreatmentKey, TreatmentInformation> = {
  bowel: {
    label: 'Bowel cancer',
    overview:
      'Australian treatment information describes surgery, chemotherapy, radiation therapy, targeted therapy, immunotherapy and, in selected situations, ablation or embolisation. Which options are relevant depends on stage, location, symptoms, test results, general health and the person’s wishes.',
    sources: [
      {
        title: 'Cancer Australia — Bowel cancer treatment options',
        url: 'https://www.canceraustralia.gov.au/cancer-types/bowel-cancer/treatment-options',
      },
    ],
  },
  melanoma: {
    label: 'Melanoma',
    overview:
      'Australian treatment information describes surgery as the main initial treatment for many melanomas, with radiation therapy, targeted therapy, immunotherapy and sometimes chemotherapy used depending on stage, location, gene changes, recurrence risk, symptoms and general health.',
    sources: [
      {
        title: 'Cancer Australia — Melanoma treatment options',
        url: 'https://www.canceraustralia.gov.au/cancer-types/melanoma-skin/treatment-options',
      },
    ],
  },
  breast: {
    label: 'Breast cancer',
    overview:
      'Australian treatment information describes surgery, radiation therapy, chemotherapy, hormone or endocrine therapy, targeted therapy and immunotherapy. The mix depends on factors such as cancer type, stage, hormone-receptor or HER2 status, previous treatment, general health and preferences.',
    sources: [
      {
        title: 'Cancer Council Australia — Treatments for breast cancer',
        url: 'https://www.cancer.org.au/types-of-cancer/breast-cancer/treatments-for-breast-cancer',
      },
      {
        title: 'Cancer Australia — Breast cancer',
        url: 'https://www.canceraustralia.gov.au/cancer-types/breast-cancer',
      },
    ],
  },
  prostate: {
    label: 'Prostate cancer',
    overview:
      'Australian treatment information describes active surveillance for some people as well as surgery, radiation therapy, hormone therapy, chemotherapy, immunotherapy, targeted therapy and supportive care. Which approach is relevant depends on disease features, symptoms, general health and preferences.',
    sources: [
      {
        title: 'Cancer Australia — Prostate cancer treatment options',
        url: 'https://www.canceraustralia.gov.au/cancer-types/prostate-cancer/treatment-options',
      },
    ],
  },
  lung: {
    label: 'Lung cancer',
    overview:
      'Australian treatment information describes surgery, chemotherapy, radiation therapy, targeted therapy, immunotherapy and supportive care. The treatment pathway depends on the type of lung cancer, stage, location, symptoms, test results and general health.',
    sources: [
      {
        title: 'Cancer Australia — Lung cancer treatment options',
        url: 'https://www.canceraustralia.gov.au/cancer-types/lung-cancer/treatment-options',
      },
    ],
  },
  blood_generic: {
    label: 'Blood cancer',
    overview:
      'Blood cancer is a broad family rather than one treatment pathway. Australian blood-cancer resources describe options including chemotherapy, radiation therapy, immunotherapy, targeted therapy, CAR T-cell therapy, stem-cell transplant, clinical trials and supportive care, but the relevant choices differ substantially between myeloma, leukaemias and lymphomas. If the specific blood cancer is not known, ask one short clarifying question before giving detailed treatment information.',
    sources: [
      {
        title: 'Leukaemia Foundation — Blood cancer treatment options',
        url: 'https://www.leukaemia.org.au/education/education-treatment-options/',
      },
      {
        title: 'Cancer Australia — All cancer types',
        url: 'https://www.canceraustralia.gov.au/all-cancer-types',
      },
    ],
  },
  myeloma: {
    label: 'Myeloma',
    overview:
      'Australian myeloma information describes active monitoring for some people, combinations of medicines, immunotherapy or immunomodulatory treatment, targeted therapy, steroids, stem-cell transplant for selected people, supportive treatment and clinical trials. Treatment is highly individual and depends on disease features, symptoms, response to previous treatment, general health and the person’s priorities.',
    sources: [
      {
        title: 'Myeloma Australia — Understanding your treatment',
        url: 'https://myeloma.org.au/your-guide/understanding-your-treatment/',
      },
      {
        title: 'Cancer Australia — Myeloma treatment options',
        url: 'https://www.canceraustralia.gov.au/cancer-types/myeloma/treatment-options',
      },
      {
        title: 'Leukaemia Foundation — Blood cancer treatment options',
        url: 'https://www.leukaemia.org.au/education/education-treatment-options/',
      },
    ],
  },
  leukaemia: {
    label: 'Leukaemia',
    overview:
      'Leukaemia is not one disease. Treatment differs substantially between acute and chronic forms and between subtypes such as AML, ALL and CML. Australian resources describe approaches that can include chemotherapy, steroids, targeted therapy, immunotherapy, CAR T-cell therapy, stem-cell transplant, active monitoring for some chronic forms, clinical trials and supportive care. If a subtype matters to the question and has not been stated, ask which subtype before getting specific.',
    sources: [
      {
        title: 'Leukaemia Foundation — In treatment',
        url: 'https://www.leukaemia.org.au/blood-cancer-information/navigating-blood-cancer/in-treatment/',
      },
      {
        title: 'Cancer Australia — Leukaemia treatment options',
        url: 'https://www.canceraustralia.gov.au/cancer-types/leukaemia/treatment-options',
      },
    ],
  },
  lymphoma_cll: {
    label: 'Lymphoma / CLL',
    overview:
      'Lymphoma includes many different diseases, and CLL is classified as a B-cell lymphoma despite its name. Australian resources describe treatments that can include active monitoring, chemotherapy, monoclonal antibodies, immunotherapy, targeted therapies, radiation therapy, stem-cell transplant, CAR T-cell therapy, clinical trials and supportive care. Detailed treatment depends on the exact lymphoma or CLL subtype and individual disease features.',
    sources: [
      {
        title: 'Lymphoma Australia — Treatments for Lymphoma and CLL',
        url: 'https://www.lymphoma.org.au/lymphoma/treatments/',
      },
      {
        title: 'Cancer Australia — Lymphoma treatment options',
        url: 'https://www.canceraustralia.gov.au/cancer-types/lymphoma/treatment-options',
      },
      {
        title: 'Leukaemia Foundation — Chronic lymphocytic leukaemia (CLL)',
        url: 'https://www.leukaemia.org.au/types-of-blood-cancer/lymphoma/non-hodgkin-lymphoma/chronic-lymphocytic-leukaemia-cll/',
      },
    ],
  },
};

const MYELOMA_PATTERN = /\b(myeloma|multiple\s+myeloma|smouldering\s+myeloma)\b/i;
const LYMPHOMA_PATTERN = /\b(lymphoma|hodgkin|non[-\s]?hodgkin|cll|chronic\s+lymphocytic|dlbcl|follicular\s+lymphoma|mantle\s+cell|small\s+lymphocytic|sll)\b/i;
const LEUKAEMIA_PATTERN = /\b(leukaemia|leukemia|aml|cml|apml|acute\s+myeloid|acute\s+lymphoblastic|chronic\s+myeloid|acute\s+promyelocytic)\b/i;
const ALL_ACRONYM_PATTERN = /\bALL\b/;

const lastMatchIndex = (text: string, pattern: RegExp): number => {
  const match = text.match(pattern);
  return match?.index ?? -1;
};

const detectFamilyInMessage = (text: string): BloodCancerFamily | null => {
  const candidates: Array<{ family: BloodCancerFamily; index: number }> = [
    { family: 'myeloma', index: lastMatchIndex(text, MYELOMA_PATTERN) },
    { family: 'lymphoma_cll', index: lastMatchIndex(text, LYMPHOMA_PATTERN) },
    {
      family: 'leukaemia',
      index: Math.max(lastMatchIndex(text, LEUKAEMIA_PATTERN), lastMatchIndex(text, ALL_ACRONYM_PATTERN)),
    },
  ].filter((candidate) => candidate.index >= 0);

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.index - a.index);
  return candidates[0].family;
};

export const detectBloodCancerFamily = (history: ChatMessage[]): BloodCancerFamily | null => {
  const userMessages = history.filter((message) => message.role === 'user').map((message) => message.content);

  for (let index = userMessages.length - 1; index >= 0; index -= 1) {
    const family = detectFamilyInMessage(userMessages[index]);
    if (family) return family;
  }

  return null;
};

const formatSources = (sources: TreatmentSource[]): string =>
  sources.map((source) => `- [${source.title}](${source.url})`).join('\n');

export const buildTreatmentInformationText = (
  cancerType: CancerTypeOption | undefined,
  history: ChatMessage[],
  isMyelomaPatient = false,
): string => {
  let key: TreatmentKey | null = null;

  if (cancerType === 'blood_myeloma' || isMyelomaPatient) {
    key = detectBloodCancerFamily(history) ?? (isMyelomaPatient ? 'myeloma' : 'blood_generic');
  } else if (cancerType && cancerType !== 'other') {
    key = cancerType;
  }

  if (!key) {
    return [
      'TREATMENT INFORMATION — GENERAL BOUNDARY',
      'You may explain general cancer-treatment categories and terminology, but if the cancer type materially changes the answer and is not known, ask one short clarifying question before giving cancer-specific detail.',
      'Never recommend which treatment the user personally should choose, start, stop, skip, replace or dose differently.',
    ].join('\n');
  }

  const info = TREATMENT_INFORMATION[key];

  return [
    `TREATMENT INFORMATION — ${info.label.toUpperCase()}`,
    info.overview,
    '',
    'Use this as a concise orientation layer, not as a prescribing guide or exhaustive protocol.',
    'You MAY explain general treatment categories, common terminology, why different approaches exist at a high level, and questions the user could take to their treating team.',
    'You MAY compare treatment types in general terms when the supplied information supports the comparison.',
    'You MUST NOT decide which treatment is best for this person, recommend starting/stopping/switching treatment, or advise changing a prescribed dose or schedule.',
    'If the user asks for general treatment information, answer helpfully instead of refusing merely because the topic is cancer treatment.',
    'If they push for an individual treatment decision, state the boundary briefly and offer to explain the options or help formulate questions for their treating team.',
    '',
    'VERIFIED TREATMENT SOURCES — surface these links when the user asks for sources or when naming the source materially improves a treatment-information answer:',
    formatSources(info.sources),
  ].join('\n');
};
