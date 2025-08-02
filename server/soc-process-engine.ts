import { z } from 'zod';

// SOC Investigation Process Schema
export const SOCProcessSchema = z.object({
  process_id: z.string(),
  process_name: z.string(),
  description: z.string(),
  trigger_conditions: z.array(z.string()),
  phases: z.array(z.object({
    phase_id: z.string(),
    phase_name: z.string(),
    description: z.string(),
    duration_minutes: z.number(),
    required_roles: z.array(z.string()),
    tasks: z.array(z.object({
      task_id: z.string(),
      task_name: z.string(),
      description: z.string(),
      automated: z.boolean(),
      required_tools: z.array(z.string()),
      outputs: z.array(z.string())
    })),
    decision_points: z.array(z.object({
      decision_id: z.string(),
      question: z.string(),
      options: z.array(z.object({
        option: z.string(),
        next_phase: z.string().optional(),
        escalation_required: z.boolean()
      }))
    }))
  })),
  escalation_criteria: z.array(z.string()),
  success_criteria: z.array(z.string()),
  documentation_requirements: z.array(z.string())
});

export type SOCProcess = z.infer<typeof SOCProcessSchema>;

// SOC Process Engine for managing investigation workflows
export class SOCProcessEngine {
  private static instance: SOCProcessEngine;

  static getInstance(): SOCProcessEngine {
    if (!SOCProcessEngine.instance) {
      SOCProcessEngine.instance = new SOCProcessEngine();
    }
    return SOCProcessEngine.instance;
  }

  // Generate SOC investigation process for threat
  generateSOCProcess(threatType: string, severity: 'critical' | 'high' | 'medium' | 'low'): SOCProcess {
    const processId = `SOC_${threatType.toUpperCase()}_${severity.toUpperCase()}_${Date.now()}`;
    
    return {
      process_id: processId,
      process_name: `${threatType} Investigation - ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity`,
      description: `Structured SOC investigation process for ${threatType} threats with ${severity} severity`,
      trigger_conditions: this.generateTriggerConditions(threatType, severity),
      phases: this.generateProcessPhases(threatType, severity),
      escalation_criteria: this.generateEscalationCriteria(severity),
      success_criteria: this.generateSuccessCriteria(threatType),
      documentation_requirements: this.generateDocumentationRequirements()
    };
  }

  // Generate BPMN-style workflow diagram data
  generateWorkflowDiagram(process: SOCProcess): any {
    const nodes = [];
    const edges = [];
    let nodeId = 0;

    // Start node
    nodes.push({
      id: `node_${nodeId++}`,
      type: 'start',
      label: 'Alert Triggered',
      position: { x: 50, y: 100 }
    });

    let yPosition = 200;
    
    process.phases.forEach((phase, phaseIndex) => {
      // Phase node
      const phaseNodeId = `node_${nodeId++}`;
      nodes.push({
        id: phaseNodeId,
        type: 'process',
        label: phase.phase_name,
        description: phase.description,
        duration: phase.duration_minutes,
        position: { x: 50, y: yPosition }
      });

      // Task nodes
      let xPosition = 200;
      phase.tasks.forEach((task, taskIndex) => {
        const taskNodeId = `node_${nodeId++}`;
        nodes.push({
          id: taskNodeId,
          type: task.automated ? 'automated_task' : 'manual_task',
          label: task.task_name,
          description: task.description,
          tools: task.required_tools,
          position: { x: xPosition, y: yPosition }
        });

        // Edge from phase to task
        edges.push({
          id: `edge_${phaseNodeId}_${taskNodeId}`,
          source: phaseNodeId,
          target: taskNodeId,
          type: 'default'
        });

        xPosition += 200;
      });

      // Decision points
      phase.decision_points.forEach((decision, decisionIndex) => {
        const decisionNodeId = `node_${nodeId++}`;
        nodes.push({
          id: decisionNodeId,
          type: 'decision',
          label: decision.question,
          options: decision.options,
          position: { x: xPosition, y: yPosition }
        });

        // Edges for decision options
        decision.options.forEach((option, optionIndex) => {
          const optionEdgeId = `edge_${decisionNodeId}_${option.next_phase || 'end'}_${optionIndex}`;
          edges.push({
            id: optionEdgeId,
            source: decisionNodeId,
            target: option.next_phase || 'end_node',
            label: option.option,
            type: option.escalation_required ? 'escalation' : 'default'
          });
        });

        xPosition += 200;
      });

      yPosition += 150;
    });

    // End node
    nodes.push({
      id: 'end_node',
      type: 'end',
      label: 'Investigation Complete',
      position: { x: 50, y: yPosition }
    });

    return {
      nodes,
      edges,
      layout: 'hierarchical',
      direction: 'top-to-bottom'
    };
  }

