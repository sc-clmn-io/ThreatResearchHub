# ThreatResearchHub Development Manifest

## Project Genesis & Evolution

**Created:** January 2025  
**Latest Update:** July 22, 2025  
**Development Approach:** Iterative refinement based on user testing feedback  

## Core Vision
Transform threat intelligence learning into an engaging, interactive experience for cybersecurity professionals. Guide beginners through complete end-to-end workflows from threat report analysis to XSIAM testing and findings reporting.

## Architecture Decisions & Rationale

### Frontend Architecture
- **React 18 + TypeScript**: Modern, type-safe development
- **Wouter**: Lightweight routing vs React Router for minimal overhead
- **Shadcn/ui + Radix**: Accessible, production-ready components
- **TanStack Query**: Server state management with caching
- **Vite**: Fast development with HMR

### Backend Strategy
- **Express.js Minimal**: Static file server + API endpoints
- **Client-First Architecture**: Maximum logic in frontend for offline capability
- **PostgreSQL + Drizzle**: Prepared for scale, currently using IndexedDB

### Storage Evolution
1. **Phase 1**: Pure client-side with localStorage
2. **Phase 2**: IndexedDB for complex data structures
3. **Phase 3**: PostgreSQL for multi-user (future)

## Key Development Milestones

### January 2025 - Foundation
- Basic threat report ingestion (PDF/URL)
- Use case extraction engine
- Training path generation
- IndexedDB storage implementation

### March 2025 - Intelligence Integration
- Multi-vendor threat feeds (Unit42, CISA, SANS)
- Real-time threat processing
- Deduplication algorithms
- Severity filtering (high/critical only)

### May 2025 - XSIAM Integration
- Live XSIAM debugger with multi-version API support
- XQL query analysis and optimization
- Connection management system
- Content validation engine

### July 2025 - Production Features
- Comprehensive backup system with ZIP downloads
- GitHub private repository integration
- Docker containerization
- PII sanitization system
- Automated threat intelligence (6-hour cycles)

## Critical User Preferences & Decisions

### Communication Style
- **Simple, everyday language** - No technical jargon
- **Iterative approach** - Build, test, refine based on feedback
- **Continuous momentum** - Multi-component improvements
- **End-of-day GitHub saves** - Version control discipline

### Technical Preferences
- **Authentic data only** - No mock/placeholder data
- **Security-first** - Private repositories, proper .gitignore
- **Portable deployment** - Docker containers, ZIP backups
- **Offline capability** - Browser-based processing

## Architecture Files & Dependencies

### Core Files Structure
```
client/
├── src/
│   ├── components/
│   │   ├── data-backup-system.tsx
│   │   ├── findings-report-generator.tsx
│   │   └── threat-feeds.tsx
│   ├── pages/
│   │   ├── dashboard.tsx
│   │   ├── xsiam-debugger.tsx
│   │   └── xsiam-deployment.tsx
│   └── lib/
server/
├── threat-intelligence.ts
├── xsiam-api.ts
├── storage.ts
└── routes.ts
shared/
└── schema.ts
```

### Essential Dependencies
- **@tanstack/react-query**: Data fetching and caching
- **drizzle-orm**: Database ORM with PostgreSQL
- **pdfjs-dist**: Client-side PDF processing
- **jszip**: Backup file generation
- **zod**: Runtime type validation
- **wouter**: Lightweight routing

## System Requirements

### macOS Installation Requirements
```bash
# 1. Install Node.js (required)
# Download from: https://nodejs.org (LTS version 18+ recommended)
# Or using Homebrew:
brew install node

# 2. Verify installation
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 8.0.0 or higher

# 3. Optional: Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Other Operating Systems
- **Windows**: Install Node.js from nodejs.org, use PowerShell or Git Bash
- **Linux**: `sudo apt install nodejs npm` or equivalent package manager

## Installation Instructions

### 1. Extract ZIP Backup
```bash
# Unzip to desired location
unzip security-research-platform-backup-2025-07-22.zip
cd security-research-platform-backup-*
```

### 2. Automated Setup (Recommended)
```bash
# Make script executable (macOS/Linux)
chmod +x development/rebuild.sh

# Run automated setup
./development/rebuild.sh

# Script will:
# - Install all dependencies
# - Set up optional database
# - Import training data
# - Start development server
```

### 3. Manual Setup (Alternative)
```bash
# Install dependencies
npm install

# Optional: Database setup
npm run db:push

