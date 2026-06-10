import React from 'react';
import { SafetyCriterion } from '../types/clinical';
import { CheckCircle2, XCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface PriorAuthAuditorProps {
  guidelines: SafetyCriterion[];
  onGenerateReport: () => void;
  simulationStep: number;
  totalSteps: number;
}

export const PriorAuthAuditor: React.FC<PriorAuthAuditorProps> = ({
  guidelines,
  onGenerateReport,
  simulationStep,
  totalSteps
}) => {
  const violatedCount = guidelines.filter(g => g.status === 'violated').length;
  const isCriticalViolated = guidelines.some(g => g.status === 'violated' && g.severity === 'critical');
  const isCompleted = simulationStep >= totalSteps;

  return (
    <div className="flex flex-col h-full bg-white border border-[#eae6df] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#eae6df] bg-slatebg-50/50">
        <span className="text-[9px] font-mono uppercase tracking-widest text-slatebg-900/60 font-bold block">Safety Guardrail Engine</span>
        <h3 className="font-serif text-lg font-extrabold text-slatebg-900">Clinical Safety Audits</h3>
        <span className="text-[10px] font-mono text-stone-500 mt-1 block">
          Auditor Mode: <strong className="text-[#3a3a30]">Real-Time Guidelines Inspector</strong>
        </span>
      </div>

      {/* Checklist */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 font-bold block pb-1 border-b border-[#eae6df]">
          Safety Audit Checklist
        </span>
        <div className="space-y-3">
          {guidelines.map((checkpoint) => {
            return (
              <div
                key={checkpoint.id}
                className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                  checkpoint.status === 'passed'
                    ? 'bg-teal-50/40 border-teal-200/60'
                    : checkpoint.status === 'violated'
                    ? 'bg-rose-50/40 border-rose-200/60 animate-pulse'
                    : 'bg-stone-50/50 border-stone-200/60'
                }`}
              >
                {/* Status Icon */}
                <div className="shrink-0 mt-0.5">
                  {checkpoint.status === 'passed' ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  ) : checkpoint.status === 'violated' ? (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-stone-400" />
                  )}
                </div>

                {/* Checklist Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-xs text-stone-850 font-sans font-medium leading-relaxed select-text">
                    {checkpoint.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 border rounded text-[7px] font-mono uppercase font-extrabold ${
                      checkpoint.severity === 'critical'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {checkpoint.severity} exclusion
                    </span>
                    {checkpoint.resolutionMessage && (
                      <span className={`text-[9px] font-sans italic ${
                        checkpoint.status === 'violated' ? 'text-rose-700' : 'text-teal-700'
                      }`}>
                        {checkpoint.resolutionMessage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Verdict Card */}
      <div className="border-t border-[#eae6df] bg-[#fcfbf9] p-6 space-y-4">
        <div className={`p-4 rounded-2xl flex items-center justify-between border ${
          isCriticalViolated
            ? 'bg-rose-100 border-rose-350 text-rose-900 shadow-lg shadow-rose-500/10'
            : isCompleted
            ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
            : 'bg-stone-50 border-stone-250 text-stone-700'
        }`}>
          <div>
            <span className="text-[8px] font-mono uppercase tracking-widest opacity-60 font-bold block">
              Clinical Guardrail Verdict
            </span>
            <strong className="font-serif text-sm block">
              {isCriticalViolated
                ? '⚠️ CRITICAL MEDICAL BREACH'
                : isCompleted
                ? '✅ Clinical Safety Verified'
                : '⏳ Active Audit Loop...'}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold block">
              {violatedCount} Violations
            </span>
          </div>
        </div>

        {/* Generate Audit Report button */}
        <button
          onClick={onGenerateReport}
          disabled={!isCompleted && !isCriticalViolated}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-2xl font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            isCompleted || isCriticalViolated
              ? 'bg-stone-900 hover:bg-stone-855 shadow-md shadow-stone-900/10'
              : 'bg-stone-400 cursor-not-allowed'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Clinical Audit Report
        </button>
      </div>
    </div>
  );
};
