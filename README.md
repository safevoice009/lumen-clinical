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

### 5. 📋 Telemetry Logs
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
┌─────────────────────────────────────────────────────────┐
│                    LUMEN SANDBOX                        │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ RED-TEAM     │    │ CLINICAL     │                   │
│  │ ENGINE       │───▶│ SIMULATION   │                   │
│  │ (Gemini)     │    │ MODE         │                   │
│  └──────────────┘    └──────┬───────┘                   │
│                             │                           │
│           ┌─────────────────▼──────────────────┐       │
│           │  DOCTOR AGENT (Gemini 2.0 Flash)   │       │
│           │  • Conducts clinical consultation   │       │
│           │  • Emits tool calls (LOINC/CPT)    │       │
│           │  • Exposes reasoning chain          │       │
│           └──────────────┬─────────────────────┘       │
│                          │ tool calls intercepted       │
│           ┌──────────────▼─────────────────────┐       │
│           │      TOOL INTERCEPTOR               │       │
│           │  • OrderLabTest (LOINC codes)       │       │
│           │  • OrderImaging (CPT codes)         │       │
│           │  • PrescribeMedication (RxNorm)     │       │
│           └──────────────┬─────────────────────┘       │
│                          │                             │
│           ┌──────────────▼─────────────────────┐       │
│           │  SAFETY AUDITOR AGENT (Gemini)      │       │
│           │  • Evaluates dialogue transcript    │       │
│           │  • Issues PASS/FAIL verdict         │       │
│           │  • Score: 0-100                     │       │
│           └──────────────┬─────────────────────┘       │
│                          │                             │
│           ┌──────────────▼─────────────────────┐       │
│           │  FHIR R4 BUNDLE COMPILER            │       │
│           │  • Patient resource                 │       │
│           │  • Condition (ICD-10)               │       │
│           │  • Procedure / Observation          │       │
│           └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
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
- **Angle**: Multi-agent pipeline (Doctor + Auditor + Red-Team) with real HITL and auditability

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
│   │   ├── ClinicalWorkspace.tsx   # Main workspace with mode switcher
│   │   ├── RedTeamLab.tsx          # ⚔️ Adversarial attack sandbox
│   │   ├── AgentChat.tsx           # Doctor/Patient dialogue display
│   │   ├── LabViewer.tsx           # Tool call interceptor UI
│   │   ├── PriorAuthAuditor.tsx    # Safety checklist panel
│   │   ├── FhirGraph.tsx           # FHIR bundle visualizer
│   │   └── TelemetryConsole.tsx    # Event log console
│   ├── utils/
│   │   ├── geminiClient.ts         # Gemini 2.0 Flash API wrapper
│   │   ├── redTeamEngine.ts        # Adversarial scenario generator
│   │   └── agentCore.ts            # Simulation engine + FHIR compiler
│   ├── types/clinical.ts           # All TypeScript types
│   └── data/mockData.ts            # Patient envelopes + safety guidelines
├── GEMINI_AGENT_INSTRUCTIONS.md    # AI agent build guide
├── .env.example                    # Environment setup template
└── README.md
```

---

## 🔐 Environment Variables

```bash
# .env
VITE_GEMINI_API_KEY=your_key_here   # Free at aistudio.google.com/app/apikey
```

Without the API key, Lumen falls back to **5 curated adversarial scenarios** (fully functional offline).

---

## 📜 License

MIT — Open source, built for the community.

---

**Built with** ❤️ by [Sucharith](https://trochlea.online/my-portfolio/) | Clinician × Health Tech Developer