  // Generate response playbook templates
  generateResponsePlaybook(threatType: string, severity: 'critical' | 'high' | 'medium' | 'low'): any {
    return {
      playbook_name: `${threatType}_Response_${severity}`,
      version: "1.0",
      description: `Response playbook for ${threatType} incidents with ${severity} severity`,
      phases: [
        this.generateContainmentPhase(threatType, severity),
        this.generateEradicationPhase(threatType, severity),
        this.generateRecoveryPhase(threatType, severity),
        this.generateLessonsLearnedPhase(threatType, severity)
      ],
      communication_plan: this.generateCommunicationPlan(severity),
      resource_requirements: this.generateResourceRequirements(severity),
      success_metrics: this.generateSuccessMetrics(threatType)
    };
  }

  private generateTriggerConditions(threatType: string, severity: string): string[] {
    const baseConditions = [
      `Alert severity = ${severity}`,
      `Alert category = ${threatType}`,
      'Alert confidence > 70%'
    ];

    if (severity === 'critical') {
      baseConditions.push('Immediate response required within 15 minutes');
    } else if (severity === 'high') {
      baseConditions.push('Response required within 1 hour');
    }

    return baseConditions;
  }

  private generateProcessPhases(threatType: string, severity: string): any[] {
    const phases = [
      {
        phase_id: 'triage',
        phase_name: 'Initial Triage',
        description: 'Rapid assessment and classification of the alert',
        duration_minutes: severity === 'critical' ? 15 : 30,
        required_roles: ['SOC Analyst L1'],
        tasks: [
          {
            task_id: 'validate_alert',
            task_name: 'Validate Alert',
            description: 'Verify alert legitimacy and gather initial context',
            automated: false,
            required_tools: ['SIEM', 'XSIAM Console'],
            outputs: ['Alert validation status', 'Initial severity assessment']
          },
          {
            task_id: 'enrich_indicators',
            task_name: 'Enrich Indicators',
            description: 'Gather threat intelligence on indicators',
            automated: true,
            required_tools: ['VirusTotal', 'ThreatConnect', 'MISP'],
            outputs: ['Indicator reputation scores', 'Related threat campaigns']
          }
        ],
        decision_points: [
          {
            decision_id: 'triage_decision',
            question: 'Is this a confirmed security incident?',
            options: [
              { option: 'Yes - Proceed to Investigation', next_phase: 'investigation', escalation_required: false },
              { option: 'No - False Positive', next_phase: 'closure', escalation_required: false },
              { option: 'Unclear - Escalate', next_phase: 'escalation', escalation_required: true }
            ]
          }
        ]
      },
      {
        phase_id: 'investigation',
        phase_name: 'Deep Investigation',
        description: 'Comprehensive analysis to understand scope and impact',
        duration_minutes: severity === 'critical' ? 60 : 120,
        required_roles: ['SOC Analyst L2', 'Threat Hunter'],
        tasks: [
          {
            task_id: 'scope_analysis',
            task_name: 'Scope Analysis',
            description: 'Determine the extent of compromise',
            automated: false,
            required_tools: ['EDR Console', 'Network Monitoring', 'Log Analysis'],
            outputs: ['Affected systems list', 'Timeline of events', 'Attack vector analysis']
          },
          {
            task_id: 'forensic_collection',
            task_name: 'Forensic Evidence Collection',
            description: 'Preserve and collect digital evidence',
            automated: false,
            required_tools: ['Forensic Tools', 'Memory Dump', 'Disk Imaging'],
            outputs: ['Forensic artifacts', 'Evidence chain of custody']
          }
        ],
        decision_points: [
          {
            decision_id: 'containment_decision',
            question: 'Is immediate containment required?',
            options: [
              { option: 'Yes - Critical Impact', next_phase: 'containment', escalation_required: true },
              { option: 'No - Continue Monitoring', next_phase: 'monitoring', escalation_required: false }
            ]
          }
        ]
      },
      {
        phase_id: 'containment',
        phase_name: 'Containment',
        description: 'Limit the spread and impact of the incident',
        duration_minutes: 30,
        required_roles: ['Incident Commander', 'SOC Analyst L2', 'System Administrator'],
        tasks: [
          {
            task_id: 'isolate_systems',
            task_name: 'Isolate Affected Systems',
            description: 'Network isolation of compromised endpoints',
            automated: true,
            required_tools: ['EDR', 'Network Switches', 'Firewall'],
            outputs: ['Isolation confirmation', 'Network segmentation status']
          },
          {
            task_id: 'block_indicators',
            task_name: 'Block Malicious Indicators',
            description: 'Update security controls to block known bad indicators',
            automated: true,
            required_tools: ['Firewall', 'Proxy', 'DNS Security'],
            outputs: ['Blocked indicators list', 'Security control updates']
          }
        ],
        decision_points: [
          {
            decision_id: 'eradication_readiness',
            question: 'Is the threat contained and ready for eradication?',
            options: [
              { option: 'Yes - Begin Eradication', next_phase: 'eradication', escalation_required: false },
              { option: 'No - Additional Containment Needed', next_phase: 'containment', escalation_required: false }
            ]
          }
        ]
      }
    ];

    return phases;
  }

