import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Network, AlertTriangle, CheckCircle, Clock, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'failure' | 'running';
  message: string;
  details?: string;
  troubleshooting?: string[];
}

export function NetworkDiagnostics() {
  const [host, setHost] = useState('192.168.100.188');
  const [port, setPort] = useState(8006);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    if (!host) {
      toast({
        title: "Validation Error",
        description: "Please enter a host IP address",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setResults([]);

    const steps = [
      { name: 'Basic Network Connectivity', endpoint: '/api/connections/network-test' },
      { name: 'Port Accessibility', endpoint: '/api/connections/port-test' },
      { name: 'Proxmox Service Detection', endpoint: '/api/connections/service-test' }
    ];

    for (const step of steps) {
      setResults(prev => [...prev, {
        step: step.name,
        status: 'running',
        message: 'Testing...'
      }]);

      try {
        const response = await fetch(step.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port })
        });

        const result = await response.json();
        
        setResults(prev => prev.map((r, i) => 
          i === prev.length - 1 ? {
            step: step.name,
            status: result.success ? 'success' : 'failure',
            message: result.message || (result.success ? 'Test passed' : 'Test failed'),
            details: result.details,
            troubleshooting: result.troubleshooting
          } : r
        ));

        // If a step fails, don't continue
        if (!result.success) {
          break;
        }

      } catch (error) {
        setResults(prev => prev.map((r, i) => 
          i === prev.length - 1 ? {
            step: step.name,
            status: 'failure',
            message: 'Network request failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          } : r
        ));
        break;
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'failure':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running...</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Diagnostics
          </CardTitle>
          <CardDescription>
            Test network connectivity to your Proxmox server and identify connection issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diag-host">Host/IP Address</Label>
              <Input
                id="diag-host"
                placeholder="192.168.100.188"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diag-port">Port</Label>
              <Input
                id="diag-port"
                type="number"
                placeholder="8006"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 8006)}
                disabled={isRunning}
              />
            </div>
          </div>
          
          <Button 
            onClick={runDiagnostics}
            disabled={isRunning || !host}
            className="w-full"
          >
            {isRunning ? 'Running Diagnostics...' : 'Run Network Diagnostics'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
            <CardDescription>Network connectivity test results for {host}:{port}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <h4 className="font-medium">{result.step}</h4>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                
                <p className="text-sm text-muted-foreground">{result.message}</p>
                
                {result.details && (
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertDescription className="font-mono text-xs">
                      {result.details}
                    </AlertDescription>
                  </Alert>
                )}
                
                {result.troubleshooting && result.troubleshooting.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-sm mb-2">Troubleshooting Steps:</h5>
                    <ul className="text-sm space-y-1">
                      {result.troubleshooting.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manual Troubleshooting</CardTitle>
          <CardDescription>Additional steps you can try if network diagnostics fail</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Verify Proxmox Server Status</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Check if Proxmox server is powered on and running</li>
                <li>• Verify Proxmox web interface is accessible from your local network</li>
                <li>• Try opening https://{host}:8006 in your web browser</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Network Connectivity</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Ping the Proxmox server: <code className="bg-muted px-1 rounded">ping {host}</code></li>
                <li>• Test port connectivity: <code className="bg-muted px-1 rounded">telnet {host} 8006</code></li>
                <li>• Check if you're on the same network as the Proxmox server</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Firewall and Security</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Ensure Proxmox firewall allows connections on port 8006</li>
                <li>• Check your local firewall settings</li>
                <li>• Verify no network equipment is blocking the connection</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Replit Environment</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Replit may have network restrictions to private IP addresses</li>
                <li>• Consider setting up a VPN or proxy if needed</li>
                <li>• Test from your local machine if possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}