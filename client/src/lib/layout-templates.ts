export interface AlertLayoutTemplate {
  name: string;
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  layoutConfig: {
    sections: LayoutSection[];
    styling: LayoutStyling;
    notifications: NotificationConfig;
  };
  description: string;
}

export interface LayoutSection {
  id: string;
  title: string;
  type: 'summary' | 'technical_details' | 'response_actions' | 'timeline' | 'indicators' | 'custom';
  fields: LayoutField[];
  conditional?: boolean;
  order: number;
}

export interface LayoutField {
  name: string;
  label: string;
  type: 'text' | 'badge' | 'link' | 'chart' | 'table' | 'code' | 'markdown';
  source: string;
  format?: string;
  color?: string;
}

export interface LayoutStyling {
  theme: 'cortex' | 'default';
  colors: {
    primary: string;
    secondary: string;
    danger: string;
    warning: string;
    success: string;
  };
  fonts: {
    header: string;
    body: string;
    code: string;
  };
}

export interface NotificationConfig {
  email: boolean;
  slack: boolean;
  teams: boolean;
  sms: boolean;
  webhook?: string;
  escalation: {
    enabled: boolean;
    timeoutMinutes: number;
    escalationLevels: string[];
  };
}

export const alertLayoutTemplates: AlertLayoutTemplate[] = [
  {
    name: "AWS Security Incident Layout",
    category: "cloud",
    severity: "high",
    description: "Comprehensive layout for AWS security incidents including policy violations and access anomalies",
    layoutConfig: {
      sections: [
        {
          id: "incident_summary",
          title: "Incident Summary",
          type: "summary",
          order: 1,
          fields: [
            {
              name: "alert_name",
              label: "Alert Name",
              type: "text",
              source: "$xdm.alert.name",
              format: "bold"
            },
            {
              name: "severity",
              label: "Severity",
              type: "badge",
              source: "$xdm.alert.severity",
              color: "severity-based"
            },
            {
              name: "aws_account",
              label: "AWS Account",
              type: "text",
              source: "$aws.account_id"
            },
            {
              name: "region",
              label: "AWS Region",
              type: "text",
              source: "$aws.region"
            },
            {
              name: "event_time",
              label: "Event Time",
              type: "text",
              source: "$_time",
              format: "datetime"
            }
          ]
        },
        {
          id: "technical_details",
          title: "Technical Details",
          type: "technical_details",
          order: 2,
          fields: [
            {
              name: "event_name",
              label: "AWS Event",
              type: "text",
              source: "$eventName"
            },
            {
              name: "source_ip",
              label: "Source IP",
              type: "link",
              source: "$sourceIPAddress",
              format: "ip-lookup"
            },
            {
              name: "user_identity",
              label: "User Identity",
              type: "text",
              source: "$userIdentity.userName"
            },
            {
              name: "user_agent",
              label: "User Agent",
              type: "text",
              source: "$userAgent"
            },
            {
              name: "xql_query",
              label: "Detection Query",
              type: "code",
              source: "$correlation.xql_query",
              format: "xql"
            }
          ]
        },
        {
          id: "mitre_mapping",
          title: "MITRE ATT&CK Mapping",
          type: "indicators",
          order: 3,
          fields: [
            {
              name: "techniques",
              label: "Techniques",
              type: "table",
              source: "$mitre.techniques",
              format: "technique-table"
            },
            {
              name: "tactics",
              label: "Tactics",
              type: "badge",
              source: "$mitre.tactics",
              color: "blue"
            }
          ]
        },
        {
          id: "response_actions",
          title: "Recommended Actions",
          type: "response_actions",
          order: 4,
          fields: [
            {
              name: "immediate_actions",
              label: "Immediate Actions",
              type: "markdown",
              source: "$response.immediate_actions"
            },
            {
              name: "investigation_steps",
              label: "Investigation Steps",
              type: "markdown",
              source: "$response.investigation_steps"
            },
            {
              name: "containment",
              label: "Containment",
              type: "markdown",
              source: "$response.containment"
            }
          ]
        }
      ],
      styling: {
        theme: "cortex",
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          danger: "#D32F2F",
          warning: "#F57C00",
          success: "#388E3C"
        },
        fonts: {
          header: "Roboto",
          body: "Roboto",
          code: "Roboto Mono"
        }
      },
      notifications: {
        email: true,
        slack: true,
        teams: false,
        sms: false,
        escalation: {
          enabled: true,
          timeoutMinutes: 30,
          escalationLevels: ["L1-SOC", "L2-SOC", "CISO"]
        }
      }
    }
  },
  {
    name: "Network Threat Detection Layout",
    category: "network",
    severity: "high",
    description: "Layout for network-based threats including malware communication and lateral movement",
    layoutConfig: {
      sections: [
        {
          id: "threat_summary",
          title: "Threat Summary",
          type: "summary",
          order: 1,
          fields: [
            {
              name: "threat_name",
              label: "Threat Name",
              type: "text",
              source: "$threat.name",
              format: "bold"
            },
            {
              name: "threat_category",
              label: "Category",
              type: "badge",
              source: "$threat.category",
              color: "category-based"
            },
            {
              name: "source_ip",
              label: "Source IP",
              type: "link",
              source: "$source_ip",
              format: "ip-lookup"
            },
            {
              name: "dest_ip",
              label: "Destination IP",
              type: "link",
              source: "$dest_ip",
              format: "ip-lookup"
            },
            {
              name: "protocol",
              label: "Protocol",
              type: "text",
              source: "$protocol"
            }
          ]
        },
        {
          id: "network_details",
          title: "Network Analysis",
          type: "technical_details",
          order: 2,
          fields: [
            {
              name: "app",
              label: "Application",
              type: "text",
              source: "$app"
            },
            {
              name: "url_domain",
              label: "Domain",
              type: "link",
              source: "$url_domain",
              format: "domain-lookup"
            },
            {
              name: "bytes_total",
              label: "Total Bytes",
              type: "text",
              source: "$bytes_total",
              format: "bytes"
            },
            {
              name: "session_duration",
              label: "Session Duration",
              type: "text",
              source: "$session_duration",
              format: "duration"
            }
          ]
        },
        {
          id: "firewall_action",
          title: "Firewall Response",
          type: "response_actions",
          order: 3,
          fields: [
            {
              name: "action",
              label: "Action Taken",
              type: "badge",
              source: "$action",
              color: "action-based"
            },
            {
              name: "rule_matched",
              label: "Rule Matched",
              type: "text",
              source: "$rule_matched"
            },
            {
              name: "threat_id",
              label: "Threat ID",
              type: "text",
              source: "$threat_id"
            }
          ]
        }
      ],
      styling: {
        theme: "cortex",
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          danger: "#D32F2F",
          warning: "#F57C00",
          success: "#388E3C"
        },
        fonts: {
          header: "Roboto",
          body: "Roboto",
          code: "Roboto Mono"
        }
      },
      notifications: {
        email: true,
        slack: true,
        teams: true,
        sms: false,
        escalation: {
          enabled: true,
          timeoutMinutes: 15,
          escalationLevels: ["Network-SOC", "Security-Manager", "CISO"]
        }
      }
    }
  },
  {
    name: "Endpoint Security Incident Layout",
    category: "endpoint",
    severity: "critical",
    description: "Layout for endpoint security incidents including malware detection and process execution",
    layoutConfig: {
      sections: [
        {
          id: "endpoint_summary",
          title: "Endpoint Incident Summary",
          type: "summary",
          order: 1,
          fields: [
            {
              name: "endpoint_name",
              label: "Endpoint",
              type: "text",
              source: "$endpoint_name",
              format: "bold"
            },
            {
              name: "user",
              label: "User",
              type: "text",
              source: "$user"
            },
            {
              name: "process_name",
              label: "Process",
              type: "text",
              source: "$action_process_image_name"
            },
            {
              name: "file_hash",
              label: "File Hash",
              type: "link",
              source: "$action_file_sha256",
              format: "hash-lookup"
            }
          ]
        },
        {
          id: "process_details",
          title: "Process Execution Details",
          type: "technical_details",
          order: 2,
          fields: [
            {
              name: "command_line",
              label: "Command Line",
              type: "code",
              source: "$action_process_command_line",
              format: "command"
            },
            {
              name: "parent_process",
              label: "Parent Process",
              type: "text",
              source: "$action_process_parent_image_name"
            },
            {
              name: "process_id",
              label: "Process ID",
              type: "text",
              source: "$action_process_pid"
            },
            {
              name: "file_path",
              label: "File Path",
              type: "text",
              source: "$action_file_path"
            }
          ]
        },
        {
          id: "remediation_actions",
          title: "Remediation Actions",
          type: "response_actions",
          order: 3,
          fields: [
            {
              name: "quarantine_status",
              label: "Quarantine Status",
              type: "badge",
              source: "$remediation.quarantine",
              color: "status-based"
            },
            {
              name: "process_terminated",
              label: "Process Terminated",
              type: "badge",
              source: "$remediation.process_killed",
              color: "boolean"
            },
            {
              name: "isolation_status",
              label: "Endpoint Isolation",
              type: "badge",
              source: "$remediation.isolated",
              color: "boolean"
            }
          ]
        }
      ],
      styling: {
        theme: "cortex",
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          danger: "#D32F2F",
          warning: "#F57C00",
          success: "#388E3C"
        },
        fonts: {
          header: "Roboto",
          body: "Roboto",
          code: "Roboto Mono"
        }
      },
      notifications: {
        email: true,
        slack: true,
        teams: true,
        sms: true,
        escalation: {
          enabled: true,
          timeoutMinutes: 10,
          escalationLevels: ["Endpoint-SOC", "IR-Team", "Security-Manager"]
        }
      }
    }
  },
  {
    name: "Identity Attack Detection Layout",
    category: "identity",
    severity: "high",
    description: "Layout for identity-based attacks including authentication failures and privilege escalation",
    layoutConfig: {
      sections: [
        {
          id: "identity_summary",
          title: "Identity Incident Summary",
          type: "summary",
          order: 1,
          fields: [
            {
              name: "user_name",
              label: "User",
              type: "text",
              source: "$userName",
              format: "bold"
            },
            {
              name: "source_ip",
              label: "Source IP",
              type: "link",
              source: "$clientIp",
              format: "ip-lookup"
            },
            {
              name: "failure_count",
              label: "Failed Attempts",
              type: "badge",
              source: "$Failures",
              color: "count-based"
            },
            {
              name: "location",
              label: "Location",
              type: "text",
              source: "$gl_City, $gl_Country"
            }
          ]
        },
        {
          id: "auth_details",
          title: "Authentication Details",
          type: "technical_details",
          order: 2,
          fields: [
            {
              name: "user_agent",
              label: "User Agent",
              type: "text",
              source: "$userAgent"
            },
            {
              name: "auth_outcome",
              label: "Outcome",
              type: "badge",
              source: "$auth_outcome",
              color: "outcome-based"
            },
            {
              name: "platform",
              label: "Platform",
              type: "text",
              source: "$platform"
            },
            {
              name: "operation",
              label: "Operation",
              type: "text",
              source: "$operation"
            }
          ]
        },
        {
          id: "risk_assessment",
          title: "Risk Assessment",
          type: "response_actions",
          order: 3,
          fields: [
            {
              name: "risk_score",
              label: "Risk Score",
              type: "badge",
              source: "$risk.score",
              color: "risk-based"
            },
            {
              name: "account_status",
              label: "Account Status",
              type: "badge",
              source: "$account.status",
              color: "status-based"
            },
            {
              name: "recommended_action",
              label: "Recommended Action",
              type: "markdown",
              source: "$response.recommendation"
            }
          ]
        }
      ],
      styling: {
        theme: "cortex",
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          danger: "#D32F2F",
          warning: "#F57C00",
          success: "#388E3C"
        },
        fonts: {
          header: "Roboto",
          body: "Roboto",
          code: "Roboto Mono"
        }
      },
      notifications: {
        email: true,
        slack: true,
        teams: false,
        sms: false,
        escalation: {
          enabled: true,
          timeoutMinutes: 20,
          escalationLevels: ["Identity-SOC", "IAM-Team", "Security-Manager"]
        }
      }
    }
  }
];

