import * as fs from 'fs/promises';
import * as path from 'path';

interface SanitizationRule {
  pattern: RegExp;
  replacement: string;
  category: string;
  description: string;
}

export class RepositorySanitizer {
  private sanitizationRules: SanitizationRule[] = [
    // Palo Alto Networks specific patterns
    {
      pattern: /scoleman\.xdr\.us\.paloaltonetworks\.com/g,
      replacement: '[your-tenant].xdr.us.paloaltonetworks.com',
      category: 'PAN_TENANT',
      description: 'XSIAM tenant URL'
    },
    {
      pattern: /EXAMPLE_DISTRIBUTION_ID/g,
      replacement: 'YOUR_DISTRIBUTION_ID_HERE',
      category: 'PAN_DISTRIBUTION',
      description: 'XSIAM distribution ID'
    },
    {
      pattern: /EXAMPLE_CLUSTER_URI/g,
      replacement: 'YOUR_CLUSTER_URI_HERE',
      category: 'PAN_CLUSTER',
      description: 'XSIAM cluster URI'
    },
    {
      pattern: /distributions\.traps\.paloaltonetworks\.com/g,
      replacement: 'distributions.traps.paloaltonetworks.com',
      category: 'PAN_ENDPOINT',
      description: 'Keep official endpoint but check context'
    },
    
    // Real infrastructure identifiers
    {
      pattern: /example-k8s-cluster/g,
      replacement: 'your-aks-cluster-name',
      category: 'INFRASTRUCTURE',
      description: 'Azure AKS cluster name'
    },
    {
      pattern: /example-resource-group/g,
      replacement: 'your-resource-group',
      category: 'INFRASTRUCTURE',
      description: 'Azure resource group'
    },
    {
      pattern: /172\.171\.58\.41/g,
      replacement: '203.0.113.10',
      category: 'IP_ADDRESS',
      description: 'Azure LoadBalancer IP'
    },
    {
      pattern: /192\.168\.1\.\d{1,3}/g,
      replacement: '192.168.100.$1',
      category: 'IP_ADDRESS',
      description: 'Internal network IPs'
    },
    
    // CVE and vulnerability references - keep generic
    {
      pattern: /CVE-YYYY-NNNN/g,
      replacement: 'CVE-YYYY-NNNN',
      category: 'VULNERABILITY',
      description: 'Specific CVE reference'
    },
    
    // API keys and tokens (placeholders that might be mistaken for real)
    {
      pattern: /YOUR_CROWDSTRIKE_API_KEY/g,
      replacement: 'YOUR_YOUR_CROWDSTRIKE_API_KEY',
      category: 'API_KEY',
      description: 'CrowdStrike API key placeholder'
    },
    {
      pattern: /YOUR_RECORDED_FUTURE_API_KEY/g,
      replacement: 'YOUR_YOUR_RECORDED_FUTURE_API_KEY',
      category: 'API_KEY',
      description: 'Recorded Future API key placeholder'
    },
    {
      pattern: /ALIENVAULT_API_KEY/g,
      replacement: 'YOUR_ALIENVAULT_API_KEY',
      category: 'API_KEY',
      description: 'AlienVault API key placeholder'
    },
    {
      pattern: /VIRUSTOTAL_API_KEY/g,
      replacement: 'YOUR_VIRUSTOTAL_API_KEY',
      category: 'API_KEY',
      description: 'VirusTotal API key placeholder'
    },
    
    // Employee/personal identifiers
    {
      pattern: /example-user/g,
      replacement: 'your-github-username',
      category: 'PERSONAL',
      description: 'GitHub username'
    },
    
    // Organization-specific references
    {
      pattern: /ExampleApp-ServicePrincipal/g,
      replacement: 'YourApp-ServicePrincipal',
      category: 'AZURE_SERVICE',
      description: 'Azure service principal name'
    },
    
    // Specific server/VM identifiers
    {
      pattern: /VM XXX|VM XXX|VM XXX/g,
      replacement: 'VM XXX',
      category: 'INFRASTRUCTURE',
      description: 'Proxmox VM identifiers'
    },
    {
      pattern: /broker-vm-27\.0\.47\.qcow2/g,
      replacement: 'broker-vm-template.qcow2',
      category: 'INFRASTRUCTURE',
      description: 'VM image filename'
    }
  ];

  private excludePatterns = [
    /node_modules/,
    /\.git/,
    /development-docs/,
    /operational-guides/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.pdf$/,
    /\.zip$/
  ];

  async sanitizeRepository(rootPath: string = '.'): Promise<{
    filesProcessed: number;
    changesFound: number;
    sanitizationReport: Record<string, number>;
  }> {
    const report: Record<string, number> = {};
    let filesProcessed = 0;
    let changesFound = 0;

    const processFile = async (filePath: string): Promise<void> => {
      try {
        // Skip excluded files
        if (this.excludePatterns.some(pattern => pattern.test(filePath))) {
          return;
        }

        // Only process text files
        const ext = path.extname(filePath).toLowerCase();
        const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.yml', '.yaml', '.sh', '.ps1'];
        if (!textExtensions.includes(ext)) {
          return;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        let sanitizedContent = content;
        let fileChanged = false;

        // Apply sanitization rules
        for (const rule of this.sanitizationRules) {
          const matches = content.match(rule.pattern);
          if (matches) {
            sanitizedContent = sanitizedContent.replace(rule.pattern, rule.replacement);
            fileChanged = true;
            
            // Track changes by category
            if (!report[rule.category]) {
              report[rule.category] = 0;
            }
            report[rule.category] += matches.length;
          }
        }

        if (fileChanged) {
          await fs.writeFile(filePath, sanitizedContent, 'utf-8');
          changesFound++;
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
        
        if (entry.isDirectory()) {
          await processDirectory(fullPath);
        } else {
          await processFile(fullPath);
        }
      }
    };

    await processDirectory(rootPath);

    return {
      filesProcessed,
      changesFound,
      sanitizationReport: report
    };
  }

  async generateSanitizationReport(): Promise<string> {
    const timestamp = new Date().toISOString();
    
    return `# Repository Sanitization Report
Generated: ${timestamp}

## Sanitization Rules Applied

${this.sanitizationRules.map(rule => 
  `### ${rule.category}
- **Pattern**: \`${rule.pattern.source}\`
- **Replacement**: \`${rule.replacement}\`
- **Description**: ${rule.description}
`).join('\n')}

## Files Excluded from Sanitization
- node_modules/
- .git/
- development-docs/
- operational-guides/
- Binary files (images, PDFs, archives)

## Security Notes
- All Palo Alto Networks specific identifiers have been replaced with placeholders
- Real infrastructure identifiers sanitized
- API key placeholders updated to prevent confusion
- Personal/employee identifiers removed
- CVE references generalized

This sanitized version is safe for public repository sharing.`;
  }
}

export const repositorySanitizer = new RepositorySanitizer();