import React, { useState } from 'react';
import { FileDown, Trash2, Sparkles, Brain, Edit2 } from 'lucide-react';
import { runAimlAuditRaw } from '../utils/aimlClient';

export interface DpoPair {
  id: string;
  patientName: string;
  scenarioName: string;
  prompt: string;
  chosen: string;
  rejected: string;
  rationale: string;
}

interface DpoStudioProps {
  pairs: DpoPair[];
  onUpdatePair: (id: string, updatedChosen: string) => void;
  onDeletePair: (id: string) => void;
}

export const DpoStudio: React.FC<DpoStudioProps> = ({ pairs, onUpdatePair, onDeletePair }) => {
  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempChosen, setTempChosen] = useState<string>('');

  const handleStartEdit = (pair: DpoPair) => {
    setEditingId(pair.id);
    setTempChosen(pair.chosen);
  };

  const handleSaveEdit = (id: string) => {
    onUpdatePair(id, tempChosen);
    setEditingId(null);
  };

  const handlePolishWithAI = async (pair: DpoPair) => {
    setPolishingId(pair.id);
    try {
      const systemPrompt = `You are a clinical AI alignment expert. Polish the following clinician justification override into a direct, professional, guideline-compliant doctor response for dialogue fine-tuning.
Preserve the clinical meaning and the clinician's core instruction exactly, but format it as a natural, empathetic, and guideline-compliant statement a doctor would say to a patient.
Respond with ONLY the polished statement. Do NOT include quotes, explanations, prefixes, or any extra text.`;

      const userContent = `Dialogue context:\n${pair.prompt}\n\nClinician Raw Draft:\n${pair.chosen}`;
      
      const polished = await runAimlAuditRaw(userContent, systemPrompt, 'gemini-2.0-flash');
      if (polished && polished.trim().length > 0) {
        const cleanPolished = polished.replace(/^["']|["']$/g, '').trim(); // Remove leading/trailing quotes
        onUpdatePair(pair.id, cleanPolished);
        if (editingId === pair.id) {
          setTempChosen(cleanPolished);
        }
      }
    } catch (err) {
      console.error('AI polishing failed:', err);
      alert('AI Polishing failed. Please verify your VITE_AIML_API_KEY.');
    } finally {
      setPolishingId(null);
    }
  };

  const handleExportJsonl = () => {
    if (pairs.length === 0) return;

    const lines = pairs.map(pair => JSON.stringify({
      prompt: pair.prompt,
      chosen: pair.chosen,
      rejected: pair.rejected,
      rationale: pair.rationale
    }));

    const jsonlContent = lines.join('\n');
    const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lumen_DPO_Alignment_Batch_${Date.now()}.jsonl`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (pairs.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', padding: '24px', background: 'var(--bg-card)', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
        <Brain size={48} style={{ color: 'var(--fg-muted)', marginBottom: '16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fg-primary)', marginBottom: '6px' }}>DPO Fine-Tuning Studio Empty</h3>
        <p style={{ fontSize: '11px', color: 'var(--fg-muted)', textAlign: 'center', maxWidth: '320px', lineHeight: '1.4', margin: 0 }}>
          No preference alignment pairs have been collected yet. During simulation, intervene by providing a Clinical Justification to generate training data.
        </p>
      </div>
    );
  }

  return (
    <div className="dpo-studio animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>⚖️ Clinical Alignment Dataset Studio</h3>
          <span style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>Curate preference pairs to align safer medical LLMs</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleExportJsonl}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px' }}
        >
          <FileDown size={12} />
          Export DPO Batch (.JSONL)
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}>
        {pairs.map((pair, index) => {
          const isEditing = editingId === pair.id;
          const isPolishing = polishingId === pair.id;
          return (
            <div
              key={pair.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--fg-muted)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  PAIR #{index + 1} · {pair.patientName} ({pair.scenarioName})
                </span>
                <button
                  onClick={() => onDeletePair(pair.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--fg-danger)', cursor: 'pointer', padding: '2px', opacity: 0.7 }}
                  title="Remove from batch"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Rejected (Failed AI response) */}
              <div style={{ background: 'rgba(239, 68, 68, 0.03)', borderLeft: '3px solid var(--color-danger)', borderRadius: '4px', padding: '10px' }}>
                <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: 'var(--fg-danger)', marginBottom: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                  ✗ REJECTED (AI SAFETY FAILURE)
                </span>
                <p style={{ fontSize: '11.5px', color: 'var(--fg-muted)', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
                  "{pair.rejected}"
                </p>
              </div>

              {/* Chosen (Clinician-attested correction) */}
              <div style={{ background: 'rgba(16, 185, 129, 0.03)', borderLeft: '3px solid var(--color-safe)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--fg-safe)', fontFamily: "'JetBrains Mono', monospace" }}>
                    ✓ CHOSEN (CLINICIAN ALIGNED RESPONSE)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handlePolishWithAI(pair)}
                      disabled={isPolishing}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--brand)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      <Sparkles size={10} className={isPolishing ? 'animate-spin' : ''} />
                      {isPolishing ? 'Polishing...' : 'AI Polish'}
                    </button>
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(pair)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--fg-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '9px',
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      >
                        <Edit2 size={10} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <textarea
                      value={tempChosen}
                      onChange={(e) => setTempChosen(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        color: 'var(--fg-primary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: '11.5px',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditingId(null)}
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSaveEdit(pair.id)}
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '11.5px', color: 'var(--fg-primary)', margin: 0, fontWeight: 500, lineHeight: '1.4' }}>
                    "{pair.chosen}"
                  </p>
                )}
              </div>

              {/* Rationale */}
              <div style={{ background: 'var(--bg-subtle)', borderRadius: '4px', padding: '8px', fontSize: '10.5px', color: 'var(--fg-secondary)', lineHeight: '1.3' }}>
                <span style={{ fontWeight: 700, color: 'var(--fg-muted)', fontFamily: "'JetBrains Mono', monospace", display: 'block', marginBottom: '2px', fontSize: '9px' }}>
                  🧠 AUDIT CLINICAL RATIONALE
                </span>
                {pair.rationale}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DpoStudio;
