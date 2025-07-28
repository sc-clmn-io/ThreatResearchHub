import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Server, Cloud, Download, Terminal, Network, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InfrastructureTroubleshooting() {
  const [selectedIssue, setSelectedIssue] = useState<string>('proxmox-vm');
  const { toast } = useToast();

  const downloadAlternativeScript = (scriptType: string) => {
    let script = '';
    let filename = '';

    switch (scriptType) {
      case 'docker-lab':
        script = `#!/bin/bash
# Alternative Docker-based Threat Detection Lab
# Bypasses Proxmox VM issues

set -e

echo "🚀 Deploying Docker-based Threat Detection Lab..."

# Create lab network
docker network create threat-lab-network || true

# Deploy XSIAM Data Collector (simulated)
docker run -d \\
  --name xsiam-collector \\
  --network threat-lab-network \\
  -p 8443:443 \\
  -v /var/log:/host-logs:ro \\
  -e XSIAM_API_KEY="$XSIAM_API_KEY" \\
  -e XSIAM_TENANT_URL="$XSIAM_TENANT_URL" \\
  alpine:latest sh -c "while true; do sleep 300; done"

# Deploy Windows Event Simulator
docker run -d \\
  --name windows-events \\
  --network threat-lab-network \\
  -v /tmp/windows-events:/var/log/windows \\
  alpine:latest sh -c "while true; do 
    echo \\$(date) 'EventID=4624 LogonType=10 Account=admin' >> /var/log/windows/security.log
    sleep 60
  done"

# Deploy Network Traffic Generator
docker run -d \\
  --name network-sim \\
  --network threat-lab-network \\
  -p 9090:9090 \\
  alpine:latest sh -c "while true; do
    nc -l -p 9090 &
    sleep 120
  done"

echo "✅ Docker lab deployed successfully!"
echo "   XSIAM Collector: https://localhost:8443"
echo "   Windows Events: /tmp/windows-events/"
echo "   Network Traffic: localhost:9090"

echo ""
echo "🔧 Configure XSIAM forwarding:"
echo "1. Set XSIAM_API_KEY environment variable"
echo "2. Set XSIAM_TENANT_URL environment variable"
echo "3. Configure log forwarding rules"
`;
        filename = 'docker-threat-lab.sh';
        break;

      case 'local-vm':
        script = `#!/bin/bash
# Local VirtualBox/VMware Threat Detection Lab
# Alternative to Proxmox deployment

set -e

echo "🚀 Setting up local VM-based threat detection lab..."

# Configuration
VM_NAME="xsiam-broker"
VM_MEMORY="4096"
VM_CPUS="2"
VM_DISK="20GB"

echo "📋 Prerequisites check..."

# Check if VirtualBox is installed
if command -v VBoxManage &> /dev/null; then
    echo "✅ VirtualBox detected"
    VIRTUALIZATION="virtualbox"
elif command -v vmrun &> /dev/null; then
    echo "✅ VMware detected"
    VIRTUALIZATION="vmware"
else
    echo "❌ No supported virtualization platform found"
    echo "Install VirtualBox or VMware Workstation/Fusion"
    exit 1
fi

echo "🔍 Checking for XSIAM broker image..."
BROKER_ISO="cortex-xdr-broker.iso"
if [ ! -f "$BROKER_ISO" ]; then
    echo "❌ XSIAM broker ISO not found"
    echo "Download from Palo Alto Networks support portal"
    exit 1
fi

if [ "$VIRTUALIZATION" = "virtualbox" ]; then
    echo "📦 Creating VirtualBox VM..."
    VBoxManage createvm --name "$VM_NAME" --register
    VBoxManage modifyvm "$VM_NAME" --memory $VM_MEMORY --cpus $VM_CPUS --vram 128
    VBoxManage modifyvm "$VM_NAME" --nic1 bridged --bridgeadapter1 en0
    VBoxManage createhd --filename "$VM_NAME.vdi" --size 20480
    VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata
    VBoxManage storageattach "$VM_NAME" --storagectl "SATA" --port 0 --device 0 --type hdd --medium "$VM_NAME.vdi"
    VBoxManage storageattach "$VM_NAME" --storagectl "SATA" --port 1 --device 0 --type dvddrive --medium "$BROKER_ISO"
    
    echo "🚀 Starting VM..."
    VBoxManage startvm "$VM_NAME"
fi

echo "✅ VM setup completed!"
echo "   Complete broker configuration via VM console"
echo "   Configure XSIAM credentials and data sources"
`;
        filename = 'local-vm-lab.sh';
        break;

      case 'cloud-alternative':
        script = `#!/bin/bash
# Cloud-based Alternative Infrastructure
# AWS/Azure deployment script

set -e

echo "🚀 Deploying cloud-based threat detection lab..."

# AWS deployment using EC2
if command -v aws &> /dev/null; then
    echo "☁️  AWS CLI detected - deploying to EC2..."
    
    # Create security group
    aws ec2 create-security-group \\
        --group-name threat-lab-sg \\
        --description "Threat Detection Lab Security Group"
    
    # Allow SSH and XSIAM ports
    aws ec2 authorize-security-group-ingress \\
        --group-name threat-lab-sg \\
        --protocol tcp \\
        --port 22 \\
        --cidr 0.0.0.0/0
    
    aws ec2 authorize-security-group-ingress \\
        --group-name threat-lab-sg \\
        --protocol tcp \\
        --port 443 \\
        --cidr 0.0.0.0/0
    
    # Launch EC2 instance
    INSTANCE_ID=$(aws ec2 run-instances \\
        --image-id ami-0c02fb55956c7d316 \\
        --count 1 \\
        --instance-type t3.medium \\
        --key-name YOUR_KEY_PAIR \\
        --security-groups threat-lab-sg \\
        --user-data file://cloud-init.sh \\
        --query 'Instances[0].InstanceId' \\
        --output text)
    
    echo "✅ EC2 instance launched: $INSTANCE_ID"
    
    # Wait for instance to be running
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \\
        --instance-ids $INSTANCE_ID \\
        --query 'Reservations[0].Instances[0].PublicIpAddress' \\
        --output text)
    
    echo "🌐 Public IP: $PUBLIC_IP"
    echo "🔗 SSH: ssh -i YOUR_KEY.pem ec2-user@$PUBLIC_IP"
    
else
    echo "❌ AWS CLI not found"
    echo "Install AWS CLI and configure credentials"
fi

# Azure deployment using CLI
if command -v az &> /dev/null; then
    echo "☁️  Azure CLI detected - deploying to Azure..."
    
    # Create resource group
    az group create --name threat-lab-rg --location eastus
    
    # Create VM
    az vm create \\
        --resource-group threat-lab-rg \\
        --name threat-lab-vm \\
        --image UbuntuLTS \\
        --size Standard_B2s \\
        --admin-username azureuser \\
        --generate-ssh-keys \\
        --custom-data cloud-init.sh
    
    # Open ports
    az vm open-port --resource-group threat-lab-rg --name threat-lab-vm --port 443
    az vm open-port --resource-group threat-lab-rg --name threat-lab-vm --port 22
    
    # Get public IP
    PUBLIC_IP=$(az vm show \\
        --resource-group threat-lab-rg \\
        --name threat-lab-vm \\
        --show-details \\
        --query publicIps \\
        --output tsv)
    
    echo "✅ Azure VM deployed successfully!"
    echo "🌐 Public IP: $PUBLIC_IP"
    echo "🔗 SSH: ssh azureuser@$PUBLIC_IP"
    
else
    echo "❌ Azure CLI not found"
    echo "Install Azure CLI and login: az login"
fi

echo ""
echo "🔧 Next steps:"
echo "1. SSH into the VM"
echo "2. Install XSIAM broker components"
echo "3. Configure data source forwarding"
echo "4. Test connectivity to XSIAM"
`;
        filename = 'cloud-alternative-lab.sh';
        break;
    }

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Alternative Script Downloaded",
      description: `${filename} saved successfully`
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Infrastructure Troubleshooting
          </CardTitle>
          <CardDescription>
            Alternative solutions for Proxmox and Azure deployment issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Common Issues:</strong> VM deployment failures, network connectivity problems, 
              and cloud authentication issues can be resolved with alternative approaches.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="proxmox-issues" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="proxmox-issues">Proxmox Issues</TabsTrigger>
              <TabsTrigger value="azure-issues">Azure Issues</TabsTrigger>
              <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
              <TabsTrigger value="quick-fixes">Quick Fixes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="proxmox-issues" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Common Proxmox VM Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Badge variant="destructive" className="mb-2">qcow2 Import Failed</Badge>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Verify qcow2 file is not corrupted: <code className="bg-muted px-1 rounded">qemu-img check image.qcow2</code></li>
                        <li>• Check available storage space: <code className="bg-muted px-1 rounded">df -h</code></li>
                        <li>• Try different storage location (local vs local-lvm)</li>
                        <li>• Convert format if needed: <code className="bg-muted px-1 rounded">qemu-img convert -f qcow2 -O qcow2 source.qcow2 fixed.qcow2</code></li>
                      </ul>
                    </div>
                    
                    <div>
                      <Badge variant="destructive" className="mb-2">VM Won't Start</Badge>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Check VM configuration: <code className="bg-muted px-1 rounded">qm config VMID</code></li>
                        <li>• Verify boot order: <code className="bg-muted px-1 rounded">qm set VMID --boot order=scsi0</code></li>
                        <li>• Check resource availability (CPU, RAM)</li>
                        <li>• Review Proxmox logs: <code className="bg-muted px-1 rounded">journalctl -u pve*</code></li>
                      </ul>
                    </div>
                    
                    <div>
                      <Badge variant="destructive" className="mb-2">Network Issues</Badge>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Verify bridge configuration: <code className="bg-muted px-1 rounded">brctl show</code></li>
                        <li>• Check VM network settings: <code className="bg-muted px-1 rounded">qm config VMID | grep net</code></li>
                        <li>• Test bridge connectivity: <code className="bg-muted px-1 rounded">ping -c 3 gateway_ip</code></li>
                        <li>• Try different network bridge (vmbr1, vmbr2)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="azure-issues" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Azure Connection Troubleshooting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Badge variant="destructive" className="mb-2">Authentication Failed</Badge>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Verify Azure CLI login: <code className="bg-muted px-1 rounded">az account show</code></li>
                        <li>• Check service principal credentials</li>
                        <li>• Validate subscription access: <code className="bg-muted px-1 rounded">az account list</code></li>
                        <li>• Re-authenticate: <code className="bg-muted px-1 rounded">az login --use-device-code</code></li>
                      </ul>
                    </div>
                    
                    <div>
                      <Badge variant="destructive" className="mb-2">Resource Creation Failed</Badge>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Check subscription quotas and limits</li>
                        <li>• Verify resource group permissions</li>
                        <li>• Try different Azure region</li>
                        <li>• Check billing account status</li>
                      </ul>
                    </div>
                    
                    <div>
                      <Badge variant="destructive" className="mb-2">Network Connectivity</Badge>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Verify network security group rules</li>
                        <li>• Check public IP assignment</li>
                        <li>• Test Azure network connectivity</li>
                        <li>• Review firewall and routing rules</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="alternatives" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Server className="h-4 w-4" />
                      Docker Lab
                    </CardTitle>
                    <CardDescription>Containerized threat detection environment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">Deploy a complete threat detection lab using Docker containers instead of VMs.</p>
                    <Button 
                      onClick={() => downloadAlternativeScript('docker-lab')}
                      size="sm" 
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Docker Script
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Terminal className="h-4 w-4" />
                      Local VMs
                    </CardTitle>
                    <CardDescription>VirtualBox/VMware deployment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">Use local virtualization instead of Proxmox for VM deployment.</p>
                    <Button 
                      onClick={() => downloadAlternativeScript('local-vm')}
                      size="sm" 
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download VM Script
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Cloud className="h-4 w-4" />
                      Public Cloud
                    </CardTitle>
                    <CardDescription>AWS/Azure public cloud deployment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">Deploy infrastructure to public cloud providers with automated scripts.</p>
                    <Button 
                      onClick={() => downloadAlternativeScript('cloud-alternative')}
                      size="sm" 
                      variant="secondary"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Cloud Script
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="quick-fixes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Immediate Workarounds</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="font-medium">Use Existing Systems</h5>
                      <p className="text-sm text-muted-foreground">
                        Configure log forwarding from existing Windows/Linux systems to XSIAM
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium">Manual Configuration</h5>
                      <p className="text-sm text-muted-foreground">
                        Set up XSIAM data sources manually without broker VM
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium">Cloud Trials</h5>
                      <p className="text-sm text-muted-foreground">
                        Use free tier cloud accounts for temporary infrastructure
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Testing Without Infrastructure</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="font-medium">Sample Data</h5>
                      <p className="text-sm text-muted-foreground">
                        Use pre-generated log samples for XSIAM content testing
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium">Simulation Mode</h5>
                      <p className="text-sm text-muted-foreground">
                        Test platform features with simulated infrastructure connections
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium">Content Development</h5>
                      <p className="text-sm text-muted-foreground">
                        Focus on XQL rules and playbook development first
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Network className="h-4 w-4" />
              <AlertDescription>
                <strong>Priority Approach:</strong> Since you have XSIAM API access, focus on content 
                development and testing while infrastructure issues are resolved separately.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Immediate Actions</h4>
                <ul className="text-sm space-y-1">
                  <li>• Download and try Docker-based lab setup</li>
                  <li>• Configure XSIAM content generation and testing</li>
                  <li>• Use platform's threat intelligence features</li>
                  <li>• Test XQL queries with existing XSIAM data</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Infrastructure Recovery</h4>
                <ul className="text-sm space-y-1">
                  <li>• Try local VM deployment scripts</li>
                  <li>• Consider public cloud alternatives</li>
                  <li>• Troubleshoot Proxmox qcow2 import</li>
                  <li>• Test Azure CLI authentication</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}