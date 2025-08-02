// Security Tool Integration Interfaces - Modular "Lego Block" Architecture
import { z } from "zod";

// ===== BASE INTERFACES =====

export interface SecurityTool {
  id: string;
  name: string;
  category: SecurityToolCategory;
  vendor: string;
  version: string;
  capabilities: string[];
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastUpdated: Date;
}

export type SecurityToolCategory = 
  | 'siem' 
  | 'edr'
  | 'firewall' 
  | 'soar' 
  | 'asm'
  | 'attack_simulation';

// ===== SIEM/SECURITY PLATFORMS =====

export interface SIEMPlatform extends SecurityTool {
  category: 'siem';
  queryLanguage: string;
  dataRetention: string;
  logSources: string[];
  alertingCapabilities: string[];
}

export const SIEMConfig = z.object({
  platform: z.enum(['xsiam', 'splunk', 'sentinel', 'qradar', 'elastic', 'chronicle']),
  apiUrl: z.string().url(),
  apiKey: z.string(),
  tenant: z.string().optional(),
  queryLanguage: z.enum(['xql', 'spl', 'kql', 'aql', 'lucene', 'sql']),
  customFields: z.record(z.string()).optional()
});

export type SIEMConfigType = z.infer<typeof SIEMConfig>;

// ===== ENDPOINT DETECTION & RESPONSE =====

export interface EDRPlatform extends SecurityTool {
  category: 'edr';
  agentDeployment: 'cloud' | 'on-premise' | 'hybrid';
  supportedOS: string[];
  detectionCapabilities: string[];
}

export const EDRConfig = z.object({
  platform: z.enum(['cortex_xdr', 'crowdstrike', 'sentinelone', 'defender', 'carbon_black']),
  apiUrl: z.string().url(),
  apiKey: z.string(),
  orgId: z.string().optional(),
  agentVersion: z.string().optional(),
  customFields: z.record(z.string()).optional()
});

export type EDRConfigType = z.infer<typeof EDRConfig>;

// ===== FIREWALL/NETWORK SECURITY =====

export interface FirewallPlatform extends SecurityTool {
  category: 'firewall';
  deploymentType: 'hardware' | 'virtual' | 'cloud' | 'container';
  networkSegments: string[];
  securityPolicies: string[];
}

export const FirewallConfig = z.object({
  platform: z.enum(['palo_alto', 'checkpoint', 'fortinet', 'cisco_asa', 'juniper', 'sophos']),
  managementUrl: z.string().url(),
  apiKey: z.string(),
  deviceGroup: z.string().optional(),
  vsys: z.string().optional(),
  customFields: z.record(z.string()).optional()
});

export type FirewallConfigType = z.infer<typeof FirewallConfig>;

// ===== SECURITY ORCHESTRATION (SOAR) =====

export interface SOARPlatform extends SecurityTool {
  category: 'soar';
  workflowEngine: string;
  integrationCount: number;
  playbookTemplates: string[];
}

export const SOARConfig = z.object({
  platform: z.enum(['xsoar', 'phantom', 'resilient', 'swimlane', 'siemplify', 'insightconnect']),
  serverUrl: z.string().url(),
  apiKey: z.string(),
  instanceId: z.string().optional(),
  workspaceId: z.string().optional(),
  customFields: z.record(z.string()).optional()
});

export type SOARConfigType = z.infer<typeof SOARConfig>;

// ===== ATTACK SURFACE MANAGEMENT =====

export interface ASMPlatform extends SecurityTool {
  category: 'asm';
  discoveryMethods: string[];
  assetTypes: string[];
  riskScoring: string;
}

export const ASMConfig = z.object({
  platform: z.enum(['cortex_xpanse', 'censys', 'shodan', 'bitsight', 'riskrecon', 'cycognito']),
  apiUrl: z.string().url(),
  apiKey: z.string(),
  organizationId: z.string().optional(),
  scanScope: z.array(z.string()).optional(),
  customFields: z.record(z.string()).optional()
});

export type ASMConfigType = z.infer<typeof ASMConfig>;

// ===== ATTACK SIMULATION =====

export interface AttackSimPlatform extends SecurityTool {
  category: 'attack_simulation';
  simulationTypes: string[];
  mitreFramework: boolean;
  reportingFormats: string[];
}

export const AttackSimConfig = z.object({
  platform: z.enum(['breach_attack_sim', 'safebreach', 'cymulate', 'attackiq', 'verodin', 'scythe']),
  apiUrl: z.string().url(),
  apiKey: z.string(),
  campaignId: z.string().optional(),
  environmentId: z.string().optional(),
  customFields: z.record(z.string()).optional()
});

export type AttackSimConfigType = z.infer<typeof AttackSimConfig>;

// ===== UNIFIED SECURITY STACK =====

export interface SecurityStack {
  id: string;
  name: string;
  description: string;
  siem?: SIEMPlatform;
  edr?: EDRPlatform;
  firewall?: FirewallPlatform;
  soar?: SOARPlatform;
  asm?: ASMPlatform;
  attackSim?: AttackSimPlatform;
  integrationMappings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const SecurityStackConfig = z.object({
  name: z.string(),
  description: z.string(),
  siem: SIEMConfig.optional(),
  edr: EDRConfig.optional(),
  firewall: FirewallConfig.optional(),
  soar: SOARConfig.optional(),
  asm: ASMConfig.optional(),
  attackSim: AttackSimConfig.optional(),
  customIntegrations: z.record(z.any()).optional()
});

export type SecurityStackConfigType = z.infer<typeof SecurityStackConfig>;

// ===== QUERY MAPPING INTERFACES =====

export interface QueryMapping {
  sourceField: string;
  targetField: string;
  transformation?: 'uppercase' | 'lowercase' | 'timestamp' | 'custom';
  customTransform?: string;
}

export interface PlatformQueryTemplate {
  platform: string;
  queryLanguage: string;
  template: string;
  fieldMappings: QueryMapping[];
  requiredFields: string[];
  optionalFields: string[];
}

// ===== CONTENT GENERATION MAPPINGS =====

export interface ContentTemplate {
  id: string;
  name: string;
  type: 'correlation_rule' | 'playbook' | 'dashboard' | 'alert_layout';
  platform: string;
  template: string;
  fieldMappings: Record<string, string>;
  variables: Record<string, any>;
}

// ===== STANDARDIZED THREAT INTEL FORMAT =====

export interface StandardizedThreatIntel {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitreAttack: {
    tactics: string[];
    techniques: string[];
    mitigations: string[];
  };
  indicators: {
    type: 'ip' | 'domain' | 'hash' | 'url' | 'registry' | 'file';
    value: string;
    confidence: number;
  }[];
  platformQueries: Record<string, string>; // Platform-specific queries
  detectionRules: Record<string, any>; // Platform-specific rules
  playbooks: Record<string, any>; // Platform-specific playbooks
  source: string;
  timestamp: Date;
}

// ===== INTEGRATION STATUS =====

export interface IntegrationHealth {
  platform: string;
  category: SecurityToolCategory;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  latency: number;
  errorCount: number;
  uptime: number;
}