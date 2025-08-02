import { ContentPackage } from './content-storage';

// NVISO Detection Development Life Cycle (DDLC) Workflow Engine
export class DDLCWorkflowEngine {
  private static instance: DDLCWorkflowEngine;

  static getInstance(): DDLCWorkflowEngine {
    if (!DDLCWorkflowEngine.instance) {
      DDLCWorkflowEngine.instance = new DDLCWorkflowEngine();
    }
    return DDLCWorkflowEngine.instance;
  }

  // Define DDLC phases with detailed criteria
  private phases = {
    requirement: {
      name: 'Requirement Gathering',
      description: 'Define detection requirements based on threat intelligence',
      entry_criteria: ['Threat intelligence analyzed', 'Use case defined'],
      activities: [
        'Analyze threat report for technical indicators',
        'Map to MITRE ATT&CK framework',
        'Define detection objectives',
        'Identify required data sources',
        'Document scope and limitations'
      ],
      exit_criteria: ['Requirements documented', 'Data sources identified', 'Success criteria defined'],
      deliverables: ['Requirements document', 'Data source mapping', 'Detection scope'],
      estimated_duration: '2-4 hours'
    },
    design: {
      name: 'Detection Design',
      description: 'Design detection logic and response workflows',
      entry_criteria: ['Requirements approved', 'Data sources available'],
      activities: [
        'Design XQL correlation logic',
        'Plan alert enrichment strategy',
        'Design response workflow',
        'Create alert layout mockup',
        'Plan dashboard visualizations'
      ],
      exit_criteria: ['Detection logic designed', 'Response workflow planned', 'UI/UX mockups ready'],
      deliverables: ['Detection design document', 'Workflow diagrams', 'UI mockups'],
      estimated_duration: '4-6 hours'
    },
    development: {
      name: 'Development',
      description: 'Implement detection rules, playbooks, and interfaces',
      entry_criteria: ['Design approved', 'Development environment ready'],
      activities: [
        'Implement XQL correlation rule',
        'Develop automation playbook',
        'Create alert layout',
        'Build operational dashboard',
        'Configure data field mappings'
      ],
      exit_criteria: ['All components implemented', 'Code review completed', 'Unit tests passed'],
      deliverables: ['XQL rules', 'XSOAR playbooks', 'Alert layouts', 'Dashboards'],
      estimated_duration: '6-8 hours'
    },
    testing: {
      name: 'Testing & Validation',
      description: 'Validate detection accuracy and performance',
      entry_criteria: ['Implementation complete', 'Test environment available'],
      activities: [
        'Execute XQL syntax validation',
        'Test field mapping accuracy',
        'Validate playbook automation',
        'Perform false positive analysis',
        'Conduct performance testing'
      ],
      exit_criteria: ['All tests passed', 'Performance acceptable', 'False positive rate < 5%'],
      deliverables: ['Test results', 'Performance metrics', 'Tuning recommendations'],
      estimated_duration: '4-8 hours'
    },
    deployed: {
      name: 'Production Deployment',
      description: 'Deploy to production XSIAM environment',
      entry_criteria: ['Testing completed', 'Deployment approval received'],
      activities: [
        'Deploy to production XSIAM',
        'Configure monitoring alerts',
        'Enable automated responses',
        'Train SOC analysts',
        'Document operational procedures'
      ],
      exit_criteria: ['Successfully deployed', 'Monitoring active', 'Team trained'],
      deliverables: ['Production deployment', 'Monitoring configuration', 'Training materials'],
      estimated_duration: '2-4 hours'
    },
    monitoring: {
      name: 'Monitoring & Tuning',
      description: 'Monitor performance and optimize detection',
      entry_criteria: ['Production deployment successful', 'Monitoring data available'],
      activities: [
        'Monitor detection performance',
        'Analyze false positive patterns',
        'Tune correlation parameters',
        'Update threat intelligence',
        'Optimize response workflows'
      ],
      exit_criteria: ['Performance optimized', 'False positives minimized', 'Documentation updated'],
      deliverables: ['Performance reports', 'Tuning updates', 'Lessons learned'],
      estimated_duration: 'Ongoing'
    }
  };

  // Get phase information
  getPhaseInfo(phase: string) {
    return this.phases[phase as keyof typeof this.phases] || null;
  }

