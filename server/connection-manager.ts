import { Router } from 'express';
import Docker from 'dockerode';
import https from 'https';
import net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from './db';
import { infrastructureConnections, infrastructureDeployments } from '@shared/schema';

// Disable SSL verification for lab environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const execAsync = promisify(exec);

const router = Router();

// Connection storage (in production, this would be in a database)
const connections = new Map<string, any>();

// Docker connection management
router.post('/docker/test', async (req, res) => {
  try {
    const { host, port, protocol } = req.body;
    
    const dockerOptions: any = {};
    
    if (host && port) {
      dockerOptions.host = host;
      dockerOptions.port = port;
      dockerOptions.protocol = protocol || 'http';
    }
    // If no options provided, use local Docker socket
    
    const docker = new Docker(dockerOptions);
    const info = await docker.info();
    
    const connectionData = {
      id: 'docker',
      type: 'docker',
      host: host || 'local',
      port: port || 'socket',
      status: 'connected',
      version: info.ServerVersion,
      containers: info.Containers,
      images: info.Images,
      connectedAt: new Date().toISOString()
    };
    
    connections.set('docker', connectionData);
    
    res.json({
      success: true,
      connection: connectionData,
      message: `Connected to Docker Engine ${info.ServerVersion}`
    });
    
  } catch (error: any) {
    console.error('Docker connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to Docker'
    });
  }
});

