import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface XSIAMInstance {
  name: string;
  url: string;
  version: '2.x' | '3.x' | 'cortex-cloud';
  apiKey: string;
  keyId?: string;
  keyType?: 'Standard' | 'Advanced';
  description?: string;
}

export interface XSIAMApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class XSIAMApiClient {
  private client: AxiosInstance;
  private instance: XSIAMInstance;

  constructor(instance: XSIAMInstance) {
    this.instance = instance;
    
    // Ensure URL ends without trailing slash for proper endpoint construction
    const baseURL = instance.url.endsWith('/') ? instance.url.slice(0, -1) : instance.url;
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${instance.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ThreatResearchHub/1.0'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`XSIAM API Error (${instance.name}):`, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test connection to XSIAM instance
   */
  async testConnection(): Promise<XSIAMApiResponse> {
    try {
      // XSIAM V3.1 API endpoints for connection and content upload testing
      const testEndpoints = [
        '/public_api/v1/health',                     // XSIAM V3.1 public health endpoint
        '/public_api/v1/system/status',              // System status endpoint
        '/api/v1/analytics/correlation_rules',       // XQL Rules upload endpoint (V3.1)
        '/api/v1/automation/playbooks',              // Playbooks upload endpoint
        '/api/v1/incident_management/incident_layouts', // Alert layouts upload endpoint (V3.1)
        '/api/v1/dashboards',                        // Dashboards upload endpoint
        '/api/v1/content_management/packs',          // Content packs endpoint (V3.1)
        '/xql/start_xql_query',                      // XQL query endpoint for V3.1
        '/'                                          // Root endpoint
      ];

      console.log(`[XSIAM] Testing connection to: ${this.instance.url}`);
      console.log(`[XSIAM] API Key length: ${this.instance.apiKey?.length || 0} characters`);
      console.log(`[XSIAM] Key Type: ${this.instance.keyType || 'Not specified'}`);

      let lastError;
      for (const endpoint of testEndpoints) {
        try {
          const fullUrl = `${this.instance.url}${endpoint}`;
          console.log(`[XSIAM] Testing endpoint: ${fullUrl}`);
          
          const response = await this.client.get(endpoint, {
            timeout: 10000,
            validateStatus: (status) => status < 500 // Accept 4xx as valid responses for auth testing
          });

          // Check if this is a content upload endpoint and log availability
          if (endpoint.includes('/api/v1/')) {
            const endpointType = endpoint.split('/').pop() || 'unknown';
            console.log(`[XSIAM] Content endpoint ${endpointType}: Status ${response.status} - ${response.status === 200 ? 'Available' : response.status === 401 ? 'Auth Required' : 'Accessible'}`);
          }
          
          console.log(`[XSIAM] Success! Status: ${response.status}, Endpoint: ${endpoint}`);
          
          return {
            success: true,
            data: {
              message: `Connected successfully via ${endpoint}`,
              version: this.instance.version,
              url: this.instance.url,
              endpoint: endpoint,
              statusCode: response.status,
              capabilities: this.getAvailableCapabilities(),
              authStatus: response.status === 200 ? 'Authenticated' : response.status === 401 ? 'Authentication Required' : 'Accessible'
            },
            statusCode: response.status
          };
        } catch (error: any) {
          console.log(`[XSIAM] Failed endpoint ${endpoint}:`, error.code || error.message);
          lastError = error;
          continue;
        }
      }

      // If all endpoints failed, return detailed error
      console.log(`[XSIAM] All endpoints failed. Last error:`, lastError?.code || lastError?.message);
      return {
        success: false,
        error: this.formatConnectionError(lastError),
        statusCode: lastError?.response?.status
      };
    } catch (error: any) {
      console.log(`[XSIAM] Connection test failed:`, error);
      return {
        success: false,
        error: this.formatConnectionError(error),
        statusCode: error.response?.status
      };
    }
  }

  private formatConnectionError(error: any): string {
    if (error.code === 'ENOTFOUND') {
      return `DNS resolution failed - For XSIAM V3.1 upgraded from XDR, use: https://yourorg.xdr.us.paloaltonetworks.com`;
    }
    if (error.code === 'ECONNREFUSED') {
      return `Connection refused - Verify URL and network connectivity`;
    }
    if (error.response?.status === 401) {
      return `Authentication failed - Check API key permissions (Advanced API key required)`;
    }
    if (error.response?.status === 403) {
      return `Access denied - API key lacks required permissions`;
    }
    if (error.response?.status === 404) {
      return `Endpoint not found - Verify XSIAM version and URL format`;
    }
    
    return error.response?.data?.message || error.message || 'Connection failed';
  }

  private getAvailableCapabilities(): string[] {
    const capabilities = [];
    
    // Based on XSIAM version, determine what's available
    switch (this.instance.version) {
      case '3.x':
        capabilities.push('XQL Correlation Rules', 'Basic Playbooks', 'Data Source Config');
        break;
      case 'cortex-cloud':
        capabilities.push('XQL Correlation Rules', 'Advanced Playbooks', 'Alert Layouts', 'Dashboards');
        break;
      case '2.x':
        capabilities.push('XQL Correlation Rules', 'Limited API Support');
        break;
    }
    
    return capabilities;
  }

  /**
   * Extract marketplace content packs
   */
  async extractMarketplacePacks(): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('marketplace');
      const response = await this.client.get(endpoint, {
        params: {
          limit: 1000,
          include_metadata: true,
          include_dependencies: true
        }
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Upload XQL correlation rule to XSIAM
   */
  async uploadXQLRule(rule: any): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('correlationRules');
      const response = await this.client.post(endpoint, {
        name: rule.rule_name,
        query: rule.xql_query,
        severity: rule.severity,
        enabled: rule.enabled,
        description: rule.description
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Upload automation playbook to XSIAM
   */
  async uploadPlaybook(playbook: any): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('playbooks');
      const playbookData = typeof playbook === 'string' ? JSON.parse(playbook) : playbook;
      
      const response = await this.client.post(endpoint, {
        name: playbookData.name,
        tasks: playbookData.tasks,
        description: `Automated response playbook for ${playbookData.name}`
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Upload alert layout to XSIAM
   */
  async uploadAlertLayout(layout: any): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('alertLayouts');
      const response = await this.client.post(endpoint, {
        name: layout.layout_name,
        sections: layout.sections,
        type: 'incident'
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Upload dashboard to XSIAM
   */
  async uploadDashboard(dashboard: any): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('dashboards');
      const response = await this.client.post(endpoint, {
        name: dashboard.dashboard_name,
        widgets: dashboard.widgets,
        type: 'operational'
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Upload complete content package to XSIAM
   */
  async uploadContentPackage(contentPackage: any): Promise<XSIAMApiResponse> {
    const results = {
      xqlRule: null as XSIAMApiResponse | null,
      playbook: null as XSIAMApiResponse | null,
      alertLayout: null as XSIAMApiResponse | null,
      dashboard: null as XSIAMApiResponse | null,
      errors: [] as string[]
    };

    try {
      // Upload XQL Rule
      if (contentPackage.xqlRules) {
        results.xqlRule = await this.uploadXQLRule(contentPackage.xqlRules);
        if (!results.xqlRule.success) {
          results.errors.push(`XQL Rule: ${results.xqlRule.error}`);
        }
      }

      // Upload Playbook
      if (contentPackage.playbook) {
        results.playbook = await this.uploadPlaybook(contentPackage.playbook);
        if (!results.playbook.success) {
          results.errors.push(`Playbook: ${results.playbook.error}`);
        }
      }

      // Upload Alert Layout
      if (contentPackage.alertLayout) {
        results.alertLayout = await this.uploadAlertLayout(contentPackage.alertLayout);
        if (!results.alertLayout.success) {
          results.errors.push(`Alert Layout: ${results.alertLayout.error}`);
        }
      }

      // Upload Dashboard
      if (contentPackage.dashboard) {
        results.dashboard = await this.uploadDashboard(contentPackage.dashboard);
        if (!results.dashboard.success) {
          results.errors.push(`Dashboard: ${results.dashboard.error}`);
        }
      }

      const successCount = [results.xqlRule, results.playbook, results.alertLayout, results.dashboard]
        .filter(r => r?.success).length;

      return {
        success: results.errors.length === 0,
        data: {
          uploaded: successCount,
          total: 4,
          results,
          packageName: contentPackage.metadata?.name || 'Unknown Package'
        },
        error: results.errors.length > 0 ? results.errors.join('; ') : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: results
      };
    }
  }

  /**
   * Extract content pack details
   */
  async extractContentPackDetails(packId: string): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('contentPacks');
      const response = await this.client.get(`${endpoint}/${packId}`, {
        params: {
          include_integrations: true,
          include_playbooks: true,
          include_scripts: true,
          include_layouts: true
        }
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Extract onboarding wizard configurations
   */
  async extractOnboardingWizard(dataSourceType?: string): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('onboardingWizard');
      const response = await this.client.get(endpoint, {
        params: {
          data_source_type: dataSourceType,
          include_templates: true,
          include_validation_rules: true
        }
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Extract integration configurations
   */
  async extractIntegrations(): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('integrations');
      const response = await this.client.get(endpoint, {
        params: {
          include_configuration: true,
          include_commands: true,
          include_outputs: true
        }
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Extract playbooks
   */
  async extractPlaybooks(): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('playbooks');
      const response = await this.client.get(endpoint, {
        params: {
          include_tasks: true,
          include_conditions: true,
          include_metadata: true
        }
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Extract correlation rules
   */
  async extractCorrelationRules(): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('correlationRules');
      const response = await this.client.get(endpoint, {
        params: {
          include_xql_queries: true,
          include_metadata: true,
          include_mitre_mapping: true
        }
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Extract data source configurations
   */
  async extractDataSources(): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('dataSources');
      const response = await this.client.get(endpoint, {
        params: {
          include_parsing_rules: true,
          include_field_mappings: true,
          include_validation_rules: true
        }
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Get API endpoint based on XSIAM version
   */
  private getEndpoint(type: string): string {
    const endpoints = {
      '2.x': {
        health: '/api/health',
        contentPacks: '/content/packs',
        marketplace: '/content/marketplace',
        integrations: '/settings/integrations',
        playbooks: '/automation/playbooks',
        correlationRules: '/detection/correlation-rules',
        alertLayouts: '/incident/layouts',
        dashboards: '/dashboards',
        dataSources: '/settings/data-sources',
        onboardingWizard: '/onboarding/wizard'
      },
      '3.x': {
        health: '/public_api/v1/health',
        contentPacks: '/api/v1/content_management/packs',
        marketplace: '/api/v1/marketplace',
        integrations: '/api/v1/integrations',
        playbooks: '/api/v1/automation/playbooks',
        correlationRules: '/api/v1/analytics/correlation_rules',
        alertLayouts: '/api/v1/incident_management/incident_layouts',
        dashboards: '/api/v1/dashboards',
        dataSources: '/api/v1/data_sources',
        onboardingWizard: '/api/v1/onboarding/wizard'
      },
      'cortex-cloud': {
        health: '/cortex/api/health',
        contentPacks: '/cortex/api/content/packs',
        marketplace: '/cortex/api/marketplace',
        integrations: '/cortex/api/integrations',
        playbooks: '/cortex/api/automation/playbooks',
        correlationRules: '/cortex/api/analytics/rules',
        alertLayouts: '/cortex/api/incident/layouts',
        dashboards: '/cortex/api/dashboards',
        dataSources: '/cortex/api/data-sources',
        onboardingWizard: '/cortex/api/onboarding'
      }
    };

    return endpoints[this.instance.version][type as keyof typeof endpoints['2.x']] || '/api/unknown';
  }

  /**
   * Install content pack via API
   */
  async installContentPack(packData: any): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('contentPacks');
      const response = await this.client.post(`${endpoint}/install`, packData);

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Upload custom content pack
   */
  async uploadContentPack(packData: any): Promise<XSIAMApiResponse> {
    try {
      const endpoint = this.getEndpoint('contentPacks');
      const response = await this.client.post(`${endpoint}/upload`, packData);

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }
}

/**
 * Factory function to create XSIAM API client
 */
export function createXSIAMClient(instance: XSIAMInstance): XSIAMApiClient {
  return new XSIAMApiClient(instance);
}

/**
 * Comprehensive data extraction for a single XSIAM instance
 */
export async function extractAllXSIAMData(instance: XSIAMInstance): Promise<{
  marketplace: any;
  contentPacks: any[];
  onboardingWizard: any;
  integrations: any;
  playbooks: any;
  correlationRules: any;
  dataSources: any;
  errors: string[];
}> {
  const client = createXSIAMClient(instance);
  const results = {
    marketplace: null,
    contentPacks: [] as any[],
    onboardingWizard: null,
    integrations: null,
    playbooks: null,
    correlationRules: null,
    dataSources: null,
    errors: [] as string[]
  };

  try {
    // Test connection first
    const connectionTest = await client.testConnection();
    if (!connectionTest.success) {
      results.errors.push(`Connection failed: ${connectionTest.error}`);
      return results;
    }

    // Extract marketplace data
    const marketplaceResult = await client.extractMarketplacePacks();
    if (marketplaceResult.success) {
      results.marketplace = marketplaceResult.data;
    } else {
      results.errors.push(`Marketplace extraction failed: ${marketplaceResult.error}`);
    }

    // Extract onboarding wizard data
    const onboardingResult = await client.extractOnboardingWizard();
    if (onboardingResult.success) {
      results.onboardingWizard = onboardingResult.data;
    } else {
      results.errors.push(`Onboarding wizard extraction failed: ${onboardingResult.error}`);
    }

    // Extract integrations
    const integrationsResult = await client.extractIntegrations();
    if (integrationsResult.success) {
      results.integrations = integrationsResult.data;
    } else {
      results.errors.push(`Integrations extraction failed: ${integrationsResult.error}`);
    }

    // Extract playbooks
    const playbooksResult = await client.extractPlaybooks();
    if (playbooksResult.success) {
      results.playbooks = playbooksResult.data;
    } else {
      results.errors.push(`Playbooks extraction failed: ${playbooksResult.error}`);
    }

    // Extract correlation rules
    const correlationResult = await client.extractCorrelationRules();
    if (correlationResult.success) {
      results.correlationRules = correlationResult.data;
    } else {
      results.errors.push(`Correlation rules extraction failed: ${correlationResult.error}`);
    }

    // Extract data sources
    const dataSourcesResult = await client.extractDataSources();
    if (dataSourcesResult.success) {
      results.dataSources = dataSourcesResult.data;
    } else {
      results.errors.push(`Data sources extraction failed: ${dataSourcesResult.error}`);
    }

  } catch (error: any) {
    results.errors.push(`Unexpected error during extraction: ${error.message}`);
  }

  return results;
}