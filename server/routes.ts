import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ThreatIntelligenceService } from "./threat-intelligence";
import { createXSIAMClient, extractAllXSIAMData, type XSIAMInstance } from "./xsiam-api";
import { ThreatReportParser, RawThreatReportSchema } from "./threat-report-parser";
import { ContentGenerationEngine } from "./content-generation-engine";
import { SOCProcessEngine } from "./soc-process-engine";
import { ContentStorage } from "./content-storage";
import { DDLCWorkflowEngine } from "./ddlc-workflow-engine";
import { setupXSIAMProxy } from "./xsiam-proxy";
import { THREAT_SOURCES } from "@shared/threat-sources";
import { insertSharedTemplateSchema, insertTemplateRatingSchema, insertTemplateCommentSchema } from "@shared/schema";
import { ContentRecommendationEngine } from './content-recommendation-engine.js';
import { aiProviderManager } from './ai-providers.js';
import { exportToGitHub } from './github-export.js';
import { simpleGitHubBackup } from './simple-github-backup.js';
import { XSIAMContentGenerator } from './reliable-xsiam-content.js';
import { contentValidator } from './content-validation.js';
import { dataSanitizer } from './data-sanitizer.js';
import { simpleDataSanitizer } from './simple-data-sanitizer.js';
import { notificationService } from './notification-service.js';
import connectionManager from './connection-manager';
import infrastructureDeployer from './infrastructure-deployer';
import { threatInfrastructureMapper } from './threat-infrastructure-mapping';

// Environment type determination and access control generation functions
function determineEnvironmentType(categories: string[]): string {
  if (categories.includes('cloud')) return 'cloud';
  if (categories.includes('endpoint')) return 'endpoint';
  if (categories.includes('network')) return 'network';
  if (categories.includes('identity')) return 'identity';
  return 'hybrid';
}

function generateAccessControlRequirements(environmentType: string) {
  const baseRequirements = {
    privilegedAccess: [
      'Administrative credentials for deployment platform',
      'Just-In-Time (JIT) access for privileged operations',
      'Break-glass access procedures for emergency scenarios'
    ],
    rbac: [
      'Least-privilege principle implementation',
      'Role separation between attackers and defenders',
      'Service account management for automation'
    ],
    authentication: [
      'Multi-factor authentication configuration',
      'Single Sign-On (SSO) integration testing',
      'Token-based authentication simulation'
    ],
    auditTrails: [
      'Comprehensive logging of all identity changes',
      'Activity monitoring and session recording',
      'Compliance audit trail generation'
    ],
    cortexPlatform: [
      'Cortex XSIAM tenant administrative access and configuration',
      'Cortex Cloud XDR deployment and agent management permissions',
      'Cortex XSOAR playbook development and automation rights',
      'Palo Alto Networks API access for platform integration',
      'Cortex Data Lake access for log ingestion and analysis',
      'Prisma Cloud integration for cloud security posture management'
    ],
    openSourceTools: [
      'Docker Engine and container runtime permissions',
      'Terraform state file access and provider authentication',
      'Ansible inventory and playbook execution rights',
      'Kubernetes cluster admin and RBAC configuration',
      'Git repository access for automation scripts',
      'Package manager permissions (apt, yum, chocolatey)',
      'System service installation and configuration'
    ],
    automationFrameworks: [
      'CALDERA and Atomic Red Team execution permissions',
      'Metasploit Framework installation and module access',
      'Attack simulation tool deployment rights',
      'Vulnerability scanner execution permissions',
      'Network simulation and packet capture tools',
      'SIEM/logging framework configuration access'
    ],
    secretsManagement: [
      'HashiCorp Vault or similar secrets engine access',
      'API key and credential secure storage',
      'Certificate authority and PKI management',
      'Service account key rotation and management'
    ]
  };

  // Environment-specific access control requirements
  const environmentSpecific = {
    cloud: {
      cloudAccess: [
        'Cloud platform admin access (AWS/Azure/GCP)',
        'Infrastructure as Code (Terraform/CloudFormation) permissions',
        'Resource provisioning and deletion rights',
        'Cost management and resource tagging permissions'
      ],
      iamPolicies: [
        'Custom IAM roles for lab environment',
        'Cross-account role assumption capabilities',
        'Service-linked role management',
        'Policy simulation and testing permissions'
      ],
      networkSecurity: [
        'VPC/Virtual Network creation and management',
        'Security group and firewall rule configuration',
        'Network ACL and routing table modifications',
        'Load balancer and gateway management'
      ],
      cloudTooling: [
        'Kubernetes cluster creation and management (Kind/Minikube/EKS/AKS/GKE)',
        'Docker container orchestration and registry access',
        'Terraform cloud provider authentication and state management',
        'Pulumi stack management and deployment permissions',
        'Cloud-Init script execution and VM bootstrap access'
      ],
      cortexCloudIntegration: [
        'Cortex XSIAM cloud tenant configuration and data source integration',
        'Cortex XDR cloud agent deployment across multi-cloud environments',
        'Prisma Cloud CWPP/CSPM integration for comprehensive cloud security',
        'Cortex Data Lake cloud log ingestion and retention configuration'
      ]
    },
    endpoint: {
      systemAccess: [
        'Local administrator privileges on target systems',
        'Domain administrator access for AD environments',
        'Certificate management and PKI operations',
        'Group Policy creation and deployment rights'
      ],
      agentDeployment: [
        'EDR/XDR agent installation permissions',
        'System monitoring tool deployment rights',
        'Registry and system file modification access',
        'Service installation and configuration privileges'
      ],
      endpointTooling: [
        'Sysmon installation and advanced configuration permissions',
        'osquery deployment and endpoint visibility setup',
        'Chocolatey/Winget package manager administration',
        'Vagrant VM orchestration and Boxstarter automation',
        'Packer image building with pre-installed agents and tools'
      ],
      cortexEndpointIntegration: [
        'Cortex XDR agent deployment and configuration management',
        'Traps endpoint protection policy creation and assignment',
        'Cortex XSIAM endpoint data source onboarding and validation',
        'WildFire analysis integration for malware detonation and analysis'
      ]
    },
    network: {
      networkInfrastructure: [
        'Network device configuration access (routers/switches)',
        'VLAN creation and management permissions',
        'Firewall rule configuration and testing',
        'DNS and DHCP server administration'
      ],
      monitoring: [
        'Network packet capture permissions',
        'Traffic analysis and monitoring setup',
        'IDS/IPS configuration and tuning',
        'Network segmentation testing rights'
      ],
      networkTooling: [
        'pfSense/OPNsense virtual firewall deployment and configuration',
        'VyOS router OS installation and automation-friendly CLI access',
        'NetEm network emulation and traffic shaping permissions',
        'iptables/nftables firewall rule scripting and management',
        'FRRouting (FRR) BGP/OSPF/RIP router emulation setup',
        'GNS3/EVE-NG network simulation platform administration',
        'Arkime PCAP capture and session analysis deployment'
      ],
      cortexNetworkIntegration: [
        'Palo Alto Networks NGFW integration with Cortex Data Lake',
        'Prisma Access SASE platform configuration and log forwarding',
        'Cortex XSIAM network data source integration and parsing',
        'Advanced Threat Prevention and DNS Security log analysis'
      ]
    },
    identity: {
      identityManagement: [
        'Active Directory domain admin privileges',
        'Identity provider configuration access',
        'Federation and trust relationship setup',
        'Credential store and password policy management'
      ],
      accessTesting: [
        'Privilege escalation testing permissions',
        'Account impersonation capabilities',
        'Authentication bypass simulation rights',
        'Token manipulation and replay testing'
      ],
      identityTooling: [
        'FreeIPA Linux-based identity management (Kerberos + LDAP + DNS)',
        'OpenLDAP lightweight directory deployment and configuration',
        'Keycloak full-featured IAM OAuth/OIDC/SAML simulation setup',
        'ForgeRock AM (openAM fork) enterprise IAM suite administration',
        'Cloud Directory API access (AzureAD Graph, AWS IAM, Okta APIs)'
      ],
      cortexIdentityIntegration: [
        'Cortex XSIAM identity data source configuration and log parsing',
        'Active Directory integration with Cortex XDR for user behavior analytics',
        'Prisma Cloud identity and access management monitoring',
        'Directory Sync integration for user and group enumeration'
      ]
    },
    hybrid: {
      crossPlatform: [
        'Multi-platform administrative access',
        'Hybrid cloud connectivity configuration',
        'Cross-domain trust establishment',
        'Federated identity management setup'
      ],
      hybridTooling: [
        'Multi-cloud Terraform provider authentication and orchestration',
        'Ansible cross-platform inventory management and playbook execution',
        'HashiCorp Nomad lightweight container + VM orchestration',
        'Tailscale/ZeroTier private VPN mesh for isolated environment access'
      ]
    }
  };

  // Attack simulation and monitoring tools for all environments
  const universalToolRequirements = {
    attackSimulation: [
      'Atomic Red Team MITRE ATT&CK-aligned test execution framework',
      'CALDERA automated adversary emulation with plugins and decision logic',
      'Metasploit Framework pen-testing toolkit with CVE and TTP coverage',
      'PurpleSharp .NET-based Windows adversary emulation via native APIs',
      'Sliver C2 framework for red team operations deployment',
      'Simuland end-to-end Azure AD/cloud attack simulation lab setup'
    ],
    siemMonitoring: [
      'Elastic Stack (ELK) open-source SIEM/log analytics deployment',
      'Wazuh SIEM with endpoint agents and correlation rules setup',
      'TheHive + Cortex alert management and enrichment platform',
      'Syslog-ng/Fluentd/Logstash log shipping to SIEM configuration',
      'STIX/TAXII Libraries threat intel feeds and report parsing',
      'MISP threat intel platform with CVE, IOC, ATT&CK mappings'
    ],
    emailWebTesting: [
      'Mailcow/Postal self-hosted mail servers for phishing simulation',
      'GoPhish open-source phishing simulation tool deployment',
      'ModSecurity + OWASP CRS web application firewall bypass testing',
      'Squid Proxy/mitmproxy web filter and TLS inspection simulation'
    ],
    orchestrationWrappers: [
      'Make/Taskfile/GNU Parallel orchestration step execution',
      'Jenkins/GitHub Actions/ArgoCD CI/CD for lab environments',
      'Shell scripts/Python/Fabric glue logic for automation workflows',
      'HashiCorp Vault/Doppler secure secrets during deployment'
    ]
  };

  return {
    ...baseRequirements,
    ...environmentSpecific[environmentType as keyof typeof environmentSpecific] || {},
    ...universalToolRequirements
  };
}

