import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Copy, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XQLRule {
  id: string;
  name: string;
  severity: string;
  xql_query: string;
  description: string;
  mitre_techniques: string[];
  data_sources: string[];
  false_positive_rate: string;
  test_status: 'passed' | 'failed' | 'untested';
}

interface XQLPreviewModalProps {
  rules?: XQLRule[];
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  xqlQuery?: string;
  ruleName?: string;
  description?: string;
}

export default function XQLPreviewModal({ 
  rules, 
  trigger, 
  isOpen, 
  onClose, 
  xqlQuery, 
  ruleName, 
  description 
}: XQLPreviewModalProps) {
  const [selectedRule, setSelectedRule] = useState<XQLRule | null>(rules?.[0] || null);
  const [isSelectingRule, setIsSelectingRule] = useState(false);
  const { toast } = useToast();

  // Handle single query mode - extract actual data sources from XQL
  const extractDataSourceFromXQL = (query: string) => {
    const match = query.match(/dataset\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
    return match ? match[1] : 'unknown_dataset';
  };

  const singleQueryRule: XQLRule | null = xqlQuery ? {
    id: 'single-query',
    name: ruleName || 'XQL Correlation Rule',
    severity: 'high',
    xql_query: xqlQuery,
    description: description || 'Generated XQL correlation rule',
    mitre_techniques: ['T1078.004', 'T1133'],
    data_sources: [extractDataSourceFromXQL(xqlQuery)],
    false_positive_rate: 'low',
    test_status: 'untested' as const
  } : null;

  const displayRules = singleQueryRule ? [singleQueryRule] : (rules || []);
  const currentRule = singleQueryRule || selectedRule;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "XQL query copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadRule = (rule: XQLRule) => {
    const content = `// ${rule.name}
// Severity: ${rule.severity}
// Description: ${rule.description}
// MITRE Techniques: ${rule.mitre_techniques.join(', ')}
// Data Sources: ${rule.data_sources.join(', ')}
// False Positive Rate: ${rule.false_positive_rate}

${rule.xql_query}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rule.name.replace(/\s+/g, '_')}.xql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Rule downloaded",
      description: `${rule.name} saved as XQL file`,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const DialogComponent = ({ children }: { children: React.ReactNode }) => {
    if (isOpen !== undefined && onClose) {
      // Controlled mode
      return (
        <Dialog open={isOpen} onOpenChange={(open) => {
          console.log('Dialog onOpenChange:', open, 'isSelectingRule:', isSelectingRule);
          if (!open && !isSelectingRule) {
            console.log('Modal closing triggered');
            onClose();
          } else if (!open && isSelectingRule) {
            console.log('Preventing close during rule selection');
          }
        }}>
          <DialogContent 
            className="max-w-6xl max-h-[90vh] overflow-hidden" 
            onClick={(e) => {
              console.log('DialogContent clicked');
              e.stopPropagation();
            }}
            onPointerDownOutside={(e) => {
              console.log('Pointer down outside detected, target:', e.target);
              // Only prevent if it's actually outside the dialog content
              const target = e.target as Element;
              if (!target.closest('[role="dialog"]')) {
                console.log('Actually outside, allowing close');
              } else {
                console.log('Inside dialog, preventing close');
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              console.log('Escape key pressed');
            }}
          >
            {children}
          </DialogContent>
        </Dialog>
      );
    } else {
      // Uncontrolled mode with trigger
      return (
        <Dialog>
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview XQL Rules
              </Button>
            )}
          </DialogTrigger>
          <DialogContent 
            className="max-w-6xl max-h-[90vh] overflow-hidden" 
            onClick={(e) => {
              console.log('DialogContent clicked (uncontrolled)');
              e.stopPropagation();
            }}
            onPointerDownOutside={(e) => {
              console.log('Pointer down outside detected (uncontrolled), target:', e.target);
              // Only prevent if it's actually outside the dialog content
              const target = e.target as Element;
              if (!target.closest('[role="dialog"]')) {
                console.log('Actually outside, allowing close');
              } else {
                console.log('Inside dialog, preventing close');
                e.preventDefault();
              }
            }}
          >
            {children}
          </DialogContent>
        </Dialog>
      );
    }
  };

  return (
    <DialogComponent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          XQL Rules Preview & Validation
        </DialogTitle>
      </DialogHeader>

      <div className="flex gap-4 h-[70vh]">
        {/* Rules List */}
        <div className="w-1/3 border-r pr-4 overflow-y-auto">
          <h3 className="font-semibold mb-3">Generated Rules ({displayRules.length})</h3>
          <div className="space-y-2">
            {displayRules.map((rule) => (
                <Card 
                  key={rule.id}
                  className={`cursor-pointer transition-colors ${
                    selectedRule?.id === rule.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedRule?.id !== rule.id) {
                      console.log('Card clicked:', rule.name);
                      setIsSelectingRule(true);
                      setSelectedRule(rule);
                      // Reset flag after a short delay
                      setTimeout(() => setIsSelectingRule(false), 50);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${getSeverityColor(rule.severity)} text-white`}>
                        {rule.severity}
                      </Badge>
                      {getTestStatusIcon(rule.test_status)}
                    </div>
                    <h4 className="font-medium text-sm truncate">{rule.name}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {rule.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Rule Details */}
          <div className="flex-1 overflow-y-auto">
            {currentRule ? (
              <Tabs defaultValue="query" className="h-full">
                <TabsList>
                  <TabsTrigger value="query">XQL Query</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                </TabsList>

                <TabsContent value="query" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{currentRule.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(currentRule.xql_query)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadRule(currentRule)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        {currentRule.xql_query}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metadata" className="mt-4">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Rule Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Description</label>
                          <p className="text-sm mt-1">{currentRule.description}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Severity</label>
                          <div className="mt-1">
                            <Badge className={`${getSeverityColor(currentRule.severity)} text-white`}>
                              {currentRule.severity}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-600">MITRE ATT&CK Techniques</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentRule.mitre_techniques.map((technique) => (
                              <Badge key={technique} variant="outline" className="text-xs">
                                {technique}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-600">Required Data Sources</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentRule.data_sources.map((source) => (
                              <Badge key={source} variant="secondary" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Rule Validation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getTestStatusIcon(currentRule.test_status)}
                          <span className="text-sm font-medium">
                            Test Status: {currentRule.test_status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Expected False Positive Rate</label>
                        <p className="text-sm mt-1">{currentRule.false_positive_rate}</p>
                      </div>

                      {currentRule.test_status === 'failed' && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            This rule failed validation. Please review the XQL syntax and data source requirements.
                          </AlertDescription>
                        </Alert>
                      )}

                      {currentRule.test_status === 'passed' && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            This rule passed all validation checks and is ready for deployment.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a rule to preview
              </div>
            )}
          </div>
        </div>
    </DialogComponent>
  );
}