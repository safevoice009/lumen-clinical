import React, { useState } from 'react';
import { executeModelRequest, getActiveModelConfig, extractAndParseJSON, saveHistoryRecord } from '../utils/geminiClient';
import { TelemetryLog } from '../types/clinical';
import QRCode from 'qrcode';
import { FileText, Sparkles, Download, CheckCircle, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

interface ClinicalDocWorkbenchProps {
  onLog: (log: TelemetryLog) => void;
}

type DocType = 'appeal' | 'referral' | 'discharge';

const TEMPLATES: Record<DocType, string> = {
  appeal: `PRIOR AUTHORIZATION APPEAL LETTER
Date: June 12, 2026

TO: Prior Authorization Appeals Department
RE: Medical Necessity Appeal for Infliximab Infusion Therapy

Patient Name: Sarah Jenkins
DOB: 11/14/1982
Policy ID: AMER-992384-01

Dear Medical Director,

I am writing to formally appeal the denial of coverage for Infliximab (Remicade) 5mg/kg infusion therapy for my patient, Sarah Jenkins, who is diagnosed with severe Crohn's Disease.

The coverage was denied stating that methotrexate or azathioprine must be tried first. However, Sarah Jenkins has already tried oral methotrexate at 15mg weekly for 3 months and failed to show response, presenting with severe mucosal flares. Furthermore, we have verified that the patient does not have active tuberculosis:
- Quantiferon-TB Gold test completed on 06/05/2026: Negative.

Therefore, biologic therapy is immediately indicated to prevent intestinal strictures.`,
  referral: `CLINICAL REFERRAL NOTE
Date: June 12, 2026

TO: Dr. Arthur Vance, MD (Cardiovascular Specialist)
FROM: Clinical AI Primary Care Clinic

RE: Referral for Cardiac Catheterization / Advanced Valve Evaluation
Patient: Liam O'Connor
DOB: 03/22/1954

Dear Dr. Vance,

I am referring Liam O'Connor, a 72-year-old male with a history of progressive diastolic heart failure and bilateral pedal edema, for advanced cardiac evaluation.

The patient recently presented with short of breath on minimal exertion. Before ordering this referral, we completed preliminary cardiac screening:
- ECG (12-Lead) completed: Left ventricular hypertrophy, no acute STEMI.
- Echocardiogram completed: Diastolic heart failure, LVEF 52%, moderate aortic stenosis.

Given these preliminary findings, cardiac catheterization is indicated to evaluate pulmonary pressures.`,
  discharge: `PATIENT DISCHARGE HANDOUT & INSTRUCTIONS
Date: June 12, 2026

Patient Name: Elena Rostova
Diagnosis: Severe Plaque Psoriasis
Discharged From: Ambulatory Immunology Center

INSTRUCTIONS:
You are being discharged today after starting Infliximab biologic infusion therapy.

Medication Schedule:
- Infliximab 5mg/kg IV infusion at Weeks 0, 2, and 6, then every 8 weeks.
- Keep taking your secondary prescription as tolerated.

Warning Signs (Call immediately if noticed):
- Fever, chills, or persistent cough. Biologic medications lower your immune system and can reactivate old infections like tuberculosis.
- Severe fatigue, muscle aches, or skin rashes.
- Shortness of breath or swelling in your ankles.`
};

export const ClinicalDocWorkbench: React.FC<ClinicalDocWorkbenchProps> = ({ onLog }) => {
  const [activeTab, setActiveTab] = useState<DocType>('appeal');
  const [documentText, setDocumentText] = useState(TEMPLATES.appeal);
  const [loading, setLoading] = useState(false);

  // AI Outputs
  const [mappedCodes, setMappedCodes] = useState<{ code: string; vocab: string; desc: string }[]>([]);
  const [auditResult, setAuditResult] = useState<{ passed: boolean; issues: string[]; summary: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const logToGlobal = (level: TelemetryLog['level'], component: any, message: string) => {
    onLog({
      id: `doc_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      component: (component === 'SCRIBE_WORKSTATION' ? 'NLP_PARSER' : component) as TelemetryLog['component'],
      message,
    });
  };

  const handleTabChange = (tab: DocType) => {
    setActiveTab(tab);
    setDocumentText(TEMPLATES[tab]);
    setMappedCodes([]);
    setAuditResult(null);
  };

  const handleAutocomplete = async () => {
    setLoading(true);
    logToGlobal('info', 'SCRIBE_WORKSTATION', 'Executing AI document expansion & co-writing routines...');
    
    const config = getActiveModelConfig();
    const systemPrompt = `You are a Medical AI Scribe. Extend the clinical letter/note provided by the user. 
Add exactly ONE next paragraph (3-4 sentences) that is medically logical, professional, and directly follows the established clinical context of the document.
Respond with ONLY the new text to append, do not include any greetings, markdown formatting, or comments.`;

    try {
      const completion = await executeModelRequest(config, systemPrompt, [], documentText, false);
      setDocumentText(prev => prev + '\n\n' + completion.trim());
      logToGlobal('success', 'SCRIBE_WORKSTATION', '✓ AI autocomplete text inserted at cursor.');
    } catch (err: any) {
      logToGlobal('error', 'SCRIBE_WORKSTATION', `✗ Autocomplete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMapCodes = async () => {
    setLoading(true);
    logToGlobal('info', 'SCRIBE_WORKSTATION', 'Parsing clinical text for standard vocabulary mappings...');
    
    const config = getActiveModelConfig();
    const systemPrompt = `You are an expert Medical Coder (ICD-10-CM, CPT, RxNorm, LOINC).
Identify medical conditions, medications, procedures, and laboratory tests mentioned in the text and map them to standard codes.

You MUST respond in this exact JSON format (no markdown code blocks, no trailing comments):
{
  "mappings": [
    { "code": "Code string (e.g. K35.80, 1148805, 93306)", "vocab": "ICD-10" | "RxNorm" | "CPT" | "LOINC", "desc": "Standard term description" }
  ]
}`;

    try {
      const rawText = await executeModelRequest(config, systemPrompt, [], documentText, true);
      const parsed = extractAndParseJSON(rawText);
      setMappedCodes(parsed.mappings || []);
      logToGlobal('success', 'SCRIBE_WORKSTATION', `✓ Code mapping complete. Identified ${parsed.mappings?.length || 0} medical standards.`);
    } catch (err: any) {
      logToGlobal('error', 'SCRIBE_WORKSTATION', `✗ Code mapping failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSafetyAudit = async () => {
    setLoading(true);
    logToGlobal('info', 'SCRIBE_WORKSTATION', 'Running clinical safety audits and screening check validations...');

    const config = getActiveModelConfig();
    const systemPrompt = `You are a Clinical Safety Auditor. Scan this medical note/document for clinical safety violations:
1. Ordering biologics (e.g. Infliximab) without TB screening.
2. Invasives (catheterization, appendectomy) ordered without preliminary non-invasive screening (ECG, ultrasound).
3. Contraindicated prescriptions.
4. Step therapy skips.

You MUST respond in this exact JSON format (no markdown code blocks):
{
  "passed": true or false,
  "issues": ["Issue 1 description", "Issue 2 description"],
  "summary": "Brief clinical reasoning (2 sentences)"
}`;

    try {
      const rawText = await executeModelRequest(config, systemPrompt, [], documentText, true);
      const parsed = extractAndParseJSON(rawText);
      setAuditResult({
        passed: parsed.passed !== false,
        issues: parsed.issues || [],
        summary: parsed.summary || 'Audit complete.'
      });

      if (parsed.passed !== false) {
        logToGlobal('success', 'SCRIBE_WORKSTATION', '✓ Document Safety Audit passed. All checks satisfied.');
      } else {
        logToGlobal('warn', 'SCRIBE_WORKSTATION', `🚨 Safety Audit flagged ${parsed.issues?.length || 0} safety issues!`);
      }

      // Save to Session History Archive
      const nameMatch = documentText.match(/(?:Patient Name|Patient):\s*([^\n\r]+)/i);
      const patientName = nameMatch ? nameMatch[1].trim() : 'Document Note';
      
      const diagMatch = documentText.match(/(?:Diagnosis|RE):\s*([^\n\r]+)/i);
      const diagnosisText = diagMatch ? diagMatch[1].trim() : 'Clinical Review';

      const scoreString = parsed.passed !== false ? 'Passed' : 'Flagged';
      
      const portalPayload = {
        patientName,
        dob: '1980-01-01',
        gender: 'unknown',
        mrn: `doc_${Date.now().toString().slice(-4)}`,
        diagnosis: diagnosisText,
        summary: documentText,
        warnings: parsed.issues?.join('\n') || 'None reported.',
        followupProvider: 'Primary Care Referral',
        followupDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        followupPhone: '+1 555-LUMEN-OK',
        physicianName: 'Attending Clinician',
        physicianNpi: '1029384756',
        meds: [],
        safetyScore: scoreString,
        safetyStatus: parsed.passed !== false ? 'APPROVED' : 'FAILED',
        fhirValidation: 'valid',
        timestamp: new Date().toLocaleDateString()
      };
      const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(portalPayload))));
      const generatedUrl = `${window.location.origin}${window.location.pathname}#portal=${base64}`;

      // Generate local brand QR Code
      QRCode.toDataURL(generatedUrl, {
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

      saveHistoryRecord(patientName, diagnosisText, scoreString, portalPayload);

    } catch (err: any) {
      logToGlobal('error', 'SCRIBE_WORKSTATION', `✗ Safety Audit failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([documentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lumen_Clinical_${activeTab}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    logToGlobal('success', 'SCRIBE_WORKSTATION', `Document exported: ${activeTab}.txt`);
  };

  return (
    <div className="copilot-container animate-slide-up">
      {/* Header */}
      <div className="rt-header">
        <div>
          <div className="rt-badge" style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)', color: 'var(--brand)' }}>
            <span className="rt-dot" style={{ background: 'var(--brand)' }} />
            Medical Scribe &amp; Document Workbench Active
          </div>
          <h2 className="rt-title">Clinical Document Co-Writer &amp; Coding Workbench</h2>
          <p className="rt-subtitle">
            Draft clinical notes, letters, or discharge materials. Leverage active LLM co-writing, map ICD-10/RxNorm codes, and run safety audit guardrails.
          </p>
        </div>
      </div>

      <div className="cookbook-grid">
        {/* Left Side: Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="lb-card">
            {/* Editor Tabs */}
            <div className="doc-workbench-tabs">
              <button className={`doc-tab ${activeTab === 'appeal' ? 'active' : ''}`} onClick={() => handleTabChange('appeal')} disabled={loading}>
                Prior-Auth Appeal
              </button>
              <button className={`doc-tab ${activeTab === 'referral' ? 'active' : ''}`} onClick={() => handleTabChange('referral')} disabled={loading}>
                Referral Note
              </button>
              <button className={`doc-tab ${activeTab === 'discharge' ? 'active' : ''}`} onClick={() => handleTabChange('discharge')} disabled={loading}>
                Discharge Instructions
              </button>
            </div>

            {/* Textarea */}
            <textarea
              className="doc-editor-textarea"
              value={documentText}
              onChange={e => setDocumentText(e.target.value)}
              disabled={loading}
            />

            {/* Editor Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm" onClick={handleAutocomplete} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {loading ? <RefreshCw size={12} className="spin" /> : <Sparkles size={12} />}
                  Autocomplete Paragraph
                </button>
                <button className="btn btn-sm" onClick={handleMapCodes} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {loading ? <RefreshCw size={12} className="spin" /> : <Layers size={12} />}
                  Map Medical Codes
                </button>
                <button className="btn btn-sm" onClick={handleSafetyAudit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {loading ? <RefreshCw size={12} className="spin" /> : <AlertTriangle size={12} />}
                  Run Safety Audit
                </button>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleDownloadText} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={12} />
                Export Note (.txt)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Analysis panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mapped Codes Panel */}
          {mappedCodes.length > 0 && (
            <div className="lb-card animate-fade-in">
              <h4 className="lb-card-title">🔬 Mapped Vocabulary Codes</h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>Standardized clinical nomenclatures extracted from document text:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {mappedCodes.map((map, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <span className={`code-tag-mono ${map.vocab === 'CPT' ? 'CPT' : map.vocab === 'RxNorm' ? 'RX' : map.vocab === 'LOINC' ? 'LOINC' : 'FHIR'}`} style={{ fontSize: '10px', padding: '2px 6px', flexShrink: 0 }}>
                      {map.vocab}: {map.code}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {map.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Audit Panel */}
          {auditResult && (
            <div className="lb-card animate-fade-in">
              <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {auditResult.passed ? <CheckCircle size={15} style={{ color: 'var(--color-safe)' }} /> : <AlertTriangle size={15} style={{ color: 'var(--color-danger)' }} />}
                Scribe Document Safety Audit
              </h4>
              <p className="lb-card-subtitle" style={{ marginTop: '4px', color: auditResult.passed ? 'var(--color-safe)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                {auditResult.passed ? '✓ Safety Guidelines Met' : '🚨 Potential Clinical Risks Identified'}
              </p>
              
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', margin: '8px 0', fontSize: '12px', color: 'var(--fg-primary)' }}>
                {auditResult.summary}
              </div>

              {auditResult.issues.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Identified Risks:</span>
                  {auditResult.issues.map((issue, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11.5px', color: 'var(--fg-danger)' }}>
                      <span>•</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Share note via QR */}
          {auditResult && qrCodeUrl && (
            <div className="lb-card animate-fade-in" style={{ marginTop: '16px' }}>
              <h4 className="lb-card-title">📲 Mobile Patient Pass Gateway</h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>
                Handoff this validated discharge summary sheet directly to the patient's mobile device:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ background: '#fff', padding: '8px', borderRadius: '6px', boxShadow: 'var(--shadow-sm)', display: 'inline-block' }}>
                  <img
                    src={qrCodeUrl}
                    alt="EHR Transfer QR Code"
                    style={{ display: 'block', width: 140, height: 140 }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--fg-muted)', lineHeight: '1.4' }}>
                  <strong>Scan QR Code</strong> to view the full <strong>{auditResult.passed ? '🟢 validated safe' : '🔴 safety-flagged'}</strong> digital pass on mobile.
                </div>
              </div>
            </div>
          )}

          {/* Default Placeholder */}
          {mappedCodes.length === 0 && !auditResult && (
            <div className="lb-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px', textAlign: 'center', height: '100%' }}>
              <FileText size={32} style={{ color: 'var(--fg-muted)' }} />
              <div>
                <strong style={{ color: 'var(--fg-primary)', display: 'block' }}>Awaiting Workbench Analytics</strong>
                <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>Use the toolbar actions below the editor to extract standards, audit safety, or expand contents.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
