# ThreatResearchHub

<div align="center">

<table>
<tr>
<td align="center" width="140">
<img src="https://img.shields.io/badge/🕐-Stage%201-3b82f6?style=for-the-badge&logoColor=white" alt="Stage 1"/><br>
<strong>Use Case<br>Definition</strong><br>
<em>15-20 minutes</em>
</td>
<td align="center" width="140">
<img src="https://img.shields.io/badge/🕑-Stage%202-3b82f6?style=for-the-badge&logoColor=white" alt="Stage 2"/><br>
<strong>Security Stack<br>Configuration</strong><br>
<em>10-15 minutes</em>
</td>
<td align="center" width="140">
<img src="https://img.shields.io/badge/🕒-Stage%203-3b82f6?style=for-the-badge&logoColor=white" alt="Stage 3"/><br>
<strong>Infrastructure<br>Deployment</strong><br>
<em>2-4 hours</em>
</td>
<td align="center" width="140">
<img src="https://img.shields.io/badge/🕓-Stage%204-3b82f6?style=for-the-badge&logoColor=white" alt="Stage 4"/><br>
<strong>Data Source<br>Configuration</strong><br>
<em>1-2 hours</em>
</td>
<td align="center" width="140">
<img src="https://img.shields.io/badge/🕔-Stage%205-3b82f6?style=for-the-badge&logoColor=white" alt="Stage 5"/><br>
<strong>Platform Content<br>Generation</strong><br>
<em>45-60 minutes</em>
</td>
<td align="center" width="140">
<img src="https://img.shields.io/badge/🕕-Stage%206-3b82f6?style=for-the-badge&logoColor=white" alt="Stage 6"/><br>
<strong>Testing &<br>Validation</strong><br>
<em>30-45 minutes</em>
</td>
<td align="center" width="140">
<img src="https://img.shields.io/badge/🕖-Stage%207-3b82f6?style=for-the-badge&logoColor=white" alt="Stage 7"/><br>
<strong>Documentation &<br>Deployment</strong><br>
<em>20-30 minutes</em>
</td>
</tr>
</table>

**Threat Use Case Build and Test Workflow** • *Complete in 4-6 hours*

</div>

**Threat Use Case Build and Test Workflow**

Complete step-by-step workflow from use case definition to deployed security content across your selected platforms.

## Security Operations Content Engineering Workflow

## Overview

ThreatResearchHub enables security professionals to build comprehensive threat detection capabilities using a vendor-agnostic "Lego Block" architecture. The platform supports 20+ security vendors across 6 categories, allowing you to work with your existing security investments while maintaining complete flexibility for future technology decisions.

### Key Capabilities

- **Multi-Platform Content Generation**: Generate detection rules, playbooks, and dashboards for XSIAM, Splunk, Sentinel, QRadar, CrowdStrike, and 15+ other platforms
- **Lab Build Automation**: Rapidly deploy authentic environments with comprehensive log aggregation to your chosen security stack
- **Detection-as-Code**: Apply software engineering principles to security content development with version control and testing
- **Vendor-Agnostic Architecture**: Modular design allowing flexible swapping of security tools without vendor lock-in

## Architecture

### Supported Platform Categories

| Category | Platforms | Query Languages |
|----------|-----------|----------------|
| **SIEM** | XSIAM, Splunk, Sentinel, QRadar, Elastic, Chronicle | XQL, SPL, KQL, AQL, Lucene, YARA-L |
| **EDR** | Cortex XDR, CrowdStrike, SentinelOne, Defender | Platform APIs |
| **Firewall** | Palo Alto, CheckPoint, Fortinet | Native configs |
| **SOAR** | XSOAR, Phantom, Resilient | Playbook automation |
| **ASM** | Cortex Xpanse, Censys, Shodan | Attack surface mapping |
| **Attack Simulation** | BAS, SafeBreach, Cymulate | Validation testing |

### Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Content Engine**: Multi-platform query generation
- **Lab Automation**: Docker + Infrastructure-as-Code
- **Version Control**: Git integration with automated workflows

## 7-Stage Security Operations Workflow Process

### Stage 1: Use Case Definition (15-30 minutes)
**Define security objectives and threat scenarios from multiple input sources**

