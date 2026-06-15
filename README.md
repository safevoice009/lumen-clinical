# 🩺 Lumen — Clinical LLM Safety Evaluator & Adversarial Red-Team Sandbox

> **The open-source security scanner for medical AI.** Built by a clinician, for the era where AI enters the clinic.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-lumen--clinical.vercel.app-blue?style=for-the-badge)](https://lumen-clinical.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-safevoice009%2Flumen--clinical-black?style=for-the-badge&logo=github)](https://github.com/safevoice009/lumen-clinical)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![FHIR R4](https://img.shields.io/badge/FHIR-R4%20Compliant-orange?style=for-the-badge)](https://hl7.org/fhir/R4/)
[![Gemini 2.0](https://img.shields.io/badge/Powered%20by-Gemini%202.0%20Flash-purple?style=for-the-badge)](https://deepmind.google/technologies/gemini/)

---

## ❌ The Problem Nobody Talks About

Medical AI is entering hospitals faster than anyone can evaluate it.

Before an AI model touches a single patient, nobody is systematically asking:
- **Will it skip TB screening before prescribing biologics?**
- **Will it send a woman with atypical MI home with antacids?**
- **Will it hallucinate a safe drug dose for a patient with renal failure?**

Lattice Health (YC S26) monitors medical imaging AI *after* it's deployed.  
**Lumen evaluates clinical LLMs *before* they ever touch a patient.**

These are two different problems. Lattice Health is the post-market surveillance system.  
**Lumen is the pre-deployment clinical safety certification lab.**

---

## ✅ What Lumen Does

Lumen is an **agentic red-teaming sandbox** for clinical AI — like a penetration testing tool, but for medical LLMs.

### 1. 🤖 Live Clinical Simulation
A real **Doctor AI Agent** (Gemini 2.0 Flash) conducts a clinical consultation with a simulated patient. Every decision is logged, coded in LOINC/CPT/RxNorm, and evaluated in real-time against clinical safety criteria.

### 2. ⚔️ Red-Team Attack Lab — THE UNIQUE FEATURE
An adversarial engine generates clinical scenarios specifically designed to expose dangerous AI failure modes:

| Attack Category | What It Tests | Real Risk If Failed |
|---|---|---|
| **Contraindication Bypass** | Hidden patient factors making treatment dangerous | Fetal death, organ failure |
| **Safety Screen Skip** | Skipping mandatory pre-treatment screening | TB reactivation, sepsis |
| **Dosing Hallucination** | Wrong drug dose for patient's organ function | Acute kidney injury, death |
| **Emergency Misdirection** | Life-threatening conditions mimicking benign ones | Missed STEMI, cardiac death |
| **Step Therapy Bypass** | Jumping to high-risk treatments without first-line | Immunosuppression without diagnosis |

After 3 turns of dialogue, the **Safety Auditor Agent** (second Gemini instance) issues a `PASS / PARTIAL / FAIL` verdict with a clinical reasoning explanation and safety score (0-100).

### 3. 📊 Real-Time Safety Audit
Every tool call (lab orders, imaging orders, prescriptions) is intercepted and checked against clinical safety guidelines. Violations are flagged in real-time with severity grading.

### 4. 🏥 FHIR R4 Export
Completed simulation sessions compile into **HL7 FHIR R4 transaction bundles** — the standard format required by US CMS regulations for interoperability. Download and validate against any FHIR server.

### 5. 🌍 Global/Regional Medical API Directory
Lumen features built-in directory routing mappings for standard registries and APIs across multiple jurisdictions:
- **India:** Ayushman Bharat Digital Mission (ABDM) Sandbox (ABHA ID, HIE-CM Consent, registries).
- **USA:** Mayo Clinic Platform API, NIH NLM (RxNorm, LOINC, SNOMED CT), and OpenFDA.
- **UK:** NHS England Developer portal GP Connect.
- **Japan:** PMDA drug reviews & J-Stage bibliographies.
- **China:** NHC EHR vocabularies & Traditional Chinese Medicine (TCM) ontology query models.

### 6. 📂 Local-First Workstation Library (Odysseus-Inspired)
Drawing design inspiration from PewDiePie's *Odysseus* local-first AI workstation:
- **AI Draft Generator:** Select a patient case and document type (Prior-Auth Appeal, Specialist Referral, Discharge instructions) to generate complete documents from scratch.
- **Workspace EMR Database:** Save audited clinical notes locally in the workspace database. Load, delete, and export records completely air-gapped using local browser storage.

### 7. 📋 Telemetry Logs
Every agent action is logged with timestamps and component labels — providing the audit trail that FDA's 2025 AI guidance explicitly calls for.

---

## 🆚 How Lumen Differs From Everything Else

| | **Lattice Health (YC S26)** | **Giskard / DeepEval** | **AgentClinic (Research)** | **Lumen** |
|---|---|---|---|---|
| **Stage** | Post-deployment | Pre-deployment | Research only | Pre-deployment |
| **Domain** | Medical imaging only | Generic LLMs | Generic medicine | All clinical specialties |
| **Adversarial** | ❌ | Partial | ❌ | ✅ Full red-team engine |
| **FHIR export** | ❌ | ❌ | ❌ | ✅ FHIR R4 |
| **Coded terminology** | ❌ | ❌ | ❌ | ✅ LOINC/CPT/RxNorm |
| **Clinician-built** | ✅ (radiology) | ❌ | ❌ | ✅ (general medicine) |
| **Live LLM eval** | ❌ | ✅ | ❌ | ✅ Gemini 2.0 Flash |
| **Open source** | ❌ | Partial | ✅ | ✅ MIT |

---

## 🚀 Quick Start

```bash
git clone https://github.com/safevoice009/lumen-clinical
cd lumen-clinical
cp .env.example .env
# Edit .env — add your Gemini API key (free at https://aistudio.google.com/app/apikey)
npm install
npm run dev
```

**Live at**: http://localhost:5173

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    LUMEN ODYSSEUS SANDBOX                          │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │               BAND COORDINATION LAYER                     │    │
│  │   Agent Registry · Task Dispatch · Shared Context Store   │    │
│  └──────────┬──────────────────────┬──────────────────────┬──┘    │
│             │                      │                      │       │
│  ┌──────────▼───┐        ┌─────────▼──────┐    ┌─────────▼────┐  │
│  │  RED-TEAM    │        │  PATIENT       │    │  SAFETY      │  │
│  │  ADVERSARY   │        │  AGENT         │    │  AUDITOR     │  │
│  │  (Adaptive)  │        │  (Ollama/      │    │  AGENT       │  │
│  │  (Gemini)    │        │   Gemini)      │    │  (3-judge    │  │
│  └──────────┬───┘        └─────────┬──────┘    │   consensus) │  │
│             │  attack_scenario      │  patient_response  └─────────┬────┘
│             ▼                      ▼                      │       │
│  ┌───────────────────────────────────────────────────────┐ │      │
│  │              DOCTOR AI AGENT                          │ │      │
│  │  (Gemini 2.0 Flash OR Ollama local model)            │ │      │
│  │  · Conducts consultation · Emits LOINC/CPT tools    │─┘      │
│  │  · Multilingual support · Band context aware         │        │
│  └────────────────────────────┬──────────────────────────┘        │
│                               │  tool_calls_intercepted           │
│  ┌────────────────────────────▼──────────────────────────────┐    │
│  │  TOOL INTERCEPTOR + DISCLAIMER BURIAL DETECTOR            │    │
│  └────────────────────────────┬──────────────────────────────┘    │
│                               │  audit_trigger (via Band)         │
│  ┌────────────────────────────▼──────────────────────────────┐    │
│  │  MULTI-JUDGE SAFETY AUDIT (3 parallel judges)             │    │
│  │  Score consensus → PASS / PARTIAL / FAIL / INDETERMINATE  │    │
│  └────────────────────────────┬──────────────────────────────┘    │
│                               │                                   │
│  ┌────────────────────────────▼──────────────────────────────┐    │
│  │  OUTPUTS                                                  │    │
│  │  · FHIR R4 Bundle (HAPI-validated)                        │    │
│  │  · FDA SaMD Compliance Report                             │    │
│  │  · Benchmark Radar Chart                                  │    │
│  │  · Session Replay + Diff                                  │    │
│  └───────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Hackathon Submission Targets

### DoraHacks Bio & Health Global Grants
- **Category**: Open-Source Clinical AI Safety Infrastructure
- **Prize**: $10,000–$50,000
- **Angle**: We're building the FDA-required pre-deployment evaluation framework for clinical AI

### Lablab.ai Agentic AI Hackathons
- **Category**: Healthcare + Agentic AI Pipelines
- **Prize**: $5,000–$15,000 + enterprise incubation
- **Angle**: Multi-agent pipeline (Doctor + Auditor + Red-Team + Patient) orchestrated via Band Protocol coordination bus.

---

## 🩻 Why A Clinician Built This

> "I've seen AI get clinical decisions wrong — not because the model was dumb, but because nobody tested the edge cases that only a clinician would recognize. A patient with renal failure asking for Ketorolac. A diabetic woman with epigastric 'indigestion' that's actually a heart attack. These aren't AI hallucinations — they're blind spots that no developer without clinical training would think to test for. That's why Lumen exists."
>
> — **Sucharith** | Clinician → Health Tech Developer  
> Portfolio: [trochlea.online/my-portfolio](https://trochlea.online/my-portfolio/)

---

## 📁 Project Structure

```
lumen-clinical/
├── src/
│   ├── components/
│   │   ├── ClinicalWorkspace.tsx   # Main workspace with mode switcher [UPDATED]
│   │   ├── RedTeamLab.tsx          # ⚔️ Adversarial attack sandbox
│   │   ├── AgentChat.tsx           # Doctor/Patient dialogue display [UPDATED]
│   │   ├── LabViewer.tsx           # Tool call interceptor UI
│   │   ├── PriorAuthAuditor.tsx    # Safety checklist panel (3-judge consensus) [UPDATED]
│   │   ├── FhirGraph.tsx           # FHIR bundle visualizer & server validator [UPDATED]
│   │   ├── TelemetryConsole.tsx    # Event log console with Band handoffs [UPDATED]
│   │   ├── BenchmarkMode.tsx       # 📊 SVG Radar Chart comparison bench [NEW]
│   │   ├── FDARegulatoryReport.tsx # 📋 FDA SaMD scorecard exporter [NEW]
│   │   ├── AgentStatusBar.tsx      # 🟢 Live agent role status bar (Doctor, Patient, Red-team) [NEW]
│   │   ├── CascadeTrace.tsx        # ⛓️ Vertical timeline displaying cascading failure paths [NEW]
│   │   ├── CounterfactualPanel.tsx # ⚖️ Renders original vs corrected clinical paths [NEW]
│   │   ├── DriftTestPanel.tsx      # 📉 Consistency analyzer (calculates mean & stdDev) [NEW]
│   │   ├── HITLOverride.tsx        # ✏️ Human-in-the-loop manual override dialog [NEW]
│   │   ├── CommandPalette.tsx      # ⌘K Command palette overlay supporting fuzzy-search [NEW]
│   │   └── SpectatorDashboard.tsx  # 📡 Real-time read-only spectator cockpit for judges [NEW]
│   ├── utils/
│   │   ├── geminiClient.ts         # Gemini 2.0 Flash API wrapper (adaptive adversary) [UPDATED]
│   │   ├── redTeamEngine.ts        # Adversarial scenario generator (Disclaimer Burial) [UPDATED]
│   │   ├── agentCore.ts            # Multi-agent simulation engine & consensus audit [UPDATED]
│   │   ├── regionalApis.ts         # Global/Regional medical API schemas & ABDM sandbox [UPDATED]
│   │   ├── bandClient.ts           # Band protocol agentic task handoffs wrapper [NEW]
│   │   ├── ollamaClient.ts         # Local Ollama client wrapper [NEW]
│   │   ├── patientAgent.ts         # Autonomous Patient Simulator with dynamic personas [NEW]
│   │   ├── driftAnalysis.ts        # Drift calculation engine across repeated runs [NEW]
│   │   ├── citationChecker.ts      # PubMed real-time citation hallucination lookup [NEW]
│   │   ├── openFdaRedTeam.ts       # OpenFDA active drug interaction scenario builder [NEW]
│   │   ├── syntheaParser.ts        # SMART-on-FHIR Synthea HL7 bundle parsing logic [NEW]
│   │   └── spectatorMode.ts        # SSE ntfy.sh broadcast integration helper [NEW]
│   ├── types/clinical.ts           # All TypeScript types (BandTask, BandSharedContext) [UPDATED]
│   ├── data/mockData.ts            # Patient envelopes + specialty guidelines (psych/onc/ped) [UPDATED]
│   ├── data/scenarioTranslations.ts# Multilingual translations (Hindi, Telugu, Tamil, Marathi) [NEW]
│   └── data/communityScenarios.ts  # 50 scenarios scenario library (built-in + slots) [NEW]
├── GEMINI_AGENT_INSTRUCTIONS.md    # AI agent build guide
├── .env.example                    # Environment setup template
└── README.md
```

---

## 🔐 Environment Variables

```bash
# .env
VITE_GEMINI_API_KEY=your_gemini_key_here    # Free at aistudio.google.com/app/apikey
VITE_BAND_API_KEY=your_band_api_key_here    # Band API key (obtain from band.ai)
VITE_BAND_API_BASE=https://api.band.ai/v1   # Band API base URL
VITE_OLLAMA_BASE=http://localhost:11434      # Local Ollama base (optional)
```

Without the API key, Lumen falls back to **5 curated adversarial scenarios** (fully functional offline).

---

## 🤝 How Band Coordinates Our 4 Agents

| Step | From Agent | → To Agent | Band Task Payload |
|------|-----------|-----------|-------------------|
| 1 | 🔴 Red-Team Adversary | 🩺 Doctor Agent | `{attack_scenario, patient_persona}` |
| 2 | 🩺 Doctor Agent | 👤 Patient Agent | `{doctor_response, tool_calls_emitted}` |
| 3 | 👤 Patient Agent | 🩺 Doctor Agent | `{patient_response, language}` |
| 4 | 🩺 Doctor Agent | 🔍 Safety Auditor | `{full_transcript, intercepted_tools, safety_flags}` |
| 5 | 🔍 Safety Auditor | 🩺 Doctor Agent | `{verdict, score, cascade_analysis}` |

Every handoff carries the full `BandSharedContext` — visible in the TelemetryConsole.

## 🔑 Partner Technologies

- **Band** — Agent coordination bus (promo BANDHACK26)
- **AI/ML API** — Safety Auditor inference (multi-model, unified endpoint)  
- **Featherless AI** — Doctor Agent open-source model inference (BioMistral-7B, Meditron-7B)
- **OpenFDA API** — Ground-truth drug interaction scenario generation (no key required)
- **PubMed E-utilities** — Citation hallucination detection (no key required)
- **HAPI FHIR Public Server** — FHIR R4 bundle validation

---

## 📜 License

MIT — Open source, built for the community.

---

**Built with** ❤️ by [Sucharith](https://trochlea.online/my-portfolio/) | Clinician × Health Tech Developer
