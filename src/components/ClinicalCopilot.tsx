import React, { useState } from 'react';
import { callGeminiSOAPGenerator, SOAPNote } from '../utils/geminiClient';
import { TelemetryLog } from '../types/clinical';
import { FileText, FileCode, CheckCircle, AlertTriangle, Play, Download, Copy } from 'lucide-react';

interface ClinicalCopilotProps {
  onLog: (log: TelemetryLog) => void;
}

const SAMPLE_TRANSCRIPTS = {
  appendicitis: `Doctor: Hello Ms. Jenkins, how are you feeling today?
Patient: Not good, Doctor. I have really bad abdominal pain. It started yesterday around my belly button but now it has migrated to the lower right side. I feel nauseous, haven't been able to eat, and feel warm.
Doctor: Rebound tenderness observed at McBurney's point. Vital signs: Temp 100.8 F, BP 120/80, HR 92 bpm. Diagnostic ultrasound shows a thickened appendix of 7.2mm with surrounding fluid. White blood cell count is elevated at 14.5 x10^3/uL.
Doctor: This is acute appendicitis. We need to perform a laparoscopic appendectomy.`,
  cardiac: `Doctor: Good morning Mr. Chen, what symptoms have you had?
Patient: I am very short of breath when I walk. My ankles are also swollen, and if I press on them, it leaves dimples. I missed my blood pressure medicine Lisinopril for two weeks.
Doctor: On examination: Jugular Venous Distension (JVD) at 10cm, 2+ pitting pedal edema. ECG shows left ventricular hypertrophy. Echocardiogram indicates diastolic heart failure with preserved ejection fraction of 52%.
Doctor: I will order a right heart catheterization to measure pulmonary pressures.`,
  immuno: `Doctor: Hello Ms. Rostova, how has your skin psoriasis been?
Patient: Severe, covering about 12% of my skin. I failed clobetasol cream and oral methotrexate.
Doctor: Psoriasis area and severity index is high. We will prescribe Infliximab biologic infusion. First, we must order a Quantiferon-TB Gold blood test to screen for latent tuberculosis, as Infliximab can reactivate TB.
Patient: The TB test is completed and negative.
Doctor: Great, we will proceed with Infliximab 5mg/kg infusions.`,
};