export function getLayoutTemplateByCategory(category: 'endpoint' | 'network' | 'cloud' | 'identity'): AlertLayoutTemplate[] {
  return alertLayoutTemplates.filter(template => template.category === category);
}

export function generateLayoutConfiguration(useCase: string, category: string, severity: string): string {
  const templates = getLayoutTemplateByCategory(category as any);
  if (templates.length === 0) {
    return JSON.stringify({
      layout_name: `${useCase}_alert_layout`,
      sections: [
        {
          type: "summary",
          fields: ["severity", "confidence", "affected_assets"]
        },
        {
          type: "technical_details",
          fields: ["detection_rule", "indicators", "mitre_techniques"]
        },
        {
          type: "response_actions",
          fields: ["immediate_actions", "investigation_steps"]
        }
      ]
    }, null, 2);
  }

  const template = templates[0];
  const config = {
    layout_name: `${useCase.toLowerCase().replace(/\s+/g, '_')}_alert_layout`,
    description: `Alert layout for ${useCase}`,
    severity: severity,
    sections: template.layoutConfig.sections.map(section => ({
      id: section.id,
      title: section.title,
      type: section.type,
      order: section.order,
      fields: section.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        source: field.source,
        format: field.format,
        color: field.color
      }))
    })),
    styling: template.layoutConfig.styling,
    notifications: template.layoutConfig.notifications
  };

  return JSON.stringify(config, null, 2);
}