# Start platform
npm run dev
```

### 4. Import Training Data
1. Open browser: http://localhost:5173
2. Go to Dashboard → Data Management
3. Import files from /data/ folder in backup
4. Platform fully operational with all your training content

### 5. Environment Configuration (Optional)
```bash
# Copy template and customize
cp development/.env.template .env
# Edit .env with your API keys if needed
```

## macOS-Specific Notes

### Port Configuration
- Platform runs on localhost:5173 (Vite frontend)
- Backend API on same port via proxy
- No additional port configuration needed

### File Permissions
```bash
# If permission errors occur:
sudo chown -R $(whoami) .
chmod -R 755 .
```

### Network Access
- No firewall configuration needed for localhost
- All processing happens locally in browser
- Optional: Internet access for threat intelligence feeds

## Critical Code Patterns

### 1. Storage Interface Pattern
```typescript
// Always use IStorage interface
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  // ... other methods
}
```

### 2. TanStack Query Pattern
```typescript
// Standard data fetching
const { data, isLoading } = useQuery({
  queryKey: ['/api/endpoint'],
  retry: false
});
```

### 3. Component Structure
```typescript
// Consistent component pattern
export default function ComponentName() {
  const [state, setState] = useState();
  // ... logic
  return <div>...</div>;
}
```

## Deployment Strategy

### Development
- Replit environment with workflow automation
- Hot module replacement via Vite
- Real-time error monitoring

### Production Options
1. **Docker Container**: Portable deployment
2. **Static Export**: Pure client-side deployment
3. **Replit Deployment**: One-click hosting

## Data Flow Architecture

### Threat Intelligence Pipeline
1. **Sources** → RSS/XML feeds, REST APIs
2. **Processing** → Parse, filter, deduplicate
3. **Storage** → IndexedDB/PostgreSQL
4. **Display** → Real-time dashboard updates

### Training Workflow
1. **Input** → PDF reports, URLs, feeds
2. **Extraction** → AI-powered use case generation
3. **Training Paths** → Step-by-step workflows
4. **Validation** → Manual review queue
5. **Export** → XSIAM-ready content

## Testing Strategy

### User Testing Protocol
1. Build initial functionality
2. Test with real threat data
3. Gather user feedback
4. Refine based on real-world usage
5. Iterate continuously

### Quality Assurance
- TypeScript compilation checks
- LSP diagnostics resolution
- Real threat intelligence validation
- XSIAM API compatibility testing

## Future Roadmap

### Immediate (Next 30 days)
- Enhanced GitHub automation
- Additional threat intelligence sources
- Advanced XQL optimization features

### Medium-term (3-6 months)
- Multi-user support with PostgreSQL
- Advanced analytics dashboard
- API marketplace integration

### Long-term (6+ months)
- Enterprise SSO integration
- Custom intelligence source development
- AI-powered threat correlation

## Recovery Instructions

### Complete Platform Rebuild
1. Clone GitHub repository
2. Install dependencies: `npm install`
3. Import backup data from ZIP files
4. Configure environment variables
5. Start development server: `npm run dev`

### Data Recovery
1. Download latest backup ZIP
2. Extract `/data/` folder contents
3. Import JSON files to localStorage
4. Restart platform

## Success Metrics

### Technical Metrics
- Zero data loss incidents
- <2 second page load times
- 99.9% threat feed uptime
- Complete offline capability

### User Experience Metrics
- Successful threat-to-training conversion
- Seamless XSIAM integration
- Intuitive beginner workflows
- Reliable backup/restore system

## Development Philosophy

**"Build for the analyst who's never used XSIAM before"**

Every feature designed with crystal-clear instructions, step-by-step guidance, and real-world context. No assumptions about prior knowledge, complete workflows from start to finish.

## Key Development Conversations & Decisions

### Data Storage Evolution
- **Initial**: localStorage for simplicity
- **Current**: IndexedDB for complex structures
- **Future**: PostgreSQL for multi-user scale
- **Rationale**: Progressive enhancement without breaking existing functionality

### Backup System Requirements
- **User Request**: "ZIP downloads for local computer storage"
- **Evolution**: Started with data backup, expanded to complete development archive
- **Final State**: Complete platform rebuild capability from single ZIP file

### Communication Preferences
- **Established**: Simple, everyday language - no technical jargon
- **Approach**: Iterative refinement - build, test, refine
- **Style**: Continuous momentum across multiple components
- **Version Control**: Daily GitHub saves for work preservation

### Authentication Strategy
- **Decision**: No authentication initially
- **Rationale**: Focus on core functionality first
- **Infrastructure**: Prepared for future session-based auth with PostgreSQL

### Threat Intelligence Philosophy
- **Principle**: Authentic data only - no mock/placeholder content
- **Sources**: Live feeds from Unit42, CISA, SANS (6-hour cycles)
- **Filtering**: High/critical threats only to reduce noise
- **Processing**: Real-time deduplication and intelligent merging

## Critical Success Patterns

### User Testing Protocol
1. Build initial functionality rapidly
2. Test with authentic threat data
3. Gather immediate user feedback
4. Refine based on real-world usage patterns
5. Maintain development momentum

### Technical Decision Framework
- **Security First**: Private repositories, proper .gitignore patterns
- **Portable Deployment**: Docker containers, ZIP backups
- **Offline Capability**: Browser-based processing preferred
- **Zero External Dependencies**: Local PII sanitization, client-side PDF parsing

## Development Philosophy

**"Build for the analyst who's never used XSIAM before"**

Every feature designed with crystal-clear instructions, step-by-step guidance, and real-world context. No assumptions about prior knowledge, complete workflows from start to finish.

---

*This manifest serves as the complete blueprint for rebuilding ThreatResearchHub from scratch, preserving all architectural decisions, user preferences, and development context.*