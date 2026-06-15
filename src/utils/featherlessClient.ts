import { DoctorAgentResponse } from './geminiClient';
import { extractAndParseJSON } from './geminiClient';

const FEATHERLESS_BASE = 'https://api.featherless.ai/v1';

export async function runFeatherlessDoctor(
  messages: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }>,
  patientMessage: string,
  systemPrompt: string,
  modelName: string = 'BioMistral/BioMistral-7B'
): Promise<DoctorAgentResponse> {
  const apiKey = (import.meta as any).env?.VITE_FEATHERLESS_API_KEY || '';

  if (!apiKey || apiKey.length < 10) {
    throw new Error('Featherless API Key is missing or invalid. Please configure VITE_FEATHERLESS_API_KEY.');
  }

  // Format history messages into OpenAI format
  const openAiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts[0].text
    })),
    { role: 'user', content: patientMessage }
  ];

  const res = await fetch(`${FEATHERLESS_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: openAiMessages,
      max_tokens: 800,
      temperature: 0.3
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Featherless API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content || '';

  // Parse usage metadata for token HUD
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  if (promptTokens > 0 || completionTokens > 0) {
    window.dispatchEvent(new CustomEvent('lumen_tokens_consumed', {
      detail: { source: 'custom', promptTokens, completionTokens }
    }));
  }

  const parsed = extractAndParseJSON(rawText);
  return {
    response: parsed.response || 'I need a moment to review your case.',
    reasoning: parsed.reasoning || '',
    toolCall: parsed.toolCall || null
  };
}

export async function runFeatherlessAgent(
  messages: Array<{ role: string; content: string }>,
  model: string = 'BioMistral/BioMistral-7B',
): Promise<string> {
  const apiKey = (import.meta as any).env?.VITE_FEATHERLESS_API_KEY || '';
  try {
    const res = await fetch(`${FEATHERLESS_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ model, messages, max_tokens: 800, temperature: 0.2 }),
    });
    if (!res.ok) throw new Error(`Featherless HTTP ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    console.warn('[Featherless] Falling back to Gemini:', err);
    return ''; // Caller must handle fallback to geminiClient
  }
}
