import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  ArrowRight,
  Lightbulb,
  Users,
  Clock,
  Target,
  Download,
  ExternalLink
} from "lucide-react";

interface UserGuideProps {
  onStartTutorial?: () => void;
}

export default function UserGuide({ onStartTutorial }: UserGuideProps) {
  const [activeSection, setActiveSection] = useState('overview');

  const workflowSteps = [
    {
      id: 'load-intelligence',
      title: 'Load Threat Intelligence',
      description: 'Load specific threat intelligence or customer requirements',
      details: [
        'Upload PDF threat report with specific CVEs/IOCs',
        'Paste URL from threat intelligence source',
        'Enter customer POV requirements and success criteria',
        'Browse pre-ingested threats from security feeds',
        'Use Customer Design of Record (DoR) entry for POV content'
      ],
      navigation: 'Dashboard → Step 1: Load Threat Intelligence',
      expectedTime: '10-15 minutes',
      outcome: 'Threat details with specific indicators loaded'
    },
    {
      id: 'select-threat',
      title: 'Select Specific Threat',
      description: 'Choose exactly which threat scenario to build content for',
      details: [
        'Review loaded threat reports from Step 1',
        'Examine threat details, CVEs, and attack vectors',
        'Verify customer requirements and success criteria',
        'Select the precise use case for infrastructure planning',
        'Confirm threat scope and specific requirements'
      ],
      navigation: 'Dashboard → Step 2: Select Specific Threat',
      expectedTime: '15-20 minutes',
      outcome: 'Selected use case details displayed with specific requirements'
    },
    {
      id: 'plan-infrastructure',
      title: 'Plan Infrastructure',
      description: 'Design lab environment needed to test specific threat',
      details: [
        'Click "🚀 Build Lab & Test" button next to selected threat',
        'Review auto-generated lab environment recommendations',
        'Navigate to "Procurement" tab for infrastructure options',
        'Compare AWS Cloud ($285/month), Azure ($295/month), VMware ($1,200 setup), Hybrid ($600+$125/month)',
        'Use cost calculator to adjust parameters (duration, team size, complexity)',
        'Download procurement quotes and business justification documents'
      ],
      navigation: 'Threat Feed → Build Lab & Test → Procurement Tab',
      expectedTime: '20-30 minutes',
      outcome: 'Infrastructure plan with budget approval documentation'
    },
    {
      id: 'deploy',
      title: 'Lab Deployment',
      description: 'Set up testing infrastructure',
      details: [
        'Select preferred infrastructure option (cloud/on-premises/hybrid)',
        'Follow vendor-specific setup guides (AWS/Azure/VMware)',
        'Deploy recommended virtual machines and network components',
        'Configure security monitoring and logging systems',
        'Install Cortex XDR agents on all test endpoints',
        'Validate network connectivity and data collection'
      ],
      navigation: 'Lab Environment → Infrastructure Tab → Deployment Scripts',
      expectedTime: '2-4 hours (cloud) / 1-2 days (on-premises)',
      outcome: 'Operational lab environment ready for testing'
    },
    {
      id: 'setup-data-sources',
      title: 'Setup Data Sources',
      description: 'Configure live data ingestion and validate field mappings',
      details: [
        'Access XSIAM tenant (scoleman.xdr.us.paloaltonetworks.com)',
        'Configure data source integration for lab endpoints',
        'Set up log forwarding from VMs, firewalls, and cloud services',
        'Validate data ingestion with test queries in XQL',
        'Create correlation rules specific to the target threat',
        'Configure automated response playbooks'
      ],
      navigation: 'XSIAM Debugger → Data Source Integration',
      expectedTime: '1-2 hours',
      outcome: 'Lab data flowing into XSIAM for analysis'
    },
    {
      id: 'generate-content',
      title: 'Generate Content',
      description: 'Create XQL rules, playbooks, and dashboards using live data',
      details: [
        'Generate XQL correlation rules tested against real data',
        'Create automation playbooks validated with actual incidents',
        'Build alert layouts designed for your specific data fields',
        'Develop operational dashboards for threat monitoring',
        'Validate all content works with your actual XSIAM data'
      ],
      navigation: 'Dashboard → Step 5: Generate Content',
      expectedTime: '2-4 hours per threat scenario',
      outcome: 'Generated content works with your actual XSIAM data'
    },
    {
      id: 'test-deploy',
      title: 'Test & Deploy',
      description: 'Validate detection effectiveness and deploy to production',
      details: [
        'Test detection rules against threat scenarios',
        'Validate playbooks execute correctly',
        'Deploy to production XSIAM environment',
        'Generate comprehensive findings reports',
        'Document complete testing results and deployment'
      ],
      navigation: 'Dashboard → Step 6: Test & Deploy',
      expectedTime: '1-2 hours',
      outcome: 'Content successfully detects threats in production'
    }
  ];

  const audienceProfiles = [
    {
      role: 'Security Analyst',
      level: 'Beginner',
      goals: ['Learn threat analysis', 'Understand XSIAM basics', 'Practice incident response'],
      recommendedPath: 'Start with guided tutorials, focus on threat discovery and analysis',
      timeCommitment: '2-3 hours per week'
    },
    {
      role: 'SOC Engineer',
      level: 'Intermediate',
      goals: ['Improve detection rules', 'Test automation', 'Validate playbooks'],
      recommendedPath: 'Focus on lab deployment and XSIAM integration',
      timeCommitment: '4-6 hours per week'
    },
    {
      role: 'Security Architect',
      level: 'Advanced',
      goals: ['Infrastructure planning', 'Cost optimization', 'Team training'],
      recommendedPath: 'Use procurement planning and advanced cost analysis',
      timeCommitment: '1-2 hours per session, project-based'
    }
  ];

  const bestPractices = [
    {
      category: 'Threat Selection',
      tips: [
        'Focus on threats relevant to your technology stack',
        'Start with high-severity threats that have public exploit code',
        'Prioritize threats that match your industry vertical',
        'Consider compliance requirements (PCI, HIPAA, SOX)'
      ]
    },
    {
      category: 'Infrastructure Planning',
      tips: [
        'Start with cloud infrastructure for faster deployment',
        'Consider hybrid approach for sensitive data',
        'Plan for ongoing operational costs beyond setup',
        'Document all infrastructure decisions for audit purposes'
      ]
    },
    {
      category: 'Testing Methodology',
      tips: [
        'Always test in isolated lab environments',
        'Document all testing procedures and results',
        'Validate detection rules before production deployment',
        'Include both technical and executive summaries in reports'
      ]
    }
  ];

  const exportOperatingGuide = () => {
    const guide = `
# ThreatResearchHub User Guide

## Platform Overview
ThreatResearchHub is a comprehensive threat research enablement tool that guides security teams through complete end-to-end workflows from threat report analysis to XSIAM testing and findings reporting.

## Target Audience
- Security Analysts (Beginner to Intermediate)
- SOC Engineers and Threat Hunters
- Security Architects and Team Leads
- Incident Response Teams

## Core Workflow

${workflowSteps.map(step => `
### ${step.title}
**Objective:** ${step.description}
**Navigation:** ${step.navigation}
**Expected Time:** ${step.expectedTime}

**Steps:**
${step.details.map(detail => `- ${detail}`).join('\n')}

**Expected Outcome:** ${step.outcome}
`).join('\n')}

## Best Practices

${bestPractices.map(practice => `
### ${practice.category}
${practice.tips.map(tip => `- ${tip}`).join('\n')}
`).join('\n')}

## Audience-Specific Guidance

${audienceProfiles.map(profile => `
### ${profile.role} (${profile.level})
**Goals:** ${profile.goals.join(', ')}
**Recommended Path:** ${profile.recommendedPath}
**Time Commitment:** ${profile.timeCommitment}
`).join('\n')}

## Support and Resources
- Platform Documentation: Built-in help system
- XSIAM Integration: scoleman.xdr.us.paloaltonetworks.com
- Interactive Tutorials: Available in platform
- Cost Calculator: Infrastructure procurement planning

Generated on: ${new Date().toLocaleDateString()}
`;

    const blob = new Blob([guide], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'threatresearchhub-user-guide.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              ThreatResearchHub User Guide
            </span>
            <div className="flex gap-2">
              {onStartTutorial && (
                <Button onClick={onStartTutorial} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start Interactive Tutorial
                </Button>
              )}
              <Button onClick={exportOperatingGuide} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Guide
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Complete step-by-step guidance for threat research, lab environment deployment, 
            and XSIAM integration. This guide is designed for security teams at all experience levels.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="font-semibold">Multi-Level</div>
              <div className="text-sm text-gray-600">Beginner to Advanced</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="font-semibold">Flexible Timeline</div>
              <div className="text-sm text-gray-600">2 hours to 2 days</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="font-semibold">Complete Workflow</div>
              <div className="text-sm text-gray-600">Threat to Production</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Workflow Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience Guide</TabsTrigger>
          <TabsTrigger value="practices">Best Practices</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {workflowSteps.map((step, index) => (
              <Card key={step.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-gray-600 mb-3">{step.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Navigation:</span>
                          <p>{step.navigation}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Expected Time:</span>
                          <p>{step.expectedTime}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Badge className="bg-green-100 text-green-800">
                          Outcome: {step.outcome}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid gap-4">
            {audienceProfiles.map((profile) => (
              <Card key={profile.role}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {profile.role}
                    <Badge variant="outline">{profile.level}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-500">Goals:</span>
                      <ul className="mt-1 space-y-1">
                        {profile.goals.map((goal, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-500">Recommended Path:</span>
                      <p className="mt-1">{profile.recommendedPath}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-500">Time Commitment:</span>
                      <p className="mt-1">{profile.timeCommitment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="practices" className="space-y-4">
          <div className="grid gap-4">
            {bestPractices.map((practice) => (
              <Card key={practice.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    {practice.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {practice.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="space-y-6">
            {workflowSteps.map((step, index) => (
              <Card key={step.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Detailed Steps:</h4>
                    <ol className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2">
                          <span className="text-blue-600 font-medium">{detailIndex + 1}.</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Success Criteria:</strong> {step.outcome}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}