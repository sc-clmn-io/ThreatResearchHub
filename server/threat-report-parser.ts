import { ContentGenerationEngine, ThreatReport } from './content-generation-engine';
import { z } from 'zod';

// Schema for raw threat report input
export const RawThreatReportSchema = z.object({
  source: z.enum(['pdf', 'url', 'feed', 'manual']),
  content: z.string(),
  metadata: z.object({
    url: z.string().optional(),
    filename: z.string().optional(),
    feed_source: z.string().optional(),
    upload_date: z.string().optional()
  }).optional()
});

export type RawThreatReport = z.infer<typeof RawThreatReportSchema>;

// Complete threat report parser with normalization
export class ThreatReportParser {
  private contentEngine: ContentGenerationEngine;

  constructor() {
    this.contentEngine = ContentGenerationEngine.getInstance();
  }

  // Parse and normalize threat report from various sources
  async parseAndNormalize(rawReport: RawThreatReport): Promise<{
    normalized: ThreatReport;
    xqlRule: any;
    playbook: any;
    alertLayout: any;
    dashboard: any;
  }> {
    // Extract structured data from raw content
    const extractedData = this.extractStructuredData(rawReport);
    
    // Normalize to standard format
    const normalized = this.contentEngine.normalizeThreatReport(extractedData);
    
    // Generate XSIAM content packages
    const xqlRule = this.contentEngine.generateXQLCorrelationRule(normalized);
    const playbook = this.contentEngine.generateAutomationPlaybook(normalized);
    const alertLayout = this.contentEngine.generateAlertLayout(normalized);
    const dashboard = this.contentEngine.generateOperationalDashboard(normalized);

    return {
      normalized,
      xqlRule,
      playbook,
      alertLayout,
      dashboard
    };
  }

  // Extract structured data from raw content
  private extractStructuredData(rawReport: RawThreatReport): any {
    const content = rawReport.content.toLowerCase();
    
    return {
      id: this.generateId(),
      title: this.extractTitle(rawReport.content),
      description: this.extractDescription(rawReport.content),
      source: rawReport.metadata?.feed_source || rawReport.metadata?.url || 'manual',
      published_date: rawReport.metadata?.upload_date || new Date().toISOString(),
      raw_content: rawReport.content,
      
      // Extract technical indicators
      cves: this.extractCVEs(rawReport.content),
      mitre_techniques: this.extractMitreTechniques(rawReport.content),
      indicators: this.extractIndicators(rawReport.content),
      technologies: this.extractTechnologies(rawReport.content),
      threat_actors: this.extractThreatActors(rawReport.content),
      attack_vectors: this.extractAttackVectors(rawReport.content),
      
      // Classification
      severity: this.classifySeverity(rawReport.content),
      category: this.categorizeContent(rawReport.content)
    };
  }

