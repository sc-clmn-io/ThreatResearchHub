import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  Server, 
  Cloud, 
  Network, 
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  ExternalLink,
  Calculator
} from "lucide-react";
import ProcurementCalculator from "./procurement-calculator";

interface ProcurementOption {
  id: string;
  name: string;
  type: 'cloud' | 'onprem' | 'hybrid';
  provider: string;
  description: string;
  components: {
    compute: string[];
    network: string[];
    security: string[];
    storage: string[];
  };
  costs: {
    setup: number;
    monthly: number;
    perHour: number;
  };
  timeline: string;
  benefits: string[];
  requirements: string[];
  scalability: 'low' | 'medium' | 'high';
}

interface InfrastructureProcurementProps {
  threatContext: {
    threat: string;
    technologies: string;
    severity: string;
    cves: string;
  };
}

export default function InfrastructureProcurement({ threatContext }: InfrastructureProcurementProps) {
  const [selectedOption, setSelectedOption] = useState<ProcurementOption | null>(null);
  const [activeTab, setActiveTab] = useState('options');

  const procurementOptions: ProcurementOption[] = [
    {
      id: 'aws-cloud',
      name: 'AWS Cloud Infrastructure',
      type: 'cloud',
      provider: 'Amazon Web Services',
      description: 'Complete cloud-based lab environment with managed services and auto-scaling',
      components: {
        compute: ['EC2 t3.medium (Windows)', 'EC2 t3.small (Linux)', 'Lambda Functions'],
        network: ['VPC with subnets', 'Security Groups', 'Application Load Balancer'],
        security: ['CloudTrail', 'GuardDuty', 'WAF', 'Secrets Manager'],
        storage: ['EBS 100GB', 'S3 buckets', 'CloudWatch Logs']
      },
      costs: {
        setup: 0,
        monthly: 285,
        perHour: 0.40
      },
      timeline: '2-4 hours setup',
      benefits: [
        'No upfront hardware costs',
        'Pay-as-you-go pricing',
        'Global availability',
        'Managed security services',
        'Easy scaling and automation'
      ],
      requirements: [
        'AWS account with billing setup',
        'Basic networking knowledge',
        'IAM permissions configuration'
      ],
      scalability: 'high'
    },
    {
      id: 'azure-cloud',
      name: 'Microsoft Azure Infrastructure',
      type: 'cloud',
      provider: 'Microsoft Azure',
      description: 'Enterprise-grade Azure environment with native Microsoft integrations',
      components: {
        compute: ['Standard_B2s VMs', 'Azure Functions', 'Container Instances'],
        network: ['Virtual Network', 'Network Security Groups', 'Azure Firewall'],
        security: ['Azure Security Center', 'Key Vault', 'Azure Sentinel'],
        storage: ['Managed Disks', 'Blob Storage', 'Log Analytics']
      },
      costs: {
        setup: 0,
        monthly: 295,
        perHour: 0.42
      },
      timeline: '2-4 hours setup',
      benefits: [
        'Native Microsoft ecosystem',
        'Advanced threat detection',
        'Hybrid cloud capabilities',
        'Enterprise compliance features',
        'Integration with Office 365'
      ],
      requirements: [
        'Azure subscription',
        'Active Directory setup',
        'Resource group permissions'
      ],
      scalability: 'high'
    },
    {
      id: 'vmware-onprem',
      name: 'VMware vSphere Lab',
      type: 'onprem',
      provider: 'VMware',
      description: 'On-premises virtualized environment using existing server hardware',
      components: {
        compute: ['ESXi Host', '4x VMs (Windows/Linux)', 'vCenter Server'],
        network: ['vSphere Standard Switch', 'Distributed Firewall', 'NSX-T (optional)'],
        security: ['vShield Endpoint', 'VM Encryption', 'Secure Boot'],
        storage: ['VMFS Datastore', 'vSAN (optional)', 'VM Snapshots']
      },
      costs: {
        setup: 1200,
        monthly: 0,
        perHour: 0
      },
      timeline: '1-2 days setup',
      benefits: [
        'No ongoing cloud costs',
        'Complete control over environment',
        'High performance on local hardware',
        'Data sovereignty',
        'One-time licensing cost'
      ],
      requirements: [
        'Dedicated server hardware (32GB+ RAM)',
        'VMware vSphere licenses',
        'Network infrastructure',
        'Storage capacity (1TB+)'
      ],
      scalability: 'medium'
    },
    {
      id: 'hybrid-setup',
      name: 'Hybrid Cloud-OnPrem',
      type: 'hybrid',
      provider: 'Multi-vendor',
      description: 'Combined approach with critical workloads on-premises and elastic resources in cloud',
      components: {
        compute: ['Local VMs', 'Cloud burst capacity', 'Edge computing'],
        network: ['Site-to-site VPN', 'Hybrid networking', 'Load balancing'],
        security: ['Unified security management', 'Cross-environment monitoring'],
        storage: ['Local storage', 'Cloud backup', 'Data tiering']
      },
      costs: {
        setup: 600,
        monthly: 125,
        perHour: 0.18
      },
      timeline: '3-5 days setup',
      benefits: [
        'Best of both worlds',
        'Cost optimization',
        'Data locality control',
        'Disaster recovery built-in',
        'Flexible scaling'
      ],
      requirements: [
        'Basic server hardware',
        'Cloud account setup',
        'VPN configuration knowledge',
        'Hybrid management tools'
      ],
      scalability: 'high'
    }
  ];

  const generateProcurementPlan = (option: ProcurementOption) => {
    const plan = {
      immediate: [
        'Evaluate current infrastructure capabilities',
        'Review budget allocation and approval process',
        'Identify technical team and responsibilities',
        'Create procurement timeline and milestones'
      ],
      week1: [
        option.type === 'cloud' ? 'Set up cloud account and billing' : 'Procure hardware specifications',
        'Configure networking and security requirements',
        'Install and configure base infrastructure',
        'Implement monitoring and logging systems'
      ],
      week2: [
        'Deploy Cortex XDR agents and data collection',
        'Configure XSIAM tenant and data source integration',
        'Set up threat simulation and testing tools',
        'Validate data ingestion and parsing'
      ],
      week3: [
        'Create threat-specific detection rules',
        'Deploy automated response playbooks',
        'Configure dashboards and reporting',
        'Conduct initial threat simulation tests'
      ],
      ongoing: [
        'Regular security updates and patches',
        'Performance monitoring and optimization',
        'Cost analysis and optimization',
        'Threat simulation schedule execution'
      ]
    };
    return plan;
  };

  const getRecommendedOption = () => {
    const techStack = threatContext.technologies.toLowerCase();
    
    if (techStack.includes('aws') || techStack.includes('cloud')) {
      return procurementOptions.find(opt => opt.id === 'aws-cloud');
    } else if (techStack.includes('azure') || techStack.includes('microsoft')) {
      return procurementOptions.find(opt => opt.id === 'azure-cloud');
    } else if (threatContext.severity === 'critical') {
      return procurementOptions.find(opt => opt.id === 'hybrid-setup');
    } else {
      return procurementOptions.find(opt => opt.id === 'vmware-onprem');
    }
  };

  const recommendedOption = getRecommendedOption();

  const generateQuoteDocument = (option: ProcurementOption) => {
    const quote = `
# Infrastructure Procurement Quote
## Threat Testing Lab for: ${threatContext.threat}

### Recommended Solution: ${option.name}
**Provider:** ${option.provider}
**Deployment Type:** ${option.type.toUpperCase()}

### Cost Breakdown
- **Setup Cost:** $${option.costs.setup.toLocaleString()}
- **Monthly Operating:** $${option.costs.monthly.toLocaleString()}
- **Hourly Rate:** $${option.costs.perHour.toFixed(2)}
- **Annual Estimate:** $${(option.costs.monthly * 12 + option.costs.setup).toLocaleString()}

### Infrastructure Components

#### Compute Resources
${option.components.compute.map(comp => `- ${comp}`).join('\n')}

#### Network Infrastructure  
${option.components.network.map(comp => `- ${comp}`).join('\n')}

#### Security Components
${option.components.security.map(comp => `- ${comp}`).join('\n')}

#### Storage Systems
${option.components.storage.map(comp => `- ${comp}`).join('\n')}

### Timeline
**Estimated Setup:** ${option.timeline}

### Business Justification
${option.benefits.map(benefit => `- ${benefit}`).join('\n')}

### Technical Requirements
${option.requirements.map(req => `- ${req}`).join('\n')}

### Threat Context
- **Target Threat:** ${threatContext.threat}
- **Severity Level:** ${threatContext.severity.toUpperCase()}
- **CVEs:** ${threatContext.cves || 'TBD'}
- **Technologies:** ${threatContext.technologies}

### XSIAM Integration
- Cortex XDR agent deployment across all endpoints
- Data source integration with scoleman.xdr.us.paloaltonetworks.com
- Custom correlation rules for ${threatContext.threat}
- Automated response playbook development
- Comprehensive findings report generation

### Procurement Next Steps
1. Review and approve budget allocation
2. Initiate vendor account setup
3. Configure technical prerequisites  
4. Schedule deployment timeline
5. Begin infrastructure provisioning

**Generated on:** ${new Date().toLocaleDateString()}
**Valid until:** ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
`;

    const blob = new Blob([quote], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infrastructure-quote-${option.id}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Infrastructure Procurement Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Target Threat</label>
              <p className="font-semibold">{threatContext.threat}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Severity</label>
              <Badge className={threatContext.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                {threatContext.severity.toUpperCase()}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Technologies</label>
              <p className="text-sm">{threatContext.technologies}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">CVEs</label>
              <p className="text-sm font-mono">{threatContext.cves || 'TBD'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Option Alert */}
      {recommendedOption && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recommended:</strong> Based on your threat characteristics, we recommend the{' '}
            <strong>{recommendedOption.name}</strong> for optimal testing capabilities and cost efficiency.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="options">Procurement Options</TabsTrigger>
          <TabsTrigger value="planning">Implementation Plan</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="options" className="space-y-4">
          <div className="grid gap-4">
            {procurementOptions.map((option) => (
              <Card key={option.id} className={`cursor-pointer transition-all ${
                selectedOption?.id === option.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              } ${recommendedOption?.id === option.id ? 'border-green-500 bg-green-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {option.type === 'cloud' && <Cloud className="h-5 w-5 text-blue-500" />}
                          {option.type === 'onprem' && <Server className="h-5 w-5 text-green-500" />}
                          {option.type === 'hybrid' && <Network className="h-5 w-5 text-purple-500" />}
                          <h3 className="font-semibold">{option.name}</h3>
                        </div>
                        {recommendedOption?.id === option.id && (
                          <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                        )}
                        <Badge className={`${
                          option.scalability === 'high' ? 'bg-blue-100 text-blue-800' :
                          option.scalability === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {option.scalability} scalability
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{option.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Setup Cost</span>
                          <p className="font-semibold">${option.costs.setup.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Monthly</span>
                          <p className="font-semibold">${option.costs.monthly.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Timeline</span>
                          <p className="font-semibold">{option.timeline}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Provider</span>
                          <p className="font-semibold">{option.provider}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => setSelectedOption(option)}
                        variant={selectedOption?.id === option.id ? "default" : "outline"}
                        size="sm"
                      >
                        {selectedOption?.id === option.id ? 'Selected' : 'Select'}
                      </Button>
                      <Button
                        onClick={() => generateQuoteDocument(option)}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          {selectedOption ? (
            <Card>
              <CardHeader>
                <CardTitle>Implementation Plan: {selectedOption.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(generateProcurementPlan(selectedOption)).map(([phase, tasks]) => (
                    <div key={phase}>
                      <h4 className="font-semibold mb-3 capitalize flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {phase.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="space-y-2">
                        {tasks.map((task, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select a procurement option to view the implementation plan.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <div className="mb-6">
            <ProcurementCalculator />
          </div>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Procurement Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {procurementOptions.map((option) => (
                      <Button
                        key={option.id}
                        onClick={() => generateQuoteDocument(option)}
                        variant="outline"
                        className="p-4 h-auto flex-col gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span className="font-medium">{option.name} Quote</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          ${option.costs.setup.toLocaleString()} setup + ${option.costs.monthly}/month
                        </span>
                      </Button>
                    ))}
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Next Steps:</strong> Download procurement quotes, review with your team, 
                      and begin vendor account setup. The XSIAM tenant at scoleman.xdr.us.paloaltonetworks.com 
                      is ready for data source integration once infrastructure is deployed.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}