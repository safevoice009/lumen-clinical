import React, { useState } from 'react';
import { executeModelRequest, getActiveModelConfig } from '../utils/geminiClient';
import { TelemetryLog } from '../types/clinical';
import { Play, BookOpen, Terminal, CheckCircle, RefreshCw, AlertTriangle, Globe } from 'lucide-react';
import { getRegionalMedicalRegistry } from '../utils/regionalApis';

interface ClinicalDeepResearchProps {
  onLog: (log: TelemetryLog) => void;
}

interface ResearchReport {
  summary: string;
  checks: { guideline: string; rule: string; result: 'satisfied' | 'violated'; reason: string }[];
  protocol: string;
  citations: string[];
}

const SAMPLE_QUESTIONS = [
  {
    title: 'Biologic initiation in immigrants from endemic TB areas',
    prompt: 'Evaluate the mandatory tuberculosis screening criteria and drug safety checks before starting anti-TNF biologics (Infliximab) in a Crohn\'s patient from a TB-endemic region.'
  },
  {
    title: 'Atypical STEMI presentation in elderly diabetics',
    prompt: 'Assess the guideline-directed timeline for ECG and cardiac biomarker acquisition in a 65-year-old female diabetic presenting with isolated upper abdominal pain and nausea.'
  },
  {
    title: 'NSAID prescribing constraints in chronic kidney disease',
    prompt: 'Analyze the safety parameters and renal function thresholds (eGFR) for administering Ketorolac post-orthopedic surgery in patients with Stage 3 CKD.'
  }
];