**Input Options:**
- **ThreatResearchHub Threat Feeds**: Select from curated threat intelligence automatically ingested from CISA, NIST, Unit42, and other trusted sources
- **URL Import**: Load threat reports directly from web URLs with automatic content extraction
- **PDF Upload**: Upload and parse threat intelligence PDFs with OCR and structured data extraction
- **Manual Entry**: Manually enter threat information, IOCs, and use case requirements

**Processing Features:**
- **MITRE ATT&CK Mapping**: Automatically map threats to MITRE framework tactics and techniques
- **IOC Extraction**: Parse and categorize indicators of compromise (IPs, domains, file hashes, registry keys)
- **Use Case Prioritization**: Score threats by severity, impact, and organizational relevance
- **PII Sanitization**: Homographic character transformation to protect sensitive information

### Stage 2: Security Stack Configuration (30-45 minutes)
**Configure multi-vendor security platform stack across 6 categories**

- **Platform Selection**: Choose from 20+ supported vendors (SIEM, EDR, Firewall, SOAR, ASM, Attack Simulation)
- **API Integration**: Configure authentication and connectivity for each selected platform
- **Query Language Mapping**: Automatic field mapping for XQL, SPL, KQL, AQL, Lucene, and YARA-L
- **Custom Field Configuration**: Define organization-specific data source schemas
- **Connection Validation**: Test API connectivity and data access permissions

### Stage 3: Infrastructure Deployment (60-90 minutes)
**Deploy authentic lab environment with comprehensive log aggregation**

- **Multi-Environment Support**: Deploy to Docker, Proxmox VMs, or Azure containers
- **Endpoint Simulation**: Windows/Linux endpoints with authentic activity patterns
- **Network Infrastructure**: Firewalls, domain controllers, and network segmentation
- **Attack Surface Mapping**: Web applications, databases, and exposed services
- **Log Forwarding Setup**: Configure comprehensive log aggregation to your chosen SIEM platform

### Stage 4: Data Source Configuration (60-90 minutes)
**Configure platform-specific data ingestion and field mapping**

- **Schema Discovery**: Automatically discover and validate data source schemas from live platforms
- **Field Mapping Validation**: Verify authentic field names and data types across all connected platforms
- **Data Pipeline Testing**: Test log ingestion and parsing for each configured data source
- **Custom Parser Creation**: Build platform-specific parsers for unique data formats
- **Real-Time Data Validation**: Ensure consistent data flow and field population

### Stage 5: Platform Content Generation (45-75 minutes)
**Generate detection rules, playbooks, and dashboards with high-fidelity validation**

- **Multi-Platform Detection Rules**: Generate queries in native platform languages (XQL, SPL, KQL, AQL)
- **Automated Playbook Creation**: Build response workflows with concrete, actionable steps
- **Analyst-Focused Dashboards**: Create operational dashboards with KPI monitoring and drill-down capabilities
- **Alert Layout Design**: Configure alert presentations with actionable decision buttons
- **Content Validation System**: Zero-hallucination validation against authentic platform samples

### Stage 6: Testing & Validation (30-60 minutes)
**Deploy and validate content across all configured platforms**

- **Live Platform Deployment**: Deploy generated content to development/testing environments
- **Detection Rule Testing**: Execute test scenarios to validate rule effectiveness and accuracy
- **False Positive Analysis**: Tune detection logic to minimize false positives while maintaining coverage
- **Performance Optimization**: Ensure queries execute efficiently within platform resource constraints
- **Cross-Platform Consistency**: Verify consistent detection coverage across all configured platforms

### Stage 7: Documentation & Deployment (30-45 minutes)
**Generate production-ready deployment packages with complete documentation**

- **Deployment Package Generation**: Create platform-specific deployment packages with installation instructions
- **Technical Documentation**: Generate comprehensive technical documentation with implementation details
- **Operational Procedures**: Create SOC playbooks with step-by-step response procedures
- **Version Control Integration**: Commit all content to Git with proper branching and tagging
- **Production Deployment Guide**: Provide complete guides for deploying content to production environments

