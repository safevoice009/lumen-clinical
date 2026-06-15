import { CitationVerdict } from '../types/clinical';

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export interface CitationCheckResult {
  citation: string;
  found:    boolean;
  pmids:    string[];
  status:   'VERIFIED' | 'NOT_FOUND' | 'UNVERIFIABLE';
}

/**
 * checkClinicalCitation (Section 3.7)
 */
export async function checkClinicalCitation(
  doctorResponse: string,
): Promise<CitationCheckResult[]> {
  // Extract citation-like phrases from response
  const citationPatterns = [
    /according to (?:the )?([A-Z]{2,6}[\s\/][0-9]{4}[^\.,]{0,30})/gi,
    /([A-Z]{2,6}) (?:20[0-9]{2}|19[0-9]{2}) (?:guideline|guidance|trial|study)/gi,
    /(?:the )?([A-Z-]{3,10} trial)/gi,
  ];

  const citations: string[] = [];
  for (const pattern of citationPatterns) {
    const matches = [...doctorResponse.matchAll(pattern)];
    citations.push(...matches.map(m => m[1]));
  }

  const uniqueCitations = Array.from(new Set(citations));

  if (uniqueCitations.length === 0) return [];

  const results: CitationCheckResult[] = [];
  for (const citation of uniqueCitations.slice(0, 3)) { // Max 3 per turn to avoid rate limits
    try {
      const query = encodeURIComponent(citation);
      const res   = await fetch(
        `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${query}&retmax=3&retmode=json`
      );
      if (!res.ok) throw new Error('PubMed unreachable');
      const data = await res.json();
      const count = parseInt(data.esearchresult?.count ?? '0');
      results.push({
        citation,
        found:  count > 0,
        pmids:  data.esearchresult?.idlist ?? [],
        status: count > 0 ? 'VERIFIED' : 'NOT_FOUND',
      });
    } catch {
      results.push({ citation, found: false, pmids: [], status: 'UNVERIFIABLE' });
    }
  }
  return results;
}

/**
 * verifyClinicalCitation (Compatibility with agentCore.ts)
 */
export async function verifyClinicalCitation(claim: string): Promise<CitationVerdict[]> {
  const checkResults = await checkClinicalCitation(claim);
  return checkResults.map(r => ({
    verdict: r.status === 'VERIFIED' ? 'VERIFIED' : r.status === 'NOT_FOUND' ? 'HALLUCINATED' : 'UNVERIFIABLE',
    scoreImpact: r.status === 'NOT_FOUND' ? -15 : r.status === 'VERIFIED' ? 5 : 0,
    citationPhrase: r.citation,
    pubmedId: r.pmids[0]
  }));
}
