import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Archive, ExternalLink, Filter } from 'lucide-react';
import { Link } from 'wouter';
import { ThreatIntelligence } from '@shared/threat-sources';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function ThreatArchivePage() {
  const [archivedThreats, setArchivedThreats] = useState<ThreatIntelligence[]>([]);
  const [filteredThreats, setFilteredThreats] = useState<ThreatIntelligence[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('90days');
  const { toast } = useToast();

  useEffect(() => {
    loadArchivedThreats();
  }, []);

  useEffect(() => {
    filterThreats();
  }, [archivedThreats, searchTerm, selectedSource, selectedSeverity, selectedTimeframe]);

  const loadArchivedThreats = () => {
    try {
      // Get all threats from localStorage (or API in production)
      const allThreats = JSON.parse(localStorage.getItem('threatIntelligence') || '[]');
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      // Filter threats older than 30 days
      const archived = allThreats.filter((threat: ThreatIntelligence) => {
        const threatDate = new Date(threat.publishedDate);
        return threatDate < thirtyDaysAgo;
      });

      // Sort by date (newest first)
      archived.sort((a: ThreatIntelligence, b: ThreatIntelligence) => 
        new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
      );

      setArchivedThreats(archived);
    } catch (error) {
      console.error('Error loading archived threats:', error);
      toast({
        title: "Error",
        description: "Failed to load archived threats.",
        variant: "destructive",
      });
    }
  };

  const filterThreats = () => {
    let filtered = [...archivedThreats];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(threat => 
        threat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.cves.some(cve => cve.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(threat => threat.sourceId === selectedSource);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(threat => threat.severity === selectedSeverity);
    }

    // Timeframe filter
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedTimeframe) {
      case '90days':
        cutoffDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      case '6months':
        cutoffDate = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
        break;
      case '1year':
        cutoffDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        break;
      case 'all':
      default:
        cutoffDate = new Date(0); // Beginning of time
        break;
    }

    filtered = filtered.filter(threat => {
      const threatDate = new Date(threat.publishedDate);
      return threatDate >= cutoffDate;
    });

    setFilteredThreats(filtered);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUniqueValues = (field: keyof ThreatIntelligence) => {
    const values = new Set(archivedThreats.map(threat => threat[field]));
    return Array.from(values).filter(Boolean);
  };

  const restoreFromArchive = (threat: ThreatIntelligence) => {
    try {
      // Convert to use case format
      const useCase = {
        id: `archived_${threat.id}`,
        title: `[ARCHIVED] ${threat.title}`,
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
        createdAt: new Date().toISOString(),
        isArchived: true
      };

      // Store as use case
      const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      const updatedUseCases = [...existingUseCases, useCase];
      localStorage.setItem('useCases', JSON.stringify(updatedUseCases));

      toast({
        title: "Threat Restored",
        description: `${threat.title} has been restored as a use case for training development.`,
      });
    } catch (error) {
      console.error('Error restoring threat:', error);
      toast({
        title: "Error",
        description: "Failed to restore threat from archive.",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const inferCategory = (threat: ThreatIntelligence): string => {
    const text = `${threat.title} ${threat.description}`.toLowerCase();
    if (text.includes('kubernetes') || text.includes('cloud')) return 'cloud';
    if (text.includes('network') || text.includes('firewall')) return 'network';
    if (text.includes('identity') || text.includes('authentication')) return 'identity';
    return 'endpoint';
  };

  const extractTechnologies = (threat: ThreatIntelligence): string[] => {
    const text = `${threat.title} ${threat.description}`.toLowerCase();
    const techPatterns = ['kubernetes', 'docker', 'windows', 'linux', 'apache', 'nginx'];
    return techPatterns.filter(tech => text.includes(tech));
  };

  const extractVulnerabilityTypes = (threat: ThreatIntelligence): string[] => {
    const text = `${threat.title} ${threat.description}`.toLowerCase();
    const vulnPatterns = ['rce', 'sql injection', 'xss', 'csrf', 'privilege escalation'];
    return vulnPatterns.filter(vuln => text.includes(vuln));
  };

  const extractMitreTechniques = (threat: ThreatIntelligence): string[] => {
    return threat.tags.filter(tag => tag.startsWith('T'));
  };

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
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-gray-600" />
                <h1 className="text-xl font-semibold">Threat Intelligence Archive</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter archived threats by source, severity, timeframe, or search terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search threats, CVEs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Source</label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {getUniqueValues('sourceId').map(source => (
                      <SelectItem key={source as string} value={source as string}>
                        {(source as string).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Severity</label>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
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

              <div>
                <label className="text-sm font-medium mb-2 block">Timeframe</label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{archivedThreats.length}</div>
              <p className="text-sm text-gray-600">Total Archived</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredThreats.length}</div>
              <p className="text-sm text-gray-600">Filtered Results</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {archivedThreats.filter(t => t.severity === 'critical' || t.severity === 'high').length}
              </div>
              <p className="text-sm text-gray-600">High/Critical</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{getUniqueValues('sourceId').length}</div>
              <p className="text-sm text-gray-600">Sources</p>
            </CardContent>
          </Card>
        </div>

        {/* Threat List */}
        <div className="space-y-4">
          {filteredThreats.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No archived threats found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredThreats.map((threat) => (
              <Card key={threat.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{threat.title}</h3>
                        <Badge 
                          className={`text-white ${getSeverityColor(threat.severity)}`}
                        >
                          {threat.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {threat.sourceId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{threat.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(threat.publishedDate).toLocaleDateString()}
                        </div>
                        {threat.cves.length > 0 && (
                          <div>
                            CVEs: {threat.cves.slice(0, 3).map(cve => (
                              <Badge key={cve} variant="secondary" className="ml-1 text-xs">
                                {cve}
                              </Badge>
                            ))}
                            {threat.cves.length > 3 && (
                              <span className="text-xs text-gray-400 ml-1">
                                +{threat.cves.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {threat.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {threat.tags.slice(0, 5).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {threat.tags.length > 5 && (
                            <span className="text-xs text-gray-400">
                              +{threat.tags.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(threat.sourceUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => restoreFromArchive(threat)}
                      >
                        Restore
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}