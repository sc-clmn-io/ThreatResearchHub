import { z } from 'zod';

// Schema for threat report normalization
export const ThreatReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  source: z.string(),
  published_date: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  cves: z.array(z.string()),
  mitre_attack: z.object({
    tactics: z.array(z.string()),
    techniques: z.array(z.string()),
    sub_techniques: z.array(z.string())
  }),
  indicators: z.object({
    ips: z.array(z.string()),
    domains: z.array(z.string()),
    hashes: z.array(z.string()),
    file_paths: z.array(z.string())
  }),
  technologies: z.array(z.string()),
  threat_actors: z.array(z.string()),
  attack_vectors: z.array(z.string())
});

export type ThreatReport = z.infer<typeof ThreatReportSchema>;

// Detection rule generation engine
export class ContentGenerationEngine {
  private static instance: ContentGenerationEngine;

  static getInstance(): ContentGenerationEngine {
    if (!ContentGenerationEngine.instance) {
      ContentGenerationEngine.instance = new ContentGenerationEngine();
    }
    return ContentGenerationEngine.instance;
  }

  // Normalize threat report to standard format
  normalizeThreatReport(rawReport: any): ThreatReport {
    const normalized: ThreatReport = {
      id: rawReport.id || this.generateId(),
      title: rawReport.title || rawReport.name || 'Unknown Threat',
      description: rawReport.description || rawReport.summary || '',
      source: rawReport.source || 'Unknown',
      published_date: rawReport.published_date || new Date().toISOString(),
      severity: this.extractSeverity(rawReport),
      cves: this.extractCVEs(rawReport),
      mitre_attack: this.extractMitreAttack(rawReport),
      indicators: this.extractIndicators(rawReport),
      technologies: this.extractTechnologies(rawReport),
      threat_actors: this.extractThreatActors(rawReport),
      attack_vectors: this.extractAttackVectors(rawReport)
    };

    return normalized;
  }

  // Generate XQL correlation rule from threat report
  generateXQLCorrelationRule(threat: ThreatReport): any {
    const ruleName = this.sanitizeRuleName(threat.title);
    const dataSource = this.determineDataSource(threat);
    const xqlQuery = this.buildXQLQuery(threat, dataSource);

    return {
      rule_name: ruleName,
      description: threat.description,
      severity: threat.severity,
      category: this.categorizeContent(threat),
      xql_query: xqlQuery,
      data_sources: [dataSource, ...this.getSecondaryDataSources(threat)],
      required_fields: this.getRequiredFields(threat, dataSource),
      mitre_attack: threat.mitre_attack,
      indicators: threat.indicators,
      false_positive_notes: this.generateFalsePositiveNotes(threat),
      tuning_guidance: this.generateTuningGuidance(threat),
      created_date: new Date().toISOString(),
      version: "1.0"
    };
  }

  // Generate XSIAM automation playbook
  generateAutomationPlaybook(threat: ThreatReport): any {
    const playbookName = this.sanitizeRuleName(threat.title) + "_Response";
    const tasks = this.generatePlaybookTasks(threat);

    return {
      name: playbookName,
      description: `Automated response workflow for ${threat.title}`,
      version: "1.0",
      category: this.categorizeContent(threat),
      inputs: this.generatePlaybookInputs(threat),
      tasks: tasks,
      outputs: this.generatePlaybookOutputs(threat),
      mitre_attack: threat.mitre_attack,
      created_date: new Date().toISOString()
    };
  }

  // Generate alert layout for XSIAM
  generateAlertLayout(threat: ThreatReport): any {
    const layoutName = this.sanitizeRuleName(threat.title) + "_Alert_Layout";

    return {
      layout_name: layoutName,
      description: `Analyst decision support for ${threat.title} alerts`,
      category: this.categorizeContent(threat),
      sections: [
        this.generateAlertSummarySection(threat),
        this.generateAnalystActionsSection(threat),
        this.generateInvestigationContextSection(threat)
      ],
      decision_tree: this.generateDecisionTree(threat),
      enrichment_queries: this.generateEnrichmentQueries(threat),
      created_date: new Date().toISOString(),
      version: "1.0"
    };
  }

