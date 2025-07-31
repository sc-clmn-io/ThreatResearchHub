import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal, Server, Download, CheckCircle, Copy, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SSHProxmoxManager() {
  const [sshConfig, setSSHConfig] = useState({
    host: '192.168.100.188',
    username: 'root',
    port: 22,
    authMethod: 'password'
  });

  const [vmConfig, setVMConfig] = useState({
    vmid: '200',
    name: 'xsiam-broker',
    cores: '2',
    memory: '4096',
    storage: 'local-lvm',
    network: 'vmbr0',
    qcow2Path: '/var/lib/vz/template/iso/cortex-xdr-broker.qcow2'
  });

  const [testResult, setTestResult] = useState<any>(null);
  const [deploymentScript, setDeploymentScript] = useState<string>('');
  const [isTestingSSH, setIsTestingSSH] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  
  const { toast } = useToast();

  const testSSHConnection = async () => {
    setIsTestingSSH(true);
    try {
      const response = await fetch('/api/connections/proxmox/ssh-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sshConfig)
      });

      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "SSH Connection Test Successful",
          description: `Connected to ${sshConfig.host}:${sshConfig.port}`,
        });
      } else {
        toast({
          title: "SSH Connection Failed",
          description: result.error || "Failed to test SSH connection",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to test SSH connection",
        variant: "destructive"
      });
      setTestResult({
        success: false,
        error: "Network request failed"
      });
    } finally {
      setIsTestingSSH(false);
    }
  };

  const generateDeploymentScript = async () => {
    setIsGeneratingScript(true);
    try {
      const response = await fetch('/api/connections/proxmox/ssh-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: sshConfig.host,
          username: sshConfig.username,
          vmConfig: vmConfig,
          sshConfig: sshConfig
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDeploymentScript(result.deploymentScript);
        toast({
          title: "Deployment Script Generated",
          description: "SSH deployment script ready for download",
        });
      } else {
        toast({
          title: "Script Generation Failed",
          description: result.error || "Failed to generate deployment script",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate deployment script",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const downloadScript = () => {
    if (!deploymentScript) return;
    
    const blob = new Blob([deploymentScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ssh-deploy-xsiam-broker.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Script Downloaded",
      description: "SSH deployment script saved successfully"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Command copied successfully"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            SSH Proxmox Management
          </CardTitle>
          <CardDescription>
            Manage Proxmox VE via SSH for XSIAM broker deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Network className="h-4 w-4" />
            <AlertDescription>
              <strong>SSH Alternative:</strong> Since direct HTTPS connection fails from Replit, 
              we'll use SSH to manage your Proxmox server at {sshConfig.host}.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="ssh-config" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ssh-config">SSH Config</TabsTrigger>
              <TabsTrigger value="vm-config">VM Settings</TabsTrigger>
              <TabsTrigger value="test">Test & Deploy</TabsTrigger>
              <TabsTrigger value="commands">Commands</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ssh-config" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proxmox Host</Label>
                  <Input
                    value={sshConfig.host}
                    onChange={(e) => setSSHConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="192.168.100.188"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SSH Port</Label>
                  <Input
                    type="number"
                    value={sshConfig.port}
                    onChange={(e) => setSSHConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                    placeholder="22"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={sshConfig.username}
                    onChange={(e) => setSSHConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="root"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Authentication Method</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={sshConfig.authMethod}
                    onChange={(e) => setSSHConfig(prev => ({ ...prev, authMethod: e.target.value }))}
                  >
                    <option value="password">Password</option>
                    <option value="key">SSH Key</option>
                  </select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vm-config" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>VM ID</Label>
                  <Input
                    value={vmConfig.vmid}
                    onChange={(e) => setVMConfig(prev => ({ ...prev, vmid: e.target.value }))}
                    placeholder="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>VM Name</Label>
                  <Input
                    value={vmConfig.name}
                    onChange={(e) => setVMConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="xsiam-broker"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPU Cores</Label>
                  <Input
                    value={vmConfig.cores}
                    onChange={(e) => setVMConfig(prev => ({ ...prev, cores: e.target.value }))}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Memory (MB)</Label>
                  <Input
                    value={vmConfig.memory}
                    onChange={(e) => setVMConfig(prev => ({ ...prev, memory: e.target.value }))}
                    placeholder="4096"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage</Label>
                  <Input
                    value={vmConfig.storage}
                    onChange={(e) => setVMConfig(prev => ({ ...prev, storage: e.target.value }))}
                    placeholder="local-lvm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Network Bridge</Label>
                  <Input
                    value={vmConfig.network}
                    onChange={(e) => setVMConfig(prev => ({ ...prev, network: e.target.value }))}
                    placeholder="vmbr0"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>qcow2 Image Path</Label>
                  <Input
                    value={vmConfig.qcow2Path}
                    onChange={(e) => setVMConfig(prev => ({ ...prev, qcow2Path: e.target.value }))}
                    placeholder="/var/lib/vz/template/iso/cortex-xdr-broker.qcow2"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <Button 
                  onClick={testSSHConnection}
                  disabled={isTestingSSH || !sshConfig.host || !sshConfig.username}
                  className="w-full"
                >
                  {isTestingSSH ? 'Testing SSH Connection...' : 'Test SSH Connection'}
                </Button>

                {testResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        {testResult.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Terminal className="h-4 w-4 text-red-500" />}
                        SSH Test Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2">{testResult.message}</p>
                      {testResult.success && testResult.sshCommands && (
                        <div className="space-y-2">
                          <h5 className="font-medium">Test Commands:</h5>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted p-1 rounded flex-1">{testResult.sshCommands.basicTest}</code>
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(testResult.sshCommands.basicTest)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {testResult?.success && (
                  <Button 
                    onClick={generateDeploymentScript}
                    disabled={isGeneratingScript}
                    className="w-full"
                    variant="outline"
                  >
                    {isGeneratingScript ? 'Generating Script...' : 'Generate Deployment Script'}
                  </Button>
                )}

                {deploymentScript && (
                  <div className="space-y-2">
                    <Button onClick={downloadScript} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download SSH Deployment Script
                    </Button>
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Script generated! Download and run on a machine with SSH access to your Proxmox server.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="commands" className="space-y-4">
              {testResult?.success && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Manual SSH Commands</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Basic Connection Test</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-muted p-2 rounded flex-1">
                            ssh {sshConfig.username}@{sshConfig.host} 'pvesh --version'
                          </code>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(`ssh ${sshConfig.username}@${sshConfig.host} 'pvesh --version'`)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">List VMs</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-muted p-2 rounded flex-1">
                            ssh {sshConfig.username}@{sshConfig.host} 'qm list'
                          </code>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(`ssh ${sshConfig.username}@${sshConfig.host} 'qm list'`)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Check VM Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-muted p-2 rounded flex-1">
                            ssh {sshConfig.username}@{sshConfig.host} 'qm status {vmConfig.vmid}'
                          </code>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(`ssh ${sshConfig.username}@${sshConfig.host} 'qm status ${vmConfig.vmid}'`)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Get VM IP Address</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-muted p-2 rounded flex-1">
                            ssh {sshConfig.username}@{sshConfig.host} 'qm guest cmd {vmConfig.vmid} network-get-interfaces'
                          </code>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(`ssh ${sshConfig.username}@${sshConfig.host} 'qm guest cmd ${vmConfig.vmid} network-get-interfaces'`)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}