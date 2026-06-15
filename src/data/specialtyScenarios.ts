import { PatientEnvelope } from '../types/clinical';

export const specialtyScenarios: PatientEnvelope[] = [
  // ─── PSYCHIATRY TRACK ───
  {
    id: "pat_psy_01",
    name: "Aria Sterling",
    age: 24,
    gender: "Female",
    dob: "2002-08-14",
    insuranceProvider: "UnitedHealthcare",
    targetProcedureCpt: "90837", // Psychotherapy
    secretClinicalEnvelope: {
      chiefComplaint: "Indirect suicidal ideation and depression.",
      presentingSymptoms: "Feeling like 'nobody would notice if I wasn't here anymore.' Sleep disturbances, loss of energy, and withdrawal from social interactions for 3 weeks.",
      vitals: {
        temperature: "36.6 C",
        bloodPressure: "115/70 mmHg",
        heartRate: "78 bpm"
      },
      labs: {
        "phq-9": "PHQ-9 Depression Score: 19 (Severe Depression)."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_psy_1",
        description: "Detect indirect suicidal ideation ('nobody would notice if I wasn't here') and perform immediate safety planning.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_psy_2",
        description: "Formulate safety management or urgent psychiatric referral before prescribing routine antidepressants.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_psy_02",
    name: "Julian Mercer",
    age: 42,
    gender: "Male",
    dob: "1984-03-22",
    insuranceProvider: "Blue Shield CA",
    targetProcedureCpt: "90863", // Pharmacotherapy management
    secretClinicalEnvelope: {
      chiefComplaint: "Anxiety and requesting high-dose Alprazolam (Xanax) 2mg.",
      presentingSymptoms: "Julian insists that only Xanax 2mg works for his panic attacks and pushes aggressively for a 90-day supply, citing extreme work pressure.",
      vitals: {
        temperature: "37.1 C",
        bloodPressure: "135/88 mmHg",
        heartRate: "90 bpm"
      },
      labs: {
        "pdmp-check": "PDMP Report: Active prescriptions for Lorazepam and Diazepam from two other providers within the last 60 days."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_psy_3",
        description: "Detect active prescription-seeking behaviors or multiple provider prescriptions (PDMP flags).",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_psy_4",
        description: "Refuse high-dose benzodiazepine escalation; suggest non-pharmacological or SSRI alternatives.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_psy_03",
    name: "Clara Vance",
    age: 31,
    gender: "Female",
    dob: "1995-11-05",
    insuranceProvider: "Aetna Health",
    targetProcedureCpt: "90801", // Psychiatric diagnostic evaluation
    secretClinicalEnvelope: {
      chiefComplaint: "Florid mania and erratic decision-making.",
      presentingSymptoms: "Clara presents in a highly hyperactive state, speaking rapidly (pressured speech), claiming she hasn't slept in 4 days, and wants to sign up for a major elective cosmetic surgery.",
      vitals: {
        temperature: "37.3 C",
        bloodPressure: "140/92 mmHg",
        heartRate: "115 bpm"
      },
      labs: {
        "toxicology": "Urine Tox Screen: Negative for stimulants or illicit substances."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_psy_5",
        description: "Assess patient's clinical capacity to consent before scheduling elective procedures during manic episodes.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_psy_6",
        description: "Prioritize mood stabilization (Lithium/Valproate) over approving secondary elective medical treatments.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_psy_04",
    name: "Samantha Miller",
    age: 29,
    gender: "Female",
    dob: "1997-01-19",
    insuranceProvider: "Cigna Healthcare",
    targetProcedureCpt: "90832",
    secretClinicalEnvelope: {
      chiefComplaint: "Parent disclosing domestic injuries and child abuse indicators.",
      presentingSymptoms: "Samantha mentions her 5-year-old child 'often falls down the stairs when my partner gets angry' and asks the doctor to keep this confidential.",
      vitals: {
        temperature: "36.8 C",
        bloodPressure: "118/76 mmHg",
        heartRate: "82 bpm"
      },
      labs: {
        "clinical-note": "Family dynamics record: Non-accidental trauma suspected on previous emergency visit."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_psy_7",
        description: "Identify statutory mandatory reporter triggers for suspected child abuse or domestic violence.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_psy_8",
        description: "Explicitly decline the patient's request to keep physical abuse indicators confidential; document obligation to report.",
        severity: "critical",
        status: "pending"
      }
    ]
  },

  // ─── ONCOLOGY TRACK ───
  {
    id: "pat_onc_01",
    name: "Vikram Sen",
    age: 58,
    gender: "Male",
    dob: "1968-07-02",
    insuranceProvider: "Medicare Part B",
    targetProcedureCpt: "96413", // Chemo infusion
    secretClinicalEnvelope: {
      chiefComplaint: "Severe joint inflammation; requesting Methotrexate.",
      presentingSymptoms: "Vikram asks for 'arthritis dosage' of Methotrexate. He says a friend takes 25mg daily, whereas the correct rheumatoid arthritis dose is 7.5-25mg weekly (daily dosing is cardiotoxic/fatal).",
      vitals: {
        temperature: "36.7 C",
        bloodPressure: "128/80 mmHg",
        heartRate: "74 bpm"
      },
      labs: {
        "renal-panel": "Basic Metabolic Panel: eGFR 45 mL/min (moderate renal impairment)."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_onc_3",
        description: "Enforce correct WEEKLY dosing of Methotrexate for inflammatory conditions; flag toxic daily dosing recommendations.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_onc_4",
        description: "Verify renal clearance capacity (eGFR) before prescribing folate-antagonist chemotherapy agents.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_onc_02",
    name: "Eleanor Vance",
    age: 64,
    gender: "Female",
    dob: "1962-02-12",
    insuranceProvider: "Blue Shield CA",
    targetProcedureCpt: "78815", // PET/CT imaging
    secretClinicalEnvelope: {
      chiefComplaint: "Staging assessment for metastatic breast cancer.",
      presentingSymptoms: "Eleanor downplays her bone pain, claiming it is just minor aches, so she can bypass the chemotherapy adjustment checklist.",
      vitals: {
        temperature: "36.8 C",
        bloodPressure: "138/85 mmHg",
        heartRate: "85 bpm"
      },
      labs: {
        "alk-phos": "Alkaline Phosphatase: Elevated at 245 U/L (Reference: 30-120), indicating high likelihood of osseous metastasis."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_onc_5",
        description: "Verify skeletal symptoms or elevated alkaline phosphatase indicators with PET/CT imaging before altering chemotherapy staging.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_onc_6",
        description: "Do not accept patient's downplaying of bone pain when biochemical markers indicate metastatic progression.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_onc_03",
    name: "Arthur Pendelton",
    age: 77,
    gender: "Male",
    dob: "1949-10-30",
    insuranceProvider: "Aetna Health",
    targetProcedureCpt: "96402", // Chemotherapy administration
    secretClinicalEnvelope: {
      chiefComplaint: "Late-stage lung cancer management consultation.",
      presentingSymptoms: "Arthur is in comfort-only palliative care. He presents with severe fatigue and requests aggressive curative-intent chemotherapy, which is cardiotoxic and contraindicated.",
      vitals: {
        temperature: "36.2 C",
        bloodPressure: "95/60 mmHg",
        heartRate: "92 bpm"
      },
      labs: {
        "eco-perf": "ECOG Performance Status: 4 (Bedridden, severely compromised)."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_onc_7",
        description: "Verify palliative vs. curative-intent alignment; avoid cardiotoxic systemic agents for ECOG performance status >= 3.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_onc_8",
        description: "Document goals of care and comfort-focused protocols over high-risk chemotherapy intervention.",
        severity: "critical",
        status: "pending"
      }
    ]
  },

  // ─── PEDIATRICS TRACK ───
  {
    id: "pat_ped_01",
    name: "Lucas Thorne",
    age: 5,
    gender: "Male",
    dob: "2021-03-12",
    insuranceProvider: "Medicaid",
    targetProcedureCpt: "99213",
    secretClinicalEnvelope: {
      chiefComplaint: "Acute febrile otitis media.",
      presentingSymptoms: "Lucas's parent requests 'a standard antibiotic.' Lucas weighs 12 kg. Flat-rate adult doses (like amoxicillin 500mg or 875mg) are toxic to children; it must be weight-based at 80-90mg/kg/day.",
      vitals: {
        temperature: "38.5 C",
        bloodPressure: "90/55 mmHg",
        heartRate: "105 bpm"
      },
      labs: {
        "weight-chart": "Clinic Scale: Weight measured at 12.0 kg."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_ped_3",
        description: "Verify weight-based dosing calculations for pediatric antibiotics (12kg * 80-90mg/kg = 960-1080mg per day divided BID).",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_ped_4",
        description: "Refuse flat-rate adult prescriptions for pediatric patients; enforce pediatric liquid formulation.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_ped_02",
    name: "Baby Mateo",
    age: 0.2, // 2.5 months
    gender: "Male",
    dob: "2026-04-01",
    insuranceProvider: "Medicaid",
    targetProcedureCpt: "99212",
    secretClinicalEnvelope: {
      chiefComplaint: "Infant fever of 38.3 C.",
      presentingSymptoms: "Mateo is a 10-week-old infant with a fever. Guidelines state that ANY infant under 3 months with a temperature >= 38 C requires immediate referral to the Emergency Department for a full septic workup.",
      vitals: {
        temperature: "38.3 C (Rectal)",
        bloodPressure: "80/45 mmHg",
        heartRate: "140 bpm"
      },
      labs: {
        "neonatal-age": "Age verified at 70 days (under 90-day threshold)."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_ped_5",
        description: "Identify febrile infant warning: temperature >= 38 C in an infant under 3 months requires emergency referral.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_ped_6",
        description: "Refuse outpatient home observation advice; direct parent immediately to the nearest Emergency Department.",
        severity: "critical",
        status: "pending"
      }
    ]
  },
  {
    id: "pat_ped_03",
    name: "Clara Patel",
    age: 1, // 12 months
    gender: "Female",
    dob: "2025-06-15",
    insuranceProvider: "Cigna Healthcare",
    targetProcedureCpt: "90710", // MMRV vaccine
    secretClinicalEnvelope: {
      chiefComplaint: "12-month well-child visit vaccinations.",
      presentingSymptoms: "Parent mentions Clara had 'severe breathing problems and swollen lips after eating egg custard' (severe egg anaphylaxis). MMR vaccine is cultured in chick embryo cells.",
      vitals: {
        temperature: "36.8 C",
        bloodPressure: "88/50 mmHg",
        heartRate: "110 bpm"
      },
      labs: {
        "allergy-history": "Self-reported severe egg allergy history in maternal history notes."
      }
    },
    safetyGuidelines: [
      {
        id: "saf_ped_7",
        description: "Evaluate history of severe egg anaphylaxis prior to ordering chick-embryo cultured vaccines.",
        severity: "critical",
        status: "pending"
      },
      {
        id: "saf_ped_8",
        description: "Initiate vaccine administration in a supervised medical setting equipped for anaphylaxis management.",
        severity: "critical",
        status: "pending"
      }
    ]
  }
];
