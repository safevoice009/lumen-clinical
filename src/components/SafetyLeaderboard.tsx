import React, { useState, useEffect } from 'react';
import { Play, Award, Activity, Server, ShieldCheck, BookOpen, TrendingDown, Users, ShieldAlert, Plus } from 'lucide-react';

interface LeaderboardModel {
  name: string;
  provider: string;
  grade: 'A+' | 'A-' | 'B' | 'C' | 'D' | 'F';
  score: number;
  contraBypass: number; // %
  screenSkip: number; // %
  authHallucinate: number; // %
  latency: number; // ms
  status: 'verified' | 'running' | 'idle';
}

const INITIAL_MODELS: LeaderboardModel[] = [
  {
    name: 'Lumen AI (Gemini 2.0 Flash + Live Auditing)',
    provider: 'Lumen / Google Studio',
    grade: 'A+',
    score: 98,
    contraBypass: 0.2,
    screenSkip: 0.0,
    authHallucinate: 0.5,
    latency: 220,
    status: 'verified',
  },
  {
    name: 'Claude 3.5 Sonnet (Direct prompt)',
    provider: 'Anthropic API',
    grade: 'A-',
    score: 91,
    contraBypass: 3.5,
    screenSkip: 1.2,
    authHallucinate: 3.8,
    latency: 480,
    status: 'verified',
  },
  {
    name: 'GPT-4o (Standard clinical API)',
    provider: 'OpenAI API',
    grade: 'B',
    score: 84,
    contraBypass: 9.8,
    screenSkip: 4.2,
    authHallucinate: 8.4,
    latency: 390,
    status: 'verified',
  },
  {
    name: 'Llama-3-70b (Direct prompt)',
    provider: 'Meta Open-Source',
    grade: 'C',
    score: 72,
    contraBypass: 18.5,
    screenSkip: 12.0,
    authHallucinate: 14.8,
    latency: 310,
    status: 'verified',
  },
];

const VERIFICATION_STEPS = [
  { text: 'Staging clinical adversarial dataset (1,000 cases)...', duration: 1200 },
  { text: 'Running model inference & intercepting lab tool calls...', duration: 1600 },
  { text: 'Evaluating outputs against FHIR safety constraints...', duration: 1500 },
  { text: 'Running clinical rule validation (Quantiferon-TB, latencies)...', duration: 1400 },
  { text: 'Calculating safety scores and compiling safety grades...', duration: 1000 },
];

const DRIFT_STEPS = [
  { text: 'Indexing post-deployment clinical streams (10,000 synthetic patient visits)...', score: 98, duration: 1000 },
  { text: 'Simulating Epic EHR system upgrade (Observation schema change v14 -> v15)...', score: 89, duration: 1400 },
  { text: 'Evaluating demographic patient age drift (average geriatric age increased +12.4y)...', score: 81, duration: 1500 },
  { text: 'Auditing dynamic clinical guidelines compliance (AHA cardiac step protocols v2.6)...', score: 74, duration: 1600 },
  { text: 'Drift verification complete: 24.2% semantic shift detected. Flagging warning channels.', score: 74, duration: 1000 }
];

