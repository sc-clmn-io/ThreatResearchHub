import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, GitBranch, FileText, AlertCircle, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SanitizationResult {
  filesProcessed: number;
  filesChanged: number;
  highRiskIssuesFound: number;
  employmentRiskIssuesFound: number;
  sanitizationReport: Record<string, { count: number; riskLevel: string; employmentRisk: boolean }>;
  safeForPublicSharing: boolean;
}

export default function RepositorySanitizer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SanitizationResult | null>(null);
  const [gitHistoryInstructions, setGitHistoryInstructions] = useState<string | null>(null);
  const { toast } = useToast();

  const runRepositorySanitization = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest('/api/sanitize/repository', {
        method: 'POST'
      });
      
      setResults(response);
      
      toast({
        title: "Repository Sanitized",
        description: `Processed ${response.filesProcessed} files, modified ${response.filesChanged} files`,
      });
    } catch (error) {
      console.error('Sanitization error:', error);
      toast({
        title: "Sanitization Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const runGitHistoryCleanup = async () => {
    try {
      const response = await apiRequest('/api/sanitize/git-history', {
        method: 'POST'
      });
      
      setGitHistoryInstructions(response.message);
      
      toast({
        title: "Git History Cleanup Script Created",
        description: "Check your repository root for emergency-git-cleanup.sh",
      });
    } catch (error) {
      console.error('Git history cleanup error:', error);
      toast({
        title: "Git History Cleanup Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const getEmploymentRiskIcon = (employmentRisk: boolean) => {
    return employmentRisk ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Repository Sanitizer</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sanitize your repository for safe public sharing while protecting Palo Alto Networks employment interests.
          Removes sensitive information including real XSIAM tenant URLs, distribution IDs, credentials, and personal identifiers.
        </p>
      </div>

      {/* Employment Safety Warning */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>CRITICAL:</strong> Your repository contains real PAN credentials and sensitive information that must be cleaned before making it public.
          This includes XSIAM tenant URLs, distribution IDs, Azure service principals, and private keys in attached assets.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="sanitize" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sanitize">File Sanitization</TabsTrigger>
          <TabsTrigger value="git-history">Git History Cleanup</TabsTrigger>
          <TabsTrigger value="results">Results & Status</TabsTrigger>
        </TabsList>

        <TabsContent value="sanitize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Repository File Sanitization
              </CardTitle>
              <CardDescription>
                Scan and sanitize all text files in the repository to remove employment risks and sensitive information.
                This process will create backups and replace sensitive patterns with safe alternatives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">What will be sanitized:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Real XSIAM tenant URLs → demo-tenant.xdr.us.paloaltonetworks.com</li>
                  <li>• Distribution IDs → EXAMPLE_DISTRIBUTION_ID</li>
                  <li>• Personal identifiers → example-user</li>
                  <li>• Azure service principals → ExampleApp-ServicePrincipal</li>
                  <li>• Real IP addresses → example IP ranges</li>
                  <li>• API keys and credentials → placeholder values</li>
                </ul>
              </div>
              
              <Button 
                onClick={runRepositorySanitization} 
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Shield className="h-4 w-4 mr-2 animate-spin" />
                    Sanitizing Repository...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Sanitize Repository Files
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="git-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Git History Cleanup
              </CardTitle>
              <CardDescription>
                Create a script to permanently remove sensitive information from Git history.
                This is CRITICAL as sensitive data may exist in previous commits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>WARNING:</strong> Git history cleanup will permanently modify your repository history.
                  A backup will be created automatically. This action cannot be undone.
                </AlertDescription>
              </Alert>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-red-800">Found in your Git history:</h4>
                <ul className="text-sm space-y-1 text-red-700">
                  <li>• Real XSIAM tenant: demo-tenant.xdr.us.paloaltonetworks.com</li>
                  <li>• Distribution ID: EXAMPLE_DISTRIBUTION_ID</li>
                  <li>• Cluster URI: EXAMPLE_CLUSTER_URI</li>
                  <li>• Service principal: ExampleApp-ServicePrincipal</li>
                  <li>• Private keys in attached_assets/*.yaml files</li>
                </ul>
              </div>
              
              <Button 
                onClick={runGitHistoryCleanup}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Create Git History Cleanup Script
              </Button>

              {gitHistoryInstructions && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    {gitHistoryInstructions}
                    <br />
                    <strong>Next:</strong> Run <code>./emergency-git-cleanup.sh</code> in your terminal
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {results ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {results.safeForPublicSharing ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    Sanitization Results
                  </CardTitle>
                  <CardDescription>
                    {results.safeForPublicSharing 
                      ? "Repository is safe for public sharing" 
                      : "Repository still contains employment risks"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{results.filesProcessed}</div>
                      <div className="text-sm text-muted-foreground">Files Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{results.filesChanged}</div>
                      <div className="text-sm text-muted-foreground">Files Modified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{results.highRiskIssuesFound}</div>
                      <div className="text-sm text-muted-foreground">High Risk Issues</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{results.employmentRiskIssuesFound}</div>
                      <div className="text-sm text-muted-foreground">Employment Risks</div>
                    </div>
                  </div>

                  {results.employmentRiskIssuesFound > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>EMPLOYMENT RISKS DETECTED:</strong> {results.employmentRiskIssuesFound} issues found and sanitized.
                        Review the detailed report and run Git history cleanup before making repository public.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Sanitization Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(results.sanitizationReport).map(([category, details]) => (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getEmploymentRiskIcon(details.employmentRisk)}
                          <div>
                            <div className="font-medium">{category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</div>
                            <div className="text-sm text-muted-foreground">
                              {details.employmentRisk ? 'Employment Risk' : 'General Security'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRiskBadgeVariant(details.riskLevel)}>
                            {details.riskLevel}
                          </Badge>
                          <span className="font-bold">{details.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Run repository sanitization to see results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps for Safe Public Sharing</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Run File Sanitization</strong> - Clean all repository files of sensitive information</li>
            <li><strong>Clean Git History</strong> - Remove sensitive data from all previous commits</li>
            <li><strong>Verify Results</strong> - Check that no sensitive information remains</li>
            <li><strong>Test Application</strong> - Ensure app works with sanitized data</li>
            <li><strong>Create README</strong> - Add generic documentation without PAN references</li>
            <li><strong>Add .env.example</strong> - Provide template with placeholder values</li>
            <li><strong>Make Repository Public</strong> - Safe to share for advancing AI in society</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}