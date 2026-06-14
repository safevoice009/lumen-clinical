import React, { useState, useEffect, useRef } from 'react';
import { TelemetryLog } from '../types/clinical';
import { ChevronUp, Trash2 } from 'lucide-react';

interface TelemetryConsoleProps {
  logs: TelemetryLog[];
  onClear: () => void;
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const TelemetryConsole: React.FC<TelemetryConsoleProps> = ({ logs, onClear }) => {
  const [open, setOpen] = useState(false);
  const [manuallyOpened, setManuallyOpened] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLogsLength = useRef(logs.length);
  const timeoutRef = useRef<any>(null);

  // Auto-dock and auto-hide logic on log activity
  useEffect(() => {
    if (logs.length > prevLogsLength.current) {
      prevLogsLength.current = logs.length;

      // Auto open if a process adds a log and the user hasn't manually closed or opened it
      if (!manuallyOpened) {
        setOpen(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Auto-hide after 3 seconds of no new logs (inactivity)
        timeoutRef.current = setTimeout(() => {
          setOpen(false);
        }, 3000);
      }
    } else {
      prevLogsLength.current = logs.length;
    }
  }, [logs, manuallyOpened]);

  // Scroll to bottom of log terminal container programmatically
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs, open]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleHeaderClick = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (open) {
      setOpen(false);
      setManuallyOpened(false);
    } else {
      setOpen(true);
      setManuallyOpened(true);
    }
  };

  const errorCount   = logs.filter(l => l.level === 'error').length;
  const warnCount    = logs.filter(l => l.level === 'warn').length;
  const successCount = logs.filter(l => l.level === 'success').length;

  return (
    <div className="telemetry-shell">
      <div
        className="telemetry-drawer"
        style={{ height: open ? '260px' : '54px' }}
      >
        {/* Header / Toggle */}
        <div className="telemetry-header" onClick={handleHeaderClick}>
          {/* macOS dots */}
          <div className="tbar-dots">
            <span className="dot-red" />
            <span className="dot-yellow" />
            <span className="dot-green" />
          </div>

          <div className="tbar-title">
            <span className="dot" />
            telemetry — lumen safety sandbox
          </div>

          <div className="tbar-actions" onClick={e => e.stopPropagation()}>
            <div className="tbar-stats">
              <span><strong>{logs.length}</strong> logs</span>
              {errorCount > 0 && <span style={{ color: 'var(--fg-danger)' }}><strong>{errorCount}</strong> err</span>}
              {warnCount > 0 && <span style={{ color: 'var(--fg-warn)' }}><strong>{warnCount}</strong> warn</span>}
              {successCount > 0 && <span style={{ color: 'var(--fg-safe)' }}><strong>{successCount}</strong> ok</span>}
            </div>
            <button className="tbar-clear" onClick={onClear} title="Clear logs">
              <Trash2 size={11} /> Clear
            </button>
          </div>

          <ChevronUp
            size={14}
            className={`tbar-chevron ${open ? 'open' : ''}`}
            style={{ marginLeft: 8, color: 'var(--fg-subtle)' }}
          />
        </div>

        {/* Log entries */}
        {open && (
          <div className="telemetry-body">
            <div className="log-entries" ref={scrollRef}>
              {logs.length === 0 && (
                <div className="log-entry" style={{ color: 'var(--fg-subtle)', fontStyle: 'italic' }}>
                  — no telemetry events yet —
                </div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="log-entry">
                  <span className="log-ts">{formatTs(log.timestamp)}</span>
                  <span className={`log-comp ${log.level}`}>{log.component}</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
