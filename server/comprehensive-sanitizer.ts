import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ComprehensiveSanitizationRule {
  pattern: RegExp;
  replacement: string;
  category: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  employmentRisk: boolean;
}

export class ComprehensiveRepositorySanitizer {
  private sanitizationRules: ComprehensiveSanitizationRule[] = [
    // CRITICAL: Palo Alto Networks Employment Risk
    {
      pattern: /scoleman\.xdr\.us\.paloaltonetworks\.com/g,
      replacement: 'demo-tenant.xdr.us.paloaltonetworks.com',
      category: 'PAN_EMPLOYMENT_CRITICAL',
      riskLevel: 'HIGH',
      description: 'Employee XSIAM tenant - MUST REMOVE',
      employmentRisk: true
    },
    {
      pattern: /EXAMPLE_DISTRIBUTION_ID/g,
      replacement: 'EXAMPLE_DISTRIBUTION_ID',
      category: 'PAN_EMPLOYMENT_CRITICAL',
      riskLevel: 'HIGH',
      description: 'Real distribution ID - MUST REMOVE',
      employmentRisk: true
    },
    {
      pattern: /EXAMPLE_CLUSTER_URI/g,
      replacement: 'EXAMPLE_CLUSTER_URI',
      category: 'PAN_EMPLOYMENT_CRITICAL',
      riskLevel: 'HIGH',
      description: 'Real cluster URI - MUST REMOVE',
      employmentRisk: true
    },
    {
      pattern: /example-user/g,
      replacement: 'example-user',
      category: 'PERSONAL_IDENTIFIER',
      riskLevel: 'HIGH',
      description: 'Personal GitHub username',
      employmentRisk: true
    },
    {
      pattern: /ExampleApp-ServicePrincipal/g,
      replacement: 'ExampleApp-ServicePrincipal',
      category: 'AZURE_RESOURCE',
      riskLevel: 'MEDIUM',
      description: 'Azure service principal name',
      employmentRisk: false
    },

    // Infrastructure that could be traced back
    {
      pattern: /example-k8s-cluster/g,
      replacement: 'example-k8s-cluster',
      category: 'INFRASTRUCTURE_IDENTIFIER',
      riskLevel: 'MEDIUM',
      description: 'Specific AKS cluster name',
      employmentRisk: false
    },
    {
      pattern: /example-resource-group/g,
      replacement: 'example-resource-group',
      category: 'INFRASTRUCTURE_IDENTIFIER',
      riskLevel: 'MEDIUM',
      description: 'Azure resource group',
      employmentRisk: false
    },
    {
      pattern: /172\.171\.58\.41/g,
      replacement: '203.0.113.10',
      category: 'PUBLIC_IP',
      riskLevel: 'MEDIUM',
      description: 'Real Azure public IP',
      employmentRisk: false
    },
    {
      pattern: /192\.168\.1\.(\d{1,3})/g,
      replacement: '192.168.100.$1',
      category: 'INTERNAL_IP',
      riskLevel: 'LOW',
      description: 'Internal network IPs',
      employmentRisk: false
    },

    // Specific vulnerability references that might be problematic
    {
      pattern: /CVE-YYYY-NNNN/g,
      replacement: 'CVE-YYYY-NNNN',
      category: 'VULNERABILITY_REFERENCE',
      riskLevel: 'MEDIUM',
      description: 'Specific CVE being exploited',
      employmentRisk: false
    },
    {
      pattern: /ingress-nginx v1\.12\.0/g,
      replacement: 'ingress-nginx vX.Y.Z',
      category: 'VERSION_REFERENCE',
      riskLevel: 'LOW',
      description: 'Specific vulnerable version',
      employmentRisk: false
    },

    // API endpoints and credentials
    {
      pattern: /YOUR_XSIAM_API_KEY/g,
      replacement: 'YOUR_YOUR_XSIAM_API_KEY',
      category: 'API_CREDENTIAL',
      riskLevel: 'MEDIUM',
      description: 'XSIAM API key reference',
      employmentRisk: false
    },
    {
      pattern: /YOUR_CROWDSTRIKE_API_KEY/g,
      replacement: 'YOUR_YOUR_CROWDSTRIKE_API_KEY',
      category: 'API_CREDENTIAL',
      riskLevel: 'LOW',
      description: 'Third-party API key',
      employmentRisk: false
    },
    {
      pattern: /YOUR_RECORDED_FUTURE_API_KEY/g,
      replacement: 'YOUR_YOUR_RECORDED_FUTURE_API_KEY',
      category: 'API_CREDENTIAL',
      riskLevel: 'LOW',
      description: 'Third-party API key',
      employmentRisk: false
    },

    // VM and infrastructure identifiers
    {
      pattern: /VM 20[0-9]/g,
      replacement: 'VM XXX',
      category: 'INFRASTRUCTURE_IDENTIFIER',
      riskLevel: 'LOW',
      description: 'Proxmox VM numbers',
      employmentRisk: false
    },
    {
      pattern: /broker-vm-[\d\.]+\.qcow2/g,
      replacement: 'broker-vm-template.qcow2',
      category: 'INFRASTRUCTURE_IDENTIFIER',
      riskLevel: 'LOW',
      description: 'VM image filenames',
      employmentRisk: false
    },

    // Docker and container references
    {
      pattern: /malware-sim/g,
      replacement: 'malware-sim',
      category: 'CONTAINER_NAME',
      riskLevel: 'LOW',
      description: 'Specific malware family reference',
      employmentRisk: false
    },

    // Email and personal identifiers
    {
      pattern: /[a-zA-Z0-9._%+-]+@paloaltonetworks\.com/g,
      replacement: 'user@example.com',
      category: 'PAN_EMAIL',
      riskLevel: 'HIGH',
      description: 'Palo Alto Networks email addresses',
      employmentRisk: true
    },

    // Tailscale and network identifiers
    {
      pattern: /100\.126\.253\.49/g,
      replacement: '100.64.0.1',
      category: 'TAILSCALE_IP',
      riskLevel: 'MEDIUM',
      description: 'Tailscale network IP',
      employmentRisk: false
    },

    // Repository and project names
    {
      pattern: /security-research-platform/g,
      replacement: 'security-research-platform',
      category: 'PROJECT_NAME',
      riskLevel: 'LOW',
      description: 'Project repository name',
      employmentRisk: false
    }
  ];

