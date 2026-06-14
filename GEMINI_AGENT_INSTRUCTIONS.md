# 🧠 LUMEN ODYSSEUS — Clinical AI Workspace & Safety Sandbox

> **ARCHITECTURAL BLUEPRINT & FUTURE REFERENCE GUIDE**
> 
> *Lumen Odysseus* is a privacy-focused, local-first Clinical AI Workstation and Safety Evaluation Sandbox designed by a clinician, for clinicians. It combines a unified clinical workspace (Scribe, Copilot, Deep Research) with a rigorous adversarial safety evaluator (Red-Teaming Sandbox, multi-model Clinical Compare, Safety Leaderboard).

---

## 📅 HACKATHON SUBMISSION & DEADLINES (2026)

### 1. Lablab.ai "Band of Agents" Hackathon
- **Submission Deadline:** **June 19, 2026** (11:59 PM UTC / rolling timezone validation)
- **Core Angle:** "Lumen Odysseus — A Privacy-First, Local-First Multi-Agent Clinical Workstation and Pre-Deployment Safety Auditor."
- **Focus:** Demonstrating multi-agent collaboration (Doctor Agent, Patient Agent, Red-Team Adversary Agent, Safety Auditor Agent) using local Ollama/OpenVINO and cloud Gemini endpoints.

### 2. DoraHacks Bio & Health Global Grants / Watson Code Fest 2026
- **Submission Timeline:** Rolling submissions under the Dora Grant DAO; Watson Code Fest healthcare track active.
- **Core Angle:** "Open-Source Clinical LLM Red-Teaming Infrastructure & Regional API Interoperability."
- **Focus:** Standard-compliant FHIR R4 transaction bundles, LOINC/RxNorm coding, and global integration schemas (ABDM, NHS, Mayo Clinic).

---

## 🏆 THE LUMEN ODYSSEUS STRATEGY (How We Outpower the Competition)

Lumen Odysseus addresses critical limitations in existing clinical AI evaluation frameworks:

| Feature / Dimension | MedBench (and MedAgentBench) | Lattice Health AI | Lumen Odysseus (Our Strategy) |
|---|---|---|---|
| **Evaluation Timing** | Static post-hoc benchmarks. | Post-deployment monitoring in hospital. | **Pre-deployment proactive testing** & live workflow audit. |
| **Testing Methodology** | QA dataset evaluation. | Passive monitoring of model drift & bias. | **Dynamic adversarial Red-Teaming** with dynamic clinical traps. |
| **Privacy Footprint** | Cloud API heavy. | Cloud-based hospital integrations. | **Local-First, Self-Hosted (Odysseus-inspired)** privacy-first architecture. |
| **Workflow Integration** | None (pure diagnostic metrics). | Reporting dashboard for administrators. | **Unified Clinical Scribe, Doc Workbench, Copilot, & Deep Research**. |
| **Interoperability** | Basic FHIR virtual EHRs. | Imaging/imaging metadata focus. | **Full HL7 FHIR R4 Transaction Bundles** mapped to RxNorm/LOINC/CPT. |

### Why This Strategy Wins:
1. **Dynamic vs. Static:** Rather than testing if a model knows a fact, we test if a model can *maintain clinical safety* when under pressure or being actively misled by a simulated patient.
2. **Local-First Privacy:** Clinicians cannot upload sensitive patient data to third-party clouds freely. Lumen Odysseus' local-first architecture (Ollama/OpenVINO) ensures clinical compliance.
3. **Preventative Oversight:** We catch safety violations *before* the model is ever deployed, avoiding patient harm and legal liability.

---

## 🌍 REGION-WISE MEDICAL API INTEGRATION DIRECTORY

Lumen Odysseus includes an integration directory (`src/utils/regionalApis.ts`) mapped to regional healthcare standards. The Clinical Deep Research agent queries these directories to contextualize research and diagnostics:

### 1. India: Ayushman Bharat Digital Mission (ABDM) Sandbox
- **ABHA (Ayushman Bharat Health Account):** Creating and verifying standard patient identity tokens.
- **HIE-CM (Health Information Exchange & Consent Manager):** Consent-driven access control for sharing health data.
- **Registries:** Health Professionals Registry (HPR) and Health Facility Registry (HFR) validation.
- *ABDM Endpoint:* `https://sandbox.abdm.gov.in/v1/`

### 2. United States: Mayo Clinic & NIH NLM
- **Mayo Clinic Platform Cohort Discovery:** Querying de-identified patient cohorts to validate research.
- **NIH NLM RxNorm, LOINC, and SNOMED CT:** Standardized vocabularies for mapping medications, labs, and clinical terms.
- **OpenFDA:** Extracting real-time drug adverse event profiles, recall notices, and labeling constraints.
- *NIH Endpoint:* `https://rxnav.nlm.nih.gov/REST/`

