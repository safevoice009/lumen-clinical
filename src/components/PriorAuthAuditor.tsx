import React from 'react';
import { SafetyCriterion } from '../types/clinical';
import { CheckCircle2, XCircle, Clock, FileSpreadsheet, ShieldCheck, ShieldAlert } from 'lucide-react';

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
  totalSteps,
}) => {
  const violatedCount = guidelines.filter(g => g.status === 'violated').length;
  const passedCount = guidelines.filter(g => g.status === 'passed').length;
  const isCriticalViolated = guidelines.some(g => g.status === 'violated' && g.severity === 'critical');
  const isCompleted = simulationStep >= totalSteps;

  return (
    <div className="safety-panel" style={{ minHeight: '460px' }}>
      {/* Header */}
      <div className="panel-header">
        <div>
          <span className="panel-label">Safety Guardrail Engine</span>
          <span className="panel-title">Clinical Safety Audits</span>
        </div>
        {isCriticalViolated ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 999, padding: '4px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em', animation: 'pulse-glow 1s ease infinite' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            Breach
          </div>
        ) : (
          <div className="live-badge">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-safe)', display: 'inline-block', animation: 'pulse-glow 2s ease infinite', boxShadow: '0 0 6px var(--color-safe)' }} />
            Monitoring
          </div>
        )}
      </div>

      {/* Progress counters */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ flex: 1, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: '#34d399', lineHeight: 1 }}>{passedCount}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Passed</div>
        </div>
        <div style={{ flex: 1, background: violatedCount > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${violatedCount > 0 ? 'rgba(239,68,68,0.18)' : 'var(--border-subtle)'}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: violatedCount > 0 ? '#f87171' : 'var(--text-muted)', lineHeight: 1 }}>{violatedCount}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Violated</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: 'var(--text-secondary)', lineHeight: 1 }}>{guidelines.length - passedCount - violatedCount}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Pending</div>
        </div>
      </div>

      {/* Checklist */}
      <div className="panel-body" style={{ flex: 1 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 12 }}>
          Safety Audit Checklist
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guidelines.map((checkpoint) => (
            <div
              key={checkpoint.id}
              className={`safety-criterion ${checkpoint.status}`}
            >
              {/* Icon */}
              <div className={`criterion-icon ${checkpoint.status}`}>
                {checkpoint.status === 'passed'
                  ? <CheckCircle2 size={13} style={{ color: 'var(--color-safe)' }} />
                  : checkpoint.status === 'violated'
                  ? <XCircle size={13} style={{ color: 'var(--color-danger)' }} />
                  : <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                }
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="criterion-text">{checkpoint.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <span className={`criterion-severity ${checkpoint.severity}`}>
                    {checkpoint.severity}
                  </span>
                  {checkpoint.resolutionMessage && (
                    <span className="criterion-resolution">{checkpoint.resolutionMessage}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verdict + CTA */}
      <div className="panel-footer" style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Verdict Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: 14,
          border: `1px solid ${isCriticalViolated ? 'rgba(239,68,68,0.30)' : isCompleted ? 'rgba(16,185,129,0.25)' : 'var(--border-subtle)'}`,
          background: isCriticalViolated ? 'rgba(239,68,68,0.08)' : isCompleted ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isCriticalViolated
              ? <ShieldAlert size={18} style={{ color: '#f87171' }} />
              : <ShieldCheck size={18} style={{ color: isCompleted ? '#34d399' : 'var(--text-muted)' }} />
            }
            <div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 2 }}>
                Guardrail Verdict
              </span>
              <strong style={{ fontSize: 12, fontWeight: 800, color: isCriticalViolated ? '#f87171' : isCompleted ? '#34d399' : 'var(--text-secondary)', letterSpacing: '-0.02em' }}>
                {isCriticalViolated
                  ? '⚠ CRITICAL BREACH DETECTED'
                  : isCompleted
                  ? '✓ Clinical Safety Verified'
                  : '⏳ Active Audit Loop...'}
              </strong>
            </div>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: violatedCount > 0 ? '#f87171' : 'var(--text-muted)' }}>
            {violatedCount} / {guidelines.length}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={onGenerateReport}
          disabled={!isCompleted && !isCriticalViolated}
          className="btn-report"
          style={{
            opacity: (!isCompleted && !isCriticalViolated) ? 0.35 : 1,
            cursor: (!isCompleted && !isCriticalViolated) ? 'not-allowed' : 'pointer',
          }}
        >
          <FileSpreadsheet size={14} />
          Export Clinical Audit Report
        </button>
      </div>
    </div>
  );
};
