// Enhanced Automation Playbook Generator with GitHub Copilot patterns
// Generates comprehensive XSIAM/XSOAR playbooks for threat response

interface PlaybookContext {
  threatType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedAssets: string[];
  responseActions: string[];
  integrations: string[];
  slaMinutes: number;
}

export class CopilotEnhancedPlaybookGenerator {
  
  // Generate comprehensive threat response playbook
  static generateThreatResponsePlaybook(context: PlaybookContext): string {
    const { threatType, severity, affectedAssets, responseActions, integrations, slaMinutes } = context;
    
    const playbook = {
      version: -1,
      id: `threat_response_${threatType.toLowerCase().replace(/\s+/g, '_')}`,
      name: `${threatType} - Automated Response Playbook`,
      description: `Comprehensive automated response for ${threatType} incidents with ${severity} severity`,
      tags: ['ThreatResponse', severity, threatType],
      starttaskid: '0',
      tasks: this.generatePlaybookTasks(context),
      view: this.generatePlaybookView(context),
      inputs: this.generatePlaybookInputs(context),
      outputs: this.generatePlaybookOutputs(context),
      fromversion: '6.0.0'
    };

    return `# ${threatType} Response Playbook
# Auto-generated with GitHub Copilot enhancement
# SLA: ${slaMinutes} minutes | Severity: ${severity}

---
${JSON.stringify(playbook, null, 2)}`;
  }

