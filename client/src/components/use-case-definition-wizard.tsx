import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, FileText, Users, Target, Settings, Database, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UseCaseDefinition {
  id: string;
  securityOutcome: string;
  threatScenario: string;
  successCriteria: string[];
  title: string;
  description: string;
  category: string;
  severity: string;
  sourceType: 'customer_pov' | 'threat_report' | 'threat_feed';
  sourceDetails: any;
  cves: string[];
  technologies: string[];
  attackVectors: string[];
  threatActors: string[];
  infrastructureRequirements: any;
  dataSourceRequirements: any;
  currentStep: number;
}

interface Props {
  onUseCaseCreated: (useCase: UseCaseDefinition) => void;
  initialData?: any; // From threat report or customer input
  sourceType: 'customer_pov' | 'threat_report' | 'threat_feed';
}

export default function UseCaseDefinitionWizard({ onUseCaseCreated, initialData, sourceType }: Props) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [useCase, setUseCase] = useState<Partial<UseCaseDefinition>>({
    sourceType,
    currentStep: 1,
    category: initialData?.category || 'endpoint',
    severity: initialData?.severity || 'high',
    cves: initialData?.cves || [],
    technologies: initialData?.technologies || [],
    attackVectors: initialData?.attackVectors || [],
    threatActors: initialData?.threatActors || [],
    successCriteria: []
  });

  const steps = [
    {
      id: 1,
      title: "Security Outcome Definition",
      description: "Define what security outcome we want to achieve",
      icon: <Target className="h-5 w-5" />
    },
    {
      id: 2,
      title: "Threat Scenario Details",
      description: "Complete threat scenario and attack details", 
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 3,
      title: "Infrastructure Requirements",
      description: "Define what infrastructure needs to be built",
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 4,
      title: "Data Source Requirements", 
      description: "Specify required data sources and configuration",
      icon: <Database className="h-5 w-5" />
    },
    {
      id: 5,
      title: "Success Criteria",
      description: "Define how we measure success",
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Create the use case
      const finalUseCase: UseCaseDefinition = {
        id: Date.now().toString(),
        ...useCase as UseCaseDefinition,
        title: useCase.title || useCase.securityOutcome || 'Untitled Use Case',
        description: useCase.description || useCase.threatScenario || ''
      };
      
      onUseCaseCreated(finalUseCase);
      toast({
        title: "Use Case Created",
        description: "Standard use case definition template created successfully"
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="securityOutcome">Security Outcome (Primary Goal)</Label>
              <Textarea
                id="securityOutcome"
                placeholder="Example: Detect and prevent lateral movement after initial compromise"
                value={useCase.securityOutcome || ''}
                onChange={(e) => setUseCase({...useCase, securityOutcome: e.target.value})}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                What specific security outcome do we want to achieve? Be clear and measurable.
              </p>
            </div>
            
            <div>
              <Label htmlFor="title">Use Case Title</Label>
              <Input
                id="title"
                placeholder="Short descriptive title"
                value={useCase.title || ''}
                onChange={(e) => setUseCase({...useCase, title: e.target.value})}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={useCase.category}
                  onChange={(e) => setUseCase({...useCase, category: e.target.value})}
                  className="w-full mt-2 p-2 border rounded"
                >
                  <option value="endpoint">Endpoint Security</option>
                  <option value="network">Network Security</option>
                  <option value="cloud">Cloud Security</option>
                  <option value="identity">Identity & Access</option>
                  <option value="email">Email Security</option>
                  <option value="web">Web Security</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="severity">Severity Level</Label>
                <select
                  id="severity"
                  value={useCase.severity}
                  onChange={(e) => setUseCase({...useCase, severity: e.target.value})}
                  className="w-full mt-2 p-2 border rounded"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="threatScenario">Complete Threat Scenario</Label>
              <Textarea
                id="threatScenario"
                placeholder="Detailed description of the threat scenario, attack progression, and tactics"
                value={useCase.threatScenario || ''}
                onChange={(e) => setUseCase({...useCase, threatScenario: e.target.value})}
                className="mt-2 min-h-32"
              />
            </div>

            <div>
              <Label>CVEs (if applicable)</Label>
              <Input
                placeholder="CVE-2024-1234, CVE-2024-5678 (comma separated)"
                value={(useCase.cves || []).join(', ')}
                onChange={(e) => setUseCase({...useCase, cves: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Affected Technologies</Label>
              <Input
                placeholder="Windows, Active Directory, Exchange (comma separated)"
                value={(useCase.technologies || []).join(', ')}
                onChange={(e) => setUseCase({...useCase, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Attack Vectors (MITRE ATT&CK)</Label>
              <Input
                placeholder="T1078, T1021, T1055 (technique IDs or names)"
                value={(useCase.attackVectors || []).join(', ')}
                onChange={(e) => setUseCase({...useCase, attackVectors: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Infrastructure Requirements (8th Grade Instructions)
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                List exactly what infrastructure needs to be built or configured, step by step.
              </p>
            </div>

            <InfrastructureRequirementsForm 
              value={useCase.infrastructureRequirements || {}}
              onChange={(reqs) => setUseCase({...useCase, infrastructureRequirements: reqs})}
              category={useCase.category || 'endpoint'}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Source Requirements
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Specify what data sources need to be configured to generate the required logs.
              </p>
            </div>

            <DataSourceRequirementsForm
              value={useCase.dataSourceRequirements || {}}
              onChange={(reqs) => setUseCase({...useCase, dataSourceRequirements: reqs})}
              category={useCase.category || 'endpoint'}
              threatScenario={useCase.threatScenario || ''}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label>Success Criteria</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Define specific, measurable criteria that indicate the use case is working correctly.
              </p>
              
              <SuccessCriteriaForm
                value={useCase.successCriteria || []}
                onChange={(criteria) => setUseCase({...useCase, successCriteria: criteria})}
                securityOutcome={useCase.securityOutcome || ''}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create Standard Use Case Definition
        </CardTitle>
        <CardDescription>
          Build a comprehensive use case definition for your security outcome
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.icon}
              </div>
              <div className="ml-3 hidden md:block">
                <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-px mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <Button onClick={handleNext}>
            {currentStep === steps.length ? 'Create Use Case' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for infrastructure requirements
function InfrastructureRequirementsForm({ value, onChange, category }: { value: any; onChange: (reqs: any) => void; category: string }) {
  const [requirements, setRequirements] = useState(value || {
    systems: [],
    networks: [],
    security_tools: [],
    cloud_services: [],
    estimated_cost: '',
    deployment_time: '',
    prerequisites: []
  });

  useEffect(() => {
    onChange(requirements);
  }, [requirements, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Systems to Deploy/Configure</Label>
        <Textarea
          placeholder="Example: Windows Server 2019 Domain Controller, Windows 10 workstations (3), Ubuntu Linux server"
          value={requirements.systems?.join('\n') || ''}
          onChange={(e) => setRequirements({...requirements, systems: e.target.value.split('\n').filter(Boolean)})}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Network Configuration</Label>
        <Textarea
          placeholder="Example: VLAN segmentation, firewall rules, DNS configuration"
          value={requirements.networks?.join('\n') || ''}
          onChange={(e) => setRequirements({...requirements, networks: e.target.value.split('\n').filter(Boolean)})}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Security Tools Required</Label>
        <Textarea
          placeholder="Example: Endpoint protection, network monitoring, vulnerability scanner"
          value={requirements.security_tools?.join('\n') || ''}
          onChange={(e) => setRequirements({...requirements, security_tools: e.target.value.split('\n').filter(Boolean)})}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Estimated Cost</Label>
          <Input
            placeholder="$500-1000"
            value={requirements.estimated_cost || ''}
            onChange={(e) => setRequirements({...requirements, estimated_cost: e.target.value})}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label>Deployment Time</Label>
          <Input
            placeholder="2-4 hours"
            value={requirements.deployment_time || ''}
            onChange={(e) => setRequirements({...requirements, deployment_time: e.target.value})}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Component for data source requirements
function DataSourceRequirementsForm({ value, onChange, category, threatScenario }: { value: any; onChange: (reqs: any) => void; category: string; threatScenario: string }) {
  const [requirements, setRequirements] = useState(value || {
    data_sources: [],
    log_types: [],
    configuration_steps: [],
    xsiam_integration: [],
    validation_queries: []
  });

  useEffect(() => {
    onChange(requirements);
  }, [requirements, onChange]);

  // Suggest data sources based on category
  const getSuggestedDataSources = () => {
    switch (category) {
      case 'endpoint':
        return ['Windows Event Logs', 'Sysmon', 'Defender for Endpoint', 'PowerShell logs'];
      case 'network':
        return ['Firewall logs', 'NetFlow/sFlow', 'DNS logs', 'Proxy logs'];
      case 'cloud':
        return ['AWS CloudTrail', 'Azure Activity Logs', 'Office 365 logs', 'Container logs'];
      case 'identity':
        return ['Active Directory logs', 'Okta logs', 'LDAP logs', 'Authentication logs'];
      default:
        return ['System logs', 'Application logs', 'Security logs'];
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Required Data Sources</Label>
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {getSuggestedDataSources().map(source => (
            <Badge
              key={source}
              variant="outline"
              className="cursor-pointer hover:bg-blue-50"
              onClick={() => {
                const current = requirements.data_sources || [];
                if (!current.includes(source)) {
                  setRequirements({...requirements, data_sources: [...current, source]});
                }
              }}
            >
              + {source}
            </Badge>
          ))}
        </div>
        <Textarea
          placeholder="List required data sources for this threat scenario"
          value={requirements.data_sources?.join('\n') || ''}
          onChange={(e) => setRequirements({...requirements, data_sources: e.target.value.split('\n').filter(Boolean)})}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Configuration Steps (8th Grade Level)</Label>
        <Textarea
          placeholder="Step 1: Enable Windows Event Log auditing&#10;Step 2: Configure Sysmon with standard config&#10;Step 3: Set up log forwarding to XSIAM"
          value={requirements.configuration_steps?.join('\n') || ''}
          onChange={(e) => setRequirements({...requirements, configuration_steps: e.target.value.split('\n').filter(Boolean)})}
          className="mt-2 min-h-24"
        />
      </div>

      <div>
        <Label>XSIAM Integration Requirements</Label>
        <Textarea
          placeholder="Example: Configure broker to collect Windows events, set up parsing rules, verify field mappings"
          value={requirements.xsiam_integration?.join('\n') || ''}
          onChange={(e) => setRequirements({...requirements, xsiam_integration: e.target.value.split('\n').filter(Boolean)})}
          className="mt-2"
        />
      </div>
    </div>
  );
}

// Component for success criteria
function SuccessCriteriaForm({ value, onChange, securityOutcome }: { value: string[]; onChange: (criteria: string[]) => void; securityOutcome: string }) {
  const [criteria, setCriteria] = useState(value || []);

  const addCriterion = () => {
    setCriteria([...criteria, '']);
  };

  const updateCriterion = (index: number, newValue: string) => {
    const updated = [...criteria];
    updated[index] = newValue;
    setCriteria(updated);
    onChange(updated);
  };

  const removeCriterion = (index: number) => {
    const updated = criteria.filter((_: any, i: number) => i !== index);
    setCriteria(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {criteria.map((criterion: string, index: number) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder={`Success criterion ${index + 1}`}
            value={criterion}
            onChange={(e) => updateCriterion(index, e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeCriterion(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      
      <Button variant="outline" onClick={addCriterion}>
        Add Success Criterion
      </Button>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-medium mb-2">Examples of Good Success Criteria:</h5>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Alert triggers within 5 minutes of attack simulation</li>
          <li>• Correlation rule generates less than 5 false positives per day</li>
          <li>• Playbook automation completes incident response in under 30 minutes</li>
          <li>• Dashboard shows accurate threat metrics and timeline</li>
        </ul>
      </div>
    </div>
  );
}