import { PatientEnvelope } from '../types/clinical';

export const mockPatients: PatientEnvelope[] = [
  {
    id: "pat_001",
    name: "Sarah Jenkins",
    age: 45,
    gender: "Female",
    dob: "1981-04-12",
    insuranceProvider: "Aetna Health",
    targetProcedureCpt: "44970",
    secretClinicalEnvelope: {
      chiefComplaint: "Severe right lower quadrant abdominal pain.",
      presentingSymptoms: "Pain began 12 hours ago around the belly button, then migrated to the lower right side. Experiencing moderate nausea and has no appetite. Feels warm.",
      vitals: {
        temperature: "38.1 C",
        bloodPressure: "118/75 mmHg",
        heartRate: "92 bpm"
      },
      labs: {
        "76700": "Abdominal Ultrasound: Visualized appendix measures 7.2mm in diameter, with circumferential wall thickening and minimal free fluid in the right iliac fossa. Diagnostically suggestive of acute appendicitis.",
        "6690-2": "Complete Blood Count: Leukocyte count elevated at 14.5 x10^3/uL (Reference: 4.5-11.0), with 82% neutrophils (left shift). Platelets normal."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_app_1",
        description: "Verify localized peritoneal symptoms (rebound tenderness or positive McBurney's sign) prior to surgical staging.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_app_2",
        description: "Order supportive abdominal imaging (Ultrasound or CT) to verify acute inflammation before scheduling appendectomy.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_002",
    name: "Liam Chen",
    age: 62,
    gender: "Male",
    dob: "1964-09-25",
    insuranceProvider: "Blue Shield CA",
    targetProcedureCpt: "93451",
    secretClinicalEnvelope: {
      chiefComplaint: "Shortness of breath on exertion and leg swelling.",
      presentingSymptoms: "Worsening dyspnea over the last 3 weeks. Swelling in both ankles has increased, now leaving deep indentations. Admitted to missing daily Lisinopril medication.",
      vitals: {
        temperature: "36.8 C",
        bloodPressure: "148/90 mmHg",
        heartRate: "88 bpm"
      },
      labs: {
        "93000": "Electrocardiogram: Sinus rhythm. Left ventricular hypertrophy (LVH) with non-specific ST-T wave abnormalities in lateral leads.",
        "93306": "Echocardiogram: Preserved left ventricular ejection fraction of 52%. Grade II diastolic dysfunction. Mild mitral regurgitation."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_cath_1",
        description: "Assess ventricular ejection fraction (EF) via non-invasive imaging prior to initiating invasive cardiac catheterization.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_cath_2",
        description: "Evaluate active fluid retention levels (JVD or pedal edema severity) before surgical catheter line placement.",
        severity: "low",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_003",
    name: "Elena Rostova",
    age: 28,
    gender: "Female",
    dob: "1998-01-30",
    insuranceProvider: "Cigna Healthcare",
    targetProcedureCpt: "96413",
    secretClinicalEnvelope: {
      chiefComplaint: "Widespread painful and itchy skin plaques.",
      presentingSymptoms: "Severe plaque psoriasis covering EXTENSIVE regions of the back, scalp, and extremities. Trialed clobetasol cream and oral methotrexate without relief.",
      vitals: {
        temperature: "36.6 C",
        bloodPressure: "120/80 mmHg",
        heartRate: "72 bpm"
      },
      labs: {
        "29308-4": "Quantiferon-TB Gold: Negative. No evidence of active or latent Mycobacterium tuberculosis infection."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_bio_1",
        description: "Perform latent tuberculosis screening (Quantiferon-TB or PPD test) prior to initiating TNF-inhibitor biologic therapy.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_bio_2",
        description: "Verify failure of or contraindication to traditional systemic oral immunosuppressive therapy (Methotrexate) before upgrading to biologic agents.",
        severity: "critical",
        status: "pending"
      }
    ]
  }
];
