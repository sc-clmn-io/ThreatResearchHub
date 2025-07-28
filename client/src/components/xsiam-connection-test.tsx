import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, XCircle, AlertTriangle, Network, Server, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XSIAMTestResult {
  success: boolean;
  message: string;
  tenant: string;
  testResults: {
    basicConnectivity: boolean;
    contentManagement: boolean;
    dataIngestion: boolean;
    apiVersion: string | null;
    availableEndpoints: string[];
  };
  recommendations: string[];
  nextSteps: string[];
}

export function XSIAMConnectionTest() {
  const [config, setConfig] = useState({
    apiKey: '',
    tenantUrl: 'https://your-tenant.xdr.us.paloaltonetworks.com'
  });
  
  const [testResult, setTestResult] = useState<XSIAMTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const { toast } = useToast();

  const testConnection = async () => {
    if (!config.apiKey || !config.tenantUrl) {
      toast({
        title: "Configuration Required",
        description: "Please enter both API key and tenant URL",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/xsiam/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "XSIAM Connection Successful",
          description: `Connected to ${result.tenant} with ${result.testResults.availableEndpoints.length} accessible endpoints`
        });
      } else {
        toast({
          title: "XSIAM Connection Failed",
          description: result.error || "Check API key and tenant URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      const failureResult = {
        success: false,
        message: "Network request failed",
        tenant: config.tenantUrl,
        testResults: {
          basicConnectivity: false,
          contentManagement: false,
          dataIngestion: false,
          apiVersion: null,
          availableEndpoints: []
        },
        recommendations: ["Check network connectivity", "Verify tenant URL format"],
        nextSteps: ["Test from different network", "Contact network administrator"]
      };
      
      setTestResult(failureResult);
      toast({
        title: "Connection Error",
        description: "Failed to reach XSIAM tenant",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: boolean | null) => {
    if (status === true) return <Badge className="bg-green-500">Working</Badge>;
    if (status === false) return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            XSIAM Connection & API Testing
          </CardTitle>
          <CardDescription>
            Test connectivity and available APIs for your XSIAM tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>XSIAM API Key</Label>
              <Input
                type="password"
                placeholder="Enter your XSIAM API key"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>XSIAM Tenant URL</Label>
              <Input
                placeholder="https://your-tenant.xdr.us.paloaltonetworks.com"
                value={config.tenantUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, tenantUrl: e.target.value }))}
              />
            </div>
          </div>
          
          <Button 
            onClick={testConnection}
            disabled={!config.apiKey || !config.tenantUrl || isTesting}
            className="w-full"
          >
            {isTesting ? 'Testing XSIAM Connection...' : 'Test XSIAM Connection & APIs'}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">API Details</TabsTrigger>
            <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Alert>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>
                <strong>Connection Status:</strong> {testResult.message}
                <br />
                <strong>Tenant:</strong> {testResult.tenant}
                {testResult.testResults.apiVersion && (
                  <>
                    <br />
                    <strong>API Version:</strong> {testResult.testResults.apiVersion}
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResult.testResults.basicConnectivity)}
                    <span className="font-medium">Basic Connectivity</span>
                  </div>
                  {getStatusBadge(testResult.testResults.basicConnectivity)}
                </div>
                <p className="text-sm text-muted-foreground">Health and info endpoints</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResult.testResults.contentManagement)}
                    <span className="font-medium">Content Management</span>
                  </div>
                  {getStatusBadge(testResult.testResults.contentManagement)}
                </div>
                <p className="text-sm text-muted-foreground">Rules, playbooks, dashboards</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResult.testResults.dataIngestion)}
                    <span className="font-medium">Data Ingestion</span>
                  </div>
                  {getStatusBadge(testResult.testResults.dataIngestion)}
                </div>
                <p className="text-sm text-muted-foreground">Datasets and log forwarding</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="detailed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Available API Endpoints</CardTitle>
                <CardDescription>
                  {testResult.testResults.availableEndpoints.length} endpoints accessible
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResult.testResults.availableEndpoints.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {testResult.testResults.availableEndpoints.map((endpoint, index) => (
                      <Badge key={index} variant="secondary" className="justify-center">
                        {endpoint}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No accessible endpoints detected</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Capabilities Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {rec.startsWith('✓') ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      )}
                      <span className="text-sm">{rec.replace(/^[✓⚠]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="next-steps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResult.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {testResult.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ready for Content Deployment:</strong> Your XSIAM connection is working. 
                  You can now deploy generated correlation rules, playbooks, and dashboards to your tenant.
                </AlertDescription>
              </Alert>
            )}

            {!testResult.success && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Issues Detected:</strong> Some XSIAM APIs are not accessible. 
                  Check API key permissions and network connectivity. You can still develop content 
                  locally and deploy manually.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}