import { UseCase } from '@shared/schema';
import { aiProviderManager } from './ai-providers.js';

export interface ContentRecommendation {
  id: string;
  type: 'xql-rule' | 'playbook' | 'layout' | 'dashboard' | 'data-source';
  title: string;
  description: string;
  reason: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: number; // minutes
  requiredDataSources: string[];
  tags: string[];
  category: string;
  template?: any;
}

export interface RecommendationContext {
  threatType: string;
  attackVectors: string[];
  technologies: string[];
  severity: string;
  cves: string[];
  mitreAttack: string[];
  dataSources: string[];
  existingContent: any[];
}

export class ContentRecommendationEngine {
  private knowledgeBase: Map<string, any> = new Map();
  private patternDatabase: Map<string, any> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
    this.buildPatternDatabase();
  }

  /**
   * Generate intelligent content recommendations based on threat context
   */
  async generateRecommendations(useCase: UseCase): Promise<ContentRecommendation[]> {
    const context = this.analyzeContext(useCase);
    
    // Try to get AI-powered recommendations first
    try {
      const aiResults = await aiProviderManager.generateCombinedRecommendations(useCase);
      if (aiResults.combined && Object.keys(aiResults.combined).length > 0) {
        return this.convertAIRecommendations(aiResults, context);
      }
    } catch (error) {
      console.log('[Content Engine] AI providers unavailable, using rule-based recommendations:', error);
    }

    // Fallback to rule-based recommendations
    const recommendations: ContentRecommendation[] = [];
    recommendations.push(...await this.recommendXQLRules(context));
    recommendations.push(...await this.recommendPlaybooks(context));
    recommendations.push(...await this.recommendAlertLayouts(context));
    recommendations.push(...await this.recommendDashboards(context));
    recommendations.push(...await this.recommendDataSources(context));

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority] * a.confidence;
      const bPriority = priorityWeight[b.priority] * b.confidence;
      return bPriority - aPriority;
    });
  }

  /**
   * Analyze threat context to understand requirements
   */
  private analyzeContext(useCase: UseCase): RecommendationContext {
    return {
      threatType: this.categorizeThreat(useCase),
      attackVectors: this.extractAttackVectors(useCase),
      technologies: this.extractTechnologies(useCase),
      severity: useCase.severity || 'medium',
      cves: (useCase as any).cves || [],
      mitreAttack: (useCase as any).mitreAttack || [],
      dataSources: this.inferDataSources(useCase),
      existingContent: []
    };
  }

  /**
   * Recommend XQL correlation rules based on threat patterns
   */
  private async recommendXQLRules(context: RecommendationContext): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Process execution monitoring
    if (context.attackVectors.includes('Remote Code Execution') || 
        context.mitreAttack.includes('T1059')) {
      recommendations.push({
        id: `xql-process-${Date.now()}`,
        type: 'xql-rule',
        title: 'Suspicious Process Execution Detection',
        description: 'Monitor for unusual process execution patterns indicating RCE attempts',
        reason: 'Threat involves remote code execution - process monitoring is critical',
        confidence: 95,
        priority: 'high',
        estimatedEffort: 30,
        requiredDataSources: ['Windows Event Logs', 'Sysmon', 'EDR'],
        tags: ['process-monitoring', 'rce-detection', 'behavioral-analysis'],
        category: 'endpoint',
        template: this.getProcessMonitoringTemplate(context)
      });
    }

    // Network connection monitoring
    if (context.attackVectors.includes('Network Intrusion') ||
        context.mitreAttack.includes('T1071')) {
      recommendations.push({
        id: `xql-network-${Date.now()}`,
        type: 'xql-rule',
        title: 'Suspicious Network Communication',
        description: 'Detect unusual network connections and data exfiltration attempts',
        reason: 'Network-based threat requires connection monitoring',
        confidence: 90,
        priority: 'high',
        estimatedEffort: 25,
        requiredDataSources: ['NetFlow', 'Firewall Logs', 'Proxy Logs'],
        tags: ['network-monitoring', 'c2-detection', 'data-exfiltration'],
        category: 'network'
      });
    }

    // File system monitoring
    if (context.attackVectors.includes('Malware') ||
        context.mitreAttack.includes('T1105')) {
      recommendations.push({
        id: `xql-file-${Date.now()}`,
        type: 'xql-rule',
        title: 'Malicious File Activity Detection',
        description: 'Monitor file creation, modification, and execution patterns',
        reason: 'Malware threats require comprehensive file system monitoring',
        confidence: 88,
        priority: 'medium',
        estimatedEffort: 35,
        requiredDataSources: ['File Integrity Monitoring', 'Sysmon', 'EDR'],
        tags: ['file-monitoring', 'malware-detection', 'persistence'],
        category: 'endpoint'
      });
    }

    return recommendations;
  }

  /**
   * Recommend automation playbooks for response workflows
   */
  private async recommendPlaybooks(context: RecommendationContext): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Incident response playbook
    if (context.severity === 'high' || context.severity === 'critical') {
      recommendations.push({
        id: `playbook-incident-${Date.now()}`,
        type: 'playbook',
        title: 'Automated Incident Response',
        description: 'Coordinate initial response, containment, and escalation procedures',
        reason: 'High severity threats require immediate automated response',
        confidence: 92,
        priority: context.severity === 'critical' ? 'critical' : 'high',
        estimatedEffort: 45,
        requiredDataSources: ['XSIAM Incidents', 'Asset Management', 'User Directory'],
        tags: ['incident-response', 'automation', 'containment'],
        category: 'response'
      });
    }

    // Threat hunting playbook
    if (context.attackVectors.includes('APT') || context.mitreAttack.length > 3) {
      recommendations.push({
        id: `playbook-hunting-${Date.now()}`,
        type: 'playbook',
        title: 'Proactive Threat Hunting',
        description: 'Execute systematic threat hunting based on observed TTPs',
        reason: 'Complex attack patterns require proactive hunting',
        confidence: 85,
        priority: 'medium',
        estimatedEffort: 60,
        requiredDataSources: ['Historical Logs', 'Threat Intelligence', 'Behavioral Analytics'],
        tags: ['threat-hunting', 'ttp-analysis', 'proactive-defense'],
        category: 'hunting'
      });
    }

    // Containment playbook
    if (context.attackVectors.includes('Lateral Movement') ||
        context.mitreAttack.includes('T1021')) {
      recommendations.push({
        id: `playbook-containment-${Date.now()}`,
        type: 'playbook',
        title: 'Network Segmentation & Containment',
        description: 'Isolate affected systems and prevent lateral movement',
        reason: 'Lateral movement threats require immediate containment',
        confidence: 94,
        priority: 'high',
        estimatedEffort: 30,
        requiredDataSources: ['Network Topology', 'Asset Inventory', 'Security Controls'],
        tags: ['containment', 'network-isolation', 'lateral-movement'],
        category: 'containment'
      });
    }

    return recommendations;
  }

  /**
   * Recommend alert layouts for analyst workflows
   */
  private async recommendAlertLayouts(context: RecommendationContext): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Executive summary layout
    if (context.severity === 'critical') {
      recommendations.push({
        id: `layout-executive-${Date.now()}`,
        type: 'layout',
        title: 'Executive Summary Layout',
        description: 'High-level threat overview for leadership briefings',
        reason: 'Critical threats require executive visibility',
        confidence: 88,
        priority: 'high',
        estimatedEffort: 20,
        requiredDataSources: ['Incident Data', 'Impact Assessment', 'Timeline'],
        tags: ['executive-summary', 'leadership', 'business-impact'],
        category: 'communication'
      });
    }

    // Technical analysis layout
    recommendations.push({
      id: `layout-technical-${Date.now()}`,
      type: 'layout',
      title: 'Technical Analysis Workspace',
      description: 'Detailed technical fields for deep analysis',
      reason: 'Technical analysis requires structured data presentation',
      confidence: 90,
      priority: 'medium',
      estimatedEffort: 25,
      requiredDataSources: ['Raw Logs', 'Parsed Events', 'Enrichment Data'],
      tags: ['technical-analysis', 'forensics', 'detailed-view'],
      category: 'analysis'
    });

    return recommendations;
  }

  /**
   * Recommend dashboards for monitoring and metrics
   */
  private async recommendDashboards(context: RecommendationContext): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Threat landscape dashboard
    recommendations.push({
      id: `dashboard-landscape-${Date.now()}`,
      type: 'dashboard',
      title: 'Threat Landscape Overview',
      description: 'Real-time threat metrics and trend analysis',
      reason: 'Comprehensive threat monitoring requires centralized visibility',
      confidence: 85,
      priority: 'medium',
      estimatedEffort: 40,
      requiredDataSources: ['Threat Intelligence', 'Incident Data', 'Detection Metrics'],
      tags: ['threat-landscape', 'metrics', 'trends'],
      category: 'monitoring'
    });

    // Category-specific dashboard
    const categoryDashboards = {
      'endpoint': 'Endpoint Security Dashboard',
      'network': 'Network Security Dashboard', 
      'cloud': 'Cloud Security Dashboard',
      'identity': 'Identity Security Dashboard'
    };

    if (categoryDashboards[context.threatType as keyof typeof categoryDashboards]) {
      recommendations.push({
        id: `dashboard-${context.threatType}-${Date.now()}`,
        type: 'dashboard',
        title: categoryDashboards[context.threatType as keyof typeof categoryDashboards],
        description: `Specialized monitoring for ${context.threatType} security events`,
        reason: `${context.threatType} threats require focused monitoring`,
        confidence: 82,
        priority: 'medium',
        estimatedEffort: 35,
        requiredDataSources: context.dataSources,
        tags: [context.threatType, 'specialized-monitoring', 'kpi'],
        category: context.threatType
      });
    }

    return recommendations;
  }

  /**
   * Recommend data sources for comprehensive coverage
   */
  private async recommendDataSources(context: RecommendationContext): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];
    const missingDataSources = this.identifyMissingDataSources(context);

    for (const dataSource of missingDataSources) {
      recommendations.push({
        id: `datasource-${dataSource.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        type: 'data-source',
        title: `${dataSource} Integration`,
        description: `Enable ${dataSource} data collection for enhanced detection`,
        reason: this.getDataSourceReason(dataSource, context),
        confidence: this.getDataSourceConfidence(dataSource, context),
        priority: this.getDataSourcePriority(dataSource, context),
        estimatedEffort: this.getDataSourceEffort(dataSource),
        requiredDataSources: [],
        tags: ['data-integration', 'coverage-enhancement', dataSource.toLowerCase()],
        category: 'infrastructure'
      });
    }

    return recommendations;
  }

  // Helper methods for data source analysis
  private identifyMissingDataSources(context: RecommendationContext): string[] {
    const recommended = new Set<string>();
    
    // Essential data sources by threat type
    const dataSourceMap = {
      'endpoint': ['Windows Event Logs', 'Sysmon', 'EDR'],
      'network': ['NetFlow', 'Firewall Logs', 'IDS/IPS'],
      'cloud': ['AWS CloudTrail', 'Azure Activity Logs', 'Container Logs'],
      'identity': ['Active Directory Logs', 'Authentication Logs', 'Privilege Monitoring']
    };

    // Add recommended sources based on threat type
    if (dataSourceMap[context.threatType as keyof typeof dataSourceMap]) {
      dataSourceMap[context.threatType as keyof typeof dataSourceMap].forEach((ds: string) => recommended.add(ds));
    }

    // Add sources based on attack vectors
    context.attackVectors.forEach(vector => {
      if (vector.includes('Code Execution')) recommended.add('Sysmon');
      if (vector.includes('Network')) recommended.add('NetFlow');
      if (vector.includes('Cloud')) recommended.add('AWS CloudTrail');
      if (vector.includes('Email')) recommended.add('Email Security Logs');
    });

    // Filter out already present data sources
    return Array.from(recommended).filter(ds => !context.dataSources.includes(ds));
  }

  private getDataSourceReason(dataSource: string, context: RecommendationContext): string {
    const reasons: Record<string, string> = {
      'Sysmon': 'Enhanced process and network monitoring for endpoint threats',
      'NetFlow': 'Network traffic analysis for lateral movement detection',
      'AWS CloudTrail': 'Cloud API monitoring for infrastructure attacks',
      'Email Security Logs': 'Phishing and malware delivery detection'
    };
    return reasons[dataSource] || `${dataSource} provides additional threat visibility`;
  }

  private getDataSourceConfidence(dataSource: string, context: RecommendationContext): number {
    // Higher confidence for directly related data sources
    if (context.threatType === 'endpoint' && dataSource.includes('Endpoint')) return 95;
    if (context.threatType === 'network' && dataSource.includes('Network')) return 95;
    if (context.threatType === 'cloud' && dataSource.includes('Cloud')) return 95;
    return 75;
  }

  private getDataSourcePriority(dataSource: string, context: RecommendationContext): 'low' | 'medium' | 'high' | 'critical' {
    if (context.severity === 'critical') return 'high';
    if (context.severity === 'high') return 'medium';
    return 'low';
  }

  private getDataSourceEffort(dataSource: string): number {
    const effortMap: Record<string, number> = {
      'Windows Event Logs': 15,
      'Sysmon': 30,
      'EDR': 45,
      'NetFlow': 25,
      'AWS CloudTrail': 20,
      'Azure Activity Logs': 20
    };
    return effortMap[dataSource] || 30;
  }

  // Helper methods for context analysis
  private categorizeThreat(useCase: UseCase): string {
    const description = (useCase.description || '').toLowerCase();
    const title = (useCase.title || '').toLowerCase();
    const combined = `${title} ${description}`;

    if (combined.includes('endpoint') || combined.includes('process') || combined.includes('malware')) {
      return 'endpoint';
    }
    if (combined.includes('network') || combined.includes('traffic') || combined.includes('connection')) {
      return 'network';
    }
    if (combined.includes('cloud') || combined.includes('aws') || combined.includes('azure')) {
      return 'cloud';
    }
    if (combined.includes('identity') || combined.includes('authentication') || combined.includes('credential')) {
      return 'identity';
    }
    return 'general';
  }

  private extractAttackVectors(useCase: UseCase): string[] {
    const vectors = [];
    const text = `${useCase.title || ''} ${useCase.description || ''}`.toLowerCase();

    if (text.includes('remote code execution') || text.includes('rce')) {
      vectors.push('Remote Code Execution');
    }
    if (text.includes('lateral movement') || text.includes('privilege escalation')) {
      vectors.push('Lateral Movement');
    }
    if (text.includes('data exfiltration') || text.includes('data theft')) {
      vectors.push('Data Exfiltration');
    }
    if (text.includes('persistence') || text.includes('backdoor')) {
      vectors.push('Persistence');
    }
    if (text.includes('network intrusion') || text.includes('network attack')) {
      vectors.push('Network Intrusion');
    }
    if (text.includes('malware') || text.includes('trojan') || text.includes('virus')) {
      vectors.push('Malware');
    }

    return vectors;
  }

  private extractTechnologies(useCase: UseCase): string[] {
    const technologies = [];
    const text = `${useCase.title || ''} ${useCase.description || ''}`.toLowerCase();

    const techKeywords = {
      'Windows': ['windows', 'win32', 'microsoft'],
      'Linux': ['linux', 'unix', 'centos', 'ubuntu'],
      'Kubernetes': ['kubernetes', 'k8s', 'container'],
      'AWS': ['aws', 'amazon web services', 's3', 'ec2'],
      'Azure': ['azure', 'microsoft cloud'],
      'Docker': ['docker', 'container'],
      'Apache': ['apache', 'httpd'],
      'NGINX': ['nginx'],
      'Java': ['java', 'jvm'],
      'Python': ['python'],
      'Node.js': ['nodejs', 'node.js']
    };

    for (const [tech, keywords] of Object.entries(techKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        technologies.push(tech);
      }
    }

    return technologies;
  }

  /**
   * Convert AI provider recommendations to our recommendation format
   */
  private convertAIRecommendations(aiResults: any, context: RecommendationContext): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    const combined = aiResults.combined;
    
    // Convert XQL rules
    if (combined.xqlRules) {
      combined.xqlRules.forEach((rule: any, index: number) => {
        recommendations.push({
          id: `ai-xql-${index}`,
          type: 'xql-rule',
          title: rule.title || 'AI-Generated XQL Rule',
          description: rule.description || 'AI-generated correlation rule for threat detection',
          reason: `Generated by ${aiResults.providers.join(' + ')} based on threat patterns`,
          confidence: 85,
          priority: 'high' as const,
          estimatedEffort: 30,
          requiredDataSources: rule.dataSources || context.dataSources,
          tags: ['ai-generated', 'xql', 'correlation'],
          category: context.threatType,
          template: rule
        });
      });
    }

    // Convert playbooks  
    if (combined.playbooks) {
      combined.playbooks.forEach((playbook: any, index: number) => {
        recommendations.push({
          id: `ai-playbook-${index}`,
          type: 'playbook',
          title: playbook.title || 'AI-Generated Response Playbook',
          description: playbook.description || 'AI-generated automation workflow',
          reason: `Generated by ${aiResults.providers.join(' + ')} for automated response`,
          confidence: 80,
          priority: 'high' as const,
          estimatedEffort: 60,
          requiredDataSources: [],
          tags: ['ai-generated', 'automation', 'response'],
          category: context.threatType,
          template: playbook
        });
      });
    }

    // Convert alert layouts
    if (combined.alertLayouts) {
      combined.alertLayouts.forEach((layout: any, index: number) => {
        recommendations.push({
          id: `ai-layout-${index}`,
          type: 'layout',
          title: layout.title || 'AI-Generated Alert Layout',
          description: layout.description || 'AI-generated incident layout',
          reason: `Generated by ${aiResults.providers.join(' + ')} for enhanced analyst workflow`,
          confidence: 75,
          priority: 'medium' as const,
          estimatedEffort: 20,
          requiredDataSources: [],
          tags: ['ai-generated', 'layout', 'ui'],
          category: context.threatType,
          template: layout
        });
      });
    }

    return recommendations;
  }

  private inferDataSources(useCase: UseCase): string[] {
    const sources = [];
    const category = this.categorizeThreat(useCase);

    // Default data sources by category
    const categoryDefaults = {
      'endpoint': ['Windows Event Logs', 'Sysmon'],
      'network': ['NetFlow', 'Firewall Logs'],
      'cloud': ['AWS CloudTrail', 'Azure Activity Logs'],
      'identity': ['Active Directory Logs', 'Authentication Logs'],
      'general': ['Windows Event Logs', 'Sysmon', 'NetFlow']
    };

    return categoryDefaults[category as keyof typeof categoryDefaults] || categoryDefaults['general'];
  }

  private getProcessMonitoringTemplate(context: RecommendationContext): any {
    return {
      xql: `dataset = xdr_data
| filter agent_hostname != null and action_process_image_name != null
| filter action_process_command_line contains "powershell" or action_process_command_line contains "cmd"
| filter action_process_command_line contains "invoke" or action_process_command_line contains "download"
| fields _time, agent_hostname, action_process_image_name, action_process_command_line, actor_process_pid
| sort _time desc`,
      description: 'Monitors for suspicious process execution patterns',
      severity: 'High',
      category: 'Process Monitoring'
    };
  }

  private initializeKnowledgeBase(): void {
    // Initialize threat intelligence knowledge base
    this.knowledgeBase.set('mitre_attack', {
      'T1059': 'Command and Scripting Interpreter',
      'T1071': 'Application Layer Protocol',
      'T1105': 'Ingress Tool Transfer',
      'T1021': 'Remote Services'
    });

    this.knowledgeBase.set('data_source_mapping', {
      'endpoint': ['Windows Event Logs', 'Sysmon', 'EDR', 'File Integrity Monitoring'],
      'network': ['NetFlow', 'Firewall Logs', 'IDS/IPS', 'Proxy Logs'],
      'cloud': ['AWS CloudTrail', 'Azure Activity Logs', 'GCP Audit Logs', 'Container Logs'],
      'identity': ['Active Directory Logs', 'Authentication Logs', 'Privilege Monitoring']
    });
  }

  private buildPatternDatabase(): void {
    // Build pattern recognition database for content recommendations
    this.patternDatabase.set('rce_patterns', {
      indicators: ['remote code execution', 'command injection', 'code execution'],
      required_sources: ['Sysmon', 'Process Monitoring', 'Command Line Logging'],
      priority: 'high'
    });

    this.patternDatabase.set('lateral_movement_patterns', {
      indicators: ['lateral movement', 'privilege escalation', 'network traversal'],
      required_sources: ['Network Logs', 'Authentication Logs', 'Process Monitoring'],
      priority: 'high'
    });
  }
}

export const contentRecommendationEngine = new ContentRecommendationEngine();