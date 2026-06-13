import React, { useState } from 'react';
import { Patient, ObsStatus, Observation } from '../types';
import { formatTime, getObsStatus } from '../utils';
import { CheckCircle2, Circle, Trash2, Clock, Bed, ChevronDown, ChevronUp, AlertCircle, AlertTriangle } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  isPrivacyMode: boolean;
  onToggleObs: (patientId: string, obsId: string) => void;
  onDelete: (patientId: string) => void;
  now: Date;
}

interface AlertCounts {
  overdue: number;
  dueSoon: number;
}

const getCardTone = (alerts: AlertCounts, completed: number, total: number) => {
  if (alerts.overdue > 0) {
    return {
      border: 'border-l-rose-500',
      icon: 'bg-rose-600',
      badge: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
      progress: 'bg-rose-500'
    };
  }

  if (alerts.dueSoon > 0) {
    return {
      border: 'border-l-amber-500',
      icon: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
      progress: 'bg-amber-500'
    };
  }

  if (total > 0 && completed === total) {
    return {
      border: 'border-l-emerald-500',
      icon: 'bg-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
      progress: 'bg-emerald-500'
    };
  }

  return {
    border: 'border-l-slate-300 dark:border-l-slate-600',
    icon: 'bg-slate-700 dark:bg-slate-600',
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    progress: 'bg-slate-500'
  };
};

const getStatusLabel = (alerts: AlertCounts, completed: number, total: number) => {
  if (alerts.overdue > 0) return `${alerts.overdue} overdue`;
  if (alerts.dueSoon > 0) return `${alerts.dueSoon} due soon`;
  if (total > 0 && completed === total) return 'All complete';
  return 'On track';
};

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
  const bedLabel = isPrivacyMode ? 'Bed hidden' : patient.bedNumber;
  const nextObs = patient.observations.find(o => !o.completed);
  const nextStatus = nextObs ? getObsStatus(nextObs, now) : ObsStatus.COMPLETED;

  const activeAlerts = patient.observations.reduce((acc, obs) => {
    if (obs.completed) return acc;
    const status = getObsStatus(obs, now);
    if (status === ObsStatus.OVERDUE) acc.overdue++;
    if (status === ObsStatus.DUE_SOON) acc.dueSoon++;
    return acc;
  }, { overdue: 0, dueSoon: 0 });

  const tone = getCardTone(activeAlerts, completedCount, totalCount);
  const statusLabel = getStatusLabel(activeAlerts, completedCount, totalCount);

  return (
    <div className={`bg-white dark:bg-slate-850 rounded-lg shadow-sm border-y border-r border-l-[6px] border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-md ${tone.border}`}>
      <div
        className={`p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isCollapsed ? '' : 'border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50'}`}
      >
        <div className="min-w-0 flex items-center gap-3">
          <div className={`p-2 rounded-lg text-white shadow-sm transition-colors ${tone.icon}`}>
            <Bed size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {bedLabel}
              </h3>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${tone.badge}`}>
                {activeAlerts.overdue > 0 && <AlertCircle size={10} />}
                {activeAlerts.overdue === 0 && activeAlerts.dueSoon > 0 && <AlertTriangle size={10} />}
                {statusLabel}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{patient.protocol}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400 dark:text-slate-500" />
              <span>Started: {formatTime(patient.startTime)}</span>
            </div>
            {nextObs && (
              <div className={`font-bold tabular-nums ${
                nextStatus === ObsStatus.OVERDUE ? 'text-rose-600 dark:text-rose-400' :
                nextStatus === ObsStatus.DUE_SOON ? 'text-amber-700 dark:text-amber-300' :
                'text-slate-600 dark:text-slate-300'
              }`}>
                Next: {formatTime(nextObs.time)}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
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
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              type="button"
              aria-label={isCollapsed ? 'Expand patient observations' : 'Collapse patient observations'}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="px-4 pb-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Recovery Progress</span>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{completedCount}/{totalCount} Tasks</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ease-out ${tone.progress}`}
                style={{ width: progressWidth }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 p-3 xl:grid-cols-2">
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
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

interface ObsRowProps {
  obs: Observation;
  patientId: string;
  onToggleObs: (pId: string, oId: string) => void;
  now: Date;
}

const ObsRow: React.FC<ObsRowProps> = ({ obs, patientId, onToggleObs, now }) => {
  const status = getObsStatus(obs, now);

  const getStatusClasses = (rowStatus: ObsStatus) => {
    switch (rowStatus) {
      case ObsStatus.COMPLETED:
        return 'bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700/50';
      case ObsStatus.OVERDUE:
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-400 dark:border-rose-800 font-bold ring-1 ring-rose-200 dark:ring-rose-800/50 animate-urgent shadow-sm';
      case ObsStatus.DUE_SOON:
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border-amber-500 dark:border-amber-700 font-semibold ring-1 ring-amber-100 dark:ring-amber-900/30';
      default:
        return 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
    }
  };

  const statusText = {
    [ObsStatus.COMPLETED]: 'Done',
    [ObsStatus.OVERDUE]: 'Overdue',
    [ObsStatus.DUE_SOON]: 'Due soon',
    [ObsStatus.FUTURE]: 'Scheduled'
  }[status];

  return (
    <div className={`min-h-16 rounded-lg border text-sm transition-all group overflow-hidden ${getStatusClasses(status)}`}>
      <button
        type="button"
        onClick={() => onToggleObs(patientId, obs.id)}
        className="grid min-h-16 w-full grid-cols-[5rem_1fr_auto] items-center gap-3 px-4 py-3 active:scale-[0.99] transition-transform text-left sm:grid-cols-[6rem_1fr_8rem_auto]"
      >
        <div className="font-bold leading-none tabular-nums text-lg text-slate-900 dark:text-slate-100">
          {formatTime(obs.time)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-bold uppercase tracking-wide opacity-80">{obs.label}</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-60 sm:hidden">{statusText}</div>
        </div>
        <div className="hidden text-right text-[11px] font-bold uppercase tracking-wide opacity-70 sm:block">
          {statusText}
        </div>
        <div className="flex items-center justify-end">
          {obs.completed ? (
            <CheckCircle2 size={26} className="text-emerald-600/80 dark:text-emerald-400/80" />
          ) : (
            <Circle
              size={26}
              className={`text-current opacity-40 group-hover:opacity-100 transition-opacity ${status === ObsStatus.OVERDUE ? 'animate-pulse' : ''}`}
            />
          )}
        </div>
      </button>
    </div>
  );
};
