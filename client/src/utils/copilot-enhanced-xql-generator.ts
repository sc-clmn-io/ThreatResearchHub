// Enhanced XQL Query Generator with GitHub Copilot patterns
// Generates vendor-specific queries for 500+ XSIAM marketplace integrations

interface XQLQueryContext {
  vendor: string;
  datasetSchema: Record<string, string>;
  threatType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  indicators: string[];
  mitreMapping: string[];
}

export class CopilotEnhancedXQLGenerator {
  
  // Generate vendor-specific XQL correlation rules
  static generateCorrelationRule(context: XQLQueryContext): string {
    const { vendor, datasetSchema, threatType, indicators } = context;
    
    // Copilot-enhanced pattern recognition for different vendor schemas
    if (vendor.toLowerCase().includes('crowdstrike')) {
      return this.generateCrowdStrikeXQL(context);
    } else if (vendor.toLowerCase().includes('microsoft') || vendor.toLowerCase().includes('defender')) {
      return this.generateMicrosoftDefenderXQL(context);
    } else if (vendor.toLowerCase().includes('aws')) {
      return this.generateAWSCloudTrailXQL(context);
    } else if (vendor.toLowerCase().includes('kubernetes')) {
      return this.generateKubernetesXQL(context);
    } else {
      return this.generateGenericXQL(context);
    }
  }

  // CrowdStrike Falcon-specific XQL with authentic field names
  private static generateCrowdStrikeXQL(context: XQLQueryContext): string {
    const { threatType, indicators } = context;
    
    return `config case_sensitive = false
config timeframe = 7d

filter event_simpleName in ("ProcessRollup2", "NetworkConnectIP4", "DnsRequest")
| filter ComputerName != null and UserName != null
| filter ${this.buildIndicatorFilter(indicators, 'crowdstrike')}
| alter 
    threat_category = "${threatType}",
    process_path = coalesce(ImageFileName, FileName),
    command_line = CommandLine,
    parent_process = ParentImageFileName,
    network_destination = RemoteAddressIP4,
    dns_query = DomainName,
    user_context = UserName,
    host_identifier = ComputerName
| fields _time, threat_category, process_path, command_line, parent_process, 
         network_destination, dns_query, user_context, host_identifier
| sort _time desc`;
  }

  // Microsoft Defender-specific XQL with proper field mapping
  private static generateMicrosoftDefenderXQL(context: XQLQueryContext): string {
    const { threatType, indicators } = context;
    
    return `config case_sensitive = false
config timeframe = 7d

filter ActionType in ("ProcessCreated", "NetworkConnectionEvents", "FileCreated")
| filter DeviceName != null and InitiatingProcessAccountName != null
| filter ${this.buildIndicatorFilter(indicators, 'defender')}
| alter 
    threat_category = "${threatType}",
    process_name = coalesce(ProcessCommandLine, FileName),
    initiating_process = InitiatingProcessFileName,
    process_id = ProcessId,
    network_remote_ip = RemoteIP,
    file_path = FolderPath,
    account_name = InitiatingProcessAccountName,
    device_name = DeviceName
| fields _time, threat_category, process_name, initiating_process, process_id,
         network_remote_ip, file_path, account_name, device_name
| sort _time desc`;
  }

  // AWS CloudTrail-specific XQL for cloud threats
  private static generateAWSCloudTrailXQL(context: XQLQueryContext): string {
    const { threatType, indicators } = context;
    
    return `config case_sensitive = false
config timeframe = 7d

filter eventSource contains "amazonaws.com"
| filter eventName != null and userIdentity != null
| filter ${this.buildIndicatorFilter(indicators, 'aws')}
| alter 
    threat_category = "${threatType}",
    aws_service = eventSource,
    api_action = eventName,
    user_identity_type = json_extract_scalar(userIdentity, "$.type"),
    user_name = coalesce(json_extract_scalar(userIdentity, "$.userName"), 
                        json_extract_scalar(userIdentity, "$.arn")),
    source_ip = sourceIPAddress,
    aws_region = awsRegion,
    error_code = errorCode,
    user_agent = userAgent
| fields _time, threat_category, aws_service, api_action, user_identity_type,
         user_name, source_ip, aws_region, error_code, user_agent
| sort _time desc`;
  }

