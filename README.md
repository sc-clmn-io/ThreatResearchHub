# ThreatResearchHub - Content-as-Code Platform

## Overview

ThreatResearchHub is a comprehensive Content-as-Code platform for XSIAM/Cortex Cloud detection engineering. The platform transforms threat intelligence into complete detection packages following Detection-as-Code principles with the NVISO DDLC (Detection Development Life Cycle) framework.

## Key Features

### 🎯 Complete Detection Packages
- **XQL Correlation Rules**: Production-ready detection rules with proper field mappings
- **Automation Playbooks**: XSOAR-compatible response workflows
- **Alert Layouts**: Analyst decision support interfaces
- **Operational Dashboards**: Real-time threat monitoring widgets

### 🔄 NVISO DDLC Framework Integration
- **6-Phase Workflow**: Requirement → Design → Development → Testing → Deployed → Monitoring
- **Version Control**: GitHub-style content management with branch tracking
- **Quality Assurance**: Automated validation and testing workflows
- **Professional Standards**: Industry-standard detection engineering practices

### 🧠 Intelligent Threat Processing
- **Multi-Source Ingestion**: PDF reports, URLs, threat feeds, manual input
- **MITRE ATT&CK Mapping**: Automatic technique and tactic identification
- **IOC Extraction**: IPs, domains, hashes, file paths with smart filtering
- **Threat Categorization**: Endpoint, network, cloud, identity, web, email

### 📈 Live Threat Intelligence
- **4x Daily Updates**: Fresh intelligence from CISA, Unit42, SANS ISC, MITRE
- **High/Critical Focus**: Filters out noise, focuses on actionable threats
- **Real-time Metrics**: Threat counts, severity distribution, trend analysis
- **Source Diversity**: Multiple threat intelligence providers

## Technical Architecture

### Backend Services
- **Content Generation Engine**: Singleton service for XSIAM content creation
- **Threat Report Parser**: Normalizes threat reports from multiple sources
- **SOC Process Engine**: Generates investigation workflows and decision trees
- **Content Storage**: In-memory management of detection packages with DDLC tracking
- **Threat Intelligence Service**: Live feeds from multiple security vendors

### API Endpoints

#### Content Generation
```
POST /api/content/parse-threat-report    # Parse and normalize threat reports
POST /api/content/generate-xql-rule      # Generate XQL correlation rules
POST /api/content/generate-playbook      # Generate automation playbooks  
POST /api/content/generate-alert-layout  # Generate alert layouts
POST /api/content/generate-dashboard     # Generate operational dashboards
```

#### Content Management
```
GET  /api/content/packages               # List all content packages
GET  /api/content/packages/:id           # Get specific package
POST /api/content/packages               # Store new package
PUT  /api/content/packages/:id/ddlc-phase # Update DDLC phase
GET  /api/content/statistics             # Get content statistics
GET  /api/content/search?q=query         # Search packages
```

#### SOC Process Generation
```
POST /api/soc/generate-process           # Generate SOC processes
POST /api/soc/generate-workflow-diagram  # Create workflow diagrams
POST /api/soc/generate-response-playbook # Generate response playbooks
```

#### Export Formats
```
POST /api/export/stix2                   # Export to STIX 2.1 format
POST /api/export/use-case                # Export training use case
```

### Frontend Architecture
- **React 18 + TypeScript**: Modern component architecture
- **Wouter Routing**: Lightweight client-side navigation
- **Shadcn/UI Components**: Professional interface with Radix primitives
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first styling system

## Sample Content Package

The platform comes with pre-loaded sample data demonstrating a complete detection package:

**APT29 Cozy Bear Campaign Detection**
- **XQL Rule**: Advanced correlation with risk scoring and field mapping
- **Playbook**: Automated endpoint isolation and threat containment
- **Alert Layout**: Analyst decision support with enrichment queries
- **Dashboard**: Real-time monitoring with alerting thresholds
- **DDLC Status**: Development phase with validation notes

## Data Integrity & Authenticity

- **Real Threat Intelligence**: Live feeds from authoritative security sources
- **Production-Ready Content**: All generated content follows industry standards
- **Authentic Field Mappings**: Proper XSIAM dataset field references
- **Validation Workflows**: Quality assurance at every DDLC phase

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (optional, uses in-memory storage by default)

### Installation
```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

### API Testing
```bash
# Test health endpoint
curl http://localhost:5173/api/health

# Get content packages
curl http://localhost:5173/api/content/packages

# Get content statistics  
curl http://localhost:5173/api/content/statistics
```

## Development Workflow

1. **Load Threat Intelligence**: Import from PDF, URL, or live feeds
2. **Parse & Normalize**: Extract IOCs, MITRE techniques, threat actors
3. **Generate Content**: Create complete XSIAM detection packages
4. **DDLC Management**: Progress through development lifecycle phases
5. **Quality Assurance**: Validate content against XSIAM specifications
6. **Production Deployment**: Export validated content for XSIAM import

## Detection-as-Code Principles

- **Version Control**: Every content change is tracked and auditable
- **Collaborative Development**: Multi-contributor workflows with reviews
- **Automated Testing**: Validation pipelines for quality assurance  
- **Standardized Formats**: Consistent structure across all content types
- **Documentation**: Comprehensive metadata and tuning guidance

## Platform Benefits

- **Faster Detection Development**: Automated content generation from threat reports
- **Consistent Quality**: Standardized formats and validation workflows
- **Collaborative Workflows**: Team-based development with proper version control
- **Operational Excellence**: Complete packages ready for production deployment
- **Continuous Improvement**: DDLC framework ensures ongoing optimization

## Contributing

This platform follows Detection-as-Code principles. All contributions should:
- Include proper testing and validation
- Follow NVISO DDLC methodology
- Maintain authentic data standards
- Document architectural decisions

## Support

For technical questions or feature requests, please refer to the comprehensive documentation in the `/docs` directory or contact the development team.

---

**ThreatResearchHub** - Transforming threat intelligence into actionable security content through systematic Detection-as-Code methodologies.