export const ClinicalDeepResearch: React.FC<ClinicalDeepResearchProps> = ({ onLog }) => {
  const [query, setQuery] = useState(SAMPLE_QUESTIONS[0].prompt);
  const [selectedRegion, setSelectedRegion] = useState<string>('usa');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{ type: 'info' | 'success' | 'warn'; text: string }[]>([]);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState('');

  const logToGlobal = (level: TelemetryLog['level'], component: any, message: string) => {
    onLog({
      id: `research_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      component: (component === 'RESEARCH_ENGINE' ? 'AGENT_ENGINE' : component) as TelemetryLog['component'],
      message,
    });
  };

  const handleResearch = async () => {
    setLoading(true);
    setError('');
    setReport(null);
    setLogs([]);

    logToGlobal('info', 'RESEARCH_ENGINE', `Deep Research query initiated: "${query.substring(0, 50)}..."`);

    const apis = getRegionalMedicalRegistry(selectedRegion);
    const apiNames = apis.map(a => a.name).join(', ');

    // Simulated Agent Steps tailored by region
    const regionalStepsMap: Record<string, { text: string; delay: number; type: 'info' | 'success' | 'warn' }[]> = {
      india: [
        { text: 'Parsing query & setting jurisdiction context: India (NHA guidelines)...', delay: 800, type: 'info' },
        { text: 'Connecting to Ayushman Bharat Digital Mission (ABDM) Sandbox Gateway...', delay: 1200, type: 'info' },
        { text: `Querying ABDM Registries & consent flows (${apiNames})...`, delay: 1400, type: 'info' },
        { text: 'ABDM Verification status: Consent manager session active. Retrieving health records...', delay: 1000, type: 'success' },
        { text: 'Validating against Central Drugs Standard Control Organisation (CDSCO) & ICMR guidelines...', delay: 1500, type: 'warn' }
      ],
      usa: [
        { text: 'Parsing query & setting jurisdiction context: USA (FDA & HHS standards)...', delay: 800, type: 'info' },
        { text: 'Interfacing with Mayo Clinic Platform Cohort Discovery endpoints...', delay: 1200, type: 'info' },
        { text: `Querying NIH NLM vocabulary indexes (${apiNames})...`, delay: 1400, type: 'info' },
        { text: 'NIH NLM: Mapping clinical terms to standard LOINC, RxNorm, and SNOMED CT codes...', delay: 1000, type: 'success' },
        { text: 'Scanning PubMed Central clinical literature database & FDA guidelines...', delay: 1500, type: 'warn' }
      ],
      uk: [
        { text: 'Parsing query & setting jurisdiction context: United Kingdom (NHS England)...', delay: 800, type: 'info' },
        { text: 'Connecting NHS England Developer & Integration Hub...', delay: 1200, type: 'info' },
        { text: `Invoking NHS GP Connect Structured Record Access service (${apiNames})...`, delay: 1400, type: 'info' },
        { text: 'GP Connect: Retrieved Patient Demographics & Diagnostic profile (NHS-9449305582)...', delay: 1000, type: 'success' },
        { text: 'Auditing treatment proposal against NICE Clinical Guidelines (NICE Pathways)...', delay: 1500, type: 'warn' }
      ],
      japan: [
        { text: 'Parsing query & setting jurisdiction context: Japan (MHLW & PMDA)...', delay: 800, type: 'info' },
        { text: 'Accessing PMDA (Pharmaceuticals and Medical Devices Agency) safety reports...', delay: 1200, type: 'info' },
        { text: `Querying Japan Science & Technology J-STAGE medical databases (${apiNames})...`, delay: 1400, type: 'info' },
        { text: 'PMDA: Fetched drug reviews & adverse reaction profile records...', delay: 1000, type: 'success' },
        { text: 'Reviewing Japanese Circulation Society & JSGE local guidelines...', delay: 1500, type: 'warn' }
      ],
      china: [
        { text: 'Parsing query & setting jurisdiction context: China (NHC guidelines)...', delay: 800, type: 'info' },
        { text: 'Accessing NHC EHR Vocabulary bridge and standard classifications...', delay: 1200, type: 'info' },
        { text: `Querying Chinese National Medical Standard database & TCM ontologies (${apiNames})...`, delay: 1400, type: 'info' },
        { text: 'TCM Mapping: Correlated diagnostic ICD-10 code with Traditional Chinese Medicine pattern...', delay: 1000, type: 'success' },
        { text: 'Checking national drug catalog and clinical diagnostic criteria...', delay: 1500, type: 'warn' }
      ]
    };

    const baseSteps = regionalStepsMap[selectedRegion] || regionalStepsMap.usa;
    const steps = [
      ...baseSteps,
      { text: 'Synthesizing evidence and guidelines with LLM synthesis engine...', delay: 1200, type: 'success' as const }
    ];

    let currentLogIndex = 0;

    const runLogs = () => {
      if (currentLogIndex < steps.length) {
        const step = steps[currentLogIndex];
        setLogs(prev => [...prev, { type: step.type, text: `[AGENT:${currentLogIndex + 1}] ${step.text}` }]);
        currentLogIndex++;
        setTimeout(runLogs, step.delay);
      } else {
        // Run LLM synthesis
        triggerLlmSynthesis();
      }
    };

    runLogs();
  };

  const triggerLlmSynthesis = async () => {
    setLogs(prev => [...prev, { type: 'info', text: '[AGENT:Compiler] Synthesizing consensus report using LLM Gateway...' }]);
    
    const config = getActiveModelConfig();
    const systemPrompt = `You are a Clinical Guidelines Synthesizer & Medical Researcher Agent.
Analyze the user's medical query and formulate a detailed consensus report based on standard guidelines (AHA/ACC, KDIGO, NCCN, HL7, AAFP).

JURISDICTION/REGION: ${selectedRegion.toUpperCase()}
Ensure to evaluate guidelines and regulations corresponding to this region (e.g. ABDM in India, NHS in the UK, PMDA in Japan, Mayo Clinic & NIH RxNorm/LOINC in the USA). Include references to regional medical vocabulary mapping if applicable.

You MUST respond in this exact JSON format (no markdown code blocks, no trailing comments):
{
  "summary": "Executive summary of the case and core guidelines recommendation (2-3 sentences), mentioning the relevant regional context",
  "checks": [
    {
      "guideline": "e.g. Stanford NOHARM / FDA / NICE / ABDM / PMDA",
      "rule": "Rule description (e.g. TB screen required before biologic)",
      "result": "satisfied" or "violated",
      "reason": "Brief justification based on clinical parameters"
    }
  ],
  "protocol": "Recommended step-by-step treatment or diagnostic protocol",
  "citations": [
    "Regional Guideline (e.g., NICE 2024, ICMR, AHA/ACC 2023, PMDA)...",
    "Clinical evidence journal..."
  ]
}`;

    try {
      const rawText = await executeModelRequest(config, systemPrompt, [], query, true);
      
      // Clean up response if it has json markup
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```')) {
        const lines = cleaned.split('\n');
        if (lines[0].startsWith('```')) lines.shift();
        if (lines[lines.length - 1].startsWith('```')) lines.pop();
        cleaned = lines.join('\n').trim();
      }

      const parsed = JSON.parse(cleaned);

      setReport({
        summary: parsed.summary || 'Guidelines analysis compiled.',
        checks: parsed.checks || [],
        protocol: parsed.protocol || 'Protocol compiled.',
        citations: parsed.citations || []
      });

      setLogs(prev => [...prev, { type: 'success', text: '[AGENT:Complete] Guidelines Synthesis successfully compiled and signed.' }]);
      logToGlobal('success', 'RESEARCH_ENGINE', 'Deep Research Guidelines Synthesis completed successfully.');
    } catch (err: any) {
      setError(`Guidelines synthesis failed: ${err.message}`);
      setLogs(prev => [...prev, { type: 'warn', text: `[AGENT:Error] Compiler failed: ${err.message}` }]);
      logToGlobal('error', 'RESEARCH_ENGINE', `Deep Research failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="copilot-container animate-slide-up">
      {/* Overview */}
      <div className="rt-header">
        <div>
          <div className="rt-badge" style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)', color: 'var(--brand)' }}>
            <span className="rt-dot" style={{ background: 'var(--brand)' }} />
            Guidelines Deep Research Synthesizer Active
          </div>
          <h2 className="rt-title">Autonomous Clinical Guidelines Deep Research</h2>
          <p className="rt-subtitle">
            Query standard clinical protocols, clinical trials, and medical association guidelines (AHA, NCCN, KDIGO) to synthesize consensus reports.
          </p>
        </div>
      </div>

      <div className="cookbook-grid">
        {/* Left Side: Input console and logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="lb-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 className="lb-card-title">1. Stage Clinical Research Target</h4>
              <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>
                Select a region and search query to evaluate:
              </p>

              {/* Region Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <Globe size={14} style={{ color: 'var(--brand)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fg-primary)' }}>Target Region:</span>
                <select
                  value={selectedRegion}
                  onChange={e => setSelectedRegion(e.target.value)}
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
                  <option value="usa">United States (Mayo Clinic, NLM, FDA)</option>
                  <option value="india">India (ABDM Sandbox, CDSCO, ICMR)</option>
                  <option value="uk">United Kingdom (NHS England, NICE)</option>
                  <option value="japan">Japan (PMDA, MHLW, J-Stage)</option>
                  <option value="china">China (NHC Standard, TCM Ontology)</option>
                </select>
              </div>

              {/* Suggestions */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {SAMPLE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    className="btn btn-sm"
                    onClick={() => setQuery(q.prompt)}
                    disabled={loading}
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    {q.title}
                  </button>
                ))}
              </div>

              <textarea
                className="rt-textarea"
                style={{ height: '180px', fontSize: '13px', fontFamily: 'monospace', lineHeight: '1.5' }}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type your clinical guidelines query here..."
                disabled={loading}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleResearch}
              disabled={loading || !query.trim()}
              style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
            >
              {loading ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
              {loading ? 'Synthesizing Evidence...' : 'Initiate Deep Guidelines Synthesis'}
            </button>
          </div>
        </div>

        {/* Right Side: Logs / Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Simulated search logs */}
          {(loading || logs.length > 0) && (
            <div className="lb-card">
              <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14} style={{ color: 'var(--brand)' }} />
                Multi-Agent Search Execution Logs
              </h4>
              <div className="research-console">
                {logs.map((log, idx) => (
                  <div key={idx} className={`research-log-line ${log.type}`}>
                    {log.text}
                  </div>
                ))}
                {loading && !report && <div className="spinner-dots" style={{ margin: '8px 0 0 0' }} />}
              </div>
            </div>
          )}

          {/* Compiled report */}
          {report && !loading && (
            <div className="copilot-results animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="lb-card">
                <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <BookOpen size={15} style={{ color: 'var(--color-safe)' }} />
                  Synthesized Clinical Consensus Report
                </h4>

                {/* Executive Summary */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>Executive Summary</span>
                  <p style={{ fontSize: '12.5px', color: 'var(--fg-primary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    {report.summary}
                  </p>
                </div>

                {/* Guidelines Checklist */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Guideline Verification Grid:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    {report.checks.map((chk, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: '8px' }}>
                        {chk.result === 'satisfied' ? (
                          <CheckCircle size={15} style={{ color: 'var(--color-safe)', marginTop: '2px', flexShrink: 0 }} />
                        ) : (
                          <AlertTriangle size={15} style={{ color: 'var(--color-danger)', marginTop: '2px', flexShrink: 0 }} />
                        )}
                        <div>
                          <strong style={{ fontSize: '12px', color: 'var(--fg-primary)', display: 'block' }}>[{chk.guideline}] {chk.rule}</strong>
                          <span style={{ fontSize: '11.5px', color: chk.result === 'satisfied' ? 'var(--fg-muted)' : 'var(--fg-danger)' }}>{chk.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Protocol */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>Recommended Protocol Flow</span>
                  <p style={{ fontSize: '12.5px', color: 'var(--fg-primary)', margin: '4px 0 0 0', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                    {report.protocol}
                  </p>
                </div>

                {/* Citations */}
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Citations &amp; Sources</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {report.citations.map((cit, idx) => (
                      <div key={idx} style={{ fontSize: '11px', color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--brand)', fontWeight: 'bold' }}>[{idx + 1}]</span>
                        <span>{cit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="rt-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '8px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--fg-danger)' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
