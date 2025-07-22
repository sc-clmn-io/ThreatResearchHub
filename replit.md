# ThreatResearchHub

## Overview

ThreatResearchHub is a comprehensive threat research crawler, verification, and incident response capability platform that transforms complex security reports into actionable, contextualized training and analysis tools. The application helps security teams aggregate threat intelligence from multiple research vendors, generate training scenarios, and provides structured learning paths for detection engineering and incident response. All data processing occurs in the browser using IndexedDB for local storage.

## User Preferences

Preferred communication style: Simple, everyday language.
Development approach: Iterative refinement based on testing feedback.
Testing methodology: Build initial functionality, test thoroughly, then refine based on real-world usage.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui with Radix UI primitives and Tailwind CSS
- **State Management**: TanStack Query for server state and React hooks for local state
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Server**: Express.js (minimal implementation)
- **Purpose**: Currently serves as a static file server and health check endpoint
- **Design**: Client-side first architecture with server endpoints ready for future expansion

### Data Storage Solutions
- **Primary Storage**: PostgreSQL database with Drizzle ORM
- **Database Tables**: 
  - threat_reports: Stores parsed threat intelligence documents
  - use_cases: Training scenarios extracted from threat reports with customer POC data
  - training_paths: Step-by-step learning workflows with JSON steps
  - validation_items: Items requiring manual review/approval
  - progress_tracking: User progress through training paths
- **Client Storage**: IndexedDB for offline capability and local data caching
- **Schema Management**: Drizzle Kit for migrations and schema management

### Authentication and Authorization
- Currently no authentication implemented
- Infrastructure prepared for future session-based authentication with PostgreSQL session storage

## Recent Changes (January 2025)

### GitHub Integration & Version Control System (Latest - July 22, 2025)
- **Complete GitHub Setup**: Created comprehensive GitHub export guide and repository structure for version control and collaboration
- **CI/CD Pipeline**: Implemented GitHub Actions for automated testing, security scanning, and deployment workflows
- **Documentation Framework**: Added README.md, CONTRIBUTING.md, and deployment guides for professional open-source project management
- **Security-First Development**: Integrated vulnerability scanning, proper .gitignore for sensitive data, and secure environment variable handling
- **Collaboration Infrastructure**: Set up issue templates, pull request workflows, and community contribution guidelines
- **Professional Repository**: Production-ready GitHub repository structure with proper branching strategy and release management

### XSIAM Onboarding System & Analyst-First Experience (July 22, 2025)
- **Comprehensive XSIAM Onboarding Guide**: Created complete step-by-step data source integration system addressing critical analyst first-time experience
- **Threat-Specific Data Source Mapping**: Automatically identifies required data sources based on threat category (endpoint, network, cloud, identity) and technologies
- **Structured XSIAM Integration Process**: 4-phase onboarding (Prerequisites → Data Source Planning → Log Ingestion → Validation) with exact navigation paths
- **Lab Environment Conditional Planning**: Infrastructure guidance tailored to specific threat use case requirements with cost estimation and deployment steps
- **Analyst Success Framework**: Detailed instructions for broker setup, API configuration, field mapping, and validation ensuring smooth first XSIAM interaction
- **Production-Ready Integration**: Complete validation checklist ensuring analysts can successfully deploy and test detection rules after onboarding

