import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Layers, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Play,
  Settings,
  Network,
  Shield,
  Server
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface LabBuildPlan {
  id: string;
  threatReportId: string;
  threatName: string;
  description: string;
  totalDuration: string;
  totalCost: {
    setup: number;
    hourly: number;
    monthly: number;
  };
  phases: Array<{
    name: string;
    osiLayer: string;
    duration: string;
    steps: string[];
  }>;
  components: Array<{
    id: string;
    name: string;
    type: string;
    osiLayer: string;
    description: string;
    requirements: Record<string, string>;
    estimatedCost?: {
      setup?: number;
      hourly?: number;
      monthly?: number;
    };
  }>;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    instructions: string[];
    commands?: Array<{
      platform: string;
      code: string;
    }>;
    validation: string[];
    duration: string;
  }>;
  ttpExecution: Array<{
    id: string;
    name: string;
    mitreId?: string;
    description: string;
    platform: string;
    expectedLogs: string[];
  }>;
  validation: {
    dataIngestion: string[];
    detectionRules: string[];
    alertGeneration: string[];
    responsePlaybooks: string[];
  };
}

export function LabBuildPlanner() {
  const [threatReportContent, setThreatReportContent] = useState('');
  const [threatReportTitle, setThreatReportTitle] = useState('');
  const [labPlan, setLabPlan] = useState<LabBuildPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState<Record<string, 'pending' | 'running' | 'completed' | 'failed'>>({});

  const generateLabPlan = useMutation({
    mutationFn: async (data: { content: string; title: string }) => {
      const response = await apiRequest('/api/lab-build-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLabPlan(data as LabBuildPlan);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Failed to generate lab build plan:', error);
      setIsGenerating(false);
    }
  });

  const executeStep = useMutation({
    mutationFn: async (stepId: string) => {
      const response = await apiRequest(`/api/lab-build-plan/execute-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, planId: labPlan?.id })
      });
      return response.json();
    },
    onSuccess: (_, stepId) => {
      setExecutionProgress(prev => ({ ...prev, [stepId]: 'completed' }));
    },
    onError: (_, stepId) => {
      setExecutionProgress(prev => ({ ...prev, [stepId]: 'failed' }));
    }
  });

  const handleGenerateLabPlan = () => {
    if (!threatReportContent.trim()) return;
    
    setIsGenerating(true);
    generateLabPlan.mutate({
      content: threatReportContent,
      title: threatReportTitle
    });
  };

  const handleExecuteStep = (stepId: string) => {
    setExecutionProgress(prev => ({ ...prev, [stepId]: 'running' }));
    setActiveStep(stepId);
    executeStep.mutate(stepId);
  };

  const getOSILayerIcon = (layer: string) => {
    const icons = {
      'physical': Server,
      'network': Network,
      'application': Shield
    };
    const IconComponent = icons[layer as keyof typeof icons] || Layers;
    return <IconComponent className="h-4 w-4" />;
  };

  const getOSILayerColor = (layer: string) => {
    const colors = {
      'physical': 'bg-red-100 text-red-800',
      'data-link': 'bg-orange-100 text-orange-800',
      'network': 'bg-yellow-100 text-yellow-800',
      'transport': 'bg-green-100 text-green-800',
      'session': 'bg-blue-100 text-blue-800',
      'presentation': 'bg-indigo-100 text-indigo-800',
      'application': 'bg-purple-100 text-purple-800'
    };
    return colors[layer as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderThreatInput = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Threat Report Analysis
        </CardTitle>
        <CardDescription>
          Paste your threat report content to generate a comprehensive lab build plan with OSI layer infrastructure mapping
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Report Title (Optional)</label>
          <Input
            placeholder="e.g., APT29 CozyBear Infrastructure Analysis"
            value={threatReportTitle}
            onChange={(e) => setThreatReportTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Threat Report Content</label>
          <Textarea
            placeholder="Paste threat report content here... (CVEs, MITRE ATT&CK techniques, IOCs, technologies, etc.)"
            value={threatReportContent}
            onChange={(e) => setThreatReportContent(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <Button 
          onClick={handleGenerateLabPlan}
          disabled={!threatReportContent.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Threat Report & Generating Lab Plan...
            </>
          ) : (
            <>
              <Layers className="h-4 w-4 mr-2" />
              Generate Lab Build Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderPlanOverview = () => {
    if (!labPlan) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{labPlan.threatName}</CardTitle>
          <CardDescription>{labPlan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-medium">{labPlan.totalDuration}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Monthly Cost</div>
                <div className="font-medium">${labPlan.totalCost.monthly}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Components</div>
                <div className="font-medium">{labPlan.components.length} systems</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h4 className="font-medium">OSI Layer Phases</h4>
            <Badge variant="outline">{labPlan.phases.length} phases</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {labPlan.phases.map((phase) => (
              <Badge 
                key={phase.name} 
                className={getOSILayerColor(phase.osiLayer)}
              >
                {getOSILayerIcon(phase.osiLayer)}
                <span className="ml-1">{phase.osiLayer}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLabExecution = () => {
    if (!labPlan) return null;

    return (
      <Tabs defaultValue="infrastructure" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="ttp-execution">TTP Execution</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="infrastructure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Infrastructure Components</CardTitle>
              <CardDescription>OSI layer-mapped infrastructure for threat simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {labPlan.components.map((component) => (
                  <div key={component.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{component.name}</h4>
                          <Badge className={getOSILayerColor(component.osiLayer)}>
                            {getOSILayerIcon(component.osiLayer)}
                            <span className="ml-1">{component.osiLayer}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{component.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(component.requirements).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {component.estimatedCost && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ${component.estimatedCost.monthly}/mo
                          </div>
                          <div className="text-xs text-gray-500">
                            Setup: ${component.estimatedCost.setup}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Deployment</CardTitle>
              <CardDescription>Execute deployment phases in OSI layer order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {labPlan.steps.map((step) => {
                  const status = executionProgress[step.id] || 'pending';
                  const isActive = activeStep === step.id;
                  
                  return (
                    <div key={step.id} className={`border rounded-lg p-4 ${isActive ? 'border-blue-500' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{step.title}</h4>
                            <Badge variant={
                              status === 'completed' ? 'default' : 
                              status === 'running' ? 'secondary' :
                              status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {status}
                            </Badge>
                            <Badge variant="outline">{step.duration}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={status === 'completed' ? 'secondary' : 'default'}
                          onClick={() => handleExecuteStep(step.id)}
                          disabled={status === 'running' || executeStep.isPending}
                        >
                          {status === 'running' ? (
                            <>
                              <Settings className="h-3 w-3 mr-1 animate-spin" />
                              Running...
                            </>
                          ) : status === 'completed' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Execute
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {isActive && (
                        <div className="mt-3 space-y-2">
                          <h5 className="font-medium text-sm">Instructions:</h5>
                          <ul className="text-sm space-y-1">
                            {step.instructions.map((instruction, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-1">•</span>
                                <span>{instruction}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {step.commands && step.commands.length > 0 && (
                            <div className="mt-3">
                              <h5 className="font-medium text-sm mb-2">Commands:</h5>
                              {step.commands.map((cmd, idx) => (
                                <div key={idx} className="mb-2">
                                  <Badge variant="outline" className="mb-1">{cmd.platform}</Badge>
                                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                    <code>{cmd.code}</code>
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-3">
                            <h5 className="font-medium text-sm mb-1">Validation:</h5>
                            <ul className="text-sm space-y-1">
                              {step.validation.map((validation, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-1">✓</span>
                                  <span>{validation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ttp-execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Tactics, Techniques & Procedures</CardTitle>
              <CardDescription>Execute attack scenarios based on threat report analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {labPlan.ttpExecution.map((ttp) => (
                  <div key={ttp.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{ttp.name}</h4>
                          {ttp.mitreId && (
                            <Badge variant="outline">{ttp.mitreId}</Badge>
                          )}
                          <Badge>{ttp.platform}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{ttp.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="font-medium text-sm mb-1">Expected Log Sources:</h5>
                      <div className="flex flex-wrap gap-1">
                        {ttp.expectedLogs.map((log, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {log}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Validation Framework</CardTitle>
              <CardDescription>Comprehensive testing and validation procedures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Data Ingestion</h4>
                  <ul className="text-sm space-y-1">
                    {labPlan.validation.dataIngestion.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Detection Rules</h4>
                  <ul className="text-sm space-y-1">
                    {labPlan.validation.detectionRules.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Alert Generation</h4>
                  <ul className="text-sm space-y-1">
                    {labPlan.validation.alertGeneration.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Response Playbooks</h4>
                  <ul className="text-sm space-y-1">
                    {labPlan.validation.responsePlaybooks.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lab Build Planner</h1>
        <p className="text-gray-600">
          Generate comprehensive, step-by-step lab infrastructure plans from threat reports with OSI layer mapping, 
          Infrastructure as Code deployment, and automated TTP execution scenarios.
        </p>
      </div>

      {renderThreatInput()}
      {renderPlanOverview()}
      {renderLabExecution()}
    </div>
  );
}