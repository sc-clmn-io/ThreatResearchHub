import type { Express } from "express";
import { securityStackManager } from './security-stack-manager';
import { contentOrchestrator } from './content-generation-orchestrator';
import { SecurityStackConfig } from '@shared/security-integrations';
import { z } from 'zod';

export function registerRoutes(app: Express) {
  // ===== EXISTING ROUTES =====
  
  // Add your existing routes here...

  // ===== SECURITY STACK MANAGEMENT =====

  // Create and configure a new security stack
  app.post('/api/security-stack', async (req, res) => {
  try {
    const stackData = SecurityStackConfig.parse(req.body);
    const stack = await securityStackManager.createSecurityStack(stackData);
    
    res.json({
      success: true,
      data: stack,
      message: 'Security stack created successfully'
    });
  } catch (error) {
    console.error('[API] Error creating security stack:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create security stack'
    });
  }
});

  // Get current active security stack
  app.get('/api/security-stack', async (req, res) => {
  try {
    const activeStack = securityStackManager.getActiveStack();
    
    res.json({
      success: true,
      data: activeStack
    });
  } catch (error) {
    console.error('[API] Error getting security stack:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security stack'
    });
  }
});

  // Test connections for all configured platforms
  app.post('/api/security-stack/health-check', async (req, res) => {
  try {
    await securityStackManager.performHealthCheck();
    const healthStatus = securityStackManager.getIntegrationHealth();
    
    res.json({
      success: true,
      data: Object.fromEntries(healthStatus)
    });
  } catch (error) {
    console.error('[API] Error performing health check:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// ===== PLATFORM OPERATIONS =====

  // Execute query on configured SIEM platform
  app.post('/api/security-stack/query', async (req, res) => {
  try {
    const { query, platform } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const result = await securityStackManager.executeQuery(query, platform);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[API] Error executing query:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Query execution failed'
    });
  }
});

  // Create detection rule on configured SIEM platform
  app.post('/api/security-stack/detection-rule', async (req, res) => {
  try {
    const ruleConfig = req.body;
    const result = await securityStackManager.createDetectionRule(ruleConfig);
    
    res.json({
      success: true,
      data: result,
      message: 'Detection rule created successfully'
    });
  } catch (error) {
    console.error('[API] Error creating detection rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Detection rule creation failed'
    });
  }
});

  // Trigger playbook on configured SOAR platform
  app.post('/api/security-stack/playbook', async (req, res) => {
  try {
    const { playbookId, parameters } = req.body;
    
    if (!playbookId) {
      return res.status(400).json({
        success: false,
        error: 'Playbook ID is required'
      });
    }
    
    const result = await securityStackManager.triggerPlaybook(playbookId, parameters || {});
    
    res.json({
      success: true,
      data: result,
      message: 'Playbook triggered successfully'
    });
  } catch (error) {
    console.error('[API] Error triggering playbook:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Playbook execution failed'
    });
  }
});

// ===== CONTENT GENERATION =====

// Generate platform-specific content from threat intelligence
app.post('/api/security-stack/generate-content', async (req, res) => {
  try {
    const { threatIntel } = req.body;
    const activeStack = securityStackManager.getActiveStack();
    
    if (!activeStack) {
      return res.status(400).json({
        success: false,
        error: 'No active security stack configured'
      });
    }
    
    if (!threatIntel) {
      return res.status(400).json({
        success: false,
        error: 'Threat intelligence data is required'
      });
    }
    
    const generatedContent = await contentOrchestrator.generatePlatformContent(
      threatIntel,
      activeStack
    );
    
    res.json({
      success: true,
      data: generatedContent,
      message: 'Platform-specific content generated successfully'
    });
  } catch (error) {
    console.error('[API] Error generating content:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Content generation failed'
    });
  }
});

// ===== PLATFORM DISCOVERY =====

