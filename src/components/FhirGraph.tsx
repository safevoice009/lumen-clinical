import React, { useState } from 'react';
import { FHIRBundle, ClinicalToolCall } from '../types/clinical';
import { Network, Code2, ClipboardCheck, CheckCheck } from 'lucide-react';

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

  const width = 500;
  const height = 300;
  const centerNode = { x: width / 2, y: height / 2, label: patientName };
  const completedTools = toolCalls.filter(t => t.status === 'completed');

  const nodeColors: Record<string, { stroke: string; fill: string; text: string }> = {
    'OrderLabTest':      { stroke: '#06b6d4', fill: 'rgba(6,182,212,0.12)',    text: '#22d3ee' },
    'OrderImaging':      { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.12)',   text: '#fbbf24' },
    'PrescribeMedication':{ stroke: '#818cf8', fill: 'rgba(129,140,248,0.12)', text: '#a5b4fc' },
  };

  return (
    <div className="fhir-graph-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '460px' }}>
      {/* Header */}
      <div className="panel-header">
        <div>
          <span className="panel-label">Interoperability Bridge</span>
          <span className="panel-title">HL7 FHIR R4 Output</span>
        </div>
        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 4 }}>
          {(['graph', 'json'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                border: viewMode === mode ? '1px solid var(--border-brand)' : '1px solid transparent',
                background: viewMode === mode ? 'rgba(6,182,212,0.10)' : 'transparent',
                color: viewMode === mode ? 'var(--brand-400)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'var(--transition)',
              }}
            >
              {mode === 'graph' ? <Network size={12} /> : <Code2 size={12} />}
              {mode === 'graph' ? 'Graph' : 'FHIR JSON'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', background: 'rgba(0,0,0,0.15)', position: 'relative' }}>
        {viewMode === 'graph' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, height: '100%', minHeight: 280 }}>
            {completedTools.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">🔗</div>
                <p className="chat-empty-text">No FHIR resources compiled yet.<br />Execute lab tools to populate graph.</p>
              </div>
            ) : (
              <div style={{ width: '100%', position: 'relative' }} className="animate-fade-in">
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
                      <stop offset="100%" stopColor="rgba(6,182,212,0.05)" />
                    </radialGradient>
                  </defs>

                  {/* Connection lines */}
                  {completedTools.map((tool, i) => {
                    const angle = (i * 2 * Math.PI) / completedTools.length - Math.PI / 2;
                    const r = 115;
                    const nx = centerNode.x + r * Math.cos(angle);
                    const ny = centerNode.y + r * Math.sin(angle);
                    const c = nodeColors[tool.toolName] || nodeColors['OrderLabTest'];
                    return (
                      <g key={`line-${tool.id}`}>
                        <line
                          x1={centerNode.x} y1={centerNode.y}
                          x2={nx} y2={ny}
                          stroke={c.stroke} strokeWidth="1"
                          strokeDasharray="4,4" opacity={0.5}
                        />
                        <circle cx={nx} cy={ny} r={5} fill={c.stroke} opacity={0.9} />
                      </g>
                    );
                  })}

                  {/* Center patient node */}
                  <circle cx={centerNode.x} cy={centerNode.y} r={34} fill="url(#centerGrad)" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
                  <text x={centerNode.x} y={centerNode.y + 4} textAnchor="middle" style={{ fill: 'var(--brand-400)', fontSize: 10, fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
                    Patient
                  </text>
                  <text x={centerNode.x} y={centerNode.y + 46} textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {centerNode.label.split(' ')[0]}
                  </text>

                  {/* Tool nodes */}
                  {completedTools.map((tool, i) => {
                    const angle = (i * 2 * Math.PI) / completedTools.length - Math.PI / 2;
                    const r = 115;
                    const nx = centerNode.x + r * Math.cos(angle);
                    const ny = centerNode.y + r * Math.sin(angle);
                    const c = nodeColors[tool.toolName] || nodeColors['OrderLabTest'];
                    return (
                      <g key={`node-${tool.id}`}>
                        <foreignObject x={nx - 56} y={ny - 24} width={112} height={48} style={{ overflow: 'visible' }}>
                          <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', padding: '5px 8px',
                            background: c.fill, border: `1px solid ${c.stroke}`,
                            borderRadius: 10, textAlign: 'center',
                          }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: c.text, fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {tool.vocab}:{tool.code}
                            </span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginTop: 2 }}>
                              {tool.parameter.length > 16 ? tool.parameter.slice(0, 16) + '…' : tool.parameter}
                            </span>
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                  {[
                    { color: '#06b6d4', label: 'Lab (LOINC)' },
                    { color: '#f59e0b', label: 'Imaging (CPT)' },
                    { color: '#818cf8', label: 'Medication (RxNorm)' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block', boxShadow: `0 0 6px ${item.color}` }} />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={handleCopy}
              disabled={!bundle}
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 20,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, fontWeight: 700,
                border: '1px solid var(--border-default)',
                background: bundle ? 'var(--bg-card)' : 'transparent',
                color: bundle ? 'var(--text-secondary)' : 'var(--text-muted)',
                cursor: bundle ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)',
              }}
            >
              {copied ? <CheckCheck size={12} style={{ color: 'var(--color-safe)' }} /> : <ClipboardCheck size={12} />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
            <pre style={{
              flex: 1, padding: '20px 22px', paddingTop: 50,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: 'var(--text-secondary)', lineHeight: 1.7,
              overflowY: 'auto', background: 'transparent',
              userSelect: 'text',
            }}>
              {bundle
                ? JSON.stringify(bundle, null, 2)
                : '// Run the simulation and execute lab tools\n// to compile a FHIR R4 transaction bundle.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
