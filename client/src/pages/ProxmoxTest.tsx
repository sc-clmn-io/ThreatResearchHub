import { ProxmoxVMManager } from '@/components/proxmox-vm-manager';

export function ProxmoxTest() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Proxmox Infrastructure Management</h1>
          <p className="text-muted-foreground mt-2">
            Connect to your Proxmox server, manage VMs, and configure XSIAM broker for lab environments
          </p>
        </div>
        
        <ProxmoxVMManager />
      </div>
    </div>
  );
}