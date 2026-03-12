
import React from 'react';
import { motion } from 'motion/react';
import { Movement } from '../types';
import { Brain, Dumbbell, ShieldAlert, Clock, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface MovementCardProps {
  movement: Movement;
}

const MovementCard: React.FC<MovementCardProps> = ({ movement }) => {
  const intensityMap = {
    'Green': {
      label: 'Standard Movement',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      emoji: '🟢'
    },
    'Yellow': {
      label: 'Modified Movement',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      emoji: '🟡'
    },
    'Red': {
      label: 'Active Rest & Recovery',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      emoji: '🔴'
    }
  };

  const zone = intensityMap[movement.intensity];

  const hasSpecialSafetyNote = (note: string) => {
    const keywords = ['chest', 'breast', 'surgery', 'lymphedema'];
    return keywords.some(keyword => note.toLowerCase().includes(keyword));
  };

  const isSpecialAwareness = hasSpecialSafetyNote(movement.safetyNote);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col h-full"
    >
      {/* Movement Visual Header */}
      <div className="relative aspect-video bg-slate-50 overflow-hidden border-b border-slate-100">
        {movement.imageUrl ? (
          <img 
            src={movement.imageUrl} 
            alt={movement.title} 
            className="w-full h-full object-contain object-center p-2" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
            <ImageIcon className="w-10 h-10 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Visual Guide Coming Soon</span>
          </div>
        )}
        
        {/* Intensity Badge Overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-full border shadow-sm backdrop-blur-md ${zone.color.replace('bg-', 'bg-opacity-90 bg-')}`}>
            {zone.label}
          </span>
          {isSpecialAwareness && (
            <span className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] rounded-full border shadow-sm backdrop-blur-md bg-rose-500/90 text-white border-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3" />
              Clinical Awareness
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            <span className="mr-2">{zone.emoji}</span>
            {movement.title}
          </h3>
          {movement.citation && (
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">
              {movement.citation}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-6">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neon-blue" />
            {movement.duration}
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-neon-blue" />
            {movement.benefit}
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-8 leading-relaxed font-medium">
          {movement.description}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/50">
            <div className="flex items-center gap-2 mb-2 text-purple-700">
              <Brain className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Mind & Mood</span>
            </div>
            <p className="text-xs text-purple-600/90 leading-relaxed font-medium">{movement.mentalWellbeingBenefit}</p>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
            <div className="flex items-center gap-2 mb-2 text-blue-700">
              <Dumbbell className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Body & Strength</span>
            </div>
            <p className="text-xs text-blue-600/90 leading-relaxed font-medium">{movement.strengthBenefit}</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border mt-auto ${isSpecialAwareness ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className={`flex items-center gap-2 mb-2 ${isSpecialAwareness ? 'text-rose-700' : 'text-amber-700'}`}>
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isSpecialAwareness ? 'Clinical Safety Protocol' : 'Safety Protocol'}
            </span>
          </div>
          <p className={`text-xs leading-relaxed font-medium italic ${isSpecialAwareness ? 'text-rose-700/90' : 'text-amber-700/90'}`}>{movement.safetyNote}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default MovementCard;
