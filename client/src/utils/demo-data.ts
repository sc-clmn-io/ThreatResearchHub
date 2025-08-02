// Demo data for testing enhanced export functionality
// Based on CVE-YYYY-NNNN (IngressNightmare) shown in threat feeds

export const demoUseCases = [
  {
    id: 'uc_cve_2025_1974',
    title: 'CVE-YYYY-NNNN: The IngressNightmare in Kubernetes',
    description: 'Critical Kubernetes ingress controller vulnerability allowing unauthenticated remote code execution leading to full system compromise',
    category: 'cloud',
    severity: 'critical',
    cves: ['CVE-YYYY-NNNN', 'CVE-2025-3956', 'CVE-2025-0995'],
    technologies: ['Kubernetes', 'Ingress Controllers', 'Azure', 'Containers'],
    vulnerabilityTypes: ['Remote Code Execution', 'Container Escape', 'Privilege Escalation'],
    extractedTechniques: ['T1068', 'T1611', 'T1610'],
    detectionRules: [{
      title: 'Kubernetes IngressNightmare Detection',
      xqlQuery: `config case_sensitive = false
| dataset = xdr_data 
| filter event_type = ENUM.PROCESS
| filter action_process_image_name contains "nginx" or action_process_image_name contains "traefik" or action_process_image_name contains "haproxy"
| filter action_process_command_line contains "ingress" 
| filter action_process_command_line contains "annotation" or action_process_command_line contains "nginx.ingress.kubernetes.io"
| alter cluster_name = json_extract_scalar(action_process_os_pid, "$.kubernetes.cluster_name")
| alter namespace = json_extract_scalar(action_process_os_pid, "$.kubernetes.namespace") 
| alter pod_name = json_extract_scalar(action_process_os_pid, "$.kubernetes.pod_name")
| fields _time, agent_hostname, action_process_command_line, cluster_name, namespace, pod_name, action_remote_ip
| sort desc _time`,
      severity: 'critical',
      category: 'malware'
    }],
    sources: [
      { vendor: 'CISA', url: 'https://cisa.gov/advisory/cve-2025-1974', title: 'CVE-YYYY-NNNN: IngressNightmare Kubernetes Vulnerability' },
      { vendor: 'Unit42', url: 'https://unit42.paloaltonetworks.com/ingressnightmare', title: 'IngressNightmare: Zero-Day Kubernetes Exploitation' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'uc_supply_chain_attack', 
    title: 'Supply Chain Attack Targeting Node.js Packages',
    description: 'Sophisticated supply chain attack compromising popular Node.js packages to inject malicious code',
    category: 'endpoint',
    severity: 'high',
    cves: ['CVE-2025-7071'],
    technologies: ['Node.js', 'npm', 'JavaScript', 'Package Management'],
    vulnerabilityTypes: ['Supply Chain Attack', 'Code Injection', 'Dependency Confusion'],
    extractedTechniques: ['T1195.002', 'T1072', 'T1059.007'],
    detectionRules: [{
      title: 'Malicious Node.js Package Detection',
      xqlQuery: `dataset = xdr_data
| filter event_type = ENUM.PROCESS
| filter action_process_image_name contains "node" or action_process_image_name contains "npm"
| filter action_process_command_line contains "install" or action_process_command_line contains "require"
| alter package_name = extract(action_process_command_line, "install\\s+([\\w\\-]+)")
| fields _time, agent_hostname, action_process_command_line, package_name, action_file_path
| sort desc _time`,
      severity: 'high',
      category: 'malware'
    }],
    sources: [
      { vendor: 'Unit42', url: 'https://unit42.paloaltonetworks.com/supply-chain-nodejs', title: 'Supply Chain Attack Analysis' }
    ],
    createdAt: new Date().toISOString()
  }
];

export const demoTrainingPaths = [
  {
    id: 'tp_kubernetes_response',
    title: 'Kubernetes IngressNightmare Incident Response',
    description: 'Complete incident response workflow for CVE-YYYY-NNNN exploitation attempts',
    category: 'cloud',
    severity: 'critical',
    useCaseId: 'uc_cve_2025_1974',
    steps: [
      {
        id: 'step_001',
        type: 'investigation',
        title: 'Initial Triage and Scoping',
        description: 'Identify affected Kubernetes clusters and ingress controllers',
        timeEstimate: 15,
        completed: false,
        requirements: [
          'Access to Kubernetes cluster logs',
          'XSIAM/XDR console access',
          'Network monitoring tools'
        ]
      },
      {
        id: 'step_002', 
        type: 'containment',
        title: 'Immediate Containment',
        description: 'Isolate affected ingress controllers and block malicious traffic',
        timeEstimate: 30,
        completed: false,
        requirements: [
          'Kubectl administrative access',
          'Network security controls',
          'Load balancer configuration access'
        ]
      },
      {
        id: 'step_003',
        type: 'playbook',
        title: 'Execute Automated Response',
        description: 'Run SOAR playbook for CVE-YYYY-NNNN remediation',
        timeEstimate: 45,
        completed: false,
        requirements: [
          'SOAR platform access',
          'Automated patching capabilities',
          'Change management approval'
        ]
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'tp_supply_chain_response',
    title: 'Supply Chain Attack Response Workflow', 
    description: 'Detection and response procedures for malicious Node.js packages',
    category: 'endpoint',
    severity: 'high',
    useCaseId: 'uc_supply_chain_attack',
    steps: [
      {
        id: 'step_101',
        type: 'investigation',
        title: 'Package Analysis and Attribution',
        description: 'Analyze compromised packages and identify attack vectors',
        timeEstimate: 20,
        completed: false,
        requirements: [
          'Package repository access',
          'Code analysis tools',
          'Threat intelligence feeds'
        ]
      },
      {
        id: 'step_102',
        type: 'containment', 
        title: 'Block Malicious Packages',
        description: 'Prevent installation of compromised packages across environment',
        timeEstimate: 25,
        completed: false,
        requirements: [
          'Package manager controls',
          'Network filtering rules',
          'Developer notification system'
        ]
      }
    ],
    createdAt: new Date().toISOString()
  }
];

export function loadDemoData() {
  // Load demo data into localStorage for testing
  localStorage.setItem('useCases', JSON.stringify(demoUseCases));
  localStorage.setItem('trainingPaths', JSON.stringify(demoTrainingPaths));
  console.log('Demo data loaded for export testing');
}

export function clearDemoData() {
  localStorage.removeItem('useCases');
  localStorage.removeItem('trainingPaths');
  console.log('Demo data cleared');
}