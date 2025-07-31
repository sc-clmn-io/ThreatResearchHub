import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, XCircle, GitBranch, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SanitizationResult {
  filesProcessed: number;
  filesChanged: number;
  highRiskIssuesFound: number;
  employmentRiskIssuesFound: number;
  sanitizationReport: Record<string, { count: number; riskLevel: string; employmentRisk: boolean }>;
  safeForPublicSharing: boolean;
}

const RepositorySanitizer: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SanitizationResult | null>(null);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'sanitizing' | 'complete'>('idle');
  const { toast } = useToast();

  const handleSanitize = async () => {
    setIsProcessing(true);
    setPhase('scanning');
    setResult(null);

    try {
      // Phase 1: Repository Sanitization
      const response = await fetch('/api/sanitize/repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Sanitization failed');
      }

      const sanitizationResult = await response.json();
      setResult(sanitizationResult);
      setPhase('complete');

      toast({
        title: sanitizationResult.safeForPublicSharing ? "Repository Safe for Public Sharing" : "Additional Review Required",
        description: `Processed ${sanitizationResult.filesProcessed} files, found ${sanitizationResult.employmentRiskIssuesFound} employment risk issues`,
        variant: sanitizationResult.safeForPublicSharing ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Sanitization error:', error);
      setPhase('idle');
      toast({
        title: "Sanitization Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGitHistory = async () => {
    try {
      const response = await fetch('/api/sanitize/git-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      toast({
        title: "Git History Instructions",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Git History Error",
        description: "Failed to generate Git history sanitization instructions",
        variant: "destructive",
      });
    }
  };

  const getProgressValue = () => {
    switch (phase) {
      case 'scanning': return 25;
      case 'sanitizing': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getPhaseDescription = () => {
    switch (phase) {
      case 'scanning': return 'Scanning repository for sensitive information...';
      case 'sanitizing': return 'Applying sanitization rules and transformations...';
      case 'complete': return 'Sanitization complete - Review results below';
      default: return 'Ready to sanitize repository for public sharing';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <CardTitle>Comprehensive Repository Sanitizer</CardTitle>
          </div>
          <CardDescription>
            Thoroughly sanitize the entire repository to remove Palo Alto Networks employment risks and sensitive information before public GitHub sharing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will sanitize ALL files in the repository, including historical content. 
              Ensure you have backups before proceeding.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Sanitization Progress</span>
                <span>{getProgressValue()}%</span>
              </div>
              <Progress value={getProgressValue()} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">{getPhaseDescription()}</p>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleSanitize}
                disabled={isProcessing}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                {isProcessing ? 'Sanitizing Repository...' : 'Sanitize Repository'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleGitHistory}
                disabled={isProcessing}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Git History
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sanitization Results</CardTitle>
              <Badge variant={result.safeForPublicSharing ? "default" : "destructive"}>
                {result.safeForPublicSharing ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Safe for Public Sharing
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Requires Review
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.filesProcessed}</div>
                <div className="text-sm text-gray-600">Files Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.filesChanged}</div>
                <div className="text-sm text-gray-600">Files Sanitized</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{result.highRiskIssuesFound}</div>
                <div className="text-sm text-gray-600">High Risk Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.employmentRiskIssuesFound}</div>
                <div className="text-sm text-gray-600">Employment Risks</div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="space-y-3">
              <h4 className="font-semibold">Issues Found and Sanitized:</h4>
              {Object.entries(result.sanitizationReport)
                .sort(([,a], [,b]) => {
                  // Sort by employment risk first, then by risk level
                  if (a.employmentRisk !== b.employmentRisk) return a.employmentRisk ? -1 : 1;
                  const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                  return riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder];
                })
                .map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={data.employmentRisk ? "destructive" : data.riskLevel === 'HIGH' ? "destructive" : data.riskLevel === 'MEDIUM' ? "secondary" : "outline"}
                      >
                        {data.riskLevel}
                      </Badge>
                      <span className="font-medium">{category.replace(/_/g, ' ')}</span>
                      {data.employmentRisk && (
                        <Badge variant="destructive" className="text-xs">
                          EMPLOYMENT RISK
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{data.count}</div>
                      <div className="text-xs text-gray-600">occurrences</div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Action Items */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Next Steps:</h4>
              <ul className="text-sm space-y-1">
                <li>✅ Repository files have been sanitized</li>
                <li>📋 Review the generated COMPREHENSIVE_SANITIZATION_REPORT.md</li>
                <li>🔄 Run Git History sanitization if needed</li>
                <li>📤 Repository is {result.safeForPublicSharing ? 'ready' : 'NOT ready'} for public sharing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employment Safety Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">Employment Safety Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700">
            This sanitization process is specifically designed to protect your employment at Palo Alto Networks by removing:
          </p>
          <ul className="list-disc list-inside mt-2 text-orange-700 text-sm space-y-1">
            <li>Real XSIAM tenant URLs and distribution IDs</li>
            <li>Personal identifiers and internal infrastructure details</li>
            <li>Company-specific API keys and credentials</li>
            <li>Internal network configurations and VM identifiers</li>
          </ul>
          <p className="text-orange-700 mt-3 font-medium">
            Always verify the sanitization report before making any repository public.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepositorySanitizer;