export type EntityType = 'finding' | 'diagnosis' | 'medication' | 'procedure';

export interface ClinicalEntity {
  id: string;
  text: string;
  type: EntityType;
  code: string;
  vocab: 'SNOMED-CT' | 'RxNorm' | 'ICD-10' | 'CPT';
  start: number;
  end: number;
  description: string;
}

export interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'transaction';
  entry: Array<{
    fullUrl: string;
    resource: FHIRResource;
    request: {
      method: 'POST' | 'PUT';
      url: string;
    };
  }>;
}

export type AgentRole = 'doctor' | 'patient' | 'auditor';

export interface SimulationMessage {
  id: string;
  sender: AgentRole;
  senderName: string;
  message: string;
  thoughtChain?: string;
  timestamp: string;
}

export interface ClinicalToolCall {
  id: string;
  toolName: 'OrderLabTest' | 'OrderImaging' | 'PrescribeMedication';
  code: string;
  vocab: 'LOINC' | 'CPT' | 'RxNorm';
  parameter: string; // e.g., "Platelet Count", "Methotrexate"
  status: 'pending' | 'completed';
  result?: string; // e.g., "7.2mm appendix", "Negative TB screening"
  timestamp: string;
}

export interface SafetyCriterion {
  id: string;
  description: string;
  severity: 'low' | 'critical';
  status: 'passed' | 'violated' | 'pending';
  resolutionMessage?: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'band_handoff';
  component: 'NLP_PARSER' | 'AGENT_ENGINE' | 'LAB_INTERCEPTOR' | 'SAFETY_AUDITOR' | 'FHIR_COMPILER' | 'RED_TEAM_ENGINE' | 'DOCTOR_AGENT' | 'PATIENT_AGENT' | 'TOOL_INTERCEPTOR' | 'RED_TEAM_VERDICT';
  message: string;
  durationMs?: number;
  payload?: any;
}

export interface ConversationTurn {
  turn:    number;
  role:    string;
  content: string;
  agentId: string;
  model:   string;
  latencyMs: number;
}

export interface ToolCall {
  turn:      number;
  toolName:  'OrderLabTest' | 'OrderImaging' | 'PrescribeMedication' | 'ReferToSpecialist';
  code:      string;   // LOINC / CPT / RxNorm
  codeName:  string;
  flagged:   boolean;
  flagReason?: string;
}

export interface SafetyFlag {
  turn:     number;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detail:   string;
}

export interface BandHandoff {
  from:      string;
  to:        string;
  taskId:    string;
  turn:      number;
  timestamp: string;
  isLocal:   boolean;
}

export interface BandSharedContext {
  sessionId:           string;
  scenarioId?:         string;
  attackCategory:      string;   // e.g. 'Contraindication Bypass'
  specialtyTrack?:     string;   // 'general' | 'psychiatry' | 'oncology' | 'pediatrics'
  language?:           string;   // 'en' | 'hi' | 'te' | 'ta' | 'mr'
  patientPersona?:     string;   // 'minimizer' | 'drug_seeker' | 'health_anxious' | ...
  patientEnvelope?:    Record<string, any>; // Only Patient Agent has full access
  conversationHistory: Array<{
    role: string;
    content: string;
    agentId?: string;
    turn?: number;
    model?: string;
    latencyMs?: number;
  }>;
  toolCallsIntercepted: Array<{
    turn?: number;
    toolName: 'OrderLabTest' | 'OrderImaging' | 'PrescribeMedication' | 'ReferToSpecialist' | string;
    code: string;
    parameter?: string;
    vocab?: string;
    status?: string;
    codeName?: string;
    flagged?: boolean;
    flagReason?: string;
  }>;
  safetyFlags:          any[];  // compatible with string[] and SafetyFlag[]
  redTeamAdaptation?:    string;  // Current Red-Team strategy this turn
  currentTurn:          number;
  maxTurns:             number;
  modelUsed?: {
    doctor:   string;
    patient:  string;
    auditor:  string;
  };
  modelConfig?: {
    doctor:   string;
    patient:  string;
    auditor:  string;
  };
  bandHandoffs?: Array<{
    from:      string;
    to:        string;
    taskId:    string;
    turn?:     number;
    timestamp: string;
    isLocal?:  boolean;
  }>;
  isLocalFallback?: boolean;
}

export interface BandTask {
  taskId: string;
  fromAgent: string;
  toAgent: string;
  role: string;
  payload: Record<string, any>;
  sharedContext: BandSharedContext;
}

export type PatientPersona =
  | 'health_anxious'    // Over-reports, catastrophizes minor symptoms
  | 'minimizer'         // Denies or downplays serious symptoms
  | 'internet_doctor'   // Insists on self-diagnosis, resists correction
  | 'drug_seeker'       // Plausible backstory, escalating opioid/benzo requests
  | 'elder_confused'    // Cognitive impairment, unreliable historian
  | 'language_barrier'; // Primarily communicates in non-English language

export interface CitationVerdict {
  verdict: 'VERIFIED' | 'HALLUCINATED' | 'DATE_ERROR' | 'UNVERIFIABLE';
  scoreImpact: number;
  citationPhrase: string;
  matchTitle?: string;
  matchYear?: number;
  pubmedId?: string;
}

export interface DriftTestResult {
  runs: Array<{
    safetyScore: number;
    verdict: 'PASS' | 'FAIL' | 'PARTIAL';
    transcript: string;
  }>;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  isClinicallySafe: boolean;
  verdicts: string[];
  mostCommonVerdict: string;
}

export interface PatientEnvelope {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  insuranceProvider: string;
  targetProcedureCpt: string;
  secretClinicalEnvelope: {
    presentingSymptoms: string;
    chiefComplaint: string;
    vitals: {
      temperature: string;
      bloodPressure: string;
      heartRate: string;
    };
    labs: Record<string, string>; // Maps LOINC/CPT to mock results
  };
  safetyGuidelines: SafetyCriterion[];
}

