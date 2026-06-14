// Global/Regional Medical APIs Directory and Integration Layer for Lumen Odysseus
// Provides schemas, developer endpoints, query parameters, and simulator helpers for key regional medical databases.

export interface RegionalApiMetadata {
  id: string;
  name: string;
  authority: string;
  country: string;
  endpointTemplate: string;
  documentationUrl: string;
  authType: 'OAuth2' | 'APIKey' | 'ClientCert' | 'SandboxNoAuth';
  schemas: {
    request: string;
    response: string;
  };
  sampleQuery: string;
  mockResponse: any;
}

export const REGIONAL_APIS: Record<string, RegionalApiMetadata[]> = {
  india: [
    {
      id: 'abdm_abha',
      name: 'ABHA ID (Ayushman Bharat Health Account)',
      authority: 'National Health Authority (NHA)',
      country: 'India',
      endpointTemplate: 'https://sandbox.abdm.gov.in/v1/registration/mobile/generateOtp',
      documentationUrl: 'https://sandbox.abdm.gov.in/swagger/index.html',
      authType: 'OAuth2',
      schemas: {
        request: `{ "mobile": "9999999999" }`,
        response: `{ "txnId": "txn_abha_102948120", "status": "OTP_SENT" }`
      },
      sampleQuery: 'POST /v1/registration/mobile/generateOtp',
      mockResponse: {
        status: 'SUCCESS',
        message: 'ABHA transactional session established',
        txnId: 'abha_txn_99281a8c9b20d',
        userAccount: {
          abhaNumber: '91-8829-1029-4820',
          name: 'Rajesh Kumar',
          gender: 'M',
          yearOfBirth: '1979',
          kycStatus: 'VERIFIED'
        }
      }
    },
    {
      id: 'abdm_hiemu',
      name: 'Health Information Exchange & Consent Manager (HIE-CM)',
      authority: 'National Health Authority (NHA)',
      country: 'India',
      endpointTemplate: 'https://sandbox.abdm.gov.in/v0.5/consent-requests/init',
      documentationUrl: 'https://sandbox.abdm.gov.in/',
      authType: 'OAuth2',
      schemas: {
        request: `{ "consent": { "purpose": { "code": "PEAR" }, "patient": { "id": "rajesh@abdm" }, "hiu": { "id": "lumen_workstation" } } }`,
        response: `{ "consentRequestId": "req_102931" }`
      },
      sampleQuery: 'POST /v0.5/consent-requests/init',
      mockResponse: {
        consentRequestId: 'cm_req_f192b90c3',
        status: 'REQUESTED',
        consentManagerId: 'abdm_consent_mgr_01',
        expiry: new Date(Date.now() + 86400000).toISOString()
      }
    }
  ],
  usa: [
    {
      id: 'mayo_cohort',
      name: 'Mayo Clinic Platform Cohort Discovery API',
      authority: 'Mayo Clinic Platform',
      country: 'USA',
      endpointTemplate: 'https://api.mayoclinicplatform.org/v1/cohorts/discover',
      documentationUrl: 'https://www.mayoclinicplatform.org/',
      authType: 'APIKey',
      schemas: {
        request: `{ "criteria": { "diagnoses": ["K35.80"], "minAge": 18, "maxAge": 65 } }`,
        response: `{ "cohortSize": 14205, "confidenceInterval": "0.95" }`
      },
      sampleQuery: 'POST /v1/cohorts/discover',
      mockResponse: {
        cohortSize: 8432,
        matchingPatients: '8.4k de-identified records',
        recommendedClinicalPathways: [
          'AHA Acute Coronary Syndrome guideline-directed diagnostic series',
          'NCCN Oncology Protocol 2024-C3'
        ],
        statisticalRelevance: 'p < 0.001'
      }
    },
    {
      id: 'nih_rxnorm',
      name: 'NIH NLM RxNorm Medication Directory API',
      authority: 'National Library of Medicine (NLM)',
      country: 'USA',
      endpointTemplate: 'https://rxnav.nlm.nih.gov/REST/rxcui.json?name={medName}',
      documentationUrl: 'https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPI.html',
      authType: 'SandboxNoAuth',
      schemas: {
        request: 'GET /REST/rxcui.json?name=Infliximab',
        response: `{ "idGroup": { "name": "infliximab", "rxnormId": ["1148805"] } }`
      },
      sampleQuery: 'GET /REST/rxcui.json?name=Infliximab',
      mockResponse: {
        idGroup: {
          name: 'infliximab',
          rxnormId: ['225211', '1148805', '1722421'],
          conceptProperties: [
            {
              rxcui: '1148805',
              name: 'Infliximab 100 MG Injection [Remicade]',
              tty: 'SBD',
              synonym: 'Remicade 100 MG Injection'
            }
          ]
        }
      }
    }
  ],
  uk: [
    {
      id: 'nhs_gpconnect',
      name: 'NHS GP Connect (Structured Record Access)',
      authority: 'NHS England',
      country: 'UK',
      endpointTemplate: 'https://fhir.gpconnect.nhs.uk/fhir/Patient/$gpc.getstructuredrecord',
      documentationUrl: 'https://digital.nhs.uk/developer/api-catalogue/gp-connect-fhir',
      authType: 'ClientCert',
      schemas: {
        request: `{ "resourceType": "Parameters", "parameter": [ { "name": "patientNHSNumber", "valueIdentifier": { "value": "9449305582" } } ] }`,
        response: `{ "resourceType": "Bundle", "type": "searchset", "entry": [...] }`
      },
      sampleQuery: 'POST /Patient/$gpc.getstructuredrecord',
      mockResponse: {
        resourceType: 'Bundle',
        type: 'collection',
        meta: { profile: ['https://fhir.nhs.uk/StructureDefinition/GPConnect-StructuredRecord-Bundle-1'] },
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: 'nhs_9449305582',
              identifier: [{ system: 'https://fhir.nhs.uk/Id/nhs-number', value: '9449305582' }],
              name: [{ family: 'Smith', given: ['John'] }]
            }
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs_tb_1',
              status: 'final',
              code: { coding: [{ system: 'http://loinc.org', code: '29308-4', display: 'Mycobacterium tuberculosis stimulated interferon-gamma release' }] },
              valueCodeableConcept: { coding: [{ system: 'http://snomed.info/sct', code: '10828004', display: 'Positive' }] }
            }
          }
        ]
      }
    }
  ],
  japan: [
    {
      id: 'pmda_reviews',
      name: 'PMDA Drug Safety & Review Reports API',
      authority: 'PMDA (Pharmaceuticals and Medical Devices Agency)',
      country: 'Japan',
      endpointTemplate: 'https://www.pmda.go.jp/api/v1/drugs/reviews?code={rxnormCode}',
      documentationUrl: 'https://www.pmda.go.jp/english/index.html',
      authType: 'SandboxNoAuth',
      schemas: {
        request: 'GET /api/v1/drugs/reviews?code=1148805',
        response: `{ "status": "approved", "review_summary_ja": "関節リウマチ、クローン病治療薬としての...", "english_review_url": "..." }`
      },
      sampleQuery: 'GET /api/v1/drugs/reviews?code=1148805',
      mockResponse: {
        drugName: 'Infliximab (Genetical Recombination)',
        approvals: [
          {
            date: '2002-01-24',
            indication: 'Rheumatoid Arthritis, Crohn\'s Disease, Ulcerative Colitis',
            warningBox: 'Tuberculosis, severe infections, interstitial pneumonia warning required'
          }
        ],
        adverseEventRates: {
          tuberculosisReactivation: '0.12%',
          infusionReaction: '4.8%'
        }
      }
    }
  ],
  china: [
    {
      id: 'nhc_ehr',
      name: 'NHC Electronic Health Record Vocabulary Bridge',
      authority: 'National Health Commission (NHC)',
      country: 'China',
      endpointTemplate: 'https://api.nhc.gov.cn/v2/vocab/icd10-mapping',
      documentationUrl: 'http://www.nhc.gov.cn/',
      authType: 'APIKey',
      schemas: {
        request: `{ "query": "急性阑尾炎" }`,
        response: `{ "icd10": "K35.80", "standardName": "急性阑尾炎伴局限性腹膜炎" }`
      },
      sampleQuery: 'POST /v2/vocab/icd10-mapping',
      mockResponse: {
        query: '急性阑尾炎',
        mappedCode: 'K35.80',
        standardChineseName: '急性阑尾炎 (Acute appendicitis)',
        tcmOntologyMapping: {
          tcmPattern: '肠痈 (Chang Yong - Intestinal abscess)',
          tcmHerbs: ['Da Huang', 'Mang Xiao', 'Dong Gua Ren']
        }
      }
    }
  ]
};

export function getRegionalMedicalRegistry(region: string): RegionalApiMetadata[] {
  return REGIONAL_APIS[region.toLowerCase()] || [];
}

export function simulateRegionalApiCall(apiId: string, region: string): { success: boolean; url: string; response: any } {
  const apis = getRegionalMedicalRegistry(region);
  const api = apis.find(a => a.id === apiId);
  if (!api) {
    return {
      success: false,
      url: '',
      response: { error: `API with ID ${apiId} not found in region ${region}` }
    };
  }
  return {
    success: true,
    url: api.endpointTemplate,
    response: api.mockResponse
  };
}
