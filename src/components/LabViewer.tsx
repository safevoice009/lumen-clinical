import React from 'react';
import { ClinicalToolCall } from '../types/clinical';
import { Beaker, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';

interface LabViewerProps {
  toolCalls: ClinicalToolCall[];
  onExecuteTool: (toolId: string) => void;
}

export const LabViewer: React.FC<LabViewerProps> = ({ toolCalls, onExecuteTool }) => {
  return (
    <div className="lab-viewer panel-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '460px' }}>
      {/* Header */}
      <div className="panel-header">
        <div>
          <span className="panel-label">EHR Diagnostics Gateway</span>
          <span className="panel-title">Lab & Tool Interceptor</span>
        </div>
        <Beaker size={16} style={{ color: 'var(--brand-400)', opacity: 0.8 }} />
      </div>

      {/* Body */}
      <div className="panel-body" style={{ flex: 1 }}>
        {toolCalls.length === 0 ? (
          <div className="lab-empty">
            <div className="chat-empty-icon">🔬</div>
            <p className="chat-empty-text">No tool calls intercepted.<br />Awaiting doctor agent decisions...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
              Intercepted Tool Calls
            </span>
            {toolCalls.map((tool) => {
              const isCompleted = tool.status === 'completed';
              return (
                <div
                  key={tool.id}
                  className={`tool-card ${isCompleted ? 'completed' : 'pending'}`}
                >
                  {/* Tool meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <span className="tool-code-badge">{tool.vocab}:{tool.code}</span>
                      <span className="tool-param">{tool.parameter}</span>
                    </div>

                    {isCompleted ? (
                      <span className="tool-status-done">
                        <CheckCircle size={12} />
                        Done
                      </span>
                    ) : (
                      <button className="btn-execute" onClick={() => onExecuteTool(tool.id)}>
                        <RefreshCw size={11} className="animate-spin" />
                        Execute
                      </button>
                    )}
                  </div>

                  {/* Result or pending state */}
                  {isCompleted ? (
                    <div className="tool-result-box">
                      <span className="tool-result-label">Diagnostic Return Value</span>
                      {tool.result}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      <Loader2 size={12} style={{ opacity: 0.5, animation: 'spin 1.5s linear infinite' }} />
                      Pending execution — click Execute to supply clinical data
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="panel-footer">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Synthea/MIMIC-IV simulated sandbox
        </span>
      </div>
    </div>
  );
};
