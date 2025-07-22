import { 
  LabBuildPlan, 
  LabBuildStep, 
  InfrastructureComponent, 
  TTPExecution,
  TaxonomyMapping,
  OSILayerType,
  INFRASTRUCTURE_DATA_SOURCES,
  INFRASTRUCTURE_COMPONENTS 
} from '@shared/lab-infrastructure';
import { v4 as uuidv4 } from 'uuid';

export interface ThreatReportContent {
  title: string;
  content: string;
  cves: string[];
  mitreAttack: string[];
  technologies: string[];
  threatActors: string[];
  iocs: {
    domains: string[];
    ips: string[];
    hashes: string[];
    urls: string[];
  };
  ttps: string[];
}

export class ThreatReportParser {
  
  /**
   * Parse threat report content and extract structured information
   */
  static parseThreatReport(content: string, title: string = ''): ThreatReportContent {
    const cves = this.extractCVEs(content);
    const mitreAttack = this.extractMitreAttack(content);
    const technologies = this.extractTechnologies(content);
    const threatActors = this.extractThreatActors(content);
    const iocs = this.extractIOCs(content);
    const ttps = this.extractTTPs(content);

    return {
      title: title || this.extractTitleFromContent(content),
      content,
      cves,
      mitreAttack,
      technologies,
      threatActors,
      iocs,
      ttps
    };
  }

