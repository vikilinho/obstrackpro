
import React, { useState, useEffect, useCallback } from 'react';
import { Patient, ProtocolType } from './types';
import { generateObservations } from './utils';
import { Sidebar } from './components/Sidebar';
import { PatientCard } from './components/PatientCard';
import { Shield, ShieldAlert, LayoutGrid, RefreshCcw, CheckCircle2, AlertCircle, Info, Trash2, Rows } from 'lucide-react';

const STORAGE_KEY = 'obstrack_patients_v1';
// Removed 'rose', 'orange', 'amber' to reserve them for status alerts (Overdue/Due Soon)
// Removed 'lime' and 'yellow' as they can be hard to read on white backgrounds
const THEMES = ['blue', 'emerald', 'violet', 'fuchsia', 'cyan', 'indigo', 'teal', 'sky', 'pink', 'purple', 'slate'];

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getRandomTheme = () => THEMES[Math.floor(Math.random() * THEMES.length)];

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed: Patient[] = JSON.parse(saved);
      return parsed.map(p => ({
        ...p,
        startTime: new Date(p.startTime),
        observations: p.observations.map(o => ({
          ...o,
          time: new Date(o.time)
        })),
        theme: p.theme && THEMES.includes(p.theme) ? p.theme : getRandomTheme() // Validate and backfill
      }));
    } catch (e) {
      console.error("Failed to parse stored data", e);
      return [];
    }
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [now, setNow] = useState(new Date());

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (patients.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    }
  }, [patients]);

  const handleAddPatient = (bedNumber: string, startTimeStr: string, protocol: ProtocolType) => {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);

    const newPatient: Patient = {
      id: generateId(),
      bedNumber,
      startTime,
      protocol,
      observations: generateObservations(startTime, protocol),
      theme: getRandomTheme()
    };

    setPatients(prev => [newPatient, ...prev]);
    addToast(`Patient ${bedNumber} admitted.`);
  };

  const handleToggleObs = (patientId: string, obsId: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const obs = p.observations.find(o => o.id === obsId);
      if (obs) addToast(`${obs.completed ? 'Reopened' : 'Completed'} observation.`, 'info');
      return {
        ...p,
        observations: p.observations.map(o => {
          if (o.id !== obsId) return o;
          return { ...o, completed: !o.completed };
        })
      };
    }));
  };

  const handleDeletePatient = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    if (!p) return;
    
    if (window.confirm(`Discharge patient from ${p.bedNumber}? All data for this patient will be removed.`)) {
      setPatients(prev => prev.filter(patient => patient.id !== id));
      addToast(`Patient discharged.`);
    }
  };

  const handleResetSystem = () => {
    if (window.confirm('CRITICAL ACTION: This will delete all active patient data and refresh the system. This cannot be undone. Proceed?')) {
      // 1. Explicitly remove storage key
      localStorage.removeItem(STORAGE_KEY);
      
      // 2. Set state to empty. This triggers a re-render and ensures the useEffect 
      //    also sees empty state (double-check protection).
      setPatients([]);
      
      // 3. Reload page after a short delay to ensure the browser has committed 
      //    the storage changes and React has finished its cycle.
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        onAddPatient={handleAddPatient} 
        now={now} 
        patientCount={patients.length} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div 
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto ${
                toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
                toast.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' :
                'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
              <span className="text-sm font-bold">{toast.message}</span>
            </div>
          ))}
        </div>

        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Post-Op Recovery Board</h1>
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
              <RefreshCcw size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
              Live Dashboard
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleResetSystem}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border transform active:scale-95 ${
                patients.length === 0 
                ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400' 
                : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:bg-rose-100 cursor-pointer'
              }`}
              disabled={patients.length === 0}
            >
              <Trash2 size={16} />
              Reset System
            </button>

            <button 
              onClick={() => {
                setIsPrivacyMode(!isPrivacyMode);
                addToast(`Privacy mode ${!isPrivacyMode ? 'enabled' : 'disabled'}.`, 'info');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm transform active:scale-95 ${
                isPrivacyMode 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                : 'bg-slate-800 text-white hover:bg-slate-900'
              }`}
            >
              {isPrivacyMode ? <Shield size={18} /> : <ShieldAlert size={18} />}
              Privacy Mode
            </button>

            <div className="h-8 w-[1px] bg-slate-200 mx-1" />
            
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="text-lg font-bold text-blue-600 tabular-nums leading-none">
                {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          {patients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <LayoutGrid size={40} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ward Board Empty</h2>
              <p className="text-slate-500 leading-relaxed">
                Enter a Bay and Bed number in the sidebar to begin automated observation tracking for new admissions.
              </p>
            </div>
          ) : (
            // Changed from grid to flex-col stack
            <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
              {patients.map(patient => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  isPrivacyMode={isPrivacyMode}
                  onToggleObs={handleToggleObs}
                  onDelete={handleDeletePatient}
                  now={now}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="h-12 bg-white border-t border-slate-200 px-8 flex items-center justify-center gap-8 md:gap-12 text-[10px] font-bold text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="uppercase tracking-wider">COMPLETED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="uppercase tracking-wider">OVERDUE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="uppercase tracking-wider">DUE SOON</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-200" />
            <span className="uppercase tracking-wider">SCHEDULED</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
