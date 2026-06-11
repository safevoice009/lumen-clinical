import { useState, useEffect } from 'react';
import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { TelemetryConsole } from './components/TelemetryConsole';
import { TelemetryLog } from './types/clinical';
import { Sun, Moon, Github, ExternalLink } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lumen-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([{
    id: 'boot_001',
    timestamp: new Date().toISOString(),
    level: 'info',
    component: 'AGENT_ENGINE',
    message: 'Lumen Clinical Safety Sandbox v2.0 initialized. FHIR R4 bridge online.',
  }]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    localStorage.setItem('lumen-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleAddLog = (log: TelemetryLog) => {
    setTelemetryLogs(prev => [...prev, log]);
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
            <span className="status-pill">⚡ <span className="val">Gemini 2.0</span></span>

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
