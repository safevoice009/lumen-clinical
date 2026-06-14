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
  const [selectedPatientCase, setSelectedPatientCase] = useState<string>('appendicitis');
  const [savedDocs, setSavedDocs] = useState<{ id: string; title: string; type: DocType; content: string; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Outputs
  const [mappedCodes, setMappedCodes] = useState<{ code: string; vocab: string; desc: string }[]>([]);
  const [auditResult, setAuditResult] = useState<{ passed: boolean; issues: string[]; summary: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('lumen_saved_documents');
      if (saved) {
        setSavedDocs(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load saved documents:", e);
    }
  }, []);

  const logToGlobal = (level: TelemetryLog['level'], component: any, message: string) => {
    onLog({
      id: `doc_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      component: (component === 'SCRIBE_WORKSTATION' ? 'NLP_PARSER' : component) as TelemetryLog['component'],
      message,
    });
  };

  const handleSaveDocument = () => {
    const nameMatch = documentText.match(/(?:Patient Name|Patient):\s*([^\n\r]+)/i);
    const patientName = nameMatch ? nameMatch[1].trim() : 'Unknown Patient';
    const title = `${activeTab.toUpperCase()} - ${patientName}`;
    
    const newDoc = {
      id: `doc_${Date.now()}`,
      title,
      type: activeTab,
      content: documentText,
      timestamp: new Date().toLocaleString()
    };
    
    const updated = [newDoc, ...savedDocs];
    setSavedDocs(updated);
    localStorage.setItem('lumen_saved_documents', JSON.stringify(updated));
    logToGlobal('success', 'SCRIBE_WORKSTATION', `✓ Document saved to local library: "${title}"`);
  };

  const handleDeleteDocument = (id: string) => {
    const updated = savedDocs.filter(d => d.id !== id);
    setSavedDocs(updated);
    localStorage.setItem('lumen_saved_documents', JSON.stringify(updated));
    logToGlobal('info', 'SCRIBE_WORKSTATION', 'Document deleted from library.');
  };

  const handleAiGenerateDocument = async () => {
    setLoading(true);
    logToGlobal('info', 'SCRIBE_WORKSTATION', `Generating clinical ${activeTab} using AI for case: ${selectedPatientCase}...`);
    
    const config = getActiveModelConfig();
    
    const caseDetails = selectedPatientCase === 'appendicitis' 
      ? "Patient Sarah Jenkins, 35 years old, presenting with acute lower right abdominal pain migrating from umbilicus, rebound tenderness at McBurney's point, WBC 14.5, Ultrasound showing 7.2mm appendix with fluid. Indicates acute appendicitis. Needs laparoscopic appendectomy."
      : selectedPatientCase === 'cardiac'
      ? "Patient Liam O'Connor, 72 years old, history of diastolic heart failure, progressive ankle swelling (2+ pedal edema), jugular venous distension 10cm. Echocardiogram showing LVEF 52% and moderate aortic stenosis. Needs right heart catheterization."
      : "Patient Elena Rostova, 45 years old, severe plaque psoriasis covering 12% of skin, failed clobetasol cream and oral methotrexate. Negative TB screening (Quantiferon-TB Gold). Prescribed Infliximab biologic infusion 5mg/kg.";

    const systemPrompt = `You are a Senior Clinical AI Scribe. Your task is to draft a professional, medically accurate clinical document of type: ${activeTab.toUpperCase()}.
CASE CONTEXT:
${caseDetails}

FORMAT INSTRUCTIONS:
- For 'appeal': Draft a standard Prior Authorization Appeal Letter to the Appeals Department explaining the medical necessity of the proposed drug/procedure, referencing previous trial/failures (e.g. failed methotrexate) and negative screenings (e.g. TB).
- For 'referral': Draft a formal Clinical Referral Note referring the patient to the relevant specialist (e.g. cardiovascular specialist or general surgeon), detailing preliminary non-invasive screening results (ECG, Ultrasound, Echo).
- For 'discharge': Draft a detailed Patient Discharge Handout & Instructions summarizing the diagnosis, medication schedules (with dosages/frequency), and critical safety warnings (signs of infection, when to call clinic).

Write the full document text. Do not include any conversational introductions, markdown block wrappers, or summary explanations. Start directly with the document title.`;

    try {
      const resultText = await executeModelRequest(config, systemPrompt, [], "Generate the clinical document now.", false);
      setDocumentText(resultText.trim());
      logToGlobal('success', 'SCRIBE_WORKSTATION', `✓ Clinical ${activeTab} successfully generated via AI.`);
      setMappedCodes([]);
      setAuditResult(null);
    } catch (err: any) {
      logToGlobal('error', 'SCRIBE_WORKSTATION', `✗ AI Document generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
            {/* AI Draft Generator Bar */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--fg-primary)' }}>AI Draft Generator:</span>
              <select
                value={selectedPatientCase}
                onChange={e => setSelectedPatientCase(e.target.value)}
                disabled={loading}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--fg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="appendicitis">Appendicitis Case (Sarah Jenkins)</option>
                <option value="cardiac">Cardiac Congestion Case (Liam O'Connor)</option>
                <option value="immuno">Biologic Immunology Case (Elena Rostova)</option>
              </select>
              <button
                className="btn btn-sm"
                onClick={handleAiGenerateDocument}
                disabled={loading}
                style={{ background: 'var(--brand)', color: '#fff', border: 'none', padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {loading ? <RefreshCw size={11} className="spin" /> : <Sparkles size={11} />}
                Generate Draft
              </button>
            </div>

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
              style={{ height: '360px' }}
            />

            {/* Editor Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                <button className="btn btn-sm" onClick={handleSaveDocument} disabled={loading || !documentText.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 230, 118, 0.15)', color: 'var(--color-safe)', border: 'none' }}>
                  Save to Library
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

          {/* Workspace Documents Library */}
          <div className="lb-card animate-fade-in" style={{ marginTop: '16px' }}>
            <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={15} style={{ color: 'var(--brand)' }} />
              Workspace Documents Library ({savedDocs.length})
            </h4>
            <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>
              Saved clinical records stored in local-first database:
            </p>
            {savedDocs.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--fg-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '6px' }}>
                No documents saved in library yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {savedDocs.map(doc => (
                  <div key={doc.id} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                      <strong style={{ fontSize: '12px', color: 'var(--fg-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.title}
                      </strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--fg-muted)' }}>{doc.timestamp}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setDocumentText(doc.content);
                          setActiveTab(doc.type);
                          setMappedCodes([]);
                          setAuditResult(null);
                          logToGlobal('info', 'SCRIBE_WORKSTATION', `Loaded document: "${doc.title}"`);
                        }}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        Load
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        style={{ padding: '2px 6px', fontSize: '10px', background: 'rgba(255, 61, 87, 0.15)', color: '#ff3d57', border: 'none' }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
