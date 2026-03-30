import dotenv from 'dotenv';

dotenv.config();

const WHOISXML_API_KEY = process.env.WHOISXML_API_KEY;
const WHOISXML_ENDPOINT = 'https://subdomains.whoisxmlapi.com/api/v1';

export interface SubdomainRecord {
  domain: string;
}

export interface SubdomainResult {
  domain: string;
  total: number;
  subdomains: SubdomainRecord[];
}

/**
 * Fetches all subdomains for a given root domain via the WhoisXML Subdomain Lookup API.
 * Logic mirrors the Python reference script provided in the project brief.
 */
export async function getSubdomains(targetDomain: string): Promise<SubdomainResult | null> {
  if (!WHOISXML_API_KEY) {
    console.error('[WhoisXML] WHOISXML_API_KEY is not set in environment variables');
    return null;
  }

  const params = new URLSearchParams({
    apiKey: WHOISXML_API_KEY,
    domainName: targetDomain,
    outputFormat: 'json',
  });

  try {
    console.log(`[WhoisXML] Fetching subdomains for: ${targetDomain}`);

    const response = await fetch(`${WHOISXML_ENDPOINT}?${params.toString()}`);

    if (!response.ok) {
      console.error(`[WhoisXML] API error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`[WhoisXML] Response body: ${text}`);
      return null;
    }

    const data = await response.json() as Record<string, unknown>;

    // Parse subdomain list — mirrors the Python save_results() logic
    const subdomains: SubdomainRecord[] = [];

    if (
      data.result &&
      typeof data.result === 'object' &&
      'records' in (data.result as object)
    ) {
      // Standard WhoisXML Subdomain Lookup API format: data.result.records[].domain
      const records = (data.result as { records: { domain?: string }[] }).records;
      for (const record of records) {
        if (record.domain) {
          subdomains.push({ domain: record.domain });
        }
      }
    } else if (Array.isArray(data.subdomains)) {
      // Fallback: flat array format returned by some API versions
      for (const sub of data.subdomains as string[]) {
        subdomains.push({ domain: sub });
      }
    }

    return {
      domain: targetDomain,
      total: subdomains.length,
      subdomains,
    };
  } catch (error) {
    console.error('[WhoisXML] Unexpected error:', error);
    return null;
  }
}