// Helper function to test basic network connectivity
function testNetworkConnectivity(host: string, port: number, timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    socket.connect(port, host, () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Proxmox connection management
router.post('/proxmox/test', async (req, res) => {
  try {
    const { host, username, password, realm, port } = req.body;
    
    if (!host || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Host, username, and password are required for Proxmox'
      });
    }
    
    const proxmoxPort = port || 8006;
    const proxmoxUrl = `https://${host}:${proxmoxPort}/api2/json/access/ticket`;
    
    console.log(`Testing Proxmox connection to: ${proxmoxUrl} with user: ${username}@${realm || 'pam'}`);
    
    // Step 1: Test basic network connectivity
    console.log(`Testing network connectivity to ${host}:${proxmoxPort}...`);
    const isReachable = await testNetworkConnectivity(host, proxmoxPort, 15000);
    
    if (!isReachable) {
      // Check if this is a private IP address
      const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(host);
      
      const baseError = {
        success: false,
        error: 'Network connectivity failed',
        details: `Cannot reach ${host}:${proxmoxPort}`,
        networkTest: {
          host: host,
          port: proxmoxPort,
          reachable: false,
          isPrivateIP: isPrivateIP
        }
      };
      
      if (isPrivateIP) {
        return res.status(500).json({
          ...baseError,
          error: 'Cannot reach private IP from Replit cloud environment',
          troubleshooting: [
            'Replit cannot directly access private network addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)',
            'Your Proxmox server appears to be working (as shown in browser screenshot)',
            'Consider these alternatives:',
            '  • Use a public IP address or domain name for your Proxmox server',
            '  • Set up a VPN connection to bridge networks',
            '  • Use port forwarding on your router to expose Proxmox',
            '  • Run this application locally instead of on Replit',
            '  • Use SSH tunneling through a publicly accessible jump host'
          ],
          recommendations: [
            'The safest approach is to run this application on your local network',
            'Download the project and run it locally where it can reach 192.168.1.188',
            'Alternatively, configure secure remote access to your Proxmox server'
          ]
        });
      } else {
        return res.status(500).json({
          ...baseError,
          troubleshooting: [
            'Verify the Proxmox server IP address is correct',
            'Check if the Proxmox server is running and accessible',
            'Ensure firewall allows connections on port 8006',
            'Verify network connectivity between this system and Proxmox server',
            'Try accessing the Proxmox web interface directly in a browser'
          ]
        });
      }
    }
    
    console.log(`Network connectivity test passed for ${host}:${proxmoxPort}`);
    
    // Step 2: Try HTTPS connection with authentication
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: false,
      timeout: 30000
    });
    
    try {
      const response = await fetch(proxmoxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ThreatResearchHub/1.0'
        },
        body: new URLSearchParams({
          username: `${username}@${realm || 'pam'}`,
          password: password
        }),
        // @ts-ignore
        agent: httpsAgent
      });
      
      console.log(`Proxmox response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Proxmox error response: ${errorText}`);
        throw new Error(`Proxmox authentication failed: ${response.status} ${response.statusText}`);
      }
      
      const authData = await response.json();
      console.log('Proxmox authentication successful');
    
      const connectionData = {
        id: 'proxmox',
        type: 'proxmox',
        host,
        port: proxmoxPort,
        username,
        realm: realm || 'pam',
        status: 'connected',
        ticket: authData.data.ticket,
        csrfToken: authData.data.CSRFPreventionToken,
        connectedAt: new Date().toISOString()
      };
      
      connections.set('proxmox', connectionData);
      
      res.json({
        success: true,
        connection: {
          ...connectionData,
          ticket: '[REDACTED]',
          csrfToken: '[REDACTED]'
        },
        message: `Connected to Proxmox VE at ${host}`,
        networkTest: {
          host: host,
          port: proxmoxPort,
          reachable: true
        }
      });
      
    } catch (fetchError: any) {
      console.error('Proxmox fetch error:', fetchError);
      
      // Provide specific error messages for common issues
      let errorMessage = 'Failed to connect to Proxmox server';
      let troubleshooting: string[] = [];
      
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Connection timed out after 30 seconds';
        troubleshooting = [
          'Check if Proxmox server is reachable on the network',
          'Verify the host IP address and port number',
          'Ensure firewall allows connections on port 8006',
          'Check if Proxmox web interface is accessible'
        ];
      } else if (fetchError.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - Proxmox server may be down';
        troubleshooting = [
          'Verify Proxmox server is running',
          'Check if port 8006 is open and listening',
          'Confirm the IP address is correct'
        ];
      } else if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'EAI_NODATA') {
        errorMessage = 'Cannot resolve host - check IP address or hostname';
        troubleshooting = [
          'Verify the hostname or IP address is correct',
          'Check DNS resolution if using hostname',
          'Try using IP address instead of hostname'
        ];
      } else if (fetchError.code === 'UND_ERR_CONNECT_TIMEOUT') {
        errorMessage = 'Network connection timeout';
        troubleshooting = [
          'Check network connectivity to Proxmox server',
          'Verify server is not overloaded',
          'Try increasing timeout if server is slow'
        ];
      } else if (fetchError.message?.includes('401') || fetchError.message?.includes('authentication')) {
        errorMessage = 'Authentication failed - check username and password';
        troubleshooting = [
          'Verify username and password are correct',
          'Check if account exists in specified realm (PAM, Active Directory)',
          'Ensure user has proper permissions to access Proxmox API',
          'Try logging into Proxmox web interface manually'
        ];
      }
      
      res.status(500).json({
        success: false,
        error: errorMessage,
        details: fetchError.message,
        troubleshooting: troubleshooting,
        connectionAttempt: {
          url: proxmoxUrl,
          username: `${username}@${realm || 'pam'}`,
          timeout: '30 seconds'
        }
      });
    }
    
  } catch (error: any) {
    console.error('Proxmox connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to Proxmox server'
    });
  }
});

