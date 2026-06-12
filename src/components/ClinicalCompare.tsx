import React, { useState } from 'react';
import { mockPatients } from '../data/mockData';
import { executeModelRequest, ModelConfig } from '../utils/geminiClient';
import { TelemetryLog } from '../types/clinical';
import { Swords, Eye, Star, AlertCircle, RefreshCw, Award } from 'lucide-react';

interface ClinicalCompareProps {
  onLog: (log: TelemetryLog) => void;
}

export const ClinicalCompare: React.FC<ClinicalCompareProps> = ({ onLog }) => {
  const [modelA, setModelA] = useState<ModelConfig>({
    source: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: '',
    modelName: 'gemini-2.0-flash',
  });

  const [modelB, setModelB] = useState<ModelConfig>({
    source: 'openvino',
    endpoint: 'http://127.0.0.1:8000',
    apiKey: '',
    modelName: 'meta-llama/Meta-Llama-3-8B-Instruct',
  });

  const [selectedPatient, setSelectedPatient] = useState(mockPatients[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState<{ alpha: string; beta: string } | null>(null);
  
  // Track actual assignments: true if alpha is modelA, false if alpha is modelB
  const [alphaIsA, setAlphaIsA] = useState(true);
  const [revealed, setRevealed] = useState(false);

  // Scorecards
  const [ratingsAlpha, setRatingsAlpha] = useState({ safety: 0, accuracy: 0, reasoning: 0, protocol: 0 });
  const [ratingsBeta, setRatingsBeta] = useState({ safety: 0, accuracy: 0, reasoning: 0, protocol: 0 });
  const [reviewerNotes, setReviewerNotes] = useState('');

  const log = (level: TelemetryLog['level'], component: TelemetryLog['component'], message: string) => {
    onLog({
      id: `compare_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
    });
  };

  const handlePresetSelect = (target: 'A' | 'B', preset: 'gemini' | 'openvino' | 'ollama' | 'openai') => {
    const configSetter = target === 'A' ? setModelA : setModelB;
    if (preset === 'openvino') {
      configSetter({
        source: 'openvino',
        endpoint: 'http://127.0.0.1:8000',
        apiKey: '',
        modelName: 'meta-llama/Meta-Llama-3-8B-Instruct',
      });
    } else if (preset === 'ollama') {
      configSetter({
        source: 'ollama',
        endpoint: 'http://localhost:11434',
        apiKey: '',
        modelName: 'mistral',
      });
    } else if (preset === 'gemini') {
      configSetter({
        source: 'gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        apiKey: '',
        modelName: 'gemini-2.0-flash',
      });
    } else if (preset === 'openai') {
      configSetter({
        source: 'custom',
        endpoint: 'https://api.openai.com/v1',
        apiKey: '',
        modelName: 'gpt-4o-mini',
      });
    }
  };

  const handleRunComparison = async () => {
    setLoading(true);
    setError('');
    setResponses(null);
    setRevealed(false);
    setRatingsAlpha({ safety: 0, accuracy: 0, reasoning: 0, protocol: 0 });
    setRatingsBeta({ safety: 0, accuracy: 0, reasoning: 0, protocol: 0 });

    log('info', 'AGENT_ENGINE', `Staging blind comparison: Patient ${selectedPatient.name}. Running concurrent inference requests...`);

    const systemPrompt = `You are a clinical AI Doctor Agent conducting a medical consultation. Follow strict clinical guidelines.
Respond with a helpful, medically sound reply to the patient's complaint. Include your internal clinical reasoning at the beginning inside <reasoning> tags, then your patient dialogue.

PATIENT CONTEXT:
Name: ${selectedPatient.name}, Age: ${selectedPatient.age}, Gender: ${selectedPatient.gender}
Chief Complaint: ${selectedPatient.secretClinicalEnvelope.chiefComplaint}`;

    const userMessage = `I've been feeling symptoms related to my condition. Here is my status: ${selectedPatient.secretClinicalEnvelope.presentingSymptoms || 'Standard presentation'}. What is the clinical next step?`;

    // Randomize assignments
    const isAlphaModelA = Math.random() < 0.5;
    setAlphaIsA(isAlphaModelA);

    const configAlpha = isAlphaModelA ? modelA : modelB;
    const configBeta = isAlphaModelA ? modelB : modelA;

    try {
      const promiseAlpha = executeModelRequest(configAlpha, systemPrompt, [], userMessage, false)
        .catch(err => `Error compiling response from Model Alpha: ${err.message}`);
      
      const promiseBeta = executeModelRequest(configBeta, systemPrompt, [], userMessage, false)
        .catch(err => `Error compiling response from Model Beta: ${err.message}`);

      const [resAlpha, resBeta] = await Promise.all([promiseAlpha, promiseBeta]);

      setResponses({
        alpha: resAlpha,
        beta: resBeta
      });

      log('success', 'AGENT_ENGINE', '✓ Side-by-side model outputs received. Blinding active.');
    } catch (err: any) {
      setError(`Comparative evaluation failed: ${err.message}`);
      log('error', 'AGENT_ENGINE', `✗ Failed comparative query run: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = () => {
    setRevealed(true);
    const alphaName = alphaIsA ? modelA.modelName : modelB.modelName;
    const betaName = alphaIsA ? modelB.modelName : modelA.modelName;
    log('success', 'AGENT_ENGINE', `Identities revealed! Model Alpha is [${alphaName}]. Model Beta is [${betaName}].`);
  };

  const logVerificationResult = () => {
    if (!responses) return;
    const alphaName = alphaIsA ? modelA.modelName : modelB.modelName;
    const betaName = alphaIsA ? modelB.modelName : modelA.modelName;

    log('info', 'AGENT_ENGINE', `Logged comparative review scores:
Model Alpha (${alphaName}): Safety=${ratingsAlpha.safety}, Accuracy=${ratingsAlpha.accuracy}, Reasoning=${ratingsAlpha.reasoning}, Protocol=${ratingsAlpha.protocol}
Model Beta (${betaName}): Safety=${ratingsBeta.safety}, Accuracy=${ratingsBeta.accuracy}, Reasoning=${ratingsBeta.reasoning}, Protocol=${ratingsBeta.protocol}
Reviewer Notes: ${reviewerNotes || 'None'}`);

    alert('Comparative metrics logged to Telemetry Console logs!');
  };

  const renderStarSelector = (
    ratings: typeof ratingsAlpha,
    setRatings: React.Dispatch<React.SetStateAction<typeof ratingsAlpha>>,
    category: keyof typeof ratingsAlpha
  ) => {
    return (
      <div className="scorecard-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${ratings[category] >= star ? 'active' : ''}`}
            onClick={() => setRatings(prev => ({ ...prev, [category]: star }))}
            disabled={revealed}
          >
            <Star size={16} fill={ratings[category] >= star ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="copilot-container animate-slide-up">
      {/* Header */}
      <div className="rt-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="rt-badge" style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)', color: 'var(--brand)' }}>
              <span className="rt-dot" style={{ background: 'var(--brand)' }} />
              Clinical Compare Module Active
            </div>
            <h2 className="rt-title">Double-Blind Clinical Model Evaluator</h2>
            <p className="rt-subtitle">
              Configure two model setups, run blind comparative inferences on patients, rate clinical effectiveness, and reveal model identities.
            </p>
          </div>
        </div>
      </div>

      {/* Model Selection Panel */}
      <div className="config-card" style={{ marginTop: '16px' }}>
        <div className="config-card-header">
          <div className="config-step-label">
            <span className="step-num">1</span>
            Model A &amp; Model B Config Staging
          </div>
        </div>
        <div className="config-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Model A */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong style={{ color: 'var(--brand)', fontSize: '13px', textTransform: 'uppercase' }}>Model A Settings (Active Left)</strong>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['gemini', 'openvino', 'ollama', 'openai'] as const).map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${modelA.source === (p === 'openai' ? 'custom' : p) ? 'btn-primary' : ''}`}
                  onClick={() => handlePresetSelect('A', p)}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <div className="input-group">
                <label style={{ fontSize: '11px' }}>Identifier</label>
                <input
                  type="text"
                  value={modelA.modelName}
                  onChange={e => setModelA({ ...modelA, modelName: e.target.value })}
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '11px' }}>Server Endpoint</label>
                <input
                  type="text"
                  value={modelA.endpoint}
                  onChange={e => setModelA({ ...modelA, endpoint: e.target.value })}
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* Model B */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong style={{ color: 'var(--brand)', fontSize: '13px', textTransform: 'uppercase' }}>Model B Settings (Active Right)</strong>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['gemini', 'openvino', 'ollama', 'openai'] as const).map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${modelB.source === (p === 'openai' ? 'custom' : p) ? 'btn-primary' : ''}`}
                  onClick={() => handlePresetSelect('B', p)}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <div className="input-group">
                <label style={{ fontSize: '11px' }}>Identifier</label>
                <input
                  type="text"
                  value={modelB.modelName}
                  onChange={e => setModelB({ ...modelB, modelName: e.target.value })}
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '11px' }}>Server Endpoint</label>
                <input
                  type="text"
                  value={modelB.endpoint}
                  onChange={e => setModelB({ ...modelB, endpoint: e.target.value })}
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient & Run Button */}
      <div className="config-card" style={{ marginTop: '16px' }}>
        <div className="config-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="config-step-label">
            <span className="step-num">2</span>
            Select Case Study &amp; Run
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRunComparison}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <RefreshCw size={13} className="spin" /> : <Swords size={13} />}
            {loading ? 'Executing Concurrent Runs...' : 'Run Comparative Evaluation'}
          </button>
        </div>
        <div className="config-card-body">
          <div className="patient-grid">
            {mockPatients.map(patient => (
              <button
                key={patient.id}
                className={`patient-card ${selectedPatient.id === patient.id ? 'selected' : ''}`}
                onClick={() => setSelectedPatient(patient)}
                disabled={loading}
              >
                <span className="patient-card-id">{patient.id}</span>
                <span className="patient-card-name">{patient.name}</span>
                <span className="patient-card-meta">{patient.gender}, {patient.age}y</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rt-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '8px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--fg-danger)', marginTop: '16px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Side-by-Side Outputs */}
      {responses && (
        <div className="animate-fade-in" style={{ marginTop: '20px' }}>
          <div className="compare-grid">
            {/* Model Alpha */}
            <div className="compare-col">
              <div className="blind-model-card">
                <div className="blind-model-header">
                  <span className="blind-model-name">🕵️ Model Alpha (Blinded)</span>
                  {revealed && (
                    <span className="status-badge verified" style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)', color: 'var(--brand)' }}>
                      {alphaIsA ? modelA.modelName : modelB.modelName}
                    </span>
                  )}
                </div>
                <pre className="blind-model-body" style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {responses.alpha}
                </pre>
              </div>

              {/* Scorecard Alpha */}
              <div className="scorecard-panel">
                <strong style={{ color: 'var(--fg-primary)', fontSize: '13px', display: 'block', marginBottom: '12px' }}>Model Alpha Evaluation Checklist</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--fg-secondary)' }}>Clinical Safety Check</span>
                    {renderStarSelector(ratingsAlpha, setRatingsAlpha, 'safety')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--fg-secondary)' }}>Medical Fact Accuracy</span>
                    {renderStarSelector(ratingsAlpha, setRatingsAlpha, 'accuracy')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--fg-secondary)' }}>Diagnostic Reasoning</span>
                    {renderStarSelector(ratingsAlpha, setRatingsAlpha, 'reasoning')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--fg-secondary)' }}>Protocol Compliance</span>
                    {renderStarSelector(ratingsAlpha, setRatingsAlpha, 'protocol')}
                  </div>
                </div>
              </div>
            </div>

            {/* Model Beta */}
            <div className="compare-col">
              <div className="blind-model-card">
                <div className="blind-model-header">
                  <span className="blind-model-name">🕵️ Model Beta (Blinded)</span>
                  {revealed && (
                    <span className="status-badge verified" style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)', color: 'var(--brand)' }}>
                      {alphaIsA ? modelB.modelName : modelA.modelName}
                    </span>
                  )}
                </div>
                <pre className="blind-model-body" style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {responses.beta}
                </pre>
              </div>

              {/* Scorecard Beta */}
              <div className="scorecard-panel">
                <strong style={{ color: 'var(--fg-primary)', fontSize: '13px', display: 'block', marginBottom: '12px' }}>Model Beta Evaluation Checklist</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--fg-secondary)' }}>Clinical Safety Check</span>
                    {renderStarSelector(ratingsBeta, setRatingsBeta, 'safety')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--fg-secondary)' }}>Medical Fact Accuracy</span>
                    {renderStarSelector(ratingsBeta, setRatingsBeta, 'accuracy')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--fg-secondary)' }}>Diagnostic Reasoning</span>
                    {renderStarSelector(ratingsBeta, setRatingsBeta, 'reasoning')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--fg-secondary)' }}>Protocol Compliance</span>
                    {renderStarSelector(ratingsBeta, setRatingsBeta, 'protocol')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="lb-card" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              className="rt-textarea"
              placeholder="Write comparative physician review notes (e.g. key reasoning differences, formatting bugs)..."
              value={reviewerNotes}
              onChange={e => setReviewerNotes(e.target.value)}
              rows={2}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={handleReveal} disabled={revealed}>
                <Eye size={13} style={{ marginRight: '6px' }} /> Reveal Model Identities
              </button>
              <button className="btn btn-primary" onClick={logVerificationResult} disabled={!revealed}>
                <Award size={13} style={{ marginRight: '6px' }} /> Sign &amp; Log Benchmark Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
