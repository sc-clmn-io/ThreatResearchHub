import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Generated XSIAM Content Storage
export const xsiamContent = pgTable("xsiam_content", {
  id: varchar("id").primaryKey().notNull(),
  contentType: varchar("content_type").notNull(), // 'correlation', 'playbook', 'alert_layout', 'dashboard'
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'endpoint', 'network', 'cloud', 'identity', 'web', 'email'
  severity: varchar("severity").notNull(), // 'critical', 'high', 'medium', 'low', 'info'
  threatName: varchar("threat_name").notNull(),
  
  // Content data stored as JSONB
  contentData: jsonb("content_data").notNull(), // The actual XQL, YAML, JSON content
  requirements: jsonb("requirements").notNull(), // Original wizard requirements
  metadata: jsonb("metadata"), // Additional metadata like MITRE mapping
  
  // Multi-Data Source Support
  dataSources: jsonb("data_sources").notNull(), // Array of data sources this content uses
  dataSourceMappings: jsonb("data_source_mappings"), // Field mappings between data sources
  
  // Export formats available
  formats: jsonb("formats").default([]), // ['json', 'yaml', 'xml'] - supported export formats
  
  // Status and tracking
  status: varchar("status").default("draft"), // 'draft', 'validated', 'published', 'deprecated'
  version: integer("version").default(1),
  isTemplate: boolean("is_template").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Collections for organizing related content
export const contentCollections = pgTable("content_collections", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  threatScenario: varchar("threat_scenario").notNull(),
  contentIds: jsonb("content_ids").default([]), // Array of xsiam_content.id
  
  // Export metadata
  totalItems: integer("total_items").default(0),
  lastExported: timestamp("last_exported"),
  exportCount: integer("export_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Standardized Use Case Definition Template
export const useCaseDefinitions = pgTable("use_case_definitions", {
  id: varchar("id").primaryKey().notNull(),
  
  // Security Outcome Definition
  securityOutcome: text("security_outcome").notNull(), // Primary goal: "Detect lateral movement", "Block malware", etc.
  threatScenario: text("threat_scenario").notNull(), // Complete threat scenario description
  successCriteria: jsonb("success_criteria").notNull(), // What constitutes success
  
  // Core use case data
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'endpoint', 'network', 'cloud', 'identity'
  severity: varchar("severity").notNull(), // 'critical', 'high', 'medium', 'low'
  
  // Source information (POV customer or threat report)
  sourceType: varchar("source_type").notNull(), // 'customer_pov', 'threat_report', 'threat_feed'
  sourceDetails: jsonb("source_details"), // Customer info or threat report details
  
  // Threat intelligence data
  cves: jsonb("cves").default([]), // Array of CVE IDs
  technologies: jsonb("technologies").default([]), // Affected technologies
  attackVectors: jsonb("attack_vectors").default([]), // MITRE ATT&CK techniques
  threatActors: jsonb("threat_actors").default([]), // Associated threat groups
  
  // Multi-Data Source Requirements
  dataSources: jsonb("data_sources").default([]), // Array of required data sources
  /*
  Data source structure:
  {
    category: "endpoint" | "network" | "cloud" | "identity" | "email" | "web" | "database",
    type: "Windows Event Logs" | "Sysmon" | "AWS CloudTrail" | "Azure AD" | "CrowdStrike" | "Palo Alto" | etc,
    fields: ["field1", "field2"], // Required fields for this data source
    priority: "critical" | "high" | "medium" | "low", // How important this data source is
    vendor: "Microsoft" | "AWS" | "Palo Alto" | "CrowdStrike" | etc,
    integration_method: "API" | "Syslog" | "Agent" | "Direct" | "Broker"
  }
  */
  
  // Infrastructure Requirements (Step-by-Step)
  infrastructureRequirements: jsonb("infrastructure_requirements").notNull(), // Detailed infrastructure needs
  dataSourceRequirements: jsonb("data_source_requirements").notNull(), // Required data sources and configuration
  
  // Workflow Progress Tracking
  currentStep: integer("current_step").default(1), // Current workflow step (1-6)
  stepStatus: jsonb("step_status").default({}), // Status of each step
  infrastructureDeployed: boolean("infrastructure_deployed").default(false),
  dataSourcesConfigured: boolean("data_sources_configured").default(false),
  xsiamIntegrated: boolean("xsiam_integrated").default(false),
  contentGenerated: boolean("content_generated").default(false),
  contentTested: boolean("content_tested").default(false),
  
  // Generated content tracking
  generatedContent: jsonb("generated_content").default({}), // Track what was generated: XQL, playbooks, etc.
  labConfiguration: jsonb("lab_configuration"), // Lab setup details if applicable
  
  // Activity tracking
  lastAccessed: timestamp("last_accessed").defaultNow(),
  workflowStarted: timestamp("workflow_started"),
  workflowCompleted: timestamp("workflow_completed"),
  exportCount: integer("export_count").default(0),
  
  // Retention policy (minimum 1 year)
  retentionDate: timestamp("retention_date"), // When eligible for cleanup (1+ year)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export History for tracking downloads and sharing
export const exportHistory = pgTable("export_history", {
  id: varchar("id").primaryKey().notNull(),
  contentId: varchar("content_id").references(() => xsiamContent.id),
  collectionId: varchar("collection_id").references(() => contentCollections.id),
  useCaseDefinitionId: varchar("use_case_definition_id").references(() => useCaseDefinitions.id),
  exportType: varchar("export_type").notNull(), // 'single', 'collection', 'bulk'
  format: varchar("format").notNull(), // 'json', 'yaml', 'zip'
  platform: varchar("platform"), // 'xsiam', 'xsoar', 'phantom', 'generic'
  
  // Export details
  filename: varchar("filename").notNull(),
  fileSize: integer("file_size"),
  downloadCount: integer("download_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Validation Queue for content review
export const contentValidation = pgTable("content_validation", {
  id: varchar("id").primaryKey().notNull(),
  contentId: varchar("content_id").references(() => xsiamContent.id),
  validationType: varchar("validation_type").notNull(), // 'syntax', 'logic', 'security', 'performance'
  status: varchar("status").default("pending"), // 'pending', 'approved', 'rejected', 'revision_needed'
  
  // Validation results
  validationResults: jsonb("validation_results"),
  reviewNotes: text("review_notes"),
  reviewerId: varchar("reviewer_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Type definitions
export type XSIAMContent = typeof xsiamContent.$inferSelect;
export type InsertXSIAMContent = typeof xsiamContent.$inferInsert;
export type ContentCollection = typeof contentCollections.$inferSelect;
export type InsertContentCollection = typeof contentCollections.$inferInsert;
export type ExportHistory = typeof exportHistory.$inferSelect;
export type UseCaseDefinition = typeof useCaseDefinitions.$inferSelect;
export type InsertUseCaseDefinition = typeof useCaseDefinitions.$inferInsert;
export type InsertExportHistory = typeof exportHistory.$inferInsert;
export type ContentValidation = typeof contentValidation.$inferSelect;
export type InsertContentValidation = typeof contentValidation.$inferInsert;

// Zod schemas for validation
export const insertXSIAMContentSchema = createInsertSchema(xsiamContent);
export const insertContentCollectionSchema = createInsertSchema(contentCollections);
export const insertExportHistorySchema = createInsertSchema(exportHistory);
export const insertContentValidationSchema = createInsertSchema(contentValidation);

// Legacy template schemas - temporarily added for compatibility
export const insertSharedTemplateSchema = z.object({
  name: z.string(),
  description: z.string(),
  templateData: z.any(),
});

export const insertTemplateRatingSchema = z.object({
  rating: z.number(),
  templateId: z.string(),
});

export const insertTemplateCommentSchema = z.object({
  comment: z.string(),
  templateId: z.string(),
});

// Content requirement types for wizard
export const ContentRequirementsSchema = z.object({
  threatName: z.string().min(1),
  category: z.enum(['endpoint', 'network', 'cloud', 'identity', 'web', 'email']),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  description: z.string().min(1),
  
  dataSources: z.object({
    primary: z.string().min(1),
    secondary: z.array(z.string()),
    required_fields: z.array(z.string()),
    optional_fields: z.array(z.string()),
  }),
  
  alertFields: z.array(z.object({
    field_name: z.string().min(1),
    field_type: z.enum(['string', 'number', 'array', 'object', 'boolean']),
    description: z.string().min(1),
    sample_value: z.string(),
    required: z.boolean(),
  })),
  
  mitreMapping: z.object({
    tactics: z.array(z.string()),
    techniques: z.array(z.string()),
    subtechniques: z.array(z.string()),
  }),
  
  responseActions: z.object({
    immediate: z.array(z.string()),
    investigation: z.array(z.string()),
    containment: z.array(z.string()),
    eradication: z.array(z.string()),
  }),
  
  workflow: z.object({
    priority_groups: z.array(z.string()),
    notification_methods: z.array(z.string()),
    escalation_criteria: z.array(z.string()),
    sla_requirements: z.string(),
  }),
  
  generateContent: z.object({
    correlation: z.boolean(),
    playbook: z.boolean(),
    alertLayout: z.boolean(),
    dashboard: z.boolean(),
  }),
});

export type ContentRequirements = z.infer<typeof ContentRequirementsSchema>;

// UseCase interface for DoR-based POV content generation
export interface UseCase {
  id: string;
  title: string;
  description: string;
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  threatReportId: string;
  estimatedDuration: string;
  mitreMapping: string[];
  indicators: string[];
  extractedTechniques: string[];
  extractedMitigations: string[];
  validated: boolean;
  validationStatus: 'needs_review' | 'approved' | 'rejected';
  metadata: {
    customerInfo?: any;
    technicalRequirements?: any;
    successCriteria?: any;
    timeline?: any;
    stakeholders?: any;
    entryDate?: string;
    povObjectives?: string[];
    source: 'threat_feed' | 'manual_entry' | 'pdf_upload' | 'url_scrape';
  };
  createdAt: Date;
  updatedAt: Date;
}

// Shared Template interface for template sharing functionality
export interface SharedTemplate {
  id: string;
  title: string;
  description?: string;
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  authorName: string;
  authorEmail?: string;
  downloadCount: number;
  ratingSum: number;
  ratingCount: number;
  templateData: any;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Infrastructure Connections table for storing real environment credentials
export const infrastructureConnections = pgTable("infrastructure_connections", {
  id: varchar("id").primaryKey().notNull(),
  connectionType: varchar("connection_type").notNull(), // 'docker', 'proxmox', 'azure', 'aws', 'gcp'
  name: varchar("name").notNull(), // User-friendly name for the connection
  
  // Connection details (encrypted)
  host: varchar("host"),
  port: integer("port"),
  username: varchar("username"),
  encryptedCredentials: text("encrypted_credentials"), // Encrypted passwords/keys
  
  // Platform-specific configuration
  configuration: jsonb("configuration").default({}), // Platform-specific settings
  
  // Connection status tracking
  status: varchar("status").default("disconnected"), // 'connected', 'disconnected', 'error'
  lastConnected: timestamp("last_connected"),
  lastError: text("last_error"),
  
  // XSIAM integration settings
  xsiamBrokerUrl: varchar("xsiam_broker_url"),
  xsiamApiKey: text("xsiam_api_key"),
  xsiamConfigured: boolean("xsiam_configured").default(false),
  
  // Deployment tracking
  activeDeployments: jsonb("active_deployments").default([]), // Array of deployment IDs
  totalDeployments: integer("total_deployments").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deployment tracking for actual infrastructure deployments
export const infrastructureDeployments = pgTable("infrastructure_deployments", {
  id: varchar("id").primaryKey().notNull(),
  connectionId: varchar("connection_id").references(() => infrastructureConnections.id).notNull(),
  useCaseId: varchar("use_case_id").references(() => useCaseDefinitions.id),
  
  // Deployment configuration
  deploymentType: varchar("deployment_type").notNull(), // 'endpoint', 'network', 'cloud', 'identity'
  platform: varchar("platform").notNull(), // 'docker', 'proxmox', 'azure'
  
  // Infrastructure details
  resourceDetails: jsonb("resource_details").notNull(), // VM IDs, container names, resource groups
  networkConfiguration: jsonb("network_configuration"), // IP addresses, ports, network settings
  
  // XSIAM integration
  xsiamIntegration: jsonb("xsiam_integration").default({}), // Log forwarding configuration
  logsFlowing: boolean("logs_flowing").default(false),
  lastLogReceived: timestamp("last_log_received"),
  
  // Deployment status
  status: varchar("status").default("deploying"), // 'deploying', 'deployed', 'error', 'terminated'
  deploymentStarted: timestamp("deployment_started").defaultNow(),
  deploymentCompleted: timestamp("deployment_completed"),
  
  // Configuration scripts and validation
  integrationScript: text("integration_script"), // Generated XSIAM integration script
  validationScript: text("validation_script"), // Generated validation script
  validationResults: jsonb("validation_results"), // Results from validation tests
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Additional type exports for compatibility
export type XsiamContent = XSIAMContent;
export type InsertXsiamContent = InsertXSIAMContent;
export type InfrastructureConnection = typeof infrastructureConnections.$inferSelect;
export type InsertInfrastructureConnection = typeof infrastructureConnections.$inferInsert;
export type InfrastructureDeployment = typeof infrastructureDeployments.$inferSelect;
export type InsertInfrastructureDeployment = typeof infrastructureDeployments.$inferInsert;