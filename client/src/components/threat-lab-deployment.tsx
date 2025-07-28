import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Cloud, Download, CheckCircle, AlertTriangle, Network, Shield, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InfrastructureTroubleshooting } from './infrastructure-troubleshooting';
import { SSHProxmoxManager } from './ssh-proxmox-manager';
import { XSIAMBrokerDeployment } from './xsiam-broker-deployment';

interface DeploymentStatus {
  proxmox: 'not-tested' | 'testing' | 'failed' | 'success';
  azure: 'not-tested' | 'testing' | 'failed' | 'success';
  xsiam: 'not-configured' | 'configured' | 'testing' | 'connected';
}

export function ThreatLabDeployment() {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    proxmox: 'not-tested',
    azure: 'not-tested',
    xsiam: 'not-configured'
  });
  
  const [xsiamConfig, setXSIAMConfig] = useState({
    apiKey: '',
    tenantUrl: '',
    configured: false
  });

  const { toast } = useToast();

  const testXSIAMConnection = async () => {
    if (!xsiamConfig.apiKey || !xsiamConfig.tenantUrl) {
      toast({
        title: "Configuration Required",
        description: "Please enter XSIAM API key and tenant URL",
        variant: "destructive"
      });
      return;
    }

    setDeploymentStatus(prev => ({ ...prev, xsiam: 'testing' }));
    
    try {
      // Test XSIAM connectivity
      const response = await fetch('/api/xsiam/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: xsiamConfig.apiKey,
          tenantUrl: xsiamConfig.tenantUrl
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDeploymentStatus(prev => ({ ...prev, xsiam: 'connected' }));
        setXSIAMConfig(prev => ({ ...prev, configured: true }));
        toast({
          title: "XSIAM Connection Successful",
          description: "Ready for content deployment and log forwarding configuration"
        });
      } else {
        setDeploymentStatus(prev => ({ ...prev, xsiam: 'not-configured' }));
        toast({
          title: "XSIAM Connection Failed",
          description: result.error || "Check API key and tenant URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      setDeploymentStatus(prev => ({ ...prev, xsiam: 'not-configured' }));
      toast({
        title: "Connection Error",
        description: "Failed to test XSIAM connection",
        variant: "destructive"
      });
    }
  };

  const downloadComprehensiveGuide = () => {
    const guide = `# Threat Detection Lab Deployment Guide
# ThreatResearchHub - Complete Setup Instructions

## Overview
This guide provides multiple deployment paths for your threat detection lab,
including workarounds for common infrastructure issues.

## XSIAM Configuration
API Key: ${xsiamConfig.apiKey ? '[CONFIGURED]' : '[NOT SET]'}
Tenant URL: ${xsiamConfig.tenantUrl || '[NOT SET]'}

## Deployment Options

### Option 1: Docker-based Lab (Recommended for testing)
- Fastest setup (5-10 minutes)
- No VM overhead
- Works on any Docker-enabled system
- Good for content development and testing

Steps:
1. Download docker-threat-lab.sh script
2. Set XSIAM environment variables
3. Run: ./docker-threat-lab.sh
4. Configure log forwarding to XSIAM

### Option 2: Local VMs (VirtualBox/VMware)
- Full VM isolation
- Similar to production environment
- Works without Proxmox
- Good for comprehensive testing

Steps:
1. Download local-vm-lab.sh script
2. Install VirtualBox or VMware
3. Download XSIAM broker ISO
4. Run deployment script

### Option 3: Public Cloud (AWS/Azure)
- Scalable infrastructure
- Public IP accessibility
- Professional deployment
- Good for production-like testing

Steps:
1. Configure cloud CLI tools
2. Download cloud-alternative-lab.sh
3. Run deployment with cloud credentials
4. Configure security groups and networking

### Option 4: SSH Proxmox Management
- Works around HTTPS connection issues
- Uses existing Proxmox server
- Maintains VM-based approach
- Good for on-premises requirements

Steps:
1. Test SSH connectivity to Proxmox
2. Generate SSH deployment script
3. Execute via SSH commands
4. Monitor VM deployment progress

## Content Development Workflow

1. **Threat Intelligence Processing**
   - Load threat reports into platform
   - Extract IOCs and TTPs
   - Map to MITRE ATT&CK framework

2. **Infrastructure Planning**
   - Select deployment option based on requirements
   - Configure network and security settings
   - Plan data source integration

3. **XSIAM Content Generation**
   - Create XQL correlation rules
   - Build response playbooks
   - Design alert layouts
   - Configure dashboards

4. **Testing and Validation**
   - Deploy content to XSIAM
   - Test with sample data
   - Validate detection coverage
   - Tune for false positives

5. **Production Deployment**
   - Export validated content
   - Deploy to production XSIAM
   - Configure monitoring
   - Document procedures

## Troubleshooting Common Issues

### Proxmox VM Deployment
- qcow2 import failures
- Network configuration issues
- Resource allocation problems
- Boot sequence errors

### Azure Connectivity
- Authentication failures
- Resource quota limitations
- Network security group issues
- Region availability problems

### XSIAM Integration
- API key validation
- Network connectivity
- Data source configuration
- Log forwarding setup

## Next Steps

1. Choose deployment option based on your environment
2. Configure XSIAM credentials in platform
3. Download appropriate deployment scripts
4. Follow step-by-step instructions
5. Test end-to-end workflow
6. Document any issues for improvement

## Support Resources

- Platform documentation
- Alternative deployment scripts
- Troubleshooting guides
- Best practices documentation

Generated: ${new Date().toISOString()}
Platform: ThreatResearchHub v1.0
`;

    const blob = new Blob([guide], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'threat-lab-deployment-guide.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Deployment Guide Downloaded",
      description: "Complete setup instructions saved successfully"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
      case 'configured':
        return <Badge className="bg-green-500">Ready</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'not-tested':
      case 'not-configured':
        return <Badge variant="outline">Not Set</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Threat Detection Lab Status
          </CardTitle>
          <CardDescription>
            Current deployment status and next steps for your threat detection infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                <span className="font-medium">Proxmox</span>
              </div>
              {getStatusBadge(deploymentStatus.proxmox)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span className="font-medium">Azure</span>
              </div>
              {getStatusBadge(deploymentStatus.azure)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">XSIAM</span>
              </div>
              {getStatusBadge(deploymentStatus.xsiam)}
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Status:</strong> Infrastructure connectivity issues detected. 
              Multiple alternative deployment paths available below.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* XSIAM Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            XSIAM Configuration
          </CardTitle>
          <CardDescription>
            Configure your XSIAM credentials for content deployment and log forwarding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>XSIAM API Key</Label>
              <Input
                type="password"
                placeholder="Enter your XSIAM API key"
                value={xsiamConfig.apiKey}
                onChange={(e) => setXSIAMConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>XSIAM Tenant URL</Label>
              <Input
                placeholder="https://your-tenant.xdr.us.paloaltonetworks.com"
                value={xsiamConfig.tenantUrl}
                onChange={(e) => setXSIAMConfig(prev => ({ ...prev, tenantUrl: e.target.value }))}
              />
            </div>
          </div>
          
          <Button 
            onClick={testXSIAMConnection}
            disabled={!xsiamConfig.apiKey || !xsiamConfig.tenantUrl}
            className="w-full"
          >
            {deploymentStatus.xsiam === 'testing' ? 'Testing XSIAM Connection...' : 'Test XSIAM Connection'}
          </Button>

          {deploymentStatus.xsiam === 'connected' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                XSIAM connection successful! Ready for content deployment and log forwarding configuration.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Deployment Options */}
      <Tabs defaultValue="alternatives" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alternatives">Alternative Deployments</TabsTrigger>
          <TabsTrigger value="ssh-proxmox">SSH Proxmox</TabsTrigger>
          <TabsTrigger value="xsiam-broker">XSIAM Broker</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alternatives" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="h-4 w-4" />
                  Docker-based Lab
                </CardTitle>
                <CardDescription>Fastest setup for testing and development</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 mb-3">
                  <li>• 5-10 minute deployment</li>
                  <li>• No VM overhead</li>
                  <li>• Perfect for content development</li>
                  <li>• Works on any Docker system</li>
                </ul>
                <Badge className="bg-green-500 mb-3">Recommended</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cloud className="h-4 w-4" />
                  Public Cloud
                </CardTitle>
                <CardDescription>AWS/Azure deployment with public access</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 mb-3">
                  <li>• Scalable infrastructure</li>
                  <li>• Public IP accessibility</li>
                  <li>• Production-like environment</li>
                  <li>• Professional deployment</li>
                </ul>
                <Badge variant="secondary">Production Ready</Badge>
              </CardContent>
            </Card>
          </div>
          
          <Button onClick={downloadComprehensiveGuide} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Complete Deployment Guide
          </Button>
        </TabsContent>
        
        <TabsContent value="ssh-proxmox">
          <SSHProxmoxManager />
        </TabsContent>
        
        <TabsContent value="xsiam-broker">
          <XSIAMBrokerDeployment />
        </TabsContent>
        
        <TabsContent value="troubleshooting">
          <InfrastructureTroubleshooting />
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Configure XSIAM credentials (API key provided)</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Download alternative deployment scripts</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Choose deployment option based on your environment</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Test infrastructure deployment</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Configure log forwarding to XSIAM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}