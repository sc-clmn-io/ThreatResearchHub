import { z } from 'zod';

// Schema for storing generated content packages
export const ContentPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['endpoint', 'network', 'cloud', 'identity', 'web', 'email']),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  
  // Original threat intelligence
  threat_report: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    source: z.string(),
    published_date: z.string(),
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
  }),
  
  // Generated XSIAM content
  xql_rule: z.any(),
  automation_playbook: z.any(),
  alert_layout: z.any(),
  operational_dashboard: z.any(),
  
  // DDLC workflow status
  ddlc_phase: z.enum(['requirement', 'design', 'development', 'testing', 'deployed', 'monitoring']),
  ddlc_metadata: z.object({
    phase_history: z.array(z.object({
      phase: z.string(),
      timestamp: z.string(),
      notes: z.string().optional()
    })),
    test_results: z.array(z.object({
      test_type: z.string(),
      status: z.enum(['passed', 'failed', 'pending']),
      details: z.string().optional()
    })).optional(),
    validation_notes: z.string().optional()
  }),
  
  // Version control
  version: z.string(),
  created_date: z.string(),
  modified_date: z.string(),
  created_by: z.string().optional()
});

export type ContentPackage = z.infer<typeof ContentPackageSchema>;

// In-memory storage for content packages (for demo purposes)
export class ContentStorage {
  private static instance: ContentStorage;
  private packages: Map<string, ContentPackage> = new Map();

  static getInstance(): ContentStorage {
    if (!ContentStorage.instance) {
      ContentStorage.instance = new ContentStorage();
    }
    return ContentStorage.instance;
  }

  // Store a content package
  async storePackage(pkg: ContentPackage): Promise<ContentPackage> {
    this.packages.set(pkg.id, pkg);
    return pkg;
  }

  // Retrieve a content package by ID
  async getPackage(id: string): Promise<ContentPackage | null> {
    return this.packages.get(id) || null;
  }

  // List all content packages
  async listPackages(filters?: {
    category?: string;
    severity?: string;
    ddlc_phase?: string;
  }): Promise<ContentPackage[]> {
    let packages = Array.from(this.packages.values());
    
    if (filters) {
      if (filters.category) {
        packages = packages.filter(pkg => pkg.category === filters.category);
      }
      if (filters.severity) {
        packages = packages.filter(pkg => pkg.severity === filters.severity);
      }
      if (filters.ddlc_phase) {
        packages = packages.filter(pkg => pkg.ddlc_phase === filters.ddlc_phase);
      }
    }
    
    return packages.sort((a, b) => 
      new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
    );
  }

  // Update DDLC phase
  async updateDDLCPhase(id: string, newPhase: string, notes?: string): Promise<ContentPackage | null> {
    const pkg = this.packages.get(id);
    if (!pkg) return null;

    pkg.ddlc_phase = newPhase as any;
    pkg.ddlc_metadata.phase_history.push({
      phase: newPhase,
      timestamp: new Date().toISOString(),
      notes
    });
    pkg.modified_date = new Date().toISOString();

    this.packages.set(id, pkg);
    return pkg;
  }

  // Add test results
  async addTestResults(id: string, testResults: any[]): Promise<ContentPackage | null> {
    const pkg = this.packages.get(id);
    if (!pkg) return null;

    pkg.ddlc_metadata.test_results = testResults;
    pkg.modified_date = new Date().toISOString();

    this.packages.set(id, pkg);
    return pkg;
  }

  // Delete a content package
  async deletePackage(id: string): Promise<boolean> {
    return this.packages.delete(id);
  }

