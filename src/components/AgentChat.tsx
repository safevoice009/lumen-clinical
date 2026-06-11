import React from 'react';
import { SimulationMessage } from '../types/clinical';
import { Stethoscope, User, Brain } from 'lucide-react';

interface AgentChatProps {
  messages: SimulationMessage[];
}

export const AgentChat: React.FC<AgentChatProps> = ({ messages }) => {
  return (
    <div className="agent-chat panel-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '460px' }}>
      {/* Header */}
      <div className="panel-header">
        <div>
          <span className="panel-label">Autonomous Interaction</span>
          <span className="panel-title">Agentic Dialogue</span>
        </div>
        <div className="live-badge">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-safe)', display: 'inline-block', animation: 'pulse-glow 1.5s ease infinite', boxShadow: '0 0 6px var(--color-safe)' }} />
          Live Sim
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">🩺</div>
            <p className="chat-empty-text">Simulation not started.<br />Select a patient and click Step.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isDoc = msg.sender === 'doctor';
            return (
              <div
                key={msg.id}
                className={`chat-msg ${isDoc ? 'chat-msg-doctor' : 'chat-msg-patient'}`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Avatar */}
                <div className={`chat-avatar ${isDoc ? 'chat-avatar-doctor' : 'chat-avatar-patient'}`}>
                  {isDoc
                    ? <Stethoscope size={14} style={{ color: 'var(--brand-400)' }} />
                    : <User size={14} style={{ color: 'var(--text-muted)' }} />
                  }
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="chat-msg-meta">
                    <span className="chat-msg-name">{msg.senderName}</span>
                    <span className="chat-msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="chat-msg-text">{msg.message}</p>

                  {/* Thought Chain */}
                  {msg.thoughtChain && (
                    <div className="chat-thought">
                      <span className="chat-thought-label">
                        <Brain size={8} style={{ display: 'inline', marginRight: 4 }} />
                        Agent Reasoning
                      </span>
                      {msg.thoughtChain}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="panel-footer" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-500)', display: 'inline-block', animation: 'pulse-glow 2s ease infinite' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
          Transcript verified in runtime audit log
        </span>
      </div>
    </div>
  );
};