  private generateEscalationCriteria(severity: string): string[] {
    const baseCriteria = [
      'Multiple critical systems affected',
      'Potential data breach identified',
      'Executive or VIP user involved',
      'Media attention or public exposure risk'
    ];

    if (severity === 'critical') {
      baseCriteria.unshift('Any critical severity alert requires immediate escalation');
    }

    return baseCriteria;
  }

  private generateSuccessCriteria(threatType: string): string[] {
    return [
      'Threat completely neutralized',
      'All affected systems restored to normal operation',
      'No evidence of persistent access',
      'Security controls updated to prevent recurrence',
      'Complete incident documentation prepared',
      'Lessons learned documented and shared'
    ];
  }

  private generateDocumentationRequirements(): string[] {
    return [
      'Incident timeline with all actions taken',
      'Evidence collection and chain of custody logs',
      'Impact assessment and business disruption analysis',
      'Root cause analysis',
      'Remediation actions and their effectiveness',
      'Recommendations for preventing similar incidents'
    ];
  }

  private generateContainmentPhase(threatType: string, severity: string): any {
    return {
      phase_name: 'Containment',
      duration_minutes: severity === 'critical' ? 30 : 60,
      objectives: [
        'Prevent further spread of the threat',
        'Preserve evidence for investigation',
        'Minimize business impact'
      ],
      actions: [
        {
          action: 'Network Isolation',
          description: 'Isolate affected systems from network',
          automated: true,
          tools: ['EDR', 'Network Switches'],
          success_criteria: 'Systems isolated within 5 minutes'
        },
        {
          action: 'Account Disabling',
          description: 'Disable compromised user accounts',
          automated: false,
          tools: ['Active Directory', 'IAM Console'],
          success_criteria: 'Accounts disabled within 10 minutes'
        }
      ]
    };
  }

  private generateEradicationPhase(threatType: string, severity: string): any {
    return {
      phase_name: 'Eradication',
      duration_minutes: 120,
      objectives: [
        'Remove malicious artifacts',
        'Close attack vectors',
        'Strengthen security posture'
      ],
      actions: [
        {
          action: 'Malware Removal',
          description: 'Remove all traces of malicious software',
          automated: false,
          tools: ['Antivirus', 'EDR', 'Manual Analysis'],
          success_criteria: 'No malware detected on affected systems'
        },
        {
          action: 'Vulnerability Patching',
          description: 'Apply security patches for exploited vulnerabilities',
          automated: false,
          tools: ['Patch Management', 'Vulnerability Scanner'],
          success_criteria: 'All identified vulnerabilities patched'
        }
      ]
    };
  }

