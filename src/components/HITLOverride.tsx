import React, { useState } from 'react';
import { VoiceDictation } from './VoiceDictation';
import { Edit3, Check, X } from 'lucide-react';

interface HITLOverrideProps {
  onOverride: (text: string) => void;
  originalText: string;
  isActive: boolean;
}

export const HITLOverride: React.FC<HITLOverrideProps> = ({ onOverride, originalText, isActive }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(originalText);

  if (!isActive) return null;

  return (
    <div className="hitl-override-container animate-fade-in" style={{ display: 'inline-block', marginTop: '6px' }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px', width: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>✏️ CLINICIAN INTERVENE</span>
            <VoiceDictation onTranscript={(dictated) => setText(prev => prev ? `${prev} ${dictated}` : dictated)} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              color: 'var(--fg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '12px',
              fontFamily: 'inherit',
              outline: 'none'
            }}
            rows={2}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setEditing(false); setText(originalText); }}
              style={{ padding: '3px 8px', fontSize: '11px' }}
            >
              <X size={10} /> Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { onOverride(text); setEditing(false); }}
              style={{ padding: '3px 8px', fontSize: '11px' }}
            >
              <Check size={10} /> Resume with Correction
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setEditing(true); setText(originalText); }}
          style={{ fontSize: '10.5px', padding: '4px 8px', gap: '4px', borderColor: 'var(--brand)' }}
        >
          <Edit3 size={11} />
          Intervene (Rewrite AI)
        </button>
      )}
    </div>
  );
};
export default HITLOverride;
