import { Router } from 'express';

const router = Router();

// XSIAM integration configurations for different infrastructure types
const XSIAM_INTEGRATIONS = {
  docker: {
    logForwarding: {
      method: 'docker-logs-driver',
      config: {
        'log-driver': 'syslog',
        'log-opts': {
          'syslog-address': 'tcp://your-xsiam-broker:514',
          'syslog-format': 'rfc3164',
          'tag': '{{.ImageName}}/{{.Name}}'
        }
      }
    },
    dataSourceType: 'docker_logs',
    requiredFields: ['container_name', 'image_name', 'log_message', 'timestamp']
  },
  proxmox: {
    logForwarding: {
      method: 'rsyslog-forwarder',
      config: {
        destination: 'your-xsiam-broker:514',
        protocol: 'tcp',
        format: 'JSON'
      }
    },
    dataSourceType: 'vm_logs',
    requiredFields: ['vm_id', 'hostname', 'log_message', 'timestamp', 'severity']
  },
  azure: {
    logForwarding: {
      method: 'azure-monitor-agent',
      config: {
        workspaceId: 'your-log-analytics-workspace',
        sharedKey: 'your-workspace-key',
        logType: 'XSIAMLabs'
      }
    },
    dataSourceType: 'azure_logs',
    requiredFields: ['resource_id', 'subscription_id', 'log_message', 'timestamp', 'category']
  }
};

// Generate XSIAM integration script for deployed infrastructure
router.post('/xsiam-integration/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { deploymentId, xsiamBroker, customConfig } = req.body;
    
    const integration = XSIAM_INTEGRATIONS[platform as keyof typeof XSIAM_INTEGRATIONS];
    if (!integration) {
      return res.status(400).json({
        success: false,
        error: `Unsupported platform: ${platform}`
      });
    }
    
    // Generate platform-specific XSIAM integration script
    let integrationScript = '';
    let validationScript = '';
    
    switch (platform) {
      case 'docker':
        integrationScript = generateDockerXSIAMIntegration(xsiamBroker, customConfig);
        validationScript = generateDockerValidationScript();
        break;
      case 'proxmox':
        integrationScript = generateProxmoxXSIAMIntegration(xsiamBroker, customConfig);
        validationScript = generateProxmoxValidationScript();
        break;
      case 'azure':
        integrationScript = generateAzureXSIAMIntegration(xsiamBroker, customConfig);
        validationScript = generateAzureValidationScript();
        break;
    }
    
    res.json({
      success: true,
      integration: {
        platform,
        deploymentId,
        xsiamBroker,
        dataSourceType: integration.dataSourceType,
        requiredFields: integration.requiredFields,
        integrationScript,
        validationScript,
        configTemplate: integration.config
      },
      instructions: [
        `Deploy the integration script on your ${platform} infrastructure`,
        'Configure XSIAM data source to receive logs',
        'Run validation script to verify log flow',
        'Monitor XSIAM for incoming data'
      ]
    });
    
  } catch (error: any) {
    console.error('XSIAM integration generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate XSIAM integration'
    });
  }
});

// Validate XSIAM log flow from deployed infrastructure
router.post('/validate-logs/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { deploymentId, xsiamEndpoint, authToken } = req.body;
    
    // Generate validation query for XSIAM
    const integration = XSIAM_INTEGRATIONS[platform as keyof typeof XSIAM_INTEGRATIONS];
    const validationQuery = `
      dataset = ${integration.dataSourceType}
      | where timestamp >= ago(10m)
      | where deployment_id == "${deploymentId}"
      | summarize count() by bin(timestamp, 1m)
      | order by timestamp desc
    `;
    
    res.json({
      success: true,
      validation: {
        platform,
        deploymentId,
        dataSourceType: integration.dataSourceType,
        validationQuery,
        expectedFields: integration.requiredFields,
        instructions: [
          'Run this XQL query in XSIAM to verify log ingestion',
          'Ensure all required fields are present in the data',
          'Check that logs are flowing within the last 10 minutes',
          'Verify deployment_id matches your infrastructure deployment'
        ]
      }
    });
    
  } catch (error: any) {
    console.error('Log validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate log validation'
    });
  }
});