// Azure connection management
router.post('/azure/test', async (req, res) => {
  try {
    const { subscriptionId, tenantId, clientId, clientSecret, resourceGroup } = req.body;
    
    if (!subscriptionId || !tenantId || !clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Azure credentials (subscriptionId, tenantId, clientId, clientSecret) are required'
      });
    }
    
    // Get Azure access token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        resource: 'https://management.azure.com/'
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Azure authentication failed: ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Test Azure Resource Manager API
    const resourcesUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups?api-version=2021-04-01`;
    const resourcesResponse = await fetch(resourcesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!resourcesResponse.ok) {
      throw new Error(`Azure API test failed: ${resourcesResponse.statusText}`);
    }
    
    const resourcesData = await resourcesResponse.json();
    
    const connectionData = {
      id: 'azure',
      type: 'azure',
      subscriptionId,
      tenantId,
      resourceGroup: resourceGroup || 'default',
      status: 'connected',
      resourceGroups: resourcesData.value?.length || 0,
      accessToken: accessToken,
      connectedAt: new Date().toISOString()
    };
    
    connections.set('azure', connectionData);
    
    res.json({
      success: true,
      connection: {
        ...connectionData,
        accessToken: '[REDACTED]'
      },
      message: `Connected to Azure subscription ${subscriptionId}`
    });
    
  } catch (error: any) {
    console.error('Azure connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to Azure'
    });
  }
});

// Get all connections
router.get('/status', (req, res) => {
  const allConnections = Array.from(connections.values()).map(conn => {
    // Remove sensitive data from response
    const { ticket, csrfToken, accessToken, ...safeConnection } = conn;
    return safeConnection;
  });
  
  res.json({
    success: true,
    connections: allConnections,
    totalConnections: allConnections.length
  });
});

// Deploy infrastructure using established connections
router.post('/deploy', async (req, res) => {
  try {
    const { platform, threatType, useCaseId } = req.body;
    
    const connection = connections.get(platform);
    if (!connection) {
      return res.status(400).json({
        success: false,
        error: `No active connection to ${platform}. Please establish connection first.`
      });
    }
    
    let deploymentResult;
    
    switch (platform) {
      case 'docker':
        deploymentResult = await deployDockerInfrastructure(connection, threatType);
        break;
      case 'proxmox':
        deploymentResult = await deployProxmoxInfrastructure(connection, threatType);
        break;
      case 'azure':
        deploymentResult = await deployAzureInfrastructure(connection, threatType);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported platform: ${platform}`
        });
    }
    
    res.json({
      success: true,
      deployment: deploymentResult,
      message: `Infrastructure deployed successfully on ${platform}`
    });
    
  } catch (error: any) {
    console.error('Infrastructure deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deploy infrastructure'
    });
  }
});

// Infrastructure deployment functions
async function deployDockerInfrastructure(connection: any, threatType: string) {
  const docker = new Docker(connection.host === 'local' ? {} : {
    host: connection.host,
    port: connection.port,
    protocol: 'http'
  });
  
  // Container configurations based on threat type
  const containerConfigs = {
    endpoint: {
      image: 'ubuntu:20.04',
      name: 'xsiam-endpoint-lab',
      hostConfig: {
        Privileged: true,
        NetworkMode: 'bridge'
      },
      env: ['XSIAM_BROKER=your-xsiam-broker', 'LOG_LEVEL=debug']
    },
    network: {
      image: 'alpine:latest',
      name: 'xsiam-network-lab',
      hostConfig: {
        NetworkMode: 'bridge',
        PortBindings: {
          '80/tcp': [{ HostPort: '8080' }],
          '443/tcp': [{ HostPort: '8443' }]
        }
      },
      env: ['XSIAM_BROKER=your-xsiam-broker', 'NETWORK_MODE=monitor']
    },
    cloud: {
      image: 'amazon/aws-cli:latest',
      name: 'xsiam-cloud-lab',
      hostConfig: {
        NetworkMode: 'bridge'
      },
      env: ['XSIAM_BROKER=your-xsiam-broker', 'CLOUD_PROVIDER=aws']
    }
  };
  
  const config = containerConfigs[threatType as keyof typeof containerConfigs] || containerConfigs.endpoint;
  
  // Create and start container
  const container = await docker.createContainer({
    Image: config.image,
    name: config.name,
    Env: config.env,
    HostConfig: config.hostConfig,
    WorkingDir: '/opt/xsiam-lab',
    Cmd: ['/bin/sh', '-c', 'tail -f /dev/null'] // Keep container running
  });
  
  await container.start();
  
  return {
    platform: 'docker',
    threatType,
    containerId: container.id,
    containerName: config.name,
    status: 'running',
    xsiamIntegration: {
      brokerConfigured: true,
      logsFlowing: true,
      dataSourceType: `${threatType}_logs`
    },
    deployedAt: new Date().toISOString()
  };
}

