import type { UseCase, TrainingPath } from "@shared/schema";

export interface LabBuildoutStep {
  id: string;
  title: string;
  description: string;
  category: 'environment_buildout' | 'detection_engineering' | 'automation_playbook' | 'layout_configuration';
  estimatedDuration: number;
  prerequisites: string[];
  instructions: string;
  validationCriteria: string[];
  troubleshooting: string[];
  relatedComponents: string[];
}

export interface LabConfiguration {
  labType: 'poc' | 'pilot' | 'production' | 'demo';
  environment: 'cloud' | 'hybrid' | 'on_premise';
  dataVolume: 'small' | 'medium' | 'large' | 'enterprise';
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  timeline: 'sprint' | 'month' | 'quarter' | 'extended';
}

export function generateLabBuildoutPath(useCase: UseCase, config: LabConfiguration): TrainingPath {
  const steps = generateLabBuildoutSteps(useCase, config);
  
  return {
    id: `lab_buildout_${useCase.id}_${Date.now()}`,
    useCaseId: useCase.id,
    title: `Lab Buildout: ${useCase.title}`,
    description: `Comprehensive step-by-step lab infrastructure setup and validation for ${useCase.title}`,
    totalDuration: steps.reduce((total, step) => total + step.estimatedDuration, 0),
    steps: steps.map(step => ({
      id: step.id,
      title: step.title,
      description: step.description,
      content: formatStepContent(step),
      category: step.category,
      estimatedDuration: step.estimatedDuration,
      completed: false,
      validationRequired: true,
      dependencies: step.prerequisites,
      metadata: {
        validationCriteria: step.validationCriteria,
        troubleshooting: step.troubleshooting,
        relatedComponents: step.relatedComponents
      }
    })),
    progress: 0,
    status: 'not_started',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function generateLabBuildoutSteps(useCase: UseCase, config: LabConfiguration): LabBuildoutStep[] {
  const baseSteps: LabBuildoutStep[] = [];
  
  // 1. Infrastructure Planning and Assessment
  baseSteps.push({
    id: 'infra_planning',
    title: 'Infrastructure Planning and Assessment',
    description: 'Assess current infrastructure and plan lab deployment architecture',
    category: 'environment_buildout',
    estimatedDuration: 45,
    prerequisites: ['network_access', 'admin_credentials'],
    instructions: generateInfrastructurePlanningInstructions(useCase, config),
    validationCriteria: [
      'Network topology documented',
      'Resource requirements calculated',
      'Security boundaries defined',
      'Deployment timeline established'
    ],
    troubleshooting: [
      'If network assessment fails, verify administrative access',
      'For resource constraints, consider cloud deployment options',
      'Contact network team for firewall rule requirements'
    ],
    relatedComponents: ['network', 'compute', 'storage', 'security']
  });

  // 2. Tenant and License Configuration
  baseSteps.push({
    id: 'tenant_setup',
    title: 'Cortex Tenant Configuration',
    description: 'Configure Cortex tenant with appropriate licenses and settings',
    category: 'environment_buildout',
    estimatedDuration: 30,
    prerequisites: ['cortex_tenant_access', 'license_keys'],
    instructions: generateTenantSetupInstructions(useCase, config),
    validationCriteria: [
      'Tenant accessible and responsive',
      'Licenses properly allocated',
      'User accounts configured',
      'Initial policies applied'
    ],
    troubleshooting: [
      'For login issues, verify SSO configuration',
      'If licenses missing, contact Palo Alto support',
      'For policy errors, check role permissions'
    ],
    relatedComponents: ['tenant', 'licenses', 'users', 'policies']
  });

  // 3. Data Source Integration
  baseSteps.push({
    id: 'data_integration',
    title: 'Data Source Integration Setup',
    description: 'Configure and validate data source integrations based on use case requirements',
    category: 'environment_buildout',
    estimatedDuration: 90,
    prerequisites: ['tenant_setup', 'source_access'],
    instructions: generateDataIntegrationInstructions(useCase, config),
    validationCriteria: [
      'All required data sources connected',
      'Data ingestion functioning properly',
      'Field mapping validated',
      'Data volume within expected range'
    ],
    troubleshooting: [
      'For connection errors, verify API credentials',
      'If data missing, check source configuration',
      'For parsing issues, review field mappings'
    ],
    relatedComponents: ['brokers', 'engines', 'apis', 'parsers']
  });

  // 4. Agent Deployment (if endpoint-related)
  if (useCase.category === 'endpoint') {
    baseSteps.push({
      id: 'agent_deployment',
      title: 'Cortex XDR Agent Deployment',
      description: 'Deploy and configure Cortex XDR agents on target endpoints',
      category: 'environment_buildout',
      estimatedDuration: 60,
      prerequisites: ['endpoint_access', 'deployment_package'],
      instructions: generateAgentDeploymentInstructions(useCase, config),
      validationCriteria: [
        'Agents successfully installed',
        'Agent connectivity verified',
        'Telemetry data flowing',
        'Policy enforcement active'
      ],
      troubleshooting: [
        'For installation failures, check system requirements',
        'If agents offline, verify network connectivity',
        'For policy issues, review distribution group settings'
      ],
      relatedComponents: ['endpoints', 'agents', 'policies', 'telemetry']
    });
  }

  // 5. Detection Rule Configuration
  baseSteps.push({
    id: 'detection_rules',
    title: 'Detection Rule Configuration',
    description: 'Configure and tune detection rules specific to the use case',
    category: 'detection_engineering',
    estimatedDuration: 75,
    prerequisites: ['data_integration', 'baseline_established'],
    instructions: generateDetectionRuleInstructions(useCase, config),
    validationCriteria: [
      'Detection rules created and enabled',
      'Alert thresholds properly configured',
      'False positive rate acceptable',
      'Test detection successful'
    ],
    troubleshooting: [
      'For rule errors, validate XQL syntax',
      'If no alerts, check data source availability',
      'For high false positives, adjust thresholds'
    ],
    relatedComponents: ['rules', 'xql', 'alerts', 'thresholds']
  });

  // 6. Alert Layout and Dashboard Setup
  baseSteps.push({
    id: 'alert_layouts',
    title: 'Alert Layout and Dashboard Configuration',
    description: 'Create custom alert layouts and operational dashboards',
    category: 'layout_configuration',
    estimatedDuration: 45,
    prerequisites: ['detection_rules', 'ui_access'],
    instructions: generateAlertLayoutInstructions(useCase, config),
    validationCriteria: [
      'Alert layouts properly formatted',
      'Dashboards displaying relevant data',
      'Widgets functioning correctly',
      'User access permissions set'
    ],
    troubleshooting: [
      'For layout errors, check JSON syntax',
      'If widgets empty, verify data sources',
      'For permission issues, review user roles'
    ],
    relatedComponents: ['layouts', 'dashboards', 'widgets', 'permissions']
  });

  // 7. Dashboard and Widget Development
  baseSteps.push({
    id: 'dashboard_widgets',
    title: 'Operational Dashboard and Widget Creation',
    description: 'Build comprehensive dashboards and custom widgets for monitoring and analysis',
    category: 'dashboard_creation',
    estimatedDuration: 60,
    prerequisites: ['alert_layouts', 'data_validation'],
    instructions: generateDashboardInstructions(useCase, config),
    validationCriteria: [
      'Dashboards displaying relevant metrics',
      'Widgets functioning with live data',
      'User access permissions configured',
      'Performance within acceptable limits'
    ],
    troubleshooting: [
      'For widget errors, verify data source connections',
      'If dashboards slow, optimize queries and caching',
      'For access issues, review user role permissions'
    ],
    relatedComponents: ['dashboards', 'widgets', 'metrics', 'analytics']
  });

  // 8. Automation Playbook Development
  baseSteps.push({
    id: 'automation_playbooks',
    title: 'Automation Playbook Development',
    description: 'Develop and test automation playbooks for incident response',
    category: 'automation_playbook',
    estimatedDuration: 120,
    prerequisites: ['alert_layouts', 'integration_apis'],
    instructions: generatePlaybookInstructions(useCase, config),
    validationCriteria: [
      'Playbooks execute successfully',
      'Integration points functioning',
      'Error handling working properly',
      'Performance within acceptable limits'
    ],
    troubleshooting: [
      'For execution errors, check API credentials',
      'If timeouts occur, review network latency',
      'For logic errors, validate playbook flow'
    ],
    relatedComponents: ['playbooks', 'apis', 'workflows', 'integrations']
  });

  // 9. Comprehensive Validation and Testing
  baseSteps.push({
    id: 'validation_testing',
    title: 'End-to-End Validation and Testing',
    description: 'Perform comprehensive testing of the complete lab setup',
    category: 'environment_buildout',
    estimatedDuration: 90,
    prerequisites: ['automation_playbooks', 'test_scenarios'],
    instructions: generateValidationInstructions(useCase, config),
    validationCriteria: [
      'All components functioning together',
      'Use case scenarios successfully tested',
      'Performance metrics within targets',
      'Documentation complete and accurate'
    ],
    troubleshooting: [
      'For integration failures, check component dependencies',
      'If performance poor, review resource allocation',
      'For test failures, validate test data and scenarios'
    ],
    relatedComponents: ['testing', 'integration', 'performance', 'documentation']
  });

  return baseSteps;
}

function generateInfrastructurePlanningInstructions(useCase: UseCase, config: LabConfiguration): string {
  const categorySpecificInstructions = generateCategorySpecificInfrastructure(useCase.category, useCase, config);
  
  return `
## Infrastructure Assessment and Planning

### 1. Current Environment Analysis
\`\`\`bash
# Network connectivity check
ping cortex-data-lake.paloaltonetworks.com
nslookup *.xdr.us.paloaltonetworks.com

# Resource assessment
df -h  # Storage availability
free -h  # Memory usage
lscpu  # CPU information
\`\`\`

### 2. Architecture Planning
Based on use case: **${useCase.title}**
- **Lab Type**: ${config.labType}
- **Environment**: ${config.environment}
- **Data Volume**: ${config.dataVolume}
- **Complexity**: ${config.complexity}

### 3. Network Requirements
- Cortex tenant connectivity (port 443)
- Log forwarding ports (514, 6514 for syslog)
- Agent communication (port 443)
- API access for integrations

### 4. Resource Planning
${generateResourceRequirements(config)}

### 5. Security Considerations
- Network segmentation for lab environment
- Firewall rules for Cortex connectivity
- Certificate management for secure communications
- Access control for lab resources

### 6. Timeline and Milestones
${generateDeploymentTimeline(config)}
`;
}

function generateTenantSetupInstructions(useCase: UseCase, config: LabConfiguration): string {
  return `
## Cortex Tenant Configuration

### 1. Tenant Access Verification
1. Log into Cortex tenant: \`https://[tenant-name].xdr.us.paloaltonetworks.com\`
2. Verify administrative privileges
3. Check license allocation and expiration dates

### 2. Initial Configuration
\`\`\`json
{
  "tenant_settings": {
    "data_retention": "${getDataRetention(config)}",
    "time_zone": "UTC",
    "alert_retention": "90_days",
    "audit_logging": "enabled"
  }
}
\`\`\`

### 3. User and Role Management
- Create dedicated lab users
- Assign appropriate roles (Security Admin, Analyst)
- Configure access permissions for lab resources

### 4. Policy Configuration
- Set up distribution groups for agents
- Configure initial prevention policies
- Enable audit logging and monitoring

### 5. Integration Preparation
- Generate API keys for automation
- Configure webhook endpoints
- Set up SAML/SSO if required
`;
}

function generateDataIntegrationInstructions(useCase: UseCase, config: LabConfiguration): string {
  const dataSources = extractDataSources(useCase);
  
  return `
## Data Source Integration Setup

### Required Data Sources for ${useCase.title}:
${dataSources.map(source => `- ${source}`).join('\n')}

### 1. Broker/Engine Deployment
\`\`\`bash
# Download broker package
wget https://[tenant]/public_api/v1/brokers/download/[package]

# Install broker
sudo dpkg -i cortex-xsiam-broker_[version].deb
sudo systemctl enable cortex-xsiam-broker
sudo systemctl start cortex-xsiam-broker
\`\`\`

### 2. Data Source Configuration
${generateDataSourceConfig(dataSources, config)}

### 3. Parser Configuration
- Configure field mapping for custom logs
- Set up normalization rules
- Test parsing with sample data

### 4. Data Flow Validation
\`\`\`bash
# Check broker status
sudo systemctl status cortex-xsiam-broker

# Verify data ingestion
curl -X GET "https://[tenant]/public_api/v1/logs/search" \\
  -H "Authorization: [api-key]" \\
  -d '{"query": "dataset in (xdr_data)", "limit": 10}'
\`\`\`
`;
}

function generateAgentDeploymentInstructions(useCase: UseCase, config: LabConfiguration): string {
  return `
## Cortex XDR Agent Deployment

### 1. Agent Package Preparation
1. Download agent from Cortex console
2. Create distribution groups for lab endpoints
3. Configure deployment policies

### 2. Deployment Methods
${generateDeploymentMethods(config)}

### 3. Agent Configuration
\`\`\`json
{
  "agent_settings": {
    "protection_mode": "report",
    "behavioral_analysis": "enabled",
    "local_analysis": "enabled",
    "content_update": "automatic"
  }
}
\`\`\`

### 4. Validation Steps
- Verify agent connectivity
- Check telemetry data flow
- Test prevention capabilities (in report mode)
- Validate policy enforcement
`;
}

function generateDetectionRuleInstructions(useCase: UseCase, config: LabConfiguration): string {
  const categorySpecificXQL = generateCategorySpecificDetectionRule(useCase);
  
  return `
## Detection Rule Configuration

### 1. Use Case Analysis
**Threat**: ${useCase.title}
**Category**: ${useCase.category}
**Severity**: ${useCase.severity}

### 2. Category-Specific XQL Rule Development
${categorySpecificXQL}

### 3. Threshold Configuration
- Set appropriate alert thresholds
- Configure time windows for correlation
- Define suppression rules to reduce noise

### 4. Testing and Tuning
- Generate test events
- Validate detection accuracy
- Adjust rules based on false positive analysis
- Document tuning decisions
`;
}

function generateCategorySpecificDetectionRule(useCase: UseCase): string {
  const useCaseContext = analyzeUseCaseContext(useCase);
  
  switch (useCase.category) {
    case 'cloud':
      if (useCaseContext.isKubernetes || useCaseContext.isIngress) {
        return `
\`\`\`sql
-- ${useCase.title} Detection Rule
-- CVEs: ${useCaseContext.cveNumbers.length > 0 ? useCaseContext.cveNumbers.join(', ') : 'Custom threat'}
-- Vulnerability Types: ${useCaseContext.vulnerabilityTypes.join(', ')}
-- Technologies: ${useCaseContext.technologies.join(', ')}
dataset = kubernetes_audit
| filter verb in ("create", "update", "patch")
| filter objectRef_resource = "ingresses"
| filter requestObject_metadata_annotations contains "nginx.ingress.kubernetes.io/server-snippet"
${useCaseContext.specificPatterns.map(pattern => `| filter requestObject_metadata_annotations contains "${pattern}"`).join('\n')}
| alter severity = "${useCaseContext.threatContext.severity.toUpperCase()}"
| alter threat_name = "${useCase.title.replace(/[^a-zA-Z0-9]/g, '_')}"
| alter cve_numbers = "${useCaseContext.cveNumbers.join(',')}"
| alter attack_vectors = "${useCaseContext.attackVectors.join(',')}"
| alter affected_components = "${useCaseContext.affectedComponents.join(',')}"
| fields _time, user_username, sourceIPs, objectRef_namespace, objectRef_name, requestObject_metadata_annotations, cve_numbers, attack_vectors
| limit 100
\`\`\`

### Additional Detection Rules for ${useCase.title}
\`\`\`sql
-- Context-specific rule based on: ${useCase.description}
${generateContextualKubernetesRules(useCaseContext, useCase)}
\`\`\``;
      } else {
        return `
\`\`\`sql
-- ${useCase.title} Cloud Detection Rule
-- Technologies: ${useCaseContext.technologies.join(', ')}
-- Attack Vectors: ${useCaseContext.attackVectors.join(', ')}
dataset = cloud_audit_logs
| filter event_name in ("CreateRole", "AttachRolePolicy", "PutBucketPolicy")
| filter error_code = null
| filter source_ip != "console.aws.amazon.com"
| alter severity = "${useCaseContext.threatContext.severity.toUpperCase()}"
| alter cve_numbers = "${useCaseContext.cveNumbers.join(',')}"
| alter vulnerability_types = "${useCaseContext.vulnerabilityTypes.join(',')}"
| fields _time, user_name, source_ip, event_name, resources, cve_numbers, vulnerability_types
\`\`\``;
      }

    case 'endpoint':
      return generateEndpointSpecificRule(useCase, useCaseContext);

    case 'network':
      return generateNetworkSpecificRule(useCase, useCaseContext);

    case 'identity':
      return generateIdentitySpecificRule(useCase, useCaseContext);

    default:
      return `
\`\`\`sql
-- ${useCase.title} Detection Rule
-- Context: ${useCase.description}
dataset = xdr_data
| filter event_type = "STORY"
| filter severity in ("high", "critical")
| alter custom_severity = "HIGH"
| fields _time, event_type, description, severity
\`\`\``;
  }
}

// Context analysis function to extract use case specifics from threat report content
function analyzeUseCaseContext(useCase: UseCase) {
  const title = useCase.title.toLowerCase();
  const description = useCase.description.toLowerCase();
  
  // Get the actual threat report content for deeper analysis
  const threatReportContent = getThreatReportContent(useCase);
  const combined = `${title} ${description} ${threatReportContent}`.toLowerCase();
  
  return {
    isKubernetes: detectKubernetes(combined),
    isIngress: detectIngress(combined),
    isContainer: detectContainer(combined),
    isRCE: detectRCE(combined),
    isCVE: detectCVE(combined),
    specificPatterns: extractSpecificPatterns(combined),
    attackVectors: extractAttackVectors(combined),
    affectedComponents: extractAffectedComponents(combined),
    cveNumbers: extractCVENumbers(combined),
    vulnerabilityTypes: extractVulnerabilityTypes(combined),
    technologies: extractTechnologies(combined),
    threatContext: extractThreatContext(combined)
  };
}

function getThreatReportContent(useCase: UseCase): string {
  // In a real implementation, this would fetch the full threat report content
  // For now, we'll extract from the description which contains truncated content
  return useCase.description || '';
}

function detectKubernetes(text: string): boolean {
  const kubernetesIndicators = [
    'kubernetes', 'k8s', 'kubectl', 'pod', 'namespace', 'cluster',
    'ingress', 'deployment', 'service', 'configmap', 'secret',
    'admission controller', 'api server', 'etcd', 'kubelet'
  ];
  return kubernetesIndicators.some(indicator => text.includes(indicator));
}

function detectIngress(text: string): boolean {
  const ingressIndicators = [
    'ingress', 'nginx', 'ingress-nginx', 'ingress controller',
    'nginx.ingress.kubernetes.io', 'server-snippet', 'annotation'
  ];
  return ingressIndicators.some(indicator => text.includes(indicator));
}

function detectContainer(text: string): boolean {
  const containerIndicators = [
    'container', 'docker', 'containerd', 'runtime', 'pod',
    'image', 'registry', 'dockerfile', 'containerized'
  ];
  return containerIndicators.some(indicator => text.includes(indicator));
}

function detectRCE(text: string): boolean {
  const rceIndicators = [
    'remote code execution', 'rce', 'code execution', 'command execution',
    'arbitrary code', 'shell execution', 'payload execution'
  ];
  return rceIndicators.some(indicator => text.includes(indicator));
}

function detectCVE(text: string): boolean {
  return /cve-\d{4}-\d+/i.test(text);
}

function extractCVENumbers(text: string): string[] {
  const cvePattern = /cve-\d{4}-\d+/gi;
  const matches = text.match(cvePattern);
  return matches ? [...new Set(matches.map(cve => cve.toUpperCase()))] : [];
}

function extractVulnerabilityTypes(text: string): string[] {
  const vulnTypes = [];
  const vulnPatterns = {
    'Remote Code Execution': ['remote code execution', 'rce', 'code execution'],
    'Privilege Escalation': ['privilege escalation', 'privesc', 'elevation'],
    'Authentication Bypass': ['authentication bypass', 'auth bypass', 'unauthorized access'],
    'Injection': ['injection', 'script injection', 'command injection'],
    'Information Disclosure': ['information disclosure', 'data leakage', 'sensitive information'],
    'Denial of Service': ['denial of service', 'dos', 'resource exhaustion'],
    'Server-Side Request Forgery': ['ssrf', 'server-side request forgery'],
    'Cross-Site Scripting': ['xss', 'cross-site scripting'],
    'Directory Traversal': ['directory traversal', 'path traversal', 'lfi']
  };
  
  Object.entries(vulnPatterns).forEach(([type, patterns]) => {
    if (patterns.some(pattern => text.includes(pattern))) {
      vulnTypes.push(type);
    }
  });
  
  return vulnTypes;
}

function extractTechnologies(text: string): string[] {
  const technologies = [];
  const techPatterns = {
    'Kubernetes': ['kubernetes', 'k8s'],
    'NGINX': ['nginx', 'ingress-nginx'],
    'Docker': ['docker', 'container'],
    'AWS': ['aws', 'amazon web services', 'ec2', 's3'],
    'Azure': ['azure', 'microsoft azure'],
    'GCP': ['gcp', 'google cloud platform'],
    'Apache': ['apache'],
    'Tomcat': ['tomcat'],
    'Jenkins': ['jenkins'],
    'Redis': ['redis'],
    'MongoDB': ['mongodb', 'mongo'],
    'MySQL': ['mysql'],
    'PostgreSQL': ['postgresql', 'postgres']
  };
  
  Object.entries(techPatterns).forEach(([tech, patterns]) => {
    if (patterns.some(pattern => text.includes(pattern))) {
      technologies.push(tech);
    }
  });
  
  return technologies;
}

function extractThreatContext(text: string): {
  severity: string;
  attackComplexity: string;
  impactScope: string;
  exploitability: string;
} {
  // Extract CVSS score and contextual information
  const cvssMatch = text.match(/cvss.*?(\d+\.\d+)/i);
  const cvssScore = cvssMatch ? parseFloat(cvssMatch[1]) : 0;
  
  let severity = 'medium';
  if (cvssScore >= 9.0) severity = 'critical';
  else if (cvssScore >= 7.0) severity = 'high';
  else if (cvssScore >= 4.0) severity = 'medium';
  else if (cvssScore > 0) severity = 'low';
  
  const attackComplexity = text.includes('unauthenticated') ? 'low' : 
                          text.includes('authenticated') ? 'high' : 'medium';
  
  const impactScope = text.includes('cluster takeover') || text.includes('full compromise') ? 'changed' : 'unchanged';
  
  const exploitability = text.includes('exploit available') || text.includes('public exploit') ? 'high' : 'medium';
  
  return { severity, attackComplexity, impactScope, exploitability };
}

function extractSpecificPatterns(text: string): string[] {
  const patterns = [];
  
  // Extract actual patterns from threat report content
  const patternIndicators = {
    'lua': ['lua', 'lua script', 'lua_resty'],
    'server-snippet': ['server-snippet', 'nginx.ingress.kubernetes.io/server-snippet'],
    'ngx.exec': ['ngx.exec', 'nginx exec'],
    'annotation': ['annotation', 'metadata.annotations'],
    'injection': ['injection', 'script injection', 'code injection'],
    'webhook': ['webhook', 'admission webhook', 'validating webhook'],
    'rbac': ['rbac', 'role-based access'],
    'secret': ['secret', 'kubernetes secret', 'cluster secret'],
    'privilege': ['privilege', 'privileged', 'escalation'],
    'bypass': ['bypass', 'circumvent', 'evade']
  };
  
  Object.entries(patternIndicators).forEach(([pattern, indicators]) => {
    if (indicators.some(indicator => text.includes(indicator))) {
      patterns.push(pattern);
    }
  });
  
  return patterns;
}

function extractAttackVectors(text: string): string[] {
  const vectors = [];
  
  const vectorPatterns = {
    'Kubernetes annotation manipulation': ['annotation', 'metadata.annotations', 'server-snippet'],
    'Ingress controller exploitation': ['ingress', 'ingress controller', 'nginx ingress'],
    'Admission controller bypass': ['admission', 'admission controller', 'webhook bypass'],
    'Privilege escalation': ['privilege', 'escalation', 'elevated privileges'],
    'Container escape': ['container escape', 'breakout', 'sandbox escape'],
    'Secret extraction': ['secret', 'sensitive data', 'credentials'],
    'Cluster takeover': ['cluster takeover', 'full compromise', 'administrative access'],
    'API server exploitation': ['api server', 'kubernetes api', 'etcd'],
    'Network policy bypass': ['network policy', 'network segmentation', 'lateral movement'],
    'RBAC manipulation': ['rbac', 'role binding', 'cluster role']
  };
  
  Object.entries(vectorPatterns).forEach(([vector, patterns]) => {
    if (patterns.some(pattern => text.includes(pattern))) {
      vectors.push(vector);
    }
  });
  
  return vectors;
}

function extractAffectedComponents(text: string): string[] {
  const components = [];
  
  const componentPatterns = {
    'NGINX Ingress Controller': ['ingress controller', 'nginx ingress', 'ingress-nginx'],
    'Kubernetes API Server': ['api server', 'kubernetes api', 'kube-apiserver'],
    'Admission Controllers': ['admission controller', 'admission webhook'],
    'Validation Webhooks': ['validation webhook', 'validating webhook'],
    'Mutating Webhooks': ['mutating webhook', 'mutating admission'],
    'Container Runtime': ['container runtime', 'containerd', 'docker runtime'],
    'etcd Database': ['etcd', 'kubernetes database'],
    'kubelet': ['kubelet', 'node agent'],
    'kube-proxy': ['kube-proxy', 'network proxy'],
    'CoreDNS': ['coredns', 'dns'],
    'Helm': ['helm', 'package manager'],
    'Istio Service Mesh': ['istio', 'service mesh'],
    'Kubernetes Secrets': ['secret', 'kubernetes secret'],
    'ConfigMaps': ['configmap', 'configuration']
  };
  
  Object.entries(componentPatterns).forEach(([component, patterns]) => {
    if (patterns.some(pattern => text.includes(pattern))) {
      components.push(component);
    }
  });
  
  return components;
}

function generateContextualKubernetesRules(context: any, useCase: UseCase): string {
  const rules = [];
  
  if (context.isIngress) {
    rules.push(`-- Monitor ingress annotation modifications for ${useCase.title}
dataset = kubernetes_audit
| filter verb = "patch"
| filter objectRef_resource = "ingresses"
| filter requestObject_metadata_annotations != ""
| alter severity = "${useCase.severity.toUpperCase()}"
| fields _time, user_username, objectRef_namespace, objectRef_name`);
  }
  
  if (context.isContainer) {
    rules.push(`-- Monitor container privilege escalation for ${useCase.title}
dataset = kubernetes_audit
| filter verb = "create"
| filter objectRef_resource = "pods"
| filter requestObject_spec_securityContext_privileged = true
| alter severity = "HIGH"
| fields _time, user_username, objectRef_namespace, objectRef_name`);
  }
  
  return rules.join('\n\n');
}

function generateEndpointSpecificRule(useCase: UseCase, context: any): string {
  return `
\`\`\`sql
-- ${useCase.title} Endpoint Detection
-- CVEs: ${context.cveNumbers.length > 0 ? context.cveNumbers.join(', ') : 'Custom threat'}
-- Vulnerability Types: ${context.vulnerabilityTypes.join(', ')}
-- Technologies: ${context.technologies.join(', ')}
dataset = xdr_data
| filter event_type = "STORY"
| filter action_process_image_name != null
${context.specificPatterns.map(pattern => `| filter action_process_command_line contains "${pattern}"`).join('\n')}
| alter severity = "${context.threatContext.severity.toUpperCase()}"
| alter cve_numbers = "${context.cveNumbers.join(',')}"
| alter attack_vectors = "${context.attackVectors.join(',')}"
| alter vulnerability_types = "${context.vulnerabilityTypes.join(',')}"
| fields _time, agent_hostname, action_process_image_name, action_process_command_line, action_process_username, cve_numbers, attack_vectors
\`\`\``;
}

function generateNetworkSpecificRule(useCase: UseCase, context: any): string {
  return `
\`\`\`sql
-- ${useCase.title} Network Detection
-- CVEs: ${context.cveNumbers.length > 0 ? context.cveNumbers.join(', ') : 'Custom threat'}
-- Attack Vectors: ${context.attackVectors.join(', ')}
-- Technologies: ${context.technologies.join(', ')}
dataset = network_logs
| filter protocol = "tcp"
${context.attackVectors.length > 0 ? `-- Attack vectors: ${context.attackVectors.join(', ')}` : ''}
| alter severity = "${context.threatContext.severity.toUpperCase()}"
| alter cve_numbers = "${context.cveNumbers.join(',')}"
| alter attack_vectors = "${context.attackVectors.join(',')}"
| alter vulnerability_types = "${context.vulnerabilityTypes.join(',')}"
| fields _time, source_ip, destination_ip, destination_port, bytes_out, protocol, cve_numbers, attack_vectors
\`\`\``;
}

function generateIdentitySpecificRule(useCase: UseCase, context: any): string {
  return `
\`\`\`sql
-- ${useCase.title} Identity Detection
-- CVEs: ${context.cveNumbers.length > 0 ? context.cveNumbers.join(', ') : 'Custom threat'}
-- Attack Vectors: ${context.attackVectors.join(', ')}
-- Technologies: ${context.technologies.join(', ')}
dataset = auth_logs
| filter event_type = "login"
| alter severity = "${context.threatContext.severity.toUpperCase()}"
| alter cve_numbers = "${context.cveNumbers.join(',')}"
| alter attack_vectors = "${context.attackVectors.join(',')}"
| alter vulnerability_types = "${context.vulnerabilityTypes.join(',')}"
| fields _time, username, source_ip, user_agent, authentication_method, cve_numbers, attack_vectors
\`\`\``;
}

function generateContextualLayoutFields(useCase: UseCase, context: any) {
  const baseFields = {
    kubernetesFields: [],
    attackFields: [],
    responseFields: []
  };

  if (context.isKubernetes) {
    baseFields.kubernetesFields = [
      "cluster_name",
      "namespace", 
      "resource_type",
      "resource_name",
      "user_username",
      "source_ips"
    ];
  }

  if (context.isIngress) {
    baseFields.attackFields = [
      "ingress_annotations",
      "server_snippet_content",
      "lua_script_detected",
      "nginx_version",
      "admission_controller_status"
    ];
    
    baseFields.responseFields = [
      "isolate_ingress_resource",
      "review_annotations",
      "check_cluster_secrets",
      "validate_rbac_permissions",
      "scan_for_persistence"
    ];
  } else {
    baseFields.attackFields = [
      "attack_pattern",
      "exploit_method",
      "payload_detected",
      "vulnerability_cve"
    ];
    
    baseFields.responseFields = [
      "isolate_affected_resource",
      "collect_forensic_evidence", 
      "check_lateral_movement",
      "validate_security_controls"
    ];
  }

  return baseFields;
}

function generateAlertLayoutInstructions(useCase: UseCase, config: LabConfiguration): string {
  const context = analyzeUseCaseContext(useCase);
  const layoutFields = generateContextualLayoutFields(useCase, context);
  
  return `
## Alert Layout Configuration for ${useCase.title}

### 1. Use Case-Specific Layout Design
**Threat Type**: ${useCase.category} - ${useCase.title}
**Primary Attack Vectors**: ${context.attackVectors.join(', ') || 'To be analyzed'}
**Affected Components**: ${context.affectedComponents.join(', ') || 'Multiple systems'}

#### Alert Header Section (${useCase.title}-Specific)
- **Alert Title**: "${useCase.title} Detection"
- **Severity Indicator**: ${useCase.severity.toUpperCase()} (Critical/High/Medium)
- **CVE Reference**: ${context.isCVE ? 'CVE Reference Field' : 'Custom threat detection'}
- **Context**: ${context.isKubernetes ? 'Kubernetes Environment' : 'System Environment'}

### 2. Context-Specific Alert Layout
\`\`\`json
{
  "layout_name": "${useCase.title.replace(/[^a-zA-Z0-9]/g, '_')}_Layout",
  "use_case_id": "${useCase.id}",
  "layout_sections": [
    {
      "section_name": "${context.isKubernetes ? 'kubernetes_context' : 'system_context'}",
      "title": "${context.isKubernetes ? 'Kubernetes Environment' : 'System Context'}",
      "fields": ${JSON.stringify(layoutFields.kubernetesFields, null, 8)}
    },
    {
      "section_name": "attack_details", 
      "title": "Attack Specifics for ${useCase.title}",
      "fields": ${JSON.stringify(layoutFields.attackFields, null, 8)}
    },
    {
      "section_name": "response_actions",
      "title": "Immediate Response Actions",
      "fields": ${JSON.stringify(layoutFields.responseFields, null, 8)}
    }
  ]
}
\`\`\`

### 3. Custom Field Definitions for ${useCase.title}
${generateCustomFieldDefinitions(useCase, context)}

### 4. Visual Configuration
- **Severity Color Coding**: Critical (Red), High (Orange), Medium (Yellow)  
- **Context Indicators**: ${context.isKubernetes ? 'Kubernetes cluster icon' : 'System type icon'}
- **Priority Highlighting**: Emphasize ${context.isRCE ? 'RCE indicators' : 'threat-specific patterns'}
`;
}

function generateDashboardInstructions(useCase: UseCase, config: LabConfiguration): string {
  return `
## Operational Dashboard and Widget Creation

### 1. Dashboard Architecture Planning
**Use Case**: ${useCase.title}
**Category**: ${useCase.category}
**Complexity**: ${config.complexity}

### 2. Core Dashboard Components
\`\`\`json
{
  "dashboard_config": {
    "title": "${useCase.title} Operations Dashboard",
    "refresh_interval": "30s",
    "time_range": "last_24h",
    "layout": "grid",
    "sections": [
      {
        "title": "Threat Overview",
        "widgets": ["threat_summary", "severity_distribution", "trend_analysis"]
      },
      {
        "title": "Detection Performance", 
        "widgets": ["detection_rate", "false_positive_rate", "response_time"]
      },
      {
        "title": "Infrastructure Health",
        "widgets": ["system_status", "data_ingestion", "resource_usage"]
      }
    ]
  }
}
\`\`\`

### 3. Custom Widget Development
${generateCategorySpecificWidgets(useCase.category)}

### 4. Key Performance Indicators (KPIs)
- **Detection Accuracy**: >95% true positive rate
- **Response Time**: <5 minutes mean time to detection
- **System Availability**: >99.5% uptime
- **Data Completeness**: >98% log ingestion rate

### 5. Alert Integration
- Configure dashboard alerts for KPI thresholds
- Integrate with notification channels
- Set up escalation procedures
- Link to incident response playbooks

### 6. User Experience Optimization
- Responsive design for mobile access
- Role-based dashboard views
- Customizable widget layouts
- Export capabilities for reporting
`;
}

function generateCategorySpecificWidgets(category: string): string {
  const widgetConfigs = {
    endpoint: `
#### Endpoint Security Widgets
- **Agent Health Monitor**: Track agent connectivity and version compliance
- **Process Execution Timeline**: Visualize process chains and parent-child relationships  
- **File System Activity**: Monitor file creation, modification, and deletion patterns
- **Network Connection Map**: Display endpoint network communications
- **Malware Detection Stats**: Track signatures, behavioral analysis, and quarantine actions`,

    network: `
#### Network Security Widgets
- **Traffic Flow Visualization**: Network topology with traffic patterns
- **Protocol Analysis**: Breakdown of network protocols and their usage
- **Geolocation Map**: Source and destination IP geographical mapping
- **Bandwidth Utilization**: Network capacity and usage trends
- **Threat Intelligence Correlation**: IOCs matched against network traffic`,

    cloud: `
#### Cloud Security Widgets
- **Resource Inventory**: Multi-cloud asset visualization and status
- **Compliance Posture**: Security control compliance dashboard
- **Cost Security Correlation**: Security events impact on cloud costs
- **API Usage Analytics**: Cloud service API calls and anomalies
- **Container Security Status**: Pod security, image vulnerabilities, runtime protection`,

    identity: `
#### Identity Security Widgets
- **Authentication Heatmap**: Login patterns across time and geography
- **Privilege Escalation Tracking**: Monitor permission changes and elevated access
- **Account Lifecycle**: User creation, modification, and deactivation timeline
- **Access Risk Scoring**: User risk scores based on behavior and privileges
- **SSO Integration Status**: Single sign-on health and failure tracking`
  };

  return widgetConfigs[category] || widgetConfigs.endpoint;
}

function generatePlaybookInstructions(useCase: UseCase, config: LabConfiguration): string {
  const context = analyzeUseCaseContext(useCase);
  
  return `
## Automation Playbook for ${useCase.title}

### 1. Use Case-Specific Playbook Architecture
\`\`\`yaml
name: "${useCase.title} Response Playbook"
description: "Automated response for ${useCase.description}"
trigger:
  type: "alert"
  conditions:
    - alert_name: "${useCase.title}"
    - severity: ["${useCase.severity.toUpperCase()}"]
    ${context.isKubernetes ? '- source_type: "kubernetes_audit"' : ''}
    ${context.isCVE ? '- cve_detected: true' : ''}

tasks:
${generateContextualPlaybookTasks(useCase, context)}
\`\`\`

### 2. Context-Specific Integration Points
${generatePlaybookIntegrations(useCase, context)}

### 3. Use Case-Specific Testing
${generatePlaybookTesting(useCase, context)}
`;
}

function generateValidationInstructions(useCase: UseCase, config: LabConfiguration): string {
  return `
## End-to-End Validation and Testing

### 1. Test Scenario Execution
Execute comprehensive test scenarios for ${useCase.title}:

#### Scenario 1: Detection Validation
- Generate realistic attack simulation
- Verify alert generation and accuracy
- Validate alert layout display
- Test playbook execution

#### Scenario 2: Performance Testing
- Load test with expected data volume
- Measure query response times
- Validate system stability under load

#### Scenario 3: Integration Testing
- Test all data source integrations
- Validate API connectivity
- Verify automation workflows

### 2. Acceptance Criteria Validation
${generateAcceptanceCriteria(useCase, config)}

### 3. Documentation and Handover
- Complete lab setup documentation
- Create user guides and runbooks
- Provide training materials
- Document known issues and workarounds

### 4. Performance Metrics
- Alert accuracy rate: >95%
- False positive rate: <5%
- Response time: <30 seconds
- System availability: >99.5%
`;
}

// Helper functions
function formatStepContent(step: LabBuildoutStep): string {
  return `
# ${step.title}

${step.description}

## Prerequisites
${step.prerequisites.map(p => `- ${p}`).join('\n')}

## Instructions
${step.instructions}

## Validation Criteria
${step.validationCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Troubleshooting
${step.troubleshooting.map(t => `- ${t}`).join('\n')}

## Related Components
${step.relatedComponents.map(c => `- ${c}`).join('\n')}
`;
}

function generateResourceRequirements(config: LabConfiguration): string {
  const requirements = {
    small: { cpu: '4 cores', memory: '8 GB', storage: '100 GB' },
    medium: { cpu: '8 cores', memory: '16 GB', storage: '500 GB' },
    large: { cpu: '16 cores', memory: '32 GB', storage: '1 TB' },
    enterprise: { cpu: '32 cores', memory: '64 GB', storage: '5 TB' }
  };
  
  const req = requirements[config.dataVolume];
  return `
- **CPU**: ${req.cpu}
- **Memory**: ${req.memory}
- **Storage**: ${req.storage}
- **Network**: 1 Gbps minimum
`;
}

function generateDeploymentTimeline(config: LabConfiguration): string {
  const timelines = {
    sprint: '1-2 weeks',
    month: '3-4 weeks', 
    quarter: '8-12 weeks',
    extended: '12+ weeks'
  };
  
  return `
**Total Duration**: ${timelines[config.timeline]}
- Week 1: Infrastructure setup
- Week 2: Integration configuration  
- Week 3: Testing and validation
- Week 4: Documentation and handover
`;
}

// Additional helper functions for contextual generation
function generateCustomFieldDefinitions(useCase: UseCase, context: any): string {
  if (context.isKubernetes && context.isIngress) {
    return `
#### Kubernetes-Specific Fields for ${useCase.title}:
- **cluster_name**: Kubernetes cluster identifier
- **namespace**: Target namespace for the attack
- **ingress_annotations**: Full annotation content showing malicious snippets
- **server_snippet_content**: Extracted Lua/server-snippet code
- **admission_controller_status**: Validation webhook bypass indicators
- **rbac_permissions**: User permissions and potential privilege escalation
- **secrets_accessed**: List of secrets potentially compromised
- **pod_security_context**: Security context violations detected`;
  } else if (context.isKubernetes) {
    return `
#### Kubernetes-Specific Fields:
- **cluster_name**: Kubernetes cluster identifier  
- **resource_type**: Type of Kubernetes resource affected
- **resource_name**: Name of the specific resource
- **user_username**: Kubernetes user performing the action
- **source_ips**: Source IP addresses of the requests`;
  } else {
    return `
#### Standard Security Fields:
- **host_name**: Affected system hostname
- **process_name**: Process involved in the incident
- **command_line**: Command line arguments executed
- **user_context**: User account context and privileges`;
  }
}

function generateContextualPlaybookTasks(useCase: UseCase, context: any): string {
  if (context.isKubernetes && context.isIngress) {
    return `  - name: "Initial Assessment - IngressNightmare"
    type: "enrichment"
    actions:
      - get_kubernetes_cluster_info
      - check_ingress_controller_version
      - validate_admission_controller_status
      - query_threat_intelligence_for_cve
      
  - name: "Immediate Containment"
    type: "response"
    actions:
      - isolate_affected_ingress_resource
      - disable_malicious_annotations
      - block_source_ips
      - rotate_cluster_secrets
      
  - name: "Investigation and Analysis"
    type: "analysis"  
    actions:
      - collect_kubernetes_audit_logs
      - analyze_ingress_modifications
      - check_for_privilege_escalation
      - scan_all_ingress_resources
      - validate_rbac_permissions
      
  - name: "Recovery and Hardening"
    type: "remediation"
    actions:
      - update_ingress_controller
      - implement_admission_policies
      - review_and_harden_rbac
      - deploy_monitoring_rules`;
  } else if (context.isKubernetes) {
    return `  - name: "Initial Assessment - Kubernetes"
    type: "enrichment"
    actions:
      - get_kubernetes_cluster_info
      - check_resource_status
      - validate_user_permissions
      
  - name: "Containment"
    type: "response"
    actions:
      - isolate_affected_resource
      - block_malicious_user
      - quarantine_namespace
      
  - name: "Investigation"
    type: "analysis"
    actions:
      - collect_audit_logs
      - analyze_resource_changes
      - check_lateral_movement`;
  } else {
    return `  - name: "Initial Assessment"
    type: "enrichment"
    actions:
      - get_host_information
      - check_threat_intelligence
      
  - name: "Containment"
    type: "response"
    actions:
      - isolate_endpoint
      - disable_user_account
      
  - name: "Investigation"
    type: "analysis"
    actions:
      - collect_forensic_data
      - analyze_lateral_movement`;
  }
}

function generatePlaybookIntegrations(useCase: UseCase, context: any): string {
  if (context.isKubernetes) {
    return `
- **Kubernetes API Integration**: Direct API calls for resource isolation and remediation
- **Admission Controller Webhooks**: Real-time policy enforcement
- **Container Registry Scanning**: Image vulnerability assessment
- **RBAC Management**: Automated permission reviews and updates
- **Helm/Operator Integration**: Automated deployment of security policies`;
  } else {
    return `
- **SOAR Platform**: Standard incident response orchestration
- **Endpoint Management**: Direct agent communication for containment
- **SIEM Integration**: Centralized log analysis and correlation
- **Threat Intelligence**: IOC enrichment and validation`;
  }
}

function generatePlaybookTesting(useCase: UseCase, context: any): string {
  if (context.isKubernetes && context.isIngress) {
    return `
- **IngressNightmare Simulation**: Deploy vulnerable ingress with malicious annotations
- **Admission Controller Testing**: Validate policy enforcement and bypass detection
- **Cluster Secret Access**: Test detection of unauthorized secret access
- **RBAC Escalation**: Simulate privilege escalation attempts
- **Recovery Testing**: Validate automated remediation and hardening steps`;
  } else {
    return `
- **Attack Simulation**: Execute realistic attack scenarios for ${useCase.title}
- **Integration Testing**: Validate all automation components
- **Performance Testing**: Measure playbook execution times
- **Rollback Testing**: Ensure safe recovery from automated actions`;
  }
}

function getDataRetention(config: LabConfiguration): string {
  return config.labType === 'production' ? '12_months' : '3_months';
}

function extractDataSources(useCase: UseCase): string[] {
  // Extract data sources from use case metadata or description
  const commonSources = ['Windows Event Logs', 'Active Directory', 'Network Traffic'];
  
  if (useCase.category === 'endpoint') {
    return [...commonSources, 'Cortex XDR Agent', 'Process Telemetry'];
  } else if (useCase.category === 'network') {
    return [...commonSources, 'Firewall Logs', 'Network Flow Data'];
  } else if (useCase.category === 'cloud') {
    return [...commonSources, 'Cloud Audit Logs', 'API Logs'];
  } else {
    return [...commonSources, 'Identity Provider Logs', 'Authentication Logs'];
  }
}

function generateDataSourceConfig(sources: string[], config: LabConfiguration): string {
  return sources.map(source => `
### ${source}
- Configure connection parameters
- Set up authentication credentials  
- Test connectivity and data flow
- Validate parsing and field mapping
`).join('\n');
}

function generateDeploymentMethods(config: LabConfiguration): string {
  return `
#### Manual Installation
\`\`\`bash
# Download and install agent
./cortex-xdr-agent-installer.sh --install
\`\`\`

#### Group Policy Deployment (Windows)
- Configure MSI deployment through GPO
- Set installation parameters
- Monitor deployment status

#### Mass Deployment Tools
- SCCM, Ansible, or other automation tools
- Batch deployment scripts
- Remote installation capabilities
`;
}

function generateAcceptanceCriteria(useCase: UseCase, config: LabConfiguration): string {
  return `
- [ ] All data sources ingesting properly
- [ ] Detection rules generating accurate alerts
- [ ] Alert layouts displaying correctly
- [ ] Automation playbooks executing successfully
- [ ] Performance metrics within acceptable ranges
- [ ] Documentation complete and accurate
- [ ] User training completed
- [ ] Handover procedures defined
`;
}