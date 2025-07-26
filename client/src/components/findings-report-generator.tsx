import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Clock, Shield, Target, FileText, Download, Play, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FindingsReportData {
  incidentId: string;
  threatName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectionTime: string;
  attackVector: string;
  dwellTime: string;
  affectedSystems: string[];
  containmentActions: string[];
  remediationSteps: string[];
  preventionMeasures: string[];
  timeline: Array<{
    timestamp: string;
    event: string;
    source: string;
  }>;
  executiveSummary: string;
  technicalDetails: string;
  recommendations: string[];
}

interface FindingsReportGeneratorProps {
  useCase?: any;
  onGenerateSubplaybook?: (reportData: FindingsReportData) => void;
}

export function FindingsReportGenerator({ useCase, onGenerateSubplaybook }: FindingsReportGeneratorProps) {
  const [reportData, setReportData] = useState<FindingsReportData>({
    incidentId: `INC-${Date.now()}`,
    threatName: useCase?.title || '',
    severity: 'high',
    detectionTime: new Date().toISOString(),
    attackVector: '',
    dwellTime: '',
    affectedSystems: [],
    containmentActions: [],
    remediationSteps: [],
    preventionMeasures: [],
    timeline: [],
    executiveSummary: '',
    technicalDetails: '',
    recommendations: []
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [newSystem, setNewSystem] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newRemediation, setNewRemediation] = useState('');
  const [newPrevention, setNewPrevention] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');

  const addToArray = (field: keyof FindingsReportData, value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      setReportData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
      setValue('');
    }
  };

  const removeFromArray = (field: keyof FindingsReportData, index: number) => {
    setReportData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const generateXSIAMSubplaybook = () => {
    const subplaybookYaml = `# XSIAM Findings Report Generation Subplaybook
# Auto-generated for ${reportData.threatName}

name: Generate-Findings-Report-${reportData.incidentId}
description: Automated findings report generation for ${reportData.threatName} incident
version: 1.0.0

tasks:
  "1":
    id: collect_incident_data
    task:
      brand: ""
      command: GetIncidentData
      args:
        incident_id: \${incident.id}
        include_timeline: true
        include_artifacts: true
        include_enrichment: true
        include_investigation_data: true
    nexttasks:
      "#default#":
        - "2"

  "2":
    id: extract_attack_timeline
    task:
      brand: ""
      command: ExtractTimelineEvents
      args:
        start_time: \${incident.created}
        end_time: \${incident.closed}
        event_types: ["detection", "containment", "remediation"]
    nexttasks:
      "#default#":
        - "3"

  "3":
    id: calculate_dwell_time
    task:
      brand: ""
      command: CalculateDwellTime
      args:
        initial_compromise: \${inputs.attack_start_time}
        detection_time: \${incident.created}
    nexttasks:
      "#default#":
        - "4"

  "4":
    id: generate_findings_report
    task:
      brand: ""
      command: GenerateReport
      args:
        template: "security_findings"
        incident_data: \${tasks.1.outputs}
        timeline_data: \${tasks.2.outputs}
        dwell_time: \${tasks.3.outputs.dwell_time}
        threat_name: "${reportData.threatName}"
        severity: "${reportData.severity}"
        affected_systems: ${JSON.stringify(reportData.affectedSystems)}
        containment_actions: ${JSON.stringify(reportData.containmentActions)}
        remediation_steps: ${JSON.stringify(reportData.remediationSteps)}
        prevention_measures: ${JSON.stringify(reportData.preventionMeasures)}
    nexttasks:
      "#default#":
        - "5"

  "5":
    id: deliver_report
    task:
      brand: ""
      command: EmailReport
      args:
        recipients: \${inputs.stakeholder_emails}
        subject: "Security Findings Report - ${reportData.threatName}"
        report_data: \${tasks.4.outputs.report}
    close_notes: "Security findings report generated and delivered successfully"`;

    return subplaybookYaml;
  };

  const downloadPlaybook = () => {
    const yamlContent = generateXSIAMSubplaybook();
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findings-report-${reportData.incidentId}.yml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownReport = () => {
    return `# Security Findings Report

**Incident ID:** ${reportData.incidentId}  
**Threat Name:** ${reportData.threatName}  
**Severity:** ${reportData.severity.toUpperCase()}  
**Detection Time:** ${new Date(reportData.detectionTime).toLocaleString()}  
**Containment Time:** ${new Date(reportData.containmentTime).toLocaleString()}

## Executive Summary

This report documents the security incident involving ${reportData.threatName}, which was detected on ${new Date(reportData.detectionTime).toLocaleDateString()} and contained within ${Math.ceil((new Date(reportData.containmentTime).getTime() - new Date(reportData.detectionTime).getTime()) / (1000 * 60 * 60))} hours.

## Affected Systems

${reportData.affectedSystems.map(system => `- ${system}`).join('\n')}

## Attack Timeline

**Initial Detection:** ${new Date(reportData.detectionTime).toLocaleString()}  
**Containment Achieved:** ${new Date(reportData.containmentTime).toLocaleString()}  
**Dwell Time:** ${Math.ceil((new Date(reportData.containmentTime).getTime() - new Date(reportData.detectionTime).getTime()) / (1000 * 60 * 60))} hours

## Containment Actions Taken

${reportData.containmentActions.map(action => `- ${action}`).join('\n')}

## Remediation Steps

${reportData.remediationSteps.map(step => `- ${step}`).join('\n')}

## Prevention Measures

${reportData.preventionMeasures.map(measure => `- ${measure}`).join('\n')}

## Lessons Learned

This incident highlighted the importance of:
1. Rapid detection and response capabilities
2. Automated containment procedures
3. Comprehensive monitoring and logging
4. Regular security awareness training

**Report Generated:** ${new Date().toLocaleString()}  
**Generated By:** XSIAM Automated Findings Report System`;
  };

  const downloadMarkdownReport = () => {
    const markdownContent = generateMarkdownReport();
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findings-report-${reportData.incidentId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Security Incident Findings Report Generator
          </CardTitle>
          <CardDescription>
            Create comprehensive findings reports with XSIAM subplaybook automation for complete incident documentation
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>XSIAM Playbook Advantage:</strong> In a live XSIAM environment, this playbook would automatically extract real incident data, enrichment results, investigation workbooks, forensic artifacts, network evidence, and timeline information to generate comprehensive findings reports with actual context and evidence rather than manual input.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incident-id">Incident ID</Label>
                  <Input
                    id="incident-id"
                    value={reportData.incidentId}
                    onChange={(e) => setReportData(prev => ({ ...prev, incidentId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="threat-name">Threat Name</Label>
                  <Input
                    id="threat-name"
                    value={reportData.threatName}
                    onChange={(e) => setReportData(prev => ({ ...prev, threatName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={reportData.severity} onValueChange={(value: any) => setReportData(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="detection-time">Detection Time</Label>
                  <Input
                    id="detection-time"
                    type="datetime-local"
                    value={reportData.detectionTime.slice(0, -1)}
                    onChange={(e) => setReportData(prev => ({ ...prev, detectionTime: e.target.value + 'Z' }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="executive-summary">Executive Summary</Label>
                <Textarea
                  id="executive-summary"
                  placeholder="High-level summary of the incident for executive stakeholders..."
                  value={reportData.executiveSummary}
                  onChange={(e) => setReportData(prev => ({ ...prev, executiveSummary: e.target.value }))}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attack Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attack-vector">Attack Vector</Label>
                  <Input
                    id="attack-vector"
                    placeholder="e.g., Phishing email with malicious attachment"
                    value={reportData.attackVector}
                    onChange={(e) => setReportData(prev => ({ ...prev, attackVector: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dwell-time">Dwell Time</Label>
                  <Input
                    id="dwell-time"
                    placeholder="e.g., 72 hours"
                    value={reportData.dwellTime}
                    onChange={(e) => setReportData(prev => ({ ...prev, dwellTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Affected Systems</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add affected system..."
                    value={newSystem}
                    onChange={(e) => setNewSystem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToArray('affectedSystems', newSystem, setNewSystem)}
                  />
                  <Button onClick={() => addToArray('affectedSystems', newSystem, setNewSystem)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reportData.affectedSystems.map((system, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray('affectedSystems', index)}>
                      {system} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="technical-details">Technical Details</Label>
                <Textarea
                  id="technical-details"
                  placeholder="Detailed technical analysis of the attack, IOCs, TTPs, etc..."
                  value={reportData.technicalDetails}
                  onChange={(e) => setReportData(prev => ({ ...prev, technicalDetails: e.target.value }))}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Containment Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add containment action..."
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToArray('containmentActions', newAction, setNewAction)}
                  />
                  <Button onClick={() => addToArray('containmentActions', newAction, setNewAction)}>Add</Button>
                </div>
                <div className="space-y-2">
                  {reportData.containmentActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{action}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeFromArray('containmentActions', index)}>×</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Remediation Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add remediation step..."
                    value={newRemediation}
                    onChange={(e) => setNewRemediation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToArray('remediationSteps', newRemediation, setNewRemediation)}
                  />
                  <Button onClick={() => addToArray('remediationSteps', newRemediation, setNewRemediation)}>Add</Button>
                </div>
                <div className="space-y-2">
                  {reportData.remediationSteps.map((step, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{step}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeFromArray('remediationSteps', index)}>×</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Prevention Measures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add prevention measure..."
                  value={newPrevention}
                  onChange={(e) => setNewPrevention(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('preventionMeasures', newPrevention, setNewPrevention)}
                />
                <Button onClick={() => addToArray('preventionMeasures', newPrevention, setNewPrevention)}>Add</Button>
              </div>
              <div className="space-y-2">
                {reportData.preventionMeasures.map((measure, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{measure}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeFromArray('preventionMeasures', index)}>×</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add security recommendation..."
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('recommendations', newRecommendation, setNewRecommendation)}
                />
                <Button onClick={() => addToArray('recommendations', newRecommendation, setNewRecommendation)}>Add</Button>
              </div>
              <div className="space-y-2">
                {reportData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{rec}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeFromArray('recommendations', index)}>×</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4">
        <Button onClick={downloadReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
        <Button onClick={generateSubplaybook} variant="secondary" className="flex items-center gap-2">
          <Play className="h-4 w-4" />
          Generate XSIAM Subplaybook
        </Button>
      </div>
    </div>
  );
}