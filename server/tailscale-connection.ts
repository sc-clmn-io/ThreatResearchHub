import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TailscaleConnectionManager {
  private static instance: TailscaleConnectionManager;
  private connected = false;
  private authKey = '';

  public static getInstance(): TailscaleConnectionManager {
    if (!TailscaleConnectionManager.instance) {
      TailscaleConnectionManager.instance = new TailscaleConnectionManager();
    }
    return TailscaleConnectionManager.instance;
  }

  // Try alternative connection methods for Replit environment
  async establishConnection(authKey: string): Promise<{ success: boolean; message: string; ip?: string }> {
    try {
      // Method 1: Try userspace Tailscale
      const userspaceResult = await this.tryUserspaceConnection(authKey);
      if (userspaceResult.success) {
        return userspaceResult;
      }

      // Method 2: Try SSH tunnel via existing connection
      const tunnelResult = await this.trySSHTunnel();
      if (tunnelResult.success) {
        return tunnelResult;
      }

      // Method 3: Use existing network connectivity if available
      const directResult = await this.tryDirectConnection();
      return directResult;

    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async tryUserspaceConnection(authKey: string): Promise<{ success: boolean; message: string; ip?: string }> {
    try {
      // Download Tailscale userspace binary
      await execAsync('wget -O /tmp/tailscale https://pkgs.tailscale.com/stable/tailscale_1.56.1_linux_amd64.tgz && tar -xzf /tmp/tailscale -C /tmp/');
      
      // Try to run in userspace mode
      const { stdout } = await execAsync(`/tmp/tailscale/tailscale up --userspace-networking --authkey=${authKey}`);
      
      const ip = await this.getTailscaleIP();
      return {
        success: true,
        message: 'Tailscale userspace connection established',
        ip
      };
    } catch (error) {
      return {
        success: false,
        message: `Userspace method failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async trySSHTunnel(): Promise<{ success: boolean; message: string }> {
    try {
      // If user has local access, we can create an SSH tunnel
      // This would require user to create a tunnel from their local machine
      return {
        success: false,
        message: 'SSH tunnel method requires local setup'
      };
    } catch (error) {
      return {
        success: false,
        message: `SSH tunnel failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async tryDirectConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test if we can reach the Tailscale IP directly (sometimes works)
      const { stdout, stderr } = await execAsync('timeout 5 ping -c 1 100.126.253.49');
      
      if (stdout.includes('1 received')) {
        return {
          success: true,
          message: 'Direct connection to Tailscale IP available'
        };
      }
      
      return {
        success: false,
        message: 'No direct connection available'
      };
    } catch (error) {
      return {
        success: false,
        message: `Direct connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getTailscaleIP(): Promise<string> {
    try {
      const { stdout } = await execAsync('/tmp/tailscale/tailscale ip -4');
      return stdout.trim();
    } catch (error) {
      return '';
    }
  }

  async getConnectionStatus(): Promise<{ connected: boolean; ip?: string; method?: string }> {
    try {
      // Test connection to known Tailscale IP
      const { stdout } = await execAsync('timeout 3 ping -c 1 100.126.253.49 2>/dev/null || echo "failed"');
      
      if (stdout.includes('1 received')) {
        return {
          connected: true,
          ip: '100.126.253.49',
          method: 'direct'
        };
      }
      
      return { connected: false };
    } catch (error) {
      return { connected: false };
    }
  }
}