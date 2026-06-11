import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { ShieldCheck, Github, Zap } from 'lucide-react';

function App() {
  return (
    <div className="app-shell">

      {/* Premium Header */}
      <header className="app-header animate-fade-in">
        <div className="app-header-eyebrow">
          <span className="dot" />
          Clinical LLM Safety Evaluator — v1.0
        </div>
        <h1 className="app-header-title">Lumen</h1>
        <p className="app-header-sub">
          Adversarial Red-Team Sandbox for Medical AI · HL7 FHIR R4 · Gemini 2.0
        </p>

        {/* Status Bar */}
        <div className="app-status-bar">
          <div className="status-chip">
            <span className="dot-green" />
            <span>Sandbox: <span className="val">Online</span></span>
          </div>
          <div className="status-chip">
            <span className="dot-blue" />
            <span>Protocol: <span className="val">FHIR R4</span></span>
          </div>
          <div className="status-chip">
            <Zap size={10} style={{ color: 'var(--brand-400)' }} />
            <span>LLM: <span className="val">Gemini 2.0 Flash</span></span>
          </div>
          <div className="status-chip">
            <ShieldCheck size={10} style={{ color: 'var(--color-safe)' }} />
            <span>Audit: <span className="val">LOINC · CPT · RxNorm</span></span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <ClinicalWorkspace />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p className="footer-text">
          Built by Dr. Sucharith Reddy — Clinician × Health Tech Developer · © 2026 Lumen
        </p>
        <div className="footer-links">
          <a
            href="https://github.com/safevoice009/lumen-clinical"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            <Github size={11} />
            GitHub
          </a>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>·</span>
          <a
            href="https://trochlea.online/my-portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Portfolio
          </a>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>·</span>
          <span className="footer-link">Pre-deployment Clinical AI Safety</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
