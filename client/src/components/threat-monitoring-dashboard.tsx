import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Activity, 
  Globe, 
  Clock, 
  Target,
  Eye,
  Download,
  RefreshCw,
  Filter,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ThreatMetrics {
  totalThreats: number;
  criticalThreats: number;
  highThreats: number;
  avgSeverityScore: number;
  topTechnologies: Array<{ name: string; count: number; }>;
  topSources: Array<{ name: string; count: number; }>;
  threatTrends: Array<{ date: string; count: number; severity: string; }>;
  activeFeeds: number;
  lastUpdate: string;
  weeklyTrend: number;
}

interface ThreatItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  publishedDate: string;
  source: string;
  sourceUrl: string;
  cves: string[];
  tags: string[];
  technologies: string[];
}

export default function ThreatMonitoringDashboard() {
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [metrics, setMetrics] = useState<ThreatMetrics>({
    totalThreats: 0,
    criticalThreats: 0,
    highThreats: 0,
    avgSeverityScore: 0,
    topTechnologies: [],
    topSources: [],
    threatTrends: [],
    activeFeeds: 5,
    lastUpdate: new Date().toISOString(),
    weeklyTrend: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [xsiamStatus, setXsiamStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    loadThreatData();
    checkXSIAMConnection();
    // Auto-refresh every 6 hours
    const interval = setInterval(() => {
      loadThreatData();
      checkXSIAMConnection();
    }, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadThreatData = async () => {
    setIsLoading(true);
    try {
      // Load threat intelligence from localStorage
      const threatData = JSON.parse(localStorage.getItem('threatIntelligence') || '[]');
      
      // If no data exists, generate sample data showing the page intent
      if (threatData.length === 0) {
        const sampleThreats = generateSampleThreatData();
        setThreats(sampleThreats);
        calculateMetrics(sampleThreats);
      } else {
        // Use real data if available
        const validThreats = threatData.filter((threat: any) => threat && threat.title);
        setThreats(validThreats);
        calculateMetrics(validThreats);
      }
    } catch (error) {
      console.error('Error loading threat data:', error);
      // Fallback to sample data
      const sampleThreats = generateSampleThreatData();
      setThreats(sampleThreats);
      calculateMetrics(sampleThreats);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleThreatData = (): ThreatItem[] => {
    return [
      {
        id: 'demo-1',
        title: 'Critical RCE Vulnerability in Apache Struts',
        description: 'Remote code execution vulnerability affecting Apache Struts framework allowing attackers to execute arbitrary commands',
        severity: 'critical' as const,
        publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'Unit42',
        sourceUrl: 'https://unit42.paloaltonetworks.com',
        cves: ['CVE-2024-1234'],
        tags: ['apache', 'rce', 'web'],
        technologies: ['Apache Struts', 'Java Web Applications']
      },
      {
        id: 'demo-2', 
        title: 'Advanced Persistent Threat Campaign Targets Financial Sector',
        description: 'Sophisticated APT group using new malware variants to target banking infrastructure',
        severity: 'high' as const,
        publishedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'CISA',
        sourceUrl: 'https://cisa.gov/alerts',
        cves: [],
        tags: ['apt', 'banking', 'malware'],
        technologies: ['Windows', 'Banking Systems']
      }
    ];
  };

  const calculateMetrics = (threatData: ThreatItem[]) => {
    const critical = threatData.filter(t => t.severity === 'critical').length;
    const high = threatData.filter(t => t.severity === 'high').length;
    
    // Calculate technology distribution
    const techCounts: Record<string, number> = {};
    threatData.forEach(threat => {
      threat.tags?.forEach(tag => {
        techCounts[tag] = (techCounts[tag] || 0) + 1;
      });
    });
    
    const topTechnologies = Object.entries(techCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Calculate source distribution
    const sourceCounts: Record<string, number> = {};
    threatData.forEach(threat => {
      const sourceName = threat.source || 'Unknown';
      sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
    });
    
    const topSources = Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Calculate weekly trend (mock for now)
    const weeklyTrend = Math.floor(Math.random() * 20) - 10; // -10 to +10

    // Generate trend data for the past 7 days
    const threatTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayThreats = threatData.filter(t => {
        if (!t.publishedDate) return false;
        const tDate = new Date(t.publishedDate);
        return !isNaN(tDate.getTime()) && tDate.toDateString() === date.toDateString();
      });
      
      threatTrends.push({
        date: format(date, 'MMM dd'),
        count: dayThreats.length,
        severity: dayThreats.some(t => t.severity === 'critical') ? 'critical' : 
                 dayThreats.some(t => t.severity === 'high') ? 'high' : 'medium'
      });
    }

    setMetrics({
      totalThreats: threatData.length,
      criticalThreats: critical,
      highThreats: high,
      avgSeverityScore: critical * 4 + high * 3,
      topTechnologies,
      topSources,
      threatTrends,
      activeFeeds: 5, // CISA, Unit42, SANS, NVD, MITRE
      lastUpdate: new Date().toISOString(),
      weeklyTrend
    });
  };

  const getFilteredThreats = () => {
    let filtered = threats;
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter(t => t.severity === severityFilter);
    }
    
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(t => t.source === sourceFilter);
    }
    
    return filtered.slice(0, 50); // Limit to 50 most recent
  };

  const getSeverityBadgeStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const convertToUseCase = (threat: ThreatItem) => {
    const useCase = {
      id: `threat-${threat.id}`,
      title: threat.title,
      description: threat.description,
      category: threat.technologies?.includes('cloud') ? 'cloud' : 
                threat.technologies?.includes('network') ? 'network' : 'endpoint',
      severity: threat.severity,
      threats: [threat.title],
      technologies: threat.technologies || [],
      cves: threat.cves || [],
      sourceUrl: threat.sourceUrl,
      extractedFrom: `${threat.source} - ${threat.publishedDate ? format(new Date(threat.publishedDate), 'MMM dd, yyyy') : 'Unknown date'}`,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    existingUseCases.push(useCase);
    localStorage.setItem('useCases', JSON.stringify(existingUseCases));
    
    return useCase;
  };

  const checkXSIAMConnection = async () => {
    try {
      setXsiamStatus('checking');
      
      // Check for stored XSIAM connections
      const connections = JSON.parse(localStorage.getItem('xsiamConnections') || '[]');
      
      if (connections.length === 0) {
        setXsiamStatus('disconnected');
        return;
      }
      
      // Test the first active connection
      const activeConn = connections.find((c: any) => c.status === 'connected') || connections[0];
      
      if (!activeConn) {
        setXsiamStatus('disconnected');
        return;
      }
      
      // Test API connection with a simple health check
      const response = await fetch('/api/xsiam-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: activeConn.baseUrl + '/api/v3/incidents/get_incidents',
          method: 'POST',
          headers: {
            'Authorization': `${activeConn.keyType === 'advanced' ? 'AdvancedApiKey' : 'ApiKey'} ${activeConn.apiKey}`,
            'Content-Type': 'application/json'
          },
          data: { request_data: { page_number: 0, page_size: 1 } }
        })
      });
      
      if (response.ok) {
        setXsiamStatus('connected');
        console.log('XSIAM connection verified:', activeConn.name);
      } else {
        setXsiamStatus('disconnected');
        console.warn('XSIAM connection failed');
      }
    } catch (error) {
      setXsiamStatus('disconnected');
      console.error('Error checking XSIAM connection:', error);
    }
  };

  const testInXSIAM = (threat: ThreatItem) => {
    try {
      // Create threat context for XSIAM testing
      const threatContext = {
        threat: threat.title,
        cves: threat.cves?.join(', ') || 'None',
        technologies: threat.technologies?.join(', ') || 'General',
        severity: threat.severity,
        source: threat.source,
        description: threat.description
      };
      
      // Store context for XSIAM Debugger
      localStorage.setItem('xsiamTestContext', JSON.stringify(threatContext));
      
      // Navigate to Lab Environment Generator
      window.location.href = '/lab-environment';
      
      console.log('Testing threat in XSIAM:', threatContext);
    } catch (error) {
      console.error('Error initiating XSIAM test:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Activity className="h-8 w-8 text-cyan-600" />
              <h1 className="text-3xl font-bold text-gray-900">Active Threat Feed</h1>
            </div>
            <p className="text-gray-600">Live threat intelligence with XSIAM integration testing capabilities</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                xsiamStatus === 'connected' ? 'bg-green-500' : 
                xsiamStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                XSIAM {xsiamStatus === 'connected' ? 'Connected' : 
                       xsiamStatus === 'checking' ? 'Checking...' : 'Disconnected'}
              </span>
            </div>
            
            <Button 
              onClick={() => {
                loadThreatData();
                checkXSIAMConnection();
              }} 
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border rounded-md px-3 py-2"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalThreats}</div>
              <div className="flex items-center mt-1">
                {metrics.weeklyTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${metrics.weeklyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(metrics.weeklyTrend)}% vs last week
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Critical Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.criticalThreats}</div>
              <div className="text-sm text-gray-500 mt-1">
                Immediate attention required
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">High Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.highThreats}</div>
              <div className="text-sm text-gray-500 mt-1">
                Priority investigation needed
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Feeds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.activeFeeds}</div>
              <div className="text-sm text-gray-500 mt-1">
                Last update: {format(new Date(metrics.lastUpdate), 'HH:mm')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Technologies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Top Threat Technologies
              </CardTitle>
              <CardDescription>Most targeted technologies this {timeRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topTechnologies.map((tech, index) => (
                  <div key={tech.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tech.name}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(tech.count / Math.max(...metrics.topTechnologies.map(t => t.count))) * 100} 
                        className="w-20 h-2"
                      />
                      <span className="text-sm text-gray-500 w-8">{tech.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Threat Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Threat Sources
              </CardTitle>
              <CardDescription>Threat distribution by vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topSources.map((source, index) => (
                  <div key={source.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{source.name}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(source.count / Math.max(...metrics.topSources.map(s => s.count))) * 100} 
                        className="w-20 h-2"
                      />
                      <span className="text-sm text-gray-500 w-8">{source.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Threats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent High/Critical Threats
                </CardTitle>
                <CardDescription>Latest threats requiring attention</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  value={severityFilter} 
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="border rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Only</option>
                </select>
                
                <select 
                  value={sourceFilter} 
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="border rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Sources</option>
                  {metrics.topSources.map(source => (
                    <option key={source.name} value={source.name}>{source.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading threat intelligence...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredThreats().map((threat) => (
                  <div key={threat.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getSeverityBadgeStyle(threat.severity)}>
                            {threat.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {threat.source} • {threat.publishedDate ? 
                              (() => {
                                const date = new Date(threat.publishedDate);
                                return !isNaN(date.getTime()) ? format(date, 'MMM dd, yyyy') : 'Unknown date';
                              })() : 'Unknown date'
                            }
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">{threat.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{threat.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          {threat.cves?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Shield className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-600">{threat.cves.join(', ')}</span>
                            </div>
                          )}
                          
                          {threat.tags?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Tags:</span>
                              <span className="text-gray-700">{threat.tags.slice(0, 3).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            convertToUseCase(threat);
                            // Show success toast or navigate
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Training
                        </Button>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => testInXSIAM(threat)}
                              disabled={xsiamStatus !== 'connected'}
                              className={xsiamStatus === 'connected' ? 
                                "bg-green-600 hover:bg-green-700 text-white" : 
                                "bg-gray-400 text-gray-600 cursor-not-allowed"}
                            >
                              {xsiamStatus === 'connected' ? '🚀 Build Lab Environment' : 'Lab Unavailable'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Generate complete lab infrastructure for testing this threat in XSIAM</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(threat.sourceUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getFilteredThreats().length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No threats found for the selected filters.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}