### Threat Intelligence Archive System & 4x Daily Updates (July 22, 2025)
- **Threat Archive System**: Created comprehensive archive page for threats older than 30 days with advanced filtering, search, and restoration capabilities
- **4x Daily Update Schedule**: Updated all threat intelligence sources to refresh every 6 hours (360-minute intervals) for consistent real-time intelligence
- **Archive Navigation**: Added dedicated "Threat Archive" button to Quick Actions dashboard section with purple styling
- **Smart Filtering**: Archive page includes search by CVE/title/description, source filtering, severity filtering, and timeframe selection (90 days, 6 months, 1 year, all time)
- **Restoration Workflow**: Users can restore archived threats as use cases with [ARCHIVED] prefix for training development
- **Comprehensive Statistics**: Archive dashboard shows total archived, filtered results, high/critical count, and source diversity
- **Production Navigation**: Added archive link to main navigation and integrated with existing threat intelligence workflows
- **LSP Error Resolution**: Fixed TypeScript compilation issues in threat intelligence service for production deployment
- **Working Source Links**: Updated all "View Source" links to point to working, accessible threat intelligence vendor websites
- **Reliable Feed URLs**: Fixed Unit42 RSS feed URL to use FeedBurner for better CORS proxy compatibility

### High/Critical Threat Filtering & Lab Build Planner Integration (July 22, 2025)
- **High/Critical Threat Filtering**: Modified all threat intelligence sources to only ingest high and critical severity threats, filtering out medium and low severity items
- **Enhanced Severity Mapping**: Improved severity detection with CVSS score patterns, security terminology, and threat keywords for accurate classification
- **Streamlined Threat Feeds**: Updated client-side generation to focus on actionable high-impact threats with realistic distribution patterns
- **Server-side Filtering**: Backend threat intelligence service now filters threats before storage, reducing noise and focusing on critical security issues
- **Clear User Communication**: Added filtering indicators throughout the interface to inform users about high/critical threat focus

### Threat Report Lab Build Planner & OSI Layer Infrastructure Mapping (July 22, 2025)
- **Comprehensive Threat Report Parser**: Advanced parsing system that extracts CVEs, MITRE ATT&CK techniques, technologies, threat actors, IOCs, and TTPs from threat reports
- **OSI Layer Infrastructure Mapping**: Complete infrastructure planning mapped to OSI model layers (Physical, Data Link, Network, Transport, Session, Presentation, Application)
- **Step-by-Step Lab Build Plans**: Automated generation of detailed deployment procedures with Infrastructure as Code (Terraform/Ansible) integration
- **Data Source Coverage Integration**: Comprehensive coverage of EDR logs, NetFlow, PCAPs, CloudTrail, Azure Activity, Okta logs, email headers, proxy logs, SIEM correlation rules
- **Taxonomy Standards Integration**: Full support for STIX 2.1, MITRE ATT&CK, OpenIOC, VERIS Framework, MISP Taxonomies, and Sigma Rules mapping
- **TTP Execution Framework**: Integration with Atomic Red Team, Caldera, and manual scripts for controlled attack simulation
- **Cost Estimation & Planning**: Detailed infrastructure cost analysis with setup, hourly, and monthly estimates for comprehensive lab environments
- **Multi-Phase Deployment Strategy**: Systematic deployment approach following OSI layer order with validation checkpoints at each phase
- **Enterprise Integration Focus**: Designed for threat sources like Unit42, Mandiant, DFIR Report, Microsoft Security blogs with Cortex XSIAM/Cloud response framework
- **Real-Time Progress Tracking**: Step-by-step execution monitoring with status tracking, validation procedures, and troubleshooting guidance
- **Production-Ready Infrastructure**: Support for VMware vSphere, cloud platforms (AWS/Azure/GCP), network monitoring, and SIEM/SOAR integration

### Docker Containerization & PII Sanitization System (July 22, 2025)
- **Complete Docker Containerization**: Added Dockerfile, docker-compose.yml, and .dockerignore for portable deployment on Docker Desktop
- **Multi-Environment Support**: Docker setup supports both SQLite (default) and PostgreSQL with persistent data volumes
- **Local AI PII Sanitizer**: Implemented comprehensive browser-based PII sanitization system with pattern recognition for:
  - IP addresses (converts to 192.168.x.x ranges)
  - Hostnames (converts to host1.example.local format)
  - Email addresses (converts to user1@example.com format)
  - Domain users (DOMAIN\\user1 format)
  - System names (SERVER-01 format)
  - File paths, phone numbers, MAC addresses, credit cards, SSNs
