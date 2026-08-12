import React from 'react';
import { Activity, MessageCircle, ShieldCheck, Utensils } from 'lucide-react';
import { AppTab } from '../types';
import { MOVEMENTS } from '../movements';
import MovementCard from './MovementCard';

interface HomePageProps {
  fatigueZone: '🟢 Green' | '🟡 Yellow' | '🔴 Red' | null;
  onNavigate: (tab: AppTab) => void;
}

const HomePage: React.FC<HomePageProps> = ({ fatigueZone, onNavigate }) => (
  <div className="space-y-8">
    <header className={`${
      fatigueZone === '🔴 Red' ? 'bg-rose-500 text-white shadow-rose-200' :
      fatigueZone === '🟡 Yellow' ? 'bg-amber-400 text-amber-950 shadow-amber-100' :
      'bg-neon-blue text-neon-dark shadow-neon-blue/20'
    } rounded-2xl p-8 shadow-lg transition-shadow transition-transform duration-500 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold">Welcome to Fit For Cancer</h1>
          {fatigueZone && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
              <span className="text-lg leading-none">{fatigueZone.split(' ')[0]}</span>
              <span className="text-xs font-bold uppercase tracking-widest">{fatigueZone.split(' ')[1]} Zone Active</span>
            </div>
          )}
        </div>

        <p className="opacity-90 max-w-xl text-lg font-medium leading-relaxed">
          {!fatigueZone
            ? 'Practical, evidence-informed support for cancer-related fatigue — movement, food ideas and someone to talk things through with when your energy is all over the place.'
            : fatigueZone === '🟢 Green'
              ? "You've got a bit more in the tank today. Browse movement and food ideas that make use of it without turning the day into a fitness test."
              : fatigueZone === '🟡 Yellow'
                ? "Energy is somewhere in the middle today. We'll favour shorter movement and lower-effort food ideas that you can scale up or down."
                : "Low-battery day. We'll put the easiest options first. Rest counts too."
          }
        </p>

        <div className="flex flex-wrap gap-3 mt-8">
          <button
            onClick={() => onNavigate(AppTab.ASSISTANT)}
            className={`${
              fatigueZone === '🔴 Red' ? 'bg-white text-rose-600' :
              fatigueZone === '🟡 Yellow' ? 'bg-amber-950 text-amber-400' :
              'bg-neon-dark text-neon-blue'
            } px-6 py-3 font-bold rounded-full hover:opacity-90 transition-shadow transition-transform transition-colors hover:scale-105 shadow-md flex items-center gap-2`}
          >
            <MessageCircle className="w-4 h-4" />
            Talk to ATHENA
          </button>
          {fatigueZone && (
            <button
              onClick={() => onNavigate(AppTab.ASSISTANT)}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 font-bold rounded-full hover:bg-white/20 transition-shadow transition-transform transition-colors"
            >
              Update Fatigue Score
            </button>
          )}
        </div>
      </div>
    </header>

    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>How it works</span>
          <span className="text-lg">🟢🟡🔴</span>
        </h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Fatigue can change from one day to the next. Give us a quick check-in and Fit For Cancer changes what it puts in front of you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">1</div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Check your energy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Pick a number from 0–10 based on how you feel today.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">2</div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Get a useful filter</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Green, Yellow and Red sort ideas by effort. They are not a diagnosis.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm font-bold text-neon-blue text-sm">3</div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Pick what helps</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Browse movement and food ideas, or talk it through with ATHENA. You stay in control.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Three ways Fit For Cancer can help</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-[color:var(--color-accent)]/25 text-[color:var(--color-nav)] rounded-full flex items-center justify-center mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Movement</h3>
          <p className="text-slate-600 text-sm">Movement ideas for different energy levels, from walking and strength work to small seated movements on low-battery days.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] rounded-full flex items-center justify-center mb-4">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Food</h3>
          <p className="text-slate-600 text-sm">Practical food ideas for low appetite, nausea, taste changes or days when cooking feels like too much.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-[color:var(--color-tertiary)]/15 text-[color:var(--color-tertiary)] rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Evidence-informed</h3>
          <p className="text-slate-600 text-sm">Built from current cancer, exercise and nutrition guidance, with sources available when you want to dig deeper.</p>
        </div>
      </div>
    </section>

    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Featured Movement</h2>
        <button onClick={() => onNavigate(AppTab.EXERCISE)} className="text-neon-blue font-semibold hover:underline">View All</button>
      </div>
      <MovementCard movement={MOVEMENTS[0]} />
    </section>
  </div>
);

export default HomePage;
