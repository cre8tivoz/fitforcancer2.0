import { useState, useEffect, useCallback } from 'react';
import { AppTab } from '../types';

const TAB_PATHS: Record<AppTab, string> = {
  [AppTab.HOME]: '/',
  [AppTab.EXERCISE]: '/exercise',
  [AppTab.NUTRITION]: '/nutrition',
  [AppTab.ENERGY_BANK]: '/energy-bank',
  [AppTab.ASSISTANT]: '/assistant',
  [AppTab.RESOURCES]: '/resources',
};

const getTabFromLocation = (): AppTab => {
  if (typeof window === 'undefined') return AppTab.HOME;
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/exercise') return AppTab.EXERCISE;
  if (normalizedPath === '/nutrition') return AppTab.NUTRITION;
  if (normalizedPath === '/energy-bank') return AppTab.ENERGY_BANK;
  if (normalizedPath === '/assistant') return AppTab.ASSISTANT;
  if (normalizedPath === '/resources') return AppTab.RESOURCES;
  return AppTab.HOME;
};

export function useTabRoute() {
  const [activeTab, setActiveTab] = useState<AppTab>(() => getTabFromLocation());

  useEffect(() => {
    const handlePopState = () => setActiveTab(getTabFromLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const changeTab = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    const path = TAB_PATHS[tab];
    if (typeof window !== 'undefined' && window.location.pathname !== path && window.location.pathname !== '/why-free') {
      window.history.pushState({ tab }, '', path);
    }
  }, []);

  return { activeTab, changeTab };
}
