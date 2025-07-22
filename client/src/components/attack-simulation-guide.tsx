import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Shield, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  Play,
  Eye,
  Download,
  Code,
  Activity,
  Zap
} from 'lucide-react';

interface AttackSimulationGuideProps {
  useCase: any;
  onSimulationComplete: (results: any) => void;
}

export default function AttackSimulationGuide({ useCase, onSimulationComplete }: AttackSimulationGuideProps) {
  const [currentPhase, setCurrentPhase] = useState<'preparation' | 'execution' | 'validation' | 'evidence'>('preparation');
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);

  const simulationPhases = [
    {
      id: 'preparation',
      name: 'Preparation',
      description: 'Set up attack tools and target environment',
      duration: '15 minutes'
    },
    {
      id: 'execution',
      name: 'Execution',
      description: 'Run the attack simulation',
      duration: '10 minutes'
    },
    {
      id: 'validation',
      name: 'Validation',
      description: 'Verify attack success and impact',
      duration: '10 minutes'
    },
    {
      id: 'evidence',
      name: 'Evidence Collection',
      description: 'Gather logs and forensic evidence',
      duration: '15 minutes'
    }
  ];

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'preparation':
        return <PreparationPhase useCase={useCase} />;
      case 'execution':
        return <ExecutionPhase useCase={useCase} />;
      case 'validation':
        return <ValidationPhase useCase={useCase} />;
      case 'evidence':
        return <EvidenceCollectionPhase useCase={useCase} />;
      default:
        return null;
    }
  };

  const handleNextPhase = () => {
    const currentIndex = simulationPhases.findIndex(phase => phase.id === currentPhase);
    if (currentIndex < simulationPhases.length - 1) {
      setCompletedPhases(prev => [...prev, currentPhase]);
      setCurrentPhase(simulationPhases[currentIndex + 1].id as any);
    } else {
      setCompletedPhases(prev => [...prev, currentPhase]);
      onSimulationComplete({
        completedPhases: [...completedPhases, currentPhase],
        useCase,
        simulationResults: {
          success: true,
          evidenceCollected: true,
          detectionTriggered: true
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Attack Simulation - {useCase?.title}</span>
          </CardTitle>
          <CardDescription>
            Execute controlled attack to validate detection and response capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {simulationPhases.map((phase, index) => (
              <Button
                key={phase.id}
                variant={currentPhase === phase.id ? 'default' : completedPhases.includes(phase.id) ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPhase(phase.id as any)}
                className="flex flex-col h-auto p-3"
              >
                <div className="flex items-center space-x-2 mb-1">
                  {completedPhases.includes(phase.id) && <CheckCircle className="h-3 w-3" />}
                  <span className="text-xs font-medium">{phase.name}</span>
                </div>
                <span className="text-xs text-gray-600">{phase.duration}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phase Content */}
      {renderPhaseContent()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = simulationPhases.findIndex(p => p.id === currentPhase);
            if (currentIndex > 0) {
              setCurrentPhase(simulationPhases[currentIndex - 1].id as any);
            }
          }}
          disabled={currentPhase === 'preparation'}
        >
          Previous Phase
        </Button>
        
        <Button onClick={handleNextPhase}>
          {currentPhase === 'evidence' ? 'Complete Simulation' : 'Next Phase'}
        </Button>
      </div>
    </div>
  );
}

function PreparationPhase({ useCase }: any) {
  const getAttackTools = (category: string) => {
    switch (category) {
      case 'cloud':
        return [
          { name: 'kubectl', purpose: 'Kubernetes cluster access', command: 'kubectl get pods --all-namespaces' },
          { name: 'kube-hunter', purpose: 'Kubernetes security scanning', command: 'kube-hunter --remote [cluster-ip]' },
          { name: 'Peirates', purpose: 'Kubernetes exploitation', command: './peirates' },
          { name: 'CDK', purpose: 'Container escape toolkit', command: './cdk evaluate --list' }
        ];
      case 'network':
        return [
          { name: 'Nmap', purpose: 'Network reconnaissance', command: 'nmap -sS -O [target-range]' },
          { name: 'Metasploit', purpose: 'Network exploitation', command: 'msfconsole' },
          { name: 'Scapy', purpose: 'Custom packet crafting', command: 'python3 -c "import scapy"' },
          { name: 'Hping3', purpose: 'Network stress testing', command: 'hping3 -S -p 80 [target]' }
        ];
      case 'endpoint':
        return [
          { name: 'Mimikatz', purpose: 'Credential extraction', command: 'mimikatz.exe' },
          { name: 'PowerShell Empire', purpose: 'Post-exploitation', command: 'powershell -ep bypass' },
          { name: 'PsExec', purpose: 'Lateral movement', command: 'psexec \\\\[target] cmd' },
          { name: 'BloodHound', purpose: 'AD enumeration', command: 'bloodhound-python -u user -p pass' }
        ];
      case 'identity':
        return [
          { name: 'Kerbrute', purpose: 'Kerberos enumeration', command: 'kerbrute userenum --dc [dc-ip] users.txt' },
          { name: 'GetNPUsers', purpose: 'ASREPRoast attack', command: 'GetNPUsers.py domain.com/ -usersfile users.txt' },
          { name: 'Rubeus', purpose: 'Kerberos exploitation', command: 'Rubeus.exe asreproast' },
          { name: 'ldapsearch', purpose: 'LDAP enumeration', command: 'ldapsearch -x -h [ldap-server]' }
        ];
      default:
        return [];
    }
  };

  const tools = getAttackTools(useCase?.category || 'endpoint');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attack Preparation</CardTitle>
        <CardDescription>Set up tools and environment for {useCase?.category} attack simulation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Ensure this simulation runs only in isolated lab environment with proper authorization
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h4 className="font-medium">Required Attack Tools:</h4>
          <div className="space-y-3">
            {tools.map((tool, i) => (
              <Card key={i} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{tool.name}</h5>
                    <Badge variant="outline">Tool</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{tool.purpose}</p>
                  
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                    <code>{tool.command}</code>
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-3 w-3 mr-1" />
                      Instructions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Safety Checklist:</h4>
          <div className="space-y-2 text-sm text-yellow-700">
            {[
              'Lab environment is isolated from production',
              'All monitoring and logging is active',
              'Backup systems are in place',
              'Incident response team is notified',
              'Legal authorization is documented'
            ].map((item, i) => (
              <div key={i} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutionPhase({ useCase }: any) {
  const [executionStep, setExecutionStep] = useState(0);
  
  const getAttackSteps = (category: string) => {
    switch (category) {
      case 'cloud':
        return [
          { step: 'Reconnaissance', action: 'Scan Kubernetes API endpoints', expected: 'Discovery of exposed services' },
          { step: 'Initial Access', action: 'Exploit container misconfiguration', expected: 'Container shell access' },
          { step: 'Privilege Escalation', action: 'Escape to host system', expected: 'Host-level access' },
          { step: 'Persistence', action: 'Deploy malicious pod', expected: 'Persistent access maintained' }
        ];
      case 'network':
        return [
          { step: 'Reconnaissance', action: 'Port scan network range', expected: 'Open services identified' },
          { step: 'Vulnerability Scanning', action: 'Identify exploitable services', expected: 'CVEs discovered' },
          { step: 'Exploitation', action: 'Execute remote code execution', expected: 'Initial foothold gained' },
          { step: 'Lateral Movement', action: 'Move to additional systems', expected: 'Network propagation' }
        ];
      case 'endpoint':
        return [
          { step: 'Initial Access', action: 'Execute malicious payload', expected: 'User-level access' },
          { step: 'Credential Harvesting', action: 'Extract stored credentials', expected: 'Additional accounts compromised' },
          { step: 'Privilege Escalation', action: 'Exploit local vulnerability', expected: 'Administrative access' },
          { step: 'Data Exfiltration', action: 'Access sensitive files', expected: 'Data theft simulation' }
        ];
      case 'identity':
        return [
          { step: 'Enumeration', action: 'Discover user accounts', expected: 'Valid usernames identified' },
          { step: 'Credential Attack', action: 'Password spraying/brute force', expected: 'Account compromise' },
          { step: 'Token Manipulation', action: 'Kerberos ticket extraction', expected: 'Authentication bypass' },
          { step: 'Persistence', action: 'Create backdoor accounts', expected: 'Persistent access' }
        ];
      default:
        return [];
    }
  };

  const attackSteps = getAttackSteps(useCase?.category || 'endpoint');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attack Execution</CardTitle>
        <CardDescription>Execute {useCase?.category} attack simulation with controlled progression</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {attackSteps.map((step, i) => (
            <Card key={i} className={`${i === executionStep ? 'ring-2 ring-blue-500' : ''} ${i < executionStep ? 'bg-green-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {i < executionStep && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {i === executionStep && <Play className="h-5 w-5 text-blue-500" />}
                    {i > executionStep && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                    <div>
                      <h4 className="font-medium">{step.step}</h4>
                      <p className="text-sm text-gray-600">{step.action}</p>
                    </div>
                  </div>
                  
                  {i === executionStep && (
                    <Button 
                      size="sm" 
                      onClick={() => setExecutionStep(i + 1)}
                      disabled={i >= attackSteps.length}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Execute
                    </Button>
                  )}
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-600">Expected Result:</span>
                  <span className="ml-2 font-medium">{step.expected}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {executionStep > 0 && (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Attack step {executionStep} of {attackSteps.length} completed successfully. 
              Monitor XSIAM alerts for detection events.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Live Monitoring:</h4>
          <div className="space-y-2 text-sm text-red-700">
            <p>• XSIAM correlation rules are actively monitoring</p>
            <p>• Real-time alerts should trigger for each attack step</p>
            <p>• Evidence collection is automatic</p>
            <p>• Stop simulation immediately if unexpected behavior occurs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationPhase({ useCase }: any) {
  const [validationResults] = useState([
    { metric: 'Attack Success Rate', value: '100%', status: 'success' },
    { metric: 'XSIAM Detection Rate', value: '85%', status: 'warning' },
    { metric: 'Alert Generation', value: '12 alerts', status: 'success' },
    { metric: 'Response Time', value: '2.3 minutes', status: 'success' }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attack Validation</CardTitle>
        <CardDescription>Verify attack success and detection effectiveness</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {validationResults.map((result, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{result.metric}</span>
                <Badge variant={result.status === 'success' ? 'default' : 'secondary'}>
                  {result.status}
                </Badge>
              </div>
              <div className="text-2xl font-bold">{result.value}</div>
            </Card>
          ))}
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Attack simulation completed successfully. XSIAM detected 85% of attack activities with 12 alerts generated.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h4 className="font-medium">Detected Activities:</h4>
          <div className="space-y-2">
            {[
              'Suspicious process execution detected',
              'Credential access attempt identified',
              'Network lateral movement observed',
              'Data exfiltration pattern recognized'
            ].map((activity, i) => (
              <div key={i} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{activity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Missed Detections:</h4>
          <div className="space-y-2">
            {[
              'Initial reconnaissance phase',
              'Some privilege escalation techniques'
            ].map((missed, i) => (
              <div key={i} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{missed}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceCollectionPhase({ useCase }: any) {
  const [evidenceTypes] = useState([
    { type: 'System Logs', count: 247, size: '2.3MB', status: 'collected' },
    { type: 'Network Traffic', count: 89, size: '5.7MB', status: 'collected' },
    { type: 'Process Artifacts', count: 34, size: '1.2MB', status: 'collected' },
    { type: 'Memory Dumps', count: 3, size: '45MB', status: 'in-progress' }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence Collection</CardTitle>
        <CardDescription>Gather forensic evidence and attack artifacts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {evidenceTypes.map((evidence, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${
                  evidence.status === 'collected' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="font-medium">{evidence.type}</p>
                  <p className="text-sm text-gray-600">
                    {evidence.count} items • {evidence.size}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Badge variant={evidence.status === 'collected' ? 'default' : 'secondary'}>
                  {evidence.status}
                </Badge>
                {evidence.status === 'collected' && (
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Alert>
          <Code className="h-4 w-4" />
          <AlertDescription>
            Evidence collection complete. Use this data to enhance XSIAM detection rules and analyst procedures.
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Analyze collected evidence for detection gaps</li>
            <li>• Update XSIAM correlation rules</li>
            <li>• Enhance alert layouts with new indicators</li>
            <li>• Document lessons learned for future simulations</li>
          </ul>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Evidence Package
          </Button>
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Generate XSIAM Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}