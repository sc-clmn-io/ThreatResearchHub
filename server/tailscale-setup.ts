import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function setupTailscaleConnection(req: Request, res: Response) {
  try {
    const { proxmoxHost = '192.168.1.188' } = req.body;
    
    console.log('[TAILSCALE] Setting up Tailscale connection...');

    // Step 1: Install Tailscale on Replit container
    try {
      console.log('[TAILSCALE] Installing Tailscale on Replit...');
      await execAsync('curl -fsSL https://tailscale.com/install.sh | sh', { timeout: 60000 });
      console.log('[TAILSCALE] Tailscale installed on Replit');
    } catch (error) {
      console.log('[TAILSCALE] Tailscale may already be installed or installation failed:', error);
    }

    // Step 2: Generate Tailscale auth key instruction
    const setupInstructions = {
      replitSetup: [
        'Get auth key from Tailscale admin console: https://login.tailscale.com/admin/settings/keys',
        'Run: sudo tailscale up --authkey=YOUR_AUTH_KEY',
        'Verify Replit connection: tailscale status'
      ],
      proxmoxSetup: [
        'SSH to Proxmox: ssh root@' + proxmoxHost,
        'Fix enterprise repos: mv /etc/apt/sources.list.d/pve-enterprise.list /etc/apt/sources.list.d/pve-enterprise.list.bak',
        'Add community repo: echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list',
        'Update packages: apt update',
        'Install Tailscale: curl -fsSL https://tailscale.com/install.sh | sh',
        'Connect Proxmox: tailscale up',
        'Verify connection: tailscale status',
        'Get Tailscale IP: tailscale ip -4'
      ],
      verification: [
        'Both devices should appear in Tailscale admin console',
        'Test connection: ping PROXMOX_TAILSCALE_IP from Replit',
        'Test SSH: ssh root@PROXMOX_TAILSCALE_IP',
        'Deploy XSIAM broker using Tailscale IP'
      ]
    };

    res.json({
      success: true,
      message: 'Tailscale setup instructions generated',
      setupInstructions,
      nextSteps: [
        'Create Tailscale account at https://tailscale.com if needed',
        'Generate auth key in admin console',
        'Follow setup instructions for both Replit and Proxmox',
        'Test connectivity using Tailscale IPs',
        'Return to deploy XSIAM broker using Tailscale connection'
      ],
      adminConsole: 'https://login.tailscale.com/admin',
      authKeyUrl: 'https://login.tailscale.com/admin/settings/keys'
    });

  } catch (error) {
    console.error('[TAILSCALE] Setup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set up Tailscale connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function checkTailscaleStatus(req: Request, res: Response) {
  try {
    console.log('[TAILSCALE] Checking Tailscale status...');

    const statusCommands = [
      'tailscale status',
      'tailscale ip',
      'tailscale netcheck'
    ];

    const results = [];

    for (const command of statusCommands) {
      try {
        const { stdout } = await execAsync(command, { timeout: 10000 });
        results.push({
          command,
          status: 'success',
          output: stdout.trim()
        });
      } catch (error) {
        results.push({
          command,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Command failed'
        });
      }
    }

    const isConnected = results.some(r => r.command === 'tailscale status' && r.status === 'success' && !r.output?.includes('Stopped'));

    res.json({
      success: true,
      connected: isConnected,
      results,
      recommendations: isConnected ? [
        'Tailscale is connected and ready',
        'You can now use Tailscale IPs for Proxmox connection',
        'Update Proxmox host field with Tailscale IP'
      ] : [
        'Tailscale not connected or not installed',
        'Run: sudo tailscale up --authkey=YOUR_AUTH_KEY',
        'Get auth key from https://login.tailscale.com/admin/settings/keys'
      ]
    });

  } catch (error) {
    console.error('[TAILSCALE] Status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Tailscale status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function generateProxmoxVMTroubleshooting(req: Request, res: Response) {
  try {
    const { symptoms = 'boot-loops' } = req.body;
    
    console.log('[PROXMOX-VM] Generating VM troubleshooting guide...');

    const troubleshootingGuide = {
      bootLoopIssues: {
        commonCauses: [
          'ISO image corruption or incomplete download',
          'Insufficient RAM allocation (minimum 1GB recommended)',
          'UEFI/BIOS boot mode mismatch with OS type',
          'Disk storage issues or full storage pool',
          'Hardware virtualization not enabled',
          'Conflicting VM configuration settings'
        ],
        diagnosticSteps: [
          'Check VM logs: tail -f /var/log/pve/qemu-server/VMID.log',
          'Verify ISO integrity: sha256sum /path/to/iso/file.iso',
          'Check storage space: pvesm status',
          'Review VM config: cat /etc/pve/qemu-server/VMID.conf',
          'Test with minimal resources (1 CPU, 1GB RAM)',
          'Try different OS types (q35 vs i440fx machine type)'
        ],
        solutions: [
          'Re-download ISO from official source',
          'Increase RAM to 2GB+ for modern OS installations',
          'Switch between UEFI and SeaBIOS boot modes',
          'Clean up storage or move VMs to different storage pool',
          'Enable virtualization in Proxmox host BIOS',
          'Start with basic VM config, add features incrementally'
        ]
      },
      quickFixes: [
        'VM stuck at boot: Change machine type to q35 in VM options',
        'Windows boot loops: Enable UEFI mode and add EFI disk',
        'Linux boot issues: Try SeaBIOS instead of UEFI',
        'Installation loops: Verify ISO file and re-attach to VM',
        'Black screen: Increase video memory to 32MB+',
        'No network: Check bridge configuration and firewall'
      ],
      recommendedSettings: {
        windows: {
          machine: 'q35',
          bios: 'UEFI',
          cpu: 'host',
          memory: '4096',
          disk: 'virtio',
          network: 'virtio'
        },
        linux: {
          machine: 'q35',
          bios: 'SeaBIOS',
          cpu: 'host',
          memory: '2048', 
          disk: 'virtio',
          network: 'virtio'
        }
      }
    };

    res.json({
      success: true,
      message: 'VM troubleshooting guide generated',
      guide: troubleshootingGuide,
      immediateActions: [
        'Check current VM logs for error messages',
        'Verify sufficient storage space on Proxmox',
        'Test with known-good ISO file',
        'Try creating minimal test VM with basic settings'
      ],
      logCommands: [
        'journalctl -u pveproxy -f',
        'tail -f /var/log/pve/qemu-server/*.log',
        'dmesg | grep -i error',
        'pvesm status'
      ]
    });

  } catch (error) {
    console.error('[PROXMOX-VM] Troubleshooting generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate troubleshooting guide',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}