import React, { useState } from 'react';
import { ShieldAlert, FileText, CheckCircle, AlertOctagon } from 'lucide-react';
import { PatientEnvelope, SimulationMessage } from '../types/clinical';

interface HITLEscalationProps {
  patient: PatientEnvelope;
  score: number;
  verdict: string;
  violations: string[];
  messages: SimulationMessage[];
  onSignOverride: (reviewerName: string, npi: string, justification: string) => void;
  onClose: () => void;
}

export const HITLEscalation: React.FC<HITLEscalationProps> = ({
  patient,
  score,
  verdict,
  violations,
  messages,
  onSignOverride,
  onClose
}) => {
  const [reviewerName, setReviewerName] = useState('');
  const [npi, setNpi] = useState('');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');

  const getRecommendedSpecialty = (patientId: string) => {
    if (patientId.includes('psy')) return 'Psychiatry Specialist';
    if (patientId.includes('onc')) return 'Oncology Specialist';
    if (patientId.includes('ped')) return 'Pediatrics Specialist';
    return 'General Clinical Safety Specialist';
  };

  const generatePacketText = () => {
    const specialty = getRecommendedSpecialty(patient.id);
    const date = new Date().toLocaleString();
    const transcriptText = messages.map(m => `[${m.sender.toUpperCase()} - ${m.senderName}]: ${m.message}`).join('\n');
    const violationsText = violations.map((v, i) => `${i + 1}. ${v}`).join('\n');
    
    return `================================================================
CLINICAL ESCALATION & HUMAN REVIEW REQUEST PACKET
================================================================
Generated: ${date}
Escalation ID: ESC-${patient.id.toUpperCase()}-${Date.now().toString().slice(-4)}
Status: AWAITING HUMAN REVIEW
Recommended Review Specialty: ${specialty}

----------------------------------------------------------------
1. PATIENT DEMOGRAPHICS
----------------------------------------------------------------
Name: ${patient.name}
Age / Gender: ${patient.age} / ${patient.gender}
DOB: ${patient.dob || 'Unknown'}
Insurance Provider: ${patient.insuranceProvider}
Target Procedure CPT: ${patient.targetProcedureCpt || 'N/A'}

----------------------------------------------------------------
2. CLINICAL SAFETY AUDIT FINDINGS
----------------------------------------------------------------
Initial Audit Score: ${score}/100
Verdict: ${verdict}
Critical Safety Violations Identified:
${violationsText || 'None'}

----------------------------------------------------------------
3. INTERCEPTED CONSULTATION TRANSCRIPT
----------------------------------------------------------------
${transcriptText}

================================================================
PHYSICIAN OVERRIDE SECTION (To be signed by clinical reviewer)
================================================================
I have reviewed the clinical safety violations listed above and the
consultation transcript. I hereby authorize the override of the
safety recommendations due to appropriate clinical justification.

Reviewer Physician Name: _____________________________________
NPI Number (10-digit):   _____________________________________
Signature:               _____________________________________
Date:                    _____________________________________
Justification:
________________________________________________________________
________________________________________________________________
================================================================`;
  };

  const handleDownloadPacket = () => {
    const text = generatePacketText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lumen_Escalation_Packet_${patient.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSign = () => {
    if (!reviewerName.trim()) {
      setError('Please provide the Reviewer Physician Name.');
      return;
    }
    if (!npi.trim() || npi.trim().length < 10 || isNaN(Number(npi))) {
      setError('Please provide a valid 10-digit NPI number.');
      return;
    }
    if (!justification.trim() || justification.trim().length < 15) {
      setError('Please provide a clinical justification (minimum 15 characters).');
      return;
    }
    
    setError('');
    onSignOverride(reviewerName.trim(), npi.trim(), justification.trim());
  };

  return (
    <div 
      className="hitl-escalation-backdrop animate-fade-in" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="hitl-escalation-modal"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          className="hitl-header"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(90deg, #7F1D1D 0%, var(--bg-card) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="#EF4444" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F9FAFB', letterSpacing: '0.025em' }}>
              CLINICAL ESCALATION PACKET & HITL OVERRIDE
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg-muted)',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1
            }}
            title="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Content Body */}
        <div 
          className="hitl-body"
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Section 1: Demographics */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> PATIENT DEMOGRAPHICS
              </h4>
              <button
                onClick={handleDownloadPacket}
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid #3B82F6',
                  color: '#60A5FA',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Download formatted Human Review request packet text file"
              >
                <FileText size={12} /> Download Review Request Packet
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12.5px' }}>
              <div><span style={{ color: 'var(--fg-muted)' }}>Name:</span> <strong>{patient.name}</strong></div>
              <div><span style={{ color: 'var(--fg-muted)' }}>DOB:</span> <strong>{patient.dob || 'Unknown'}</strong></div>
              <div><span style={{ color: 'var(--fg-muted)' }}>Gender:</span> <strong>{patient.gender}</strong></div>
              <div><span style={{ color: 'var(--fg-muted)' }}>Insurance:</span> <strong>{patient.insuranceProvider}</strong></div>
              <div><span style={{ color: 'var(--fg-muted)' }}>Target CPT:</span> <strong>{patient.targetProcedureCpt || 'N/A'}</strong></div>
              <div><span style={{ color: 'var(--fg-muted)' }}>Escalation ID:</span> <strong style={{ fontFamily: 'monospace' }}>ESC-{patient.id.toUpperCase()}-{Date.now().toString().slice(-4)}</strong></div>
              <div style={{ gridColumn: 'span 3', borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: 'var(--fg-muted)' }}>Recommended Specialty Reviewer:</span> <strong style={{ color: 'var(--brand)' }}>{getRecommendedSpecialty(patient.id)}</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Safety Audit Alert */}
          <div 
            style={{
              border: '1px solid #7F1D1D',
              backgroundColor: 'rgba(127, 29, 29, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="#EF4444" />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F87171' }}>
                AI Audit Failure Confirmed (Score: {score}/100, Verdict: {verdict})
              </span>
            </div>
            
            <div style={{ fontSize: '12.5px', color: '#F9FAFB' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>Critical Safety Violations Found:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {violations.map((v, i) => (
                  <li key={i} style={{ color: '#FCA5A5' }}>{v}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Conversation Transcript */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--fg-primary)' }}>
              CONSULTATION TRANSCRIPT PACKET
            </h4>
            <div 
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                maxHeight: '180px',
                overflowY: 'auto',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11.5px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {messages.map((m) => (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ 
                    fontWeight: 700, 
                    color: m.sender === 'doctor' ? 'var(--brand)' : 'var(--fg-safe)',
                    textTransform: 'uppercase'
                  }}>
                    [{m.sender}]:
                  </span>{' '}
                  <span style={{ color: 'var(--fg-primary)' }}>{m.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Physician Sign-off Form */}
          <div 
            style={{ 
              backgroundColor: 'var(--bg-subtle)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-md)', 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 700, color: 'var(--fg-primary)' }}>
              PHYSICIAN SIGN-OFF & OVERRIDE ATTESTATION
            </h4>
            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--fg-muted)', lineHeight: 1.4 }}>
              I attest that I have reviewed the safety concerns generated by the automated audit system. 
              By signing below, I assume clinical responsibility to override the safety recommendation and approve this scheduling request.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Reviewer Physician Name *</label>
                <input 
                  type="text" 
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--fg-primary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>NPI Number (10-digit) *</label>
                <input 
                  type="text" 
                  maxLength={10}
                  value={npi}
                  onChange={(e) => setNpi(e.target.value)}
                  placeholder="e.g. 1827364520"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--fg-primary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Clinical Justification / Notes *</label>
              <textarea 
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Document clinical reason to bypass standard screening protocol (min 15 chars)..."
                rows={3}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--fg-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠️</span> {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div 
          className="hitl-footer"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '12.5px'
            }}
          >
            Cancel Review
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSign}
            style={{
              backgroundColor: '#B91C1C',
              borderColor: '#B91C1C',
              color: '#FFFFFF',
              padding: '8px 18px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle size={15} /> Sign & Authorize Override
          </button>
        </div>
      </div>
    </div>
  );
};