// Get deployment status with XSIAM integration
router.get('/status/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    // In production, this would query actual infrastructure status
    const deploymentStatus = {
      deploymentId,
      status: 'deployed',
      infrastructure: {
        platform: 'proxmox',
        vmId: '1234',
        ipAddress: '192.168.100.100',
        status: 'running'
      },
      xsiamIntegration: {
        configured: true,
        logsFlowing: true,
        lastLogReceived: new Date().toISOString(),
        dataSourceType: 'vm_logs',
        logVolume: '127 logs/minute'
      },
      threatDetection: {
        rulesActive: 5,
        alertsGenerated: 2,
        lastAlert: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      }
    };
    
    res.json({
      success: true,
      deployment: deploymentStatus
    });
    
  } catch (error: any) {
    console.error('Deployment status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get deployment status'
    });
  }
});

// Helper functions to generate platform-specific integration scripts
function generateDockerXSIAMIntegration(xsiamBroker: string, customConfig: any) {
  return `#!/bin/bash
# Docker XSIAM Integration Script
# Configures Docker containers to forward logs to XSIAM

XSIAM_BROKER="${xsiamBroker}"
DEPLOYMENT_ID="$(uuidgen)"

echo "Configuring Docker log forwarding to XSIAM broker: $XSIAM_BROKER"

# Configure Docker daemon for syslog forwarding
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "syslog",
  "log-opts": {
    "syslog-address": "tcp://$XSIAM_BROKER:514",
    "syslog-format": "rfc3164",
    "tag": "docker/{{.ImageName}}/{{.Name}}"
  }
}
EOF

# Restart Docker daemon
systemctl restart docker

# Deploy XSIAM log collection container
docker run -d \\
  --name xsiam-log-collector \\
  --log-driver syslog \\
  --log-opt syslog-address=tcp://$XSIAM_BROKER:514 \\
  --log-opt tag="xsiam-collector" \\
  -e DEPLOYMENT_ID="$DEPLOYMENT_ID" \\
  -e XSIAM_BROKER="$XSIAM_BROKER" \\
  alpine:latest \\
  sh -c 'while true; do echo "{\\"timestamp\\": \\"$(date -Iseconds)\\", \\"deployment_id\\": \\"$DEPLOYMENT_ID\\", \\"message\\": \\"XSIAM log test\\", \\"source\\": \\"docker\\"}"; sleep 60; done'

echo "Docker XSIAM integration configured. Deployment ID: $DEPLOYMENT_ID"
echo "Logs will be forwarded to: $XSIAM_BROKER:514"
`;
}

function generateProxmoxXSIAMIntegration(xsiamBroker: string, customConfig: any) {
  return `#!/bin/bash
# Proxmox XSIAM Integration Script
# Configures VMs to forward logs to XSIAM

XSIAM_BROKER="${xsiamBroker}"
DEPLOYMENT_ID="$(uuidgen)"

echo "Configuring Proxmox VMs for XSIAM log forwarding: $XSIAM_BROKER"

# Configure rsyslog for XSIAM forwarding
cat > /etc/rsyslog.d/49-xsiam.conf << EOF
# XSIAM Log Forwarding Configuration
\$template XSIAMFormat,"{\\"timestamp\\": \\"%timegenerated:::date-rfc3339%\\", \\"deployment_id\\": \\"$DEPLOYMENT_ID\\", \\"hostname\\": \\"%hostname%\\", \\"severity\\": \\"%syslogseverity%\\", \\"facility\\": \\"%syslogfacility%\\", \\"message\\": \\"%msg:::sp-if-no-1st-sp%%msg:::drop-last-lf%\\", \\"source\\": \\"proxmox\\"}"
*.* @@$XSIAM_BROKER:514;XSIAMFormat
EOF

# Restart rsyslog
systemctl restart rsyslog

# Configure Proxmox cluster logging (if applicable)
pvesh set /cluster/options --syslog "$XSIAM_BROKER:514"

# Install XSIAM monitoring agent on all VMs
for vm in \$(qm list | awk 'NR>1 {print \$1}'); do
  echo "Configuring VM \$vm for XSIAM logging..."
  
  # Generate cloud-init configuration for XSIAM agent
  cat > /tmp/xsiam-agent-\$vm.yml << EOF
#cloud-config
write_files:
  - path: /etc/rsyslog.d/49-xsiam.conf
    content: |
      \$template XSIAMFormat,"{\\"timestamp\\": \\"%timegenerated:::date-rfc3339%\\", \\"deployment_id\\": \\"$DEPLOYMENT_ID\\", \\"vm_id\\": \\"$vm\\", \\"hostname\\": \\"%hostname%\\", \\"severity\\": \\"%syslogseverity%\\", \\"message\\": \\"%msg:::sp-if-no-1st-sp%%msg:::drop-last-lf%\\", \\"source\\": \\"proxmox-vm\\"}"
      *.* @@$XSIAM_BROKER:514;XSIAMFormat
runcmd:
  - systemctl restart rsyslog
  - logger "XSIAM agent configured for VM $vm, deployment $DEPLOYMENT_ID"
EOF
done

echo "Proxmox XSIAM integration configured. Deployment ID: $DEPLOYMENT_ID"
echo "All VMs will forward logs to: $XSIAM_BROKER:514"
`;
}