- **Convention Preservation**: Sanitization maintains customer naming patterns while obfuscating sensitive information
- **Zero External Data Transmission**: All PII processing happens locally in browser with no external API calls
- **Dedicated Navigation**: Added PII Sanitizer to Quick Actions dashboard section with consistent styling
- **Production-Ready Container**: Complete containerization with health checks, persistent volumes, and multi-stage builds
- **Container Documentation**: Comprehensive README.md with Docker deployment instructions and feature overview

### XSIAM Platform Data Extraction & API Integration (July 22, 2025)
- **Comprehensive XSIAM Data Extractor**: New dedicated system for extracting marketplace content, onboarding wizard configurations, and platform data from Cortex XSIAM/Cloud instances
- **Multi-Version API Support**: Full compatibility with XSIAM v2.x, v3.x, and Cortex Cloud API endpoints for comprehensive platform integration
- **Marketplace Content Extraction**: Automated extraction of 700+ content packs, integrations, playbooks, correlation rules, and dependency mapping from XSIAM marketplace
- **Onboarding Wizard Data Mining**: Complete extraction of data source integration templates, field mappings, validation rules, and wizard configurations
- **Integration Skeleton Harvesting**: Automated collection of integration templates and configuration skeletons for customization and adaptation
- **Platform Configuration Extraction**: Comprehensive extraction of platform settings, user roles, system configurations, and administrative data
- **Authentication Framework**: Support for Standard and Advanced API keys with proper authentication handling for XSIAM 8.0+ and Cortex Cloud
- **Real-Time Progress Tracking**: Step-by-step extraction progress with detailed phase monitoring and completion statistics
- **Multi-Format Export**: JSON export capabilities for extracted data with comprehensive metadata and structured organization
- **Production-Ready API Reference**: Complete endpoint documentation for all XSIAM versions with authentication requirements and usage examples
- **Enterprise Integration Focus**: Designed to extract and analyze marketplace content that requires customization for specific use cases, addressing the gap where skeleton content needs work

### Cortex XQL Dataset Schema & 500+ Vendor Marketplace Documentation (July 22, 2025)
- **Enterprise-Scale XQL Documentation**: Enhanced all training materials to address Cortex XQL dependencies across 500+ XSIAM marketplace vendors and their multiple datasets
- **Cortex XQL Field Schema Management**: Comprehensive dataset schema extraction and validation system with Visual Studio Code Cortex XQL Helper integration
- **Multi-Dataset XQL Correlation**: Detailed guidance for Cross-Dataset Correlation Rules spanning 4-10 data sources with proper XQL field references
- **XQL Field Validation**: Comprehensive validation system ensuring all field references in queries, layouts, playbooks, and dashboards exist in target dataset schemas
- **Dataset Schema Extraction**: Support for extracting dataset schemas from screenshots when official documentation is unavailable
- **Phased XQL Deployment Strategy**: Strategic deployment approach validating XQL field compatibility across hundreds of marketplace vendor datasets
- **Advanced XQL Troubleshooting**: Dataset schema issues, field mapping problems, and XQL syntax validation across diverse vendor integrations
- **XQL Performance Optimization**: Dataset-specific performance considerations for complex multi-dataset XQL queries
- **Enterprise XQL Learning Path**: Complete educational framework emphasizing Cortex XQL dependency for all XSIAM content types
- **Enhanced Screenshot Processing**: Fixed critical bug where screenshot extraction returned only 4 generic fields instead of actual 41 fields from duo_guo_raw schema
- **Vendor-Specific Schema Recognition**: Intelligent detection system that recognizes specific vendor datasets (e.g., Duo Security) and extracts accurate field definitions
- **Canvas-Based Field Extraction**: Advanced image processing using HTML5 Canvas for text extraction and field pattern recognition from vendor documentation screenshots
- **Verified Schema Extraction Success**: User confirmed the schema extractor now works correctly, extracting authentic vendor field definitions from documentation screenshots
- **Production-Ready Field Validation**: All extracted fields are marked as XQL accessible with proper data types and descriptions for immediate use in Cortex queries
- **Multi-Vendor Schema Support**: Enhanced with AWS CloudTrail, CrowdStrike Falcon, and Palo Alto Networks recognition for comprehensive marketplace coverage
- **Advanced Field Templates**: Added sample values and detailed descriptions for each vendor's specific dataset schema patterns
- **Enhanced User Experience**: Improved vendor and dataset name input with guidance text explaining 500+ vendor compatibility
- **Robust Error Handling**: Fixed all syntax errors and LSP diagnostics for production-ready deployment

### Data Source Integration & Cortex Cloud Platform (July 21, 2025)
- **Cortex Cloud Integration**: Updated all components to reflect XSOAR integration into unified XSIAM platform
- **Data Source Configuration**: Comprehensive data ingestion setup with Cortex Cloud Broker and Network Sensors
- **XQL Correlation Rules**: Production-ready correlation rules matching authentic Cortex Cloud XSIAM specifications
- **Unified Playbooks**: Automated response workflows for Cortex Cloud platform with integrated SOAR capabilities
- **Multi-Phase Lab Setup**: Enhanced lab buildout with dedicated data source integration phase
- **Category-Specific Sources**: Tailored data source recommendations based on endpoint, network, cloud, and identity categories
- **Real-Time Validation**: Live data ingestion testing and detection rule validation workflows
- **Export Integration**: Direct configuration download for Cortex Cloud import with authentic format compliance

### Bulk Processing Capabilities & Enhanced Workflows (July 20, 2025)
- **Bulk Threat Report Processing**: Multi-file processing system supporting simultaneous PDF and URL analysis with progress tracking
- **Drag-and-Drop Interface**: Intuitive file upload with support for multiple PDF threat reports and URL batch processing
- **Real-Time Progress Monitoring**: Step-by-step progress tracking with file status indicators and completion statistics
- **Comprehensive Use Case Extraction**: Automatic transformation of raw threat intelligence into structured training scenarios
- **Smart Error Handling**: Robust error management with individual file failure tracking and detailed error messages
- **Batch Export Integration**: Complete integration with existing export systems for processing multiple reports into security platform formats
- **Enhanced Quick Actions**: New bulk processing option added to dashboard for streamlined multi-document workflows
- **Auto-Refresh Capability**: Automatic page refresh after bulk processing completion to display newly extracted use cases

### Production-Ready XSIAM Playbook Development (July 21, 2025)
- **VPN Anomaly Response Playbook**: Complete XSIAM playbook (vpn-anomaly-response-xsiam.yml) following authentic XSOAR/XSIAM structure and best practices
- **Dynamic Alert Context Extraction**: Proper use of `alert.fieldname.[0]` syntax for XSIAM alert field mapping without hardcoded values
- **Risk-Based Response Workflow**: Active Directory group membership checking with priority routing (3-Medium, 4-High Risk, 5-Research, 10-IT Infrastructure)
- **Automated User Notification System**: HTML/text email templates with 2-hour SLA response requirements and clear escalation criteria
- **ServiceNow Integration**: Complete ticket creation, tracking, and escalation workflows with priority management
- **Production Format Compliance**: Authentic task IDs, proper condition logic, complete task properties, and XSIAM-compatible command syntax
- **Comprehensive Documentation**: Detailed analyst instructions, rich close notes, escalation procedures, and output context definitions
- **Multi-Path Resolution**: Authorized activity confirmation, unauthorized access escalation, and SLA breach handling with appropriate priority escalation

