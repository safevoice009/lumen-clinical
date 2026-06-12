import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Play, Cpu, ShieldCheck, ClipboardList } from 'lucide-react';
import { ModelConfig, getActiveModelConfig, saveModelConfig, verifyModelConnection } from '../utils/geminiClient';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLog?: (level: 'info' | 'success' | 'warning' | 'error', component: string, message: string) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({ isOpen, onClose, onLog }) => {
  const [config, setConfig] = useState<ModelConfig>(getActiveModelConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'failed'; message: string }>({
    status: 'idle',
    message: '',
  });

  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setConfig(getActiveModelConfig());
      setTestResult({ status: 'idle', message: '' });
      try {
        const stored = localStorage.getItem('lumen_session_history');
        if (stored) setHistory(JSON.parse(stored));
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePreset = (preset: 'openvino' | 'ollama' | 'gemini' | 'openai') => {
    if (onLog) {
      onLog('info', 'GATEWAY', `Loading settings preset for: ${preset.toUpperCase()}`);
    }
    if (preset === 'openvino') {
      setConfig({
        source: 'openvino',
        endpoint: 'http://127.0.0.1:8000',
        apiKey: '',
        modelName: 'qwen',
      });
    } else if (preset === 'ollama') {
      setConfig({
        source: 'ollama',
        endpoint: 'http://localhost:11434',
        apiKey: '',
        modelName: 'mistral',
      });
    } else if (preset === 'gemini') {
      setConfig({
        source: 'gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        apiKey: '',
        modelName: 'gemini-2.0-flash',
      });
    } else if (preset === 'openai') {
      setConfig({
        source: 'custom',
        endpoint: 'https://api.openai.com/v1',
        apiKey: '',
        modelName: 'gpt-4o-mini',
      });
    }
    setTestResult({ status: 'idle', message: '' });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult({ status: 'idle', message: '' });
    if (onLog) {
      onLog('info', 'DIAGNOSTICS', `Initiating connection diagnostics to ${config.source.toUpperCase()} endpoint...`);
    }

    const success = await verifyModelConnection(config);
    setTesting(false);

    if (success) {
      setTestResult({
        status: 'success',
        message: 'Diagnostics completed: Connection established successfully!',
      });
      if (onLog) {
        onLog('success', 'DIAGNOSTICS', `✓ Connection verified for provider ${config.source.toUpperCase()} (${config.modelName}).`);
      }
    } else {
      setTestResult({
        status: 'failed',
        message: 'Diagnostics failed: Unable to reach endpoint. Verify host status or CORS setup.',
      });
      if (onLog) {
        onLog('error', 'DIAGNOSTICS', `✗ Diagnostics failed for ${config.source.toUpperCase()} endpoint: ${config.endpoint}`);
      }
    }
  };

  const handleSave = () => {
    saveModelConfig(config);
    if (onLog) {
      onLog('success', 'GATEWAY', `Gateway bound to local model server (${config.source.toUpperCase()}) on model "${config.modelName}".`);
    }
    // Dispatch custom event to notify other modules
    window.dispatchEvent(new CustomEvent('lumen_model_config_changed', { detail: config }));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="settings-modal modal-content animate-slide-up">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-container">
            <Cpu className="modal-title-icon" />
            <div>
              <h3 className="modal-title">Clinical AI Model settings</h3>
              <p className="modal-subtitle">Configure cloud APIs or local model servers for red-teaming</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Presets Panel */}
        <div className="settings-section">
          <label className="section-label">Select Model Presets</label>
          <div className="presets-grid">
            <button 
              className={`preset-btn ${config.source === 'openvino' ? 'active' : ''}`}
              onClick={() => handlePreset('openvino')}
            >
              <span className="preset-source">Local Host</span>
              <strong className="preset-name">Intel OpenVINO</strong>
              <span className="preset-url">127.0.0.1:8000</span>
            </button>
            <button 
              className={`preset-btn ${config.source === 'ollama' ? 'active' : ''}`}
              onClick={() => handlePreset('ollama')}
            >
              <span className="preset-source">Local Host</span>
              <strong className="preset-name">Ollama Engine</strong>
              <span className="preset-url">localhost:11434</span>
            </button>
            <button 
              className={`preset-btn ${config.source === 'gemini' ? 'active' : ''}`}
              onClick={() => handlePreset('gemini')}
            >
              <span className="preset-source">Cloud API</span>
              <strong className="preset-name">Google Gemini 2.0</strong>
              <span className="preset-url">AI Studio (Default)</span>
            </button>
            <button 
              className={`preset-btn ${config.source === 'custom' ? 'active' : ''}`}
              onClick={() => handlePreset('openai')}
            >
              <span className="preset-source">Cloud API</span>
              <strong className="preset-name">OpenAI GPT-4o</strong>
              <span className="preset-url">api.openai.com</span>
            </button>
          </div>
        </div>

        {/* Dynamic Input Fields */}
        <div className="settings-form">
          <div className="form-group-row">
            <div className="input-group">
              <label htmlFor="source-select">AI Provider Source</label>
              <select 
                id="source-select" 
                value={config.source}
                onChange={e => setConfig({ ...config, source: e.target.value as any })}
              >
                <option value="gemini">Google Gemini AI</option>
                <option value="ollama">Ollama Local API</option>
                <option value="openvino">Intel OpenVINO Model Server</option>
                <option value="custom">Custom OpenAI Compatible</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="model-name-input">Model Name / Identifier</label>
              <input 
                id="model-name-input"
                type="text" 
                placeholder="e.g. gemini-2.0-flash or llama-3-8b"
                value={config.modelName}
                onChange={e => setConfig({ ...config, modelName: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="endpoint-url-input">Server Endpoint URL</label>
            <input 
              id="endpoint-url-input"
              type="text" 
              placeholder="e.g. https://generativelanguage.googleapis.com..."
              value={config.endpoint}
              onChange={e => setConfig({ ...config, endpoint: e.target.value })}
            />
          </div>

          {config.source !== 'openvino' && config.source !== 'ollama' && (
            <div className="input-group">
              <label htmlFor="api-key-input">Authorization API Key</label>
              <input 
                id="api-key-input"
                type="password" 
                placeholder="Enter API Key passcode..."
                value={config.apiKey}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Diagnostics & Connection Test Status */}
        <div className="diagnostics-panel">
          <div className="diagnostics-header">
            <ShieldCheck className="diagnostics-icon" />
            <span>Connection Diagnostics Console</span>
          </div>
          <div className="diagnostics-body">
            {testing ? (
              <div className="diagnostics-status-line processing">
                <span className="spinner-dots" />
                <span>Pinging LLM server endpoint &amp; validating CORS headers...</span>
              </div>
            ) : testResult.status === 'success' ? (
              <div className="diagnostics-status-line success animate-fade-in">
                <CheckCircle size={15} />
                <span>{testResult.message}</span>
              </div>
            ) : testResult.status === 'failed' ? (
              <div className="diagnostics-status-line failed animate-fade-in">
                <AlertTriangle size={15} />
                <span>{testResult.message}</span>
              </div>
            ) : (
              <div className="diagnostics-status-line idle">
                <span>Awaiting connection test routines...</span>
              </div>
            )}
          </div>
        </div>

        {/* Session Audit History Archive */}
        <div className="diagnostics-panel" style={{ marginTop: '16px' }}>
          <div className="diagnostics-header" style={{ borderColor: 'var(--border-default)' }}>
            <ClipboardList className="diagnostics-icon" size={14} />
            <span>Session Audit History Archive ({history.length} Saved)</span>
          </div>
          <div className="diagnostics-body" style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px' }}>
            {history.length === 0 ? (
              <span style={{ fontSize: '11px', color: 'var(--fg-muted)', display: 'block', textAlign: 'center', padding: '10px 0' }}>
                No completed audits in the history log. Complete a simulation or workbench scan to record history.
              </span>
            ) : (
              history.map((h: any) => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '6px 10px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>{h.patientName}</span>
                    <span style={{ fontSize: '10px', color: 'var(--fg-muted)' }}>{h.diagnosis} · {h.timestamp}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: h.safetyScore.includes('violated') || (h.safetyScore.includes('/') && parseInt(h.safetyScore.split('/')[0]) < parseInt(h.safetyScore.split('/')[1])) ? 'var(--fg-danger)' : 'var(--fg-safe)', fontWeight: 800 }}>
                      {h.safetyScore}
                    </span>
                    <a href={h.portalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ padding: '3px 8px', fontSize: '10px', background: 'var(--bg-card)', borderColor: 'var(--border-default)', textDecoration: 'none', color: 'var(--fg-secondary)' }}>
                      Open Pass
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="modal-actions">
          <button 
            type="button" 
            className={`btn btn-secondary ${testing ? 'disabled' : ''}`}
            onClick={handleTestConnection}
            disabled={testing}
          >
            <Play size={12} />
            Test Connection
          </button>
          <div className="right-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save &amp; Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
