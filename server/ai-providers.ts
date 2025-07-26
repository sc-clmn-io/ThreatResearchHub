import OpenAI from 'openai';

export interface AIProvider {
  name: string;
  generateRecommendations(useCase: any): Promise<any>;
  generateXQLQuery(threat: any, dataSource: string): Promise<string>;
  analyzeAttackVectors(description: string): Promise<string[]>;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  name = 'OpenAI GPT-4o';

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateRecommendations(useCase: any) {
    const prompt = `Analyze this threat and provide XSIAM content recommendations:
Title: ${useCase.title}
Description: ${useCase.description}
Category: ${useCase.category}
CVEs: ${useCase.cves?.join(', ') || 'None'}
Technologies: ${useCase.technologies?.join(', ') || 'None'}

Provide JSON response with recommendations for XQL rules, playbooks, alert layouts, and dashboards.`;

    const response = await this.client.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async generateXQLQuery(threat: any, dataSource: string): Promise<string> {
    const prompt = `Generate a Cortex XQL query for this threat:
Threat: ${threat.title}
Data Source: ${dataSource}
CVEs: ${threat.cves?.join(', ') || 'None'}

Return only the XQL query, optimized for performance.`;

    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || '';
  }

  async analyzeAttackVectors(description: string): Promise<string[]> {
    const prompt = `Analyze this threat description and identify attack vectors:
${description}

Return a JSON array of attack vector names.`;

    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"vectors":[]}');
    return result.vectors || [];
  }
}

class GrokProvider implements AIProvider {
  private client: OpenAI;
  name = 'Grok-2 Vision';

  constructor(apiKey: string) {
    this.client = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey 
    });
  }

  async generateRecommendations(useCase: any) {
    const prompt = `As an expert in Cortex XSIAM and XQL, analyze this threat and provide comprehensive content recommendations:

Threat Details:
- Title: ${useCase.title}
- Description: ${useCase.description}
- Category: ${useCase.category}
- Severity: ${useCase.severity}
- CVEs: ${useCase.cves?.join(', ') || 'None'}
- Technologies: ${useCase.technologies?.join(', ') || 'None'}
- Attack Vectors: ${useCase.attackVectors?.join(', ') || 'None'}

Provide detailed JSON response with:
1. XQL correlation rules (optimized for performance)
2. Automation playbooks (with specific XSIAM actions)
3. Alert layouts (with relevant field mappings)
4. Operational dashboards (with KPIs and visualizations)
5. Data source requirements

Focus on practical, production-ready XSIAM content.`;

    const response = await this.client.chat.completions.create({
      model: "grok-2-vision-1212",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async generateXQLQuery(threat: any, dataSource: string): Promise<string> {
    const prompt = `Generate an optimized Cortex XQL query for threat detection:

Threat: ${threat.title}
Description: ${threat.description}
Data Source: ${dataSource}
CVEs: ${threat.cves?.join(', ') || 'None'}
Technologies: ${threat.technologies?.join(', ') || 'None'}

Requirements:
- Use proper XQL syntax and functions
- Optimize for performance with appropriate filters
- Include relevant field mappings for ${dataSource}
- Add comments explaining the detection logic

Return only the XQL query with comments.`;

    const response = await this.client.chat.completions.create({
      model: "grok-2-1212", // Use text-only model for XQL generation
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || '';
  }

  async analyzeAttackVectors(description: string): Promise<string[]> {
    const prompt = `Analyze this threat description and identify specific attack vectors using MITRE ATT&CK framework:

${description}

Return JSON with array of attack vectors, focusing on:
- Initial Access techniques
- Execution methods  
- Persistence mechanisms
- Privilege Escalation
- Defense Evasion
- Credential Access
- Discovery
- Lateral Movement
- Collection
- Exfiltration
- Impact

Format: {"vectors": ["Attack Vector 1", "Attack Vector 2", ...]}`;

    const response = await this.client.chat.completions.create({
      model: "grok-2-1212",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"vectors":[]}');
    return result.vectors || [];
  }
}

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    // Initialize providers if API keys are available
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY));
    }
    if (process.env.XAI_API_KEY) {
      this.providers.set('grok', new GrokProvider(process.env.XAI_API_KEY));
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  async generateCombinedRecommendations(useCase: any) {
    const availableProviders = this.getAvailableProviders();
    const results = await Promise.allSettled(
      availableProviders.map(async (providerName) => {
        const provider = this.getProvider(providerName);
        if (!provider) return null;
        
        const recommendations = await provider.generateRecommendations(useCase);
        return {
          provider: provider.name,
          recommendations
        };
      })
    );

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    return {
      providers: successfulResults.map(r => r.provider),
      combined: this.mergeRecommendations(successfulResults.map(r => r.recommendations)),
      individual: successfulResults
    };
  }

  private mergeRecommendations(recommendations: any[]): any {
    if (recommendations.length === 0) return {};
    if (recommendations.length === 1) return recommendations[0];

    // Merge recommendations from multiple providers
    const merged: any = {
      xqlRules: [],
      playbooks: [],
      alertLayouts: [],
      dashboards: [],
      dataSources: []
    };

    recommendations.forEach(rec => {
      if (rec.xqlRules) merged.xqlRules.push(...rec.xqlRules);
      if (rec.playbooks) merged.playbooks.push(...rec.playbooks);
      if (rec.alertLayouts) merged.alertLayouts.push(...rec.alertLayouts);
      if (rec.dashboards) merged.dashboards.push(...rec.dashboards);
      if (rec.dataSources) merged.dataSources.push(...rec.dataSources);
    });

    return merged;
  }
}

export const aiProviderManager = new AIProviderManager();