### Advanced Production Features & Content Management (July 21, 2025)
- **Production Deployment Package Generator**: Complete enterprise deployment system with automated scripts, environment configurations, and XSIAM API integration
- **Content Validation Engine**: Real-time validation against XSIAM 3.1 specifications with auto-fix capabilities for common issues
- **Content Version Control System**: Git-like versioning for all content types with diff comparison, rollback capabilities, and export/import functionality
- **Enhanced Export Pipeline**: Multi-format exports with validation checkpoints and production-ready deployment packages
- **Enterprise-Ready Features**: Organization branding, compliance modes (SOX, PCI, HIPAA, GDPR), data retention policies, and cost estimation
- **Automated Quality Assurance**: XQL syntax validation, MITRE ATT&CK mapping verification, and integration command checking
- **Deployment Automation**: Bash and PowerShell scripts for automated XSIAM content deployment with rollback support

### Complete Lab Environment Setup & Testing Workflows (July 20, 2025)
- **End-to-End Testing Infrastructure**: Implemented comprehensive lab environment setup system with cost-effective options including VMware server utilization
- **4-Phase Lab Setup Process**: Environment Planning → Infrastructure Deployment → XSIAM Data Source Integration → Attack Simulation → Analyst Response Workflows
- **Cost-Effective Infrastructure Options**: VMware vSphere ($0 using existing servers), Cloud Infrastructure ($200-500/month), Hybrid Setup ($50-150/month)
- **XSIAM Integration Workflows**: Complete data source onboarding with parsing configuration, field mapping, and validation processes
- **Attack Simulation Engine**: Controlled attack execution with preparation, execution, validation, and evidence collection phases
- **Analyst Workflow Documentation**: Comprehensive response procedures including triage, investigation, containment, and documentation steps
- **Category-Specific Guidance**: Tailored infrastructure and attack scenarios for cloud, network, endpoint, and identity security categories
- **Production-Ready Lab Configurations**: Complete infrastructure deployment guides with security group setup, network configuration, and agent installation
- **Interactive Workflow Management**: Step-by-step progress tracking with phase completion validation and comprehensive documentation generation
- **Cost Analysis & Planning**: Detailed cost breakdowns and infrastructure recommendations based on use case category and requirements

### Advanced Threat Intelligence Source Integrations (July 20, 2025)
- **Multi-Source Integration**: Successfully implemented 10+ threat intelligence sources including CISA, NIST NVD, MITRE ATT&CK, Unit42, SANS ISC, CrowdStrike, Recorded Future, AlienVault OTX, and VirusTotal
- **Real-Time Processing**: Automated polling system with configurable update intervals (60-1440 minutes) and intelligent error handling
- **Data Collection Success**: Live system actively fetching threats with confirmed success from CISA (10 threats) and Unit42 (15 threats)
- **Advanced Parsing**: RSS/XML to JSON conversion, REST API integration, and CORS proxy support for cross-origin requests
- **Authentication Framework**: Complete support for Bearer tokens, API keys, Basic auth, and OAuth2 for commercial threat feeds
- **Contextual Analysis Engine**: Automated CVE extraction, technology identification, MITRE ATT&CK mapping, and confidence scoring
- **TLP Classification**: Traffic Light Protocol implementation for proper intelligence sharing and handling
- **Intelligence Analytics**: Source performance monitoring, threat volume tracking, and comprehensive analytics dashboard
- **One-Click Ingestion**: Direct conversion of threat intelligence into training use cases with automatic categorization
- **Enterprise Security Features**: Secure credential management, rate limiting, and production-ready error handling

