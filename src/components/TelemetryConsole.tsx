import React, { useState } from 'react';
import { TelemetryLog } from '../types/clinical';
import { Terminal, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface TelemetryConsoleProps {
  logs: TelemetryLog[];
  onClear: () => void;
}

export const TelemetryConsole: React.FC<TelemetryConsoleProps> = ({ logs, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate mock token stats
  const totalTokens = logs.length * 342;
  const mockCost = (totalTokens * 0.000015).toFixed(4);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
      <div className={`w-full max-w-6xl bg-slatebg-900 border border-stone-800 rounded-t-[32px] overflow-hidden shadow-[0_-15px_40px_rgba(0,0,0,0.18)] transition-all duration-500 ease-in-out pointer-events-auto ${
        isOpen ? 'h-80' : 'h-16'
      }`}>
        {/* Toggle Drawer Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-8 py-5 hover:bg-stone-800/40 transition-colors cursor-pointer text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-stone-200 to-emerald-400 font-extrabold flex items-center gap-2 pl-4 border-l border-stone-850 tracking-tight font-mono text-xs uppercase">
              <Terminal className="w-4 h-4 text-stone-400" />
              Developer Telemetry Logs
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isOpen ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronUp className="w-5 h-5 text-stone-400" />}
          </div>
        </button>

        {/* Logs Console Box */}
        {isOpen && (
          <div className="flex flex-col h-[calc(100%-64px)] font-mono text-[10px] text-stone-300">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center px-8 py-2.5 bg-black/40 border-b border-stone-850">
              <div className="flex items-center gap-4 text-stone-400">
                <span>Total Logs: <strong className="text-stone-200">{logs.length}</strong></span>
                <span>Calculated Volume: <strong className="text-stone-200">{totalTokens} Tokens</strong></span>
                <span>Audit Overhead: <strong className="text-amber-400">${mockCost}</strong></span>
              </div>
              <button
                onClick={onClear}
                className="flex items-center gap-1 hover:text-rose-400 text-stone-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Trace
              </button>
            </div>

            {/* Logs Output list */}
            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-2 select-text bg-[#0c0a09]/95">
              {logs.length === 0 ? (
                <div className="flex items-center gap-2 text-stone-500">
                  <span className="text-stone-600">➜</span>
                  <span>Console initialized. Awaiting pipeline telemetry logs...</span>
                </div>
              ) : (
                logs.map((log) => {
                  let colorClass = "text-sky-400";
                  if (log.level === "success") colorClass = "text-emerald-400";
                  if (log.level === "warn") colorClass = "text-amber-400";
                  if (log.level === "error") colorClass = "text-rose-400";

                  return (
                    <div key={log.id} className="flex items-start gap-3 hover:bg-stone-800/20 py-0.5 rounded leading-relaxed">
                      <span className="text-stone-550 shrink-0">[{log.timestamp.split("T")[1].slice(0, 8)}]</span>
                      <span className={`font-bold shrink-0 w-24 uppercase ${colorClass}`}>
                        {log.component}
                      </span>
                      <span className="text-stone-200 flex-1">{log.message}</span>
                      {log.durationMs !== undefined && (
                        <span className="text-stone-500 shrink-0 ml-2">({log.durationMs}ms)</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
