
import React, { useState } from 'react';
import { Patient, ObsStatus } from '../types';
import { formatTime, getObsStatus } from '../utils';
import { CheckCircle2, Circle, Trash2, Clock, Bed, ChevronDown, ChevronUp, AlertCircle, AlertTriangle } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  isPrivacyMode: boolean;
  onToggleObs: (patientId: string, obsId: string) => void;
  onDelete: (patientId: string) => void;
  now: Date;
}

// Explicit mapping to ensure Tailwind compiler picks up the classes
const THEME_STYLES: Record<string, {
  border: string;
  hover: string;
  iconBg: string;
  iconShadow: string;
  badge: string;
  progress: string;
  check: string;
  mutedCheck: string;
}> = {
  blue: {
    border: 'border-l-blue-500',
    hover: 'hover:border-blue-200 dark:hover:border-blue-700',
    iconBg: 'bg-blue-600',
    iconShadow: 'shadow-blue-100 dark:shadow-none',
    badge: 'text-blue-600/80 dark:text-blue-400',
    progress: 'bg-blue-500',
    check: 'text-blue-500',
    mutedCheck: 'text-blue-500/50'
  },
  emerald: {
    border: 'border-l-emerald-500',
    hover: 'hover:border-emerald-200 dark:hover:border-emerald-700',
    iconBg: 'bg-emerald-600',
    iconShadow: 'shadow-emerald-100 dark:shadow-none',
    badge: 'text-emerald-700/80 dark:text-emerald-400',
    progress: 'bg-emerald-500',
    check: 'text-emerald-600',
    mutedCheck: 'text-emerald-600/50'
  },
  violet: {
    border: 'border-l-violet-500',
    hover: 'hover:border-violet-200 dark:hover:border-violet-700',
    iconBg: 'bg-violet-600',
    iconShadow: 'shadow-violet-100 dark:shadow-none',
    badge: 'text-violet-600/80 dark:text-violet-400',
    progress: 'bg-violet-500',
    check: 'text-violet-500',
    mutedCheck: 'text-violet-500/50'
  },
  fuchsia: {
    border: 'border-l-fuchsia-500',
    hover: 'hover:border-fuchsia-200 dark:hover:border-fuchsia-700',
    iconBg: 'bg-fuchsia-600',
    iconShadow: 'shadow-fuchsia-100 dark:shadow-none',
    badge: 'text-fuchsia-700/80 dark:text-fuchsia-400',
    progress: 'bg-fuchsia-500',
    check: 'text-fuchsia-500',
    mutedCheck: 'text-fuchsia-500/50'
  },
  cyan: {
    border: 'border-l-cyan-500',
    hover: 'hover:border-cyan-200 dark:hover:border-cyan-700',
    iconBg: 'bg-cyan-600',
    iconShadow: 'shadow-cyan-100 dark:shadow-none',
    badge: 'text-cyan-700/80 dark:text-cyan-400',
    progress: 'bg-cyan-500',
    check: 'text-cyan-600',
    mutedCheck: 'text-cyan-600/50'
  },
  indigo: {
    border: 'border-l-indigo-500',
    hover: 'hover:border-indigo-200 dark:hover:border-indigo-700',
    iconBg: 'bg-indigo-600',
    iconShadow: 'shadow-indigo-100 dark:shadow-none',
    badge: 'text-indigo-600/80 dark:text-indigo-400',
    progress: 'bg-indigo-500',
    check: 'text-indigo-500',
    mutedCheck: 'text-indigo-500/50'
  },
  teal: {
    border: 'border-l-teal-500',
    hover: 'hover:border-teal-200 dark:hover:border-teal-700',
    iconBg: 'bg-teal-600',
    iconShadow: 'shadow-teal-100 dark:shadow-none',
    badge: 'text-teal-700/80 dark:text-teal-400',
    progress: 'bg-teal-500',
    check: 'text-teal-600',
    mutedCheck: 'text-teal-600/50'
  },
  sky: {
    border: 'border-l-sky-500',
    hover: 'hover:border-sky-200 dark:hover:border-sky-700',
    iconBg: 'bg-sky-600',
    iconShadow: 'shadow-sky-100 dark:shadow-none',
    badge: 'text-sky-700/80 dark:text-sky-400',
    progress: 'bg-sky-500',
    check: 'text-sky-600',
    mutedCheck: 'text-sky-600/50'
  },
  pink: {
    border: 'border-l-pink-500',
    hover: 'hover:border-pink-200 dark:hover:border-pink-700',
    iconBg: 'bg-pink-600',
    iconShadow: 'shadow-pink-100 dark:shadow-none',
    badge: 'text-pink-600/80 dark:text-pink-400',
    progress: 'bg-pink-500',
    check: 'text-pink-500',
    mutedCheck: 'text-pink-500/50'
  },
  purple: {
    border: 'border-l-purple-500',
    hover: 'hover:border-purple-200 dark:hover:border-purple-700',
    iconBg: 'bg-purple-600',
    iconShadow: 'shadow-purple-100 dark:shadow-none',
    badge: 'text-purple-600/80 dark:text-purple-400',
    progress: 'bg-purple-500',
    check: 'text-purple-500',
    mutedCheck: 'text-purple-500/50'
  },
  slate: {
    border: 'border-l-slate-500',
    hover: 'hover:border-slate-200 dark:hover:border-slate-700',
    iconBg: 'bg-slate-600',
    iconShadow: 'shadow-slate-100 dark:shadow-none',
    badge: 'text-slate-600/80 dark:text-slate-400',
    progress: 'bg-slate-500',
    check: 'text-slate-500',
    mutedCheck: 'text-slate-500/50'
  }
};

