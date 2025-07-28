import { AzureVMManager } from '@/components/azure-vm-manager';
import { AzureUseCaseManager } from '@/components/azure-use-case-manager';
import { ProxmoxBrokerManager } from '@/components/proxmox-broker-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AzureTest() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Infrastructure Management</h1>
          <p className="text-muted-foreground mt-2">
            Complete Azure and Proxmox integration for threat detection lab deployment and administrative tasks
          </p>
        </div>
        
        <Tabs defaultValue="azure-automation" className="space-y-6">
          <TabsList>
            <TabsTrigger value="azure-automation">Azure Automation</TabsTrigger>
            <TabsTrigger value="azure-vm-mgmt">Azure VM Management</TabsTrigger>
            <TabsTrigger value="proxmox-broker">Proxmox Broker</TabsTrigger>
          </TabsList>
          
          <TabsContent value="azure-automation">
            <AzureUseCaseManager />
          </TabsContent>
          
          <TabsContent value="azure-vm-mgmt">
            <AzureVMManager />
          </TabsContent>
          
          <TabsContent value="proxmox-broker">
            <ProxmoxBrokerManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}