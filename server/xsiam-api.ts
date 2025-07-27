import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface XSIAMInstance {
  name: string;
  url: string;
  version: '2.x' | '3.x' | 'cortex-cloud';
  apiKey: string;
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
    this.client = axios.create({
      baseURL: instance.url,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${instance.apiKey}`,
        'Content-Type': 'application/json',
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
      const endpoint = this.getEndpoint('health');
      const response = await this.client.get(endpoint);
      
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
        health: '/api/v1/health',
        contentPacks: '/api/v1/content/packs',
        marketplace: '/api/v1/marketplace',
        integrations: '/api/v1/integrations',
        playbooks: '/api/v1/automation/playbooks',
        correlationRules: '/api/v1/analytics/correlation-rules',
        alertLayouts: '/api/v1/incident/layouts',
        dashboards: '/api/v1/dashboards',
        dataSources: '/api/v1/data-sources',
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