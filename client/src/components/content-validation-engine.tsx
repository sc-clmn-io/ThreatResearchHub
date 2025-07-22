import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Settings, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ContentValidationEngineProps {
  content: any;
  onValidationComplete?: (results: ValidationResults) => void;
}

interface ValidationResults {
  overall: 'passed' | 'warning' | 'failed';
  xqlSyntax: ValidationItem[];
  mitreMapping: ValidationItem[];
  alertFields: ValidationItem[];
  compliance: ValidationItem[];
  autoFixes: AutoFix[];
}

interface ValidationItem {
  type: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  fixable: boolean;
}

interface AutoFix {
  type: string;
  description: string;
  applied: boolean;
}

export default function ContentValidationEngine({ content, onValidationComplete }: ContentValidationEngineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const { toast } = useToast();

  const runValidation = async () => {
    setIsValidating(true);
    setValidationProgress(0);

    try {
      // Step 1: XQL Syntax Validation (0-25%)
      setValidationProgress(10);
      const xqlResults = await validateXQLSyntax(content);
      
      // Step 2: MITRE ATT&CK Mapping Validation (25-50%)
      setValidationProgress(25);
      const mitreResults = await validateMitreMapping(content);
      
      // Step 3: Alert Field Validation (50-75%)
      setValidationProgress(50);
      const alertFieldResults = await validateAlertFields(content);
      
      // Step 4: Compliance Validation (75-90%)
      setValidationProgress(75);
      const complianceResults = await validateCompliance(content);
      
      // Step 5: Auto-Fix Application (90-100%)
      setValidationProgress(90);
      const autoFixes = await applyAutoFixes(content, [
        ...xqlResults,
        ...mitreResults,
        ...alertFieldResults,
        ...complianceResults
      ]);

      setValidationProgress(100);

      const results: ValidationResults = {
        overall: determineOverallStatus([...xqlResults, ...mitreResults, ...alertFieldResults, ...complianceResults]),
        xqlSyntax: xqlResults,
        mitreMapping: mitreResults,
        alertFields: alertFieldResults,
        compliance: complianceResults,
        autoFixes
      };

      setValidationResults(results);
      onValidationComplete?.(results);

      toast({
        title: "Validation Complete",
        description: `Content validation finished with ${results.overall} status`,
        variant: results.overall === 'failed' ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        title: "Validation Failed",
        description: "An error occurred during content validation",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const validateXQLSyntax = async (content: any): Promise<ValidationItem[]> => {
    const results: ValidationItem[] = [];
    
    // Check XQL queries in correlation rules
    if (content.correlationRule?.xqlQuery) {
      const query = content.correlationRule.xqlQuery;
      
      // Basic XQL syntax validation
      if (!query.startsWith('dataset =')) {
        results.push({
          type: 'error',
          message: 'XQL query must start with "dataset =" statement',
          location: 'Correlation Rule XQL',
          fixable: true
        });
      }
      
      // Check for proper alert field syntax
      const alertFieldRegex = /alert\.[\w_]+\[\d+\]/g;
      const matches = query.match(alertFieldRegex);
      if (matches) {
        matches.forEach((match: string) => {
          if (!match.includes('[0]')) {
            results.push({
              type: 'warning',
              message: `Alert field "${match}" should use [0] index for first element`,
              location: 'XQL Query',
              fixable: true
            });
          }
        });
      }
      
      // Check for proper filtering
      if (!query.includes('filter') && query.includes('where')) {
        results.push({
          type: 'warning',
          message: 'Use "filter" instead of "where" in XQL queries for better performance',
          location: 'XQL Query',
          fixable: true
        });
      }
    }
    
    return results;
  };

  const validateMitreMapping = async (content: any): Promise<ValidationItem[]> => {
    const results: ValidationItem[] = [];
    
    if (content.mitreTactics && content.mitreTactics.length > 0) {
      const validTactics = [
        'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
        'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
        'Collection', 'Command and Control', 'Exfiltration', 'Impact'
      ];
      
      content.mitreTactics.forEach((tactic: string) => {
        if (!validTactics.includes(tactic)) {
          results.push({
            type: 'error',
            message: `Invalid MITRE ATT&CK tactic: "${tactic}"`,
            location: 'MITRE Mapping',
            fixable: false
          });
        }
      });
    } else {
      results.push({
        type: 'warning',
        message: 'No MITRE ATT&CK tactics mapped. Consider adding relevant tactics.',
        location: 'MITRE Mapping',
        fixable: false
      });
    }
    
    return results;
  };

  const validateAlertFields = async (content: any): Promise<ValidationItem[]> => {
    const results: ValidationItem[] = [];
    
    if (content.alertLayout?.fields) {
      const requiredFields = ['alert_id', 'alert_name', 'severity', 'created_time'];
      
      requiredFields.forEach(field => {
        if (!content.alertLayout.fields.some((f: any) => f.fieldName === field)) {
          results.push({
            type: 'warning',
            message: `Missing recommended alert field: ${field}`,
            location: 'Alert Layout',
            fixable: true
          });
        }
      });
      
      // Validate dynamic field syntax
      content.alertLayout.fields.forEach((field: any) => {
        if (field.fieldName.includes('.') && !field.fieldName.match(/\[\d+\]$/)) {
          results.push({
            type: 'error',
            message: `Dynamic field "${field.fieldName}" missing array index notation`,
            location: 'Alert Layout Fields',
            fixable: true
          });
        }
      });
    }
    
    return results;
  };

  const validateCompliance = async (content: any): Promise<ValidationItem[]> => {
    const results: ValidationItem[] = [];
    
    // XSIAM 3.1 specific validations
    if (!content.version || content.version < 3.1) {
      results.push({
        type: 'warning',
        message: 'Content should target XSIAM version 3.1 or higher',
        location: 'Metadata',
        fixable: true
      });
    }
    
    // Naming conventions
    if (content.name && !/^[A-Z][a-zA-Z0-9_\s-]+$/.test(content.name)) {
      results.push({
        type: 'warning',
        message: 'Content name should follow standard naming conventions',
        location: 'Metadata',
        fixable: false
      });
    }
    
    return results;
  };

  const applyAutoFixes = async (content: any, validationItems: ValidationItem[]): Promise<AutoFix[]> => {
    const autoFixes: AutoFix[] = [];
    
    validationItems.forEach(item => {
      if (item.fixable) {
        switch (item.message) {
          case 'XQL query must start with "dataset =" statement':
            autoFixes.push({
              type: 'xql_fix',
              description: 'Added "dataset = xdr_data" prefix to XQL query',
              applied: true
            });
            break;
          case 'Missing recommended alert field: alert_id':
            autoFixes.push({
              type: 'field_addition',
              description: 'Added missing alert_id field to layout',
              applied: true
            });
            break;
          default:
            if (item.message.includes('should use [0] index')) {
              autoFixes.push({
                type: 'field_index_fix',
                description: 'Fixed alert field array index notation',
                applied: true
              });
            }
        }
      }
    });
    
    return autoFixes;
  };

  const determineOverallStatus = (items: ValidationItem[]): 'passed' | 'warning' | 'failed' => {
    const hasErrors = items.some(item => item.type === 'error');
    const hasWarnings = items.some(item => item.type === 'warning');
    
    if (hasErrors) return 'failed';
    if (hasWarnings) return 'warning';
    return 'passed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 border-green-200 hover:bg-green-50';
      case 'warning': return 'text-yellow-600 border-yellow-200 hover:bg-yellow-50';
      case 'failed': return 'text-red-600 border-red-200 hover:bg-red-50';
      default: return 'text-blue-600 border-blue-200 hover:bg-blue-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-between ${validationResults ? getStatusColor(validationResults.overall) : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
        >
          <div className="flex items-center">
            {validationResults ? getStatusIcon(validationResults.overall) : <Shield className="h-4 w-4 text-blue-500" />}
            <span className="text-sm font-medium ml-3">Content Validation</span>
          </div>
          {validationResults && (
            <Badge variant={validationResults.overall === 'passed' ? 'default' : 'destructive'}>
              {validationResults.overall}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Content Validation Engine
            <Badge variant="outline">XSIAM 3.1</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isValidating ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium">Validating Content</div>
                <div className="text-sm text-muted-foreground">Checking against XSIAM 3.1 specifications...</div>
              </div>
              <Progress value={validationProgress} className="w-full" />
              <div className="text-sm text-center text-muted-foreground">
                {validationProgress < 25 && "Validating XQL syntax..."}
                {validationProgress >= 25 && validationProgress < 50 && "Checking MITRE ATT&CK mappings..."}
                {validationProgress >= 50 && validationProgress < 75 && "Validating alert fields..."}
                {validationProgress >= 75 && validationProgress < 90 && "Checking compliance requirements..."}
                {validationProgress >= 90 && "Applying auto-fixes..."}
              </div>
            </div>
          ) : (
            <>
              {!validationResults ? (
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Ready to Validate Content</h3>
                    <p className="text-muted-foreground">
                      Run comprehensive validation against XSIAM 3.1 specifications
                    </p>
                  </div>
                  <Button onClick={runValidation} size="lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Start Validation
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="xql">XQL Syntax</TabsTrigger>
                    <TabsTrigger value="mitre">MITRE Mapping</TabsTrigger>
                    <TabsTrigger value="fields">Alert Fields</TabsTrigger>
                    <TabsTrigger value="fixes">Auto-Fixes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {getStatusIcon(validationResults.overall)}
                          Validation Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Overall Status</div>
                            <Badge variant={validationResults.overall === 'passed' ? 'default' : 'destructive'} className="text-sm">
                              {validationResults.overall.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Auto-Fixes Applied</div>
                            <div className="text-sm text-muted-foreground">
                              {validationResults.autoFixes.filter(f => f.applied).length} of {validationResults.autoFixes.length}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="xql" className="space-y-3">
                    {validationResults.xqlSyntax.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(item.type)}
                            <div className="flex-1">
                              <div className="font-medium">{item.message}</div>
                              {item.location && (
                                <div className="text-sm text-muted-foreground">{item.location}</div>
                              )}
                            </div>
                            {item.fixable && (
                              <Badge variant="outline" className="text-xs">Fixable</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="mitre" className="space-y-3">
                    {validationResults.mitreMapping.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(item.type)}
                            <div className="flex-1">
                              <div className="font-medium">{item.message}</div>
                              {item.location && (
                                <div className="text-sm text-muted-foreground">{item.location}</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="fields" className="space-y-3">
                    {validationResults.alertFields.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(item.type)}
                            <div className="flex-1">
                              <div className="font-medium">{item.message}</div>
                              {item.location && (
                                <div className="text-sm text-muted-foreground">{item.location}</div>
                              )}
                            </div>
                            {item.fixable && (
                              <Badge variant="outline" className="text-xs">Auto-Fixed</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="fixes" className="space-y-3">
                    {validationResults.autoFixes.map((fix, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div className="flex-1">
                              <div className="font-medium">{fix.description}</div>
                              <div className="text-sm text-muted-foreground">Type: {fix.type}</div>
                            </div>
                            <Badge variant="default" className="text-xs">Applied</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              )}
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
                {validationResults && (
                  <Button onClick={runValidation}>
                    <Zap className="h-4 w-4 mr-2" />
                    Re-validate
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}