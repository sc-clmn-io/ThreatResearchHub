import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, Network, Shield, Zap } from 'lucide-react';

interface ConnectionTroubleshootingProps {
  host?: string;
  isPrivateIP?: boolean;
}

export function ConnectionTroubleshooting({ host = '192.168.100.188', isPrivateIP = true }: ConnectionTroubleshootingProps) {
  
  const downloadProject = () => {
    // Create download link for the project
    window.open('/api/github/export', '_blank');
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Network Limitation Detected:</strong> Replit cannot directly access private networks. 
          Your Proxmox server at {host} appears to be working correctly based on your browser access.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Recommended Solution
            </CardTitle>
            <CardDescription>Run the platform locally on your network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="default" className="bg-green-500">Easiest Option</Badge>
              <p className="text-sm">
                Download and run this application on a machine that can reach your Proxmox server directly.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Steps:</h4>
              <ol className="text-sm space-y-1 ml-4">
                <li>1. Download the complete project files</li>
                <li>2. Install Node.js on your local machine</li>
                <li>3. Run <code className="bg-muted px-1 rounded">npm install</code></li>
                <li>4. Run <code className="bg-muted px-1 rounded">npm run dev</code></li>
                <li>5. Access the platform at localhost:5000</li>
              </ol>
            </div>
            
            <Button onClick={downloadProject} className="w-full">
              Download Project Files
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Solutions
            </CardTitle>
            <CardDescription>Make Proxmox accessible from internet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Badge variant="outline">Port Forwarding</Badge>
                <p className="text-sm mt-1">
                  Configure your router to forward port 8006 to {host}
                </p>
              </div>
              
              <div>
                <Badge variant="outline">VPN Access</Badge>
                <p className="text-sm mt-1">
                  Set up VPN server on your network for secure remote access
                </p>
              </div>
              
              <div>
                <Badge variant="outline">SSH Tunnel</Badge>
                <p className="text-sm mt-1">
                  Use SSH tunneling through a publicly accessible server
                </p>
              </div>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Security Note:</strong> Exposing Proxmox to the internet requires proper security measures including strong passwords, fail2ban, and possibly VPN access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Local Setup Guide
          </CardTitle>
          <CardDescription>Get the platform running on your local network in 5 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Download & Extract</h4>
                <p className="text-xs text-muted-foreground">
                  Download the project files and extract to a local folder
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">2. Install Dependencies</h4>
                <p className="text-xs text-muted-foreground">
                  Run npm install to set up all required packages
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">3. Start Platform</h4>
                <p className="text-xs text-muted-foreground">
                  Run npm run dev and access at localhost:5000
                </p>
              </div>
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>Benefits of Local Setup:</strong> Direct access to {host}, faster performance, 
                full control over network configuration, and ability to deploy actual lab infrastructure.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alternative: Simulate for Development</CardTitle>
          <CardDescription>Continue development with simulated connections</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            While we can't connect to your actual Proxmox server from Replit, you can:
          </p>
          <ul className="text-sm space-y-2">
            <li>• Continue building and testing the platform interface</li>
            <li>• Use simulated infrastructure connections for development</li>
            <li>• Test threat intelligence and content generation features</li>
            <li>• Export your work and deploy locally when ready for real infrastructure</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}