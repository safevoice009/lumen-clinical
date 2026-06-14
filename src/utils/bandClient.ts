import { BandTask, BandSharedContext } from '../types/clinical';

const BAND_API_BASE = (import.meta as any).env?.VITE_BAND_API_BASE || 'https://api.band.ai/v1';
const BAND_API_KEY = (import.meta as any).env?.VITE_BAND_API_KEY || '';

export async function registerAgentWithBand(agentName: string, role: string): Promise<string> {
  // Register this agent instance with Band
  try {
    const res = await fetch(`${BAND_API_BASE}/agents/register`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${BAND_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        name: agentName, 
        role, 
        capabilities: ['clinical_simulation', 'fhir_r4', 'loinc_coding'] 
      })
    });
    
    if (!res.ok) {
      throw new Error(`Registration failed: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.agentId || `local-${agentName}-${Date.now()}`;
  } catch (err) {
    console.warn(`[Band] Agent registration failed — using local fallback:`, err);
    return `local-${agentName}-${Date.now()}`;
  }
}

export async function dispatchTaskToBand(task: Omit<BandTask, 'taskId'>): Promise<BandTask> {
  // Send a task handoff through Band's coordination layer
  try {
    const res = await fetch(`${BAND_API_BASE}/tasks/dispatch`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${BAND_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(task)
    });
    
    if (!res.ok) {
      throw new Error(`Dispatch failed: ${res.statusText}`);
    }
    
    return await res.json();
  } catch (err) {
    console.warn(`[Band] Task dispatch failed — simulating local fallback handoff:`, err);
    // Local fallback: simulate Band handoff for demo
    return { 
      ...task, 
      taskId: `fallback-${Date.now()}` 
    };
  }
}

export async function updateBandSharedContext(
  sessionId: string,
  contextUpdate: Partial<BandSharedContext>
): Promise<void> {
  // Update the shared context that all agents in the session can read
  try {
    const res = await fetch(`${BAND_API_BASE}/context/${sessionId}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${BAND_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(contextUpdate)
    });
    
    if (!res.ok) {
      throw new Error(`Context update failed: ${res.statusText}`);
    }
  } catch (err) {
    console.warn('[Band] Context update failed — state managed locally:', err);
  }
}

export function makeBandHandoffLog(
  task: BandTask, 
  isFallback: boolean, 
  component: string
): any {
  return {
    id: `band_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    level: 'band_handoff',
    component: component as any,
    message: `Band Task Handoff: [${task.fromAgent}] ➔ [${task.toAgent}] | TaskID: ${task.taskId} | Turn: ${task.sharedContext.currentTurn}/${task.sharedContext.maxTurns} | Type: ${isFallback ? 'Local Fallback' : 'Band API Live'}`
  };
}
