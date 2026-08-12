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
  title: "ATHENA SUPPORTIVE-CARE CONTEXT — BACKGROUND ONLY",
  globalDirective: {
    title: "HOW TO USE THIS CONTEXT",
    guidance:
      "Use these notes silently to make supportive suggestions safer and more relevant. Do not quote protocol labels, institutional names, or rule language unless the user explicitly asks for the evidence. Do not diagnose, prescribe cancer treatment, or infer complications from cancer type alone.",
  },
  generalOncologyBaseline: {
    title: "GENERAL SUPPORTIVE-CARE BASELINE",
    guidance: [
      "Cancer-related fatigue can affect physical energy, concentration, motivation, and everyday function. Prefer small, manageable suggestions and avoid overwhelming the user with long plans.",
      "When activity is appropriate, match movement to the person's current capacity, symptoms, usual activity, treatment context, and preferences. Avoid turning the 0-10 energy score into a clinical severity rating or a fixed exercise prescription.",
      "Nutrition suggestions should focus on maintaining intake, hydration, protein and energy where useful, and working around common treatment-related eating difficulties. Never present a food, diet, supplement, or complementary therapy as a cancer treatment or cure.",
      "If the user describes new or worsening chest pain, severe or unusual breathlessness, fainting or marked dizziness, fever, sudden swelling, severe or uncontrolled pain, or rapid deterioration, stop trying to solve the problem with food or movement and encourage timely assessment by their treating team or appropriate urgent care.",
      "Use known cancer and treatment context only when it materially changes the advice. Do not repeatedly announce the user's cancer type, fatigue score, or energy zone back to them.",
    ],
  },
  cancerProtocols: {
    bowel: {
      id: "bowel",
      displayName: "BOWEL / COLORECTAL CANCER",
      protocolSource: "Australian cancer supportive-care guidance",
      directives: [
        {
          title: "Surgery and recovery",
          guidance:
            "If recent or upcoming abdominal surgery, an ostomy, wound issues, or specific post-operative restrictions are relevant, keep movement suggestions conservative and encourage the user to follow their surgical or allied-health guidance. Otherwise use the general supportive-care baseline.",
        },
      ],
    },
    melanoma: {
      id: "melanoma",
      displayName: "MELANOMA",
      protocolSource: "Australian cancer supportive-care guidance",
      directives: [
        {
          title: "Immunotherapy awareness",
          guidance:
            "If the user is receiving immunotherapy, do not assume a new symptom is a routine treatment effect. New severe or rapidly worsening fatigue, breathlessness, pain, diarrhoea, fever, or other concerning symptoms should prompt contact with the treating team rather than exercise or nutrition troubleshooting. Do not diagnose an immune-related adverse event.",
        },
      ],
    },
    breast: {
      id: "breast",
      displayName: "BREAST CANCER",
      protocolSource: "Cancer Council Australia and breast-cancer supportive-care guidance",
      directives: [
        {
          title: "Arm, shoulder and lymphoedema awareness",
          guidance:
            "After breast or axillary surgery, favour gradual and comfortable arm and shoulder movement when the user has been cleared to resume it. If they report new or increasing arm or breast swelling, redness, fever, marked heaviness, or significant pain, recommend clinical review rather than simply increasing exercise.",
        },
      ],
    },
    prostate: {
      id: "prostate",
      displayName: "PROSTATE CANCER",
      protocolSource: "Australian exercise-oncology supportive-care guidance",
      directives: [
        {
          title: "ADT and strength",
          guidance:
            "If androgen-deprivation therapy is relevant, strength and bone health can matter, but do not mandate heavy lifting. Suggest appropriately scaled resistance activity when suitable and encourage professional exercise support when bone health, falls risk, pain, or other medical issues complicate the choice of exercise.",
        },
      ],
    },
    lung: {
      id: "lung",
      displayName: "LUNG CANCER",
      protocolSource: "Cancer Council Australia supportive-care guidance",
      directives: [
        {
          title: "Breathlessness and pacing",
          guidance:
            "Use pacing and low-effort movement when breathlessness limits activity. Do not make claims about oxygen levels from conversation alone. New, severe, or clearly worsening breathlessness, chest pain, fainting, or other concerning symptoms should be directed to the treating team or urgent assessment as appropriate.",
        },
      ],
    },
    blood_myeloma: {
      id: "blood_myeloma",
      displayName: "BLOOD CANCER",
      protocolSource: "Leukaemia Foundation and Australian cancer supportive-care guidance",
      directives: [
        {
          title: "Blood counts, transplant and infection precautions",
          guidance:
            "If the user says they are neutropenic, immediately post-transplant, acutely unwell, or under specific infection precautions, follow the treating team's restrictions and avoid suggesting public-gym or pool activity as a default. Do not infer current blood counts from symptoms.",
        },
        {
          title: "Do not infer subtype-specific complications",
          guidance:
            "The broad blood-cancer context does not establish myeloma, leukaemia or lymphoma. Do not assume myeloma-specific bone disease, kidney impairment, fluid restrictions, or any other subtype-specific complication unless the user names the cancer or supplies that clinical context.",
        },
        {
          title: "Hydration and nutrition",
          guidance:
            "Do not prescribe aggressive hydration, high-protein diets, fluid restriction, or renal dietary changes without known clinical context. If kidney impairment or a fluid restriction is explicitly relevant, encourage the user to follow their treating team's or dietitian's individual advice.",
        },
      ],
    },
  },
};

const formatProtocol = (protocol: CancerProtocol, index: number): string => {
  const rules = protocol.directives.map((directive) => `${directive.title}: ${directive.guidance}`).join("\n");

  return `${index}. ${protocol.displayName}\n${rules}`;
};

const formatGeneralBaseline = (): string => {
  const rules = CLINICAL_GUIDELINES.generalOncologyBaseline.guidance
    .map((guidance, index) => `Note ${index + 1}: ${guidance}`)
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
    formatGeneralBaseline(),
    selectedProtocol ? "" : null,
    selectedProtocol ? protocolText : null,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
};