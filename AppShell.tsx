import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AppTab } from './types';
import BrandLockup from './components/BrandLockup';
import { BookOpen, Globe, House, Dumbbell, UtensilsCrossed, MessageSquare, ChartColumnIncreasing, CheckCircle2, X } from 'lucide-react';

interface TabButtonProps {
  href: string;
  active: boolean;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
}

const TabButton = ({ href, active, onClick, children }: TabButtonProps) => (
  <a
    href={href}
    onClick={(event) => {
      if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onClick(event);
      }
    }}
    aria-current={active ? 'page' : undefined}
    className={`inline-flex min-h-11 items-center px-4 py-2 rounded-full text-sm font-semibold transition-all ${active ? 'bg-neon-blue text-neon-dark shadow-lg shadow-neon-blue/20' : 'text-white/75 hover:text-white hover:bg-white/10'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]`}
  >
    {children}
  </a>
);

interface MobileTabButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const MobileTabButton = ({ label, icon, active, onClick }: MobileTabButtonProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-neon-blue' : 'text-white/50 grayscale'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[10px] font-bold uppercase tracking-tighter text-white">{label}</span>
  </button>
);

const CONTROL_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-nav)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]';

interface AppShellProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: React.ReactNode;
}

const TAB_PATHS: Record<AppTab, string> = {
  [AppTab.HOME]: '/',
  [AppTab.EXERCISE]: '/exercise',
  [AppTab.NUTRITION]: '/nutrition',
  [AppTab.ENERGY_BANK]: '/energy-bank',
  [AppTab.ASSISTANT]: '/assistant',
  [AppTab.RESOURCES]: '/resources',
};

const ShieldAlert: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 sm:px-6 pb-20 sm:pb-6">
      <nav className="sticky top-0 z-50 py-4 bg-[color:var(--color-nav)] backdrop-blur-md flex justify-between items-center px-4 sm:px-8 border-b border-white/10">
        <a
          href={TAB_PATHS[AppTab.HOME]}
          onClick={(event) => {
            if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
              event.preventDefault();
              onTabChange(AppTab.HOME);
            }
          }}
          aria-current={activeTab === AppTab.HOME ? 'page' : undefined}
          className={`flex items-center gap-3 group ${CONTROL_FOCUS_CLASS}`}
        >
          <BrandLockup compact variant="dark" className="h-10 w-auto transition-transform group-hover:scale-[1.02]" />
        </a>
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 hidden sm:flex">
          {([AppTab.HOME, AppTab.EXERCISE, AppTab.NUTRITION, AppTab.ENERGY_BANK, AppTab.ASSISTANT, AppTab.RESOURCES] as const).map((tab) => (
            <TabButton key={tab} href={TAB_PATHS[tab]} active={activeTab === tab} onClick={() => onTabChange(tab)}>
              {tab === AppTab.HOME && 'Home'}
              {tab === AppTab.EXERCISE && 'Exercise'}
              {tab === AppTab.NUTRITION && 'Nutrition'}
              {tab === AppTab.ENERGY_BANK && 'Energy Bank'}
              {tab === AppTab.ASSISTANT && 'AI Chat'}
              {tab === AppTab.RESOURCES && 'Resources'}
            </TabButton>
          ))}
        </div>
      </nav>

      <main className="flex-1 py-4">{children}</main>

      <footer className="mt-12 mb-24 sm:mb-8 p-8 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          <BrandLockup variant="light" className="w-64 max-w-full h-auto" />
          <div className="text-center space-y-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TGA Compliance & Clinical Safety</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Important Medical Disclaimer:</strong> This application is designed to <strong>complement</strong>, rather than replace, professional medical advice. Always consult your <strong>medical oncologist, haematologist, or specialised physiotherapist</strong> before starting new exercise routines.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => onTabChange(AppTab.RESOURCES)}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:border-neon-blue hover:text-neon-blue transition-all shadow-sm uppercase tracking-wider ${CONTROL_FOCUS_CLASS}`}
              >
                <BookOpen className="w-3 h-3" />
                View Evidence Base & Resources
              </button>
              <div className="pt-4 border-t border-slate-200 w-full max-w-xs">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Copyright 2026.{' '}
                  <a href="https://jaquescreative.com/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-neon-pink transition-colors">
                    jaques creative
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setIsAccessibilityModalOpen(true)}
              className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-700 ${CONTROL_FOCUS_CLASS}`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Committed to WCAG 2.2 AA Accessibility</span>
            </button>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 bg-[color:var(--color-surface)]/95 backdrop-blur-md border-t border-[color:var(--color-primary)]/10 px-4 py-3 flex justify-between sm:hidden z-50 shadow-[0_-10px_30px_-18px_rgba(26,40,33,0.35)]">
        {([
          { tab: AppTab.HOME, label: 'Home', icon: House },
          { tab: AppTab.EXERCISE, label: 'Move', icon: Dumbbell },
          { tab: AppTab.NUTRITION, label: 'Eat', icon: UtensilsCrossed },
          { tab: AppTab.ENERGY_BANK, label: 'Trends', icon: ChartColumnIncreasing },
          { tab: AppTab.ASSISTANT, label: 'Chat', icon: MessageSquare },
          { tab: AppTab.RESOURCES, label: 'Resources', icon: BookOpen },
        ] as const).map(({ tab, label, icon: Icon }) => (
          <MobileTabButton
            key={tab}
            label={label}
            icon={<Icon className="w-4 h-4" />}
            active={activeTab === tab}
            onClick={() => onTabChange(tab)}
          />
        ))}
      </div>

      {isAccessibilityModalOpen && <AccessibilityModal onClose={() => setIsAccessibilityModalOpen(false)} />}
    </div>
  );
}

function AccessibilityModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 py-6"
      onClick={onClose}
    >
      <motion.div
        id="accessibility-statement-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-statement-title"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              <Globe className="h-3.5 w-3.5" />
              Accessibility Statement
            </span>
            <div>
              <h2 id="accessibility-statement-title" className="text-2xl font-bold text-slate-900">
                Our accessibility commitment
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Fit For Cancer is designed to meet WCAG 2.2 AA expectations and support Australian digital inclusion standards.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700" aria-label="Close accessibility statement">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-primary)]" />
            <p>We design mobile-first interfaces with readable typography, clear labels, and touch-friendly controls.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className={`inline-flex min-h-11 items-center rounded-2xl bg-[color:var(--color-nav)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-primary)] ${CONTROL_FOCUS_CLASS}`}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
