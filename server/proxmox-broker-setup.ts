import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function testProxmoxConnectivity(req: Request, res: Response) {
  try {
    const { proxmoxHost = '192.168.1.188', sshUser = 'root' } = req.body;
    
    console.log(`[PROXMOX-CONNECTIVITY] Testing connection to: ${proxmoxHost}`);

    const testResults = [];

    // Test 1: Ping test
    try {
      console.log('[PROXMOX-CONNECTIVITY] Testing ping...');
      const { stdout: pingResult } = await execAsync(`ping -c 3 ${proxmoxHost}`, { timeout: 15000 });
      testResults.push('✓ Ping successful - Host is reachable');
      testResults.push(pingResult.trim());
    } catch (error) {
      testResults.push('✗ Ping failed - Host not reachable via ICMP');
    }

    // Test 2: SSH connectivity
    try {
      console.log('[PROXMOX-CONNECTIVITY] Testing SSH...');
      const { stdout: sshResult } = await execAsync(`timeout 10 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${sshUser}@${proxmoxHost} 'echo "SSH connection successful"; uname -a'`, { timeout: 15000 });
      testResults.push('✓ SSH connection successful');
      testResults.push(`SSH Response: ${sshResult.trim()}`);
    } catch (error) {
      testResults.push('✗ SSH connection failed');
      testResults.push(`SSH Error: ${error instanceof Error ? error.message : 'Unknown SSH error'}`);
    }

    // Test 3: Port accessibility
    try {
      console.log('[PROXMOX-CONNECTIVITY] Testing port 22...');
      const { stdout: portResult } = await execAsync(`timeout 5 nc -zv ${proxmoxHost} 22`, { timeout: 10000 });
      testResults.push('✓ Port 22 (SSH) accessible');
    } catch (error) {
      testResults.push('✗ Port 22 (SSH) not accessible');
    }

    // Determine overall success
    const sshSuccess = testResults.some(result => result.includes('SSH connection successful'));
    
    if (sshSuccess) {
      res.json({
        success: true,
        message: 'Replit successfully connected to Proxmox server',
        proxmoxHost: proxmoxHost,
        testResults: testResults.join('\n'),
        capabilities: [
          'Deploy XSIAM broker via SSH',
          'Manage broker service remotely', 
          'Configure VM log forwarding',
          'Monitor broker status'
        ]
      });
    } else {
      res.json({
        success: false,
        message: 'Unable to establish connection to Proxmox server',
        proxmoxHost: proxmoxHost,
        testResults: testResults.join('\n'),
        troubleshooting: [
          'Fix Proxmox repository issues first (disable enterprise repos)',
          'Install Tailscale: curl -fsSL https://tailscale.com/install.sh | sh',
          'Connect with: tailscale up (follow prompts)',
          'Use Tailscale IP instead of 192.168.1.188',
          'Alternative: Configure router port forwarding for port 22',
          'Verify SSH service: systemctl status ssh'
        ]
      });
    }

  } catch (error) {
    console.error('[PROXMOX-CONNECTIVITY] Test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Proxmox connectivity',
      error: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Verify Proxmox host IP address is correct',
        'Ensure network connectivity between Replit and local network',
        'Check if Proxmox server is powered on and accessible'
      ]
    });
  }
}

