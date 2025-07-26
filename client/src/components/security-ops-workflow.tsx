import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FindingsReportGenerator } from "./findings-report-generator";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  FileText, 
  Server, 
  Database, 
  Shield, 
  Layout, 
  Play, 
  BarChart3,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  Eye,
  Download
} from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  estimatedTime: string;
  prerequisites?: string[];
  actions: {
    primary?: { label: string; action: () => void; };
    secondary?: { label: string; action: () => void; };
    view?: { label: string; action: () => void; };
  };
}

interface SecurityOpsWorkflowProps {
  useCase: any;
  onClose: () => void;
}

export default function SecurityOpsWorkflow({ useCase, onClose }: SecurityOpsWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<string>('threat-analysis');
  const [workflowData, setWorkflowData] = useState<any>({});
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showFindingsReportDialog, setShowFindingsReportDialog] = useState(false);

  // Load workflow progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`workflow-${useCase.id}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCompletedSteps(progress.completedSteps || []);
      setWorkflowData(progress.data || {});
      setCurrentStep(progress.currentStep || 'threat-analysis');
    }
  }, [useCase.id]);

  // Save workflow progress
  const saveProgress = (step: string, data: any = {}) => {
    const progress = {
      completedSteps: [...completedSteps, step],
      data: { ...workflowData, ...data },
      currentStep: step
    };
    localStorage.setItem(`workflow-${useCase.id}`, JSON.stringify(progress));
    setCompletedSteps(progress.completedSteps);
    setWorkflowData(progress.data);
  };

  const handleStepComplete = (stepId: string, data?: any) => {
    if (!completedSteps.includes(stepId)) {
      saveProgress(stepId, data);
    }
    
    // Move to next step
    const stepIndex = workflowSteps.findIndex(step => step.id === stepId);
    if (stepIndex < workflowSteps.length - 1) {
      setCurrentStep(workflowSteps[stepIndex + 1].id);
    }
  };

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'threat-analysis',
      title: 'Threat Analysis & Intelligence',
      description: 'Analyze threat intelligence and extract IOCs, TTPs, and context',
      icon: <FileText className="h-5 w-5" />,
      status: completedSteps.includes('threat-analysis') ? 'completed' : 'in-progress',
      estimatedTime: '15 minutes',
      actions: {
        primary: {
          label: 'Analyze Threat',
          action: () => {
            // Generate threat analysis
            const analysis = {
              cves: useCase.cves || [],
              technologies: useCase.technologies || [],
              severity: useCase.severity || 'high',
              attackVectors: useCase.vulnerabilityTypes || [],
              exploitAvailable: useCase.exploitAvailable || false,
              mitreTechniques: extractMitreTechniques(useCase.description)
            };
            handleStepComplete('threat-analysis', { analysis });
          }
        },
        view: {
          label: 'View Analysis',
          action: () => console.log('View threat analysis', workflowData.analysis)
        }
      }
    },
    {
      id: 'infrastructure-planning',
      title: 'Infrastructure Planning',
      description: 'Plan lab environment and infrastructure requirements',
      icon: <Server className="h-5 w-5" />,
      status: completedSteps.includes('infrastructure-planning') ? 'completed' : 
              completedSteps.includes('threat-analysis') ? 'pending' : 'blocked',
      estimatedTime: '30 minutes',
      prerequisites: ['threat-analysis'],
      actions: {
        primary: {
          label: 'Plan Infrastructure',
          action: () => {
            const infrastructure = generateInfrastructurePlan(useCase);
            handleStepComplete('infrastructure-planning', { infrastructure });
          }
        },
        view: {
          label: 'View Plan',
          action: () => window.open('/lab-build-planner', '_blank')
        }
      }
    },
    {
      id: 'data-source-integration',
      title: 'XSIAM Data Source Integration',
      description: 'Complete XSIAM onboarding with step-by-step data source configuration',
      icon: <Database className="h-5 w-5" />,
      status: completedSteps.includes('data-source-integration') ? 'completed' : 
              completedSteps.includes('infrastructure-planning') ? 'pending' : 'blocked',
      estimatedTime: '45 minutes',
      prerequisites: ['infrastructure-planning'],
      actions: {
        primary: {
          label: 'Start XSIAM Onboarding',
          action: () => {
            const integration = generateDataSourceConfig(useCase);
            handleStepComplete('data-source-integration', { integration });
          }
        },
        view: {
          label: 'View Onboarding Guide',
          action: () => console.log('XSIAM onboarding guide')
        }
      }
    },
    {
      id: 'detection-rules',
      title: 'Detection Rule Creation',
      description: 'Create XQL correlation rules and detection logic',
      icon: <Shield className="h-5 w-5" />,
      status: completedSteps.includes('detection-rules') ? 'completed' : 
              completedSteps.includes('data-source-integration') ? 'pending' : 'blocked',
      estimatedTime: '20 minutes',
      prerequisites: ['data-source-integration'],
      actions: {
        primary: {
          label: 'Create Rules',
          action: () => {
            const rules = generateDetectionRules(useCase);
            handleStepComplete('detection-rules', { rules });
          }
        },
        view: {
          label: 'View Rules',
          action: () => console.log('Detection rules')
        }
      }
    },
    {
      id: 'alert-layout',
      title: 'Alert Layout & Triage',
      description: 'Design alert layout with triage guidance and investigation workflows',
      icon: <Layout className="h-5 w-5" />,
      status: completedSteps.includes('alert-layout') ? 'completed' : 
              completedSteps.includes('detection-rules') ? 'pending' : 'blocked',
      estimatedTime: '25 minutes',
      prerequisites: ['detection-rules'],
      actions: {
        primary: {
          label: 'Design Layout',
          action: () => {
            const layout = generateAlertLayout(useCase);
            handleStepComplete('alert-layout', { layout });
          }
        },
        view: {
          label: 'Preview Layout',
          action: () => console.log('Alert layout preview')
        }
      }
    },
    {
      id: 'playbook-automation',
      title: 'Playbook Automation',
      description: 'Create XSIAM playbooks for automated triage and response',
      icon: <Play className="h-5 w-5" />,
      status: completedSteps.includes('playbook-automation') ? 'completed' : 
              completedSteps.includes('alert-layout') ? 'pending' : 'blocked',
      estimatedTime: '35 minutes',
      prerequisites: ['alert-layout'],
      actions: {
        primary: {
          label: 'Create Playbook',
          action: () => {
            const playbook = generatePlaybook(useCase);
            handleStepComplete('playbook-automation', { playbook });
          }
        },
        view: {
          label: 'View Playbook',
          action: () => console.log('Playbook automation')
        }
      }
    },
    {
      id: 'xsiam-workflow-documentation',
      title: 'XSIAM Workflow Documentation',
      description: 'Document complete XSIAM configuration and analyst workflow steps',
      icon: <FileText className="h-5 w-5" />,
      status: completedSteps.includes('xsiam-workflow-documentation') ? 'completed' : 
              completedSteps.includes('playbook-automation') ? 'pending' : 'blocked',
      estimatedTime: '25 minutes',
      prerequisites: ['playbook-automation'],
      actions: {
        primary: {
          label: 'Generate Documentation',
          action: () => {
            const documentation = generateXSIAMWorkflowDocs(useCase, workflowData);
            handleStepComplete('xsiam-workflow-documentation', { documentation });
          }
        },
        view: {
          label: 'View Documentation',
          action: () => console.log('XSIAM workflow documentation')
        }
      }
    },
    {
      id: 'dashboard-visualization',
      title: 'Dashboard & Visualization',
      description: 'Create monitoring dashboard and KPI visualization',
      icon: <BarChart3 className="h-5 w-5" />,
      status: completedSteps.includes('dashboard-visualization') ? 'completed' : 
              completedSteps.includes('xsiam-workflow-documentation') ? 'pending' : 'blocked',
      estimatedTime: '20 minutes',
      prerequisites: ['xsiam-workflow-documentation'],
      actions: {
        primary: {
          label: 'Build Dashboard',
          action: () => {
            const dashboard = generateDashboard(useCase);
            handleStepComplete('dashboard-visualization', { dashboard });
          }
        },
        view: {
          label: 'Preview Dashboard',
          action: () => console.log('Dashboard preview')
        }
      }
    },
    {
      id: 'findings-report',
      title: 'Security Findings Report',
      description: 'Generate comprehensive findings report with attack analysis, dwell time, scope, containment, remediation, and prevention measures',
      icon: <FileText className="h-5 w-5" />,
      status: completedSteps.includes('findings-report') ? 'completed' : 
              completedSteps.includes('dashboard-visualization') ? 'pending' : 'blocked',
      estimatedTime: '30 minutes',
      prerequisites: ['dashboard-visualization'],
      actions: {
        primary: {
          label: 'Generate Report',
          action: () => {
            const findingsReport = generateFindingsReport(useCase, workflowData);
            handleStepComplete('findings-report', { findingsReport });
          }
        },
        view: {
          label: 'Open Report Generator',
          action: () => setShowFindingsReportDialog(true)
        }
      }
    },
    {
      id: 'export-collaboration-package',
      title: 'Export Collaboration Package',
      description: 'Generate complete export package for team collaboration and deployment',
      icon: <Download className="h-5 w-5" />,
      status: completedSteps.includes('export-collaboration-package') ? 'completed' : 
              completedSteps.includes('findings-report') ? 'pending' : 'blocked',
      estimatedTime: '10 minutes',
      prerequisites: ['findings-report'],
      actions: {
        primary: {
          label: 'Generate Export',
          action: () => {
            const exportPackage = generateCollaborationExport(useCase, workflowData);
            handleStepComplete('export-collaboration-package', { exportPackage });
          }
        },
        view: {
          label: 'Download Package',
          action: () => downloadCollaborationPackage(useCase, workflowData)
        }
      }
    }
  ];

  const totalSteps = workflowSteps.length;
  const progressPercent = (completedSteps.length / totalSteps) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Security Operations Workflow</h1>
          <p className="text-muted-foreground">End-to-end workflow for: <strong>{useCase.title}</strong></p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="font-semibold">{completedSteps.length}/{totalSteps} Steps</div>
          </div>
          <Progress value={progressPercent} className="w-32" />
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>

      {/* Workflow Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Threat Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Category</div>
              <Badge variant="outline">{useCase.category}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Severity</div>
              <Badge variant={useCase.severity === 'critical' ? 'destructive' : 'secondary'}>
                {useCase.severity.toUpperCase()}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">CVEs</div>
              <div className="text-sm">{useCase.cves?.join(', ') || 'None'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Technologies</div>
              <div className="text-sm">{useCase.technologies?.join(', ') || 'General'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflowSteps.map((step, index) => (
          <Card key={step.id} className={`${step.status === 'completed' ? 'border-green-200 bg-green-50' : 
                                         step.status === 'in-progress' ? 'border-blue-200 bg-blue-50' :
                                         step.status === 'blocked' ? 'border-gray-200 bg-gray-50' : 
                                         'border-orange-200 bg-orange-50'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {step.icon}
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <Badge variant={step.status === 'completed' ? 'default' : 
                                   step.status === 'in-progress' ? 'secondary' :
                                   step.status === 'blocked' ? 'outline' : 'outline'}>
                      {step.status}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-3">{step.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {step.estimatedTime}
                    </span>
                    {step.prerequisites && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Requires: {step.prerequisites.join(', ')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {step.actions.primary && (
                      <Button 
                        onClick={step.actions.primary.action}
                        disabled={step.status === 'blocked'}
                        variant={step.status === 'completed' ? 'outline' : 'default'}
                      >
                        {step.actions.primary.label}
                      </Button>
                    )}
                    
                    {step.actions.secondary && (
                      <Button 
                        variant="outline" 
                        onClick={step.actions.secondary.action}
                        disabled={step.status === 'blocked'}
                      >
                        {step.actions.secondary.label}
                      </Button>
                    )}
                    
                    {step.actions.view && completedSteps.includes(step.id) && (
                      <Button 
                        variant="ghost" 
                        onClick={step.actions.view.action}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {step.actions.view.label}
                      </Button>
                    )}
                  </div>
                </div>
                
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground mt-8" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Section */}
      {completedSteps.length === totalSteps && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800">Workflow Complete!</h3>
                <p className="text-green-700">All steps completed. Ready for production deployment.</p>
              </div>
              <Button 
                onClick={() => exportWorkflowResults(useCase, workflowData)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Everything
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Findings Report Dialog */}
      <Dialog open={showFindingsReportDialog} onOpenChange={setShowFindingsReportDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Findings Report Generator</DialogTitle>
          </DialogHeader>
          <FindingsReportGenerator 
            useCase={useCase}
            onGenerateSubplaybook={(reportData) => {
              console.log('Findings report generated:', reportData);
              handleStepComplete('findings-report', { findingsReport: reportData });
              setShowFindingsReportDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper functions for generating content
function extractMitreTechniques(description: string): string[] {
  const techniques = [];
  if (description.toLowerCase().includes('privilege escalation')) techniques.push('T1068');
  if (description.toLowerCase().includes('remote code execution')) techniques.push('T1203');
  if (description.toLowerCase().includes('credential')) techniques.push('T1555');
  return techniques;
}

function generateInfrastructurePlan(useCase: any) {
  return {
    category: useCase.category,
    infrastructure: `${useCase.category}-lab-setup`,
    estimatedCost: '$200-500/month',
    timeline: '2-3 hours setup'
  };
}

function generateDataSourceConfig(useCase: any) {
  return {
    sources: [`${useCase.category}-logs`, 'windows-events', 'network-flow'],
    parsing: 'Auto-configured',
    retention: '90 days'
  };
}

function generateDetectionRules(useCase: any) {
  return {
    rules: [`${useCase.title.replace(/\s+/g, '_').toLowerCase()}_detection`],
    confidence: 'High',
    falsePositiveRate: 'Low'
  };
}

function generateAlertLayout(useCase: any) {
  return {
    layout: `${useCase.title}_alert_layout`,
    fields: ['source_ip', 'destination', 'user_context', 'risk_score'],
    triageSteps: 5
  };
}

function generatePlaybook(useCase: any) {
  return {
    playbook: `${useCase.title.replace(/\s+/g, '_').toLowerCase()}_response`,
    automationLevel: '80%',
    responseTime: '< 5 minutes'
  };
}

function generateFindingsReport(useCase: any, workflowData: any) {
  return {
    reportId: `FR-${Date.now()}`,
    threatName: useCase.title,
    severity: useCase.severity || 'high',
    detectionTime: new Date().toISOString(),
    attackVector: useCase.vulnerabilityTypes?.[0] || 'Unknown',
    dwellTime: 'To be calculated during incident response',
    affectedSystems: ['Systems identified during investigation'],
    containmentActions: ['Actions taken during incident response'],
    remediationSteps: ['Remediation measures implemented'],
    preventionMeasures: ['Security improvements for prevention'],
    executiveSummary: `Security incident involving ${useCase.title} threat`,
    technicalDetails: `Technical analysis of ${useCase.title} incident`,
    recommendations: ['Security recommendations based on incident analysis']
  };
}

// Generate XSIAM workflow documentation
function generateXSIAMWorkflowDocs(useCase: any, workflowData: any) {
  return {
    workflowName: `${useCase.title.replace(/\s+/g, '_')}_XSIAM_Workflow`,
    sections: {
      overview: {
        title: "XSIAM Workflow Overview",
        content: `Complete workflow for managing ${useCase.title} in Cortex XSIAM/Cloud environment`,
        threatContext: {
          cves: useCase.cves || [],
          severity: useCase.severity,
          technologies: useCase.technologies || [],
          category: useCase.category
        }
      },
      prerequisiteSteps: {
        title: "XSIAM Prerequisites & Setup",
        steps: [
          "Verify XSIAM tenant access and API keys",
          "Confirm data source integrations are active",
          "Validate XQL dataset schemas are available",
          "Ensure playbook execution permissions"
        ]
      },
      contentDeployment: {
        title: "Content Deployment Process",
        steps: [
          {
            step: 1,
            title: "Import Correlation Rules",
            description: "Import XQL correlation rules into XSIAM",
            xsiamPath: "Settings → Analytics → Correlation Rules → Import",
            instructions: "Upload correlation_rules.json from export package",
            validationSteps: ["Test XQL syntax", "Verify data source compatibility", "Enable rule"]
          },
          {
            step: 2,
            title: "Deploy Alert Layout",
            description: "Configure incident layout for structured analysis",
            xsiamPath: "Settings → Layout → Incident → Import Layout",
            instructions: "Import incident_layout.json for threat-specific fields",
            validationSteps: ["Preview layout", "Test field mappings", "Apply to incident type"]
          },
          {
            step: 3,
            title: "Install Playbook",
            description: "Deploy automated response playbook",
            xsiamPath: "Playbooks → Import → Upload YAML",
            instructions: "Import automated_response_playbook.yml",
            validationSteps: ["Validate task connections", "Test integration commands", "Enable playbook"]
          },
          {
            step: 4,
            title: "Configure Dashboard",
            description: "Set up monitoring and visualization",
            xsiamPath: "Dashboards → Create → Import Configuration",
            instructions: "Import dashboard_config.json for KPI monitoring",
            validationSteps: ["Verify XQL queries", "Test widget rendering", "Set refresh intervals"]
          }
        ]
      },
      analystWorkflow: {
        title: "Analyst Response Workflow",
        phases: [
          {
            phase: "Alert Triage",
            duration: "5-10 minutes",
            steps: [
              "Review alert in XSIAM Incidents page",
              "Analyze threat-specific fields in custom layout",
              "Check automated enrichment data",
              "Validate against known false positives"
            ],
            xsiamActions: [
              "Navigate to Incidents → Open Alert",
              "Review 'Threat Analysis' section in layout",
              "Check 'Related Incidents' for patterns",
              "Update incident status and priority"
            ]
          },
          {
            phase: "Investigation",
            duration: "15-30 minutes",
            steps: [
              "Execute XQL queries for additional context",
              "Analyze related events and timeline",
              "Check IOC reputation and history",
              "Document findings in incident notes"
            ],
            xsiamActions: [
              "Use 'Investigate' button for automated queries",
              "Review 'Evidence' section for artifacts",
              "Execute custom XQL in Query Builder",
              "Add investigation notes and tags"
            ]
          },
          {
            phase: "Response & Remediation",
            duration: "10-45 minutes",
            steps: [
              "Execute containment actions via playbook",
              "Coordinate with stakeholders through integrations",
              "Monitor response effectiveness",
              "Document lessons learned"
            ],
            xsiamActions: [
              "Trigger response playbook from incident",
              "Monitor task execution in Playbook tab",
              "Update stakeholders via ServiceNow integration",
              "Close incident with detailed resolution notes"
            ]
          }
        ]
      },
      troubleshooting: {
        title: "Common Issues & Solutions",
        scenarios: [
          {
            issue: "XQL query returns no results",
            solutions: [
              "Verify data source is ingesting properly",
              "Check dataset schema field names",
              "Adjust time window in query",
              "Validate data source parsing rules"
            ]
          },
          {
            issue: "Playbook tasks failing",
            solutions: [
              "Check integration configuration and credentials",
              "Verify API endpoints are accessible",
              "Review task input parameters",
              "Test integration commands manually"
            ]
          },
          {
            issue: "High false positive rate",
            solutions: [
              "Review correlation rule logic and thresholds",
              "Add environment-specific exclusions",
              "Refine detection criteria based on baseline",
              "Implement machine learning tuning"
            ]
          }
        ]
      },
      exportInstructions: {
        title: "Export Package Contents",
        files: [
          "correlation_rules.json - XQL detection rules",
          "incident_layout.json - Custom alert presentation",
          "automated_response_playbook.yml - SOAR automation",
          "dashboard_config.json - Monitoring widgets",
          "README.md - Complete deployment guide",
          "XSIAM_Workflow_Guide.pdf - Step-by-step analyst procedures"
        ]
      }
    },
    metadata: {
      generated: new Date().toISOString(),
      version: "1.0",
      xsiamCompatibility: ["XSIAM 3.1+", "Cortex Cloud"],
      estimatedDeploymentTime: "45-60 minutes"
    }
  };
}

function generateDashboard(useCase: any) {
  return {
    dashboard: `${useCase.title}_monitoring`,
    widgets: 6,
    kpis: ['Detection Rate', 'Response Time', 'False Positives']
  };
}

// Generate collaboration export package
function generateCollaborationExport(useCase: any, workflowData: any) {
  return {
    packageName: `${useCase.title.replace(/\s+/g, '_')}_Security_Package`,
    includesAnalystGuide: true,
    includesDeploymentInstructions: true,
    includesXSIAMWorkflow: true,
    readyForCollaboration: true
  };
}

// Download collaboration package
function downloadCollaborationPackage(useCase: any, workflowData: any) {
  const exportData = {
    useCase,
    workflowData,
    documentation: generateXSIAMWorkflowDocs(useCase, workflowData),
    exportedAt: new Date().toISOString(),
    collaborationReady: true,
    instructions: {
      deployment: "Follow XSIAM_Workflow_Guide.pdf for step-by-step deployment",
      sharing: "Package contains all necessary files for team collaboration",
      support: "Use README.md for troubleshooting and best practices"
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${useCase.title.replace(/\s+/g, '_')}_collaboration_package.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportWorkflowResults(useCase: any, workflowData: any) {
  const exportData = {
    useCase,
    workflowData,
    completedAt: new Date().toISOString(),
    productionReady: true
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `security-ops-workflow-${useCase.title.replace(/\s+/g, '_').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}