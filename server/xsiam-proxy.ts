import express from 'express';
import axios from 'axios';

export function setupXSIAMProxy(app: express.Express) {
  // XSIAM API Proxy endpoint
  app.post('/api/xsiam-proxy', async (req, res) => {
    try {
      const { url, headers, method = 'GET', body } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate that this is an XSIAM/Cortex domain
      const allowedDomains = [
        'paloaltonetworks.com',
        'xdr.us.paloaltonetworks.com',
        'xdr.eu.paloaltonetworks.com',
        'xdr.jp.paloaltonetworks.com'
      ];

      const urlObj = new URL(url);
      const isAllowedDomain = allowedDomains.some(domain => 
        urlObj.hostname.endsWith(domain)
      );

      if (!isAllowedDomain) {
        return res.status(403).json({ 
          error: 'Only XSIAM/Cortex domains are allowed',
          domain: urlObj.hostname 
        });
      }

      // Make the request to XSIAM
      const config: any = {
        method: method.toUpperCase(),
        url,
        headers: {
          'User-Agent': 'ThreatResearchHub-XSIAM-Debugger/1.0',
          ...headers
        },
        timeout: 30000,
        validateStatus: () => true // Don't throw on HTTP error status
      };

      if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
        config.data = body;
      }

      console.log(`[XSIAM Proxy] ${method.toUpperCase()} ${url}`);
      
      const response = await axios(config);

      // Return the response with CORS headers
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-xdr-auth-id'
      });

      res.status(response.status).json({
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (error) {
      console.error('[XSIAM Proxy] Error:', error);
      
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          error: 'XSIAM API request failed',
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // XSIAM Content Validation endpoint
  app.post('/api/xsiam-validate', async (req, res) => {
    try {
      const { contentType, content } = req.body;

      if (!contentType || !content) {
        return res.status(400).json({ error: 'Content type and content are required' });
      }

      let validationResult = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[]
      };

      // Basic validation based on content type
      switch (contentType) {
        case 'correlation':
          validationResult = validateCorrelationRule(content);
          break;
        case 'playbook':
          validationResult = validatePlaybook(content);
          break;
        case 'layout':
          validationResult = validateLayout(content);
          break;
        case 'dashboard':
          validationResult = validateDashboard(content);
          break;
        default:
          return res.status(400).json({ error: 'Unsupported content type' });
      }

      res.json(validationResult);

    } catch (error) {
      console.error('[XSIAM Validate] Error:', error);
      res.status(500).json({
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

function validateCorrelationRule(content: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse content if it's a string
    const rule = typeof content === 'string' ? JSON.parse(content) : content;

    // Required fields for XSIAM correlation rules
    const requiredFields = ['rule_name', 'description', 'query'];
    for (const field of requiredFields) {
      if (!rule[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate XQL query syntax (basic check)
    if (rule.query && typeof rule.query === 'string') {
      if (!rule.query.includes('dataset')) {
        warnings.push('XQL query should specify a dataset');
      }
      if (!rule.query.includes('filter')) {
        warnings.push('XQL query should include filter conditions');
      }
    }

    // Check MITRE ATT&CK mapping
    if (rule.mitre_defs && Object.keys(rule.mitre_defs).length === 0) {
      warnings.push('Consider adding MITRE ATT&CK technique mapping');
    }

  } catch (parseError) {
    errors.push('Invalid JSON format');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validatePlaybook(content: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const playbook = typeof content === 'string' ? JSON.parse(content) : content;

    // Required fields for XSIAM playbooks
    const requiredFields = ['name', 'description', 'tasks'];
    for (const field of requiredFields) {
      if (!playbook[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate tasks structure
    if (playbook.tasks) {
      if (typeof playbook.tasks !== 'object') {
        errors.push('Tasks must be an object');
      } else {
        const taskIds = Object.keys(playbook.tasks);
        if (taskIds.length === 0) {
          errors.push('Playbook must have at least one task');
        }

        // Check for start task
        if (!playbook.starttaskid) {
          warnings.push('Missing starttaskid field');
        }
      }
    }

  } catch (parseError) {
    errors.push('Invalid JSON/YAML format');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateLayout(content: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const layout = typeof content === 'string' ? JSON.parse(content) : content;

    // Required fields for XSIAM layouts
    const requiredFields = ['layout'];
    for (const field of requiredFields) {
      if (!layout[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate layout structure
    if (layout.layout && layout.layout.tabs) {
      if (!Array.isArray(layout.layout.tabs)) {
        errors.push('Layout tabs must be an array');
      } else if (layout.layout.tabs.length === 0) {
        warnings.push('Layout should have at least one tab');
      }
    }

  } catch (parseError) {
    errors.push('Invalid JSON format');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateDashboard(content: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const dashboard = typeof content === 'string' ? JSON.parse(content) : content;

    // Required fields for XSIAM dashboards
    const requiredFields = ['dashboard'];
    for (const field of requiredFields) {
      if (!dashboard[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate dashboard structure
    if (dashboard.dashboard && dashboard.dashboard.widgets) {
      if (!Array.isArray(dashboard.dashboard.widgets)) {
        errors.push('Dashboard widgets must be an array');
      } else if (dashboard.dashboard.widgets.length === 0) {
        warnings.push('Dashboard should have at least one widget');
      }
    }

  } catch (parseError) {
    errors.push('Invalid JSON format');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}