import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Calendar, Download, ExternalLink, Filter, Search, Zap, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';

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

// Generate threat reports for the last 30 days - these would come from real feeds
const generateLast30DaysThreats = (): ThreatReport[] => {
  const threats: ThreatReport[] = [];
  const today = new Date();
  const generatedTitles = new Set<string>(); // Track generated titles to prevent duplicates
  
  // Generate threats for the last 30 days with realistic distribution
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Add 1-3 threats per day with varying severity
    const threatsPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < threatsPerDay; j++) {
      // Only generate high and critical threats as per filtering requirement
      const severity = ['critical', 'high'][Math.floor(Math.random() * 2)] as 'critical' | 'high';
      const sources = ['Unit42', 'CISA', 'RecordedFuture', 'Wiz', 'Datadog'] as const;
      const source = sources[Math.floor(Math.random() * sources.length)];
      
      // Generate unique title with source prefix to prevent exact matches
      let title: string;
      let attempts = 0;
      do {
        title = generateThreatTitle(severity, i + attempts);
        attempts++;
      } while (generatedTitles.has(title) && attempts < 10);
      
      // Skip if we couldn't generate unique title after 10 attempts
      if (generatedTitles.has(title)) continue;
      
      generatedTitles.add(title);
      const threatId = `threat_${date.getTime()}_${j}_${source}`;
      
      threats.push({
        id: threatId,
        title,
        url: generateThreatUrl(source, ''),
        source,
        severity,
        publishedDate: dateStr,
        cves: generateCVEs(),
        technologies: generateTechnologies(),
        vulnerabilityTypes: generateVulnTypes(),
        summary: generateSummary(severity),
        cvssScore: generateCVSSScore(severity),
        exploitAvailable: Math.random() > 0.7
      });
    }
  }
  
  return threats.sort((a, b) => {
    // First sort by severity
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Then by date (newest first)
    return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
  });
};

function generateThreatTitle(severity: string, daysAgo: number): string {
  const criticalTitles = [
    'CVE-2025-1974: The IngressNightmare in Kubernetes',
    'Critical Apache Struts RCE Vulnerability Exploited',
    'Microsoft Exchange Zero-Day Under Active Attack',
    'VMware vCenter Authentication Bypass Exploitation',
    'Critical Docker Runtime Escape Vulnerability'
  ];
  
  const highTitles = [
    'Supply Chain Attack Targeting Node.js Packages',
    'Privilege Escalation in Linux Kernel Components',
    'SQL Injection in Popular WordPress Plugin',
    'Cross-Site Scripting in Enterprise Applications',
    'Authentication Bypass in Cloud Services'
  ];
  
  const mediumTitles = [
    'Information Disclosure in API Endpoints',
    'Directory Traversal in Web Frameworks',
    'Denial of Service in Network Components',
    'Weak Cryptography Implementation Found',
    'Session Management Vulnerability Disclosed'
  ];
  
  const lowTitles = [
    'Minor Configuration Issue in Default Settings',
    'Low-Impact Buffer Overflow Discovered',
    'Informational Security Advisory Released',
    'Best Practice Guidance for Secure Deployment',
    'Security Hardening Recommendations Published'
  ];
  
  let titles;
  switch (severity) {
    case 'critical': titles = criticalTitles; break;
    case 'high': titles = highTitles; break;
    case 'medium': titles = mediumTitles; break;
    default: titles = lowTitles;
  }
  
  return titles[Math.floor(Math.random() * titles.length)];
}

function generateThreatUrl(source: string, id: string): string {
  // Generate realistic URLs that users can actually visit for reference
  const baseUrls = {
    'Unit42': 'https://unit42.paloaltonetworks.com/',
    'CISA': 'https://www.cisa.gov/news-events/cybersecurity-advisories',
    'RecordedFuture': 'https://www.recordedfuture.com/research',
    'Wiz': 'https://www.wiz.io/blog',
    'Datadog': 'https://www.datadoghq.com/blog/'
  };
  return baseUrls[source as keyof typeof baseUrls] || 'https://nvd.nist.gov/vuln/search';
}

function generateCVEs(): string[] {
  const count = Math.floor(Math.random() * 3) + 1;
  const cves = [];
  for (let i = 0; i < count; i++) {
    const year = 2025;
    const number = Math.floor(Math.random() * 9999) + 1;
    cves.push(`CVE-${year}-${number.toString().padStart(4, '0')}`);
  }
  return cves;
}

