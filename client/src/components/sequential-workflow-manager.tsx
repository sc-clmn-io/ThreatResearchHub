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
import SecurityStackConfig from "../pages/security-stack-config";
import ProductionDeploymentGenerator from "./production-deployment-generator";

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
  const [showInputSelection, setShowInputSelection] = useState(false);
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
      title: "Security Stack Configuration",
      description: "Select and configure your security tools across 6 categories (SIEM, EDR, Firewall, SOAR, ASM, Attack Simulation)",
      icon: <Shield className="h-5 w-5" />,
      status: currentStep === 2 ? 'in-progress' : currentStep > 2 ? 'completed' : currentStep < 2 ? 'blocked' : 'pending',
      estimatedTime: "10-15 minutes",
      prerequisites: ["Use case definition completed", "Security requirements identified"],
      completionCriteria: [
        "SIEM platform selected and configured",
        "EDR solution chosen for endpoint monitoring",
        "Firewall/network security tools configured",
        "SOAR platform integrated for automation",
        "Attack surface management tools selected",
        "Attack simulation platform configured"
      ]
    },
    {
      id: 3,
      title: "Infrastructure Deployment",
      description: "Step-by-step deployment of required infrastructure with selected security tools integration",
      icon: <Server className="h-5 w-5" />,
      status: currentStep === 3 ? 'in-progress' : currentStep > 3 ? 'completed' : currentStep < 3 ? 'blocked' : 'pending',
      estimatedTime: "2-4 hours",
      prerequisites: ["Use case definition completed", "Security stack configured", "Infrastructure requirements documented"],
      completionCriteria: [
        "All required systems deployed and operational",
        "Network segmentation configured",
        "Selected security tools installed and running",
        "Platform integrations verified with testing",
        "All prerequisites for data generation ready"
      ]
    },
    {
      id: 4,
      title: "Data Source Configuration",
      description: "Configure data sources to generate required logs and integrate with selected SIEM platform",
      icon: <Database className="h-5 w-5" />,
      status: currentStep === 4 ? 'in-progress' : currentStep > 4 ? 'completed' : currentStep < 4 ? 'blocked' : 'pending',
      estimatedTime: "1-2 hours",
      prerequisites: ["Infrastructure operational", "Security stack configured", "SIEM platform available"],
      completionCriteria: [
        "All data sources configured and generating logs",
        "Selected SIEM integration completed and tested",
        "Field mappings verified with test queries",
        "Real-time log ingestion confirmed",
        "Data quality validated"
      ]
    },
    {
      id: 5,
      title: "Platform Content Generation",
      description: "Generate platform-specific detection rules, alert layouts, playbooks, and dashboards",
      icon: <Shield className="h-5 w-5" />,
      status: currentStep === 5 ? 'in-progress' : currentStep > 5 ? 'completed' : currentStep < 5 ? 'blocked' : 'pending',
      estimatedTime: "45-60 minutes",
      prerequisites: ["Data sources configured", "Field mappings validated"],
      completionCriteria: [
        "Platform-specific detection rules generated and syntax-validated",
        "Alert layouts created with analyst decision buttons",
        "Automation playbooks built with proper task workflows",
        "Operational dashboards designed with KPIs",
        "Content ready for selected platform deployment"
      ]
    },
    {
      id: 6,
      title: "Testing & Validation",
      description: "Deploy content to selected platforms and validate with controlled testing",
      icon: <TestTube className="h-5 w-5" />,
      status: currentStep === 6 ? 'in-progress' : currentStep > 6 ? 'completed' : currentStep < 6 ? 'blocked' : 'pending',
      estimatedTime: "30-45 minutes",
      prerequisites: ["Platform content generated", "Test scenarios prepared"],
      completionCriteria: [
        "Content deployed to selected platforms successfully",
        "Correlation rules tested with sample data",
        "Playbooks executed and verified",
        "Dashboard metrics displaying correctly",
        "False positive rate acceptable",
        "Performance impact minimal"
      ]
    },
    {
      id: 7,
      title: "Documentation & Deployment",
      description: "Generate final documentation and prepare for production deployment",
      icon: <FileText className="h-5 w-5" />,
      status: currentStep === 7 ? 'in-progress' : currentStep > 7 ? 'completed' : currentStep < 7 ? 'blocked' : 'pending',
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
        updatedData.securityStack = data;
        break;
      case 3:
        updatedData.infrastructureDeployment = data;
        break;
      case 4:
        updatedData.dataSourceConfiguration = data;
        break;
      case 5:
        updatedData.platformContent = data;
        break;
      case 6:
        updatedData.testingResults = data;
        break;
      case 7:
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
    if (stepId === 3) return !!workflowData.securityStack;
    if (stepId === 4) return !!workflowData.infrastructureDeployment;
    if (stepId === 5) return !!workflowData.dataSourceConfiguration;
    if (stepId === 6) return !!workflowData.platformContent;
    if (stepId === 7) return !!workflowData.testingResults;
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
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Stage 1: Use Case Definition</h2>
              <p className="text-muted-foreground">Start by selecting your input source and defining your security use case</p>
            </div>
            <UseCaseDefinitionWizard
              onUseCaseCreated={(useCase) => handleStepComplete(1, useCase)}
              sourceType="customer_pov"
            />
          </div>
        );
      
      case 2:
        return workflowData.useCaseDefinition ? (
          <SecurityStackConfig
            useCase={workflowData.useCaseDefinition}
            onSecurityStackComplete={(stack: any) => handleStepComplete(2, stack)}
          />
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Please complete Step 1 first</p>
          </div>
        );
      
      case 3:
        return workflowData.securityStack ? (
          <InfrastructureDeploymentGuide
            useCase={workflowData.useCaseDefinition}
            securityStack={workflowData.securityStack}
            onInfrastructureComplete={(deployment: any) => handleStepComplete(3, deployment)}
          />
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Please complete security stack configuration first</p>
          </div>
        );
      
      case 4:
        return workflowData.infrastructureDeployment ? (
          <DataSourceConfigurationGuide
            useCase={workflowData.useCaseDefinition}
            onDataSourceComplete={(configuration: any) => handleStepComplete(4, configuration)}
          />
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Please complete infrastructure deployment first</p>
          </div>
        );
      
      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Platform Content Generation
              </CardTitle>
              <CardDescription>
                Generate platform-specific detection rules, alert layouts, playbooks, and dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Ready to Generate Content</h4>
                  <p className="text-sm text-muted-foreground">
                    All prerequisites completed. Ready to generate security content for your selected platforms based on use case and data configuration.
                  </p>
                </div>
                <Button onClick={() => handleStepComplete(5, { status: 'generated' })}>
                  Generate Security Content
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
                <TestTube className="h-5 w-5" />
                Testing & Validation
              </CardTitle>
              <CardDescription>
                Deploy and test your security content
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
                <Button onClick={() => handleStepComplete(6, { status: 'tested' })}>
                  Start Testing
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentation & Deployment
              </CardTitle>
              <CardDescription>
                Generate final documentation and production deployment packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Production Deployment Ready</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate complete deployment packages with documentation, scripts, and content for production deployment.
                  </p>
                </div>
                
                <ProductionDeploymentGenerator 
                  useCases={JSON.parse(localStorage.getItem('useCases') || '[]')}
                  contentLibrary={JSON.parse(localStorage.getItem('contentLibrary') || '[]')}
                />
                
                <div className="pt-4">
                  <Button onClick={() => handleStepComplete(7, { 
                    status: 'documented',
                    deploymentPackageGenerated: true,
                    timestamp: new Date().toISOString()
                  })}>
                    Complete Workflow
                  </Button>
                </div>
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
          <CardTitle>Threat Use Case Build and Test Workflow</CardTitle>
          <CardDescription>
            Complete step-by-step workflow from use case definition to deployed security content across your selected platforms
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