  // Get all phases
  getAllPhases() {
    return Object.keys(this.phases).map(key => ({
      id: key,
      ...this.phases[key as keyof typeof this.phases]
    }));
  }

  // Validate phase transition
  canTransitionToPhase(currentPhase: string, targetPhase: string, pkg: ContentPackage): {
    allowed: boolean;
    reason?: string;
    missing_criteria?: string[];
  } {
    const phaseOrder = ['requirement', 'design', 'development', 'testing', 'deployed', 'monitoring'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const targetIndex = phaseOrder.indexOf(targetPhase);

    // Allow backward transitions (for rework)
    if (targetIndex <= currentIndex) {
      return { allowed: true };
    }

    // Only allow advancing to next phase
    if (targetIndex > currentIndex + 1) {
      return {
        allowed: false,
        reason: `Cannot skip phases. Must progress through: ${phaseOrder.slice(currentIndex + 1, targetIndex + 1).join(' → ')}`
      };
    }

    // Check exit criteria for current phase
    const currentPhaseInfo = this.getPhaseInfo(currentPhase);
    if (!currentPhaseInfo) {
      return { allowed: false, reason: 'Invalid current phase' };
    }

    // Validate specific phase requirements
    const missingCriteria = this.validatePhaseRequirements(currentPhase, pkg);
    if (missingCriteria.length > 0) {
      return {
        allowed: false,
        reason: 'Exit criteria not met for current phase',
        missing_criteria: missingCriteria
      };
    }

    return { allowed: true };
  }

  // Validate phase-specific requirements
  private validatePhaseRequirements(phase: string, pkg: ContentPackage): string[] {
    const missing: string[] = [];

    switch (phase) {
      case 'requirement':
        if (!pkg.threat_report.cves.length && !pkg.threat_report.mitre_attack.techniques.length) {
          missing.push('Threat indicators not sufficiently analyzed');
        }
        if (!pkg.threat_report.technologies.length) {
          missing.push('Target technologies not identified');
        }
        break;

      case 'design':
        if (!pkg.xql_rule || !pkg.xql_rule.xql_query) {
          missing.push('XQL correlation logic not designed');
        }
        if (!pkg.automation_playbook || !pkg.automation_playbook.tasks) {
          missing.push('Response workflow not planned');
        }
        break;

      case 'development':
        if (!pkg.xql_rule?.data_sources?.length) {
          missing.push('Data source mappings incomplete');
        }
        if (!pkg.alert_layout?.sections?.length) {
          missing.push('Alert layout not implemented');
        }
        if (!pkg.operational_dashboard?.widgets?.length) {
          missing.push('Dashboard widgets not created');
        }
        break;

      case 'testing':
        const testResults = pkg.ddlc_metadata.test_results || [];
        const passedTests = testResults.filter(t => t.status === 'passed');
        if (passedTests.length < 2) {
          missing.push('Insufficient test coverage - need XQL syntax and field validation');
        }
        break;

      case 'deployed':
        if (pkg.version === '1.0' && !pkg.ddlc_metadata.validation_notes) {
          missing.push('Deployment validation notes required');
        }
        break;
    }

    return missing;
  }

  // Generate phase transition plan
  generateTransitionPlan(fromPhase: string, toPhase: string): {
    phases: string[];
    estimated_duration: string;
    key_activities: string[];
    required_resources: string[];
  } {
    const phaseOrder = ['requirement', 'design', 'development', 'testing', 'deployed', 'monitoring'];
    const fromIndex = phaseOrder.indexOf(fromPhase);
    const toIndex = phaseOrder.indexOf(toPhase);
    
    const phasesToComplete = phaseOrder.slice(Math.min(fromIndex + 1, toIndex), toIndex + 1);
    
    const activities: string[] = [];
    const resources: string[] = [];
    let totalHours = 0;

    phasesToComplete.forEach(phase => {
      const phaseInfo = this.getPhaseInfo(phase);
      if (phaseInfo) {
        activities.push(...phaseInfo.activities);
        
        // Extract estimated hours
        const hourMatch = phaseInfo.estimated_duration.match(/(\d+)-?(\d+)?/);
        if (hourMatch) {
          const minHours = parseInt(hourMatch[1]);
          const maxHours = hourMatch[2] ? parseInt(hourMatch[2]) : minHours;
          totalHours += (minHours + maxHours) / 2;
        }
        
        // Add phase-specific resources
        switch (phase) {
          case 'requirement':
            resources.push('Threat Intelligence Analyst', 'MITRE ATT&CK Navigator');
            break;
          case 'design':
            resources.push('Detection Engineer', 'XSIAM Documentation');
            break;
          case 'development':
            resources.push('XSIAM Developer', 'Test Environment');
            break;
          case 'testing':
            resources.push('QA Engineer', 'Staging Environment');
            break;
          case 'deployed':
            resources.push('DevOps Engineer', 'Production XSIAM');
            break;
          case 'monitoring':
            resources.push('SOC Analyst', 'Monitoring Dashboard');
            break;
        }
      }
    });

    return {
      phases: phasesToComplete,
      estimated_duration: `${Math.ceil(totalHours)} hours`,
      key_activities: [...new Set(activities)],
      required_resources: [...new Set(resources)]
    };
  }

  // Generate phase-specific checklist
  generatePhaseChecklist(phase: string): {
    phase_name: string;
    checklist_items: Array<{
      category: string;
      items: Array<{
        task: string;
        required: boolean;
        validation_method: string;
      }>;
    }>;
  } {
    const phaseInfo = this.getPhaseInfo(phase);
    if (!phaseInfo) {
      throw new Error(`Invalid phase: ${phase}`);
    }

    const checklists: { [key: string]: any } = {
      requirement: {
        phase_name: 'Requirement Gathering',
        checklist_items: [
          {
            category: 'Threat Analysis',
            items: [
              { task: 'Extract CVEs from threat report', required: true, validation_method: 'CVE list populated' },
              { task: 'Map MITRE ATT&CK techniques', required: true, validation_method: 'Techniques documented' },
              { task: 'Identify threat actors', required: false, validation_method: 'Actor attribution completed' }
            ]
          },
          {
            category: 'Technical Requirements',
            items: [
              { task: 'Identify target technologies', required: true, validation_method: 'Technology stack documented' },
              { task: 'Define data source requirements', required: true, validation_method: 'Data sources listed' },
              { task: 'Specify detection scope', required: true, validation_method: 'Scope boundaries defined' }
            ]
          }
        ]
      },
      development: {
        phase_name: 'Development',
        checklist_items: [
          {
            category: 'XQL Rule Development',
            items: [
              { task: 'Implement correlation logic', required: true, validation_method: 'XQL query syntax valid' },
              { task: 'Configure field mappings', required: true, validation_method: 'All fields mapped correctly' },
              { task: 'Add false positive filters', required: true, validation_method: 'Filters implemented and tested' }
            ]
          },
          {
            category: 'Playbook Development',
            items: [
              { task: 'Define automated response tasks', required: true, validation_method: 'Tasks configured in XSOAR' },
              { task: 'Implement decision logic', required: true, validation_method: 'Conditional flows working' },
              { task: 'Configure escalation procedures', required: false, validation_method: 'Escalation paths defined' }
            ]
          }
        ]
      },
      testing: {
        phase_name: 'Testing & Validation',
        checklist_items: [
          {
            category: 'Technical Validation',
            items: [
              { task: 'XQL syntax validation', required: true, validation_method: 'Query executes without errors' },
              { task: 'Field availability check', required: true, validation_method: 'All fields exist in target datasets' },
              { task: 'Performance testing', required: true, validation_method: 'Query execution time < 30 seconds' }
            ]
          },
          {
            category: 'Accuracy Testing',
            items: [
              { task: 'True positive validation', required: true, validation_method: 'Known threats detected correctly' },
              { task: 'False positive analysis', required: true, validation_method: 'FP rate documented and acceptable' },
              { task: 'Edge case testing', required: false, validation_method: 'Edge cases handled appropriately' }
            ]
          }
        ]
      }
    };

    return checklists[phase] || {
      phase_name: phaseInfo.name,
      checklist_items: [
        {
          category: 'General',
          items: phaseInfo.activities.map(activity => ({
            task: activity,
            required: true,
            validation_method: 'Manual verification required'
          }))
        }
      ]
    };
  }

  // Calculate phase completion percentage
  calculatePhaseCompletion(phase: string, pkg: ContentPackage): {
    completion_percentage: number;
    completed_items: string[];
    pending_items: string[];
    blocking_issues: string[];
  } {
    const checklist = this.generatePhaseChecklist(phase);
    const completedItems: string[] = [];
    const pendingItems: string[] = [];
    const blockingIssues: string[] = [];

    let totalRequiredItems = 0;
    let completedRequiredItems = 0;

    checklist.checklist_items.forEach(category => {
      category.items.forEach(item => {
        if (item.required) {
          totalRequiredItems++;
        }

        // Check completion based on package content
        const isCompleted = this.isTaskCompleted(item.task, pkg);
        
        if (isCompleted) {
          completedItems.push(item.task);
          if (item.required) {
            completedRequiredItems++;
          }
        } else {
          pendingItems.push(item.task);
          if (item.required) {
            blockingIssues.push(`Required: ${item.task}`);
          }
        }
      });
    });

    const completionPercentage = totalRequiredItems > 0 
      ? Math.round((completedRequiredItems / totalRequiredItems) * 100)
      : 0;

    return {
      completion_percentage: completionPercentage,
      completed_items: completedItems,
      pending_items: pendingItems,
      blocking_issues: blockingIssues
    };
  }

  // Check if specific task is completed
  private isTaskCompleted(task: string, pkg: ContentPackage): boolean {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('cve') && taskLower.includes('extract')) {
      return pkg.threat_report.cves.length > 0;
    }
    
    if (taskLower.includes('mitre') && taskLower.includes('map')) {
      return pkg.threat_report.mitre_attack.techniques.length > 0;
    }
    
    if (taskLower.includes('xql') && taskLower.includes('implement')) {
      return !!pkg.xql_rule?.xql_query;
    }
    
    if (taskLower.includes('field') && taskLower.includes('mapping')) {
      return !!pkg.xql_rule?.data_sources?.length;
    }
    
    if (taskLower.includes('playbook') && taskLower.includes('task')) {
      return !!pkg.automation_playbook?.tasks?.length;
    }
    
    if (taskLower.includes('syntax validation')) {
      const testResults = pkg.ddlc_metadata.test_results || [];
      return testResults.some(t => t.test_type.includes('Syntax') && t.status === 'passed');
    }
    
    // Default to checking if basic content exists for the task type
    if (taskLower.includes('technology')) {
      return pkg.threat_report.technologies.length > 0;
    }
    
    if (taskLower.includes('data source')) {
      return !!pkg.xql_rule?.data_sources?.length;
    }
    
    return false; // Conservative approach - require explicit validation
  }

