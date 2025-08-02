import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, Clock, ArrowRight, FileText, TestTube, Zap, 
  BarChart3, RefreshCw, Shield, Database, Layout, GitBranch,
  Code, Eye, Workflow, Target, TrendingUp
} from "lucide-react";

const DDLC_PHASES = [
  {
    id: 'requirement',
    name: 'Requirement Gathering',
    description: 'Define detection requirements from threat intelligence',
    icon: FileText,
    color: 'bg-blue-500',
    details: [
      'Analyze threat reports and attack patterns',
      'Identify required data sources (Windows Events, Sysmon, AWS CloudTrail)',
      'Define detection logic and correlation requirements',
      'Establish false positive tolerance and success criteria'
    ],
    deliverables: [
      'Threat analysis document',
      'Data source requirements matrix',
      'Detection success criteria',
      'Performance requirements'
    ]
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Architect the complete detection package',
    icon: Shield,
    color: 'bg-purple-500',
    details: [
      'Design XQL correlation rules structure and logic',
      'Plan automation playbook workflows and decision trees',
      'Create alert layout with analyst decision support',
      'Design operational dashboards and KPI monitoring'
    ],
    deliverables: [
      'XQL query architecture',
      'Playbook workflow diagrams',
      'Alert layout specifications',
      'Dashboard wireframes'
    ]
  },
  {
    id: 'development',
    name: 'Development',
    description: 'Implement XSIAM detection content',
    icon: Zap,
    color: 'bg-green-500',
    details: [
      'Write XQL correlation rules with proper field mappings',
      'Develop XSIAM automation playbooks with error handling',
      'Create alert layouts with contextual analyst information',
      'Build operational dashboards with threat metrics'
    ],
    deliverables: [
      'XQL correlation rules (JSON)',
      'XSIAM playbooks (YAML)',
      'Alert layouts (JSON)',
      'Dashboard configurations (JSON)'
    ]
  },
  {
    id: 'testing',
    name: 'Testing & Validation',
    description: 'Validate detection accuracy and performance',
    icon: TestTube,
    color: 'bg-orange-500',
    details: [
      'Test correlation rules against known attack patterns',
      'Validate playbook automation workflows end-to-end',
      'Measure false positive rates and detection coverage',
      'Performance testing and query optimization'
    ],
    deliverables: [
      'Test results documentation',
      'False positive analysis',
      'Performance benchmarks',
      'Coverage assessment'
    ]
  },
  {
    id: 'deployed',
    name: 'Production Deployment',
    description: 'Deploy to XSIAM/Cortex Cloud',
    icon: ArrowRight,
    color: 'bg-indigo-500',
    details: [
      'Deploy correlation rules to XSIAM production environment',
      'Activate automation playbooks and notification workflows',
      'Configure alert layouts and analyst interface components',
      'Deploy dashboards to SOC operations center'
    ],
    deliverables: [
      'Production deployment scripts',
      'Configuration documentation',
      'Rollback procedures',
      'Deployment validation reports'
    ]
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Tuning',
    description: 'Monitor performance and optimize',
    icon: BarChart3,
    color: 'bg-red-500',
    details: [
      'Monitor detection accuracy and false positive rates',
      'Analyze SOC analyst feedback and response effectiveness',
      'Optimize XQL queries for better performance',
      'Continuous tuning based on threat landscape evolution'
    ],
    deliverables: [
      'Performance monitoring reports',
      'Tuning recommendations',
      'Analyst feedback analysis',
      'Optimization documentation'
    ]
  }
];

