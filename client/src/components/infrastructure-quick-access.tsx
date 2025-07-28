import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Server, 
  Download, 
  ExternalLink,
  FileDown,
  Terminal,
  Container,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InfrastructureQuickAccess() {
  const { toast } = useToast();

  const downloadDockerFiles = async () => {
    try {
      const files = [
        '/start-docker.sh',
        '/docker-compose.yml', 
        '/Dockerfile.simple',
        '/DOCKER_QUICK_START.md'
      ];
      
      // For now, show the file contents that user needs
      toast({
        title: "Docker Files Available",
        description: "Check the file explorer for Docker scripts and documentation"
      });
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Unable to download Docker files",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Infrastructure Management</h2>
        <p className="text-muted-foreground">
          Connect to your infrastructure platforms for VM management and XSIAM broker deployment
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Azure Cloud Management */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              Azure Cloud Management
            </CardTitle>
            <CardDescription>
              Manage Azure VMs directly from Replit - no additional setup required
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready to Use
              </Badge>
              <div className="text-sm text-muted-foreground">
                Azure CLI installed and configured in this environment
              </div>
            </div>
            
            <Alert>
              <Terminal className="w-4 h-4" />
              <AlertDescription>
                <strong>Required:</strong> Run `az login` in terminal first, then provide your subscription details
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-medium">What you need:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Azure subscription ID</li>
                <li>• Resource group name</li>
                <li>• Azure CLI authentication (az login)</li>
              </ul>
            </div>
            
            <Button className="w-full" asChild>
              <a href="/azure-test" className="flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Open Azure Management
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Local Proxmox Management */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-orange-500" />
              Local Proxmox Management
            </CardTitle>
            <CardDescription>
              Manage Proxmox server (192.168.1.188) via Docker Desktop
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Requires Local Setup
              </Badge>
              <div className="text-sm text-muted-foreground">
                Docker Desktop needed for private network access
              </div>
            </div>
            
            <Alert>
              <Container className="w-4 h-4" />
              <AlertDescription>
                <strong>Network Limitation:</strong> Replit cannot reach private IP 192.168.1.188 directly
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-medium">Local setup steps:</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Download project files locally</li>
                <li>2. Install Docker Desktop</li>
                <li>3. Run: ./start-docker.sh</li>
                <li>4. Access: localhost:3000/proxmox-test</li>
              </ol>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadDockerFiles} className="flex-1">
                <FileDown className="w-4 h-4 mr-2" />
                View Docker Files
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href="/proxmox-test" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Proxmox Interface
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Azure Setup (5 minutes)</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>1. Terminal: `az login`</div>
                <div>2. Get subscription ID from Azure portal</div>
                <div>3. Note your resource group name</div>
                <div>4. Click "Open Azure Management" above</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-orange-600 mb-2">Local Docker Setup (10 minutes)</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>1. Download project ZIP</div>
                <div>2. Install Docker Desktop</div>
                <div>3. SSH key to Proxmox: ssh-copy-id root@192.168.1.188</div>
                <div>4. Run: ./start-docker.sh</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}