  private generateId(): string {
    return 'threat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private extractTitle(content: string): string {
    // Try to find title patterns
    const titlePatterns = [
      /^#\s+(.+)$/m,           // Markdown title
      /^Title:\s*(.+)$/mi,     // Structured title
      /^(.{10,100})$/m         // First substantial line
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1].trim().length > 5) {
        return match[1].trim();
      }
    }

    // Extract from first paragraph
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      const clean = sentence.trim();
      if (clean.length > 20 && clean.length < 150) {
        return clean;
      }
    }

    return 'Threat Intelligence Report';
  }

  private extractDescription(content: string): string {
    // Find description patterns
    const descPatterns = [
      /description[:\s]+(.{50,500})/mi,
      /summary[:\s]+(.{50,500})/mi,
      /overview[:\s]+(.{50,500})/mi
    ];

    for (const pattern of descPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim().substring(0, 500);
      }
    }

    // Use first substantial paragraph
    const paragraphs = content.split(/\n\s*\n/);
    for (const para of paragraphs) {
      const clean = para.trim().replace(/\s+/g, ' ');
      if (clean.length > 100 && clean.length < 800) {
        return clean.substring(0, 500);
      }
    }

    return content.substring(0, 500);
  }

  private extractCVEs(content: string): string[] {
    const cvePattern = /CVE-\d{4}-\d{4,}/gi;
    const matches = content.match(cvePattern) || [];
    return Array.from(new Set(matches.map(cve => cve.toUpperCase())));
  }

  private extractMitreTechniques(content: string): string[] {
    const techniquePattern = /T\d{4}(\.\d{3})?/gi;
    const matches = content.match(techniquePattern) || [];
    return Array.from(new Set(matches.map(t => t.toUpperCase())));
  }

  private extractIndicators(content: string): {
    ips: string[];
    domains: string[];
    hashes: string[];
    file_paths: string[];
    urls: string[];
  } {
    // IP addresses (excluding common false positives)
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = Array.from(new Set(content.match(ipPattern) || []))
      .filter(ip => !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.'));

    // Domains
    const domainPattern = /\b[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}\b/g;
    const domains = Array.from(new Set(content.match(domainPattern) || []))
      .filter(domain => !domain.includes('example.') && !domain.includes('test.'));

    // Hashes (MD5, SHA1, SHA256, SHA512)
    const hashPattern = /\b[a-fA-F0-9]{32,128}\b/g;
    const hashes = Array.from(new Set(content.match(hashPattern) || []));

    // File paths
    const filePathPattern = /[A-Za-z]:\\[^<>:"|?*\s\n\r]{1,260}/g;
    const file_paths = Array.from(new Set(content.match(filePathPattern) || []));

    // URLs
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    const urls = Array.from(new Set(content.match(urlPattern) || []));

    return { ips, domains, hashes, file_paths, urls };
  }

  private extractTechnologies(content: string): string[] {
    const technologies = new Set<string>();
    const lowerContent = content.toLowerCase();

    // Operating Systems
    const osPatterns = ['windows', 'linux', 'macos', 'ubuntu', 'centos', 'rhel', 'android', 'ios'];
    osPatterns.forEach(os => {
      if (lowerContent.includes(os)) {
        technologies.add(os.charAt(0).toUpperCase() + os.slice(1));
      }
    });

    // Applications
    const appPatterns = [
      'microsoft office', 'outlook', 'excel', 'word', 'powerpoint',
      'adobe', 'acrobat', 'reader', 'chrome', 'firefox', 'internet explorer',
      'apache', 'nginx', 'iis', 'tomcat', 'mysql', 'postgresql', 'oracle',
      'active directory', 'exchange', 'sharepoint', 'teams', 'zoom'
    ];
    appPatterns.forEach(app => {
      if (lowerContent.includes(app)) {
        technologies.add(app.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '));
      }
    });

    // Cloud platforms
    const cloudPatterns = ['aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker'];
    cloudPatterns.forEach(cloud => {
      if (lowerContent.includes(cloud)) {
        technologies.add(cloud.toUpperCase());
      }
    });

    return Array.from(technologies);
  }

  private extractThreatActors(content: string): string[] {
    const actors = new Set<string>();

    // APT groups
    const aptPattern = /APT\d+/gi;
    const aptMatches = content.match(aptPattern) || [];
    aptMatches.forEach(apt => actors.add(apt.toUpperCase()));

    // Named threat actors
    const actorPatterns = [
      'lazarus group', 'cozy bear', 'fancy bear', 'carbanak', 'fin7', 'fin8',
      'equation group', 'shadow brokers', 'rocke', 'machete', 'oceanlotus',
      'kimsuky', 'mustang panda', 'sidewinder', 'turla', 'sandworm'
    ];

    actorPatterns.forEach(actor => {
      if (content.toLowerCase().includes(actor)) {
        actors.add(actor.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '));
      }
    });

    return Array.from(actors);
  }

  private extractAttackVectors(content: string): string[] {
    const vectors = new Set<string>();
    const lowerContent = content.toLowerCase();

    const vectorPatterns = {
      'email': 'Email Phishing',
      'phishing': 'Phishing Attack',
      'spear phishing': 'Spear Phishing',
      'malware': 'Malware Delivery',
      'ransomware': 'Ransomware',
      'trojan': 'Trojan Horse',
      'backdoor': 'Backdoor Access',
      'exploit': 'Vulnerability Exploitation',
      'zero-day': 'Zero-day Exploit',
      'brute force': 'Brute Force Attack',
      'credential stuffing': 'Credential Stuffing',
      'sql injection': 'SQL Injection',
      'xss': 'Cross-Site Scripting',
      'csrf': 'Cross-Site Request Forgery',
      'rce': 'Remote Code Execution',
      'privilege escalation': 'Privilege Escalation',
      'lateral movement': 'Lateral Movement',
      'data exfiltration': 'Data Exfiltration',
      'dns tunneling': 'DNS Tunneling',
      'watering hole': 'Watering Hole Attack',
      'supply chain': 'Supply Chain Attack'
    };

    for (const [pattern, vector] of Object.entries(vectorPatterns)) {
      if (lowerContent.includes(pattern)) {
        vectors.add(vector);
      }
    }

    return Array.from(vectors);
  }

  private classifySeverity(content: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const lowerContent = content.toLowerCase();
    
    // Critical indicators
    const criticalPatterns = [
      'critical', 'emergency', 'immediate', 'zero-day', 'rce', 'remote code execution',
      'privilege escalation', 'ransomware', 'data breach', 'cvss:10', 'cvss:9'
    ];
    
    // High severity indicators  
    const highPatterns = [
      'high', 'severe', 'dangerous', 'exploit', 'vulnerability', 'malware',
      'backdoor', 'trojan', 'cvss:8', 'cvss:7'
    ];
    
    // Medium severity indicators
    const mediumPatterns = [
      'medium', 'moderate', 'phishing', 'suspicious', 'cvss:6', 'cvss:5', 'cvss:4'
    ];

    for (const pattern of criticalPatterns) {
      if (lowerContent.includes(pattern)) return 'critical';
    }
    
    for (const pattern of highPatterns) {
      if (lowerContent.includes(pattern)) return 'high';
    }
    
    for (const pattern of mediumPatterns) {
      if (lowerContent.includes(pattern)) return 'medium';
    }

    return 'medium'; // Default to medium
  }

  private categorizeContent(content: string): 'endpoint' | 'network' | 'cloud' | 'identity' | 'web' | 'email' {
    const lowerContent = content.toLowerCase();
    
    // Email-related threats
    if (lowerContent.includes('email') || lowerContent.includes('phishing') || 
        lowerContent.includes('smtp') || lowerContent.includes('outlook')) {
      return 'email';
    }
    
    // Cloud-related threats
    if (lowerContent.includes('aws') || lowerContent.includes('azure') || 
        lowerContent.includes('cloud') || lowerContent.includes('kubernetes') ||
        lowerContent.includes('s3') || lowerContent.includes('lambda')) {
      return 'cloud';
    }
    
    // Identity-related threats
    if (lowerContent.includes('active directory') || lowerContent.includes('ldap') || 
        lowerContent.includes('authentication') || lowerContent.includes('kerberos') ||
        lowerContent.includes('credential') || lowerContent.includes('password')) {
      return 'identity';
    }
    
    // Network-related threats
    if (lowerContent.includes('network') || lowerContent.includes('firewall') || 
        lowerContent.includes('proxy') || lowerContent.includes('dns') ||
        lowerContent.includes('traffic') || lowerContent.includes('packet')) {
      return 'network';
    }
    
    // Web-related threats
    if (lowerContent.includes('web') || lowerContent.includes('http') || 
        lowerContent.includes('browser') || lowerContent.includes('javascript') ||
        lowerContent.includes('sql injection') || lowerContent.includes('xss')) {
      return 'web';
    }
    
    // Default to endpoint
    return 'endpoint';
  }

  // Export normalized threat report for external systems
  exportToSTIX2(normalized: ThreatReport): any {
    return {
      type: "bundle",
      id: `bundle--${normalized.id}`,
      spec_version: "2.1",
      objects: [
        {
          type: "threat-actor",
          id: `threat-actor--${normalized.id}`,
          created: normalized.published_date,
          modified: normalized.published_date,
          name: normalized.threat_actors[0] || "Unknown Actor",
          labels: ["crime-syndicate"]
        },
        {
          type: "attack-pattern",
          id: `attack-pattern--${normalized.id}`,
          created: normalized.published_date,
          modified: normalized.published_date,
          name: normalized.title,
          description: normalized.description,
          kill_chain_phases: normalized.mitre_attack.tactics.map(tactic => ({
            kill_chain_name: "mitre-attack",
            phase_name: tactic.toLowerCase().replace(/\s+/g, '-')
          }))
        },
        {
          type: "indicator",
          id: `indicator--${normalized.id}`,
          created: normalized.published_date,
          modified: normalized.published_date,
          pattern: this.buildSTIXPattern(normalized.indicators),
          labels: ["malicious-activity"]
        }
      ]
    };
  }

  private buildSTIXPattern(indicators: any): string {
    const patterns: string[] = [];
    
    indicators.ips.forEach((ip: string) => {
      patterns.push(`[ipv4-addr:value = '${ip}']`);
    });
    
    indicators.domains.forEach((domain: string) => {
      patterns.push(`[domain-name:value = '${domain}']`);
    });
    
    indicators.hashes.forEach((hash: string) => {
      const hashType = hash.length === 32 ? 'MD5' : hash.length === 40 ? 'SHA-1' : 'SHA-256';
      patterns.push(`[file:hashes.${hashType} = '${hash}']`);
    });

    return patterns.join(' OR ');
  }

  // Export use case template for training
  exportUseCase(normalized: ThreatReport, xqlRule: any, playbook: any): any {
    return {
      use_case_id: normalized.id,
      name: normalized.title,
      description: normalized.description,
      category: this.categorizeContent(normalized.description),
      severity: normalized.severity,
      
      // Training scenario details
      scenario: {
        threat_actor: normalized.threat_actors[0] || "Unknown",
        attack_vectors: normalized.attack_vectors,
        technologies_affected: normalized.technologies,
        indicators: normalized.indicators
      },
      
      // Detection content
      detection_rule: xqlRule,
      response_playbook: playbook,
      
      // Training objectives
      learning_objectives: [
        `Identify ${normalized.attack_vectors.join(' and ')} attacks`,
        `Understand ${normalized.technologies.join(', ')} security implications`,
        `Practice incident response for ${normalized.severity} severity threats`
      ],
      
      // Lab requirements
      lab_requirements: {
        systems: normalized.technologies,
        data_sources: xqlRule.data_sources,
        tools: ['SIEM/XSIAM', 'EDR', 'Network Monitoring'],
        duration_hours: normalized.severity === 'critical' ? 4 : 2
      },
      
      created_date: new Date().toISOString(),
      mitre_attack: normalized.mitre_attack
    };
  }
}