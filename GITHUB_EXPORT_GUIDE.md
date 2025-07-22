# GitHub Export Guide for ThreatResearchHub

## Quick Setup

1. **Create GitHub Repository**
   ```bash
   # Create new repo at https://github.com/coleman74/ThreatResearchHub
   # Description: "Comprehensive threat research crawler, verification, and incident response capability platform"
   # Then clone locally or initialize in existing directory
   git init
   git remote add origin https://github.com/coleman74/ThreatResearchHub.git
   ```

2. **Initial Commit**
   ```bash
   git add .
   git commit -m "Initial commit: ThreatResearchHub threat intelligence platform"
   git branch -M main
   git push -u origin main
   ```

## Repository Structure

```
ThreatResearchHub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
├── server/                # Express.js backend
│   ├── db.ts             # Database configuration
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage layer
│   └── xsiam-api.ts      # XSIAM integration
├── shared/               # Shared types and schemas
├── attached_assets/      # User uploaded documents
├── docker-compose.yml    # Container orchestration
├── Dockerfile           # Container build config
└── README.md            # Project documentation
```

## Deployment Options

### 1. GitHub Pages (Static Frontend Only)
```bash
# Enable GitHub Pages in repository settings
# Deploy client build to gh-pages branch
npm run build
npx gh-pages -d dist/public
```

### 2. Replit Deployment
- Use existing Replit deployment system
- Connect GitHub repo to Replit for automatic sync
- Enable automatic deployments on push

### 3. Docker Deployment
```bash
# Build and run containers
docker-compose up -d

# Or deploy to cloud platforms
# - AWS ECS/Fargate
# - Google Cloud Run
# - Azure Container Instances
```

## Environment Variables

Create `.env` file (not committed to GitHub):
```env
# Database
DATABASE_URL=postgresql://...
PGUSER=...
PGPASSWORD=...
PGHOST=...
PGPORT=...
PGDATABASE=...

# API Keys (optional)
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Session Security
SESSION_SECRET=...
```

## Branch Strategy

```
main                    # Production-ready code
├── develop            # Integration branch
├── feature/           # Feature development
│   ├── xsiam-integration
│   ├── threat-feeds
│   └── workflow-enhancement
└── hotfix/           # Critical fixes
```

## Release Process

1. **Version Tagging**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0: Complete XSIAM workflow system"
   git push origin v1.0.0
   ```

2. **Release Notes Template**
   ```markdown
   ## ThreatResearchHub v1.0.0
   
   ### New Features
   - Complete XSIAM onboarding system
   - Threat intelligence aggregation from 10+ sources
   - End-to-end security operations workflow
   
   ### Improvements
   - Enhanced data source integration guidance
   - Automated lab environment planning
   - Production-ready export packages
   
   ### Bug Fixes
   - Fixed storage communication issues
   - Resolved workflow advancement problems
   ```

## GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy ThreatResearchHub

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm run build
    - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to production
      run: echo "Deploy to your preferred platform"
```

## Security Considerations

1. **Secrets Management**
   - Never commit API keys or credentials
   - Use GitHub Secrets for CI/CD variables
   - Implement environment-specific configurations

2. **Access Control**
   - Private repository recommended for security content
   - Careful review of any public exposure
   - Documentation of sensitive threat intelligence

## Collaboration Features

1. **Issue Templates**
   - Bug reports
   - Feature requests
   - XSIAM integration issues

2. **Pull Request Template**
   - Description of changes
   - Testing checklist
   - Security impact assessment

## Documentation Strategy

1. **README.md** - Project overview and quick start
2. **CONTRIBUTING.md** - Development guidelines
3. **SECURITY.md** - Security policy and reporting
4. **API.md** - API documentation
5. **DEPLOYMENT.md** - Detailed deployment instructions

## Backup Strategy

1. **Automated Backups**
   - GitHub repository serves as primary backup
   - Regular database exports
   - Configuration file versioning

2. **Disaster Recovery**
   - Complete repository clone capability
   - Environment recreation scripts
   - Data restoration procedures

## Getting Started Commands

```bash
# Clone repository
git clone https://github.com/coleman74/ThreatResearchHub.git
cd ThreatResearchHub

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development
npm run dev

# Build for production
npm run build

# Run with Docker
docker-compose up -d
```

## Support and Maintenance

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and community support
- **Wiki**: GitHub Wiki for detailed documentation and guides
- **Releases**: GitHub Releases for version management and changelogs