export async function deployProxmoxBroker(req: Request, res: Response) {
  try {
    const { proxmoxHost = '192.168.1.188', sshUser = 'root' } = req.body;
    
    console.log(`[PROXMOX-BROKER] Deploying XSIAM broker on Proxmox host: ${proxmoxHost}`);

    // Install XSIAM broker on Proxmox host via SSH
    const brokerInstallScript = `
      #!/bin/bash
      echo "Installing XSIAM Broker on Proxmox host..."
      
      # Update system
      apt-get update -y
      
      # Install Docker if not present
      if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
      fi
      
      # Create XSIAM broker directory
      mkdir -p /opt/xsiam-broker
      cd /opt/xsiam-broker
      
      # Create broker configuration for Proxmox environment
      cat > broker-config.yaml << 'EOF'
broker:
  tenant_url: "PLACEHOLDER_TENANT_URL"
  api_key: "PLACEHOLDER_API_KEY"
  environment: "proxmox"
  data_sources:
    - type: "proxmox_logs"
      path: "/var/log/pve"
    - type: "vm_logs"
      path: "/var/log/libvirt"
    - type: "system_logs" 
      path: "/var/log"
    - type: "container_logs"
      path: "/var/lib/docker/containers"
  network:
    listen_port: 9999
    forward_port: 443
logging:
  level: "INFO"
  output: "/var/log/xsiam-broker.log"
collection:
  vm_metrics: true
  host_metrics: true
  network_flows: true
EOF
      
      # Create Docker Compose for broker deployment
      cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  xsiam-broker:
    image: paloaltonetworks/xsiam-broker:latest
    container_name: xsiam-broker
    restart: unless-stopped
    ports:
      - "9999:9999"
      - "514:514/udp"
    volumes:
      - ./broker-config.yaml:/config/broker-config.yaml:ro
      - /var/log:/host-logs:ro
      - /var/log/pve:/pve-logs:ro
      - /var/lib/docker/containers:/docker-logs:ro
      - broker-data:/data
    environment:
      - BROKER_CONFIG=/config/broker-config.yaml
    networks:
      - broker-network

volumes:
  broker-data:

networks:
  broker-network:
    driver: bridge
EOF
      
      # Set up systemd service for broker management
      cat > /etc/systemd/system/xsiam-broker.service << 'EOF'
[Unit]
Description=XSIAM Data Broker
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/xsiam-broker
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
      
      systemctl daemon-reload
      systemctl enable xsiam-broker
      
      # Configure firewall for broker communication
      ufw allow 9999/tcp comment "XSIAM Broker"
      ufw allow 514/udp comment "Syslog forwarding"
      
      # Set up log forwarding from Proxmox VMs to broker
      cat > /etc/rsyslog.d/99-xsiam-forward.conf << 'EOF'
# Forward VM logs to XSIAM broker
*.* @@localhost:514
EOF
      
      systemctl restart rsyslog
      
      echo "XSIAM broker installed on Proxmox host. Configuration required for tenant connection."
    `;

    // Execute installation script on Proxmox host
    const installCommand = `ssh -o StrictHostKeyChecking=no ${sshUser}@${proxmoxHost} 'bash -s' << 'EOF'
${brokerInstallScript}
EOF`;

    try {
      const { stdout, stderr } = await execAsync(installCommand, { timeout: 300000 });
      
      res.json({
        success: true,
        message: 'XSIAM broker deployed on Proxmox host',
        proxmoxHost: proxmoxHost,
        installation: {
          status: 'completed',
          output: stdout,
          brokerPort: 9999,
          syslogPort: 514
        },
        configuration: {
          configFile: '/opt/xsiam-broker/broker-config.yaml',
          serviceCommand: 'systemctl start xsiam-broker',
          statusCommand: 'systemctl status xsiam-broker',
          logsCommand: 'docker-compose -f /opt/xsiam-broker/docker-compose.yml logs -f'
        },
        nextSteps: [
          'SSH to Proxmox host: ssh root@' + proxmoxHost,
          'Edit /opt/xsiam-broker/broker-config.yaml with XSIAM tenant details',
          'Start broker: systemctl start xsiam-broker',
          'Verify broker status: systemctl status xsiam-broker',
          'Configure Proxmox VMs to forward logs to broker'
        ]
      });

    } catch (error) {
      console.error('[PROXMOX-BROKER] Installation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to install XSIAM broker on Proxmox host',
        error: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: [
          'Verify SSH access to Proxmox host',
          'Check network connectivity to ' + proxmoxHost,
          'Ensure Docker is available on Proxmox host',
          'Verify firewall allows SSH (port 22)'
        ]
      });
    }

  } catch (error) {
    console.error('[PROXMOX-BROKER] Request failed:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid request for Proxmox broker deployment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getProxmoxBrokerStatus(req: Request, res: Response) {
  try {
    const { proxmoxHost = '192.168.1.188', sshUser = 'root' } = req.query;
    
    console.log(`[PROXMOX-BROKER] Checking broker status on: ${proxmoxHost}`);

    const statusCommand = `ssh -o StrictHostKeyChecking=no ${sshUser}@${proxmoxHost} '
      echo "=== XSIAM Broker Status ==="
      systemctl is-active xsiam-broker 2>/dev/null || echo "inactive"
      echo ""
      echo "=== Docker Container Status ==="
      docker ps --filter name=xsiam-broker --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No containers found"
      echo ""
      echo "=== Broker Configuration ==="
      if [ -f /opt/xsiam-broker/broker-config.yaml ]; then
        echo "Configuration file exists"
        grep -E "tenant_url|environment" /opt/xsiam-broker/broker-config.yaml 2>/dev/null || echo "Config not readable"
      else
        echo "Configuration file not found"
      fi
    '`;

    const { stdout } = await execAsync(statusCommand, { timeout: 30000 });

    res.json({
      success: true,
      proxmoxHost: proxmoxHost,
      status: stdout,
      brokerEndpoint: `http://${proxmoxHost}:9999`,
      syslogEndpoint: `${proxmoxHost}:514`,
      managementCommands: {
        start: 'systemctl start xsiam-broker',
        stop: 'systemctl stop xsiam-broker',
        restart: 'systemctl restart xsiam-broker',
        logs: 'docker-compose -f /opt/xsiam-broker/docker-compose.yml logs -f',
        config: 'nano /opt/xsiam-broker/broker-config.yaml'
      }
    });

  } catch (error) {
    console.error('[PROXMOX-BROKER] Status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Proxmox broker status',
      error: error instanceof Error ? error.message : 'Connection failed',
      troubleshooting: [
        'Verify network connectivity to Proxmox host',
        'Check SSH access and credentials',
        'Ensure broker is installed on Proxmox host'
      ]
    });
  }
}

