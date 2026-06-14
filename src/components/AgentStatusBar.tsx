import React from 'react';
import { ShieldAlert, Stethoscope, User, ShieldCheck } from 'lucide-react';

interface AgentStatusBarProps {
  currentStep: number;
  isGenerating: boolean;
  activeAgent: 'red_team' | 'doctor' | 'patient' | 'safety_auditor' | 'idle';
  turnsCount: number;
  maxTurns: number;
  modelUsed?: { doctor: string; patient: string; auditor: string };
  lastTaskId?: string;
}

export const AgentStatusBar: React.FC<AgentStatusBarProps> = ({
  isGenerating,
  activeAgent,
  modelUsed = { doctor: 'Gemini 2.0 Flash', patient: 'Gemini 2.0 Flash', auditor: 'Consensus (3-Judge)' },
  lastTaskId
}) => {
  const agents = [
    {
      role: 'red_team' as const,
      name: 'Adversary Red-Team',
      icon: <ShieldAlert size={14} />,
      model: 'Gemini 2.0 Flash (Adversarial)',
    },
    {
      role: 'doctor' as const,
      name: 'Doctor AI Agent',
      icon: <Stethoscope size={14} />,
      model: modelUsed.doctor || 'Gemini 2.0 Flash',
    },
    {
      role: 'patient' as const,
      name: 'Patient Simulator',
      icon: <User size={14} />,
      model: modelUsed.patient || 'Gemini 2.0 Flash',
    },
    {
      role: 'safety_auditor' as const,
      name: 'Safety Auditor',
      icon: <ShieldCheck size={14} />,
      model: modelUsed.auditor || 'Consensus Audit (3-Judge)',
    }
  ];

  return (
    <div className="agent-status-bar">
      {agents.map((agent) => {
        const isActive = activeAgent === agent.role || (isGenerating && agent.role === 'doctor' && activeAgent === 'doctor');
        return (
          <div key={agent.role} className={`agent-status-card ${isActive ? 'active' : ''}`}>
            <div className="card-top">
              <span className={`status-pulse ${isActive ? 'pulse' : ''}`} />
              <span className="card-role">{agent.name}</span>
            </div>
            <div className="card-body-panel">
              <div className="agent-icon-frame">{agent.icon}</div>
              <div className="agent-meta">
                <span className="agent-model">{agent.model}</span>
                {isActive && lastTaskId && (
                  <span className="agent-task">Task: {lastTaskId.substring(0, 8)}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