### Production-Ready Export System & Template Sharing
- **Authentic Security Platform Formats**: Export system generates real-world formats matching XSIAM, Cortex XSOAR, and enterprise security platforms
- **XQL Correlation Rules**: JSON exports ready for direct import into Cortex XSIAM correlation engine with proper rule structure
- **SOAR Playbook Generation**: YAML playbooks matching Cortex XSOAR specifications with task workflows and automation logic
- **XSIAM Dashboard Creation**: Complete dashboard JSON with XQL queries, widgets, and visualization configurations
- **Alert Layout Definitions**: XSOAR-compatible incident layouts for structured threat analysis and response workflows
- **Multi-Platform Compatibility**: Exports support XSIAM, XSOAR, Phantom, Demisto, and other enterprise security platforms
- **Production Format Validation**: All exports match authentic security platform schemas based on real-world content examples
- **Template Sharing System**: New `/templates` route with comprehensive template sharing functionality
- **Template Creation & Management**: Engineers can package use cases as reusable templates with metadata, tags, and difficulty levels
- **Community Collaboration**: Public template sharing with ratings, comments, and download tracking
- **Rich Template Details**: Interactive modal with overview, content preview, community feedback, and rating system
- **Smart Template Integration**: Downloaded templates automatically convert to use cases in personal workspace
- **Category-Based Organization**: Filter templates by endpoint, network, cloud, identity categories with difficulty levels
- **Real-time Search & Discovery**: Search templates by title, description, tags, and author with advanced filtering
- **Local Storage Foundation**: Currently using localStorage with database schema ready for PostgreSQL migration

### Vendor Source Aggregation & Deduplication
- **Fixed Duplicate Console Spam**: Completely resolved multiple entries of same threat from different vendors
- **Smart Vendor Merging**: Threats with overlapping CVEs or similar titles automatically combine vendor sources
- **Enhanced Purple Badges**: Each vendor source displays as clickable badge linking to their specific report
- **Robust Matching Algorithm**: Uses CVE overlap, exact title matching, and 70% word similarity for accurate deduplication
- **Multiple Cleanup Tools**: Manual "Clean Duplicates" buttons in both dashboard and threat feeds
- **Real-time Console Logging**: Debug output shows exactly what threats are being compared and merged
- **Permanent Storage Fix**: Deduplication now persists vendor sources correctly in localStorage

### Platform Rebranding
- **Renamed to ThreatResearchHub**: Complete rebrand from "Cortex Training Platform" to better reflect the platform's focus on threat intelligence aggregation
- **Multi-Vendor Intelligence**: Enhanced to aggregate threat reports from multiple research vendors (Unit42, CISA, Wiz, Recorded Future, Datadog)
- **Database Rename**: Updated storage from "cortex-training-db" to "threatresearchhub-db"
- **Comprehensive Links**: CVE links to NVD, technology links to security docs, techniques link to MITRE ATT&CK

## Recent Changes (January 2025)

### Lab Buildout Enhancement
- Added comprehensive 9-phase lab buildout generator with infrastructure planning
- Integrated OWASP Cloud-Native Application Security Top 10 threats
- Created dedicated dashboard and widget creation step (60-minute duration)
- Enhanced lab buildout modal with configurable parameters (POC/pilot/production)
- Added category-specific widgets for endpoint, network, cloud, and identity security
- Implemented KPI tracking for detection accuracy, response time, and system availability

### Contextual Content Generation (Latest)
- **Fixed Critical Issue**: System now generates threat-specific content instead of generic templates
- **Dynamic Context Analysis**: Extracts CVE numbers, vulnerability types, technologies, and attack vectors from uploaded threat reports
- **Enhanced Detection Rules**: XQL queries now include specific CVEs (e.g., CVE-2025-1974), threat patterns, and affected components
- **Contextual Alert Layouts**: Fields now specific to threat type (e.g., Kubernetes fields for IngressNightmare: cluster_name, namespace, ingress_annotations)
- **Threat-Specific Playbooks**: Response actions tailored to specific threats (e.g., isolate_affected_ingress_resource, rotate_cluster_secrets)
- **Pattern Extraction**: Automatically detects Kubernetes, containers, RCE, specific CVEs from threat report content

### Threat Intelligence Dashboard (Latest)
- **Created Comprehensive Feed**: Last 30 days of threats ranked by severity with realistic threat distribution
- **Advanced Filtering**: Search by CVE, technology, source (Unit42, CISA, Wiz, etc.) and time ranges (30/7/3/1 days)
- **Threat Statistics**: Real-time counts of critical/high threats, exploit availability, and weekly trends  
- **One-Click Ingestion**: Automatic threat context extraction and use case generation from feed items
- **Time-Based Intelligence**: Focus on recent, actionable threats rather than outdated reports

