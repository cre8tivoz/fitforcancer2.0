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
  const [hasClearedSavedData, setHasClearedSavedData] = useState(false);

  const handleClearSavedData = () => {
    onClearSavedData();
    setHasClearedSavedData(true);
  };

  const supportResources = [
    {
      category: 'Exercise Physiologists & Physical Support',
      icon: <Activity className="h-5 w-5 text-blue-600" />,
      items: [
        {
          title: 'ESSA - Find an Accredited Exercise Physiologist',
          description: 'Search for an AEP with oncology experience who can help tailor movement to your treatment, symptoms, and current capacity.',
          url: 'https://www.essa.org.au/find-aep',
          tags: ['Find a professional', 'Exercise support'],
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
          description: 'Connect with an Accredited Practising Dietitian (APD), including dietitians with oncology nutrition experience.',
          url: 'https://dietitiansaustralia.org.au/find-an-apd',
          tags: ['Find a professional', 'Nutrition support'],
        },
        {
          title: 'Cancer Council - Nutrition Services',
          description: 'Current Cancer Council information for eating well, maintaining nutrition, and managing treatment-related eating problems.',
          url: 'https://connect.cancer.org.au/cancer-information/living-and-coping/nutrition-for-people-with-cancer',
          tags: ['Information', 'Nutrition'],
        },
      ],
    },
    {
      category: 'Mental Health & Emotional Support',
      icon: <Heart className="h-5 w-5 text-rose-600" />,
      items: [
        {
          title: 'Beyond Blue',
          description: 'Australian mental health information and support for anxiety, depression, and emotional wellbeing.',
          url: 'https://www.beyondblue.org.au/',
          tags: ['Mental health', 'Support'],
        },
        {
          title: 'Lifeline Australia',
          description: '24/7 crisis support for Australians experiencing emotional distress.',
          url: 'https://www.lifeline.org.au/',
          tags: ['Crisis support', '24/7 service'],
        },
        {
          title: 'Canteen',
          description: 'Support for young people aged 12-25 affected by cancer.',
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
          description: 'National cancer information, practical support, and links to state and territory Cancer Councils.',
          url: 'https://www.cancer.org.au/',
          tags: ['General support', 'Information'],
        },
        {
          title: 'Myeloma Australia',
          description: 'Specialist information, nurses, and community support for people living with myeloma.',
          url: 'https://myeloma.org.au/',
          tags: ['Specialist support', 'Nurses'],
        },
        {
          title: 'Breast Cancer Network Australia (BCNA)',
          description: 'Information, advocacy, and peer support for Australians affected by breast cancer.',
          url: 'https://www.bcna.org.au/',
          tags: ['Breast cancer', 'Support network'],
        },
        {
          title: 'Leukaemia Foundation',
          description: 'Support and information for people living with blood cancer, including leukaemia, lymphoma, and myeloma.',
          url: 'https://www.leukaemia.org.au/',
          tags: ['Blood cancer', 'Support'],
        },
      ],
    },
  ];

  const citations = [
    {
      category: 'Exercise & Physical Activity Guidance',
      icon: <Activity className="h-5 w-5 text-blue-600" />,
      sources: [
        {
          title: 'COSA Position Statement on Exercise in Cancer Care',
          description: 'Australian position statement supporting exercise as part of cancer care, with activity individualised to the person, their treatment, and current capacity.',
          url: 'https://www.cosa.org.au/groups/exercise-cancer-care/position-statement/',
        },
        {
          title: 'ESSA Consensus Statement - Exercise & Cancer',
          description: 'Professional guidance on individualising exercise for people affected by cancer, including aerobic and resistance activity.',
          url: 'https://www.essa.org.au/Public/Public/News/ESSA_Position_Statement_on_Exercise_and_Cancer.aspx',
        },
        {
          title: 'Cancer Council Australia - Cancer-Related Fatigue',
          description: 'Current Australian guidance explaining cancer-related fatigue and practical management approaches, including activity, pacing, nutrition, and clinical review when needed.',
          url: 'https://www.cancer.org.au/cancer-information/screening-tests-and-treatments/cancer-side-effects/fatigue',
        },
        {
          title: 'Cancer Council Australia - Exercise & Cancer',
          description: 'Patient-facing information about exercise during and after cancer treatment, with activity adjusted to symptoms, capacity, and advice from the treating team.',
          url: 'https://connect.cancer.org.au/cancer-information/living-and-coping/exercise-for-people-with-cancer',
        },
        {
          title: 'Myeloma Australia - Exercise Info Sheet',
          description: 'Myeloma-specific information about movement, supervision, and bone-health considerations.',
          url: 'https://myeloma.org.au/resources/exercise-and-myeloma/',
        },
      ],
    },
    {
      category: 'Nutrition & Dietetics Guidance',
      icon: <Utensils className="h-5 w-5 text-orange-600" />,
      sources: [
        {
          title: 'Cancer Council Victoria - Nutrition for People Living with Cancer',
          description: 'Practical treatment-time nutrition information, including nourishing foods, maintaining intake, and managing common eating difficulties.',
          url: 'https://www.cancervic.org.au/get-support/nutrition-and-cancer',
        },
        {
          title: 'COSA Cancer-Related Malnutrition Toolkit',
          description: 'Clinical resources for recognising and managing cancer-related malnutrition and nutrition-impact symptoms.',
          url: 'https://www.cosa.org.au/groups/nutrition/malnutrition-toolkit/',
        },
        {
          title: 'ESPEN Practical Guideline: Clinical Nutrition in Cancer',
          description: 'Peer-reviewed clinical nutrition guidance covering energy, protein, and nutrition support during cancer care.',
          url: 'https://www.espen.org/guidelines-home/espen-guidelines',
        },
        {
          title: 'Peter MacCallum Cancer Centre Resources',
          description: 'Australian cancer nutrition information and practical resources for people experiencing treatment-related eating problems.',
          url: 'https://www.petermac.org/services/support-services/nutrition/nutrition-resources',
        },
      ],
    },
    {
      category: 'Movement, Rehabilitation & Safety',
      icon: <Heart className="h-5 w-5 text-rose-600" />,
      sources: [
        {
          title: 'Australian Physiotherapy Association (APA)',
          description: 'Professional physiotherapy information relevant to mobility, rehabilitation, symptom management, and recovery.',
          url: 'https://australian.physio/',
        },
        {
          title: 'Cancer Exercise Toolkit',
          description: 'Australian resources for adapting exercise to treatment effects, symptoms, functional capacity, and safety considerations.',
          url: 'https://cancerexercisetoolkit.org.au/',
        },
      ],
    },
    {
      category: 'Recent Research (2026)',
      icon: <BookOpen className="h-5 w-5 text-indigo-600" />,
      sources: [
        {
          title: 'Dai et al. (2026) - Exercise Dose and Cancer-Related Fatigue',
          description: 'Systematic review and dose-response network meta-analysis in breast cancer survivors after primary treatment. It suggests fatigue benefit varies by exercise dose and baseline fatigue, but certainty is low to very low, so the findings should not be treated as fixed targets.',
          url: 'https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2026.1795975/full',
        },
      ],
    },
  ];

  const articles = [
    {
      title: 'Managing Cancer-Related Fatigue',
      description: 'Cancer Council Australia guidance on cancer-related fatigue, practical management, pacing, activity, and when to speak with your treatment team.',
      url: 'https://www.cancer.org.au/cancer-information/screening-tests-and-treatments/cancer-side-effects/fatigue',
      cta: 'Read guide',
    },
    {
      title: 'Exercise Safety for Myeloma',
      description: 'Myeloma-specific considerations for bone health, supervision, and safe movement.',
      url: 'https://myeloma.org.au/resources/exercise-and-myeloma/',
      cta: 'Read article',
    },
    {
      title: 'Nutrition During Treatment',
      description: 'Practical information for appetite changes, nausea, taste changes, and maintaining nutrition during treatment.',
      url: 'https://www.cancervic.org.au/get-support/nutrition-and-cancer',
      cta: 'View resources',
    },
    {
      title: 'Mental Health & Cancer',
      description: 'Information about the emotional impact of cancer and where to find psychological support in Australia.',
      url: 'https://www.beyondblue.org.au/the-facts/cancer-and-mental-health',
      cta: 'Access support',
    },
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="rounded-r-xl border-l-4 border-amber-400 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            <strong>Using Fit for Cancer:</strong> This app provides evidence-informed self-management support. Your fatigue check-in helps organise content by your current energy; it is not a diagnosis, clinical triage tool, or treatment prescription. If you develop new or worsening symptoms, or are unsure what is safe for you, contact your treating team.
          </p>
        </div>
      </div>

      <header className="rounded-2xl bg-slate-900 p-8 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-neon-blue" />
          <h1 className="text-3xl font-bold">Evidence & Resources</h1>
        </div>
        <p className="max-w-2xl opacity-80">
          These are the Australian guidance, support services, and research sources used to inform Fit for Cancer&apos;s movement, nutrition, fatigue-support, and assistant content. We link to the source material so you can see where the information comes from and explore it in more detail.
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-300">Evidence reviewed: August 2026</p>
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
          {supportResources.map((section) => (
            <div key={section.category} className="p-6">
              <div className="mb-4 flex items-center gap-2">
                {section.icon}
                <h3 className="text-sm font-semibold text-slate-900">{section.category}</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {section.items.map((item) => (
                  <a
                    key={item.title}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${item.title} resource (opens in new tab)`}
                    className={`group flex h-full flex-col rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow transition-transform transition-colors hover:border-neon-blue/30 hover:bg-white ${INTERACTIVE_FOCUS_CLASS}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <h4 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-neon-blue">{item.title}</h4>
                      <span className="rounded-lg bg-white p-1.5 text-slate-400 transition-colors group-hover:bg-neon-blue/10 group-hover:text-neon-blue">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mb-3 flex-grow text-xs leading-relaxed text-slate-600">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded border border-slate-100 bg-white px-2 py-1 text-xs font-medium text-slate-500">
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
            Need Cancer Council support? Call{' '}
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
              Cancer treatment can make energy unpredictable. The traffic-light system is a simple way to organise movement and food ideas around how you feel today, without pretending a single score can explain everything happening in your body.
            </p>

            <h3 className="mb-3 text-lg font-bold text-slate-900">Why the Traffic Light System?</h3>
            <p className="mb-4 text-slate-600">
              You rate your fatigue from 0-10. Fit for Cancer uses that self-reported check-in to prioritise content with a matching effort level. You can update the score or view another zone whenever you want.
            </p>

            <ul className="mb-8 space-y-4">
              <li className="flex gap-3">
                <span className="text-xl">🟢</span>
                <div>
                  <strong className="text-slate-900">Green (Score 0-3):</strong>
                  <p className="text-slate-600">Lower fatigue today. The app surfaces more active movement and standard-prep food ideas.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🟡</span>
                <div>
                  <strong className="text-slate-900">Yellow (Score 4-6):</strong>
                  <p className="text-slate-600">Moderate fatigue. The emphasis shifts toward shorter movement, easier preparation, and conserving some energy for the rest of your day.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🔴</span>
                <div>
                  <strong className="text-slate-900">Red (Score 7-10):</strong>
                  <p className="text-slate-600">Higher fatigue. The app prioritises restorative or very low-effort movement and food options that require little preparation.</p>
                </div>
              </li>
            </ul>

            <h3 className="mb-3 text-lg font-bold text-slate-900">What the system does:</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="mb-2 font-bold text-slate-900">Lower-effort first</h4>
                <p className="text-sm text-slate-600">When fatigue is high, lower-effort options are surfaced first rather than asking you to push through.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="mb-2 font-bold text-slate-900">Treatment-aware nutrition</h4>
                <p className="text-sm text-slate-600">Recipe cards include practical side-effect notes and direct links to the guidance that informed them.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="mb-2 font-bold text-slate-900">You stay in control</h4>
                <p className="text-sm text-slate-600">The score is a filter, not a verdict. You can change it, browse other zones, or choose an option that better matches how you feel.</p>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="How Fit for Cancer Uses Evidence"
          icon={<Stethoscope className="h-6 w-6 text-blue-600" />}
        >
          <div className="prose prose-slate max-w-none">
            <p className="mb-6 italic text-slate-600">A technical overview for clinicians, allied health professionals, and anyone who wants to understand how the app translates evidence into content.</p>

            <h3 className="mb-3 text-lg font-bold text-slate-900">Evidence translation, not clinical triage</h3>
            <p className="mb-6 text-slate-600">
              Fit for Cancer uses a simple 0-10 self-reported fatigue check-in to organise content into three effort bands. It does not use that score to diagnose a condition, determine clinical severity, or make treatment decisions.
            </p>

            <div className="space-y-6">
              <section>
                <h4 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">1</span>
                  Movement content
                </h4>
                <ul className="list-disc space-y-2 pl-10 text-slate-600">
                  <li>Movement ideas are grouped by relative effort, with lower-effort seated, supine, breathing, and mobility options prioritised on higher-fatigue days.</li>
                  <li>Published Australian exercise-oncology guidance informs the overall direction, while individual movement claims and safety notes are reviewed separately against their sources.</li>
                </ul>
              </section>

              <section>
                <h4 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">2</span>
                  Nutrition content
                </h4>
                <ul className="list-disc space-y-2 pl-10 text-slate-600">
                  <li>Food ideas are organised around preparation effort, protein and energy density, hydration, and common treatment-related eating difficulties.</li>
                  <li>Recipe cards include source links and treatment-side-effect notes where a food may not suit everyone, rather than presenting any recipe as a treatment.</li>
                </ul>
              </section>

              <section>
                <h4 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">3</span>
                  Safety boundaries
                </h4>
                <ul className="list-disc space-y-2 pl-10 text-slate-600">
                  <li>The app highlights situations where symptoms, bone-health concerns, treatment effects, or uncertainty should prompt input from the treating team or an appropriate allied health professional.</li>
                  <li>Evidence links are shown openly so users and clinicians can check the source material rather than relying on an unexplained recommendation.</li>
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
            {articles.map((article) => (
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
              <p><strong className="text-slate-900">1. No account required; core check-in data stays in your browser</strong></p>
              <p>Fit for Cancer does not require a user account. Your fatigue score and zone, cancer-type context, daily check-in flag, and Energy Bank history are stored in browser storage on this device rather than in a Fit for Cancer user database. Cancer-type context expires after 14 days. Energy Bank history keeps up to 30 check-ins until you clear it. Closing the browser does not necessarily remove this saved browser data.</p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">2. ATHENA messages are processed by Google Gemini</strong></p>
              <p>When you use ATHENA, your message and the current check-in context needed to answer it are sent through Fit for Cancer&apos;s server endpoint to the Google Gemini API. The project uses a billing-enabled paid Gemini API service. Under Google&apos;s current paid-service data terms, prompts and responses are not used to improve Google products by default.</p>
              <p>Fit for Cancer configures Gemini API project logs for a 14-day retention period. These logs may be reviewed by the operator to evaluate ATHENA&apos;s quality and safety, troubleshoot problems, and improve how the assistant performs, and they can be deleted from project storage. Fit for Cancer does not attach a user account, name, or email address to an ATHENA request because the app does not collect those fields. Health information is still sensitive and is processed by an external AI provider, so avoid adding names, contact details, or other identifying information that is not needed for your question.</p>
              <p className="flex flex-wrap gap-x-4 gap-y-2">
                <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-neon-blue hover:underline">Gemini API terms <ExternalLink className="inline h-3 w-3" /></a>
                <a href="https://ai.google.dev/gemini-api/docs/logs-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-neon-blue hover:underline">Gemini logging & retention <ExternalLink className="inline h-3 w-3" /></a>
              </p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">3. Voice dictation uses your browser&apos;s speech-recognition feature</strong></p>
              <p>Fit for Cancer uses the browser Web Speech interface for dictation. The app does not separately save an audio recording or upload an audio file to the Fit for Cancer backend. Whether speech recognition happens entirely on your device or uses a browser, operating-system, or provider service depends on the browser and device you are using, so it should not be described as guaranteed local-only processing.</p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">4. Privacy-focused usage analytics</strong></p>
              <p>From September 2026, Fit for Cancer uses GoatCounter to understand which pages and features people use. Aggregate events include visits to Movement, Nutrition, Energy Bank and ATHENA, recipe opens, ATHENA message and check-in counts, and an optional cancer category when you explicitly select one.</p>
              <p>We do not send fatigue scores or zones, Energy Bank history, Quick Notes, ATHENA conversation content, or other treatment context to GoatCounter. A cancer category recognised from free-text chat is not sent to analytics.</p>
              <p className="flex flex-wrap gap-x-4 gap-y-2">
                <a href="https://www.goatcounter.com/help/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-neon-blue hover:underline">GoatCounter privacy <ExternalLink className="inline h-3 w-3" /></a>
              </p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">5. Data minimisation</strong></p>
              <p>Health-related information deserves extra care. Fit for Cancer is designed to ask for only the context needed to organise its content and generate an assistant response, and to keep the core check-in history in your browser. This disclosure is intended to explain the app&apos;s actual data flow clearly rather than make a broad claim about legal or regulatory status.</p>
            </section>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-slate-500" aria-live="polite">
                  {hasClearedSavedData
                    ? 'Saved browser data cleared.'
                    : 'Clear your saved fatigue score and zone, cancer-type context, daily check-in flag, and Energy Bank history from this browser.'}
                </p>
                <button
                  type="button"
                  onClick={handleClearSavedData}
                  disabled={hasClearedSavedData}
                  className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-shadow transition-transform transition-colors hover:border-rose-300 hover:text-rose-600 disabled:cursor-default disabled:opacity-60 ${INTERACTIVE_FOCUS_CLASS}`}
                >
                  {hasClearedSavedData ? 'Saved Data Cleared' : 'Clear Saved Browser Data'}
                </button>
              </div>
            </div>
          </div>
        </CollapsibleCard>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {citations.map((section) => (
          <section key={section.category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
              {section.icon}
              <h2 className="text-base font-semibold text-slate-900">{section.category}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {section.sources.map((source) => (
                <a
                  key={source.title}
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
                    <span className="rounded-lg bg-slate-100 p-2 text-slate-400 transition-colors group-hover:bg-neon-blue/10 group-hover:text-neon-blue">
                      <ExternalLink className="h-5 w-5" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
          <ShieldAlert className="h-5 w-5 text-slate-600" />
          Using Fit for Cancer safely
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p>
            Fit for Cancer is an evidence-informed support tool, not a replacement for individualised medical, exercise physiology, physiotherapy, or dietetic care. Use the ideas here alongside the advice you receive from your treating team.
          </p>
          <p>
            If something feels wrong, symptoms are new or worsening, or your treatment team has given you specific restrictions, follow their advice and seek appropriate clinical support rather than relying on the app.
          </p>
        </div>
      </div>

      <SupportThisApp />
    </div>
  );
};

export default Resources;
