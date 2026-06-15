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
  isHitlEscalated?: boolean;
}

export const AgentStatusBar: React.FC<AgentStatusBarProps> = ({
  isGenerating,
  activeAgent,
  modelUsed = { doctor: 'Gemini 2.0 Flash', patient: 'Gemini 2.0 Flash', auditor: 'Consensus (3-Judge)' },
  lastTaskId,
  isHitlEscalated
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
    <div className="agent-status-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
        {agents.map((agent) => {
          const isActive = activeAgent === agent.role || (isGenerating && agent.role === 'doctor' && activeAgent === 'doctor');
          return (
            <div key={agent.role} className={`agent-status-card ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
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
      {isHitlEscalated && (
        <div 
          className="hitl-escalated-badge" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid #10B981', 
            borderRadius: '8px', 
            padding: '10px 14px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#10B981',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
            whiteSpace: 'nowrap',
            height: 'fit-content'
          }}
        >
          <ShieldAlert size={14} />
          <span>HITL Attested</span>
        </div>
      )}
    </div>
  );
};
