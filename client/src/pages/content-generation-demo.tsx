import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, Workflow, Layout, BarChart3, Play, Download, 
  Copy, FileText, Shield, Zap, Target, Code, CheckCircle,
  AlertTriangle, Clock, ArrowRight, RefreshCw, Eye, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SchemaDrivenContentGenerator } from "@/utils/schema-driven-content-generator";
import XQLPreviewModal from "@/components/xql-preview-modal";
import PlaybookPreviewModal from "@/components/playbook-preview-modal";
import AlertLayoutPreviewModal from "@/components/alert-layout-preview-modal";
import DashboardPreviewModal from "@/components/dashboard-preview-modal";
import FallbackContentDemo from "@/components/fallback-content-demo";

export default function ContentGenerationDemo() {
  const [activeContentType, setActiveContentType] = useState('correlation');
  const [generationPhase, setGenerationPhase] = useState('requirement');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFallbackDemo, setShowFallbackDemo] = useState(false);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [showXQLPreview, setShowXQLPreview] = useState(false);
  const [showPlaybookPreview, setShowPlaybookPreview] = useState(false);
  const [showLayoutPreview, setShowLayoutPreview] = useState(false);
  const [showDashboardPreview, setShowDashboardPreview] = useState(false);
  const { toast } = useToast();

  // Check for API keys on component mount
  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const response = await fetch('/api/check-ai-capabilities');
        setHasApiKeys(response.ok);
      } catch (error) {
        setHasApiKeys(false);
      }
    };
    checkApiKeys();
  }, []);

  const [selectedDataSource, setSelectedDataSource] = useState('windows_defender');
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const threatExamples = {
    windows_defender: {
      name: "APT29 Cozy Bear Malware Detection",
      category: "endpoint",
      severity: "critical",
      description: "Advanced persistent threat using process injection and email exploitation",
      dataSources: ["Microsoft Defender for Endpoint", "Windows Event Logs", "Microsoft Graph Security"],
      mitreAttack: ["T1566.001", "T1055.012", "T1027.010"],
      indicators: ["Process injection patterns", "Email-based exploitation", "PowerShell obfuscation"]
    },
    aws_cloudtrail: {
      name: "Privilege Escalation via IAM Policy Manipulation", 
      category: "cloud",
      severity: "high",
      description: "Detect unauthorized modifications to IAM policies that could lead to privilege escalation",
      dataSources: ["AWS CloudTrail", "AWS Config", "AWS IAM"],
      mitreAttack: ["T1098.001", "T1484.002"],
      indicators: ["Policy attachment to user/role", "Unusual API calls", "Cross-account access"]
    },
    crowdstrike: {
      name: "Falcon Detection: Living-off-the-Land Attack",
      category: "endpoint", 
      severity: "high",
      description: "Advanced threat actor using legitimate tools for malicious activities",
      dataSources: ["CrowdStrike Falcon", "Process Telemetry", "Network Behavior"],
      mitreAttack: ["T1218", "T1105", "T1027"],
      indicators: ["Legitimate binary abuse", "Network anomalies", "Process hollowing"]
    },
    kubernetes: {
      name: "Container Breakout Attempt",
      category: "cloud",
      severity: "critical", 
      description: "Detect attempts to escape container boundaries and access host system",
      dataSources: ["Kubernetes Audit Logs", "Container Runtime", "Falco Events"],
      mitreAttack: ["T1611", "T1610", "T1055"],
      indicators: ["Privileged container creation", "Host filesystem access", "Kernel exploitation"]
    }
  };

  const currentThreat = threatExamples[selectedDataSource as keyof typeof threatExamples];
  
  // Force regeneration when data source changes
  useEffect(() => {
    setGeneratedContent(null); // Clear previous content
  }, [selectedDataSource]);

  const contentTypes = [
    {
      id: 'correlation',
      name: 'XQL Correlation Rule',
      icon: Database,
      color: 'bg-blue-500',
      description: 'Detection logic for XSIAM correlation engine',
      ddlcPhase: 'development'
    },
    {
      id: 'playbook',
      name: 'Automation Playbook',
      icon: Workflow,
      color: 'bg-purple-500',
      description: 'Automated response workflow for SOC analysts',
      ddlcPhase: 'development'
    },
    {
      id: 'alert_layout',
      name: 'Alert Layout',
      icon: Layout,
      color: 'bg-green-500',
      description: 'Analyst interface with contextual information',
      ddlcPhase: 'design'
    },
    {
      id: 'dashboard',
      name: 'Operational Dashboard',
      icon: BarChart3,
      color: 'bg-orange-500',
      description: 'Threat monitoring and KPI visualization',
      ddlcPhase: 'monitoring'
    }
  ];

  // Generate schema-driven content based on selected data source
  const getGeneratedContent = () => {
    try {
      // Use the schema-driven generator to create authentic content
      console.log(`Generating content for data source: ${selectedDataSource}`);
      const schema = SchemaDrivenContentGenerator.getDatasetSchema(selectedDataSource);
      console.log(`Schema found:`, schema);
      
      const result = {
        correlation: SchemaDrivenContentGenerator.generateCorrelationRule(selectedDataSource, currentThreat),
        playbook: SchemaDrivenContentGenerator.generatePlaybook(selectedDataSource, currentThreat),
        alert_layout: SchemaDrivenContentGenerator.generateAlertLayout(selectedDataSource, currentThreat),
        dashboard: SchemaDrivenContentGenerator.generateDashboard(selectedDataSource, currentThreat)
      };
      
      console.log(`Generated correlation rule XQL:`, JSON.parse(result.correlation.content).xql_query);
      console.log(`Dataset name:`, JSON.parse(result.correlation.content).dataset_name);
      
      return result;
    } catch (error) {
      console.error('Schema-driven content generation failed:', error);
      
      // Fallback to basic content if schema not found
      return {
        correlation: {
          title: `${selectedDataSource}_fallback_correlation.json`,
          content: `{
  "error": "Schema not found for ${selectedDataSource}",
  "message": "Please configure the dataset schema for ${selectedDataSource} to generate accurate content",
  "fallback_available": true
}`,
          validation: {
            syntax: "⚠ Schema missing for accurate validation",
            fields: "⚠ Unable to validate fields without schema",
            performance: "⚠ Query optimization requires schema",
            coverage: "⚠ Coverage analysis needs field mapping"
          }
        },
        playbook: {
          title: `${selectedDataSource}_fallback_playbook.yml`,
          content: `# Schema not configured for ${selectedDataSource}
# Please use Dataset Schema Manager to configure fields
name: "Fallback Playbook"
description: "Configure schema for vendor-specific content"`,
          validation: {
            syntax: "⚠ Schema required for playbook generation",
            workflow: "⚠ Vendor integrations need schema mapping",
            integration: "⚠ Integration commands require field definitions",
            testing: "⚠ Testing needs authentic schema data"
          }
        },
        alert_layout: {
          title: `${selectedDataSource}_fallback_layout.json`,
          content: `{
  "error": "Schema configuration required",
  "instructions": "Use Dataset Schema Manager to configure ${selectedDataSource} fields"
}`,
          validation: {
            layout: "⚠ Layout requires vendor schema",
            fields: "⚠ Field mapping unavailable",
            usability: "⚠ Analyst workflow needs schema context",
            integration: "⚠ XSIAM integration requires field definitions"
          }
        },
        dashboard: {
          title: `${selectedDataSource}_fallback_dashboard.json`,
          content: `{
  "error": "Schema configuration required",
  "instructions": "Configure dataset schema for ${selectedDataSource} to generate dashboard"
}`,
          validation: {
            queries: "⚠ XQL queries need schema validation",
            visualization: "⚠ Widget configuration requires field types",
            performance: "⚠ Performance optimization needs schema",
            alerting: "⚠ Alert thresholds require metric definitions"
          }
        }
      };
    }
  };

  // Get generated content dynamically when needed

  const generateContent = async () => {
    setIsGenerating(true);
    
    // Simulate DDLC progression
    const phases = ['requirement', 'design', 'development', 'testing'];
    
    for (const phase of phases) {
      setGenerationPhase(phase);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setIsGenerating(false);
    toast({
      title: "Content Generated Successfully",
      description: `${contentTypes.find(t => t.id === activeContentType)?.name} ready for deployment`,
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "Content copied successfully",
    });
  };

  const downloadSingleContent = (contentType: string) => {
    const freshContent = getGeneratedContent();
    const content = generatedContent?.[contentType] || freshContent[contentType];
    if (!content) return;

    const extensionMap = {
      correlation: 'json',
      playbook: 'yml', 
      alert_layout: 'json',
      dashboard: 'json'
    };

    const extension = extensionMap[contentType as keyof typeof extensionMap];
    const filename = `${selectedDataSource}-${contentType}.${extension}`;
    
    const blob = new Blob([content.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Content Downloaded",
      description: `${content.title} downloaded successfully`,
    });
  };

  // Always get fresh content from schema-driven generator
  const freshContent = getGeneratedContent();
  const activeContent = generatedContent?.[activeContentType] || freshContent[activeContentType];
  const activeType = contentTypes.find(t => t.id === activeContentType);

  // Show fallback demo if no API keys available
  if (!hasApiKeys) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Content-as-Code Generation Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              See how the platform generates complete XSIAM detection packages following DDLC framework
            </p>
          </div>
          <FallbackContentDemo />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Content-as-Code Generation Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                See how the platform generates complete XSIAM detection packages following DDLC framework
              </p>
            </div>
          </div>
        </div>

        {/* Data Source Selector */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Data Source & Threat Scenario
              </div>
              <Badge variant="secondary" className="text-xs">
                Schema-Driven Generation
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedDataSource === 'windows_defender' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDataSource('windows_defender')}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Windows Defender
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </Button>
                <Button
                  variant={selectedDataSource === 'aws_cloudtrail' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDataSource('aws_cloudtrail')}
                  className="flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  AWS CloudTrail
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </Button>
                <Button
                  variant={selectedDataSource === 'crowdstrike' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDataSource('crowdstrike')}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  CrowdStrike Falcon
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </Button>
                <Button
                  variant={selectedDataSource === 'kubernetes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDataSource('kubernetes')}
                  className="flex items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  Kubernetes
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </Button>
              </div>
              
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Content generation uses authentic dataset schemas with vendor-specific field mappings. 
                  Green checkmarks indicate configured schemas with XQL-accessible fields.
                </AlertDescription>
              </Alert>
              
              {/* Schema Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Current Schema:</h4>
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const schema = SchemaDrivenContentGenerator.getDatasetSchema(selectedDataSource);
                      return schema ? (
                        <div className="space-y-1">
                          <div><strong>Vendor:</strong> {schema.vendor}</div>
                          <div><strong>Dataset:</strong> {schema.dataset_name}</div>
                          <div><strong>Fields:</strong> {schema.fields.filter(f => f.xql_accessible).length} XQL-accessible</div>
                        </div>
                      ) : (
                        <div className="text-red-600">Schema not configured</div>
                      );
                    })()}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Content Generation:</h4>
                  <div className="text-sm text-gray-600">
                    ✓ XQL queries use actual field names<br/>
                    ✓ Playbooks include vendor integrations<br/>
                    ✓ Layouts display real data fields<br/>
                    ✓ Dashboards query actual datasets
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Threat Context */}
        <Card className="bg-blue-50 border-blue-200 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900">
                <Target className="w-5 h-5" />
                Current Threat Scenario
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-blue-900">Threat Name</div>
                <div className="text-sm text-blue-800">{currentThreat.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-900">Category</div>
                <Badge variant="secondary">{currentThreat.category}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-900">MITRE ATT&CK</div>
                <div className="flex gap-1 flex-wrap">
                  {currentThreat.mitreAttack.map((technique: string) => (
                    <Badge key={technique} variant="outline" className="text-xs">{technique}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Content Type Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    const isActive = type.id === activeContentType;
                    
                    return (
                      <button
                        key={type.id}
                        onClick={() => setActiveContentType(type.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <div className={`p-2 rounded ${type.color} text-white`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{type.name}</div>
                          <div className="text-xs opacity-75">{type.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeType && (
                      <div className={`p-2 rounded ${activeType.color} text-white`}>
                        <activeType.icon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{activeType?.name}</h3>
                      <p className="text-sm text-gray-600">{activeContent?.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (activeContentType === 'correlation') setShowXQLPreview(true);
                        else if (activeContentType === 'playbook') setShowPlaybookPreview(true);
                        else if (activeContentType === 'alert_layout') setShowLayoutPreview(true);
                        else if (activeContentType === 'dashboard') setShowDashboardPreview(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(activeContent?.content || '')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSingleContent(activeContentType)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={activeContent?.content || ''}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                />
                
                {/* Validation Results */}
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Validation Results</h4>
                  <div className="space-y-1">
                    {activeContent?.validation && Object.entries(activeContent.validation).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Modals */}
        {showXQLPreview && <XQLPreviewModal 
          isOpen={showXQLPreview} 
          onClose={() => setShowXQLPreview(false)}
          xqlQuery={activeContent?.content ? JSON.parse(activeContent.content).xql_query : ''}
          ruleName={activeContent?.title || 'Generated Rule'}
          description={`Schema-driven ${selectedDataSource} correlation rule`}
        />}
        {showPlaybookPreview && <PlaybookPreviewModal 
          isOpen={showPlaybookPreview}
          onClose={() => setShowPlaybookPreview(false)}
          playbookData={activeContent || {}} 
        />}
        {showLayoutPreview && <AlertLayoutPreviewModal 
          isOpen={showLayoutPreview}
          onClose={() => setShowLayoutPreview(false)}
          layoutData={activeContent || {}} 
        />}
        {showDashboardPreview && <DashboardPreviewModal 
          isOpen={showDashboardPreview}
          onClose={() => setShowDashboardPreview(false)}
          dashboardData={activeContent || {}} 
        />}
      </div>
    </div>
  );
}