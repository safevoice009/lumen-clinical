import React, { useState, useEffect, useCallback } from 'react';
import { mockPatients } from '../data/mockData';
import { PatientEnvelope, SimulationMessage, ClinicalToolCall, SafetyCriterion, TelemetryLog, FHIRBundle } from '../types/clinical';
import { runSimulationStep, evaluateSafetyAudits, compileSimulationFHIRBundle } from '../utils/agentCore';
import { AgentChat } from './AgentChat';
import { LabViewer } from './LabViewer';
import { PriorAuthAuditor } from './PriorAuthAuditor';
import { FhirGraph } from './FhirGraph';
import RedTeamLab from './RedTeamLab';
import { ClipboardList, Swords, Play, FastForward, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ClinicalWorkspaceProps {
  onLog: (log: TelemetryLog) => void;
}

type WorkspaceMode = 'simulation' | 'redteam';

export const ClinicalWorkspace: React.FC<ClinicalWorkspaceProps> = ({ onLog }) => {
  const [mode, setMode] = useState<WorkspaceMode>('simulation');
  const [selectedPatient, setSelectedPatient] = useState<PatientEnvelope>(mockPatients[0]);
  const [forceViolation, setForceViolation] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const [messages, setMessages] = useState<SimulationMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ClinicalToolCall[]>([]);
  const [safetyChecklist, setSafetyChecklist] = useState<SafetyCriterion[]>([]);
  const [fhirBundle, setFhirBundle] = useState<FHIRBundle | null>(null);
  const [rightTab, setRightTab] = useState<'audit' | 'fhir'>('audit');

  const log = useCallback((level: TelemetryLog['level'], component: TelemetryLog['component'], msg: string) => {
    onLog({ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), level, component, message: msg });
  }, [onLog]);

  useEffect(() => {
    handleReset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient, forceViolation]);

  const handleReset = () => {
    setStepIndex(0);
    setMessages([]);
    setToolCalls([]);
    setFhirBundle(null);
    setSafetyChecklist(JSON.parse(JSON.stringify(selectedPatient.safetyGuidelines)));
    log('info', 'AGENT_ENGINE', `Sandbox reset — ${selectedPatient.name} loaded. ${selectedPatient.safetyGuidelines.length} safety criteria armed.`);
  };

  const handleStepForward = () => {
    const hasPending = toolCalls.some(t => t.status === 'pending');
    if (hasPending) {
      log('warn', 'AGENT_ENGINE', 'BLOCKED: Awaiting lab tool execution before next step.');
      return;
    }
    const result = runSimulationStep(selectedPatient.id, stepIndex, forceViolation);
    if (!result.message) {
      if (!fhirBundle) {
        const out = compileSimulationFHIRBundle(selectedPatient, messages, toolCalls);
        setFhirBundle(out.bundle);
        out.logs.forEach(l => onLog(l));
        log('success', 'FHIR_COMPILER', 'FHIR R4 transaction bundle compiled and ready.');
        setRightTab('fhir');
      }
      return;
    }
    const nextMessages = [...messages, result.message];
    setMessages(nextMessages);
    let nextTools = [...toolCalls];
    if (result.toolCall) { nextTools.push(result.toolCall); setToolCalls(nextTools); }
    const safety = evaluateSafetyAudits(nextMessages, nextTools, safetyChecklist);
    setSafetyChecklist(safety.guidelines);
    result.logs.forEach(l => onLog(l));
    safety.logs.forEach(l => onLog(l));
    setStepIndex(s => s + 1);
  };

  const handleAutoPlay = () => {
    let step = stepIndex;
    const totalSteps = selectedPatient.id === 'pat_003' && forceViolation ? 3 : 5;
    const interval = setInterval(() => {
      if (step >= totalSteps || toolCalls.some(t => t.status === 'pending')) {
        clearInterval(interval);
        return;
      }
      handleStepForward();
      step++;
    }, 900);
  };

  const handleExecuteTool = (toolId: string) => {
    const updated = toolCalls.map(tool => {
      if (tool.id !== toolId) return tool;
      const result = selectedPatient.secretClinicalEnvelope.labs[tool.code] || 'Result within normal range.';
      const labMsg: SimulationMessage = {
        id: `lab_${toolId}`, sender: 'patient', senderName: `${selectedPatient.name} (Lab Result)`,
        message: `[${tool.vocab} ${tool.code}] ${result}`, timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, labMsg]);
      return { ...tool, status: 'completed' as const, result };
    });
    setToolCalls(updated);
    const safety = evaluateSafetyAudits(messages, updated, safetyChecklist);
    setSafetyChecklist(safety.guidelines);
    safety.logs.forEach(l => onLog(l));
    log('success', 'LAB_INTERCEPTOR', 'Lab result executed and injected into agent context.');
  };

  const handleGenerateReport = () => {
    const passed = safetyChecklist.filter(c => c.status === 'passed').length;
    const violated = safetyChecklist.filter(c => c.status === 'violated').length;
    const date = new Date().toISOString().split('T')[0];
    const content = `LUMEN CLINICAL AI SAFETY AUDIT REPORT
Generated: ${date}
═══════════════════════════════════════
Patient:   ${selectedPatient.name} (DOB: ${selectedPatient.dob})
Insurer:   ${selectedPatient.insuranceProvider}
CPT Code:  ${selectedPatient.targetProcedureCpt}
Score:     ${passed}/${safetyChecklist.length} criteria passed

SAFETY CRITERIA:
${safetyChecklist.map(c => `[${c.status.toUpperCase().padEnd(8)}] [${c.severity.toUpperCase()}] ${c.description}${c.resolutionMessage ? '\n             → ' + c.resolutionMessage : ''}`).join('\n')}

VERDICT: ${violated > 0 ? '🔴 FAILED — ' + violated + ' critical violation(s) detected' : '🟢 APPROVED — All safety guidelines satisfied'}

Lumen Safety Protocol v2.0 · Pre-Deployment Clinical AI Audit`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lumen_Audit_${selectedPatient.name.replace(/\s+/g, '_')}_${date}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    log('success', 'AGENT_ENGINE', `Audit report exported for ${selectedPatient.name}.`);
  };

  const totalSteps = selectedPatient.id === 'pat_003' && forceViolation ? 3 : 5;
  const progressPct = Math.min((stepIndex / totalSteps) * 100, 100);
  const isComplete = stepIndex >= totalSteps;

  return (
    <div>
      {/* ─── Mode Tabs ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="nav-tabs">
          <button className={`nav-tab ${mode === 'simulation' ? 'active-sim' : ''}`} onClick={() => setMode('simulation')}>
            <ClipboardList size={13} />
            Clinical Simulation
          </button>
          <button className={`nav-tab ${mode === 'redteam' ? 'active-rt' : ''}`} onClick={() => setMode('redteam')}>
            <Swords size={13} />
            Red-Team Lab
            <span className="badge">New</span>
          </button>
        </div>
      </div>

      {/* ─── RED-TEAM MODE ─── */}
      {mode === 'redteam' && (
        <RedTeamLab onLog={onLog} />
      )}

      {/* ─── SIMULATION MODE ─── */}
      {mode === 'simulation' && (
        <>
          {/* Patient Config */}
          <div className="config-card animate-in">
            <div className="config-card-header">
              <div className="config-step-label">
                <span className="step-num">1</span>
                Patient Selection &amp; Guidelines Staging
              </div>

              {/* Violation toggle */}
              <div className="violation-toggle">
                <span className="violation-label">
                  {forceViolation
                    ? <AlertTriangle size={12} style={{ color: 'var(--fg-danger)' }} />
                    : <ShieldCheck size={12} style={{ color: 'var(--fg-muted)' }} />
                  }
                  Force Safety Violation
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={forceViolation}
                    onChange={e => setForceViolation(e.target.checked)}
                  />
                  <span className="toggle-track" />
                </label>
                <span className={`violation-state ${forceViolation ? 'active' : ''}`}>
                  {forceViolation ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <div className="config-card-body">
              <div className="patient-grid">
                {mockPatients.map(patient => (
                  <button
                    key={patient.id}
                    className={`patient-card ${selectedPatient.id === patient.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <span className="patient-card-id">{patient.id}</span>
                    <span className="patient-card-name">{patient.name}</span>
                    <span className="patient-card-meta">{patient.gender}, {patient.age}y · CPT {patient.targetProcedureCpt}</span>
                    <span className="insurer-badge">{patient.insuranceProvider}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="sim-controls animate-in">
            <div className="sim-progress">
              <span className="sim-step-text">
                Step <strong>{stepIndex}</strong> / <strong>{totalSteps}</strong>
                {isComplete && <span style={{ marginLeft: 10, color: 'var(--fg-safe)', fontWeight: 800 }}> ✓ Complete</span>}
              </span>
              <div className="sim-progress-track">
                <div className="sim-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="sim-actions">
              <button className="btn btn-primary btn-sm" onClick={handleAutoPlay} disabled={isComplete}>
                <Play size={12} /> Auto Play
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleStepForward} disabled={isComplete}>
                <FastForward size={12} /> Step →
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleReset}>
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          {/* 3-Column Grid */}
          <div className="workspace-grid">
            {/* Col 1: Agent Dialogue */}
            <AgentChat messages={messages} />

            {/* Col 2: Lab Tools */}
            <LabViewer toolCalls={toolCalls} onExecuteTool={handleExecuteTool} />

            {/* Col 3: Safety + FHIR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="right-panel-tabs">
                <button
                  className={`rpanel-tab ${rightTab === 'audit' ? 'active' : ''}`}
                  onClick={() => setRightTab('audit')}
                >
                  Safety Audit
                </button>
                <button
                  className={`rpanel-tab ${rightTab === 'fhir' ? 'active' : ''}`}
                  onClick={() => setRightTab('fhir')}
                >
                  FHIR R4
                </button>
              </div>

              {rightTab === 'audit' ? (
                <PriorAuthAuditor
                  guidelines={safetyChecklist}
                  onGenerateReport={handleGenerateReport}
                  simulationStep={stepIndex}
                  totalSteps={totalSteps}
                />
              ) : (
                <FhirGraph
                  bundle={fhirBundle}
                  toolCalls={toolCalls}
                  patientName={selectedPatient.name}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