  // Generate DDLC progress report
  generateProgressReport(pkg: ContentPackage): {
    current_phase: string;
    overall_progress: number;
    phase_completions: Array<{
      phase: string;
      status: 'completed' | 'in_progress' | 'pending';
      completion_percentage: number;
    }>;
    next_recommended_action: string;
    estimated_completion: string;
  } {
    const phaseOrder = ['requirement', 'design', 'development', 'testing', 'deployed', 'monitoring'];
    const currentPhaseIndex = phaseOrder.indexOf(pkg.ddlc_phase);
    
    const phaseCompletions = phaseOrder.map((phase, index) => {
      const completion = this.calculatePhaseCompletion(phase, pkg);
      let status: 'completed' | 'in_progress' | 'pending';
      
      if (index < currentPhaseIndex) {
        status = 'completed';
      } else if (index === currentPhaseIndex) {
        status = 'in_progress';
      } else {
        status = 'pending';
      }
      
      return {
        phase,
        status,
        completion_percentage: status === 'completed' ? 100 : completion.completion_percentage
      };
    });
    
    const overallProgress = Math.round(
      phaseCompletions.reduce((sum, p) => sum + p.completion_percentage, 0) / phaseOrder.length
    );
    
    const currentCompletion = this.calculatePhaseCompletion(pkg.ddlc_phase, pkg);
    const nextAction = currentCompletion.blocking_issues.length > 0 
      ? `Complete: ${currentCompletion.blocking_issues[0]}`
      : `Ready to advance to ${phaseOrder[currentPhaseIndex + 1] || 'monitoring'}`;
    
    const remainingPhases = phaseOrder.length - currentPhaseIndex - 1;
    const estimatedHours = remainingPhases * 4; // Average 4 hours per phase
    
    return {
      current_phase: pkg.ddlc_phase,
      overall_progress: overallProgress,
      phase_completions: phaseCompletions,
      next_recommended_action: nextAction,
      estimated_completion: `${estimatedHours} hours remaining`
    };
  }
}