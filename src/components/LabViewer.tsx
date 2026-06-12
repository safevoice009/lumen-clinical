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

const PacsImageViewer: React.FC<{ code: string; label: string }> = ({ code, label }) => {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [windowWidth, setWindowWidth] = useState(200);
  const [windowLevel, setWindowLevel] = useState(100);
  const [isInverted, setIsInverted] = useState(false);

  const normCode = code.trim().toLowerCase();

  const handleReset = () => {
    setWindowWidth(200);
    setWindowLevel(100);
    setIsInverted(false);
    setShowAnnotations(true);
  };

  const contrastVal = windowWidth / 100;
  const brightnessVal = windowLevel / 100;
  const filterString = `brightness(${brightnessVal}) contrast(${contrastVal})${isInverted ? ' invert(1)' : ''}`;

  const renderScan = () => {
    if (normCode === '71250') {
      return (
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: filterString, background: '#050505', transition: 'filter 0.05s ease', display: 'block', margin: '0 auto' }}>
          {/* Body contour */}
          <ellipse cx="100" cy="100" rx="90" ry="75" fill="none" stroke="#222" strokeWidth="2" />
          {/* Spine */}
          <path d="M90,165 L110,165 L100,150 Z" fill="#111" stroke="#333" strokeWidth="1" />
          <circle cx="100" cy="158" r="4" fill="#000" />
          {/* Sternum */}
          <rect x="94" y="27" width="12" height="6" rx="2" fill="#333" />
          {/* Ribs */}
          <path d="M22,80 Q25,50 50,38" fill="none" stroke="#222" strokeWidth="1.2" />
          <path d="M178,80 Q175,50 150,38" fill="none" stroke="#222" strokeWidth="1.2" />
          <path d="M15,100 Q20,130 50,152" fill="none" stroke="#222" strokeWidth="1.2" />
          <path d="M185,100 Q180,130 150,152" fill="none" stroke="#222" strokeWidth="1.2" />
          {/* Lungs */}
          <path d="M40,55 C45,45 78,45 83,55 C88,65 83,125 78,135 C65,145 42,135 40,120 Z" fill="#0a0a0a" stroke="#222" strokeWidth="0.8" />
          <path d="M160,55 C155,45 122,45 117,55 C112,65 117,125 122,135 C135,145 158,135 160,120 Z" fill="#0a0a0a" stroke="#222" strokeWidth="0.8" />
          {/* Heart */}
          <ellipse cx="104" cy="98" rx="18" ry="22" fill="#0e0e0e" stroke="#222" strokeWidth="1.2" transform="rotate(-15 104 98)" />
          <circle cx="94" cy="85" r="5" fill="#080808" stroke="#222" strokeWidth="0.8" />
          {/* Nodule RUL */}
          <path d="M52,65 L54,62 L57,66 L59,61 L62,64 L65,60 L64,66 L68,64 L65,68 L69,71 L63,70 L64,74 L60,70 L59,75 L56,71 L53,73 L55,68 L50,68 Z" fill="#181818" stroke="#ff3d57" strokeWidth="0.8" opacity={showAnnotations ? 0.95 : 0.4} />
          <circle cx="59" cy="67" r="3.5" fill="#2c2c2c" stroke="#ff3d57" strokeWidth="0.5" />
          {showAnnotations && (
            <g>
              <circle cx="59" cy="67" r="11" fill="none" stroke="#ff3d57" strokeDasharray="2,2" strokeWidth="0.75" />
              <line x1="70" y1="67" x2="92" y2="67" stroke="#ff3d57" strokeWidth="0.5" />
              <circle cx="92" cy="67" r="1" fill="#ff3d57" />
              <text x="96" y="65" fill="#ff3d57" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">RUL Nodule: 1.8cm</text>
              <text x="96" y="72" fill="#ff3d57" fontSize="4.5" fontFamily="sans-serif">Spicuated Nodule (CT)</text>
              <text x="32" y="100" fill="#666" fontSize="7" fontWeight="bold" fontFamily="sans-serif">R</text>
              <text x="168" y="100" fill="#666" fontSize="7" fontWeight="bold" fontFamily="sans-serif">L</text>
            </g>
          )}
        </svg>
      );
    }

    if (normCode === '76700') {
      return (
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: filterString, background: '#020202', transition: 'filter 0.05s ease', display: 'block', margin: '0 auto' }}>
          <path d="M100,20 L30,170 A95,95 0 0,0 170,170 Z" fill="none" stroke="#222" strokeWidth="1.5" />
          <path d="M100,20 L40,165 A90,90 0 0,0 160,165 Z" fill="#040404" opacity="0.4" />
          <path d="M100,20 L100,178" fill="none" stroke="#111" strokeWidth="0.5" strokeDasharray="2,5" />
          <path d="M100,20 L65,172" fill="none" stroke="#111" strokeWidth="0.5" strokeDasharray="2,5" />
          <path d="M100,20 L135,172" fill="none" stroke="#111" strokeWidth="0.5" strokeDasharray="2,5" />
          <path d="M50,110 Q70,90 100,105 T150,110" fill="none" stroke="#121212" strokeWidth="14" opacity="0.3" strokeLinecap="round" />
          <path d="M60,140 Q80,135 100,142 T140,135" fill="none" stroke="#181818" strokeWidth="8" opacity="0.2" strokeLinecap="round" />
          {/* Appendix */}
          <path d="M85,115 C90,100 105,95 112,102 C118,108 108,125 102,135 C95,145 80,130 85,115 Z" fill="#0a0a0a" stroke="#ffab40" strokeWidth="1.5" opacity={showAnnotations ? 0.95 : 0.5} />
          <circle cx="107" cy="104" r="5" fill="#141414" stroke="#ff3d57" strokeWidth="1" />
          <path d="M72,138 Q82,148 94,142 C90,135 80,130 72,138 Z" fill="#000" stroke="#ffab40" strokeWidth="0.5" opacity="0.5" />
          {showAnnotations && (
            <g>
              <circle cx="102" cy="120" r="14" fill="none" stroke="#ff3d57" strokeDasharray="2,2" strokeWidth="0.75" />
              <line x1="86" y1="125" x2="118" y2="115" stroke="#ff3d57" strokeWidth="0.75" />
              <line x1="86" y1="123" x2="86" y2="127" stroke="#ff3d57" strokeWidth="1" />
              <line x1="118" y1="113" x2="118" y2="117" stroke="#ff3d57" strokeWidth="1" />
              <text x="122" y="122" fill="#ff3d57" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">Appendix: 7.2mm</text>
              <text x="122" y="129" fill="#ffab40" fontSize="4.5" fontFamily="sans-serif">Thickened Wall</text>
              <text x="50" y="152" fill="#00e676" fontSize="4.5" fontFamily="sans-serif">Free Fluid (Tip)</text>
              <line x1="68" y1="147" x2="76" y2="140" stroke="#00e676" strokeWidth="0.5" />
            </g>
          )}
        </svg>
      );
    }

    if (normCode === '93306') {
      return (
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: filterString, background: '#020202', transition: 'filter 0.05s ease', display: 'block', margin: '0 auto' }}>
          <path d="M100,20 L30,170 A95,95 0 0,0 170,170 Z" fill="none" stroke="#222" strokeWidth="1.5" />
          <line x1="100" y1="40" x2="100" y2="145" stroke="#222" strokeWidth="3" />
          <path d="M100,40 C125,45 138,95 130,115 C125,125 110,122 100,115" fill="none" stroke="#1c1c1c" strokeWidth="2" />
          <path d="M100,40 C78,45 68,90 75,108 C80,115 90,112 100,108" fill="none" stroke="#161616" strokeWidth="2" />
          <path d="M100,115 C120,120 125,145 112,152 C105,155 100,150 100,145" fill="none" stroke="#181818" strokeWidth="1.5" />
          <path d="M100,108 C85,112 80,135 90,142 C95,145 100,142 100,135" fill="none" stroke="#121212" strokeWidth="1.5" />
          <line x1="102" y1="115" x2="114" y2="112" stroke="#ffab40" strokeWidth="1.2" />
          <line x1="98" y1="108" x2="88" y2="107" stroke="#222" strokeWidth="1.2" />
          {showAnnotations && (
            <path d="M104,115 Q114,130 110,140 Q106,145 102,130 Z" fill="url(#pacsColorJet)" opacity="0.6" />
          )}
          <defs>
            <linearGradient id="pacsColorJet" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00e676" />
              <stop offset="50%" stopColor="#448aff" />
              <stop offset="100%" stopColor="#ff3d57" opacity="0.1" />
            </linearGradient>
          </defs>
          {showAnnotations && (
            <g>
              <circle cx="108" cy="115" r="7" fill="none" stroke="#ff3d57" strokeDasharray="2,2" strokeWidth="0.75" />
              <line x1="115" y1="115" x2="132" y2="125" stroke="#ff3d57" strokeWidth="0.5" />
              <text x="135" y="125" fill="#ff3d57" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">Mitral Valve</text>
              <text x="135" y="132" fill="#ffab40" fontSize="4.5" fontFamily="sans-serif">Mild Mitral Regur. Jet</text>
              <rect x="35" y="145" width="48" height="18" rx="2" fill="rgba(255,171,64,0.06)" stroke="rgba(255,171,64,0.25)" strokeWidth="0.5" />
              <text x="39" y="152" fill="#ffab40" fontSize="4" fontWeight="bold" fontFamily="sans-serif">Grade II Diastolic</text>
              <text x="39" y="158" fill="#ffab40" fontSize="3.5" fontFamily="sans-serif">Dysfunction (E/A &lt; 1)</text>
              <text x="110" y="80" fill="#666" fontSize="5" fontFamily="sans-serif">LV</text>
              <text x="85" y="80" fill="#666" fontSize="5" fontFamily="sans-serif">RV</text>
              <text x="108" y="132" fill="#666" fontSize="5" fontFamily="sans-serif">LA</text>
              <text x="88" y="128" fill="#666" fontSize="5" fontFamily="sans-serif">RA</text>
            </g>
          )}
        </svg>
      );
    }
    return null;
  };

  if (normCode !== '71250' && normCode !== '76700' && normCode !== '93306') {
    return null;
  }

  return (
    <div style={{
      marginTop: '8px',
      background: '#0a0a0c',
      border: '1px solid #1c1c24',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-md)'
    }}>
      {/* PACS Header */}
      <div style={{
        background: '#13131a',
        padding: '6px 10px',
        borderBottom: '1px solid #1c1c24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--fg-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em' }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d57', display: 'inline-block' }} />
          LUMEN PACS WEB-VIEWER
        </span>
        <span style={{ fontSize: '8px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--fg-muted)' }}>
          MODE: STUDY ACTIVE · {label}
        </span>
      </div>

      {/* PACS Viewport */}
      <div style={{
        padding: '12px',
        background: '#020202',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '160px',
        position: 'relative'
      }}>
        {renderScan()}
      </div>

      {/* PACS Controls Panel */}
      <div style={{
        background: '#0d0d12',
        padding: '8px 10px',
        borderTop: '1px solid #1c1c24',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            style={{
              background: showAnnotations ? 'rgba(255,61,87,0.1)' : 'var(--bg-subtle)',
              border: showAnnotations ? '1px solid rgba(255,61,87,0.3)' : '1px solid var(--border-subtle)',
              color: showAnnotations ? '#ff3d57' : 'var(--fg-muted)',
              fontSize: '8.5px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
            type="button"
          >
            {showAnnotations ? '● Annotations On' : '○ Annotations Off'}
          </button>

          <button
            onClick={() => setIsInverted(!isInverted)}
            style={{
              background: isInverted ? 'rgba(0,212,255,0.1)' : 'var(--bg-subtle)',
              border: isInverted ? '1px solid rgba(0,212,255,0.3)' : '1px solid var(--border-subtle)',
              color: isInverted ? '#00d4ff' : 'var(--fg-muted)',
              fontSize: '8.5px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
            type="button"
          >
            Invert Contrast
          </button>

          <button
            onClick={handleReset}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              color: 'var(--fg-muted)',
              fontSize: '8.5px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
            type="button"
          >
            Reset PACS
          </button>
        </div>

        {/* Sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '8px', color: 'var(--fg-muted)' }}>
              <span>W. LEVEL (BRIGHTNESS)</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace' }}>{windowLevel}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="160"
              value={windowLevel}
              onChange={(e) => setWindowLevel(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--brand)', height: '3px', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '8px', color: 'var(--fg-muted)' }}>
              <span>W. WIDTH (CONTRAST)</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace' }}>{windowWidth}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="320"
              value={windowWidth}
              onChange={(e) => setWindowWidth(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--brand)', height: '3px', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
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

      {/* PACS Image Viewer */}
      <PacsImageViewer code={code} label={structured.title} />

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