const DEFAULT_THEME = THEME_STYLES['blue'];

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  isPrivacyMode,
  onToggleObs,
  onDelete,
  now
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const completedCount = patient.observations.filter(o => o.completed).length;
  const totalCount = patient.observations.length;
  const progressWidth = `${totalCount === 0 ? 0 : (completedCount / totalCount) * 100}%`;
  
  const styles = THEME_STYLES[patient.theme] || DEFAULT_THEME;

  const activeAlerts = patient.observations.reduce((acc, obs) => {
    if (obs.completed) return acc;
    const status = getObsStatus(obs, now);
    if (status === ObsStatus.OVERDUE) acc.overdue++;
    if (status === ObsStatus.DUE_SOON) acc.dueSoon++;
    return acc;
  }, { overdue: 0, dueSoon: 0 });

  return (
    <div className={`bg-white dark:bg-slate-850 rounded-xl shadow-sm border-y border-r border-l-[6px] transition-all duration-300 ${
        isCollapsed 
          ? `border-slate-200 dark:border-slate-800 hover:border-slate-300 ${styles.border}`
          : `border-slate-200 dark:border-slate-800 hover:shadow-md ${styles.hover} ${styles.border}`
      }`}>
      
      {/* Header - Always Visible */}
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer ${isCollapsed ? '' : 'border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50'}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg text-white shadow-sm transition-colors ${
              activeAlerts.overdue > 0 ? 'bg-rose-500 shadow-rose-100 dark:shadow-none animate-pulse' : 
              activeAlerts.dueSoon > 0 ? 'bg-amber-500 shadow-amber-100 dark:shadow-none' :
              `${styles.iconBg} ${styles.iconShadow}`
            }`}>
              <Bed size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold text-slate-800 dark:text-slate-100 transition-all duration-300 ${isPrivacyMode ? 'blur-md select-none' : ''}`}>
                  {patient.bedNumber}
                </h3>
                {/* Collapsed Status Badges */}
                {isCollapsed && (
                  <div className="flex items-center gap-1.5 ml-2">
                    {activeAlerts.overdue > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800">
                        <AlertCircle size={10} /> {activeAlerts.overdue} Overdue
                      </span>
                    )}
                    {activeAlerts.dueSoon > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                        <AlertTriangle size={10} /> {activeAlerts.dueSoon} Due
                      </span>
                    )}
                    {activeAlerts.overdue === 0 && activeAlerts.dueSoon === 0 && completedCount < totalCount && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-600">
                        On Track
                      </span>
                    )}
                    {completedCount === totalCount && totalCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                        All Done
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${styles.badge}`}>{patient.protocol}</p>
            </div>
          </div>
        </div>
          
        <div className="flex items-center gap-3">
          {!isCollapsed && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mr-2">
              <Clock size={14} className="text-slate-400 dark:text-slate-500" />
              <span>Started: {formatTime(patient.startTime)}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(patient.id);
              }}
              className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full group"
              title="Discharge Patient"
            >
              <Trash2 size={18} className="group-active:scale-90 transition-transform" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Body */}
      {!isCollapsed && (
        <>
          {/* Progress Bar */}
          <div className="px-4 pb-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
             <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Recovery Progress</span>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{completedCount}/{totalCount} Tasks</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ease-out ${styles.progress}`}
                style={{ width: progressWidth }}
              />
            </div>
          </div>

          {/* Observations List */}
          <div className="p-3 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 flex flex-col gap-2">
            {patient.observations.length === 0 ? (
              <p className="text-center py-4 text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">No tasks scheduled</p>
            ) : (
              patient.observations.map(obs => (
                <ObsRow 
                  key={obs.id} 
                  obs={obs} 
                  patientId={patient.id} 
                  onToggleObs={onToggleObs} 
                  now={now}
                  styles={styles}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Subcomponent for Observation Row
interface ObsRowProps {
  obs: import('../types').Observation;
  patientId: string;
  onToggleObs: (pId: string, oId: string) => void;
  now: Date;
  styles: any;
}

const ObsRow: React.FC<ObsRowProps> = ({ obs, patientId, onToggleObs, now, styles }) => {
  const status = getObsStatus(obs, now);
  
  // Logic for row styling
  const getStatusClasses = (status: ObsStatus) => {
    switch (status) {
      case ObsStatus.COMPLETED:
        return 'bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700/50';
      case ObsStatus.OVERDUE:
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-400 dark:border-rose-800 font-bold ring-1 ring-rose-200 dark:ring-rose-800/50 animate-urgent shadow-sm';
      case ObsStatus.DUE_SOON:
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border-amber-500 dark:border-amber-700 font-semibold ring-1 ring-amber-100 dark:ring-amber-900/30';
      default:
        // Future/Active
        return 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
    }
  };

  const classes = getStatusClasses(status);

  return (
    <div 
      className={`flex items-stretch rounded-lg border text-sm transition-all group overflow-hidden ${classes}`}
    >
      <button
        type="button"
        onClick={() => onToggleObs(patientId, obs.id)}
        className="flex-1 flex items-center justify-between p-3 active:scale-[0.99] transition-transform text-left"
      >
        <div className="flex flex-col items-start">
          <span className="font-bold leading-tight tabular-nums text-base">{formatTime(obs.time)}</span>
          <span className="text-[10px] uppercase tracking-wide opacity-80 mt-0.5">{obs.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {obs.completed ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Done</span>
              <CheckCircle2 size={22} className={styles.mutedCheck} />
            </div>
          ) : (
            <Circle 
              size={22} 
              className={`text-current opacity-40 group-hover:opacity-100 transition-opacity ${status === ObsStatus.OVERDUE ? 'animate-pulse' : ''}`} 
            />
          )}
        </div>
      </button>
    </div>
  );
};
