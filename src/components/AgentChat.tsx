import React from 'react';
import { SimulationMessage } from '../types/clinical';
import { Stethoscope, User, HelpCircle, Eye } from 'lucide-react';

interface AgentChatProps {
  messages: SimulationMessage[];
}

export const AgentChat: React.FC<AgentChatProps> = ({ messages }) => {
  return (
    <div className="flex flex-col h-full bg-white border border-[#eae6df] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#eae6df] flex items-center justify-between bg-slatebg-50/50">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slatebg-900/60 font-bold block">Autonomous Interaction</span>
          <h3 className="font-serif text-lg font-extrabold text-slatebg-900">Agentic Intake Dialogue</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-150 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-700 font-extrabold">Live Sim</span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-stone-400 space-y-2">
            <HelpCircle className="w-8 h-8 animate-pulse text-stone-300" />
            <p className="text-xs font-mono">Simulation not started. Click Play/Step to launch diagnostic agents dialogue.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isDoc = msg.sender === 'doctor';
            return (
              <div
                key={msg.id}
                className={`flex gap-4 p-5 rounded-3xl border animate-fade-in ${
                  isDoc
                    ? 'bg-clinical-50 border-clinical-100 text-clinical-900 ml-4'
                    : 'bg-stone-50 border-[#eae6df] text-stone-900 mr-4'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#eae6df] shrink-0">
                  {isDoc ? (
                    <Stethoscope className="w-4 h-4 text-clinical-600" />
                  ) : (
                    <User className="w-4 h-4 text-stone-500" />
                  )}
                </div>

                {/* Message Content */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-extrabold text-slatebg-900">{msg.senderName}</span>
                    <span className="text-[9px] font-mono text-stone-450">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-stone-750 leading-relaxed font-sans select-text">{msg.message}</p>

                  {/* Thought Chain Dropdown */}
                  {msg.thoughtChain && (
                    <div className="border-t border-black/5 pt-2 mt-2">
                      <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-stone-400 font-extrabold mb-1">
                        <Eye className="w-3.5 h-3.5 text-stone-400" />
                        <span>Agent Reasoning Thought Logs</span>
                      </div>
                      <p className="text-[10px] font-mono text-stone-550 leading-tight italic bg-white/40 p-2 rounded-lg">
                        {msg.thoughtChain}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Context Notice */}
      <div className="bg-[#fcfbf9] border-t border-[#eae6df] px-6 py-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-clinical-500 animate-pulse"></div>
        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider font-semibold">
          Audit status: Agentic simulation logs verified in runtime database.
        </span>
      </div>
    </div>
  );
};
