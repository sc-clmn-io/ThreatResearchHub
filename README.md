# ThreatResearchHub

Comprehensive threat research crawler, verification, and incident response capability platform. ThreatResearchHub transforms complex security reports into actionable, contextualized training and analysis tools, empowering security teams to aggregate threat intelligence from multiple research vendors, generate training scenarios, and provides structured learning paths for detection engineering and incident response.

## 🚀 Key Features

### Threat Intelligence Processing
- **Multi-Source Aggregation**: Integrate with 10+ threat intelligence sources (Unit42, CISA, MITRE ATT&CK, etc.)
- **Real-Time Processing**: Automated polling with 6-hour update cycles for current threats
- **Advanced Filtering**: Focus on high/critical severity threats with intelligent deduplication
- **Contextual Analysis**: Automated CVE extraction, technology identification, and MITRE ATT&CK mapping

### End-to-End Security Operations Workflow
- **Threat Analysis**: Extract IOCs, TTPs, and threat context from reports
- **Infrastructure Planning**: Generate Terraform/Ansible deployment configurations
- **XSIAM Integration**: Complete onboarding guide for Cortex XSIAM/Cloud data sources
- **Detection Engineering**: Create XQL correlation rules and alert layouts
- **Playbook Automation**: Generate SOAR workflows for automated response
- **Dashboard Creation**: Build monitoring and KPI visualization

### XSIAM Onboarding System
- **Analyst-First Experience**: Step-by-step data source integration guidance
- **Threat-Specific Mapping**: Automatically identify required data sources based on threat category
- **Production-Ready Integration**: Complete validation ensuring successful XSIAM deployment
- **Lab Environment Planning**: Infrastructure guidance tailored to specific threat requirements

### Export and Collaboration
- **Multi-Format Exports**: XSIAM, XSOAR, and enterprise security platform compatibility
- **Collaboration Packages**: Complete deployment guides and troubleshooting documentation
- **Template Sharing**: Community-driven template exchange with ratings and feedback
- **Version Control**: Git-compatible content management with diff comparison

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript, Shadcn/UI, Tailwind CSS
- **Backend**: Express.js with minimal server-side logic
- **Database**: PostgreSQL with Drizzle ORM (IndexedDB for client storage)
- **Build System**: Vite with hot module replacement
- **Deployment**: Docker containerization with multi-environment support

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (or use SQLite for development)
- Docker and Docker Compose (for containerized deployment)

## 🚀 Quick Start

### Development Setup

```bash
# Clone the repository
git clone https://github.com/coleman74/ThreatResearchHub.git
cd ThreatResearchHub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration

# Start development server
npm run dev
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/threatresearchhub
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=threatresearchhub

# Session Security
SESSION_SECRET=your_secure_session_secret

# API Keys (Optional)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

### Database Setup

```bash
# Create database
createdb threatresearchhub

# Run migrations
npm run db:push
```

## 📚 Core Workflows

### 1. Threat Intelligence Ingestion
- Upload threat reports via URL, PDF, or free text
- Ingest from threat feeds with one-click processing
- Automatic threat context extraction and use case generation

### 2. XSIAM Integration
- Complete onboarding guide for first-time XSIAM users
- Data source identification and broker configuration
- Field mapping and validation procedures
- End-to-end testing and verification

### 3. Security Operations Pipeline
- Infrastructure planning with cost estimation
- Detection rule creation with XQL syntax
- Alert layout design with triage guidance
- Playbook automation with response workflows
- Dashboard visualization with KPI monitoring

### 4. Export and Collaboration
- Production-ready content packages
- Team sharing with deployment documentation
- Template community with ratings and feedback

## 🏗 Project Structure

```
ThreatResearchHub/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
├── server/                # Express.js backend
│   ├── db.ts             # Database configuration
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data storage layer
│   └── threat-intelligence.ts # Threat feed processing
├── shared/               # Shared TypeScript types
├── attached_assets/      # User uploaded documents
└── docker-compose.yml    # Container orchestration
```

## 🔒 Security Features

- **Local AI Processing**: PII sanitization without external API calls
- **Secure Data Handling**: No external data transmission for sensitive content
- **Enterprise Integration**: Support for air-gapped environments
- **Access Control**: Role-based permissions (planned)

## 📈 Supported Threat Intelligence Sources

- **Unit42** (Palo Alto Networks)
- **CISA** (Cybersecurity & Infrastructure Security Agency)
- **MITRE ATT&CK** Techniques
- **SANS Internet Storm Center**
- **CrowdStrike Intelligence**
- **Recorded Future**
- **AlienVault OTX**
- **VirusTotal**
- **NIST NVD**
- **Threatpost**

## 🎯 Use Cases

- **Security Operations Centers**: Streamline threat analysis and response workflows
- **Detection Engineering**: Create production-ready detection rules from threat intelligence
- **Incident Response**: Generate playbooks and response procedures
- **Training and Education**: Structured learning paths for security analysts
- **Compliance**: Documentation and audit trails for security operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/coleman74/ThreatResearchHub/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/coleman74/ThreatResearchHub/discussions)
- **Documentation**: Comprehensive guides in the [Wiki](https://github.com/coleman74/ThreatResearchHub/wiki)

## 🚀 Roadmap

- [ ] Advanced AI-powered threat analysis
- [ ] Multi-tenant support with role-based access
- [ ] Integration with additional SIEM/SOAR platforms
- [ ] Real-time threat intelligence feeds
- [ ] Advanced analytics and reporting
- [ ] Mobile application for incident response

## 🏆 Acknowledgments

- MITRE ATT&CK Framework for attack technique taxonomy
- Cortex XSIAM/XSOAR for security orchestration standards
- Open source threat intelligence community
- Security research vendors for threat intelligence feeds

---

**ThreatResearchHub** - Transforming threat intelligence into actionable security operations