export default function DDLCExplained() {
  const [activePhase, setActivePhase] = useState('requirement');
  const [showContentGeneration, setShowContentGeneration] = useState(false);

  const currentPhaseIndex = DDLC_PHASES.findIndex(phase => phase.id === activePhase);
  const currentPhase = DDLC_PHASES[currentPhaseIndex];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            NVISO Detection Development Life Cycle (DDLC)
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Systematic framework for building professional XSIAM detection content from threat intelligence
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <RefreshCw className="w-3 h-3 mr-1" />
              6-Phase Framework
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Code className="w-3 h-3 mr-1" />
              Detection-as-Code
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              <GitBranch className="w-3 h-3 mr-1" />
              Version Control
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              <Eye className="w-3 h-3 mr-1" />
              Production-Ready
            </Badge>
          </div>
        </div>

        {/* Phase Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="w-5 h-5" />
              DDLC Workflow Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-4">
              {DDLC_PHASES.map((phase, index) => {
                const Icon = phase.icon;
                const isActive = phase.id === activePhase;
                
                return (
                  <div
                    key={phase.id}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                    onClick={() => setActivePhase(phase.id)}
                  >
                    <div className={`p-2 rounded-lg mb-2 ${phase.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-center">{phase.name}</span>
                    <span className="text-xs text-center mt-1 opacity-75">{phase.description}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active Phase Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Phase Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${currentPhase.color} text-white`}>
                    <currentPhase.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentPhase.name}</CardTitle>
                    <p className="text-gray-600">{currentPhase.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  
                  {/* Phase Activities */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Key Activities
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {currentPhase.details.map((detail, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Deliverables
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {currentPhase.deliverables.map((deliverable, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {deliverable}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Generation Demo */}
                  {currentPhase.id === 'development' && (
                    <div className="mt-6">
                      <Button 
                        onClick={() => setShowContentGeneration(!showContentGeneration)}
                        className="w-full"
                      >
                        {showContentGeneration ? 'Hide' : 'Show'} Content Generation Example
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      
                      {showContentGeneration && (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card className="border-green-200">
                              <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                  <Database className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">XQL Correlation Rule</span>
                                </div>
                              </CardHeader>
                              <CardContent className="text-xs">
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "rule_name": "Suspicious_VPN_Login",
  "xql_query": "dataset = xdr_data
    | filter event_type = \\"STORY\\"
    | filter action_vpn_connect != null
    | filter action_country not in (\\"US\\", \\"CA\\")
    | alter risk_score = if(
        action_user_groups contains \\"Executives\\", 5,
        4)
    | fields timestamp, endpoint_name, 
            action_user, action_country, 
            risk_score",
  "severity": "medium"
}`}
                                </pre>
                              </CardContent>
                            </Card>
                            
                            <Card className="border-purple-200">
                              <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                  <Workflow className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-medium">Automation Playbook</span>
                                </div>
                              </CardHeader>
                              <CardContent className="text-xs">
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`tasks:
  - name: "Check User Groups"
    type: "xsoar-command"
    command: "ad-get-user"
    
  - name: "Send Notification" 
    type: "notification"
    condition: "risk_score >= 4"
    
  - name: "Create Ticket"
    type: "servicenow"
    priority: "medium"`}
                                </pre>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phase Navigation & Framework Info */}
          <div className="space-y-6">
            
            {/* Quick Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phase Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DDLC_PHASES.map((phase, index) => {
                    const Icon = phase.icon;
                    const isActive = phase.id === activePhase;
                    
                    return (
                      <button
                        key={phase.id}
                        onClick={() => setActivePhase(phase.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{phase.name}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Framework Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Framework Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Systematic approach from threat to production</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Version control for all detection content</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Quality gates and validation workflows</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Enterprise-grade content lifecycle</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Collaborative development with reviews</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Types Generated */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generated Content Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                    <Database className="w-4 h-4 text-blue-600" />
                    XQL Correlation Rules
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded text-sm">
                    <Workflow className="w-4 h-4 text-purple-600" />
                    Automation Playbooks
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                    <Layout className="w-4 h-4 text-green-600" />
                    Alert Layouts
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-sm">
                    <BarChart3 className="w-4 h-4 text-orange-600" />
                    Operational Dashboards
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}