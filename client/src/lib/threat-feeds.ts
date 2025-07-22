export interface ThreatFeed {
  id: string;
  name: string;
  description: string;
  icon: string;
  endpoint?: string;
  requiresAuth: boolean;
}

export const threatFeeds: ThreatFeed[] = [
  {
    id: 'unit42',
    name: 'Unit 42',
    description: 'Latest threat intelligence from Palo Alto Networks',
    icon: 'fas fa-shield-alt',
    endpoint: 'https://unit42.paloaltonetworks.com/feed/',
    requiresAuth: false
  },
  {
    id: 'cisa',
    name: 'CISA Alerts',
    description: 'Government cybersecurity advisories and alerts',
    icon: 'fas fa-flag-usa',
    endpoint: 'https://www.cisa.gov/uscert/ncas/alerts.xml',
    requiresAuth: false
  },
  {
    id: 'recordedfuture',
    name: 'Recorded Future',
    description: 'Real-time threat intelligence',
    icon: 'fas fa-eye',
    requiresAuth: true
  },
  {
    id: 'wiz',
    name: 'Wiz Security',
    description: 'Cloud security threat reports',
    icon: 'fas fa-cloud',
    requiresAuth: true
  },
  {
    id: 'datadog',
    name: 'Datadog Security',
    description: 'Application and infrastructure security insights',
    icon: 'fas fa-dog',
    requiresAuth: true
  }
];

export interface ThreatFeedItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedDate: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  source: string;
}

