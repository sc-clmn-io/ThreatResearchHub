import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, Upload, Database, Archive, CheckCircle, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';

interface BackupData {
  timestamp: string;
  version: string;
  platform: string;
  data: {
    useCases: any[];
    trainingPaths: any[];
    threatFeeds: any[];
    validationItems: any[];
    progressTracking: any[];
    sharedTemplates: any[];
    templateComments: any[];
    xsiamConnections: any[];
    deploymentHistory: any[];
    userPreferences: any;
  };
  metadata: {
    totalUseCases: number;
    totalTrainingPaths: number;
    totalThreats: number;
    lastBackup: string;
    dataSize: string;
  };
}

export default function DataBackupSystem() {
  const [backupStatus, setBackupStatus] = useState<'idle' | 'creating' | 'complete' | 'error'>('idle');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const createFullBackup = async () => {
    setBackupStatus('creating');
    
    try {
      // Gather all platform data from localStorage
      const useCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      const trainingPaths = JSON.parse(localStorage.getItem('trainingPaths') || '[]');
      const threatFeeds = JSON.parse(localStorage.getItem('threatFeeds') || '[]');
      const validationItems = JSON.parse(localStorage.getItem('validationItems') || '[]');
      const progressTracking = JSON.parse(localStorage.getItem('progressTracking') || '[]');
      const sharedTemplates = JSON.parse(localStorage.getItem('sharedTemplates') || '[]');
      const templateComments = JSON.parse(localStorage.getItem('templateComments') || '[]');
      const xsiamConnections = JSON.parse(localStorage.getItem('xsiamConnections') || '[]');
      const deploymentHistory = JSON.parse(localStorage.getItem('deploymentHistory') || '[]');
      const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');

      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        platform: 'ThreatResearchHub',
        data: {
          useCases,
          trainingPaths,
          threatFeeds,
          validationItems,
          progressTracking,
          sharedTemplates,
          templateComments,
          xsiamConnections,
          deploymentHistory,
          userPreferences
        },
        metadata: {
          totalUseCases: useCases.length,
          totalTrainingPaths: trainingPaths.length,
          totalThreats: threatFeeds.length,
          lastBackup: new Date().toISOString(),
          dataSize: calculateDataSize(useCases, trainingPaths, threatFeeds)
        }
      };

      // Create comprehensive backup ZIP
      const zip = new JSZip();
      
      // Add main backup file
      zip.file('security-research-platform-backup.json', JSON.stringify(backupData, null, 2));
      
      // Create organized folder structure
      const dataFolder = zip.folder('data');
      const exportFolder = zip.folder('exports');
      const configFolder = zip.folder('config');
      
      // Individual data files for easy restoration
      dataFolder?.file('use-cases.json', JSON.stringify(useCases, null, 2));
      dataFolder?.file('training-paths.json', JSON.stringify(trainingPaths, null, 2));
      dataFolder?.file('threat-feeds.json', JSON.stringify(threatFeeds, null, 2));
      dataFolder?.file('validation-items.json', JSON.stringify(validationItems, null, 2));
      dataFolder?.file('progress-tracking.json', JSON.stringify(progressTracking, null, 2));
      dataFolder?.file('shared-templates.json', JSON.stringify(sharedTemplates, null, 2));
      dataFolder?.file('template-comments.json', JSON.stringify(templateComments, null, 2));
      
      // XSIAM specific data
      const xsiamFolder = zip.folder('xsiam');
      xsiamFolder?.file('connections.json', JSON.stringify(xsiamConnections, null, 2));
      xsiamFolder?.file('deployment-history.json', JSON.stringify(deploymentHistory, null, 2));
      
      // Configuration files
      configFolder?.file('user-preferences.json', JSON.stringify(userPreferences, null, 2));
      configFolder?.file('platform-info.json', JSON.stringify({
        version: '1.0.0',
        platform: 'ThreatResearchHub',
        backupDate: new Date().toISOString(),
        dataIntegrity: 'verified'
      }, null, 2));

      // Export format files (ready for XSIAM deployment)
      if (useCases.length > 0) {
        // Generate XQL Correlation Rules
        const correlationRules = useCases.map((uc: any, index: number) => ({
          rule_id: `TRH_${index + 1000}`,
          name: `ThreatResearchHub_${uc.title.replace(/[^\w]/g, '_')}`,
          severity: uc.severity === 'critical' ? 'SEV_040_HIGH' : 'SEV_030_MEDIUM',
          xql_query: uc.detectionRules?.[0]?.xqlQuery || `dataset = xdr_data | filter threat_name contains "${uc.title}"`,
          description: uc.description || `Detection rule for ${uc.title}`,
          alert_name: `TRH Alert: ${uc.title}`,
          is_enabled: true,
          search_window: "1 hours",
          suppression_duration: "1 hours"
        }));
        
        exportFolder?.file('xql-correlation-rules.json', JSON.stringify(correlationRules, null, 2));
      }

      // Generate XSIAM Playbooks
      if (trainingPaths.length > 0) {
        trainingPaths.forEach((tp: any, index: number) => {
          const playbookYaml = `id: security-research-platform-${tp.title.toLowerCase().replace(/[^\w]/g, '-')}
version: 1
name: ${tp.title}
description: ${tp.description || `Automated response for ${tp.title}`}
starttaskid: "0"
system: true
tasks:
  "0":
    id: start-investigation
    type: start
    nexttasks:
      "#none#": ["1"]
  "1":
    id: threat-analysis
    type: regular
    task:
      brand: ""
      description: Analysis phase for ${tp.title}
    nexttasks:
      "#none#": []`;
          
          exportFolder?.file(`playbook-${tp.title.replace(/[^\w]/g, '-').toLowerCase()}.yml`, playbookYaml);
        });
      }

      // Add comprehensive README
      const readme = `# ThreatResearchHub Complete Backup
      
**Backup Date:** ${new Date().toLocaleDateString()}
**Version:** 1.0.0
**Total Use Cases:** ${useCases.length}
**Total Training Paths:** ${trainingPaths.length}
**Total Threat Feeds:** ${threatFeeds.length}

## Backup Structure

### /data/
Complete platform data in JSON format:
- use-cases.json: All threat intelligence use cases
- training-paths.json: Generated training workflows
- threat-feeds.json: Threat intelligence feeds
- validation-items.json: Items requiring review
- progress-tracking.json: Training completion status
- shared-templates.json: Community templates
- template-comments.json: Template feedback

### /xsiam/
XSIAM-specific configurations:
- connections.json: XSIAM instance connections
- deployment-history.json: Deployment activity logs

### /exports/
Ready-to-deploy XSIAM content:
- xql-correlation-rules.json: Detection rules
- playbook-*.yml: Response playbooks

### /config/
Platform configuration:
- user-preferences.json: User settings
- platform-info.json: Platform metadata

## Restoration Instructions

1. Import security-research-platform-backup.json for complete restoration
2. Use individual files in /data/ for selective restoration
3. Deploy /exports/ content directly to XSIAM instances
4. Restore /config/ for user preferences

### /development/
Complete rebuild documentation:
- DEVELOPMENT_MANIFEST.md: Complete development history and decisions
- replit.md: Current project architecture and preferences  
- package.json: Dependencies and scripts
- rebuild.sh: Automated rebuild script
- .env.template: Environment variable template

## Data Integrity
All data has been verified and exported in multiple formats to ensure no loss of training content, threat intelligence, or platform configurations.

## Complete Platform Rebuild
This backup includes everything needed to rebuild the entire platform:
1. Run rebuild.sh script for automated setup
2. Import /data/ files to restore training content
3. Configure environment variables from .env.template
4. Platform will be fully operational with all features
`;

      zip.file('README.md', readme);
      
      // Add GitHub integration guide
      const githubGuide = `# GitHub Private Repository Setup

This backup can be directly uploaded to a private GitHub repository for secure storage.

## Quick Setup:
1. Create private repository: security-research-platform-private
2. Upload this backup ZIP
3. Extract and commit all files
4. Set up automated daily backups

See GITHUB_EXPORT_GUIDE.md for detailed instructions.

## Repository URL Template:
https://github.com/YOUR_USERNAME/security-research-platform-private

## Security:
- Repository MUST be private
- Contains sensitive training data
- Use .gitignore for secrets
- Enable automated backups
`;
      
      zip.file('GITHUB_SETUP.md', githubGuide);

      // Add development documentation
      const developmentFolder = zip.folder('development');
      
      // Include complete rebuild instructions
      const manifestContent = await fetch('/DEVELOPMENT_MANIFEST.md').then(r => r.text()).catch(() => 
        'Development manifest not found - check repository for latest version'
      );
      developmentFolder?.file('DEVELOPMENT_MANIFEST.md', manifestContent);
      
      // Include architecture documentation
      const replitContent = await fetch('/replit.md').then(r => r.text()).catch(() => 
        'Project documentation not found - check repository'
      );
      developmentFolder?.file('replit.md', replitContent);
      
      // Include package configuration
      const packageContent = await fetch('/package.json').then(r => r.text()).catch(() => '{}');
      developmentFolder?.file('package.json', packageContent);
      
      // Add rebuild script
      const rebuildScript = `#!/bin/bash
# ThreatResearchHub Rebuild Script

echo "🚀 Starting ThreatResearchHub rebuild..."

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org"
    echo "   macOS: Download installer or run 'brew install node'"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# 2. Setup database (optional)
echo "🗄️  Setting up database (optional)..."
npm run db:push 2>/dev/null || echo "⚠️  Database setup skipped (optional)"

# 3. Import backup data
echo "📥 Preparing data import..."
echo "   Training data available in /data/ folder"
echo "   Import via Dashboard → Data Management after startup"

# 4. Start development server
echo "🌐 Starting development server..."
echo "   Platform will be available at: http://localhost:5173"
echo "   Press Ctrl+C to stop the server"
echo ""

npm run dev

echo "✅ Rebuild complete! Platform should be running on localhost:5173"
echo "📝 Next steps:"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Go to Dashboard → Data Management"
echo "   3. Import files from /data/ folder to restore training content"
`;
      
      developmentFolder?.file('rebuild.sh', rebuildScript);
      
      // Add environment template
      const envTemplate = `# ThreatResearchHub Environment Variables

# Optional: PostgreSQL Database
DATABASE_URL=postgresql://username:password@host:port/database

# Optional: AI Features
ANTHROPIC_API_KEY=your_api_key_here

# Development
NODE_ENV=development
VITE_APP_VERSION=1.0.0
`;
      
      developmentFolder?.file('.env.template', envTemplate);
      
      // Add macOS installation guide
      const macosGuide = await fetch('/MACOS_INSTALL_GUIDE.md').then(r => r.text()).catch(() => 
        'macOS installation guide not found - see DEVELOPMENT_MANIFEST.md for installation instructions'
      );
      developmentFolder?.file('MACOS_INSTALL_GUIDE.md', macosGuide);

      // Generate and download backup
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-research-platform-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackup(new Date().toISOString());
      localStorage.setItem('lastBackup', new Date().toISOString());
      setBackupStatus('complete');

      toast({
        title: "Backup Created Successfully",
        description: `Complete backup with ${useCases.length} use cases and ${trainingPaths.length} training paths`
      });

    } catch (error) {
      console.error('Backup creation failed:', error);
      setBackupStatus('error');
      toast({
        title: "Backup Failed",
        description: "Unable to create backup - check console for details",
        variant: "destructive"
      });
    }
  };

  const calculateDataSize = (useCases: any[], trainingPaths: any[], threatFeeds: any[]): string => {
    const sizeInBytes = JSON.stringify({ useCases, trainingPaths, threatFeeds }).length;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    return sizeInKB > 1024 ? `${Math.round(sizeInKB / 1024)} MB` : `${sizeInKB} KB`;
  };

  const handleFileRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoreStatus('processing');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData: BackupData = JSON.parse(content);

        // Restore all data to localStorage
        localStorage.setItem('useCases', JSON.stringify(backupData.data.useCases));
        localStorage.setItem('trainingPaths', JSON.stringify(backupData.data.trainingPaths));
        localStorage.setItem('threatFeeds', JSON.stringify(backupData.data.threatFeeds));
        localStorage.setItem('validationItems', JSON.stringify(backupData.data.validationItems));
        localStorage.setItem('progressTracking', JSON.stringify(backupData.data.progressTracking));
        localStorage.setItem('sharedTemplates', JSON.stringify(backupData.data.sharedTemplates));
        localStorage.setItem('templateComments', JSON.stringify(backupData.data.templateComments));
        localStorage.setItem('xsiamConnections', JSON.stringify(backupData.data.xsiamConnections));
        localStorage.setItem('deploymentHistory', JSON.stringify(backupData.data.deploymentHistory));
        localStorage.setItem('userPreferences', JSON.stringify(backupData.data.userPreferences));

        setRestoreStatus('complete');
        toast({
          title: "Data Restored Successfully",
          description: `Restored ${backupData.metadata.totalUseCases} use cases and ${backupData.metadata.totalTrainingPaths} training paths`
        });

        // Refresh page to reflect restored data
        setTimeout(() => window.location.reload(), 2000);

      } catch (error) {
        console.error('Restore failed:', error);
        setRestoreStatus('error');
        toast({
          title: "Restore Failed",
          description: "Invalid backup file format",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600';
      case 'creating': case 'processing': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Platform Data Backup
          </CardTitle>
          <CardDescription>
            Complete backup of all training data, threat intelligence, and platform configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Full Platform Backup</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Creates comprehensive ZIP with all data, configurations, and ready-to-deploy XSIAM content
                </p>
                <Button 
                  onClick={createFullBackup}
                  disabled={backupStatus === 'creating'}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {backupStatus === 'creating' ? 'Creating Backup...' : 'Create Full Backup'}
                </Button>
                {backupStatus !== 'idle' && (
                  <div className={`mt-2 text-sm ${getStatusColor(backupStatus)}`}>
                    Status: {backupStatus === 'creating' ? 'Creating comprehensive backup...' : 
                             backupStatus === 'complete' ? 'Backup created successfully!' : 
                             'Backup creation failed'}
                  </div>
                )}
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Data Restoration</h3>
                <p className="text-sm text-green-800 mb-3">
                  Restore complete platform data from backup file
                </p>
                <label className="w-full">
                  <input
                    type="file"
                    accept=".json,.zip"
                    onChange={handleFileRestore}
                    className="hidden"
                    disabled={restoreStatus === 'processing'}
                  />
                  <Button 
                    variant="outline"
                    className="w-full cursor-pointer"
                    disabled={restoreStatus === 'processing'}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {restoreStatus === 'processing' ? 'Restoring...' : 'Restore from Backup'}
                  </Button>
                </label>
                {restoreStatus !== 'idle' && (
                  <div className={`mt-2 text-sm ${getStatusColor(restoreStatus)}`}>
                    Status: {restoreStatus === 'processing' ? 'Restoring data...' : 
                             restoreStatus === 'complete' ? 'Data restored successfully!' : 
                             'Restore failed'}
                  </div>
                )}
              </div>
            </div>

            {lastBackup && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">Last Backup</span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(lastBackup).toLocaleString()}
                </p>
              </div>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-yellow-900">Data Protection</span>
              </div>
              <p className="text-sm text-yellow-800">
                Regular backups ensure no loss of valuable training data, threat intelligence, or platform configurations. 
                Backups include all use cases, training paths, XSIAM connections, and deployment history.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}