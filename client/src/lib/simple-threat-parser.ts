// Simple but effective threat report parser
export interface SimpleDataSource {
  category: 'endpoint' | 'network' | 'cloud' | 'identity' | 'email' | 'web';
  type: string;
  vendor: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export interface SimpleThreatReport {
  title: string;
  description: string;
  cves: string[];
  technologies: string[];
  attackVectors: string[];
  dataSources: SimpleDataSource[];
  iocs: {
    domains: string[];
    ips: string[];
    hashes: string[];
    urls: string[];
  };
  confidence: number;
}

// Key data source patterns - simple but effective
const DATA_SOURCES = {
  'Windows Event Logs': { patterns: ['windows event', 'event log', 'security log'], vendor: 'Microsoft', category: 'endpoint' as const },
  'Sysmon': { patterns: ['sysmon', 'system monitor'], vendor: 'Microsoft', category: 'endpoint' as const },
  'AWS CloudTrail': { patterns: ['cloudtrail', 'aws api', 'aws logs'], vendor: 'AWS', category: 'cloud' as const },
  'Azure AD': { patterns: ['azure ad', 'azure active directory'], vendor: 'Microsoft', category: 'identity' as const },
  'Firewall Logs': { patterns: ['firewall', 'palo alto', 'cisco asa'], vendor: 'Various', category: 'network' as const },
  'Email Logs': { patterns: ['email', 'proofpoint', 'exchange'], vendor: 'Various', category: 'email' as const }
};

export function parseSimpleThreatReport(content: string, title: string = ""): SimpleThreatReport {
  const text = content.toLowerCase();
  
  // Extract CVEs
  const cveMatches = content.match(/CVE-\d{4}-\d{4,7}/gi) || [];
  
  // Extract IPs
  const ipMatches = content.match(/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g) || [];
  
  // Extract domains
  const domainMatches = content.match(/\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:[a-zA-Z]{2,})\b/g) || [];
  
  // Extract URLs
  const urlMatches = content.match(/https?:\/\/[^\s<>"']+/gi) || [];
  
  // Extract hashes (MD5, SHA1, SHA256)
  const hashMatches = content.match(/\b[a-fA-F0-9]{32,64}\b/g) || [];
  
  // Extract MITRE techniques
  const mitreMatches = content.match(/T\d{4}(?:\.\d{3})?/g) || [];
  
  // Detect data sources
  const detectedSources: SimpleDataSource[] = [];
  
  for (const [sourceName, config] of Object.entries(DATA_SOURCES)) {
    for (const pattern of config.patterns) {
      if (text.includes(pattern)) {
        let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
        let reason = `Mentioned in threat report`;
        
        // Determine priority based on context
        if (text.includes('critical') || text.includes('severe')) priority = 'critical';
        else if (text.includes('high') || text.includes('important')) priority = 'high';
        else if (text.includes('low') || text.includes('minor')) priority = 'low';
        
        // More specific reasons
        if (config.category === 'endpoint' && text.includes('malware')) {
          reason = 'Required for malware detection on endpoints';
        } else if (config.category === 'network' && text.includes('lateral movement')) {
          reason = 'Needed to track lateral movement across network';
        } else if (config.category === 'cloud' && text.includes('cloud')) {
          reason = 'Essential for cloud infrastructure monitoring';
        }
        
        detectedSources.push({
          category: config.category,
          type: sourceName,
          vendor: config.vendor,
          priority,
          reason
        });
        break; // Only add once per source type
      }
    }
  }
  
  // Extract basic technologies
  const technologies: string[] = [];
  const techPatterns = [
    'windows', 'linux', 'aws', 'azure', 'kubernetes', 'docker',
    'exchange', 'office 365', 'active directory', 'powershell'
  ];
  
  for (const tech of techPatterns) {
    if (text.includes(tech)) {
      technologies.push(tech);
    }
  }
  
  // Calculate confidence
  let confidence = 0;
  if (cveMatches.length > 0) confidence += 0.3;
  if (detectedSources.length > 0) confidence += 0.4;
  if (mitreMatches.length > 0) confidence += 0.2;
  if (ipMatches.length > 0 || domainMatches.length > 0) confidence += 0.1;
  
  return {
    title: title || "Threat Report",
    description: content.substring(0, 300) + "...",
    cves: Array.from(new Set(cveMatches)),
    technologies: Array.from(new Set(technologies)),
    attackVectors: Array.from(new Set(mitreMatches)),
    dataSources: detectedSources,
    iocs: {
      domains: Array.from(new Set(domainMatches.filter(d => !d.includes('example.com')))),
      ips: Array.from(new Set(ipMatches)),
      hashes: Array.from(new Set(hashMatches)),
      urls: Array.from(new Set(urlMatches))
    },
    confidence: Math.min(confidence, 1.0)
  };
}

// Convert to use case format
export function convertSimpleToUseCase(parsed: SimpleThreatReport, sourceDetails: any): any {
  // Infer category from data sources
  const categories = parsed.dataSources.map(ds => ds.category);
  const categoryCount: Record<string, number> = {};
  categories.forEach(cat => {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const primaryCategory = Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'endpoint';
  
  // Infer severity
  let severity = 'medium';
  if (parsed.cves.length > 2) severity = 'critical';
  else if (parsed.cves.length > 0) severity = 'high';
  else if (parsed.iocs.domains.length > 3 || parsed.iocs.ips.length > 3) severity = 'high';
  
  return {
    id: `usecase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: parsed.title,
    description: parsed.description,
    category: primaryCategory,
    severity,
    sourceType: 'threat_report',
    sourceDetails,
    cves: parsed.cves,
    technologies: parsed.technologies,
    attackVectors: parsed.attackVectors,
    threatActors: [],
    dataSources: parsed.dataSources.map(ds => ({
      category: ds.category,
      type: ds.type,
      fields: [], // Will be populated from schema
      priority: ds.priority,
      vendor: ds.vendor,
      integration_method: 'API' as const
    })),
    confidence: parsed.confidence,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}