  // Search packages by content
  async searchPackages(query: string): Promise<ContentPackage[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.packages.values()).filter(pkg => 
      pkg.name.toLowerCase().includes(lowerQuery) ||
      pkg.description.toLowerCase().includes(lowerQuery) ||
      pkg.threat_report.title.toLowerCase().includes(lowerQuery) ||
      pkg.threat_report.cves.some(cve => cve.toLowerCase().includes(lowerQuery)) ||
      pkg.threat_report.threat_actors.some(actor => actor.toLowerCase().includes(lowerQuery))
    );
  }

  // Get packages by MITRE ATT&CK technique
  async getPackagesByMitreTechnique(technique: string): Promise<ContentPackage[]> {
    return Array.from(this.packages.values()).filter(pkg =>
      pkg.threat_report.mitre_attack.techniques.includes(technique) ||
      pkg.threat_report.mitre_attack.sub_techniques.includes(technique)
    );
  }

  // Get content statistics
  async getContentStatistics(): Promise<{
    total_packages: number;
    by_category: Record<string, number>;
    by_severity: Record<string, number>;
    by_ddlc_phase: Record<string, number>;
    recent_activity: { date: string; count: number }[];
  }> {
    const packages = Array.from(this.packages.values());
    
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byDdlcPhase: Record<string, number> = {};
    
    packages.forEach(pkg => {
      byCategory[pkg.category] = (byCategory[pkg.category] || 0) + 1;
      bySeverity[pkg.severity] = (bySeverity[pkg.severity] || 0) + 1;
      byDdlcPhase[pkg.ddlc_phase] = (byDdlcPhase[pkg.ddlc_phase] || 0) + 1;
    });

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPackages = packages.filter(pkg => 
      new Date(pkg.created_date) >= thirtyDaysAgo
    );
    
    const activityByDate: Record<string, number> = {};
    recentPackages.forEach(pkg => {
      const date = pkg.created_date.split('T')[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    const recentActivity = Object.entries(activityByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_packages: packages.length,
      by_category: byCategory,
      by_severity: bySeverity,
      by_ddlc_phase: byDdlcPhase,
      recent_activity: recentActivity
    };
  }

  // Initialize with sample data for demonstration
  async initializeSampleData(): Promise<void> {
    const samplePackages: ContentPackage[] = [
      {
        id: "pkg_001",
        name: "APT29 Cozy Bear Campaign Detection",
        description: "Detection package for APT29 sophisticated phishing and lateral movement campaign targeting government agencies",
        category: "endpoint",
        severity: "critical",
        threat_report: {
          id: "threat_001",
          title: "APT29 Targets Government Agencies with New Phishing Campaign",
          description: "Advanced persistent threat group APT29 (Cozy Bear) has launched a sophisticated phishing campaign targeting government agencies using spear-phishing emails with malicious Office documents.",
          source: "Unit42",
          published_date: "2025-01-20T00:00:00Z",
          cves: ["CVE-2025-0001", "CVE-2024-9999"],
          mitre_attack: {
            tactics: ["Initial Access", "Execution", "Persistence", "Defense Evasion"],
            techniques: ["T1566.001", "T1059.001", "T1547.001", "T1055"],
            sub_techniques: ["T1566.001", "T1059.001"]
          },
          indicators: {
            ips: ["185.239.226.61", "192.99.34.147"],
            domains: ["secure-update.info", "microsoft-security.net"],
            hashes: ["d4b2a5c8e7f3a1b9c6d0e8f2a4b7c9d1", "a1b2c3d4e5f6789012345678901234567890abcd"],
            file_paths: ["C:\\Windows\\System32\\svchost.exe", "C:\\Users\\%USERNAME%\\AppData\\Roaming\\Microsoft\\updater.exe"]
          },
          technologies: ["Windows", "Microsoft Office", "Active Directory"],
          threat_actors: ["APT29", "Cozy Bear"],
          attack_vectors: ["Spear Phishing", "Malware Delivery", "Lateral Movement"]
        },
        xql_rule: {
          rule_name: "APT29_Cozy_Bear_Campaign_Detection",
          description: "Detects APT29 phishing campaign indicators and lateral movement techniques",
          severity: "critical",
          category: "endpoint",
          xql_query: `dataset = xdr_data
| filter action_remote_ip in ("185.239.226.61", "192.99.34.147") or action_external_hostname in ("secure-update.info", "microsoft-security.net")
| filter agent_os_type = "AGENT_OS_WINDOWS"
| alter risk_score = if(
    endpoint_name contains "EXEC" or endpoint_name contains "ADMIN", 5,
    endpoint_name contains "SERVER", 4,
    3)
| fields timestamp, endpoint_name, action_user, action_process_name, risk_score`,
          data_sources: ["xdr_data", "windows_event_logs", "sysmon_logs"],
          required_fields: ["timestamp", "endpoint_name", "action_user", "action_remote_ip", "action_external_hostname"],
          mitre_attack: { tactics: ["Initial Access"], techniques: ["T1566.001"], sub_techniques: [] },
          indicators: { ips: ["185.239.226.61"], domains: ["secure-update.info"], hashes: [], file_paths: [] },
          false_positive_notes: "Legitimate system administration, software updates, authorized remote access",
          tuning_guidance: "Monitor for Spear Phishing, Malware Delivery, Lateral Movement. Adjust risk scores based on user groups and asset criticality.",
          created_date: "2025-01-20T10:00:00Z",
          version: "1.0"
        },
        automation_playbook: {
          name: "APT29_Cozy_Bear_Campaign_Detection_Response",
          description: "Automated response workflow for APT29 Targets Government Agencies with New Phishing Campaign",
          version: "1.0",
          category: "endpoint",
          inputs: [
            { name: "alert_id", type: "string", required: true },
            { name: "analyst_name", type: "string", required: false },
            { name: "escalation_required", type: "boolean", required: false, default: false }
          ],
          tasks: [
            {
              id: "1",
              name: "Extract Alert Context",
              type: "builtin",
              script: "GetAlertExtraData",
              arguments: { alert_id: "${inputs.alert_id}" },
              outputs: ["alert_details"]
            },
            {
              id: "4",
              name: "Immediate Isolation",
              type: "integration",
              script: "cortex-xdr-isolate-endpoint",
              arguments: { alert_id: "${alert_details.alert_id}" },
              outputs: ["isolation_result"]
            }
          ],
          outputs: [
            { name: "playbook_status", type: "string" },
            { name: "threat_contained", type: "boolean" },
            { name: "analyst_notes", type: "string" }
          ],
          mitre_attack: { tactics: ["Initial Access"], techniques: ["T1566.001"], sub_techniques: [] },
          created_date: "2025-01-20T10:00:00Z"
        },
        alert_layout: {
          layout_name: "APT29_Cozy_Bear_Campaign_Detection_Alert_Layout",
          description: "Analyst decision support for APT29 Targets Government Agencies with New Phishing Campaign alerts",
          category: "endpoint",
          sections: [
            {
              name: "Alert Summary",
              type: "summary",
              fields: [
                { name: "Threat Name", field: "alert.rule_name", type: "text" },
                { name: "Severity", field: "alert.severity", type: "badge" },
                { name: "MITRE ATT&CK", field: "alert.mitre_techniques", type: "list" },
                { name: "Risk Score", field: "alert.risk_score", type: "numeric" }
              ]
            }
          ],
          decision_tree: {
            high_risk_user: {
              condition: "alert.action_user_groups contains 'Executives'",
              actions: ["immediate_escalation", "manager_notification"]
            }
          },
          enrichment_queries: [],
          created_date: "2025-01-20T10:00:00Z",
          version: "1.0"
        },
        operational_dashboard: {
          dashboard_name: "APT29_Cozy_Bear_Campaign_Detection_Monitoring",
          description: "Operational monitoring for APT29 Targets Government Agencies with New Phishing Campaign threats",
          category: "endpoint",
          refresh_interval: "5m",
          widgets: [
            {
              id: "threat_count",
              type: "metric",
              title: "APT29 Targets Government Agencies with New Phishing Campaign Alerts (24h)",
              xql_query: "dataset = xdr_data | filter rule_name = \"APT29_Cozy_Bear_Campaign_Detection\" | filter _time > now() - 24h | stats count()",
              size: "small"
            }
          ],
          filters: [
            { name: "Time Range", type: "time_picker", default: "24h" },
            { name: "Severity", type: "select", options: ["All", "Critical", "High", "Medium"] }
          ],
          alerts: [
            {
              condition: "threat_count > 5",
              action: "notify_soc_manager",
              message: "Spike in APT29 Targets Government Agencies with New Phishing Campaign alerts detected"
            }
          ],
          created_date: "2025-01-20T10:00:00Z",
          version: "1.0"
        },
        ddlc_phase: "development",
        ddlc_metadata: {
          phase_history: [
            {
              phase: "requirement",
              timestamp: "2025-01-20T09:00:00Z",
              notes: "Initial threat intelligence analysis completed"
            },
            {
              phase: "design",
              timestamp: "2025-01-20T09:30:00Z",
              notes: "Detection logic and response workflow designed"
            },
            {
              phase: "development",
              timestamp: "2025-01-20T10:00:00Z",
              notes: "XSIAM content package generated and reviewed"
            }
          ],
          test_results: [
            {
              test_type: "XQL Syntax Validation",
              status: "passed",
              details: "Query syntax validated successfully"
            },
            {
              test_type: "Field Validation",
              status: "passed",
              details: "All required fields available in target dataset"
            }
          ],
          validation_notes: "Content package ready for testing phase"
        },
        version: "1.0",
        created_date: "2025-01-20T10:00:00Z",
        modified_date: "2025-01-20T10:00:00Z",
        created_by: "system"
      }
    ];

    for (const pkg of samplePackages) {
      await this.storePackage(pkg);
    }
  }

  // Get comprehensive DDLC analytics
  async getDDLCAnalytics() {
    const packages = Array.from(this.packages.values());
    const phaseDistribution = packages.reduce((acc, pkg) => {
      acc[pkg.ddlc_phase] = (acc[pkg.ddlc_phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averagePhaseTime = this.calculateAveragePhaseTime(packages);
    const completionRate = this.calculateCompletionRate(packages);
    const recentTransitions = this.getRecentTransitions(packages);

    return {
      total_packages: packages.length,
      phase_distribution: phaseDistribution,
      average_phase_time: averagePhaseTime,
      completion_rate: completionRate,
      recent_transitions: recentTransitions,
      phase_bottlenecks: this.identifyPhaseBottlenecks(packages),
      quality_metrics: this.calculateQualityMetrics(packages)
    };
  }

  private calculateAveragePhaseTime(packages: ContentPackage[]) {
    const phaseTimes: Record<string, number[]> = {};
    
    packages.forEach(pkg => {
      if (pkg.ddlc_metadata.phase_history && pkg.ddlc_metadata.phase_history.length > 1) {
        for (let i = 1; i < pkg.ddlc_metadata.phase_history.length; i++) {
          const current = pkg.ddlc_metadata.phase_history[i];
          const previous = pkg.ddlc_metadata.phase_history[i - 1];
          const duration = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
          
          if (!phaseTimes[previous.phase]) {
            phaseTimes[previous.phase] = [];
          }
          phaseTimes[previous.phase].push(duration);
        }
      }
    });

    const averages: Record<string, string> = {};
    Object.keys(phaseTimes).forEach(phase => {
      const times = phaseTimes[phase];
      if (times.length > 0) {
        const avgMs = times.reduce((sum, time) => sum + time, 0) / times.length;
        const avgHours = Math.round(avgMs / (1000 * 60 * 60) * 10) / 10;
        averages[phase] = `${avgHours} hours`;
      }
    });

    return averages;
  }

  private calculateCompletionRate(packages: ContentPackage[]) {
    const deployed = packages.filter(pkg => pkg.ddlc_phase === 'deployed' || pkg.ddlc_phase === 'monitoring').length;
    const total = packages.length;
    return {
      deployed_packages: deployed,
      total_packages: total,
      completion_percentage: total > 0 ? Math.round((deployed / total) * 100) : 0
    };
  }

  private getRecentTransitions(packages: ContentPackage[]) {
    const allTransitions: Array<{
      package_name: string;
      from_phase: string;
      to_phase: string;
      timestamp: string;
      notes: string;
    }> = [];

    packages.forEach(pkg => {
      if (pkg.ddlc_metadata.phase_history && pkg.ddlc_metadata.phase_history.length > 1) {
        for (let i = 1; i < pkg.ddlc_metadata.phase_history.length; i++) {
          const current = pkg.ddlc_metadata.phase_history[i];
          const previous = pkg.ddlc_metadata.phase_history[i - 1];
          allTransitions.push({
            package_name: pkg.name,
            from_phase: previous.phase,
            to_phase: current.phase,
            timestamp: current.timestamp,
            notes: current.notes || ''
          });
        }
      }
    });

    return allTransitions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  private identifyPhaseBottlenecks(packages: ContentPackage[]) {
    const phaseCount = packages.reduce((acc, pkg) => {
      acc[pkg.ddlc_phase] = (acc[pkg.ddlc_phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bottlenecks: Array<{ phase: string; count: number; severity: string }> = [];
    const totalPackages = packages.length;

    Object.entries(phaseCount).forEach(([phase, count]) => {
      const percentage = (count / totalPackages) * 100;
      if (percentage > 40) {
        bottlenecks.push({ phase, count, severity: 'high' });
      } else if (percentage > 25) {
        bottlenecks.push({ phase, count, severity: 'medium' });
      }
    });

    return bottlenecks;
  }

  private calculateQualityMetrics(packages: ContentPackage[]) {
    const testResults = packages
      .filter(pkg => pkg.ddlc_metadata.test_results && pkg.ddlc_metadata.test_results.length > 0)
      .flatMap(pkg => pkg.ddlc_metadata.test_results || []);

    const totalTests = testResults.length;
    const passedTests = testResults.filter(test => test.status === 'passed').length;
    const failedTests = testResults.filter(test => test.status === 'failed').length;

    return {
      total_tests: totalTests,
      passed_tests: passedTests,
      failed_tests: failedTests,
      success_rate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
      packages_with_tests: packages.filter(pkg => pkg.ddlc_metadata.test_results && pkg.ddlc_metadata.test_results.length > 0).length
    };
  }
}