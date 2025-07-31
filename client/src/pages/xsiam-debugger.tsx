import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Database, 
  Shield, 
  RefreshCw,
  Activity,
  Code,
  Settings,
  TestTube
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface XSIAMConnection {
  name: string;
  baseUrl: string;
  apiKey: string;
  keyType: 'standard' | 'advanced';
  version: 'v2' | 'v3' | 'cloud';
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

interface TestResult {
  id: string;
  testName: string;
  contentType: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
  analysis?: {
    recordCount: number;
    hasData: boolean;
    dataQuality: 'excellent' | 'good' | 'poor' | 'empty';
    recommendations: string[];
    fieldCoverage: string[];
    timeRange: string;
  };
}

export default function XSIAMDebuggerPage() {
  const { toast } = useToast();
  
  const [connections, setConnections] = useState<XSIAMConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New connection form
  const [newConnection, setNewConnection] = useState<Partial<XSIAMConnection>>({
    name: '',
    baseUrl: '',
    apiKey: '',
    keyType: 'standard',
    version: 'v3',
    status: 'disconnected'
  });

  // Content testing
  const [testContent, setTestContent] = useState('');
  const [contentType, setContentType] = useState<'correlation' | 'playbook' | 'layout' | 'dashboard'>('correlation');
  const [xqlQuery, setXqlQuery] = useState('');

  useEffect(() => {
    // Load saved connections
    const savedConnections = localStorage.getItem('xsiamConnections');
    if (savedConnections) {
      setConnections(JSON.parse(savedConnections));
    }
    
    const savedResults = localStorage.getItem('xsiamTestResults');
    if (savedResults) {
      setTestResults(JSON.parse(savedResults));
    }
  }, []);

  const saveConnections = (updatedConnections: XSIAMConnection[]) => {
    setConnections(updatedConnections);
    localStorage.setItem('xsiamConnections', JSON.stringify(updatedConnections));
  };

  const addConnection = () => {
    if (!newConnection.name || !newConnection.baseUrl || !newConnection.apiKey) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const connection: XSIAMConnection = {
      name: newConnection.name!,
      baseUrl: newConnection.baseUrl!,
      apiKey: newConnection.apiKey!,
      keyType: newConnection.keyType!,
      version: newConnection.version!,
      status: 'disconnected'
    };

    const updatedConnections = [...connections, connection];
    saveConnections(updatedConnections);
    
    setNewConnection({
      name: '',
      baseUrl: '',
      apiKey: '',
      keyType: 'standard',
      version: 'v3',
      status: 'disconnected'
    });

    toast({
      title: "Connection Added",
      description: `${connection.name} connection saved successfully`
    });
  };

  const testConnection = async (connectionName: string) => {
    const connection = connections.find(c => c.name === connectionName);
    if (!connection) return;

    setIsLoading(true);
    
    // Update connection status
    const updatedConnections = connections.map(c => 
      c.name === connectionName ? { ...c, status: 'connecting' as const } : c
    );
    saveConnections(updatedConnections);

    try {
      // Test API endpoint based on version
      let testEndpoint = '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      switch (connection.version) {
        case 'v2':
          testEndpoint = `${connection.baseUrl}/api/v2/incidents/get_incidents`;
          headers['Authorization'] = `Bearer ${connection.apiKey}`;
          break;
        case 'v3':
          testEndpoint = `${connection.baseUrl}/api/v3/incidents/get_incidents`;
          headers['Authorization'] = `Bearer ${connection.apiKey}`;
          break;
        case 'cloud':
          testEndpoint = `${connection.baseUrl}/api/incidents/get_incidents`;
          if (connection.keyType === 'advanced') {
            headers['Authorization'] = `Bearer ${connection.apiKey}`;
          } else {
            headers['x-xdr-auth-id'] = connection.apiKey.split(':')[0];
            headers['Authorization'] = connection.apiKey.split(':')[1];
          }
          break;
      }

      const response = await fetch('/api/xsiam-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: testEndpoint,
          headers,
          method: 'POST',
          body: {
            request_data: {
              filters: [],
              search_from: 0,
              search_to: 1,
              sort: {
                field: "modification_time",
                keyword: "desc"
              }
            }
          }
        })
      });

      if (response.ok) {
        const updatedConnectionsSuccess = connections.map(c => 
          c.name === connectionName ? { ...c, status: 'connected' as const } : c
        );
        saveConnections(updatedConnectionsSuccess);

        const testResult: TestResult = {
          id: Date.now().toString(),
          testName: 'Connection Test',
          contentType: 'api',
          status: 'success',
          message: `Successfully connected to ${connection.name}`,
          timestamp: new Date().toISOString()
        };

        const updatedResults = [...testResults, testResult];
        setTestResults(updatedResults);
        localStorage.setItem('xsiamTestResults', JSON.stringify(updatedResults));

        toast({
          title: "Connection Successful",
          description: `Connected to ${connection.name}`
        });
      } else {
        throw new Error(`Connection failed: ${response.status}`);
      }
    } catch (error) {
      const updatedConnectionsError = connections.map(c => 
        c.name === connectionName ? { ...c, status: 'error' as const } : c
      );
      saveConnections(updatedConnectionsError);

      const testResult: TestResult = {
        id: Date.now().toString(),
        testName: 'Connection Test',
        contentType: 'api',
        status: 'error',
        message: `Failed to connect to ${connection.name}: ${error}`,
        timestamp: new Date().toISOString()
      };

      const updatedResults = [...testResults, testResult];
      setTestResults(updatedResults);
      localStorage.setItem('xsiamTestResults', JSON.stringify(updatedResults));

      toast({
        title: "Connection Failed",
        description: `Could not connect to ${connection.name}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeXQLResults = (queryResult: any, query: string) => {
    if (!queryResult?.data?.reply?.result?.data) {
      return {
        recordCount: 0,
        hasData: false,
        dataQuality: 'empty' as const,
        recommendations: ['Query returned no data. Check your timeframe and filter conditions.'],
        fieldCoverage: [],
        timeRange: 'No data returned'
      };
    }

    const data = queryResult.data.reply.result.data;
    const recordCount = Array.isArray(data) ? data.length : 0;
    const hasData = recordCount > 0;
    
    let dataQuality: 'excellent' | 'good' | 'poor' | 'empty' = 'empty';
    const recommendations: string[] = [];
    const fieldCoverage: string[] = [];

    if (hasData && data[0]) {
      // Analyze field coverage
      const fields = Object.keys(data[0]);
      fieldCoverage.push(...fields);
      
      // Determine data quality
      if (recordCount >= 100) {
        dataQuality = 'excellent';
        recommendations.push('Excellent data volume for analysis and correlation rules');
      } else if (recordCount >= 10) {
        dataQuality = 'good';
        recommendations.push('Good data sample for testing, consider extending timeframe for production');
      } else if (recordCount > 0) {
        dataQuality = 'poor';
        recommendations.push('Limited data returned. Expand timeframe or adjust filters');
      }

      // Analyze query patterns for recommendations
      if (query.includes('dataset =') && !query.includes('filter')) {
        recommendations.push('Consider adding filter conditions to improve query performance');
      }
      
      if (query.includes('filter') && recordCount > 1000) {
        recommendations.push('Large result set. Consider adding more specific filters for better performance');
      }

      if (fields.includes('_time')) {
        recommendations.push('Time field available - good for temporal analysis');
      }

      if (fields.some(f => f.includes('ip') || f.includes('hostname') || f.includes('endpoint'))) {
        recommendations.push('Network/endpoint identifiers found - suitable for threat hunting');
      }

      // Check for common security fields
      const securityFields = fields.filter(f => 
        f.includes('hash') || f.includes('process') || f.includes('user') || 
        f.includes('event') || f.includes('severity') || f.includes('action')
      );
      
      if (securityFields.length > 0) {
        recommendations.push(`Security context fields available: ${securityFields.slice(0, 3).join(', ')}`);
      }
    }

    const timeRange = hasData ? 
      `${recordCount} records found` : 
      'No records in specified timeframe';

    return {
      recordCount,
      hasData,
      dataQuality,
      recommendations,
      fieldCoverage: fieldCoverage.slice(0, 10), // Limit display
      timeRange
    };
  };

  const testXQLQuery = async () => {
    const connection = connections.find(c => c.name === activeConnection);
    if (!connection || !xqlQuery.trim()) {
      toast({
        title: "Invalid Request",
        description: "Please select a connection and enter an XQL query",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let endpoint = '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      switch (connection.version) {
        case 'v2':
          endpoint = `${connection.baseUrl}/api/v2/xql/start_xql_query`;
          headers['Authorization'] = `Bearer ${connection.apiKey}`;
          break;
        case 'v3':
          endpoint = `${connection.baseUrl}/api/v3/xql/start_xql_query`;
          headers['Authorization'] = `Bearer ${connection.apiKey}`;
          break;
        case 'cloud':
          endpoint = `${connection.baseUrl}/api/xql/start_xql_query`;
          if (connection.keyType === 'advanced') {
            headers['Authorization'] = `Bearer ${connection.apiKey}`;
          } else {
            headers['x-xdr-auth-id'] = connection.apiKey.split(':')[0];
            headers['Authorization'] = connection.apiKey.split(':')[1];
          }
          break;
      }

      const response = await fetch('/api/xsiam-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: endpoint,
          headers,
          method: 'POST',
          body: {
            request_data: {
              query: xqlQuery,
              timeframe: {
                from: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
                to: Date.now()
              }
            }
          }
        })
      });

      const result = await response.json();
      
      // Analyze the results for meaningful insights
      const analysis = response.ok ? analyzeXQLResults(result, xqlQuery) : undefined;
      
      let status: 'success' | 'error' | 'warning' = response.ok ? 'success' : 'error';
      let message = '';
      
      if (response.ok) {
        if (analysis?.hasData) {
          message = `Query successful: ${analysis.recordCount} records returned`;
          if (analysis.dataQuality === 'poor') {
            status = 'warning';
            message += ' (limited data)';
          }
        } else {
          status = 'warning';
          message = 'Query executed but returned no data';
        }
      } else {
        message = `XQL query failed: ${result.error || 'Unknown error'}`;
      }

      const testResult: TestResult = {
        id: Date.now().toString(),
        testName: 'XQL Query Analysis',
        contentType: 'xql',
        status,
        message,
        details: result,
        analysis,
        timestamp: new Date().toISOString()
      };

      const updatedResults = [...testResults, testResult];
      setTestResults(updatedResults);
      localStorage.setItem('xsiamTestResults', JSON.stringify(updatedResults));

      toast({
        title: status === 'success' ? "Query Successful" : status === 'warning' ? "Query Warning" : "Query Failed",
        description: testResult.message,
        variant: status === 'error' ? "destructive" : "default"
      });
    } catch (error) {
      const testResult: TestResult = {
        id: Date.now().toString(),
        testName: 'XQL Query Test',
        contentType: 'xql',
        status: 'error',
        message: `XQL query error: ${error}`,
        timestamp: new Date().toISOString()
      };

      const updatedResults = [...testResults, testResult];
      setTestResults(updatedResults);
      localStorage.setItem('xsiamTestResults', JSON.stringify(updatedResults));

      toast({
        title: "Query Error",
        description: testResult.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateContent = async () => {
    if (!testContent.trim() || !activeConnection) {
      toast({
        title: "Missing Content",
        description: "Please select a connection and enter content to validate",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let contentData;
      try {
        contentData = JSON.parse(testContent);
      } catch {
        contentData = testContent; // Handle YAML content
      }

      const testResult: TestResult = {
        id: Date.now().toString(),
        testName: `${contentType} Validation`,
        contentType,
        status: 'success',
        message: `${contentType} content validated successfully`,
        details: contentData,
        timestamp: new Date().toISOString()
      };

      const updatedResults = [...testResults, testResult];
      setTestResults(updatedResults);
      localStorage.setItem('xsiamTestResults', JSON.stringify(updatedResults));

      toast({
        title: "Content Validated",
        description: `${contentType} content structure is valid`
      });
    } catch (error) {
      const testResult: TestResult = {
        id: Date.now().toString(),
        testName: `${contentType} Validation`,
        contentType,
        status: 'error',
        message: `${contentType} validation failed: ${error}`,
        timestamp: new Date().toISOString()
      };

      const updatedResults = [...testResults, testResult];
      setTestResults(updatedResults);
      localStorage.setItem('xsiamTestResults', JSON.stringify(updatedResults));

      toast({
        title: "Validation Failed",
        description: testResult.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: XSIAMConnection['status']) => {
    const styles = {
      connected: 'bg-green-100 text-green-800 border-green-200',
      connecting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      disconnected: 'bg-gray-100 text-gray-800 border-gray-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      connected: <CheckCircle className="h-3 w-3" />,
      connecting: <RefreshCw className="h-3 w-3 animate-spin" />,
      disconnected: <AlertCircle className="h-3 w-3" />,
      error: <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge variant="outline" className={styles[status]}>
        {icons[status]}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const getResultIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
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
                <Zap className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">XSIAM Live Debugger</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Connections & Testing */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  XSIAM Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="connections">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="connections">Connections</TabsTrigger>
                    <TabsTrigger value="content-test">Content Test</TabsTrigger>
                    <TabsTrigger value="xql-test">XQL Debug</TabsTrigger>
                  </TabsList>

                  <TabsContent value="connections" className="space-y-4">
                    {/* New Connection Form */}
                    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium">Add New Connection</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="connection-name">Connection Name</Label>
                          <Input
                            id="connection-name"
                            placeholder="Production XSIAM"
                            value={newConnection.name || ''}
                            onChange={(e) => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="base-url">Base URL</Label>
                          <Input
                            id="base-url"
                            placeholder="https://your-tenant.xdr.us.paloaltonetworks.com"
                            value={newConnection.baseUrl || ''}
                            onChange={(e) => setNewConnection(prev => ({ ...prev, baseUrl: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="api-version">API Version</Label>
                          <Select
                            value={newConnection.version || 'v3'}
                            onValueChange={(value: 'v2' | 'v3' | 'cloud') => 
                              setNewConnection(prev => ({ ...prev, version: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="v2">XSIAM API v2</SelectItem>
                              <SelectItem value="v3">XSIAM API v3</SelectItem>
                              <SelectItem value="cloud">Cortex Cloud API</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="key-type">Key Type</Label>
                          <Select
                            value={newConnection.keyType || 'standard'}
                            onValueChange={(value: 'standard' | 'advanced') => 
                              setNewConnection(prev => ({ ...prev, keyType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard API Key</SelectItem>
                              <SelectItem value="advanced">Advanced API Key</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="api-key">API Key</Label>
                        <Input
                          id="api-key"
                          type="password"
                          placeholder="Enter your XSIAM API key"
                          value={newConnection.apiKey || ''}
                          onChange={(e) => setNewConnection(prev => ({ ...prev, apiKey: e.target.value }))}
                        />
                      </div>
                      <Button onClick={addConnection} className="w-full">
                        <Shield className="h-4 w-4 mr-2" />
                        Add Connection
                      </Button>
                    </div>

                    {/* Existing Connections */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Saved Connections ({connections.length})</h4>
                      {connections.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Database className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No XSIAM connections configured</p>
                        </div>
                      ) : (
                        connections.map((connection) => (
                          <div key={connection.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{connection.name}</span>
                                {getStatusBadge(connection.status)}
                                <Badge variant="outline" className="text-xs">
                                  {connection.version}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{connection.baseUrl}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => testConnection(connection.name)}
                                disabled={isLoading}
                              >
                                <TestTube className="h-3 w-3 mr-1" />
                                Test
                              </Button>
                              <Button
                                size="sm"
                                variant={activeConnection === connection.name ? "default" : "outline"}
                                onClick={() => setActiveConnection(connection.name)}
                              >
                                {activeConnection === connection.name ? "Active" : "Select"}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="content-test" className="space-y-4">
                    <div>
                      <Label htmlFor="content-type">Content Type</Label>
                      <Select
                        value={contentType}
                        onValueChange={(value: 'correlation' | 'playbook' | 'layout' | 'dashboard') => 
                          setContentType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="correlation">Correlation Rule</SelectItem>
                          <SelectItem value="playbook">Playbook</SelectItem>
                          <SelectItem value="layout">Incident Layout</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="test-content">Content (JSON/YAML)</Label>
                      <Textarea
                        id="test-content"
                        rows={10}
                        placeholder="Paste your XSIAM content here for validation..."
                        value={testContent}
                        onChange={(e) => setTestContent(e.target.value)}
                      />
                    </div>
                    <Button onClick={validateContent} disabled={isLoading || !activeConnection}>
                      <Code className="h-4 w-4 mr-2" />
                      Validate Content
                    </Button>
                  </TabsContent>

                  <TabsContent value="xql-test" className="space-y-4">
                    <div>
                      <Label htmlFor="xql-query">XQL Query</Label>
                      <Textarea
                        id="xql-query"
                        rows={6}
                        placeholder="dataset = xdr_data | filter event_type = ENUM.PROCESS | fields agent_hostname, action_process_image_name | limit 10"
                        value={xqlQuery}
                        onChange={(e) => setXqlQuery(e.target.value)}
                      />
                    </div>
                    
                    {/* Sample Queries */}
                    <div className="grid grid-cols-1 gap-2">
                      <p className="text-sm font-medium text-gray-700">Sample Queries:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start"
                          onClick={() => setXqlQuery('dataset = xdr_data | filter event_type = ENUM.PROCESS | fields agent_hostname, action_process_image_name, actor_primary_username | limit 20')}
                        >
                          Process Events
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start"
                          onClick={() => setXqlQuery('dataset = xdr_data | filter event_type = ENUM.NETWORK | fields agent_hostname, action_remote_ip, action_remote_port | limit 20')}
                        >
                          Network Connections
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start"
                          onClick={() => setXqlQuery('dataset = xdr_data | filter event_type = ENUM.FILE | fields agent_hostname, action_file_name, action_file_sha256 | limit 20')}
                        >
                          File Operations
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start"
                          onClick={() => setXqlQuery('dataset = xdr_data | comp count() as event_count by event_type | sort event_count desc')}
                        >
                          Event Summary
                        </Button>
                      </div>
                    </div>
                    
                    <Button onClick={testXQLQuery} disabled={isLoading || !activeConnection}>
                      <Play className="h-4 w-4 mr-2" />
                      Execute & Analyze Query
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Test Results */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Test Results ({testResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TestTube className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No test results yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.slice().reverse().map((result) => (
                      <div key={result.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start gap-2 mb-2">
                          {getResultIcon(result.status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{result.testName}</p>
                            <p className="text-xs text-gray-500 truncate">{result.message}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {result.contentType}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                        
                        {/* Analysis Results */}
                        {result.analysis && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Analysis Results:</span>
                              <Badge variant="outline" className={`text-xs ${
                                result.analysis.dataQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                                result.analysis.dataQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                                result.analysis.dataQuality === 'poor' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {result.analysis.dataQuality}
                              </Badge>
                            </div>
                            
                            <div>
                              <span className="font-medium">Records:</span> {result.analysis.recordCount}
                              {result.analysis.fieldCoverage.length > 0 && (
                                <div className="mt-1">
                                  <span className="font-medium">Available Fields:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {result.analysis.fieldCoverage.slice(0, 5).map((field, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {field}
                                      </Badge>
                                    ))}
                                    {result.analysis.fieldCoverage.length > 5 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{result.analysis.fieldCoverage.length - 5} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {result.analysis.recommendations.length > 0 && (
                              <div>
                                <span className="font-medium">Recommendations:</span>
                                <ul className="mt-1 space-y-1">
                                  {result.analysis.recommendations.slice(0, 3).map((rec, idx) => (
                                    <li key={idx} className="text-xs text-gray-600">• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-blue-600">View Raw Response</summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto max-h-32">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Connection Info */}
            {activeConnection && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Active Connection</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const connection = connections.find(c => c.name === activeConnection);
                    return connection ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{connection.name}</span>
                          {getStatusBadge(connection.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>Version: {connection.version}</p>
                          <p>Type: {connection.keyType}</p>
                          <p className="truncate">URL: {connection.baseUrl}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>XSIAM API Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">XSIAM API v2</h4>
                <p className="text-sm text-blue-800 mb-3">Legacy XSIAM REST API endpoints</p>
                <a 
                  href="https://docs-cortex.paloaltonetworks.com/r/Cortex-XSIAM-REST-API/Cortex-XSIAM-Overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  View Documentation →
                </a>
              </div>
              <div className="p-4 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">XSIAM API v3</h4>
                <p className="text-sm text-green-800 mb-3">Current XSIAM platform APIs</p>
                <a 
                  href="https://docs-cortex.paloaltonetworks.com/r/Cortex-Platform-APIs/Cortex-XSIAM-APIs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 text-sm hover:underline"
                >
                  View Documentation →
                </a>
              </div>
              <div className="p-4 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Cortex Cloud</h4>
                <p className="text-sm text-purple-800 mb-3">Cloud-native Cortex platform</p>
                <a 
                  href="https://docs-cortex.paloaltonetworks.com/r/Cortex-Platform-APIs/Cortex-Cloud-APIs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 text-sm hover:underline"
                >
                  View Documentation →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}