import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ThreatIntelligenceService } from "./threat-intelligence";
import { createXSIAMClient, extractAllXSIAMData, type XSIAMInstance } from "./xsiam-api";
import { ThreatReportParser, RawThreatReportSchema } from "./threat-report-parser";
import { ContentGenerationEngine } from "./content-generation-engine";
import { SOCProcessEngine } from "./soc-process-engine";
import { ContentStorage } from "./content-storage";
import { DDLCWorkflowEngine } from "./ddlc-workflow-engine";
import { setupXSIAMProxy } from "./xsiam-proxy";
import { THREAT_SOURCES } from "@shared/threat-sources";
import { insertSharedTemplateSchema, insertTemplateRatingSchema, insertTemplateCommentSchema } from "@shared/schema";
import { ContentRecommendationEngine } from './content-recommendation-engine.js';
import { aiProviderManager } from './ai-providers.js';
import { exportToGitHub } from './github-export.js';
import { simpleGitHubBackup } from './simple-github-backup.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const threatIntelService = new ThreatIntelligenceService(THREAT_SOURCES);
  const threatParser = new ThreatReportParser();
  const contentEngine = ContentGenerationEngine.getInstance();
  const socEngine = SOCProcessEngine.getInstance();  
  const contentStorage = ContentStorage.getInstance();
  const ddlcEngine = DDLCWorkflowEngine.getInstance();
  const recommendationEngine = new ContentRecommendationEngine();
  
  // Initialize sample data
  await contentStorage.initializeSampleData();

  // Setup XSIAM proxy endpoints
  setupXSIAMProxy(app);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Get pre-ingested threats from ThreatResearchHub intelligence system
  app.get('/api/threats', async (req, res) => {
    try {
      // Get threats from the threat intelligence service
      let threats = await threatIntelService.getAllThreats();
      
      // If no threats available, provide sample threats for demo
      if (threats.length === 0) {
        threats = [
          {
            id: 'sample-threat-1',
            title: 'Critical Remote Code Execution in Apache Struts',
            description: 'A critical vulnerability allows remote code execution through crafted Content-Type headers in Apache Struts 6.1.2 and earlier versions.',
            summary: 'RCE vulnerability in Apache Struts affecting enterprise applications worldwide.',
            category: 'endpoint',
            severity: 'critical',
            source: 'ThreatResearchHub Sample',
            sourceId: 'sample',
            publishedDate: new Date().toISOString(),
            url: 'https://example.com/threat-1',
            confidence: 95,
            tlp: 'white',
            cves: ['CVE-2023-50164'],
            technologies: ['Apache Struts', 'Java'],
            vulnerabilityTypes: ['Remote Code Execution'],
            cvssScore: 9.8,
            exploitAvailable: true,
            threatActors: ['APT29', 'Lazarus Group'],
            indicators: {
              ips: ['192.168.1.100'],
              domains: ['malicious.example.com'],
              hashes: ['a1b2c3d4e5f6'],
              files: ['/usr/local/struts/exploit.jar']
            }
          },
          {
            id: 'sample-threat-2', 
            title: 'Microsoft Exchange ProxyShell Exploitation Campaign',
            description: 'Ongoing exploitation of Microsoft Exchange ProxyShell vulnerabilities targeting financial sector organizations.',
            summary: 'Active campaign targeting Exchange servers with ProxyShell vulnerabilities.',
            category: 'network',
            severity: 'high',
            source: 'ThreatResearchHub Sample',
            sourceId: 'sample',
            publishedDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            url: 'https://example.com/threat-2',
            confidence: 88,
            tlp: 'white',
            cves: ['CVE-2021-34473', 'CVE-2021-34523'],
            technologies: ['Microsoft Exchange', 'Windows Server'],
            vulnerabilityTypes: ['Authentication Bypass', 'Privilege Escalation'],
            cvssScore: 8.5,
            exploitAvailable: true,
            threatActors: ['HAFNIUM'],
            indicators: {
              ips: ['10.0.0.50'],
              domains: ['exchange-exploit.evil.com'],
              hashes: ['b2c3d4e5f6a1'],
              files: ['C:\\inetpub\\wwwroot\\aspnet_client\\shell.aspx']
            }
          }
        ];
      }
      
      // Convert to format expected by frontend
      const formattedThreats = threats.map((threat: any) => ({
        id: threat.id,
        title: threat.title,
        description: threat.description || threat.summary,
        category: threat.category || 'general',
        severity: threat.severity || 'medium',
        source: threat.source,
        sources: threat.sources || [{ vendor: threat.source, url: threat.url || '', title: threat.title }],
        cves: threat.cves || [],
        technologies: threat.technologies || [],
        vulnerabilityTypes: threat.vulnerabilityTypes || [],
        cvssScore: threat.cvssScore || 0,
        exploitAvailable: threat.exploitAvailable || false,
        createdAt: threat.createdAt || threat.publishedDate || new Date().toISOString(),
        url: threat.url,
        threatActors: threat.threatActors || []
      }));
      
      res.json(formattedThreats);
    } catch (error) {
      console.error('Error fetching pre-ingested threats:', error);
      res.status(500).json({ error: 'Failed to fetch threats' });
    }
  });

  // Check AI capabilities endpoint for graceful degradation
  app.get("/api/check-ai-capabilities", (req, res) => {
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
    
    if (hasAnthropicKey || hasOpenAiKey) {
      res.json({ 
        status: "available", 
        capabilities: {
          anthropic: hasAnthropicKey,
          openai: hasOpenAiKey
        }
      });
    } else {
      res.status(503).json({ 
        status: "unavailable", 
        message: "AI capabilities require API keys. Platform will use fallback demo mode." 
      });
    }
  });

  // Content Generation API Routes
  app.post("/api/content/parse-threat-report", async (req, res) => {
    try {
      const rawReport = RawThreatReportSchema.parse(req.body);
      const result = await threatParser.parseAndNormalize(rawReport);
      res.json(result);
    } catch (error) {
      console.error("Error parsing threat report:", error);
      res.status(400).json({ error: "Invalid threat report format or parsing failed" });
    }
  });

  app.post("/api/content/generate-xql-rule", async (req, res) => {
    try {
      const threat = req.body;
      const xqlRule = contentEngine.generateXQLCorrelationRule(threat);
      res.json(xqlRule);
    } catch (error) {
      console.error("Error generating XQL rule:", error);
      res.status(500).json({ error: "Failed to generate XQL correlation rule" });
    }
  });

  app.post("/api/content/generate-playbook", async (req, res) => {
    try {
      const threat = req.body;
      const playbook = contentEngine.generateAutomationPlaybook(threat);
      res.json(playbook);
    } catch (error) {
      console.error("Error generating playbook:", error);
      res.status(500).json({ error: "Failed to generate automation playbook" });
    }
  });

  app.post("/api/content/generate-alert-layout", async (req, res) => {
    try {
      const threat = req.body;
      const layout = contentEngine.generateAlertLayout(threat);
      res.json(layout);
    } catch (error) {
      console.error("Error generating alert layout:", error);
      res.status(500).json({ error: "Failed to generate alert layout" });
    }
  });

  app.post("/api/content/generate-dashboard", async (req, res) => {
    try {
      const threat = req.body;
      const dashboard = contentEngine.generateOperationalDashboard(threat);
      res.json(dashboard);
    } catch (error) {
      console.error("Error generating dashboard:", error);
      res.status(500).json({ error: "Failed to generate operational dashboard" });
    }
  });

  // SOC Process API Routes
  app.post("/api/soc/generate-process", async (req, res) => {
    try {
      const { threatType, severity } = req.body;
      const process = socEngine.generateSOCProcess(threatType, severity);
      res.json(process);
    } catch (error) {
      console.error("Error generating SOC process:", error);
      res.status(500).json({ error: "Failed to generate SOC process" });
    }
  });

  app.post("/api/soc/generate-workflow-diagram", async (req, res) => {
    try {
      const process = req.body;
      const diagram = socEngine.generateWorkflowDiagram(process);
      res.json(diagram);
    } catch (error) {
      console.error("Error generating workflow diagram:", error);
      res.status(500).json({ error: "Failed to generate workflow diagram" });
    }
  });

  app.post("/api/soc/generate-response-playbook", async (req, res) => {
    try {
      const { threatType, severity } = req.body;
      const playbook = socEngine.generateResponsePlaybook(threatType, severity);
      res.json(playbook);
    } catch (error) {
      console.error("Error generating response playbook:", error);
      res.status(500).json({ error: "Failed to generate response playbook" });
    }
  });

  // Export API Routes
  app.post("/api/export/stix2", async (req, res) => {
    try {
      const threat = req.body;
      const stixBundle = threatParser.exportToSTIX2(threat);
      res.json(stixBundle);
    } catch (error) {
      console.error("Error exporting to STIX2:", error);
      res.status(500).json({ error: "Failed to export to STIX2 format" });
    }
  });

  app.post("/api/export/use-case", async (req, res) => {
    try {
      const { threat, xqlRule, playbook } = req.body;
      const useCase = threatParser.exportUseCase(threat, xqlRule, playbook);
      res.json(useCase);
    } catch (error) {
      console.error("Error exporting use case:", error);
      res.status(500).json({ error: "Failed to export use case template" });
    }
  });

  // Content Package Management API Routes
  app.get("/api/content/packages", async (req, res) => {
    try {
      const { category, severity, ddlc_phase } = req.query;
      const packages = await contentStorage.listPackages({
        category: category as string,
        severity: severity as string,
        ddlc_phase: ddlc_phase as string
      });
      res.json(packages);
    } catch (error) {
      console.error("Error listing content packages:", error);
      res.status(500).json({ error: "Failed to list content packages" });
    }
  });

  app.get("/api/content/packages/:id", async (req, res) => {
    try {
      const pkg = await contentStorage.getPackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }
      res.json(pkg);
    } catch (error) {
      console.error("Error getting content package:", error);
      res.status(500).json({ error: "Failed to get content package" });
    }
  });

  app.post("/api/content/packages", async (req, res) => {
    try {
      const pkg = await contentStorage.storePackage(req.body);
      res.json(pkg);
    } catch (error) {
      console.error("Error storing content package:", error);
      res.status(500).json({ error: "Failed to store content package" });
    }
  });

  app.put("/api/content/packages/:id/ddlc-phase", async (req, res) => {
    try {
      const { phase, notes } = req.body;
      const pkg = await contentStorage.updateDDLCPhase(req.params.id, phase, notes);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }
      res.json(pkg);
    } catch (error) {
      console.error("Error updating DDLC phase:", error);
      res.status(500).json({ error: "Failed to update DDLC phase" });
    }
  });

  app.get("/api/content/statistics", async (req, res) => {
    try {
      const stats = await contentStorage.getContentStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error getting content statistics:", error);
      res.status(500).json({ error: "Failed to get content statistics" });
    }
  });

  app.get("/api/content/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const packages = await contentStorage.searchPackages(q as string);
      res.json(packages);
    } catch (error) {
      console.error("Error searching content packages:", error);
      res.status(500).json({ error: "Failed to search content packages" });
    }
  });

  // DDLC Workflow Management API Routes
  app.get("/api/ddlc/phases", async (req, res) => {
    try {
      const phases = ddlcEngine.getAllPhases();
      res.json(phases);
    } catch (error) {
      console.error("Error getting DDLC phases:", error);
      res.status(500).json({ error: "Failed to get DDLC phases" });
    }
  });

  app.get("/api/ddlc/phase/:phase", async (req, res) => {
    try {
      const phaseInfo = ddlcEngine.getPhaseInfo(req.params.phase);
      if (!phaseInfo) {
        return res.status(404).json({ error: "Phase not found" });
      }
      res.json(phaseInfo);
    } catch (error) {
      console.error("Error getting phase info:", error);
      res.status(500).json({ error: "Failed to get phase information" });
    }
  });

  app.post("/api/ddlc/transition/:packageId", async (req, res) => {
    try {
      const { packageId } = req.params;
      const { targetPhase, notes } = req.body;
      
      const pkg = await contentStorage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }

      const validation = ddlcEngine.canTransitionToPhase(pkg.ddlc_phase, targetPhase, pkg);
      if (!validation.allowed) {
        return res.status(400).json({
          error: "Phase transition not allowed",
          reason: validation.reason,
          missing_criteria: validation.missing_criteria
        });
      }

      const updatedPkg = await contentStorage.updateDDLCPhase(packageId, targetPhase, notes);
      res.json(updatedPkg);
    } catch (error) {
      console.error("Error transitioning DDLC phase:", error);
      res.status(500).json({ error: "Failed to transition DDLC phase" });
    }
  });

  app.get("/api/ddlc/checklist/:phase", async (req, res) => {
    try {
      const checklist = ddlcEngine.generatePhaseChecklist(req.params.phase);
      res.json(checklist);
    } catch (error) {
      console.error("Error generating checklist:", error);
      res.status(500).json({ error: "Failed to generate phase checklist" });
    }
  });

  app.get("/api/ddlc/progress/:packageId", async (req, res) => {
    try {
      const pkg = await contentStorage.getPackage(req.params.packageId);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }

      const progressReport = ddlcEngine.generateProgressReport(pkg);
      res.json(progressReport);
    } catch (error) {
      console.error("Error generating progress report:", error);
      res.status(500).json({ error: "Failed to generate progress report" });
    }
  });

  app.get("/api/ddlc/completion/:packageId/:phase", async (req, res) => {
    try {
      const { packageId, phase } = req.params;
      const pkg = await contentStorage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ error: "Content package not found" });
      }

      const completion = ddlcEngine.calculatePhaseCompletion(phase, pkg);
      res.json(completion);
    } catch (error) {
      console.error("Error calculating phase completion:", error);
      res.status(500).json({ error: "Failed to calculate phase completion" });
    }
  });

  app.post("/api/ddlc/transition-plan", async (req, res) => {
    try {
      const { fromPhase, toPhase } = req.body;
      const plan = ddlcEngine.generateTransitionPlan(fromPhase, toPhase);
      res.json(plan);
    } catch (error) {
      console.error("Error generating transition plan:", error);
      res.status(500).json({ error: "Failed to generate transition plan" });
    }
  });

  app.get("/api/ddlc/analytics", async (req, res) => {
    try {
      const analytics = await contentStorage.getDDLCAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error getting DDLC analytics:", error);
      res.status(500).json({ error: "Failed to get DDLC analytics" });
    }
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

  // Content Recommendations API endpoint - Multi-AI integration
  app.post("/api/content-recommendations", async (req, res) => {
    try {
      const { useCase } = req.body;
      
      if (!useCase) {
        return res.status(400).json({ error: "Use case is required" });
      }

      // Generate recommendations using multi-AI system
      const recommendations = await recommendationEngine.generateRecommendations(useCase);
      
      // Get available AI providers for client information
      const availableProviders = aiProviderManager.getAvailableProviders();
      
      res.json({ 
        recommendations,
        aiProviders: availableProviders,
        message: `Generated ${recommendations.length} recommendations using ${availableProviders.length > 0 ? availableProviders.join(' + ') : 'rule-based'} analysis`
      });
    } catch (error) {
      console.error('Error generating content recommendations:', error);
      res.status(500).json({ 
        error: 'Failed to generate recommendations',
        message: 'AI providers may be unavailable, falling back to rule-based recommendations'
      });
    }
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
      
      // Parse threat report content using the instance method
      const rawReport = {
        source: 'manual' as const,
        content,
        metadata: {
          upload_date: new Date().toISOString()
        }
      };
      
      const result = await threatParser.parseAndNormalize(rawReport);
      
      // Generate comprehensive lab build plan (simplified version)
      const labPlan = {
        id: `lab_${Date.now()}`,
        title: title || 'Threat Lab Build Plan',
        threat_report: result.normalized,
        components: ['Windows Workstation', 'Domain Controller', 'Network Monitoring'],
        steps: [
          { id: 1, name: 'Setup Virtual Infrastructure', status: 'pending' },
          { id: 2, name: 'Deploy Target Systems', status: 'pending' },
          { id: 3, name: 'Configure Monitoring', status: 'pending' }
        ],
        estimated_time: '4 hours',
        cost_estimate: '$200-500'
      };
      
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

  // GitHub Export endpoints - XSIAM Content Library Backup
  app.post("/api/github-export", async (req, res) => {
    try {
      const config = req.body;
      
      if (!config.token || !config.username || !config.repository) {
        return res.status(400).json({ 
          error: 'GitHub token, username, and repository are required' 
        });
      }

      console.log(`Starting XSIAM content library backup to ${config.username}/${config.repository}`);
      
      // Use simple GitHub backup for production XSIAM content library deployment
      const result = await simpleGitHubBackup({
        ...config,
        commitMessage: config.commitMessage || `XSIAM Content Library Update - ${new Date().toISOString()}`
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('GitHub export error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to export to GitHub' 
      });
    }
  });

  app.post("/api/github-export/test-connection", async (req, res) => {
    try {
      const { token, username, repository } = req.body;
      
      if (!token || !username || !repository) {
        return res.status(400).json({ 
          error: 'GitHub token, username, and repository are required' 
        });
      }

      // Test GitHub API connection
      const response = await fetch(`https://api.github.com/repos/${username}/${repository}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Repository not found or access denied');
      }
      
      const repoInfo = await response.json();
      
      res.json({
        success: true,
        repository: {
          name: repoInfo.name,
          description: repoInfo.description,
          private: repoInfo.private,
          stars: repoInfo.stargazers_count,
          watchers: repoInfo.watchers_count,
          forks: repoInfo.forks_count,
          defaultBranch: repoInfo.default_branch,
          lastPush: repoInfo.pushed_at
        }
      });
    } catch (error: any) {
      console.error('GitHub connection test error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to connect to GitHub repository' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