  // Generate comprehensive task workflow
  private static generatePlaybookTasks(context: PlaybookContext): Record<string, any> {
    const { threatType, severity, affectedAssets, responseActions, slaMinutes } = context;
    
    const tasks = {
      // Initial triage and enrichment
      '0': {
        id: '0',
        taskid: '0',
        type: 'start',
        task: {
          id: '0',
          version: -1,
          name: '',
          iscommand: false,
          brand: '',
          description: `Start ${threatType} response workflow`
        },
        nexttasks: { '#none#': ['1'] }
      },
      
      '1': {
        id: '1',
        taskid: '1',
        type: 'regular',
        task: {
          id: '1',
          version: -1,
          name: 'Extract Alert Context',
          iscommand: true,
          brand: 'Builtin',
          description: 'Extract essential context from the security alert',
          script: 'Builtin|||set',
          arguments: [
            { name: 'key', value: 'ThreatType' },
            { name: 'value', value: '${alert.name}' },
            { name: 'key', value: 'Severity' },
            { name: 'value', value: '${alert.severity}' },
            { name: 'key', value: 'AffectedAssets' },
            { name: 'value', value: '${alert.devicename}' }
          ]
        },
        nexttasks: { '#none#': ['2'] }
      },

      '2': {
        id: '2',
        taskid: '2',
        type: 'condition',
        task: {
          id: '2',
          version: -1,
          name: 'Assess Threat Severity',
          iscommand: false,
          brand: '',
          description: `Route based on ${threatType} severity level`
        },
        conditions: [
          {
            label: 'Critical/High',
            condition: [['${alert.severity}', 'in', ['critical', 'high']]],
            nexttasks: { '#default#': ['3'] }
          },
          {
            label: 'Medium/Low', 
            condition: [['${alert.severity}', 'in', ['medium', 'low']]],
            nexttasks: { '#default#': ['8'] }
          }
        ]
      },

      // Critical/High severity path
      '3': {
        id: '3',
        taskid: '3',
        type: 'regular',
        task: {
          id: '3',
          version: -1,
          name: 'Immediate Containment Actions',
          iscommand: true,
          brand: 'CortexXDR',
          description: 'Execute immediate containment for critical threats',
          script: 'CortexXDR|||xdr-isolate-endpoint',
          arguments: [
            { name: 'endpoint_id', value: '${alert.endpoint_id}' },
            { name: 'isolation_type', value: 'full' }
          ]
        },
        nexttasks: { '#none#': ['4'] }
      },

      '4': {
        id: '4',
        taskid: '4',
        type: 'parallel',
        task: {
          id: '4',
          version: -1,
          name: 'Parallel Investigation Tasks',
          iscommand: false,
          brand: '',
          description: 'Execute multiple investigation tasks simultaneously'
        },
        nexttasks: {
          '#none#': ['5', '6', '7']
        }
      },

      '5': {
        id: '5',
        taskid: '5',
        type: 'regular',
        task: {
          id: '5',
          version: -1,
          name: 'Threat Intelligence Enrichment',
          iscommand: true,
          brand: 'ThreatConnect',
          description: 'Enrich with external threat intelligence',
          script: 'ThreatConnect|||tc-get-indicators',
          arguments: [
            { name: 'indicator', value: '${alert.src_ip}' },
            { name: 'indicator_type', value: 'Address' }
          ]
        },
        nexttasks: { '#none#': ['9'] }
      },

      '6': {
        id: '6',
        taskid: '6',
        type: 'regular',
        task: {
          id: '6',
          version: -1,
          name: 'User Context Analysis',
          iscommand: true,
          brand: 'ActiveDirectory',
          description: 'Analyze affected user context and privileges',
          script: 'ActiveDirectory|||ad-get-user',
          arguments: [
            { name: 'username', value: '${alert.username}' },
            { name: 'attributes', value: 'memberOf,lastLogon,badPwdCount' }
          ]
        },
        nexttasks: { '#none#': ['9'] }
      },

      '7': {
        id: '7',
        taskid: '7',
        type: 'regular',
        task: {
          id: '7',
          version: -1,
          name: 'Asset Risk Assessment',
          iscommand: true,
          brand: 'Qualys',
          description: 'Assess asset vulnerability and business criticality',
          script: 'Qualys|||qualys-host-list-detection',
          arguments: [
            { name: 'ips', value: '${alert.dest_ip}' },
            { name: 'severities', value: '4,5' }
          ]
        },
        nexttasks: { '#none#': ['9'] }
      },

      // Medium/Low severity path
      '8': {
        id: '8',
        taskid: '8',
        type: 'regular',
        task: {
          id: '8',
          version: -1,
          name: 'Standard Investigation',
          iscommand: true,
          brand: 'Builtin',
          description: 'Standard investigation for medium/low severity threats',
          script: 'Builtin|||Print',
          arguments: [
            { name: 'value', value: `Investigating ${threatType} - Standard Priority` }
          ]
        },
        nexttasks: { '#none#': ['9'] }
      },

      // Convergence point
      '9': {
        id: '9',
        taskid: '9',
        type: 'regular',
        task: {
          id: '9',
          version: -1,
          name: 'Generate Investigation Summary',
          iscommand: true,
          brand: 'Builtin',
          description: 'Compile comprehensive investigation findings',
          script: 'Builtin|||set',
          arguments: [
            { name: 'key', value: 'InvestigationSummary' },
            { name: 'value', value: this.generateSummaryTemplate(context) }
          ]
        },
        nexttasks: { '#none#': ['10'] }
      },

      '10': {
        id: '10',
        taskid: '10',
        type: 'regular',
        task: {
          id: '10',
          version: -1,
          name: 'Notify Security Team',
          iscommand: true,
          brand: 'Slack',
          description: 'Send comprehensive notification to security team',
          script: 'Slack|||send-notification',
          arguments: [
            { name: 'channel', value: '#security-alerts' },
            { name: 'message', value: `🚨 ${threatType} Response Complete\\n${this.getNotificationTemplate(context)}` }
          ]
        },
        nexttasks: { '#none#': ['11'] }
      },

      '11': {
        id: '11',
        taskid: '11',
        type: 'regular',
        task: {
          id: '11',
          version: -1,
          name: 'Close Investigation',
          iscommand: true,
          brand: 'Builtin',
          description: 'Formally close the security investigation',
          script: 'Builtin|||closeInvestigation',
          arguments: [
            { name: 'closeReason', value: `${threatType} response completed successfully` },
            { name: 'closeNotes', value: '${InvestigationSummary}' }
          ]
        }
      }
    };

    return tasks;
  }

  // Generate playbook visual layout
  private static generatePlaybookView(context: PlaybookContext): Record<string, any> {
    return {
      'linkLabelsPosition': {},
      'paper': {
        'dimensions': {
          'height': 1200,
          'width': 800,
          'x': 0,
          'y': 0
        }
      },
      'shapes': {}
    };
  }

  // Generate playbook inputs
  private static generatePlaybookInputs(context: PlaybookContext): any[] {
    return [
      {
        key: 'alert_id',
        value: '',
        required: true,
        description: 'XSIAM alert identifier',
        playbookInputQuery: {
          query: '${alert.id}',
          queryType: 'input',
          results: null
        }
      },
      {
        key: 'severity_threshold',
        value: context.severity,
        required: false,
        description: 'Minimum severity for automated response',
        playbookInputQuery: null
      }
    ];
  }