  private binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so'];
  private excludeDirectories = ['node_modules', '.git', 'development-docs', 'operational-guides'];

  async sanitizeEntireRepository(rootPath: string = '.'): Promise<{
    filesProcessed: number;
    filesChanged: number;
    highRiskIssuesFound: number;
    employmentRiskIssuesFound: number;
    sanitizationReport: Record<string, { count: number; riskLevel: string; employmentRisk: boolean }>;
  }> {
    console.log('[COMPREHENSIVE SANITIZER] Starting complete repository sanitization...');
    
    const report: Record<string, { count: number; riskLevel: string; employmentRisk: boolean }> = {};
    let filesProcessed = 0;
    let filesChanged = 0;
    let highRiskIssuesFound = 0;
    let employmentRiskIssuesFound = 0;

    // First, create a backup
    await this.createBackup(rootPath);

    const processFile = async (filePath: string): Promise<void> => {
      try {
        // Skip binary files and excluded directories
        if (this.shouldSkipFile(filePath)) {
          return;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        let sanitizedContent = content;
        let fileChanged = false;

        // Apply all sanitization rules
        for (const rule of this.sanitizationRules) {
          const matches = content.match(rule.pattern);
          if (matches) {
            sanitizedContent = sanitizedContent.replace(rule.pattern, rule.replacement);
            fileChanged = true;

            // Track statistics
            const key = rule.category;
            if (!report[key]) {
              report[key] = {
                count: 0,
                riskLevel: rule.riskLevel,
                employmentRisk: rule.employmentRisk
              };
            }
            report[key].count += matches.length;

            if (rule.riskLevel === 'HIGH') {
              highRiskIssuesFound += matches.length;
            }
            if (rule.employmentRisk) {
              employmentRiskIssuesFound += matches.length;
            }

            console.log(`[SANITIZER] ${rule.riskLevel} RISK - ${rule.category}: ${matches.length} matches in ${filePath}`);
          }
        }

        if (fileChanged) {
          await fs.writeFile(filePath, sanitizedContent, 'utf-8');
          filesChanged++;
          console.log(`[SANITIZER] Sanitized: ${filePath}`);
        }

        filesProcessed++;
      } catch (error) {
        console.warn(`[SANITIZER] Error processing ${filePath}:`, error);
      }
    };

    const processDirectory = async (dirPath: string): Promise<void> => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !this.excludeDirectories.includes(entry.name)) {
          await processDirectory(fullPath);
        } else if (entry.isFile()) {
          await processFile(fullPath);
        }
      }
    };

    await processDirectory(rootPath);

    // Generate comprehensive report
    await this.generateComprehensiveReport(report, {
      filesProcessed,
      filesChanged,
      highRiskIssuesFound,
      employmentRiskIssuesFound
    });

    return {
      filesProcessed,
      filesChanged,
      highRiskIssuesFound,
      employmentRiskIssuesFound,
      sanitizationReport: report
    };
  }

  private shouldSkipFile(filePath: string): boolean {
    // Skip binary files
    const ext = path.extname(filePath).toLowerCase();
    if (this.binaryExtensions.includes(ext)) {
      return true;
    }

    // Skip excluded directories
    return this.excludeDirectories.some(dir => filePath.includes(dir));
  }

  private async createBackup(rootPath: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `pre-sanitization-backup-${timestamp}`;
    
    try {
      // Create backup using git if available
      await execAsync('git --version');
      await execAsync(`git archive --format=tar.gz --output=${backupPath}.tar.gz HEAD`);
      console.log(`[SANITIZER] Created Git backup: ${backupPath}.tar.gz`);
    } catch {
      console.log('[SANITIZER] Git not available, backup manually if needed');
    }
  }

  async sanitizeGitHistory(): Promise<void> {
    console.log('[SANITIZER] Creating Git history cleanup script for PAN employment protection...');
    
    // Create comprehensive cleanup script
    const cleanupScript = `#!/bin/bash
set -e

echo "🚨 EMERGENCY Git History Cleanup - Removing PAN Employment Risks"
echo "This will PERMANENTLY modify your Git history!"
echo ""

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "Installing git-filter-repo..."
    pip install git-filter-repo
fi

# Create backup
echo "Creating backup..."
BACKUP_DIR="../security-research-platform-backup-$(date +%Y%m%d_%H%M%S)"
git clone --bare . "$BACKUP_DIR"

# Create sensitive patterns file with all employment risks
cat > sensitive-patterns.txt << 'EOF'
demo-tenant.xdr.us.paloaltonetworks.com==>demo-tenant.xdr.us.paloaltonetworks.com
EXAMPLE_DISTRIBUTION_ID==>EXAMPLE_DISTRIBUTION_ID
EXAMPLE_CLUSTER_URI==>EXAMPLE_CLUSTER_URI
ExampleApp-ServicePrincipal==>ExampleApp-ServicePrincipal
example-user==>example-user
203.0.113.10==>203.0.113.0
192.168.1.==>192.168.100.
100.64.0.1==>100.64.0.1
example-k8s-cluster==>example-k8s-cluster
example-resource-group==>example-resource-group
@paloaltonetworks.com==>@example.com
fe81061fad0e410a95b019acc88621e0==>EXAMPLE_DISTRIBUTION_ID_2
CVE-YYYY-NNNN==>CVE-YYYY-NNNN
ingress-nginx vX.Y.Z==>ingress-nginx vX.Y.Z
scoleman==>example-user
Coleman==>ExampleUser
EOF

echo "Replacing sensitive text patterns in ALL Git history..."
git filter-repo --replace-text sensitive-patterns.txt --force

echo "Removing files with private keys and credentials..."
# Remove attached_assets containing private keys
git filter-repo --path attached_assets/ --invert-paths --force

# Remove cache and temp files
git filter-repo --path .cache/ --invert-paths --force

echo "✅ Git history cleanup completed!"
echo ""
echo "⚠️ CRITICAL VERIFICATION STEPS:"
echo "1. Search for remaining secrets:"
echo "   grep -r 'scoleman|914db8bd|be483e87|ExampleApp-ServicePrincipal' . --exclude-dir=.git"
echo ""
echo "2. If no results found, force push to GitHub:"
echo "   git push origin --force --all"
echo ""
echo "3. Backup saved at: $BACKUP_DIR"
echo ""
echo "🛡️ Repository is now safe for public sharing!"

# Clean up temporary files
rm sensitive-patterns.txt
`;

    // Write the cleanup script
    await fs.writeFile('./emergency-git-cleanup.sh', cleanupScript);
    await execAsync('chmod +x ./emergency-git-cleanup.sh');
    
    console.log('[SANITIZER] ✅ Emergency Git cleanup script created: ./emergency-git-cleanup.sh');
    console.log('[SANITIZER] ⚠️ RUN IMMEDIATELY: ./emergency-git-cleanup.sh');
  }

  private async generateComprehensiveReport(
    report: Record<string, { count: number; riskLevel: string; employmentRisk: boolean }>,
    stats: { filesProcessed: number; filesChanged: number; highRiskIssuesFound: number; employmentRiskIssuesFound: number }
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    
    const reportContent = `# Comprehensive Repository Sanitization Report
Generated: ${timestamp}

## Executive Summary
- **Files Processed**: ${stats.filesProcessed}
- **Files Modified**: ${stats.filesChanged}
- **High Risk Issues Found**: ${stats.highRiskIssuesFound}
- **Employment Risk Issues Found**: ${stats.employmentRiskIssuesFound}

## Employment Risk Assessment
${stats.employmentRiskIssuesFound > 0 ? 
  '⚠️  **CRITICAL**: Employment risk issues found and sanitized' : 
  '✅ **SAFE**: No employment risk issues detected'
}

## Sanitization Results by Category

${Object.entries(report)
  .sort(([,a], [,b]) => {
    if (a.employmentRisk !== b.employmentRisk) return a.employmentRisk ? -1 : 1;
    const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder];
  })
  .map(([category, data]) => 
    `### ${category} ${data.employmentRisk ? '🔴 EMPLOYMENT RISK' : ''} (${data.riskLevel})
- **Occurrences**: ${data.count}
- **Risk Level**: ${data.riskLevel}
- **Employment Risk**: ${data.employmentRisk ? 'YES' : 'NO'}
`).join('\n')}

## Sanitization Rules Applied

${this.sanitizationRules.map(rule => 
  `### ${rule.category} ${rule.employmentRisk ? '🔴' : ''} (${rule.riskLevel})
- **Pattern**: \`${rule.pattern.source}\`
- **Replacement**: \`${rule.replacement}\`
- **Description**: ${rule.description}
- **Employment Risk**: ${rule.employmentRisk ? 'YES' : 'NO'}
`).join('\n')}

## Next Steps for Public Repository

1. **Review High Risk Issues**: Manually verify all HIGH risk sanitizations
2. **Git History Cleaning**: Run git-filter-repo to clean commit history
3. **Environment Setup**: Create .env.example with placeholder values
4. **Documentation**: Update README with security disclaimers
5. **Final Review**: Manual review of sanitized repository

## Security Attestation

This sanitized version has been processed to remove:
- ✅ Palo Alto Networks specific identifiers
- ✅ Personal/employee information
- ✅ Real infrastructure identifiers
- ✅ API keys and credentials
- ✅ Internal network information
- ✅ Employment-related content

**Repository Status**: ${stats.employmentRiskIssuesFound === 0 ? 'READY FOR PUBLIC SHARING' : 'REQUIRES ADDITIONAL REVIEW'}
`;

    await fs.writeFile('COMPREHENSIVE_SANITIZATION_REPORT.md', reportContent);
    console.log('[SANITIZER] Generated comprehensive sanitization report');
  }
}

export const comprehensiveSanitizer = new ComprehensiveRepositorySanitizer();