  // Generate operational dashboard
  generateOperationalDashboard(threat: ThreatReport): any {
    const dashboardName = this.sanitizeRuleName(threat.title) + "_Monitoring";

    return {
      dashboard_name: dashboardName,
      description: `Operational monitoring for ${threat.title} threats`,
      category: this.categorizeContent(threat),
      refresh_interval: "5m",
      widgets: this.generateDashboardWidgets(threat),
      filters: this.generateDashboardFilters(threat),
      alerts: this.generateDashboardAlerts(threat),
      created_date: new Date().toISOString(),
      version: "1.0"
    };
  }

  // Private helper methods
  private generateId(): string {
    return 'threat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private extractSeverity(rawReport: any): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const content = JSON.stringify(rawReport).toLowerCase();
    
    if (content.includes('critical') || content.includes('cvss:10') || content.includes('cvss:9')) return 'critical';
    if (content.includes('high') || content.includes('cvss:8') || content.includes('cvss:7')) return 'high';
    if (content.includes('medium') || content.includes('cvss:6') || content.includes('cvss:5') || content.includes('cvss:4')) return 'medium';
    if (content.includes('low') || content.includes('cvss:3') || content.includes('cvss:2') || content.includes('cvss:1')) return 'low';
    
    return 'medium'; // default
  }

  private extractCVEs(rawReport: any): string[] {
    const content = JSON.stringify(rawReport);
    const cvePattern = /CVE-\d{4}-\d{4,}/gi;
    const matches = content.match(cvePattern) || [];
    return Array.from(new Set(matches)); // Remove duplicates
  }

  private extractMitreAttack(rawReport: any): { tactics: string[], techniques: string[], sub_techniques: string[] } {
    const content = JSON.stringify(rawReport).toLowerCase();
    
    const tactics: string[] = [];
    const techniques: string[] = [];
    const sub_techniques: string[] = [];

    // Common MITRE ATT&CK patterns
    const tacticPatterns = {
      'initial access': 'Initial Access',
      'execution': 'Execution',
      'persistence': 'Persistence',
      'privilege escalation': 'Privilege Escalation',
      'defense evasion': 'Defense Evasion',
      'credential access': 'Credential Access',
      'discovery': 'Discovery',
      'lateral movement': 'Lateral Movement',
      'collection': 'Collection',
      'command and control': 'Command and Control',
      'exfiltration': 'Exfiltration',
      'impact': 'Impact'
    };

    for (const [pattern, tactic] of Object.entries(tacticPatterns)) {
      if (content.includes(pattern)) {
        tactics.push(tactic);
      }
    }

    // Extract T-codes
    const techniquePattern = /T\d{4}(\.\d{3})?/gi;
    const techniqueMatches = content.match(techniquePattern) || [];
    
    techniqueMatches.forEach(match => {
      if (match.includes('.')) {
        sub_techniques.push(match.toUpperCase());
      } else {
        techniques.push(match.toUpperCase());
      }
    });

    return { tactics, techniques, sub_techniques };
  }

