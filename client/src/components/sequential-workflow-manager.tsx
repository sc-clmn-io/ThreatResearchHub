import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Circle, Clock, AlertCircle, Target, Server, Database, Shield, TestTube, ArrowRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UseCaseDefinitionWizard from "./use-case-definition-wizard";
import InfrastructureDeploymentGuide from "./infrastructure-deployment-guide";
import DataSourceConfigurationGuide from "./data-source-configuration-guide";

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  estimatedTime: string;
  prerequisites: string[];
  completionCriteria: string[];
}

interface Props {
  onWorkflowComplete: (results: any) => void;
}

export default function SequentialWorkflowManager({ onWorkflowComplete }: Props) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowData, setWorkflowData] = useState<any>({});
  const [overallProgress, setOverallProgress] = useState(0);

  const workflowSteps: WorkflowStep[] = [
    {
      id: 1,
      title: "Use Case Definition",
      description: "Create standard use case definition template from customer POV or threat report",
      icon: <Target className="h-5 w-5" />,
      status: currentStep === 1 ? 'in-progress' : currentStep > 1 ? 'completed' : 'pending',
      estimatedTime: "15-20 minutes",
      prerequisites: ["Customer requirements or threat intelligence available"],
      completionCriteria: [
        "Security outcome clearly defined",
        "Threat scenario documented",
        "Infrastructure requirements specified",
        "Data source requirements identified",
        "Success criteria established"
      ]
    },
    {
      id: 2,
      title: "Infrastructure Deployment",
      description: "Step-by-step deployment of required infrastructure (firewalls, endpoints, cloud, identity)",
      icon: <Server className="h-5 w-5" />,
      status: currentStep === 2 ? 'in-progress' : currentStep > 2 ? 'completed' : currentStep < 2 ? 'blocked' : 'pending',
      estimatedTime: "2-4 hours",
      prerequisites: ["Use case definition completed", "Infrastructure requirements documented"],
      completionCriteria: [
        "All required systems deployed and operational",
        "Network segmentation configured",
        "Security tools installed and running",
        "Infrastructure verified with testing",
        "All prerequisites for data generation ready"
      ]
    },
    {
      id: 3,
      title: "Data Source Configuration",
      description: "Configure data sources to generate required logs and integrate with XSIAM",
      icon: <Database className="h-5 w-5" />,
      status: currentStep === 3 ? 'in-progress' : currentStep > 3 ? 'completed' : currentStep < 3 ? 'blocked' : 'pending',
      estimatedTime: "1-2 hours",
      prerequisites: ["Infrastructure operational", "XSIAM instance available"],
      completionCriteria: [
        "All data sources configured and generating logs",
        "XSIAM integration completed and tested",
        "Field mappings verified with test queries",
        "Real-time log ingestion confirmed",
        "Data quality validated"
      ]
    },
    {
      id: 4,
      title: "XSIAM Content Generation",
      description: "Generate correlation rules, alert layouts, playbooks, and dashboards",
      icon: <Shield className="h-5 w-5" />,
      status: currentStep === 4 ? 'in-progress' : currentStep > 4 ? 'completed' : currentStep < 4 ? 'blocked' : 'pending',
      estimatedTime: "45-60 minutes",
      prerequisites: ["Data sources configured", "Field mappings validated"],
      completionCriteria: [
        "XQL correlation rules generated and syntax-validated",
        "Alert layouts created with analyst decision buttons",
        "Automation playbooks built with proper task workflows",
        "Operational dashboards designed with KPIs",
        "Content ready for XSIAM deployment"
      ]
    },
    {
      id: 5,
      title: "Testing & Validation",
      description: "Deploy content to XSIAM and validate with controlled testing",
      icon: <TestTube className="h-5 w-5" />,
      status: currentStep === 5 ? 'in-progress' : currentStep > 5 ? 'completed' : currentStep < 5 ? 'blocked' : 'pending',
      estimatedTime: "30-45 minutes",
      prerequisites: ["XSIAM content generated", "Test scenarios prepared"],
      completionCriteria: [
        "Content deployed to XSIAM successfully",
        "Correlation rules tested with sample data",
        "Playbooks executed and verified",
        "Dashboard metrics displaying correctly",
        "False positive rate acceptable",
        "Performance impact minimal"
      ]
    },
    {
      id: 6,
      title: "Documentation & Deployment",
      description: "Generate final documentation and prepare for production deployment",
      icon: <FileText className="h-5 w-5" />,
      status: currentStep === 6 ? 'in-progress' : currentStep > 6 ? 'completed' : currentStep < 6 ? 'blocked' : 'pending',
      estimatedTime: "20-30 minutes",
      prerequisites: ["Testing completed successfully", "Content validated"],
      completionCriteria: [
        "Implementation guide created",
        "Runbook for ongoing operations",
        "Content package exported for deployment",
        "Training materials prepared",
        "Success metrics documented"
      ]
    }
  ];

  useEffect(() => {
    const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
    const progress = (completedSteps / workflowSteps.length) * 100;
    setOverallProgress(progress);
  }, [currentStep]);

  const handleStepComplete = (stepId: number, data: any) => {
    const updatedData = { ...workflowData };
    
    switch (stepId) {
      case 1:
        updatedData.useCaseDefinition = data;
        break;
      case 2:
        updatedData.infrastructureDeployment = data;
        break;
      case 3:
        updatedData.dataSourceConfiguration = data;
        break;
      case 4:
        updatedData.xsiamContent = data;
        break;
      case 5:
        updatedData.testingResults = data;
        break;
      case 6:
        updatedData.documentation = data;
        break;
    }
    
    setWorkflowData(updatedData);
    
    if (stepId < workflowSteps.length) {
      setCurrentStep(stepId + 1);
      toast({
        title: `Step ${stepId} Completed`,
        description: `${workflowSteps[stepId - 1].title} completed successfully. Proceeding to next step.`
      });
    } else {
      // Workflow complete
      onWorkflowComplete(updatedData);
      toast({
        title: "Workflow Complete!",
        description: "All steps completed successfully. Your XSIAM content is ready for deployment."
      });
    }
  };

  const canProceedToStep = (stepId: number) => {
    if (stepId === 1) return true;
    if (stepId === 2) return !!workflowData.useCaseDefinition;
    if (stepId === 3) return !!workflowData.infrastructureDeployment;
    if (stepId === 4) return !!workflowData.dataSourceConfiguration;
    if (stepId === 5) return !!workflowData.xsiamContent;
    if (stepId === 6) return !!workflowData.testingResults;
    return false;
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-8 w-8 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-8 w-8 text-gray-400" />;
      default:
        return <Circle className="h-8 w-8 text-gray-400" />;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <UseCaseDefinitionWizard
            onUseCaseCreated={(useCase) => handleStepComplete(1, useCase)}
            sourceType="customer_pov"
          />
        );
      
      case 2:
        return workflowData.useCaseDefinition ? (
          <InfrastructureDeploymentGuide
            useCase={workflowData.useCaseDefinition}
            onInfrastructureComplete={(deployment) => handleStepComplete(2, deployment)}
          />
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Please complete Step 1 first</p>
          </div>
        );
      
      case 3:
        return workflowData.infrastructureDeployment ? (
          <DataSourceConfigurationGuide
            useCase={workflowData.useCaseDefinition}
            onDataSourceComplete={(configuration) => handleStepComplete(3, configuration)}
          />
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Please complete Step 2 first</p>
          </div>
        );
      
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                XSIAM Content Generation
              </CardTitle>
              <CardDescription>
                Generate correlation rules, alert layouts, playbooks, and dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Ready to Generate Content</h4>
                  <p className="text-sm text-muted-foreground">
                    All prerequisites completed. Ready to generate XSIAM content based on your use case definition and data source configuration.
                  </p>
                </div>
                <Button onClick={() => handleStepComplete(4, { status: 'generated' })}>
                  Generate XSIAM Content
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Testing & Validation
              </CardTitle>
              <CardDescription>
                Deploy and test your XSIAM content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Ready for Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Deploy content to XSIAM and run validation tests to ensure everything works correctly.
                  </p>
                </div>
                <Button onClick={() => handleStepComplete(5, { status: 'tested' })}>
                  Start Testing
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentation & Deployment
              </CardTitle>
              <CardDescription>
                Generate final documentation and deployment packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Ready for Documentation</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate implementation guides, runbooks, and deployment packages for production use.
                  </p>
                </div>
                <Button onClick={() => handleStepComplete(6, { status: 'documented' })}>
                  Generate Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>XSIAM Enablement Workflow</CardTitle>
          <CardDescription>
            Complete step-by-step workflow from use case definition to deployed XSIAM content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}% Complete</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">Step {currentStep} of {workflowSteps.length}</div>
              <div className="text-sm text-muted-foreground">
                {workflowSteps.find(s => s.id === currentStep)?.title}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  {getStepIcon(step)}
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'in-progress' ? 'text-blue-600' :
                      step.status === 'blocked' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{step.estimatedTime}</div>
                  </div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className={`h-4 w-4 mx-4 ${
                    step.status === 'completed' ? 'text-green-600' : 'text-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {workflowSteps.find(s => s.id === currentStep)?.icon}
                Step {currentStep}: {workflowSteps.find(s => s.id === currentStep)?.title}
              </CardTitle>
              <CardDescription>
                {workflowSteps.find(s => s.id === currentStep)?.description}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {workflowSteps.find(s => s.id === currentStep)?.estimatedTime}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Prerequisites */}
          {workflowSteps.find(s => s.id === currentStep)?.prerequisites && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Prerequisites:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {workflowSteps.find(s => s.id === currentStep)?.prerequisites.map((prereq, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator className="my-6" />

          {/* Step Content */}
          {renderStepContent()}

          <Separator className="my-6" />

          {/* Completion Criteria */}
          <div>
            <h4 className="font-medium mb-2">Completion Criteria:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {workflowSteps.find(s => s.id === currentStep)?.completionCriteria.map((criteria, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  {criteria}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}