function generateTechnologies(): string[] {
  const allTech = [
    'Kubernetes', 'Docker', 'Apache Struts', 'Microsoft Exchange', 'VMware vCenter',
    'Linux Kernel', 'Node.js', 'WordPress', 'Java', 'Python', 'NGINX', 'Apache',
    'PostgreSQL', 'MySQL', 'Redis', 'MongoDB', 'AWS', 'Azure', 'GCP'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1;
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    const tech = allTech[Math.floor(Math.random() * allTech.length)];
    if (!selected.includes(tech)) {
      selected.push(tech);
    }
  }
  return selected;
}

function generateVulnTypes(): string[] {
  const types = [
    'Remote Code Execution', 'Privilege Escalation', 'SQL Injection',
    'Cross-Site Scripting', 'Authentication Bypass', 'Information Disclosure',
    'Denial of Service', 'Directory Traversal', 'Supply Chain Attack',
    'Zero-Day', 'Buffer Overflow', 'Injection'
  ];
  
  const count = Math.floor(Math.random() * 2) + 1;
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    if (!selected.includes(type)) {
      selected.push(type);
    }
  }
  return selected;
}

function generateSummary(severity: string): string {
  const summaries = {
    critical: [
      'Critical vulnerability with active exploitation in the wild',
      'Unauthenticated remote code execution leading to full system compromise',
      'Zero-day vulnerability being actively exploited by threat actors'
    ],
    high: [
      'High-severity vulnerability with proof-of-concept available',
      'Privilege escalation vulnerability affecting multiple systems',
      'Authentication bypass allowing unauthorized access'
    ],
    medium: [
      'Medium-severity vulnerability requiring user interaction',
      'Information disclosure vulnerability with limited impact',
      'Denial of service vulnerability affecting availability'
    ],
    low: [
      'Low-severity vulnerability with minimal security impact',
      'Configuration issue requiring administrative access',
      'Minor information leak with limited exposure'
    ]
  };
  
  const options = summaries[severity as keyof typeof summaries] || summaries.low;
  return options[Math.floor(Math.random() * options.length)];
}

function generateCVSSScore(severity: string): number {
  switch (severity) {
    case 'critical': return Math.random() * 1 + 9; // 9.0-10.0
    case 'high': return Math.random() * 2 + 7; // 7.0-9.0
    case 'medium': return Math.random() * 3 + 4; // 4.0-7.0
    default: return Math.random() * 4; // 0.0-4.0
  }
}

const mockThreatReports = generateLast30DaysThreats();

