import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ThreatInfrastructureMapping {
  threatCategory: string;
  attackVectors: string[];
  requiredInfrastructure: {
    azure: AzureInfraConfig;
    proxmox: ProxmoxInfraConfig;
  };
  dataSourceRequirements: string[];
  estimatedDeployTime: string;
  complexityLevel: 'simple' | 'medium' | 'advanced';
}

export interface AzureInfraConfig {
  vms: {
    count: number;
    sizes: string[];
    operatingSystems: string[];
    networkConfig: string;
  };
  services: string[];
  estimatedCost: {
    setup: string;
    hourly: string;
  };
}

export interface ProxmoxInfraConfig {
  vms: {
    count: number;
    templates: string[];
    specs: {
      memory: number;
      cores: number;
      storage: string;
    }[];
    networkConfig: string;
  };
  brokerConfig: boolean;
  logForwarding: string[];
}

export class ThreatInfrastructureMapper {
  private static instance: ThreatInfrastructureMapper;

  public static getInstance(): ThreatInfrastructureMapper {
    if (!ThreatInfrastructureMapper.instance) {
      ThreatInfrastructureMapper.instance = new ThreatInfrastructureMapper();
    }
    return ThreatInfrastructureMapper.instance;
  }

  // Threat infrastructure mappings for common attack scenarios
  private threatMappings: Record<string, ThreatInfrastructureMapping> = {
    'docker-runtime-escape': {
      threatCategory: 'Container Security',
      attackVectors: ['Container Escape', 'Privilege Escalation', 'Host Access'],
      requiredInfrastructure: {
        azure: {
          vms: {
            count: 2,
            sizes: ['Standard_B2s', 'Standard_B4ms'],
            operatingSystems: ['Ubuntu 20.04', 'Windows Server 2019'],
            networkConfig: 'isolated-subnet'
          },
          services: ['Container Registry', 'Log Analytics', 'Security Center'],
          estimatedCost: {
            setup: '$50',
            hourly: '$2.40'
          }
        },
        proxmox: {
          vms: {
            count: 3,
            templates: ['ubuntu-docker', 'monitoring-vm', 'attacker-vm'],
            specs: [
              { memory: 4096, cores: 2, storage: '20GB' },
              { memory: 2048, cores: 1, storage: '10GB' },
              { memory: 2048, cores: 1, storage: '15GB' }
            ],
            networkConfig: 'isolated-vlan'
          },
          brokerConfig: true,
          logForwarding: ['docker-logs', 'system-logs', 'audit-logs']
        }
      },
      dataSourceRequirements: ['Docker Events', 'System Logs', 'Process Events', 'Network Connections'],
      estimatedDeployTime: '15-20 minutes',
      complexityLevel: 'medium'
    },
    
    'lateral-movement': {
      threatCategory: 'Network Security',
      attackVectors: ['SMB Exploitation', 'Credential Harvesting', 'Network Discovery'],
      requiredInfrastructure: {
        azure: {
          vms: {
            count: 4,
            sizes: ['Standard_B2s', 'Standard_B2s', 'Standard_B1s', 'Standard_B1s'],
            operatingSystems: ['Windows Server 2019', 'Windows 10', 'Ubuntu 20.04', 'Windows Server 2016'],
            networkConfig: 'domain-environment'
          },
          services: ['Active Directory', 'Network Watcher', 'Log Analytics'],
          estimatedCost: {
            setup: '$80',
            hourly: '$3.20'
          }
        },
        proxmox: {
          vms: {
            count: 5,
            templates: ['windows-dc', 'windows-workstation', 'linux-server', 'attacker-kali', 'monitoring'],
            specs: [
              { memory: 4096, cores: 2, storage: '40GB' },
              { memory: 2048, cores: 2, storage: '30GB' },
              { memory: 2048, cores: 1, storage: '20GB' },
              { memory: 2048, cores: 2, storage: '25GB' },
              { memory: 1024, cores: 1, storage: '10GB' }
            ],
            networkConfig: 'domain-network'
          },
          brokerConfig: true,
          logForwarding: ['windows-events', 'smb-logs', 'network-flows', 'authentication-logs']
        }
      },
      dataSourceRequirements: ['Windows Event Logs', 'SMB Activity', 'Network Flows', 'Authentication Events'],
      estimatedDeployTime: '25-30 minutes',
      complexityLevel: 'advanced'
    },

    'cloud-privilege-escalation': {
      threatCategory: 'Cloud Security',
      attackVectors: ['IAM Misconfiguration', 'Service Account Abuse', 'Resource Hijacking'],
      requiredInfrastructure: {
        azure: {
          vms: {
            count: 3,
            sizes: ['Standard_B2s', 'Standard_B1s', 'Standard_B1s'],
            operatingSystems: ['Ubuntu 20.04', 'Windows Server 2019', 'Ubuntu 20.04'],
            networkConfig: 'multi-subscription'
          },
          services: ['Key Vault', 'Storage Account', 'Function Apps', 'Monitor'],
          estimatedCost: {
            setup: '$60',
            hourly: '$2.80'
          }
        },
        proxmox: {
          vms: {
            count: 3,
            templates: ['cloud-workstation', 'api-server', 'monitoring'],
            specs: [
              { memory: 2048, cores: 2, storage: '25GB' },
              { memory: 1024, cores: 1, storage: '15GB' },
              { memory: 1024, cores: 1, storage: '10GB' }
            ],
            networkConfig: 'cloud-simulation'
          },
          brokerConfig: true,
          logForwarding: ['api-logs', 'authentication-logs', 'resource-access']
        }
      },
      dataSourceRequirements: ['Azure Activity Logs', 'API Access Logs', 'Resource Manager Events'],
      estimatedDeployTime: '20-25 minutes',
      complexityLevel: 'medium'
    },

    'phishing-attack-response': {
      threatCategory: 'Email Security',
      attackVectors: ['Email Delivery', 'Credential Harvesting', 'Malware Execution'],
      requiredInfrastructure: {
        azure: {
          vms: {
            count: 3,
            sizes: ['Standard_B2s', 'Standard_B2s', 'Standard_B1s'],
            operatingSystems: ['Windows 10', 'Windows Server 2019', 'Ubuntu 20.04'],
            networkConfig: 'email-environment'
          },
          services: ['Exchange Online', 'Defender for Office 365', 'Sentinel'],
          estimatedCost: {
            setup: '$40',
            hourly: '$2.00'
          }
        },
        proxmox: {
          vms: {
            count: 4,
            templates: ['windows-client', 'mail-server', 'web-server', 'monitoring'],
            specs: [
              { memory: 2048, cores: 2, storage: '30GB' },
              { memory: 2048, cores: 1, storage: '20GB' },
              { memory: 1024, cores: 1, storage: '15GB' },
              { memory: 1024, cores: 1, storage: '10GB' }
            ],
            networkConfig: 'email-lab'
          },
          brokerConfig: true,
          logForwarding: ['email-logs', 'web-logs', 'process-events', 'network-connections']
        }
      },
      dataSourceRequirements: ['Email Flow Logs', 'Web Proxy Logs', 'Process Creation', 'File Access'],
      estimatedDeployTime: '15-20 minutes',
      complexityLevel: 'simple'
    }
  };

