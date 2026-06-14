import React, { useState, useEffect } from 'react';
import { listenToSpectatorSession, SpectatorPayload } from '../utils/spectatorMode';
import { AgentChat } from './AgentChat';
import { ShieldCheck, ShieldAlert, Cpu, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';

interface SpectatorDashboardProps {
  sessionId: string;
  onBack: () => void;
}

export const SpectatorDashboard: React.FC<SpectatorDashboardProps> = ({ sessionId, onBack }) => {
  const [data, setData] = useState<SpectatorPayload | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConnected(true);
    const unsubscribe = listenToSpectatorSession(
      sessionId,
      (payload) => {
        setData(payload);
        setError(null);
      },
      () => {
        setConnected(false);
        setError('Connection interrupted. Awaiting simulation reboot...');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId]);
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px var(--space-6)', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100vh', color: 'var(--fg-primary)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}
          >
            <ArrowLeft size={14} /> Back to App
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: 700, letterSpacing: '0.05em', fontFamily: "'JetBrains Mono', monospace" }}>
              LIVE MONITORING
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Lumen Spectator Cockpit</h2>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            padding: '4px 10px', 
            borderRadius: '20px', 
            background: connected ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            color: connected ? 'var(--fg-safe)' : 'var(--fg-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            <span className={`status-pulse ${connected ? 'pulse' : ''}`} style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? 'var(--fg-safe)' : 'var(--fg-danger)' }} />
            {connected ? 'LIVE BROADCAST CONNECTED' : 'DISCONNECTED'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--fg-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            ID: {sessionId.substring(11)}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-md)', color: 'var(--fg-danger)', fontSize: '13px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!data ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '300px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '40px', textAlign: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--brand-subtle)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--brand)', margin: '0 auto' }}>
            <Cpu size={24} className="animate-pulse" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Awaiting Simulation Activity</h4>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--fg-muted)', maxWidth: '400px', lineHeight: '1.4' }}>
              The host simulation session is currently idle. When the developer steps the simulation, dialogue bubbles and safety stats will propagate here in real-time.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '20px', alignItems: 'start' }}>
          {/* Chat transcript */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AgentChat messages={data.messages} />
          </div>

          {/* Safety Verdict Dashboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="panel" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '10px', color: 'var(--fg-muted)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", display: 'block', textTransform: 'uppercase' }}>
                  Safety Assessment
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Consensus Audit Verdict</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--fg-muted)', fontWeight: 600 }}>PATIENT</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fg-primary)' }}>{data.patientName}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--fg-muted)', fontWeight: 600, display: 'block' }}>SAFETY SCORE</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: data.safetyScore >= 80 ? 'var(--fg-safe)' : data.safetyScore >= 60 ? 'var(--fg-warn)' : 'var(--fg-danger)' }}>
                      {data.safetyScore}/100
                    </span>
                  </div>
                </div>

                {/* Verdict Badge */}
                <div 
                  style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    textAlign: 'center', 
                    fontWeight: 800,
                    fontSize: '14px',
                    letterSpacing: '0.05em',
                    background: data.verdict === 'PASS' ? 'var(--color-safe-bg)' : data.verdict === 'FAIL' ? 'var(--color-danger-bg)' : 'var(--bg-subtle)',
                    border: data.verdict === 'PASS' ? '1px solid var(--color-safe-border)' : data.verdict === 'FAIL' ? '1px solid var(--color-danger-border)' : '1px solid var(--border-default)',
                    color: data.verdict === 'PASS' ? 'var(--fg-safe)' : data.verdict === 'FAIL' ? 'var(--fg-danger)' : 'var(--fg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {data.verdict === 'PASS' ? <ShieldCheck size={18} /> : data.verdict === 'FAIL' ? <ShieldAlert size={18} /> : <Clock size={18} />}
                  <span>VERDICT: {data.verdict}</span>
                </div>

                {/* Info block */}
                <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12px', lineHeight: '1.4' }}>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: '4px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}>
                    TRANSMISSION METADATA
                  </span>
                  <div>Step: <strong>{data.stepIndex} / {data.totalSteps}</strong></div>
                  <div>Active Agent: <strong style={{ color: 'var(--brand)' }}>{data.activeAgent.toUpperCase()}</strong></div>
                  <div>Status: <strong>{data.isComplete ? 'Simulation Concluded' : 'In Progress'}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SpectatorDashboard;
