import axios from 'axios';

interface XSIAMHealthResponse {
  status: string;
  message?: string;
}

interface XSIAMDataSource {
  id: string;
  name: string;
  type: string;
  status: string;
}

export class XSIAMAPIDebugger {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL = 'https://demo-tenant.xdr.us.paloaltonetworks.com', apiKey = process.env.YOUR_XSIAM_API_KEY || '') {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private getHeaders(authFormat: 'bearer' | 'x-api-key' | 'api-key' | 'basic' = 'bearer') {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    switch (authFormat) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        break;
      case 'x-api-key':
        headers['X-API-Key'] = this.apiKey;
        break;
      case 'api-key':
        headers['API-Key'] = this.apiKey;
        break;
      case 'basic':
        headers['Authorization'] = this.apiKey;
        break;
    }

    return headers;
  }

  async testConnectivity(): Promise<any> {
    const authFormats: Array<'bearer' | 'x-api-key' | 'api-key' | 'basic'> = ['bearer', 'x-api-key', 'api-key', 'basic'];
    const results: any = {};

    for (const format of authFormats) {
      try {
        console.log(`Testing authentication format: ${format}`);
        
        const response = await axios.get(`${this.baseURL}/public_api/v1/health`, {
          headers: this.getHeaders(format),
          timeout: 10000,
          validateStatus: () => true // Accept any status code
        });

        results[format] = {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers['content-type']
        };

        console.log(`${format}: ${response.status} ${response.statusText}`);
        
      } catch (error: any) {
        results[format] = {
          error: error.message,
          code: error.code
        };
        console.log(`${format}: Error - ${error.message}`);
      }
    }

    return results;
  }

  async checkDataSources(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/public_api/v1/data_sources`, {
        headers: this.getHeaders('bearer'),
        timeout: 10000,
        validateStatus: () => true
      });

      return {
        status: response.status,
        data: response.data
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async searchKubernetesData(): Promise<any> {
    try {
      const xqlQuery = {
        query: "dataset = kubernetes_data | limit 5",
        timeframe: {
          relativeTime: "LAST_7_DAYS"
        }
      };

      const response = await axios.post(`${this.baseURL}/public_api/v1/xql/start_xql_query`, xqlQuery, {
        headers: this.getHeaders('bearer'),
        timeout: 15000,
        validateStatus: () => true
      });

      return {
        status: response.status,
        data: response.data
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async diagnoseConnectorIssues(): Promise<any> {
    console.log('=== XSIAM API DIAGNOSIS ===');
    
    const results = {
      connectivity: await this.testConnectivity(),
      dataSources: await this.checkDataSources(),
      kubernetesData: await this.searchKubernetesData(),
      expectedCluster: 'example-k8s-cluster',
      distributionId: 'EXAMPLE_DISTRIBUTION_ID',
      clusterUri: 'EXAMPLE_CLUSTER_URI'
    };

    console.log('Diagnosis complete. Results:', JSON.stringify(results, null, 2));
    return results;
  }
}

// Export for route usage
export default XSIAMAPIDebugger;