  async generateInfrastructureForThreat(threatScenario: string): Promise<ThreatInfrastructureMapping | null> {
    // Normalize threat scenario to match mapping keys
    const normalizedScenario = this.normalizeThreatScenario(threatScenario);
    
    if (this.threatMappings[normalizedScenario]) {
      return this.threatMappings[normalizedScenario];
    }

    // If no direct mapping, analyze threat and generate dynamic mapping
    return this.generateDynamicMapping(threatScenario);
  }

  private normalizeThreatScenario(scenario: string): string {
    const normalized = scenario.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    // Map common variations to standard keys
    const mappings: Record<string, string> = {
      'container-escape': 'docker-runtime-escape',
      'docker-escape': 'docker-runtime-escape',
      'runtime-escape': 'docker-runtime-escape',
      'lateral-movement': 'lateral-movement',
      'privilege-escalation': 'cloud-privilege-escalation',
      'cloud-escalation': 'cloud-privilege-escalation',
      'phishing': 'phishing-attack-response',
      'email-attack': 'phishing-attack-response'
    };

    return mappings[normalized] || normalized;
  }

  private async generateDynamicMapping(threatScenario: string): Promise<ThreatInfrastructureMapping> {
    // Default mapping for unknown threats
    return {
      threatCategory: 'Custom Threat',
      attackVectors: ['Unknown Vector'],
      requiredInfrastructure: {
        azure: {
          vms: {
            count: 2,
            sizes: ['Standard_B2s', 'Standard_B1s'],
            operatingSystems: ['Ubuntu 20.04', 'Windows Server 2019'],
            networkConfig: 'standard-subnet'
          },
          services: ['Log Analytics', 'Security Center'],
          estimatedCost: {
            setup: '$30',
            hourly: '$1.60'
          }
        },
        proxmox: {
          vms: {
            count: 2,
            templates: ['generic-vm', 'monitoring'],
            specs: [
              { memory: 2048, cores: 2, storage: '20GB' },
              { memory: 1024, cores: 1, storage: '10GB' }
            ],
            networkConfig: 'isolated-network'
          },
          brokerConfig: true,
          logForwarding: ['system-logs', 'security-logs']
        }
      },
      dataSourceRequirements: ['System Events', 'Security Logs'],
      estimatedDeployTime: '10-15 minutes',
      complexityLevel: 'simple'
    };
  }

  async deployProxmoxInfrastructure(mapping: ThreatInfrastructureMapping, baseName: string): Promise<{
    success: boolean;
    vmIds: number[];
    message: string;
  }> {
    try {
      const vmIds: number[] = [];
      const { vms } = mapping.requiredInfrastructure.proxmox;

      for (let i = 0; i < vms.count; i++) {
        const vmId = 300 + i; // Start from 300 for threat scenario VMs
        const vmName = `${baseName}-vm-${i + 1}`;
        const spec = vms.specs[i] || vms.specs[0];

        // Create VM with specified configuration
        await this.createProxmoxVM(vmId, vmName, spec);
        vmIds.push(vmId);
      }

      return {
        success: true,
        vmIds,
        message: `Successfully deployed ${vms.count} VMs for ${mapping.threatCategory}`
      };
    } catch (error) {
      return {
        success: false,
        vmIds: [],
        message: `Failed to deploy infrastructure: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async createProxmoxVM(vmId: number, name: string, spec: { memory: number; cores: number; storage: string }) {
    const command = `qm create ${vmId} --name ${name} --memory ${spec.memory} --cores ${spec.cores} --net0 virtio,bridge=vmbr0`;
    await execAsync(command);
  }

  getThreatMappings(): Record<string, ThreatInfrastructureMapping> {
    return this.threatMappings;
  }

  getAvailableThreats(): string[] {
    return Object.keys(this.threatMappings);
  }
}

export const threatInfrastructureMapper = ThreatInfrastructureMapper.getInstance();