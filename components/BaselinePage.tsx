import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, RotateCcw, Send, SlidersHorizontal, Sparkles, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createAuthClient } from '@neondatabase/auth';

type Settings = { warmth: 'low' | 'balanced' | 'high'; responseLength: 'concise' | 'balanced' | 'detailed'; clarifyTendency: 'ask_when_needed' | 'prefer_direct'; suggestionCount: 1 | 2 | 3; extraGuidance: string };
type HistoryEntry = { id?: string; version?: number; createdAt?: string; publishedAt?: string; author?: string; authorEmail?: string; action?: string; summary?: string; settings?: Settings };
type PreviewResult = { title?: string; text?: string; recommendations?: Array<{ kind?: string; id?: string; title?: string }>; scenario?: string; settings?: Settings; [key: string]: unknown };
const DEFAULT_SETTINGS: Settings = { warmth: 'balanced', responseLength: 'balanced', clarifyTendency: 'ask_when_needed', suggestionCount: 3, extraGuidance: '' };
const scenarios = [
  { id: 'fatigue7-movement', title: 'Movement when fatigue is 7/10', note: 'Checks for a gentle suggestion without an unnecessary preference question.' },
  { id: 'low-energy-meal', title: 'A low-energy meal idea', note: 'Checks that advice stays practical and easy to act on.' },
  { id: 'general-chat', title: 'Everyday support', note: 'Checks warmth, length and clarifying questions.' },
] as const;
const controlClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[color:var(--color-text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const createBaselineAuthClient = (url: string) => createAuthClient(url);
type AuthClient = ReturnType<typeof createBaselineAuthClient>;
class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
async function request<T>(url: string, init?: RequestInit, authClient?: AuthClient): Promise<T> {
  const tokenResult = authClient ? await authClient.token() : null;
  const token = tokenResult?.data?.token;
  if (authClient && (!token || tokenResult?.error)) throw new Error('Your session has expired. Sign in again.');
  const response = await fetch(url, { ...init, credentials: 'same-origin', headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body?.error || (response.status === 401 ? 'Your session has expired. Sign in again.' : 'That action could not be completed. Please try again.'), response.status);
  return body as T;
}
const pretty = (value: unknown) => typeof value === 'string' ? value : JSON.stringify(value, null, 2);

const BaselinePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [linkSent, setLinkSent] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<(typeof scenarios)[number]['id']>('fatigue7-movement');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadConfig = useCallback(async (client: AuthClient) => {
    const data = await request<{ draft?: Settings; published?: Settings; history?: HistoryEntry[] }>('/api/baseline', undefined, client);
    const draft = data.draft || data.published || DEFAULT_SETTINGS;
    setSettings({ ...DEFAULT_SETTINGS, ...draft }); setSavedSettings({ ...DEFAULT_SETTINGS, ...draft }); setHistory(data.history || []);
  }, []);
  useEffect(() => {
    let active = true;
    request<{ url?: string }>('/api/baseline-auth?action=config')
      .then(async config => {
        if (!config.url) throw new Error('Private sign-in is not configured yet. Please try again later.');
        const client = createBaselineAuthClient(config.url);
        if (!active) return;
        setAuthClient(client);
        const session = await client.getSession();
        const sessionData = session.data as { user?: { email?: string }; session?: { user?: { email?: string } } } | null;
        const sessionUser = sessionData?.user || sessionData?.session?.user;
        if (session.error) throw new Error(session.error.message || 'Unable to check your sign-in.');
        setUser(sessionUser?.email || null);
        if (sessionUser?.email) await loadConfig(client);
      })
      .catch(e => { if (active) { setUser(null); if (e instanceof ApiError && e.status === 403) { setAccessDenied(true); setError('Access is not available for this account.'); } else setError(e.message); } })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, [loadConfig]);
  const run = async (label: string, operation: () => Promise<void>) => {
    setBusy(label); setError(''); setNotice('');
    try { await operation(); } catch (e) { const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.'; if (e instanceof ApiError && e.status === 403) { setAccessDenied(true); setUser(null); } if (message.includes('session has expired')) setUser(null); setError(e instanceof ApiError && e.status === 403 ? 'Access is not available for this account.' : message); }
    finally { setBusy(''); }
  };
  const sendLink = () => run('link', async () => { await request('/api/baseline-auth', { method: 'POST', body: JSON.stringify({ action: 'magicLink', email: email.trim() }) }); setLinkSent(true); setNotice('If this address is authorised, a sign-in link is on its way.'); });
  const signOut = () => run('signout', async () => { if (!authClient) return; const result = await authClient.signOut(); if (result.error) throw new Error(result.error.message || 'Unable to sign out.'); setUser(null); setAccessDenied(false); setPreview(null); setLinkSent(false); setNotice('You have signed out.'); });
  const saveDraft = () => run('save', async () => { await request('/api/baseline', { method: 'PUT', body: JSON.stringify({ action: 'saveDraft', settings }) }, authClient || undefined); setSavedSettings(settings); setNotice('Draft saved. Visitors are still using the published version.'); if (authClient) await loadConfig(authClient); });
  const runPreview = () => run('preview', async () => { const result = await request<PreviewResult>('/api/baseline', { method: 'POST', body: JSON.stringify({ action: 'preview', scenario: selectedScenario, settings }) }, authClient || undefined); setPreview(result); });
  const publish = () => run('publish', async () => { await request('/api/baseline', { method: 'POST', body: JSON.stringify({ action: 'publish', settings }) }, authClient || undefined); setNotice('Draft published. ATHENA will use it for new conversations.'); if (authClient) await loadConfig(authClient); });
  const rollback = () => run('rollback', async () => { await request('/api/baseline', { method: 'POST', body: JSON.stringify({ action: 'rollback' }) }, authClient || undefined); setNotice('Previous published version restored.'); if (authClient) await loadConfig(authClient); });

  return <div className="min-h-screen bg-[color:var(--color-bg)] px-4 py-6 sm:px-8 sm:py-10"><div className="mx-auto max-w-4xl">
    <header className="mb-8 flex items-center justify-between gap-4"><Link to="/" className={`${buttonClass} bg-white text-[color:var(--color-text)] shadow-sm`}><ArrowLeft size={16} /> Back to Fit For Cancer</Link>{user && <button type="button" onClick={signOut} disabled={!!busy} className={`${buttonClass} bg-stone-200 text-stone-800`}><LogOut size={16} /> Sign out</button>}</header>
    <div className="mb-7"><div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--color-primary)]"><SlidersHorizontal size={16} /> ATHENA</div><h1 className="text-3xl font-bold sm:text-4xl">Conversation tuning</h1><p className="mt-2 max-w-2xl text-[color:var(--color-text-muted)]">Adjust the tone and shape of ATHENA’s replies, test a few synthetic examples, then publish when the draft feels right.</p></div>
    {!authChecked ? <div className="rounded-2xl border border-stone-200 bg-white p-6 text-stone-600">Checking your sign-in…</div> : accessDenied ? <section className="max-w-xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-bold">Access unavailable</h2><p className="mt-2 text-sm text-stone-600">This signed-in account does not have access to private tuning.</p><button type="button" onClick={signOut} disabled={!!busy} className={`${buttonClass} mt-5 bg-stone-100 text-stone-800`}><LogOut size={16} /> Sign out</button></section> : !user ? <section className="max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-bold">Sign in</h2><p className="mt-1 text-sm text-stone-600">Enter your authorised email address to receive a one-time sign-in link.</p><form className="mt-5" onSubmit={e => { e.preventDefault(); void sendLink(); }}><label className="block text-sm font-semibold" htmlFor="baseline-email">Email address</label><input id="baseline-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={controlClass} placeholder="you@example.com" /><button type="submit" disabled={!!busy} className={`${buttonClass} mt-4 w-full bg-[color:var(--color-nav)] text-white`}>{busy === 'link' ? 'Sending…' : <><Send size={16} /> Send sign-in link</>}</button></form>{linkSent && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Check your inbox for a sign-in link. This page will be ready after you return.</p>}</section> : <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"><span className="flex items-center gap-2"><Check size={16} /> Signed in as <strong>{user}</strong></span><span className="text-emerald-800">Draft changes stay private until published.</span></div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-bold">Draft settings</h2><p className="mt-1 text-sm text-stone-600">Small adjustments to how ATHENA responds.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Warmth<select className={controlClass} value={settings.warmth} onChange={e => setSettings({ ...settings, warmth: e.target.value as Settings['warmth'] })}><option value="low">Reserved</option><option value="balanced">Warm and steady</option><option value="high">Very warm</option></select></label>
          <label className="text-sm font-semibold">Response length<select className={controlClass} value={settings.responseLength} onChange={e => setSettings({ ...settings, responseLength: e.target.value as Settings['responseLength'] })}><option value="concise">Concise</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label>
          <label className="text-sm font-semibold">Clarifying questions<select className={controlClass} value={settings.clarifyTendency} onChange={e => setSettings({ ...settings, clarifyTendency: e.target.value as Settings['clarifyTendency'] })}><option value="prefer_direct">Prefer a useful direct answer</option><option value="ask_when_needed">Ask when needed</option></select></label>
          <label className="text-sm font-semibold">Suggestions per reply<select className={controlClass} value={settings.suggestionCount} onChange={e => setSettings({ ...settings, suggestionCount: Number(e.target.value) as Settings['suggestionCount'] })}><option value={1}>1 suggestion</option><option value={2}>2 suggestions</option><option value={3}>3 suggestions</option></select></label>
        </div>
        <label htmlFor="extra-guidance" className="mt-5 block text-sm font-semibold">Short supplementary guidance <span className="font-normal text-stone-500">(optional)</span></label><textarea id="extra-guidance" rows={3} maxLength={500} value={settings.extraGuidance} onChange={e => setSettings({ ...settings, extraGuidance: e.target.value })} className={controlClass} placeholder="A brief conversational preference" /><div className="mt-1 text-right text-xs text-stone-500">{settings.extraGuidance.length}/500</div>
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={!!busy} onClick={saveDraft} className={`${buttonClass} bg-[color:var(--color-nav)] text-white`}>{busy === 'save' ? 'Saving…' : 'Save draft'}</button><button type="button" disabled={!!busy} onClick={publish} className={`${buttonClass} bg-[color:var(--color-accent)] text-[color:var(--color-nav)]`}>{busy === 'publish' ? 'Publishing…' : 'Publish draft'}</button></div><p className="mt-3 text-xs text-stone-500">Last saved controls are {JSON.stringify(settings) === JSON.stringify(savedSettings) ? 'up to date' : 'different from this draft'}.</p>
      </section><section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="flex items-center gap-2 text-xl font-bold"><Sparkles size={19} className="text-[color:var(--color-primary)]" /> Try a synthetic conversation</h2><p className="mt-1 text-sm text-stone-600">Previews use example scenarios and never include visitor conversations.</p><label className="mt-5 block text-sm font-semibold">Example<select className={controlClass} value={selectedScenario} onChange={e => setSelectedScenario(e.target.value as typeof selectedScenario)}>{scenarios.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label><p className="mt-2 min-h-10 text-sm text-stone-600">{scenarios.find(s => s.id === selectedScenario)?.note}</p><button type="button" disabled={!!busy} onClick={runPreview} className={`${buttonClass} mt-3 w-full bg-stone-100 text-stone-900`}>{busy === 'preview' ? 'Generating preview…' : 'Preview draft'}</button>{preview && <div className="mt-5 max-h-[34rem] overflow-auto rounded-xl border border-stone-200 bg-stone-50 p-4"><div className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Synthetic preview</div><div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-800">{preview.title && <h3 className="mb-2 font-bold">{preview.title}</h3>}{preview.text || pretty(preview)}{Array.isArray(preview.recommendations) && preview.recommendations.length > 0 && <div className="mt-4 border-t border-stone-200 pt-3"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">Recommendations</div><ul className="list-inside list-disc">{preview.recommendations.map((item, index) => <li key={`${item.kind || item.id || 'item'}-${index}`}>{item.title || item.kind || 'Suggestion'}{!item.title && item.id ? ` · ${item.id}` : ''}</li>)}</ul></div>}</div></div>}</section></div>
      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">Published versions</h2><p className="mt-1 text-sm text-stone-600">Review recent changes and restore the previous published settings.</p></div><button type="button" disabled={!!busy || history.length < 2} onClick={rollback} className={`${buttonClass} bg-stone-100 text-stone-800`}>{busy === 'rollback' ? 'Restoring…' : <><RotateCcw size={16} /> Restore previous</>}</button></div>{history.length ? <ul className="mt-5 divide-y divide-stone-100">{history.slice(0, 8).map((item, index) => <li key={item.id || item.version || index} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm"><div><div className="font-semibold">{item.summary || `${item.action === 'rollback' ? 'Rollback' : 'Published'} version ${item.version ?? history.length - index}`}</div><div className="mt-1 text-stone-500">{item.author || item.authorEmail || 'Author'}{(item.publishedAt || item.createdAt) && ` · ${new Date(item.publishedAt || item.createdAt!).toLocaleString()}`}</div></div>{index === 0 && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">Current</span>}</li>)}</ul> : <div className="mt-5 rounded-xl bg-stone-50 px-4 py-5 text-sm text-stone-600">No published history yet.</div>}</section>
    </>}
    {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-5 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{error || notice}</div>}
    <footer className="mt-8 text-xs text-stone-500">Private settings page · <Clock3 className="inline h-3 w-3" /> Changes only affect ATHENA after publication</footer>
  </div></div>;
};
export default BaselinePage;
