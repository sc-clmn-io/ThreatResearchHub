export interface PlaybookTemplate {
  name: string;
  description: string;
  category: 'phishing' | 'malware' | 'network' | 'identity' | 'cloud' | 'data_loss' | 'endpoint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  workflow: PlaybookWorkflow;
  tasks: PlaybookTask[];
  inputs: PlaybookInput[];
  outputs: PlaybookOutput[];
  mitreMapping: string[];
}

export interface PlaybookWorkflow {
  starttaskid: string;
  description: string;
  tags: string[];
}

export interface PlaybookTask {
  id: string;
  name: string;
  type: 'start' | 'regular' | 'condition' | 'playbook' | 'title';
  description?: string;
  script?: string;
  scriptarguments?: Record<string, any>;
  nexttasks: Record<string, string[]>;
  conditions?: PlaybookCondition[];
  separatecontext?: boolean;
  continueonerror?: boolean;
}

export interface PlaybookCondition {
  label: string;
  condition: Array<{
    operator: string;
    left: { value: string; iscontext?: boolean };
    right: { value: string; iscontext?: boolean };
  }>;
}

export interface PlaybookInput {
  key: string;
  value: string;
  required: boolean;
  description: string;
}

export interface PlaybookOutput {
  key: string;
  description: string;
  contextPath: string;
}

