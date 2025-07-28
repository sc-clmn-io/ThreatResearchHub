import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Terminal, 
  Shield, 
  Database,
  Network,
  Server,
  Code,
  Eye,
  Zap,
  Target,
  FileCode,
  Settings,
  MonitorSpeaker,
  Layers,
  GitBranch,
  Activity,
  Lock,
  Users,
  Cloud,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Globe
} from 'lucide-react';

// Simplified lab build plan interface
interface LabBuildPlan {
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  components: Array<{
    id: string;
    name: string;
    type: string;
    purpose: string;
    specifications: Record<string, any>;
  }>;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    instructions: string[];
    validation: string[];
    duration: string;
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
  const [selectedUseCase, setSelectedUseCase] = useState<any>(null);

  // Load selected use case on component mount
  useEffect(() => {
    const storedUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    if (storedUseCases.length > 0) {
      const latestUseCase = storedUseCases[storedUseCases.length - 1];
      setSelectedUseCase(latestUseCase);
      setThreatReportTitle(latestUseCase.title);
      setThreatReportContent(latestUseCase.description);
    }
  }, []);

  const generateLabPlan = useMutation({
    mutationFn: async (data: { content: string; title: string }) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a simplified lab plan
      const plan: LabBuildPlan = {
        title: data.title,
        description: data.content,
        category: 'security',
        estimatedTime: '2-3 hours',
        components: [
          {
            id: 'vm-1',
            name: 'Analysis VM',
            type: 'virtual-machine',
            purpose: 'Primary analysis environment',
            specifications: { os: 'Ubuntu 22.04', ram: '8GB', disk: '50GB' }
          }
        ],
        steps: [
          {
            id: 'step-1',
            title: 'Environment Setup',
            description: 'Initialize the lab environment',
            instructions: ['Deploy virtual machine', 'Install required tools'],
            validation: ['VM is accessible', 'Tools are installed'],
            duration: '30 minutes'
          }
        ],
        validation: {
          dataIngestion: ['Log collection verified'],
          detectionRules: ['Basic rules deployed'],
          alertGeneration: ['Test alerts generated'],
          responsePlaybooks: ['Playbooks configured']
        }
      };
      
      return plan;
    },
    onSuccess: (plan) => {
      setLabPlan(plan);
      queryClient.invalidateQueries({ queryKey: ['/api/lab-plans'] });
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateLabPlan.mutate({ 
      content: threatReportContent, 
      title: threatReportTitle 
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI-Powered Lab Build Planner</h1>
        <p className="text-muted-foreground">
          Transform threat reports into actionable security lab environments
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Threat Intelligence Input
          </CardTitle>
          <CardDescription>
            Provide threat report details to generate a customized lab environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Threat Report Title</label>
            <Input
              value={threatReportTitle}
              onChange={(e) => setThreatReportTitle(e.target.value)}
              placeholder="Enter threat report title..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Threat Report Content</label>
            <Textarea
              value={threatReportContent}
              onChange={(e) => setThreatReportContent(e.target.value)}
              placeholder="Paste your threat report content here..."
              className="min-h-[200px]"
            />
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={!threatReportContent.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Generating Lab Plan...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Lab Environment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lab Plan Display */}
      {labPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Generated Lab Plan: {labPlan.title}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">{labPlan.category}</Badge>
              <Badge variant="outline">{labPlan.estimatedTime}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="components">Infrastructure</TabsTrigger>
                <TabsTrigger value="steps">Build Steps</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{labPlan.description}</p>
                </div>
              </TabsContent>

              <TabsContent value="components" className="space-y-4">
                <div className="grid gap-4">
                  {labPlan.components.map((component) => (
                    <Card key={component.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Server className="w-4 h-4" />
                          <h4 className="font-medium">{component.name}</h4>
                          <Badge variant="outline">{component.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{component.purpose}</p>
                        <div className="text-sm">
                          <strong>Specifications:</strong> {JSON.stringify(component.specifications)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="steps" className="space-y-4">
                <div className="space-y-4">
                  {labPlan.steps.map((step, index) => (
                    <Card key={step.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">{step.title}</h4>
                          <Badge variant="outline">{step.duration}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium mb-2">Instructions</h5>
                            <ul className="text-sm space-y-1">
                              {step.instructions.map((instruction, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{instruction}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-medium mb-2">Validation</h5>
                            <ul className="text-sm space-y-1">
                              {step.validation.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Eye className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}