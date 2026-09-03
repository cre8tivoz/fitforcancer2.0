import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  ChevronDown,
  CircleDollarSign,
  Code2,
  FileText,
  FlaskConical,
  Github,
  LockKeyhole,
  Map,
  MessageSquare,
  Mic,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  WandSparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AccordionItemProps = {
  id: string;
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  summary,
  isOpen,
  onToggle,
  children,
}) => {
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--color-nav)]"
      >
        <span className="min-w-0">
          <span className="block font-bold text-slate-900">{title}</span>
          {summary && <span className="mt-1 block text-sm leading-5 text-slate-500">{summary}</span>}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="border-t border-slate-100 px-5 py-5"
        >
          {children}
        </div>
      )}
    </div>
  );
};

type RoadmapItem = {
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
};

const RoadmapList: React.FC<{ items: RoadmapItem[] }> = ({ items }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {items.map(({ title, text, icon: Icon }) => (
      <article key={title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[color:var(--color-primary)] shadow-sm">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
          </div>
        </div>
      </article>
    ))}
  </div>
);

const BUILT_ITEMS: RoadmapItem[] = [
  {
    title: 'ATHENA rebuilt from the ground up',
    text: 'ATHENA is now the main conversational tool, with better reliability and stronger links to Movement and Nutrition.',
    icon: Sparkles,
  },
  {
    title: 'A rebuilt prompting brain',
    text: 'We rebuilt how ATHENA understands questions, keeps context and decides how to respond.',
    icon: Brain,
  },
  {
    title: 'Clearer language throughout the app',
    text: 'Clinical, legalistic and overly cautious wording has been rewritten to be easier to use when someone is tired or overwhelmed.',
    icon: MessageSquare,
  },
  {
    title: 'Evidence updated for 2026',
    text: 'Resources and supporting information have been reviewed and linked to current Australian sources wherever possible.',
    icon: BookOpen,
  },
  {
    title: 'Free for users',
    text: 'Fit For Cancer is locked in as a free, open-source project with no subscription or paid feature tier.',
    icon: LockKeyhole,
  },
  {
    title: 'Mobile-friendly design',
    text: 'ATHENA, navigation, forms and content have been rebuilt and hardened for smaller screens.',
    icon: Smartphone,
  },
  {
    title: 'Movement and Nutrition foundations',
    text: 'The Green, Yellow and Red system now supports movement ideas and recipes matched to different energy levels.',
    icon: Activity,
  },
  {
    title: 'Energy tracking',
    text: 'People can keep simple fatigue check-ins in their own browser without creating an account.',
    icon: BarChart3,
  },
];

const NEXT_ITEMS: RoadmapItem[] = [
  {
    title: 'More recipes',
    text: 'Add and improve Nutrition ideas across Green, Yellow and Red as the library matures.',
    icon: UtensilsCrossed,
  },
  {
    title: 'More movement options',
    text: 'Expand and refine exercises across each energy level, with better variety and clearer guidance.',
    icon: Activity,
  },
  {
    title: 'Better cards and easier screens',
    text: 'Keep refining the UX and UI of Movement, Nutrition and other key parts of the app.',
    icon: WandSparkles,
  },
  {
    title: 'Better navigation',
    text: 'Make it easier to move between ATHENA, Movement, Nutrition, Energy Bank and supporting information.',
    icon: Map,
  },
  {
    title: 'A more reliable ATHENA',
    text: 'Keep improving answer quality, recommendation reliability, failure handling and consistency.',
    icon: RefreshCw,
  },
  {
    title: 'Better hands-free use',
    text: 'Improve speech-to-text and other hands-free ways of using ATHENA.',
    icon: Mic,
  },
  {
    title: 'A better carer PDF',
    text: 'Keep improving the summary people can share with carers, family or their support network.',
    icon: FileText,
  },
  {
    title: 'Stability and reliability',
    text: 'Keep improving browser support, failure handling and the parts of the platform that simply need to work every time.',
    icon: ShieldCheck,
  },
];

const CRYSTAL_ITEMS: RoadmapItem[] = [
  {
    title: 'ATHENA as the centre of the app',
    text: 'Explore making ATHENA the main way people move through Fit For Cancer, with deeper Movement and Nutrition integration.',
    icon: Sparkles,
  },
  {
    title: 'Mobile app or stronger PWA',
    text: 'Explore whether Fit For Cancer should eventually feel more like an installed app.',
    icon: Smartphone,
  },
  {
    title: 'Lightweight accounts',
    text: 'Explore optional accounts for personalisation and continuity while keeping privacy central.',
    icon: LockKeyhole,
  },
  {
    title: 'Learning from app usage',
    text: 'Use privacy-respecting aggregate data to understand what people find useful and where the app needs more work.',
    icon: BarChart3,
  },
  {
    title: 'ATHENA Wrapped',
    text: 'Publish a lightweight annual snapshot of how the tool is used, what it costs to run and what the community is helping build.',
    icon: WandSparkles,
  },
  {
    title: 'Research collaboration',
    text: 'Explore ways aggregate findings could be useful to researchers without turning Fit For Cancer into a patient-data collection platform.',
    icon: FlaskConical,
  },
];

const MetricPlaceholder: React.FC<{ label: string; detail: string; icon: React.ComponentType<{ className?: string }> }> = ({
  label,
  detail,
  icon: Icon,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[color:var(--color-primary)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Collecting now
      </span>
    </div>
    <h3 className="mt-4 font-bold text-slate-900">{label}</h3>
    <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
  </article>
);

const ArrowConnector = () => (
  <span className="flex h-8 items-center justify-center text-slate-300" aria-hidden="true">
    <ArrowRight className="hidden h-4 w-4 sm:block" />
    <ArrowDown className="h-4 w-4 sm:hidden" />
  </span>
);

const DataRoadmapPage: React.FC = () => {
  const [openRoadmap, setOpenRoadmap] = useState<'built' | 'next' | 'crystal' | null>('built');
  const [openDataDetail, setOpenDataDetail] = useState<'count' | 'privacy' | 'costs' | null>(null);
  const [openAudience, setOpenAudience] = useState<'researchers' | 'developers' | null>(null);

  const toggleRoadmap = (section: 'built' | 'next' | 'crystal') => {
    setOpenRoadmap((current) => (current === section ? null : section));
  };

  const toggleDataDetail = (section: 'count' | 'privacy' | 'costs') => {
    setOpenDataDetail((current) => (current === section ? null : section));
  };

  const toggleAudience = (section: 'researchers' | 'developers') => {
    setOpenAudience((current) => (current === section ? null : section));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-1 py-8 sm:px-4 sm:py-10 animate-fade-in">
      <header className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Data & Roadmap
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Fit For Cancer, in the open</h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            A simple look at what people use, what we have built, and what we want to improve next.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['#data', 'By the numbers', 'What people are using'],
            ['#roadmap', 'Roadmap', 'Built, next and maybe later'],
            ['#wrapped', 'ATHENA Wrapped', 'Our annual snapshot'],
            ['#developers', 'Researchers & developers', 'Method, code and contribution'],
          ].map(([href, title, text]) => (
            <a
              key={href}
              href={href}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
            >
              <span className="block text-sm font-bold text-slate-900">{title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span>
            </a>
          ))}
        </div>
      </header>

      <nav
        aria-label="Data and Roadmap sections"
        className="sticky top-[72px] z-30 -mx-1 overflow-x-auto border-y border-slate-200 bg-white/95 px-1 py-2 backdrop-blur sm:mx-0 sm:rounded-full sm:border"
      >
        <div className="flex min-w-max gap-1 sm:justify-center">
          {[
            ['#data', 'Data'],
            ['#roadmap', 'Roadmap'],
            ['#wrapped', 'Wrapped'],
            ['#developers', 'Developers'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)]"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section id="data" className="scroll-mt-32 space-y-6" aria-labelledby="data-heading">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">By the numbers</p>
          <h2 id="data-heading" className="text-2xl font-bold text-slate-900">Real usage, once there is enough to show</h2>
          <p className="text-sm leading-6 text-slate-600">
            Analytics collection began in September 2026. Earlier Fit For Cancer usage is not included.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MetricPlaceholder label="ATHENA" detail="Visits, messages and repeat check-ins." icon={Sparkles} />
          <MetricPlaceholder label="Nutrition" detail="Recipe opens and the ideas people return to." icon={UtensilsCrossed} />
          <MetricPlaceholder label="Check-ins" detail="Aggregate use of the ATHENA-powered check-in." icon={RefreshCw} />
          <MetricPlaceholder label="Cancer categories" detail="Optional categories people explicitly select." icon={BarChart3} />
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-slate-900">Useful data, not personal profiles.</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                We collect aggregate usage. Fatigue scores, Energy Bank history, Quick Notes and ATHENA conversations are not sent to our analytics provider.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <AccordionItem
            id="data-counting"
            title="How we count this"
            summary="What the numbers will mean when they appear."
            isOpen={openDataDetail === 'count'}
            onToggle={() => toggleDataDetail('count')}
          >
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                Fit For Cancer counts page visits and a small number of feature interactions. Recipe opens are counted when someone chooses to view a recipe, not when a card happens to appear on screen.
              </p>
              <p>
                Cancer-category figures describe selections made in the app. They are not verified diagnoses, so public wording will say “people who selected” rather than claiming what every visitor has.
              </p>
            </div>
          </AccordionItem>

          <AccordionItem
            id="data-privacy"
            title="Privacy and limitations"
            summary="What we deliberately do not measure."
            isOpen={openDataDetail === 'privacy'}
            onToggle={() => toggleDataDetail('privacy')}
          >
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                GoatCounter receives aggregate usage events, not ATHENA message content, fatigue scores, Energy Bank entries, Quick Notes or a Fit For Cancer account identifier.
              </p>
              <p>
                Repeat check-in use is worked out in the browser and reported only as a milestone. Clearing browser data or changing device can reset that local count.
              </p>
              <Link to="/resources" className="inline-flex min-h-11 items-center font-semibold text-[color:var(--color-primary)] hover:underline">
                Read the privacy details →
              </Link>
            </div>
          </AccordionItem>

          <AccordionItem
            id="data-costs"
            title="Running costs"
            summary="A small transparency view, not an accounting report."
            isOpen={openDataDetail === 'costs'}
            onToggle={() => toggleDataDetail('costs')}
          >
            <div className="flex items-start gap-3 text-sm leading-6 text-slate-600">
              <CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              <p>
                We will add simple totals for AI inference, hosting and Ko-fi support once there is enough 2026 usage to make the figures useful.
              </p>
            </div>
          </AccordionItem>
        </div>
      </section>

      <section id="roadmap" className="scroll-mt-32 space-y-6" aria-labelledby="roadmap-heading">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">Roadmap</p>
          <h2 id="roadmap-heading" className="text-2xl font-bold text-slate-900">Built, next, and maybe later</h2>
          <p className="text-sm leading-6 text-slate-600">
            This is the public version: meaningful product work only, without ticket numbers or technical release notes.
          </p>
        </div>

        <div className="space-y-3">
          <AccordionItem
            id="roadmap-built"
            title="What we’ve built"
            summary="The major work already in Fit For Cancer."
            isOpen={openRoadmap === 'built'}
            onToggle={() => toggleRoadmap('built')}
          >
            <RoadmapList items={BUILT_ITEMS} />
          </AccordionItem>

          <AccordionItem
            id="roadmap-next"
            title="What’s next"
            summary="The work we expect to keep improving as the app matures."
            isOpen={openRoadmap === 'next'}
            onToggle={() => toggleRoadmap('next')}
          >
            <RoadmapList items={NEXT_ITEMS} />
          </AccordionItem>

          <AccordionItem
            id="roadmap-crystal"
            title="In the crystal ball 🔮"
            summary="Ideas worth exploring, not promises."
            isOpen={openRoadmap === 'crystal'}
            onToggle={() => toggleRoadmap('crystal')}
          >
            <RoadmapList items={CRYSTAL_ITEMS} />
          </AccordionItem>
        </div>
      </section>

      <section id="wrapped" className="scroll-mt-32" aria-labelledby="wrapped-heading">
        <div className="overflow-hidden rounded-3xl bg-[color:var(--color-nav)] p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-blue">Coming at the end of the year</p>
              <h2 id="wrapped-heading" className="text-3xl font-black tracking-tight">ATHENA WRAPPED 2026</h2>
              <p className="max-w-xl text-sm leading-6 text-white/70">
                A lightweight look at how Fit For Cancer was actually used — the recipes people opened, the conversations started, the things people came back for and what it cost to keep ATHENA running.
              </p>
            </div>
            <Sparkles className="h-8 w-8 shrink-0 text-neon-blue" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="developers" className="scroll-mt-32 space-y-6" aria-labelledby="developers-heading">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">Researchers & developers</p>
          <h2 id="developers-heading" className="text-2xl font-bold text-slate-900">Want to go deeper?</h2>
          <p className="text-sm leading-6 text-slate-600">
            The main page stays simple. Method, code and architecture live here for people who actually need them.
          </p>
        </div>

        <div className="space-y-3">
          <AccordionItem
            id="audience-researchers"
            title="For researchers"
            summary="Method, evidence, privacy and the questions we are interested in."
            isOpen={openAudience === 'researchers'}
            onToggle={() => toggleAudience('researchers')}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Usage data', 'What we measure, what the numbers mean and where they fall short.'],
                ['Evidence', 'Australian guidance and research used across Fit For Cancer.'],
                ['Privacy', 'What we collect, what we deliberately do not collect, and why.'],
                ['Open questions', 'Areas we would genuinely like to understand better as the app gets used.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-xl bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </AccordionItem>

          <AccordionItem
            id="audience-developers"
            title="For developers"
            summary="A short architecture view, the code and contribution links."
            isOpen={openAudience === 'developers'}
            onToggle={() => toggleAudience('developers')}
          >
            <div className="space-y-7">
              <p className="text-sm leading-6 text-slate-600">
                Fit For Cancer is an open-source web app. ATHENA is the conversational layer, while Fit For Cancer itself owns the Movement and Nutrition content, fatigue rules and recommendation logic.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/cre8tivoz/fitforcancer2.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  View the code
                </a>
                <a
                  href="https://github.com/cre8tivoz/fitforcancer2.0/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2"
                >
                  <Code2 className="h-4 w-4" aria-hidden="true" />
                  Contributor guide
                </a>
              </div>

              <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <figcaption className="mb-4 font-bold text-slate-900">How ATHENA works</figcaption>
                <div className="flex flex-col items-stretch gap-2 text-center text-xs font-semibold text-slate-700 sm:flex-row sm:items-center">
                  <div className="rounded-xl bg-white p-3 shadow-sm">You talk to ATHENA</div>
                  <ArrowConnector />
                  <div className="rounded-xl bg-white p-3 shadow-sm">ATHENA understands what you need</div>
                  <ArrowConnector />
                  <div className="grid gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">Conversation → ATHENA replies</div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">Movement → Fit For Cancer chooses</div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">Nutrition → Fit For Cancer chooses</div>
                  </div>
                </div>
              </figure>

              <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <figcaption className="mb-4 font-bold text-slate-900">Privacy boundary</figcaption>
                <div className="space-y-3 text-xs font-semibold text-slate-700">
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm">Your browser</div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                      Energy Bank history stays on your device
                    </div>
                    <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-center">
                      ATHENA question + current fatigue context → Fit For Cancer server → AI provider
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-center">
                      Anonymous usage events → GoatCounter
                    </div>
                  </div>
                </div>
              </figure>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900">Interested in helping?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  We are not actively recruiting a team, but we would like to hear from developers, designers and researchers who genuinely want to help. For now, the repository and contributor guide are the best starting points.
                </p>
              </div>
            </div>
          </AccordionItem>
        </div>
      </section>
    </div>
  );
};

export default DataRoadmapPage;
