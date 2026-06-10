import React, { useState } from 'react';
import { FHIRBundle, ClinicalToolCall } from '../types/clinical';
import { Database, Network, Code2, ClipboardCheck } from 'lucide-react';

interface FhirGraphProps {
  bundle: FHIRBundle | null;
  toolCalls: ClinicalToolCall[];
  patientName: string;
}

export const FhirGraph: React.FC<FhirGraphProps> = ({ bundle, toolCalls, patientName }) => {
  const [viewMode, setViewMode] = useState<'graph' | 'json'>('graph');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!bundle) return;
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dimensions of SVG canvas
  const width = 500;
  const height = 320;
  const centerNode = { x: width / 2, y: height / 2 + 10, label: patientName };

  // Filter completed tools to represent as nodes in graph
  const completedTools = toolCalls.filter(t => t.status === 'completed');

  return (
    <div className="flex flex-col h-full bg-white border border-[#eae6df] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#eae6df] flex items-center justify-between bg-slatebg-50/50">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slatebg-900/60 font-bold block">Interoperability Bridge</span>
          <h3 className="font-serif text-lg font-extrabold text-slatebg-900">HL7 FHIR Schema Output</h3>
        </div>
        
        {/* Toggle View Mode */}
        <div className="flex bg-[#f4f2eb] border border-[#eae6df] p-1 rounded-xl">
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
              viewMode === 'graph'
                ? 'bg-white text-clinical-600 shadow-sm border border-[#eae6df]'
                : 'text-stone-500 hover:text-slatebg-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Graph Map
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
              viewMode === 'json'
                ? 'bg-white text-clinical-600 shadow-sm border border-[#eae6df]'
                : 'text-stone-500 hover:text-slatebg-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            FHIR JSON
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative bg-[#faf9f6]">
        {viewMode === 'graph' ? (
          <div className="flex flex-col items-center justify-center p-6 h-full min-h-[300px]">
            {completedTools.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
                <Database className="w-8 h-8 animate-pulse text-stone-300" />
                <p className="text-xs font-mono">No compiled FHIR resources yet. Execute lab tools to populate graph.</p>
              </div>
            ) : (
              <div className="w-full relative select-none animate-fade-in">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                  {/* Lines connecting Patient to lab nodes */}
                  {completedTools.map((tool, i) => {
                    const angle = (i * 2 * Math.PI) / completedTools.length - Math.PI / 2;
                    const r = 110;
                    const nx = centerNode.x + r * Math.cos(angle);
                    const ny = centerNode.y + r * Math.sin(angle);

                    const strokeColor =
                      tool.toolName === 'OrderLabTest' ? '#14b8a6' : // Teal
                      tool.toolName === 'OrderImaging' ? '#f59e0b' : // Amber
                      '#6366f1'; // Indigo (Prescriptions)

                    return (
                      <g key={tool.id}>
                        <line
                          x1={centerNode.x}
                          y1={centerNode.y}
                          x2={nx}
                          y2={ny}
                          stroke={strokeColor}
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          className="opacity-70"
                        />
                        <circle cx={nx} cy={ny} r="4" fill={strokeColor} />
                      </g>
                    );
                  })}

                  {/* Patient Node */}
                  <g className="cursor-pointer group">
                    <circle
                      cx={centerNode.x}
                      cy={centerNode.y}
                      r="32"
                      className="fill-clinical-50 stroke-clinical-500 stroke-2 group-hover:fill-clinical-100 transition-colors"
                    />
                    <text
                      x={centerNode.x}
                      y={centerNode.y + 3}
                      textAnchor="middle"
                      className="font-serif text-[10px] font-extrabold fill-clinical-900"
                    >
                      Patient
                    </text>
                    <text
                      x={centerNode.x}
                      y={centerNode.y + 44}
                      textAnchor="middle"
                      className="font-mono text-[9px] font-bold fill-stone-500 uppercase tracking-widest"
                    >
                      {centerNode.label}
                    </text>
                  </g>

                  {/* Leaf Nodes */}
                  {completedTools.map((tool, i) => {
                    const angle = (i * 2 * Math.PI) / completedTools.length - Math.PI / 2;
                    const r = 110;
                    const nx = centerNode.x + r * Math.cos(angle);
                    const ny = centerNode.y + r * Math.sin(angle);

                    const colors =
                      tool.toolName === 'OrderLabTest'
                        ? { fill: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-700' }
                        : tool.toolName === 'OrderImaging'
                        ? { fill: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' }
                        : { fill: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700' };

                    return (
                      <g key={tool.id} className="cursor-pointer">
                        <foreignObject
                          x={nx - 55}
                          y={ny - 22}
                          width="110"
                          height="44"
                          className="overflow-visible"
                        >
                          <div className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center select-none shadow-sm ${colors.fill} ${colors.border}`}>
                            <span className="text-[6px] font-mono uppercase tracking-wider opacity-60 font-bold">
                              {tool.vocab}:{tool.code}
                            </span>
                            <span className={`text-[8px] font-sans font-bold leading-tight truncate w-full ${colors.text}`}>
                              {tool.parameter}
                            </span>
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
                </svg>

                {/* Graph Legend */}
                <div className="flex justify-center gap-4 mt-2 border-t border-[#eae6df] pt-3.5 text-[9px] font-mono text-stone-500 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-tealmed-500 border border-tealmed-400"></span>
                    <span>Observation (Labs)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400"></span>
                    <span>Procedure (Imaging)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-indigo-400"></span>
                    <span>Medication Order</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-full flex flex-col">
            <button
              onClick={handleCopy}
              disabled={!bundle}
              className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-mono text-[9px] font-bold tracking-wider uppercase transition-all hover:scale-[1.03] active:scale-[0.98] ${
                bundle ? 'bg-stone-900 hover:bg-stone-855 text-white' : 'bg-stone-400 text-stone-250 cursor-not-allowed'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              {copied ? 'Copied Bundle' : 'Copy FHIR JSON'}
            </button>
            <pre className="flex-1 p-6 text-[10px] font-mono leading-relaxed text-[#3a3a30] select-text bg-[#fcfbf9] overflow-auto">
              {bundle ? JSON.stringify(bundle, null, 2) : '// Complete simulation steps to view compiled transaction bundle.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
