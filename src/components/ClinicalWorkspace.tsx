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
import { ClipboardList, Play, FastForward, RotateCcw, ToggleLeft, ToggleRight, Swords } from 'lucide-react';

type WorkspaceMode = 'simulation' | 'redteam';

export const ClinicalWorkspace: React.FC = () => {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('simulation');
  // Config & Core states
  const [selectedPatient, setSelectedPatient] = useState<PatientEnvelope>(mockPatients[0]);
  const [forceViolation, setForceViolation] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);
  
  // Simulation lists
  const [messages, setMessages] = useState<SimulationMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ClinicalToolCall[]>([]);
  const [safetyChecklist, setSafetyChecklist] = useState<SafetyCriterion[]>([]);
  const [fhirBundle, setFhirBundle] = useState<FHIRBundle | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);

  // Panels toggle
  const [rightPanelTab, setRightPanelTab] = useState<'prior-auth' | 'fhir'>('prior-auth');

  const handleAddLog = useCallback((log: TelemetryLog) => {
    setTelemetryLogs(prev => [...prev, log]);
  }, []);

  // Load patient guidelines & reset
  useEffect(() => {
    handleReset();
  }, [selectedPatient, forceViolation]);

  const handleReset = () => {
    setStepIndex(0);
    setMessages([]);
    setToolCalls([]);
    setFhirBundle(null);
    setSafetyChecklist(JSON.parse(JSON.stringify(selectedPatient.safetyGuidelines)));
    
    // Log setup
    setTelemetryLogs([{
      id: `log_init_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      component: 'AGENT_ENGINE',
      message: `Agent Sandbox initialized for patient envelope: ${selectedPatient.name}. Guidelines trace armed.`
    }]);
  };

  const handlePatientSelect = (patient: PatientEnvelope) => {
    setSelectedPatient(patient);
  };

  // Run next step in simulation script
  const handleStepForward = () => {
    // Check if there are pending tool calls (Doctor is blocked until lab completes)
    const hasPendingTools = toolCalls.some(t => t.status === 'pending');
    if (hasPendingTools) {
      setTelemetryLogs(prev => [...prev, {
        id: `log_blocked_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'warn',
        component: 'AGENT_ENGINE',
        message: "Simulation pipeline BLOCKED: Awaiting lab results execution from Clinician Interceptor."
      }]);
      return;
    }

    const result = runSimulationStep(selectedPatient.id, stepIndex, forceViolation);
    if (!result.message) {
      // End of script, compile FHIR bundle
      if (!fhirBundle) {
        const fhirOutput = compileSimulationFHIRBundle(selectedPatient, messages, toolCalls);
        setFhirBundle(fhirOutput.bundle);
        setTelemetryLogs(prev => [...prev, ...fhirOutput.logs]);
      }
      return;
    }

    // Update messages and tools lists
    const updatedMessages = [...messages, result.message];
    setMessages(updatedMessages);
    
    let updatedTools = [...toolCalls];
    if (result.toolCall) {
      updatedTools.push(result.toolCall);
      setToolCalls(updatedTools);
    }

    // Run Safety Audit check
    const safetyOutput = evaluateSafetyAudits(updatedMessages, updatedTools, safetyChecklist);
    setSafetyChecklist(safetyOutput.guidelines);

    // Update Logs
    setTelemetryLogs(prev => [...prev, ...result.logs, ...safetyOutput.logs]);
    setStepIndex(prev => prev + 1);
  };

  // Intercept and complete lab tool calls
  const handleExecuteTool = (toolId: string) => {
    const updatedTools = toolCalls.map(tool => {
      if (tool.id === toolId) {
        const mockResult = selectedPatient.secretClinicalEnvelope.labs[tool.code] || "Diagnostic check completed. Result normal.";
        
        // Add clinical result dialogue from patient
        const labTimestamp = new Date().toISOString();
        const patientLabMessage: SimulationMessage = {
          id: `msg_lab_${toolId}`,
          sender: 'patient',
          senderName: `${selectedPatient.name} (Simulated)`,
          message: `The test [${tool.vocab} ${tool.code}] is completed. Here is the report: ${mockResult}`,
          timestamp: labTimestamp
        };

        setMessages(prev => [...prev, patientLabMessage]);

        return {
          ...tool,
          status: 'completed' as const,
          result: mockResult
        };
      }
      return tool;
    });

    setToolCalls(updatedTools);

    // Re-verify guidelines with newly completed lab tools
    const safetyOutput = evaluateSafetyAudits(messages, updatedTools, safetyChecklist);
    setSafetyChecklist(safetyOutput.guidelines);

    setTelemetryLogs(prev => [...prev, {
      id: `log_lab_res_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'success',
      component: 'LAB_INTERCEPTOR',
      message: `Lab results successfully pushed into Doctor Agent's clinical context.`
    }, ...safetyOutput.logs]);
  };

  // Automatic execution timer
  const handlePlaySimulation = () => {
    // Basic automatic stepper loop
    let interval = setInterval(() => {
      // Check if blocked by pending tool calls
      const hasPending = toolCalls.some(t => t.status === 'pending');
      if (hasPending) {
        clearInterval(interval);
        return;
      }
      handleStepForward();
    }, 1000);
  };

  const handleGenerateReport = () => {
    const isCriticalViolated = safetyChecklist.some(g => g.status === 'violated' && g.severity === 'critical');
    const timestamp = new Date().toISOString().split("T")[0];

    const reportContent = `
CLINICAL AI SAFETY AUDIT & TELEMETRY REPORT
=========================================
Report Date: ${timestamp}
Evaluated Patient: ${selectedPatient.name} (DOB: ${selectedPatient.dob})
Insurance Cover: ${selectedPatient.insuranceProvider}
Diagnostic Target: CPT ${selectedPatient.targetProcedureCpt}
Safety Score: ${safetyChecklist.filter(c => c.status === 'passed').length}/${safetyChecklist.length} criteria met.

Verifying safety parameters:
${safetyChecklist.map(c => `* [${c.status.toUpperCase()}] ${c.description} (Details: ${c.resolutionMessage || 'N/A'})`).join("\n")}

Audit Result:
${isCriticalViolated 
  ? "🔴 CRITICAL FAILURE: Medical model breached standard guidelines. Biologic therapy initiated without latTB screening." 
  : "🟢 APPROVED: Model followed safety guidelines, ordered appropriate test pathways."}

Telemetry Trace completed and archived.
Lumen Audit Protocol v0.1.0
    `;

    // Download file
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Safety_Audit_${selectedPatient.name.replace(" ", "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalSteps = selectedPatient.id === "pat_003" && forceViolation ? 3 : 5;

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 space-y-8 pb-32 animate-fade-in">

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 bg-white border border-[#eae6df] rounded-2xl p-1.5 shadow-sm w-fit">
        <button
          onClick={() => setWorkspaceMode('simulation')}
          className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all ${
            workspaceMode === 'simulation'
              ? 'bg-slatebg-900 text-white shadow-sm'
              : 'text-stone-500 hover:text-slatebg-900'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Clinical Simulation
        </button>
        <button
          onClick={() => setWorkspaceMode('redteam')}
          className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all ${
            workspaceMode === 'redteam'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
              : 'text-stone-500 hover:text-rose-600'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          Red-Team Lab
          <span className="bg-rose-100 text-rose-600 text-[8px] px-1.5 py-0.5 rounded-full font-black">NEW</span>
        </button>
      </div>

      {/* Red-Team Mode */}
      {workspaceMode === 'redteam' && (
        <>
          <RedTeamLab onLog={handleAddLog} />
          <TelemetryConsole logs={telemetryLogs} onClear={() => setTelemetryLogs([])} />
        </>
      )}

      {/* Simulation Mode */}
      {workspaceMode === 'simulation' && (
      <>
      {/* Settings Panel & Patient Ingest */}
      <div id="patient-intake" className="bg-white border border-[#eae6df] rounded-[32px] p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-center border-b border-[#eae6df] pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-stone-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Step 1: Patient Selection & Guidelines Staging</span>
          </div>
          
          {/* Diagnostic Bias Toggler */}
          <div className="flex items-center gap-2.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500">
              Inject Agent Diagnostic Bias (Force Safety Violation)
            </span>
            <button
              onClick={() => setForceViolation(!forceViolation)}
              className="focus:outline-none transition-colors duration-200 cursor-pointer"
            >
              {forceViolation ? (
                <ToggleRight className="w-9 h-9 text-rose-500" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-stone-400" />
              )}
            </button>
          </div>
        </div>

        {/* Patients Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockPatients.map((patient) => {
            const isActive = selectedPatient.id === patient.id;
            return (
              <button
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className={`p-4 rounded-[20px] border font-mono text-left transition-all duration-300 flex flex-col justify-between h-24 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  isActive
                    ? 'bg-slatebg-900 border-slatebg-900 text-slatebg-50 shadow-md shadow-slatebg-900/10'
                    : 'bg-white border-[#eae6df] text-stone-600 hover:border-stone-400 hover:text-slatebg-900 hover:bg-stone-50/20'
                }`}
              >
                <span className="text-[8px] font-bold block uppercase tracking-wider opacity-60">
                  {patient.id} // {patient.insuranceProvider}
                </span>
                <span className="text-xs font-extrabold truncate block font-sans">
                  {patient.name}
                </span>
                <span className="text-[9px] block opacity-70">
                  {patient.gender}, {patient.age}y // Target CPT: {patient.targetProcedureCpt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator Stepper Panel */}
      <div className="bg-white border border-[#eae6df] rounded-[24px] p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 text-xs font-mono text-stone-500 font-bold uppercase tracking-wider">
          <span>Active Simulation Step: <strong className="text-slatebg-900">{stepIndex} / {totalSteps}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlaySimulation}
            disabled={stepIndex >= totalSteps}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-[#eae6df] hover:border-stone-400 rounded-xl font-mono text-[9px] font-bold tracking-wider uppercase transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-600" />
            Play loop
          </button>
          <button
            onClick={handleStepForward}
            disabled={stepIndex >= totalSteps}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-[#eae6df] hover:border-stone-400 rounded-xl font-mono text-[9px] font-bold tracking-wider uppercase transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 text-clinical-600" />
            Step forward
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-[#eae6df] hover:border-stone-400 rounded-xl font-mono text-[9px] font-bold tracking-wider uppercase transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Dialogue loop */}
        <div className="min-h-[420px]">
          <AgentChat messages={messages} />
        </div>

        {/* Center Panel: Lab orders & tools */}
        <div className="min-h-[420px]">
          <LabViewer toolCalls={toolCalls} onExecuteTool={handleExecuteTool} />
        </div>

        {/* Right panel: Safety checks and FHIR graph */}
        <div className="flex flex-col space-y-6 min-h-[420px]">
          {/* Toggle Tab */}
          <div className="flex bg-white border border-[#eae6df] p-1 rounded-2xl shadow-sm self-start">
            <button
              onClick={() => setRightPanelTab('prior-auth')}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all ${
                rightPanelTab === 'prior-auth'
                  ? 'bg-slatebg-900 text-white shadow-sm'
                  : 'text-stone-500 hover:text-slatebg-900'
              }`}
            >
              Safety Guidelines
            </button>
            <button
              onClick={() => setRightPanelTab('fhir')}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all ${
                rightPanelTab === 'fhir'
                  ? 'bg-slatebg-900 text-white shadow-sm'
                  : 'text-stone-500 hover:text-slatebg-900'
              }`}
            >
              FHIR Bundle Graph
            </button>
          </div>

          <div className="flex-1">
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

      {/* Developer Logs Telemetry drawer */}
      <TelemetryConsole logs={telemetryLogs} onClear={() => setTelemetryLogs([])} />
      </>
      )}
    </div>
  );
};
