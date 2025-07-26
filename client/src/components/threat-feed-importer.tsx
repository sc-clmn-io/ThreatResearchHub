import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, Download, AlertTriangle, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ThreatReport {
  id: string;
  title: string;
  url: string;
  source: 'Unit42' | 'CISA' | 'RecordedFuture' | 'Wiz' | 'Datadog' | 'Custom';
  severity: 'critical' | 'high' | 'medium' | 'low';
  publishedDate: string;
  cves: string[];
  technologies: string[];
  vulnerabilityTypes: string[];
  summary: string;
  cvssScore?: number;
  exploitAvailable: boolean;
}

interface ThreatFeedImporterProps {
  onImport: (threatReport: ThreatReport) => void;
  onCancel: () => void;
}

// Sample threat feed data - this would come from actual threat intelligence feeds
const sampleThreats: ThreatReport[] = [
  {
    id: "threat_2025_001",
    title: "CVE-2025-1974: The IngressNightmare in Kubernetes",
    url: "https://unit42.paloaltonetworks.com/kubernetes-ingress-nightmare",
    source: "Unit42",
    severity: "critical",
    publishedDate: "2025-01-26",
    cves: ["CVE-2025-1974"],
    technologies: ["Kubernetes", "Docker", "Container Orchestration"],
    vulnerabilityTypes: ["Remote Code Execution", "Privilege Escalation"],
    summary: "Critical remote code execution vulnerability in Kubernetes Ingress controllers allowing attackers to execute arbitrary code on clusters through malicious ingress configurations.",
    cvssScore: 9.8,
    exploitAvailable: true
  },
  {
    id: "threat_2025_002", 
    title: "Supply Chain Attack Targeting Node.js Packages",
    url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa25-026a",
    source: "CISA",
    severity: "high",
    publishedDate: "2025-01-25",
    cves: ["CVE-2025-1842", "CVE-2025-1843"],
    technologies: ["Node.js", "npm", "JavaScript"],
    vulnerabilityTypes: ["Supply Chain", "Code Injection"],
    summary: "Sophisticated supply chain attack compromising popular Node.js packages used in enterprise applications, allowing attackers to inject malicious code into production systems.",
    cvssScore: 8.4,
    exploitAvailable: true
  },
  {
    id: "threat_2025_003",
    title: "Microsoft Exchange Zero-Day Under Active Attack",
    url: "https://www.recordedfuture.com/exchange-zero-day-exploitation",
    source: "RecordedFuture", 
    severity: "critical",
    publishedDate: "2025-01-24",
    cves: ["CVE-2025-1756"],
    technologies: ["Microsoft Exchange", "Email Security", "Windows Server"],
    vulnerabilityTypes: ["Zero-Day", "Remote Code Execution"],
    summary: "Active exploitation of Microsoft Exchange zero-day vulnerability enabling remote code execution and potential data exfiltration from email systems.",
    cvssScore: 9.6,
    exploitAvailable: true
  },
  {
    id: "threat_2025_004",
    title: "VMware vCenter Authentication Bypass Exploitation",
    url: "https://www.wiz.io/blog/vmware-vcenter-bypass-vulnerability",
    source: "Wiz",
    severity: "high", 
    publishedDate: "2025-01-23",
    cves: ["CVE-2025-1691"],
    technologies: ["VMware vCenter", "Virtualization", "Infrastructure"],
    vulnerabilityTypes: ["Authentication Bypass", "Privilege Escalation"],
    summary: "Authentication bypass vulnerability in VMware vCenter allowing attackers to gain administrative access to virtualization infrastructure without valid credentials.",
    cvssScore: 8.8,
    exploitAvailable: false
  },
  {
    id: "threat_2025_005",
    title: "Critical Docker Runtime Escape Vulnerability",
    url: "https://www.datadoghq.com/blog/docker-runtime-escape-cve",
    source: "Datadog",
    severity: "critical",
    publishedDate: "2025-01-22",
    cves: ["CVE-2025-1623"],
    technologies: ["Docker", "Container Runtime", "Linux"],
    vulnerabilityTypes: ["Container Escape", "Privilege Escalation"],
    summary: "Critical vulnerability in Docker runtime allowing containers to escape isolation and gain root access to host systems, compromising container security boundaries.",
    cvssScore: 9.2,
    exploitAvailable: true
  }
];

export function ThreatFeedImporter({ onImport, onCancel }: ThreatFeedImporterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const filteredThreats = sampleThreats.filter(threat => {
    const matchesSearch = threat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         threat.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         threat.cves.some(cve => cve.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSource = selectedSource === 'all' || threat.source === selectedSource;
    const matchesSeverity = selectedSeverity === 'all' || threat.severity === selectedSeverity;
    
    return matchesSearch && matchesSource && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Unit42': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CISA': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'RecordedFuture': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Wiz': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'Datadog': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Import Threat Feed Report as Customer POV Use Case
          </CardTitle>
          <CardDescription>
            Browse current threat intelligence feeds and import a report to automatically generate a Customer POV use case with relevant security content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, CVE, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="Unit42">Unit42</SelectItem>
                  <SelectItem value="CISA">CISA</SelectItem>
                  <SelectItem value="RecordedFuture">Recorded Future</SelectItem>
                  <SelectItem value="Wiz">Wiz</SelectItem>
                  <SelectItem value="Datadog">Datadog</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Threat Reports List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredThreats.map((threat) => (
              <Card key={threat.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{threat.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {threat.summary}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getSourceColor(threat.source)}>
                        {threat.source}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {threat.cves.map((cve) => (
                      <Badge key={cve} variant="outline" className="text-xs">
                        {cve}
                      </Badge>
                    ))}
                    {threat.technologies.slice(0, 3).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {threat.exploitAvailable && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Exploit Available
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Published: {threat.publishedDate}</span>
                      {threat.cvssScore && (
                        <span>CVSS: {threat.cvssScore}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(threat.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Report
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onImport(threat)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Import as POV Use Case
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredThreats.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No threat reports match your current filters.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}