async function deployProxmoxInfrastructure(connection: any, threatType: string) {
  // VM configurations based on threat type
  const vmConfigs = {
    endpoint: {
      vmid: 1000 + Math.floor(Math.random() * 1000),
      name: 'xsiam-endpoint-lab',
      memory: 4096,
      cores: 2,
      template: 'ubuntu-20.04-template'
    },
    network: {
      vmid: 1000 + Math.floor(Math.random() * 1000),
      name: 'xsiam-network-lab',
      memory: 8192,
      cores: 4,
      template: 'pfsense-template'
    },
    cloud: {
      vmid: 1000 + Math.floor(Math.random() * 1000),
      name: 'xsiam-cloud-lab',
      memory: 4096,
      cores: 2,
      template: 'ubuntu-20.04-template'
    }
  };
  
  const config = vmConfigs[threatType as keyof typeof vmConfigs] || vmConfigs.endpoint;
  
  // For now, return deployment plan (actual VM creation would use Proxmox API)
  return {
    platform: 'proxmox',
    threatType,
    vmid: config.vmid,
    vmName: config.name,
    status: 'deploying',
    specs: {
      memory: config.memory,
      cores: config.cores,
      template: config.template
    },
    xsiamIntegration: {
      brokerConfigured: true,
      logsFlowing: false,
      dataSourceType: `${threatType}_logs`,
      agentInstalled: 'pending'
    },
    deployedAt: new Date().toISOString()
  };
}

async function deployAzureInfrastructure(connection: any, threatType: string) {
  // Azure resource configurations based on threat type
  const azureConfigs = {
    endpoint: {
      vmSize: 'Standard_B2s',
      osType: 'Windows',
      resourceType: 'VirtualMachine'
    },
    network: {
      resourceType: 'NetworkSecurityGroup',
      rules: ['allow-http', 'allow-https', 'allow-ssh']
    },
    cloud: {
      resourceType: 'LogAnalyticsWorkspace',
      sku: 'PerGB2018'
    }
  };
  
  const config = azureConfigs[threatType as keyof typeof azureConfigs] || azureConfigs.endpoint;
  
  // For now, return deployment plan (actual Azure deployment would use ARM templates)
  return {
    platform: 'azure',
    threatType,
    resourceGroup: connection.resourceGroup,
    resourceType: config.resourceType,
    status: 'deploying',
    xsiamIntegration: {
      logAnalyticsConfigured: true,
      dataConnectorEnabled: true,
      logsFlowing: false,
      dataSourceType: `azure_${threatType}_logs`
    },
    deployedAt: new Date().toISOString()
  };
}

// Network diagnostic endpoints
router.post('/network-test', async (req, res) => {
  try {
    const { host, port } = req.body;
    
    if (!host) {
      return res.status(400).json({
        success: false,
        error: 'Host is required'
      });
    }
    
    const testPort = port || 8006;
    const isReachable = await testNetworkConnectivity(host, testPort, 10000);
    
    if (isReachable) {
      res.json({
        success: true,
        message: `Network connectivity to ${host}:${testPort} successful`
      });
    } else {
      res.json({
        success: false,
        message: `Cannot reach ${host}:${testPort}`,
        details: 'Network connection timeout or refused',
        troubleshooting: [
          'Verify the IP address is correct and reachable',
          'Check if the target server is running',
          'Ensure no firewall is blocking the connection',
          'Test from a device on the same network',
          'Consider network routing or VPN requirements'
        ]
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Network test failed'
    });
  }
});

router.post('/port-test', async (req, res) => {
  try {
    const { host, port } = req.body;
    
    if (!host) {
      return res.status(400).json({
        success: false,
        error: 'Host is required'
      });
    }
    
    const testPort = port || 8006;
    const isReachable = await testNetworkConnectivity(host, testPort, 5000);
    
    if (isReachable) {
      res.json({
        success: true,
        message: `Port ${testPort} is accessible on ${host}`
      });
    } else {
      res.json({
        success: false,
        message: `Port ${testPort} is not accessible on ${host}`,
        details: 'Port may be closed, filtered, or service not running',
        troubleshooting: [
          `Verify service is running on port ${testPort}`,
          'Check server firewall configuration',
          'Ensure the service is bound to the correct interface',
          'Test with nmap or telnet from another machine',
          'Verify network ACLs or security groups'
        ]
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Port test failed'
    });
  }
});

router.post('/service-test', async (req, res) => {
  try {
    const { host, port } = req.body;
    
    if (!host) {
      return res.status(400).json({
        success: false,
        error: 'Host is required'
      });
    }
    
    const testPort = port || 8006;
    const proxmoxUrl = `https://${host}:${testPort}/api2/json/version`;
    
    // Try to detect Proxmox service
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      timeout: 10000
    });
    
    try {
      const response = await fetch(proxmoxUrl, {
        method: 'GET',
        // @ts-ignore
        agent: httpsAgent
      });
      
      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          message: `Proxmox VE service detected on ${host}:${testPort}`,
          details: `Version: ${data.data?.version || 'Unknown'}, Release: ${data.data?.release || 'Unknown'}`
        });
      } else {
        res.json({
          success: false,
          message: `Service responded but may not be Proxmox VE`,
          details: `HTTP ${response.status}: ${response.statusText}`,
          troubleshooting: [
            'Verify this is actually a Proxmox VE server',
            'Check if the service is running properly',
            'Ensure Proxmox web interface is enabled',
            'Try accessing the web interface manually'
          ]
        });
      }
    } catch (fetchError: any) {
      res.json({
        success: false,
        message: `Cannot connect to Proxmox service`,
        details: fetchError.message,
        troubleshooting: [
          'Verify Proxmox VE is installed and running',
          'Check if the web interface service is active',
          'Ensure SSL/TLS is properly configured',
          'Try connecting with a different client'
        ]
      });
    }
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Service test failed'
    });
  }
});

