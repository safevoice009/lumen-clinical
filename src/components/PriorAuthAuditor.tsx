import React from 'react';
import { SafetyCriterion } from '../types/clinical';
import { ShieldCheck, ShieldAlert, Clock, FileDown, CheckCircle2, XCircle } from 'lucide-react';

interface PriorAuthAuditorProps {
  guidelines: SafetyCriterion[];
  onGenerateReport: () => void;
  simulationStep: number;
  totalSteps: number;
}

const statusIcon = (status: SafetyCriterion['status']) => {
  if (status === 'passed')   return <CheckCircle2 size={13} color="var(--color-safe)" />;
  if (status === 'violated') return <XCircle size={13} color="var(--color-danger)" style={{ animation: 'pulse-dot 1s ease infinite' }} />;
  return <Clock size={13} color="var(--fg-muted)" />;
};

export const PriorAuthAuditor: React.FC<PriorAuthAuditorProps> = ({
  guidelines, onGenerateReport, simulationStep, totalSteps,
}) => {
  const passed   = guidelines.filter(g => g.status === 'passed').length;
  const violated = guidelines.filter(g => g.status === 'violated').length;
  const pending  = guidelines.filter(g => g.status === 'pending').length;

  const isVerdictReady   = simulationStep >= totalSteps;
  const isCriticalFail   = violated > 0 && guidelines.some(g => g.status === 'violated' && g.severity === 'critical');
  const verdictLabel     = isCriticalFail ? 'FAILED' : (isVerdictReady ? 'APPROVED' : 'IN PROGRESS');

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-label">Step 4 · Safety Guardrail Engine</span>
          <span className="panel-title">Clinical Safety Audits</span>
        </div>
        {isVerdictReady && (
          <span
            className="panel-badge"
            style={isCriticalFail
              ? { background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--fg-danger)' }
              : { background: 'var(--color-safe-bg)', border: '1px solid var(--color-safe-border)', color: 'var(--fg-safe)' }
            }
          >
            {isCriticalFail ? <ShieldAlert size={9} /> : <ShieldCheck size={9} />}
            {verdictLabel}
          </span>
        )}
      </div>

      <div className="panel-body">
        {/* Stats */}
        <div className="safety-stats">
          <div className="stat-box safe">
            <span className="stat-value">{passed}</span>
            <span className="stat-label">Passed</span>
          </div>
          <div className="stat-box danger">
            <span className="stat-value">{violated}</span>
            <span className="stat-label">Violated</span>
          </div>
          <div className="stat-box pending">
            <span className="stat-value">{pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        {/* Criteria */}
        <div className="criterion-list">
          {guidelines.map((g) => (
            <div key={g.id} className={`criterion-item ${g.status}`}>
              <div className="criterion-icon">{statusIcon(g.status)}</div>
              <div className="criterion-content">
                <p className="criterion-text">{g.description}</p>
                {g.resolutionMessage && (
                  <p className="criterion-resolution">→ {g.resolutionMessage}</p>
                )}
              </div>
              <span className={`severity-chip ${g.severity}`}>{g.severity}</span>
            </div>
          ))}
        </div>

        {/* Verdict card */}
        {isVerdictReady && (
          <div
            className="audit-verdict-card"
            style={{
              marginTop: 16,
              borderColor: isCriticalFail ? 'var(--color-danger-border)' : 'var(--color-safe-border)',
              background: isCriticalFail ? 'var(--color-danger-bg)' : 'var(--color-safe-bg)',
            }}
          >
            <span style={{ color: isCriticalFail ? 'var(--fg-danger)' : 'var(--fg-safe)', fontWeight: 800, fontSize: 12 }}>
              {isCriticalFail ? '🔴 Safety violation detected' : '🟢 All criteria satisfied'}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--fg-muted)', fontWeight: 700 }}>
              {passed}/{guidelines.length}
            </span>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <button className="btn btn-primary" onClick={onGenerateReport} style={{ width: '100%', justifyContent: 'center' }}>
          <FileDown size={13} />
          Export Audit Report
        </button>
      </div>
    </div>
  );
};
