import { useState, useEffect } from "react";
import { Shield, FileText, Zap, Monitor, Github, Upload, Activity, Search, ArrowRight, Clock, CheckCircle, Circle, Archive, Database, Server, Layers, Settings, Layout } from "lucide-react";
import { Link } from "wouter";
import ThreatInput from "@/components/threat-input";
import UseCaseList from "@/components/use-case-list";
import ValidationQueue from "@/components/validation-queue";
import WorkflowProgressTracker from "@/components/workflow-progress-tracker";
import BulkProcessingModal from "@/components/bulk-processing-modal";
import DataBackupSystem from '@/components/data-backup-system';
import InteractiveTutorial from '@/components/interactive-tutorial';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useExportData, useClearData } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import yaml from "js-yaml";
import { loadDemoData } from "@/utils/demo-data";

export default function Dashboard() {
  const [selectedTrainingPath, setSelectedTrainingPath] = useState<string | null>(null);
  const [labSetupUseCase, setLabSetupUseCase] = useState<any>(null);
  const [labSetupPhase, setLabSetupPhase] = useState<'setup' | 'datasource' | 'integration' | 'simulation' | 'workflow'>('setup');
  const [labConfig, setLabConfig] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [bulkProcessingOpen, setBulkProcessingOpen] = useState(false);
  const [dataBackupOpen, setDataBackupOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({
    threatsLoaded: 0,
    contentGenerated: 0,
    labsPlanned: 0,
    xsiamDeployed: 0,
    githubBackups: 0
  });
  const { toast } = useToast();
  const exportData = useExportData();
  const clearData = useClearData();

  // Load workflow stats on mount
  useEffect(() => {
    const threatData = JSON.parse(localStorage.getItem('threatIntelligence') || '[]');
    const useCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    const trainingPaths = JSON.parse(localStorage.getItem('trainingPaths') || '[]');
    
    setWorkflowStats({
      threatsLoaded: threatData.length,
      contentGenerated: useCases.length,
      labsPlanned: trainingPaths.filter((tp: any) => tp.category === 'lab-planning').length,
      xsiamDeployed: trainingPaths.filter((tp: any) => tp.category === 'xsiam-deployed').length,
      githubBackups: localStorage.getItem('githubBackupCount') ? parseInt(localStorage.getItem('githubBackupCount')!) : 0
    });
  }, []);

  const handleExport = async () => {
    try {
      const data = await exportData.mutateAsync();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threatresearchhub-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Training data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export training data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleZipExport = async () => {
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Get all data from localStorage
      const useCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      const trainingPaths = JSON.parse(localStorage.getItem('trainingPaths') || '[]');
      const sharedTemplates = JSON.parse(localStorage.getItem('sharedTemplates') || '[]');
      const templateComments = JSON.parse(localStorage.getItem('templateComments') || '[]');
      const validationItems = JSON.parse(localStorage.getItem('validationItems') || '[]');
      const progressTracking = JSON.parse(localStorage.getItem('progressTracking') || '[]');
      
      // Add main data files
      zip.file("use-cases.json", JSON.stringify(useCases, null, 2));
      zip.file("training-paths.json", JSON.stringify(trainingPaths, null, 2));
      zip.file("validation-items.json", JSON.stringify(validationItems, null, 2));
      zip.file("progress-tracking.json", JSON.stringify(progressTracking, null, 2));
      
      // Add template sharing data
      if (sharedTemplates.length > 0) {
        zip.file("shared-templates.json", JSON.stringify(sharedTemplates, null, 2));
      }
      if (templateComments.length > 0) {
        zip.file("template-comments.json", JSON.stringify(templateComments, null, 2));
      }
      
      // Create individual use case files in both JSON and YAML formats
      if (useCases.length > 0) {
        const useCaseFolder = zip.folder("use-cases");
        const useCaseYamlFolder = useCaseFolder?.folder("yaml");
        const useCaseJsonFolder = useCaseFolder?.folder("json");
        
        useCases.forEach((useCase: any, index: number) => {
          const baseFilename = `${String(index + 1).padStart(3, '0')}-${useCase.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}`;
          
          // JSON format
          useCaseJsonFolder?.file(`${baseFilename}.json`, JSON.stringify(useCase, null, 2));
          
          // YAML format for playbooks and detection rules
          try {
            const yamlContent = yaml.dump(useCase, { 
              indent: 2,
              lineWidth: 120,
              noRefs: true,
              sortKeys: false 
            });
            useCaseYamlFolder?.file(`${baseFilename}.yaml`, yamlContent);
          } catch (error) {
            console.warn(`Failed to convert use case ${index + 1} to YAML:`, error);
          }
        });
      }
      
      // Create training path files in both formats
      if (trainingPaths.length > 0) {
        const trainingFolder = zip.folder("training-paths");
        const trainingYamlFolder = trainingFolder?.folder("yaml");
        const trainingJsonFolder = trainingFolder?.folder("json");
        
        trainingPaths.forEach((path: any, index: number) => {
          const baseFilename = `${String(index + 1).padStart(3, '0')}-${path.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}`;
          
          // JSON format
          trainingJsonFolder?.file(`${baseFilename}.json`, JSON.stringify(path, null, 2));
          
          // YAML format for playbooks
          try {
            const yamlContent = yaml.dump(path, { 
              indent: 2,
              lineWidth: 120,
              noRefs: true,
              sortKeys: false 
            });
            trainingYamlFolder?.file(`${baseFilename}.yaml`, yamlContent);
          } catch (error) {
            console.warn(`Failed to convert training path ${index + 1} to YAML:`, error);
          }
        });
      }
      
      // Create specialized export folders for different security platforms
      const correlationRulesFolder = zip.folder("correlation-rules");
      const playbooksFolder = zip.folder("soar-playbooks");
      const dashboardsFolder = zip.folder("xsiam-dashboards");
      const layoutsFolder = zip.folder("alert-layouts");
      
      // Export XQL Correlation Rules (JSON format like XSIAM)
      if (useCases.length > 0) {
        const correlationRules = useCases.map((uc: any, index: number) => ({
          rule_id: index + 1000,
          name: `ThreatResearchHub_${uc.title.replace(/[^\w]/g, '_')}`,
          severity: uc.severity === 'critical' ? 'SEV_040_HIGH' : 
                   uc.severity === 'high' ? 'SEV_030_MEDIUM' : 'SEV_020_LOW',
          xql_query: uc.detectionRules?.[0]?.xqlQuery || `// ${uc.title} Detection\\nconfig case_sensitive = false | dataset = xdr_data | filter action_remote_ip in ("suspicious_ip") | fields _time, agent_hostname, action_remote_ip`,
          is_enabled: true,
          description: uc.description || `Threat detection for ${uc.title}`,
          alert_name: `ThreatResearchHub Alert: ${uc.title}`,
          alert_category: "MALWARE",
          alert_type: null,
          alert_description: uc.description || `Alert generated for ${uc.title} threat activity`,
          alert_domain: "DOMAIN_HUNTING",
          alert_fields: {},
          execution_mode: "SCHEDULED",
          search_window: "1 hours",
          simple_schedule: "1 hour",
          timezone: "UTC",
          crontab: "0 * * * *",
          suppression_enabled: true,
          suppression_duration: "1 hours", 
          suppression_fields: ["agent_hostname"],
          dataset: "alerts",
          user_defined_severity: null,
          user_defined_category: null,
          mitre_defs: {},
          investigation_query_link: uc.detectionRules?.[0]?.xqlQuery || "",
          drilldown_query_timeframe: "ALERT",
          mapping_strategy: "AUTO",
          action: "ALERTS",
          lookup_mapping: []
        }));
        
        correlationRulesFolder?.file("threat-correlation-rules.json", JSON.stringify(correlationRules, null, 2));
      }
      
      // Export SOAR Playbooks (YAML format like Cortex XSOAR)
      if (trainingPaths.length > 0) {
        trainingPaths.forEach((tp: any, index: number) => {
          const playbookYaml = {
            id: `threatresearchhub-${tp.title.toLowerCase().replace(/[^\w]/g, '-')}`,
            version: 1,
            vcShouldKeepItemLegacyProdMachine: false,
            name: tp.title,
            description: tp.description || `Automated response playbook for ${tp.title}`,
            starttaskid: "0",
            tasks: {
              "0": {
                id: "0",
                taskid: "start-task-001",
                type: "start",
                task: {
                  id: "start-task-001",
                  version: -1,
                  name: "",
                  iscommand: false,
                  brand: ""
                },
                nexttasks: {
                  "#none#": ["1"]
                },
                separatecontext: false,
                continueonerrortype: "",
                view: JSON.stringify({
                  position: { x: 450, y: 50 }
                }),
                note: false,
                timertriggers: [],
                ignoreworker: false,
                skipunavailable: false,
                quietmode: 0,
                isoversize: false,
                isautoswitchedtoquietmode: false
              },
              "1": {
                id: "1",
                taskid: "investigation-001",
                type: "title",
                task: {
                  id: "investigation-001", 
                  version: -1,
                  name: "Investigation",
                  type: "title",
                  iscommand: false,
                  brand: ""
                },
                nexttasks: {
                  "#none#": ["2"]
                },
                separatecontext: false,
                continueonerrortype: "",
                view: JSON.stringify({
                  position: { x: 450, y: 200 }
                }),
                note: false,
                timertriggers: [],
                ignoreworker: false,
                skipunavailable: false,
                quietmode: 0,
                isoversize: false,
                isautoswitchedtoquietmode: false
              },
              "2": {
                id: "2",
                taskid: "containment-001",
                type: "regular",
                task: {
                  id: "containment-001",
                  version: -1,
                  name: "Execute Containment Actions",
                  description: `Containment actions for ${tp.title}`,
                  script: "Builtin|||setIncident",
                  type: "regular",
                  iscommand: true,
                  brand: "Builtin"
                },
                nexttasks: {
                  "#none#": []
                },
                scriptarguments: {
                  severity: {
                    simple: tp.severity || "medium"
                  }
                },
                separatecontext: false,
                continueonerrortype: "",
                view: JSON.stringify({
                  position: { x: 450, y: 350 }
                }),
                note: false,
                timertriggers: [],
                ignoreworker: false,
                skipunavailable: false,
                quietmode: 0,
                isoversize: false,
                isautoswitchedtoquietmode: false
              }
            },
            view: JSON.stringify({
              linkLabelsPosition: {},
              paper: {
                dimensions: {
                  height: 500,
                  width: 900,
                  x: 50,
                  y: 50
                }
              }
            }),
            inputs: [
              {
                key: "threshold",
                value: { simple: "2" },
                required: false,
                description: "Alert threshold",
                playbookInputQuery: null
              }
            ],
            outputs: [
              {
                contextPath: "ThreatResponse.Status",
                type: "string"
              }
            ]
          };
          
          const filename = `${String(index + 1).padStart(3, '0')}-${tp.title.replace(/[^\w\s-]/g, '').replace(/\\s+/g, '-').toLowerCase()}.yml`;
          playbooksFolder?.file(filename, yaml.dump(playbookYaml, { indent: 2, lineWidth: 120 }));
        });
      }
      
      // Export XSIAM Dashboards (JSON format)
      if (useCases.length > 0) {
        const dashboardData = {
          dashboards_data: [{
            name: "ThreatResearchHub - Threat Intelligence Dashboard",
            description: "Comprehensive threat intelligence dashboard generated from ThreatResearchHub",
            status: "ENABLED",
            layout: [
              {
                id: "row-threat-overview",
                data: [{
                  key: "xql_threat_overview",
                  data: {
                    type: "Custom XQL",
                    width: 100,
                    height: 400,
                    phrase: `dataset = xdr_data\\n| filter event_type = ENUM.STORY\\n| bin _time span = 1h\\n| comp count() as threats by _time\\n| sort asc _time\\n| view graph type = line xaxis = _time yaxis = threats`,
                    time_frame: { relativeTime: 86400000 },
                    viewOptions: {
                      type: "line",
                      commands: [
                        { command: { op: "=", name: "xaxis", value: "_time" }},
                        { command: { op: "=", name: "yaxis", value: "threats" }}
                      ]
                    }
                  }
                }]
              },
              {
                id: "row-threat-categories",
                data: [{
                  key: "xql_threat_categories",
                  data: {
                    type: "Custom XQL", 
                    width: 50,
                    height: 400,
                    phrase: `dataset = xdr_data\\n| filter event_type = ENUM.STORY\\n| comp count() as qty by alert_category\\n| sort desc qty\\n| view graph type = pie xaxis = alert_category yaxis = qty`,
                    time_frame: { relativeTime: 86400000 },
                    viewOptions: {
                      type: "pie",
                      commands: [
                        { command: { op: "=", name: "xaxis", value: "alert_category" }},
                        { command: { op: "=", name: "yaxis", value: "qty" }}
                      ]
                    }
                  }
                }]
              }
            ],
            default_dashboard_id: 1,
            global_id: `threatresearchhub-dashboard-${Date.now()}`,
            metadata: { params: [] }
          }],
          widgets_data: useCases.slice(0, 5).map((uc: any, index: number) => ({
            widget_key: `xql_threat_${index}`,
            title: `ThreatResearchHub - ${uc.title}`,
            creation_time: Date.now(),
            description: uc.description || `Threat analysis for ${uc.title}`,
            data: {
              phrase: uc.detectionRules?.[0]?.xqlQuery || `dataset = xdr_data\\n| filter alert_name contains "${uc.title}"\\n| fields _time, agent_hostname, alert_name, severity\\n| sort desc _time`,
              time_frame: { relativeTime: 86400000 },
              viewOptions: { type: "table", commands: [] }
            },
            support_time_range: true,
            additional_info: {
              query_tables: ["xdr_data"],
              query_uses_library: false
            },
            creator_mail: "threatresearchhub@security.local"
          }))
        };
        
        dashboardsFolder?.file("threat-intelligence-dashboard.json", JSON.stringify(dashboardData, null, 2));
      }
      
      // Export Alert Layouts (JSON format like XSOAR layouts)
      if (useCases.length > 0) {
        useCases.slice(0, 3).forEach((uc: any, index: number) => {
          const alertLayout = {
            cacheVersn: 0,
            close: null,
            definitionId: "",
            description: `Alert layout for ${uc.title}`,
            detached: false,
            details: null,
            detailsV2: {
              TypeName: "",
              tabs: [
                {
                  id: "summary",
                  name: "Alert Overview",
                  type: "summary"
                },
                {
                  id: "threat-details",
                  name: "Threat Analysis",
                  sections: [
                    {
                      displayType: "ROW",
                      h: 2,
                      i: "threat-info-section",
                      isVisible: true,
                      items: [
                        {
                          endCol: 2,
                          fieldId: "alertid",
                          height: 26,
                          id: "alert-id-field",
                          index: 0,
                          sectionItemType: "field",
                          startCol: 0
                        },
                        {
                          endCol: 2,
                          fieldId: "severity",
                          height: 26,
                          id: "severity-field",
                          index: 1,
                          sectionItemType: "field", 
                          startCol: 0
                        },
                        {
                          endCol: 2,
                          fieldId: "sourcebrand",
                          height: 26,
                          id: "source-field",
                          index: 2,
                          sectionItemType: "field",
                          startCol: 0
                        }
                      ],
                      maxW: 3,
                      minH: 1,
                      moved: false,
                      name: "Threat Details",
                      static: false,
                      w: 1,
                      x: 0,
                      y: 0
                    }
                  ]
                }
              ]
            },
            fromServerVersion: "6.0.0",
            group: "incident",
            id: `threatresearchhub-layout-${uc.title.toLowerCase().replace(/[^\\w]/g, '-')}`,
            itemVersion: "1.0.0",
            kind: "",
            name: `ThreatResearchHub - ${uc.title} Layout`,
            packID: "ThreatResearchHub",
            packName: "ThreatResearchHub",
            system: false,
            toServerVersion: "",
            version: -1
          };
          
          const filename = `layout-${uc.title.replace(/[^\\w\\s-]/g, '').replace(/\\s+/g, '-').toLowerCase()}.json`;
          layoutsFolder?.file(filename, JSON.stringify(alertLayout, null, 2));
        });
      }
      
      // Add comprehensive README with export information
      const readme = `# ThreatResearchHub Export
      
Export Date: ${new Date().toISOString()}
Platform Version: ThreatResearchHub v1.0
Export Format: Multi-format (JSON + YAML)

## Archive Structure:

### Main Data Files (JSON):
- use-cases.json: All extracted threat intelligence use cases
- training-paths.json: Generated training workflows  
- validation-items.json: Items requiring manual review
- progress-tracking.json: Training completion status
- shared-templates.json: Community shared templates
- template-comments.json: Template feedback and comments

### Individual Files:
- use-cases/json/: Individual use case files in JSON format
- use-cases/yaml/: Individual use case files in YAML format
- training-paths/json/: Individual training path files in JSON format  
- training-paths/yaml/: Individual training path files in YAML format

### Security Platform Exports:
- correlation-rules/: XQL correlation rules for XSIAM platform (JSON format)
- soar-playbooks/: SOAR playbooks for Cortex XSOAR (YAML format)  
- xsiam-dashboards/: Dashboard configurations for XSIAM (JSON format)
- alert-layouts/: Alert layout definitions for incident management (JSON format)

## Format Usage:
- **JSON**: Full data structure with metadata, ideal for platform import
- **YAML**: Human-readable format, compatible with SIEM tools, playbooks, and CI/CD

## Import Instructions:
1. Extract this ZIP file
2. Choose format based on your needs:
   - JSON files: For ThreatResearchHub import or programmatic processing
   - YAML files: For SIEM integration, playbook deployment, or manual review
3. Use main JSON files for bulk import, individual files for selective import

## Platform Integration Examples:
- Correlation Rules: Import JSON files directly into Cortex XSIAM correlation rules
- SOAR Playbooks: Deploy YAML playbooks to Cortex XSOAR, Phantom, or Demisto
- Dashboards: Import dashboard JSON into XSIAM for threat visualization
- Alert Layouts: Configure incident layouts in XSOAR for structured threat analysis
- Training: Use JSON for learning management systems and threat intelligence platforms

## Data Summary:
- Use Cases: ${useCases.length}
- Training Paths: ${trainingPaths.length}
- Shared Templates: ${sharedTemplates.length}
- Validation Items: ${validationItems.length}
- Correlation Rules: ${useCases.length}
- SOAR Playbooks: ${trainingPaths.length}
- Dashboard Widgets: ${Math.min(useCases.length, 5)}
- Alert Layouts: ${Math.min(useCases.length, 3)}

## File Naming Convention:
- Individual files: 001-threat-name.json/yaml (numbered for ordering)
- Bulk exports: descriptive-name.json/yaml
- Specialized: detection-rules.yaml, incident-playbooks.yaml
`;
      
      zip.file("README.md", readme);
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threatresearchhub-export-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "ZIP Export Complete",
        description: `Exported ${useCases.length} use cases, ${trainingPaths.length} training paths in JSON & YAML formats.`,
      });
    } catch (error) {
      console.error('ZIP export error:', error);
      toast({
        title: "ZIP Export Failed",
        description: "Failed to create ZIP export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeduplicateThreats = () => {
    if (confirm("Remove duplicate threats and combine vendor sources? This will merge similar threats into single entries.")) {
      const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      const deduplicatedUseCases: any[] = [];
      const processed = new Set<number>();

      console.log('🔧 Starting deduplication of', existingUseCases.length, 'use cases');

      existingUseCases.forEach((useCase: any, index: number) => {
        if (processed.has(index)) return;

        // Start with current use case and find all duplicates
        const merged = { 
          ...useCase, 
          sources: useCase.sources || [{ vendor: useCase.source, url: useCase.url || '', title: useCase.title }] 
        };

        // Find duplicates
        existingUseCases.forEach((otherCase: any, otherIndex: number) => {
          if (index === otherIndex || processed.has(otherIndex)) return;

          const hasSameCVE = useCase.cves?.length > 0 && otherCase.cves?.length > 0 && 
                            useCase.cves.some((cve: string) => otherCase.cves?.includes(cve));
          
          const titleNorm1 = useCase.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
          const titleNorm2 = otherCase.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
          const exactTitleMatch = titleNorm1 === titleNorm2;
          
          const words1 = titleNorm1.split(' ').filter((w: string) => w.length >= 3);
          const words2 = titleNorm2.split(' ').filter((w: string) => w.length >= 3);
          const commonWords = words1.filter((word: string) => words2.includes(word));
          const wordOverlap = commonWords.length >= Math.min(words1.length, words2.length) * 0.7;

          if (hasSameCVE || exactTitleMatch || wordOverlap) {
            console.log('🔄 Merging duplicate:', otherCase.title, 'into', useCase.title);
            
            // Add source from duplicate
            const newSource = { 
              vendor: otherCase.source, 
              url: otherCase.url || '', 
              title: otherCase.title 
            };
            
            if (!merged.sources.some((s: any) => s.vendor === newSource.vendor)) {
              merged.sources.push(newSource);
            }
            
            processed.add(otherIndex);
          }
        });

        deduplicatedUseCases.push(merged);
        processed.add(index);
      });

      localStorage.setItem('useCases', JSON.stringify(deduplicatedUseCases));
      
      console.log('✅ Deduplication complete:', existingUseCases.length, '→', deduplicatedUseCases.length);
      
      toast({
        title: "Threats Deduplicated",
        description: `Merged ${existingUseCases.length - deduplicatedUseCases.length} duplicate threats`,
      });
      
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleClearCache = async () => {
    if (confirm("Are you sure you want to clear all training data? This will refresh the page.")) {
      try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name === 'threatresearchhub-db') {
            indexedDB.deleteDatabase(db.name);
          }
        }
        
        localStorage.clear();
        
        toast({
          title: "Cache Cleared",
          description: "All training data cleared. Refreshing page...",
        });
        
        setTimeout(() => window.location.reload(), 1000);
        
      } catch (error) {
        console.error('Clear error:', error);
        window.location.reload();
      }
    }
  };

  // Generate workflow steps based on current progress
  const workflowSteps = [
    {
      id: 'load-threat',
      title: '1. Load Threat Report',
      description: 'Start by loading a threat report from URL, PDF, or browse threat feeds',
      status: workflowStats.threatsLoaded > 0 ? 'completed' : 'current',
      href: '/',
      completedCount: workflowStats.threatsLoaded,
      totalCount: undefined
    },
    {
      id: 'generate-content',
      title: '2. Generate XSIAM Content',
      description: 'Extract use cases and generate correlation rules, playbooks, alert layouts, dashboards',
      status: workflowStats.contentGenerated > 0 ? 'completed' : 
               workflowStats.threatsLoaded > 0 ? 'current' : 'upcoming',
      href: '/content-generation',
      completedCount: workflowStats.contentGenerated,
      totalCount: undefined
    },
    {
      id: 'plan-lab',
      title: '3. Plan Lab Environment',
      description: 'Design complete lab infrastructure for threat simulation and testing',
      status: workflowStats.labsPlanned > 0 ? 'completed' : 
               workflowStats.contentGenerated > 0 ? 'current' : 'upcoming',
      href: '/lab-build-planner',
      completedCount: workflowStats.labsPlanned,
      totalCount: undefined
    },
    {
      id: 'deploy-xsiam',
      title: '4. Deploy & Test in XSIAM',
      description: 'Deploy content to XSIAM, test XQL queries, validate data sources',
      status: workflowStats.xsiamDeployed > 0 ? 'completed' : 
               workflowStats.labsPlanned > 0 ? 'current' : 'upcoming',
      href: '/xsiam-debugger',
      completedCount: workflowStats.xsiamDeployed,
      totalCount: undefined
    },
    {
      id: 'backup-github',
      title: '5. Backup to GitHub',
      description: 'Save complete project to GitHub with automated daily sync',
      status: workflowStats.githubBackups > 0 ? 'completed' : 
               workflowStats.xsiamDeployed > 0 ? 'current' : 'upcoming',
      href: '/github-export',
      completedCount: workflowStats.githubBackups,
      totalCount: undefined
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">ThreatResearchHub</h1>
              <span className="ml-2 text-sm text-gray-500">XSIAM Enablement Platform</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Progress: {workflowStats.threatsLoaded + workflowStats.contentGenerated + workflowStats.labsPlanned + workflowStats.xsiamDeployed + workflowStats.githubBackups}/5 steps
              </span>
              
              <Link href="/user-guide">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-1" />
                  Help
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Clear 5-Step Workflow */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workflow Progress Tracker */}
        <div className="mb-8">
          <WorkflowProgressTracker steps={workflowSteps} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Step 1 is the primary focus */}
          <div className="lg:col-span-3 space-y-6">
            <ThreatInput />
            <UseCaseList />
          </div>

          {/* Sidebar - Quick Actions & Validation */}
          <div className="space-y-6">
            <ValidationQueue />
            
            {/* Simplified Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/content-generation">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Content
                  </Button>
                </Link>
                <Link href="/lab-build-planner">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Server className="h-4 w-4 mr-2" />
                    Plan Lab
                  </Button>
                </Link>
                <Link href="/xsiam-debugger">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    Test XSIAM
                  </Button>
                </Link>
                <Link href="/github-export">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Github className="h-4 w-4 mr-2" />
                    Backup to GitHub
                  </Button>
                </Link>
              </div>
            </div>

                <Link href="/pii-sanitizer">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <div className="flex items-center">
                          <Lock className="h-4 w-4 text-red-500 mr-3" />
                          PII Data Sanitizer
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove sensitive information from threat reports while preserving structure</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>

                <Link href="/threat-archive">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <div className="flex items-center">
                          <Archive className="h-4 w-4 text-purple-500 mr-3" />
                          Threat Archive
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Historical threats older than 30 days with search and filtering</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>

                <Link href="/threat-monitoring">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                      >
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 text-cyan-500 mr-3" />
                          Active Threat Feed
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Live threat intelligence from CISA, Unit42, SANS ISC updating every 6 hours</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>



                <Link href="/xsiam-debugger">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                      >
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                          XSIAM Live Debugger
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Live XSIAM API testing with XQL query analysis and intelligent recommendations</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>

                <Link href="/xsiam-deployment">
                  <Button
                    variant="outline"
                    className="w-full justify-between text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 text-green-500 mr-3" />
                      XSIAM Content Deployment
                    </div>
                  </Button>
                </Link>

                <Link href="/github-export">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-gray-800 border-gray-200 hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <Github className="h-4 w-4 text-gray-700 mr-3" />
                          GitHub Backup
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>One-click backup and sync of entire project to GitHub repository</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setDataBackupOpen(true)}
                      variant="outline"
                      className="w-full justify-between text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <div className="flex items-center">
                        <Database className="h-4 w-4 text-purple-500 mr-3" />
                        Complete Data Backup
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export all training data, progress, and platform configurations</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setTaxonomyBreakdownOpen(true)}
                      variant="outline"
                      className="w-full justify-between text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <div className="flex items-center">
                        <Database className="h-4 w-4 text-blue-500 mr-3" />
                        TRAM Taxonomy Analysis
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Advanced MITRE ATT&CK mapping and threat technique analysis</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        loadDemoData();
                        toast({
                          title: "Demo Data Loaded",
                          description: "CVE-2025-1974 and other sample threats loaded for testing",
                        });
                        setTimeout(() => window.location.reload(), 1000);
                      }}
                    >
                      <div className="flex items-center">
                        <i className="fas fa-database text-blue-500 mr-3"></i>
                        Load Demo Data
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Load sample threat scenarios (CVE-2025-1974, OWASP Top 10) for testing workflows</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleClearCache}
                      disabled={clearData.isPending}
                    >
                      <div className="flex items-center">
                        <i className="fas fa-trash text-red-500 mr-3"></i>
                        Clear Example Data
                      </div>
                      {clearData.isPending && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove all demo data and training progress to start over</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={handleExport}
                      disabled={exportData.isPending}
                    >
                      <div className="flex items-center">
                        <i className="fas fa-download text-cortex-blue mr-3"></i>
                        <span className="text-sm font-medium">
                          {exportData.isPending ? "Exporting..." : "Export JSON Data"}
                        </span>
                      </div>
                      <i className="fas fa-chevron-right text-gray-400"></i>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export all training data and progress as JSON for backup or migration</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-cortex-blue text-white hover:bg-blue-700 border-cortex-blue"
                      onClick={handleZipExport}
                    >
                      <div className="flex items-center">
                        <i className="fas fa-file-archive text-white mr-3"></i>
                        <span className="text-sm font-medium">Export as ZIP Archive</span>
                      </div>
                      <i className="fas fa-chevron-right text-blue-200"></i>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete platform archive with all data, documentation, and rebuild scripts</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-purple-600 border-purple-200 hover:bg-purple-50"
                      onClick={handleDeduplicateThreats}
                    >
                      <div className="flex items-center">
                        <i className="fas fa-compress-arrows-alt text-purple-500 mr-3"></i>
                        <span className="text-sm font-medium">Merge Duplicate Threats</span>
                      </div>
                      <i className="fas fa-chevron-right text-gray-400"></i>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Combine similar threats from multiple vendors into single entries</p>
                  </TooltipContent>
                </Tooltip>
                
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={handleClearCache}
                  disabled={clearData.isPending}
                >
                  <div className="flex items-center">
                    <i className="fas fa-trash-alt text-cortex-blue mr-3"></i>
                    <span className="text-sm font-medium">
                      {clearData.isPending ? "Clearing..." : "Clear Cache"}
                    </span>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </Button>
                
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-cog text-cortex-blue mr-3"></i>
                    <span className="text-sm font-medium">Settings</span>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </Button>
                
                <div className="mt-4">
                  <ProductionDeploymentGenerator 
                    useCases={JSON.parse(localStorage.getItem('useCases') || '[]')}
                    contentLibrary={JSON.parse(localStorage.getItem('contentLibrary') || '[]')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