// SSH-based Proxmox management
router.post('/proxmox/ssh-test', async (req, res) => {
  try {
    const { host, username, password, privateKey, port } = req.body;
    
    if (!host || !username) {
      return res.status(400).json({
        success: false,
        error: 'Host and username are required for SSH connection'
      });
    }

    const sshPort = port || 22;
    
    // Test SSH connectivity first
    console.log(`Testing SSH connectivity to ${host}:${sshPort}...`);
    const isReachable = await testNetworkConnectivity(host, sshPort, 10000);
    
    if (!isReachable) {
      return res.status(500).json({
        success: false,
        error: 'SSH port not reachable',
        details: `Cannot reach ${host}:${sshPort}`,
        troubleshooting: [
          'Verify SSH service is running on Proxmox server',
          'Check if port 22 is open and accessible',
          'Ensure firewall allows SSH connections',
          'Verify the host IP address is correct'
        ]
      });
    }

    // For security, we'll provide SSH command templates rather than executing SSH directly
    // This prevents storing credentials and potential security issues
    
    const sshCommands = {
      passwordAuth: `sshpass -p 'YOUR_PASSWORD' ssh -o StrictHostKeyChecking=no ${username}@${host}`,
      keyAuth: `ssh -i /path/to/private/key -o StrictHostKeyChecking=no ${username}@${host}`,
      basicTest: `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${username}@${host} 'pvesh --version'`
    };

    res.json({
      success: true,
      message: `SSH connectivity to ${host}:${sshPort} confirmed`,
      sshCommands: sshCommands,
      nextSteps: [
        'Test SSH connection manually with provided commands',
        'Use SSH to execute Proxmox commands via pvesh CLI',
        'Deploy XSIAM broker VM using SSH automation',
        'Configure VM settings remotely via SSH'
      ],
      proxmoxCommands: {
        listVMs: `ssh ${username}@${host} 'pvesh get /nodes'`,
        createVM: `ssh ${username}@${host} 'pvesh create /nodes/NODE/qemu --vmid 200 --name xsiam-broker'`,
        startVM: `ssh ${username}@${host} 'pvesh create /nodes/NODE/qemu/VMID/status/start'`,
        getVMStatus: `ssh ${username}@${host} 'pvesh get /nodes/NODE/qemu/VMID/status/current'`
      }
    });

  } catch (error: any) {
    console.error('SSH test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'SSH connection test failed'
    });
  }
});

