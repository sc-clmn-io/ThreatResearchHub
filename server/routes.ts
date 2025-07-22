import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ThreatIntelligenceService } from "./threat-intelligence";
import { createXSIAMClient, extractAllXSIAMData, type XSIAMInstance } from "./xsiam-api";
import { ThreatReportParser } from "./threat-report-parser";
import { THREAT_SOURCES } from "@shared/threat-sources";
import { insertSharedTemplateSchema, insertTemplateRatingSchema, insertTemplateCommentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize threat intelligence service
  const threatIntelService = new ThreatIntelligenceService(THREAT_SOURCES);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Note: This application is designed to be fully client-side
  // All data processing, storage, and business logic occurs in the browser
  // using IndexedDB for local storage and client-side processing libraries
  
  // The following endpoints could be added if server-side processing is needed:
  
  // app.post("/api/threat-reports", async (req, res) => {
  //   // Handle threat report processing if needed server-side
  // });
  
  // app.get("/api/threat-feeds/:feedId", async (req, res) => {
  //   // Proxy threat feed requests to avoid CORS issues
  // });
  
  // app.post("/api/validation", async (req, res) => {
  //   // Handle validation workflows if centralized validation is needed
  // });

  // Template Sharing Routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllSharedTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertSharedTemplateSchema.parse(req.body);
      const template = await storage.createSharedTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(400).json({ error: "Failed to create template" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getSharedTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/templates/:id/download", async (req, res) => {
    try {
      const template = await storage.getSharedTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      await storage.incrementTemplateDownload(req.params.id);
      res.json({ 
        message: "Template downloaded successfully",
        templateData: template.templateData
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      res.status(500).json({ error: "Failed to download template" });
    }
  });

  // Template Comments Routes
  app.get("/api/templates/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getTemplateCommentsByTemplate(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/templates/:id/comments", async (req, res) => {
    try {
      const validatedData = insertTemplateCommentSchema.parse({
        ...req.body,
        templateId: req.params.id
      });
      const comment = await storage.createTemplateComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ error: "Failed to create comment" });
    }
  });

  // Template Ratings Routes
  app.post("/api/templates/:id/ratings", async (req, res) => {
    try {
      const validatedData = insertTemplateRatingSchema.parse({
        ...req.body,
        templateId: req.params.id
      });
      const rating = await storage.createTemplateRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(400).json({ error: "Failed to create rating" });
    }
  });

  // Threat Intelligence API endpoints
  app.get("/api/threat-intelligence/sources", (req, res) => {
    const sources = THREAT_SOURCES.map(source => ({
      ...source,
      // Don't expose sensitive data like API keys
      authentication: source.authentication ? { type: source.authentication.type } : undefined
    }));
    res.json(sources);
  });

  app.get("/api/threat-intelligence/threats", async (req, res) => {
    try {
      const threats = await threatIntelService.getAllThreats();
      res.json(threats);
    } catch (error) {
      console.error('Error fetching threats:', error);
      res.status(500).json({ error: 'Failed to fetch threat intelligence' });
    }
  });

  app.get("/api/threat-intelligence/source/:sourceId/refresh", async (req, res) => {
    try {
      const sourceId = req.params.sourceId;
      const source = THREAT_SOURCES.find(s => s.id === sourceId);
      
      if (!source) {
        return res.status(404).json({ error: 'Source not found' });
      }

      const threats = await threatIntelService.fetchFromSource(source);
      res.json({ message: `Refreshed ${threats.length} threats from ${source.name}`, threats });
    } catch (error) {
      console.error('Error refreshing source:', error);
      res.status(500).json({ error: 'Failed to refresh threat source' });
    }
  });

  app.get("/api/threat-intelligence/status", (req, res) => {
    const status = threatIntelService.getSourceStatus();
    res.json(status);
  });

  // XSIAM Data Extraction API endpoints
  app.post("/api/xsiam/test-connection", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.testConnection();
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM connection test error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to test XSIAM connection' 
      });
    }
  });

  app.post("/api/xsiam/extract-marketplace", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.extractMarketplacePacks();
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM marketplace extraction error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to extract marketplace data' 
      });
    }
  });

  app.post("/api/xsiam/extract-onboarding", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      const client = createXSIAMClient(instance);
      const result = await client.extractOnboardingWizard();
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM onboarding extraction error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to extract onboarding data' 
      });
    }
  });

  app.post("/api/xsiam/extract-all", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      console.log(`Starting comprehensive XSIAM data extraction for ${instance.name}`);
      
      const result = await extractAllXSIAMData(instance);
      res.json({
        success: result.errors.length === 0,
        data: result,
        errors: result.errors
      });
    } catch (error: any) {
      console.error('XSIAM comprehensive extraction error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to extract XSIAM data' 
      });
    }
  });

  app.post("/api/xsiam/extract-content-pack/:packId", async (req, res) => {
    try {
      const instance: XSIAMInstance = req.body;
      const packId = req.params.packId;
      const client = createXSIAMClient(instance);
      const result = await client.extractContentPackDetails(packId);
      res.json(result);
    } catch (error: any) {
      console.error('XSIAM content pack extraction error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to extract content pack details' 
      });
    }
  });

  // Lab Build Planner API endpoints
  app.post("/api/lab-build-plan/generate", async (req, res) => {
    try {
      const { content, title } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Threat report content is required' });
      }

      console.log(`Generating lab build plan for: ${title || 'Untitled Report'}`);
      
      // Parse threat report content
      const threatReport = ThreatReportParser.parseThreatReport(content, title);
      
      // Generate comprehensive lab build plan
      const labPlan = ThreatReportParser.generateLabBuildPlan(threatReport);
      
      console.log(`Generated lab plan with ${labPlan.components.length} components and ${labPlan.steps.length} steps`);
      
      res.json(labPlan);
    } catch (error: any) {
      console.error('Lab build plan generation error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to generate lab build plan' 
      });
    }
  });

  app.post("/api/lab-build-plan/execute-step", async (req, res) => {
    try {
      const { stepId, planId } = req.body;
      
      if (!stepId || !planId) {
        return res.status(400).json({ error: 'Step ID and Plan ID are required' });
      }

      console.log(`Executing lab build step: ${stepId} for plan: ${planId}`);
      
      // In a real implementation, this would execute the actual deployment step
      // For now, we'll simulate the execution with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({
        success: true,
        stepId,
        status: 'completed',
        message: `Successfully executed step: ${stepId}`
      });
    } catch (error: any) {
      console.error('Lab step execution error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to execute lab step' 
      });
    }
  });

  app.get("/api/lab-build-plan/infrastructure-templates", async (req, res) => {
    try {
      // Return available infrastructure component templates
      const templates = {
        endpoints: [
          { name: 'Windows 10/11 Workstation', type: 'windows-workstation' },
          { name: 'Ubuntu Linux Workstation', type: 'ubuntu-workstation' },
          { name: 'macOS Workstation', type: 'macos-workstation' }
        ],
        servers: [
          { name: 'Windows Domain Controller', type: 'windows-dc' },
          { name: 'Ubuntu Linux Server', type: 'ubuntu-server' },
          { name: 'Exchange Server', type: 'exchange-server' }
        ],
        network: [
          { name: 'pfSense Firewall', type: 'pfsense-firewall' },
          { name: 'Suricata IDS', type: 'suricata-ids' },
          { name: 'ELK Stack', type: 'elk-stack' }
        ],
        cloud: [
          { name: 'AWS Lab Environment', type: 'aws-lab' },
          { name: 'Azure Lab Environment', type: 'azure-lab' },
          { name: 'Google Cloud Lab', type: 'gcp-lab' }
        ]
      };
      
      res.json(templates);
    } catch (error: any) {
      console.error('Infrastructure templates error:', error);
      res.status(500).json({ error: 'Failed to fetch infrastructure templates' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
