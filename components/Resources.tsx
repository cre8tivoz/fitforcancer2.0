import React, { useState } from 'react';
import {
  ExternalLink,
  BookOpen,
  Heart,
  Activity,
  Utensils,
  ChevronDown,
  ChevronUp,
  User,
  Stethoscope,
  Users,
  Globe,
  MessageSquare,
} from 'lucide-react';
import SupportThisApp from './SupportThisApp';

const INTERACTIVE_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]';

const ShieldAlert: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const CollapsibleCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = React.useId();

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={`flex w-full items-center justify-between bg-slate-50 px-6 py-5 text-left transition-colors hover:bg-slate-100 ${INTERACTIVE_FOCUS_CLASS}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      {isOpen && (
        <div id={contentId} className="animate-slide-down border-t border-slate-100 p-8">
          {children}
        </div>
      )}
    </div>
  );
};

interface ResourcesProps {
  onClearSavedData: () => void;
}

const Resources: React.FC<ResourcesProps> = ({ onClearSavedData }) => {
  const supportResources = [
    {
      category: 'Exercise Physiologists & Physical Support',
      icon: <Activity className="h-5 w-5 text-blue-600" />,
      items: [
        {
          title: 'ESSA - Find an Accredited Exercise Physiologist',
          description: 'Search for an AEP who specialises in oncology to help you manage treatment side effects safely.',
          url: 'https://www.essa.org.au/find-aep',
          tags: ['Find a professional', 'Exercise prescriptions'],
        },
        {
          title: 'Pinc & Steel Cancer Rehab',
          description: 'Specialised oncology physiotherapy and exercise physiology programs across Australia and New Zealand.',
          url: 'https://www.pincandsteel.com/',
          tags: ['Rehabilitation', 'Physiotherapy'],
        },
      ],
    },
    {
      category: 'Dietitians & Nutritional Support',
      icon: <Utensils className="h-5 w-5 text-orange-600" />,
      items: [
        {
          title: 'Dietitians Australia - Find a Dietitian',
          description: 'Connect with an Accredited Practising Dietitian (APD) with experience in oncology nutrition.',
          url: 'https://dietitiansaustralia.org.au/find-an-apd',
          tags: ['Find a professional', 'Clinical nutrition'],
        },
        {
          title: 'Cancer Council - Nutrition Services',
          description: 'Access evidence-based information and support regarding diet and nutrition during and after cancer treatment.',
          url: 'https://www.cancer.org.au/support-and-services/after-treatment/nutrition-and-cancer',
          tags: ['Information', 'Dietary advice'],
        },
      ],
    },
    {
      category: 'Mental Health & Emotional Support',
      icon: <Heart className="h-5 w-5 text-rose-600" />,
      items: [
        {
          title: 'Beyond Blue',
          description: 'Providing information and support to help everyone in Australia achieve their best possible mental health.',
          url: 'https://www.beyondblue.org.au/',
          tags: ['Mental health', 'Anxiety', 'Depression'],
        },
        {
          title: 'Lifeline Australia',
          description: '24/7 crisis support and suicide prevention services for all Australians experiencing emotional distress.',
          url: 'https://www.lifeline.org.au/',
          tags: ['Crisis support', '24/7 service'],
        },
        {
          title: 'Canteen',
          description: 'Supporting young people (12-25) when cancer turns their world upside down.',
          url: 'https://www.canteen.org.au/',
          tags: ['Youth support', 'Family'],
        },
      ],
    },
    {
      category: 'General Cancer Organisations',
      icon: <Users className="h-5 w-5 text-neon-blue" />,
      items: [
        {
          title: 'Cancer Council Australia',
          description: 'The leading national body for cancer control, providing support services and information.',
          url: 'https://www.cancer.org.au/',
          tags: ['General support', 'Information'],
        },
        {
          title: 'Myeloma Australia',
          description: 'Dedicated to supporting those living with myeloma through specialised nurses and community groups.',
          url: 'https://myeloma.org.au/',
          tags: ['Specialist support', 'Nurses'],
        },
        {
          title: 'Breast Cancer Network Australia (BCNA)',
          description: 'Ensuring Australians affected by breast cancer receive the very best support and care.',
          url: 'https://www.bcna.org.au/',
          tags: ['Breast cancer', 'Support network'],
        },
        {
          title: 'Leukaemia Foundation',
          description: 'Supporting people living with blood cancer, including leukaemia, lymphoma, and myeloma.',
          url: 'https://www.leukaemia.org.au/',
          tags: ['Blood cancer', 'Research'],
        },
      ],
    },
  ];

  const citations = [
    {
      category: 'Exercise & Physical Activity (Oncology Standards)',
      icon: <Activity className="h-5 w-5 text-blue-600" />,
      sources: [
        {
          title: 'COSA Position Statement on Exercise in Cancer Care',
          description: 'The foundational Australian document mandating that exercise be a standard part of cancer care to counteract side effects like fatigue.',
          url: 'https://www.cosa.org.au/groups/exercise-cancer-care/position-statement/',
        },
        {
          title: 'ESSA Consensus Statement - Exercise & Cancer',
          description: 'Provides the clinical framework for Accredited Exercise Physiologists (AEPs) to prescribe tailored, safe movement based on the FITT principle.',
          url: 'https://www.essa.org.au/Public/Public/News/ESSA_Position_Statement_on_Exercise_and_Cancer.aspx',
        },
        {
          title: 'Cancer Council Australia - Exercise & Cancer',
          description: 'Detailed guidance on managing side effects through low, moderate, and vigorous intensity activities.',
          url: 'https://www.cancer.org.au/support-and-services/after-treatment/exercise-for-people-living-with-cancer',
        },
        {
          title: 'Myeloma Australia - Exercise Info Sheet',
          description: 'Evidence-based justifications for supervised, individualised programmes that prioritise bone health.',
          url: 'https://myeloma.org.au/resources/exercise-and-myeloma/',
        },
      ],
    },
    {
      category: 'Nutrition & Dietetics (Oncology Standards)',
      icon: <Utensils className="h-5 w-5 text-orange-600" />,
      sources: [
        {
          title: 'Cancer Council Victoria - Nutrition for People Living with Cancer',
          description: 'Defines the "Nourishing Diet" (High Protein High Energy) required to manage treatment-induced malnutrition.',
          url: 'https://www.cancervic.org.au/get-support/nutrition-and-cancer',
        },
        {
          title: 'COSA Cancer-Related Malnutrition Toolkit',
          description: 'A clinical implementation guide used to screen and treat nutrition-impact symptoms.',
          url: 'https://www.cosa.org.au/groups/nutrition/malnutrition-toolkit/',
        },
        {
          title: 'ESPEN Practical Guideline: Clinical Nutrition in Cancer',
          description: 'Peer-reviewed evidence supporting protein intake above 1 g/kg/day and energy requirement management.',
          url: 'https://www.espen.org/guidelines-home/espen-guidelines',
        },
        {
          title: 'Peter MacCallum Cancer Centre Resources',
          description: 'Specific Australian guidelines for nourishing diets during chemotherapy and steroid cycles.',
          url: 'https://www.petermac.org/services/support-services/nutrition/nutrition-resources',
        },
      ],
    },
    {
      category: 'Therapeutic Movement & Safety (Physiotherapy Standards)',
      icon: <Heart className="h-5 w-5 text-rose-600" />,
      sources: [
        {
          title: 'Australian Physiotherapy Association (APA) - Five Facts on Cancer',
          description: 'Establishes exercise as the number one treatment for cancer-related fatigue (CRF).',
          url: 'https://australian.physio/',
        },
        {
          title: 'APA - Physiotherapy Cancer Care Continuum',
          description: 'Justifies the use of prehabilitation and restorative movement to improve recovery times.',
          url: 'https://australian.physio/',
        },
        {
          title: 'Exercise Modification & Progression (Cancer Exercise Toolkit)',
          description: 'Clinical rules for regressing exercise based on hematological markers and bone disease.',
          url: 'https://cancerexercisetoolkit.org.au/',
        },
      ],
    },
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="rounded-r-xl border-l-4 border-amber-400 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            <strong>Clinical Safety Note:</strong> This evidence base is provided to support your journey. Please ensure you have medical clearance from your oncology team before starting any new exercise or nutrition protocols.
          </p>
        </div>
      </div>

      <header className="rounded-2xl bg-slate-900 p-8 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-neon-blue" />
          <h1 className="text-3xl font-bold">Evidence & Resources</h1>
        </div>
        <p className="max-w-2xl opacity-80">
          To comply with TGA requirements for medical software, this application cites the following Australian evidence-based guidelines and resources used to inform our exercise, nutrition, and AI assistant data.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-neon-blue" />
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Support Organisations & Community</h2>
          </div>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">Australian resources</span>
        </div>

        <div className="divide-y divide-slate-100">
          {supportResources.map((section, sectionIndex) => (
            <div key={sectionIndex} className="p-6">
              <div className="mb-4 flex items-center gap-2">
                {section.icon}
                <h3 className="text-sm font-semibold text-slate-900">{section.category}</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {section.items.map((item, itemIndex) => (
                  <a
                    key={itemIndex}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${item.title} resource (opens in new tab)`}
                    className={`group flex h-full flex-col rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow transition-transform transition-colors hover:border-neon-blue/30 hover:bg-white ${INTERACTIVE_FOCUS_CLASS}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <h4 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-neon-blue">{item.title}</h4>
                      <span className="rounded-lg bg-white p-1.5 text-slate-400 transition-shadow transition-transform transition-colors group-hover:bg-neon-blue/10 group-hover:text-neon-blue">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mb-3 flex-grow text-xs leading-relaxed text-slate-600">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="rounded border border-slate-100 bg-white px-2 py-1 text-xs font-medium text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-4 text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <MessageSquare className="h-3.5 w-3.5" />
            Need immediate support? Call Cancer Council on{' '}
            <a href="tel:131120" className="font-bold text-slate-900 hover:underline" aria-label="Call Cancer Council on 1 3 1 1 2 0">
              13 11 20
            </a>
          </p>
        </div>
      </section>

      <div className="space-y-6">
        <CollapsibleCard
          title='Patient-Facing Summary: "Moving with Your Energy"'
          icon={<User className="h-6 w-6 text-emerald-600" />}
        >
          <div className="prose prose-slate max-w-none">
            <p className="mb-6 text-slate-600">
              This guide is designed for anyone navigating a health journey, focusing on energy management rather than specific diagnoses.
            </p>

            <h3 className="mb-3 text-lg font-bold text-slate-900">Why the Traffic Light System?</h3>
            <p className="mb-4 text-slate-600">
              Managing a health condition can make your energy levels feel like a moving target. This tool uses a 0-10 scale and a traffic light system to help you match your daily activities to your current energy budget.
            </p>

            <ul className="mb-8 space-y-4">
              <li className="flex gap-3">
                <span className="text-xl">Green</span>
                <div>
                  <strong className="text-slate-900">Green (Score 0-3):</strong>
                  <p className="text-slate-600">Your energy is stable. This is the time to focus on building your strength and stamina.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">Yellow</span>
                <div>
                  <strong className="text-slate-900">Yellow (Score 4-6):</strong>
                  <p className="text-slate-600">Your energy is dipping. We pivot to active rest, with gentle movements that keep you mobile without draining you.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">Red</span>
                <div>
                  <strong className="text-slate-900">Red (Score 7-10):</strong>
                  <p className="text-slate-600">Your energy is low. The priority shifts to recovery and energy conservation. We focus on breathing and gentle circulation to help your body recharge.</p>
                </div>
              </li>
            </ul>

            <h3 className="mb-3 text-lg font-bold text-slate-900">How it helps you:</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="mb-2 font-bold text-slate-900">Safety First</h4>
                <p className="text-sm text-slate-600">Automatically filters out high-intensity activities when you are in a high-fatigue state.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="mb-2 font-bold text-slate-900">Smart Nutrition</h4>
                <p className="text-sm text-slate-600">Matches meal ideas to your energy budget, from standard cooking when you are feeling Green to zero-prep Red Zone snacks.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="mb-2 font-bold text-slate-900">Empowerment</h4>
                <p className="text-sm text-slate-600">You are the expert on your body. Update your score at any time to see the recommendations change instantly.</p>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Clinician Summary: Technical Evidence Base"
          icon={<Stethoscope className="h-6 w-6 text-blue-600" />}
        >
          <div className="prose prose-slate max-w-none">
            <p className="mb-6 italic text-slate-600">A technical overview for oncologists, haematologists, and allied health professionals.</p>

            <h3 className="mb-3 text-lg font-bold text-slate-900">Clinical Framework:</h3>
            <p className="mb-6 text-slate-600">
              The Fit For Cancer Assistant is built on the COSA Position Statement on Exercise in Cancer Care and ESSA Consensus Guidelines. It utilises a Visual Analogue Scale (VAS) for fatigue to dynamically triage patients into three intensity tiers.
            </p>

            <div className="space-y-6">
              <section>
                <h4 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">1</span>
                  Exercise Triage
                </h4>
                <ul className="list-disc space-y-2 pl-10 text-slate-600">
                  <li><strong>Red Zone (Severe Fatigue):</strong> Prioritises restorative movement to prevent deconditioning while minimising orthostatic strain, such as supine ankle pumps and diaphragmatic breathing.</li>
                  <li><strong>Yellow and Green Zones:</strong> Scales intensity from low-load mobility to resistance-based strength training, aligning with APA Oncology Physiotherapy standards.</li>
                </ul>
              </section>

              <section>
                <h4 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">2</span>
                  Nutritional Intervention
                </h4>
                <ul className="list-disc space-y-2 pl-10 text-slate-600">
                  <li>Recommendations focus on High Protein High Energy (HPHE) snacks and meal frequency to combat treatment-induced sarcopenia and malnutrition.</li>
                  <li>Specific logic is included for steroid rebound, such as dexamethasone, prioritising hydration and low-glycaemic fuel to manage the post-steroid crash.</li>
                </ul>
              </section>

              <section>
                <h4 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">3</span>
                  TGA & Safety Guardrails
                </h4>
                <ul className="list-disc space-y-2 pl-10 text-slate-600">
                  <li>The system includes active contraindication alerts for bone pain and localised discomfort, particularly relevant for patients with metastatic disease or multiple myeloma.</li>
                  <li>All guidance is designed as a supportive adjunct to clinical care and includes mandatory medical consultation disclaimers.</li>
                </ul>
              </section>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Helpful Articles & Guides"
          icon={<BookOpen className="h-6 w-6 text-indigo-600" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                title: 'Managing Cancer-Related Fatigue',
                description: 'Learn about the 3 Ps (Pacing, Prioritising, Positioning) and how to manage your energy battery during treatment.',
                url: 'https://www.cancer.org.au/support-and-services/after-treatment/fatigue',
                cta: 'Read guide',
              },
              {
                title: 'Exercise Safety for Myeloma',
                description: 'Specific considerations for bone health and safe movement for multiple myeloma patients.',
                url: 'https://myeloma.org.au/resources/exercise-and-myeloma/',
                cta: 'Read article',
              },
              {
                title: 'Nutrition During Chemotherapy',
                description: 'Tips for managing nausea, taste changes, and maintaining your weight during active treatment cycles.',
                url: 'https://www.cancervic.org.au/get-support/nutrition-and-cancer',
                cta: 'View resources',
              },
              {
                title: 'Mental Health & Cancer',
                description: 'Understanding the emotional impact of a diagnosis and where to find psychological support in Australia.',
                url: 'https://www.beyondblue.org.au/the-facts/cancer-and-mental-health',
                cta: 'Access support',
              },
            ].map((article) => (
              <a
                key={article.title}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${article.cta}: ${article.title} (opens in new tab)`}
                className={`block rounded-xl border border-slate-100 bg-slate-50 p-6 transition-colors hover:border-neon-blue/30 hover:bg-white ${INTERACTIVE_FOCUS_CLASS}`}
              >
                <h4 className="mb-2 font-bold text-slate-900">{article.title}</h4>
                <p className="mb-4 text-sm text-slate-600">{article.description}</p>
                <span className="flex items-center gap-1 text-sm font-semibold text-neon-blue">
                  {article.cta}
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            ))}
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Privacy & Sensitive Data Handling"
          icon={<Globe className="h-6 w-6 text-[color:var(--color-tertiary)]" />}
        >
          <div className="space-y-6 text-sm leading-7 text-slate-600">
            <section className="space-y-2">
              <p><strong className="text-slate-900">1. Your Data Stays With You (No Accounts)</strong></p>
              <p>Currently, Fit For Cancer operates entirely without user accounts. Your triage information (such as your energy levels and Quick Notes) is stored locally on your own device using your browser&apos;s temporary memory. We do not store your personal health profile in a central database. When you close your browser or clear your cache, your local session resets.</p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">2. The AI Health Assistant</strong></p>
              <p>When you interact with the Health Assistant, your messages and local triage context are transmitted securely via an encrypted connection to generate your personalised advice. This data is completely anonymous. It is not linked to your name, email, or identity. Furthermore, our secure backend ensures your private conversations are never used to train public AI models.</p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">3. Voice Dictation is Strictly Local</strong></p>
              <p>If you use the microphone feature for Quick Notes, your voice is processed entirely by your device&apos;s native browser (such as Apple&apos;s or Google&apos;s built-in accessibility features). Fit For Cancer does not record, save, or transmit your audio files to any external servers. The translation to text happens right on your phone or computer.</p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">4. Australian Privacy Principles (APPs)</strong></p>
              <p>We are guided by the Australian Privacy Act 1988, specifically focusing on Data Minimisation. We only ask for the minimum amount of context required to provide safe, evidence-based support for your current session. Because we do not collect identifiable electronic health records (EHR), you remain in complete, anonymous control of your digital footprint.</p>
            </section>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-slate-500">
                  Saved patient context expires automatically after 14 days. You can remove it sooner at any time.
                </p>
                <button
                  type="button"
                  onClick={onClearSavedData}
                  className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-shadow transition-transform transition-colors hover:border-rose-300 hover:text-rose-600 ${INTERACTIVE_FOCUS_CLASS}`}
                >
                  Clear My Saved Data
                </button>
              </div>
            </div>
          </div>
        </CollapsibleCard>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {citations.map((section, sectionIndex) => (
          <section key={sectionIndex} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
              {section.icon}
              <h2 className="text-base font-semibold text-slate-900">{section.category}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {section.sources.map((source, sourceIndex) => (
                <a
                  key={sourceIndex}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${source.title} resource (opens in new tab)`}
                  className={`group block p-6 transition-colors hover:bg-slate-50 ${INTERACTIVE_FOCUS_CLASS}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 transition-colors group-hover:text-neon-blue">{source.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{source.description}</p>
                    </div>
                    <span className="rounded-lg bg-slate-100 p-2 text-slate-400 transition-shadow transition-transform transition-colors group-hover:bg-neon-blue/10 group-hover:text-neon-blue">
                      <ExternalLink className="h-5 w-5" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-8 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-rose-900">
          <ShieldAlert className="h-5 w-5" />
          TGA Compliance & Clinical Safety
        </h3>
        <div className="space-y-4 text-sm leading-relaxed text-rose-800">
          <p>
            <strong>Mandatory Medical Disclaimer:</strong> This application is designed to <strong>complement</strong>, rather than replace, professional medical advice. The information provided is for educational purposes and is aligned with Australian oncology standards (COSA & ESSA).
          </p>
          <p>
            It does not replace the personalised guidance of your <strong>medical oncologist, haematologist, or specialised physiotherapist</strong>. All clinical advice is traceable to the recognised Australian authorities listed above. If you are experiencing any new or worsening symptoms, please contact your medical team immediately.
          </p>
        </div>
      </div>

      <SupportThisApp />
    </div>
  );
};

export default Resources;
