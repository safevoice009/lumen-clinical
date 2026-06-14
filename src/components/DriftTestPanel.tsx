import React, { useState } from 'react';
import { runDriftTest } from '../utils/driftAnalysis';
import { ShieldCheck, ShieldAlert, Play, RotateCcw } from 'lucide-react';

interface DriftTestPanelProps {
  scenario: any;
  patientEnvelope: any;
  selectedLanguage: string;
  forceViolation: boolean;
}

export const DriftTestPanel: React.FC<DriftTestPanelProps> = ({
  scenario,
  patientEnvelope,
  selectedLanguage,
  forceViolation
}) => {
  const [runs, setRuns] = useState(5);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRunTest = async () => {
    setRunning(true);
    try {
      const res = await runDriftTest(scenario, patientEnvelope, runs, selectedLanguage, forceViolation);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="panel panel-drift animate-fade-in" style={{ marginTop: '16px' }}>
      <div className="panel-header">
        <span className="panel-title">📉 Protocol Drift &amp; Consistency Tester</span>
      </div>
      <div className="panel-body">
        {!result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--fg-primary)', margin: 0, lineHeight: '1.4' }}>
              Evaluate safety consistency by running the current scenario <strong>{runs}</strong> times under identical constraints to calculate the standard deviation.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fg-muted)', fontFamily: "'JetBrains Mono', monospace" }}>RUNS COUNT:</label>
              <select
                value={runs}
                onChange={e => setRuns(Number(e.target.value))}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--fg-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value={3}>3 runs</option>
                <option value={5}>5 runs</option>
                <option value={8}>8 runs</option>
                <option value={10}>10 runs</option>
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRunTest}
                disabled={running}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '24px' }}
              >
                {running ? 'Running...' : <><Play size={12} /> Execute Drift Test</>}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--fg-muted)', display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>MEAN SAFETY SCORE</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--fg-primary)' }}>{result.mean}/100</span>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--fg-muted)', display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>STANDARD DEVIATION</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: result.isClinicallySafe ? 'var(--fg-safe)' : 'var(--fg-danger)' }}>±{result.stdDev}</span>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--fg-muted)', display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>RANGE (MIN / MAX)</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--fg-primary)' }}>{result.min} - {result.max}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '6px',
                border: result.isClinicallySafe ? '1px solid var(--color-safe-border)' : '1px solid var(--color-danger-border)',
                background: result.isClinicallySafe ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)'
              }}
            >
              {result.isClinicallySafe ? (
                <>
                  <ShieldCheck size={20} color="var(--fg-safe)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fg-safe)' }}>CLINICALLY SAFE VARIANCE</span>
                    <span style={{ fontSize: '11px', color: 'var(--fg-primary)' }}>The protocol variance is within safety thresholds (SD &le; 15).</span>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert size={20} color="var(--fg-danger)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fg-danger)' }}>UNSAFE CLINICAL VARIANCE DETECTED</span>
                    <span style={{ fontSize: '11px', color: 'var(--fg-primary)' }}>Warning: Safety behaviors drift significantly under identical runs (SD &gt; 15).</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--fg-muted)', fontFamily: "'JetBrains Mono', monospace" }}>RUNS LOGS:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                {result.runs.map((r: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '11px', padding: '6px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Run {idx + 1}: {r.transcript.substring(0, 70)}...</span>
                    <span style={{ fontWeight: 700, color: r.verdict === 'PASS' ? 'var(--fg-safe)' : r.verdict === 'PARTIAL' ? 'var(--fg-warn)' : 'var(--fg-danger)' }}>{r.verdict} ({r.safetyScore}/100)</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={12} /> Run New Drift Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default DriftTestPanel;
