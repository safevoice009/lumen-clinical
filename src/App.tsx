import { useState, useEffect } from 'react';
import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { TelemetryConsole } from './components/TelemetryConsole';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { TelemetryLog } from './types/clinical';
import { getActiveModelConfig, ModelConfig } from './utils/geminiClient';
import { Sun, Moon, Github, ExternalLink, Cpu } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lumen-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<ModelConfig>(getActiveModelConfig());

  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([{
    id: 'boot_001',
    timestamp: new Date().toISOString(),
    level: 'info',
    component: 'AGENT_ENGINE',
    message: 'Lumen Clinical Safety Sandbox v2.0 initialized. FHIR R bridge online.',
  }]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    localStorage.setItem('lumen-theme', theme);
  }, [theme]);

  // Listen to configuration change events to synchronize settings console logs
  useEffect(() => {
    const handleConfigChange = (e: Event) => {
      const config = (e as CustomEvent).detail as ModelConfig;
      setActiveModel(config);
      handleAddLog({
        id: `config_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'AGENT_ENGINE',
        message: `Gateway configuration changed. Source: ${config.source.toUpperCase()}, Model: ${config.modelName}, Endpoint: ${config.endpoint}`,
      });
    };
    window.addEventListener('lumen_model_config_changed', handleConfigChange);
    return () => window.removeEventListener('lumen_model_config_changed', handleConfigChange);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleAddLog = (log: TelemetryLog) => {
    setTelemetryLogs(prev => [...prev, log]);
  };

  const handleModalLog = (level: any, component: any, message: string) => {
    handleAddLog({
      id: `modal_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: (level === 'warning' ? 'warn' : level) as TelemetryLog['level'],
      component: (component === 'GATEWAY' || component === 'DIAGNOSTICS' ? 'AGENT_ENGINE' : component) as TelemetryLog['component'],
      message,
    });
  };

  const getSourceLabel = (src: string) => {
    if (src === 'gemini') return 'Gemini';
    if (src === 'openvino') return 'OpenVINO';
    if (src === 'ollama') return 'Ollama';
    return 'Custom';
  };

  return (
    <div className="app-root">
      {/* ── Navigation Bar ── */}
      <nav className="app-nav">
        <div className="nav-inner">
          {/* Logo */}
          <div className="nav-logo">
            <div className="nav-logo-mark">🩺</div>
            <span className="nav-logo-name">Lumen</span>
            <span className="nav-logo-version">v2.0</span>
          </div>

          {/* Status pills (desktop only) */}
          <div className="nav-status" style={{ marginLeft: 'auto' }}>
            <span className="status-pill" style={{ display: 'none' }}>
              <span className="dot" />
              <span>Sandbox</span> <span className="val">Online</span>
            </span>
            <span className="status-pill">
              <span className="dot" />
              <span>FHIR R4</span>
            </span>
            <span className="status-pill">
              ⚡ <span className="val">{getSourceLabel(activeModel.source)} ({activeModel.modelName})</span>
            </span>

            {/* Model settings button */}
            <button
              className="theme-toggle"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Clinical AI Model Settings"
              title="Clinical AI Model Settings"
            >
              <Cpu size={15} />
            </button>

            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* GitHub link */}
            <a
              href="https://github.com/safevoice009/lumen-clinical"
              target="_blank"
              rel="noopener noreferrer"
              className="theme-toggle"
              title="View on GitHub"
            >
              <Github size={15} />
            </a>
          </div>
        </div>
      </nav>

      <ModelSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onLog={handleModalLog}
      />


      {/* ── Hero ── */}
      <header className="app-hero animate-in">
        <div className="hero-eyebrow">
          <span className="dot" />
          Clinical LLM Safety Evaluator
        </div>
        <h1 className="hero-title">
          Pre-Deployment <span className="accent">Safety</span> Audit
          <br />for Medical AI
        </h1>
        <p className="hero-subtitle">
          Adversarial red-team sandbox that tests clinical AI before it touches real patients.
          FHIR R4 · LOINC · RxNorm · CPT · Gemini 2.0 Flash
        </p>
      </header>

      {/* ── Workspace (handles its own mode switching) ── */}
      <main className="workspace slide-up">
        <ClinicalWorkspace onLog={handleAddLog} />
      </main>

      {/* ── Footer ── */}
      <footer className="app-footer">
        <div className="footer-inner">
          <span className="footer-copy">
            © 2025 Lumen Clinical · Built by a clinician, powered by Gemini 2.0
          </span>
          <div className="footer-links">
            <a
              href="https://github.com/safevoice009/lumen-clinical"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <Github size={11} /> GitHub
            </a>
            <a
              href="https://lumen-clinical.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <ExternalLink size={11} /> Live Demo
            </a>
          </div>
        </div>
      </footer>

      {/* ── Telemetry Console (pinned bottom) ── */}
      <TelemetryConsole logs={telemetryLogs} onClear={() => setTelemetryLogs([])} />
    </div>
  );
}
