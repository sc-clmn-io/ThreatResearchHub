import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Server, 
  Cloud, 
  Network,
  Zap,
  RefreshCw
} from 'lucide-react';

export default function InfrastructureStatus() {
  const { data: connectionsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/connections/status'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const connections = (connectionsData as any)?.connections || [];
  const proxmoxConnection = connections.find((conn: any) => conn.type === 'proxmox');
  const azureConnection = connections.find((conn: any) => conn.type === 'azure');
  const dockerConnection = connections.find((conn: any) => conn.type === 'docker');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Infrastructure Status</h2>
          <p className="text-muted-foreground">Threat lab infrastructure connectivity and status</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Proxmox Infrastructure */}
        <Card className={`${proxmoxConnection ? 'border-green-200' : 'border-gray-200'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className={`w-5 h-5 ${proxmoxConnection ? 'text-green-600' : 'text-gray-400'}`} />
                <CardTitle className="text-lg">Proxmox Infrastructure</CardTitle>
              </div>
              <Badge variant="outline" className={`${
                proxmoxConnection 
                  ? 'text-green-700 border-green-200' 
                  : 'text-gray-700 border-gray-200'
              }`}>
                {proxmoxConnection ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
            </div>
            <CardDescription>Local XSIAM broker for VM log forwarding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proxmoxConnection ? (
              <>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Host Server:</span>
                    <code className="text-sm">{proxmoxConnection.host}</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">XSIAM Broker:</span>
                    <Badge variant="secondary">VM {proxmoxConnection.broker?.vm_id}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Broker URL:</span>
                    <code className="text-xs">{proxmoxConnection.broker?.url}</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Resources:</span>
                    <span className="text-sm">{proxmoxConnection.broker?.cores} cores, {proxmoxConnection.broker?.ram}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-sm capitalize">{proxmoxConnection.broker?.status}</span>
                  </div>
                </div>
                
                <Alert className="border-green-200 bg-green-50">
                  <Network className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Architecture:</strong> Proxmox VMs → Local XSIAM Broker → XSIAM Cloud
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Alert className="border-gray-200 bg-gray-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Proxmox connection not established. Check network connectivity to 192.168.1.188.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Azure Infrastructure */}
        <Card className={`${azureConnection ? 'border-green-200' : 'border-orange-200'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className={`w-5 h-5 ${azureConnection ? 'text-green-600' : 'text-orange-600'}`} />
                <CardTitle className="text-lg">Azure Infrastructure</CardTitle>
              </div>
              <Badge variant="outline" className={`${
                azureConnection 
                  ? 'text-green-700 border-green-200' 
                  : 'text-orange-700 border-orange-200'
              }`}>
                {azureConnection ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Setup Required
                  </>
                )}
              </Badge>
            </div>
            <CardDescription>Cloud VM deployment with direct XSIAM API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {azureConnection ? (
              <>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Subscription:</span>
                    <code className="text-xs">{azureConnection.subscriptionId}</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Tenant:</span>
                    <code className="text-xs">{azureConnection.tenantId}</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Resource Group:</span>
                    <span className="text-sm">{azureConnection.resourceGroup}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Connected:</span>
                    <span className="text-sm">{new Date(azureConnection.connectedAt).toLocaleString()}</span>
                  </div>
                </div>
                
                <Alert className="border-green-200 bg-green-50">
                  <Network className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Architecture:</strong> Azure VMs → Direct XSIAM API → XSIAM Cloud
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <>
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Azure credentials need to be configured and permissions granted for VM deployment.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Required Steps:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Complete Azure service principal setup</li>
                    <li>Grant Contributor role to ThreatLab-App</li>
                    <li>Test connection and verify permissions</li>
                  </ol>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Architecture:</strong> Azure VMs → Direct XSIAM API → XSIAM Cloud
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Available Deployment Options
          </CardTitle>
          <CardDescription>Threat scenario deployment capabilities per infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className={`font-semibold ${proxmoxConnection ? 'text-green-700' : 'text-gray-500'}`}>
                Proxmox {proxmoxConnection ? '(Ready)' : '(Offline)'}
              </h4>
              <ul className="text-sm space-y-1">
                <li>{proxmoxConnection ? '✅' : '❌'} Docker Runtime Escape labs</li>
                <li>{proxmoxConnection ? '✅' : '❌'} Lateral Movement scenarios</li>
                <li>{proxmoxConnection ? '✅' : '❌'} Network isolation testing</li>
                <li>{proxmoxConnection ? '✅' : '❌'} Local XSIAM broker integration</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className={`font-semibold ${azureConnection ? 'text-green-700' : 'text-orange-700'}`}>
                Azure {azureConnection ? '(Ready)' : '(Setup Required)'}
              </h4>
              <ul className="text-sm space-y-1">
                <li>{azureConnection ? '✅' : '⚠️'} Cloud Privilege Escalation</li>
                <li>{azureConnection ? '✅' : '⚠️'} Phishing Attack Response</li>
                <li>{azureConnection ? '✅' : '⚠️'} Azure AD integration testing</li>
                <li>{azureConnection ? '✅' : '⚠️'} Scalable VM deployment</li>
              </ul>
            </div>
            {dockerConnection && (
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-700">Docker (Connected)</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ Container escape testing</li>
                  <li>✅ Rapid deployment scenarios</li>
                  <li>✅ Version: {dockerConnection.version}</li>
                  <li>✅ Containers: {dockerConnection.containers}</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}