export const playbookTemplates: PlaybookTemplate[] = [
  {
    name: "Phishing Email Investigation Core",
    description: "Comprehensive phishing email analysis and response including indicator extraction, reputation checking, and user notification",
    category: "phishing",
    severity: "high",
    mitreMapping: ["T1566.002", "T1204.002", "T1071.001"],
    workflow: {
      starttaskid: "0",
      description: "Automated phishing investigation with manual remediation capabilities",
      tags: ["phishing", "email", "investigation"]
    },
    tasks: [
      {
        id: "0",
        name: "Start Investigation",
        type: "start",
        nexttasks: { '#none#': ["1"] }
      },
      {
        id: "1",
        name: "Extract Email Indicators",
        type: "regular",
        description: "Extract URLs, domains, and file hashes from the reported email",
        script: "Builtin|||extractIndicators",
        scriptarguments: {
          text: "${incident.emailbody}${incident.emailsubject}${incident.emailattachments}"
        },
        nexttasks: { '#none#': ["2"] },
        separatecontext: false
      },
      {
        id: "2",
        name: "Acknowledge Email Receipt",
        type: "regular",
        description: "Send acknowledgment to reporting user",
        script: "|||send-mail",
        scriptarguments: {
          body: "Thank you for reporting the suspicious email. Our security team is investigating. Please do not interact with the email until further notice.",
          subject: "[Security Alert] ${incident.name} - Under Investigation",
          to: "${incident.emailfrom}"
        },
        nexttasks: { '#none#': ["3"] },
        separatecontext: false
      },
      {
        id: "3",
        name: "URL Reputation Check",
        type: "regular",
        description: "Check reputation of extracted URLs",
        script: "|||url",
        scriptarguments: {
          url: "${ExtractedIndicators.URL}"
        },
        nexttasks: { '#none#': ["4"] },
        separatecontext: false,
        continueonerror: true
      },
      {
        id: "4",
        name: "Check for Malicious Indicators",
        type: "condition",
        description: "Determine if any malicious indicators were found",
        conditions: [
          {
            label: "malicious",
            condition: [
              {
                operator: "greaterThan",
                left: { value: "DBotScore.Score", iscontext: true },
                right: { value: "2" }
              }
            ]
          }
        ],
        nexttasks: {
          '#default#': ["5"],
          'malicious': ["6"]
        }
      },
      {
        id: "5",
        name: "Mark as False Positive",
        type: "regular",
        description: "Close investigation as false positive",
        script: "Builtin|||closeInvestigation",
        scriptarguments: {
          closeReason: "False Positive - No malicious indicators found"
        },
        nexttasks: { '#none#': [] }
      },
      {
        id: "6",
        name: "Escalate to Security Team",
        type: "regular",
        description: "Create task for manual investigation",
        script: "Builtin|||createTask",
        scriptarguments: {
          title: "Manual Review Required: Phishing Email",
          description: "Malicious indicators detected. Manual analysis required for ${incident.name}",
          assignee: "Security-Team"
        },
        nexttasks: { '#none#': [] }
      }
    ],
    inputs: [
      {
        key: "emailbody",
        value: "${incident.emailbody}",
        required: true,
        description: "The body content of the reported email"
      },
      {
        key: "emailfrom",
        value: "${incident.emailfrom}",
        required: true,
        description: "Email address of the person who reported the phishing email"
      }
    ],
    outputs: [
      {
        key: "malicious_indicators",
        description: "List of confirmed malicious indicators found",
        contextPath: "Investigation.MaliciousIndicators"
      }
    ]
  },
  {
    name: "Malware Response Core",
    description: "Automated malware detection and response including prevention checks, indicator analysis, and endpoint isolation",
    category: "malware",
    severity: "critical",
    mitreMapping: ["T1204", "T1566", "T1055", "T1027"],
    workflow: {
      starttaskid: "0",
      description: "Comprehensive malware response with automated and manual components",
      tags: ["malware", "endpoint", "prevention"]
    },
    tasks: [
      {
        id: "0",
        name: "Start Malware Response",
        type: "start",
        nexttasks: { '#none#': ["1"] }
      },
      {
        id: "1",
        name: "Check Prevention Status",
        type: "condition",
        description: "Determine if the malware was prevented by security controls",
        conditions: [
          {
            label: "prevented",
            condition: [
              {
                operator: "isEqualString",
                left: { value: "alert.action", iscontext: true },
                right: { value: "PREVENTED" }
              }
            ]
          }
        ],
        nexttasks: {
          '#default#': ["2"],
          'prevented': ["7"]
        }
      },
      {
        id: "2",
        name: "Analyze File Hash",
        type: "regular",
        description: "Check file reputation and analyze hash",
        script: "|||file",
        scriptarguments: {
          file: "${alert.initiatorsha256}"
        },
        nexttasks: { '#none#': ["3"] },
        separatecontext: false
      },
      {
        id: "3",
        name: "Check Malicious Score",
        type: "condition",
        description: "Evaluate if confirmed malicious indicators were found",
        conditions: [
          {
            label: "malicious",
            condition: [
              {
                operator: "greaterThan",
                left: { value: "DBotScore.Score", iscontext: true },
                right: { value: "1" }
              }
            ]
          }
        ],
        nexttasks: {
          '#default#': ["8"],
          'malicious': ["4"]
        }
      },
      {
        id: "4",
        name: "Increase Severity to High",
        type: "regular",
        description: "Escalate incident severity due to malicious indicators",
        script: "IncreaseIncidentSeverity",
        scriptarguments: {
          severity: "High"
        },
        nexttasks: { '#none#': ["5"] },
        separatecontext: false
      },
      {
        id: "5",
        name: "Isolate Affected Endpoint",
        type: "regular",
        description: "Isolate the endpoint to prevent malware spread",
        script: "|||core-isolate-endpoint",
        scriptarguments: {
          endpoint_id: "${alert.agentid}",
          comment: "Automated isolation due to malware detection in ${alert.id}"
        },
        nexttasks: { '#none#': ["6"] },
        separatecontext: false,
        continueonerror: true
      },
      {
        id: "6",
        name: "Block Malicious Hash",
        type: "regular",
        description: "Add malicious hash to blocklist",
        script: "|||core-blocklist-files",
        scriptarguments: {
          hash_list: "${alert.initiatorsha256}",
          comment: "Blocked due to malware detection in ${alert.id}"
        },
        nexttasks: { '#none#': [] },
        separatecontext: false,
        continueonerror: true
      },
      {
        id: "7",
        name: "Close as Prevented",
        type: "regular",
        description: "Close alert as the malware was successfully prevented",
        script: "Builtin|||closeInvestigation",
        scriptarguments: {
          closeReason: "Resolved - Threat Prevented"
        },
        nexttasks: { '#none#': [] }
      },
      {
        id: "8",
        name: "Close as False Positive",
        type: "regular",
        description: "Close alert as no malicious indicators confirmed",
        script: "Builtin|||closeInvestigation",
        scriptarguments: {
          closeReason: "False Positive - No confirmed malicious activity"
        },
        nexttasks: { '#none#': [] }
      }
    ],
    inputs: [
      {
        key: "initiatorsha256",
        value: "${alert.initiatorsha256}",
        required: true,
        description: "SHA256 hash of the suspected malicious file"
      },
      {
        key: "agentid",
        value: "${alert.agentid}",
        required: true,
        description: "ID of the affected endpoint agent"
      }
    ],
    outputs: [
      {
        key: "isolation_status",
        description: "Status of endpoint isolation action",
        contextPath: "Endpoint.IsolationStatus"
      }
    ]
  },
  {
    name: "Network Door Knocking Investigation",
    description: "Investigate and respond to network scanning and door knocking attacks",
    category: "network",
    severity: "medium",
    mitreMapping: ["T1595.001", "T1046", "T1018"],
    workflow: {
      starttaskid: "0",
      description: "Automated network reconnaissance detection and response",
      tags: ["network", "scanning", "reconnaissance"]
    },
    tasks: [
      {
        id: "0",
        name: "Start Network Investigation",
        type: "start",
        nexttasks: { '#none#': ["1"] }
      },
      {
        id: "1",
        name: "Enrich Source IP",
        type: "regular",
        description: "Gather intelligence on the source IP address",
        script: "|||ip",
        scriptarguments: {
          ip: "${alert.sourceip}"
        },
        nexttasks: { '#none#': ["2"] },
        separatecontext: false
      },
      {
        id: "2",
        name: "Check IP Reputation",
        type: "condition",
        description: "Determine if source IP is known malicious",
        conditions: [
          {
            label: "malicious",
            condition: [
              {
                operator: "greaterThan",
                left: { value: "DBotScore.Score", iscontext: true },
                right: { value: "1" }
              }
            ]
          }
        ],
        nexttasks: {
          '#default#': ["4"],
          'malicious': ["3"]
        }
      },
      {
        id: "3",
        name: "Block Malicious IP",
        type: "regular",
        description: "Add malicious IP to EDL for blocking",
        script: "|||pan-block-ip",
        scriptarguments: {
          ip: "${alert.sourceip}",
          comment: "Blocked due to door knocking attack from known malicious IP"
        },
        nexttasks: { '#none#': ["5"] },
        separatecontext: false,
        continueonerror: true
      },
      {
        id: "4",
        name: "Monitor for Pattern",
        type: "regular",
        description: "Create monitoring task for continued observation",
        script: "Builtin|||createTask",
        scriptarguments: {
          title: "Monitor Network Activity",
          description: "Continue monitoring ${alert.sourceip} for scanning patterns",
          assignee: "Network-SOC"
        },
        nexttasks: { '#none#': ["6"] }
      },
      {
        id: "5",
        name: "Close as Known Malicious",
        type: "regular",
        description: "Close alert with appropriate resolution",
        script: "Builtin|||setAlert",
        scriptarguments: {
          comment: "Source IP confirmed malicious and blocked. Attack was prevented by NGFW.",
          status: "Resolved - Known Issue"
        },
        nexttasks: { '#none#': [] }
      },
      {
        id: "6",
        name: "Close as Monitoring",
        type: "regular",
        description: "Close with monitoring status",
        script: "Builtin|||closeInvestigation",
        scriptarguments: {
          closeReason: "Monitoring - No immediate threat"
        },
        nexttasks: { '#none#': [] }
      }
    ],
    inputs: [
      {
        key: "sourceip",
        value: "${alert.sourceip}",
        required: true,
        description: "Source IP address performing the scanning activity"
      }
    ],
    outputs: [
      {
        key: "block_status",
        description: "Status of IP blocking action",
        contextPath: "Network.BlockStatus"
      }
    ]
  },
  {
    name: "Identity Attack Response",
    description: "Investigate and respond to identity-based attacks including authentication failures and account compromise",
    category: "identity",
    severity: "high",
    mitreMapping: ["T1110.001", "T1078", "T1098"],
    workflow: {
      starttaskid: "0",
      description: "Comprehensive identity attack investigation and response",
      tags: ["identity", "authentication", "brute_force"]
    },
    tasks: [
      {
        id: "0",
        name: "Start Identity Investigation",
        type: "start",
        nexttasks: { '#none#': ["1"] }
      },
      {
        id: "1",
        name: "Analyze Failure Count",
        type: "condition",
        description: "Check if failure count exceeds threshold",
        conditions: [
          {
            label: "high_failures",
            condition: [
              {
                operator: "greaterThan",
                left: { value: "alert.failure_count", iscontext: true },
                right: { value: "5" }
              }
            ]
          }
        ],
        nexttasks: {
          '#default#': ["5"],
          'high_failures': ["2"]
        }
      },
      {
        id: "2",
        name: "Check User Status",
        type: "regular",
        description: "Verify current user account status",
        script: "|||ad-get-user",
        scriptarguments: {
          username: "${alert.username}"
        },
        nexttasks: { '#none#': ["3"] },
        separatecontext: false,
        continueonerror: true
      },
      {
        id: "3",
        name: "Disable User Account",
        type: "regular",
        description: "Temporarily disable user account to prevent compromise",
        script: "|||ad-disable-account",
        scriptarguments: {
          username: "${alert.username}",
          reason: "Suspicious authentication activity detected"
        },
        nexttasks: { '#none#': ["4"] },
        separatecontext: false,
        continueonerror: true
      },
      {
        id: "4",
        name: "Notify Security Team",
        type: "regular",
        description: "Alert security team of potential account compromise",
        script: "|||send-mail",
        scriptarguments: {
          body: "User account ${alert.username} has been disabled due to suspicious authentication activity. Manual review required.",
          subject: "[URGENT] Account Compromise Suspected - ${alert.username}",
          to: "security-team@company.com"
        },
        nexttasks: { '#none#': [] }
      },
      {
        id: "5",
        name: "Log for Monitoring",
        type: "regular",
        description: "Log event for continued monitoring",
        script: "Builtin|||setAlert",
        scriptarguments: {
          comment: "Authentication failures below threshold. Continuing to monitor ${alert.username}."
        },
        nexttasks: { '#none#': ["6"] }
      },
      {
        id: "6",
        name: "Close as Monitoring",
        type: "regular",
        description: "Close with monitoring status",
        script: "Builtin|||closeInvestigation",
        scriptarguments: {
          closeReason: "Monitoring - Below threshold"
        },
        nexttasks: { '#none#': [] }
      }
    ],
    inputs: [
      {
        key: "username",
        value: "${alert.username}",
        required: true,
        description: "Username experiencing authentication failures"
      },
      {
        key: "failure_count",
        value: "${alert.failure_count}",
        required: true,
        description: "Number of failed authentication attempts"
      }
    ],
    outputs: [
      {
        key: "account_status",
        description: "Final status of user account after investigation",
        contextPath: "Identity.AccountStatus"
      }
    ]
  },
  {
    name: "False Positive Checker",
    description: "Check for previous similar alerts that were closed as false positives",
    category: "endpoint",
    severity: "low",
    mitreMapping: [],
    workflow: {
      starttaskid: "0",
      description: "Automated false positive detection based on historical data",
      tags: ["utility", "false_positive", "automation"]
    },
    tasks: [
      {
        id: "0",
        name: "Start FP Check",
        type: "start",
        nexttasks: { '#none#': ["1"] }
      },
      {
        id: "1",
        name: "Search Previous Alerts",
        type: "regular",
        description: "Search for similar alerts in XSIAM",
        script: "SearchIncidentsV2",
        scriptarguments: {
          query: "${inputs.query}"
        },
        nexttasks: { '#none#': ["2"] },
        separatecontext: false
      },
      {
        id: "2",
        name: "Check FP Pattern",
        type: "condition",
        description: "Determine if previous alerts were closed as false positive",
        conditions: [
          {
            label: "false_positive",
            condition: [
              {
                operator: "containsGeneral",
                left: { value: "foundIncidents.rawCloseReason", iscontext: true },
                right: { value: "False Positive" }
              },
              {
                operator: "greaterThanOrEqual",
                left: { value: "foundIncidents.id", iscontext: true },
                right: { value: "${inputs.threshold}" }
              }
            ]
          }
        ],
        nexttasks: {
          '#default#': ["4"],
          'false_positive': ["3"]
        }
      },
      {
        id: "3",
        name: "Set Previous Verdict",
        type: "regular",
        description: "Mark as previously determined false positive",
        script: "Set",
        scriptarguments: {
          key: "PreviousVerdict",
          value: "False Positive"
        },
        nexttasks: { '#none#': [] }
      },
      {
        id: "4",
        name: "Set No Pattern",
        type: "regular",
        description: "No false positive pattern found",
        script: "Set",
        scriptarguments: {
          key: "PreviousVerdict",
          value: "No Pattern"
        },
        nexttasks: { '#none#': [] }
      }
    ],
    inputs: [
      {
        key: "query",
        value: "",
        required: true,
        description: "Search query for similar incidents"
      },
      {
        key: "threshold",
        value: "2",
        required: false,
        description: "Minimum number of similar FP alerts required"
      }
    ],
    outputs: [
      {
        key: "previous_verdict",
        description: "Verdict based on historical false positive analysis",
        contextPath: "PreviousVerdict"
      }
    ]
  }
];

