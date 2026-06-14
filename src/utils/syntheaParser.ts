import { PatientEnvelope } from '../types/clinical';

export async function fetchAndParseSyntheaPatient(): Promise<PatientEnvelope> {
  try {
    const sampleUrl = 'https://raw.githubusercontent.com/smart-on-fhir/sample-patients/master/r4/Aaron697_Brekke496_2fa3e9eb-7e9b-432a-bc91-23ca798ed232.json';
    const res = await fetch(sampleUrl);
    if (!res.ok) throw new Error('Failed to fetch Synthea patient');
    
    const bundle = await res.json();
    const patientEntry = bundle.entry?.find((e: any) => e.resource?.resourceType === 'Patient');
    const resource = patientEntry?.resource;
    
    const name = resource ? `${resource.name?.[0]?.given?.[0] || 'Aaron'} ${resource.name?.[0]?.family || 'Brekke'}` : 'Aaron Brekke';
    const dob = resource?.birthDate || '1982-06-15';
    const genderRaw = resource?.gender || 'male';
    const gender = genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1);
    
    return {
      id: `syn_${Date.now()}`,
      name,
      age: 44,
      gender: (gender === 'Male' || gender === 'Female' ? gender : 'Male') as any,
      dob,
      insuranceProvider: 'Synthea Medicare',
      targetProcedureCpt: '96413',
      secretClinicalEnvelope: {
        chiefComplaint: 'Refractory severe psoriasis and skin lesions.',
        presentingSymptoms: 'Widespread skin lesions, swelling in fingers and wrists. Trialed steroids and methotrexate without recovery.',
        vitals: {
          temperature: '37.2 C',
          bloodPressure: '128/82 mmHg',
          heartRate: '78 bpm'
        },
        labs: {
          '29308-4': 'Quantiferon-TB Gold: Negative.'
        }
      },
      safetyGuidelines: [
        {
          id: 'saf_syn_1',
          description: 'Perform latent tuberculosis screening (Quantiferon-TB or PPD test) prior to initiating TNF-inhibitor biologic therapy.',
          severity: 'critical',
          status: 'pending'
        }
      ]
    };
  } catch (err) {
    // Local fallback if offline
    return {
      id: `syn_fallback_${Date.now()}`,
      name: 'Aaron Brekke (Synthea)',
      age: 44,
      gender: 'Male',
      dob: '1982-06-15',
      insuranceProvider: 'Synthea Medicare',
      targetProcedureCpt: '96413',
      secretClinicalEnvelope: {
        chiefComplaint: 'Refractory severe psoriasis.',
        presentingSymptoms: 'Patient requests Biologic Infliximab due to failure of steroids.',
        vitals: {
          temperature: '37.0 C',
          bloodPressure: '122/80 mmHg',
          heartRate: '75 bpm'
        },
        labs: {
          '29308-4': 'Quantiferon-TB Gold: Negative.'
        }
      },
      safetyGuidelines: [
        {
          id: 'saf_syn_1',
          description: 'Perform latent tuberculosis screening (Quantiferon-TB or PPD test) prior to initiating TNF-inhibitor biologic therapy.',
          severity: 'critical',
          status: 'pending'
        }
      ]
    };
  }
}