  // Generate playbook outputs
  private static generatePlaybookOutputs(context: PlaybookContext): any[] {
    return [
      {
        contextPath: 'ThreatResponse.Status',
        description: 'Overall response status',
        type: 'string'
      },
      {
        contextPath: 'ThreatResponse.ContainmentActions',
        description: 'List of containment actions taken',
        type: 'string'
      },
      {
        contextPath: 'ThreatResponse.InvestigationFindings',
        description: 'Key investigation findings',
        type: 'string'
      }
    ];
  }

  // Generate investigation summary template
  private static generateSummaryTemplate(context: PlaybookContext): string {
    return `# ${context.threatType} Investigation Summary

**Threat Classification:** ${context.threatType}
**Severity Level:** ${context.severity}
**Response SLA:** ${context.slaMinutes} minutes
**Affected Assets:** \${AffectedAssets}

## Containment Actions Taken:
${context.responseActions.map(action => `- ${action}`).join('\\n')}

## Investigation Findings:
- Threat Intelligence: \${ThreatConnect.Indicators}
- User Context: \${ActiveDirectory.UserDetails}
- Asset Vulnerabilities: \${Qualys.Vulnerabilities}

## Recommendations:
- Monitor affected systems for 48 hours
- Update detection rules based on findings
- Review and update incident response procedures`;
  }

  // Generate notification template
  private static getNotificationTemplate(context: PlaybookContext): string {
    return `**Incident:** ${context.threatType}\\n**Severity:** ${context.severity}\\n**Status:** Investigation Complete\\n**Response Time:** Within ${context.slaMinutes} minute SLA`;
  }

  // Generate threat-specific playbook variations
  static generateSpecializedPlaybook(threatType: string, context: PlaybookContext): string {
    switch (threatType.toLowerCase()) {
      case 'ransomware':
        return this.generateRansomwarePlaybook(context);
      case 'phishing':
        return this.generatePhishingPlaybook(context);
      case 'apt':
        return this.generateAPTPlaybook(context);
      case 'insider_threat':
        return this.generateInsiderThreatPlaybook(context);
      default:
        return this.generateThreatResponsePlaybook(context);
    }
  }

  // Specialized ransomware response playbook
  private static generateRansomwarePlaybook(context: PlaybookContext): string {
    const ransomwareContext = {
      ...context,
      responseActions: [
        'Immediate network isolation of affected systems',
        'Backup verification and offline storage protection',
        'Cryptocurrency wallet analysis and tracking',
        'File system forensic preservation',
        'Ransom note analysis and IOC extraction',
        'Network traffic analysis for C2 communications'
      ]
    };

    return this.generateThreatResponsePlaybook(ransomwareContext);
  }

  // Specialized phishing response playbook
  private static generatePhishingPlaybook(context: PlaybookContext): string {
    const phishingContext = {
      ...context,
      responseActions: [
        'Email header analysis and sender reputation check',
        'URL and attachment sandboxing analysis',
        'Recipient list identification and notification',
        'Email gateway rule deployment',
        'Domain reputation analysis and blocking',
        'User security awareness notification'
      ]
    };

    return this.generateThreatResponsePlaybook(phishingContext);
  }

  // Specialized APT response playbook
  private static generateAPTPlaybook(context: PlaybookContext): string {
    const aptContext = {
      ...context,
      responseActions: [
        'Long-term threat hunting campaign initiation',
        'Attribution analysis and threat actor profiling',
        'Lateral movement detection and containment',
        'Data exfiltration analysis and damage assessment',
        'Persistence mechanism identification and removal',
        'Strategic deception and counter-intelligence measures'
      ]
    };

    return this.generateThreatResponsePlaybook(aptContext);
  }

  // Specialized insider threat response playbook
  private static generateInsiderThreatPlaybook(context: PlaybookContext): string {
    const insiderContext = {
      ...context,
      responseActions: [
        'User behavior analytics and anomaly detection',
        'Data access audit and privilege review',
        'HR and legal team coordination',
        'Digital forensics and evidence preservation',
        'Access revocation and account suspension',
        'Exit interview coordination and asset recovery'
      ]
    };

    return this.generateThreatResponsePlaybook(insiderContext);
  }
}

// Export utility functions for Copilot integration
export const copilotPlaybookHelpers = {
  generatePlaybook: CopilotEnhancedPlaybookGenerator.generateThreatResponsePlaybook,
  generateSpecialized: CopilotEnhancedPlaybookGenerator.generateSpecializedPlaybook
};