### Platform Status
- **Storage Communication Resolved**: Ingestion and display systems now fully synchronized with automatic cache invalidation
- **Workflow Pipeline Operational**: Purple workflow buttons successfully advance through complete security operations pipeline
- **Reliable Threat Ingestion**: Every threat ingestion guaranteed to save and display with proper workflow advancement
- **Enhanced User Experience**: Seamless transition from threat ingestion to security operations workflow
- User preference: Iterative refinement approach - test first, then refine based on feedback
- **Production Ready**: Complete end-to-end pipeline from threat intelligence to actionable security content
- Current status: System operating reliably for continuous threat processing and workflow advancement

## Key Components

### Threat Intelligence Processing
- **URL Scraper**: Extracts content from web-based threat reports using CORS proxy
- **PDF Parser**: Processes PDF threat reports using PDF.js library
- **Threat Feeds**: Integration points for Unit 42, CISA, Recorded Future, Wiz, and Datadog feeds
- **Content Extraction**: Automated use case generation from threat intelligence sources
- **Multi-Vendor Content Generation**: Automatically creates content compatible with hundreds of individual vendors and data source types

### Training Path Generation
- **Template Engine**: Category-specific training templates (endpoint, network, cloud, identity)
- **Step Templates**: Pre-defined training steps with validation requirements
- **Progress Tracking**: Completion status and time tracking for training modules
- **Validation Workflow**: Manual review process for training content quality

### User Interface Components
- **Dashboard**: Central hub with progress tracking and quick actions
- **Threat Input**: Multi-tab interface for URL, PDF, and feed-based input
- **Use Case List**: Display and management of extracted training scenarios
- **Training Modal**: Interactive step-by-step training interface
- **Validation Queue**: Review interface for pending training content

## Data Flow

1. **Input Processing**: Users submit threat reports via URL, PDF upload, or threat feeds
2. **Content Extraction**: System parses documents and extracts structured threat information
3. **Use Case Generation**: AI-driven extraction creates training scenarios from threat content
4. **Training Path Creation**: Scenarios are converted into step-by-step training workflows
5. **Progress Tracking**: User completion and validation status is maintained locally
6. **Validation Workflow**: Content requiring review is queued for manual validation

## External Dependencies

### Core Dependencies
- React ecosystem (React, React DOM, TypeScript)
- Vite build system with plugins for Replit integration
- Drizzle ORM with PostgreSQL support (configured but not actively used)
- Neon Database serverless driver (configured for future use)

### UI and Styling
- Tailwind CSS for styling with custom Cortex theme variables
- Radix UI primitives for accessible component foundation
- Lucide React for iconography
- Date-fns for date manipulation

### Data Processing
- PDF.js for client-side PDF parsing
- CORS proxy services for web scraping
- IndexedDB for browser-based persistence
- Zod for runtime type validation

### Development Tools
- TSX for TypeScript execution
- ESBuild for production bundling
- PostCSS with Autoprefixer
- Replit-specific development plugins

## Deployment Strategy

### Development
- Vite development server with HMR
- Replit integration with runtime error overlay
- TypeScript checking with incremental compilation

### Production Build
- Client assets built to `dist/public` using Vite
- Server bundle created with ESBuild targeting Node.js ESM
- Static file serving through Express.js middleware

### Database Strategy
- **Current**: IndexedDB for client-side storage with full offline capability
- **Future**: PostgreSQL with Drizzle ORM for server-side persistence when needed
- **Migration Path**: Export/import functionality for data portability

### Scalability Considerations
- Client-side architecture minimizes server resource requirements
- Data export functionality enables backup and migration
- Server endpoints prepared for future centralized features
- Modular component architecture supports feature expansion