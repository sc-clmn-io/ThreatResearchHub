import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Info,
  Target,
  Play,
  Pause
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element identifier
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'navigate' | 'observe' | 'input';
  actionDescription?: string;
  highlight?: boolean;
  screenshot?: string;
}

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  tutorialType?: 'threat-discovery' | 'lab-deployment' | 'full-workflow';
}

export default function InteractiveTutorial({ 
  isOpen, 
  onClose, 
  tutorialType = 'full-workflow' 
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const tutorialSteps: Record<string, TutorialStep[]> = {
    'threat-discovery': [
      {
        id: 'nav-threat-feed',
        title: 'Navigate to Active Threat Feed',
        description: 'Start by accessing the live threat intelligence dashboard',
        target: '[href="/threat-monitoring"]',
        position: 'right',
        action: 'click',
        actionDescription: 'Click on "Active Threat Feed" in the main navigation',
        highlight: true
      },
      {
        id: 'explore-threats',
        title: 'Explore Current Threats',
        description: 'Review high and critical severity threats from security vendors',
        target: '.threat-card',
        position: 'top',
        action: 'observe',
        actionDescription: 'Examine threat cards showing CVEs, severity, and sources'
      },
      {
        id: 'filter-threats',
        title: 'Apply Filters',
        description: 'Use filters to find threats relevant to your environment',
        target: '.filter-controls',
        position: 'bottom',
        action: 'click',
        actionDescription: 'Try filtering by timeframe (7 days) and source'
      },
      {
        id: 'select-threat',
        title: 'Select Target Threat',
        description: 'Choose a threat that matches your technology stack',
        target: '.threat-card:first-child',
        position: 'left',
        action: 'observe',
        actionDescription: 'Look for threats involving technologies you use'
      }
    ],

    'lab-deployment': [
      {
        id: 'click-build-lab',
        title: 'Initiate Lab Building',
        description: 'Start the lab environment generation process',
        target: 'button[class*="bg-green-600"]',
        position: 'top',
        action: 'click',
        actionDescription: 'Click the "🚀 Build Lab & Test" button',
        highlight: true
      },
      {
        id: 'review-lab-plan',
        title: 'Review Lab Environment',
        description: 'Examine the auto-generated lab infrastructure plan',
        target: '.lab-environment-card',
        position: 'center',
        action: 'observe',
        actionDescription: 'Review VMs, network components, and security tools'
      },
      {
        id: 'procurement-tab',
        title: 'Access Procurement Planning',
        description: 'Explore infrastructure procurement options',
        target: '[data-value="procurement"]',
        position: 'top',
        action: 'click',
        actionDescription: 'Click the "Procurement" tab'
      },
      {
        id: 'compare-options',
        title: 'Compare Infrastructure Options',
        description: 'Review AWS, Azure, VMware, and Hybrid options',
        target: '.procurement-option',
        position: 'right',
        action: 'observe',
        actionDescription: 'Compare costs, timelines, and capabilities'
      },
      {
        id: 'cost-calculator',
        title: 'Use Cost Calculator',
        description: 'Adjust parameters for accurate cost estimation',
        target: '.cost-calculator',
        position: 'left',
        action: 'input',
        actionDescription: 'Modify duration, team size, and complexity settings'
      }
    ],

    'full-workflow': [
      // Threat Discovery Phase
      {
        id: 'welcome',
        title: 'Welcome to ThreatResearchHub',
        description: 'This tutorial will guide you through the complete threat-to-lab workflow',
        target: 'body',
        position: 'center',
        action: 'observe',
        actionDescription: 'Follow along as we build a complete testing environment'
      },
      {
        id: 'nav-threat-feed',
        title: 'Step 1: Access Threat Intelligence',
        description: 'Navigate to the Active Threat Feed for live threat data',
        target: '[href="/threat-monitoring"]',
        position: 'right',
        action: 'click',
        actionDescription: 'Click "Active Threat Feed" in the navigation menu'
      },
      {
        id: 'analyze-threats',
        title: 'Step 2: Analyze Threats',
        description: 'Review threat cards and identify relevant security issues',
        target: '.threat-card',
        position: 'top',
        action: 'observe',
        actionDescription: 'Look for threats with high/critical severity and relevant CVEs'
      },
      {
        id: 'build-lab',
        title: 'Step 3: Generate Lab Environment',
        description: 'Create a testing environment for the selected threat',
        target: 'button[class*="bg-green-600"]',
        position: 'left',
        action: 'click',
        actionDescription: 'Click "🚀 Build Lab & Test" to generate infrastructure'
      },
      {
        id: 'procurement-planning',
        title: 'Step 4: Plan Infrastructure Procurement',
        description: 'Review infrastructure options and costs',
        target: '[data-value="procurement"]',
        position: 'top',
        action: 'click',
        actionDescription: 'Navigate to procurement planning for budget analysis'
      },
      {
        id: 'select-infrastructure',
        title: 'Step 5: Choose Infrastructure Type',
        description: 'Select the most suitable infrastructure option',
        target: '.procurement-option:first-child',
        position: 'right',
        action: 'click',
        actionDescription: 'Choose based on budget, timeline, and requirements'
      },
      {
        id: 'deployment',
        title: 'Step 6: Deploy Lab Environment',
        description: 'Execute the deployment plan',
        target: '[data-value="deployment"]',
        position: 'top',
        action: 'navigate',
        actionDescription: 'Follow deployment scripts and validation procedures'
      },
      {
        id: 'xsiam-integration',
        title: 'Step 7: XSIAM Integration',
        description: 'Connect your lab to XSIAM for monitoring',
        target: '.xsiam-integration',
        position: 'bottom',
        action: 'observe',
        actionDescription: 'Configure data sources and correlation rules'
      },
      {
        id: 'testing',
        title: 'Step 8: Execute Threat Testing',
        description: 'Run controlled attacks and validate detection',
        target: '[data-value="testing"]',
        position: 'top',
        action: 'navigate',
        actionDescription: 'Execute simulation scripts and monitor results'
      }

    ]
  };

  const steps = tutorialSteps[tutorialType];
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (isOpen && currentStepData?.highlight) {
      // Add highlight effect to target element
      const target = document.querySelector(currentStepData.target);
      if (target) {
        target.classList.add('tutorial-highlight');
      }
    }

    return () => {
      // Clean up highlights
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, [isOpen, currentStep, currentStepData]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...Array.from(prev), currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    const allSteps = new Set<number>();
    for (let i = 0; i < steps.length; i++) {
      allSteps.add(i);
    }
    setCompletedSteps(allSteps);
    onClose();
  };

  const resetTutorial = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsPaused(false);
  };

  if (!isOpen || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" />
      
      {/* Tutorial Card */}
      <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none">
        <Card className="max-w-lg w-full pointer-events-auto">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Interactive Tutorial</span>
                <Badge variant="outline">
                  {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setIsPaused(!isPaused)}
                  variant="ghost"
                  size="sm"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button onClick={onClose} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                {completedSteps.has(currentStep) ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Info className="h-5 w-5 text-blue-500" />
                )}
                {currentStepData.title}
              </h3>
              
              <p className="text-gray-600 mb-3">
                {currentStepData.description}
              </p>

              {currentStepData.actionDescription && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm text-blue-800">
                      <strong>Action:</strong> {currentStepData.actionDescription}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  onClick={prevStep} 
                  variant="outline" 
                  size="sm"
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {currentStep === steps.length - 1 ? (
                  <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete Tutorial
                  </Button>
                ) : (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={resetTutorial} variant="ghost" size="sm">
                  Restart
                </Button>
                <Button onClick={skipTutorial} variant="ghost" size="sm">
                  Skip Tutorial
                </Button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-1 mt-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : completedSteps.has(index)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSS for highlighting */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .tutorial-highlight::before {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}