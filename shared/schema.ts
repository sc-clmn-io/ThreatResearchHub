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
  metadata: jsonb("metadata"), // Additional metadata like MITRE mapping, data sources
  
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

// Use Case History for tracking all platform activity for 1+ years
export const useCaseHistory = pgTable("use_case_history", {
  id: varchar("id").primaryKey().notNull(),
  
  // Core use case data
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'endpoint', 'network', 'cloud', 'identity'
  severity: varchar("severity").notNull(), // 'critical', 'high', 'medium', 'low'
  status: varchar("status").default("active"), // 'active', 'archived', 'completed'
  
  // Source information
  sourceType: varchar("source_type").notNull(), // 'threat_feed', 'manual_url', 'pdf_upload', 'bulk_processing'
  sourceVendor: varchar("source_vendor"), // 'Unit42', 'CISA', 'Mandiant', etc.
  sourceUrl: text("source_url"),
  
  // Threat intelligence data
  cves: jsonb("cves").default([]), // Array of CVE IDs
  technologies: jsonb("technologies").default([]), // Affected technologies
  attackVectors: jsonb("attack_vectors").default([]), // MITRE ATT&CK techniques
  threatActors: jsonb("threat_actors").default([]), // Associated threat groups
  
  // Generated content tracking
  generatedContent: jsonb("generated_content").default({}), // Track what was generated: XQL, playbooks, etc.
  workflowSteps: jsonb("workflow_steps").default([]), // Security operations workflow progress
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
  useCaseHistoryId: varchar("use_case_history_id").references(() => useCaseHistory.id),
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

// Additional type exports for compatibility
export type XsiamContent = XSIAMContent;
export type InsertXsiamContent = InsertXSIAMContent;