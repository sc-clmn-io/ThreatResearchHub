import { useState, useEffect } from "react";
import { Shield, FileText, Zap, Monitor, Github, Search, Trash2, Database, ArrowRight, CheckCircle, Cog, Brain, Users, Globe, Archive } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
    // Calculate workflow progress from localStorage
    const storedUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    const contentLibrary = JSON.parse(localStorage.getItem('contentLibrary') || '[]');
    
    console.log('Stored use cases:', storedUseCases);
    setUseCases(storedUseCases);
    
    setWorkflowStats({
      threatsLoaded: storedUseCases.length,
      contentGenerated: contentLibrary.length,
      labsPlanned: 0,
      xsiamDeployed: 0,
      githubBackups: 0
    });
  }, []);

  // Correct workflow sequence - infrastructure BEFORE content generation
  // Step 1: Load threat reports
  // Step 2: Select specific use case  
  // Step 3: Plan lab infrastructure for selected threat
  // Step 4: Onboard data sources & ingest logs
  // Step 5: Generate content (after infrastructure is ready)
  // Step 6: Test & deploy
  const currentStep = workflowStats.threatsLoaded === 0 ? 1 :
                     !selectedUseCase ? 2 : 
                     workflowStats.labsPlanned === 0 ? 3 :
                     workflowStats.xsiamDeployed === 0 ? 4 :
                     workflowStats.contentGenerated === 0 ? 5 : 6;
                     
  console.log('Current step calculated:', currentStep);
  console.log('Selected use case:', selectedUseCase);

  const clearAllData = () => {
    localStorage.removeItem('useCases');
    localStorage.removeItem('contentLibrary');
    localStorage.removeItem('threats');
    localStorage.removeItem('cortex-training-db');
    localStorage.removeItem('threatresearchhub-db');
    window.location.reload();
  };

  const stepInstructions = {
    1: {
      title: "Load Threat Intelligence",
      instruction: "Load your specific threat intelligence or customer requirements:",
      options: [
        "Upload PDF threat report with specific CVEs/IOCs",
        "Paste URL from threat intelligence source",
        "Enter customer POV requirements and success criteria"
      ],
      verification: "Threat details with specific indicators appear in the list below"
    },
    2: {
      title: "Select Specific Threat",
      instruction: "Choose exactly which threat/use case to build infrastructure for:",
      options: [
        "Review threat details, CVEs, and attack vectors",
        "Verify customer requirements and success criteria",
        "Select the precise use case for infrastructure planning"
      ],
      verification: "Selected use case details are displayed with specific requirements"
    },
    3: {
      title: "Plan Infrastructure",
      instruction: "Design infrastructure to support your selected threat scenario:",
      options: [
        "Infrastructure matching threat environment (Windows/Linux/Cloud)",
        "Data sources required for threat detection (EDR, logs, network)",
        "Attack simulation environment for threat vectors"
      ],
      verification: "Lab plan includes infrastructure costs, timeline, and deployment steps"
    },
    4: {
      title: "Setup Data Sources",
      instruction: "Set up data ingestion and XSIAM configuration:",
      options: [
        "Connect XSIAM to your data sources",
        "Configure log parsing and field mapping",
        "Validate data ingestion with test queries"
      ],
      verification: "XSIAM shows live data from your configured sources"
    },
    5: {
      title: "Generate Content",
      instruction: "Create detection content using your live data sources:",
      options: [
        "XQL correlation rules tested against real data",
        "Automation playbooks validated with actual incidents",
        "Alert layouts designed for your specific data fields"
      ],
      verification: "Generated content works with your actual XSIAM data"
    },
    6: {
      title: "Test & Deploy",
      instruction: "Validate and deploy your working content:",
      options: [
        "Test detection rules against threat scenarios", 
        "Validate playbooks execute correctly",
        "Deploy to production XSIAM environment"
      ],
      verification: "Content successfully detects threats in production"
    }
  };

  const currentInstructions = stepInstructions[currentStep];

  const workflowSteps = [
    {
      id: 'current-step',
      title: currentInstructions.title,
      description: currentInstructions.instruction,
      status: 'current' as const,
      href: currentStep === 1 ? '/' : 
            currentStep === 2 ? '/content-generation' :
            currentStep === 3 ? '/lab-build-planner' :
            currentStep === 4 ? '/xsiam-debugger' : '/github-export'
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
              <span className="ml-2 text-sm text-gray-500">XSIAM Enablement Platform</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Progress: {Math.max(0, currentStep - 1)}/6 steps
              </span>
              

              
              <Button variant="outline" size="sm" onClick={clearAllData} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1" />
                Start Fresh
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
            <h3 className="text-lg font-semibold mb-4">6-Step Workflow Progress</h3>
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    step < currentStep ? 'bg-green-500 text-white' :
                    step === currentStep ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {step < currentStep ? '✓' : step}
                  </div>
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
                Load Intelligence
              </div>
              <div className={currentStep === 2 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Select Threat
              </div>
              <div className={currentStep === 3 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Plan Infrastructure
              </div>
              <div className={currentStep === 4 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Setup Data Sources
              </div>
              <div className={currentStep === 5 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Generate Content
              </div>
              <div className={currentStep === 6 ? 'font-semibold text-blue-600' : 'text-gray-500'}>
                Test & Deploy
              </div>
            </div>
            
            {/* Step Navigation for Steps 2+ */}
            {currentStep > 1 && currentStep < 6 && (
              <div className="mt-6 text-center">
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
            Step {currentStep} of 6: {currentStep === 1 ? "Load threat intelligence first" : 
                                     currentStep === 2 ? "Select which specific threat to work with" :
                                     currentStep === 3 ? "Plan infrastructure for selected threat" :
                                     currentStep === 4 ? "Setup data sources and XSIAM ingestion" :
                                     currentStep === 5 ? "Generate content using live data" : "Test and deploy to production"}
          </div>
          
          <p className="text-blue-700 mb-4 text-lg">{currentInstructions.instruction}</p>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-2">What you'll create:</h4>
            <ul className="space-y-1">
              {currentInstructions.options.map((option, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-2">•</span>
                  {option}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 font-medium">✓ How you'll know it's complete:</p>
            <p className="text-green-700">{currentInstructions.verification}</p>
          </div>
        </div>

        {/* Show only current step content */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Prominent Upload Options */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-center">Choose How to Load Threat Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/threat-input">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-all">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h4 className="font-medium text-gray-900 mb-2">Upload PDF Report</h4>
                      <p className="text-sm text-gray-600">Upload threat intelligence PDF documents</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/threat-input">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-all">
                    <div className="text-center">
                      <Globe className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h4 className="font-medium text-gray-900 mb-2">Paste URL</h4>
                      <p className="text-sm text-gray-600">Load from threat intelligence URLs</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/threat-input">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-all">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h4 className="font-medium text-gray-900 mb-2">Customer POV</h4>
                      <p className="text-sm text-gray-600">Enter customer requirements manually</p>
                    </div>
                  </div>
                </Link>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">Or browse existing threat intelligence:</p>
                <Link href="/threat-feeds">
                  <Button variant="outline" className="mr-3">
                    <Database className="h-4 w-4 mr-2" />
                    View Threat Feeds
                  </Button>
                </Link>
                <Link href="/threat-archive">
                  <Button variant="outline">
                    <Archive className="h-4 w-4 mr-2" />
                    Browse Archive
                  </Button>
                </Link>
              </div>
            </div>
            
            <ThreatInput />
            <UseCaseList onGenerateTraining={() => {}} />
            
            {/* Step 1 Completion */}
            {useCases.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">Step 1 Complete!</h4>
                    <p className="text-green-700 text-sm">
                      You've loaded {useCases.length} threat report{useCases.length !== 1 ? 's' : ''}. Ready to continue to Step 2.
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={() => {
                      // Advance to step 2
                      setWorkflowStats(prev => ({...prev, threatsLoaded: useCases.length}));
                      // Trigger re-render to show step 2
                      window.location.reload();
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Continue to Step 2
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
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
                <h4 className="font-medium text-green-800 mb-2">Content you'll generate:</h4>
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