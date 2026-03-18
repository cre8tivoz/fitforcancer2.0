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

interface EnergyBankProps {
  refreshKey?: number;
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

const EnergyBank: React.FC<EnergyBankProps> = ({ refreshKey = 0 }) => {
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
                Track how your energy changes over time and keep a personal log you can share with your care team.
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
            Your Energy Bank will start filling up after you choose a fatigue score and send your first Quick Note in
            the Health Assistant.
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
                A simple local record of your fatigue scores and Quick Notes. This stays on your device and is separate
                from the live clinical context used by the AI assistant.
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
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">30-Day Energy Trend</h2>
            <p className="text-sm leading-6 text-slate-500">Scores are plotted from 0 to 10 so your zones stay easy to read.</p>
          </div>
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
                        {entry.note || 'No Quick Note saved for this check-in.'}
                      </p>
                    </div>,
                    'Energy',
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

        <div className="max-h-[26rem] overflow-y-auto rounded-2xl border border-slate-100">
          <div className="grid grid-cols-[110px_72px_minmax(0,1fr)] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            <span>Date</span>
            <span>Score</span>
            <span>Quick Note</span>
          </div>
          <div className="divide-y divide-slate-100">
            {[...history].reverse().map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[110px_72px_minmax(0,1fr)] gap-3 px-4 py-4 text-sm text-slate-600"
              >
                <span className="text-xs leading-5 text-slate-500">{formatLongDate(entry.date)}</span>
                <span className="inline-flex h-fit w-fit rounded-full bg-[color:var(--color-accent)]/25 px-2.5 py-1 text-xs font-bold text-[color:var(--color-nav)]">
                  {entry.score}/10
                </span>
                <span className="min-w-0 break-words leading-6 text-slate-700">
                  {entry.note || 'No Quick Note saved.'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnergyBank;
