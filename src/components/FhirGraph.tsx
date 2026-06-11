import React, { useState } from 'react';
import { FHIRBundle, ClinicalToolCall } from '../types/clinical';
import { Network, Code2, ClipboardCheck, CheckCheck } from 'lucide-react';

interface FhirGraphProps {
  bundle: FHIRBundle | null;
  toolCalls: ClinicalToolCall[];
  patientName: string;
}

const NODE_COLORS: Record<string, { stroke: string; fill: string; text: string }> = {
  'OrderLabTest':        { stroke: 'var(--brand)', fill: 'var(--brand-subtle)', text: 'var(--fg-brand)' },
  'OrderImaging':        { stroke: 'var(--color-safe)', fill: 'var(--color-safe-bg)', text: 'var(--fg-safe)' },
  'PrescribeMedication': { stroke: 'var(--color-redteam)', fill: 'var(--color-redteam-bg)', text: 'var(--color-redteam)' },
};

export const FhirGraph: React.FC<FhirGraphProps> = ({ bundle, toolCalls, patientName }) => {
  const [view, setView] = useState<'graph' | 'json'>('graph');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!bundle) return;
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completed = toolCalls.filter(t => t.status === 'completed');
  const W = 480, H = 280;

  return (
    <div className="panel fhir-panel panel-audit">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-label">Step 5 · Interoperability Bridge</span>
          <span className="panel-title">HL7 FHIR R4 Output</span>
        </div>
        {/* View toggle */}
        <div className="fhir-view-toggle">
          <button className={`fhir-view-btn ${view === 'graph' ? 'active' : ''}`} onClick={() => setView('graph')}>
            <Network size={11} /> Graph
          </button>
          <button className={`fhir-view-btn ${view === 'json' ? 'active' : ''}`} onClick={() => setView('json')}>
            <Code2 size={11} /> JSON
          </button>
        </div>
      </div>

      <div className="panel-body" style={{ padding: view === 'json' ? 0 : undefined }}>
        {view === 'graph' ? (
          completed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <p className="empty-title">No FHIR resources yet</p>
              <p className="empty-sub">Execute lab tools to populate<br />the resource graph</p>
            </div>
          ) : (
            <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* SVG Graph */}
              <svg
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', height: 'auto' }}
              >
                <defs>
                  <radialGradient id="cg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsla(38,92%,60%,0.22)" />
                    <stop offset="100%" stopColor="hsla(38,92%,60%,0.04)" />
                  </radialGradient>
                </defs>

                {/* Lines */}
                {completed.map((tool, i) => {
                  const angle = (i * 2 * Math.PI) / completed.length - Math.PI / 2;
                  const r = 106;
                  const nx = W / 2 + r * Math.cos(angle);
                  const ny = H / 2 + r * Math.sin(angle);
                  return (
                    <line key={`l-${tool.id}`}
                      x1={W/2} y1={H/2} x2={nx} y2={ny}
                      stroke="var(--border-strong)" strokeWidth="1"
                      strokeDasharray="4,4" opacity={0.5}
                    />
                  );
                })}

                {/* Center patient node */}
                <circle cx={W/2} cy={H/2} r={32} fill="url(#cg)" stroke="var(--brand-border)" strokeWidth="1.5" />
                <text x={W/2} y={H/2 + 4} textAnchor="middle"
                  style={{ fill: 'var(--fg-brand)', fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Patient
                </text>
                <text x={W/2} y={H/2 + 44} textAnchor="middle"
                  style={{ fill: 'var(--fg-muted)', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                  {patientName.split(' ')[0]}
                </text>

                {/* Tool nodes */}
                {completed.map((tool, i) => {
                  const angle = (i * 2 * Math.PI) / completed.length - Math.PI / 2;
                  const r = 106;
                  const nx = W / 2 + r * Math.cos(angle);
                  const ny = H / 2 + r * Math.sin(angle);
                  const c = NODE_COLORS[tool.toolName] || NODE_COLORS['OrderLabTest'];
                  return (
                    <foreignObject key={`n-${tool.id}`} x={nx - 54} y={ny - 22} width={108} height={44}>
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', padding: '5px 8px',
                        background: c.fill, border: `1px solid ${c.stroke}`,
                        borderRadius: 10, textAlign: 'center',
                      }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7.5, color: c.text, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {tool.vocab}:{tool.code}
                        </span>
                        <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--fg-secondary)', marginTop: 2 }}>
                          {tool.parameter.length > 16 ? tool.parameter.slice(0, 15) + '…' : tool.parameter}
                        </span>
                      </div>
                    </foreignObject>
                  );
                })}
              </svg>

              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '10px 0', borderTop: '1px solid var(--border-subtle)' }}>
                {[
                  { label: 'Lab (LOINC)', color: 'var(--brand)' },
                  { label: 'Imaging (CPT)', color: 'var(--color-safe)' },
                  { label: 'Rx (RxNorm)', color: 'var(--color-redteam)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-muted)', fontWeight: 700 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* JSON View */
          <div style={{ position: 'relative', height: '100%' }}>
            <button
              onClick={handleCopy}
              disabled={!bundle}
              className="btn btn-sm"
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
            >
              {copied ? <><CheckCheck size={11} style={{ color: 'var(--color-safe)' }} /> Copied</> : <><ClipboardCheck size={11} /> Copy</>}
            </button>
            <div className="fhir-json-view" style={{ padding: '14px 18px', paddingTop: 44 }}>
              {bundle
                ? JSON.stringify(bundle, null, 2)
                : '// Execute lab tools to compile\n// a FHIR R4 transaction bundle'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