  private generateRecoveryPhase(threatType: string, severity: string): any {
    return {
      phase_name: 'Recovery',
      duration_minutes: 240,
      objectives: [
        'Restore normal business operations',
        'Implement additional monitoring',
        'Validate system integrity'
      ],
      actions: [
        {
          action: 'System Restoration',
          description: 'Restore systems to normal operation',
          automated: false,
          tools: ['Backup Systems', 'Configuration Management'],
          success_criteria: 'All systems operational with normal performance'
        },
        {
          action: 'Enhanced Monitoring',
          description: 'Implement additional monitoring for affected systems',
          automated: true,
          tools: ['SIEM', 'Log Monitoring', 'Behavioral Analytics'],
          success_criteria: 'Enhanced monitoring active for 30 days'
        }
      ]
    };
  }

  private generateLessonsLearnedPhase(threatType: string, severity: string): any {
    return {
      phase_name: 'Lessons Learned',
      duration_minutes: 60,
      objectives: [
        'Document lessons learned',
        'Improve security processes',
        'Share knowledge with team'
      ],
      actions: [
        {
          action: 'Post-Incident Review',
          description: 'Conduct comprehensive review of incident response',
          automated: false,
          tools: ['Meeting Software', 'Documentation Tools'],
          success_criteria: 'Review completed within 7 days of incident closure'
        },
        {
          action: 'Process Improvement',
          description: 'Update procedures based on lessons learned',
          automated: false,
          tools: ['Process Documentation', 'Training Materials'],
          success_criteria: 'Updated procedures implemented within 30 days'
        }
      ]
    };
  }

  private generateCommunicationPlan(severity: string): any {
    const plan = {
      internal_notifications: [
        { role: 'SOC Manager', timing: 'Immediate', method: 'Phone/SMS' },
        { role: 'IT Director', timing: 'Within 30 minutes', method: 'Email/Phone' },
        { role: 'CISO', timing: severity === 'critical' ? 'Within 15 minutes' : 'Within 1 hour', method: 'Phone' }
      ],
      external_notifications: [],
      status_updates: {
        frequency: severity === 'critical' ? 'Every 30 minutes' : 'Every 2 hours',
        stakeholders: ['Incident Commander', 'Business Leadership', 'Affected Department Heads']
      }
    };

    if (severity === 'critical') {
      plan.external_notifications.push(
        { entity: 'Legal Counsel', timing: 'Within 1 hour', condition: 'If data breach suspected' },
        { entity: 'Regulatory Bodies', timing: 'Within 24 hours', condition: 'If required by compliance' }
      );
    }

    return plan;
  }

  private generateResourceRequirements(severity: string): any {
    const resources = {
      personnel: [
        { role: 'Incident Commander', count: 1, required: true },
        { role: 'SOC Analyst L2', count: 2, required: true },
        { role: 'System Administrator', count: 1, required: false }
      ],
      tools: [
        'SIEM/XSIAM Console',
        'EDR Platform',
        'Forensic Tools',
        'Communication Platform'
      ],
      external_support: []
    };

    if (severity === 'critical') {
      resources.personnel.push({ role: 'External IR Consultant', count: 1, required: false });
      resources.external_support.push('Third-party forensics team', 'Legal counsel');
    }

    return resources;
  }

  private generateSuccessMetrics(threatType: string): any {
    return {
      operational_metrics: [
        { metric: 'Mean Time to Detection (MTTD)', target: '< 15 minutes' },
        { metric: 'Mean Time to Response (MTTR)', target: '< 1 hour' },
        { metric: 'Mean Time to Recovery (MTTR)', target: '< 4 hours' }
      ],
      business_metrics: [
        { metric: 'Business Disruption Time', target: '< 2 hours' },
        { metric: 'Data Loss', target: '0 records' },
        { metric: 'Customer Impact', target: 'Minimal/None' }
      ],
      security_metrics: [
        { metric: 'False Positive Rate', target: '< 5%' },
        { metric: 'Containment Success Rate', target: '100%' },
        { metric: 'Recurrence Prevention', target: '0 similar incidents in 90 days' }
      ]
    };
  }
}