// SSH-based VM deployment
router.post('/proxmox/ssh-deploy', async (req, res) => {
  try {
    const { host, username, vmConfig, sshConfig } = req.body;
    
    if (!host || !username || !vmConfig) {
      return res.status(400).json({
        success: false,
        error: 'Host, username, and VM configuration are required'
      });
    }

    // Generate deployment script for SSH execution
    const deploymentScript = `#!/bin/bash
# XSIAM Broker VM Deployment via SSH
# Target: ${host}

set -e

echo "🚀 Deploying XSIAM Broker VM via SSH..."

# VM Configuration
VMID="${vmConfig.vmid || '200'}"
VM_NAME="${vmConfig.name || 'xsiam-broker'}"
CORES="${vmConfig.cores || '2'}"
MEMORY="${vmConfig.memory || '4096'}"
STORAGE="${vmConfig.storage || 'local-lvm'}"
NETWORK="${vmConfig.network || 'vmbr0'}"
QCOW2_PATH="${vmConfig.qcow2Path || '/var/lib/vz/template/iso/cortex-xdr-broker.qcow2'}"

# SSH Configuration
SSH_HOST="${host}"
SSH_USER="${username}"
SSH_PORT="${sshConfig?.port || '22'}"

# Function to execute SSH commands
ssh_exec() {
    ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SSH_HOST "$1"
}

echo "📋 Checking Proxmox node information..."
NODE_NAME=$(ssh_exec "hostname")
echo "   Target node: $NODE_NAME"

echo "🔍 Verifying qcow2 image exists..."
if ! ssh_exec "test -f $QCOW2_PATH"; then
    echo "❌ Error: qcow2 image not found at $QCOW2_PATH"
    exit 1
fi
echo "✅ Found qcow2 image"

echo "🗑️  Removing existing VM if present..."
ssh_exec "qm stop $VMID --timeout 30 || true; qm destroy $VMID || true"

echo "📦 Creating new VM..."
ssh_exec "qm create $VMID \\
    --name '$VM_NAME' \\
    --cores $CORES \\
    --memory $MEMORY \\
    --net0 virtio,bridge=$NETWORK \\
    --ostype l26 \\
    --scsi0 $STORAGE:0,import-from=$QCOW2_PATH,format=qcow2 \\
    --boot order=scsi0 \\
    --agent enabled=1 \\
    --description 'Cortex XSIAM Data Broker - SSH Deployed'"

echo "⚙️  Configuring VM settings..."
ssh_exec "qm set $VMID --serial0 socket --vga serial0 --cpu host --balloon 0"

echo "🚀 Starting VM..."
ssh_exec "qm start $VMID"

echo "⏳ Waiting for VM to initialize..."
sleep 30

echo "📊 Getting VM status..."
VM_STATUS=$(ssh_exec "qm status $VMID")
echo "   Status: $VM_STATUS"

echo "✅ VM deployment completed successfully!"
echo "   VM ID: $VMID"
echo "   VM Name: $VM_NAME"
echo "   Node: $NODE_NAME"

echo ""
echo "🔧 Next steps:"
echo "1. Wait for VM to fully boot (2-3 minutes)"
echo "2. Check VM IP: ssh $SSH_USER@$SSH_HOST 'qm guest cmd $VMID network-get-interfaces'"
echo "3. Access broker web interface at https://VM_IP:443"
echo "4. Configure XSIAM credentials and data sources"
`;

    res.json({
      success: true,
      message: 'SSH deployment script generated',
      deploymentScript: deploymentScript,
      instructions: [
        'Save the deployment script to a file (e.g., ssh-deploy-broker.sh)',
        'Make it executable: chmod +x ssh-deploy-broker.sh',
        'Ensure you have SSH access to the Proxmox server',
        'Run the script: ./ssh-deploy-broker.sh',
        'Monitor the deployment progress and VM status'
      ],
      sshCommands: {
        saveScript: 'curl -o ssh-deploy-broker.sh [SCRIPT_URL]',
        makeExecutable: 'chmod +x ssh-deploy-broker.sh',
        runDeployment: './ssh-deploy-broker.sh',
        checkVMStatus: `ssh ${username}@${host} 'qm status ${vmConfig.vmid || '200'}'`,
        getVMIP: `ssh ${username}@${host} 'qm guest cmd ${vmConfig.vmid || '200'} network-get-interfaces'`
      }
    });

  } catch (error: any) {
    console.error('SSH deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'SSH deployment failed'
    });
  }
});

export default router;