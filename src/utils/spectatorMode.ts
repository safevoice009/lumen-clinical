import { SimulationMessage, ClinicalToolCall } from '../types/clinical';

export interface SpectatorPayload {
  sessionId: string;
  patientName: string;
  stepIndex: number;
  totalSteps: number;
  messages: SimulationMessage[];
  toolCalls: ClinicalToolCall[];
  safetyScore: number;
  verdict: 'PASS' | 'FAIL' | 'PARTIAL' | 'INDETERMINATE';
  activeAgent: string;
  isComplete: boolean;
}

const NTFY_BASE_URL = 'https://ntfy.sh';

// Generate a random channel ID for this session
export function generateSessionId(): string {
  return 'lumen_spec_' + Math.random().toString(36).substring(2, 11);
}

// Broadcast the current state to ntfy.sh
export async function broadcastState(sessionId: string, payload: Omit<SpectatorPayload, 'sessionId'>): Promise<void> {
  const url = `${NTFY_BASE_URL}/${sessionId}`;
  try {
    const fullPayload: SpectatorPayload = {
      sessionId,
      ...payload
    };
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(fullPayload),
      headers: {
        'Content-Type': 'application/json',
        'Title': 'Lumen Simulation Update',
        'Tags': 'lumen,clinical,simulation'
      }
    });
  } catch (err) {
    console.error('Failed to broadcast spectator state:', err);
  }
}

// Listen for updates from ntfy.sh using SSE
export function listenToSpectatorSession(
  sessionId: string,
  onUpdate: (payload: SpectatorPayload) => void,
  onError?: (error: any) => void
): () => void {
  // Use ntfy's raw streaming endpoint (which outputs one JSON line per message)
  const url = `${NTFY_BASE_URL}/${sessionId}/json`;
  const controller = new AbortController();

  const startListening = async () => {
    try {
      const response = await fetch(url, {
        signal: controller.signal
      });

      if (!response.body) {
        throw new Error('No readable stream body returned from spectator channel.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsedEvent = JSON.parse(line);
            // ntfy wraps the payload in a message body field
            if (parsedEvent.message) {
              const payload: SpectatorPayload = JSON.parse(parsedEvent.message);
              onUpdate(payload);
            }
          } catch (e) {
            // Ignore parsing errors for non-JSON lines or heartbeats
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Spectator listen stream error:', err);
        if (onError) onError(err);
      }
    }
  };

  startListening();

  // Return unsubscribe/abort function
  return () => {
    controller.abort();
  };
}
