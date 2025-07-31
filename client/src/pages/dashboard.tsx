import { useState, useEffect } from "react";
import { Shield, FileText, Zap, Monitor, Github, Search, Trash2, Database, ArrowRight, ArrowLeft, CheckCircle, Cog, Brain, Users, Globe, Archive, Play } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ThreatInput from "@/components/threat-input";
import UseCaseList from "@/components/use-case-list";
import ValidationQueue from "@/components/validation-queue";
import WorkflowProgressTracker from "@/components/workflow-progress-tracker";
import ContentRecommendationEngine from "@/components/content-recommendation-engine";

export default function Dashboard() {
  const { toast } = useToast();
  const [workflowStats, setWorkflowStats] = useState({
    threatsLoaded: 0,
    contentGenerated: 0,
    labsPlanned: 0,
    xsiamDeployed: 0,
    githubBackups: 0
  });

  const [selectedUseCase, setSelectedUseCase] = useState<any>(null);
  const [useCases, setUseCases] = useState<any[]>([]);

  useEffect(() => {
    // Function to refresh workflow data
    const refreshWorkflowData = () => {
      const storedUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      const contentLibrary = JSON.parse(localStorage.getItem('contentLibrary') || '[]');
      
      console.log('Stored use cases:', storedUseCases);
      console.log('Use cases length:', storedUseCases.length);
      setUseCases(storedUseCases);
      
      setWorkflowStats({
        threatsLoaded: storedUseCases.length,
        contentGenerated: contentLibrary.length,
        labsPlanned: 0,
        xsiamDeployed: 0,
        githubBackups: 0
      });
    };

    // Initial load
    refreshWorkflowData();

    // Listen for use case additions
    const handleUseCaseAdded = () => {
      setTimeout(refreshWorkflowData, 100); // Small delay to ensure storage is updated
    };

    window.addEventListener('useCaseAdded', handleUseCaseAdded);
    window.addEventListener('storage', handleUseCaseAdded);
    
    return () => {
      window.removeEventListener('useCaseAdded', handleUseCaseAdded);
      window.removeEventListener('storage', handleUseCaseAdded);
    };
  }, []);

  // Check for forced step navigation first  
  const forceStep = localStorage.getItem('forceStep');
  let currentStep;
  
  if (forceStep) {
    currentStep = parseInt(forceStep);
    localStorage.removeItem('forceStep'); // Remove after using
  } else {
    // Normal workflow sequence - infrastructure BEFORE content generation
    // Step 1: Load threat reports
    // Step 2: Select specific use case  
    // Step 3: Plan lab infrastructure for selected threat
    // Step 4: Onboard data sources & ingest logs
    // Step 5: Generate content (after infrastructure is ready)
    // Step 6: Test & deploy
    currentStep = useCases.length === 0 ? 1 :
                       !selectedUseCase ? 2 : 
                       workflowStats.labsPlanned === 0 ? 3 :
                       workflowStats.xsiamDeployed === 0 ? 4 :
                       workflowStats.contentGenerated === 0 ? 5 : 6;
  }
                     
  console.log('Current step calculated:', currentStep);
  console.log('Selected use case:', selectedUseCase);

  const clearAllData = () => {
    localStorage.removeItem('useCases');
    localStorage.removeItem('contentLibrary');
    localStorage.removeItem('threats');
    localStorage.removeItem('cortex-training-db');
    localStorage.removeItem('security-research-platform-db');
    window.location.reload();
  };

  const stepInstructions = {
    1: {
      title: "Intelligence Ingestion",
      instruction: "Ingest threat intelligence and generate structured raw reports for content engineering workflow:",
      options: [
        "Process threats from integrated intelligence feeds and generate raw reports",
        "Import threat reports via PDF upload or URL ingestion for analysis",
        "Define custom security outcomes based on organizational requirements"
      ],
      verification: "Raw intelligence reports generated and available for threat selection and use case development"
    },
    2: {
      title: "Threat Selection & Use Case Definition",
      instruction: "Select target threat scenario and define comprehensive security use case parameters:",
      options: [
        "Analyze generated intelligence reports and select primary threat vector",
        "Define security objectives, success criteria, and detection requirements", 
        "Establish scope boundaries and technology stack requirements"
      ],
      verification: "Primary threat vector selected with comprehensive use case definition and measurable objectives"
    },
    3: {
      title: "Infrastructure Architecture & Deployment Planning",
      instruction: "Design and deploy comprehensive infrastructure architecture to replicate threat scenarios:",
      options: [
        "Deploy network infrastructure, endpoints, and cloud environments with configurations matching threat requirements",
        "Configure identity platforms, email systems, and security controls based on threat attack vectors", 
        "Establish controlled attack simulation environment with complete infrastructure stack"
      ],
      verification: "Infrastructure architecture deployed with comprehensive documentation enabling threat scenario replication"
    },
    4: {
      title: "Data Source Integration & XSIAM Configuration",
      instruction: "Configure comprehensive data source integration with XSIAM platform:",
      options: [
        "Configure enterprise data sources for log generation and collection across infrastructure stack",
        "Implement XSIAM broker/connector architecture with field mapping and data normalization",
        "Validate data ingestion pipeline through XQL query testing and field verification"
      ],
      verification: "XSIAM platform successfully ingesting production data with validated field mappings and operational XQL queries"
    },
    5: {
      title: "Production-Ready Content Generation & Validation",
      instruction: "Generate comprehensive XSIAM security content package for operational deployment:",
      options: [
        "XQL correlation rules with authenticated field mappings and production-grade threat detection logic",
        "Alert layouts featuring analyst decision workflows and automated response capabilities",
        "XSIAM automation playbooks with threat response procedures and operational monitoring dashboards"
      ],
      verification: "Complete content package generated with validated field references and operational readiness confirmation"
    },
    6: {
      title: "Testing, Deployment & Operational Readiness",
      instruction: "Execute comprehensive testing protocol and deployment validation using production-ready XSIAM content:",
      options: [
        "Copy generated XQL correlation rules, alert layouts, and playbooks directly to XSIAM environment", 
        "Execute live testing with step-by-step upload instructions and validation checklist",
        "Verify operational readiness with copy-to-clipboard functionality and deployment verification"
      ],
      verification: "All content validates successfully in XSIAM with confirmed threat detection, workflow execution, and operational readiness"
    }
  };

  const currentInstructions = stepInstructions[currentStep as keyof typeof stepInstructions];

  const workflowSteps = [
    {
      id: 'current-step',
      title: currentInstructions.title,
      description: currentInstructions.instruction,
      status: 'current' as const,
      href: currentStep === 1 ? '/' : 
            currentStep === 2 ? '/content-generation' :
            currentStep === 3 ? '/lab-build-planner' :
            currentStep === 4 ? '/xsiam-debugger' :
            currentStep === 5 ? '/content-generation' : '/xsiam-testing'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">ThreatResearchHub</h1>
              <span className="ml-2 text-sm text-gray-500">Content Engineering Workflow</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Progress: {Math.max(0, currentStep - 1)}/6 stages
              </span>
              

              
              <Button variant="outline" size="sm" onClick={clearAllData} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1" />
                Start Over
              </Button>
              
              <Link href="/user-guide">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-1" />
                  Help
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Clear 6-Step Workflow */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Persistent Progress Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">6-Stage Workflow Progress</h3>
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <button 
                    onClick={() => {
                      if (step <= currentStep || step === 1) {
                        // Allow navigation to completed steps or step 1
                        localStorage.setItem('forceStep', step.toString());
                        window.location.reload();
                      }
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step < currentStep ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer' :
                      step === currentStep ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    } ${step <= currentStep || step === 1 ? 'hover:scale-105' : 'cursor-not-allowed'}`}
                    disabled={step > currentStep && step !== 1}
                    title={step <= currentStep || step === 1 ? `Go to Stage ${step}` : 'Complete previous stages first'}
                  >
                    {step < currentStep ? '✓' : step}
                  </button>
                  {step < 6 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2 text-xs text-center">
              <div className={currentStep === 1 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Intelligence Ingestion
              </div>
              <div className={currentStep === 2 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Threat Selection
              </div>
              <div className={currentStep === 3 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Infrastructure Planning
              </div>
              <div className={currentStep === 4 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Data Source Integration
              </div>
              <div className={currentStep === 5 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Content Generation
              </div>
              <div className={currentStep === 6 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Testing & Deployment
              </div>
            </div>
            
            {/* Navigation Help Text */}
            <div className="mt-4 text-xs text-gray-600 text-center">
              <span className="inline-flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                Click completed stages (✓) to review or modify previous work
                <span className="mx-3">•</span>
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                Current stage in progress
                <span className="mx-3">•</span>
                <span className="w-3 h-3 bg-gray-200 rounded-full mr-1"></span>
                Future stages (complete previous stages first)
              </span>
            </div>
            
            {/* Stage Navigation for Stages 2+ */}
            {currentStep > 1 && currentStep < 6 && (
              <div className="mt-6 flex justify-between items-center">
                <Button 
                  variant="outline"
                  size="lg" 
                  onClick={() => {
                    localStorage.setItem('forceStep', (currentStep - 1).toString());
                    window.location.reload();
                  }}
                  className="px-8"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Stage
                </Button>
                
                <Button 
                  size="lg" 
                  onClick={() => {
                    if (currentStep === 2 && !selectedUseCase) {
                      toast({
                        title: "Select Use Case First", 
                        description: "Please select a specific use case before continuing.",
                        variant: "destructive"
                      });
                      return;
                    }
                    // Continue to next step
                    localStorage.setItem('currentWorkflowStep', (currentStep + 1).toString());
                    window.location.reload();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue to Step {currentStep + 1}
                </Button>
              </div>
            )}
            
            {currentStep === 6 && (
              <div className="mt-6 text-center">
                <div className="text-green-600 font-semibold text-lg">
                  ✓ Workflow Complete! Your XSIAM content is ready for deployment.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Step Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
              {currentStep}
            </div>
            <h2 className="text-xl font-bold text-blue-800">{currentInstructions.title}</h2>
          </div>
          
          {/* Show sequence context for clarity */}
          <div className="text-sm text-blue-600 mb-3">
            Stage {currentStep} of 6: {currentStep === 1 ? "Intelligence ingestion and raw report generation" : 
                                     currentStep === 2 ? "Threat selection and use case definition" :
                                     currentStep === 3 ? "Infrastructure architecture and deployment planning" :
                                     currentStep === 4 ? "Data source integration and XSIAM configuration" :
                                     currentStep === 5 ? "Production-ready content generation and validation" : "Testing, deployment, and operational readiness"}
          </div>
          
          <p className="text-blue-700 mb-4 text-lg">{currentInstructions.instruction}</p>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-2">Content to be created:</h4>
            <ul className="space-y-1">
              {currentInstructions.options.map((option: string, index: number) => (
                <li key={index} className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-2">•</span>
                  {option}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 font-medium">✓ Completion criteria:</p>
            <p className="text-green-700">{currentInstructions.verification}</p>
          </div>
        </div>

        {/* Show only current step content */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Show Created Use Cases First */}
            {useCases.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
                <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  ✅ Your Security Outcomes/Use Cases ({useCases.length} total)
                </h3>
                <div className="space-y-3">
                  {useCases.map((useCase, index) => (
                    <div key={useCase.id} className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900">{useCase.title}</h4>
                        <p className="text-sm text-green-700 mt-1">{useCase.description?.substring(0, 100)}...</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{useCase.category}</Badge>
                          <Badge variant="outline" className="text-xs">{useCase.severity}</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedUseCase(useCase);
                          toast({
                            title: "Security Outcome Selected",
                            description: `Selected "${useCase.title}" for the 6-step workflow. You can now proceed to Step 2.`
                          });
                        }}
                      >
                        Select This Security Outcome
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Next Step:</strong> Select one security outcome above, then click "Continue to Step 2" to proceed with infrastructure planning.
                  </p>
                </div>
              </div>
            )}
            
            {/* Simplified Input Options */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-center">Intelligence Processing & Use Case Generation</h3>
              <p className="text-sm text-gray-600 mb-6 text-center">Process threat intelligence sources or define custom security requirements for content engineering</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Threat Intelligence Sources */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Intelligence Sources</h4>
                  
                  <div 
                    onClick={() => window.location.href = '/threat-input?tab=feeds'}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-500 cursor-pointer transition-all bg-gray-50 hover:bg-green-50"
                  >
                    <div className="flex items-center">
                      <Shield className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <h5 className="font-medium text-gray-900">TBH Threat Feeds</h5>
                        <p className="text-xs text-gray-600">Access integrated threat intelligence repository</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => window.location.href = '/threat-input?tab=pdf'}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-all bg-gray-50 hover:bg-blue-50"
                  >
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <h5 className="font-medium text-gray-900">PDF Intelligence Import</h5>
                        <p className="text-xs text-gray-600">Process threat intelligence from PDF documents</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => window.location.href = '/threat-input?tab=url'}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-all bg-gray-50 hover:bg-blue-50"
                  >
                    <div className="flex items-center">
                      <Globe className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <h5 className="font-medium text-gray-900">URL Intelligence Ingestion</h5>
                        <p className="text-xs text-gray-600">Process intelligence from security research URLs</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Customer POV */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Custom Requirements</h4>
                  
                  <div 
                    onClick={() => window.location.href = '/threat-input?mode=customer-pov'}
                    className="p-4 border border-purple-200 rounded-lg hover:border-purple-500 cursor-pointer transition-all bg-purple-50 hover:bg-purple-100"
                  >
                    <div className="flex items-center">
                      <Users className="h-6 w-6 text-purple-600 mr-3" />
                      <div>
                        <h5 className="font-medium text-purple-900">Requirements Definition</h5>
                        <p className="text-xs text-purple-700">Define security objectives from organizational requirements</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-800">
                      <strong>For Customer POV:</strong> Define the specific security outcome you want to achieve, including the threat scenario, required infrastructure, and success criteria.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Step 1 Completion */}
            {useCases.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-center">
                  <h4 className="font-semibold text-green-800 mb-2">Step 1 Complete!</h4>
                  <p className="text-green-700 text-sm mb-4">
                    You have {useCases.length} security outcome{useCases.length !== 1 ? 's' : ''} ready for the 6-step workflow.
                  </p>
                  <p className="text-sm text-gray-600">
                    Select a security outcome above to proceed to infrastructure planning.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="text-center">
                  <h4 className="font-medium text-blue-800 mb-2">Create Your First Security Outcome</h4>
                  <p className="text-blue-700 text-sm mb-4">
                    Choose a method above to create a security outcome or use case definition.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Select Specific Use Case</h3>
            <p className="text-gray-600 mb-4">You have {workflowStats.threatsLoaded} threat report(s). Select exactly which one to build content for:</p>
            
            <div className="space-y-3 mb-6">
              {useCases.map((useCase, index) => (
                <div key={index} className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedUseCase?.title === useCase.title 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => setSelectedUseCase(useCase)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{useCase.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{useCase.description}</p>
                      {useCase.cves && useCase.cves.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-red-600">CVEs: </span>
                          <span className="text-xs text-red-500">{useCase.cves.join(', ')}</span>
                        </div>
                      )}
                      {useCase.threatActors && useCase.threatActors.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-purple-600">Threat Actors: </span>
                          <span className="text-xs text-purple-500">{useCase.threatActors.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    {selectedUseCase?.title === useCase.title && (
                      <div className="text-blue-600">
                        <Shield className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedUseCase && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✓ Selected: {selectedUseCase.title}</p>
                <p className="text-green-700 text-sm mt-1">Ready to generate targeted content for this specific threat</p>
              </div>
            )}
          </div>
        )}
        
        {currentStep === 3 && selectedUseCase && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Plan Infrastructure for: {selectedUseCase.title}</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-800">Threat Details:</h4>
              <p className="text-blue-700 text-sm">{selectedUseCase.description}</p>
              {selectedUseCase.cves && (
                <p className="text-blue-700 text-sm mt-1"><strong>CVEs:</strong> {selectedUseCase.cves.join(', ')}</p>
              )}
              {selectedUseCase.technologies && (
                <p className="text-blue-700 text-sm mt-1"><strong>Technologies:</strong> {selectedUseCase.technologies.join(', ')}</p>
              )}
            </div>
            <div className="text-center">
              <Link href="/lab-build-planner">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  <Monitor className="h-5 w-5 mr-2" />
                  Plan Infrastructure
                </Button>
              </Link>
            </div>
          </div>
        )}

        {currentStep === 4 && selectedUseCase && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Data Source Integration for: {selectedUseCase.title}</h3>
              <div className="text-center">
                <Link href="/data-source-integration">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                    <Database className="h-5 w-5 mr-2" />
                    Setup Data Sources
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Add Content Recommendation Engine */}
            <ContentRecommendationEngine 
              useCase={selectedUseCase}
              onImplementRecommendation={(recommendation) => {
                toast({
                  title: "Content Recommendation",
                  description: `${recommendation.title} recommendation noted for implementation`,
                });
              }}
            />
          </div>
        )}
        
        {currentStep === 5 && selectedUseCase && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Generate Content</h3>
              {selectedUseCase && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-yellow-800 mb-2">🎯 Creating Content For: {selectedUseCase.title}</h4>
                  <p className="text-yellow-700 text-sm">Generate detection content using your live data sources</p>
                </div>
              )}
              <p className="text-gray-600 mb-6">Create XQL rules, playbooks, and dashboards using your live data sources and validated field mappings.</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-green-800 mb-2">Generated content:</h4>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• XQL correlation rules tested against real data</li>
                  <li>• Automation playbooks validated with actual incidents</li>
                  <li>• Alert layouts designed for your specific data fields</li>
                </ul>
              </div>
              <div className="text-center">
                <Link href="/content-generation">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-5 w-5 mr-2" />
                    Generate Content
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Add Content Recommendation Engine for step 5 */}
            <ContentRecommendationEngine 
              useCase={selectedUseCase}
              onImplementRecommendation={(recommendation) => {
                toast({
                  title: "Content Recommendation",
                  description: `${recommendation.title} recommendation noted for implementation`,
                });
              }}
            />
          </div>
        )}

        {currentStep === 6 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Test & Deploy</h3>
            {selectedUseCase && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-yellow-800 mb-2">🎯 Deploying Content For: {selectedUseCase.title}</h4>
                <p className="text-yellow-700 text-sm">Validate and deploy your detection content to production</p>
              </div>
            )}
            <p className="text-gray-600 mb-6">Validate detection effectiveness and deploy your content to production XSIAM.</p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-purple-800 mb-2">Final deployment steps:</h4>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• Test detection rules against threat scenarios</li>
                <li>• Validate playbooks execute correctly</li>
                <li>• Deploy to production XSIAM environment</li>
              </ul>
            </div>
            <div className="text-center">
              <Link href="/github-export">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Github className="h-5 w-5 mr-2" />
                  Test & Deploy
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}