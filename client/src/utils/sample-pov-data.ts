// Sample POV data extracted from authentic PowerPoint examples
// From: Copy - Cortex XSIAM - POV Use Cases.pptx_1753546877222.pdf

export const samplePhishingUseCase = {
  title: "Campaign of Proofpoint TAP Alerts / Reported Phishing",
  description: "Multiple alerts are triggered within Proofpoint's TAP (Targeted Attack Protection) module for the same email sent to multiple users or multiple users report the same email through the Phish Alarm button. These alerts indicate that a suspicious, potentially malicious, email was successfully delivered to multiple associates' mailbox. Potential risk with this type of activity is the user clicks on a malicious link, the user provides sensitive information/IP, downloads a malicious document, etc.",
  category: "endpoint" as const,
  priority: "high" as const,
  customerInfo: {
    teamSize: 8,
    currentTools: [
      "Proofpoint TAP",
      "Active Directory", 
      "Office 365",
      "NGFW",
      "Threat Intelligence Platform"
    ],
    painPoints: [
      "Damage to brand/reputation due to potential compromise",
      "Currently receiving 1 for 1 matches when alerts are triggered",
      "No collection/suppression of events into actionable alerts",
      "Limited automated response capabilities"
    ],
    primaryDataSources: [
      {
        category: "email" as const,
        type: "Proofpoint TAP",
        vendor: "Proofpoint",
        ingestionMethod: "API",
        priority: "critical" as const
      },
      {
        category: "endpoint" as const,
        type: "XSIAM Agent",
        vendor: "Palo Alto Networks",
        ingestionMethod: "Agent",
        priority: "high" as const
      },
      {
        category: "identity" as const,
        type: "Active Directory",
        vendor: "Microsoft",
        ingestionMethod: "API",
        priority: "high" as const
      },
      {
        category: "network" as const,
        type: "Next-Generation Firewall",
        vendor: "Palo Alto Networks", 
        ingestionMethod: "Syslog",
        priority: "medium" as const
      }
    ]
  },
  useCaseDetails: {
    potentialIndicators: [
      "Proofpoint TAP / Phish Alarm alerts on similar emails (same subject, sender, domain, originating IP in header, etc.)",
      "Malware alert(s) associated to the LDAP in original alert",
      "Network traffic to malicious network(s) from LDAP in original alert", 
      "Social engineered additional information from existing associates"
    ],
    enrichmentActions: [
      "Threat intelligence enriches IOCs associated with email (IPs, hash, file name)",
      "Automation enriches AD accessible information",
      "Analysis of related network traffic",
      "Sandbox associated attachments"
    ],
    responseActions: [
      "Reset associate's password",
      "Containment of Host",
      "Block malicious domains/IPs at firewall",
      "Quarantine suspicious emails"
    ],
    preventionActions: [
      "Security awareness training program", 
      "Email security policy updates",
      "Enhanced email filtering rules",
      "Regular phishing simulation exercises"
    ]
  },
  technicalRequirements: {
    compliance: ["SOX", "PCI DSS", "ISO 27001"],
    integrations: ["Proofpoint TAP", "Office 365", "Active Directory", "NGFW", "Threat Intelligence"]
  },
  successCriteria: {
    detectionAccuracy: 95,
    falsePositiveRate: 5,
    responseTime: "15 minutes",
    businessImpact: "Reduce phishing incident response time by 70% and improve detection accuracy to 95%"
  },
  timeline: {
    setupDuration: "2 weeks",
    testingDuration: "3 weeks", 
    deploymentDate: "2025-03-01"
  },
  stakeholders: [
    "Security Operations Team",
    "IT Operations Team", 
    "Compliance Team",
    "End User Training Team"
  ]
};

