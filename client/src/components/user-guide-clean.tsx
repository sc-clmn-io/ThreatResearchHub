import { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  Target, 
  FileText, 
  ArrowRight, 
  ExternalLink,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserGuideProps {
  onStartTutorial?: () => void;
}

export default function UserGuide({ onStartTutorial }: UserGuideProps) {
  const [activeSection, setActiveSection] = useState('');

  const exportOperatingGuide = () => {
    const content = `
# ThreatResearchHub Operating Guide

## Overview
ThreatResearchHub is a Content Engineering Workflow platform that transforms threat intelligence into production-ready XSIAM content packages through a systematic 6-stage process.

## 6-Stage Workflow

### Stage 1: Load Threat Intelligence (15-30 min)
- Select from integrated threat feeds or upload custom reports
- Extract IOCs, TTPs, and MITRE ATT&CK techniques
- Define specific detection objectives
- Set alert timing and response requirements

### Stage 2: Infrastructure Planning (30-45 min)
- Plan environment based on threat requirements
- Choose deployment option (Cloud: $50-200/month, On-Premises: $0)
- Identify required systems (endpoint, network, cloud, identity)
- Plan XSIAM Broker connectivity and data flow

### Stage 3: Infrastructure Deployment (60-90 min)
- Deploy systems using automated scripts or manual setup
- Configure realistic target environments
- Install monitoring agents and sensors
- Establish network connectivity to XSIAM

### Stage 4: Data Source Integration (45-60 min)
- Configure data sources to forward logs to XSIAM
- Validate field mappings and parsing rules
- Test data ingestion with sample events
- Verify alerts can be generated from data

### Stage 5: Content Generation (30-45 min)
- Generate XQL correlation rules with authentic field mappings
- Create alert layouts with analyst decision buttons
- Build automation playbooks with concrete response actions
- Design operational dashboards with KPIs

### Stage 6: Testing & Deployment (45-60 min)
- Test with controlled attack simulations
- Validate false positive scenarios
- Confirm alert timing meets SLA requirements
- Deploy to test environment before production

## Quick Start
1. Visit the main dashboard
2. Select threat intelligence source
3. Follow the 6-stage workflow
4. Deploy completed XSIAM content

For full documentation and Docker setup, see the Documentation section in the User Guide.
    `.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ThreatResearchHub-Operating-Guide.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!activeSection) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                ThreatResearchHub User Guide
              </span>
              <Button onClick={exportOperatingGuide} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Guide
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Welcome to ThreatResearchHub! This platform transforms threat intelligence into production-ready XSIAM content packages. Choose your path below to get started.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500" onClick={() => setActiveSection('tutorial')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Target className="h-6 w-6" />
                    Guided/Interactive Tutorial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Step-by-step walkthrough of the complete 6-stage workflow with interactive buttons linking to actual platform features. Perfect for first-time users.
                  </p>
                  <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
                    <strong>What you'll learn:</strong> Complete workflow from threat intelligence to deployed XSIAM content
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500" onClick={() => setActiveSection('documentation')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <FileText className="h-6 w-6" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Complete reference including Docker setup instructions, platform compatibility, and comprehensive best practices for all 6 stages.
                  </p>
                  <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
                    <strong>What you'll find:</strong> Technical setup, deployment options, and best practices
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              ThreatResearchHub User Guide
            </span>
            <Button onClick={exportOperatingGuide} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Guide
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setActiveSection('')}
              className="mb-4"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Main Menu
            </Button>
          </div>

          {activeSection === 'tutorial' && (
            <Card>
              <CardHeader>
                <CardTitle>Interactive 6-Stage Workflow</CardTitle>
                <p className="text-gray-600">Step-by-step process to transform threat intelligence into production-ready XSIAM content</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">Stage 1: Load Threat Intelligence (15-30 min)</h4>
                    <p className="text-sm text-gray-600">Import and analyze threat intelligence from various sources</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Select from integrated threat feeds or upload custom reports</li>
                      <li>• Extract IOCs, TTPs, and MITRE ATT&CK techniques</li>
                      <li>• Define specific detection objectives</li>
                      <li>• Set alert timing and response requirements</li>
                    </ul>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/'}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Try Stage 1
                      </Button>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold">Stage 2: Infrastructure Planning (30-45 min)</h4>
                    <p className="text-sm text-gray-600">Plan environment based on threat requirements</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• <strong>Cloud Option:</strong> $50-200/month depending on scope</li>
                      <li>• <strong>On-Premises:</strong> $0 using existing infrastructure</li>
                      <li>• Identify required systems (endpoint, network, cloud, identity)</li>
                      <li>• Plan XSIAM Broker connectivity and data flow</li>
                    </ul>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/lab-build-planner'}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Try Stage 2
                      </Button>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold">Stage 3: Infrastructure Deployment (60-90 min)</h4>
                    <p className="text-sm text-gray-600">Deploy required infrastructure components</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Deploy systems using automated scripts or manual setup</li>
                      <li>• Configure realistic target environments</li>
                      <li>• Install monitoring agents and sensors</li>
                      <li>• Establish network connectivity to XSIAM</li>
                    </ul>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/lab-build-planner'}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Try Stage 3
                      </Button>
                    </div>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold">Stage 4: Data Source Integration (45-60 min)</h4>
                    <p className="text-sm text-gray-600">Configure data sources to forward logs to XSIAM</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Configure data sources to forward logs to XSIAM</li>
                      <li>• Validate field mappings and parsing rules</li>
                      <li>• Test data ingestion with sample events</li>
                      <li>• Verify alerts can be generated from data</li>
                    </ul>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/data-source-integration'}
                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Try Stage 4
                      </Button>
                    </div>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold">Stage 5: Content Generation (30-45 min)</h4>
                    <p className="text-sm text-gray-600">Generate XSIAM content from threat intelligence</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Generate XQL correlation rules with authentic field mappings</li>
                      <li>• Create alert layouts with analyst decision buttons</li>
                      <li>• Build automation playbooks with concrete response actions</li>
                      <li>• Design operational dashboards with KPIs</li>
                    </ul>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/content-generation'}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Try Stage 5
                      </Button>
                    </div>
                  </div>

                  <div className="border-l-4 border-teal-500 pl-4">
                    <h4 className="font-semibold">Stage 6: Testing & Deployment (45-60 min)</h4>
                    <p className="text-sm text-gray-600">Test and deploy to XSIAM environment</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Test with controlled attack simulations</li>
                      <li>• Validate false positive scenarios</li>
                      <li>• Confirm alert timing meets SLA requirements</li>
                      <li>• Deploy to test environment before production</li>
                    </ul>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/xsiam-testing'}
                        className="text-teal-600 border-teal-200 hover:bg-teal-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Try Stage 6
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Complete Workflow Experience</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-4">
                      This 6-stage process works with any threat scenario - from container escapes to phishing campaigns to cloud misconfigurations. 
                      The platform adapts its recommendations and content generation based on your specific threat intelligence.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/'}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Start Your Workflow Now
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSection('documentation')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Documentation
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'documentation' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Documentation</CardTitle>
                  <p className="text-gray-600">Complete technical reference and setup guides</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-green-600 mb-2">Docker Quick Start (5 minutes)</h4>
                      <p className="text-sm text-gray-600 mb-3">Get the platform running locally with Docker</p>
                      <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                        git clone [repository]<br/>
                        cd threat-research-hub<br/>
                        docker-compose up -d
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-blue-600 mb-2">Platform Compatibility</h4>
                      <p className="text-sm text-gray-600 mb-3">Supported deployment environments</p>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Windows:</strong> Docker Desktop, WSL2 (3-5 minutes setup)</li>
                        <li>• <strong>macOS:</strong> Docker Desktop, native (3-5 minutes setup)</li>
                        <li>• <strong>Linux:</strong> Docker Engine, native (5-10 minutes setup)</li>
                        <li>• <strong>Cloud:</strong> AWS, Azure, GCP (10-15 minutes setup)</li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-purple-600 mb-2">Best Practices Guide</h4>
                      <p className="text-sm text-gray-600 mb-3">Comprehensive best practices for all 6 stages</p>
                      <div className="space-y-3">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h5 className="font-semibold">Stage 1: Threat Intelligence Best Practices</h5>
                          <ul className="text-sm mt-2 space-y-1">
                            <li>• Focus on high/critical severity threats only</li>
                            <li>• Validate IOCs against multiple sources</li>
                            <li>• Map TTPs to MITRE ATT&CK framework</li>
                            <li>• Document threat actor attribution</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-green-500 pl-4">
                          <h5 className="font-semibold">Stage 2: Infrastructure Planning Best Practices</h5>
                          <ul className="text-sm mt-2 space-y-1">
                            <li>• Choose cost-effective deployment options</li>
                            <li>• Plan for realistic attack scenarios</li>
                            <li>• Ensure proper network segmentation</li>
                            <li>• Document all infrastructure dependencies</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-4">
                          <h5 className="font-semibold">Stage 3: Infrastructure Deployment Best Practices</h5>
                          <ul className="text-sm mt-2 space-y-1">
                            <li>• Use Infrastructure as Code (Terraform/Ansible)</li>
                            <li>• Implement proper security groups and access controls</li>
                            <li>• Test connectivity to XSIAM before proceeding</li>
                            <li>• Document all deployed resources for cleanup</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-orange-500 pl-4">
                          <h5 className="font-semibold">Stage 4: Data Source Integration Best Practices</h5>
                          <ul className="text-sm mt-2 space-y-1">
                            <li>• Validate field mappings against actual schemas</li>
                            <li>• Test data ingestion with sample events</li>
                            <li>• Configure proper parsing and normalization</li>
                            <li>• Monitor data flow health and volume</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-red-500 pl-4">
                          <h5 className="font-semibold">Stage 5: Content Generation Best Practices</h5>
                          <ul className="text-sm mt-2 space-y-1">
                            <li>• Use authentic field names from dataset schemas</li>
                            <li>• Include concrete response actions in playbooks</li>
                            <li>• Add analyst decision buttons to alert layouts</li>
                            <li>• Create operational dashboards with KPIs</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-teal-500 pl-4">
                          <h5 className="font-semibold">Stage 6: Testing & Deployment Best Practices</h5>
                          <ul className="text-sm mt-2 space-y-1">
                            <li>• Test with controlled attack simulations</li>
                            <li>• Validate false positive scenarios</li>
                            <li>• Confirm alert timing meets SLA requirements</li>
                            <li>• Deploy to test environment before production</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}