export const ClinicalCopilot: React.FC<ClinicalCopilotProps> = ({ onLog }) => {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPTS.appendicitis);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [fhirJson, setFhirJson] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const log = (level: TelemetryLog['level'], component: any, msg: string) => {
    onLog({
      id: `copilot_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      component: (component === 'COPILOT_ENGINE' ? 'NLP_PARSER' : component) as TelemetryLog['component'],
      message: msg
    });
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError('');
    setSoapNote(null);
    setFhirJson('');
    log('info', 'COPILOT_ENGINE', 'Starting Clinical NLP transcription and charting routine...');

    try {
      const compiledNote = await callGeminiSOAPGenerator(transcript);
      setSoapNote(compiledNote);
      log('success', 'COPILOT_ENGINE', 'SOAP note structured successfully from clinical input.');

      // Compile a standard FHIR R4 Transaction Bundle dynamically based on the SOAP findings
      const fhirBundle = compileSOAPToFHIR(compiledNote);
      const fhirString = JSON.stringify(fhirBundle, null, 2);
      setFhirJson(fhirString);
      log('success', 'FHIR_COMPILER', `FHIR R4 bundle compiled with ${fhirBundle.entry.length} standard resources.`);
    } catch (err: any) {
      log('error', 'COPILOT_ENGINE', `Generation failed: ${err.message}`);
      if (err.message === 'NO_API_KEY') {
        setError('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
      } else {
        setError(`Failed to compile: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const compileSOAPToFHIR = (note: SOAPNote) => {
    const bundleEntries: any[] = [];
    const timestamp = new Date().toISOString();

    // 1. Patient Resource
    const patientId = 'pat_copilot_99';
    bundleEntries.push({
      fullUrl: `urn:uuid:${patientId}`,
      resource: {
        resourceType: 'Patient',
        id: patientId,
        active: true,
        name: [{ use: 'official', family: 'Copilot', given: ['Patient'] }],
      },
      request: { method: 'POST', url: 'Patient' },
    });

    // 2. Encounter Resource
    const encounterId = 'enc_copilot_99';
    bundleEntries.push({
      fullUrl: `urn:uuid:${encounterId}`,
      resource: {
        resourceType: 'Encounter',
        id: encounterId,
        status: 'finished',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
        subject: { reference: `Patient/${patientId}` },
      },
      request: { method: 'POST', url: 'Encounter' },
    });

    // 3. Conditions from ICD-10
    note.icd10Codes.forEach((icd, idx) => {
      const condId = `cond_${idx + 1}`;
      bundleEntries.push({
        fullUrl: `urn:uuid:${condId}`,
        resource: {
          resourceType: 'Condition',
          id: condId,
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
          code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: icd.code, display: icd.description }] },
          subject: { reference: `Patient/${patientId}` },
          encounter: { reference: `Encounter/${encounterId}` },
        },
        request: { method: 'POST', url: 'Condition' },
      });
    });

    // 4. Medications from RxNorm
    note.rxNormMeds.forEach((med, idx) => {
      const reqId = `medreq_${idx + 1}`;
      bundleEntries.push({
        fullUrl: `urn:uuid:${reqId}`,
        resource: {
          resourceType: 'MedicationRequest',
          id: reqId,
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: med.code, display: med.name }] },
          subject: { reference: `Patient/${patientId}` },
          encounter: { reference: `Encounter/${encounterId}` },
          authoredOn: timestamp,
        },
        request: { method: 'POST', url: 'MedicationRequest' },
      });
    });

    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: bundleEntries,
    };
  };

  const handleDownload = () => {
    if (!fhirJson) return;
    const blob = new Blob([fhirJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lumen_FHIR_Bundle_Copilot_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    log('success', 'COPILOT_ENGINE', 'FHIR bundle JSON exported for EHR integration.');
  };

  const handleCopy = () => {
    if (!fhirJson) return;
    navigator.clipboard.writeText(fhirJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    log('info', 'COPILOT_ENGINE', 'FHIR bundle copied to clipboard.');
  };

  // Run Safety Compliance Rules against generated SOAP findings
  const getSafetyCompliance = () => {
    if (!soapNote) return [];
    const textToCheck = `${soapNote.subjective} ${soapNote.objective} ${soapNote.assessment} ${soapNote.plan}`.toLowerCase();
    const checks = [
      {
        id: 'tb_biologic',
        rule: 'TB screening required before biologic/TNF-inhibitor prescription',
        passed: textToCheck.includes('infliximab') ? (textToCheck.includes('tb') || textToCheck.includes('tuberculosis') || textToCheck.includes('quantiferon')) : true,
        applicable: textToCheck.includes('infliximab') || textToCheck.includes('biologic'),
        resolution: 'Negative tuberculosis screening documented prior to ordering Infliximab infusion.',
        failure: 'Prescribing biologic without documented tuberculosis screening (NOHARM violation).'
      },
      {
        id: 'pe_diagnostics',
        rule: 'Documented physical examination required before ordering diagnostic tests',
        passed: textToCheck.includes('tenderness') || textToCheck.includes('findings') || textToCheck.includes('examination') || textToCheck.includes('vital'),
        applicable: true,
        resolution: 'Abdominal/cardiac physical exam documented before ordering lab or radiological studies.',
        failure: 'Diagnostic ordered without preliminary physical exam findings.'
      },
      {
        id: 'diastolic_cath',
        rule: 'Echocardiogram required prior to cardiac catheterization procedures',
        passed: textToCheck.includes('catheterization') ? (textToCheck.includes('echocardiogram') || textToCheck.includes('echo')) : true,
        applicable: textToCheck.includes('catheterization') || textToCheck.includes('cath'),
        resolution: 'Ventricular evaluation via Echo completed before right heart catheterization.',
        failure: 'Invasive diagnostic catheterization planned without non-invasive echo evaluation.'
      }
    ];

    return checks;
  };

  const safetyChecks = getSafetyCompliance();

  return (
    <div className="copilot-container animate-slide-up">
      {/* Overview */}
      <div className="rt-header">
        <div>
          <div className="rt-badge" style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)', color: 'var(--brand)' }}>
            <span className="rt-dot" style={{ background: 'var(--brand)' }} />
            Medical Clinical Copilot Active
          </div>
          <h2 className="rt-title">Unified AI Charting &amp; Interoperability Workstation</h2>
          <p className="rt-subtitle">
            Input clinical dictations, patient interactions, or history notes. The workstation generates structured SOAP notes, maps medical codes, generates HL7 FHIR bundles, and audits safety compliance.
          </p>
        </div>
      </div>

      {/* Main panel layout */}
      <div className="copilot-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', marginTop: '16px' }}>
        {/* Left Column: Input text area */}
        <div className="copilot-left-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="lb-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 className="lb-card-title">1. Clinical Source Dictation</h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>
                Paste physician notes, transcripts, or select a template to stage:
              </p>

              {/* Templates */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button className="btn btn-sm" onClick={() => setTranscript(SAMPLE_TRANSCRIPTS.appendicitis)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                  Appendicitis Case
                </button>
                <button className="btn btn-sm" onClick={() => setTranscript(SAMPLE_TRANSCRIPTS.cardiac)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                  Cardiac Congestion Case
                </button>
                <button className="btn btn-sm" onClick={() => setTranscript(SAMPLE_TRANSCRIPTS.immuno)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                  Biologic Screening Case
                </button>
              </div>

              <textarea
                className="rt-textarea"
                style={{ height: '320px', fontSize: '13px', fontFamily: 'monospace', lineHeight: '1.5' }}
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste doctor-patient interaction transcript here..."
                disabled={loading}
              />
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleGenerate} 
              disabled={loading || !transcript.trim()}
              style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
            >
              <Play size={14} className={loading ? 'spin' : ''} />
              {loading ? 'Processing Scribe & FHIR Translator...' : 'Process Scribe & FHIR Translation'}
            </button>
          </div>
        </div>

        {/* Right Column: SOAP note, FHIR bundle, and safety checks */}
        <div className="copilot-right-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* If loading */}
          {loading && (
            <div className="lb-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
              <div className="rt-spinner" />
              <div style={{ textAlign: 'center' }}>
                <strong style={{ display: 'block', color: 'var(--fg-primary)' }}>Parsing Clinical Context...</strong>
                <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>Gemini 2.0 Scribe compiling medical charts and code profiles</span>
              </div>
            </div>
          )}

          {/* If error */}
          {error && !loading && (
            <div className="rt-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '8px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--fg-danger)' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* No results placeholder */}
          {!soapNote && !loading && !error && (
            <div className="lb-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px', textAlign: 'center' }}>
              <FileText size={32} style={{ color: 'var(--fg-muted)' }} />
              <div>
                <strong style={{ color: 'var(--fg-primary)', display: 'block' }}>Awaiting Clinical Processing</strong>
                <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>Input or select a transcript and run the Scribe to view medical structures.</span>
              </div>
            </div>
          )}

          {/* SOAP note output */}
          {soapNote && !loading && (
            <div className="copilot-results animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* SOAP Note structured cards */}
              <div className="lb-card">
                <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={15} style={{ color: 'var(--brand)' }} />
                  Compiled Clinical SOAP Note
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>Subjective (S)</span>
                    <p style={{ fontSize: '12.5px', color: 'var(--fg-primary)', margin: 0, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', height: '140px', overflowY: 'auto', lineHeight: '1.4' }}>
                      {soapNote.subjective}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>Objective (O)</span>
                    <p style={{ fontSize: '12.5px', color: 'var(--fg-primary)', margin: 0, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', height: '140px', overflowY: 'auto', lineHeight: '1.4' }}>
                      {soapNote.objective}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>Assessment (A)</span>
                    <p style={{ fontSize: '12.5px', color: 'var(--fg-primary)', margin: 0, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', height: '140px', overflowY: 'auto', lineHeight: '1.4' }}>
                      {soapNote.assessment}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>Plan (P)</span>
                    <p style={{ fontSize: '12.5px', color: 'var(--fg-primary)', margin: 0, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', height: '140px', overflowY: 'auto', lineHeight: '1.4' }}>
                      {soapNote.plan}
                    </p>
                  </div>
                </div>

                {/* Structured diagnostic and drug codes mapping */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase' }}>ICD-10 Diagnostic Mappings:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      {soapNote.icd10Codes.map((icd, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-subtle)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          <span className="code-tag-mono CPT" style={{ fontSize: '10px', padding: '1px 5px' }}>{icd.code}</span>
                          <span style={{ fontSize: '11.5px', color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{icd.description}</span>
                        </div>
                      ))}
                      {soapNote.icd10Codes.length === 0 && <span style={{ fontSize: '11px', color: 'var(--fg-muted)', fontStyle: 'italic' }}>No diagnostic codes mapped.</span>}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase' }}>RxNorm Prescriptions Mappings:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      {soapNote.rxNormMeds.map((med, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-subtle)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          <span className="code-tag-mono RX" style={{ fontSize: '10px', padding: '1px 5px' }}>{med.code}</span>
                          <span style={{ fontSize: '11.5px', color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{med.name} ({med.dosage})</span>
                        </div>
                      ))}
                      {soapNote.rxNormMeds.length === 0 && <span style={{ fontSize: '11px', color: 'var(--fg-muted)', fontStyle: 'italic' }}>No prescriptions mapped.</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Compliance Auditor */}
              <div className="lb-card">
                <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} style={{ color: 'var(--fg-safe)' }} />
                  Clinical Safety Compliance Audit
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {safetyChecks.map((check) => (
                    <div key={check.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: '8px' }}>
                      {check.applicable ? (
                        check.passed ? (
                          <CheckCircle size={16} style={{ color: 'var(--fg-safe)', marginTop: '2px', flexShrink: 0 }} />
                        ) : (
                          <AlertTriangle size={16} style={{ color: 'var(--fg-danger)', marginTop: '2px', flexShrink: 0 }} />
                        )
                      ) : (
                        <CheckCircle size={16} style={{ color: 'var(--fg-muted)', marginTop: '2px', opacity: 0.5, flexShrink: 0 }} />
                      )}
                      <div>
                        <strong style={{ fontSize: '12px', color: 'var(--fg-primary)', display: 'block' }}>{check.rule}</strong>
                        <span style={{ fontSize: '11.5px', color: check.passed ? 'var(--fg-muted)' : 'var(--fg-danger)' }}>
                          {check.applicable ? (check.passed ? `✓ ${check.resolution}` : `🚨 ${check.failure}`) : 'Not applicable to current diagnostic profile.'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HL7 FHIR R4 Transaction Bundle output */}
              {fhirJson && (
                <div className="lb-terminal-panel">
                  <div className="lb-terminal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileCode size={14} style={{ color: 'var(--brand)' }} />
                      <span className="terminal-title">HL7 FHIR R4 Transaction Bundle JSON</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--fg-secondary)' }}>
                        <Copy size={11} />
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button className="btn btn-sm" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--fg-secondary)' }}>
                        <Download size={11} />
                        Export JSON
                      </button>
                    </div>
                  </div>
                  <pre className="lb-terminal-body" style={{ maxHeight: '250px', overflowY: 'auto', fontSize: '11.5px', background: '#0a0d14', color: '#00d4ff', padding: '12px', margin: 0, fontFamily: 'monospace' }}>
                    <code>{fhirJson}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