export async function fetchThreatFeedData(feedId: string): Promise<ThreatFeedItem[]> {
  const feed = threatFeeds.find(f => f.id === feedId);
  if (!feed) {
    throw new Error(`Unknown threat feed: ${feedId}`);
  }

  try {
    switch (feedId) {
      case 'unit42':
        return await fetchUnit42Feed();
      case 'cisa':
        return await fetchCISAFeed();
      case 'recordedfuture':
        return await fetchRecordedFutureFeed();
      case 'wiz':
        return await fetchWizFeed();
      case 'datadog':
        return await fetchDatadogFeed();
      default:
        throw new Error(`Feed ${feedId} not implemented`);
    }
  } catch (error) {
    console.error(`Error fetching ${feedId} feed:`, error);
    throw new Error(`Failed to fetch ${feed.name} feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function fetchUnit42Feed(): Promise<ThreatFeedItem[]> {
  // For demo purposes, we'll use a mock implementation since Unit42 doesn't have a public API
  // In a real implementation, you would integrate with their actual feed
  const mockData: ThreatFeedItem[] = [
    {
      id: 'unit42-1',
      title: 'New Ransomware Campaign Targeting Healthcare',
      description: 'Analysis of a sophisticated ransomware operation targeting healthcare organizations with advanced lateral movement techniques.',
      url: 'https://unit42.paloaltonetworks.com/healthcare-ransomware-2024/',
      publishedDate: new Date('2024-01-15'),
      severity: 'critical',
      tags: ['ransomware', 'healthcare', 'lateral-movement'],
      source: 'unit42'
    },
    {
      id: 'unit42-2',
      title: 'Cloud Misconfigurations in Enterprise Environments',
      description: 'Common cloud security misconfigurations and their exploitation by threat actors.',
      url: 'https://unit42.paloaltonetworks.com/cloud-misconfig-2024/',
      publishedDate: new Date('2024-01-10'),
      severity: 'high',
      tags: ['cloud', 'misconfiguration', 'aws', 'azure'],
      source: 'unit42'
    }
  ];
  
  return mockData;
}

async function fetchCISAFeed(): Promise<ThreatFeedItem[]> {
  // Mock CISA feed data
  const mockData: ThreatFeedItem[] = [
    {
      id: 'cisa-1',
      title: 'CISA Alert: Critical Vulnerability in Network Devices',
      description: 'CISA urges organizations to patch critical vulnerabilities in widely-used network infrastructure devices.',
      url: 'https://www.cisa.gov/news-events/alerts/2024/01/15',
      publishedDate: new Date('2024-01-15'),
      severity: 'critical',
      tags: ['vulnerability', 'network-devices', 'patch'],
      source: 'cisa'
    }
  ];
  
  return mockData;
}

async function fetchRecordedFutureFeed(): Promise<ThreatFeedItem[]> {
  // Check for API key
  const apiKey = process.env.RECORDED_FUTURE_API_KEY || import.meta.env.VITE_RECORDED_FUTURE_API_KEY;
  if (!apiKey) {
    throw new Error('Recorded Future API key not configured');
  }
  
  // Mock implementation - replace with actual API call
  const mockData: ThreatFeedItem[] = [
    {
      id: 'rf-1',
      title: 'Emerging APT Group Activity',
      description: 'New advanced persistent threat group identified targeting financial institutions.',
      url: 'https://recordedfuture.com/threat-intel/apt-financial-2024',
      publishedDate: new Date('2024-01-14'),
      severity: 'high',
      tags: ['apt', 'financial', 'espionage'],
      source: 'recordedfuture'
    }
  ];
  
  return mockData;
}

async function fetchWizFeed(): Promise<ThreatFeedItem[]> {
  // Check for API key
  const apiKey = process.env.WIZ_API_KEY || import.meta.env.VITE_WIZ_API_KEY;
  if (!apiKey) {
    throw new Error('Wiz API key not configured');
  }
  
  // Mock implementation
  const mockData: ThreatFeedItem[] = [
    {
      id: 'wiz-1',
      title: 'Container Escape Techniques in Kubernetes',
      description: 'Analysis of container escape vectors and mitigation strategies in Kubernetes environments.',
      url: 'https://wiz.io/blog/kubernetes-container-escape-2024',
      publishedDate: new Date('2024-01-12'),
      severity: 'high',
      tags: ['kubernetes', 'container-security', 'escape'],
      source: 'wiz'
    }
  ];
  
  return mockData;
}

async function fetchDatadogFeed(): Promise<ThreatFeedItem[]> {
  // Check for API key
  const apiKey = process.env.DATADOG_API_KEY || import.meta.env.VITE_DATADOG_API_KEY;
  if (!apiKey) {
    throw new Error('Datadog API key not configured');
  }
  
  // Mock implementation
  const mockData: ThreatFeedItem[] = [
    {
      id: 'datadog-1',
      title: 'Application Layer DDoS Attacks',
      description: 'Detection and mitigation of sophisticated application layer DDoS attacks.',
      url: 'https://datadog.com/blog/app-layer-ddos-2024',
      publishedDate: new Date('2024-01-11'),
      severity: 'medium',
      tags: ['ddos', 'application-security', 'mitigation'],
      source: 'datadog'
    }
  ];
  
  return mockData;
}

export function extractUseCasesFromFeedItem(item: ThreatFeedItem): Array<{
  title: string;
  description: string;
  techniques: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
}> {
  // Map feed item to use case based on tags and content
  const categoryMapping: Record<string, 'endpoint' | 'network' | 'cloud' | 'identity'> = {
    'ransomware': 'endpoint',
    'malware': 'endpoint',
    'ddos': 'network',
    'network-devices': 'network',
    'cloud': 'cloud',
    'kubernetes': 'cloud',
    'aws': 'cloud',
    'azure': 'cloud',
    'phishing': 'identity',
    'apt': 'identity',
    'espionage': 'identity'
  };
  
  // Determine category based on tags
  let category: 'endpoint' | 'network' | 'cloud' | 'identity' = 'endpoint';
  for (const tag of item.tags) {
    if (categoryMapping[tag]) {
      category = categoryMapping[tag];
      break;
    }
  }
  
  return [{
    title: `${item.title} - Detection`,
    description: item.description,
    techniques: item.tags.slice(0, 5), // Use tags as technique indicators
    severity: item.severity,
    category
  }];
}
