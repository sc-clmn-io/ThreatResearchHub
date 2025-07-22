export interface CorrelationRuleTemplate {
  name: string;
  description: string;
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  xqlQuery: string;
  mitreMapping: string[];
  useCases: string[];
}

export const correlationRuleTemplates: CorrelationRuleTemplate[] = [
  // AWS Cloud Security Rules
  {
    name: "AWS Create Policy allows accessing any resource",
    description: "Detects when a policy is created that allows access to any AWS resource using wildcard permissions",
    category: "cloud",
    severity: "high",
    xqlQuery: `dataset = amazon_aws_raw 
| filter eventName = "CreatePolicyVersion"
| alter policyDocument = json_extract_scalar(requestParameters, "$.policyDocument")
| filter policyDocument != null
| fields policyDocument 
| alter statement = json_extract_array(policyDocument , "$.Statement")
| arrayexpand statement 
| alter Effect = statement -> Effect , Resource = json_extract_array(statement , "$.Resource")
| filter Effect = "Allow" and Resource ~= "\\"\\*\\""`,
    mitreMapping: ["T1098.001", "T1078.004"],
    useCases: ["privilege_escalation", "policy_manipulation", "cloud_persistence"]
  },
  {
    name: "AWS CreateAccessKey for a different user",
    description: "Detects when an access key is created for a user different from the one performing the action",
    category: "cloud",
    severity: "high",
    xqlQuery: `dataset = amazon_aws_raw 
| filter eventName = "CreateAccessKey"
| alter userName = userIdentity -> userName,targetUserName = requestParameters -> userName
| filter userName != targetUserName`,
    mitreMapping: ["T1098.001", "T1136.003"],
    useCases: ["credential_access", "persistence", "privilege_escalation"]
  },
  {
    name: "AWS Defense Evasion Disabling CloudTrail",
    description: "Detects attempts to disable CloudTrail logging for defense evasion",
    category: "cloud",
    severity: "critical",
    xqlQuery: `dataset = amazon_aws_raw 
| filter eventName in ("DeleteTrail","StopLogging") and eventSource = "cloudtrail.amazonaws.com" and userAgent !="console.amazonaws.com"`,
    mitreMapping: ["T1562.008", "T1070.003"],
    useCases: ["defense_evasion", "log_tampering", "audit_evasion"]
  },
  {
    name: "AWS Multiple failed logins from the same IP",
    description: "Detects multiple failed console login attempts from the same source IP address",
    category: "cloud",
    severity: "medium",
    xqlQuery: `dataset =  amazon_aws_raw 
| filter eventName = "ConsoleLogin"
| alter outcome = json_extract_scalar(responseElements , "$.ConsoleLogin" ) , user = json_extract_scalar(userIdentity , "$.sessionContext.sessionIssuer.userName") 
| filter outcome = "Failure"
| comp count() by sourceIPAddress
| filter count > 100`,
    mitreMapping: ["T1110.001", "T1078"],
    useCases: ["credential_access", "brute_force", "authentication_attacks"]
  },

  // Network Security Rules
  {
    name: "NGFW Remote Access Activity",
    description: "Monitors remote access applications and protocols for suspicious activity",
    category: "network",
    severity: "medium",
    xqlQuery: `config case_sensitive = false timeframe between "begin" and "now"
| dataset = panw_ngfw_traffic_raw
| filter app_sub_category = "remote-access"
| comp count(_id) as Total by app, from_zone, to_zone, source_ip , dest_ip, dest_port
| sort desc Total`,
    mitreMapping: ["T1021", "T1133"],
    useCases: ["lateral_movement", "remote_access", "network_reconnaissance"]
  },
  {
    name: "FW Sinkhole Event Detection",
    description: "Detects spyware communications that have been sinkholed by the firewall",
    category: "network",
    severity: "high",
    xqlQuery: `dataset = panw_ngfw_threat_raw 
| filter sub_type = "spyware" and action = "sinkhole"
| join type = left ( dataset = endpoints 
    | fields ip_address as agent_ip_address, user, endpoint_name, group_names
) as endpoints source_ip contains arraystring(endpoints.agent_ip_address, ":")
| filter group_names not contains "Domain Controller"
| comp count_distinct(_id) as num_sinkhole_events by source_ip, user, endpoint_name, file_name, threat_category
| filter num_sinkhole_events >= 15`,
    mitreMapping: ["T1071.001", "T1102"],
    useCases: ["command_control", "malware_communication", "network_defense"]
  },

  // Identity and Access Management
  {
    name: "Okta Multiple Authentication Failures",
    description: "Detects multiple authentication failures from the same IP address indicating potential brute force attacks",
    category: "identity",
    severity: "high",
    xqlQuery: `config case_sensitive = false 
| dataset = okta_sso_raw
| filter outcome contains "FAILURE"
| fields _time, actor, displayMessage as operation, outcome, client
| alter platform = "Okta", 
    userName = json_extract_scalar(actor, "$.alternateId"),
    userDisplayName = json_extract_scalar(actor, "$.displayName"),
    userId = json_extract_scalar(actor, "$.id"),
    userType = json_extract_scalar(actor, "$.type"),
    auth_outcome = json_extract_scalar(outcome, "$.result"),    
    clientIp = client -> ipAddress,
    userAgent = client -> userAgent.rawUserAgent,
    gl_Country = client -> geographicalContext.country,
    gl_City = client -> geographicalContext.city,
    gl_State = client -> geographicalContext.state 
| comp max(_time) as maxt, count(auth_outcome) as Failures by platform, operation, auth_outcome, clientIp, userName, userType, userId, userDisplayName, userAgent, gl_Country, gl_City, gl_State
| filter Failures > 2`,
    mitreMapping: ["T1110.001", "T1078"],
    useCases: ["credential_access", "brute_force", "identity_attacks"]
  },
  {
    name: "Azure AD Administrator Access Granted",
    description: "Detects when administrative privileges are granted to users in Azure AD",
    category: "identity",
    severity: "high",
    xqlQuery: `dataset = msft_azure_ad_audit_raw 
| filter (category = "RoleManagement") 
| alter role = targetResources -> []
| alter test = arrayindex(role ,0)
| alter modified = json_extract(test, "$.modifiedProperties")
| alter modified = modified ->[] 
| fields modified | arrayexpand modified | alter newValue = json_extract_scalar(modified , "$.newValue")
| filter newValue in("\"Company Administrator\"", "\"TenantAdmins\"" , "\"Global Administrator\"")`,
    mitreMapping: ["T1098.003", "T1078.004"],
    useCases: ["privilege_escalation", "persistence", "admin_access"]
  },

  // Endpoint Security Rules
  {
    name: "Windows Event Log 4649 - Distributed DDOS Attack",
    description: "Detects potential distributed denial of service attacks through Windows Event Log 4649",
    category: "endpoint",
    severity: "high",
    xqlQuery: `preset = xdr_event_log 
| filter action_evtlog_event_id = 4649`,
    mitreMapping: ["T1498", "T1499"],
    useCases: ["impact", "denial_of_service", "network_attacks"]
  },

  // Threat Detection Rules
  {
    name: "Zscaler Malware Detection",
    description: "Detects malware including ransomware, viruses, and trojans through Zscaler logs",
    category: "network",
    severity: "critical",
    xqlQuery: `dataset = zscaler_nssweblog_raw 
| filter cs4 in ("Ransomware" , "Virus" , "Trojan")`,
    mitreMapping: ["T1204", "T1566"],
    useCases: ["malware_detection", "initial_access", "execution"]
  },
  {
    name: "Proofpoint TAP Click-to-Threat Correlation",
    description: "Correlates Proofpoint TAP click events with subsequent threat detections",
    category: "network",
    severity: "high",
    xqlQuery: `dataset=proofpoint_tap_raw 
|filter to_epoch(clickTime) < to_epoch(threatTime)
|fields sender , senderIP, recipient, url, clickIP , clickTime , messageTime , threatTime , messageID 
|dedup sender, recipient, messageID , url
| join type = inner
    (dataset= panw_ngfw_url_raw  ) as URL  url contains URL.url_domain
| filter is_url_denied = "false"
|dedup sender, recipient, messageID , url`,
    mitreMapping: ["T1566.002", "T1204.002"],
    useCases: ["phishing_detection", "email_security", "url_analysis"]
  },

  // Data Loss Prevention
  {
    name: "Office 365 DLP High Severity Violations",
    description: "Detects high severity data loss prevention violations in Office 365",
    category: "cloud",
    severity: "high",
    xqlQuery: `dataset = msft_o365_dlp_raw 
| alter PolicyDetails = PolicyDetails -> []
| alter policy = arrayindex(PolicyDetails ,0)
| alter PolicyName = json_extract_scalar(policy , "$.PolicyName"), Rules = json_extract(policy , "$.Rules")
| alter rules = Rules -> []
| alter rules = arrayindex(rules ,0)
| alter RuleName = json_extract_scalar(rules , "$.RuleName"),Severity = json_extract_scalar(rules , "$.Severity")
| filter Severity  = "High"
| alter SensitiveInformation = json_extract(rules, "$.ConditionsMatched.SensitiveInformation")
| alter sensitive  = SensitiveInformation -> []
| alter sensitive = arrayindex(sensitive ,0)
| alter sensitive = json_extract(sensitive, "$.SensitiveInformationDetections.DetectedValues")`,
    mitreMapping: ["T1041", "T1567"],
    useCases: ["data_exfiltration", "dlp_violations", "data_protection"]
  }
];

export function getCorrelationRulesByCategory(category: 'endpoint' | 'network' | 'cloud' | 'identity'): CorrelationRuleTemplate[] {
  return correlationRuleTemplates.filter(rule => rule.category === category);
}

export function getCorrelationRuleBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): CorrelationRuleTemplate[] {
  return correlationRuleTemplates.filter(rule => rule.severity === severity);
}

export function generateCustomXQLQuery(useCase: string, category: string): string {
  const templates = getCorrelationRulesByCategory(category as any);
  if (templates.length === 0) return "// Custom XQL query template\ndataset = xdr_data\n| filter event_type != null\n| fields *";
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  return `// Generated XQL Query for: ${useCase}
// Based on template: ${template.name}
// MITRE ATT&CK: ${template.mitreMapping.join(', ')}

${template.xqlQuery}

// Additional filters and logic can be added here based on specific requirements
// Remember to test thoroughly and tune for false positives`;
}