export function getPlaybooksByCategory(category: 'phishing' | 'malware' | 'network' | 'identity' | 'cloud' | 'data_loss' | 'endpoint'): PlaybookTemplate[] {
  return playbookTemplates.filter(playbook => playbook.category === category);
}

export function generatePlaybookYAML(useCase: string, category: string, severity: string): string {
  const templates = getPlaybooksByCategory(category as any);
  if (templates.length === 0) {
    return `# Generated Playbook for: ${useCase}
id: ${generateId()}
version: 1
name: ${useCase} Response Playbook
description: Automated response playbook for ${useCase}
starttaskid: "0"

tasks:
  "0":
    id: "0"
    type: start
    nexttasks:
      '#none#':
      - "1"
  "1":
    id: "1"
    type: regular
    task:
      name: Investigate ${useCase}
      description: Manual investigation required
    nexttasks: {}

inputs:
- key: alert_data
  required: true
  description: Alert data for investigation

outputs: []`;
  }

  const template = templates[0];
  const playbookId = generateId();
  
  return `# Generated Playbook for: ${useCase}
# Based on template: ${template.name}
# MITRE ATT&CK: ${template.mitreMapping.join(', ')}

id: ${playbookId}
version: 1
name: ${useCase.replace(/[^a-zA-Z0-9\s-]/g, '')} Response Playbook
description: ${template.description}
starttaskid: "${template.workflow.starttaskid}"

tasks:
${template.tasks.map(task => `  "${task.id}":
    id: "${task.id}"
    type: ${task.type}
    task:
      name: ${task.name}
      ${task.description ? `description: ${task.description}` : ''}
      ${task.script ? `script: ${task.script}` : ''}
      ${task.type !== 'start' ? 'iscommand: ' + (task.script ? 'true' : 'false') : ''}
    ${task.scriptarguments ? `scriptarguments:
${Object.entries(task.scriptarguments).map(([key, value]) => `      ${key}:
        simple: ${value}`).join('\n')}` : ''}
    nexttasks:
${Object.entries(task.nexttasks).map(([condition, taskIds]) => `      ${condition}:
${taskIds.map(id => `      - "${id}"`).join('\n')}`).join('\n')}
    ${task.conditions ? `conditions:
${task.conditions.map(cond => `    - label: "${cond.label}"
      condition:
${cond.condition.map(c => `      - operator: ${c.operator}
        left:
          value: ${c.left.value}
          ${c.left.iscontext ? 'iscontext: true' : ''}
        right:
          value: ${c.right.value}
          ${c.right.iscontext ? 'iscontext: true' : ''}`).join('\n')}`).join('\n')}` : ''}
    separatecontext: ${task.separatecontext || false}
    ${task.continueonerror ? 'continueonerror: true' : ''}`).join('\n')}

inputs:
${template.inputs.map(input => `- key: ${input.key}
  value: ${input.value}
  required: ${input.required}
  description: ${input.description}`).join('\n')}

outputs:
${template.outputs.map(output => `- key: ${output.key}
  description: ${output.description}
  contextPath: ${output.contextPath}`).join('\n')}`;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}