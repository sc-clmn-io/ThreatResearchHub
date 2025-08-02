import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, ArrowRight, Target, Users, Calendar } from 'lucide-react';

// Types for the DDLC workflow
interface ContentPackage {
  id: string;
  name: string;
  category: string;
  severity: string;
  ddlc_phase: string;
  version: string;
}

interface DDLCPhase {
  id: string;
  name: string;
  description: string;
  entry_criteria: string[];
  activities: string[];
  exit_criteria: string[];
  deliverables: string[];
  estimated_duration: string;
}

interface ProgressReport {
  current_phase: string;
  overall_progress: number;
  phase_completions: Array<{
    phase: string;
    status: 'completed' | 'in_progress' | 'pending';
    completion_percentage: number;
  }>;
  next_recommended_action: string;
  estimated_completion: string;
}

interface ChecklistItem {
  task: string;
  required: boolean;
  validation_method: string;
}

interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

interface Checklist {
  phase_name: string;
  checklist_items: ChecklistCategory[];
}

interface PhaseCompletion {
  completion_percentage: number;
  completed_items: string[];
  pending_items: string[];
  blocking_issues: string[];
}

export default function DDLCWorkflowDemo() {
  const [selectedPackage, setSelectedPackage] = useState<string>('');

  // Fetch content packages
  const { data: packages = [] } = useQuery<ContentPackage[]>({
    queryKey: ['/api/content/packages'],
  });

  // Fetch DDLC phases
  const { data: phases = [] } = useQuery<DDLCPhase[]>({
    queryKey: ['/api/ddlc/phases'],
  });

  // Fetch progress for selected package
  const { data: progressReport, refetch: refetchProgress } = useQuery<ProgressReport>({
    queryKey: ['/api/ddlc/progress', selectedPackage],
    enabled: !!selectedPackage,
  });

  // Select first package by default
  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0].id);
    }
  }, [packages, selectedPackage]);

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NVISO DDLC Workflow Engine</h1>
          <p className="text-muted-foreground mt-2">
            Detection Development Life Cycle with systematic phase management and validation
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Version 2.0
        </Badge>
      </div>

      {/* Package Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Content Package Selection
          </CardTitle>
          <CardDescription>
            Select a content package to view its DDLC workflow progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {pkg.category} • {pkg.severity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{pkg.ddlc_phase}</Badge>
                    {selectedPackage === pkg.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DDLC Progress Overview */}
      {progressReport && selectedPkg && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                DDLC Progress: {selectedPkg.name}
              </CardTitle>
              <CardDescription>
                Current phase: <Badge variant="outline">{progressReport.current_phase}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {progressReport.overall_progress}%
                  </span>
                </div>
                <Progress value={progressReport.overall_progress} className="h-2" />
              </div>

              {/* Phase Timeline */}
              <div className="space-y-3">
                <h4 className="font-medium">Phase Timeline</h4>
                <div className="space-y-2">
                  {progressReport.phase_completions.map((phase, index) => (
                    <div key={phase.phase} className="flex items-center gap-3">
                      {getPhaseIcon(phase.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="capitalize font-medium">
                            {phase.phase.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {phase.completion_percentage}%
                          </span>
                        </div>
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${getPhaseColor(phase.status)}`}
                              style={{ width: `${phase.completion_percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Action */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Next Recommended Action:</strong> {progressReport.next_recommended_action}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {progressReport.estimated_completion}
                </div>
                <p className="text-sm text-muted-foreground">Estimated Completion</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {progressReport.phase_completions.filter(p => p.status === 'completed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-orange-600">
                    {progressReport.phase_completions.filter(p => p.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Package Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <Badge variant="secondary">{selectedPkg.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Severity:</span>
                    <Badge variant={selectedPkg.severity === 'Critical' ? 'destructive' : 'secondary'}>
                      {selectedPkg.severity}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>{selectedPkg.version}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Phase Information */}
      <Tabs defaultValue="phases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="phases">Phase Details</TabsTrigger>
          <TabsTrigger value="checklist">Current Checklist</TabsTrigger>
          <TabsTrigger value="methodology">DDLC Methodology</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-4">
          <div className="grid gap-4">
            {phases.map((phase) => (
              <Card key={phase.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">
                      {phase.id.replace('_', ' ')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{phase.estimated_duration}</Badge>
                      {progressReport?.current_phase === phase.id && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{phase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 text-green-700">Entry Criteria</h4>
                      <ul className="text-sm space-y-1">
                        {phase.entry_criteria.map((criteria, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-blue-700">Key Activities</h4>
                      <ul className="text-sm space-y-1">
                        {phase.activities.slice(0, 3).map((activity, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-blue-500" />
                            {activity}
                          </li>
                        ))}
                        {phase.activities.length > 3 && (
                          <li className="text-muted-foreground text-xs">
                            +{phase.activities.length - 3} more activities...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          {selectedPkg && (
            <Card>
              <CardHeader>
                <CardTitle>Current Phase Checklist</CardTitle>
                <CardDescription>
                  Tasks for the {selectedPkg.ddlc_phase} phase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChecklistComponent 
                  packageId={selectedPackage} 
                  phase={selectedPkg.ddlc_phase} 
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="methodology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                NVISO DDLC Methodology
              </CardTitle>
              <CardDescription>
                Systematic approach to detection engineering with quality assurance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <h3>Detection-as-Code Principles</h3>
                <ul>
                  <li><strong>Version Control:</strong> Every detection rule and playbook is version controlled</li>
                  <li><strong>Collaborative Development:</strong> Team-based workflows with proper review processes</li>
                  <li><strong>Automated Testing:</strong> Validation pipelines ensure quality before production</li>
                  <li><strong>Standardized Formats:</strong> Consistent structure across all content types</li>
                </ul>

                <h3>6-Phase Workflow Benefits</h3>
                <ul>
                  <li><strong>Systematic Approach:</strong> Ensures no critical steps are missed</li>
                  <li><strong>Quality Assurance:</strong> Built-in validation at each phase transition</li>
                  <li><strong>Professional Standards:</strong> Industry-standard detection engineering practices</li>
                  <li><strong>Continuous Improvement:</strong> Ongoing optimization through monitoring phase</li>
                </ul>

                <h3>Integration with XSIAM</h3>
                <p>
                  The DDLC workflow generates production-ready XSIAM content including XQL correlation rules,
                  automation playbooks, alert layouts, and operational dashboards. Each component follows
                  XSIAM specifications and includes proper field mappings for seamless deployment.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Checklist Component
function ChecklistComponent({ packageId, phase }: { packageId: string; phase: string }) {
  const { data: checklist } = useQuery<Checklist>({
    queryKey: ['/api/ddlc/checklist', phase],
    enabled: !!phase,
  });

  const { data: completion } = useQuery<PhaseCompletion>({
    queryKey: ['/api/ddlc/completion', packageId, phase],
    enabled: !!packageId && !!phase,
  });

  if (!checklist || !completion) {
    return <div>Loading checklist...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{checklist.phase_name}</h3>
        <Badge variant="secondary">
          {completion.completion_percentage}% Complete
        </Badge>
      </div>

      <Progress value={completion.completion_percentage} className="h-2" />

      {checklist.checklist_items.map((category, categoryIndex) => (
        <div key={categoryIndex} className="space-y-3">
          <h4 className="font-medium text-blue-700">{category.category}</h4>
          <div className="space-y-2">
            {category.items.map((item, itemIndex) => {
              const isCompleted = completion.completed_items.includes(item.task);
              return (
                <div key={itemIndex} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                        {item.task}
                      </span>
                      {item.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Validation: {item.validation_method}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {completion.blocking_issues.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Blocking Issues:</strong>
            <ul className="mt-1 list-disc list-inside">
              {completion.blocking_issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}