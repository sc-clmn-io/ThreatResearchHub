import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Server, 
  Network, 
  Shield, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  FileText,
  Users,
  Database
} from 'lucide-react';
import { generateLabBuildoutPath, type LabConfiguration } from '@/lib/lab-buildout-generator';
import type { UseCase, TrainingPath, TrainingStep } from '@shared/schema';

interface LabBuildoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  useCase: UseCase;
  onStartLabBuildout: (trainingPath: TrainingPath) => void;
}

export function LabBuildoutModal({ isOpen, onClose, useCase, onStartLabBuildout }: LabBuildoutModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [labConfig, setLabConfig] = useState<LabConfiguration>({
    labType: 'poc',
    environment: 'hybrid',
    dataVolume: 'medium',
    complexity: 'intermediate',
    timeline: 'month'
  });
  const [trainingPath, setTrainingPath] = useState<TrainingPath | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  const handleGenerateLabBuildout = async () => {
    setIsBuilding(true);
    try {
      const path = generateLabBuildoutPath(useCase, labConfig);
      setTrainingPath(path);
    } catch (error) {
      console.error('Error generating lab buildout:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleStartBuildout = () => {
    if (trainingPath) {
      onStartLabBuildout(trainingPath);
      onClose();
    }
  };

  const toggleStepCompletion = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const getStepIcon = (category: TrainingStep['category']) => {
    switch (category) {
      case 'environment_buildout': return <Server className="h-4 w-4" />;
      case 'detection_engineering': return <Network className="h-4 w-4" />;
      case 'layout_configuration': return <Settings className="h-4 w-4" />;
      case 'automation_playbook': return <Shield className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: TrainingStep['category']) => {
    switch (category) {
      case 'environment_buildout': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'detection_engineering': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'layout_configuration': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'automation_playbook': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const progressPercentage = trainingPath ? (completedSteps.size / (trainingPath.steps as any[]).length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Lab Buildout: {useCase.title}
          </DialogTitle>
          <DialogDescription>
            Comprehensive step-by-step infrastructure setup and validation for your use case
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[calc(90vh-8rem)] overflow-hidden">
          {!trainingPath ? (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Lab Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Lab Configuration</CardTitle>
                  <CardDescription>
                    Configure your lab setup parameters to generate customized buildout instructions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lab Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['poc', 'pilot', 'production', 'demo'] as const).map((type) => (
                          <Button
                            key={type}
                            variant={labConfig.labType === type ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLabConfig(prev => ({ ...prev, labType: type }))}
                          >
                            {type.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Environment</label>
                      <div className="grid grid-cols-1 gap-2">
                        {(['cloud', 'hybrid', 'on_premise'] as const).map((env) => (
                          <Button
                            key={env}
                            variant={labConfig.environment === env ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLabConfig(prev => ({ ...prev, environment: env }))}
                          >
                            {env.replace('_', ' ').toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Volume</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['small', 'medium', 'large', 'enterprise'] as const).map((volume) => (
                          <Button
                            key={volume}
                            variant={labConfig.dataVolume === volume ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLabConfig(prev => ({ ...prev, dataVolume: volume }))}
                          >
                            {volume.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Complexity</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['basic', 'intermediate', 'advanced', 'expert'] as const).map((complexity) => (
                          <Button
                            key={complexity}
                            variant={labConfig.complexity === complexity ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLabConfig(prev => ({ ...prev, complexity: complexity }))}
                          >
                            {complexity.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timeline</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['sprint', 'month', 'quarter', 'extended'] as const).map((timeline) => (
                          <Button
                            key={timeline}
                            variant={labConfig.timeline === timeline ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLabConfig(prev => ({ ...prev, timeline: timeline }))}
                          >
                            {timeline.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Configuration will generate tailored infrastructure setup instructions
                    </div>
                    <Button onClick={handleGenerateLabBuildout} disabled={isBuilding}>
                      {isBuilding ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Generate Lab Buildout
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Use Case Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Use Case Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Category</div>
                      <Badge className={getCategoryColor('infrastructure')}>
                        {useCase.category}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Severity</div>
                      <Badge variant="destructive">
                        {useCase.severity}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Estimated Duration</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {useCase.estimatedDuration} minutes
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Description</div>
                    <p className="text-sm text-muted-foreground">
                      {useCase.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="overview" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="steps">Build Steps</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lab Buildout Progress</CardTitle>
                      <CardDescription>
                        Track your progress through the lab infrastructure setup
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{completedSteps.size} of {trainingPath.steps.length} steps</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(['environment_buildout', 'detection_engineering', 'layout_configuration', 'automation_playbook'] as const).map((category) => {
                          const categorySteps = trainingPath.steps.filter((step: any) => step.category === category);
                          const completedCategorySteps = categorySteps.filter((_: any, index: number) => 
                            completedSteps.has(trainingPath.steps.indexOf(categorySteps[index]))
                          );

                          return (
                            <Card key={category}>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  {getStepIcon(category)}
                                  <span className="font-medium capitalize">{category}</span>
                                </div>
                                <div className="text-2xl font-bold">
                                  {completedCategorySteps.length}/{categorySteps.length}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {Math.round((completedCategorySteps.length / categorySteps.length) * 100)}% complete
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Complete all validation steps before proceeding to production deployment.
                          Each step includes comprehensive testing and verification procedures.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="steps" className="flex-1 overflow-y-auto space-y-4">
                  <div className="space-y-4">
                    {(trainingPath.steps as any[]).map((step: any, index: number) => (
                      <Card key={step.id} className={`transition-all ${activeStep === index ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={completedSteps.has(index)}
                                onCheckedChange={() => toggleStepCompletion(index)}
                              />
                              <div className="flex items-center gap-2">
                                {getStepIcon(step.category)}
                                <div>
                                  <CardTitle className="text-base">{step.title}</CardTitle>
                                  <CardDescription>{step.description}</CardDescription>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getCategoryColor(step.category)}>
                                {step.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {step.estimatedDuration}m
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div dangerouslySetInnerHTML={{ __html: step.content?.replace(/\n/g, '<br />') || '' }} />
                          </div>
                          
                          {step.dependencies && step.dependencies.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-1">Prerequisites:</div>
                              <div className="flex flex-wrap gap-1">
                                {step.dependencies.map((dep: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {dep}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.metadata?.validationCriteria && (
                            <div>
                              <div className="text-sm font-medium mb-2">Validation Criteria:</div>
                              <div className="space-y-1">
                                {step.metadata.validationCriteria.map((criteria: string, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {criteria}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="flex-1 overflow-y-auto space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Validation and Testing Framework</CardTitle>
                      <CardDescription>
                        Comprehensive validation procedures to ensure lab functionality
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          All infrastructure components must pass validation before the lab is ready for training scenarios.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Infrastructure Validation</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="space-y-1">
                              <Checkbox /> Network connectivity verified
                            </div>
                            <div className="space-y-1">
                              <Checkbox /> Resource allocation confirmed
                            </div>
                            <div className="space-y-1">
                              <Checkbox /> Security boundaries established
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Integration Validation</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="space-y-1">
                              <Checkbox /> Data sources connected
                            </div>
                            <div className="space-y-1">
                              <Checkbox /> APIs responding properly
                            </div>
                            <div className="space-y-1">
                              <Checkbox /> Authentication working
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Detection Validation</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="space-y-1">
                              <Checkbox /> Rules generating alerts
                            </div>
                            <div className="space-y-1">
                              <Checkbox /> False positive rate acceptable
                            </div>
                            <div className="space-y-1">
                              <Checkbox /> Alert layouts functional
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Automation Validation</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="space-y-1">
                              <Checkbox /> Playbooks executing
                            </div>
                            <div className="space-y-1">
                              <Checkbox /> Integrations functional
                            </div>
                            <div className="space-y-1">
                              <Checkbox /> Performance acceptable
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="flex-1 overflow-y-auto space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Resources</CardTitle>
                      <CardDescription>
                        Documentation, tools, and support resources for lab buildout
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-medium">Documentation</h4>
                          <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <FileText className="h-4 w-4 mr-2" />
                              Cortex XSIAM Admin Guide
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Integration Documentation
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <Network className="h-4 w-4 mr-2" />
                              Network Configuration Guide
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium">Support</h4>
                          <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <Users className="h-4 w-4 mr-2" />
                              Contact Support Team
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Community Forums
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <FileText className="h-4 w-4 mr-2" />
                              Troubleshooting Guide
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t bg-background">
            <div className="text-sm text-muted-foreground">
              {trainingPath ? `Total Duration: ${trainingPath.totalDuration} minutes` : 'Configure lab parameters to begin'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {trainingPath ? 'Save Progress' : 'Cancel'}
              </Button>
              {trainingPath && (
                <Button onClick={handleStartBuildout}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Lab Buildout
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}