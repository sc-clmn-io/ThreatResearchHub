# ThreatResearchHub

**Contact**: sc@clmn.io

## Overview

ThreatResearchHub is a comprehensive Content Engineering Workflow platform for multi-vendor security operations. It transforms threat intelligence into complete detection packages through systematic engineering processes across any security platform. The platform features comprehensive lab buildout capabilities that create authentic environments where ALL data sources forward logs to your selected SIEM platform for centralized threat detection and validation. Following Detection-as-Code principles with the NVISO DDLC framework, it enables validation of threat scenarios from reports, customer use cases, and threat feeds through complete lab deployment with comprehensive log aggregation in your chosen security stack.

Key capabilities include simplified lab build automation for rapid environment deployment and reliable, functional security content generation across 20+ platforms including XSIAM, Splunk, Sentinel, QRadar, CrowdStrike, and more. This ensures content is requirements-driven, uses validated field mappings, includes actionable playbooks, analyst-focused layouts, and operational dashboards, all validated to work in your actual security environments. The platform's business vision is to provide a robust solution for efficient threat validation and content creation, aiming to become a go-to tool for security professionals regardless of their technology stack.

## User Preferences

Preferred communication style: Simple, everyday language.
Development approach: Iterative refinement based on testing feedback.
Testing methodology: Build initial functionality, test thoroughly, then refine based on real-world usage.
Version control: Save work as GitHub revision at end of working day.
Work style: Keep development momentum going with continuous improvements across multiple components.
Documentation policy: Always keep docs up to date as recurring part of development process.
Interface language policy: Professional, business-appropriate language throughout platform interface with clear, comprehensive instructions for all deployment steps.
Security tech stack preference: Vendor-agnostic "Lego Block" architecture supporting 20+ security platforms across 6 categories (SIEM, EDR, Firewall, SOAR, ASM, Attack Simulation), with Palo Alto Networks Cortex suite as the default reference implementation, but full flexibility for customers to use any combination of vendors based on their requirements.
Documentation approach: Create complete step-by-step guides with comprehensive 7-stage workflows that can be followed independently from zero infrastructure to production deployment.
**7-Stage Workflow Implementation**: User confirmed successful implementation of Deploy Content Library integration into Stage 7 of Sequential Workflow Manager. Complete 4-6 hour implementation timeline documented across all guides. Repository now GitHub-ready with comprehensive documentation structure. README successfully deployed to sc-clmn-io/ThreatResearchHub repository with 7-stage workflow diagram and comprehensive platform documentation.
Deployment preference: Keep platform as private development environment running locally in Replit - want to share eventually but keeping close until confident in its ability to help others effectively.
Development separation: Keep development work and operational documentation separate from app content - they are contextually very different.
User has GitHub Copilot subscription and wants to leverage it for efficient development:
- Use Copilot for accelerated XQL query generation and XSIAM content creation
- Leverage pattern recognition for consistent React component development
- Generate comprehensive TypeScript interfaces and validation schemas
- Optimize threat intelligence processing and parsing logic
- Maintain architectural consistency while accelerating development speed
- Focus on security-first patterns and robust error handling

## System Architecture

The platform is designed around a client-side first architecture with a focus on comprehensive threat intelligence processing and XSIAM content generation.

**Frontend Architecture:**
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter for lightweight client-side routing.
- **UI Components**: Shadcn/ui with Radix UI primitives and Tailwind CSS for a clean, professional, and uncluttered interface. The design emphasizes clean visual hierarchy, color-coded interfaces, and streamlined navigation to guide users through the workflow.
- **State Management**: TanStack Query for server state and React hooks for local state.
- **Build Tool**: Vite with hot module replacement.

**Backend Architecture:**
- **Server**: Express.js, primarily serving as a static file server and health check endpoint, with architecture prepared for future expansion for server-side logic.
- **Core Functionality**: Singleton services for generating authentic security content packages from threat intelligence for any supported platform, comprehensive threat report parsing (multi-source ingestion, MITRE ATT&CK mapping, IOC extraction), and SOC process generation with vendor-agnostic adapters.

**Data Storage Solutions:**
- **Primary Storage**: PostgreSQL database with Drizzle ORM (configured for future use).
- **Database Tables**: Designed for `threat_reports`, `use_cases`, `security_stacks`, `training_paths`, `validation_items`, and `progress_tracking`.
- **Client Storage**: IndexedDB for offline capability and local data caching.
- **Schema Management**: Drizzle Kit for migrations and schema management.

**Authentication and Authorization:**
- Currently no authentication implemented; infrastructure prepared for future session-based authentication with PostgreSQL session storage.

