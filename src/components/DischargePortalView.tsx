import React from 'react';
import { 
  ShieldCheck, Calendar, Phone, Printer, ArrowLeft, Stethoscope, 
  Pill, AlertTriangle, FileText 
} from 'lucide-react';

export interface PortalMeds {
  name: string;
  code: string;
  sig: string;
  route: string;
  duration: string;
  instruction: string;
}

export interface PortalData {
  patientName: string;
  dob: string;
  gender: string;
  mrn: string;
  diagnosis: string;
  summary: string;
  warnings: string;
  followupProvider: string;
  followupDate: string;
  followupPhone: string;
  physicianName: string;
  physicianNpi: string;
  signatureUrl?: string;
  meds: PortalMeds[];
  safetyScore?: string;
  safetyStatus?: string;
  fhirValidation?: 'valid' | 'incomplete';
  timestamp: string;
}

interface DischargePortalViewProps {
  data: PortalData;
  onBack: () => void;
}

export const DischargePortalView: React.FC<DischargePortalViewProps> = ({ data, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  // Helper to categorize medication timings
  const getMedTimingIcon = (sig: string) => {
    const s = sig.toLowerCase();
    if (s.includes('qhs') || s.includes('bedtime') || s.includes('night')) return '🌙';
    if (s.includes('bid')) return '☀️/🌙';
    if (s.includes('tid')) return '☀️/⛅/🌙';
    if (s.includes('ac') || s.includes('morning')) return '🌅';
    return '💊';
  };

  return (
    <div className="portal-container animate-fade-in" style={{
      maxWidth: '850px',
      margin: '40px auto',
      padding: '24px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-2xl)',
      boxShadow: 'var(--shadow-xl)',
      backdropFilter: 'blur(20px)'
    }}>
      {/* Action Bar (Hidden during print) */}
      <div className="portal-actions-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        <button className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Workstation
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={14} /> Print Summary
        </button>
      </div>

      {/* Main Document Body */}
      <div className="printable-document">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--border-strong)',
          paddingBottom: '20px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Stethoscope size={24} style={{ color: 'var(--brand)' }} />
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                Lumen Pre-Deployment Health Pass
              </h2>
            </div>
            <p style={{ color: 'var(--fg-muted)', fontSize: '12.5px', margin: 0 }}>
              Official HL7 FHIR (R4) Certified Clinical Discharge Summary
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{
              background: data.fhirValidation === 'incomplete' ? 'var(--color-danger-bg)' : 'var(--color-safe-bg)',
              color: data.fhirValidation === 'incomplete' ? 'var(--fg-danger)' : 'var(--fg-safe)',
              border: `1px solid ${data.fhirValidation === 'incomplete' ? 'var(--color-danger-border)' : 'var(--color-safe-border)'}`,
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={11} />
              {data.fhirValidation === 'incomplete' ? 'FHIR Incomplete' : 'FHIR R4 Aligned'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>
              Issued: {data.timestamp}
            </span>
          </div>
        </div>

        {/* Demographics Card */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Patient Name</span>
            <strong style={{ fontSize: '15px', color: 'var(--fg-primary)' }}>{data.patientName}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Date of Birth</span>
            <span style={{ fontSize: '14px', color: 'var(--fg-secondary)' }}>{data.dob}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Gender</span>
            <span style={{ fontSize: '14px', color: 'var(--fg-secondary)', textTransform: 'capitalize' }}>{data.gender}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Medical Record # (MRN)</span>
            <span style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--fg-secondary)' }}>{data.mrn}</span>
          </div>
        </div>

        {/* Two Column details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Clinical SOAP Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--fg-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-default)', paddingBottom: '6px' }}>
                <FileText size={14} style={{ color: 'var(--brand)' }} /> Primary Discharge Diagnosis
              </h4>
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--fg-primary)' }}>
                {data.diagnosis}
              </p>
            </div>

            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--fg-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-default)', paddingBottom: '6px' }}>
                Clinical Course Summary
              </h4>
              <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, color: 'var(--fg-secondary)', whiteSpace: 'pre-line' }}>
                {data.summary}
              </p>
            </div>
          </div>

          {/* Follow-up & Safety Audits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              padding: '16px',
              background: 'color-mix(in srgb, var(--brand) 4%, transparent)'
            }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--fg-primary)', margin: '0 0 12px 0' }}>
                <Calendar size={14} style={{ color: 'var(--brand)' }} /> Follow-up Appointment
              </h4>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0' }}>{data.followupProvider}</p>
              <p style={{ fontSize: '13px', color: 'var(--fg-secondary)', margin: '0 0 8px 0' }}>
                Date: <strong>{data.followupDate}</strong>
              </p>
              <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={11} /> {data.followupPhone}
              </p>
            </div>

            {data.safetyStatus && (
              <div style={{
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '16px',
                background: 'var(--bg-input)'
              }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--fg-muted)', margin: '0 0 8px 0' }}>
                  Safety Compliance Verdict
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: data.safetyStatus.includes('FAIL') ? 'var(--fg-danger)' : 'var(--fg-safe)'
                  }}>
                    {data.safetyStatus.includes('FAIL') ? '🔴 AUDIT FAILED' : '🟢 AUDIT PASSED'}
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700 }}>
                    Score: {data.safetyScore}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medications List */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--fg-primary)', marginBottom: '12px', borderBottom: '1px solid var(--border-strong)', paddingBottom: '6px' }}>
            <Pill size={14} style={{ color: 'var(--brand)' }} /> Prescribed Discharge Medications
          </h4>
          
          {data.meds.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: 0 }}>No medications prescribed.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.meds.map((med, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{getMedTimingIcon(med.sig)}</span>
                      <strong style={{ fontSize: '14px', color: 'var(--fg-primary)' }}>{med.name}</strong>
                      <span style={{ fontSize: '10px', background: 'var(--bg-card)', color: 'var(--fg-muted)', padding: '2px 6px', borderRadius: '4px' }}>
                        RxNorm: {med.code}
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--fg-secondary)', margin: 0 }}>
                      Instructions: {med.instruction}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <div>
                      <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Route</span>
                      <span style={{ fontWeight: 600, color: 'var(--fg-secondary)', textTransform: 'capitalize' }}>{med.route}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Duration</span>
                      <span style={{ fontWeight: 600, color: 'var(--fg-secondary)' }}>{med.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning Signs (Epigastric warnings, red flags) */}
        {data.warnings && (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '28px',
            display: 'flex',
            gap: '12px'
          }}>
            <AlertTriangle size={20} style={{ color: 'var(--fg-danger)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--fg-danger)', margin: '0 0 4px 0' }}>
                CRITICAL WARNINGS & RED FLAG SYMPTOMS
              </h4>
              <p style={{ fontSize: '12.5px', lineHeight: '1.4', color: 'var(--fg-danger)', margin: 0 }}>
                {data.warnings}
              </p>
            </div>
          </div>
        )}

        {/* Physician Sign-Off */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '1px solid var(--border-default)',
          paddingTop: '20px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>Attending Clinician</span>
            <strong style={{ fontSize: '14px', color: 'var(--fg-primary)' }}>{data.physicianName}</strong>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--fg-muted)' }}>NPI: {data.physicianNpi}</span>
          </div>

          {data.signatureUrl ? (
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--fg-muted)', marginBottom: '4px' }}>Digital Verification Signature</span>
              <img src={data.signatureUrl} alt="Signature" style={{ maxHeight: '45px', display: 'block', filter: 'contrast(1.5) brightness(0.9)' }} />
            </div>
          ) : (
            <div style={{ borderBottom: '1px dashed var(--border-strong)', width: '150px', height: '30px' }} />
          )}
        </div>
      </div>
    </div>
  );
};
