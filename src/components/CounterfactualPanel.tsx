import React from 'react';
import { CheckCircle, AlertOctagon } from 'lucide-react';

interface CounterfactualPanelProps {
  originalStatement: string;
  correctedStatement: string;
  failTurn: number;
  reasoning: string;
}

export const CounterfactualPanel: React.FC<CounterfactualPanelProps> = ({
  originalStatement,
  correctedStatement,
  failTurn,
  reasoning
}) => {
  if (!originalStatement && !correctedStatement) return null;

  return (
    <div className="panel panel-counterfactual animate-fade-in" style={{ marginTop: '16px' }}>
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-label">Post-Audit Evaluation</span>
          <span className="panel-title">⚖️ Counterfactual Recommendation</span>
        </div>
      </div>
      <div className="panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--fg-muted)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            SAFETY VIOLATION IDENTIFIED AT TURN {failTurn}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Original */}
            <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--fg-danger)', fontWeight: 700, fontSize: '10px', marginBottom: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
                <AlertOctagon size={12} />
                <span>ORIGINAL STATEMENT (FAILED)</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--fg-primary)', lineHeight: '1.4', fontStyle: 'italic', margin: 0 }}>
                "{originalStatement}"
              </p>
            </div>

            {/* Corrected */}
            <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--fg-safe)', fontWeight: 700, fontSize: '10px', marginBottom: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
                <CheckCircle size={12} />
                <span>CORRECTED ALTERNATIVE (PASS)</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--fg-primary)', lineHeight: '1.4', fontStyle: 'italic', fontWeight: 500, margin: 0 }}>
                "{correctedStatement}"
              </p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '11.5px' }}>
            <span style={{ fontWeight: 700, color: 'var(--fg-muted)', display: 'block', marginBottom: '4px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}>
              🧠 AUDITOR CLINICAL JUSTIFICATION
            </span>
            <p style={{ color: 'var(--fg-primary)', margin: 0, lineHeight: '1.4' }}>
              {reasoning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CounterfactualPanel;
