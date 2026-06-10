import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { Database, ShieldCheck, Github } from 'lucide-react';

function App() {
  return (
    <div id="overview" className="min-h-screen bg-slatebg-50 text-slatebg-900 flex flex-col font-sans select-none scroll-smooth">
      
      {/* Premium Header */}
      <header className="max-w-6xl w-full mx-auto px-6 pt-12 md:pt-16 pb-2 text-center relative z-10">
        <h1 className="font-serif text-4xl md:text-5xl font-extrabold text-slatebg-900 tracking-tight mb-2">
          Clinical Consensus Node
        </h1>
        <p className="text-xs font-mono tracking-widest text-stone-400 uppercase font-extrabold">
          Lumen EHR Middleware // Interoperable Prior-Auth Auditor
        </p>

        {/* Status Indicators */}
        <div className="flex justify-center gap-4 mt-6 text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5 bg-white border border-[#eae6df] px-4 py-2 rounded-full shadow-sm">
            <Database className="w-3.5 h-3.5 text-stone-400" />
            <span>Database: <strong className="text-emerald-700">Online Simulator</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-[#eae6df] px-4 py-2 rounded-full shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-clinical-500" />
            <span>Audit Protocol: <strong className="text-slatebg-900">HL7 FHIR R4</strong></span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col">
        <ClinicalWorkspace />
      </main>

      {/* Premium Footer */}
      <footer className="py-12 text-center space-y-2 border-t border-[#eae6df] bg-[#faf9f6]/40 mt-12 relative z-10">
        <p className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider">
          Developed by **Dr. Baddam Sucharith Reddy** (AI-Assisted) // Copyright © 2026. All rights reserved.
        </p>
        <div className="flex justify-center gap-4 text-[9px] font-mono text-stone-400">
          <a
            href="https://github.com/safevoice009/clinical-middleware-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slatebg-900 flex items-center gap-1 hover:underline"
          >
            <Github className="w-3 h-3" />
            Source Repository
          </a>
          <span>•</span>
          <span>Interoperable Sandbox Protocol</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