  private extractIndicators(rawReport: any): { ips: string[], domains: string[], hashes: string[], file_paths: string[] } {
    const content = JSON.stringify(rawReport);
    
    // IP addresses
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = Array.from(new Set(content.match(ipPattern) || []));

    // Domains
    const domainPattern = /\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/g;
    const domains = Array.from(new Set(content.match(domainPattern) || []));

    // Hashes (MD5, SHA1, SHA256)
    const hashPattern = /\b[a-fA-F0-9]{32,64}\b/g;
    const hashes = Array.from(new Set(content.match(hashPattern) || []));

    // File paths
    const filePathPattern = /[A-Za-z]:\\[^<>:"|?*\n\r]*/g;
    const file_paths = Array.from(new Set(content.match(filePathPattern) || []));

    return { ips, domains, hashes, file_paths };
  }

  private extractTechnologies(rawReport: any): string[] {
    const content = JSON.stringify(rawReport).toLowerCase();
    const technologies: string[] = [];

    const techPatterns = [
      'windows', 'linux', 'macos', 'android', 'ios',
      'microsoft', 'office', 'outlook', 'exchange',
      'apache', 'nginx', 'iis', 'tomcat',
      'mysql', 'postgresql', 'oracle', 'mongodb',
      'aws', 'azure', 'gcp', 'kubernetes', 'docker',
      'vmware', 'citrix', 'vpn', 'rdp',
      'active directory', 'ldap', 'kerberos'
    ];

    techPatterns.forEach(tech => {
      if (content.includes(tech)) {
        technologies.push(tech.charAt(0).toUpperCase() + tech.slice(1));
      }
    });

    return Array.from(new Set(technologies));
  }

  private extractThreatActors(rawReport: any): string[] {
    const content = JSON.stringify(rawReport);
    const actors = [];

    // Common APT groups
    const aptPattern = /APT\d+/gi;
    const aptMatches = content.match(aptPattern) || [];
    actors.push(...aptMatches);

    // Common threat actor names
    const actorPatterns = [
      'Lazarus', 'Cozy Bear', 'Fancy Bear', 'Carbanak', 'FIN7', 'FIN8',
      'Equation Group', 'Shadow Brokers', 'Rocke', 'Machete', 'OceanLotus'
    ];

    actorPatterns.forEach(actor => {
      if (content.toLowerCase().includes(actor.toLowerCase())) {
        actors.push(actor);
      }
    });

    return Array.from(new Set(actors));
  }

  private extractAttackVectors(rawReport: any): string[] {
    const content = JSON.stringify(rawReport).toLowerCase();
    const vectors = [];

    const vectorPatterns = {
      'phishing': 'Phishing Email',
      'malware': 'Malware Delivery',
      'exploit': 'Vulnerability Exploitation',
      'brute force': 'Brute Force Attack',
      'sql injection': 'SQL Injection',
      'xss': 'Cross-Site Scripting',
      'remote code execution': 'Remote Code Execution',
      'privilege escalation': 'Privilege Escalation',
      'lateral movement': 'Lateral Movement',
      'data exfiltration': 'Data Exfiltration'
    };

    for (const [pattern, vector] of Object.entries(vectorPatterns)) {
      if (content.includes(pattern)) {
        vectors.push(vector);
      }
    }

    return Array.from(new Set(vectors));
  }

  private sanitizeRuleName(title: string): string {
    return title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  private determineDataSource(threat: ThreatReport): string {
    const category = this.categorizeContent(threat);
    
    switch (category) {
      case 'endpoint': return 'xdr_data';
      case 'network': return 'network_traffic';
      case 'cloud': return 'amazon_aws_raw';
      case 'identity': return 'msft_azure_ad_raw';
      case 'web': return 'proxy_logs';
      case 'email': return 'email_raw';
      default: return 'xdr_data';
    }
  }

  private buildXQLQuery(threat: ThreatReport, dataSource: string): string {
    const conditions = [];
    
    // Add indicator-based conditions
    if (threat.indicators.ips.length > 0) {
      conditions.push(`action_remote_ip in (${threat.indicators.ips.map(ip => `"${ip}"`).join(', ')})`);
    }
    
    if (threat.indicators.domains.length > 0) {
      conditions.push(`action_external_hostname in (${threat.indicators.domains.map(d => `"${d}"`).join(', ')})`);
    }

    if (threat.indicators.hashes.length > 0) {
      conditions.push(`action_file_sha256 in (${threat.indicators.hashes.map(h => `"${h}"`).join(', ')})`);
    }

    // Add technology-specific conditions
    if (threat.technologies.includes('Windows')) {
      conditions.push('agent_os_type = "AGENT_OS_WINDOWS"');
    }

    let query = `dataset = ${dataSource}\n`;
    
    if (conditions.length > 0) {
      query += `| filter ${conditions.join(' or ')}\n`;
    }

    // Add severity-based risk scoring
    query += `| alter risk_score = if(\n`;
    query += `    endpoint_name contains "EXEC" or endpoint_name contains "ADMIN", 5,\n`;
    query += `    endpoint_name contains "SERVER", 4,\n`;
    query += `    3)\n`;
    
    query += `| fields timestamp, endpoint_name, action_user, action_process_name, risk_score`;

    return query;
  }

  private categorizeContent(threat: ThreatReport): 'endpoint' | 'network' | 'cloud' | 'identity' | 'web' | 'email' {
    const content = JSON.stringify(threat).toLowerCase();
    
    if (content.includes('email') || content.includes('phishing') || content.includes('smtp')) return 'email';
    if (content.includes('aws') || content.includes('azure') || content.includes('cloud') || content.includes('kubernetes')) return 'cloud';
    if (content.includes('active directory') || content.includes('ldap') || content.includes('authentication')) return 'identity';
    if (content.includes('network') || content.includes('firewall') || content.includes('proxy')) return 'network';
    if (content.includes('web') || content.includes('http') || content.includes('browser')) return 'web';
    
    return 'endpoint'; // default
  }

  private getSecondaryDataSources(threat: ThreatReport): string[] {
    const sources = [];
    const category = this.categorizeContent(threat);
    
    if (category === 'endpoint') {
      sources.push('windows_event_logs', 'sysmon_logs');
    } else if (category === 'network') {
      sources.push('firewall_logs', 'proxy_logs');
    } else if (category === 'cloud') {
      sources.push('cloud_audit_logs', 'kubernetes_logs');
    }

    return sources;
  }

  private getRequiredFields(threat: ThreatReport, dataSource: string): string[] {
    const baseFields = ['timestamp', 'endpoint_name', 'action_user'];
    
    if (threat.indicators.ips.length > 0) baseFields.push('action_remote_ip');
    if (threat.indicators.domains.length > 0) baseFields.push('action_external_hostname');
    if (threat.indicators.hashes.length > 0) baseFields.push('action_file_sha256');
    
    return baseFields;
  }

  private generateFalsePositiveNotes(threat: ThreatReport): string {
    const category = this.categorizeContent(threat);
    
    switch (category) {
      case 'endpoint': return 'Legitimate system administration, software updates, authorized remote access';
      case 'network': return 'Legitimate business traffic, CDN requests, authorized external connections';
      case 'cloud': return 'Authorized cloud operations, legitimate API calls, scheduled maintenance';
      case 'identity': return 'Legitimate user authentication, password resets, authorized access';
      default: return 'Legitimate business operations, authorized activities';
    }
  }

  private generateTuningGuidance(threat: ThreatReport): string {
    return `Monitor for ${threat.attack_vectors.join(', ')}. Adjust risk scores based on user groups and asset criticality. Maintain indicator allowlists for legitimate activities.`;
  }

  private generatePlaybookTasks(threat: ThreatReport): any[] {
    const tasks = [
      {
        id: "1",
        name: "Extract Alert Context",
        type: "builtin",
        script: "GetAlertExtraData",
        arguments: { alert_id: "${inputs.alert_id}" },
        outputs: ["alert_details"]
      },
      {
        id: "2",
        name: "Enrich Indicators",
        type: "integration",
        script: "VirusTotalPrivateApi",
        arguments: { 
          indicator: "${alert_details.action_file_sha256}",
          indicator_type: "hash"
        },
        outputs: ["vt_results"]
      }
    ];

    // Add threat-specific tasks
    if (threat.indicators.ips.length > 0) {
      tasks.push({
        id: "3",
        name: "Check IP Reputation",
        type: "integration",
        script: "ip-reputation",
        arguments: { indicator: "${alert_details.action_remote_ip}", indicator_type: "ip" },
        outputs: ["ip_reputation"]
      });
    }

    // Add response tasks based on severity
    if (threat.severity === 'critical' || threat.severity === 'high') {
      tasks.push({
        id: "4",
        name: "Immediate Isolation",
        type: "integration",
        script: "cortex-xdr-isolate-endpoint",
        arguments: { alert_id: "${alert_details.alert_id}" },
        outputs: ["isolation_result"]
      });
    }

    return tasks;
  }

  private generatePlaybookInputs(threat: ThreatReport): any[] {
    return [
      { name: "alert_id", type: "string", required: true },
      { name: "analyst_name", type: "string", required: false },
      { name: "escalation_required", type: "boolean", required: false, default: false }
    ];
  }

  private generatePlaybookOutputs(threat: ThreatReport): any[] {
    return [
      { name: "playbook_status", type: "string" },
      { name: "threat_contained", type: "boolean" },
      { name: "analyst_notes", type: "string" }
    ];
  }

  private generateAlertSummarySection(threat: ThreatReport): any {
    return {
      name: "Alert Summary",
      type: "summary",
      fields: [
        { name: "Threat Name", field: "alert.rule_name", type: "text" },
        { name: "Severity", field: "alert.severity", type: "badge" },
        { name: "MITRE ATT&CK", field: "alert.mitre_techniques", type: "list" },
        { name: "Risk Score", field: "alert.risk_score", type: "numeric" }
      ]
    };
  }

  private generateAnalystActionsSection(threat: ThreatReport): any {
    const actions = [
      {
        name: "Isolate Endpoint",
        action: "cortex-xdr-isolate-endpoint",
        parameters: ["alert.endpoint_id"],
        icon: "shield-off",
        confirmation: true
      },
      {
        name: "Block Indicators",
        action: "block-indicators",
        parameters: ["alert.indicators"],
        icon: "ban",
        confirmation: true
      }
    ];

    // Add threat-specific actions
    if (threat.mitre_attack.techniques.includes('T1078')) {
      actions.push({
        name: "Reset User Credentials",
        action: "ad-reset-password",
        parameters: ["alert.action_user"],
        icon: "key",
        confirmation: true
      });
    }

    return {
      name: "Analyst Actions",
      type: "actions",
      buttons: actions
    };
  }

  private generateInvestigationContextSection(threat: ThreatReport): any {
    return {
      name: "Investigation Context",
      type: "enrichment",
      queries: [
        {
          name: "Related Events",
          xql: `dataset = xdr_data | filter endpoint_name = '\${alert.endpoint_name}' | filter _time > now() - 1h`,
          display: "table"
        },
        {
          name: "User Activity",
          xql: `dataset = xdr_data | filter action_user = '\${alert.action_user}' | filter _time > now() - 24h`,
          display: "timeline"
        }
      ]
    };
  }

  private generateDecisionTree(threat: ThreatReport): any {
    return {
      high_risk_user: {
        condition: "alert.action_user_groups contains 'Executives'",
        actions: ["immediate_escalation", "manager_notification"]
      },
      confirmed_malware: {
        condition: "vt_results.malicious_count > 3",
        actions: ["isolate_endpoint", "block_indicators"]
      },
      false_positive: {
        condition: "analyst_verification = 'benign'",
        actions: ["document_false_positive", "close_alert"]
      }
    };
  }

  private generateEnrichmentQueries(threat: ThreatReport): any[] {
    const queries = [];
    
    if (threat.indicators.hashes.length > 0) {
      queries.push({
        name: "File Analysis",
        query: `SELECT * FROM file_analysis WHERE sha256 IN ('${threat.indicators.hashes.join("','")}')`
      });
    }

    return queries;
  }

  private generateDashboardWidgets(threat: ThreatReport): any[] {
    const widgets = [
      {
        id: "threat_count",
        type: "metric",
        title: `${threat.title} Alerts (24h)`,
        xql_query: `dataset = xdr_data | filter rule_name = "${this.sanitizeRuleName(threat.title)}" | filter _time > now() - 24h | stats count()`,
        size: "small"
      },
      {
        id: "affected_endpoints",
        type: "table",
        title: "Affected Endpoints",
        xql_query: `dataset = xdr_data | filter rule_name = "${this.sanitizeRuleName(threat.title)}" | filter _time > now() - 7d | stats count() by endpoint_name | sort count desc`,
        size: "medium"
      }
    ];

    if (threat.indicators.ips.length > 0) {
      widgets.push({
        id: "ip_geolocation",
        type: "geo_map",
        title: "Threat IP Geolocation",
        xql_query: `dataset = network_traffic | filter dst_ip in (${threat.indicators.ips.map(ip => `"${ip}"`).join(',')}) | stats count() by dst_country`,
        size: "large"
      });
    }

    return widgets;
  }

  private generateDashboardFilters(threat: ThreatReport): any[] {
    return [
      { name: "Time Range", type: "time_picker", default: "24h" },
      { name: "Severity", type: "select", options: ["All", "Critical", "High", "Medium"] },
      { name: "Endpoint Groups", type: "multi_select", options: ["Servers", "Workstations", "Critical Assets"] }
    ];
  }

  private generateDashboardAlerts(threat: ThreatReport): any[] {
    return [
      {
        condition: `threat_count > ${threat.severity === 'critical' ? 5 : 10}`,
        action: "notify_soc_manager",
        message: `Spike in ${threat.title} alerts detected`
      }
    ];
  }
}