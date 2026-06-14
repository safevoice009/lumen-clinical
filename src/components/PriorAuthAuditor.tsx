import React, { useState, useEffect } from 'react';
import { SafetyCriterion } from '../types/clinical';
import { ConsensusAuditVerdict } from '../utils/agentCore';
import QRCode from 'qrcode';
import {
  ShieldCheck, ShieldAlert, Clock, FileDown, CheckCircle2, XCircle, Share2, X
} from 'lucide-react';

interface PriorAuthAuditorProps {
  guidelines: SafetyCriterion[];
  onGenerateReport: () => void;
  simulationStep: number;
  totalSteps: number;
  portalUrl?: string;
  consensusVerdict?: ConsensusAuditVerdict | null;
  isAuditing?: boolean;
}

const statusIcon = (status: SafetyCriterion['status']) => {
  if (status === 'passed')   return <CheckCircle2 size={13} color="var(--color-safe)" />;
  if (status === 'violated') return <XCircle size={13} color="var(--color-danger)" style={{ animation: 'pulse-dot 1s ease infinite' }} />;
  return <Clock size={13} color="var(--fg-muted)" />;
};

export const PriorAuthAuditor: React.FC<PriorAuthAuditorProps> = ({
  guidelines, onGenerateReport, simulationStep, totalSteps, portalUrl, consensusVerdict, isAuditing,
}) => {
  const [showQr, setShowQr] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const passed   = guidelines.filter(g => g.status === 'passed').length;
  const violated = guidelines.filter(g => g.status === 'violated').length;
  const pending  = guidelines.filter(g => g.status === 'pending').length;

  const isVerdictReady   = simulationStep >= totalSteps;
  const isCriticalFail   = violated > 0 && guidelines.some(g => g.status === 'violated' && g.severity === 'critical');
  const verdictLabel     = isCriticalFail ? 'FAILED' : (isVerdictReady ? 'APPROVED' : 'IN PROGRESS');

  useEffect(() => {
    if (portalUrl) {
      QRCode.toDataURL(portalUrl, {
        color: {
          dark: '#8b5cf6', // Brand violet
          light: '#ffffff' // White background
        },
        margin: 1,
        width: 140
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error("Failed to generate local QR code:", err);
      });
    }
  }, [portalUrl]);

  return (
    <div className="panel panel-audit" style={{ position: 'relative' }}>
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
        {isAuditing ? (
          <div 
            style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: '11px', 
              color: 'var(--fg-secondary)', 
              background: 'var(--bg-subtle)', 
              border: '1px dashed var(--border-default)', 
              borderRadius: '8px', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
              <span style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-pulse pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }} />
                Consensus Safety Board is auditing...
              </span>
              <span style={{ color: 'var(--fg-muted)' }}>[██████████] 2.1s</span>
            </div>
            <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--fg-muted)', fontSize: '10.5px' }}>
              <div>▸ Received: Dialogue transcript &amp; tool execution traces</div>
              <div>▸ Awaiting: Parallel 3-judge consensus verdict (Gemini x2 + Ollama)</div>
            </div>
          </div>
        ) : (
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
        )}

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

        {/* Consensus Audit 3-Judge Panels */}
        {consensusVerdict && consensusVerdict.judges && (
          <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border-default)', paddingTop: '16px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand)', display: 'block', marginBottom: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
              ⚖️ CONSENSUS AUDIT: 3-JUDGE PANEL
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {consensusVerdict.judges.map((judge, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: 'var(--bg-subtle)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '6px', 
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--fg-muted)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={judge.name}>
                    {judge.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ 
                      fontSize: '9px', 
                      fontWeight: 800, 
                      padding: '2px 4px', 
                      borderRadius: '3px',
                      background: judge.verdict === 'PASS' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                      color: judge.verdict === 'PASS' ? 'var(--fg-safe)' : 'var(--fg-danger)'
                    }}>
                      {judge.verdict}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800 }}>{judge.score}/100</span>
                  </div>
                  {judge.violations && judge.violations.length > 0 ? (
                    <span style={{ fontSize: '8.5px', color: 'var(--fg-danger)', lineHeight: '1.2' }} title={judge.violations.join(', ')}>
                      ⚠️ {judge.violations[0].substring(0, 30)}...
                    </span>
                  ) : (
                    <span style={{ fontSize: '8.5px', color: 'var(--fg-safe)' }}>✓ No violations</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline QR sharing modal overlay */}
        {showQr && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            borderRadius: 'var(--radius-xl)',
            animation: 'fade-in var(--duration-fast) var(--ease) both'
          }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              borderRadius: '12px',
              padding: '16px',
              width: '100%',
              maxWidth: '240px',
              position: 'relative',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <button
                onClick={() => setShowQr(false)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--fg-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                type="button"
              >
                <X size={14} />
              </button>
              <h5 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>
                Scan Patient Discharge Pass
              </h5>
              {portalUrl && qrCodeUrl ? (
                <>
                  <div style={{
                    background: '#fff',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}>
                    <img
                      src={qrCodeUrl}
                      alt="Discharge Pass QR Code"
                      style={{ display: 'block', width: 120, height: 120 }}
                    />
                  </div>
                  <p style={{ fontSize: '9.5px', color: 'var(--fg-muted)', margin: 0, lineHeight: '1.3' }}>
                    Handoff complete clinical summary, medication timeline, and HL7 validation status.
                  </p>
                </>
              ) : (
                <div style={{ padding: '20px 0', fontSize: '11px', color: 'var(--fg-muted)' }}>
                  Awaiting simulation completion to generate discharge record...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="panel-footer" style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-primary" onClick={onGenerateReport} style={{ flex: 1, justifyContent: 'center' }} type="button">
          <FileDown size={13} />
          Export Report
        </button>
        <button
          className="btn"
          onClick={() => setShowQr(!showQr)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            color: 'var(--fg-secondary)'
          }}
          type="button"
          title="Share Safety Report via QR Code"
        >
          <Share2 size={13} />
        </button>
      </div>
    </div>
  );
};
