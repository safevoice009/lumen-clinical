import React, { useState } from 'react';
import { TelemetryLog } from '../types/clinical';
import { Terminal, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface TelemetryConsoleProps {
  logs: TelemetryLog[];
  onClear: () => void;
}

export const TelemetryConsole: React.FC<TelemetryConsoleProps> = ({ logs, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalTokens = logs.length * 342;
  const mockCost = (totalTokens * 0.000015).toFixed(4);

  return (
    <div className="telemetry-shell">
      <div
        className="telemetry-drawer"
        style={{ height: isOpen ? 320 : 48 }}
      >
        {/* Header Toggle */}
        <button
          className="telemetry-header"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div className="telemetry-dots">
              <span className="dot-r" />
              <span className="dot-y" />
              <span className="dot-g" />
            </div>
            <div className="telemetry-title">
              <Terminal size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
              Developer Telemetry · {logs.length} events
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.3)' }}>
            {isOpen
              ? <ChevronDown size={16} />
              : <ChevronUp size={16} />
            }
          </div>
        </button>

        {/* Body */}
        {isOpen && (
          <div className="telemetry-body">
            <div className="telemetry-toolbar">
              <div className="telemetry-stats">
                <span>Logs: <strong>{logs.length}</strong></span>
                <span>Volume: <strong>{totalTokens} tokens</strong></span>
                <span>Overhead: <span className="cost">${mockCost}</span></span>
              </div>
              <button className="telemetry-clear" onClick={onClear}>
                <Trash2 size={12} />
                Clear
              </button>
            </div>

            <div className="telemetry-logs">
              {logs.length === 0 ? (
                <div className="log-empty">
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>➜</span>
                  <span>Console initialized. Awaiting pipeline telemetry...</span>
                </div>
              ) : (
                logs.map((log) => {
                  const lvl = log.level;
                  return (
                    <div key={log.id} className="log-line">
                      <span className="log-time">[{log.timestamp.split('T')[1]?.slice(0, 8)}]</span>
                      <span className={`log-comp ${lvl}`}>{log.component}</span>
                      <span className="log-msg">{log.message}</span>
                      {log.durationMs !== undefined && (
                        <span className="log-dur">({log.durationMs}ms)</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
