
import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, Settings2, Activity, UserPlus, Keyboard } from 'lucide-react';
import { ProtocolType } from '../types';

interface SidebarProps {
  onAddPatient: (bedNumber: string, startTime: string, protocol: ProtocolType) => void;
  now: Date;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddPatient, now }) => {
  const [bayNumber, setBayNumber] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [protocol, setProtocol] = useState<ProtocolType>(ProtocolType.POST_OP);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [startTime, setStartTime] = useState(() => {
    return now.toTimeString().slice(0, 5);
  });

  useEffect(() => {
    if (!isEditingTime) {
      setStartTime(now.toTimeString().slice(0, 5));
    }
  }, [now, isEditingTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !bayNumber || !bedNumber) return;
    
    const formattedId = `B${bayNumber}, B${bedNumber}`;
    onAddPatient(formattedId, startTime, protocol);
    
    setBayNumber('');
    setBedNumber('');
    setIsEditingTime(false);
  };

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full sticky top-0 overflow-y-auto transition-colors duration-300">
      <div className="p-6">
        <div className="mb-8 p-1">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="text-blue-600 dark:text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ObsTrack Pro</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            Post-Operative Monitoring
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4 px-1">
          <UserPlus size={16} className="text-slate-400 dark:text-slate-500" />
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient Admission</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Bay No.
              </label>
              <div className="relative group">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={16} />
                <input
                  type="text"
                  required
                  value={bayNumber}
                  onChange={(e) => setBayNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-green-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-green-500 focus:border-green-600 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400"
                  placeholder="#"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Bed No.
              </label>
              <div className="relative group">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={16} />
                <input
                  type="text"
                  required
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-green-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-green-500 focus:border-green-600 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400"
                  placeholder="#"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Admission Time
              </label>
              {!isEditingTime && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-tighter">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="time"
                required
                value={startTime}
                onFocus={() => setIsEditingTime(true)}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all pr-10 ${
                  isEditingTime 
                  ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' 
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Settings2 size={12} />
              Initial Protocol
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as ProtocolType)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-800 transition-all text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {Object.values(ProtocolType).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-slate-200 dark:shadow-none transition-all transform active:scale-95 flex justify-center items-center gap-2"
          >
            <PlusCircle size={18} />
            Start Observation
          </button>
        </form>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium text-center uppercase tracking-widest">
          ObsTrack Pro v2.0.0 • Clinical Safe
        </p>
      </div>
    </aside>
  );
};