  /**
   * Generate comprehensive lab build plan from threat report
   */
  static generateLabBuildPlan(threatReport: ThreatReportContent): LabBuildPlan {
    const planId = uuidv4();
    
    // Determine required infrastructure based on threat report content
    const requiredInfrastructure = this.determineRequiredInfrastructure(threatReport);
    
    // Generate OSI layer-based deployment phases
    const phases = this.generateDeploymentPhases(requiredInfrastructure);
    
    // Create detailed build steps for each phase
    const steps = this.generateBuildSteps(requiredInfrastructure, threatReport);
    
    // Generate TTP execution plans
    const ttpExecution = this.generateTTPExecution(threatReport);
    
    // Create taxonomy mappings
    const taxonomyMapping = this.generateTaxonomyMapping(threatReport);
    
    // Calculate costs
    const totalCost = this.calculateTotalCost(requiredInfrastructure);
    
    return {
      id: planId,
      threatReportId: uuidv4(),
      threatName: threatReport.title,
      description: `Comprehensive lab build plan for testing and detecting: ${threatReport.title}`,
      totalDuration: this.calculateTotalDuration(steps),
      totalCost,
      phases,
      components: requiredInfrastructure,
      steps,
      ttpExecution,
      taxonomyMapping,
      validation: {
        dataIngestion: this.generateDataIngestionValidation(requiredInfrastructure),
        detectionRules: this.generateDetectionRules(threatReport),
        alertGeneration: this.generateAlertGeneration(threatReport),
        responsePlaybooks: this.generateResponsePlaybooks(threatReport)
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Determine required infrastructure based on threat report analysis
   */
  private static determineRequiredInfrastructure(threatReport: ThreatReportContent): InfrastructureComponent[] {
    const infrastructure: InfrastructureComponent[] = [];
    const content = threatReport.content.toLowerCase();
    
    // Always include base infrastructure
    infrastructure.push(INFRASTRUCTURE_COMPONENTS['vmware-server']);
    infrastructure.push(INFRASTRUCTURE_COMPONENTS['pfsense-firewall']);
    
    // Endpoint infrastructure
    if (this.requiresEndpointInfrastructure(threatReport)) {
      infrastructure.push({
        id: 'windows-workstation',
        name: 'Windows 10/11 Workstation',
        type: 'endpoints',
        osiLayer: 'application',
        description: 'Windows endpoint for malware execution and EDR testing',
        dataSources: INFRASTRUCTURE_DATA_SOURCES.endpoints,
        requirements: { cpu: '2 cores', memory: '8GB', storage: '60GB', os: 'Windows 10/11' },
        deployment: {
          terraform: this.generateWindowsWorkstationTerraform(),
          ansible: this.generateWindowsWorkstationAnsible(),
          manual: [
            'Install Windows 10/11 Pro',
            'Join domain (lab.local)',
            'Install EDR agent (Cortex XDR)',
            'Configure audit logging',
            'Install monitoring tools'
          ]
        },
        dependencies: ['windows-dc'],
        estimatedCost: { setup: 150, hourly: 0.10, monthly: 72 }
      });
    }

    // Domain Controller
    if (this.requiresIdentityInfrastructure(threatReport)) {
      infrastructure.push(INFRASTRUCTURE_COMPONENTS['windows-dc']);
    }

    // Cloud infrastructure
    if (this.requiresCloudInfrastructure(threatReport)) {
      infrastructure.push({
        id: 'aws-lab-environment',
        name: 'AWS Lab Environment',
        type: 'cloud-platforms',
        osiLayer: 'application',
        description: 'AWS infrastructure for cloud attack simulation',
        dataSources: INFRASTRUCTURE_DATA_SOURCES['cloud-platforms'],
        requirements: { cpu: 'Variable', memory: 'Variable', storage: 'Variable' },
        deployment: {
          terraform: this.generateAWSLabTerraform(),
          manual: [
            'Create AWS account or use existing',
            'Set up CloudTrail logging',
            'Configure GuardDuty',
            'Create IAM users and roles',
            'Deploy EC2 instances for testing'
          ]
        },
        estimatedCost: { setup: 0, hourly: 0.25, monthly: 180 }
      });
    }

    // Email infrastructure
    if (this.requiresEmailInfrastructure(threatReport)) {
      infrastructure.push({
        id: 'email-lab',
        name: 'Email Lab Environment',
        type: 'email-gateways',
        osiLayer: 'application',
        description: 'Email infrastructure for phishing and email threat testing',
        dataSources: INFRASTRUCTURE_DATA_SOURCES['email-gateways'],
        requirements: { cpu: '2 cores', memory: '4GB', storage: '40GB' },
        deployment: {
          dockerCompose: this.generateEmailLabDocker(),
          manual: [
            'Deploy mail server (Postfix/Dovecot)',
            'Configure email security gateway',
            'Set up phishing simulation tools',
            'Configure email logging and analysis'
          ]
        },
        estimatedCost: { setup: 50, hourly: 0.08, monthly: 58 }
      });
    }

    // Network monitoring
    infrastructure.push({
      id: 'network-monitoring',
      name: 'Network Monitoring Stack',
      type: 'network-devices',
      osiLayer: 'network',
      description: 'Network traffic analysis and monitoring',
      dataSources: INFRASTRUCTURE_DATA_SOURCES['network-devices'],
      requirements: { cpu: '4 cores', memory: '16GB', storage: '200GB' },
      deployment: {
        dockerCompose: this.generateNetworkMonitoringDocker(),
        manual: [
          'Deploy Suricata IDS',
          'Configure network taps/SPAN ports',
          'Set up Wireshark and tcpdump',
          'Configure flow collection (nfcapd)',
          'Deploy network security monitoring tools'
        ]
      },
      estimatedCost: { setup: 0, hourly: 0.12, monthly: 86 }
    });

    // SIEM/SOAR
    infrastructure.push({
      id: 'siem-platform',
      name: 'SIEM Platform (Cortex XSIAM)',
      type: 'siems-soars',
      osiLayer: 'application',
      description: 'Security Information and Event Management platform',
      dataSources: INFRASTRUCTURE_DATA_SOURCES['siems-soars'],
      requirements: { cpu: '8 cores', memory: '32GB', storage: '500GB' },
      deployment: {
        manual: [
          'Deploy Cortex XSIAM instance',
          'Configure data source integrations',
          'Set up correlation rules',
          'Configure dashboards and alerts',
          'Deploy automation playbooks'
        ]
      },
      estimatedCost: { setup: 0, hourly: 1.50, monthly: 1080 }
    });

    return infrastructure;
  }

  /**
   * Generate deployment phases mapped to OSI layers
   */
  private static generateDeploymentPhases(infrastructure: InfrastructureComponent[]) {
    const phaseMap: Record<OSILayerType, InfrastructureComponent[]> = {
      'physical': [],
      'data-link': [],
      'network': [],
      'transport': [],
      'session': [],
      'presentation': [],
      'application': []
    };

    // Group infrastructure by OSI layer
    infrastructure.forEach(component => {
      phaseMap[component.osiLayer].push(component);
    });

    const phases: Array<{name: string, osiLayer: OSILayerType, duration: string, steps: string[]}> = [];
    const layerOrder: OSILayerType[] = ['physical', 'data-link', 'network', 'transport', 'session', 'presentation', 'application'];
    
    layerOrder.forEach(layer => {
      if (phaseMap[layer].length > 0) {
        phases.push({
          name: `${layer.charAt(0).toUpperCase() + layer.slice(1)} Layer Infrastructure`,
          osiLayer: layer,
          duration: this.calculatePhaseDuration(phaseMap[layer]),
          steps: phaseMap[layer].map(c => `deploy-${c.id}`)
        });
      }
    });

    return phases;
  }

  /**
   * Generate detailed build steps for each infrastructure component
   */
  private static generateBuildSteps(infrastructure: InfrastructureComponent[], threatReport: ThreatReportContent): LabBuildStep[] {
    const steps: LabBuildStep[] = [];

    infrastructure.forEach(component => {
      steps.push({
        id: `deploy-${component.id}`,
        phase: `${component.osiLayer} Layer`,
        osiLayer: component.osiLayer,
        title: `Deploy ${component.name}`,
        description: component.description,
        duration: this.calculateComponentDuration(component),
        prerequisites: component.dependencies || [],
        instructions: this.generateBeginnerFriendlyInstructions(component, threatReport),
        commands: this.generateStepByStepCommands(component),
        validation: this.generateComprehensiveValidation(component),
        troubleshooting: this.generateDetailedTroubleshooting(component),
        components: [component.id],
        estimatedCost: (component.estimatedCost?.setup || 0)
      });
    });

    // Add TTP execution steps
    steps.push({
      id: 'ttp-execution',
      phase: 'Attack Simulation',
      osiLayer: 'application',
      title: 'Execute Threat Tactics, Techniques & Procedures',
      description: 'Execute attack scenarios based on threat report analysis',
      duration: '4-6 hours',
      prerequisites: infrastructure.map(c => `deploy-${c.id}`),
      instructions: this.generateTTPExecutionInstructions(threatReport),
      validation: [
        'Verify attack execution generated expected logs',
        'Confirm SIEM detected and alerted on activities',
        'Validate response playbooks executed correctly'
      ],
      components: ['all'],
      estimatedCost: 0
    });

    return steps;
  }

  /**
   * Generate beginner-friendly instructions with detailed explanations
   */
  private static generateBeginnerFriendlyInstructions(component: InfrastructureComponent, threatReport: ThreatReportContent): string[] {
    const instructions: string[] = [];
    
    // Add context about why this component is needed
    instructions.push(`🎯 WHY THIS MATTERS: ${component.name} is essential for ${this.explainComponentPurpose(component, threatReport)}`);
    instructions.push('');
    
    // Add prerequisite check
    instructions.push('📋 BEFORE YOU START:');
    instructions.push('• Ensure you have administrator/root access to your system');
    instructions.push('• Have a stable internet connection for downloading components');
    instructions.push('• Allocate sufficient time - this step typically takes ' + this.calculateComponentDuration(component));
    instructions.push('• Read through all steps before beginning');
    instructions.push('');
    
    // Generate component-specific detailed instructions
    switch (component.type) {
      case 'cloud-platforms':
        if (component.name.toLowerCase().includes('kubernetes')) {
          instructions.push(...this.generateKubernetesInstructions(component, threatReport));
        } else {
          instructions.push(...this.generateCloudInstructions(component, threatReport));
        }
        break;
        
      case 'endpoints':
        instructions.push(...this.generateEndpointInstructions(component, threatReport));
        break;
        
      case 'network-devices':
        instructions.push(...this.generateNetworkInstructions(component, threatReport));
        break;
        
      case 'siems-soars':
        instructions.push(...this.generateSIEMInstructions(component, threatReport));
        break;
        
      default:
        instructions.push(...this.generateGenericInstructions(component, threatReport));
    }
    
    return instructions;
  }

  /**
   * Generate comprehensive Kubernetes setup instructions for beginners
   */
  private static generateKubernetesInstructions(component: InfrastructureComponent, threatReport: ThreatReportContent): string[] {
    return [
      '🚀 KUBERNETES CLUSTER SETUP (Beginner-Friendly)',
      '',
      'STEP 1: Choose Your Kubernetes Environment',
      '• For Learning: Use Docker Desktop with Kubernetes (easiest option)',
      '• For Testing: Use minikube (good for local development)', 
      '• For Production-like: Use kind (Kubernetes in Docker)',
      '',
      'OPTION A: Docker Desktop Kubernetes (RECOMMENDED FOR BEGINNERS)',
      '1. Download and install Docker Desktop from https://docker.com/products/docker-desktop',
      '2. After installation, open Docker Desktop settings',
      '3. Go to "Kubernetes" tab and check "Enable Kubernetes"',
      '4. Click "Apply & Restart" - this will take 5-10 minutes',
      '5. Open terminal/command prompt and verify: kubectl version',
      '6. If you see version info, Kubernetes is ready!',
      '',
      'OPTION B: minikube Setup (Alternative)',
      '1. Install minikube from https://minikube.sigs.k8s.io/docs/start/',
      '2. Run: minikube start --memory=4096 --cpus=2',
      '3. Wait for "Done! kubectl is now configured to use minikube cluster"',
      '4. Enable ingress: minikube addons enable ingress',
      '',
      'STEP 2: Deploy Vulnerable Application (for ' + threatReport.title + ')',
      this.generateKubernetesManifests(threatReport),
      '',
      'STEP 3: Verify Deployment',
      '• Run: kubectl get pods - you should see all pods in "Running" state',
      '• Run: kubectl get services - note the service endpoints',
      '• If using minikube: minikube ip - note this IP address',
      '',
      'STEP 4: Configure Logging and Monitoring',
      '• Deploy logging stack: kubectl apply -f logging-stack.yaml',
      '• Deploy monitoring: kubectl apply -f monitoring-stack.yaml',
      '• Access logs: kubectl logs -f deployment/<app-name>',
      '',
      '⚠️ COMMON ISSUES & SOLUTIONS:',
      '• "kubectl not found" → Install kubectl: https://kubernetes.io/docs/tasks/tools/',
      '• Pods stuck in "Pending" → Check resources: kubectl describe pod <pod-name>',
      '• "ImagePullBackOff" error → Check internet connection and image names',
      '• Out of memory → Increase Docker Desktop memory to 8GB+ in settings',
      '',
      '🎓 LEARNING RESOURCES:',
      '• Kubernetes Basics: https://kubernetes.io/docs/tutorials/kubernetes-basics/',
      '• kubectl Cheat Sheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/',
      '• Interactive Tutorial: https://www.katacoda.com/courses/kubernetes'
    ];
  }

  /**
   * Generate step-by-step commands with explanations
   */
  private static generateStepByStepCommands(component: InfrastructureComponent): Array<{platform: string, code: string, explanation: string}> {
    const commands: Array<{platform: string, code: string, explanation: string}> = [];
    
    switch (component.type) {
      case 'cloud-platforms':
        if (component.name.toLowerCase().includes('kubernetes')) {
          commands.push({
            platform: 'Linux/macOS',
            code: `# Verify kubectl is installed and working
kubectl version --client

# Check cluster status  
kubectl cluster-info

# Create namespace for our lab
kubectl create namespace threat-lab`,
            explanation: 'These commands verify your Kubernetes setup is working and creates a dedicated namespace for our threat lab environment'
          });
          
          commands.push({
            platform: 'Windows PowerShell',
            code: `# Verify kubectl is installed and working
kubectl version --client

# Check cluster status  
kubectl cluster-info

# Create namespace for our lab
kubectl create namespace threat-lab`,
            explanation: 'Same commands work on Windows PowerShell - Kubernetes commands are consistent across platforms'
          });
        }
        break;
        
      case 'endpoints':
        commands.push({
          platform: 'Windows',
          code: `# Enable Windows Defender logging
Set-MpPreference -DisableRealtimeMonitoring $false
Set-MpPreference -SubmitSamplesConsent 2

# Install Sysmon for detailed logging  
Invoke-WebRequest -Uri "https://download.sysinternals.com/files/Sysmon.zip" -OutFile "Sysmon.zip"
Expand-Archive Sysmon.zip
.\\Sysmon\\Sysmon64.exe -accepteula -i sysmon-config.xml`,
          explanation: 'Configures Windows endpoint with comprehensive logging for security monitoring and threat detection'
        });
        break;
    }
    
    return commands;
  }

  /**
   * Generate comprehensive validation steps
   */
  private static generateComprehensiveValidation(component: InfrastructureComponent): string[] {
    const validation: string[] = [];
    
    validation.push('✅ VALIDATION CHECKLIST - Complete ALL items before proceeding:');
    validation.push('');
    
    switch (component.type) {
      case 'cloud-platforms':
        if (component.name.toLowerCase().includes('kubernetes')) {
          validation.push(
            '□ Kubernetes cluster is running: kubectl cluster-info shows endpoints',
            '□ All pods are in Running state: kubectl get pods --all-namespaces',
            '□ Services are accessible: kubectl get services',
            '□ Ingress controller is working (if using ingress)',
            '□ Container logs are flowing: kubectl logs <pod-name>',
            '□ Resource monitoring is active: kubectl top nodes',
            '□ Persistent volumes are bound (if using storage)'
          );
        }
        break;
        
      case 'endpoints':
        validation.push(
          '□ Endpoint agent is installed and running',
          '□ System logs are being generated in Event Viewer (Windows) or syslog (Linux)',
          '□ Network connectivity to SIEM platform is working',
          '□ Security monitoring tools are active (Sysmon, auditd, etc.)',
          '□ File integrity monitoring is configured',
          '□ Process monitoring is capturing events'
        );
        break;
        
      case 'network-devices':
        validation.push(
          '□ Network capture is working: tcpdump/wireshark showing traffic',
          '□ Flow data is being collected and stored',
          '□ IDS/IPS rules are loaded and active',
          '□ Network segmentation is properly configured',
          '□ DNS logging is capturing queries',
          '□ Firewall logs are being generated'
        );
        break;
        
      case 'siems-soars':
        validation.push(
          '□ SIEM platform is accessible via web interface',
          '□ Data sources are connected and ingesting logs',
          '□ Correlation rules are active',
          '□ Dashboards are displaying data',
          '□ Alert generation is working',
          '□ Playbook automation is enabled'
        );
        break;
    }
    
    validation.push('');
    validation.push('🔍 VERIFICATION COMMANDS:');
    validation.push(...this.generateVerificationCommands(component));
    
    return validation;
  }

  /**
   * Generate detailed troubleshooting guide
   */
  private static generateDetailedTroubleshooting(component: InfrastructureComponent): string[] {
    const troubleshooting: string[] = [];
    
    troubleshooting.push('🔧 TROUBLESHOOTING GUIDE:');
    troubleshooting.push('');
    
    switch (component.type) {
      case 'cloud-platforms':
        if (component.name.toLowerCase().includes('kubernetes')) {
          troubleshooting.push(
            'PROBLEM: Pods stuck in "Pending" state',
            'SOLUTION: Check resources with "kubectl describe pod <pod-name>"',
            '• Insufficient memory/CPU → Increase Docker Desktop resources',
            '• Missing persistent volumes → Apply PV/PVC manifests first',
            '• Node selector issues → Remove nodeSelector constraints',
            '',
            'PROBLEM: "ImagePullBackOff" errors',
            'SOLUTION: Fix image references and registry access',
            '• Check image name spelling: kubectl describe pod <pod-name>',
            '• Verify registry credentials: kubectl get secrets',
            '• Test internet connectivity: ping registry-host',
            '',
            'PROBLEM: Services not accessible',
            'SOLUTION: Debug service and endpoint configuration',
            '• Check service selector: kubectl describe service <service-name>',
            '• Verify endpoints: kubectl get endpoints',
            '• Test port forwarding: kubectl port-forward service/<service> 8080:80',
            '',
            'PROBLEM: DNS resolution issues',
            'SOLUTION: Check cluster DNS configuration',
            '• Test DNS: kubectl run test-pod --image=busybox --rm -it -- nslookup kubernetes.default',
            '• Check CoreDNS pods: kubectl get pods -n kube-system -l k8s-app=kube-dns',
            '• Restart CoreDNS if needed: kubectl rollout restart deployment/coredns -n kube-system'
          );
        }
        break;
        
      case 'endpoints':
        troubleshooting.push(
          'PROBLEM: Agent not reporting to SIEM',
          'SOLUTION: Check network connectivity and configuration',
          '• Test network: telnet <siem-host> <port>',
          '• Check agent logs: Windows Event Viewer or /var/log/agent/',
          '• Verify certificates and authentication',
          '',
          'PROBLEM: No security events being generated',
          'SOLUTION: Configure proper logging and monitoring',
          '• Enable audit logging: auditpol /set /category:* /success:enable /failure:enable',
          '• Install Sysmon: https://docs.microsoft.com/en-us/sysinternals/downloads/sysmon',
          '• Check firewall/AV exclusions for monitoring tools'
        );
        break;
    }
    
    troubleshooting.push('');
    troubleshooting.push('📞 SUPPORT RESOURCES:');
    troubleshooting.push('• Documentation: [Link to relevant docs]');
    troubleshooting.push('• Community Forums: [Link to support forum]');
    troubleshooting.push('• Video Tutorials: [Link to tutorial videos]');
    
    return troubleshooting;
  }

  /**
   * Explain why a component is needed for the specific threat
   */
  private static explainComponentPurpose(component: InfrastructureComponent, threatReport: ThreatReportContent): string {
    const threatContext = threatReport.content.toLowerCase();
    const componentName = component.name.toLowerCase();
    
    if (componentName.includes('kubernetes')) {
      if (threatContext.includes('container') || threatContext.includes('k8s') || threatContext.includes('kubernetes')) {
        return `this threat specifically targets Kubernetes environments. We need a K8s cluster to replicate the exact attack conditions described in "${threatReport.title}".`;
      }
      return 'modern cloud-native applications run on Kubernetes, and this threat could potentially affect containerized environments.';
    }
    
    if (component.type === 'endpoints') {
      return `endpoint detection and response testing. The threat "${threatReport.title}" requires a realistic endpoint environment to demonstrate how attacks progress and how Cortex detects them.`;
    }
    
    if (component.type === 'network-devices') {
      return `network traffic analysis and monitoring. This threat involves network-based activities that need to be captured and analyzed by our security tools.`;
    }
    
    if (component.type === 'siems-soars') {
      return `centralizing security data and orchestrating response actions. Cortex XSIAM will process all the logs from our lab environment and demonstrate automated threat detection.`;
    }
    
    return `creating a realistic environment to test and validate the threat scenarios described in "${threatReport.title}".`;
  }

  /**
   * Generate Kubernetes manifests based on threat report
   */
  private static generateKubernetesManifests(threatReport: ThreatReportContent): string {
    const threatType = this.determineThreatType(threatReport);
    
    let manifest = '';
    
    if (threatType.includes('web') || threatType.includes('application')) {
      manifest = `# Save this as vulnerable-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vulnerable-web-app
  namespace: threat-lab
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vulnerable-web-app
  template:
    metadata:
      labels:
        app: vulnerable-web-app
    spec:
      containers:
      - name: web-app
        image: vulnerables/web-dvwa:latest
        ports:
        - containerPort: 80
        env:
        - name: MYSQL_HOST
          value: mysql-service
---
apiVersion: v1
kind: Service
metadata:
  name: vulnerable-web-service
  namespace: threat-lab
spec:
  selector:
    app: vulnerable-web-app
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer`;
    }
    
    return `STEP 2A: Create Application Manifest
${manifest}

STEP 2B: Deploy the Application
• Save the manifest above as 'vulnerable-app.yaml'
• Run: kubectl apply -f vulnerable-app.yaml
• Wait for deployment: kubectl wait --for=condition=available --timeout=300s deployment/vulnerable-web-app -n threat-lab`;
  }

  /**
   * Generate verification commands
   */
  private static generateVerificationCommands(component: InfrastructureComponent): string[] {
    const commands: string[] = [];
    
    switch (component.type) {
      case 'cloud-platforms':
        if (component.name.toLowerCase().includes('kubernetes')) {
          commands.push(
            '# Check cluster health',
            'kubectl get componentstatuses',
            '',
            '# Verify all system pods are running',
            'kubectl get pods --all-namespaces | grep -v Running',
            '(Should return empty - all pods should be Running)',
            '',
            '# Check resource usage',
            'kubectl top nodes',
            'kubectl top pods --all-namespaces'
          );
        }
        break;
        
      case 'endpoints':
        commands.push(
          '# Windows: Check Windows Defender status',
          'Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled',
          '',
          '# Windows: Verify Sysmon is running',
          'Get-Service Sysmon64',
          '',
          '# Linux: Check auditd status',
          'systemctl status auditd'
        );
        break;
    }
    
    return commands;
  }

  /**
   * Determine threat type from report content
   */
  private static determineThreatType(threatReport: ThreatReportContent): string {
    const content = threatReport.content.toLowerCase();
    const title = threatReport.title.toLowerCase();
    const combined = `${title} ${content}`;
    
    if (combined.includes('web') || combined.includes('http') || combined.includes('application')) {
      return 'web-application';
    }
    if (combined.includes('container') || combined.includes('kubernetes') || combined.includes('docker')) {
      return 'container';
    }
    if (combined.includes('network') || combined.includes('dns') || combined.includes('traffic')) {
      return 'network';
    }
    if (combined.includes('endpoint') || combined.includes('malware') || combined.includes('executable')) {
      return 'endpoint';
    }
    
    return 'generic';
  }

  /**
   * Generate cloud infrastructure instructions (non-Kubernetes)
   */
  private static generateCloudInstructions(component: InfrastructureComponent, threatReport: ThreatReportContent): string[] {
    return [
      '☁️ CLOUD PLATFORM SETUP',
      '',
      'STEP 1: Choose Cloud Provider',
      '• AWS: Most comprehensive service offering',
      '• Azure: Best for Microsoft-integrated environments', 
      '• GCP: Strong in data analytics and machine learning',
      '',
      'STEP 2: Set Up Basic Infrastructure',
      '• Create VPC/Virtual Network for isolation',
      '• Configure security groups/network security groups',
      '• Deploy compute instances with appropriate sizing',
      '• Set up logging and monitoring (CloudTrail, CloudWatch, etc.)',
      '',
      'STEP 3: Configure Data Collection',
      '• Enable cloud audit logs',
      '• Set up flow logs for network traffic',
      '• Configure service-specific logging',
      '• Create log forwarding to SIEM platform'
    ];
  }

  /**
   * Generate endpoint setup instructions
   */
  private static generateEndpointInstructions(component: InfrastructureComponent, threatReport: ThreatReportContent): string[] {
    return [
      '💻 ENDPOINT SETUP AND CONFIGURATION',
      '',
      'STEP 1: Prepare Endpoint Environment',
      '• Deploy Windows 10/11 or Linux endpoints',
      '• Ensure endpoints can reach SIEM platform',
      '• Install necessary monitoring agents',
      '• Configure baseline security settings',
      '',
      'STEP 2: Install Security Monitoring Tools',
      '• Windows: Install Sysmon for detailed process/network logging',
      '• Linux: Configure auditd for system call monitoring',
      '• Install endpoint detection and response (EDR) agents',
      '• Configure Windows Event Log collection',
      '',
      'STEP 3: Configure Logging and Forwarding',
      '• Set up log forwarding to central SIEM',
      '• Configure appropriate log retention policies',
      '• Test log generation and collection',
      '• Validate data is reaching SIEM platform',
      '',
      'STEP 4: Prepare Attack Surface',
      `• Install applications relevant to "${threatReport.title}"`,
      '• Configure realistic user accounts and permissions',
      '• Set up network shares and services as needed',
      '• Document baseline configuration for comparison'
    ];
  }

  /**
   * Generate network infrastructure instructions  
   */
  private static generateNetworkInstructions(component: InfrastructureComponent, threatReport: ThreatReportContent): string[] {
    return [
      '🌐 NETWORK MONITORING INFRASTRUCTURE',
      '',
      'STEP 1: Deploy Network Monitoring Tools',
      '• Set up network taps or configure SPAN/mirror ports',
      '• Deploy Suricata IDS for intrusion detection',
      '• Configure Wireshark/tcpdump for packet capture',
      '• Set up network flow collection (NetFlow/sFlow)',
      '',
      'STEP 2: Configure Traffic Analysis',
      '• Deploy network security monitoring (NSM) tools',
      '• Set up DNS logging and analysis',
      '• Configure SSL/TLS certificate monitoring',
      '• Implement network segmentation for lab isolation',
      '',
      'STEP 3: Integrate with SIEM Platform',
      '• Configure log forwarding from network devices',
      '• Set up real-time alerting for suspicious activity',
      '• Create network traffic baselines',
      '• Test detection capabilities with safe traffic'
    ];
  }

  /**
   * Generate SIEM platform setup instructions
   */
  private static generateSIEMInstructions(component: InfrastructureComponent, threatReport: ThreatReportContent): string[] {
    return [
      '🛡️ CORTEX XSIAM PLATFORM SETUP',
      '',
      'STEP 1: Deploy XSIAM Instance',
      '• Access Cortex XSIAM platform via web console',
      '• Complete initial configuration wizard',
      '• Configure administrator accounts and permissions',
      '• Set up organizational settings and preferences',
      '',
      'STEP 2: Configure Data Source Integrations',
      '• Add endpoint agents and configure data collection',
      '• Set up network device log forwarding',
      '• Configure cloud platform integrations (AWS/Azure/GCP)',
      '• Test data ingestion from all planned sources',
      '',
      'STEP 3: Create Detection Content',
      `• Import or create correlation rules for "${threatReport.title}"`,
      '• Configure alert layouts for incident investigation',
      '• Set up automated response playbooks',
      '• Create dashboards for threat monitoring',
      '',
      'STEP 4: Validate Platform Readiness',
      '• Test end-to-end data flow from sources to SIEM',
      '• Verify correlation rules are active and functioning',
      '• Confirm alert generation and notification systems',
      '• Test automated response capabilities'
    ];
  }

  /**
   * Generate generic infrastructure instructions
   */
  private static generateGenericInstructions(component: InfrastructureComponent, threatReport: ThreatReportContent): string[] {
    return [
      `🔧 ${component.name.toUpperCase()} SETUP`,
      '',
      'STEP 1: Prepare Infrastructure Environment',
      '• Ensure system requirements are met',
      '• Configure network connectivity and security',
      '• Set up necessary dependencies and prerequisites',
      '',
      'STEP 2: Deploy and Configure Component',
      '• Follow vendor installation procedures',
      '• Apply security hardening configurations', 
      '• Configure monitoring and logging',
      '• Test basic functionality',
      '',
      'STEP 3: Integration and Validation',
      '• Connect to central monitoring platform',
      '• Validate data collection and forwarding',
      '• Test integration with other lab components',
      `• Ensure readiness for "${threatReport.title}" threat simulation`
    ];
  }

  /**
   * Calculate component deployment duration
   */
  private static calculateComponentDuration(component: InfrastructureComponent): string {
    switch (component.type) {
      case 'cloud-platforms':
        if (component.name.toLowerCase().includes('kubernetes')) {
          return '2-4 hours';
        }
        return '1-2 hours';
      case 'endpoints':
        return '1-2 hours';
      case 'network-devices':
        return '2-3 hours';
      case 'siems-soars':
        return '3-4 hours';
      default:
        return '1-2 hours';
    }
  }

  /**
   * Generate TTP execution plans based on threat report
   */
  private static generateTTPExecution(threatReport: ThreatReportContent): TTPExecution[] {
    const ttps: TTPExecution[] = [];

    // Generate TTPs based on MITRE ATT&CK techniques found
    threatReport.mitreAttack.forEach(technique => {
      ttps.push({
        id: `ttp-${technique.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: `Execute ${technique}`,
        mitreId: technique,
        description: `Execute ${technique} technique as identified in threat report`,
        platform: this.selectTTPPlatform(technique),
        execution: this.generateTTPExecution_Single(technique, threatReport),
        expectedLogs: this.generateExpectedLogs(technique),
        detectionRules: this.generateDetectionRules_Single(technique),
        cleanup: this.generateCleanupInstructions(technique)
      });
    });

    return ttps;
  }

  /**
   * Helper methods for content extraction
   */
  private static extractCVEs(content: string): string[] {
    const cveRegex = /CVE-\d{4}-\d{4,}/g;
    return Array.from(new Set(content.match(cveRegex) || []));
  }

  private static extractMitreAttack(content: string): string[] {
    const mitreRegex = /T\d{4}(?:\.\d{3})?/g;
    const techniques = [...new Set(content.match(mitreRegex) || [])];
    
    // Also look for technique names
    const techniqueNames = [
      'Command and Control', 'Data Exfiltration', 'Persistence', 'Privilege Escalation',
      'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
      'Initial Access', 'Execution', 'Impact', 'Collection'
    ];
    
    techniqueNames.forEach(name => {
      if (content.toLowerCase().includes(name.toLowerCase())) {
        techniques.push(name);
      }
    });

    return Array.from(new Set(techniques));
  }

  private static extractTechnologies(content: string): string[] {
    const technologies: string[] = [];
    const techKeywords = [
      'windows', 'linux', 'macos', 'azure', 'aws', 'kubernetes', 'docker',
      'exchange', 'sharepoint', 'office 365', 'active directory', 'powershell',
      'php', 'java', 'python', 'javascript', 'sql server', 'mysql', 'oracle'
    ];

    techKeywords.forEach(tech => {
      if (content.toLowerCase().includes(tech)) {
        technologies.push(tech);
      }
    });

    return Array.from(new Set(technologies));
  }

  private static extractThreatActors(content: string): string[] {
    const actorRegex = /(APT\d+|Lazarus|FIN\d+|Carbanak|DarkHalo|UNC\d+)/gi;
    return Array.from(new Set(content.match(actorRegex) || []));
  }

  private static extractIOCs(content: string) {
    return {
      domains: this.extractDomains(content),
      ips: this.extractIPs(content),
      hashes: this.extractHashes(content),
      urls: this.extractURLs(content)
    };
  }

  private static extractTTPs(content: string): string[] {
    const ttpKeywords = [
      'phishing', 'malware', 'ransomware', 'command injection', 'sql injection',
      'privilege escalation', 'lateral movement', 'data exfiltration', 'backdoor',
      'trojan', 'rootkit', 'keylogger', 'credential harvesting'
    ];

    const foundTTPs: string[] = [];
    ttpKeywords.forEach(ttp => {
      if (content.toLowerCase().includes(ttp)) {
        foundTTPs.push(ttp);
      }
    });

    return Array.from(new Set(foundTTPs));
  }

  private static extractDomains(content: string): string[] {
    const domainRegex = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?/gi;
    return Array.from(new Set(content.match(domainRegex) || []));
  }

  private static extractIPs(content: string): string[] {
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    return Array.from(new Set(content.match(ipRegex) || []));
  }

  private static extractHashes(content: string): string[] {
    const hashRegex = /\b[a-fA-F0-9]{32,64}\b/g;
    return Array.from(new Set(content.match(hashRegex) || []));
  }

  private static extractURLs(content: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/gi;
    return Array.from(new Set(content.match(urlRegex) || []));
  }

  // Additional helper methods would continue here...
  // Due to space constraints, I'm including the most critical methods
  // The remaining methods would follow similar patterns for:
  // - Infrastructure requirement detection
  // - Terraform/Ansible generation
  // - Cost calculations
  // - Duration estimates
  // - Validation steps
  // - Troubleshooting guides

  private static extractTitleFromContent(content: string): string {
    const lines = content.split('\n');
    return lines.find(line => line.trim().length > 10) || 'Untitled Threat Report';
  }

  private static requiresEndpointInfrastructure(threatReport: ThreatReportContent): boolean {
    const indicators = ['malware', 'executable', 'dll', 'registry', 'powershell', 'cmd', 'process'];
    return indicators.some(indicator => 
      threatReport.content.toLowerCase().includes(indicator) ||
      threatReport.ttps.some(ttp => ttp.includes(indicator))
    );
  }

  private static requiresIdentityInfrastructure(threatReport: ThreatReportContent): boolean {
    const indicators = ['active directory', 'domain controller', 'authentication', 'kerberos', 'ldap'];
    return indicators.some(indicator => threatReport.content.toLowerCase().includes(indicator));
  }

  private static requiresCloudInfrastructure(threatReport: ThreatReportContent): boolean {
    const indicators = ['aws', 'azure', 'gcp', 'cloud', 's3', 'lambda', 'ec2'];
    return indicators.some(indicator => threatReport.content.toLowerCase().includes(indicator));
  }

  private static requiresEmailInfrastructure(threatReport: ThreatReportContent): boolean {
    const indicators = ['phishing', 'email', 'attachment', 'smtp', 'exchange'];
    return indicators.some(indicator => threatReport.content.toLowerCase().includes(indicator));
  }

  private static calculateTotalDuration(steps: LabBuildStep[]): string {
    // Simple duration calculation - in reality would parse duration strings
    const totalHours = steps.length * 2; // Estimate 2 hours per step
    return `${totalHours}-${totalHours + Math.floor(totalHours * 0.5)} hours`;
  }

  private static calculateTotalCost(infrastructure: InfrastructureComponent[]) {
    const setup = infrastructure.reduce((sum, comp) => sum + (comp.estimatedCost?.setup || 0), 0);
    const hourly = infrastructure.reduce((sum, comp) => sum + (comp.estimatedCost?.hourly || 0), 0);
    const monthly = infrastructure.reduce((sum, comp) => sum + (comp.estimatedCost?.monthly || 0), 0);
    
    return { setup, hourly, monthly };
  }

  private static generateTaxonomyMapping(threatReport: ThreatReportContent): TaxonomyMapping {
    return {
      stix: [], // Would implement STIX 2.1 mapping
      mitreAttack: threatReport.mitreAttack,
      openIOC: [], // Would implement OpenIOC mapping
      veris: [], // Would implement VERIS mapping
      mispTaxonomies: [], // Would implement MISP taxonomy mapping
      sigmaRules: [] // Would implement Sigma rule mapping
    };
  }

  // Placeholder methods for code generation - these would contain actual implementation
  private static generateWindowsWorkstationTerraform(): string { return '# Terraform code here'; }
  private static generateWindowsWorkstationAnsible(): string { return '# Ansible playbook here'; }
  private static generateAWSLabTerraform(): string { return '# AWS Terraform code here'; }
  private static generateEmailLabDocker(): string { return '# Docker compose here'; }
  private static generateNetworkMonitoringDocker(): string { return '# Network monitoring stack here'; }
  private static calculatePhaseDuration(components: InfrastructureComponent[]): string { return '2-4 hours'; }
  private static calculateComponentDuration(component: InfrastructureComponent): string { return '1-2 hours'; }
  private static generateDetailedInstructions(component: InfrastructureComponent, threatReport: ThreatReportContent): string[] { 
    return component.deployment?.manual || [];
  }
  private static generateDeploymentCommands(component: InfrastructureComponent) { return []; }
  private static generateValidationSteps(component: InfrastructureComponent): string[] { return ['Verify component is running']; }
  private static generateTroubleshootingSteps(component: InfrastructureComponent): string[] { return ['Check logs for errors']; }
  private static generateTTPExecutionInstructions(threatReport: ThreatReportContent): string[] { return ['Execute identified TTPs']; }
  private static selectTTPPlatform(technique: string) { return 'atomic-red-team' as const; }
  private static generateTTPExecution_Single(technique: string, threatReport: ThreatReportContent) { return {}; }
  private static generateExpectedLogs(technique: string): string[] { return ['Expected log entries']; }
  private static generateDetectionRules_Single(technique: string): string[] { return ['Detection rules']; }
  private static generateCleanupInstructions(technique: string): string[] { return ['Cleanup steps']; }
  private static generateDataIngestionValidation(infrastructure: InfrastructureComponent[]): string[] { return ['Data validation']; }
  private static generateDetectionRules(threatReport: ThreatReportContent): string[] { return ['Detection rules']; }
  private static generateAlertGeneration(threatReport: ThreatReportContent): string[] { return ['Alert generation']; }
  private static generateResponsePlaybooks(threatReport: ThreatReportContent): string[] { return ['Response playbooks']; }
}