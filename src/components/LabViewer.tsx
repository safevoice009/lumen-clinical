import React from 'react';
import { ClinicalToolCall } from '../types/clinical';
import { Beaker, Search, Eye, RefreshCw, CheckCircle } from 'lucide-react';

interface LabViewerProps {
  toolCalls: ClinicalToolCall[];
  onExecuteTool: (toolId: string) => void;
}

export const LabViewer: React.FC<LabViewerProps> = ({ toolCalls, onExecuteTool }) => {
  return (
    <div className="flex flex-col h-full bg-white border border-[#eae6df] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#eae6df] flex items-center justify-between bg-slatebg-50/50">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slatebg-900/60 font-bold block">EHR Diagnostics Gateway</span>
          <h3 className="font-serif text-lg font-extrabold text-slatebg-900">Lab & Tool Interceptor</h3>
        </div>
        <Beaker className="w-5 h-5 text-clinical-600 animate-pulse" />
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {toolCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-stone-400 space-y-2">
            <Search className="w-8 h-8 text-stone-300" />
            <p className="text-xs font-mono">No active tool-use calls detected. Awaiting doctor agent decisions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 font-bold block pb-1 border-b border-[#eae6df]">
              Intercepted Tool Calls
            </span>
            {toolCalls.map((tool) => {
              const isCompleted = tool.status === 'completed';
              return (
                <div
                  key={tool.id}
                  className={`p-4 rounded-[24px] border transition-all duration-300 flex flex-col space-y-3 ${
                    isCompleted
                      ? 'bg-tealmed-50/20 border-tealmed-200/50 text-[#0f766e]'
                      : 'bg-amber-50/20 border-amber-200/50 text-amber-900'
                  }`}
                >
                  {/* Tool metadata */}
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[7px] font-mono uppercase tracking-wider bg-white border border-[#eae6df] px-2 py-0.5 rounded-full font-extrabold text-stone-500 shadow-sm mr-2">
                        {tool.vocab}:{tool.code}
                      </span>
                      <span className="text-xs font-serif font-bold text-slatebg-900">{tool.parameter}</span>
                    </div>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-wider text-tealmed-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => onExecuteTool(tool.id)}
                        className="flex items-center gap-1.5 py-1 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-mono text-[9px] font-bold tracking-wider uppercase transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Execute
                      </button>
                    )}
                  </div>

                  {/* Results Details */}
                  {isCompleted ? (
                    <div className="bg-white border border-[#eae6df] p-3.5 rounded-2xl text-[10px] leading-relaxed text-stone-700 font-mono select-text shadow-inner">
                      <span className="text-[8px] font-bold block uppercase tracking-wider text-stone-400 mb-1 border-b border-stone-100 pb-1">
                        Diagnostic Return Value
                      </span>
                      {tool.result}
                    </div>
                  ) : (
                    <div className="text-[10px] text-stone-500 italic font-mono flex items-center gap-2">
                      <Eye className="w-4 h-4 text-stone-400" />
                      <span>Pending execution. Click Execute to supply clinical data.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Telemetry Indicator */}
      <div className="bg-[#fcfbf9] border-t border-[#eae6df] px-6 py-4 flex items-center justify-between">
        <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest font-extrabold">
          Database: synthea/mimic-iv simulated sandbox
        </span>
      </div>
    </div>
  );
};
