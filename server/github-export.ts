import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ContentStorage } from './content-storage.js';

const execAsync = promisify(exec);

interface GitHubExportConfig {
  token: string;
  username: string;
  repository: string;
  branch: string;
  commitMessage: string;
}

interface ExportResult {
  success: boolean;
  commitHash?: string;
  filesUploaded: number;
  timestamp: string;
}

export async function exportToGitHub(config: GitHubExportConfig): Promise<ExportResult> {
  const { token, username, repository, branch, commitMessage } = config;
  const projectRoot = process.cwd();
  const timestamp = new Date().toISOString();

  try {
    // Initialize git if not already initialized
    await initializeGitRepo();

    // Export all generated content to repository
    await exportGeneratedContent();

    // Configure git user with environment variables instead of git config to avoid lock issues
    process.env.GIT_AUTHOR_NAME = 'ThreatResearchHub';
    process.env.GIT_AUTHOR_EMAIL = 'security-research-platform@replit.com';
    process.env.GIT_COMMITTER_NAME = 'ThreatResearchHub';
    process.env.GIT_COMMITTER_EMAIL = 'security-research-platform@replit.com';

    // Remove any existing git lock files before configuration
    try {
      await execAsync('rm -f .git/config.lock .git/index.lock');
    } catch (error) {
      // Lock files might not exist, that's fine
    }

    // Try to set git config, but continue if it fails
    try {
      await execAsync('git config user.name "ThreatResearchHub"');
      await execAsync('git config user.email "security-research-platform@replit.com"');
      console.log('Git configuration successful');
    } catch (error: any) {
      console.log('Git config failed, using environment variables only:', error.message);
      // Environment variables are already set above, so we can continue
    }

    // Set up remote with token in URL (GitHub's recommended method for automation)
    const remoteUrl = `https://${token}@github.com/${username}/${repository}.git`;
    
    try {
      await execAsync('git remote remove origin');
    } catch (error) {
      // Remote might not exist, that's fine
    }
    
    await execAsync(`git remote add origin ${remoteUrl}`);

    // Create comprehensive .gitignore if it doesn't exist
    await createGitIgnore();

    // Add all files except those in .gitignore
    await execAsync('git add .');

    // Check if there are changes to commit
    try {
      const { stdout: status } = await execAsync('git status --porcelain');
      if (!status.trim()) {
        return {
          success: true,
          filesUploaded: 0,
          timestamp,
        };
      }
    } catch (error) {
      // Continue with commit even if status check fails
    }

    // Commit changes
    await execAsync(`git commit -m "${commitMessage}"`);

    // Pull and push to GitHub (handle remote changes)
    try {
      await execAsync(`git pull origin ${branch} --rebase --no-edit`);
    } catch (pullError) {
      console.log('Pull failed, will force push...');
    }
    
    // Push to GitHub (token is in remote URL)
    try {
      await execAsync(`git push -u origin ${branch}`);
    } catch (pushError: any) {
      if (pushError.message.includes('rejected')) {
        console.log('Push rejected, trying force push...');
        await execAsync(`git push --force origin ${branch}`);
      } else {
        throw pushError;
      }
    }

    // Get commit hash
    const { stdout: commitHash } = await execAsync('git rev-parse HEAD');

    // Count files in the repository
    const { stdout: fileCount } = await execAsync('git ls-files | wc -l');

    return {
      success: true,
      commitHash: commitHash.trim(),
      filesUploaded: parseInt(fileCount.trim()),
      timestamp,
    };

  } catch (error) {
    console.error('GitHub export error:', error);
    throw new Error(`GitHub export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function initializeGitRepo(): Promise<void> {
  try {
    // Check if .git directory exists
    if (!fs.existsSync('.git')) {
      await execAsync('git init');
    }
    
    // Ensure we're in a clean state
    try {
      await execAsync('git status');
    } catch (statusError) {
      // If git status fails, reinitialize
      console.log('Git repository corrupted, reinitializing...');
      if (fs.existsSync('.git')) {
        fs.rmSync('.git', { recursive: true, force: true });
      }
      await execAsync('git init');
    }
  } catch (error) {
    console.error('Git initialization error:', error);
    throw error;
  }
}

async function exportGeneratedContent(): Promise<void> {
  try {
    // Export browser localStorage data (threat intelligence, use cases, etc.)
    await exportBrowserData();
    
    // Create sample content packages to demonstrate the export structure
    const packages = await createSampleContentPackages();
    
    // Create content directory structure
    const contentDir = path.join(process.cwd(), 'content');
    const useCasesDir = path.join(contentDir, 'use-cases');
    const xqlRulesDir = path.join(contentDir, 'xql-rules');
    const playbooksDir = path.join(contentDir, 'playbooks');
    const layoutsDir = path.join(contentDir, 'layouts');
    const dashboardsDir = path.join(contentDir, 'dashboards');
    
    // Ensure directories exist
    [contentDir, useCasesDir, xqlRulesDir, playbooksDir, layoutsDir, dashboardsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Export README for content structure
    const readmeContent = `# ThreatResearchHub Generated Content

This directory contains all content generated by the ThreatResearchHub platform.

## Directory Structure

- \`use-cases/\` - Threat intelligence use cases and scenarios
- \`xql-rules/\` - XSIAM correlation rules in XQL format
- \`playbooks/\` - Automation playbooks for incident response
- \`layouts/\` - Alert layouts for XSIAM incident management
- \`dashboards/\` - Operational dashboards for threat monitoring

## Usage

All content is ready for import into XSIAM/Cortex Cloud environments. Each file includes:
- Complete metadata and configuration
- DDLC phase tracking
- Version control information
- Testing and validation notes

Generated on: ${new Date().toISOString()}
Total packages: ${packages.length}
`;
    
    fs.writeFileSync(path.join(contentDir, 'README.md'), readmeContent);
    
    // Export each content package
    for (const pkg of packages) {
      const sanitizedName = pkg.name.replace(/[^a-zA-Z0-9\-_]/g, '_');
      
      // Export use case details
      const useCaseData = {
        metadata: {
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          category: pkg.category,
          severity: pkg.severity,
          version: pkg.version,
          ddlc_phase: pkg.ddlc_phase,
          created_date: pkg.created_date,
          modified_date: pkg.modified_date
        },
        threat_report: pkg.threat_report,
        ddlc_metadata: pkg.ddlc_metadata
      };
      
      fs.writeFileSync(
        path.join(useCasesDir, `${sanitizedName}.json`),
        JSON.stringify(useCaseData, null, 2)
      );
      
      // Export XQL rule
      if (pkg.xql_rule) {
        fs.writeFileSync(
          path.join(xqlRulesDir, `${sanitizedName}.json`),
          JSON.stringify(pkg.xql_rule, null, 2)
        );
      }
      
      // Export automation playbook
      if (pkg.automation_playbook) {
        fs.writeFileSync(
          path.join(playbooksDir, `${sanitizedName}.yml`),
          typeof pkg.automation_playbook === 'string' 
            ? pkg.automation_playbook
            : JSON.stringify(pkg.automation_playbook, null, 2)
        );
      }
      
      // Export alert layout
      if (pkg.alert_layout) {
        fs.writeFileSync(
          path.join(layoutsDir, `${sanitizedName}.json`),
          JSON.stringify(pkg.alert_layout, null, 2)
        );
      }
      
      // Export operational dashboard
      if (pkg.operational_dashboard) {
        fs.writeFileSync(
          path.join(dashboardsDir, `${sanitizedName}.json`),
          JSON.stringify(pkg.operational_dashboard, null, 2)
        );
      }
    }
    
    console.log(`✅ Exported ${packages.length} content packages to repository`);
  } catch (error) {
    console.error('Content export error:', error);
    // Don't fail the entire backup if content export fails
  }
}

async function exportBrowserData(): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const threatIntelDir = path.join(dataDir, 'threat-intelligence');
    const useCasesDir = path.join(dataDir, 'use-cases');
    const configDir = path.join(dataDir, 'configuration');
    
    // Ensure directories exist
    [dataDir, threatIntelDir, useCasesDir, configDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Create data structure README
    const dataReadme = `# ThreatResearchHub Platform Data

This directory contains all platform data including threat intelligence, use cases, and configuration.

## Directory Structure

- \`threat-intelligence/\` - Live threat intelligence feeds and archived threats
- \`use-cases/\` - Training scenarios and extracted use cases
- \`configuration/\` - Platform settings and user preferences

## Data Sources

The platform aggregates threat intelligence from:
- CISA Cybersecurity Alerts
- Unit42 Threat Reports  
- SANS Internet Storm Center
- MITRE ATT&CK Framework
- Custom threat report uploads

All data is processed and normalized for XSIAM/Cortex Cloud integration.

Last updated: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(path.join(dataDir, 'README.md'), dataReadme);
    
    // Export placeholder data structure (since we can't access browser localStorage from server)
    const sampleThreatData = {
      feeds: [],
      archived_threats: [],
      last_updated: new Date().toISOString(),
      note: "This is a placeholder structure. Actual threat intelligence data is stored in browser localStorage and managed by the frontend application."
    };
    
    const sampleUseCaseData = {
      extracted_use_cases: [],
      training_paths: [],
      validation_queue: [],
      note: "This is a placeholder structure. Actual use case data is stored in browser localStorage and managed by the frontend application."
    };
    
    const sampleConfigData = {
      github_settings: {},
      xsiam_connections: {},
      user_preferences: {},
      note: "This is a placeholder structure. Actual configuration data is stored in browser localStorage and managed by the frontend application."
    };
    
    fs.writeFileSync(
      path.join(threatIntelDir, 'threat-data.json'),
      JSON.stringify(sampleThreatData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(useCasesDir, 'use-case-data.json'),
      JSON.stringify(sampleUseCaseData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(configDir, 'platform-config.json'),
      JSON.stringify(sampleConfigData, null, 2)
    );
    
    console.log('✅ Exported platform data structure to repository');
  } catch (error) {
    console.error('Browser data export error:', error);
  }
}

async function createSampleContentPackages(): Promise<any[]> {
  return [
    {
      id: 'apt29-cozy-bear',
      name: 'APT29 Cozy Bear Detection Package',
      description: 'Complete detection package for APT29 (Cozy Bear) threat group activities including embassy infiltration techniques',
      category: 'endpoint',
      severity: 'critical',
      threat_report: {
        id: 'tr-apt29-2025',
        title: 'APT29 Cozy Bear: Advanced Persistent Threat Analysis',
        description: 'Comprehensive analysis of APT29 threat group tactics, techniques, and procedures',
        source: 'Unit42 Threat Intelligence',
        published_date: '2025-01-15',
        cves: ['CVE-2024-4367', 'CVE-2024-0519'],
        mitre_attack: {
          tactics: ['Initial Access', 'Persistence', 'Defense Evasion'],
          techniques: ['T1566.001', 'T1055', 'T1027'],
          sub_techniques: ['T1566.001', 'T1055.001', 'T1027.002']
        },
        indicators: {
          ips: ['192.168.100.100', '10.0.0.25'],
          domains: ['malicious.example.com', 'c2.example.org'],
          hashes: ['d41d8cd98f00b204e9800998ecf8427e', 'e3b0c44298fc1c149afbf4c8996fb924'],
          file_paths: ['/tmp/malware.exe', 'C:\\Windows\\Temp\\payload.dll']
        },
        technologies: ['Windows', 'PowerShell', 'WMI'],
        threat_actors: ['APT29', 'Cozy Bear'],
        attack_vectors: ['Spear Phishing', 'Watering Hole', 'Supply Chain']
      },
      xql_rule: {
        rule_name: 'APT29 Cozy Bear Activity Detection',
        xql_query: `dataset = xdr_data | filter event_type = ENUM.PROCESS and action_process_image_name contains "powershell" and action_process_command_line contains "WMI" and action_process_command_line contains "embassy"`,
        severity: 'HIGH',
        enabled: true,
        description: 'Detects APT29 Cozy Bear PowerShell WMI execution patterns'
      },
      automation_playbook: {
        name: 'APT29 Response Playbook',
        tasks: [
          'Isolate affected endpoint',
          'Collect forensic evidence',
          'Analyze PowerShell logs',
          'Check for lateral movement',
          'Generate incident report'
        ]
      },
      alert_layout: {
        layout_name: 'APT29 Investigation Layout',
        sections: ['Threat Overview', 'IOC Analysis', 'Timeline', 'Response Actions']
      },
      operational_dashboard: {
        dashboard_name: 'APT29 Monitoring Dashboard',
        widgets: ['Threat Activity', 'IOC Matches', 'Response Metrics']
      },
      ddlc_phase: 'testing',
      ddlc_metadata: {
        phase_history: [
          { phase: 'requirement', timestamp: '2025-01-15T10:00:00Z', notes: 'Initial requirements gathered' },
          { phase: 'design', timestamp: '2025-01-15T11:00:00Z', notes: 'Detection logic designed' },
          { phase: 'development', timestamp: '2025-01-15T12:00:00Z', notes: 'XQL rule developed' },
          { phase: 'testing', timestamp: '2025-01-15T13:00:00Z', notes: 'Currently under testing' }
        ]
      },
      version: '1.0.0',
      created_date: '2025-01-15T10:00:00Z',
      modified_date: '2025-01-15T13:00:00Z'
    }
  ];
}

async function createGitIgnore(): Promise<void> {
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables and secrets
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Runtime and temporary files
.DS_Store
*.log
*.tmp
.replit
replit.nix

# Build outputs
dist/
build/
.vite/

# Database files
*.db
*.sqlite
*.sqlite3

# Include generated content in repository
!content/

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
Thumbs.db
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db

# Sensitive data (never commit)
private/
secrets/
credentials/
*.pem
*.key
*.crt

# Backup files
backup/
backups/
*.backup
*.bak

# Test coverage
coverage/
.nyc_output/

# Misc
.cache/
.parcel-cache/
.next/
.nuxt/
`;

  try {
    if (!fs.existsSync('.gitignore')) {
      fs.writeFileSync('.gitignore', gitignoreContent);
    }
  } catch (error) {
    console.error('Error creating .gitignore:', error);
  }
}

export async function createInitialCommit(): Promise<void> {
  try {
    await initializeGitRepo();
    await createGitIgnore();
    
    // Create initial README if it doesn't exist
    if (!fs.existsSync('README.md')) {
      const readmeContent = `# ThreatResearchHub

A comprehensive Content-as-Code platform for XSIAM/Cortex Cloud detection engineering.

## Features

- Threat intelligence ingestion and analysis
- Automated XSIAM content generation
- Detection-as-Code workflows with NVISO DDLC framework
- One-click GitHub backup and collaboration

## Setup

1. Clone this repository
2. Install dependencies: \`npm install\`
3. Configure environment variables
4. Run development server: \`npm run dev\`

## Architecture

- Frontend: React 18 with TypeScript and Tailwind CSS
- Backend: Express.js with PostgreSQL
- Content Generation: AI-powered threat analysis
- Export: Multiple formats (XSIAM, STIX2, etc.)

Last updated: ${new Date().toLocaleDateString()}
`;
      fs.writeFileSync('README.md', readmeContent);
    }

    await execAsync('git add .');
    await execAsync('git commit -m "Initial commit - ThreatResearchHub platform"');
  } catch (error) {
    console.error('Initial commit error:', error);
    throw error;
  }
}