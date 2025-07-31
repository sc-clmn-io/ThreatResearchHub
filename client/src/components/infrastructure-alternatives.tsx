import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Cloud, Globe, Server, Network, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InfrastructureAlternatives() {
  const [downloadStarted, setDownloadStarted] = useState<string | null>(null);
  const { toast } = useToast();

  const downloadScript = async (scriptType: string) => {
    setDownloadStarted(scriptType);
    
    try {
      const response = await fetch(`/api/infrastructure/download/${scriptType}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scriptType}-deployment.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `${scriptType} deployment package downloaded successfully`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Error downloading deployment package",
        variant: "destructive"
      });
    } finally {
      setDownloadStarted(null);
    }
  };

  const deploymentOptions = [
    {
      id: 'docker',
      title: 'Docker Complete Lab',
      description: 'Containerized security lab with XSIAM broker, monitoring tools, and threat simulation',
      icon: <Server className="h-5 w-5" />,
      compatibility: 'Windows, macOS, Linux',
      setupTime: '5-10 minutes',
      requirements: ['Docker Desktop', '8GB RAM', '20GB storage'],
      features: [
        'XSIAM broker container with qcow2 conversion',
        'ELK stack for log aggregation',
        'OWASP ZAP for security testing',
        'Grafana monitoring dashboard',
        'Automated log forwarding to XSIAM'
      ]
    },
    {
      id: 'aws',
      title: 'AWS Public Cloud',
      description: 'Rapid cloud deployment with auto-cleanup and XSIAM integration',
      icon: <Cloud className="h-5 w-5" />,
      compatibility: 'Any platform with AWS CLI',
      setupTime: '10-15 minutes',
      requirements: ['AWS Account', 'AWS CLI', 'Terraform'],
      features: [
        'EC2 instances with Ubuntu/Windows',
        'VPC with security groups',
        'CloudWatch integration',
        'Auto-cleanup after 8 hours',
        'Direct XSIAM log forwarding'
      ]
    },
    {
      id: 'local-vm',
      title: 'Local VM Deployment',
      description: 'VirtualBox/VMware deployment with XSIAM broker integration',
      icon: <Network className="h-5 w-5" />,
      compatibility: 'Windows, macOS, Linux',
      setupTime: '15-20 minutes',
      requirements: ['VirtualBox/VMware', '16GB RAM', '50GB storage'],
      features: [
        'Multi-VM lab environment',
        'XSIAM broker VM from qcow2',
        'Network isolation',
        'Snapshot capabilities',
        'Manual XSIAM configuration'
      ]
    },
    {
      id: 'hybrid',
      title: 'Hybrid Deployment',
      description: 'Combination of local and cloud resources for maximum flexibility',
      icon: <Globe className="h-5 w-5" />,
      compatibility: 'Multi-platform',
      setupTime: '20-30 minutes',
      requirements: ['Local VM + Cloud Account'],
      features: [
        'Local XSIAM broker',
        'Cloud attack simulation',
        'Cross-environment monitoring',
        'Advanced threat scenarios',
        'Production-like setup'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Network Limitations & Alternative Solutions
          </CardTitle>
          <CardDescription>
            Replit cloud environment cannot reach private networks. Choose from these deployment alternatives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Network className="h-4 w-4" />
            <AlertDescription>
              <strong>Network Constraint:</strong> Replit cloud cannot connect to 192.168.100.188 or other private IPs. 
              Use these alternatives for immediate lab deployment while maintaining XSIAM integration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="deployment-options" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deployment-options">Deployment Options</TabsTrigger>
          <TabsTrigger value="xsiam-setup">XSIAM Setup</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deployment-options" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deploymentOptions.map((option) => (
              <Card key={option.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {option.icon}
                    {option.title}
                  </CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{option.compatibility}</Badge>
                    <Badge className="bg-blue-500">{option.setupTime}</Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Requirements:</p>
                    <ul className="text-xs text-muted-foreground">
                      {option.requirements.map((req, index) => (
                        <li key={index}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Features:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {option.features.slice(0, 3).map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                      {option.features.length > 3 && (
                        <li className="text-xs">+ {option.features.length - 3} more features</li>
                      )}
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={() => downloadScript(option.id)}
                    disabled={downloadStarted === option.id}
                    className="w-full"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadStarted === option.id ? 'Downloading...' : 'Download Package'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="xsiam-setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">XSIAM Configuration Guide</CardTitle>
              <CardDescription>
                Configure XSIAM to receive logs from your chosen deployment method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mt-0.5">1</div>
                  <div>
                    <p className="text-sm font-medium">Log in to XSIAM Tenant</p>
                    <p className="text-xs text-muted-foreground">Access your XSIAM instance at your tenant URL</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mt-0.5">2</div>
                  <div>
                    <p className="text-sm font-medium">Configure Data Sources</p>
                    <p className="text-xs text-muted-foreground">Settings → Data Sources → Add new data source for your deployment</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mt-0.5">3</div>
                  <div>
                    <p className="text-sm font-medium">Test Log Forwarding</p>
                    <p className="text-xs text-muted-foreground">Verify logs are flowing from your deployment to XSIAM</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mt-0.5">4</div>
                  <div>
                    <p className="text-sm font-medium">Deploy Generated Content</p>
                    <p className="text-xs text-muted-foreground">Upload correlation rules, playbooks, and dashboards from this platform</p>
                  </div>
                </div>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Each deployment package includes specific XSIAM configuration files and connection instructions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-red-600">Cannot reach private IP from Replit</p>
                  <p className="text-xs text-muted-foreground">
                    Expected behavior. Use downloaded deployment packages on your local machine instead.
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-yellow-600">XSIAM API connection fails</p>
                  <p className="text-xs text-muted-foreground">
                    Check API key permissions and tenant URL format. Some endpoints may require admin privileges.
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-blue-600">Docker deployment issues</p>
                  <p className="text-xs text-muted-foreground">
                    Ensure Docker Desktop is running and has sufficient resources (8GB RAM minimum).
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-green-600">Alternative: Manual setup</p>
                  <p className="text-xs text-muted-foreground">
                    Download individual configuration files and follow step-by-step guides for manual deployment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}