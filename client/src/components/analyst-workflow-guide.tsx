import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  ClipboardCheck, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileText,
  PlayCircle,
  MessageSquare,
  Shield
} from 'lucide-react';

interface AnalystWorkflowGuideProps {
  useCase: any;
  simulationResults: any;
  onWorkflowComplete: (workflow: any) => void;
}

export default function AnalystWorkflowGuide({ useCase, simulationResults, onWorkflowComplete }: AnalystWorkflowGuideProps) {
  const [currentWorkflow, setCurrentWorkflow] = useState<'triage' | 'investigation' | 'containment' | 'documentation'>('triage');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const workflowSteps = [
    {
      id: 'triage',
      name: 'Alert Triage',
      description: 'Initial alert assessment and prioritization',
      duration: '5-10 minutes'
    },
    {
      id: 'investigation',
      name: 'Deep Investigation',
      description: 'Comprehensive threat analysis',
      duration: '15-30 minutes'
    },
    {
      id: 'containment',
      name: 'Response & Containment',
      description: 'Implement containment actions',
      duration: '10-20 minutes'
    },
    {
      id: 'documentation',
      name: 'Documentation',
      description: 'Record findings and lessons learned',
      duration: '5-15 minutes'
    }
  ];

  const renderWorkflowContent = () => {
    switch (currentWorkflow) {
      case 'triage':
        return <TriageWorkflow useCase={useCase} simulationResults={simulationResults} />;
      case 'investigation':
        return <InvestigationWorkflow useCase={useCase} simulationResults={simulationResults} />;
      case 'containment':
        return <ContainmentWorkflow useCase={useCase} simulationResults={simulationResults} />;
      case 'documentation':
        return <DocumentationWorkflow useCase={useCase} simulationResults={simulationResults} />;
      default:
        return null;
    }
  };

  const handleNextWorkflow = () => {
    const currentIndex = workflowSteps.findIndex(step => step.id === currentWorkflow);
    if (currentIndex < workflowSteps.length - 1) {
      setCompletedSteps(prev => [...prev, currentWorkflow]);
      setCurrentWorkflow(workflowSteps[currentIndex + 1].id as any);
    } else {
      setCompletedSteps(prev => [...prev, currentWorkflow]);
      onWorkflowComplete({
        completedWorkflows: [...completedSteps, currentWorkflow],
        useCase,
        simulationResults
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Analyst Response Workflow</span>
          </CardTitle>
          <CardDescription>
            Define analyst procedures for {useCase?.title} incident response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {workflowSteps.map((step, index) => (
              <Button
                key={step.id}
                variant={currentWorkflow === step.id ? 'default' : completedSteps.includes(step.id) ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setCurrentWorkflow(step.id as any)}
                className="flex flex-col h-auto p-3"
              >
                <div className="flex items-center space-x-2 mb-1">
                  {completedSteps.includes(step.id) && <CheckCircle className="h-3 w-3" />}
                  <span className="text-xs font-medium">{step.name}</span>
                </div>
                <span className="text-xs text-gray-600">{step.duration}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Content */}
      {renderWorkflowContent()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = workflowSteps.findIndex(s => s.id === currentWorkflow);
            if (currentIndex > 0) {
              setCurrentWorkflow(workflowSteps[currentIndex - 1].id as any);
            }
          }}
          disabled={currentWorkflow === 'triage'}
        >
          Previous Step
        </Button>
        
        <Button onClick={handleNextWorkflow}>
          {currentWorkflow === 'documentation' ? 'Complete Workflow' : 'Next Step'}
        </Button>
      </div>
    </div>
  );
}

function TriageWorkflow({ useCase, simulationResults }: any) {
  const [triageChecklist] = useState([
    { item: 'Alert severity assessment', completed: false, time: '2 min' },
    { item: 'Affected systems identification', completed: false, time: '3 min' },
    { item: 'Business impact evaluation', completed: false, time: '2 min' },
    { item: 'Initial containment decision', completed: false, time: '3 min' }
  ]);

  const getTriageGuidance = (category: string) => {
    switch (category) {
      case 'cloud':
        return {
          priority: 'High - Cloud infrastructure compromise can spread rapidly',
          indicators: ['Kubernetes pod anomalies', 'Container escape attempts', 'Privilege escalation'],
          escalation: 'Cloud security team + Incident commander'
        };
      case 'network':
        return {
          priority: 'Critical - Network compromise affects entire environment',
          indicators: ['Lateral movement patterns', 'Port scanning', 'Data exfiltration'],
          escalation: 'Network team + Security operations manager'
        };
      case 'endpoint':
        return {
          priority: 'Medium-High - Endpoint compromise with potential for spread',
          indicators: ['Malicious process execution', 'Credential theft', 'Registry modifications'],
          escalation: 'Endpoint team + IT operations'
        };
      case 'identity':
        return {
          priority: 'Critical - Identity compromise provides wide access',
          indicators: ['Authentication anomalies', 'Privilege abuse', 'Account enumeration'],
          escalation: 'Identity team + Security director'
        };
      default:
        return {
          priority: 'Medium',
          indicators: ['Suspicious activity'],
          escalation: 'Security team'
        };
    }
  };

  const guidance = getTriageGuidance(useCase?.category || 'endpoint');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alert Triage Process</CardTitle>
          <CardDescription>Initial assessment and prioritization for {useCase?.category} security incident</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Priority Level:</strong> {guidance.priority}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h4 className="font-medium">Triage Checklist:</h4>
            <div className="space-y-3">
              {triageChecklist.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{item.item}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{item.time}</Badge>
                    <Button size="sm" variant="ghost">Mark Complete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {guidance.indicators.map((indicator, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full" />
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Escalation Path</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{guidance.escalation}</p>
                <Button size="sm" className="mt-3">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Notify Teams
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InvestigationWorkflow({ useCase, simulationResults }: any) {
  const [investigationSteps] = useState([
    { step: 'Timeline Analysis', description: 'Reconstruct attack sequence', status: 'pending' },
    { step: 'Asset Enumeration', description: 'Identify all affected systems', status: 'pending' },
    { step: 'IOC Extraction', description: 'Collect indicators of compromise', status: 'pending' },
    { step: 'Threat Attribution', description: 'Identify threat actor and TTPs', status: 'pending' }
  ]);

  const getInvestigationQueries = (category: string) => {
    switch (category) {
      case 'cloud':
        return [
          'dataset = k8s_audit | where verb contains "create" and objectRef.resource == "pods"',
          'dataset = cloud_logs | where container_name contains "suspicious"',
          'dataset = k8s_audit | where verb == "escalate" and user.username != "system"'
        ];
      case 'network':
        return [
          'dataset = network_traffic | where dest_port in (22, 3389, 5985)',
          'dataset = firewall_logs | where action == "deny" and count > 10',
          'dataset = dns_logs | where query contains "suspicious-domain"'
        ];
      case 'endpoint':
        return [
          'dataset = windows_events | where event_id == 4688 and process_name contains "cmd"',
          'dataset = sysmon_events | where event_id == 1 and parent_process contains "explorer"',
          'dataset = security_events | where event_id == 4624 and logon_type == 3'
        ];
      case 'identity':
        return [
          'dataset = auth_logs | where result == "failed" and count > 5',
          'dataset = ad_logs | where event_id == 4768 and ticket_options contains "forwardable"',
          'dataset = sso_logs | where risk_score > 80'
        ];
      default:
        return ['dataset = all_logs | where severity == "high"'];
    }
  };

  const queries = getInvestigationQueries(useCase?.category || 'endpoint');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deep Investigation</CardTitle>
          <CardDescription>Comprehensive analysis of {useCase?.title} security incident</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Investigation Steps:</h4>
            <div className="space-y-3">
              {investigationSteps.map((step, i) => (
                <Card key={i} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{step.step}</h5>
                      <Badge variant="outline">{step.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                    <Button size="sm" variant="outline">
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Start Investigation
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">XSIAM Investigation Queries:</h4>
            <div className="space-y-3">
              {queries.map((query, i) => (
                <div key={i} className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                  <code>{query}</code>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Based on simulation results: {simulationResults?.detectionTriggered ? 'Multiple detection alerts generated' : 'Limited detection coverage identified'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

function ContainmentWorkflow({ useCase, simulationResults }: any) {
  const [containmentActions] = useState([
    { action: 'Immediate isolation', priority: 'Critical', time: '< 5 min', status: 'ready' },
    { action: 'Disable compromised accounts', priority: 'High', time: '< 10 min', status: 'ready' },
    { action: 'Block malicious indicators', priority: 'High', time: '< 15 min', status: 'ready' },
    { action: 'Patch vulnerabilities', priority: 'Medium', time: '< 30 min', status: 'ready' }
  ]);

  const getContainmentProcedures = (category: string) => {
    switch (category) {
      case 'cloud':
        return [
          'kubectl delete pod [malicious-pod] -n [namespace]',
          'kubectl patch networkpolicy [policy] --patch "spec: {podSelector: {}}"',
          'aws iam attach-user-policy --user-name [user] --policy-arn [quarantine-policy]'
        ];
      case 'network':
        return [
          'firewall rule add deny src [malicious-ip] dst any',
          'route add [malicious-subnet] mask 255.255.255.0 127.0.0.1',
          'dns block [malicious-domain]'
        ];
      case 'endpoint':
        return [
          'psexec \\\\[endpoint] net user [account] /active:no',
          'netsh advfirewall firewall add rule name="Block-Malware" action=block program="[path]"',
          'schtasks /delete /tn "[malicious-task]" /f'
        ];
      case 'identity':
        return [
          'net user [compromised-account] /active:no',
          'dsmod user "CN=[user],OU=Users,DC=domain,DC=com" -disabled yes',
          'klist purge'
        ];
      default:
        return ['Emergency containment procedures'];
    }
  };

  const procedures = getContainmentProcedures(useCase?.category || 'endpoint');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Response & Containment</CardTitle>
          <CardDescription>Immediate response actions for {useCase?.category} incident containment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Response Status:</strong> {simulationResults?.success ? 'Attack contained in lab environment' : 'Containment procedures ready for deployment'}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h4 className="font-medium">Containment Actions:</h4>
            <div className="space-y-3">
              {containmentActions.map((action, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{action.action}</p>
                      <p className="text-sm text-gray-600">Target: {action.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={action.priority === 'Critical' ? 'destructive' : action.priority === 'High' ? 'default' : 'secondary'}>
                      {action.priority}
                    </Badge>
                    <Button size="sm" variant="outline">Execute</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Automated Response Commands:</h4>
            <div className="space-y-3">
              {procedures.map((procedure, i) => (
                <div key={i} className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                  <code>{procedure}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Emergency Contacts:</h4>
            <div className="space-y-1 text-sm text-red-700">
              <p>• Security Operations Center: x1234</p>
              <p>• Incident Response Team: x5678</p>
              <p>• IT Operations Manager: x9012</p>
              <p>• Legal/Compliance: x3456</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentationWorkflow({ useCase, simulationResults }: any) {
  const [documentationItems] = useState([
    { item: 'Incident timeline', status: 'pending', template: 'chronological-timeline.md' },
    { item: 'IOC report', status: 'pending', template: 'ioc-extraction.json' },
    { item: 'Lessons learned', status: 'pending', template: 'lessons-learned.md' },
    { item: 'Remediation summary', status: 'pending', template: 'remediation-report.md' }
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Incident Documentation</CardTitle>
          <CardDescription>Record findings and create knowledge base entries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Documentation Requirements:</h4>
            <div className="space-y-3">
              {documentationItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-gray-600">Template: {item.template}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{item.status}</Badge>
                    <Button size="sm" variant="outline">Create</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Simulation Summary:</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Use Case: {useCase?.title}</p>
              <p>• Category: {useCase?.category}</p>
              <p>• Attack Success: {simulationResults?.success ? 'Yes' : 'No'}</p>
              <p>• Detection Rate: {simulationResults?.detectionTriggered ? '85%' : 'N/A'}</p>
              <p>• Evidence Collected: {simulationResults?.evidenceCollected ? 'Complete' : 'Partial'}</p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Knowledge Base Updates:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Update detection rules based on simulation findings</li>
              <li>• Create new alert layouts for better analyst workflow</li>
              <li>• Document response procedures for future incidents</li>
              <li>• Share lessons learned with security team</li>
            </ul>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Export Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}