**Total Estimated Time**: 4-6 hours for complete end-to-end implementation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker for lab environments
- Access to target security platforms
- PostgreSQL database (optional, defaults to in-memory storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/sc-clmn-io/ThreatResearchHub.git
cd ThreatResearchHub

# Install dependencies
npm install

# Configure environment (optional)
cp .env.template .env
# Edit .env with your API keys and database settings

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Quick Start

1. **Launch Application**: Open browser to `http://localhost:5000`
2. **Access Sequential Workflow**: Navigate to the guided 7-stage workflow interface
3. **Complete Implementation**: Follow the systematic process from use case to deployment
   - **Stages 1-2**: Define use case and configure your security stack
   - **Stages 3-4**: Deploy infrastructure and configure data sources  
   - **Stages 5-6**: Generate and validate security content
   - **Stage 7**: Generate production deployment packages

> 📖 **Detailed Implementation**: See [COMPREHENSIVE_7_STAGE_WALKTHROUGH.md](COMPREHENSIVE_7_STAGE_WALKTHROUGH.md) for complete step-by-step instructions with timing and prerequisites

## Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   └── lib/            # Utilities and helpers
├── server/                 # Node.js backend services
│   ├── security-stack-manager.ts  # Multi-platform adapters
│   ├── content-generation-orchestrator.ts  # Content engine
│   └── routes.ts           # API endpoints
├── shared/                 # Shared types and schemas
└── docs/                   # Documentation and guides
```

## Features

### Content Generation Engine
- **Native Query Languages**: Generate queries in XQL, SPL, KQL, AQL, Lucene, and YARA-L
- **Field Mapping**: Automatic translation between vendor-specific schemas
- **Template Library**: Pre-built templates for common threat scenarios
- **Validation System**: Syntax and logic validation for all generated content

### Lab Environment Builder
- **Multi-Cloud Support**: Deploy on Azure, AWS, or local infrastructure
- **Authentic Datasets**: Use real log data for accurate testing
- **Comprehensive Coverage**: Endpoint, cloud, network, and identity scenarios
- **Automated Deployment**: Infrastructure-as-Code with validation checkpoints

### Platform Integrations
- **SIEM Platforms**: Native integration with 6 major SIEM platforms
- **Endpoint Detection**: Support for 4 leading EDR solutions
- **Network Security**: Integration with top firewall vendors
- **Security Orchestration**: SOAR platform automation
- **Attack Surface**: Continuous security monitoring integration
- **Attack Simulation**: Validation through controlled testing

## Business Benefits

- **Technology Flexibility**: Work with existing security investments
- **Vendor Independence**: Avoid vendor lock-in scenarios
- **Future-Proof Architecture**: Easy addition of new platforms
- **Cost Optimization**: Use optimal tool combinations
- **Operational Efficiency**: Streamlined content development process
- **Quality Assurance**: Comprehensive testing and validation

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on:

- Code standards and style guide
- Testing requirements and procedures
- Documentation standards
- Pull request process
- Issue reporting guidelines

## Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [COMPREHENSIVE_7_STAGE_WALKTHROUGH.md](COMPREHENSIVE_7_STAGE_WALKTHROUGH.md) | Complete step-by-step implementation guide | Security engineers |
| [MANIFEST.md](MANIFEST.md) | Platform capabilities and architecture | Technical stakeholders |
| [DOCUMENTATION_STRUCTURE.md](DOCUMENTATION_STRUCTURE.md) | Navigation guide for all documentation | All users |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Contact**: sc@clmn.io
- **Issues**: Please use GitHub Issues for bug reports and feature requests
- **Documentation**: Comprehensive guides included in repository
- **Community**: Coming soon - preparing for open source community

## Acknowledgments

- Built with modern web technologies for maximum compatibility
- Designed for multi-vendor security environments
- Vendor-agnostic architecture supporting 20+ platforms
- Detection-as-Code principles following industry best practices

---

**Ready to transform your threat intelligence into actionable security content?**

Start with the [7-Stage Sequential Workflow](http://localhost:5000/sequential-workflow) and experience comprehensive, vendor-agnostic security content engineering.
- **API Reference**: Backend service documentation
- **Deployment Guide**: Production deployment instructions
- **Architecture Guide**: Technical implementation details
- **Platform Adapters**: Vendor-specific integration guides

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, issues, or feature requests:

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Join GitHub Discussions for community support
- **Documentation**: Check the docs/ directory for detailed guides
- **Email**: Contact sc@clmn.io for direct support

## Roadmap

### Current Focus
- Enhanced multi-platform query optimization
- Advanced threat intelligence correlation
- Machine learning-powered platform recommendations

### Upcoming Features
- Enterprise deployment automation
- Advanced custom field mapping
- Extended platform coverage (25+ vendors)
- Cloud-native deployment options

---

**Ready to transform your threat intelligence into comprehensive, multi-platform security solutions.**

*Built for security professionals who demand flexibility, accuracy, and operational efficiency.*