**System Design Choices & Features:**
- **Modular Security Stack Architecture**: Revolutionary "Lego Block" system allowing flexible swapping of security tools across 6 categories (SIEM, EDR, Firewall, SOAR, ASM, Attack Simulation). Supports 20+ vendors including XSIAM, Splunk, Sentinel, QRadar, CrowdStrike, SentinelOne, and others with vendor-agnostic adapters.
- **Multi-Platform Content Generation**: Unified content orchestrator that generates platform-specific detection rules, playbooks, and dashboards automatically adapting to different query languages (XQL, SPL, KQL, AQL, Lucene) and field mappings.
- **Content Engineering Workflow**: Implements the NVISO Detection Development Life Cycle (DDLC) across 7 phases (Use Case Definition → Security Stack Configuration → Infrastructure Deployment → Data Source Configuration → Platform Content Generation → Testing & Validation → Documentation & Deployment) for systematic content development.
- **Detection-as-Code**: Applies software engineering principles (version control, code reviews, testing) to XSIAM content management, including GitHub-style workflows with branch management and pull requests.
- **Lab Build Automation**: Automated deployment scripts for endpoint, cloud, network, and identity labs, emphasizing rapid XSIAM integration and quick validation. Supports Azure and Proxmox environments.
- **Multi-Platform Content Generation**: Focuses on four critical content types: detection rules (using authentic dataset fields and platform-specific query languages), alert layouts (with actionable decision buttons), playbooks (with concrete response actions), and operational dashboards (for KPI monitoring). Features a high-fidelity validation system against authentic platform samples to ensure "zero hallucination."
- **Schema-Driven Content Generation**: Utilizes authentic dataset schemas for vendor-specific field mapping and dynamic XQL query building, adapting to multi-vendor integrations.
- **PII Sanitization**: A local, browser-based PII sanitization system that obfuscates sensitive information (IPs, hostnames, emails) while preserving naming patterns, with zero external data transmission.
- **Threat Intelligence Management**: Includes a comprehensive threat intelligence import system, a 30-day rolling threat database, and filtering for high/critical severity threats. Features an archive system for older threats.
- **XSIAM API Integration**: Supports XSIAM V3.1 and XDR-to-XSIAM migration, with robust API authentication and connection testing. Includes a live XSIAM debugger for query analysis.
- **Infrastructure Procurement Planning**: A system for planning lab environments with cost analysis and AI-driven recommendations, mapping to OSI model layers.
- **Docker Containerization**: Provides Dockerfile and `docker-compose.yml` for portable deployment.
- **UI/UX Decisions**: Emphasizes a clean, two-card user guide, elimination of redundant navigation, and a 7-stage workflow focus with clear instructional text and color-coded interfaces. Professional language is used throughout the platform.
- **GitHub Integration**: Production-ready GitHub backup system with complete content export, automatic scheduling, and secure private repository integration for version control and data preservation.
- **Stealth Mode**: Complete removal of all development environment fingerprints with automated protection systems for public repository sharing while maintaining full functionality in private development environment. GitHub-ready README.md and MANIFEST.md created with zero private/company information.

## External Dependencies

The project leverages a range of external services and libraries to achieve its functionality.

**Core Libraries & Frameworks:**
- **React ecosystem**: React, React DOM, TypeScript for the frontend.
- **Vite**: Build system.
- **Drizzle ORM**: For PostgreSQL database interaction.
- **Neon Database**: Serverless driver (configured for future use).

**UI and Styling:**
- **Tailwind CSS**: For styling, with custom Cortex theme variables.
- **Radix UI**: Primitives for accessible UI components.
- **Lucide React**: For iconography.
- **Date-fns**: For date manipulation.

**Data Processing & Intelligence:**
- **PDF.js**: For client-side PDF parsing.
- **CORS proxy services**: For web scraping and bypassing cross-origin restrictions.
- **Zod**: For runtime type validation.

**Development Tools:**
- **TSX**: For TypeScript execution.
- **ESBuild**: For production bundling.
- **PostCSS with Autoprefixer**: For CSS processing.
- **Standard development tools**: For integrated development environment support.

**Third-Party Services & Integrations (Conceptual/Configured):**
- **GitHub API**: For version control integration, automated backups, and content export.
- **Palo Alto Networks Cortex Suite**: (XSIAM, XDR, XSOAR) as the target SOC platform for log aggregation, threat detection, and content deployment.
- **Various Threat Intelligence Feeds**: Including CISA, NIST NVD, Unit42, SANS ISC, Threatpost, MITRE ATT&CK (integrated for data ingestion).
- **ServiceNow**: For incident management and ticketing (within playbook definitions).
- **SendGrid**: For notifications (configured but not extensively detailed).
- **GitHub Copilot**: (User preference for code generation).