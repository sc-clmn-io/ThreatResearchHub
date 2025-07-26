import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Circle, Clock, AlertTriangle, Server, Cloud, Network, Shield, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InfrastructureStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  cost: string;
  instructions: string[];
  prerequisites: string[];
  verificationSteps: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  category: 'systems' | 'network' | 'security' | 'cloud';
}

interface Props {
  useCase: any;
  onInfrastructureComplete: (deploymentData: any) => void;
}

export default function InfrastructureDeploymentGuide({ useCase, onInfrastructureComplete }: Props) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [deploymentSteps, setDeploymentSteps] = useState<InfrastructureStep[]>([]);
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  useEffect(() => {
    generateDeploymentSteps();
  }, [useCase]);

  const generateDeploymentSteps = () => {
    const requirements = useCase.infrastructureRequirements || {};
    const category = useCase.category || 'endpoint';
    
    const steps: InfrastructureStep[] = [];

    // Add base infrastructure steps based on category
    if (category === 'endpoint') {
      steps.push(
        {
          id: 'domain-controller',
          title: 'Deploy Windows Domain Controller',
          description: 'Set up Active Directory Domain Services for authentication and policy management',
          estimatedTime: '45 minutes',
          cost: '$0 (using existing VM infrastructure)',
          category: 'systems',
          status: 'pending',
          prerequisites: ['VM infrastructure available', 'Windows Server 2019+ license'],
          instructions: [
            '1. Create new Windows Server 2019 VM with 4GB RAM, 60GB disk',
            '2. Set static IP address (example: 192.168.10.10)',
            '3. Set hostname to DC01 and restart',
            '4. Install Active Directory Domain Services role',
            '5. Run dcpromo to create new forest (example: lab.local)',
            '6. Create domain admin account for lab use',
            '7. Configure DNS forwarders to 8.8.8.8 and 1.1.1.1',
            '8. Verify domain controller is working with dcdiag'
          ],
          verificationSteps: [
            'Domain controller responds to ping',
            'DNS resolution works for domain name',
            'Event logs show no critical errors',
            'Can join client machines to domain'
          ]
        },
        {
          id: 'workstations',
          title: 'Deploy Windows 10 Workstations',
          description: 'Set up target workstations that will be monitored and potentially compromised',
          estimatedTime: '30 minutes per workstation',
          cost: '$0 (using existing infrastructure)',
          category: 'systems',
          status: 'pending',
          prerequisites: ['Domain Controller operational'],
          instructions: [
            '1. Create Windows 10 VMs (minimum 2 workstations)',
            '2. Set unique hostnames: WS01, WS02, etc.',
            '3. Configure to use Domain Controller as DNS server',
            '4. Join each workstation to the domain',
            '5. Create test user accounts on domain',
            '6. Install common applications (Office, browsers)',
            '7. Enable RDP and configure firewall rules',
            '8. Create shared folders for lateral movement testing'
          ],
          verificationSteps: [
            'Workstations can login with domain accounts',
            'Network connectivity between systems verified',
            'RDP access working between machines',
            'Shared folders accessible'
          ]
        }
      );
    }

    if (category === 'network' || category === 'endpoint') {
      steps.push({
        id: 'network-segmentation',
        title: 'Configure Network Segmentation',
        description: 'Set up VLANs and firewall rules to simulate enterprise network',
        estimatedTime: '60 minutes',
        cost: '$0 (using existing network equipment)',
        category: 'network',
        status: 'pending',
        prerequisites: ['Network switch with VLAN support'],
        instructions: [
          '1. Create Management VLAN (VLAN 10): 192.168.10.0/24',
          '2. Create User VLAN (VLAN 20): 192.168.20.0/24',
          '3. Create Server VLAN (VLAN 30): 192.168.30.0/24',
          '4. Create DMZ VLAN (VLAN 40): 192.168.40.0/24',
          '5. Configure inter-VLAN routing on firewall',
          '6. Set up firewall rules for controlled access',
          '7. Test connectivity between VLANs',
          '8. Document IP addressing scheme'
        ],
        verificationSteps: [
          'Ping tests work within each VLAN',
          'Inter-VLAN routing working as expected',
          'Firewall rules blocking unauthorized traffic',
          'DHCP working on each VLAN'
        ]
      });
    }

    if (category === 'cloud') {
      steps.push({
        id: 'aws-environment',
        title: 'Deploy AWS Lab Environment',
        description: 'Set up AWS infrastructure for cloud security testing',
        estimatedTime: '90 minutes',
        cost: '$50-100/month',
        category: 'cloud',
        status: 'pending',
        prerequisites: ['AWS account with billing enabled', 'IAM permissions'],
        instructions: [
          '1. Create dedicated AWS account or organization unit',
          '2. Set up VPC with public and private subnets',
          '3. Deploy EC2 instances for testing (t3.micro for cost)',
          '4. Configure security groups with minimal access',
          '5. Set up S3 buckets with various permission levels',
          '6. Deploy Lambda functions for serverless testing',
          '7. Configure CloudTrail for all API logging',
          '8. Set up IAM users with different privilege levels'
        ],
        verificationSteps: [
          'CloudTrail logging all API calls',
          'EC2 instances accessible via session manager',
          'S3 bucket permissions working correctly',
          'IAM policies applied correctly'
        ]
      });
    }

    // Add security tools step
    steps.push({
      id: 'security-tools',
      title: 'Deploy Security Monitoring Tools',
      description: 'Install and configure security tools for log generation',
      estimatedTime: '45 minutes',
      cost: '$0 (using free/trial versions)',
      category: 'security',
      status: 'pending',
      prerequisites: ['Target systems deployed and operational'],
      instructions: [
        '1. Download and install Sysmon on all Windows systems',
        '2. Apply standard Sysmon configuration (SwiftOnSecurity config)',
        '3. Configure Windows Event Log forwarding',
        '4. Install Windows Defender and enable all protections',
        '5. Set up PowerShell script block logging',
        '6. Configure process and network monitoring',
        '7. Install vulnerability scanner (OpenVAS or Nessus)',
        '8. Test that all tools are generating logs'
      ],
      verificationSteps: [
        'Sysmon events appearing in Event Viewer',
        'PowerShell logs capturing script execution',
        'Windows Defender alerts working',
        'Network monitoring capturing traffic'
      ]
    });

    setDeploymentSteps(steps);
  };

  const executeStep = async (stepId: string) => {
    const stepIndex = deploymentSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    // Update step status to in-progress
    const updatedSteps = [...deploymentSteps];
    updatedSteps[stepIndex].status = 'in-progress';
    setDeploymentSteps(updatedSteps);
    setCurrentStep(stepIndex);

    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mark as completed
    updatedSteps[stepIndex].status = 'completed';
    setDeploymentSteps(updatedSteps);

    // Calculate progress
    const completedCount = updatedSteps.filter(s => s.status === 'completed').length;
    const progress = (completedCount / updatedSteps.length) * 100;
    setDeploymentProgress(progress);

    toast({
      title: "Step Completed",
      description: `${updatedSteps[stepIndex].title} deployment step completed`
    });

    // Check if all steps completed
    if (completedCount === updatedSteps.length) {
      handleDeploymentComplete();
    }
  };

  const handleDeploymentComplete = () => {
    const deploymentData = {
      completedSteps: deploymentSteps.length,
      totalCost: calculateTotalCost(),
      deploymentTime: calculateTotalTime(),
      verificationResults: deploymentSteps.map(step => ({
        stepId: step.id,
        verifications: step.verificationSteps,
        status: 'completed'
      }))
    };

    onInfrastructureComplete(deploymentData);
    
    toast({
      title: "Infrastructure Deployment Complete!",
      description: "All infrastructure components have been deployed and verified"
    });
  };

  const calculateTotalCost = () => {
    return deploymentSteps.reduce((total, step) => {
      const cost = step.cost.match(/\$(\d+)/);
      return total + (cost ? parseInt(cost[1]) : 0);
    }, 0);
  };

  const calculateTotalTime = () => {
    return deploymentSteps.reduce((total, step) => {
      const time = step.estimatedTime.match(/(\d+)/);
      return total + (time ? parseInt(time[1]) : 0);
    }, 0);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'systems':
        return <Server className="h-4 w-4" />;
      case 'network':
        return <Network className="h-4 w-4" />;
      case 'cloud':
        return <Cloud className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Infrastructure Deployment Guide
          </CardTitle>
          <CardDescription>
            Step-by-step instructions to build the required infrastructure for "{useCase.title}"
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Deployment Progress</span>
                <span>{Math.round(deploymentProgress)}% Complete</span>
              </div>
              <Progress value={deploymentProgress} className="w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{deploymentSteps.length}</div>
                <div className="text-sm text-muted-foreground">Total Steps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {deploymentSteps.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">${calculateTotalCost()}</div>
                <div className="text-sm text-muted-foreground">Est. Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{calculateTotalTime()}m</div>
                <div className="text-sm text-muted-foreground">Est. Time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="steps">Deployment Steps</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="space-y-4">
          {deploymentSteps.map((step, index) => (
            <Card key={step.id} className={`${
              currentStep === index ? 'ring-2 ring-blue-500' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStepIcon(step.status)}
                    <div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getCategoryIcon(step.category)}
                      {step.category}
                    </Badge>
                    <Badge variant="secondary">{step.estimatedTime}</Badge>
                    <Badge variant="outline">{step.cost}</Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {step.prerequisites.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Prerequisites:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {step.prerequisites.map((prereq, idx) => (
                          <li key={idx}>• {prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h5 className="font-medium mb-2">Step-by-Step Instructions:</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <ol className="text-sm space-y-2">
                        {step.instructions.map((instruction, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-blue-600 font-medium min-w-6">{idx + 1}.</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => executeStep(step.id)}
                      disabled={step.status === 'completed' || step.status === 'in-progress'}
                      className="flex items-center gap-2"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {step.status === 'completed' ? 'Completed' : 
                       step.status === 'in-progress' ? 'In Progress...' : 'Start Step'}
                    </Button>
                    
                    {step.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        View Verification
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Verification</CardTitle>
              <CardDescription>
                Verify that each component is working correctly before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deploymentSteps.map(step => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {getStepIcon(step.status)}
                      <h4 className="font-medium">{step.title}</h4>
                    </div>
                    <div className="space-y-2">
                      {step.verificationSteps.map((verification, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={step.status === 'completed' ? 'text-green-700' : 'text-muted-foreground'}>
                            {verification}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
              <CardDescription>
                8th grade level troubleshooting for infrastructure deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Domain Controller Issues</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Problem:</strong> Can't join computers to domain</div>
                    <div><strong>Solution:</strong> Check DNS settings - client computers must use DC as primary DNS</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Network Connectivity Issues</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Problem:</strong> Computers can't ping each other</div>
                    <div><strong>Solution:</strong> Check Windows Firewall settings and VLAN configuration</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Security Tool Issues</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Problem:</strong> Sysmon not generating events</div>
                    <div><strong>Solution:</strong> Verify Sysmon service is running and config file is valid</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Performance Issues</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Problem:</strong> VMs running slowly</div>
                    <div><strong>Solution:</strong> Increase RAM allocation and check disk space</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}