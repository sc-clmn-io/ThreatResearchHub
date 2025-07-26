import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Circle, Clock, AlertTriangle, Database, Settings, Network, Shield, PlayCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DataSourceStep {
  id: string;
  title: string;
  description: string;
  dataSourceType: string;
  estimatedTime: string;
  instructions: string[];
  xsiamIntegration: string[];
  verificationQueries: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  fieldsToValidate: string[];
}

interface Props {
  useCase: any;
  onDataSourceComplete: (configurationData: any) => void;
}

export default function DataSourceConfigurationGuide({ useCase, onDataSourceComplete }: Props) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [configurationSteps, setConfigurationSteps] = useState<DataSourceStep[]>([]);
  const [configurationProgress, setConfigurationProgress] = useState(0);

  useEffect(() => {
    generateConfigurationSteps();
  }, [useCase]);

  const generateConfigurationSteps = () => {
    const requirements = useCase.dataSourceRequirements || {};
    const category = useCase.category || 'endpoint';
    
    const steps: DataSourceStep[] = [];

    // Generate steps based on category and requirements
    if (category === 'endpoint') {
      steps.push(
        {
          id: 'windows-event-logs',
          title: 'Configure Windows Event Logs',
          description: 'Enable detailed Windows event logging for security monitoring',
          dataSourceType: 'Windows Event Logs',
          estimatedTime: '15 minutes',
          status: 'pending',
          instructions: [
            '1. Open Local Group Policy Editor (gpedit.msc) as Administrator',
            '2. Navigate to Computer Configuration → Administrative Templates → Windows Components → Event Log Service',
            '3. Enable "Specify the maximum log file size" and set to 100MB for Security log',
            '4. Navigate to Computer Configuration → Windows Settings → Security Settings → Advanced Audit Policy Configuration',
            '5. Enable all "Account Logon" events for Success and Failure',
            '6. Enable all "Account Management" events for Success and Failure',
            '7. Enable "Process Creation" in Detailed Tracking for Success',
            '8. Enable "Logon/Logoff" events for Success and Failure',
            '9. Run "gpupdate /force" to apply changes immediately',
            '10. Verify events are being generated in Event Viewer'
          ],
          xsiamIntegration: [
            '1. In XSIAM, go to Settings → Data Sources → Add Data Source',
            '2. Select "Windows Event Logs" from the marketplace',
            '3. Configure broker to collect from target systems',
            '4. Set collection schedule to real-time (every 30 seconds)',
            '5. Map log paths: Security, System, Application, Setup',
            '6. Enable parsing for standard Windows event formats',
            '7. Test connectivity and verify log ingestion',
            '8. Set retention policy to 90 days minimum'
          ],
          verificationQueries: [
            'dataset = windows_raw | where event_id == 4624 | limit 10 // Successful logon events',
            'dataset = windows_raw | where event_id == 4625 | limit 10 // Failed logon attempts',
            'dataset = windows_raw | where event_id == 4688 | limit 10 // Process creation events'
          ],
          fieldsToValidate: ['event_id', 'computer_name', 'user_name', 'logon_type', 'process_name', 'timestamp']
        },
        {
          id: 'sysmon-configuration',
          title: 'Install and Configure Sysmon',
          description: 'Deploy Sysmon for enhanced endpoint monitoring and process tracking',
          dataSourceType: 'Sysmon',
          estimatedTime: '20 minutes',
          status: 'pending',
          instructions: [
            '1. Download Sysmon from Microsoft Sysinternals website',
            '2. Download SwiftOnSecurity Sysmon configuration file',
            '3. Open Command Prompt as Administrator',
            '4. Install Sysmon: sysmon64.exe -accepteula -i sysmonconfig-export.xml',
            '5. Verify Sysmon service is running: sc query sysmon',
            '6. Check Sysmon logs in Event Viewer: Applications and Services Logs → Microsoft → Windows → Sysmon',
            '7. Test process creation events by running simple commands',
            '8. Verify network connection events are being logged',
            '9. Check file creation events in target directories',
            '10. Ensure all event IDs 1-22 are being generated'
          ],
          xsiamIntegration: [
            '1. In XSIAM Data Sources, add "Sysmon" integration',
            '2. Configure broker to collect from Microsoft-Windows-Sysmon/Operational log',
            '3. Set parsing rules for Sysmon XML format',
            '4. Map critical fields: ProcessId, Image, CommandLine, User, ParentImage',
            '5. Enable real-time collection (every 10 seconds)',
            '6. Configure field extraction for network connections (Event ID 3)',
            '7. Set up process creation parsing (Event ID 1)',
            '8. Test field mappings with sample queries'
          ],
          verificationQueries: [
            'dataset = sysmon_raw | where event_id == 1 | limit 10 // Process creation',
            'dataset = sysmon_raw | where event_id == 3 | limit 10 // Network connections',
            'dataset = sysmon_raw | where event_id == 11 | limit 10 // File creation'
          ],
          fieldsToValidate: ['event_id', 'process_id', 'image', 'command_line', 'user', 'parent_image', 'destination_ip', 'destination_port']
        }
      );
    }

    if (category === 'network' || category === 'endpoint') {
      steps.push({
        id: 'firewall-logs',
        title: 'Configure Firewall Logging',
        description: 'Enable comprehensive firewall logging for network traffic analysis',
        dataSourceType: 'Firewall Logs',
        estimatedTime: '25 minutes',
        status: 'pending',
        instructions: [
          '1. Access firewall management interface (web console or CLI)',
          '2. Navigate to Logging/Monitoring settings',
          '3. Enable logging for: Allowed connections, Blocked connections, Dropped packets',
          '4. Set log level to "Informational" or "Debug" for detailed information',
          '5. Configure syslog destination: IP of XSIAM broker/collector',
          '6. Set syslog port to 514 (standard) or custom port',
          '7. Choose log format: CEF (Common Event Format) if available',
          '8. Enable real-time log transmission',
          '9. Test connectivity: ping syslog server from firewall',
          '10. Generate test traffic and verify logs are being sent'
        ],
        xsiamIntegration: [
          '1. In XSIAM, configure Syslog data source',
          '2. Set listening port to match firewall configuration',
          '3. Configure parsing rules for firewall vendor format',
          '4. Map network fields: source_ip, destination_ip, source_port, destination_port',
          '5. Set up protocol identification parsing',
          '6. Configure action field mapping (allow/deny/drop)',
          '7. Enable timestamp normalization',
          '8. Set retention period for network logs'
        ],
        verificationQueries: [
          'dataset = firewall_raw | where action == "allow" | limit 10 // Allowed connections',
          'dataset = firewall_raw | where action == "deny" | limit 10 // Blocked connections',
          'dataset = firewall_raw | where protocol == "TCP" | limit 10 // TCP traffic'
        ],
        fieldsToValidate: ['source_ip', 'destination_ip', 'source_port', 'destination_port', 'protocol', 'action', 'bytes_sent', 'bytes_received']
      });
    }

    if (category === 'cloud') {
      steps.push({
        id: 'aws-cloudtrail',
        title: 'Configure AWS CloudTrail',
        description: 'Set up AWS CloudTrail for comprehensive cloud API logging',
        dataSourceType: 'AWS CloudTrail',
        estimatedTime: '30 minutes',
        status: 'pending',
        instructions: [
          '1. Log into AWS Console with administrative privileges',
          '2. Navigate to CloudTrail service',
          '3. Create new trail: "SecurityMonitoring-Trail"',
          '4. Enable logging for all management events and data events',
          '5. Create dedicated S3 bucket for CloudTrail logs',
          '6. Enable log file encryption using KMS',
          '7. Configure SNS notifications for real-time delivery',
          '8. Enable multi-region logging for complete coverage',
          '9. Set up log file validation for integrity',
          '10. Test by performing API actions and checking log delivery'
        ],
        xsiamIntegration: [
          '1. Configure AWS CloudTrail integration in XSIAM',
          '2. Provide AWS credentials (Access Key/Secret Key or IAM role)',
          '3. Configure S3 bucket access for log retrieval',
          '4. Set polling interval (recommended: 5 minutes)',
          '5. Configure CloudTrail log parsing for JSON format',
          '6. Map AWS-specific fields: awsRegion, eventName, eventSource, userIdentity',
          '7. Set up user activity correlation rules',
          '8. Configure anomaly detection for unusual API calls'
        ],
        verificationQueries: [
          'dataset = aws_cloudtrail_raw | where event_name == "AssumeRole" | limit 10 // Role assumptions',
          'dataset = aws_cloudtrail_raw | where event_name contains "Create" | limit 10 // Resource creation',
          'dataset = aws_cloudtrail_raw | where user_type == "Root" | limit 10 // Root user activity'
        ],
        fieldsToValidate: ['event_name', 'event_source', 'aws_region', 'user_identity_type', 'source_ip_address', 'user_agent', 'request_parameters']
      });
    }

    setConfigurationSteps(steps);
  };

  const executeStep = async (stepId: string) => {
    const stepIndex = configurationSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const updatedSteps = [...configurationSteps];
    updatedSteps[stepIndex].status = 'in-progress';
    setConfigurationSteps(updatedSteps);
    setCurrentStep(stepIndex);

    // Simulate configuration time
    await new Promise(resolve => setTimeout(resolve, 3000));

    updatedSteps[stepIndex].status = 'completed';
    setConfigurationSteps(updatedSteps);

    const completedCount = updatedSteps.filter(s => s.status === 'completed').length;
    const progress = (completedCount / updatedSteps.length) * 100;
    setConfigurationProgress(progress);

    toast({
      title: "Configuration Completed",
      description: `${updatedSteps[stepIndex].title} data source configured successfully`
    });

    if (completedCount === updatedSteps.length) {
      handleConfigurationComplete();
    }
  };

  const handleConfigurationComplete = () => {
    const configurationData = {
      completedDataSources: configurationSteps.length,
      configuredTypes: configurationSteps.map(step => step.dataSourceType),
      verificationQueries: configurationSteps.flatMap(step => step.verificationQueries),
      fieldValidations: configurationSteps.flatMap(step => step.fieldsToValidate),
      integrationStatus: 'ready_for_xsiam_content'
    };

    onDataSourceComplete(configurationData);
    
    toast({
      title: "Data Source Configuration Complete!",
      description: "All required data sources are configured and ready for XSIAM content generation"
    });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Source Configuration Guide
          </CardTitle>
          <CardDescription>
            Clear step-by-step instructions to configure data sources for "{useCase.title}"
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Configuration Progress</span>
                <span>{Math.round(configurationProgress)}% Complete</span>
              </div>
              <Progress value={configurationProgress} className="w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{configurationSteps.length}</div>
                <div className="text-sm text-muted-foreground">Data Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {configurationSteps.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Configured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {configurationSteps.reduce((total, step) => {
                    const time = step.estimatedTime.match(/(\d+)/);
                    return total + (time ? parseInt(time[1]) : 0);
                  }, 0)}m
                </div>
                <div className="text-sm text-muted-foreground">Est. Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {configurationSteps.flatMap(s => s.fieldsToValidate).length}
                </div>
                <div className="text-sm text-muted-foreground">Fields</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration Steps</TabsTrigger>
          <TabsTrigger value="xsiam-integration">XSIAM Integration</TabsTrigger>
          <TabsTrigger value="verification">Field Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          {configurationSteps.map((step, index) => (
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
                    <Badge variant="outline">{step.dataSourceType}</Badge>
                    <Badge variant="secondary">{step.estimatedTime}</Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Configuration Instructions:</h5>
                    <div className="bg-blue-50 p-4 rounded-lg">
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
                      {step.status === 'completed' ? 'Configured' : 
                       step.status === 'in-progress' ? 'Configuring...' : 'Start Configuration'}
                    </Button>
                    
                    {step.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        Test Connection
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="xsiam-integration" className="space-y-4">
          {configurationSteps.map(step => (
            <Card key={`${step.id}-xsiam`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStepIcon(step.status)}
                    <CardTitle className="text-lg">XSIAM Integration: {step.dataSourceType}</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Open XSIAM
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">XSIAM Setup Steps:</h5>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <ol className="text-sm space-y-2">
                        {step.xsiamIntegration.map((integration, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-green-600 font-medium min-w-6">{idx + 1}.</span>
                            <span>{integration}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Verification Queries</CardTitle>
              <CardDescription>
                Use these XQL queries in XSIAM to verify data sources are working correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {configurationSteps.map(step => (
                  <div key={`${step.id}-verify`} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {getStepIcon(step.status)}
                      <h4 className="font-medium">{step.dataSourceType}</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Required Fields:</h5>
                        <div className="flex flex-wrap gap-1">
                          {step.fieldsToValidate.map(field => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Verification Queries:</h5>
                        <div className="space-y-2">
                          {step.verificationQueries.map((query, idx) => (
                            <div key={idx} className="bg-gray-100 p-2 rounded text-sm font-mono">
                              {query}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}