### 3. United Kingdom: NHS England Developer Hub
- **GP Connect:** Interoperable FHIR access to structured General Practitioner EHR records.
- **Personal Demographics Service (PDS):** National demographic search.
- **e-Referral Service (e-RS):** Programmatic booking and clinical referrals.
- *NHS Endpoint:* `https://fhir.gpconnect.nhs.uk/fhir/`

### 4. Japan: PMDA & J-Stage
- **PMDA (Pharmaceuticals and Medical Devices Agency):** Programmatic drug approval records, warning box alerts, and adverse reaction statistics.
- **J-Stage (Japan Science and Technology Agency):** Bibliographic research search for local medical literature.
- *PMDA Endpoint:* `https://www.pmda.go.jp/api/`

### 5. China: NHC & Traditional Chinese Medicine Ontology
- **NHC EHR Standard Mappings:** Mappings to national electronic health record parameters and classification standards.
- **TCM Ontology Databases:** Correlating standard ICD-10 codes with Traditional Chinese Medicine pattern classifications and herbal formulations.
- *NHC Endpoint:* `https://api.nhc.gov.cn/v2/`

---

## 🛠️ OPEN-SOURCE MEDICAL REPOSITORIES TO LEVERAGE

To accelerate development and prevent reinventing core services, Lumen Odysseus references and integrates with:

1. **OHDSI Atlas & OMOP Common Data Model (CDM):** Mappings for standardizing clinical database architectures and extracting research cohorts.
2. **MedAgentBench:** Architectural guidelines for structuring medical agent actions inside virtual clinical systems.
3. **PyHealth:** A deep learning toolkit for clinical predictive modeling, ideal for analyzing clinical risk and checking safety guidelines.
4. **MedSpacy / ClinicalBERT:** Clinical Natural Language Processing (NLP) toolkits for mapping clinical dictations to standard entities.
5. **HAPI FHIR / FHIR.js:** Interactive validation rules to ensure all transaction bundles exported by the Doc Workbench are fully compliant.
6. **Ollama:** A local model coordinator facilitating the execution of open-source clinical models (BioMistral, Meditron, Llama-3-Med) local-first.

---

## 📊 THE SYSTEM ARCHITECTURE

Lumen Odysseus is organized into three major functional pillars:

```
                          [ LUMEN ODYSSEUS WORKSPACE ]
                                       |
       +-------------------------------+-------------------------------+
       |                               |                               |
[ 🛡️ SANDBOX PILLAR ]        [ 🩺 CLINICIAN PILLAR ]       [ 🏆 STANDARDS PILLAR ]
  - Patient Simulation        - Clinical Copilot            - Safety Leaderboard
  - Red-Team Attack Lab       - Doc Workbench (SOAP)        - AI Cookbook (Prompts)
  - Model Compare Sandbox     - Deep Research Agent
```

### 🛡️ Pillar 1: Sandbox
- **Clinical Simulation:** A Doctor AI Agent (Gemini/Local) conducts a live consultation with a simulated Patient Agent (driven by mock cases: Appendicitis, Cardiac Congestion, Biologics).
- **Red-Team Lab:** Generates adversarial patient inputs designed to trick the Doctor AI into skipping guidelines (e.g. prescribing methotrexate to a pregnant patient).
- **Clinical Compare:** Evaluates response safety and outputs a side-by-side audit of two models (e.g. Gemini-2.0-Flash vs. a local model).

### 🩺 Pillar 2: Clinician
- **Clinical Copilot:** Unified NLP dictation compiler. Generates standard SOAP notes and FHIR bundles.
- **Doc Workbench:** Interactive medical scribe editor. Checks documentation against safety checklists (Stanford NOHARM).
- **Deep Research:** Region-aware literature and protocol synthesizer that connects simulated searches to global health APIs.

### 🏆 Pillar 3: Standards
- **Safety Leaderboard:** Displays performance grades (A to F), safety score trends, and audit summaries of various LLM models.
- **AI Cookbook:** Curated directory of clinical system prompts, safety guidelines, and instruction sets.

---

## 🏁 DEPLOYMENT CHECKLIST

- [x] Wire Real LLM API via `executeModelRequest` in `src/utils/geminiClient.ts`
- [x] Create Global APIs and Registries directory `src/utils/regionalApis.ts`
- [x] Build Region Selector and API simulation in `src/components/ClinicalDeepResearch.tsx`
- [ ] Verify TypeScript compiles and build is clean (`npm run build`)
- [ ] Set environment variables in Vercel (`VITE_GEMINI_API_KEY`)
- [ ] Push to GitHub and verify production auto-deployment

---

*“Lumen Odysseus: Empowering doctors to deploy clinical AI safely, privacy-first.”*
