import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, Clock, AlertTriangle, ArrowRight, FileText, 
  TestTube, Zap, BarChart3, RefreshCw, Shield
} from "lucide-react";

interface DDLCWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem?: any;
}

const DDLC_PHASES = [
  {
    id: 'requirement',
    name: 'Requirement Gathering',
    description: 'Define detection requirements and success criteria',
    icon: FileText,
    color: 'bg-blue-500',
    tasks: [
      'Analyze threat intelligence and attack patterns',
      'Identify required data sources and field mappings',
      'Define detection logic and correlation requirements',
      'Establish false positive tolerance thresholds'
    ]
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Architect the detection package components',
    icon: Shield,
    color: 'bg-purple-500',
    tasks: [
      'Design XQL correlation rules structure',
      'Plan automation playbook workflows',
      'Create alert layout and analyst decision support',
      'Design operational dashboards and KPIs'
    ]
  },
  {
    id: 'development',
    name: 'Development',
    description: 'Implement detection content and automation',
    icon: Zap,
    color: 'bg-green-500',
    tasks: [
      'Write XQL correlation rules with field validation',
      'Develop XSIAM automation playbooks',
      'Create alert layouts with contextual information',
      'Build operational dashboards with threat metrics'
    ]
  },
  {
    id: 'testing',
    name: 'Testing & Validation',
    description: 'Validate detection accuracy and performance',
    icon: TestTube,
    color: 'bg-orange-500',
    tasks: [
      'Test correlation rules against known attack patterns',
      'Validate playbook automation workflows',
      'Measure false positive rates and detection coverage',
      'Performance testing and optimization'
    ]
  },
  {
    id: 'deployed',
    name: 'Production Deployment',
    description: 'Deploy to XSIAM/Cortex Cloud environment',
    icon: ArrowRight,
    color: 'bg-indigo-500',
    tasks: [
      'Deploy correlation rules to XSIAM production',
      'Activate automation playbooks and workflows',
      'Configure alert layouts and analyst interfaces',
      'Deploy dashboards to SOC operations center'
    ]
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Tuning',
    description: 'Monitor performance and optimize detection',
    icon: BarChart3,
    color: 'bg-red-500',
    tasks: [
      'Monitor detection accuracy and false positive rates',
      'Analyze SOC analyst feedback and response times',
      'Optimize XQL queries for performance',
      'Continuous tuning based on threat landscape changes'
    ]
  }
];

export function DDLCWorkflowModal({ isOpen, onClose, contentItem }: DDLCWorkflowModalProps) {
  const [activePhase, setActivePhase] = useState('requirement');
  const [completedPhases, setCompletedPhases] = useState<string[]>(['requirement']);

  const currentPhaseIndex = DDLC_PHASES.findIndex(phase => phase.id === activePhase);
  const progress = ((currentPhaseIndex + 1) / DDLC_PHASES.length) * 100;

  const advancePhase = () => {
    const currentIndex = DDLC_PHASES.findIndex(phase => phase.id === activePhase);
    if (currentIndex < DDLC_PHASES.length - 1) {
      const nextPhase = DDLC_PHASES[currentIndex + 1];
      setActivePhase(nextPhase.id);
      setCompletedPhases(prev => [...prev, nextPhase.id]);
    }
  };

  const getPhaseStatus = (phaseId: string) => {
    if (completedPhases.includes(phaseId)) return 'completed';
    if (phaseId === activePhase) return 'active';
    return 'pending';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            NVISO Detection Development Life Cycle (DDLC) Workflow
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Systematic detection engineering framework for building production-ready XSIAM content
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="w-full" />
                
                <div className="grid grid-cols-6 gap-2 mt-4">
                  {DDLC_PHASES.map((phase, index) => {
                    const status = getPhaseStatus(phase.id);
                    const Icon = phase.icon;
                    
                    return (
                      <div
                        key={phase.id}
                        className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${
                          status === 'completed' 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : status === 'active'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                        onClick={() => setActivePhase(phase.id)}
                      >
                        <Icon className="w-5 h-5 mb-2" />
                        <span className="text-xs font-medium text-center">{phase.name}</span>
                        {status === 'completed' && <CheckCircle className="w-4 h-4 mt-1 text-green-600" />}
                        {status === 'active' && <Clock className="w-4 h-4 mt-1 text-blue-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase Details */}
          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="grid grid-cols-6 w-full">
              {DDLC_PHASES.map((phase) => (
                <TabsTrigger key={phase.id} value={phase.id} className="text-xs">
                  {phase.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {DDLC_PHASES.map((phase) => {
              const Icon = phase.icon;
              const status = getPhaseStatus(phase.id);
              
              return (
                <TabsContent key={phase.id} value={phase.id}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${phase.color} text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{phase.name}</CardTitle>
                            <p className="text-gray-600">{phase.description}</p>
                          </div>
                        </div>
                        <Badge variant={
                          status === 'completed' ? 'default' : 
                          status === 'active' ? 'secondary' : 'outline'
                        }>
                          {status === 'completed' ? 'Completed' : 
                           status === 'active' ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3">Phase Tasks & Deliverables</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {phase.tasks.map((task, index) => (
                              <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Phase-Specific Content */}
                        {phase.id === 'requirement' && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h5 className="font-semibold text-blue-900 mb-2">Content-as-Code Generation</h5>
                            <p className="text-sm text-blue-800">
                              From threat intelligence, the system automatically identifies required data sources 
                              (Windows Events, Sysmon, AWS CloudTrail, etc.) and begins planning complete detection packages 
                              including correlation rules, playbooks, alert layouts, and dashboards.
                            </p>
                          </div>
                        )}

                        {phase.id === 'development' && (
                          <div className="mt-6 p-4 bg-green-50 rounded-lg">
                            <h5 className="font-semibold text-green-900 mb-2">XSIAM Content Generation</h5>
                            <p className="text-sm text-green-800">
                              Platform generates production-ready XQL correlation rules with proper field mappings, 
                              automation playbooks for SOC response workflows, alert layouts with analyst decision support, 
                              and operational dashboards for threat monitoring.
                            </p>
                          </div>
                        )}

                        {phase.id === 'deployed' && (
                          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                            <h5 className="font-semibold text-indigo-900 mb-2">Production Deployment</h5>
                            <p className="text-sm text-indigo-800">
                              Complete detection packages are ready for deployment to XSIAM/Cortex Cloud environments 
                              with version control, testing validation, and production-grade quality assurance.
                            </p>
                          </div>
                        )}

                        {status === 'active' && (
                          <div className="flex justify-between items-center pt-4 border-t">
                            <span className="text-sm text-gray-600">
                              Complete this phase to advance to the next stage
                            </span>
                            <Button onClick={advancePhase} disabled={phase.id === 'monitoring'}>
                              {phase.id === 'monitoring' ? 'Workflow Complete' : 'Advance to Next Phase'}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>

          {/* DDLC Framework Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About NVISO Detection Development Life Cycle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold mb-2">Detection-as-Code Principles</h5>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Version control for all detection content</li>
                    <li>• Systematic testing and validation workflows</li>
                    <li>• Collaborative development with code reviews</li>
                    <li>• Standardized formats and documentation</li>
                    <li>• CI/CD integration for deployment automation</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Professional Detection Engineering</h5>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Structured approach from requirement to production</li>
                    <li>• Quality gates and validation at each phase</li>
                    <li>• Performance monitoring and continuous improvement</li>
                    <li>• Enterprise-grade content lifecycle management</li>
                    <li>• Integration with SIEM/SOAR platforms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}