  // Kubernetes audit log XQL for container threats
  private static generateKubernetesXQL(context: XQLQueryContext): string {
    const { threatType, indicators } = context;
    
    return `config case_sensitive = false
config timeframe = 7d

filter verb in ("create", "update", "delete", "patch")
| filter objectRef != null and user != null
| filter ${this.buildIndicatorFilter(indicators, 'kubernetes')}
| alter 
    threat_category = "${threatType}",
    k8s_verb = verb,
    resource_kind = json_extract_scalar(objectRef, "$.kind"),
    resource_name = json_extract_scalar(objectRef, "$.name"),
    namespace = json_extract_scalar(objectRef, "$.namespace"),
    user_name = json_extract_scalar(user, "$.username"),
    user_groups = json_extract_array(user, "$.groups"),
    source_ips = sourceIPs,
    annotations = annotations
| fields _time, threat_category, k8s_verb, resource_kind, resource_name,
         namespace, user_name, user_groups, source_ips, annotations
| sort _time desc`;
  }

  // Generic XQL template for unknown vendors
  private static generateGenericXQL(context: XQLQueryContext): string {
    const { threatType, indicators, datasetSchema } = context;
    
    const commonFields = Object.keys(datasetSchema).slice(0, 8);
    const fieldList = commonFields.join(', ');
    
    return `config case_sensitive = false
config timeframe = 7d

filter ${commonFields[0]} != null
| filter ${this.buildIndicatorFilter(indicators, 'generic')}
| alter threat_category = "${threatType}"
| fields _time, threat_category, ${fieldList}
| sort _time desc`;
  }

  // Build indicator-specific filter conditions based on vendor
  private static buildIndicatorFilter(indicators: string[], vendor: string): string {
    if (!indicators.length) return "true";
    
    switch (vendor) {
      case 'crowdstrike':
        return indicators.map(indicator => {
          if (indicator.includes('.')) {
            return `(DomainName contains "${indicator}" or RemoteAddressIP4 = "${indicator}")`;
          } else if (indicator.includes('\\') || indicator.includes('/')) {
            return `(ImageFileName contains "${indicator}" or CommandLine contains "${indicator}")`;
          } else {
            return `(ProcessCommandLine contains "${indicator}" or FileName contains "${indicator}")`;
          }
        }).join(' or ');
        
      case 'defender':
        return indicators.map(indicator => {
          if (indicator.includes('.')) {
            return `(RemoteIP = "${indicator}" or ProcessCommandLine contains "${indicator}")`;
          } else {
            return `(FileName contains "${indicator}" or ProcessCommandLine contains "${indicator}")`;
          }
        }).join(' or ');
        
      case 'aws':
        return indicators.map(indicator => {
          return `(sourceIPAddress = "${indicator}" or userAgent contains "${indicator}" or eventName contains "${indicator}")`;
        }).join(' or ');
        
      case 'kubernetes':
        return indicators.map(indicator => {
          return `(json_extract_scalar(objectRef, "$.name") contains "${indicator}" or json_extract_scalar(user, "$.username") contains "${indicator}")`;
        }).join(' or ');
        
      default:
        return indicators.map(indicator => `_raw_log contains "${indicator}"`).join(' or ');
    }
  }

  // Generate performance-optimized XQL with time windowing
  static generateOptimizedXQL(context: XQLQueryContext, timeWindow: string = '7d'): string {
    const baseQuery = this.generateCorrelationRule(context);
    
    return `${baseQuery}
| limit 1000
| stats threat_count = count() by threat_category, bin(_time, 1h)
| where threat_count > 0
| sort _time desc`;
  }

  // Generate multi-dataset correlation XQL
  static generateCrossDatasetXQL(contexts: XQLQueryContext[]): string {
    if (contexts.length < 2) {
      throw new Error('Cross-dataset correlation requires at least 2 data sources');
    }

    const joins = contexts.slice(1).map((context, index) => {
      return `| join type=left (
  ${this.generateCorrelationRule(context)}
) on ${this.getJoinFields(contexts[0].vendor, context.vendor)}`;
    }).join('\n');

    return `${this.generateCorrelationRule(contexts[0])}
${joins}
| where threat_category != null
| stats unique_threats = count_distinct(threat_category) by host_identifier
| where unique_threats > 1
| sort unique_threats desc`;
  }

  // Determine appropriate join fields between vendors
  private static getJoinFields(vendor1: string, vendor2: string): string {
    const commonFields: Record<string, string> = {
      'crowdstrike-defender': 'ComputerName=DeviceName',
      'aws-kubernetes': 'sourceIPAddress=source_ips',
      'generic': '_time'
    };

    const key = `${vendor1}-${vendor2}`;
    return commonFields[key] || commonFields['generic'];
  }
}

// Export utility functions for Copilot integration
export const copilotXQLHelpers = {
  generateQuery: CopilotEnhancedXQLGenerator.generateCorrelationRule,
  optimizeQuery: CopilotEnhancedXQLGenerator.generateOptimizedXQL,
  crossDataset: CopilotEnhancedXQLGenerator.generateCrossDatasetXQL
};