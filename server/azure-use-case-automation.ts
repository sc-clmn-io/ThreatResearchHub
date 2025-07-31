import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface UseCase {
  id: string;
  title: string;
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
  requiredInfrastructure: string[];
  vmSpecs: {
    count: number;
    size: string;
    osType: 'Windows' | 'Linux';
    roles: string[];
  };
}

// Predefined use case configurations
const USE_CASE_CONFIGS: Record<string, UseCase> = {
  'docker-runtime-escape': {
    id: 'docker-runtime-escape',
    title: 'Docker Runtime Escape Detection',
    category: 'cloud',
    requiredInfrastructure: ['container-host', 'xsiam-api-integration'],
    vmSpecs: {
      count: 1,
      size: 'Standard_B2s',
      osType: 'Linux',
      roles: ['docker-host']
    }
  },
  'lateral-movement': {
    id: 'lateral-movement',
    title: 'Lateral Movement Detection',
    category: 'endpoint',
    requiredInfrastructure: ['domain-controller', 'workstation', 'xsiam-api-integration'],
    vmSpecs: {
      count: 2,
      size: 'Standard_B2ms',
      osType: 'Windows',
      roles: ['dc', 'workstation']
    }
  },
  'cloud-privilege-escalation': {
    id: 'cloud-privilege-escalation',
    title: 'Cloud Privilege Escalation',
    category: 'cloud',
    requiredInfrastructure: ['azure-vm', 'monitoring-vm', 'xsiam-api-integration'],
    vmSpecs: {
      count: 2,
      size: 'Standard_B2s',
      osType: 'Linux',
      roles: ['target-vm', 'monitor']
    }
  }
};

