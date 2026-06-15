import React from 'react';
import { SimulationMessage } from '../types/clinical';
import { Brain, User } from 'lucide-react';

interface AgentChatProps {
  messages: SimulationMessage[];
  highlightIndex?: number | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export const AgentChat: React.FC<AgentChatProps> = ({ messages, highlightIndex = null }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className="panel panel-chat">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-label">Step 2 · Autonomous Interaction</span>
          <span className="panel-title">Agentic Dialogue</span>
        </div>
        <span className="panel-badge panel-badge-live">
          <span className="dot" /> Live Sim
        </span>
      </div>

      <div className="panel-body" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Brain size={20} />
            </div>
            <p className="empty-title">Simulation not started</p>
            <p className="empty-sub">Click "Step →" or "Auto Play"<br />to begin the clinical dialogue</p>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg, idx) => {
              const isDoctor = msg.sender === 'doctor';
              const isHighlighted = idx === highlightIndex;
              return (
                <div
                  key={msg.id}
                  className={`chat-msg ${!isDoctor ? 'chat-msg-reverse' : ''}`}
                  style={isHighlighted ? {
                    border: '1px solid var(--brand)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--brand-subtle)',
                    padding: '8px',
                    boxShadow: '0 0 8px rgba(99, 102, 241, 0.15)',
                    transition: 'all 0.2s ease'
                  } : undefined}
                >
                  {/* Avatar */}
                  <div className={`chat-avatar ${isDoctor ? 'avatar-doctor' : 'avatar-patient'}`}>
                    {isDoctor ? <Brain size={13} /> : <User size={13} />}
                  </div>

                  {/* Bubble */}
                  <div className={`chat-bubble ${isDoctor ? 'bubble-doctor' : 'bubble-patient'}`}>
                    <div className="bubble-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="bubble-name">
                        {isDoctor ? 'Clinical AI Doctor' : msg.senderName}
                      </span>
                      <span 
                        style={{ 
                          fontSize: '8px', 
                          fontWeight: 700, 
                          padding: '1px 4px', 
                          borderRadius: '4px', 
                          background: isDoctor ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                          border: isDoctor ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                          color: isDoctor ? '#a78bfa' : '#34d399',
                          textTransform: 'uppercase',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      >
                        {isDoctor ? (localStorage.getItem('lumen_doctor_model') === 'biomistral' ? 'BioMistral-7B' : localStorage.getItem('lumen_doctor_model') === 'med42' ? 'Med42-8B' : localStorage.getItem('lumen_doctor_model') === 'ollama' ? 'Mistral-7B' : 'Gemini 2.0') : 'Gemini 2.0'}
                      </span>
                      <span className="bubble-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    {msg.id === 'temp_thinking' ? (
                      <div className="precision-spinner" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--fg-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span style={{ color: isDoctor ? 'var(--brand)' : 'var(--fg-safe)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="status-pulse pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDoctor ? 'var(--brand)' : 'var(--fg-safe)', display: 'inline-block' }} />
                            {isDoctor ? 'Doctor Agent is responding...' : 'Patient Simulator is responding...'}
                          </span>
                          <span style={{ color: 'var(--fg-muted)' }}>[████████░░] 1.4s</span>
                        </div>
                        <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--fg-muted)', fontSize: '10.5px' }}>
                          <div>▸ Received: {isDoctor ? `Patient symptom intake (turn ${messages.length})` : 'Doctor clinical recommendation'}</div>
                          <div>▸ Awaiting: {isDoctor ? 'clinical guidelines screen & tool calls' : 'persona behavior mapping'}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="bubble-text">{msg.message}</p>
                    )}

                    {msg.thoughtChain && (
                      <div className="reasoning-block">
                        <span className="reasoning-label">🧠 AI Reasoning</span>
                        <span className="reasoning-text">{msg.thoughtChain}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="panel-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 700 }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 700 }}>
              {messages.filter(m => m.sender === 'doctor').length} Dr · {messages.filter(m => m.sender === 'patient').length} Pt
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

