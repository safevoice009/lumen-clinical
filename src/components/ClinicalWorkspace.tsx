import React, { useState, useEffect, useCallback } from 'react';
import { mockPatients } from '../data/mockData';
import { PatientEnvelope, SimulationMessage, ClinicalToolCall, SafetyCriterion, TelemetryLog, FHIRBundle } from '../types/clinical';
import { runSimulationStep, evaluateSafetyAudits, compileSimulationFHIRBundle } from '../utils/agentCore';
import { AgentChat } from './AgentChat';
import { LabViewer } from './LabViewer';
import { PriorAuthAuditor } from './PriorAuthAuditor';
import { FhirGraph } from './FhirGraph';
import { TelemetryConsole } from './TelemetryConsole';
import RedTeamLab from './RedTeamLab';
import { ClipboardList, Play, FastForward, RotateCcw, Swords, AlertTriangle, Shield } from 'lucide-react';

type WorkspaceMode = 'simulation' | 'redteam';

export const ClinicalWorkspace: React.FC = () => {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('simulation');
  const [selectedPatient, setSelectedPatient] = useState<PatientEnvelope>(mockPatients[0]);
  const [forceViolation, setForceViolation] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const [messages, setMessages] = useState<SimulationMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ClinicalToolCall[]>([]);
  const [safetyChecklist, setSafetyChecklist] = useState<SafetyCriterion[]>([]);
  const [fhirBundle, setFhirBundle] = useState<FHIRBundle | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<'prior-auth' | 'fhir'>('prior-auth');

  const handleAddLog = useCallback((log: TelemetryLog) => {
    setTelemetryLogs(prev => [...prev, log]);
  }, []);

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
    setTelemetryLogs([{
      id: `log_init_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      component: 'AGENT_ENGINE',
      message: `Sandbox initialized for ${selectedPatient.name}. Safety guidelines armed.`,
    }]);
  };

  const handleStepForward = () => {
    const hasPendingTools = toolCalls.some(t => t.status === 'pending');
    if (hasPendingTools) {
      setTelemetryLogs(prev => [...prev, {
        id: `log_blocked_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'warn',
        component: 'AGENT_ENGINE',
        message: 'Pipeline BLOCKED: Awaiting lab results execution.',
      }]);
      return;
    }

    const result = runSimulationStep(selectedPatient.id, stepIndex, forceViolation);
    if (!result.message) {
      if (!fhirBundle) {
        const fhirOutput = compileSimulationFHIRBundle(selectedPatient, messages, toolCalls);
        setFhirBundle(fhirOutput.bundle);
        setTelemetryLogs(prev => [...prev, ...fhirOutput.logs]);
      }
      return;
    }

    const updatedMessages = [...messages, result.message];
    setMessages(updatedMessages);

    let updatedTools = [...toolCalls];
    if (result.toolCall) {
      updatedTools.push(result.toolCall);
      setToolCalls(updatedTools);
    }

    const safetyOutput = evaluateSafetyAudits(updatedMessages, updatedTools, safetyChecklist);
    setSafetyChecklist(safetyOutput.guidelines);
    setTelemetryLogs(prev => [...prev, ...result.logs, ...safetyOutput.logs]);
    setStepIndex(prev => prev + 1);
  };

  const handleExecuteTool = (toolId: string) => {
    const updatedTools = toolCalls.map(tool => {
      if (tool.id === toolId) {
        const mockResult = selectedPatient.secretClinicalEnvelope.labs[tool.code] || 'Diagnostic check completed. Result normal.';
        const patientLabMessage: SimulationMessage = {
          id: `msg_lab_${toolId}`,
          sender: 'patient',
          senderName: `${selectedPatient.name} (Simulated)`,
          message: `Test [${tool.vocab} ${tool.code}] completed. Result: ${mockResult}`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, patientLabMessage]);
        return { ...tool, status: 'completed' as const, result: mockResult };
      }
      return tool;
    });
    setToolCalls(updatedTools);
    const safetyOutput = evaluateSafetyAudits(messages, updatedTools, safetyChecklist);
    setSafetyChecklist(safetyOutput.guidelines);
    setTelemetryLogs(prev => [...prev, {
      id: `log_lab_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'success',
      component: 'LAB_INTERCEPTOR',
      message: 'Lab results pushed into Doctor Agent clinical context.',
    }, ...safetyOutput.logs]);
  };

  const handlePlaySimulation = () => {
    const interval = setInterval(() => {
      const hasPending = toolCalls.some(t => t.status === 'pending');
      if (hasPending) { clearInterval(interval); return; }
      handleStepForward();
    }, 1000);
  };

  const handleGenerateReport = () => {
    const isCriticalViolated = safetyChecklist.some(g => g.status === 'violated' && g.severity === 'critical');
    const timestamp = new Date().toISOString().split('T')[0];
    const reportContent = `CLINICAL AI SAFETY AUDIT REPORT
=================================
Date: ${timestamp}
Patient: ${selectedPatient.name} (DOB: ${selectedPatient.dob})
Insurance: ${selectedPatient.insuranceProvider}
Target CPT: ${selectedPatient.targetProcedureCpt}
Safety Score: ${safetyChecklist.filter(c => c.status === 'passed').length}/${safetyChecklist.length}

Criteria:
${safetyChecklist.map(c => `[${c.status.toUpperCase()}] ${c.description} — ${c.resolutionMessage || 'N/A'}`).join('\n')}

Result: ${isCriticalViolated
  ? '🔴 CRITICAL FAILURE — Safety guidelines breached'
  : '🟢 APPROVED — Model followed safety guidelines'}

Lumen Safety Protocol v1.0`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lumen_Audit_${selectedPatient.name.replace(' ', '_')}_${timestamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalSteps = selectedPatient.id === 'pat_003' && forceViolation ? 3 : 5;

  return (
    <div className="workspace animate-fade-in">

      {/* ─── Mode Switcher ─── */}
      <div className="mode-switcher">
        <button
          className={`mode-btn ${workspaceMode === 'simulation' ? 'active-sim' : ''}`}
          onClick={() => setWorkspaceMode('simulation')}
        >
          <ClipboardList size={13} />
          Clinical Simulation
        </button>
        <button
          className={`mode-btn ${workspaceMode === 'redteam' ? 'active-rt' : ''}`}
          onClick={() => setWorkspaceMode('redteam')}
        >
          <Swords size={13} />
          Red-Team Lab
          <span className="new-badge">NEW</span>
        </button>
      </div>

      {/* ─── RED-TEAM MODE ─── */}
      {workspaceMode === 'redteam' && (
        <>
          <RedTeamLab onLog={handleAddLog} />
          <TelemetryConsole logs={telemetryLogs} onClear={() => setTelemetryLogs([])} />
        </>
      )}

      {/* ─── SIMULATION MODE ─── */}
      {workspaceMode === 'simulation' && (
        <>
          {/* Patient Intake */}
          <div className="patient-intake">
            <div className="patient-intake-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Step 1 — Patient Selection & Guidelines Staging
                </span>
              </div>

              {/* Bias Toggle */}
              <div className="bias-toggle-group">
                <span className="bias-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {forceViolation
                    ? <AlertTriangle size={11} style={{ color: '#f87171' }} />
                    : <Shield size={11} style={{ color: 'var(--text-muted)' }} />
                  }
                  Force Safety Violation
                </span>
                <button
                  onClick={() => setForceViolation(!forceViolation)}
                  className={`toggle-track ${forceViolation ? 'on' : ''}`}
                >
                  <div className="toggle-thumb" />
                </button>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: forceViolation ? '#f87171' : 'var(--text-muted)', fontWeight: 700 }}>
                  {forceViolation ? 'BIAS ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Patient Cards */}
            <div className="patient-grid">
              {mockPatients.map((patient) => {
                const isActive = selectedPatient.id === patient.id;
                return (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`patient-btn ${isActive ? 'selected' : ''}`}
                  >
                    <span className="patient-btn-id">{patient.id} · {patient.insuranceProvider}</span>
                    <span className="patient-btn-name">{patient.name}</span>
                    <span className="patient-btn-meta">{patient.gender}, {patient.age}y · CPT {patient.targetProcedureCpt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Bar */}
          <div className="stepper-bar">
            <div className="stepper-info">
              Simulation step: <strong>{stepIndex}</strong> / <strong>{totalSteps}</strong>
              {stepIndex >= totalSteps && (
                <span style={{ marginLeft: 12, color: 'var(--color-safe)', fontWeight: 800 }}>
                  ✓ Complete — FHIR bundle compiled
                </span>
              )}
            </div>
            <div className="stepper-btns">
              <button className="btn btn-primary" onClick={handlePlaySimulation} disabled={stepIndex >= totalSteps}>
                <Play size={12} /> Auto Play
              </button>
              <button className="btn btn-primary" onClick={handleStepForward} disabled={stepIndex >= totalSteps}>
                <FastForward size={12} /> Step
              </button>
              <button className="btn btn-danger" onClick={handleReset}>
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          {/* Main 3-Column Grid */}
          <div className="workspace-grid">
            {/* Col 1: Dialogue */}
            <AgentChat messages={messages} />

            {/* Col 2: Lab Tools */}
            <LabViewer toolCalls={toolCalls} onExecuteTool={handleExecuteTool} />

            {/* Col 3: Safety + FHIR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Tab switcher */}
              <div className="right-tab-group">
                <button
                  className={`right-tab-btn ${rightPanelTab === 'prior-auth' ? 'active' : ''}`}
                  onClick={() => setRightPanelTab('prior-auth')}
                >
                  Safety Audit
                </button>
                <button
                  className={`right-tab-btn ${rightPanelTab === 'fhir' ? 'active' : ''}`}
                  onClick={() => setRightPanelTab('fhir')}
                >
                  FHIR Graph
                </button>
              </div>

              <div style={{ flex: 1 }}>
                {rightPanelTab === 'prior-auth' ? (
                  <PriorAuthAuditor
                    guidelines={safetyChecklist}
                    onGenerateReport={handleGenerateReport}
                    simulationStep={stepIndex}
                    totalSteps={totalSteps}
                  />
                ) : (
                  <FhirGraph bundle={fhirBundle} toolCalls={toolCalls} patientName={selectedPatient.name} />
                )}
              </div>
            </div>
          </div>

          <TelemetryConsole logs={telemetryLogs} onClear={() => setTelemetryLogs([])} />
        </>
      )}
    </div>
  );
};