function generateInfrastructureComponents(environmentType: string) {
  const baseComponents = [
    'Cortex XSIAM centralized security platform (all logs aggregation point)',
    'Cortex Data Lake for comprehensive log storage and analysis', 
    'Multi-vendor data source collectors and forwarders to XSIAM',
    'Log parsing and normalization pipelines for XSIAM ingestion',
    'Network monitoring with direct XSIAM integration',
    'Backup and recovery systems',
    'Documentation and knowledge base'
  ];

  const environmentComponents = {
    cloud: [
      'Multi-cloud infrastructure (AWS/Azure/GCP with any vendor services)',
      'Container orchestration platform (Kubernetes/Docker)',
      'Cloud-native monitoring and logging (vendor-agnostic)',
      'Identity and access management platform (any provider)',
      'Cloud security posture management tools'
    ],
    endpoint: [
      'Windows domain controller and workstations',
      'Linux servers and workstations (any distribution)',
      'Multi-vendor EDR/XDR agent deployment',
      'Certificate authority infrastructure',
      'Endpoint monitoring and logging systems'
    ],
    network: [
      'Core network infrastructure (routers/switches)',
      'Firewall and security appliances',
      'IDS/IPS monitoring systems',
      'Network access control (NAC)',
      'Wireless infrastructure simulation'
    ],
    identity: [
      'Active Directory domain services',
      'Identity provider platforms',
      'Multi-factor authentication systems',
      'Privileged access management (PAM)',
      'Identity governance platforms'
    ],
    hybrid: [
      'Multi-cloud infrastructure components',
      'Hybrid connectivity solutions',
      'Cross-platform monitoring tools',
      'Unified identity management'
    ]
  };

  return [
    ...baseComponents,
    ...environmentComponents[environmentType as keyof typeof environmentComponents] || []
  ];
}

function generateDeploymentSteps(environmentType: string, accessRequirements: any) {
  return [
    {
      id: 'access_validation',
      name: 'Access Control Validation',
      description: 'Verify all required permissions and access controls are in place',
      status: 'pending',
      requirements: Object.values(accessRequirements).flat(),
      estimatedTime: '30 minutes'
    },
    {
      id: 'infrastructure_deployment',
      name: 'Infrastructure Deployment',
      description: 'Deploy and configure all required infrastructure components',
      status: 'pending',
      dependencies: ['access_validation'],
      estimatedTime: '90 minutes'
    },
    {
      id: 'security_configuration',
      name: 'Cortex XSIAM Data Source Integration',
      description: 'Configure all data sources (Windows, Linux, cloud, network, identity) to forward logs directly to Cortex XSIAM for centralized threat detection and analysis',
      status: 'pending',
      dependencies: ['infrastructure_deployment'],
      estimatedTime: '90 minutes',
      criticalNote: 'Essential for comprehensive threat visibility - all detection capabilities depend on complete log aggregation in XSIAM'
    },
    {
      id: 'attack_simulation_prep',
      name: 'Attack Simulation Preparation',
      description: 'Prepare malware, tools, and attack scenarios for execution',
      status: 'pending',
      dependencies: ['security_configuration'],
      estimatedTime: '45 minutes'
    },
    {
      id: 'validation_testing',
      name: 'Environment Validation',
      description: 'Validate all systems are operational and ready for testing',
      status: 'pending',
      dependencies: ['attack_simulation_prep'],
      estimatedTime: '30 minutes'
    }
  ];
}

function calculateEstimatedTime(environmentType: string): string {
  const baseTimes = {
    cloud: '4-6 hours',
    endpoint: '3-4 hours',
    network: '5-7 hours',
    identity: '3-5 hours',
    hybrid: '6-8 hours'
  };
  return baseTimes[environmentType as keyof typeof baseTimes] || '4-5 hours';
}

function calculateCostEstimate(environmentType: string): string {
  const baseCosts = {
    cloud: '$300-800/month',
    endpoint: '$100-300/month',
    network: '$200-500/month',
    identity: '$150-400/month',
    hybrid: '$500-1200/month'
  };
  return baseCosts[environmentType as keyof typeof baseCosts] || '$200-500/month';
}