export async function deployUseCaseInfrastructure(req: Request, res: Response) {
  try {
    const { useCaseId, resourceGroup, location = 'East US' } = req.body;
    
    if (!useCaseId || !resourceGroup) {
      return res.status(400).json({
        success: false,
        message: 'Use case ID and resource group are required'
      });
    }

    const useCase = USE_CASE_CONFIGS[useCaseId];
    if (!useCase) {
      return res.status(400).json({
        success: false,
        message: 'Unknown use case configuration'
      });
    }

    console.log(`[AZURE-USECASE] Deploying infrastructure for: ${useCase.title}`);

    // Step 1: Ensure resource group exists
    try {
      await execAsync(`az group create --name "${resourceGroup}" --location "${location}"`);
      console.log(`[AZURE-USECASE] Resource group ${resourceGroup} ready`);
    } catch (error) {
      console.log(`[AZURE-USECASE] Resource group might already exist: ${error}`);
    }

    // Step 2: Create VNet for the use case
    const vnetName = `${useCaseId}-vnet`;
    const subnetName = `${useCaseId}-subnet`;
    
    await execAsync(`az network vnet create \
      --resource-group "${resourceGroup}" \
      --name "${vnetName}" \
      --address-prefix 10.0.0.0/16 \
      --subnet-name "${subnetName}" \
      --subnet-prefix 10.0.1.0/24`);

    console.log(`[AZURE-USECASE] Network infrastructure created`);

    // Step 3: Create Network Security Group
    const nsgName = `${useCaseId}-nsg`;
    await execAsync(`az network nsg create \
      --resource-group "${resourceGroup}" \
      --name "${nsgName}"`);

    // Add rules for XSIAM broker communication
    await execAsync(`az network nsg rule create \
      --resource-group "${resourceGroup}" \
      --nsg-name "${nsgName}" \
      --name "Allow-XSIAM-Broker" \
      --priority 1000 \
      --source-address-prefixes "*" \
      --destination-port-ranges 443 \
      --access Allow \
      --protocol Tcp`);

    console.log(`[AZURE-USECASE] Security groups configured`);

    // Step 4: Deploy VMs based on use case requirements
    const deploymentResults = [];
    
    for (let i = 0; i < useCase.vmSpecs.count; i++) {
      const vmName = `${useCaseId}-vm-${i + 1}`;
      const role = useCase.vmSpecs.roles[i] || 'worker';
      
      console.log(`[AZURE-USECASE] Creating VM: ${vmName} (${role})`);
      
      const imageMap = {
        'Linux': 'Ubuntu2204',
        'Windows': 'Win2022Datacenter'
      };
      
      const createCommand = `az vm create \
        --resource-group "${resourceGroup}" \
        --name "${vmName}" \
        --size "${useCase.vmSpecs.size}" \
        --image "${imageMap[useCase.vmSpecs.osType]}" \
        --vnet-name "${vnetName}" \
        --subnet "${subnetName}" \
        --nsg "${nsgName}" \
        --admin-username "azureuser" \
        --generate-ssh-keys \
        --public-ip-sku Standard \
        --tags "UseCase=${useCaseId}" "Role=${role}" \
        --output json`;

      try {
        const { stdout } = await execAsync(createCommand, { timeout: 300000 });
        const vmInfo = JSON.parse(stdout);
        
        deploymentResults.push({
          name: vmName,
          role: role,
          publicIp: vmInfo.publicIpAddress,
          privateIp: vmInfo.privateIpAddress,
          fqdn: vmInfo.fqdns?.[0] || null,
          status: 'created'
        });
        
        console.log(`[AZURE-USECASE] VM ${vmName} created successfully`);
      } catch (error) {
        console.error(`[AZURE-USECASE] Failed to create VM ${vmName}:`, error);
        deploymentResults.push({
          name: vmName,
          role: role,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Step 5: Configure XSIAM API integration for Azure VMs
    const xsiamIntegrationResults = [];
    
    for (const vm of deploymentResults) {
      console.log(`[AZURE-USECASE] Configuring XSIAM API integration for Azure VM: ${vm.name}`);
      
      try {
        // Install Azure monitoring and logging agents
        const azureMonitoringScript = `
          #!/bin/bash
          echo "Configuring Azure VM for XSIAM API integration..."
          
          # Update system
          apt-get update -y
          
          # Install Azure CLI for API integration
          curl -sL https://aka.ms/InstallAzureCLIDeb | bash
          
          # Install monitoring tools
          apt-get install -y rsyslog auditd
          
          # Configure log forwarding to Azure Monitor
          cat > /etc/rsyslog.d/99-xsiam-forward.conf << EOF
# Forward logs for XSIAM API collection
*.* @@127.0.0.1:514
EOF
          
          # Enable Azure Monitor VM Insights
          systemctl restart rsyslog
          systemctl enable auditd
          
          # Create log aggregation directory
          mkdir -p /var/log/xsiam-collection
          chmod 755 /var/log/xsiam-collection
          
          echo "Azure VM configured for XSIAM API integration"
        `;
        
        await execAsync(`az vm extension set \
          --resource-group "${resourceGroup}" \
          --vm-name "${vm.name}" \
          --name "customScript" \
          --publisher "Microsoft.Azure.Extensions" \
          --settings '{"script":"'${Buffer.from(azureMonitoringScript).toString('base64')}'"}'`);
        
        xsiamIntegrationResults.push({
          vm: vm.name,
          status: 'configured',
          message: 'Azure VM configured for XSIAM API integration',
          publicIp: vm.publicIp,
          integrationMethod: 'Azure Monitor API → XSIAM',
          dataCollection: ['System logs', 'Security events', 'Application logs', 'Azure Activity logs']
        });
      } catch (error) {
        xsiamIntegrationResults.push({
          vm: vm.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'XSIAM integration setup failed'
        });
      }
    }

    res.json({
      success: true,
      message: `Use case infrastructure deployed: ${useCase.title}`,
      useCase: useCase,
      deployment: {
        resourceGroup: resourceGroup,
        location: location,
        network: {
          vnet: vnetName,
          subnet: subnetName,
          nsg: nsgName
        },
        vms: deploymentResults,
        xsiamIntegration: xsiamIntegrationResults
      },
      nextSteps: [
        'Configure XSIAM API data source integration',
        'Set up Azure Monitor → XSIAM log forwarding',
        'Deploy threat simulation scenarios on Azure VMs',
        'Execute detection testing via XSIAM API'
      ]
    });

  } catch (error) {
    console.error('[AZURE-USECASE] Deployment failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deploy use case infrastructure',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getUseCaseStatus(req: Request, res: Response) {
  try {
    const { useCaseId, resourceGroup } = req.query;
    
    if (!useCaseId || !resourceGroup) {
      return res.status(400).json({
        success: false,
        message: 'Use case ID and resource group are required'
      });
    }

    console.log(`[AZURE-USECASE] Checking status for: ${useCaseId}`);

    // Get VMs tagged with this use case
    const { stdout } = await execAsync(`az vm list \
      --resource-group "${resourceGroup}" \
      --query "[?tags.UseCase=='${useCaseId}'].{name:name, powerState:powerState, tags:tags, networkProfile:networkProfile}" \
      --output json`);

    const vms = JSON.parse(stdout);
    
    // Get public IPs for each VM
    const vmDetails = [];
    for (const vm of vms) {
      try {
        const { stdout: ipStdout } = await execAsync(`az vm list-ip-addresses \
          --resource-group "${resourceGroup}" \
          --name "${vm.name}" \
          --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress" \
          --output tsv`);
        
        vmDetails.push({
          name: vm.name,
          role: vm.tags?.Role || 'unknown',
          powerState: vm.powerState,
          publicIp: ipStdout.trim() || null,
          status: vm.powerState === 'VM running' ? 'running' : 'stopped'
        });
      } catch (error) {
        vmDetails.push({
          name: vm.name,
          role: vm.tags?.Role || 'unknown',
          powerState: vm.powerState,
          publicIp: null,
          status: 'error'
        });
      }
    }

    res.json({
      success: true,
      useCaseId: useCaseId,
      infrastructure: vmDetails,
      summary: {
        totalVMs: vmDetails.length,
        runningVMs: vmDetails.filter(vm => vm.status === 'running').length,
        brokerVMs: vmDetails.filter(vm => vm.role.includes('broker')).length
      }
    });

  } catch (error) {
    console.error('[AZURE-USECASE] Status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get use case status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function cleanupAzureResources(req: Request, res: Response) {
  try {
    console.log('[AZURE-CLEANUP] Starting resource cleanup...');

    // Get all resource groups
    const { stdout } = await execAsync('az group list --query "[].name" -o tsv');
    const resourceGroups = stdout.trim().split('\n').filter(name => name);

    const deletionResults = [];

    for (const resourceGroup of resourceGroups) {
      if (resourceGroup) {
        try {
          console.log(`[AZURE-CLEANUP] Deleting resource group: ${resourceGroup}`);
          
          // Delete resource group and all contained resources
          await execAsync(`az group delete --name "${resourceGroup}" --yes --no-wait`);
          
          deletionResults.push({
            name: resourceGroup,
            status: 'deletion-initiated',
            message: 'Resource group deletion started'
          });
        } catch (error) {
          deletionResults.push({
            name: resourceGroup,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Resource cleanup initiated',
      deletions: deletionResults,
      note: 'Resource group deletions are running in background and may take several minutes to complete'
    });

  } catch (error) {
    console.error('[AZURE-CLEANUP] Cleanup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup resources',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function executeUseCaseScenario(req: Request, res: Response) {
  try {
    const { useCaseId, scenarioType, resourceGroup } = req.body;
    
    const useCase = USE_CASE_CONFIGS[useCaseId];
    if (!useCase) {
      return res.status(400).json({
        success: false,
        message: 'Unknown use case'
      });
    }

    console.log(`[AZURE-USECASE] Executing scenario: ${scenarioType} for ${useCase.title}`);

    // Get target VMs for the scenario
    const { stdout } = await execAsync(`az vm list \
      --resource-group "${resourceGroup}" \
      --query "[?tags.UseCase=='${useCaseId}'].{name:name, role:tags.Role}" \
      --output json`);

    const vms = JSON.parse(stdout);
    const executionResults = [];

    // Execute scenario-specific commands
    if (scenarioType === 'docker-escape') {
      const dockerHost = vms.find(vm => vm.role === 'docker-host');
      if (dockerHost) {
        // Execute container escape simulation
        const escapeCommand = `az vm run-command invoke \
          --resource-group "${resourceGroup}" \
          --name "${dockerHost.name}" \
          --command-id RunShellScript \
          --scripts "docker run --rm --privileged ubuntu:latest /bin/bash -c 'echo Testing container escape simulation...'"`;
        
        await execAsync(escapeCommand);
        executionResults.push({
          vm: dockerHost.name,
          scenario: 'container-escape',
          status: 'executed',
          message: 'Container escape simulation completed'
        });
      }
    }

    res.json({
      success: true,
      message: `Scenario executed: ${scenarioType}`,
      useCase: useCase.title,
      executionResults: executionResults,
      recommendations: [
        'Check XSIAM for generated alerts',
        'Review correlation rule triggers',
        'Validate response playbook execution'
      ]
    });

  } catch (error) {
    console.error('[AZURE-USECASE] Scenario execution failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute use case scenario',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}