
import React, { useMemo, useState } from 'react';
import { X, Copy, CheckCircle2, FileText, ClipboardList } from 'lucide-react';
import { Patient, ObsStatus } from '../types';
import { getObsStatus, formatTime } from '../utils';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  now: Date;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ isOpen, onClose, patients, now }) => {
  const [copied, setCopied] = useState(false);

  // Sort patients naturally by Bed Number string (e.g., "Bay 1..." before "Bay 2...")
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => 
      a.bedNumber.localeCompare(b.bedNumber, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [patients]);

  // Generate the text report
  const reportText = useMemo(() => {
    const lines = [`🏥 OBS TRACK REPORT - ${now.toLocaleDateString()} ${formatTime(now)}`, ''];
    
    if (sortedPatients.length === 0) {
      lines.push("No active patients.");
    } else {
      sortedPatients.forEach(p => {
        const completedCount = p.observations.filter(o => o.completed).length;
        const total = p.observations.length;
        
        // Find next due
        const nextObs = p.observations.find(o => !o.completed);
        let statusStr = "All Complete";
        
        if (nextObs) {
          const status = getObsStatus(nextObs, now);
          statusStr = `Next: ${formatTime(nextObs.time)} (${nextObs.label})`;
          if (status === ObsStatus.OVERDUE) statusStr += " [OVERDUE]";
          if (status === ObsStatus.DUE_SOON) statusStr += " [DUE]";
        }

        lines.push(`• ${p.bedNumber}`);
        lines.push(`  Protocol: ${p.protocol}`);
        lines.push(`  Progress: ${completedCount}/${total} - ${statusStr}`);
        lines.push('');
      });
    }
    
    return lines.join('\n');
  }, [sortedPatients, now]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Shift Handover Report</h3>
              <p className="text-xs font-medium text-slate-500">Auto-generated summary for clinical notes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50/50">
          <div className="relative group">
            <textarea 
              readOnly
              value={reportText}
              className="w-full h-64 p-4 font-mono text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-sm"
            />
            <div className="absolute top-3 right-3">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                  copied 
                  ? 'bg-emerald-500 text-white shadow-emerald-200' 
                  : 'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-300'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={12} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedPatients.map(patient => (
                <div key={patient.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-700 block text-sm">{patient.bedNumber}</span>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {patient.protocol}
                    </span>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const next = patient.observations.find(o => !o.completed);
                      return next ? (
                        <>
                          <span className="block text-xs font-bold text-slate-600">{formatTime(next.time)}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{next.label}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">Complete</span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
