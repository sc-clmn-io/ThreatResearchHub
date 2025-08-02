// Advanced threat intelligence source integrations
export interface ThreatSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'webhook' | 'csv' | 'json';
  url: string;
  apiKey?: string;
  headers?: Record<string, string>;
  parser: ThreatParser;
  updateInterval: number; // minutes
  enabled: boolean;
  lastUpdate?: string;
  authentication?: {
    type: 'bearer' | 'apikey' | 'basic' | 'oauth2';
    credentials: Record<string, string>;
  };
}

export interface ThreatParser {
  titleField: string;
  descriptionField: string;
  severityField: string;
  dateField: string;
  cveField?: string;
  tagsField?: string;
  urlField?: string;
  severityMapping?: Record<string, 'critical' | 'high' | 'medium' | 'low'>;
}

export interface ThreatIntelligence {
  id: string;
  sourceId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  publishedDate: string;
  cves: string[];
  tags: string[];
  sourceUrl: string;
  rawData: any;
  confidence: number; // 0-100
  tlp: 'white' | 'green' | 'amber' | 'red'; // Traffic Light Protocol
}

// Pre-configured threat intelligence sources
export const THREAT_SOURCES: ThreatSource[] = [
  {
    id: 'cisa-alerts',
    name: 'CISA Cybersecurity Alerts',
    type: 'rss',
    url: 'https://www.cisa.gov/cybersecurity-advisories/rss.xml',
    parser: {
      titleField: 'title',
      descriptionField: 'description',
      severityField: 'category',
      dateField: 'pubDate',
      urlField: 'link',
      severityMapping: {
        'Critical': 'critical',
        'High': 'high',
        'Medium': 'medium',
        'Low': 'low'
      }
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: true
  },
  {
    id: 'nvd-feeds',
    name: 'NIST NVD CVE Feed',
    type: 'api',
    url: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
    parser: {
      titleField: 'cve.id',
      descriptionField: 'cve.descriptions[0].value',
      severityField: 'cve.metrics.cvssMetricV31[0].baseSeverity',
      dateField: 'cve.published',
      cveField: 'cve.id',
      severityMapping: {
        'CRITICAL': 'critical',
        'HIGH': 'high',
        'MEDIUM': 'medium',
        'LOW': 'low'
      }
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: true
  },
  {
    id: 'mitre-attack',
    name: 'MITRE ATT&CK Techniques',
    type: 'api',
    url: 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json',
    parser: {
      titleField: 'name',
      descriptionField: 'description',
      severityField: 'x_mitre_impact_type',
      dateField: 'created',
      tagsField: 'x_mitre_tactics'
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: true
  },
  {
    id: 'sans-isc',
    name: 'SANS Internet Storm Center',
    type: 'rss',
    url: 'https://isc.sans.edu/rssfeed.xml',
    parser: {
      titleField: 'title',
      descriptionField: 'description',
      severityField: 'category',
      dateField: 'pubDate',
      urlField: 'link'
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: false // Temporarily disabled due to XML format issues
  },
  {
    id: 'threatpost',
    name: 'Threatpost Security News', 
    type: 'rss',
    url: 'https://krebsonsecurity.com/feed/',
    parser: {
      titleField: 'title',
      descriptionField: 'description',
      severityField: 'category',
      dateField: 'pubDate',
      urlField: 'link',
      tagsField: 'category'
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: false // Temporarily disabled due to XML format issues
  },
  {
    id: 'unit42-feed',
    name: 'Palo Alto Unit 42',
    type: 'rss',
    url: 'https://feeds.feedburner.com/Unit42',
    parser: {
      titleField: 'title',
      descriptionField: 'description',
      severityField: 'category',
      dateField: 'pubDate',
      urlField: 'link',
      tagsField: 'category'
    },
    updateInterval: 360,
    enabled: false // Temporarily disabled due to XML format issues
  },
  {
    id: 'crowdstrike-intel',
    name: 'CrowdStrike Threat Intelligence',
    type: 'api',
    url: 'https://api.crowdstrike.com/intel/combined/indicators/v1',
    authentication: {
      type: 'bearer',
      credentials: { token: 'YOUR_CROWDSTRIKE_API_KEY' }
    },
    parser: {
      titleField: 'indicator',
      descriptionField: 'labels',
      severityField: 'malicious_confidence',
      dateField: 'published_date',
      severityMapping: {
        'high': 'critical',
        'medium': 'high',
        'low': 'medium'
      }
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: false // Requires API key
  },
  {
    id: 'recordedfuture-api',
    name: 'Recorded Future Threat Feed',
    type: 'api',
    url: 'https://api.recordedfuture.com/v2/alert/search',
    authentication: {
      type: 'bearer',
      credentials: { token: 'YOUR_RECORDED_FUTURE_API_KEY' }
    },
    parser: {
      titleField: 'title',
      descriptionField: 'fragment',
      severityField: 'priority',
      dateField: 'published',
      severityMapping: {
        '1': 'critical',
        '2': 'high',
        '3': 'medium',
        '4': 'low'
      }
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: false // Requires API key
  },
  {
    id: 'alienvault-otx',
    name: 'AlienVault OTX',
    type: 'api',
    url: 'https://otx.alienvault.com/api/v1/pulses/subscribed',
    authentication: {
      type: 'apikey',
      credentials: { 'X-OTX-API-KEY': 'ALIENVAULT_API_KEY' }
    },
    parser: {
      titleField: 'name',
      descriptionField: 'description',
      severityField: 'tlp',
      dateField: 'created',
      tagsField: 'tags'
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: false // Requires API key
  },
  {
    id: 'virustotal-feed',
    name: 'VirusTotal Intelligence',
    type: 'api',
    url: 'https://www.virustotal.com/vtapi/v2/file/search',
    authentication: {
      type: 'apikey',
      credentials: { 'apikey': 'VIRUSTOTAL_API_KEY' }
    },
    parser: {
      titleField: 'md5',
      descriptionField: 'scan_date',
      severityField: 'positives',
      dateField: 'scan_date',
      severityMapping: {
        '0-5': 'low',
        '6-15': 'medium',
        '16-30': 'high',
        '31+': 'critical'
      }
    },
    updateInterval: 360, // 6 hours (4 times per day)
    enabled: false // Requires API key
  }
];

// STIX/TAXII integration support
export interface STIXSource extends ThreatSource {
  taxiiUrl: string;
  collections: string[];
  stixVersion: '2.0' | '2.1';
}

// Custom source configuration for enterprise environments
export interface CustomThreatSource extends ThreatSource {
  customFields: Record<string, string>;
  transformFunction?: string; // JavaScript function as string
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'format' | 'range' | 'enum';
  value?: string | string[] | { min: number; max: number };
}

// Intelligence confidence scoring
export const calculateConfidence = (source: ThreatSource, data: any): number => {
  let confidence = 50; // Base confidence
  
  // Source reliability scoring
  const sourceReliability = {
    'cisa-alerts': 95,
    'nvd-feeds': 90,
    'mitre-attack': 85,
    'sans-isc': 80,
    'unit42-feed': 85,
    'crowdstrike-intel': 90,
    'recordedfuture-api': 85,
    'alienvault-otx': 75,
    'virustotal-feed': 70
  };
  
  confidence = sourceReliability[source.id as keyof typeof sourceReliability] || confidence;
  
  // Data quality indicators
  if (data.cves && data.cves.length > 0) confidence += 10;
  if (data.severity === 'critical') confidence += 5;
  if (data.description && data.description.length > 100) confidence += 5;
  
  return Math.min(100, confidence);
};

// TLP (Traffic Light Protocol) classification
export const classifyTLP = (source: ThreatSource, data: any): 'white' | 'green' | 'amber' | 'red' => {
  // Public sources are generally TLP:WHITE
  const publicSources = ['cisa-alerts', 'nvd-feeds', 'sans-isc', 'threatpost', 'unit42-feed'];
  
  if (publicSources.includes(source.id)) return 'white';
  
  // Commercial feeds typically TLP:GREEN
  const commercialSources = ['crowdstrike-intel', 'recordedfuture-api'];
  if (commercialSources.includes(source.id)) return 'green';
  
  // Community sources TLP:GREEN
  if (source.id === 'alienvault-otx') return 'green';
  
  return 'white'; // Default to most permissive
};