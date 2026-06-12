import React, { useState } from 'react';
import { ClinicalToolCall } from '../types/clinical';
import {
  FlaskConical, CheckCircle2, Clock, Zap, AlertTriangle, Check, ChevronDown, ChevronUp
} from 'lucide-react';

interface MetricRowProps {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status: 'safe' | 'warn' | 'danger';
}

const MetricRow: React.FC<MetricRowProps> = ({ name, value, unit, referenceRange, status }) => {
  const statusColors = {
    safe: { text: 'var(--fg-safe)', bg: 'var(--color-safe-bg)', border: 'var(--color-safe-border)', label: 'Normal' },
    warn: { text: 'var(--fg-warn)', bg: 'var(--color-warn-bg)', border: 'var(--color-warn-border)', label: 'Abnormal' },
    danger: { text: 'var(--fg-danger)', bg: 'var(--color-danger-bg)', border: 'var(--color-danger-border)', label: 'Critical' }
  };

  const { text, bg, border, label } = statusColors[status];

  return (
    <div className="lab-metric-row" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 8px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '6px',
      fontSize: '11px',
      gap: '6px'
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{name}</span>
        {referenceRange && (
          <span style={{ fontSize: '9px', color: 'var(--fg-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            Ref: {referenceRange}{unit ? ` ${unit}` : ''}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'right' }}>
        <strong style={{ color: text, fontFamily: "'JetBrains Mono', monospace", fontSize: '11.5px' }}>
          {value}{unit ? ` ${unit}` : ''}
        </strong>
        <span style={{
          fontSize: '8px',
          fontWeight: 700,
          padding: '1px 4px',
          borderRadius: '3px',
          background: bg,
          border: `1px solid ${border}`,
          color: text,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};

interface StructuredMetric {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status: 'safe' | 'warn' | 'danger';
}

interface StructuredLabResult {
  title: string;
  subtitle: string;
  overallStatus: 'safe' | 'warn' | 'danger';
  overallLabel: string;
  metrics: StructuredMetric[];
  findings?: string;
}

const parseLabResult = (code: string, vocab: string, toolName: string, rawResult: string): StructuredLabResult => {
  const normCode = code.trim().toLowerCase();
  
  if (normCode === '6690-2') {
    return {
      title: 'Complete Blood Count (CBC)',
      subtitle: 'LOINC 6690-2 · Automated Panel',
      overallStatus: 'danger',
      overallLabel: 'Critical Leukocytosis',
      metrics: [
        { name: 'White Blood Cell (WBC)', value: '14.5', unit: 'x10³/µL', referenceRange: '4.5 - 11.0', status: 'danger' },
        { name: 'Neutrophil Fraction', value: '82', unit: '%', referenceRange: '40 - 70', status: 'danger' },
        { name: 'Platelet Count', value: 'Normal', referenceRange: '150 - 450 x10³/µL', status: 'safe' }
      ],
      findings: 'WBC count is significantly elevated at 14.5 x10³/µL with a high neutrophil fraction (82%), demonstrating a clear left shift diagnostic of acute systemic inflammation or infection.'
    };
  }

  if (normCode === '29308-4') {
    return {
      title: 'Quantiferon-TB Gold',
      subtitle: 'LOINC 29308-4 · TB Antigen Assay',
      overallStatus: 'safe',
      overallLabel: 'Normal (Negative)',
      metrics: [
        { name: 'Tuberculosis Antigen Response', value: 'Negative', referenceRange: 'Negative', status: 'safe' }
      ],
      findings: 'Negative screen. No evidence of active or latent Mycobacterium tuberculosis infection. Cleared for biologic treatment initiating sequence.'
    };
  }

  if (normCode === '76700') {
    return {
      title: 'Abdominal Ultrasound',
      subtitle: 'CPT 76700 · Right Lower Quadrant Protocol',
      overallStatus: 'danger',
      overallLabel: 'Suggestive of Acute Appendicitis',
      metrics: [
        { name: 'Appendix Diameter', value: '7.2', unit: 'mm', referenceRange: '< 6.0', status: 'danger' },
        { name: 'Circumferential Wall Thickening', value: 'Present', referenceRange: 'Absent', status: 'danger' },
        { name: 'Free Fluid (R Iliac Fossa)', value: 'Minimal', referenceRange: 'Absent', status: 'warn' }
      ],
      findings: 'Ultrasound shows an enlarged appendix (7.2mm) with wall thickening and trace peritoneal fluid. Clinical findings are highly suggestive of acute appendicitis.'
    };
  }

  if (normCode === '93000') {
    return {
      title: '12-Lead Electrocardiogram (ECG)',
      subtitle: 'CPT 93000 · Diagnostic Tracing',
      overallStatus: 'warn',
      overallLabel: 'Abnormal ECG Tracing',
      metrics: [
        { name: 'Cardiac Rhythm', value: 'Sinus Rhythm', referenceRange: 'Sinus Rhythm', status: 'safe' },
        { name: 'Left Ventricular Hypertrophy', value: 'Present', referenceRange: 'Absent', status: 'warn' },
        { name: 'ST-T Wave Changes', value: 'Abnormal (Lateral leads)', referenceRange: 'Absent / Normal', status: 'warn' }
      ],
      findings: 'ECG shows sinus rhythm with criteria met for Left Ventricular Hypertrophy (LVH) and associated non-specific lateral ST-T wave abnormalities.'
    };
  }

  if (normCode === '93306') {
    return {
      title: 'Transthoracic Echocardiogram (TTE)',
      subtitle: 'CPT 93306 · Echocardiography Complete',
      overallStatus: 'warn',
      overallLabel: 'Diastolic Dysfunction',
      metrics: [
        { name: 'LV Ejection Fraction (LVEF)', value: '52', unit: '%', referenceRange: '≥ 50', status: 'safe' },
        { name: 'Diastolic Filling Protocol', value: 'Grade II Dysfunction', referenceRange: 'Normal Filling', status: 'warn' },
        { name: 'Mitral Valve Regurgitation', value: 'Mild', referenceRange: 'Trace / None', status: 'warn' }
      ],
      findings: 'Preserved ejection fraction of 52%. Grade II diastolic filling dysfunction and mild mitral regurgitation are present. Systolic function is preserved.'
    };
  }

  // Handle generic eGFR
  if (normCode.includes('egfr') || normCode === 'gfr' || rawResult.toLowerCase().includes('egfr')) {
    const match = rawResult.match(/egfr\s*(\d+)/i) || rawResult.match(/(\d+)\s*ml\/min/i) || [null, '32'];
    const egfrValue = match[1] || '32';
    const numValue = parseInt(egfrValue, 10);
    let status: 'safe' | 'warn' | 'danger' = 'safe';
    let label = 'Normal Renal Function';
    if (numValue < 30) {
      status = 'danger';
      label = 'Severe CKD (Stage 4)';
    } else if (numValue < 60) {
      status = 'danger';
      label = 'Moderate CKD (Stage 3)';
    } else if (numValue < 90) {
      status = 'warn';
      label = 'Mild CKD (Stage 2)';
    }
    return {
      title: 'Estimated Glomerular Filtration Rate (eGFR)',
      subtitle: 'LOINC 30973-2 · Renal Profile',
      overallStatus: status,
      overallLabel: label,
      metrics: [
        { name: 'eGFR Result', value: egfrValue, unit: 'mL/min/1.73m²', referenceRange: '≥ 90', status }
      ],
      findings: `Calculated eGFR is ${egfrValue} mL/min/1.73m², confirming significant renal impairment. Avoid nephrotoxic agents and modify medication dosages.`
    };
  }

  // Fallback
  const isHighRisk = rawResult.toLowerCase().includes('elevated') || rawResult.toLowerCase().includes('positive') || rawResult.toLowerCase().includes('abnormal') || rawResult.toLowerCase().includes('thickening') || rawResult.toLowerCase().includes('suggestive');
  const isNormal = rawResult.toLowerCase().includes('normal') || rawResult.toLowerCase().includes('negative') || rawResult.toLowerCase().includes('clear') || rawResult.toLowerCase().includes('within normal');
  
  return {
    title: toolName || 'Clinical Tool/Lab Result',
    subtitle: `${vocab} ${code}`,
    overallStatus: isHighRisk ? 'danger' : isNormal ? 'safe' : 'warn',
    overallLabel: isHighRisk ? 'Abnormal / Elevated' : isNormal ? 'Normal / Clear' : 'Completed Observation',
    metrics: [
      { name: 'Result Code Finding', value: rawResult.length > 50 ? 'Reported Finding' : rawResult, status: isHighRisk ? 'danger' : isNormal ? 'safe' : 'warn' }
    ],
    findings: rawResult
  };
};

const LabResultCard: React.FC<{ code: string; vocab: string; toolName: string; result: string }> = ({
  code,
  vocab,
  toolName,
  result
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const structured = parseLabResult(code, vocab, toolName, result);

  const statusThemes = {
    safe: { border: 'var(--color-safe-border)', text: 'var(--fg-safe)', bg: 'var(--color-safe-bg)', label: 'Normal / Clear' },
    warn: { border: 'var(--color-warn-border)', text: 'var(--fg-warn)', bg: 'var(--color-warn-bg)', label: 'Borderline / Warning' },
    danger: { border: 'var(--color-danger-border)', text: 'var(--fg-danger)', bg: 'var(--color-danger-bg)', label: 'Critical / Elevated' }
  };

  const { border, text, bg, label } = statusThemes[structured.overallStatus];

  return (
    <div style={{
      marginTop: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '100%',
      background: bg,
      borderRadius: '8px',
      padding: '8px',
      border: `1px solid ${border}`,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
        <span style={{ fontSize: '10.5px', fontWeight: 700, color: text, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {structured.overallStatus === 'safe' ? <Check size={11} /> : <AlertTriangle size={11} />}
          {label}
        </span>
        <span style={{ fontSize: '8.5px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--fg-muted)', background: 'var(--bg-subtle)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
          {structured.subtitle}
        </span>
      </div>

      {/* Metrics List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {structured.metrics.map((m, idx) => (
          <MetricRow
            key={idx}
            name={m.name}
            value={m.value}
            unit={m.unit}
            referenceRange={m.referenceRange}
            status={m.status}
          />
        ))}
      </div>

      {/* Narrative Clinical Interpretations */}
      {structured.findings && (
        <div style={{
          padding: '6px 8px',
          background: 'var(--bg-card)',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          fontSize: '10.5px',
          color: 'var(--fg-secondary)',
          lineHeight: '1.45'
        }}>
          <strong>Interpretation:</strong> {structured.findings}
        </div>
      )}

      {/* Original Raw Trace Toggle */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '4px', marginTop: '2px' }}>
        <button
          onClick={() => setShowRaw(!showRaw)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--fg-muted)',
            fontSize: '9px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            padding: '2px 0'
          }}
          type="button"
        >
          {showRaw ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {showRaw ? 'Hide Raw EHR Record' : 'Show Raw EHR Record'}
        </button>
        {showRaw && (
          <pre style={{
            margin: '4px 0 0 0',
            padding: '6px',
            background: 'var(--bg-subtle)',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9.5px',
            color: 'var(--fg-muted)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            lineHeight: '1.4'
          }}>
            {result}
          </pre>
        )}
      </div>
    </div>
  );
};

interface LabViewerProps {
  toolCalls: ClinicalToolCall[];
  onExecuteTool: (toolId: string) => void;
}

export const LabViewer: React.FC<LabViewerProps> = ({ toolCalls, onExecuteTool }) => {
  const pending   = toolCalls.filter(t => t.status === 'pending').length;
  const completed = toolCalls.filter(t => t.status === 'completed').length;

  return (
    <div className="panel panel-labs">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-label">Step 3 · EHR Diagnostics Gateway</span>
          <span className="panel-title">Lab &amp; Tool Interceptor</span>
        </div>
        {toolCalls.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {pending > 0 && (
              <span className="panel-badge" style={{ background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)', color: 'var(--fg-brand)' }}>
                <Clock size={9} /> {pending} Pending
              </span>
            )}
            {completed > 0 && (
              <span className="panel-badge panel-badge-live">
                <span className="dot" /> {completed} Done
              </span>
            )}
          </div>
        )}
      </div>

      <div className="panel-body">
        {toolCalls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FlaskConical size={20} />
            </div>
            <p className="empty-title">No tools dispatched</p>
            <p className="empty-sub">Doctor AI will order lab tests<br />as the simulation progresses</p>
          </div>
        ) : (
          <div className="tool-list">
            {toolCalls.map((tool) => (
              <div
                key={tool.id}
                className={`tool-card status-${tool.status}`}
              >
                <div className="tool-card-header">
                  <div className="tool-code">
                    <span className="tool-vocab">{tool.vocab}</span>
                    <span className="tool-vocab" style={{ color: 'var(--fg-muted)' }}>{tool.code}</span>
                  </div>
                  <span className={`tool-status ${tool.status}`}>
                    {tool.status === 'completed'
                      ? <><CheckCircle2 size={9} /> Done</>
                      : <><Clock size={9} /> Pending</>
                    }
                  </span>
                </div>

                <p className="tool-name">{tool.toolName}</p>
                <p className="tool-param">{tool.parameter}</p>

                {tool.status === 'completed' && tool.result && (
                  <LabResultCard
                    code={tool.code}
                    vocab={tool.vocab}
                    toolName={tool.toolName}
                    result={tool.result}
                  />
                )}

                {tool.status === 'pending' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onExecuteTool(tool.id)}
                    style={{ marginTop: 2, alignSelf: 'flex-start' }}
                    type="button"
                  >
                    <Zap size={11} /> Execute Lab
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