export async function configureVMLogForwarding(req: Request, res: Response) {
  try {
    const { proxmoxHost = '192.168.1.188', vmId, sshUser = 'root' } = req.body;
    
    console.log(`[PROXMOX-BROKER] Configuring log forwarding for VM ${vmId}`);

    const logForwardingScript = `
      # Configure VM to forward logs to Proxmox XSIAM broker
      qm set ${vmId} --agent 1
      
      # Get VM IP for configuration
      VM_IP=$(qm guest cmd ${vmId} network-get-interfaces | jq -r '.[] | select(.name=="eth0") | .["ip-addresses"][0]["ip-address"]' 2>/dev/null || echo "VM_IP_NOT_FOUND")
      
      echo "Configuring log forwarding for VM ${vmId} (IP: $VM_IP)"
      
      # Configure VM to send logs to broker
      if [ "$VM_IP" != "VM_IP_NOT_FOUND" ]; then
        # Add rsyslog configuration to forward to broker
        qm guest exec ${vmId} -- bash -c "
          echo '*.* @@192.168.1.188:514' >> /etc/rsyslog.d/99-xsiam-forward.conf
          systemctl restart rsyslog
          echo 'Log forwarding configured for VM ${vmId}'
        " 2>/dev/null || echo "Manual VM configuration required"
      fi
      
      echo "VM ${vmId} log forwarding setup completed"
    `;

    const { stdout } = await execAsync(`ssh -o StrictHostKeyChecking=no ${sshUser}@${proxmoxHost} '${logForwardingScript}'`, { timeout: 60000 });

    res.json({
      success: true,
      message: `Log forwarding configured for VM ${vmId}`,
      vmId: vmId,
      brokerEndpoint: `${proxmoxHost}:514`,
      configuration: stdout,
      manualSteps: [
        `SSH into VM ${vmId}`,
        'Add to /etc/rsyslog.d/99-xsiam-forward.conf: *.* @@192.168.1.188:514',
        'Restart rsyslog: systemctl restart rsyslog',
        'Verify logs reaching broker'
      ]
    });

  } catch (error) {
    console.error('[PROXMOX-BROKER] VM log forwarding failed:', error);
    res.status(500).json({
      success: false,
      message: `Failed to configure log forwarding for VM`,
      error: error instanceof Error ? error.message : 'Configuration failed'
    });
  }
}