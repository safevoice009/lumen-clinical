import { useState, useEffect } from 'react';
import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { TelemetryConsole } from './components/TelemetryConsole';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { TelemetryLog } from './types/clinical';
import { getActiveModelConfig, ModelConfig } from './utils/geminiClient';
import { DischargePortalView, PortalData } from './components/DischargePortalView';
import { 
  Sun, Moon, Github, ExternalLink, Cpu, ClipboardList, Swords, Scale, 
  Sparkles, FileEdit, BookOpenCheck, Trophy, BookOpen, ShieldCheck,
  Stethoscope, BarChart3, ChevronDown, Menu, X
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lumen-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const [palette, setPalette] = useState<'classic' | 'royal' | 'emerald' | 'pastel'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lumen-palette') as any) || 'classic';
    }
    return 'classic';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<ModelConfig>(getActiveModelConfig());
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  // Parse portal data from hash URL parameter if present
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#portal=')) {
        try {
          const base64 = hash.replace('#portal=', '');
          const decodedText = decodeURIComponent(escape(atob(base64)));
          const parsed = JSON.parse(decodedText);
          setPortalData(parsed);
        } catch (e) {
          console.error("Failed to parse portal payload from URL hash:", e);
        }
      } else {
        setPortalData(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [pillar, setPillar] = useState<'sandbox' | 'scribe' | 'standards'>('sandbox');
  const [mode, setMode] = useState<'simulation' | 'redteam' | 'leaderboard' | 'copilot' | 'compare' | 'research' | 'workbench' | 'cookbook'>('simulation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation Dropdown States (Claude-style)
  const [activeDropdown, setActiveDropdown] = useState<'sandbox' | 'scribe' | 'standards' | null>(null);
  const [dropdownTimeoutId, setDropdownTimeoutId] = useState<any>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutId) clearTimeout(dropdownTimeoutId);
    };
  }, [dropdownTimeoutId]);

  // Escape key closes open dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clicking outside of the dropdown closes it
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-item-container')) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleMouseEnter = (dropdown: 'sandbox' | 'scribe' | 'standards') => {
    if (dropdownTimeoutId) {
      clearTimeout(dropdownTimeoutId);
    }
    // Switch immediately if another dropdown is already active (fluid traversal)
    if (activeDropdown) {
      setActiveDropdown(dropdown);
    } else {
      const timer = setTimeout(() => {
        setActiveDropdown(dropdown);
      }, 150); // 150ms hover delay threshold
      setDropdownTimeoutId(timer);
    }
  };

  const handleMouseLeave = () => {
    if (dropdownTimeoutId) {
      clearTimeout(dropdownTimeoutId);
    }
    // Give 650ms window so cursor can travel across gaps and into the dropdown
    const timer = setTimeout(() => {
      setActiveDropdown(null);
    }, 650);
    setDropdownTimeoutId(timer);
  };

  const handlePillarButtonClick = (newPillar: 'sandbox' | 'scribe' | 'standards') => {
    if (pillar === newPillar) {
      setActiveDropdown(activeDropdown === newPillar ? null : newPillar);
      return;
    }
    handlePillarChange(newPillar);
    setActiveDropdown(newPillar);
  };

  const handleDropdownItemClick = (newPillar: 'sandbox' | 'scribe' | 'standards', newMode: any) => {
    handlePillarChange(newPillar);
    setMode(newMode);
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

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

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('lumen-palette', palette);
  }, [palette]);

  // Sync palette change event
  useEffect(() => {
    const handlePaletteChange = () => {
      const saved = (localStorage.getItem('lumen-palette') as any) || 'classic';
      setPalette(saved);
    };
    window.addEventListener('lumen_palette_changed', handlePaletteChange);
    return () => window.removeEventListener('lumen_palette_changed', handlePaletteChange);
  }, []);

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

  const handlePillarChange = (newPillar: 'sandbox' | 'scribe' | 'standards') => {
    setPillar(newPillar);
    if (newPillar === 'sandbox') {
      setMode('simulation');
    } else if (newPillar === 'scribe') {
      setMode('copilot');
    } else if (newPillar === 'standards') {
      setMode('leaderboard');
    }
  };

  if (portalData) {
    return (
      <div className="app-root" style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '20px 0', overflowY: 'auto' }}>
        <DischargePortalView 
          data={portalData} 
          onBack={() => {
            window.location.hash = '';
            setPortalData(null);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* ── Navigation Bar ── */}
      <nav className="app-nav">
        <div className="nav-inner">
          {/* Logo */}
          <div className="nav-logo">
            <div className="nav-logo-mark" aria-hidden="true">
              <svg viewBox="0 0 36 36" role="img">
                <defs>
                  <linearGradient id="lumenLogoGradient" x1="7" y1="5" x2="29" y2="31" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#65E4FF" />
                    <stop offset="0.5" stopColor="#F18B62" />
                    <stop offset="1" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <path d="M18 5.5c-5.1 0-9.25 4.15-9.25 9.25 0 6.2 8.3 15.1 8.66 15.48a.82.82 0 0 0 1.18 0c.36-.38 8.66-9.28 8.66-15.48C27.25 9.65 23.1 5.5 18 5.5Z" fill="none" stroke="url(#lumenLogoGradient)" strokeWidth="2.2" />
                <path d="M14.6 14.2c0-1.88 1.52-3.4 3.4-3.4s3.4 1.52 3.4 3.4-1.52 3.4-3.4 3.4-3.4-1.52-3.4-3.4Z" fill="url(#lumenLogoGradient)" opacity=".22" />
                <path d="M12.9 22.6h10.2M18 17.6v8.9" stroke="url(#lumenLogoGradient)" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="nav-logo-name">Lumen</span>
            <span className="nav-logo-version">v2.0</span>
          </div>

          {/* Centered Pillar Navigation (Gemini / Claude style with Dropdowns) */}
          <div id="mobile-navigation" className={`nav-center-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Sandbox Pillar */}
            <div 
              className="nav-item-container nav-item-sandbox"
              onMouseEnter={() => handleMouseEnter('sandbox')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`nav-menu-btn ${pillar === 'sandbox' ? 'active' : ''}`}
                onClick={() => handlePillarButtonClick('sandbox')}
                aria-expanded={activeDropdown === 'sandbox'}
                aria-haspopup="true"
              >
                <ShieldCheck size={16} />
                <span>Sandbox</span>
                <ChevronDown size={13} className="nav-chevron" />
              </button>
              
              <div className={`nav-dropdown sandbox-dropdown ${activeDropdown === 'sandbox' ? 'open' : ''}`}>
                <ul className="dropdown-list">
                  <li>
                    <button 
                      className={`dropdown-link-btn ${mode === 'simulation' && pillar === 'sandbox' ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick('sandbox', 'simulation')}
                    >
                      <div className="dropdown-icon-box"><ClipboardList size={14} /></div>
                      <div className="dropdown-text-box">
                        <span className="dropdown-item-title">Clinical Simulation</span>
                        <span className="dropdown-item-desc">Adversarial patient agents simulating clinical workflows</span>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-link-btn ${mode === 'redteam' && pillar === 'sandbox' ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick('sandbox', 'redteam')}
                    >
                      <div className="dropdown-icon-box"><Swords size={14} /></div>
                      <div className="dropdown-text-box">
                        <span className="dropdown-item-title">
                          Red-Team Lab
                          <span className="dropdown-badge" style={{ background: 'var(--color-redteam-bg)', color: 'var(--color-redteam)', marginLeft: '6px' }}>NEW</span>
                        </span>
                        <span className="dropdown-item-desc">Test clinical AI against safety jailbreak triggers</span>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-link-btn ${mode === 'compare' && pillar === 'sandbox' ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick('sandbox', 'compare')}
                    >
                      <div className="dropdown-icon-box"><Scale size={14} /></div>
                      <div className="dropdown-text-box">
                        <span className="dropdown-item-title">
                          Clinical Compare
                          <span className="dropdown-badge" style={{ background: 'var(--brand-subtle)', color: 'var(--brand)', marginLeft: '6px' }}>NEW</span>
                        </span>
                        <span className="dropdown-item-desc">Audit safety side-by-side across LLM gateways</span>
                      </div>
                    </button>
                  </li>
                </ul>
                <div className="dropdown-footer">
                  <span>🟢 Bridge: <strong>FHIR R4 Connected</strong></span>
                  <span>Target: <strong>Sandbox Sim</strong></span>
                </div>
              </div>
            </div>

            {/* Clinician Pillar */}
            <div 
              className="nav-item-container nav-item-scribe"
              onMouseEnter={() => handleMouseEnter('scribe')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`nav-menu-btn ${pillar === 'scribe' ? 'active' : ''}`}
                onClick={() => handlePillarButtonClick('scribe')}
                aria-expanded={activeDropdown === 'scribe'}
                aria-haspopup="true"
              >
                <Stethoscope size={16} />
                <span>Clinician</span>
                <ChevronDown size={13} className="nav-chevron" />
              </button>

              <div className={`nav-dropdown scribe-dropdown ${activeDropdown === 'scribe' ? 'open' : ''}`}>
                <ul className="dropdown-list">
                  <li>
                    <button 
                      className={`dropdown-link-btn ${mode === 'copilot' && pillar === 'scribe' ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick('scribe', 'copilot')}
                    >
                      <div className="dropdown-icon-box"><Sparkles size={14} /></div>
                      <div className="dropdown-text-box">
                        <span className="dropdown-item-title">Clinical Copilot</span>
                        <span className="dropdown-item-desc">Diagnostic suggestions and EHR scribe automation</span>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-link-btn ${mode === 'workbench' && pillar === 'scribe' ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick('scribe', 'workbench')}
                    >
                      <div className="dropdown-icon-box"><FileEdit size={14} /></div>
                      <div className="dropdown-text-box">
                        <span className="dropdown-item-title">
                          Doc Workbench
                          <span className="dropdown-badge" style={{ background: 'var(--color-redteam-bg)', color: 'var(--color-redteam)', marginLeft: '6px' }}>NEW</span>
                        </span>
                        <span className="dropdown-item-desc">Verify generated EHR note safety and guidelines</span>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-link-btn ${mode === 'research' && pillar === 'scribe' ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick('scribe', 'research')}
                    >
                      <div className="dropdown-icon-box"><BookOpenCheck size={14} /></div>
                      <div className="dropdown-text-box">
                        <span className="dropdown-item-title">
                          Deep Research
                          <span className="dropdown-badge" style={{ background: 'var(--brand-subtle)', color: 'var(--brand)', marginLeft: '6px' }}>NEW</span>
                        </span>
                        <span className="dropdown-item-desc">Synthesize agentic multi-source medical insights</span>
                      </div>
                    </button>
                  </li>
                </ul>
                <div className="dropdown-footer">
                  <span>Active Model: <strong>{activeModel.modelName}</strong></span>
                </div>
              </div>
            </div>

            {/* Standards Pillar */}
            <div 
              className="nav-item-container nav-item-standards"
              onMouseEnter={() => handleMouseEnter('standards')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`nav-menu-btn ${pillar === 'standards' ? 'active' : ''}`}
                onClick={() => handlePillarButtonClick('standards')}
                aria-expanded={activeDropdown === 'standards'}
                aria-haspopup="true"
              >
                <BarChart3 size={16} />
                <span>Standards</span>
                <ChevronDown size={13} className="nav-chevron" />
              </button>

              <div className={`nav-dropdown standards-dropdown ${activeDropdown === 'standards' ? 'open' : ''}`}>
                <ul className="dropdown-list">
                  <li>
                    <button 
                      className={`dropdown-link-btn ${mode === 'leaderboard' && pillar === 'standards' ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick('standards', 'leaderboard')}
                    >
                      <div className="dropdown-icon-box"><Trophy size={14} /></div>
                      <div className="dropdown-text-box">
                        <span className="dropdown-item-title">Safety Leaderboard</span>
                        <span className="dropdown-item-desc">Evaluate local and cloud clinical LLM safety scores</span>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-link-btn ${mode === 'cookbook' && pillar === 'standards' ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick('standards', 'cookbook')}
                    >
                      <div className="dropdown-icon-box"><BookOpen size={14} /></div>
                      <div className="dropdown-text-box">
                        <span className="dropdown-item-title">AI Cookbook</span>
                        <span className="dropdown-item-desc">Clinical prompt templates and safety rule books</span>
                      </div>
                    </button>
                  </li>
                </ul>
                <div className="dropdown-footer">
                  <span>Last evaluated: <strong>Today</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Status pills (desktop only) */}
          <div className="nav-status">
            <span className="status-pill" style={{ display: 'none' }}>
              <span className="dot" />
              <span>Sandbox</span> <span className="val">Online</span>
            </span>
            <span className="status-pill">
              <span className="dot" />
              <span>FHIR R4</span>
            </span>
            <span className="status-pill" title={`${getSourceLabel(activeModel.source)} (${activeModel.modelName})`}>
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

            <button
              className="mobile-menu-toggle"
              onClick={() => {
                setIsMobileMenuOpen(open => !open);
                setActiveDropdown(null);
              }}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      <button
        className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        aria-label="Close navigation menu"
        onClick={() => {
          setIsMobileMenuOpen(false);
          setActiveDropdown(null);
        }}
      />

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
        <ClinicalWorkspace mode={mode} onLog={handleAddLog} />
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
