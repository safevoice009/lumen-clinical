const OLLAMA_BASE = (import.meta as any).env?.VITE_OLLAMA_BASE || 'http://localhost:11434';

export async function ollamaChat(model: string, messages: Array<{role: string, content: string}>): Promise<string> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false })
    });
    
    if (!res.ok) {
      throw new Error(`Ollama error: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.message?.content || '';
  } catch (err) {
    console.error(`Ollama request failed:`, err);
    throw err;
  }
}