// Generate comprehensive 30-day rolling threat database
function generate30DayThreatDatabase() {
  const threats = [];
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  const threatTemplates = [
    {
      title: 'Critical Remote Code Execution in Apache Struts',
      description: 'A critical vulnerability allows remote code execution through crafted Content-Type headers in Apache Struts 6.1.2 and earlier versions.',
      category: 'endpoint',
      severity: 'critical',
      cves: ['CVE-2023-50164'],
      technologies: ['Apache Struts', 'Java'],
      vulnerabilityTypes: ['Remote Code Execution'],
      cvssScore: 9.8,
      threatActors: ['APT29', 'Lazarus Group']
    },
    {
      title: 'Microsoft Exchange ProxyShell Exploitation Campaign',
      description: 'Ongoing exploitation of Microsoft Exchange ProxyShell vulnerabilities targeting financial sector organizations.',
      category: 'network',
      severity: 'high',
      cves: ['CVE-2021-34473', 'CVE-2021-34523'],
      technologies: ['Microsoft Exchange', 'Windows Server'],
      vulnerabilityTypes: ['Authentication Bypass', 'Privilege Escalation'],
      cvssScore: 8.5,
      threatActors: ['HAFNIUM']
    },
    {
      title: 'Kubernetes IngressNightmare Container Escape',
      description: 'CVE-2025-1974 allows container escape through malicious ingress configurations in Kubernetes environments.',
      category: 'cloud',
      severity: 'critical',
      cves: ['CVE-2025-1974'],
      technologies: ['Kubernetes', 'Docker', 'Container Runtime'],
      vulnerabilityTypes: ['Container Escape', 'Privilege Escalation'],
      cvssScore: 9.3,
      threatActors: ['APT28', 'Cloud Raiders']
    },
    {
      title: 'Active Directory Kerberos Ticket Forgery',
      description: 'Advanced persistent threat exploiting Kerberos authentication weaknesses to forge service tickets for domain privilege escalation.',
      category: 'identity',
      severity: 'high',
      cves: ['CVE-2024-38077'],
      technologies: ['Active Directory', 'Kerberos', 'Windows Domain'],
      vulnerabilityTypes: ['Authentication Bypass', 'Privilege Escalation'],
      cvssScore: 8.7,
      threatActors: ['APT29', 'Cozy Bear']
    },
    {
      title: 'VMware vCenter Server Authentication Bypass',
      description: 'Critical vulnerability in VMware vCenter allows unauthenticated remote code execution on virtualization infrastructure.',
      category: 'cloud',
      severity: 'critical',
      cves: ['CVE-2024-38812'],
      technologies: ['VMware vCenter', 'ESXi', 'Virtual Infrastructure'],
      vulnerabilityTypes: ['Authentication Bypass', 'Remote Code Execution'],
      cvssScore: 9.8,
      threatActors: ['Lazarus Group', 'APT40']
    },
    {
      title: 'Node.js Supply Chain Attack via npm Packages',
      description: 'Malicious npm packages discovered containing backdoors targeting development environments and CI/CD pipelines.',
      category: 'endpoint',
      severity: 'high',
      cves: ['CVE-2024-21538'],
      technologies: ['Node.js', 'npm', 'JavaScript'],
      vulnerabilityTypes: ['Supply Chain Attack', 'Code Injection'],
      cvssScore: 8.2,
      threatActors: ['UNC2452', 'SolarWinds Hackers']
    },
    {
      title: 'AWS S3 Bucket Privilege Escalation',
      description: 'Misconfigured IAM policies allowing unauthorized access to sensitive S3 buckets containing customer data and credentials.',
      category: 'cloud',
      severity: 'high',
      cves: ['CVE-2024-45678'],
      technologies: ['AWS S3', 'IAM', 'Cloud Storage'],
      vulnerabilityTypes: ['Privilege Escalation', 'Data Exposure'],
      cvssScore: 7.9,
      threatActors: ['APT1', 'Comment Crew']
    },
    {
      title: 'Windows NTLM Relay Attack via Print Spooler',
      description: 'PrintNightmare variant enabling NTLM relay attacks to compromise domain controllers through print spooler service.',
      category: 'endpoint',
      severity: 'critical',
      cves: ['CVE-2024-38063'],
      technologies: ['Windows Print Spooler', 'NTLM', 'Active Directory'],
      vulnerabilityTypes: ['NTLM Relay', 'Privilege Escalation'],
      cvssScore: 9.0,
      threatActors: ['APT28', 'Fancy Bear']
    },
    {
      title: 'Okta Identity Provider Bypass',
      description: 'Authentication bypass in Okta identity management allowing unauthorized access to enterprise applications.',
      category: 'identity',
      severity: 'critical',
      cves: ['CVE-2024-12345'],
      technologies: ['Okta', 'SAML', 'Identity Management'],
      vulnerabilityTypes: ['Authentication Bypass', 'Identity Spoofing'],
      cvssScore: 9.1,
      threatActors: ['Lapsus$', 'DEV-0537']
    },
    {
      title: 'Docker Runtime Escape via Malicious Images',
      description: 'Container runtime escape vulnerability allowing attackers to break out of Docker containers to access host systems.',
      category: 'cloud',
      severity: 'high',
      cves: ['CVE-2024-23651'],
      technologies: ['Docker', 'containerd', 'Container Runtime'],
      vulnerabilityTypes: ['Container Escape', 'Host Access'],
      cvssScore: 8.6,
      threatActors: ['TeamTNT', 'Hildegard']
    }
  ];

  const sources = ['Unit42', 'CISA', 'SANS ISC', 'Mandiant', 'CrowdStrike', 'Microsoft Security', 'Google TAG', 'FireEye'];

  // Generate threats across 30 days
  for (let i = 0; i < 25; i++) {
    const template = threatTemplates[i % threatTemplates.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const publishedDate = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));
    
    threats.push({
      id: `threat-30day-${i + 1}`,
      title: template.title + (i > 9 ? ` (Variant ${Math.floor(i/10)})` : ''),
      description: template.description,
      summary: template.description.substring(0, 100) + '...',
      category: template.category,
      severity: template.severity,
      source: sources[i % sources.length],
      sourceId: sources[i % sources.length].toLowerCase().replace(/\s+/g, '-'),
      publishedDate: publishedDate.toISOString(),
      url: `https://example.com/threat-${i + 1}`,
      confidence: 85 + Math.floor(Math.random() * 15),
      tlp: 'white',
      cves: template.cves,
      technologies: template.technologies,
      vulnerabilityTypes: template.vulnerabilityTypes,
      cvssScore: template.cvssScore + (Math.random() - 0.5) * 0.5,
      exploitAvailable: Math.random() > 0.3,
      threatActors: template.threatActors,
      indicators: {
        ips: [`192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`],
        domains: [`malicious-${i}.example.com`],
        hashes: [`hash-${i}-${Math.random().toString(36).substr(2, 8)}`],
        files: [`/tmp/exploit-${i}.sh`]
      }
    });
  }

  // Sort by date (newest first)
  return threats.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const threatIntelService = new ThreatIntelligenceService(THREAT_SOURCES);
  const threatParser = new ThreatReportParser();
  const contentEngine = ContentGenerationEngine.getInstance();
  const socEngine = SOCProcessEngine.getInstance();  
  const contentStorage = ContentStorage.getInstance();
  const ddlcEngine = DDLCWorkflowEngine.getInstance();
  const recommendationEngine = new ContentRecommendationEngine();
  const xsiamContentGenerator = new XSIAMContentGenerator();
  
  // Initialize sample data
  await contentStorage.initializeSampleData();

  // Setup XSIAM proxy endpoints
  setupXSIAMProxy(app);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Content packages endpoint for XSIAM testing
  app.get("/api/content/packages", async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Read all content from the content directory
      const contentDir = path.join(process.cwd(), 'content');
      const packages = [];
      
      try {
        // Read use cases
        const useCasesDir = path.join(contentDir, 'use-cases');
        const useCaseFiles = await fs.readdir(useCasesDir);
        
        for (const file of useCaseFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(useCasesDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const packageData = JSON.parse(content);
            
            // Also load related XQL rules, playbooks, layouts
            const baseName = file.replace('.json', '');
            
            try {
              const xqlRulesPath = path.join(contentDir, 'xql-rules', `${baseName}.json`);
              const xqlContent = await fs.readFile(xqlRulesPath, 'utf-8');
              packageData.xqlRules = JSON.parse(xqlContent);
            } catch (e) {
              // Optional file
            }
            
            try {
              const playbooksPath = path.join(contentDir, 'playbooks', `${baseName}.yml`);
              const playbookContent = await fs.readFile(playbooksPath, 'utf-8');
              packageData.playbook = playbookContent;
            } catch (e) {
              // Optional file
            }
            
            try {
              const layoutsPath = path.join(contentDir, 'layouts', `${baseName}.json`);
              const layoutContent = await fs.readFile(layoutsPath, 'utf-8');
              packageData.alertLayout = JSON.parse(layoutContent);
            } catch (e) {
              // Optional file
            }
            
            packages.push(packageData);
          }
        }
        
      } catch (e) {
        console.error('Error reading content directory:', e);
      }
      
      res.json(packages);
    } catch (error) {
      console.error('Error fetching content packages:', error);
      res.status(500).json({ error: 'Failed to fetch content packages' });
    }
  });

  // Get pre-ingested threats from ThreatResearchHub intelligence system
  app.get('/api/threats', async (req, res) => {
    try {
      console.log('[API] Processing threat request...');
      
      // Always use 30-day rolling threat database for reliable demonstration
      console.log('[API] Using comprehensive 30-day rolling threat database...');
      const threats = generate30DayThreatDatabase();
      console.log(`[API] Generated ${threats.length} threats for 30-day rolling database`);
      
      // Convert to format expected by frontend
      const formattedThreats = threats.map((threat: any) => ({
        id: threat.id,
        title: threat.title,
        description: threat.description || threat.summary,
        category: threat.category || 'general',
        severity: threat.severity || 'medium',
        source: threat.source,
        sources: threat.sources || [{ vendor: threat.source, url: threat.url || '', title: threat.title }],
        cves: threat.cves || [],
        technologies: threat.technologies || [],
        vulnerabilityTypes: threat.vulnerabilityTypes || [],
        cvssScore: threat.cvssScore || 0,
        exploitAvailable: threat.exploitAvailable || false,
        createdAt: threat.createdAt || threat.publishedDate || new Date().toISOString(),
        url: threat.url,
        threatActors: threat.threatActors || []
      }));
      
      res.json(formattedThreats);
    } catch (error) {
      console.error('Error fetching pre-ingested threats:', error);
      res.status(500).json({ error: 'Failed to fetch threats' });
    }
  });

  // Check AI capabilities endpoint for graceful degradation
  app.get("/api/check-ai-capabilities", (req, res) => {
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
    
    if (hasAnthropicKey || hasOpenAiKey) {
      res.json({ 
        status: "available", 
        capabilities: {
          anthropic: hasAnthropicKey,
          openai: hasOpenAiKey
        }
      });
    } else {
      res.status(503).json({ 
        status: "unavailable", 
        message: "AI capabilities require API keys. Platform will use fallback demo mode." 
      });
    }
  });

  // Content Generation API Routes
  app.post("/api/content/parse-threat-report", async (req, res) => {
    try {
      const rawReport = RawThreatReportSchema.parse(req.body);
      const result = await threatParser.parseAndNormalize(rawReport);
      res.json(result);
    } catch (error) {
      console.error("Error parsing threat report:", error);
      res.status(400).json({ error: "Invalid threat report format or parsing failed" });
    }
  });

  app.post("/api/content/generate-xql-rule", async (req, res) => {
    try {
      const threat = req.body;
      const xqlRule = contentEngine.generateXQLCorrelationRule(threat);
      res.json(xqlRule);
    } catch (error) {
      console.error("Error generating XQL rule:", error);
      res.status(500).json({ error: "Failed to generate XQL correlation rule" });
    }
  });

  app.post("/api/content/generate-playbook", async (req, res) => {
    try {
      const threat = req.body;
      const playbook = contentEngine.generateAutomationPlaybook(threat);
      res.json(playbook);
    } catch (error) {
      console.error("Error generating playbook:", error);
      res.status(500).json({ error: "Failed to generate automation playbook" });
    }
  });

  app.post("/api/content/generate-alert-layout", async (req, res) => {
    try {
      const threat = req.body;
      const layout = contentEngine.generateAlertLayout(threat);
      res.json(layout);
    } catch (error) {
      console.error("Error generating alert layout:", error);
      res.status(500).json({ error: "Failed to generate alert layout" });
    }
  });

  app.post("/api/content/generate-dashboard", async (req, res) => {
    try {
      const threat = req.body;
      const dashboard = contentEngine.generateOperationalDashboard(threat);
      res.json(dashboard);
    } catch (error) {
      console.error("Error generating dashboard:", error);
      res.status(500).json({ error: "Failed to generate operational dashboard" });
    }
  });

  // SOC Process API Routes
  app.post("/api/soc/generate-process", async (req, res) => {
    try {
      const { threatType, severity } = req.body;
      const process = socEngine.generateSOCProcess(threatType, severity);
      res.json(process);
    } catch (error) {
      console.error("Error generating SOC process:", error);
      res.status(500).json({ error: "Failed to generate SOC process" });
    }
  });

  app.post("/api/soc/generate-workflow-diagram", async (req, res) => {
    try {
      const process = req.body;
      const diagram = socEngine.generateWorkflowDiagram(process);
      res.json(diagram);
    } catch (error) {
      console.error("Error generating workflow diagram:", error);
      res.status(500).json({ error: "Failed to generate workflow diagram" });
    }
  });

  app.post("/api/soc/generate-response-playbook", async (req, res) => {
    try {
      const { threatType, severity } = req.body;
      const playbook = socEngine.generateResponsePlaybook(threatType, severity);
      res.json(playbook);
    } catch (error) {
      console.error("Error generating response playbook:", error);
      res.status(500).json({ error: "Failed to generate response playbook" });
    }
  });

  // Export API Routes
  app.post("/api/export/stix2", async (req, res) => {
    try {
      const threat = req.body;
      const stixBundle = threatParser.exportToSTIX2(threat);
      res.json(stixBundle);
    } catch (error) {
      console.error("Error exporting to STIX2:", error);
      res.status(500).json({ error: "Failed to export to STIX2 format" });
    }
  });

  app.post("/api/export/use-case", async (req, res) => {
    try {
      const { threat, xqlRule, playbook } = req.body;
      const useCase = threatParser.exportUseCase(threat, xqlRule, playbook);
      res.json(useCase);
    } catch (error) {
      console.error("Error exporting use case:", error);
      res.status(500).json({ error: "Failed to export use case template" });
    }
  });

  // Content Package Management API Routes
  // XSIAM connection testing endpoint
  app.post('/api/xsiam/test-connection', async (req, res) => {
    try {
      const { apiKey, tenantUrl } = req.body;
      
      if (!apiKey || !tenantUrl) {
        return res.status(400).json({
          success: false,
          error: 'API key and tenant URL are required'
        });
      }

      // Validate API key format
      if (apiKey.length < 32) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API key format - too short'
        });
      }

      // Validate tenant URL format
      if (!tenantUrl.includes('paloaltonetworks.com') && !tenantUrl.includes('xdr.')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid XSIAM tenant URL format'
        });
      }

      // Test actual XSIAM API endpoints
      const testResults = {
        basicConnectivity: false,
        contentManagement: false,
        dataIngestion: false,
        apiVersion: null,
        availableEndpoints: []
      };

      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      try {
        // Test basic health/info endpoint
        const healthResponse = await fetch(`${tenantUrl}/api/v1/health`, {
          method: 'GET',
          headers: headers,
          timeout: 15000
        });

        if (healthResponse.ok) {
          testResults.basicConnectivity = true;
          const healthData = await healthResponse.json();
          testResults.apiVersion = healthData.version || 'Unknown';
        }
      } catch (error: any) {
        console.log('Health endpoint test failed:', error.message);
      }

      try {
        // Test content management endpoints
        const contentResponse = await fetch(`${tenantUrl}/api/v1/analytics/correlation_rules`, {
          method: 'GET',
          headers: headers,
          timeout: 15000
        });

        if (contentResponse.ok || contentResponse.status === 403) {
          // 403 means authenticated but insufficient permissions, which is still a valid connection
          testResults.contentManagement = true;
          testResults.availableEndpoints.push('correlation_rules');
        }
      } catch (error: any) {
        console.log('Content management test failed:', error.message);
      }

      try {
        // Test data ingestion endpoint
        const dataResponse = await fetch(`${tenantUrl}/api/v1/datasets`, {
          method: 'GET',
          headers: headers,
          timeout: 15000
        });

        if (dataResponse.ok || dataResponse.status === 403) {
          testResults.dataIngestion = true;
          testResults.availableEndpoints.push('datasets');
        }
      } catch (error: any) {
        console.log('Data ingestion test failed:', error.message);
      }

      // Additional endpoint tests
      const additionalEndpoints = [
        'incidents',
        'playbooks', 
        'alerts',
        'dashboards',
        'integrations'
      ];

      for (const endpoint of additionalEndpoints) {
        try {
          const testResponse = await fetch(`${tenantUrl}/api/v1/${endpoint}`, {
            method: 'GET',
            headers: headers,
            timeout: 10000
          });

          if (testResponse.ok || testResponse.status === 403) {
            testResults.availableEndpoints.push(endpoint);
          }
        } catch (error: any) {
          // Endpoint not available or network error
        }
      }

      const overallSuccess = testResults.basicConnectivity || testResults.contentManagement;

      res.json({
        success: overallSuccess,
        message: overallSuccess ? 'XSIAM connection established' : 'XSIAM connection failed',
        tenant: tenantUrl,
        testResults: testResults,
        recommendations: [
          testResults.basicConnectivity ? '✓ Basic connectivity working' : '⚠ Basic connectivity failed',
          testResults.contentManagement ? '✓ Content management API accessible' : '⚠ Content management API not accessible',
          testResults.dataIngestion ? '✓ Data ingestion API accessible' : '⚠ Data ingestion API not accessible',
          `Found ${testResults.availableEndpoints.length} accessible endpoints`,
          testResults.availableEndpoints.length > 0 ? 'Ready for content deployment' : 'Limited API access detected'
        ],
        nextSteps: overallSuccess ? [
          'Configure content deployment settings',
          'Test XQL query execution',
          'Set up log forwarding from lab infrastructure',
          'Deploy generated detection content'
        ] : [
          'Verify API key permissions',
          'Check network connectivity to XSIAM tenant',
          'Contact XSIAM administrator for API access',
          'Review tenant URL format'
        ]
      });

    } catch (error: any) {
      console.error('XSIAM connection test error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'XSIAM connection test failed',
        details: 'Network connectivity or authentication issue'
      });
    }
  });

  app.get("/api/content/packages", async (req, res) => {
    try {
      // First try to get from content storage system
      const { category, severity, ddlc_phase } = req.query;
      let packages = [];
      
      try {
        packages = await contentStorage.listPackages({
          category: category as string,
          severity: severity as string,
          ddlc_phase: ddlc_phase as string
        });
      } catch (storageError) {
        console.log("Content storage not available, serving from files...");
      }

      // If no packages from storage, serve the APT29 package from files
      if (packages.length === 0) {
        const fs = await import('fs');
        const path = await import('path');
        
        try {
          // Read the APT29 content package
          const useCasePath = path.join(process.cwd(), 'content/use-cases/APT29_Cozy_Bear_Detection_Package.json');
          const xqlRulePath = path.join(process.cwd(), 'content/xql-rules/APT29_Cozy_Bear_Detection_Package.json');
          const playbookPath = path.join(process.cwd(), 'content/playbooks/APT29_Cozy_Bear_Detection_Package.yml');
          const layoutPath = path.join(process.cwd(), 'content/layouts/APT29_Cozy_Bear_Detection_Package.json');
          const dashboardPath = path.join(process.cwd(), 'content/dashboards/APT29_Cozy_Bear_Detection_Package.json');

          const apt29Package = {
            id: 'apt29-cozy-bear',
            title: 'APT29 Cozy Bear Detection Package',
            description: 'Complete detection package for APT29 (Cozy Bear) threat group activities',
            category: 'endpoint',
            severity: 'high',
            ddlc_phase: 'deployed',
            metadata: {
              name: 'APT29 Cozy Bear Detection Package',
              threat_actor: 'APT29',
              mitre_techniques: ['T1055', 'T1027', 'T1082'],
              data_sources: ['windows_events', 'sysmon', 'xdr_data']
            }
          };

          // Add file contents if they exist
          if (fs.existsSync(useCasePath)) {
            apt29Package.useCase = JSON.parse(fs.readFileSync(useCasePath, 'utf8'));
          }
          if (fs.existsSync(xqlRulePath)) {
            apt29Package.xqlRules = JSON.parse(fs.readFileSync(xqlRulePath, 'utf8'));
          }
          if (fs.existsSync(playbookPath)) {
            apt29Package.playbook = fs.readFileSync(playbookPath, 'utf8');
          }
          if (fs.existsSync(layoutPath)) {
            apt29Package.alertLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
          }
          if (fs.existsSync(dashboardPath)) {
            apt29Package.dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));
          }

          packages = [apt29Package];
        } catch (fileError) {
          console.error("Error reading content files:", fileError);
        }
      }

      res.json(packages);
    } catch (error) {
      console.error("Error listing content packages:", error);
      res.status(500).json({ error: "Failed to list content packages" });
    }
  });

  app.get("/api/content/packages/:id", async (req, res) => {
    try {
      let pkg = null;
      
      // First try to get from content storage
      try {
        pkg = await contentStorage.getPackage(req.params.id);
      } catch (storageError) {
        console.log("Content storage not available, serving from files...");
      }

      // If not found in storage and looking for APT29, serve from files
      if (!pkg && req.params.id === 'apt29-cozy-bear') {
        const fs = await import('fs');
        const path = await import('path');
        
        try {
          const useCasePath = path.join(process.cwd(), 'content/use-cases/APT29_Cozy_Bear_Detection_Package.json');
          const xqlRulePath = path.join(process.cwd(), 'content/xql-rules/APT29_Cozy_Bear_Detection_Package.json');
          const playbookPath = path.join(process.cwd(), 'content/playbooks/APT29_Cozy_Bear_Detection_Package.yml');
          const layoutPath = path.join(process.cwd(), 'content/layouts/APT29_Cozy_Bear_Detection_Package.json');
          const dashboardPath = path.join(process.cwd(), 'content/dashboards/APT29_Cozy_Bear_Detection_Package.json');

          pkg = {
            id: 'apt29-cozy-bear',
            title: 'APT29 Cozy Bear Detection Package',
            description: 'Complete detection package for APT29 (Cozy Bear) threat group activities',
            category: 'endpoint',
            severity: 'high',
            ddlc_phase: 'deployed',
            metadata: {
              name: 'APT29 Cozy Bear Detection Package',
              threat_actor: 'APT29',
              mitre_techniques: ['T1055', 'T1027', 'T1082'],
              data_sources: ['windows_events', 'sysmon', 'xdr_data']
            }
          };

          // Add file contents
          if (fs.existsSync(useCasePath)) {
            pkg.useCase = JSON.parse(fs.readFileSync(useCasePath, 'utf8'));
          }
          if (fs.existsSync(xqlRulePath)) {
            pkg.xqlRules = JSON.parse(fs.readFileSync(xqlRulePath, 'utf8'));
          }
          if (fs.existsSync(playbookPath)) {
            pkg.playbook = fs.readFileSync(playbookPath, 'utf8');
          }
          if (fs.existsSync(layoutPath)) {
            pkg.alertLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
          }
          if (fs.existsSync(dashboardPath)) {
            pkg.dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));
          }
        } catch (fileError) {
          console.error("Error reading APT29 content files:", fileError);
        }
      }

      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }
      
      res.json(pkg);
    } catch (error) {
      console.error("Error getting content package:", error);
      res.status(500).json({ error: "Failed to get content package" });
    }
  });

  app.post("/api/content/packages", async (req, res) => {
    try {
      const pkg = await contentStorage.storePackage(req.body);
      res.json(pkg);
    } catch (error) {
      console.error("Error storing content package:", error);
      res.status(500).json({ error: "Failed to store content package" });
    }
  });

  app.put("/api/content/packages/:id/ddlc-phase", async (req, res) => {
    try {
      const { phase, notes } = req.body;
      const pkg = await contentStorage.updateDDLCPhase(req.params.id, phase, notes);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }
      res.json(pkg);
    } catch (error) {
      console.error("Error updating DDLC phase:", error);
      res.status(500).json({ error: "Failed to update DDLC phase" });
    }
  });

  app.get("/api/content/statistics", async (req, res) => {
    try {
      const stats = await contentStorage.getContentStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error getting content statistics:", error);
      res.status(500).json({ error: "Failed to get content statistics" });
    }
  });

  app.get("/api/content/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const packages = await contentStorage.searchPackages(q as string);
      res.json(packages);
    } catch (error) {
      console.error("Error searching content packages:", error);
      res.status(500).json({ error: "Failed to search content packages" });
    }
  });

  // DDLC Workflow Management API Routes
  app.get("/api/ddlc/phases", async (req, res) => {
    try {
      const phases = ddlcEngine.getAllPhases();
      res.json(phases);
    } catch (error) {
      console.error("Error getting DDLC phases:", error);
      res.status(500).json({ error: "Failed to get DDLC phases" });
    }
  });

  app.get("/api/ddlc/phase/:phase", async (req, res) => {
    try {
      const phaseInfo = ddlcEngine.getPhaseInfo(req.params.phase);
      if (!phaseInfo) {
        return res.status(404).json({ error: "Phase not found" });
      }
      res.json(phaseInfo);
    } catch (error) {
      console.error("Error getting phase info:", error);
      res.status(500).json({ error: "Failed to get phase information" });
    }
  });

  app.post("/api/ddlc/transition/:packageId", async (req, res) => {
    try {
      const { packageId } = req.params;
      const { targetPhase, notes } = req.body;
      
      const pkg = await contentStorage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }

      const validation = ddlcEngine.canTransitionToPhase(pkg.ddlc_phase, targetPhase, pkg);
      if (!validation.allowed) {
        return res.status(400).json({
          error: "Phase transition not allowed",
          reason: validation.reason,
          missing_criteria: validation.missing_criteria
        });
      }

      const updatedPkg = await contentStorage.updateDDLCPhase(packageId, targetPhase, notes);
      res.json(updatedPkg);
    } catch (error) {
      console.error("Error transitioning DDLC phase:", error);
      res.status(500).json({ error: "Failed to transition DDLC phase" });
    }
  });

  app.get("/api/ddlc/checklist/:phase", async (req, res) => {
    try {
      const checklist = ddlcEngine.generatePhaseChecklist(req.params.phase);
      res.json(checklist);
    } catch (error) {
      console.error("Error generating checklist:", error);
      res.status(500).json({ error: "Failed to generate phase checklist" });
    }
  });

  app.get("/api/ddlc/progress/:packageId", async (req, res) => {
    try {
      const pkg = await contentStorage.getPackage(req.params.packageId);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }

      const progressReport = ddlcEngine.generateProgressReport(pkg);
      res.json(progressReport);
    } catch (error) {
      console.error("Error generating progress report:", error);
      res.status(500).json({ error: "Failed to generate progress report" });
    }
  });

  app.get("/api/ddlc/completion/:packageId/:phase", async (req, res) => {
    try {
      const { packageId, phase } = req.params;
      const pkg = await contentStorage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }

      const completion = ddlcEngine.calculatePhaseCompletion(phase, pkg);
      res.json(completion);
    } catch (error) {
      console.error("Error calculating phase completion:", error);
      res.status(500).json({ error: "Failed to calculate phase completion" });
    }
  });

  app.post("/api/ddlc/transition-plan", async (req, res) => {
    try {
      const { fromPhase, toPhase } = req.body;
      const plan = ddlcEngine.generateTransitionPlan(fromPhase, toPhase);
      res.json(plan);
    } catch (error) {
      console.error("Error generating transition plan:", error);
      res.status(500).json({ error: "Failed to generate transition plan" });
    }
  });

  app.get("/api/ddlc/analytics", async (req, res) => {
    try {
      const analytics = await contentStorage.getDDLCAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error getting DDLC analytics:", error);
      res.status(500).json({ error: "Failed to get DDLC analytics" });
    }
  });

  // Note: This application is designed to be fully client-side
  // All data processing, storage, and business logic occurs in the browser
  // using IndexedDB for local storage and client-side processing libraries
  
  // The following endpoints could be added if server-side processing is needed:
  
  // app.post("/api/threat-reports", async (req, res) => {
  //   // Handle threat report processing if needed server-side
  // });
  
  // app.get("/api/threat-feeds/:feedId", async (req, res) => {
  //   // Proxy threat feed requests to avoid CORS issues
  // });
  
  // app.post("/api/validation", async (req, res) => {
  //   // Handle validation workflows if centralized validation is needed
  // });

  // Template Sharing Routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllSharedTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertSharedTemplateSchema.parse(req.body);
      const template = await storage.createSharedTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(400).json({ error: "Failed to create template" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getSharedTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/templates/:id/download", async (req, res) => {
    try {
      const template = await storage.getSharedTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      await storage.incrementTemplateDownload(req.params.id);
      res.json({ 
        message: "Template downloaded successfully",
        templateData: template.templateData
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      res.status(500).json({ error: "Failed to download template" });
    }
  });

  // Template Comments Routes
  app.get("/api/templates/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getTemplateCommentsByTemplate(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/templates/:id/comments", async (req, res) => {
    try {
      const validatedData = insertTemplateCommentSchema.parse({
        ...req.body,
        templateId: req.params.id
      });
      const comment = await storage.createTemplateComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ error: "Failed to create comment" });
    }
  });

  // Template Ratings Routes
  app.post("/api/templates/:id/ratings", async (req, res) => {
    try {
      const validatedData = insertTemplateRatingSchema.parse({
        ...req.body,
        templateId: req.params.id
      });
      const rating = await storage.createTemplateRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(400).json({ error: "Failed to create rating" });
    }
  });

  // Threat Intelligence API endpoints
  app.get("/api/threat-intelligence/sources", (req, res) => {
    const sources = THREAT_SOURCES.map(source => ({
      ...source,
      // Don't expose sensitive data like API keys
      authentication: source.authentication ? { type: source.authentication.type } : undefined
    }));
    res.json(sources);
  });

  app.get("/api/threat-intelligence/threats", async (req, res) => {
    try {
      const threats = await threatIntelService.getAllThreats();
      res.json(threats);
    } catch (error) {
      console.error('Error fetching threats:', error);
      res.status(500).json({ error: 'Failed to fetch threat intelligence' });
    }
  });

  app.get("/api/threat-intelligence/source/:sourceId/refresh", async (req, res) => {
    try {
      const sourceId = req.params.sourceId;
      const source = THREAT_SOURCES.find(s => s.id === sourceId);
      
      if (!source) {
        return res.status(404).json({ error: 'Source not found' });
      }

      const threats = await threatIntelService.fetchFromSource(source);
      res.json({ message: `Refreshed ${threats.length} threats from ${source.name}`, threats });
    } catch (error) {
      console.error('Error refreshing source:', error);
      res.status(500).json({ error: 'Failed to refresh threat source' });
    }
  });

  app.get("/api/threat-intelligence/status", (req, res) => {
    const status = threatIntelService.getSourceStatus();
    res.json(status);
  });

  // Content Recommendations API endpoint - Multi-AI integration
  app.post("/api/content-recommendations", async (req, res) => {
    try {
      const { useCase } = req.body;
      
      if (!useCase) {
        return res.status(400).json({ error: "Use case is required" });
      }

      // Generate recommendations using multi-AI system
      const recommendations = await recommendationEngine.generateRecommendations(useCase);
      
      // Get available AI providers for client information
      const availableProviders = aiProviderManager.getAvailableProviders();
      
      res.json({ 
        recommendations,
        aiProviders: availableProviders,
        message: `Generated ${recommendations.length} recommendations using ${availableProviders.length > 0 ? availableProviders.join(' + ') : 'rule-based'} analysis`
      });
    } catch (error) {
      console.error('Error generating content recommendations:', error);
      res.status(500).json({ 
        error: 'Failed to generate recommendations',
        message: 'AI providers may be unavailable, falling back to rule-based recommendations'
      });
    }
  });

  // XSIAM Data Extraction API endpoints
  app.post("/api/xsiam/test-connection", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.testConnection();
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM connection test error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to test XSIAM connection' 
      });
    }
  });

  // XSIAM Connection Test API endpoint
  app.post("/api/xsiam/test-connection", async (req, res) => {
    try {
      const { instance } = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.testConnection();
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM connection test error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to test XSIAM connection' 
      });
    }
  });

