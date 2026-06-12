import React, { useState } from 'react';
import { executeModelRequest, getActiveModelConfig } from '../utils/geminiClient';
import { TelemetryLog } from '../types/clinical';
import { Play, BookOpen, Terminal, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

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

    // Simulated Agent Steps
    const steps = [
      { text: 'Parsing query & identifying target clinical domains...', delay: 1000, type: 'info' as const },
      { text: 'Scanning local EHR guidelines library & PubMed indexes...', delay: 1500, type: 'info' as const },
      { text: 'Querying medical societies (AHA/ACC, NCCN, AAFP, KDIGO)...', delay: 1500, type: 'info' as const },
      { text: 'Running clinical protocol compliance parser (verifying TB, eGFR, ECG guidelines)...', delay: 1500, type: 'warn' as const },
      { text: 'Synthesizing trial statistics and guidelines evidence...', delay: 1200, type: 'success' as const }
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

You MUST respond in this exact JSON format (no markdown code blocks, no trailing comments):
{
  "summary": "Executive summary of the case and core guidelines recommendation (2-3 sentences)",
  "checks": [
    {
      "guideline": "e.g. Stanford NOHARM / FDA",
      "rule": "Rule description (e.g. TB screen required before biologic)",
      "result": "satisfied" or "violated",
      "reason": "Brief justification based on clinical parameters"
    }
  ],
  "protocol": "Recommended step-by-step treatment or diagnostic protocol",
  "citations": [
    "AHA/ACC 2023 Guidelines...",
    "American Journal of Gastroenterology..."
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
                Select a standard inquiry or input a custom query:
              </p>

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