// Get available platforms for each category
app.get('/api/security-stack/platforms', async (req, res) => {
  try {
    const platforms = {
      siem: [
        { id: 'xsiam', name: 'Cortex XSIAM', vendor: 'Palo Alto Networks', queryLanguage: 'XQL' },
        { id: 'splunk', name: 'Splunk Enterprise', vendor: 'Splunk', queryLanguage: 'SPL' },
        { id: 'sentinel', name: 'Microsoft Sentinel', vendor: 'Microsoft', queryLanguage: 'KQL' },
        { id: 'qradar', name: 'IBM QRadar', vendor: 'IBM', queryLanguage: 'AQL' },
        { id: 'elastic', name: 'Elastic Security', vendor: 'Elastic', queryLanguage: 'Lucene' },
        { id: 'chronicle', name: 'Google Chronicle', vendor: 'Google', queryLanguage: 'YARA-L' }
      ],
      edr: [
        { id: 'cortex_xdr', name: 'Cortex XDR', vendor: 'Palo Alto Networks' },
        { id: 'crowdstrike', name: 'CrowdStrike Falcon', vendor: 'CrowdStrike' },
        { id: 'sentinelone', name: 'SentinelOne', vendor: 'SentinelOne' },
        { id: 'defender', name: 'Microsoft Defender', vendor: 'Microsoft' },
        { id: 'carbon_black', name: 'Carbon Black', vendor: 'VMware' }
      ],
      firewall: [
        { id: 'palo_alto', name: 'PAN-OS', vendor: 'Palo Alto Networks' },
        { id: 'checkpoint', name: 'Check Point', vendor: 'Check Point' },
        { id: 'fortinet', name: 'FortiGate', vendor: 'Fortinet' },
        { id: 'cisco_asa', name: 'Cisco ASA', vendor: 'Cisco' },
        { id: 'juniper', name: 'Juniper SRX', vendor: 'Juniper' },
        { id: 'sophos', name: 'Sophos XG', vendor: 'Sophos' }
      ],
      soar: [
        { id: 'xsoar', name: 'Cortex XSOAR', vendor: 'Palo Alto Networks' },
        { id: 'phantom', name: 'Splunk Phantom', vendor: 'Splunk' },
        { id: 'resilient', name: 'IBM Resilient', vendor: 'IBM' },
        { id: 'swimlane', name: 'Swimlane', vendor: 'Swimlane' },
        { id: 'siemplify', name: 'Google Siemplify', vendor: 'Google' },
        { id: 'insightconnect', name: 'InsightConnect', vendor: 'Rapid7' }
      ],
      asm: [
        { id: 'cortex_xpanse', name: 'Cortex Xpanse', vendor: 'Palo Alto Networks' },
        { id: 'censys', name: 'Censys', vendor: 'Censys' },
        { id: 'shodan', name: 'Shodan', vendor: 'Shodan' },
        { id: 'bitsight', name: 'BitSight', vendor: 'BitSight' },
        { id: 'riskrecon', name: 'RiskRecon', vendor: 'Mastercard' },
        { id: 'cycognito', name: 'CyCognito', vendor: 'CyCognito' }
      ],
      attack_simulation: [
        { id: 'breach_attack_sim', name: 'Breach & Attack Simulation', vendor: 'XM Cyber' },
        { id: 'safebreach', name: 'SafeBreach', vendor: 'SafeBreach' },
        { id: 'cymulate', name: 'Cymulate', vendor: 'Cymulate' },
        { id: 'attackiq', name: 'AttackIQ', vendor: 'AttackIQ' },
        { id: 'verodin', name: 'Verodin', vendor: 'Mandiant' },
        { id: 'scythe', name: 'SCYTHE', vendor: 'SCYTHE' }
      ]
    };
    
    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    console.error('[API] Error getting platforms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform information'
    });
  }
});

  // ===== GITHUB EXPORT =====
  
  // Export content library to GitHub
  app.post('/api/github-export', async (req, res) => {
    try {
      const { token, username, repository, branch = 'main', commitMessage } = req.body;
      
      if (!token || !username || !repository || !commitMessage) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: token, username, repository, commitMessage'
        });
      }

      // Import the GitHub export functionality
      const { simpleGitHubBackup } = await import('./simple-github-backup.js');
      
      const result = await simpleGitHubBackup({
        token,
        username,
        repository,
        branch,
        commitMessage
      });

      res.json(result);
    } catch (error) {
      console.error('[API] GitHub export error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'GitHub export failed'
      });
    }
  });

  // ===== SECURITY STACK MANAGEMENT =====

  // Create and configure a new security stack
  app.post('/api/security-stack', async (req, res) => {
    try {
      const stackData = SecurityStackConfig.parse(req.body);
      const stack = await securityStackManager.createSecurityStack(stackData);
      
      res.json({
        success: true,
        data: stack,
        message: 'Security stack created successfully'
      });
    } catch (error) {
      console.error('[API] Error creating security stack:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create security stack'
      });
    }
  });

  // Get current active security stack
  app.get('/api/security-stack', async (req, res) => {
    try {
      const activeStack = securityStackManager.getActiveStack();
      
      res.json({
        success: true,
        data: activeStack
      });
    } catch (error) {
      console.error('[API] Error getting security stack:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security stack'
      });
    }
  });

  // Test connections for all configured platforms
  app.post('/api/security-stack/health-check', async (req, res) => {
    try {
      await securityStackManager.performHealthCheck();
      const healthStatus = securityStackManager.getIntegrationHealth();
      
      res.json({
        success: true,
        data: Object.fromEntries(healthStatus)
      });
    } catch (error) {
      console.error('[API] Error performing health check:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  });

  // Execute query on configured SIEM platform
  app.post('/api/security-stack/query', async (req, res) => {
    try {
      const { query, platform } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
      }
      
      const result = await securityStackManager.executeQuery(query, platform);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[API] Error executing query:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    }
  });

  // Create detection rule on configured SIEM platform
  app.post('/api/security-stack/detection-rule', async (req, res) => {
    try {
      const ruleConfig = req.body;
      const result = await securityStackManager.createDetectionRule(ruleConfig);
      
      res.json({
        success: true,
        data: result,
        message: 'Detection rule created successfully'
      });
    } catch (error) {
      console.error('[API] Error creating detection rule:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Detection rule creation failed'
      });
    }
  });

  // Trigger playbook on configured SOAR platform
  app.post('/api/security-stack/playbook', async (req, res) => {
    try {
      const { playbookId, parameters } = req.body;
      
      if (!playbookId) {
        return res.status(400).json({
          success: false,
          error: 'Playbook ID is required'
        });
      }
      
      const result = await securityStackManager.triggerPlaybook(playbookId, parameters || {});
      
      res.json({
        success: true,
        data: result,
        message: 'Playbook triggered successfully'
      });
    } catch (error) {
      console.error('[API] Error triggering playbook:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Playbook execution failed'
      });
    }
  });

  // Generate platform-specific content from threat intelligence
  app.post('/api/security-stack/generate-content', async (req, res) => {
    try {
      const { threatIntel } = req.body;
      const activeStack = securityStackManager.getActiveStack();
      
      if (!activeStack) {
        return res.status(400).json({
          success: false,
          error: 'No active security stack configured'
        });
      }
      
      if (!threatIntel) {
        return res.status(400).json({
          success: false,
          error: 'Threat intelligence data is required'
        });
      }
      
      const generatedContent = await contentOrchestrator.generatePlatformContent(
        threatIntel,
        activeStack
      );
      
      res.json({
        success: true,
        data: generatedContent,
        message: 'Platform-specific content generated successfully'
      });
    } catch (error) {
      console.error('[API] Error generating content:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed'
      });
    }
  });

  // Get available platforms for each category
  app.get('/api/security-stack/platforms', async (req, res) => {
    try {
      const platforms = {
        siem: [
          { id: 'xsiam', name: 'Cortex XSIAM', vendor: 'Palo Alto Networks', queryLanguage: 'XQL' },
          { id: 'splunk', name: 'Splunk Enterprise', vendor: 'Splunk', queryLanguage: 'SPL' },
          { id: 'sentinel', name: 'Microsoft Sentinel', vendor: 'Microsoft', queryLanguage: 'KQL' },
          { id: 'qradar', name: 'IBM QRadar', vendor: 'IBM', queryLanguage: 'AQL' },
          { id: 'elastic', name: 'Elastic Security', vendor: 'Elastic', queryLanguage: 'Lucene' },
          { id: 'chronicle', name: 'Google Chronicle', vendor: 'Google', queryLanguage: 'YARA-L' }
        ],
        edr: [
          { id: 'cortex_xdr', name: 'Cortex XDR', vendor: 'Palo Alto Networks' },
          { id: 'crowdstrike', name: 'CrowdStrike Falcon', vendor: 'CrowdStrike' },
          { id: 'sentinelone', name: 'SentinelOne', vendor: 'SentinelOne' },
          { id: 'defender', name: 'Microsoft Defender', vendor: 'Microsoft' },
          { id: 'carbon_black', name: 'Carbon Black', vendor: 'VMware' }
        ],
        firewall: [
          { id: 'palo_alto', name: 'PAN-OS', vendor: 'Palo Alto Networks' },
          { id: 'checkpoint', name: 'Check Point', vendor: 'Check Point' },
          { id: 'fortinet', name: 'FortiGate', vendor: 'Fortinet' },
          { id: 'cisco_asa', name: 'Cisco ASA', vendor: 'Cisco' },
          { id: 'juniper', name: 'Juniper SRX', vendor: 'Juniper' },
          { id: 'sophos', name: 'Sophos XG', vendor: 'Sophos' }
        ],
        soar: [
          { id: 'xsoar', name: 'Cortex XSOAR', vendor: 'Palo Alto Networks' },
          { id: 'phantom', name: 'Splunk Phantom', vendor: 'Splunk' },
          { id: 'resilient', name: 'IBM Resilient', vendor: 'IBM' },
          { id: 'swimlane', name: 'Swimlane', vendor: 'Swimlane' },
          { id: 'siemplify', name: 'Google Siemplify', vendor: 'Google' },
          { id: 'insightconnect', name: 'InsightConnect', vendor: 'Rapid7' }
        ],
        asm: [
          { id: 'cortex_xpanse', name: 'Cortex Xpanse', vendor: 'Palo Alto Networks' },
          { id: 'censys', name: 'Censys', vendor: 'Censys' },
          { id: 'shodan', name: 'Shodan', vendor: 'Shodan' },
          { id: 'bitsight', name: 'BitSight', vendor: 'BitSight' },
          { id: 'riskrecon', name: 'RiskRecon', vendor: 'Mastercard' },
          { id: 'cycognito', name: 'CyCognito', vendor: 'CyCognito' }
        ],
        attack_simulation: [
          { id: 'breach_attack_sim', name: 'Breach & Attack Simulation', vendor: 'XM Cyber' },
          { id: 'safebreach', name: 'SafeBreach', vendor: 'SafeBreach' },
          { id: 'cymulate', name: 'Cymulate', vendor: 'Cymulate' },
          { id: 'attackiq', name: 'AttackIQ', vendor: 'AttackIQ' },
          { id: 'verodin', name: 'Verodin', vendor: 'Mandiant' },
          { id: 'scythe', name: 'SCYTHE', vendor: 'SCYTHE' }
        ]
      };
      
      res.json({
        success: true,
        data: platforms
      });
    } catch (error) {
      console.error('[API] Error getting platforms:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get platform information'
      });
    }
  });

  return app;
}