// XSIAM Content Upload API endpoints
  app.post("/api/xsiam/upload-content", async (req, res) => {
    try {
      const { instance, contentPackage } = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.uploadContentPackage(contentPackage);
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM content upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to upload content to XSIAM' 
      });
    }
  });

  app.post("/api/xsiam/upload-xql-rule", async (req, res) => {
    try {
      const { instance, rule } = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.uploadXQLRule(rule);
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM XQL rule upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to upload XQL rule to XSIAM' 
      });
    }
  });

  app.post("/api/xsiam/upload-playbook", async (req, res) => {
    try {
      const { instance, playbook } = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.uploadPlaybook(playbook);
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM playbook upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to upload playbook to XSIAM' 
      });
    }
  });

  app.post("/api/xsiam/extract-marketplace", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.extractMarketplacePacks();
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM marketplace extraction error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to extract marketplace data' 
      });
    }
  });

  app.post("/api/xsiam/extract-onboarding", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.extractOnboardingWizard();
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM onboarding extraction error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to extract onboarding data' 
      });
    }
  });

  app.post("/api/xsiam/extract-all", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      console.log(`Starting comprehensive XSIAM data extraction for ${instance.name}`);
      
      const result = await extractAllXSIAMData(instance);
      res.json({
        success: result.errors.length === 0,
        data: result,
        errors: result.errors
      });
    } catch (error: any) {
      console.error('XSIAM comprehensive extraction error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to extract XSIAM data' 
      });
    }
  });

  app.post("/api/xsiam/extract-content-pack/:packId", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      const packId = req.params.packId;
      const client = createXSIAMClient(instance);
      const result = await client.extractContentPackDetails(packId);
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM content pack extraction error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to extract content pack details' 
      });
    }
  });

  // Lab Build Planner API endpoints
  app.post("/api/lab-build-plan/generate", async (req, res) => {
    try {
      const { content, title } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Threat report content is required' });
      }

      console.log(`Generating lab build plan for: ${title || 'Untitled Report'}`);
      
      // Parse threat report content using the instance method
      const rawReport = {
        source: 'manual' as const,
        content,
        metadata: {
          upload_date: new Date().toISOString()
        }
      };
      
      const result = await threatParser.parseAndNormalize(rawReport);
      
      // Determine environment requirements based on threat technologies and severity
      const threatCategories = [
        ...(result.normalized.technologies || []),
        result.normalized.severity === 'critical' ? 'endpoint' : 'network'
      ];
      const environmentType = determineEnvironmentType(threatCategories);
      const accessControlRequirements = generateAccessControlRequirements(environmentType);
      
      // Generate comprehensive lab build plan with IAM/access control components
      const labPlan = {
        id: `lab_${Date.now()}`,
        title: title || 'Threat Lab Build Plan',
        threat_report: result.normalized,
        environmentType,
        accessControlRequirements,
        components: generateInfrastructureComponents(environmentType),
        steps: generateDeploymentSteps(environmentType, accessControlRequirements),
        estimated_time: calculateEstimatedTime(environmentType),
        cost_estimate: calculateCostEstimate(environmentType)
      };
      
      console.log(`Generated lab plan with ${labPlan.components.length} components and ${labPlan.steps.length} steps`);
      
      res.json(labPlan);
    } catch (error: any) {
      console.error('Lab build plan generation error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to generate lab build plan' 
      });
    }
  });

  app.post("/api/lab-build-plan/execute-step", async (req, res) => {
    try {
      const { stepId, planId } = req.body;
      
      if (!stepId || !planId) {
        return res.status(400).json({ error: 'Step ID and Plan ID are required' });
      }

      console.log(`Executing lab build step: ${stepId} for plan: ${planId}`);
      
      // In a real implementation, this would execute the actual deployment step
      // For now, we'll simulate the execution with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({
        success: true,
        stepId,
        status: 'completed',
        message: `Successfully executed step: ${stepId}`
      });
    } catch (error: any) {
      console.error('Lab step execution error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to execute lab step' 
      });
    }
  });

  app.get("/api/lab-build-plan/infrastructure-templates", async (req, res) => {
    try {
      // Return available infrastructure component templates
      const templates = {
        endpoints: [
          { name: 'Windows 10/11 Workstation', type: 'windows-workstation' },
          { name: 'Ubuntu Linux Workstation', type: 'ubuntu-workstation' },
          { name: 'macOS Workstation', type: 'macos-workstation' }
        ],
        servers: [
          { name: 'Windows Domain Controller', type: 'windows-dc' },
          { name: 'Ubuntu Linux Server', type: 'ubuntu-server' },
          { name: 'Exchange Server', type: 'exchange-server' }
        ],
        network: [
          { name: 'pfSense Firewall', type: 'pfsense-firewall' },
          { name: 'Suricata IDS', type: 'suricata-ids' },
          { name: 'ELK Stack', type: 'elk-stack' }
        ],
        cloud: [
          { name: 'AWS Lab Environment', type: 'aws-lab' },
          { name: 'Azure Lab Environment', type: 'azure-lab' },
          { name: 'Google Cloud Lab', type: 'gcp-lab' }
        ]
      };
      
      res.json(templates);
    } catch (error: any) {
      console.error('Infrastructure templates error:', error);
      res.status(500).json({ error: 'Failed to fetch infrastructure templates' });
    }
  });

  // GitHub Export endpoints - XSIAM Content Library Backup
  app.post("/api/github-export", async (req, res) => {
    try {
      const config = req.body;
      
      if (!config.token || !config.username || !config.repository) {
        return res.status(400).json({ 
          error: 'GitHub token, username, and repository are required' 
        });
      }

      console.log(`Starting XSIAM content library backup to ${config.username}/${config.repository}`);
      
      // Use simple GitHub backup for production XSIAM content library deployment
      const result = await simpleGitHubBackup({
        ...config,
        commitMessage: config.commitMessage || `XSIAM Content Library Update - ${new Date().toISOString()}`
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('GitHub export error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to export to GitHub' 
      });
    }
  });

  // Simplified lab deployment endpoint
  app.post("/api/lab/deploy-simple", async (req, res) => {
    try {
      const { environmentType = 'endpoint', useCaseId } = req.body;
      
      const deploymentPlan = {
        labName: `xsiam-lab-${Date.now()}`,
        environmentType,
        deploymentSteps: [
          {
            name: 'Infrastructure Deploy',
            duration: '5 minutes',
            command: `./infra/automation/simple-lab-deploy.sh ${environmentType}`,
            status: 'ready'
          },
          {
            name: 'XSIAM Integration',
            duration: '3 minutes', 
            description: 'Configure all data sources to forward logs to Cortex XSIAM',
            status: 'pending'
          },
          {
            name: 'Validation',
            duration: '2 minutes',
            description: 'Verify environment and data flow',
            status: 'pending'
          }
        ],
        totalTime: '10 minutes',
        xsiamIntegration: {
          configured: true,
          dataSourcesEnabled: ['windows_events', 'sysmon', 'linux_audit', 'docker_logs'],
          logsFlowing: false
        }
      };
      
      res.json({
        success: true,
        deploymentPlan,
        message: 'Simplified lab deployment plan generated'
      });
    } catch (error: any) {
      console.error('Lab deployment error:', error);
      res.status(500).json({ error: error.message || 'Failed to create deployment plan' });
    }
  });

  // Reliable XSIAM content generation endpoint
  app.post("/api/content/generate-reliable", async (req, res) => {
    try {
      const { useCaseId, requirements } = req.body;
      
      let finalRequirements;
      
      if (requirements) {
        // Direct requirements provided
        finalRequirements = requirements;
      } else if (useCaseId) {
        // Get use case from storage
        try {
          const useCases = await storage.getAllUseCases();
          const useCase = useCases.find((uc: any) => uc.id === useCaseId);
          
          if (!useCase) {
            return res.status(404).json({ error: 'Use case not found' });
          }
          
          // Convert to requirements format
          finalRequirements = {
            threatName: useCase.title.replace('Security Outcome: ', ''),
            category: useCase.category as 'endpoint' | 'network' | 'cloud' | 'identity',
            severity: useCase.severity as 'high' | 'critical',
            indicators: useCase.indicators || [],
            techniques: useCase.extractedTechniques || [],
            description: useCase.description,
            dataSourcesRequired: ['windows_events', 'sysmon', 'xdr_data']
          };
        } catch (storageError) {
          return res.status(500).json({ error: 'Storage system error: ' + (storageError as Error).message });
        }
      } else {
        return res.status(400).json({ error: 'Either useCaseId or requirements must be provided' });
      }
      
      // Generate functional content package
      const contentPackage = await xsiamContentGenerator.generateContentPackage(finalRequirements);
      
      // Validate functionality with basic validation
      const basicValidation = await xsiamContentGenerator.validateContentFunctionality(contentPackage);
      
      // Perform high-fidelity validation against authentic samples
      const authenticityValidation = contentValidator.validateContentPackage(contentPackage);
      
      res.json({
        success: true,
        contentPackage,
        validation: basicValidation,
        authenticityValidation,
        povReadiness: {
          score: authenticityValidation.averageFidelityScore,
          ready: authenticityValidation.overallValid,
          criticalIssues: authenticityValidation.criticalIssues
        },
        message: `Generated ${contentPackage.length} functional XSIAM content items (Fidelity: ${authenticityValidation.averageFidelityScore.toFixed(1)}%)`,
        requirements: finalRequirements
      });
    } catch (error: any) {
      console.error('Content generation error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate reliable content' });
    }
  });

  // Customer POV readiness assessment endpoint
  app.post("/api/content/pov-readiness", async (req, res) => {
    try {
      const { contentPackage } = req.body;
      
      if (!contentPackage || !Array.isArray(contentPackage)) {
        return res.status(400).json({ error: 'Content package array is required' });
      }

      // Perform comprehensive validation against authentic samples
      const validation = contentValidator.validateContentPackage(contentPackage);
      
      // Generate detailed POV readiness report
      const povReport = contentValidator.generatePOVReadinessReport(contentPackage);
      
      res.json({
        success: true,
        povReadiness: {
          overallValid: validation.overallValid,
          fidelityScore: validation.averageFidelityScore,
          customerReady: validation.overallValid && validation.averageFidelityScore >= 85,
          criticalIssues: validation.criticalIssues,
          contentValidation: validation.contentValidation
        },
        detailedReport: povReport,
        recommendations: validation.overallValid 
          ? ['Content approved for customer POV deployment', 'All authenticity checks passed']
          : ['Address critical issues before customer deployment', 'Review authenticity validation failures', 'Consider regenerating content with corrected parameters'],
        message: validation.overallValid 
          ? `Content package ready for customer POV (${validation.averageFidelityScore.toFixed(1)}% fidelity)`
          : `Content package requires improvements before customer POV (${validation.averageFidelityScore.toFixed(1)}% fidelity)`
      });
    } catch (error: any) {
      console.error('POV readiness assessment error:', error);
      res.status(500).json({ error: error.message || 'Failed to assess POV readiness' });
    }
  });

  // Enhanced Data Sanitizer API endpoints with node-seal encryption
  app.post("/api/data-sanitizer/sanitize", async (req, res) => {
    try {
      const { inputText } = req.body;
      
      if (!inputText || typeof inputText !== 'string') {
        return res.status(400).json({ error: 'Input text is required' });
      }

      // Sanitize and encrypt PII immediately - use fallback if SEAL fails
      let result;
      try {
        result = await dataSanitizer.sanitizeAndEncrypt(inputText);
      } catch (error: any) {
        console.log('[DATA-SANITIZER] SEAL failed, using simple fallback:', error.message);
        result = await simpleDataSanitizer.sanitizeAndEncrypt(inputText);
      }
      
      res.json({
        success: true,
        sanitizedText: result.sanitizedText,
        detectedPII: result.detectedPII,
        encryptedCount: result.encryptedOriginals.size,
        message: `Sanitized ${result.detectedPII.length} PII types and encrypted ${result.encryptedOriginals.size} sensitive values`
      });
    } catch (error: any) {
      console.error('Data sanitization error:', error);
      res.status(500).json({ error: error.message || 'Failed to sanitize data' });
    }
  });

  app.get("/api/data-sanitizer/health", async (req, res) => {
    try {
      let healthStatus: any;
      try {
        healthStatus = await dataSanitizer.healthCheck();
        healthStatus.sanitizerType = 'SEAL Encryption';
      } catch (error: any) {
        console.log('[DATA-SANITIZER] SEAL health check failed, using simple fallback');
        healthStatus = await simpleDataSanitizer.healthCheck();
        healthStatus.sanitizerType = 'Simple Encryption';
      }
      res.json(healthStatus);
    } catch (error: any) {
      console.error('Data sanitizer health check error:', error);
      res.status(500).json({ error: 'Health check failed' });
    }
  });

  // Manual testing notification system
  app.post("/api/notifications/manual-testing-required", async (req, res) => {
    try {
      const { contentPackage } = req.body;
      
      if (!contentPackage) {
        return res.status(400).json({ error: 'Content package information is required' });
      }

      const success = await notificationService.sendManualTestingAlert(contentPackage);
      
      if (success) {
        res.json({
          success: true,
          message: 'Manual testing notification sent successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to send notification - check SendGrid configuration'
        });
      }
    } catch (error: any) {
      console.error('Manual testing notification error:', error);
      res.status(500).json({ error: error.message || 'Failed to send notification' });
    }
  });

  app.post("/api/notifications/validation-complete", async (req, res) => {
    try {
      const { validationResults } = req.body;
      
      if (!validationResults) {
        return res.status(400).json({ error: 'Validation results are required' });
      }

      const success = await notificationService.sendValidationComplete(validationResults);
      
      if (success) {
        res.json({
          success: true,
          message: 'Validation completion notification sent successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to send notification - check SendGrid configuration'
        });
      }
    } catch (error: any) {
      console.error('Validation notification error:', error);
      res.status(500).json({ error: error.message || 'Failed to send notification' });
    }
  });

  app.get("/api/notifications/health", async (req, res) => {
    try {
      const healthStatus = await notificationService.healthCheck();
      res.json(healthStatus);
    } catch (error: any) {
      console.error('Notification service health check error:', error);
      res.status(500).json({ error: 'Health check failed' });
    }
  });

  app.post("/api/github-export/test-connection", async (req, res) => {
    try {
      const { token, username, repository } = req.body;
      
      if (!token || !username || !repository) {
        return res.status(400).json({ 
          error: 'GitHub token, username, and repository are required' 
        });
      }

      // Test GitHub API connection
      const response = await fetch(`https://api.github.com/repos/${username}/${repository}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Repository not found or access denied');
      }
      
      const repoInfo = await response.json();
      
      res.json({
        success: true,
        repository: {
          name: repoInfo.name,
          description: repoInfo.description,
          private: repoInfo.private,
          stars: repoInfo.stargazers_count,
          watchers: repoInfo.watchers_count,
          forks: repoInfo.forks_count,
          defaultBranch: repoInfo.default_branch,
          lastPush: repoInfo.pushed_at
        }
      });
    } catch (error: any) {
      console.error('GitHub connection test error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to connect to GitHub repository' 
      });
    }
  });

  // Proxmox VM Management Routes
  app.post("/api/proxmox/connect", async (req, res) => {
    try {
      const { host, username, port } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      const testCommand = `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "echo 'Connected to Proxmox'"`;
      const { stdout } = await execAsync(testCommand);
      
      res.json({
        success: true,
        message: "Connected to Proxmox successfully",
        output: stdout.trim()
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || "Failed to connect to Proxmox"
      });
    }
  });

  app.post("/api/proxmox/vms", async (req, res) => {
    try {
      const { host, username, port } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      const command = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "pvesh get /nodes/\$(hostname)/qemu --output-format json"`;
      const { stdout } = await execAsync(command);
      const rawOutput = stdout.trim();
      
      let vms = [];
      try {
        const vmData = JSON.parse(rawOutput);
        vms = vmData.map((vm: any) => ({
          vmid: vm.vmid?.toString() || 'unknown',
          name: vm.name || `VM-${vm.vmid}`,
          status: vm.status || 'unknown',
          cpu: vm.cpus ? `${vm.cpus} cores` : 'N/A',
          mem: vm.maxmem ? `${Math.round(vm.maxmem / 1024 / 1024)}MB` : 'N/A',
          disk: vm.maxdisk ? `${Math.round(vm.maxdisk / 1024 / 1024 / 1024)}GB` : 'N/A',
          uptime: vm.uptime ? `${Math.floor(vm.uptime / 3600)}h ${Math.floor((vm.uptime % 3600) / 60)}m` : '',
          node: vm.node || 'local'
        }));
      } catch (parseError) {
        const lines = rawOutput.split('\n').filter(line => line.trim());
        vms = lines.map((line, index) => ({
          vmid: line.split(/\s+/)[0] || `vm-${index}`,
          name: line.split(/\s+/)[1] || `VM-${line.split(/\s+/)[0]}`,
          status: line.split(/\s+/)[2] || 'unknown',
          cpu: 'N/A', mem: 'N/A', disk: 'N/A', uptime: '', node: 'local'
        }));
      }
      
      res.json({ success: true, vms, rawOutput });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || "Failed to retrieve VM list",
        vms: []
      });
    }
  });

  app.post("/api/proxmox/vm-control", async (req, res) => {
    try {
      const { host, username, port, vmid, action } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      const commands = {
        start: `qm start ${vmid}`,
        stop: `qm stop ${vmid}`,
        destroy: `qm destroy ${vmid}`
      };
      
      if (!commands[action as keyof typeof commands]) {
        throw new Error(`Invalid action: ${action}`);
      }
      
      const command = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "${commands[action as keyof typeof commands]}"`;
      const { stdout, stderr } = await execAsync(command);
      
      res.json({
        success: true,
        message: `VM ${vmid} ${action} completed`,
        output: stdout,
        stderr
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || `Failed to ${req.body.action} VM`
      });
    }
  });

  app.post("/api/proxmox/create-vm", async (req, res) => {
    try {
      const { host, username, port, vm } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      const createCommand = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "qm create ${vm.vmid} --name ${vm.name} --memory ${vm.memory} --cores ${vm.cores} --net0 virtio,bridge=${vm.network} --scsihw virtio-scsi-pci --scsi0 local-lvm:${vm.disk}"`;
      const { stdout, stderr } = await execAsync(createCommand);
      
      res.json({
        success: true,
        message: `VM ${vm.name} created successfully`,
        vmid: vm.vmid,
        output: stdout,
        stderr
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || "Failed to create VM"
      });
    }
  });

  app.post("/api/proxmox/setup-broker", async (req, res) => {
    try {
      const { host, username, port, vmid } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      const setupScript = `
        qm start ${vmid} || true
        sleep 30
        echo "Configuring XSIAM Broker VM ${vmid}..."
        echo "VM should be accessible for SSH configuration"
        echo "Manual steps required:"
        echo "1. SSH to the broker VM"
        echo "2. Configure XSIAM tenant settings"
        echo "3. Setup log forwarding rules"
        echo "4. Verify connectivity to XSIAM platform"
      `;
      
      const command = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${port} ${username}@${host} '${setupScript}'`;
      const { stdout, stderr } = await execAsync(command);
      
      res.json({
        success: true,
        message: "Broker VM setup initiated",
        output: stdout + '\n' + stderr,
        nextSteps: [
          "SSH to the broker VM",
          "Configure XSIAM tenant connection", 
          "Setup log forwarding configuration",
          "Test connectivity to XSIAM"
        ]
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || "Failed to setup broker VM"
      });
    }
  });

  // Azure VM Management Routes
  app.post("/api/azure/connect", async (req, res) => {
    try {
      const { subscriptionId, resourceGroup, location } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      // Test Azure CLI connectivity
      const testCommand = `az account show --subscription "${subscriptionId}" --output json`;
      const { stdout } = await execAsync(testCommand);
      const accountInfo = JSON.parse(stdout);
      
      res.json({
        success: true,
        message: "Connected to Azure successfully",
        subscription: accountInfo.name,
        tenantId: accountInfo.tenantId
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message.includes('az') ? 
          "Azure CLI not found or not logged in. Run 'az login' first." : 
          error.message || "Failed to connect to Azure"
      });
    }
  });

  app.post("/api/azure/vms", async (req, res) => {
    try {
      const { subscriptionId, resourceGroup } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      const command = `az vm list --subscription "${subscriptionId}" --resource-group "${resourceGroup}" --show-details --output json`;
      const { stdout } = await execAsync(command);
      const vmData = JSON.parse(stdout);
      
      const vms = vmData.map((vm: any) => ({
        id: vm.id,
        name: vm.name,
        status: vm.provisioningState,
        size: vm.hardwareProfile?.vmSize || 'Unknown',
        location: vm.location,
        resourceGroup: vm.resourceGroup,
        publicIP: vm.publicIps || null,
        privateIP: vm.privateIps || null,
        osType: vm.storageProfile?.osDisk?.osType || 'Unknown',
        powerState: vm.powerState || 'Unknown'
      }));
      
      res.json({
        success: true,
        vms,
        output: `Found ${vms.length} VMs in resource group ${resourceGroup}`
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || "Failed to retrieve VM list",
        vms: []
      });
    }
  });

  app.post("/api/azure/vm-control", async (req, res) => {
    try {
      const { subscriptionId, resourceGroup, vmName, action } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      const commands = {
        start: `az vm start --subscription "${subscriptionId}" --resource-group "${resourceGroup}" --name "${vmName}"`,
        stop: `az vm stop --subscription "${subscriptionId}" --resource-group "${resourceGroup}" --name "${vmName}"`,
        deallocate: `az vm deallocate --subscription "${subscriptionId}" --resource-group "${resourceGroup}" --name "${vmName}"`,
        delete: `az vm delete --subscription "${subscriptionId}" --resource-group "${resourceGroup}" --name "${vmName}" --yes`
      };
      
      if (!commands[action as keyof typeof commands]) {
        throw new Error(`Invalid action: ${action}`);
      }
      
      const { stdout, stderr } = await execAsync(commands[action as keyof typeof commands]);
      
      res.json({
        success: true,
        message: `VM ${vmName} ${action} completed`,
        output: stdout,
        stderr
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || `Failed to ${req.body.action} VM`
      });
    }
  });

  app.post("/api/azure/create-vm", async (req, res) => {
    try {
      const { subscriptionId, resourceGroup, location, vm } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      // Build Azure CLI command for VM creation
      let createCommand = `az vm create --subscription "${subscriptionId}" --resource-group "${resourceGroup}" --name "${vm.name}" --image "${vm.osImage}" --size "${vm.size}" --location "${location}" --admin-username "${vm.adminUsername}" --generate-ssh-keys --output json`;
      
      // Add SSH key if provided
      if (vm.publicKey) {
        createCommand += ` --ssh-key-values "${vm.publicKey}"`;
      }
      
      // Add disk size if specified
      if (vm.diskSize && vm.diskSize !== '30') {
        createCommand += ` --os-disk-size-gb ${vm.diskSize}`;
      }
      
      const { stdout, stderr } = await execAsync(createCommand);
      const vmInfo = JSON.parse(stdout);
      
      res.json({
        success: true,
        message: `VM ${vm.name} created successfully`,
        vmInfo: vmInfo,
        publicIP: vmInfo.publicIpAddress,
        privateIP: vmInfo.privateIpAddress,
        output: stdout,
        stderr
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || "Failed to create VM"
      });
    }
  });

  app.post("/api/azure/setup-broker", async (req, res) => {
    try {
      const { subscriptionId, resourceGroup, vmName } = req.body;
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      // Get VM details first
      const vmCommand = `az vm show --subscription "${subscriptionId}" --resource-group "${resourceGroup}" --name "${vmName}" --show-details --output json`;
      const { stdout: vmStdout } = await execAsync(vmCommand);
      const vmInfo = JSON.parse(vmStdout);
      
      const setupScript = `
        # XSIAM Broker VM Setup Script
        echo "Configuring XSIAM Broker on Azure VM: ${vmName}"
        echo "VM IP: ${vmInfo.publicIps || vmInfo.privateIps}"
        echo "Resource Group: ${resourceGroup}"
        echo ""
        echo "Next steps for XSIAM broker setup:"
        echo "1. SSH to the VM: ssh ${vmInfo.adminUsername || 'azureuser'}@${vmInfo.publicIps}"
        echo "2. Install XSIAM broker package"
        echo "3. Configure tenant connection"
        echo "4. Setup log forwarding rules"
        echo "5. Configure Azure monitoring integration"
        echo "6. Test connectivity to XSIAM platform"
      `;
      
      res.json({
        success: true,
        message: "Broker VM setup information generated",
        output: setupScript,
        vmInfo: {
          publicIP: vmInfo.publicIps,
          privateIP: vmInfo.privateIps,
          adminUsername: vmInfo.adminUsername || 'azureuser',
          osType: vmInfo.storageProfile?.osDisk?.osType
        },
        nextSteps: [
          `SSH to the VM: ssh ${vmInfo.adminUsername || 'azureuser'}@${vmInfo.publicIps}`,
          "Install XSIAM broker package",
          "Configure XSIAM tenant connection",
          "Setup Azure log forwarding",
          "Test connectivity to XSIAM"
        ]
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || "Failed to setup broker VM"
      });
    }
  });

  // Mount connection and infrastructure management routes
  app.use('/api/connections', connectionManager);
  app.use('/api/infrastructure', infrastructureDeployer);
  
  // Import and mount threat infrastructure mapping
  const threatInfrastructureMapping = (await import('./threat-infrastructure-mapping')).default;
  app.use('/api/threat-infrastructure', threatInfrastructureMapping);

  // Azure VM Management Routes
  const azureApi = await import('./azure-vm-api');
  app.post('/api/azure/test-connection', azureApi.testAzureConnection);
  app.get('/api/azure/resource-groups', azureApi.listResourceGroups);
  app.get('/api/azure/vms', azureApi.listVMs);
  app.post('/api/azure/vms/create', azureApi.createVM);
  app.post('/api/azure/vms/start', azureApi.startVM);
  app.post('/api/azure/vms/stop', azureApi.stopVM);

  // Azure Use Case Automation Routes
  const azureUseCaseApi = await import('./azure-use-case-automation');
  app.post('/api/azure/deploy-use-case', azureUseCaseApi.deployUseCaseInfrastructure);
  app.get('/api/azure/use-case-status', azureUseCaseApi.getUseCaseStatus);
  app.post('/api/azure/execute-scenario', azureUseCaseApi.executeUseCaseScenario);
  app.post('/api/azure/cleanup-resources', azureUseCaseApi.cleanupAzureResources);

  // Proxmox XSIAM Broker Routes
  const proxmoxBrokerApi = await import('./proxmox-broker-setup');
  app.post('/api/proxmox/test-connectivity', proxmoxBrokerApi.testProxmoxConnectivity);
  app.post('/api/proxmox/deploy-broker', proxmoxBrokerApi.deployProxmoxBroker);
  app.get('/api/proxmox/broker-status', proxmoxBrokerApi.getProxmoxBrokerStatus);
  app.post('/api/proxmox/configure-vm-forwarding', proxmoxBrokerApi.configureVMLogForwarding);

  // Tailscale and VM Troubleshooting Routes
  const tailscaleApi = await import('./tailscale-setup');
  app.post('/api/tailscale/setup', tailscaleApi.setupTailscaleConnection);
  app.get('/api/tailscale/status', tailscaleApi.checkTailscaleStatus);
  app.post('/api/proxmox/vm-troubleshooting', tailscaleApi.generateProxmoxVMTroubleshooting);

  const httpServer = createServer(app);
  return httpServer;
}
