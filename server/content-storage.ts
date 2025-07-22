import { 
  xsiamContent, 
  contentCollections, 
  exportHistory,
  contentValidation,
  type XSIAMContent,
  type InsertXSIAMContent,
  type ContentCollection,
  type InsertContentCollection,
  type ContentRequirements 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as yaml from "js-yaml";

export interface IContentStorage {
  // XSIAM Content operations
  createContent(content: Omit<InsertXSIAMContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<XSIAMContent>;
  getContent(id: string): Promise<XSIAMContent | undefined>;
  getContentByType(contentType: string): Promise<XSIAMContent[]>;
  updateContent(id: string, updates: Partial<XSIAMContent>): Promise<XSIAMContent>;
  deleteContent(id: string): Promise<void>;
  
  // Collection operations
  createCollection(collection: Omit<InsertContentCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentCollection>;
  getCollection(id: string): Promise<ContentCollection | undefined>;
  getAllCollections(): Promise<ContentCollection[]>;
  addContentToCollection(collectionId: string, contentId: string): Promise<void>;
  
  // Export operations
  generateExportPackage(contentIds: string[], format: 'json' | 'yaml' | 'zip'): Promise<any>;
  getExportHistory(): Promise<any[]>;
  
  // Content generation from requirements
  generateContentFromRequirements(requirements: ContentRequirements): Promise<XSIAMContent[]>;
}

// In-memory storage for now, easily switchable to database
export class MemContentStorage implements IContentStorage {
  private content: Map<string, XSIAMContent> = new Map();
  private collections: Map<string, ContentCollection> = new Map();
  private exports: any[] = [];

  async createContent(contentData: Omit<InsertXSIAMContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<XSIAMContent> {
    const id = nanoid();
    const now = new Date();
    const content: XSIAMContent = {
      ...contentData,
      id,
      createdAt: now,
      updatedAt: now,
      description: contentData.description ?? null,
    };
    
    this.content.set(id, content);
    return content;
  }

  async getContent(id: string): Promise<XSIAMContent | undefined> {
    return this.content.get(id);
  }

  async getContentByType(contentType: string): Promise<XSIAMContent[]> {
    return Array.from(this.content.values()).filter(c => c.contentType === contentType);
  }

  async updateContent(id: string, updates: Partial<XSIAMContent>): Promise<XSIAMContent> {
    const existing = this.content.get(id);
    if (!existing) throw new Error('Content not found');
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.content.set(id, updated);
    return updated;
  }

  async deleteContent(id: string): Promise<void> {
    this.content.delete(id);
  }

  async createCollection(collectionData: Omit<InsertContentCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentCollection> {
    const id = nanoid();
    const now = new Date();
    const collection: ContentCollection = {
      ...collectionData,
      id,
      createdAt: now,
      updatedAt: now,
      description: collectionData.description ?? null,
    };
    
    this.collections.set(id, collection);
    return collection;
  }

  async getCollection(id: string): Promise<ContentCollection | undefined> {
    return this.collections.get(id);
  }

  async getAllCollections(): Promise<ContentCollection[]> {
    return Array.from(this.collections.values());
  }

  async addContentToCollection(collectionId: string, contentId: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) throw new Error('Collection not found');
    
    const contentIds = (collection.contentIds as string[]) || [];
    if (!contentIds.includes(contentId)) {
      contentIds.push(contentId);
      collection.contentIds = contentIds;
      collection.totalItems = contentIds.length;
      collection.updatedAt = new Date();
      this.collections.set(collectionId, collection);
    }
  }

  async generateExportPackage(contentIds: string[], format: 'json' | 'yaml' | 'zip'): Promise<any> {
    const contents = contentIds.map(id => this.content.get(id)).filter(Boolean) as XSIAMContent[];
    
    if (format === 'json') {
      return {
        export_metadata: {
          timestamp: new Date().toISOString(),
          platform: 'xsiam',
          content_count: contents.length,
          version: '1.0'
        },
        content: contents.map(c => ({
          id: c.id,
          type: c.contentType,
          name: c.name,
          category: c.category,
          severity: c.severity,
          data: c.contentData,
          requirements: c.requirements,
          metadata: c.metadata
        }))
      };
    }

    if (format === 'yaml') {
      return contents.map(c => yaml.dump({
        id: c.id,
        name: c.name,
        type: c.contentType,
        category: c.category,
        severity: c.severity,
        content: c.contentData,
        requirements: c.requirements
      })).join('\n---\n');
    }

    return contents; // Default return
  }

  async getExportHistory(): Promise<any[]> {
    return this.exports;
  }

  async generateContentFromRequirements(requirements: ContentRequirements): Promise<XSIAMContent[]> {
    const generatedContent: XSIAMContent[] = [];
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Generate XQL Correlation Rule
    if (requirements.generateContent.correlation) {
      const xqlQuery = this.generateXQLQuery(requirements);
      const correlation = await this.createContent({
        contentType: 'correlation',
        name: `${requirements.threatName} - Detection Rule`,
        description: `XQL correlation rule for detecting ${requirements.threatName}`,
        category: requirements.category,
        severity: requirements.severity,
        threatName: requirements.threatName,
        contentData: {
          rule_id: Date.now(),
          name: `ThreatResearchHub_${requirements.threatName.replace(/[^\w]/g, '_')}`,
          severity: this.mapSeverityToXSIAM(requirements.severity),
          xql_query: xqlQuery,
          is_enabled: true,
          description: requirements.description,
          alert_name: `ThreatResearchHub Alert: ${requirements.threatName}`,
          alert_category: "MALWARE",
          alert_description: requirements.description,
          alert_domain: "DOMAIN_HUNTING",
          execution_mode: "SCHEDULED",
          search_window: "1 hours",
          simple_schedule: "1 hour",
          timezone: "UTC",
          suppression_enabled: true,
          suppression_duration: "1 hours",
          suppression_fields: requirements.alertFields.filter(f => f.required).map(f => f.field_name)
        },
        requirements: requirements,
        metadata: {
          data_sources: [requirements.dataSources.primary, ...requirements.dataSources.secondary],
          alert_fields: requirements.alertFields,
          mitre_mapping: requirements.mitreMapping
        },
        formats: ['json'],
        status: 'draft',
        version: 1,
        isTemplate: false
      });
      generatedContent.push(correlation);
    }

    // Generate XSIAM Playbook
    if (requirements.generateContent.playbook) {
      const playbookYaml = this.generatePlaybookYAML(requirements);
      const playbook = await this.createContent({
        contentType: 'playbook',
        name: `${requirements.threatName} - Response Playbook`,
        description: `Automated response playbook for ${requirements.threatName}`,
        category: requirements.category,
        severity: requirements.severity,
        threatName: requirements.threatName,
        contentData: playbookYaml,
        requirements: requirements,
        metadata: {
          response_actions: requirements.responseActions,
          workflow_config: requirements.workflow,
          priority_groups: requirements.workflow.priority_groups
        },
        formats: ['yaml'],
        status: 'draft',
        version: 1,
        isTemplate: false
      });
      generatedContent.push(playbook);
    }

    // Generate Alert Layout
    if (requirements.generateContent.alertLayout) {
      const alertLayout = this.generateAlertLayout(requirements);
      const layout = await this.createContent({
        contentType: 'alert_layout',
        name: `${requirements.threatName} - Alert Layout`,
        description: `Custom alert layout for ${requirements.threatName}`,
        category: requirements.category,
        severity: requirements.severity,
        threatName: requirements.threatName,
        contentData: alertLayout,
        requirements: requirements,
        metadata: {
          alert_fields: requirements.alertFields,
          data_sources: [requirements.dataSources.primary, ...requirements.dataSources.secondary]
        },
        formats: ['json'],
        status: 'draft',
        version: 1,
        isTemplate: false
      });
      generatedContent.push(layout);
    }

    // Generate Dashboard
    if (requirements.generateContent.dashboard) {
      const dashboard = this.generateDashboard(requirements);
      const dashboardContent = await this.createContent({
        contentType: 'dashboard',
        name: `${requirements.threatName} - Analytics Dashboard`,
        description: `Security analytics dashboard for ${requirements.threatName}`,
        category: requirements.category,
        severity: requirements.severity,
        threatName: requirements.threatName,
        contentData: dashboard,
        requirements: requirements,
        metadata: {
          data_sources: [requirements.dataSources.primary, ...requirements.dataSources.secondary],
          kpis: ['detection_rate', 'response_time', 'false_positives']
        },
        formats: ['json'],
        status: 'draft',
        version: 1,
        isTemplate: false
      });
      generatedContent.push(dashboardContent);
    }

    return generatedContent;
  }

  private generateXQLQuery(requirements: ContentRequirements): string {
    const primaryDataSource = requirements.dataSources.primary;
    const requiredFields = requirements.dataSources.required_fields.join(', ');
    const alertFields = requirements.alertFields.map(f => f.field_name).join(', ');
    
    return `config case_sensitive = false
| dataset = ${primaryDataSource}
| filter ${requirements.dataSources.required_fields[0] || 'action_remote_ip'} != null
| fields _time, ${alertFields}
| alter threat_name = "${requirements.threatName}"
| alter severity = "${requirements.severity}"
// Additional filtering logic based on ${requirements.description}`;
  }

  private generatePlaybookYAML(requirements: ContentRequirements): any {
    return {
      id: `threatresearchhub-${requirements.threatName.toLowerCase().replace(/[^\w]/g, '-')}`,
      version: 1,
      vcShouldKeepItemLegacyProdMachine: false,
      name: `${requirements.threatName} - Response Playbook`,
      description: requirements.description,
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
          view: JSON.stringify({ position: { x: 450, y: 50 } }),
          note: false,
          timertriggers: [],
          ignoreworker: false
        },
        "1": {
          id: "1",
          taskid: "investigate-threat-001",
          type: "regular",
          task: {
            id: "investigate-threat-001",
            version: -1,
            name: `Investigate ${requirements.threatName}`,
            description: `Automated investigation for ${requirements.threatName} threat`,
            script: "Builtin|||setAlert",
            type: "regular",
            iscommand: true,
            brand: "Builtin"
          },
          scriptarguments: {
            status: { simple: "Under Investigation" },
            severity: { simple: requirements.severity }
          },
          nexttasks: {
            "#none#": ["2"]
          },
          separatecontext: false
        },
        "2": {
          id: "2",
          taskid: "response-actions-001",
          type: "condition",
          task: {
            id: "response-actions-001",
            version: -1,
            name: "Determine Response Actions",
            type: "condition"
          },
          conditions: requirements.workflow.priority_groups.map((group, index) => ({
            label: group,
            condition: [[{
              left: { value: `alert.priority_group.[0]`, iscontext: true },
              operator: "isEqualString",
              right: { value: group }
            }]]
          }))
        }
      },
      view: JSON.stringify({
        linkLabelsPosition: {},
        paper: {
          dimensions: { height: 1200, width: 1000, x: 0, y: 0 }
        }
      })
    };
  }

  private generateAlertLayout(requirements: ContentRequirements): any {
    return {
      TypeName: `${requirements.threatName.replace(/[^\w]/g, '')}Alert`,
      kind: "edit",
      metadata: {
        name: `${requirements.threatName} Alert Layout`,
        description: requirements.description,
        category: requirements.category
      },
      tabs: [
        {
          id: "investigation",
          name: "Investigation",
          sections: [
            {
              name: "Alert Details",
              fields: requirements.alertFields.map(field => ({
                fieldName: field.field_name,
                displayName: field.description,
                type: field.field_type,
                required: field.required
              }))
            },
            {
              name: "Threat Context",
              fields: [
                { fieldName: "threat_name", displayName: "Threat Name", type: "string" },
                { fieldName: "severity", displayName: "Severity", type: "string" },
                { fieldName: "category", displayName: "Category", type: "string" }
              ]
            }
          ]
        },
        {
          id: "response",
          name: "Response Actions",
          sections: [
            {
              name: "Immediate Actions",
              fields: requirements.responseActions.immediate.map((action, index) => ({
                fieldName: `immediate_action_${index}`,
                displayName: action,
                type: "string"
              }))
            }
          ]
        }
      ]
    };
  }

  private generateDashboard(requirements: ContentRequirements): any {
    return {
      id: `threatresearchhub-${requirements.threatName.toLowerCase().replace(/[^\w]/g, '-')}-dashboard`,
      name: `${requirements.threatName} Analytics Dashboard`,
      description: requirements.description,
      widgets: [
        {
          id: "threat-overview",
          type: "single-value",
          name: "Total Threats Detected",
          query: `dataset = ${requirements.dataSources.primary} | filter threat_name = "${requirements.threatName}" | comp count() as total_threats`,
          visualization: { type: "single-value", color: this.getSeverityColor(requirements.severity) }
        },
        {
          id: "severity-breakdown",
          type: "pie-chart",
          name: "Severity Distribution",
          query: `dataset = ${requirements.dataSources.primary} | comp count() by severity`,
          visualization: { type: "pie-chart" }
        },
        {
          id: "timeline",
          type: "line-chart",
          name: "Threat Detection Timeline",
          query: `dataset = ${requirements.dataSources.primary} | filter threat_name = "${requirements.threatName}" | timechart count() by _time`,
          visualization: { type: "line-chart" }
        },
        {
          id: "top-affected-hosts",
          type: "table",
          name: "Top Affected Hosts",
          query: `dataset = ${requirements.dataSources.primary} | comp count() by agent_hostname | sort count desc | head 10`,
          visualization: { type: "table" }
        }
      ],
      timeframe: { relative: "7d" },
      refreshRate: "5m"
    };
  }

  private mapSeverityToXSIAM(severity: string): string {
    switch (severity) {
      case 'critical': return 'SEV_040_HIGH';
      case 'high': return 'SEV_030_MEDIUM';
      case 'medium': return 'SEV_020_LOW';
      case 'low': return 'SEV_010_INFO';
      default: return 'SEV_020_LOW';
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  }
}

export const contentStorage = new MemContentStorage();