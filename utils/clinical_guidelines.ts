export type CancerProtocolId = "bowel" | "melanoma" | "breast" | "prostate" | "lung" | "blood_myeloma";
export type ClinicalCancerType = CancerProtocolId | "other";

export interface ClinicalDirective {
  title: string;
  guidance: string;
}

export interface CancerProtocol {
  id: CancerProtocolId;
  displayName: string;
  protocolSource: string;
  directives: ClinicalDirective[];
}

export interface ClinicalGuidelineSet {
  title: string;
  globalDirective: {
    title: string;
    guidance: string;
  };
  generalOncologyBaseline: {
    title: string;
    guidance: string[];
  };
  cancerProtocols: Record<CancerProtocolId, CancerProtocol>;
}

export const CLINICAL_GUIDELINES: ClinicalGuidelineSet = {
  title: "CLINICAL KNOWLEDGE BASE: AUSTRALIAN INTEGRATIVE ONCOLOGY & PREHABILITATION PROTOCOLS",
  globalDirective: {
    title: "GLOBAL DIRECTIVE (Chris O'Brien Lifehouse 'LivingRoom' Model)",
    guidance:
      "Integrative Oncology Rule: Always integrate evidence-based complementary therapies (e.g., targeted yoga, mindfulness, and music therapy for anxiety reduction) alongside conventional exercise prescription. Treat exercise as an adjunct therapy that manages treatment toxicities.",
  },
  generalOncologyBaseline: {
    title: "GENERALIZED ONCOLOGY BASELINE (Use when cancer type is not specified or no protocol-specific pathway exists)",
    guidance: [
      "Use conservative, symptom-limited exercise prescription grounded in COSA and ESSA principles, with a preference for moderate intensity or lower unless the treating team has provided specific clearance.",
      "Prioritize fatigue monitoring, pacing, hydration, nutrition support, and functional recovery over performance goals, especially during active treatment or treatment transitions.",
      "Escalate to medical review instead of intensifying exercise if the user reports new chest pain, severe shortness of breath, dizziness, fever, sudden swelling, uncontrolled pain, or a rapid deterioration in function.",
      "For blood cancers or myeloma, be especially cautious about infection risk, anaemia-related exertional intolerance, and bone safety; favor low-impact movement and advise haematology clearance before weight-bearing progression when bone integrity may be compromised.",
    ],
  },
  cancerProtocols: {
    bowel: {
      id: "bowel",
      displayName: "BOWEL (COLORECTAL) CANCER",
      protocolSource: "University of Melbourne & ANZCTR Prehabilitation Trials",
      directives: [
        {
          title: "Rule",
          guidance:
            "If the user is pre-surgery, mandate 'Prehabilitation'. Recommend supervised cardiovascular and resistance training 2-8 weeks prior to surgery to improve the Ventilatory Anaerobic Threshold (VAT) and cardiorespiratory fitness (CRF).",
        },
        {
          title: "Rule",
          guidance:
            "Post-surgery, utilize the 'SCORE Trial' Shared-Care model approach-focus on progressive functional recovery and emphasize holistic survivorship, noting that moderate-to-high intensity exercise significantly reduces all-cause mortality.",
        },
      ],
    },
    melanoma: {
      id: "melanoma",
      displayName: "MELANOMA",
      protocolSource: "Peter MacCallum ABC Trial & Immunotherapy Survivorship",
      directives: [
        {
          title: "Rule",
          guidance:
            "Advanced melanoma is increasingly managed with combination immunotherapy (e.g., ipilimumab/nivolumab), which has high long-term survival rates but unique side effects.",
        },
        {
          title: "Rule",
          guidance:
            "Exercise prescription must account for Immune-Related Adverse Events (irAEs). If the user reports sudden severe fatigue, joint pain, or shortness of breath, halt exercise recommendations and advise immediate medical review, as this may indicate immune toxicity, not standard fatigue.",
        },
      ],
    },
    breast: {
      id: "breast",
      displayName: "BREAST CANCER",
      protocolSource: "ONJ Centre Integrative Care & Peter Mac Resistance Trials",
      directives: [
        {
          title: "Rule",
          guidance: "For patients on targeted therapies (like CDK4/6 inhibitors), fatigue is cumulative.",
        },
        {
          title: "Rule",
          guidance:
            "If lymph nodes were removed, apply strict lymphedema constraints: prioritize progressive, low-weight range-of-motion exercises. Do not prescribe sudden heavy upper-extremity loading. Integrate mind-body practices (like restorative yoga) to manage aromatase-inhibitor-induced joint arthralgia.",
        },
      ],
    },
    prostate: {
      id: "prostate",
      displayName: "PROSTATE CANCER",
      protocolSource: "ESSA & Chris O'Brien Lifehouse Survivorship",
      directives: [
        {
          title: "Rule",
          guidance:
            "If the patient is on Androgen Deprivation Therapy (ADT), they are at high risk for sarcopenia (muscle loss) and osteoporosis.",
        },
        {
          title: "Rule",
          guidance:
            "Aerobic exercise alone is insufficient. You MUST prioritize heavy, supervised Resistance Training (e.g., weightlifting, bodyweight squats) to preserve bone mineral density and lean muscle mass. Ensure falls-risk assessment is considered.",
        },
      ],
    },
    lung: {
      id: "lung",
      displayName: "LUNG CANCER",
      protocolSource: "Peter Mac & Austin Health Cardio-Oncology",
      directives: [
        {
          title: "Rule",
          guidance: "Prioritize respiratory prehabilitation and pulmonary rehabilitation.",
        },
        {
          title: "Rule",
          guidance:
            "If the patient is undergoing thoracic surgery or radiation, focus on inspiratory muscle training, pacing strategies, and energy conservation. Address the high risk of 'Cardio-Oncology' overlap (heart issues secondary to treatment) by keeping aerobic intensity strictly within the 'somewhat hard' (moderate) threshold unless medically cleared.",
        },
      ],
    },
    blood_myeloma: {
      id: "blood_myeloma",
      displayName: "BLOOD CANCER (LEUKEMIA, LYMPHOMA) & MULTIPLE MYELOMA PROTOCOL",
      protocolSource: "Leukaemia Foundation Australia, Chris O'Brien Lifehouse, Peter MacCallum Cancer Centre",
      directives: [
        {
          title: "Rule 1 (The Bone vs. Organ Nuance in Myeloma)",
          guidance:
            "Do not assume all myeloma patients have bone disease. If the patient has lytic lesions or bone involvement, STRICTLY advise against high-impact exercise (running, jumping) and extreme spinal rotation (golf). HOWEVER, if the patient has extramedullary myeloma, light-chain disease, or explicitly states they have no bone involvement, do not arbitrarily restrict impact. Encourage progressive cardiovascular and resistance training to build their energy reserve.",
        },
        {
          title: "Rule 2 (Renal Protection)",
          guidance:
            "Blood cancers, particularly myeloma (via Bence Jones proteins/paraproteins), frequently cause kidney damage. You must explicitly emphasize aggressive hydration (unless medically fluid-restricted). Note: While high protein is generally good for cancer cachexia, if the patient has renal impairment, warn them that high-protein diets must be cleared by a renal dietitian.",
        },
        {
          title: "Rule 3 (The Leukaemia Foundation '5 P's' of Fatigue)",
          guidance:
            "To manage severe Cancer-Related Fatigue (CRF) and the Dexamethasone steroid 'boom-bust' cycle, always frame exercise advice using the 5 P's: Plan (exercise on high-energy days), Prioritise (what matters most), Pace (break workouts into small chunks), Posture (use seated exercises to save energy), and Permission (validate that resting on 'crash' days is a clinical necessity).",
        },
        {
          title: "Rule 4 (Transplant & Infection Control - Lifehouse Protocol)",
          guidance:
            "If the patient is undergoing or recovering from a Stem Cell/Bone Marrow Transplant, prioritize 'Prehabilitation' to reduce hospital stays. Post-transplant, or if the patient is neutropenic (low white blood cells) or has a central line, strictly advise against public gyms or pools due to severe infection risk. Prescribe home-based or highly isolated exercise.",
        },
        {
          title: "Rule 5 (Integrative Oncology - Peter Mac)",
          guidance:
            "Treat physical exercise as only one pillar of movement. Actively recommend mind-body therapies (like Qigong, targeted Yoga, and mindfulness breathing) as valid, evidence-based exercises to manage 'scanxiety', peripheral neuropathy pain, and psychological distress.",
        },
      ],
    },
  },
};