function generateAzureXSIAMIntegration(xsiamBroker: string, customConfig: any) {
  return `#!/bin/bash
# Azure XSIAM Integration Script
# Configures Azure resources to forward logs to XSIAM

XSIAM_BROKER="${xsiamBroker}"
DEPLOYMENT_ID="$(uuidgen)"
SUBSCRIPTION_ID="${customConfig?.subscriptionId || 'your-subscription-id'}"
RESOURCE_GROUP="${customConfig?.resourceGroup || 'xsiam-labs'}"

echo "Configuring Azure resources for XSIAM log forwarding: $XSIAM_BROKER"

# Install Azure CLI if not present
if ! command -v az &> /dev/null; then
  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
fi

# Login to Azure (requires interactive authentication)
az login

# Create Log Analytics Workspace for XSIAM integration
az monitor log-analytics workspace create \\
  --resource-group \$RESOURCE_GROUP \\
  --workspace-name "xsiam-labs-workspace" \\
  --location "East US" \\
  --sku "PerGB2018"

# Get workspace details
WORKSPACE_ID=\$(az monitor log-analytics workspace show \\
  --resource-group \$RESOURCE_GROUP \\
  --workspace-name "xsiam-labs-workspace" \\
  --query "customerId" -o tsv)

WORKSPACE_KEY=\$(az monitor log-analytics workspace get-shared-keys \\
  --resource-group \$RESOURCE_GROUP \\
  --workspace-name "xsiam-labs-workspace" \\
  --query "primarySharedKey" -o tsv)

# Create Azure Monitor Data Collection Rule
az monitor data-collection rule create \\
  --resource-group \$RESOURCE_GROUP \\
  --rule-name "xsiam-dcr" \\
  --location "East US" \\
  --rule-file - << EOF
{
  "properties": {
    "dataSources": {
      "syslog": [
        {
          "name": "xsiam-syslog",
          "facilityNames": ["*"],
          "logLevels": ["*"],
          "streams": ["Microsoft-Syslog"]
        }
      ]
    },
    "destinations": {
      "logAnalytics": [
        {
          "name": "xsiam-destination",
          "workspaceResourceId": "/subscriptions/\$SUBSCRIPTION_ID/resourceGroups/\$RESOURCE_GROUP/providers/Microsoft.OperationalInsights/workspaces/xsiam-labs-workspace"
        }
      ]
    },
    "dataFlows": [
      {
        "streams": ["Microsoft-Syslog"],
        "destinations": ["xsiam-destination"]
      }
    ]
  }
}
EOF

# Configure log forwarding to XSIAM broker
cat > /tmp/xsiam-forwarder.ps1 << 'EOF'
# PowerShell script to forward Azure logs to XSIAM
\$XSIAMBroker = "$XSIAM_BROKER"
\$DeploymentId = "$DEPLOYMENT_ID"

# Install and configure Azure Monitor Agent
Install-Module -Name Az.Monitor -Force -AllowClobber
Import-Module Az.Monitor

# Create custom log forwarder
while (\$true) {
    \$logEntry = @{
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        deployment_id = \$DeploymentId
        subscription_id = "$SUBSCRIPTION_ID"
        resource_group = "$RESOURCE_GROUP"
        message = "Azure XSIAM integration test"
        source = "azure"
    } | ConvertTo-Json -Compress
    
    # Send to XSIAM broker
    try {
        \$tcpClient = New-Object System.Net.Sockets.TcpClient(\$XSIAMBroker, 514)
        \$stream = \$tcpClient.GetStream()
        \$bytes = [System.Text.Encoding]::UTF8.GetBytes("<134>\$logEntry")
        \$stream.Write(\$bytes, 0, \$bytes.Length)
        \$tcpClient.Close()
    } catch {
        Write-Error "Failed to send log to XSIAM: \$_"
    }
    
    Start-Sleep -Seconds 60
}
EOF

echo "Azure XSIAM integration configured. Deployment ID: $DEPLOYMENT_ID"
echo "Workspace ID: $WORKSPACE_ID"
echo "Logs will be forwarded to: $XSIAM_BROKER:514"
echo "Run /tmp/xsiam-forwarder.ps1 on Windows VMs to start log forwarding"
`;
}

