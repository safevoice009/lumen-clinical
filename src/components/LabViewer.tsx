import React from 'react';
import { ClinicalToolCall } from '../types/clinical';
import { FlaskConical, CheckCircle2, Clock, Zap } from 'lucide-react';

interface LabViewerProps {
  toolCalls: ClinicalToolCall[];
  onExecuteTool: (toolId: string) => void;
}

export const LabViewer: React.FC<LabViewerProps> = ({ toolCalls, onExecuteTool }) => {
  const pending   = toolCalls.filter(t => t.status === 'pending').length;
  const completed = toolCalls.filter(t => t.status === 'completed').length;

  return (
    <div className="panel panel-labs">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-label">Step 3 · EHR Diagnostics Gateway</span>
          <span className="panel-title">Lab &amp; Tool Interceptor</span>
        </div>
        {toolCalls.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {pending > 0 && (
              <span className="panel-badge" style={{ background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)', color: 'var(--fg-brand)' }}>
                <Clock size={9} /> {pending} Pending
              </span>
            )}
            {completed > 0 && (
              <span className="panel-badge panel-badge-live">
                <span className="dot" /> {completed} Done
              </span>
            )}
          </div>
        )}
      </div>

      <div className="panel-body">
        {toolCalls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FlaskConical size={20} />
            </div>
            <p className="empty-title">No tools dispatched</p>
            <p className="empty-sub">Doctor AI will order lab tests<br />as the simulation progresses</p>
          </div>
        ) : (
          <div className="tool-list">
            {toolCalls.map((tool) => (
              <div
                key={tool.id}
                className={`tool-card status-${tool.status}`}
              >
                <div className="tool-card-header">
                  <div className="tool-code">
                    <span className="tool-vocab">{tool.vocab}</span>
                    <span className="tool-vocab" style={{ color: 'var(--fg-muted)' }}>{tool.code}</span>
                  </div>
                  <span className={`tool-status ${tool.status}`}>
                    {tool.status === 'completed'
                      ? <><CheckCircle2 size={9} /> Done</>
                      : <><Clock size={9} /> Pending</>
                    }
                  </span>
                </div>

                <p className="tool-name">{tool.toolName}</p>
                <p className="tool-param">{tool.parameter}</p>

                {tool.status === 'completed' && tool.result && (
                  <div className="tool-result">
                    <span className="tool-result-label">Lab Result</span>
                    {tool.result}
                  </div>
                )}

                {tool.status === 'pending' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onExecuteTool(tool.id)}
                    style={{ marginTop: 2, alignSelf: 'flex-start' }}
                  >
                    <Zap size={11} /> Execute Lab
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