const formatProtocol = (protocol: CancerProtocol, index: number): string => {
  const rules = protocol.directives.map((directive) => `${directive.title}: ${directive.guidance}`).join("\n");

  return `${index}. ${protocol.displayName} (Protocol: ${protocol.protocolSource})\n${rules}`;
};

const formatGeneralBaseline = (): string => {
  const rules = CLINICAL_GUIDELINES.generalOncologyBaseline.guidance
    .map((guidance, index) => `Rule ${index + 1}: ${guidance}`)
    .join("\n");

  return `${CLINICAL_GUIDELINES.generalOncologyBaseline.title}\n${rules}`;
};

export const buildClinicalKnowledgeBaseText = (cancerType?: ClinicalCancerType): string => {
  const selectedProtocol =
    cancerType && cancerType in CLINICAL_GUIDELINES.cancerProtocols
      ? CLINICAL_GUIDELINES.cancerProtocols[cancerType as CancerProtocolId]
      : null;

  const protocolText = selectedProtocol ? formatProtocol(selectedProtocol, 1) : formatGeneralBaseline();

  return [
    CLINICAL_GUIDELINES.title,
    "",
    `${CLINICAL_GUIDELINES.globalDirective.title}:`,
    CLINICAL_GUIDELINES.globalDirective.guidance,
    "",
    protocolText,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
};
