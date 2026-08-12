import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CalendarDays, NotebookText } from 'lucide-react';
import { EnergyHistoryEntry } from '../types';
import { getEnergyHistory } from '../utils/patientContextStorage';
import CaregiverExportButton from './CaregiverExportButton';

interface EnergyBankProps {
  refreshKey?: number;
  currentFatigueScore?: number | null;
}

const formatShortDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-AU', { month: 'short', day: 'numeric' }).format(new Date(isoDate));

const formatLongDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));

const getZoneLabel = (score: number): 'Green' | 'Yellow' | 'Red' => {
  if (score >= 7) return 'Red';
  if (score >= 4) return 'Yellow';
  return 'Green';
};

const getZoneToneClasses = (zone: 'Green' | 'Yellow' | 'Red') => {
  if (zone === 'Red') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  if (zone === 'Yellow') {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }

  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const EnergyBank: React.FC<EnergyBankProps> = ({ refreshKey = 0, currentFatigueScore }) => {
  const [history, setHistory] = useState<EnergyHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getEnergyHistory());
  }, [refreshKey]);

  const chartData = useMemo(
    () =>
      history.map((entry) => ({
        ...entry,
        shortDate: formatShortDate(entry.date),
      })),
    [history],
  );

  const recentEntries = useMemo(() => history.slice(-7), [history]);

  const summaryText = useMemo(() => {
    if (recentEntries.length === 0) {
      return 'No recent check-ins saved yet.';
    }

    const zoneCounts = recentEntries.reduce<Record<'Green' | 'Yellow' | 'Red', number>>(
      (accumulator, entry) => {
        const zone = getZoneLabel(entry.score);
        accumulator[zone] += 1;
        return accumulator;
      },
      { Green: 0, Yellow: 0, Red: 0 },
    );

    const dominantZone = (Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Yellow') as
      | 'Green'
      | 'Yellow'
      | 'Red';

    return `Last ${recentEntries.length} check-ins: mostly ${dominantZone} zone.`;
  }, [recentEntries]);

  if (history.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="rounded-3xl border border-[color:var(--color-primary)]/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[color:var(--color-accent)]/25 p-3 text-[color:var(--color-nav)]">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Energy Bank</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Track how your fatigue changes over time and keep a personal log you can share with your care team.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <NotebookText className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No check-ins saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">
            Your Energy Bank starts filling up as soon as you choose a fatigue score in ATHENA.
          </p>
        </section>
      </div>
    );
  }

  const latestEntry = history[history.length - 1];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="rounded-3xl border border-[color:var(--color-primary)]/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[color:var(--color-accent)]/25 p-3 text-[color:var(--color-nav)]">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Energy Bank</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Energy Bank keeps your latest 30 fatigue check-ins on this device. Adding another check-in after that removes the oldest entry; clearing your saved browser data removes the history.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Latest Score</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{latestEntry.score}/10</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Entries Saved</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{history.length}</p>
            </div>
            <CaregiverExportButton currentFatigueScore={currentFatigueScore ?? null} />
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">30-Day Fatigue Trend</h2>
            <p className="text-sm leading-6 text-slate-500">Scores run from 0 = no fatigue to 10 = worst fatigue, matching your traffic-light zones.</p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{summaryText}</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 8, left: -18, bottom: 8 }}
            >
              <defs>
                <linearGradient id="energyBankLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(82, 121, 111, 0.12)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="shortDate"
                tickLine={false}
                axisLine={false}
                minTickGap={18}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 10]}
                allowDecimals={false}
                tickCount={6}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  boxShadow: '0 16px 40px -24px rgba(15, 23, 42, 0.45)',
                }}
                labelFormatter={(_, payload) => {
                  const entry = payload?.[0]?.payload as EnergyHistoryEntry | undefined;
                  return entry ? formatLongDate(entry.date) : '';
                }}
                formatter={(value, _name, item) => {
                  const entry = item.payload as EnergyHistoryEntry;
                  return [
                    <div className="space-y-1" key={entry.id}>
                      <p className="text-xs font-bold text-slate-900">Score: {value}/10</p>
                      <p className="max-w-52 text-xs leading-5 text-slate-500">
                        {entry.note || 'No note saved for this check-in.'}
                      </p>
                    </div>,
                    'Fatigue',
                  ];
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="url(#energyBankLine)"
                strokeWidth={4}
                dot={{ r: 5, strokeWidth: 3, fill: '#FAF7F2', stroke: 'var(--color-primary)' }}
                activeDot={{ r: 8, strokeWidth: 3, fill: 'var(--color-accent)', stroke: 'var(--color-nav)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[color:var(--color-primary)]" />
          <h2 className="text-lg font-bold text-slate-900">History Log</h2>
        </div>

        <div className="max-h-[26rem] overflow-y-auto space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
          {[...history].reverse().map((entry) => {
            const zone = getZoneLabel(entry.score);
            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-medium leading-5 text-slate-500">{formatLongDate(entry.date)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex h-fit w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${getZoneToneClasses(zone)}`}>
                    {entry.score}/10
                  </span>
                  <span className="text-xs font-medium text-slate-500">{zone} zone</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {entry.note || 'No note saved.'}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default EnergyBank;
