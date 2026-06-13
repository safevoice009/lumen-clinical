import React from 'react';
import { SimulationMessage } from '../types/clinical';
import { Brain, User } from 'lucide-react';

interface AgentChatProps {
  messages: SimulationMessage[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export const AgentChat: React.FC<AgentChatProps> = ({ messages }) => {
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
            {messages.map((msg) => {
              const isDoctor = msg.sender === 'doctor';
              return (
                <div
                  key={msg.id}
                  className={`chat-msg ${!isDoctor ? 'chat-msg-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`chat-avatar ${isDoctor ? 'avatar-doctor' : 'avatar-patient'}`}>
                    {isDoctor ? <Brain size={13} /> : <User size={13} />}
                  </div>

                  {/* Bubble */}
                  <div className={`chat-bubble ${isDoctor ? 'bubble-doctor' : 'bubble-patient'}`}>
                    <div className="bubble-meta">
                      <span className="bubble-name">
                        {isDoctor ? 'Clinical AI Doctor' : msg.senderName}
                      </span>
                      <span className="bubble-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="bubble-text">{msg.message}</p>

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
