// OWASP Cloud-Native Application Security Top 10 threat patterns and use cases
export interface OwaspCloudThreat {
  id: string;
  title: string;
  description: string;
  category: 'cloud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitreMapping: string[];
  detectionPatterns: string[];
  preventionMeasures: string[];
  cortexDetection: {
    xqlQueries: string[];
    alertLayouts: string[];
    playbooks: string[];
  };
}

export const owaspCloudThreats: OwaspCloudThreat[] = [
  {
    id: 'cnsa01',
    title: 'CNSA-01: Insecure Cloud, Container or Orchestration Configuration',
    description: 'Misconfigurations in cloud services, containers, or orchestration platforms that expose applications and data to unauthorized access.',
    category: 'cloud',
    severity: 'high',
    mitreMapping: ['T1078', 'T1190', 'T1552'],
    detectionPatterns: [
      'Public S3 buckets with sensitive data',
      'Kubernetes pods running as root',
      'Overly permissive IAM policies',
      'Unencrypted cloud storage',
      'Default service credentials',
      'Open security groups allowing 0.0.0.0/0'
    ],
    preventionMeasures: [
      'Infrastructure as Code with security policies',
      'Automated security scanning in CI/CD',
      'Least privilege access controls',
      'Regular configuration audits',
      'Cloud security posture management'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = cloud_audit_logs | filter action_type = "storage_bucket_create" | filter public_access = "true"`,
        `dataset = kubernetes_audit | filter verb = "create" | filter objectRef_resource = "pods" | filter requestObject_spec_securityContext_runAsUser = 0`,
        `dataset = aws_cloudtrail | filter event_name = "PutBucketPolicy" | filter requestParameters_bucketPolicy contains "Principal.*\\*"`
      ],
      alertLayouts: ['cloud_misconfiguration_layout', 'kubernetes_security_layout'],
      playbooks: ['cloud_remediation_playbook', 'container_security_response']
    }
  },
  {
    id: 'cnsa02',
    title: 'CNSA-02: Injection Flaws (App Layer)',
    description: 'Traditional injection attacks adapted for cloud-native applications, including SQL injection, NoSQL injection, and command injection.',
    category: 'cloud',
    severity: 'critical',
    mitreMapping: ['T1190', 'T1059'],
    detectionPatterns: [
      'SQL injection attempts in cloud databases',
      'NoSQL injection in MongoDB/DynamoDB',
      'Command injection via API endpoints',
      'LDAP injection in cloud directories',
      'XPath injection in XML processing'
    ],
    preventionMeasures: [
      'Input validation and sanitization',
      'Parameterized queries',
      'Web Application Firewalls',
      'Runtime application self-protection',
      'Code analysis tools'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = webapp_logs | filter request_uri contains "union.*select|drop.*table|exec.*xp_" | alter severity = "HIGH"`,
        `dataset = api_gateway_logs | filter request_body contains "\\$where.*function|\\$ne.*null" | alter attack_type = "nosql_injection"`,
        `dataset = application_logs | filter message contains "sh.*-c|cmd.*\\/c|powershell.*-command"`
      ],
      alertLayouts: ['injection_attack_layout', 'webapp_security_layout'],
      playbooks: ['injection_response_playbook', 'webapp_isolation_playbook']
    }
  },
  {
    id: 'cnsa03',
    title: 'CNSA-03: Improper Authentication & Authorization',
    description: 'Weak authentication mechanisms and authorization bypasses in cloud-native applications and services.',
    category: 'cloud',
    severity: 'critical',
    mitreMapping: ['T1078', 'T1110', 'T1556'],
    detectionPatterns: [
      'JWT token manipulation',
      'OAuth flow hijacking',
      'Service-to-service authentication bypass',
      'Privilege escalation in cloud IAM',
      'Weak API key management'
    ],
    preventionMeasures: [
      'Multi-factor authentication',
      'Zero trust architecture',
      'Token validation and rotation',
      'Role-based access control',
      'Service mesh security'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = auth_logs | filter event_type = "login_failed" | bin _time span=5m | stats count() by source_ip | filter count > 10`,
        `dataset = api_logs | filter jwt_validation = "failed" | filter response_code = 200`,
        `dataset = cloud_audit_logs | filter event_name = "AssumeRole" | filter error_code = null | filter user_name != assumed_role_user`
      ],
      alertLayouts: ['auth_bypass_layout', 'privilege_escalation_layout'],
      playbooks: ['auth_incident_response', 'account_lockdown_playbook']
    }
  },
  {
    id: 'cnsa04',
    title: 'CNSA-04: CI/CD Pipeline & Software Supply Chain Flaws',
    description: 'Vulnerabilities in the continuous integration and deployment pipeline that can lead to supply chain attacks.',
    category: 'cloud',
    severity: 'high',
    mitreMapping: ['T1195', 'T1554', 'T1574'],
    detectionPatterns: [
      'Malicious code injection in CI/CD',
      'Compromised container images',
      'Dependency confusion attacks',
      'Build environment compromise',
      'Artifact tampering'
    ],
    preventionMeasures: [
      'Signed commits and artifacts',
      'Container image scanning',
      'Dependency verification',
      'Isolated build environments',
      'Supply chain security tools'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = cicd_logs | filter stage = "build" | filter exit_code != 0 | filter error_message contains "download.*failed|checksum.*mismatch"`,
        `dataset = container_registry | filter action = "push" | filter image_scan_status = "failed" | filter vulnerabilities contains "critical"`,
        `dataset = git_audit | filter action = "push" | filter commit_signed = false | filter branch = "main|master"`
      ],
      alertLayouts: ['supply_chain_layout', 'cicd_security_layout'],
      playbooks: ['supply_chain_response', 'build_quarantine_playbook']
    }
  },
  {
    id: 'cnsa05',
    title: 'CNSA-05: Insecure Secrets Storage',
    description: 'Improper storage and management of secrets, API keys, and sensitive configuration data in cloud environments.',
    category: 'cloud',
    severity: 'high',
    mitreMapping: ['T1552', 'T1078'],
    detectionPatterns: [
      'Hardcoded secrets in source code',
      'Unencrypted secrets in environment variables',
      'Exposed secrets in container images',
      'Secrets in configuration files',
      'Overprivileged secret access'
    ],
    preventionMeasures: [
      'Dedicated secret management systems',
      'Secret scanning in repositories',
      'Runtime secret injection',
      'Secret rotation automation',
      'Least privilege secret access'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = git_commits | filter diff contains "password.*=|api_key.*=|secret.*=" | filter action = "add"`,
        `dataset = container_logs | filter message contains "AWS_SECRET_ACCESS_KEY|PRIVATE_KEY|PASSWORD" | filter log_level = "info|debug"`,
        `dataset = secrets_manager | filter action = "get_secret" | bin _time span=1h | stats count() by principal | filter count > 100`
      ],
      alertLayouts: ['secrets_exposure_layout', 'credential_theft_layout'],
      playbooks: ['secrets_rotation_playbook', 'credential_revocation_playbook']
    }
  },
  {
    id: 'cnsa06',
    title: 'CNSA-06: Over-Privileged or Inadequate Network Controls',
    description: 'Excessive network permissions and inadequate network segmentation in cloud and container environments.',
    category: 'cloud',
    severity: 'high',
    mitreMapping: ['T1021', 'T1090', 'T1095'],
    detectionPatterns: [
      'Overly permissive security groups',
      'Missing network segmentation',
      'Unrestricted east-west traffic',
      'Exposed internal services',
      'Weak network policies'
    ],
    preventionMeasures: [
      'Zero trust networking',
      'Micro-segmentation',
      'Network policy enforcement',
      'Traffic monitoring and analysis',
      'Secure service mesh'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = network_flow | filter dst_port in (22,3389,5432,3306) | filter src_ip != dst_ip | filter action = "allow"`,
        `dataset = kubernetes_network | filter policy_action = "allow" | filter rule_type = "ingress" | filter from_selector = "matchLabels: {}"`,
        `dataset = cloud_network | filter security_group_rule contains "0.0.0.0/0" | filter protocol != "https"`
      ],
      alertLayouts: ['network_exposure_layout', 'lateral_movement_layout'],
      playbooks: ['network_isolation_playbook', 'traffic_analysis_playbook']
    }
  },
  {
    id: 'cnsa07',
    title: 'CNSA-07: Using Components with Known Vulnerabilities',
    description: 'Usage of vulnerable libraries, frameworks, and components in cloud-native applications.',
    category: 'cloud',
    severity: 'medium',
    mitreMapping: ['T1190', 'T1203'],
    detectionPatterns: [
      'Vulnerable container base images',
      'Outdated application dependencies',
      'Unpatched system components',
      'Known CVE exploitation',
      'Legacy component usage'
    ],
    preventionMeasures: [
      'Automated vulnerability scanning',
      'Dependency management',
      'Regular patching cycles',
      'Component inventory tracking',
      'Security monitoring'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = vulnerability_scans | filter severity in ("high","critical") | filter status = "open" | filter component_type = "container"`,
        `dataset = package_scans | filter vulnerabilities > 0 | filter last_updated < 90d | filter package_type in ("npm","pip","maven")`,
        `dataset = exploit_attempts | filter cve_id != null | filter target_component != null | filter success = true`
      ],
      alertLayouts: ['vulnerability_layout', 'exploit_attempt_layout'],
      playbooks: ['patch_management_playbook', 'vulnerable_component_response']
    }
  },
  {
    id: 'cnsa08',
    title: 'CNSA-08: Improper Assets Management',
    description: 'Inadequate visibility and management of cloud assets, leading to security blind spots and unauthorized resources.',
    category: 'cloud',
    severity: 'medium',
    mitreMapping: ['T1083', 'T1057'],
    detectionPatterns: [
      'Unauthorized cloud resource creation',
      'Shadow IT services',
      'Untagged or miscategorized assets',
      'Orphaned resources',
      'Asset inventory drift'
    ],
    preventionMeasures: [
      'Cloud asset discovery tools',
      'Resource tagging policies',
      'Automated asset inventory',
      'Change management processes',
      'Cost and usage monitoring'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = cloud_audit_logs | filter event_name contains "Create|Launch|Run" | filter tags = null | filter resource_type in ("instance","database","storage")`,
        `dataset = asset_inventory | filter last_seen < 7d | filter status = "running" | filter owner = "unknown"`,
        `dataset = cloud_costs | bin _time span=1d | stats sum(cost) as daily_cost by service | where daily_cost > previous_daily_cost * 1.5`
      ],
      alertLayouts: ['asset_management_layout', 'shadow_it_layout'],
      playbooks: ['asset_discovery_playbook', 'unauthorized_resource_cleanup']
    }
  },
  {
    id: 'cnsa09',
    title: 'CNSA-09: Inadequate Computing Resource Quota Limits',
    description: 'Insufficient resource limits and quotas that can lead to denial of service and resource exhaustion attacks.',
    category: 'cloud',
    severity: 'medium',
    mitreMapping: ['T1499', 'T1496'],
    detectionPatterns: [
      'Resource consumption spikes',
      'Quota exhaustion attacks',
      'Cryptocurrency mining',
      'Memory/CPU exhaustion',
      'Storage quota abuse'
    ],
    preventionMeasures: [
      'Resource quotas and limits',
      'Auto-scaling policies',
      'Resource monitoring',
      'Anomaly detection',
      'Cost controls'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = resource_metrics | filter cpu_usage > 90 | bin _time span=5m | stats avg(cpu_usage) as avg_cpu by instance_id | filter avg_cpu > 85`,
        `dataset = kubernetes_metrics | filter memory_usage > memory_limit * 0.9 | filter container_name != "system"`,
        `dataset = cloud_billing | filter cost_change_percent > 200 | filter service_type = "compute"`
      ],
      alertLayouts: ['resource_exhaustion_layout', 'quota_abuse_layout'],
      playbooks: ['resource_throttling_playbook', 'cost_anomaly_response']
    }
  },
  {
    id: 'cnsa10',
    title: 'CNSA-10: Inadequate Logging & Monitoring',
    description: 'Insufficient logging, monitoring, and incident response capabilities in cloud-native environments.',
    category: 'cloud',
    severity: 'medium',
    mitreMapping: ['T1070', 'T1562'],
    detectionPatterns: [
      'Missing security event logs',
      'Log tampering or deletion',
      'Insufficient monitoring coverage',
      'Delayed incident detection',
      'Inadequate log retention'
    ],
    preventionMeasures: [
      'Comprehensive logging strategy',
      'Real-time monitoring',
      'Log integrity protection',
      'Incident response automation',
      'Security information correlation'
    ],
    cortexDetection: {
      xqlQueries: [
        `dataset = audit_logs | filter action = "delete" | filter object_type = "log" | filter user_type = "service_account"`,
        `dataset = monitoring_health | filter log_ingestion_rate < baseline_rate * 0.5 | filter service_status = "active"`,
        `dataset = security_events | bin _time span=1h | stats count() as events_per_hour | where events_per_hour = 0`
      ],
      alertLayouts: ['logging_failure_layout', 'monitoring_gap_layout'],
      playbooks: ['log_recovery_playbook', 'monitoring_restoration_playbook']
    }
  }
];

export function generateOwaspCloudUseCase(threat: OwaspCloudThreat): any {
  return {
    title: threat.title,
    description: threat.description,
    category: 'cloud',
    severity: threat.severity,
    techniques: threat.detectionPatterns,
    mitreMapping: threat.mitreMapping,
    preventionMeasures: threat.preventionMeasures,
    cortexImplementation: {
      detectionRules: threat.cortexDetection.xqlQueries,
      alertLayouts: threat.cortexDetection.alertLayouts,
      responsePlaybooks: threat.cortexDetection.playbooks
    }
  };
}

export function getOwaspCloudThreatById(id: string): OwaspCloudThreat | undefined {
  return owaspCloudThreats.find(threat => threat.id === id);
}

export function getOwaspCloudThreatsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): OwaspCloudThreat[] {
  return owaspCloudThreats.filter(threat => threat.severity === severity);
}

export function generateOwaspCloudTrainingScenarios(): any[] {
  return owaspCloudThreats.map(threat => ({
    id: `owasp_cloud_${threat.id}`,
    title: `Training: ${threat.title}`,
    description: `Hands-on training scenario for ${threat.description}`,
    category: 'cloud',
    severity: threat.severity,
    estimatedDuration: 90, // Default 90 minutes for cloud scenarios
    detectionPatterns: threat.detectionPatterns,
    preventionMeasures: threat.preventionMeasures,
    labSetup: {
      infrastructure: 'cloud',
      complexity: 'advanced',
      dataVolume: 'medium',
      timeline: 'month'
    },
    trainingSteps: [
      {
        title: 'Environment Setup',
        description: `Set up cloud environment for ${threat.title} simulation`,
        category: 'environment_buildout',
        estimatedDuration: 30
      },
      {
        title: 'Threat Simulation',
        description: `Execute controlled ${threat.title} attack scenario`,
        category: 'attack_simulation',
        estimatedDuration: 20
      },
      {
        title: 'Detection Engineering',
        description: `Implement detection rules for ${threat.title}`,
        category: 'detection_engineering',
        estimatedDuration: 25
      },
      {
        title: 'Response Automation',
        description: `Create automated response playbook for ${threat.title}`,
        category: 'automation_playbook',
        estimatedDuration: 15
      }
    ]
  }));
}