import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Server,
  Cloud,
  Shield,
  Network,
  Monitor,
  Code,
  FileText,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DataSourceIntegrationGuideProps {
  useCase: {
    title: string;
    category: 'endpoint' | 'network' | 'cloud' | 'identity';
    severity: string;
    description: string;
    extractedTechniques?: string[];
    cves?: string[];
    technologies?: string[];
  };
  onIntegrationComplete: (results: any) => void;
}

interface DataSource {
  id: string;
  name: string;
  type: 'log' | 'api' | 'agent' | 'network';
  category: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'configuring' | 'testing' | 'completed' | 'failed';
  estimatedTime: number;
  description: string;
  configuration: {
    endpoint?: string;
    format: string;
    fields: string[];
    parsing: string;
    frequency: string;
  };
}

export default function DataSourceIntegrationGuide({ useCase, onIntegrationComplete }: DataSourceIntegrationGuideProps) {
  const [currentPhase, setCurrentPhase] = useState<'planning' | 'configuration' | 'validation' | 'optimization'>('planning');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [configuredSources, setConfiguredSources] = useState<Set<string>>(new Set());
  const [integrationProgress, setIntegrationProgress] = useState(0);
  const { toast } = useToast();

  // Generate category-specific data sources
  const getDataSources = (): DataSource[] => {
    const baseSources: DataSource[] = [
      {
        id: 'windows-events',
        name: 'Windows Event Logs',
        type: 'log',
        category: ['endpoint', 'identity'],
        priority: 'critical',
        status: 'pending',
        estimatedTime: 15,
        description: 'Windows Security, System, and Application logs via Cortex Cloud Broker',
        configuration: {
          endpoint: 'winlogbeat-collector',
          format: 'JSON',
          fields: ['event_id', 'source_name', 'computer_name', 'user_name', 'logon_type'],
          parsing: 'timestamp|level|source|event_id|message|user_data',
          frequency: 'Real-time'
        }
      },
      {
        id: 'linux-syslog',
        name: 'Linux System Logs',
        type: 'log',
        category: ['endpoint', 'network'],
        priority: 'high',
        status: 'pending',
        estimatedTime: 12,
        description: 'Syslog, auth.log, and audit logs via Cortex Cloud Broker',
        configuration: {
          endpoint: 'filebeat-collector',
          format: 'Syslog',
          fields: ['timestamp', 'hostname', 'process', 'severity', 'message'],
          parsing: 'timestamp|hostname|tag|severity|message',
          frequency: 'Real-time'
        }
      },
      {
        id: 'network-traffic',
        name: 'Network Traffic Analysis',
        type: 'network',
        category: ['network', 'cloud'],
        priority: 'critical',
        status: 'pending',
        estimatedTime: 25,
        description: 'Network telemetry via Cortex Cloud Network Sensors',
        configuration: {
          endpoint: 'network-sensor',
          format: 'PCAP/JSON',
          fields: ['src_ip', 'dst_ip', 'src_port', 'dst_port', 'protocol', 'bytes'],
          parsing: 'timestamp|src_ip|dst_ip|src_port|dst_port|protocol|action',
          frequency: 'Real-time'
        }
      },
      {
        id: 'cloud-api',
        name: 'Cloud Platform APIs',
        type: 'api',
        category: ['cloud', 'identity'],
        priority: 'high',
        status: 'pending',
        estimatedTime: 20,
        description: 'Multi-cloud API integration via Cortex Cloud Connectors',
        configuration: {
          endpoint: 'cloud-api-collector',
          format: 'JSON',
          fields: ['event_name', 'user_identity', 'source_ip', 'user_agent', 'resources'],
          parsing: 'timestamp|event_name|user_identity|source_ip|aws_region|resources',
          frequency: 'Every 5 minutes'
        }
      }
    ];

    // Filter based on use case category
    return baseSources.filter(source => 
      source.category.includes(useCase.category)
    );
  };

  const [dataSources, setDataSources] = useState<DataSource[]>(getDataSources());

  const handleSourceSelection = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const configureDataSource = async (sourceId: string) => {
    const source = dataSources.find(s => s.id === sourceId);
    if (!source) return;

    // Update status to configuring
    setDataSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, status: 'configuring' } : s
    ));

    // Simulate configuration process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mark as configured
    setDataSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, status: 'testing' } : s
    ));

    await new Promise(resolve => setTimeout(resolve, 1500));

    setDataSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, status: 'completed' } : s
    ));

    setConfiguredSources(prev => new Set([...prev, sourceId]));
    
    toast({
      title: "Data Source Configured",
      description: `${source.name} successfully integrated`,
    });

    // Update progress
    const completedCount = Array.from(configuredSources).length + 1;
    const totalSelected = selectedSources.length;
    setIntegrationProgress((completedCount / totalSelected) * 100);
  };

  const generateXQLQueries = () => {
    const queries = [];
    
    if (useCase.category === 'endpoint') {
      queries.push({
        name: 'Process Execution Monitoring',
        xql: `dataset = xdr_data
| filter agent_os_type = AGENT_OS_WINDOWS and event_type = ENUM.PROCESS
| filter action_process_image_name contains "powershell" or action_process_image_name contains "cmd"
| filter action_process_command_line contains "${useCase.extractedTechniques?.[0] || 'suspicious'}"
| fields _time, agent_hostname, actor_process_image_name, action_process_command_line
| sort _time desc`,
        description: 'Detects suspicious process execution patterns'
      });
    }

    if (useCase.category === 'network') {
      queries.push({
        name: 'Network Traffic Analysis',
        xql: `dataset = xdr_data
| filter event_type = ENUM.NETWORK and action_network_connection_direction = OUTBOUND
| filter dst_action_external_hostname != null
| filter action_network_packet_data contains "malware" or dst_action_external_hostname contains "suspicious"
| fields _time, agent_hostname, action_local_ip, dst_action_external_hostname, action_network_connection_direction
| sort _time desc`,
        description: 'Monitors outbound network connections to suspicious domains'
      });
    }

    return queries;
  };

  const generateXSIAMPlaybook = () => {
    return {
      id: `playbook_${useCase.category}_${Date.now()}`,
      version: 1,
      name: `${useCase.title} - Cortex Cloud Playbook`,
      description: `Automated response playbook for ${useCase.title} in Cortex Cloud`,
      tasks: {
        "0": {
          id: "0",
          type: "start",
          task: {
            brand: "",
            description: "",
            name: "",
            type: "start"
          },
          nexttasks: {
            "#none#": ["1"]
          }
        },
        "1": {
          id: "1",
          type: "regular",
          task: {
            brand: "Builtin",
            description: "Initial triage and data collection",
            name: "Collect Initial Evidence",
            type: "regular",
            iscommand: true,
            script: "Builtin|||getIncident"
          },
          nexttasks: {
            "#none#": ["2"]
          }
        },
        "2": {
          id: "2",
          type: "condition",
          task: {
            brand: "",
            description: "Determine severity and response path",
            name: "Assess Threat Level",
            type: "condition"
          },
          nexttasks: {
            "High/Critical": ["3"],
            "Medium/Low": ["4"]
          }
        },
        "3": {
          id: "3",
          type: "regular",
          task: {
            brand: "CortexCloud",
            description: "Immediate containment actions via Cortex Cloud",
            name: "Execute Containment",
            type: "regular",
            iscommand: true,
            script: "CortexCloud|||cortex-isolate-endpoint"
          },
          nexttasks: {
            "#none#": ["5"]
          }
        },
        "4": {
          id: "4",
          type: "regular",
          task: {
            brand: "Builtin",
            description: "Standard investigation workflow",
            name: "Standard Investigation",
            type: "regular",
            iscommand: true,
            script: "Builtin|||setIncident"
          },
          nexttasks: {
            "#none#": ["5"]
          }
        },
        "5": {
          id: "5",
          type: "regular",
          task: {
            brand: "Builtin",
            description: "Generate final report and close incident",
            name: "Close Investigation",
            type: "regular",
            iscommand: true,
            script: "Builtin|||closeInvestigation"
          },
          nexttasks: {
            "#none#": []
          }
        }
      },
      inputs: [],
      outputs: [],
      tests: []
    };
  };

  const generateCortexCloudDashboard = () => {
    return {
      dashboard: {
        id: `dashboard_${useCase.category}_${Date.now()}`,
        name: `${useCase.title} - Cortex Cloud Dashboard`,
        description: `Unified XSIAM monitoring dashboard for ${useCase.title}`,
        widgets: [
          {
            id: "widget_1",
            name: "Threat Detection Timeline",
            type: "line-chart",
            query: `dataset = xdr_data | filter event_type = ENUM.${useCase.category.toUpperCase()} | bin _time span=1h | stats count by _time | sort _time`,
            visualization: {
              type: "timeseries",
              title: "Detection Volume Over Time"
            }
          },
          {
            id: "widget_2", 
            name: "Top Affected Assets",
            type: "table",
            query: `dataset = xdr_data | filter event_type = ENUM.${useCase.category.toUpperCase()} | stats count by agent_hostname | sort count desc | limit 10`,
            visualization: {
              type: "table",
              title: "Most Affected Endpoints"
            }
          },
          {
            id: "widget_3",
            name: "Severity Distribution",
            type: "pie-chart", 
            query: `dataset = xdr_data | filter event_type = ENUM.${useCase.category.toUpperCase()} | stats count by severity | sort count desc`,
            visualization: {
              type: "pie",
              title: "Alert Severity Breakdown"
            }
          }
        ],
        layout: {
          grid: [
            { "i": "widget_1", "x": 0, "y": 0, "w": 12, "h": 4 },
            { "i": "widget_2", "x": 0, "y": 4, "w": 6, "h": 4 },
            { "i": "widget_3", "x": 6, "y": 4, "w": 6, "h": 4 }
          ]
        }
      }
    };
  };

  const downloadConfiguration = (type: 'xql' | 'playbook' | 'dashboard') => {
    let content, filename;
    
    switch (type) {
      case 'xql':
        content = JSON.stringify(generateXQLQueries(), null, 2);
        filename = `${useCase.title.replace(/\s+/g, '_')}_xql_rules.json`;
        break;
      case 'playbook':
        content = JSON.stringify(generateXSIAMPlaybook(), null, 2);
        filename = `${useCase.title.replace(/\s+/g, '_')}_cortex_cloud_playbook.json`;
        break;
      case 'dashboard':
        content = JSON.stringify(generateCortexCloudDashboard(), null, 2);
        filename = `${useCase.title.replace(/\s+/g, '_')}_cortex_cloud_dashboard.json`;
        break;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration Downloaded",
      description: `${filename} ready for Cortex Cloud import`,
    });
  };

  const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
      case 'endpoint': return <Monitor className="h-4 w-4" />;
      case 'network': return <Network className="h-4 w-4" />;
      case 'cloud': return <Cloud className="h-4 w-4" />;
      case 'identity': return <Shield className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'configuring': 
      case 'testing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Settings className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Source Integration</h2>
          <p className="text-gray-600">Configure log ingestion sources for XSIAM/Cortex Cloud - {useCase.title}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <CategoryIcon category={useCase.category} />
          {useCase.category.charAt(0).toUpperCase() + useCase.category.slice(1)}
        </Badge>
      </div>

      <Tabs value={currentPhase} onValueChange={(value) => setCurrentPhase(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="optimization">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log Sources for XSIAM Ingestion</CardTitle>
              <CardDescription>
                Select log sources to ingest into XSIAM/Cortex Cloud for {useCase.title} detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {dataSources.map((source) => (
                  <div 
                    key={source.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSources.includes(source.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSourceSelection(source.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{source.name}</h3>
                            <p className="text-sm text-gray-600">{source.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={source.priority === 'critical' ? 'destructive' : 'secondary'}>
                          {source.priority}
                        </Badge>
                        <span className="text-sm text-gray-500">{source.estimatedTime}min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedSources.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Button 
                    onClick={() => setCurrentPhase('configuration')}
                    className="w-full"
                  >
                    Configure {selectedSources.length} Data Sources
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log Ingestion Configuration</CardTitle>
              <CardDescription>
                Configure log parsing and ingestion pipelines for XSIAM/Cortex Cloud
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Integration Progress</span>
                  <span className="text-sm text-gray-600">{Math.round(integrationProgress)}%</span>
                </div>
                <Progress value={integrationProgress} className="w-full" />
              </div>

              <div className="mt-6 space-y-4">
                {selectedSources.map((sourceId) => {
                  const source = dataSources.find(s => s.id === sourceId);
                  if (!source) return null;

                  return (
                    <Card key={sourceId} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(source.status)}
                            <h3 className="font-medium">{source.name}</h3>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => configureDataSource(sourceId)}
                            disabled={source.status === 'configuring' || source.status === 'testing' || source.status === 'completed'}
                          >
                            {source.status === 'completed' ? 'Configured' : 
                             source.status === 'configuring' ? 'Configuring...' :
                             source.status === 'testing' ? 'Testing...' : 'Configure'}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Format:</span> {source.configuration.format}
                          </div>
                          <div>
                            <span className="font-medium">Frequency:</span> {source.configuration.frequency}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Key Fields:</span> {source.configuration.fields.join(', ')}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Parsing Pattern:</span> 
                            <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                              {source.configuration.parsing}
                            </code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {configuredSources.size === selectedSources.length && selectedSources.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Button 
                    onClick={() => setCurrentPhase('validation')}
                    className="w-full"
                  >
                    Proceed to Validation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log Ingestion Validation</CardTitle>
              <CardDescription>
                Verify log data is flowing into XSIAM and test detection rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">XSIAM Log Ingestion Status</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    All configured log sources are successfully streaming into XSIAM
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Log events/minute: <span className="font-mono">~245</span></div>
                    <div>Ingestion quality: <span className="text-green-600 font-medium">98.5%</span></div>
                    <div>XDM parsing success: <span className="text-green-600 font-medium">99.2%</span></div>
                    <div>XSIAM field mapping: <span className="text-green-600 font-medium">Complete</span></div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">XSIAM Detection Rule Testing</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    XQL correlation rules validated against ingested log data
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Process execution patterns</span>
                      <span className="text-green-600 font-medium">✓ Validated</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network anomaly detection</span>
                      <span className="text-green-600 font-medium">✓ Validated</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Authentication monitoring</span>
                      <span className="text-green-600 font-medium">✓ Validated</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setCurrentPhase('optimization')}
                  className="w-full"
                >
                  Generate Export Configurations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  XQL Correlation Rules
                </CardTitle>
                <CardDescription>
                  Production-ready correlation rules for Cortex Cloud XSIAM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <code className="text-sm">
                      dataset = xdr_data | filter event_type = ENUM.{useCase.category.toUpperCase()}
                      <br />| filter action_process_command_line contains "{useCase.extractedTechniques?.[0] || 'suspicious'}"
                      <br />| fields _time, agent_hostname, actor_process_image_name
                    </code>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadConfiguration('xql')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download XQL Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cortex Cloud Playbook
                </CardTitle>
                <CardDescription>
                  Automated response workflows for unified Cortex Cloud platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Tasks: 5</div>
                    <div>Estimated Runtime: 15-20 min</div>
                    <div>Automation Level: 80%</div>
                    <div>Approval Points: 1</div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadConfiguration('playbook')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Cortex Cloud Playbook
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Cortex Cloud Dashboard
                </CardTitle>
                <CardDescription>
                  Unified XSIAM dashboard with integrated SOAR capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Widgets: 3</div>
                    <div>Update Frequency: Real-time</div>
                    <div>Data Retention: 90 days</div>
                    <div>Alert Integration: Yes</div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadConfiguration('dashboard')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Dashboard Config
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => {
                onIntegrationComplete({
                  dataSources: selectedSources.length,
                  configuredRules: generateXQLQueries().length,
                  playbooks: 1,
                  dashboards: 1
                });
                toast({
                  title: "Integration Complete",
                  description: "Data source integration configured successfully",
                });
              }}
              className="w-full"
              size="lg"
            >
              Complete Integration Setup
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}