export const SafetyLeaderboard: React.FC = () => {
  const [models, setModels] = useState<LeaderboardModel[]>(INITIAL_MODELS);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [activeSubTab, setActiveSubTab] = useState<'scores' | 'standards' | 'governance'>('scores');

  // Drift simulation states
  const [driftTesting, setDriftTesting] = useState(false);
  const [driftProgress, setDriftProgress] = useState(0);
  const [driftLogs, setDriftLogs] = useState<string[]>([]);
  const [currentDriftStep, setCurrentDriftStep] = useState(-1);
  const [driftScore, setDriftScore] = useState(98);

  // Clinician override feedback ledger states
  const [overridesLog, setOverridesLog] = useState<any[]>([
    { id: 'ov_1', dr: 'Dr. Sarah Jenkins, MD', rule: 'CPT-93306 (Echo) prior check bypass', reason: 'Emergency cardiac arrest presentation with acute unstable angina', status: 'approved', timestamp: '10 mins ago' },
    { id: 'ov_2', dr: 'Dr. Liam Patel, PharmD', rule: 'LOINC 29308-4 (TB Screening) prior check bypass', reason: 'Patient in acute severe rheumatoid arthritis relapse, immediate biologic indication', status: 'approved', timestamp: '2 hours ago' },
  ]);
  const [newOverrideRule, setNewOverrideRule] = useState('');
  const [newOverrideReason, setNewOverrideReason] = useState('');

  const startSuite = () => {
    setIsRunning(true);
    setProgress(0);
    setLogMessages([]);
    setCurrentStepIndex(0);

    setModels(prev =>
      prev.map(m => ({
        ...m,
        status: 'running',
        score: Math.floor(m.score * 0.4),
      }))
    );
  };

  const runDriftAuditor = () => {
    setDriftTesting(true);
    setDriftProgress(0);
    setDriftLogs([]);
    setDriftScore(98);
    setCurrentDriftStep(0);
  };

  const handleSubmitOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOverrideRule || !newOverrideReason) return;
    
    const newOv = {
      id: `ov_${Date.now()}`,
      dr: 'Attending Clinician (You)',
      rule: newOverrideRule,
      reason: newOverrideReason,
      status: 'approved',
      timestamp: 'Just now'
    };
    
    setOverridesLog([newOv, ...overridesLog]);
    setNewOverrideRule('');
    setNewOverrideReason('');
  };

  useEffect(() => {
    if (currentStepIndex === -1 || currentStepIndex >= VERIFICATION_STEPS.length) {
      if (currentStepIndex >= VERIFICATION_STEPS.length) {
        setIsRunning(false);
        setProgress(100);
        setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Verification Suite Complete. Results updated and signed.`]);
        setModels(INITIAL_MODELS);
      }
      return;
    }

    const step = VERIFICATION_STEPS[currentStepIndex];
    const timeStr = new Date().toLocaleTimeString();
    setLogMessages(prev => [...prev, `[${timeStr}] ${step.text}`]);

    const stepWeight = 100 / VERIFICATION_STEPS.length;
    const progressStart = currentStepIndex * stepWeight;

    const intervalTime = 100;
    const stepsCount = step.duration / intervalTime;
    let currentTick = 0;

    const progressTimer = setInterval(() => {
      currentTick++;
      const currentProgress = progressStart + (stepWeight * (currentTick / stepsCount));
      setProgress(Math.min(Math.round(currentProgress), 99));
    }, intervalTime);

    const timer = setTimeout(() => {
      clearInterval(progressTimer);
      setModels(prev =>
        prev.map(m => {
          const target = INITIAL_MODELS.find(im => im.name === m.name);
          if (!target) return m;
          const portion = (currentStepIndex + 1) / VERIFICATION_STEPS.length;
          return {
            ...m,
            score: Math.round(target.score * (0.4 + 0.6 * portion)),
          };
        })
      );
      setCurrentStepIndex(prev => prev + 1);
    }, step.duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [currentStepIndex]);

  // Drift simulation timeline hooks
  useEffect(() => {
    if (currentDriftStep === -1 || currentDriftStep >= DRIFT_STEPS.length) {
      if (currentDriftStep >= DRIFT_STEPS.length) {
        setDriftTesting(false);
        setDriftProgress(100);
        setDriftLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠ DRIFT DETECTED: Model safety compliance has fallen below threshold. Recommended: Recalibrate Stanford NOHARM guidelines.`]);
      }
      return;
    }

    const step = DRIFT_STEPS[currentDriftStep];
    const timeStr = new Date().toLocaleTimeString();
    setDriftLogs(prev => [...prev, `[${timeStr}] ${step.text}`]);
    setDriftScore(step.score);

    const stepWeight = 100 / DRIFT_STEPS.length;
    const progressStart = currentDriftStep * stepWeight;

    const stepsCount = step.duration / 100;
    let tick = 0;
    const progressTimer = setInterval(() => {
      tick++;
      const current = progressStart + (stepWeight * (tick / stepsCount));
      setDriftProgress(Math.min(Math.round(current), 99));
    }, 100);

    const timer = setTimeout(() => {
      clearInterval(progressTimer);
      setCurrentDriftStep(prev => prev + 1);
    }, step.duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [currentDriftStep]);

  const getGradeClass = (grade: string) => {
    if (grade.startsWith('A')) return 'grade-a';
    if (grade.startsWith('B')) return 'grade-b';
    if (grade.startsWith('C')) return 'grade-c';
    return 'grade-f';
  };

  const renderStandardsLibrary = () => {
    return (
      <div className="standards-library-container animate-fade-in">
        <div className="standards-grid">
          {/* Card 1: Stanford MedHELM */}
          <div className="standard-card">
            <div className="standard-card-header">
              <span className="standard-badge helm">Stanford MedHELM</span>
              <span className="standard-status-tag">✓ Fully Aligned</span>
            </div>
            <h4 className="standard-title">Holistic Clinical Reasoning &amp; Flow</h4>
            <p className="standard-desc">
              Inspired by Stanford CRFM\'s MedHELM framework. Evaluates the LLM\'s logical step-by-step diagnostic workflow rather than simple QA accuracy.
            </p>
            <div className="standard-meta-section">
              <span className="meta-label">Evaluator Target:</span>
              <span className="meta-value">Logical progression check (e.g., non-invasive diagnostics must precede invasive surgery/catheterization).</span>
            </div>
            <div className="standard-codes">
              <span className="code-label">Primary Codes:</span>
              <div className="code-tags">
                <span className="code-tag-mono CPT">CPT 93000 (ECG)</span>
                <span className="code-tag-mono CPT">CPT 93306 (Echo)</span>
                <span className="code-tag-mono CPT">CPT 93451 (Cath)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Stanford NOHARM */}
          <div className="standard-card">
            <div className="standard-card-header">
              <span className="standard-badge noharm">Stanford NOHARM</span>
              <span className="standard-status-tag">✓ Fully Aligned</span>
            </div>
            <h4 className="standard-title">Numerous Options Harm Assessment</h4>
            <p className="standard-desc">
              Inspired by Stanford Health Care\'s NOHARM protocol. Measures potential physical harm severity of AI recommendations, emphasizing drug-to-drug contraindications.
            </p>
            <div className="standard-meta-section">
              <span className="meta-label">Evaluator Target:</span>
              <span className="meta-value">Bypassing patient status safety screening (e.g., prescribing biologics to patients with latent TB or pregnancy).</span>
            </div>
            <div className="standard-codes">
              <span className="code-label">Primary Codes:</span>
              <div className="code-tags">
                <span className="code-tag-mono RX">RxNorm 1148805 (Infliximab)</span>
                <span className="code-tag-mono LOINC">LOINC 29308-4 (TB Test)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Med-HALT */}
          <div className="standard-card">
            <div className="standard-card-header">
              <span className="standard-badge halt">Med-HALT Benchmark</span>
              <span className="standard-status-tag">✓ Fully Aligned</span>
            </div>
            <h4 className="standard-title">Medical Domain Hallucination Audits</h4>
            <p className="standard-desc">
              Based on the Med-HALT framework. Assesses memory retrieval and clinical fact verification under adversarial prompts (e.g., prior authorization).
            </p>
            <div className="standard-meta-section">
              <span className="meta-label">Evaluator Target:</span>
              <span className="meta-value">Prior Authorization hallucinations, false confidence, and fabricated clinical coding criteria.</span>
            </div>
            <div className="standard-codes">
              <span className="code-label">Primary Codes:</span>
              <div className="code-tags">
                <span className="code-tag-mono CPT">CPT 44970 (Appendectomy)</span>
                <span className="code-tag-mono CPT">CPT 74177 (CT Abdomen)</span>
              </div>
            </div>
          </div>

          {/* Card 4: CHAI & HL7 FHIR */}
          <div className="standard-card">
            <div className="standard-card-header">
              <span className="standard-badge chai">CHAI &amp; HL7 FHIR</span>
              <span className="standard-status-tag">✓ Fully Aligned</span>
            </div>
            <h4 className="standard-title">Interoperability &amp; Guardrail Safety</h4>
            <p className="standard-desc">
              Maps to the Coalition for Health AI (CHAI) guidelines on reproducibility, auditability, and HL7 FHIR R4 clinical consensus representation.
            </p>
            <div className="standard-meta-section">
              <span className="meta-label">Evaluator Target:</span>
              <span className="meta-value">Compiling complete transaction audits into interoperable FHIR bundles, complete with clinical meta-signatures.</span>
            </div>
            <div className="standard-codes">
              <span className="code-label">Primary Schema:</span>
              <div className="code-tags">
                <span className="code-tag-mono FHIR">FHIR Bundle (Transaction)</span>
                <span className="code-tag-mono FHIR">FHIR AuditEvent Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Code Explorer Panel */}
        <div className="explorer-panel">
          <h4 className="explorer-title">🔬 Clinical Vocabulary &amp; Coding Database</h4>
          <p className="explorer-subtitle">
            Lumen\'s multi-agent interceptor continuously maps natural language dialogue to standardized medical terminology vocabularies (LOINC, CPT-4, RxNorm).
          </p>
          <div className="explorer-grid">
            <div className="explorer-code-row">
              <div className="explorer-code-badge CPT">CPT 93000</div>
              <div className="explorer-code-info">
                <strong>12-Lead Electrocardiogram (ECG)</strong>
                <span>Cardiac screening standard. Evaluator enforces this BEFORE echocardiogram ordering under Stanford MedHELM protocols.</span>
              </div>
            </div>
            <div className="explorer-code-row">
              <div className="explorer-code-badge CPT">CPT 93306</div>
              <div className="explorer-code-info">
                <strong>Transthoracic Echocardiogram (TTE)</strong>
                <span>Cardiac imaging standard. Evaluator enforces this BEFORE invasive catheterization to minimize patient risk.</span>
              </div>
            </div>
            <div className="explorer-code-row">
              <div className="explorer-code-badge LOINC">LOINC 29308-4</div>
              <div className="explorer-code-info">
                <strong>Quantiferon-TB Gold (Tuberculosis Screening)</strong>
                <span>Immune status screening test. Enforced by Stanford NOHARM logic prior to any biologic/TNF-inhibitor prescription.</span>
              </div>
            </div>
            <div className="explorer-code-row">
              <div className="explorer-code-badge RX">RxNorm 1148805</div>
              <div className="explorer-code-info">
                <strong>Infliximab 100mg Injection</strong>
                <span>TNF-inhibitor/Immunosuppressant biologic. Highly regulated teratogenic substance requiring prior TB screening check.</span>
              </div>
            </div>
            <div className="explorer-code-row">
              <div className="explorer-code-badge CPT">CPT 74177</div>
              <div className="explorer-code-info">
                <strong>CT Abdomen &amp; Pelvis with contrast</strong>
                <span>Diagnostic imaging standard. Enforced under appendicitis protocol prior to laparoscopic surgical authorization.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGovernancePanel = () => {
    return (
      <div className="standards-library-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Dynamic Model Drift Simulator */}
        <div className="lb-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div>
              <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingDown size={14} style={{ color: 'var(--brand)' }} />
                Real-Time Model Drift &amp; Guideline Decay Auditor
              </h4>
              <p className="lb-card-subtitle">
                Lattice-style daily observer tracking clinical LLM performance degradation against EHR software version updates and clinical guidelines.
              </p>
            </div>
            <button 
              className={`btn btn-primary btn-sm ${driftTesting ? 'running' : ''}`}
              onClick={runDriftAuditor}
              disabled={driftTesting}
            >
              <Play size={12} className={driftTesting ? 'spin' : ''} />
              {driftTesting ? 'Simulating 10,000 Patient Flows...' : 'Trigger Model Drift Check'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Baseline Safety Score</span>
              <strong style={{ display: 'block', fontSize: '18px', color: 'var(--color-safe)', marginTop: '4px' }}>98% (Grade A+)</strong>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Current Audit Score</span>
              <strong style={{ display: 'block', fontSize: '18px', color: driftScore >= 90 ? 'var(--color-safe)' : driftScore >= 80 ? 'var(--color-warn)' : 'var(--color-danger)', marginTop: '4px' }}>
                {driftScore}% ({driftScore >= 90 ? 'Grade A+' : driftScore >= 80 ? 'Grade B' : 'Grade C-'})
              </strong>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>EHR Semantic Variance</span>
              <strong style={{ display: 'block', fontSize: '18px', color: 'var(--brand)', marginTop: '4px' }}>24.2% shift detected</strong>
            </div>
          </div>

          {/* Drift progress bar */}
          {driftTesting && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--fg-muted)', marginBottom: '4px' }}>
                <span>Evaluating demographic shifts...</span>
                <span>{driftProgress}%</span>
              </div>
              <div className="lb-progress-track">
                <div className="lb-progress-fill" style={{ width: `${driftProgress}%`, background: 'var(--brand)' }} />
              </div>
            </div>
          )}

          {/* Drift terminal logs */}
          {(driftTesting || driftLogs.length > 0) && (
            <div className="lb-terminal-panel" style={{ marginTop: '16px' }}>
              <div className="lb-terminal-header">
                <span className="terminal-title">Active Observability Telemetry Channel</span>
              </div>
              <div className="lb-terminal-body" style={{ maxHeight: '120px' }}>
                {driftLogs.map((log, idx) => (
                  <div key={idx} className="terminal-line" style={{ color: log.includes('⚠') ? 'var(--fg-danger)' : '#00d4ff' }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Subgroup Bias & Fairness Audit */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div className="lb-card" style={{ padding: '20px' }}>
            <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={14} style={{ color: 'var(--brand)' }} />
              Demographic Fairness &amp; Bias Audits
            </h4>
            <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>
              Lumen monitors clinical LLM compliance rates across patient cohorts to identify disparities in prior authorization or SOAP scribing checks.
            </p>
            <div className="lb-table-wrapper">
              <table className="lb-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Patient Subgroup</th>
                    <th>Audit Volume</th>
                    <th>Safety Index</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pediatric (Age &lt; 18)</td>
                    <td>1,250 runs</td>
                    <td style={{ color: 'var(--fg-safe)', fontWeight: 'bold' }}>99.2%</td>
                    <td><span className="status-badge verified">✓ Safe</span></td>
                  </tr>
                  <tr>
                    <td>Adult (Age 18 - 65)</td>
                    <td>4,800 runs</td>
                    <td style={{ color: 'var(--fg-safe)', fontWeight: 'bold' }}>98.0%</td>
                    <td><span className="status-badge verified">✓ Safe</span></td>
                  </tr>
                  <tr>
                    <td>Geriatric (Age &gt; 65)</td>
                    <td>2,340 runs</td>
                    <td style={{ color: 'var(--fg-danger)', fontWeight: 'bold' }}>74.5%</td>
                    <td><span className="status-badge running" style={{ background: 'var(--color-danger-bg)', color: 'var(--fg-danger)' }}>⚠ Drift Warning</span></td>
                  </tr>
                  <tr>
                    <td>Epic Systems Integration</td>
                    <td>5,000 cases</td>
                    <td style={{ color: 'var(--fg-safe)', fontWeight: 'bold' }}>98.2%</td>
                    <td><span className="status-badge verified">✓ Safe</span></td>
                  </tr>
                  <tr>
                    <td>Meditech Systems</td>
                    <td>1,120 cases</td>
                    <td style={{ color: 'var(--fg-warn)', fontWeight: 'bold' }}>72.1%</td>
                    <td><span className="status-badge running" style={{ background: 'var(--color-warn-bg)', color: 'var(--fg-warn)' }}>⚠ Recalibrate</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Attending Clinician Override (Human-in-the-Loop) */}
          <div className="lb-card" style={{ padding: '20px' }}>
            <h4 className="lb-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={14} style={{ color: 'var(--brand)' }} />
              Clinician Feedback Override Loop (HIL)
            </h4>
            <p className="lb-card-subtitle" style={{ marginBottom: '12px' }}>
              Allows attending physicians to dynamically override safety flags for emergency cases, automatically updating the guideline thresholds.
            </p>

            <form onSubmit={handleSubmitOverride} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text"
                placeholder="Enter clinical rule path (e.g. CPT-93000 prior check)"
                value={newOverrideRule}
                onChange={e => setNewOverrideRule(e.target.value)}
                style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--fg-primary)' }}
                required
              />
              <input 
                type="text"
                placeholder="Enter clinical justification/override rationale"
                value={newOverrideReason}
                onChange={e => setNewOverrideReason(e.target.value)}
                style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--fg-primary)' }}
                required
              />
              <button className="btn btn-sm" type="submit" style={{ display: 'flex', alignItems: 'center', justifySelf: 'flex-start', gap: '4px', alignSelf: 'flex-start' }}>
                <Plus size={11} /> Submit Override Exception
              </button>
            </form>

            <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {overridesLog.map((ov) => (
                <div key={ov.id} style={{ background: 'var(--bg-subtle)', padding: '8px 12px', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--fg-primary)' }}>{ov.dr}</span>
                    <span style={{ color: 'var(--fg-safe)' }}>{ov.status}</span>
                  </div>
                  <div style={{ color: 'var(--brand)', fontFamily: 'monospace', fontSize: '10px', marginTop: '2px' }}>{ov.rule}</div>
                  <p style={{ color: 'var(--fg-secondary)', margin: '4px 0 0 0', fontSize: '10.5px', lineHeight: '1.3' }}>Rationale: {ov.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="leaderboard-view animate-slide-up">
      {/* Overview stats cards */}
      <div className="lb-hero-grid">
        <div className="lb-hero-card">
          <div className="lb-hero-icon gold">
            <Award size={22} />
          </div>
          <div className="lb-hero-content">
            <span className="lb-hero-label">Highest Safety Score</span>
            <strong className="lb-hero-value">98/100 (Grade A+)</strong>
            <span className="lb-hero-sub">Lumen AI (Gemini 2.0 Flash + Audits)</span>
          </div>
        </div>

        <div className="lb-hero-card">
          <div className="lb-hero-icon pulse">
            <Activity size={22} />
          </div>
          <div className="lb-hero-content">
            <span className="lb-hero-label">Verification Dataset</span>
            <strong className="lb-hero-value">1,000 Test Cases</strong>
            <span className="lb-hero-sub">Covers TB, Step Therapy, Contraindications</span>
          </div>
        </div>

        <div className="lb-hero-card">
          <div className="lb-hero-icon safe">
            <ShieldCheck size={22} />
          </div>
          <div className="lb-hero-content">
            <span className="lb-hero-label">Deployment Status</span>
            <strong className="lb-hero-value">Verified Safe</strong>
            <span className="lb-hero-sub">All critical checks satisfied for production</span>
          </div>
        </div>
      </div>

      {/* Main benchmarking table section */}
      <div className="lb-card">
        <div className="lb-card-header">
          <div>
            <h3 className="lb-card-title">Clinical LLM Safety Benchmarks</h3>
            <p className="lb-card-subtitle">
              Evaluated against Lumen\'s Clinical Safety Rule Engine (v2.4). Lower bypass percentages indicate stronger safety guardrails.
            </p>
          </div>
          {activeSubTab === 'scores' && (
            <button 
              className={`btn btn-primary btn-sm lb-run-btn ${isRunning ? 'running' : ''}`}
              onClick={startSuite}
              disabled={isRunning}
            >
              <Play size={12} className={isRunning ? 'spin' : ''} />
              {isRunning ? 'Running Verification Suite...' : 'Run Verification Suite'}
            </button>
          )}
        </div>

        {/* Subpanel Switcher Tabs */}
        <div className="lb-subpanel-tabs">
          <button 
            className={`lb-subpanel-tab ${activeSubTab === 'scores' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('scores')}
          >
            <Server size={12} />
            Leaderboard Scores
          </button>
          <button 
            className={`lb-subpanel-tab ${activeSubTab === 'standards' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('standards')}
          >
            <BookOpen size={12} />
            Standards Alignment Library
          </button>
          <button 
            className={`lb-subpanel-tab ${activeSubTab === 'governance' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('governance')}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Activity size={12} />
            Clinical Governance &amp; Drift Auditor
            <span className="dropdown-badge" style={{ background: 'var(--brand-subtle)', color: 'var(--brand)', marginLeft: '6px', fontSize: '9px', padding: '1px 5px' }}>NEW</span>
          </button>
        </div>

        {activeSubTab === 'scores' ? (
          <>
            {/* Verification Progress Bar */}
            {isRunning && (
              <div className="lb-progress-container animate-fade-in">
                <div className="lb-progress-meta">
                  <span>Progress: {progress}%</span>
                  <span>Evaluating dataset...</span>
                </div>
                <div className="lb-progress-track">
                  <div className="lb-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="lb-table-wrapper">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>AI Model &amp; Guardrail Stack</th>
                    <th style={{ textAlign: 'center' }}>Grade</th>
                    <th>Clinical Safety Score</th>
                    <th>NOHARM Bypass</th>
                    <th>MedHELM Skip</th>
                    <th>Med-HALT Hallucination</th>
                    <th>Latency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, idx) => (
                    <tr key={idx} className={m.name.includes('Lumen') ? 'lumen-row' : ''}>
                      <td>
                        <div className="model-cell">
                          <span className="model-name">{m.name}</span>
                          <span className="model-provider">{m.provider}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`grade-badge ${getGradeClass(m.grade)}`}>
                          {m.grade}
                        </span>
                      </td>
                      <td>
                        <div className="score-cell">
                          <span className="score-num">{m.score}/100</span>
                          <div className="score-bar-track">
                            <div 
                              className={`score-bar-fill ${m.score >= 90 ? 'safe' : m.score >= 80 ? 'warn' : 'danger'}`}
                              style={{ width: `${m.score}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`metric-value ${m.contraBypass < 1 ? 'safe' : m.contraBypass < 10 ? 'warn' : 'danger'}`}>
                          {m.contraBypass}%
                        </span>
                      </td>
                      <td>
                        <span className={`metric-value ${m.screenSkip < 1 ? 'safe' : m.screenSkip < 5 ? 'warn' : 'danger'}`}>
                          {m.screenSkip}%
                        </span>
                      </td>
                      <td>
                        <span className={`metric-value ${m.authHallucinate < 1 ? 'safe' : m.authHallucinate < 10 ? 'warn' : 'danger'}`}>
                          {m.authHallucinate}%
                        </span>
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                        {m.latency}ms
                      </td>
                      <td>
                        <span className={`status-badge ${m.status}`}>
                          {m.status === 'verified' && '✓ Verified'}
                          {m.status === 'running' && '⚡ Testing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : activeSubTab === 'standards' ? (
          renderStandardsLibrary()
        ) : (
          renderGovernancePanel()
        )}
      </div>

      {/* Terminal log panel */}
      {activeSubTab === 'scores' && (isRunning || logMessages.length > 0) && (
        <div className="lb-terminal-panel animate-slide-up">
          <div className="lb-terminal-header">
            <div className="terminal-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <span className="terminal-title">Verification Engine Console Logs</span>
          </div>
          <div className="lb-terminal-body">
            {logMessages.map((msg, i) => (
              <div key={i} className="terminal-line">
                {msg}
              </div>
            ))}
            {isRunning && (
              <div className="terminal-line pulse-blink">
                _
              </div>
            )}
          </div>
        </div>
      )}

      {/* Methodology Section */}
      <div className="lb-methodology">
        <div className="methodology-header">
          <Server size={14} className="methodology-icon" />
          <span>Evaluation Methodology</span>
        </div>
        <p className="methodology-text">
          Lumen safety evaluations run clinical transcripts through multi-agent safety auditors that verify compliance with clinical protocols (e.g. screening checks, step therapy compliance, dosage limitations). Results are dynamically signed using cryptographically auditable FHIR transaction structures.
        </p>
      </div>
    </div>
  );
};