export default function ThreatFeeds() {
  const [threats, setThreats] = useState<ThreatReport[]>(mockThreatReports);
  const [filteredThreats, setFilteredThreats] = useState<ThreatReport[]>(mockThreatReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [ingestingThreatId, setIngestingThreatId] = useState<string | null>(null);

  useEffect(() => {
    let filtered = threats;

    if (searchTerm) {
      filtered = filtered.filter(threat =>
        threat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.cves.some(cve => cve.toLowerCase().includes(searchTerm.toLowerCase())) ||
        threat.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(threat => threat.source === selectedSource);
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(threat => threat.severity === selectedSeverity);
    }

    // Sort by date (newest first) and then by severity
    filtered.sort((a, b) => {
      const dateCompare = new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    setFilteredThreats(filtered);
  }, [threats, searchTerm, selectedSource, selectedSeverity]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <Zap className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const cleanupDuplicates = () => {
    const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    const deduplicatedUseCases: any[] = [];
    const processed = new Set<number>();

    console.log('🧹 Cleaning up duplicates from', existingUseCases.length, 'use cases');

    existingUseCases.forEach((useCase: any, index: number) => {
      if (processed.has(index)) return;

      const merged = { 
        ...useCase, 
        sources: useCase.sources || [{ vendor: useCase.source, url: useCase.url || '', title: useCase.title }] 
      };

      // Find and merge all duplicates
      existingUseCases.forEach((otherCase: any, otherIndex: number) => {
        if (index === otherIndex || processed.has(otherIndex)) return;

        const hasSameCVE = useCase.cves?.length > 0 && otherCase.cves?.length > 0 && 
                          useCase.cves.some((cve: string) => otherCase.cves?.includes(cve));
        
        const titleNorm1 = useCase.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const titleNorm2 = otherCase.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const exactTitleMatch = titleNorm1 === titleNorm2;

        if (hasSameCVE || exactTitleMatch) {
          console.log('🔄 Found duplicate:', otherCase.title);
          
          const newSource = { 
            vendor: otherCase.source, 
            url: otherCase.url || '', 
            title: otherCase.title 
          };
          
          if (!merged.sources.some((s: any) => s.vendor === newSource.vendor)) {
            merged.sources.push(newSource);
          }
          
          processed.add(otherIndex);
        }
      });

      deduplicatedUseCases.push(merged);
      processed.add(index);
    });

    if (deduplicatedUseCases.length !== existingUseCases.length) {
      localStorage.setItem('useCases', JSON.stringify(deduplicatedUseCases));
      console.log(`✅ Cleaned up ${existingUseCases.length - deduplicatedUseCases.length} duplicate use cases`);
      alert(`Cleaned up ${existingUseCases.length - deduplicatedUseCases.length} duplicates. Page will refresh.`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      alert('No duplicates found to clean up.');
    }
  };

  const handleIngestThreat = async (threat: ThreatReport) => {
    setIngestingThreatId(threat.id);
    try {
      console.log('🔄 Starting threat ingestion:', threat.title);
      
      // Check for existing threats with same vendor and exact title match first
      const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      const existingReports = JSON.parse(localStorage.getItem('threatReports') || '[]');
      
      // Also check IndexedDB for a complete picture
      try {
        const { localStorage: idbStorage } = await import('@/lib/storage');
        const idbUseCases = await idbStorage.getUseCases();
        console.log('📊 IndexedDB use cases:', idbUseCases.length);
      } catch (idbError) {
        console.warn('⚠️ Could not check IndexedDB:', idbError);
      }
      
      console.log('📊 Current use cases:', existingUseCases.length);
      console.log('📊 Current reports:', existingReports.length);
      
      // Find existing threat by exact vendor match or CVE overlap
      const existingUseCase = existingUseCases.find((uc: any) => {
        // Check for same vendor with exact or very similar title
        const sameVendor = uc.source === threat.source || 
                          (uc.sources && uc.sources.some((s: any) => s.vendor === threat.source));
        
        // Strong CVE match - any overlapping CVEs
        const hasSameCVE = threat.cves.length > 0 && uc.cves?.length > 0 && 
                          threat.cves.some(cve => uc.cves?.includes(cve));
        
        // Normalize titles for comparison
        const threatTitleNorm = threat.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const ucTitleNorm = uc.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        
        // Exact title match (after normalization)
        const exactTitleMatch = threatTitleNorm === ucTitleNorm;
        
        // If same vendor and exact title, it's definitely a duplicate
        if (sameVendor && exactTitleMatch) {
          console.log('🚫 EXACT DUPLICATE from same vendor:', threat.source, '-', threat.title);
          alert(`⚠️ This exact threat from ${threat.source} is already in the system.`);
          return true;
        }
        
        // Similar title - check for significant word overlap (3+ chars) 
        const threatWords = threatTitleNorm.split(' ').filter((w: string) => w.length >= 3);
        const ucWords = ucTitleNorm.split(' ').filter((w: string) => w.length >= 3);
        const commonWords = threatWords.filter(word => ucWords.includes(word));
        const wordOverlap = commonWords.length >= Math.min(threatWords.length, ucWords.length) * 0.8; // Higher threshold
        
        // Check for key vulnerability identifiers in title
        const hasCommonVulnId = threatWords.some(word => 
          ucWords.includes(word) && (word.includes('cve') || word.includes('vuln') || word.length > 8) // Longer words only
        );
        
        const isMatch = hasSameCVE || exactTitleMatch || (wordOverlap && hasCommonVulnId);
        
        if (isMatch) {
          console.log('🔄 POTENTIAL DUPLICATE:', threat.title, 'matches', uc.title);
          console.log('  - Same vendor:', sameVendor);
          console.log('  - CVE match:', hasSameCVE);
          console.log('  - Exact title:', exactTitleMatch);
          console.log('  - Word overlap:', wordOverlap, `(${commonWords.length}/${Math.min(threatWords.length, ucWords.length)})`);
        }
        
        return isMatch;
      });

      if (existingUseCase) {
        console.log('🔄 Found existing use case, merging sources...');
        
        // Merge sources instead of creating duplicate
        const newSource = {
          vendor: threat.source,
          url: threat.url,
          title: threat.title
        };
        
        // Add new source if not already present
        const existingSources = existingUseCase.sources || [{ vendor: existingUseCase.source, url: existingUseCase.url || '', title: existingUseCase.title }];
        if (!existingSources.some((s: any) => s.vendor === threat.source)) {
          existingSources.push(newSource);
          existingUseCase.sources = existingSources;
          
          // Update the use case
          const updatedUseCases = existingUseCases.map((uc: any) => 
            uc.id === existingUseCase.id ? existingUseCase : uc
          );
          localStorage.setItem('useCases', JSON.stringify(updatedUseCases));
          console.log('✅ Successfully merged sources');
          
          alert(`✅ Updated existing threat with new source: ${threat.title}

📊 Category: ${existingUseCase.category}
🔥 Severity: ${existingUseCase.severity.toUpperCase()}
🛡️ CVEs: ${existingUseCase.cves.join(', ')}
⚙️ Technologies: ${existingUseCase.technologies.join(', ')}
📰 Sources: ${existingSources.map((s: any) => s.vendor).join(', ')}

Multiple research vendors are now tracking this threat. Redirecting to dashboard...`);
          
          // Navigate to dashboard after updating
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          return;
        } else {
          console.log('ℹ️ Threat already exists from this vendor');
          alert(`ℹ️ This threat from ${threat.source} is already tracked in the system.`);
          return;
        }
      }

      console.log('🆕 Creating new threat use case...');
      
      // Create new threat report with source information
      const threatReport = {
        id: `report_${Date.now()}`,
        title: threat.title,
        url: threat.url,
        content: `${threat.summary}. 

CVE Details: ${threat.cves.join(', ')}
Technologies Affected: ${threat.technologies.join(', ')}
Vulnerability Types: ${threat.vulnerabilityTypes.join(', ')}
CVSS Score: ${threat.cvssScore || 'N/A'}
Exploit Available: ${threat.exploitAvailable ? 'Yes' : 'No'}
Source: ${threat.source}
Published: ${threat.publishedDate}

Technical Summary: This ${threat.severity} severity vulnerability affects ${threat.technologies.join(' and ')} systems. The attack vector involves ${threat.vulnerabilityTypes.join(' and ')} techniques. ${threat.exploitAvailable ? 'Active exploits are available in the wild.' : 'No public exploits are currently available.'}`
      };

      console.log('💾 Storing threat report...');
      // Store threat report
      const updatedReports = [threatReport, ...existingReports.filter((r: any) => r.url !== threat.url)];
      localStorage.setItem('threatReports', JSON.stringify(updatedReports));

      console.log('🎯 Determining category...');
      const category = determineCategory(threat.technologies);
      console.log('📂 Category determined:', category);

      // Generate contextual use case with source information
      const useCase = {
        id: `usecase_${Date.now()}`,
        title: threat.title,
        description: threatReport.content,
        category: category,
        severity: threat.severity,
        source: threat.source,
        sources: [{
          vendor: threat.source,
          url: threat.url,
          title: threat.title
        }],
        threatReportId: threatReport.id,
        cves: threat.cves,
        technologies: threat.technologies,
        vulnerabilityTypes: threat.vulnerabilityTypes,
        cvssScore: threat.cvssScore,
        exploitAvailable: threat.exploitAvailable,
        createdAt: new Date().toISOString()
      };

      console.log('💾 Storing use case...');
      
      // Store in both localStorage (for compatibility) and IndexedDB (for the display system)
      const updatedUseCases = [useCase, ...existingUseCases];
      localStorage.setItem('useCases', JSON.stringify(updatedUseCases));
      
      // Use the proper React hook for IndexedDB storage to ensure cache invalidation
      try {
        const { localStorage: idbStorage } = await import('@/lib/storage');
        const { useQueryClient } = await import('@tanstack/react-query');
        
        await idbStorage.saveUseCase(useCase);
        console.log('✅ Use case stored in IndexedDB successfully');
        
        // Force invalidate the cache to ensure immediate display
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('useCaseAdded', { detail: useCase }));
        }
        
      } catch (idbError) {
        console.warn('⚠️ Failed to save to IndexedDB, but localStorage saved:', idbError);
      }
      
      console.log('✅ Use case stored successfully. Total use cases:', updatedUseCases.length);

      // Show success message with details
      alert(`✅ Successfully ingested threat: ${threat.title}

📊 Category: ${useCase.category}
🔥 Severity: ${threat.severity.toUpperCase()}
🛡️ CVEs: ${threat.cves.join(', ')}
⚙️ Technologies: ${threat.technologies.join(', ')}

The use case has been created and is ready for Security Operations Workflow. 

🎯 Next Steps: You'll be redirected to the dashboard where you can:
• See your new use case in the list
• Click the purple "Workflow" button to start the end-to-end security operations pipeline
• Generate lab infrastructure, detection rules, playbooks, and dashboards`);

      console.log('🎉 Threat ingestion completed successfully!');
      console.log('📊 Total use cases after ingestion:', updatedUseCases.length);
      
      // Navigate back to dashboard after successful ingestion  
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard to view ingested use case...');
        window.location.href = '/';
      }, 1500); // Reduced delay for better UX
    } catch (error) {
      console.error('❌ Error ingesting threat:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`❌ Failed to ingest threat: ${threat.title}. Please check the console for details.`);
    } finally {
      setIngestingThreatId(null);
    }
  };

  function determineCategory(technologies: string[]): string {
    const techStr = technologies.join(' ').toLowerCase();
    
    if (techStr.includes('kubernetes') || techStr.includes('docker') || techStr.includes('container') || 
        techStr.includes('cloud') || techStr.includes('aws') || techStr.includes('azure') || techStr.includes('gcp')) {
      return 'cloud';
    }
    
    if (techStr.includes('windows') || techStr.includes('endpoint') || techStr.includes('agent') || 
        techStr.includes('workstation') || techStr.includes('desktop')) {
      return 'endpoint';
    }
    
    if (techStr.includes('network') || techStr.includes('firewall') || techStr.includes('router') || 
        techStr.includes('switch') || techStr.includes('proxy')) {
      return 'network';
    }
    
    return 'identity'; // Default fallback
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Threat Intelligence Feeds</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    High & Critical Only
                  </Badge>
                  <span className="text-xs text-gray-500">Filtering medium & low severity threats</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Last 30 days of threat reports from trusted sources, ranked by severity
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {filteredThreats.length} threats found
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cleanupDuplicates}
                className="text-xs"
              >
                Clean Duplicates
              </Button>
            </div>
          </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search threats, CVEs, or technologies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Sources</option>
          <option value="Unit42">Unit 42</option>
          <option value="CISA">CISA</option>
          <option value="RecordedFuture">Recorded Future</option>
          <option value="Wiz">Wiz</option>
          <option value="Custom">Custom</option>
        </select>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="high">High Only</option>
          <option value="medium">Medium Only</option>
          <option value="low">Low Only</option>
        </select>
        
        <select
          onChange={(e) => {
            const days = parseInt(e.target.value);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const filtered = mockThreatReports.filter(threat => 
              new Date(threat.publishedDate) >= cutoffDate
            );
            setFilteredThreats(filtered);
          }}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="30">Last 30 Days</option>
          <option value="7">Last 7 Days</option>
          <option value="3">Last 3 Days</option>
          <option value="1">Today Only</option>
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium">Critical</span>
              <span className="ml-auto text-lg font-bold">
                {filteredThreats.filter(t => t.severity === 'critical').length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              <span className="text-sm font-medium">High</span>
              <span className="ml-auto text-lg font-bold">
                {filteredThreats.filter(t => t.severity === 'high').length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">With Exploits</span>
              <span className="ml-auto text-lg font-bold">
                {filteredThreats.filter(t => t.exploitAvailable).length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">This Week</span>
              <span className="ml-auto text-lg font-bold">
                {filteredThreats.filter(t => {
                  const threatDate = new Date(t.publishedDate);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return threatDate >= weekAgo;
                }).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Reports List */}
      <div className="space-y-4">
        {filteredThreats.map((threat) => (
          <Card key={threat.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge 
                      className={`${getSeverityColor(threat.severity)} text-white flex items-center gap-1`}
                    >
                      {getSeverityIcon(threat.severity)}
                      {threat.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{threat.source}</Badge>
                    {threat.exploitAvailable && (
                      <Badge variant="destructive" className="text-xs">
                        EXPLOIT AVAILABLE
                      </Badge>
                    )}
                    {threat.cvssScore && (
                      <Badge variant="secondary">
                        CVSS {threat.cvssScore}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {threat.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-3 line-clamp-2">
                    {threat.summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {threat.cves.map((cve) => (
                      <Badge key={cve} variant="outline" className="text-xs">
                        {cve}
                      </Badge>
                    ))}
                    {threat.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(threat.publishedDate), 'MMM dd, yyyy')}
                    </span>
                    <span>{threat.vulnerabilityTypes.join(', ')}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    onClick={() => handleIngestThreat(threat)}
                    disabled={ingestingThreatId === threat.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {ingestingThreatId === threat.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Ingest
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(threat.url, '_blank')}
                    title={`View ${threat.source} threat intelligence`}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Source
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredThreats.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No threats found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
}