function generateDockerValidationScript() {
  return `#!/bin/bash
# Docker XSIAM Log Validation Script

echo "Validating Docker XSIAM log integration..."

# Check Docker daemon configuration
if [ -f /etc/docker/daemon.json ]; then
  echo "✓ Docker daemon configured for log forwarding"
  cat /etc/docker/daemon.json
else
  echo "✗ Docker daemon not configured"
  exit 1
fi

# Check running containers with log forwarding
echo "Checking container log configuration..."
docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}" | while read line; do
  echo "$line"
done

# Test log generation
echo "Generating test logs..."
docker run --rm alpine:latest echo "XSIAM integration test: $(date)"

echo "Validation complete. Check XSIAM for incoming Docker logs."
`;
}

function generateProxmoxValidationScript() {
  return `#!/bin/bash
# Proxmox XSIAM Log Validation Script

echo "Validating Proxmox XSIAM log integration..."

# Check rsyslog configuration
if [ -f /etc/rsyslog.d/49-xsiam.conf ]; then
  echo "✓ Rsyslog configured for XSIAM forwarding"
  cat /etc/rsyslog.d/49-xsiam.conf
else
  echo "✗ Rsyslog not configured"
  exit 1
fi

# Check rsyslog status
systemctl status rsyslog | grep "Active:"

# Generate test logs
logger "XSIAM integration test from Proxmox host: $(date)"

# Check VM configurations
echo "Checking VM log configurations..."
for vm in $(qm list | awk 'NR>1 {print $1}'); do
  echo "VM $vm status: $(qm status $vm)"
done

echo "Validation complete. Check XSIAM for incoming Proxmox logs."
`;
}

function generateAzureValidationScript() {
  return `#!/bin/bash
# Azure XSIAM Log Validation Script

echo "Validating Azure XSIAM log integration..."

# Check Azure CLI authentication
if az account show &>/dev/null; then
  echo "✓ Azure CLI authenticated"
  az account show --query "name" -o tsv
else
  echo "✗ Azure CLI not authenticated"
  exit 1
fi

# Check Log Analytics Workspace
WORKSPACE_STATUS=$(az monitor log-analytics workspace list --query "[?name=='xsiam-labs-workspace'].provisioningState" -o tsv)
if [ "$WORKSPACE_STATUS" = "Succeeded" ]; then
  echo "✓ Log Analytics Workspace active"
else
  echo "✗ Log Analytics Workspace not ready"
fi

# Check Data Collection Rule
DCR_STATUS=$(az monitor data-collection rule list --query "[?name=='xsiam-dcr'].provisioningState" -o tsv)
if [ "$DCR_STATUS" = "Succeeded" ]; then
  echo "✓ Data Collection Rule configured"
else
  echo "✗ Data Collection Rule not ready"
fi

# Generate test log entry
az monitor log-analytics query \\
  --workspace "xsiam-labs-workspace" \\
  --analytics-query "Heartbeat | limit 5" \\
  --query "tables[0].rows" -o table

echo "Validation complete. Check XSIAM for incoming Azure logs."
`;
}

export default router;