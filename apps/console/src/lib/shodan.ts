import dotenv from 'dotenv';

dotenv.config();

const SHODAN_API_KEY = process.env.SHODAN_API_KEY;
const SHODAN_BASE_URL = 'https://api.shodan.io';

export interface ShodanHostInfo {
  ip: string;
  city?: string;
  region_code?: string;
  country_name?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  hostnames?: string[];
  domains?: string[];
  ports?: number[];
  os?: string;
  isp?: string;
}

export async function getHostInfo(ip: string): Promise<ShodanHostInfo | null> {
  if (!SHODAN_API_KEY) {
    console.error('SHODAN_API_KEY is not set in environment variables');
    return null;
  }

  try {
    const response = await fetch(`${SHODAN_BASE_URL}/shodan/host/${ip}?key=${SHODAN_API_KEY}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Host ${ip} not found in Shodan`);
        return null;
      }
      throw new Error(`Shodan API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ShodanHostInfo;
  } catch (error) {
    console.error('Error fetching host info from Shodan:', error);
    return null;
  }
}

export async function getDomainInfo(domain: string) {
  if (!SHODAN_API_KEY) {
    console.error('SHODAN_API_KEY is not set in environment variables');
    return null;
  }

  try {
    const response = await fetch(`${SHODAN_BASE_URL}/dns/domain/${domain}?key=${SHODAN_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Shodan API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching domain info from Shodan:', error);
    return null;
  }
}

export async function resolveHostname(hostname: string): Promise<string | null> {
  if (!SHODAN_API_KEY) {
    console.error('SHODAN_API_KEY is not set in environment variables');
    return null;
  }

  try {
    // /dns/resolve takes a comma-separated list of hostnames
    const response = await fetch(`${SHODAN_BASE_URL}/dns/resolve?hostnames=${hostname}&key=${SHODAN_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Shodan API error: ${response.statusText}`);
    }

    const data = await response.json();
    // Shodan returns a map: { "api.kmitl.ac.th": "161.246.x.x" }
    // If it cannot be resolved, it returns { "hostname": null }
    return data[hostname] || null;
  } catch (error) {
    console.error('Error resolving hostname from Shodan:', error);
    return null;
  }
}
