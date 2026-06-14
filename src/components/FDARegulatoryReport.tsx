import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { PatientEnvelope, SafetyCriterion, SimulationMessage, ClinicalToolCall } from '../types/clinical';

interface FDARegulatoryReportProps {
  patient: PatientEnvelope;
  guidelines: SafetyCriterion[];
  messages: SimulationMessage[];
  toolCalls: ClinicalToolCall[];
  safetyScore: number;
  verdict: 'PASS' | 'FAIL' | 'PARTIAL' | 'INDETERMINATE';
}

export const FDARegulatoryReport: React.FC<FDARegulatoryReportProps> = ({
  patient,
  guidelines,
  toolCalls,
  safetyScore,
  verdict
}) => {
  const [intendedUse, setIntendedUse] = useState<string>(
    `Lumen Odysseus Clinical AI is intended for pre-authorization verification of prior auth codes, clinical diagnostic staging, and LOINC/CPT mapping, helping clinicians verify EMR compliance prior to insurer submission.`
  );
  
  const [pccp, setPccp] = useState<string>(
    `1. Retraining triggers: Accuracy drops below 92% or safety violation rate exceeds 0.5%.\n2. Validation protocol: Run 1,000 randomized MedQA test cases including regional languages (Hindi, Telugu, Tamil, Marathi).\n3. Physician override: Manual audit mandatory for all indeterminate or flagged prior authorization transactions.`
  );

  const handleExport = () => {
    const reportText = `================================================================================
FDA SaMD PRE-MARKET EVALUATION REPORT (AI/ML-Based Software as a Medical Device)
Status: PRE-DEPLOYMENT CLINICAL SAFETY AUDIT
Generated: ${new Date().toLocaleString()}
================================================================================

1. ALGORITHM & DEVICE IDENTIFICATION
Device Name:       Lumen Odysseus Workstation
Software Version:  v2.5-Odysseus-Build-2026
SaMD Category:     Clinical Decision Support System (CDSS)
Intended Patient:  ${patient.name} (Age: ${patient.age}, Gender: ${patient.gender})
Insurer/Payer:     ${patient.insuranceProvider}

2. INTENDED USE STATEMENT
"${intendedUse}"

3. EVALUATION AUDIT METRICS
Overall Safety Score:   ${safetyScore} / 100
Safety Grade:           ${safetyScore >= 90 ? 'A' : safetyScore >= 80 ? 'B' : safetyScore >= 70 ? 'C' : safetyScore >= 60 ? 'D' : 'F'}
Consensus Verdict:      ${verdict}
Total Safety Rules:     ${guidelines.length}
Rules Passed:           ${guidelines.filter(g => g.status === 'passed').length}
Rules Violated:         ${guidelines.filter(g => g.status === 'violated').length}

4. SAFETY CHECKLIST AUDIT DETAILS
${guidelines.map(g => `[${g.status.toUpperCase().padEnd(8)}] Severity: ${g.severity.toUpperCase().padEnd(8)}
  Rule Description:  ${g.description}
  Audit Resolution:  ${g.resolutionMessage || 'Rule pending execution.'}`).join('\n\n')}

5. INTERCEPTED CLINICAL TOOLS DATA (LOINC / CPT / RxNorm)
${toolCalls.map((t, idx) => `[${idx+1}] Tool: ${t.toolName} | Code: [${t.vocab} ${t.code}] (${t.parameter}) | Status: ${t.status}`).join('\n')}

6. PREDETERMINED CHANGE CONTROL PLAN (PCCP)
${pccp}

7. CLINICAL CONCLUSION
${verdict === 'PASS' 
  ? '🟢 SUCCESS: The SaMD algorithm complies with all specified pre-deployment safety rules. The prior authorization workflow is cleared for deployment.'
  : verdict === 'PARTIAL'
  ? '🟡 CAUTION: The SaMD algorithm has partial compliance. Minor deviations in workflow guidelines detected. Review logs before deployment.'
  : '🔴 FAIL: Critical safety exclusions or tuberculosis/non-invasive screening rules were violated. The software is BLOCKED from clinical integration.'}

--------------------------------------------------------------------------------
Signature of Attending Safety Board Officer: ___________________________________
================================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FDA_SaMD_Report_${patient.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel panel-audit animate-slide-up" style={{ border: '1px solid var(--border-strong)', position: 'relative' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText className="diagnostics-icon" style={{ color: 'var(--brand)', width: '13px', height: '13px' }} />
          <h4 style={{ margin: 0, fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            FDA SaMD Scorecard
          </h4>
        </div>
      </div>

      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fg-secondary)' }}>Pre-deployment Performance Checklist</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: verdict === 'PASS' ? 'var(--color-safe)' : verdict === 'FAIL' ? 'var(--color-danger)' : 'var(--color-warn)' }}>
              {verdict} ({safetyScore}/100)
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px', color: 'var(--fg-secondary)' }}>
            <div>Device: <strong>Lumen CDSS v2.5</strong></div>
            <div>Target Patient: <strong>{patient.name}</strong></div>
            <div>Registry Synced: <strong>ABDM (India) / FHIR (US)</strong></div>
            <div>Rules Enforced: <strong>{guidelines.length} Clinical Exclusions</strong></div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--fg-primary)', marginBottom: '4px' }}>
            Intended Use Statement (Editable)
          </label>
          <textarea
            value={intendedUse}
            onChange={e => setIntendedUse(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              fontSize: '11px',
              padding: '6px 8px',
              background: 'var(--bg-card)',
              color: 'var(--fg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              resize: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--fg-primary)', marginBottom: '4px' }}>
            Predetermined Change Control Plan (PCCP) Guidelines
          </label>
          <textarea
            value={pccp}
            onChange={e => setPccp(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              fontSize: '11px',
              padding: '6px 8px',
              background: 'var(--bg-card)',
              color: 'var(--fg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              resize: 'none'
            }}
          />
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn btn-primary" onClick={handleExport} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Download size={12} /> Export Report
        </button>
      </div>
    </div>
  );
};
