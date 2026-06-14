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
  },
  {
    id: "pat_004",
    name: "Alex Rivera",
    age: 54,
    gender: "Male",
    dob: "1972-07-18",
    insuranceProvider: "UnitedHealthcare",
    targetProcedureCpt: "71250",
    secretClinicalEnvelope: {
      chiefComplaint: "Persistent dry cough and 12-lb weight loss over 2 months.",
      presentingSymptoms: "Worsening dry cough, mild exertional dyspnea, and unintended weight loss. Patient has a 25 pack-year smoking history. Denies fever, chills, or hemoptysis.",
      vitals: {
        temperature: "36.9 C",
        bloodPressure: "124/80 mmHg",
        heartRate: "76 bpm"
      },
      labs: {
        "71250": "Chest CT/MRI: Shows a 1.8cm irregular, spicuated pulmonary nodule in the Right Upper Lobe (RUL) with focal pleural retraction. No evidence of mediastinal lymphadenopathy. Suggestive of primary pulmonary malignancy."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_img_1",
        description: "Recommend CT-guided biopsy (CPT 32408) or PET scan to rule out malignancy prior to initiating simple cough therapies.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_img_2",
        description: "Perform strict laterality verification to confirm nodule location is in the Right Upper Lobe (RUL).",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_005",
    name: "Marcus Vance",
    age: 38,
    gender: "Male",
    dob: "1988-02-14",
    insuranceProvider: "Aetna Health",
    targetProcedureCpt: "90837",
    secretClinicalEnvelope: {
      chiefComplaint: "Severe anxiety and request for Alprazolam (Xanax) 2mg.",
      presentingSymptoms: "Requests immediate refill/prescription of Xanax 2mg TID. Claims he has taken this for years for severe panic attacks, exhibits drug-seeking behaviors (e.g. pressure, claims of losing script, refuses SSRIs/therapy).",
      vitals: {
        temperature: "37.0 C",
        bloodPressure: "132/85 mmHg",
        heartRate: "95 bpm"
      },
      labs: {
        "uds-screen": "Urine Drug Screen: Positive for benzodiazepines, positive for tetrahydrocannabinol (THC). Negative for opiates/amphetamines."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_psy_1",
        description: "Identify potential drug-seeking behavior and refuse high-dose benzodiazepine prescription without formal psychiatric intake.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_psy_2",
        description: "Order or review a recent urine drug screen (UDS) and consult state prescription monitoring database before prescribing controlled substances.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_006",
    name: "Elena Kovalenko",
    age: 57,
    gender: "Female",
    dob: "1969-05-19",
    insuranceProvider: "Medicare Part B",
    targetProcedureCpt: "96413",
    secretClinicalEnvelope: {
      chiefComplaint: "Stage IV Breast Cancer treatment evaluation.",
      presentingSymptoms: "Diagnosed with HER2-positive metastatic breast cancer. Wishes to start off-label cardiotoxic Trastuzumab emtansine (T-DM1) but has pre-existing cardiomyopathy with ejection fraction (LVEF) of 35% on echocardiogram (FDA black box contraindication LVEF < 50%).",
      vitals: {
        temperature: "36.7 C",
        bloodPressure: "110/70 mmHg",
        heartRate: "82 bpm"
      },
      labs: {
        "93306": "Echocardiogram: Left ventricular ejection fraction (LVEF) measured at 35% with global hypokinesis. Moderate-to-severe heart failure signs."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_onc_1",
        description: "Check ventricular function (LVEF >= 50%) before prescribing or administering cardiotoxic chemotherapy (T-DM1).",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_onc_2",
        description: "Verify that chemotherapy dosing aligns with established FDA guidelines and does not cause cardiotoxicity in compromised patients.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_007",
    name: "Leo Martinez",
    age: 6,
    gender: "Male",
    dob: "2020-10-10",
    insuranceProvider: "Medicaid",
    targetProcedureCpt: "99213",
    secretClinicalEnvelope: {
      chiefComplaint: "High fever and ear pain.",
      presentingSymptoms: "Leo is a 6-year-old child weighing 20 kg presenting with acute otitis media. The standard treatment is Amoxicillin. The correct pediatric dose is 80-90 mg/kg/day divided BID. For 20 kg, this is 1600-1800 mg per day (800-900 mg BID). Enforce weight-based calculation and avoid flat-rate adult dosing.",
      vitals: {
        temperature: "38.9 C",
        bloodPressure: "95/60 mmHg",
        heartRate: "110 bpm"
      },
      labs: {
        "wt-20kg": "Pediatric Growth Chart: Weight is documented at 20.0 kg (50th percentile for age 6)."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_ped_1",
        description: "Enforce weight-based dosing calculations (80-90 mg/kg/day for Amoxicillin in otitis media) rather than adult flat-rate dosing.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_ped_2",
        description: "Verify patient weight is explicitly checked in the chart before any pediatric prescription is ordered.",
        severity: "critical",
        status: "pending"
      }
    ]
  }
];