export const sampleThreatFeedUseCase = {
  title: "CVE-YYYY-NNNN: The IngressNightmare in Kubernetes - Critical RCE Detection",
  description: "Critical remote code execution vulnerability discovered in Kubernetes Ingress controllers affecting container orchestration environments. This vulnerability allows attackers to execute arbitrary code on Kubernetes clusters through malicious ingress configurations, potentially leading to full cluster compromise. The exploit enables privilege escalation, lateral movement across containers, and data exfiltration from containerized applications. Organizations running Kubernetes in production environments face immediate risk of cluster takeover and data breach.",
  category: "cloud" as const,
  priority: "critical" as const,
  customerInfo: {
    teamSize: 15,
    currentTools: [
      "Kubernetes",
      "Docker Runtime",
      "Container Registry Scanner",
      "Prometheus Monitoring",
      "Istio Service Mesh",
      "kubectl CLI Tools"
    ],
    painPoints: [
      "Container security blind spots in production clusters",
      "Difficulty detecting runtime attacks in dynamic container environments", 
      "Limited visibility into Kubernetes control plane activities",
      "Complex multi-cluster security monitoring",
      "Challenge correlating container events with network activity"
    ],
    primaryDataSources: [
      {
        category: "cloud" as const,
        type: "Kubernetes Audit Logs",
        vendor: "Kubernetes",
        ingestionMethod: "API",
        priority: "critical" as const
      },
      {
        category: "cloud" as const,
        type: "Container Runtime Events",
        vendor: "Docker",
        ingestionMethod: "Agent",
        priority: "critical" as const
      },
      {
        category: "network" as const,
        type: "Service Mesh Telemetry",
        vendor: "Istio",
        ingestionMethod: "API",
        priority: "high" as const
      },
      {
        category: "endpoint" as const,
        type: "Node Agent Events",
        vendor: "Palo Alto Networks",
        ingestionMethod: "Agent", 
        priority: "high" as const
      }
    ]
  },
  useCaseDetails: {
    potentialIndicators: [
      "Suspicious ingress controller configuration changes with embedded code",
      "Unexpected container creation or modification events in kube-system namespace",
      "Privilege escalation attempts from ingress controller pods",
      "Network connections from ingress pods to internal cluster resources",
      "File system modifications in container images during runtime",
      "CVE-YYYY-NNNN exploitation signatures in Kubernetes API calls"
    ],
    enrichmentActions: [
      "Correlate ingress configuration changes with container events",
      "Analyze container image integrity and runtime modifications",
      "Map network traffic flows between compromised and target pods",
      "Enrich with threat intelligence on IngressNightmare exploitation TTPs",
      "Cross-reference with known Kubernetes attack patterns",
      "Validate container registry integrity and image provenance"
    ],
    responseActions: [
      "Immediately isolate affected ingress controller pods",
      "Block malicious ingress configurations at admission controller",
      "Quarantine compromised container images in registry",
      "Rotate cluster certificates and service account tokens",
      "Scale down suspicious workloads and review deployment manifests",
      "Implement network policies to contain lateral movement"
    ],
    preventionActions: [
      "Deploy admission controllers with security policy enforcement",
      "Implement runtime security monitoring for all containers",
      "Enable Pod Security Standards across all namespaces",
      "Regular vulnerability scanning of container images and clusters",
      "Network segmentation between container workloads",
      "Continuous compliance monitoring for CIS Kubernetes benchmarks"
    ]
  },
  technicalRequirements: {
    compliance: ["SOC 2", "FedRAMP", "ISO 27001", "CIS Kubernetes Benchmark"],
    integrations: ["Kubernetes API", "Docker Runtime", "Istio Service Mesh", "Container Registry", "Prometheus"]
  },
  successCriteria: {
    detectionAccuracy: 98,
    falsePositiveRate: 2,
    responseTime: "5 minutes",
    businessImpact: "Detect Kubernetes cluster compromises within 5 minutes and prevent lateral movement with 98% accuracy"
  },
  timeline: {
    setupDuration: "1 week",
    testingDuration: "2 weeks", 
    deploymentDate: "2025-02-15"
  },
  stakeholders: [
    "Cloud Security Team",
    "DevOps Engineering",
    "Container Platform Team",
    "Incident Response Team",
    "Compliance Team"
  ]
};

export const sampleMalwareUseCase = {
  title: "Malware Detection and Response",
  description: "Need to be able to detect and respond to all types of malware incidents; to include such things as viruses, worms, trojans, ransomware, spyware, and adware. Malware detection is an important part of cybersecurity, as malware can cause a range of problems, including data theft, system crashes, and unauthorized access to sensitive information. Potential risk is that a breach could result in data theft or impact to normal business functions.",
  category: "endpoint" as const,
  priority: "critical" as const,
  customerInfo: {
    teamSize: 12,
    currentTools: [
      "Cortex XDR",
      "Windows Security Event Logs",
      "Unix Security Event Logs", 
      "Network Traffic Analysis",
      "Endpoint Detection and Response"
    ],
    painPoints: [
      "Damage to brand/reputation due to potential compromise",
      "Currently creating 1 to 1 insights for Cortex XDR detection severities medium to critical",
      "Need to correlate all ingested log information to develop more enriched and actionable alerts"
    ],
    primaryDataSources: [
      {
        category: "endpoint" as const,
        type: "Windows Security Events",
        vendor: "Microsoft",
        ingestionMethod: "Agent",
        priority: "critical" as const
      },
      {
        category: "endpoint" as const,
        type: "Unix Security Events", 
        vendor: "Various",
        ingestionMethod: "Syslog",
        priority: "high" as const
      },
      {
        category: "network" as const,
        type: "Network Traffic",
        vendor: "Palo Alto Networks",
        ingestionMethod: "Syslog",
        priority: "high" as const
      }
    ]
  },
  useCaseDetails: {
    potentialIndicators: [
      "Windows Security Event logs showing suspicious process execution",
      "Unix Security Event Logs indicating unauthorized access",
      "Network traffic patterns consistent with malware communication",
      "File system changes indicating malware installation"
    ],
    enrichmentActions: [
      "Automation enriches AD accessible information",
      "Analysis of related network traffic", 
      "Analysis of endpoint activity",
      "Threat intelligence correlation"
    ],
    responseActions: [
      "Blocking of malicious activity",
      "Reset of compromised account(s)",
      "Quarantine of infected machine",
      "Isolation of affected network segments"
    ],
    preventionActions: [
      "Rebuild of compromised machine",
      "Security patch management",
      "Antivirus signature updates", 
      "Network segmentation improvements"
    ]
  },
  technicalRequirements: {
    compliance: ["SOX", "HIPAA", "PCI DSS"],
    integrations: ["Cortex XDR", "Windows Event Logs", "Unix Logs", "Network Monitoring"]
  },
  successCriteria: {
    detectionAccuracy: 98,
    falsePositiveRate: 3,
    responseTime: "10 minutes",
    businessImpact: "Reduce malware dwell time by 80% and achieve 98% detection accuracy"
  },
  timeline: {
    setupDuration: "3 weeks",
    testingDuration: "4 weeks",
    deploymentDate: "2025-03-15" 
  },
  stakeholders: [
    "Security Operations Center",
    "Incident Response Team",
    "IT Operations",
    "Business Continuity Team"
  ]
};