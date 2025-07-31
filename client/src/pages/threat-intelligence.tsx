import { useState } from 'react';
import { ArrowLeft, Shield, Database, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ThreatIntelligenceManager from '@/components/threat-intelligence-manager';
import { ThreatIntelligence } from '@shared/threat-sources';
import { useToast } from '@/hooks/use-toast';

export default function ThreatIntelligencePage() {
  const [selectedThreat, setSelectedThreat] = useState<ThreatIntelligence | null>(null);
  const { toast } = useToast();

  const handleThreatSelected = (threat: ThreatIntelligence) => {
    setSelectedThreat(threat);
    
    // Convert threat to use case format and ingest
    const useCase = {
      id: `ti_${threat.id}`,
      title: threat.title,
      description: threat.description,
      category: inferCategory(threat),
      severity: threat.severity,
      cves: threat.cves,
      technologies: extractTechnologies(threat),
      vulnerabilityTypes: extractVulnerabilityTypes(threat),
      extractedTechniques: extractMitreTechniques(threat),
      source: threat.sourceId,
      url: threat.sourceUrl,
      confidence: threat.confidence,
      tlp: threat.tlp,
      createdAt: new Date().toISOString()
    };

    // Store as use case
    const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    const updatedUseCases = [...existingUseCases, useCase];
    localStorage.setItem('useCases', JSON.stringify(updatedUseCases));

    toast({
      title: "Threat Intelligence Ingested",
      description: `${threat.title} has been added as a use case for training development.`,
    });
  };

  const inferCategory = (threat: ThreatIntelligence): string => {
    const title = threat.title.toLowerCase();
    const description = threat.description.toLowerCase();
    const text = `${title} ${description}`;

    if (text.includes('kubernetes') || text.includes('container') || text.includes('docker') || text.includes('cloud')) {
      return 'cloud';
    } else if (text.includes('network') || text.includes('firewall') || text.includes('dns') || text.includes('routing')) {
      return 'network';
    } else if (text.includes('endpoint') || text.includes('windows') || text.includes('linux') || text.includes('malware')) {
      return 'endpoint';
    } else if (text.includes('identity') || text.includes('authentication') || text.includes('active directory') || text.includes('oauth')) {
      return 'identity';
    }
    
    return 'endpoint'; // Default category
  };

  const extractTechnologies = (threat: ThreatIntelligence): string[] => {
    const technologies = new Set<string>();
    const text = `${threat.title} ${threat.description}`.toLowerCase();

    // Common technology patterns
    const techPatterns = [
      'kubernetes', 'docker', 'containers', 'azure', 'aws', 'gcp',
      'windows', 'linux', 'macos', 'apache', 'nginx', 'iis',
      'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'java', 'python', 'nodejs', '.net', 'php', 'ruby',
      'active directory', 'ldap', 'oauth', 'saml', 'jwt'
    ];

    techPatterns.forEach(pattern => {
      if (text.includes(pattern)) {
        technologies.add(pattern);
      }
    });

    // Extract from tags
    threat.tags.forEach(tag => {
      if (tag.length > 2 && !tag.includes('malware') && !tag.includes('vulnerability')) {
        technologies.add(tag.toLowerCase());
      }
    });

    return Array.from(technologies);
  };

  const extractVulnerabilityTypes = (threat: ThreatIntelligence): string[] => {
    const vulnTypes = new Set<string>();
    const text = `${threat.title} ${threat.description}`.toLowerCase();

    const vulnPatterns = [
      { pattern: 'remote code execution', type: 'Remote Code Execution' },
      { pattern: 'sql injection', type: 'SQL Injection' },
      { pattern: 'cross-site scripting', type: 'Cross-Site Scripting' },
      { pattern: 'privilege escalation', type: 'Privilege Escalation' },
      { pattern: 'authentication bypass', type: 'Authentication Bypass' },
      { pattern: 'buffer overflow', type: 'Buffer Overflow' },
      { pattern: 'denial of service', type: 'Denial of Service' },
      { pattern: 'information disclosure', type: 'Information Disclosure' },
      { pattern: 'container escape', type: 'Container Escape' },
      { pattern: 'supply chain', type: 'Supply Chain Attack' }
    ];

    vulnPatterns.forEach(({ pattern, type }) => {
      if (text.includes(pattern)) {
        vulnTypes.add(type);
      }
    });

    return Array.from(vulnTypes);
  };

  const extractMitreTechniques = (threat: ThreatIntelligence): string[] => {
    const techniques = new Set<string>();
    const text = `${threat.title} ${threat.description}`.toLowerCase();

    // Common MITRE ATT&CK technique patterns
    const techniquePatterns = [
      { pattern: 'exploit', technique: 'T1068' }, // Exploitation for Privilege Escalation
      { pattern: 'container', technique: 'T1611' }, // Escape to Host
      { pattern: 'credential', technique: 'T1110' }, // Brute Force
      { pattern: 'phishing', technique: 'T1566' }, // Phishing
      { pattern: 'malware', technique: 'T1204' }, // User Execution
      { pattern: 'lateral movement', technique: 'T1021' }, // Remote Services
      { pattern: 'persistence', technique: 'T1053' }, // Scheduled Task/Job
      { pattern: 'command execution', technique: 'T1059' }, // Command and Scripting Interpreter
      { pattern: 'data exfiltration', technique: 'T1041' }, // Exfiltration Over C2 Channel
      { pattern: 'supply chain', technique: 'T1195' } // Supply Chain Compromise
    ];

    techniquePatterns.forEach(({ pattern, technique }) => {
      if (text.includes(pattern)) {
        techniques.add(technique);
      }
    });

    return Array.from(techniques);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Shield className="text-blue-600 text-2xl mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Threat Intelligence
                  </h1>
                  <p className="text-sm text-gray-600">
                    Advanced threat source integrations and real-time intelligence feeds
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-blue-50 rounded-full px-3 py-1">
                <Database className="text-blue-600 mr-2 h-4 w-4" />
                <span className="text-sm font-medium text-blue-800">Intelligence Analyst</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ThreatIntelligenceManager onThreatSelected={handleThreatSelected} />
      </div>
    </div>
  );
}