import { BandSharedContext } from '../types/clinical';

const BAND_BASE = (import.meta as any).env?.VITE_BAND_API_BASE ?? 'https://api.band.ai/v1';
const BAND_KEY  = (import.meta as any).env?.VITE_BAND_API_KEY  ?? '';

export type AgentRole =
  | 'red_team_adversary'
  | 'doctor_agent'
  | 'patient_agent'
  | 'safety_auditor';

// ─── Agent Registry ───────────────────────────────────────────────────────────
const agentIds: Record<AgentRole, string> = {
  red_team_adversary: '',
  doctor_agent:       '',
  patient_agent:      '',
  safety_auditor:     '',
};

export async function initBandSession(sessionId: string): Promise<void> {
  const agentDefs: Array<{role: AgentRole; name: string; capabilities: string[]}> = [
    {
      role: 'red_team_adversary',
      name: 'Lumen Red-Team Adversary',
      capabilities: ['adversarial_scenario_generation', 'adaptive_attack_strategy', 'clinical_trap_design'],
    },
    {
      role: 'doctor_agent',
      name: 'Lumen Doctor Agent',
      capabilities: ['clinical_consultation', 'loinc_lab_ordering', 'cpt_imaging', 'rxnorm_prescribing', 'fhir_r4'],
    },
    {
      role: 'patient_agent',
      name: 'Lumen Patient Simulator',
      capabilities: ['patient_persona_adherence', 'multilingual_response', 'information_withholding'],
    },
    {
      role: 'safety_auditor',
      name: 'Lumen Safety Auditor',
      capabilities: ['clinical_safety_evaluation', 'fda_samd_scoring', 'verdict_issuance', 'cascade_analysis'],
    },
  ];

  for (const def of agentDefs) {
    try {
      const res = await fetch(`${BAND_BASE}/agents/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${BAND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...def, sessionId, framework: 'lumen-clinical-v3' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      agentIds[def.role] = data.agentId;
    } catch (err) {
      // Local fallback — still functions, logs as LOCAL in telemetry
      agentIds[def.role] = `local::${def.role}::${sessionId.slice(0, 8)}`;
      console.warn(`[Band] ${def.role} registered locally:`, err);
    }
  }
}

export async function dispatchBandTask(
  from:    AgentRole,
  to:      AgentRole,
  payload: Record<string, unknown>,
  ctx:     BandSharedContext,
): Promise<{ taskId: string; isLocal: boolean }> {
  const body = {
    fromAgent:     agentIds[from],
    toAgent:       agentIds[to],
    payload,
    sharedContext: ctx,
  };

  try {
    const res = await fetch(`${BAND_BASE}/tasks/dispatch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${BAND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!ctx.bandHandoffs) {
      ctx.bandHandoffs = [];
    }
    ctx.bandHandoffs.push({
      from, to, turn: ctx.currentTurn,
      taskId: data.taskId,
      timestamp: new Date().toISOString(),
      isLocal: false,
    });
    return { taskId: data.taskId, isLocal: false };
  } catch {
    const taskId = `local::${from}→${to}::t${ctx.currentTurn}::${Date.now()}`;
    if (!ctx.bandHandoffs) {
      ctx.bandHandoffs = [];
    }
    ctx.bandHandoffs.push({
      from, to, turn: ctx.currentTurn, taskId,
      timestamp: new Date().toISOString(),
      isLocal: true,
    });
    return { taskId, isLocal: true };
  }
}

export async function syncBandContext(
  sessionId: string,
  ctx: Partial<BandSharedContext>,
): Promise<void> {
  try {
    await fetch(`${BAND_BASE}/context/${sessionId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${BAND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx),
    });
  } catch {
    // Context lives locally — Band sync is best-effort only
  }
}

export function getBandAgentId(role: AgentRole): string {
  return agentIds[role];
}

// ─── Legacy compatibility functions to prevent compilation breakages ───────────
export async function registerAgentWithBand(agentName: string, role: string): Promise<string> {
  try {
    const res = await fetch(`${BAND_BASE}/agents/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${BAND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: agentName, role, capabilities: ['clinical_simulation'] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.agentId;
  } catch {
    return `local-${agentName}-${Date.now()}`;
  }
}

export async function dispatchTaskToBand(task: any): Promise<any> {
  try {
    const res = await fetch(`${BAND_BASE}/tasks/dispatch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${BAND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { ...task, taskId: `fallback-${Date.now()}` };
  }
}

export async function updateBandSharedContext(sessionId: string, ctx: any): Promise<void> {
  await syncBandContext(sessionId, ctx);
}

export function makeBandHandoffLog(task: any, isFallback: boolean, _component: string): any {
  const cleanName = (agentId: string) => {
    const idLower = agentId.toLowerCase();
    if (idLower.includes('red') || idLower.includes('adversary')) return '🔴 RED-TEAM';
    if (idLower.includes('doctor') || idLower.includes('doc')) return '🩺 DOCTOR';
    if (idLower.includes('patient') || idLower.includes('pat')) return '👤 PATIENT';
    if (idLower.includes('auditor') || idLower.includes('audit')) return '🔍 AUDITOR';
    return agentId;
  };

  const fromSymbol = cleanName(task.fromAgent);
  const toSymbol = cleanName(task.toAgent);
  const turnInfo = task.sharedContext?.currentTurn ? `turn:${task.sharedContext.currentTurn}/${task.sharedContext.maxTurns}` : 'FINAL';

  return {
    id: `band_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    level: 'band_handoff',
    component: 'BAND' as any,
    message: `${fromSymbol} → ${toSymbol}   task:${task.taskId?.substring(0, 6) ?? 'xxxx'}  ${turnInfo}  ●${isFallback ? 'LOCAL' : 'LIVE'}`
  };
}
