
import React, { useCallback, useState, useEffect } from 'react';
import { Patient, ProtocolType } from './types';
import { generateObservations, playSound } from './utils';
import { Sidebar } from './components/Sidebar';
import { PatientCard } from './components/PatientCard';
import { Shield, ShieldAlert, LayoutGrid, CheckCircle2, AlertCircle, Info, Trash2, Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'obstrack_patients_v1';
const THEME_KEY = 'obstrack_theme_pref';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const normalizeBedNumber = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const parseAdmissionDateTime = (dateValue: string, timeValue: string) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!dateMatch || !timeMatch) return null;

  const [, yearValue, monthValue, dayValue] = dateMatch;
  const [, hourValue, minuteValue] = timeMatch;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hours = Number(hourValue);
  const minutes = Number(minuteValue);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null;
  }

  return date;
};

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed: Patient[] = JSON.parse(saved);
      return parsed.map(p => ({
        ...p,
        startTime: new Date(p.startTime),
        observations: p.observations.map(o => ({
          ...o,
          time: new Date(o.time)
        })),
        theme: 'slate'
      }));
    } catch (e) {
      console.error("Failed to parse stored data", e);
      return [];
    }
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [now, setNow] = useState(new Date());

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
      // Update meta theme color for mobile browsers
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }
  }, [isDarkMode]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (patients.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    }
  }, [patients]);

  const handleAddPatient = useCallback((bedNumber: string, startDate: string, startTimeStr: string, protocol: ProtocolType) => {
    const normalizedBedNumber = normalizeBedNumber(bedNumber);
    const isDuplicate = patients.some(patient => normalizeBedNumber(patient.bedNumber) === normalizedBedNumber);
    if (isDuplicate) {
      addToast(`${bedNumber} is already on the board.`, 'error');
      return false;
    }

    const startTime = parseAdmissionDateTime(startDate, startTimeStr);

    if (!startTime) {
      addToast('Enter a valid admission date and time.', 'error');
      return false;
    }

    const newPatient: Patient = {
      id: generateId(),
      bedNumber,
      startTime,
      protocol,
      observations: generateObservations(startTime, protocol),
      theme: 'slate'
    };

    playSound('success');
    setPatients(prev => [newPatient, ...prev]);
    addToast(`Patient ${bedNumber} admitted.`);
    return true;
  }, [addToast, patients]);

  const handleToggleObs = (patientId: string, obsId: string) => {
    playSound('check');
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
      sessionStorage.removeItem(STORAGE_KEY);
      setPatients([]);
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 md:flex-row">
      <Sidebar 
        onAddPatient={handleAddPatient} 
        now={now}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Toast Container */}
        <div className="fixed left-3 right-3 top-3 z-[100] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:top-4">
          {toasts.map(toast => (
            <div 
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto ${
                toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
                toast.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' :
                'bg-slate-800 border-slate-700 text-white dark:bg-slate-700 dark:border-slate-600'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
              <span className="text-sm font-bold">{toast.message}</span>
            </div>
          ))}
        </div>

        <header className="min-h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3 z-10 shrink-0 transition-colors duration-300 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white tracking-tight sm:text-xl">Post-Op Recovery Board</h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {patients.length} active {patients.length === 1 ? 'bed' : 'beds'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums leading-none">
                {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={handleResetSystem}
              title="Reset board"
              className={`p-2 rounded-lg transition-all border transform active:scale-95 ${
                patients.length === 0 
                ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-600' 
                : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:bg-rose-100 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900/20'
              }`}
              disabled={patients.length === 0}
            >
              <Trash2 size={16} />
            </button>

            <button 
              onClick={() => {
                setIsPrivacyMode(!isPrivacyMode);
                addToast(`Privacy mode ${!isPrivacyMode ? 'enabled' : 'disabled'}.`, 'info');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm transform active:scale-95 ${
                isPrivacyMode 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 border border-transparent' 
                : 'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'
              }`}
            >
              {isPrivacyMode ? <Shield size={18} /> : <ShieldAlert size={18} />}
              <span className="hidden sm:inline">Privacy</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-100/50 p-3 dark:bg-black/20 sm:p-6">
          {patients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <LayoutGrid size={40} className="text-slate-400 dark:text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Ward Board Empty</h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Enter a Bay and Bed number in the sidebar to begin automated observation tracking for new admissions.
              </p>
            </div>
          ) : (
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

      </main>
    </div>
  );
};

export default App;
