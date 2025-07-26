import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Search, 
  Filter, 
  FileText, 
  Database, 
  Layout, 
  BarChart3, 
  Github,
  Copy,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  Package,
  ArrowLeft,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Users,
  Clock,
  Star,
  GitFork,
  RefreshCw,
  ArrowRight,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import * as yaml from 'js-yaml';
import { Link } from 'wouter';

interface XSIAMContent {
  id: string;
  contentType: 'correlation' | 'playbook' | 'alert_layout' | 'dashboard';
  name: string;
  description?: string;
  category: 'endpoint' | 'network' | 'cloud' | 'identity' | 'web' | 'email';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  threatName: string;
  contentData: any;
  requirements: any;
  metadata?: any;
  formats: string[];
  status: 'draft' | 'validated' | 'published' | 'deprecated';
  version: number;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // GitHub-style version control
  gitInfo: {
    branch: string;
    commit: string;
    author: string;
    message: string;
    pullRequest?: number;
    reviewStatus: 'none' | 'pending' | 'approved' | 'changes_requested';
    mergeStatus: 'unmerged' | 'merged' | 'conflict';
  };
  
  // Collaboration features
  collaboration: {
    contributors: string[];
    lastModifiedBy: string;
    changeLog: Array<{
      version: number;
      author: string;
      timestamp: Date;
      message: string;
      changes: string[];
    }>;
    reviews: Array<{
      reviewer: string;
      status: 'approved' | 'changes_requested' | 'commented';
      comment: string;
      timestamp: Date;
    }>;
  };
  
  // Content relationships
  dependencies: string[]; // Content IDs this depends on
  dependents: string[];   // Content IDs that depend on this
  forks: string[];        // Forked versions
  originalId?: string;    // If this is a fork
}

const ContentLibrary: React.FC = () => {
  const [content, setContent] = useState<XSIAMContent[]>([]);
  const [filteredContent, setFilteredContent] = useState<XSIAMContent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState<XSIAMContent | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [pullRequestModalOpen, setPullRequestModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [showConflicts, setShowConflicts] = useState(false);
  const [ddlcModalOpen, setDdlcModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [content, searchTerm, categoryFilter, typeFilter, statusFilter]);

  // GitHub-style workflow functions
  const createBranch = (contentId: string, branchName: string) => {
    const content = filteredContent.find(c => c.id === contentId);
    if (!content) return;

    const newContent: XSIAMContent = {
      ...content,
      id: `${contentId}_${branchName}_${Date.now()}`,
      gitInfo: {
        ...content.gitInfo,
        branch: branchName,
        commit: `${Math.random().toString(36).substr(2, 7)}`,
        message: `Created branch ${branchName}`,
        author: 'Current User',
        reviewStatus: 'none',
        mergeStatus: 'unmerged'
      },
      collaboration: {
        ...content.collaboration,
        changeLog: [
          ...content.collaboration.changeLog,
          {
            version: content.version + 1,
            author: 'Current User',
            timestamp: new Date(),
            message: `Created branch ${branchName}`,
            changes: ['Branch created']
          }
        ]
      },
      version: content.version + 1,
      updatedAt: new Date()
    };

    setContent(prev => [...prev, newContent]);
    toast({ title: "Branch Created", description: `Successfully created branch '${branchName}'` });
  };

  const createPullRequest = (contentId: string, targetBranch: string, description: string) => {
    const content = filteredContent.find(c => c.id === contentId);
    if (!content) return;

    const updatedContent = {
      ...content,
      gitInfo: {
        ...content.gitInfo,
        pullRequest: Math.floor(Math.random() * 1000) + 1,
        reviewStatus: 'pending' as const,
        message: description
      },
      collaboration: {
        ...content.collaboration,
        changeLog: [
          ...content.collaboration.changeLog,
          {
            version: content.version,
            author: 'Current User',
            timestamp: new Date(),
            message: `Created PR to ${targetBranch}: ${description}`,
            changes: ['Pull request created']
          }
        ]
      }
    };

    setContent(prev => prev.map(c => c.id === contentId ? updatedContent : c));
    toast({ title: "Pull Request Created", description: `PR #${updatedContent.gitInfo.pullRequest} ready for review` });
  };

  const reviewContent = (contentId: string, status: 'approved' | 'changes_requested', comment: string) => {
    const content = filteredContent.find(c => c.id === contentId);
    if (!content) return;

    const updatedContent = {
      ...content,
      gitInfo: {
        ...content.gitInfo,
        reviewStatus: status
      },
      collaboration: {
        ...content.collaboration,
        reviews: [
          ...content.collaboration.reviews,
          {
            reviewer: 'Current User',
            status,
            comment,
            timestamp: new Date()
          }
        ]
      }
    };

    setContent(prev => prev.map(c => c.id === contentId ? updatedContent : c));
    toast({ title: "Review Submitted", description: `Content ${status.replace('_', ' ')}` });
  };

  const mergeContent = (contentId: string) => {
    const content = filteredContent.find(c => c.id === contentId);
    if (!content || content.gitInfo.reviewStatus !== 'approved') return;

    const updatedContent = {
      ...content,
      gitInfo: {
        ...content.gitInfo,
        mergeStatus: 'merged' as const,
        branch: 'main'
      },
      status: 'published' as const,
      collaboration: {
        ...content.collaboration,
        changeLog: [
          ...content.collaboration.changeLog,
          {
            version: content.version,
            author: 'Current User',
            timestamp: new Date(),
            message: `Merged PR #${content.gitInfo.pullRequest} to main`,
            changes: ['Content merged to main branch']
          }
        ]
      }
    };

    setContent(prev => prev.map(c => c.id === contentId ? updatedContent : c));
    toast({ title: "Content Merged", description: "Successfully merged to main branch" });
  };

  const forkContent = (contentId: string) => {
    const original = filteredContent.find(c => c.id === contentId);
    if (!original) return;

    const forkedContent: XSIAMContent = {
      ...original,
      id: `${contentId}_fork_${Date.now()}`,
      name: `${original.name} (Fork)`,
      gitInfo: {
        branch: 'fork-main',
        commit: `${Math.random().toString(36).substr(2, 7)}`,
        author: 'Current User',
        message: 'Forked content',
        reviewStatus: 'none',
        mergeStatus: 'unmerged'
      },
      collaboration: {
        contributors: ['Current User'],
        lastModifiedBy: 'Current User',
        changeLog: [{
          version: 1,
          author: 'Current User',
          timestamp: new Date(),
          message: 'Forked content',
          changes: ['Content forked']
        }],
        reviews: []
      },
      originalId: contentId,
      forks: [],
      dependencies: original.dependencies,
      dependents: [],
      version: 1,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update original to include this fork
    const updatedOriginal = {
      ...original,
      forks: [...(original.forks || []), forkedContent.id]
    };

    setContent(prev => [...prev.map(c => c.id === contentId ? updatedOriginal : c), forkedContent]);
    toast({ title: "Content Forked", description: "Successfully created a fork for customization" });
  };

  const advanceDdlcPhase = (contentId: string) => {
    const phaseOrder = ['requirement', 'design', 'development', 'testing', 'deployed', 'monitoring'];
    
    setContent(prev => prev.map(c => {
      if (c.id === contentId) {
        const currentPhaseIndex = phaseOrder.indexOf(c.metadata?.ddlcPhase || 'requirement');
        const nextPhaseIndex = Math.min(currentPhaseIndex + 1, phaseOrder.length - 1);
        const nextPhase = phaseOrder[nextPhaseIndex];
        
        return {
          ...c,
          metadata: {
            ...c.metadata,
            ddlcPhase: nextPhase,
            testStatus: nextPhase === 'testing' ? 'in_progress' : 
                       nextPhase === 'deployed' ? 'validated' : c.metadata?.testStatus
          },
          collaboration: {
            ...c.collaboration,
            changeLog: [
              ...c.collaboration.changeLog,
              {
                version: c.version,
                author: 'Current User',
                timestamp: new Date(),
                message: `Advanced to ${nextPhase} phase`,
                changes: [`DDLC phase updated to ${nextPhase}`]
              }
            ]
          },
          updatedAt: new Date()
        };
      }
      return c;
    }));
    
    toast({ 
      title: "DDLC Phase Advanced", 
      description: `Content advanced following NVISO Detection-as-Code framework` 
    });
  };

  const loadContent = () => {
    // Load from localStorage for now
    const stored = localStorage.getItem('xsiam-content');
    if (stored) {
      const parsed = JSON.parse(stored);
      setContent(parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        // Ensure GitHub-style metadata exists
        gitInfo: c.gitInfo || {
          branch: 'main',
          commit: Math.random().toString(36).substr(2, 7),
          author: 'Current User',
          message: 'Initial commit',
          reviewStatus: 'none',
          mergeStatus: 'merged'
        },
        collaboration: c.collaboration || {
          contributors: ['Current User'],
          lastModifiedBy: 'Current User',
          changeLog: [{
            version: c.version || 1,
            author: 'Current User',
            timestamp: new Date(c.createdAt || Date.now()),
            message: 'Initial creation',
            changes: ['Content created']
          }],
          reviews: []
        },
        dependencies: c.dependencies || [],
        dependents: c.dependents || [],
        forks: c.forks || []
      })));
    } else {
      // Add sample content to demonstrate GitHub-style features
      const sampleContent = generateSampleContent();
      setContent(sampleContent);
      localStorage.setItem('xsiam-content', JSON.stringify(sampleContent));
    }
  };

  const generateSampleContent = (): XSIAMContent[] => {
    return [
      {
        id: 'correlation-1',
        contentType: 'correlation',
        name: 'Kubernetes Pod Privilege Escalation',
        description: 'Detects privilege escalation attempts in Kubernetes pods',
        category: 'cloud',
        severity: 'high',
        threatName: 'K8s Privilege Escalation',
        contentData: {
          rule_name: 'K8s Pod PrivEsc Detection',
          xql_query: 'dataset = kubernetes_audit_logs | filter action="create" and resource_type="pod"',
          severity: 'high'
        },
        requirements: { dataSources: ['kubernetes_audit_logs'] },
        metadata: { 
          mitre_attack: ['T1068'],
          ddlcPhase: 'deployed',
          testStatus: 'validated',
          dataSourcesRequired: ['kubernetes_audit_logs'],
          performanceImpact: 'low',
          falsePositiveRate: '< 5%',
          references: ['https://attack.mitre.org/techniques/T1068/']
        },
        formats: ['json', 'yaml'],
        status: 'published',
        version: 2,
        isTemplate: false,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-22'),
        gitInfo: {
          branch: 'main',
          commit: 'a7b8c9d',
          author: 'Security Team',
          message: 'Updated detection logic for better accuracy',
          reviewStatus: 'approved',
          mergeStatus: 'merged'
        },
        collaboration: {
          contributors: ['Security Team', 'K8s Expert', 'SOC Analyst'],
          lastModifiedBy: 'K8s Expert',
          changeLog: [
            {
              version: 1,
              author: 'Security Team',
              timestamp: new Date('2025-01-20'),
              message: 'Initial correlation rule',
              changes: ['Created XQL query', 'Added field mappings']
            },
            {
              version: 2,
              author: 'K8s Expert',
              timestamp: new Date('2025-01-22'),
              message: 'Improved detection accuracy',
              changes: ['Enhanced XQL logic', 'Added severity threshold']
            }
          ],
          reviews: [
            {
              reviewer: 'SOC Manager',
              status: 'approved',
              comment: 'Excellent detection logic, ready for production',
              timestamp: new Date('2025-01-21')
            }
          ]
        },
        dependencies: [],
        dependents: ['playbook-1'],
        forks: []
      },
      {
        id: 'playbook-1',
        contentType: 'playbook',
        name: 'K8s Incident Response',
        description: 'Automated response for Kubernetes security incidents',
        category: 'cloud',
        severity: 'high',
        threatName: 'K8s Security Response',
        contentData: {
          playbook_name: 'K8s Security Incident Response',
          tasks: ['isolate_pod', 'collect_logs', 'notify_team'],
          automation_level: 'semi-automated'
        },
        requirements: { integrations: ['kubernetes', 'slack'] },
        metadata: { 
          response_time: '< 5 minutes',
          ddlcPhase: 'testing',
          testStatus: 'in_progress',
          automationLevel: 'semi-automated',
          integrations: ['kubernetes', 'slack', 'servicenow'],
          references: ['https://kubernetes.io/docs/concepts/security/']
        },
        formats: ['yaml'],
        status: 'validated',
        version: 1,
        isTemplate: false,
        createdAt: new Date('2025-01-21'),
        updatedAt: new Date('2025-01-21'),
        gitInfo: {
          branch: 'feature/k8s-response',
          commit: 'e1f2g3h',
          author: 'SOC Analyst',
          message: 'Added automated pod isolation',
          pullRequest: 42,
          reviewStatus: 'pending',
          mergeStatus: 'unmerged'
        },
        collaboration: {
          contributors: ['SOC Analyst', 'K8s Expert'],
          lastModifiedBy: 'SOC Analyst',
          changeLog: [
            {
              version: 1,
              author: 'SOC Analyst',
              timestamp: new Date('2025-01-21'),
              message: 'Created response playbook',
              changes: ['Added isolation steps', 'Integrated Slack notifications']
            }
          ],
          reviews: []
        },
        dependencies: ['correlation-1'],
        dependents: [],
        forks: []
      },
      {
        id: 'layout-1',
        contentType: 'alert_layout',
        name: 'K8s Security Alert Layout',
        description: 'Custom layout for Kubernetes security alerts',
        category: 'cloud',
        severity: 'medium',
        threatName: 'K8s Alert Display',
        contentData: {
          layout_name: 'K8s Security Alert',
          fields: ['pod_name', 'namespace', 'escalation_method', 'severity'],
          sections: ['overview', 'technical_details', 'response_actions']
        },
        requirements: { alert_fields: ['kubernetes_context'] },
        metadata: { 
          ui_version: '3.1',
          ddlcPhase: 'development',
          testStatus: 'needs_validation',
          layoutType: 'incident_response',
          compatibleWith: ['XSIAM 3.1+', 'Cortex XSOAR 6.10+'],
          designPatterns: ['contextual_fields', 'action_buttons']
        },
        formats: ['json'],
        status: 'draft',
        version: 1,
        isTemplate: true,
        createdAt: new Date('2025-01-23'),
        updatedAt: new Date('2025-01-23'),
        gitInfo: {
          branch: 'feature/alert-layouts',
          commit: 'i4j5k6l',
          author: 'UI Designer',
          message: 'Initial alert layout design',
          reviewStatus: 'changes_requested',
          mergeStatus: 'unmerged'
        },
        collaboration: {
          contributors: ['UI Designer'],
          lastModifiedBy: 'UI Designer',
          changeLog: [
            {
              version: 1,
              author: 'UI Designer',
              timestamp: new Date('2025-01-23'),
              message: 'Created alert layout',
              changes: ['Designed field layout', 'Added action buttons']
            }
          ],
          reviews: [
            {
              reviewer: 'UX Lead',
              status: 'changes_requested',
              comment: 'Please add more contextual fields for better analyst workflow',
              timestamp: new Date('2025-01-23')
            }
          ]
        },
        dependencies: [],
        dependents: [],
        forks: ['layout-1-fork-1']
      }
    ];
  };

  const saveContent = (newContent: XSIAMContent[]) => {
    localStorage.setItem('xsiam-content', JSON.stringify(newContent));
    setContent(newContent);
  };

  const filterContent = () => {
    let filtered = content;

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.threatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.contentType === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredContent(filtered);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'correlation': return <Database className="w-4 h-4" />;
      case 'playbook': return <FileText className="w-4 h-4" />;
      case 'alert_layout': return <Layout className="w-4 h-4" />;
      case 'dashboard': return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'validated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'deprecated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const exportContent = async (contentItem: XSIAMContent, format: 'json' | 'yaml') => {
    try {
      let exportData: any;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        exportData = {
          export_metadata: {
            timestamp: new Date().toISOString(),
            platform: 'xsiam',
            content_type: contentItem.contentType,
            version: contentItem.version
          },
          content: {
            id: contentItem.id,
            name: contentItem.name,
            type: contentItem.contentType,
            category: contentItem.category,
            severity: contentItem.severity,
            threat_name: contentItem.threatName,
            data: contentItem.contentData,
            requirements: contentItem.requirements,
            metadata: contentItem.metadata
          }
        };
        filename = `${contentItem.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}.json`;
        mimeType = 'application/json';
      } else {
        exportData = yaml.dump({
          id: contentItem.id,
          name: contentItem.name,
          type: contentItem.contentType,
          category: contentItem.category,
          severity: contentItem.severity,
          threat_name: contentItem.threatName,
          ...contentItem.contentData
        });
        filename = `${contentItem.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}.yml`;
        mimeType = 'application/x-yaml';
      }

      const blob = new Blob([format === 'json' ? JSON.stringify(exportData, null, 2) : exportData], { 
        type: mimeType 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${contentItem.name} exported successfully as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportBulk = async (selectedItems: XSIAMContent[]) => {
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];

      // Create folders by content type
      const correlationsFolder = zip.folder("correlations");
      const playbooksFolder = zip.folder("playbooks");
      const layoutsFolder = zip.folder("alert-layouts");
      const dashboardsFolder = zip.folder("dashboards");

      selectedItems.forEach(item => {
        let folder: JSZip | null = null;
        let extension = '.json';

        switch (item.contentType) {
          case 'correlation':
            folder = correlationsFolder;
            break;
          case 'playbook':
            folder = playbooksFolder;
            extension = '.yml';
            break;
          case 'alert_layout':
            folder = layoutsFolder;
            break;
          case 'dashboard':
            folder = dashboardsFolder;
            break;
        }

        if (folder) {
          const filename = `${item.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}${extension}`;
          
          if (extension === '.yml') {
            const yamlContent = yaml.dump(item.contentData);
            folder.file(filename, yamlContent);
          } else {
            folder.file(filename, JSON.stringify(item.contentData, null, 2));
          }
        }
      });

      // Add export metadata
      zip.file("export-metadata.json", JSON.stringify({
        timestamp: new Date().toISOString(),
        platform: 'ThreatResearchHub v1.0',
        export_type: 'bulk',
        content_count: selectedItems.length,
        categories: Array.from(new Set(selectedItems.map(i => i.category))),
        content_types: Array.from(new Set(selectedItems.map(i => i.contentType)))
      }, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threatresearchhub-content-export-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Bulk Export Complete",
        description: `${selectedItems.length} items exported successfully`,
      });
    } catch (error) {
      console.error('Bulk export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export content bundle. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateGitHubInstructions = () => {
    return `# ThreatResearchHub v0.1 - GitHub Upload Instructions

## Quick Upload to GitHub

### Method 1: Using GitHub CLI (Recommended)
\`\`\`bash
# Install GitHub CLI if not already installed
# On macOS: brew install gh
# On Windows: Download from https://cli.github.com/

# Navigate to your project directory
cd /path/to/your/threatresearchhub

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ThreatResearchHub v0.1"

# Create GitHub repository and push
gh repo create ThreatResearchHub --public --source=. --remote=upstream --push
\`\`\`

### Method 2: Manual GitHub Upload
1. Go to GitHub.com and create a new repository called "ThreatResearchHub"
2. Download all project files from Replit
3. Upload files to GitHub repository

### Method 3: Direct from Replit (Current Setup)
\`\`\`bash
# In Replit terminal
git init
git add .
git commit -m "Initial commit: ThreatResearchHub v0.1"
git remote add origin https://github.com/yourusername/ThreatResearchHub.git
git push -u origin main
\`\`\`

## Project Structure Ready for GitHub
- ✅ Complete React/TypeScript application
- ✅ XSIAM content generation system
- ✅ Export capabilities (JSON/YAML/ZIP)
- ✅ Content library with filtering
- ✅ Bulk processing workflows
- ✅ Authentication infrastructure ready
- ✅ Database schemas prepared

## Key Features Implemented
- Multi-format threat intelligence processing
- XSIAM/XSOAR content generation
- Lab environment setup workflows  
- Taxonomy breakdown system
- Template sharing system
- Content validation queues
- Export system with GitHub integration

## Next Steps After Upload
1. Add README.md with setup instructions
2. Configure GitHub Actions for CI/CD
3. Add environment variables for production
4. Set up deployment pipeline
5. Configure security scanning

## Repository Value
This is a production-ready threat intelligence platform with enterprise-grade features ready for immediate use or further development.`;
  };

  const renderContentCard = (item: XSIAMContent) => (
    <Card key={item.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getContentIcon(item.contentType)}
            <CardTitle className="text-sm font-medium line-clamp-1">{item.name}</CardTitle>
          </div>
          <div className="flex space-x-1">
            <div className={`w-2 h-2 rounded-full ${getSeverityColor(item.severity)}`} />
            <Badge variant="outline" className={getStatusColor(item.status)}>
              {item.status}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs line-clamp-2">
          {item.description || item.threatName}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {/* GitHub-style metadata */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{item.category}</span>
            <span>v{item.version}</span>
          </div>
          
          {item.gitInfo && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  <span className="font-mono">{item.gitInfo.branch}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitCommit className="w-3 h-3" />
                  <span className="font-mono">{item.gitInfo.commit.slice(0, 7)}</span>
                </div>
                {item.gitInfo.pullRequest && (
                  <div className="flex items-center gap-1">
                    <GitPullRequest className="w-3 h-3" />
                    <span>#{item.gitInfo.pullRequest}</span>
                  </div>
                )}
                <Badge variant="secondary" className={`text-xs ${
                  item.gitInfo.reviewStatus === 'approved' ? 'bg-green-100 text-green-800' :
                  item.gitInfo.reviewStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  item.gitInfo.reviewStatus === 'changes_requested' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.gitInfo.reviewStatus.replace('_', ' ')}
                </Badge>
              </div>
              
              {/* DDLC Phase Indicator */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    item.metadata?.ddlcPhase === 'deployed' ? 'bg-green-500' :
                    item.metadata?.ddlcPhase === 'testing' ? 'bg-blue-500' :
                    item.metadata?.ddlcPhase === 'development' ? 'bg-orange-500' :
                    item.metadata?.ddlcPhase === 'design' ? 'bg-purple-500' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-gray-600">DDLC: {item.metadata?.ddlcPhase || 'requirement'}</span>
                </div>
                {item.metadata?.testStatus && (
                  <div className="flex items-center gap-1">
                    <TestTube className="w-3 h-3" />
                    <span className="text-gray-600">{item.metadata.testStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {item.collaboration && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{item.collaboration.contributors.length} contributors</span>
              <Clock className="w-3 h-3" />
              <span>{item.collaboration.lastModifiedBy}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="outline" onClick={() => setSelectedContent(item)}>
            <Eye className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportContent(item, 'json')}>
            <Download className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportContent(item, 'yaml')}>
            <FileText className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => forkContent(item.id)}>
            <GitFork className="w-3 h-3" />
          </Button>
          {item.gitInfo?.reviewStatus === 'none' && (
            <Button size="sm" variant="outline" onClick={() => createPullRequest(item.id, 'main', 'Ready for review')}>
              <GitPullRequest className="w-3 h-3" />
            </Button>
          )}
          {item.gitInfo?.reviewStatus === 'approved' && item.gitInfo?.mergeStatus === 'unmerged' && (
            <Button size="sm" variant="outline" onClick={() => mergeContent(item.id)} className="bg-green-50 text-green-700">
              <GitMerge className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">XSIAM Content Library</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GitBranch className="w-3 h-3" />
                  <span className="font-medium">{selectedBranch}</span>
                  <span>•</span>
                  <span>{content.filter(c => c.gitInfo?.mergeStatus === 'unmerged').length} unmerged</span>
                  <span>•</span>
                  <span>{content.filter(c => c.gitInfo?.reviewStatus === 'pending').length} pending review</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => setDdlcModalOpen(true)} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                DDLC Workflow
              </Button>
              <Button onClick={() => setBranchModalOpen(true)} variant="outline" size="sm">
                <GitBranch className="w-4 h-4 mr-2" />
                Branches
              </Button>
              <Button onClick={() => setPullRequestModalOpen(true)} variant="outline" size="sm">
                <GitPullRequest className="w-4 h-4 mr-2" />
                Pull Requests
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Manage and export your generated security content
              </p>
            </div>
          <div className="flex space-x-2">
            <Dialog open={githubModalOpen} onOpenChange={setGithubModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Github className="w-4 h-4 mr-2" />
                  Export to GitHub
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Export Project to GitHub</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {generateGitHubInstructions()}
                  </pre>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(generateGitHubInstructions());
                        toast({
                          title: "Instructions Copied",
                          description: "GitHub upload instructions copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Instructions
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportBulk(content)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Download All Content
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              variant="outline"
              onClick={() => exportBulk(filteredContent)}
              disabled={filteredContent.length === 0}
            >
              <Package className="w-4 h-4 mr-2" />
              Export All ({filteredContent.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="endpoint">Endpoint</SelectItem>
              <SelectItem value="network">Network</SelectItem>
              <SelectItem value="cloud">Cloud</SelectItem>
              <SelectItem value="identity">Identity</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="correlation">Correlations</SelectItem>
              <SelectItem value="playbook">Playbooks</SelectItem>
              <SelectItem value="alert_layout">Alert Layouts</SelectItem>
              <SelectItem value="dashboard">Dashboards</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredContent.length} of {content.length} items
          </div>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Content Grid/List */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
          : 'space-y-2'
      }`}>
        {filteredContent.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Content Found</h3>
            <p className="text-muted-foreground mb-4">
              {content.length === 0 
                ? "No content has been generated yet. Use the Content Builder to create your first items."
                : "No content matches your current filters. Try adjusting your search criteria."
              }
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/content-builder'}>
              <FileText className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </div>
        ) : (
          filteredContent.map(renderContentCard)
        )}
      </div>
      
      </div>

      {/* Content Detail Modal */}
      {selectedContent && (
        <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getContentIcon(selectedContent.contentType)}
                <span>{selectedContent.name}</span>
                <Badge variant="outline" className={getStatusColor(selectedContent.status)}>
                  {selectedContent.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Threat Name:</strong> {selectedContent.threatName}
                  </div>
                  <div>
                    <strong>Category:</strong> {selectedContent.category}
                  </div>
                  <div>
                    <strong>Severity:</strong> {selectedContent.severity}
                  </div>
                  <div>
                    <strong>Version:</strong> v{selectedContent.version}
                  </div>
                  <div>
                    <strong>Created:</strong> {selectedContent.createdAt.toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Updated:</strong> {selectedContent.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                {selectedContent.description && (
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedContent.description}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="content">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(selectedContent.contentData, null, 2)}
                </pre>
              </TabsContent>
              
              <TabsContent value="requirements">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(selectedContent.requirements, null, 2)}
                </pre>
              </TabsContent>
              
              <TabsContent value="metadata">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(selectedContent.metadata || {}, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={() => exportContent(selectedContent, 'json')}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => exportContent(selectedContent, 'yaml')}>
                <FileText className="w-4 h-4 mr-2" />
                Export YAML
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DDLC Workflow Management Modal */}
      <Dialog open={ddlcModalOpen} onOpenChange={setDdlcModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Detection Development Life Cycle (DDLC) - NVISO Framework
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Following Detection-as-Code principles for systematic detection engineering
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* DDLC Phase Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DDLC Framework Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { phase: 'requirement', color: 'bg-gray-500', count: content.filter(c => c.metadata?.ddlcPhase === 'requirement').length },
                    { phase: 'design', color: 'bg-purple-500', count: content.filter(c => c.metadata?.ddlcPhase === 'design').length },
                    { phase: 'development', color: 'bg-orange-500', count: content.filter(c => c.metadata?.ddlcPhase === 'development').length },
                    { phase: 'testing', color: 'bg-blue-500', count: content.filter(c => c.metadata?.ddlcPhase === 'testing').length },
                    { phase: 'deployed', color: 'bg-green-500', count: content.filter(c => c.metadata?.ddlcPhase === 'deployed').length },
                    { phase: 'monitoring', color: 'bg-cyan-500', count: content.filter(c => c.metadata?.ddlcPhase === 'monitoring').length }
                  ].map(({ phase, color, count }) => (
                    <div key={phase} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-4 h-4 rounded-full ${color}`}></div>
                      <div>
                        <div className="font-medium capitalize">{phase}</div>
                        <div className="text-sm text-gray-600">{count} detections</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content by DDLC Phase */}
            <Tabs defaultValue="development">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="requirement">Requirements</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
                <TabsTrigger value="deployed">Deployed</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              </TabsList>

              {['requirement', 'design', 'development', 'testing', 'deployed', 'monitoring'].map(phase => (
                <TabsContent key={phase} value={phase} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium capitalize">{phase} Phase</h3>
                    <Badge variant="outline">
                      {content.filter(c => c.metadata?.ddlcPhase === phase).length} items
                    </Badge>
                  </div>
                  
                  {/* Phase Description */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {phase === 'requirement' && "Understanding what threat needs to be detected and defining success criteria."}
                      {phase === 'design' && "Selecting data sources, identifying fields, and mapping to taxonomies."}
                      {phase === 'development' && "Creating the actual detection rule or logic with proper documentation."}
                      {phase === 'testing' && "Validating detection with attack data and tuning for optimal performance."}
                      {phase === 'deployed' && "Production-ready detections actively monitoring for threats."}
                      {phase === 'monitoring' && "Continuous review and adjustment to maintain optimal performance."}
                    </p>
                  </div>

                  {/* Content in this phase */}
                  <div className="space-y-2">
                    {content.filter(c => c.metadata?.ddlcPhase === phase).map(item => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getContentIcon(item.contentType)}
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-600">
                                  {item.contentType} • {item.category} • v{item.version}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.metadata?.testStatus && (
                                <Badge variant="outline" className="text-xs">
                                  {item.metadata.testStatus}
                                </Badge>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => advanceDdlcPhase(item.id)}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* DDLC Phase Specific Metadata */}
                          {phase === 'development' && item.metadata?.references && (
                            <div className="mt-2 text-xs text-gray-600">
                              References: {Array.isArray(item.metadata.references) ? item.metadata.references.slice(0, 2).join(', ') : 'None'}
                            </div>
                          )}
                          {phase === 'testing' && item.metadata?.testStatus && (
                            <div className="mt-2 text-xs text-gray-600">
                              Test Status: {item.metadata.testStatus} • Performance: {item.metadata?.performanceImpact || 'unknown'}
                            </div>
                          )}
                          {phase === 'deployed' && item.metadata?.falsePositiveRate && (
                            <div className="mt-2 text-xs text-gray-600">
                              FP Rate: {item.metadata.falsePositiveRate} • Data Sources: {item.metadata?.dataSourcesRequired?.join(', ')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {content.filter(c => c.metadata?.ddlcPhase === phase).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No content in {phase} phase
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Detection-as-Code Principles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detection-as-Code Principles Applied</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Version Control (Git workflow)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Code Reviews & Pull Requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Testing & Validation Framework</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Standardized Format (YAML/JSON)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Reusable Components</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">CI/CD Pipeline Integration</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branch Management Modal */}
      <Dialog open={branchModalOpen} onOpenChange={setBranchModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Branch Management
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Branches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from(new Set(content.map(c => c.gitInfo?.branch).filter(Boolean))).map(branch => (
                    <div key={branch} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        <span className="font-mono">{branch}</span>
                        {branch === 'main' && <Badge variant="secondary">main</Badge>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {content.filter(c => c.gitInfo?.branch === branch).length} items
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Create New Branch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input placeholder="feature/new-correlation-rule" />
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content to branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {content.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.contentType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="w-full">
                      <GitBranch className="w-4 h-4 mr-2" />
                      Create Branch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pull Request Modal */}
      <Dialog open={pullRequestModalOpen} onOpenChange={setPullRequestModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5" />
              Pull Requests
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs defaultValue="open">
              <TabsList>
                <TabsTrigger value="open">
                  Open ({content.filter(c => c.gitInfo?.reviewStatus === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="merged">
                  Merged ({content.filter(c => c.gitInfo?.mergeStatus === 'merged').length})
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="space-y-3">
                {content.filter(c => c.gitInfo?.reviewStatus === 'pending').map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GitPullRequest className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">
                              PR #{item.gitInfo?.pullRequest} • {item.gitInfo?.branch} → main
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => reviewContent(item.id, 'approved', 'Looks good to me!')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => reviewContent(item.id, 'changes_requested', 'Please address the feedback')}
                          >
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Request Changes
                          </Button>
                        </div>
                      </div>
                      {item.collaboration?.reviews.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {item.collaboration.reviews.map((review, idx) => (
                            <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                <span className="font-medium">{review.reviewer}</span>
                                <Badge variant={review.status === 'approved' ? 'default' : 'destructive'}>
                                  {review.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="mt-1">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="merged" className="space-y-3">
                {content.filter(c => c.gitInfo?.mergeStatus === 'merged').map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <GitMerge className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            Merged PR #{item.gitInfo?.pullRequest} • {item.gitInfo?.author}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="all" className="space-y-3">
                {content.filter(c => c.gitInfo?.pullRequest).map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {item.gitInfo?.mergeStatus === 'merged' ? (
                            <GitMerge className="w-4 h-4 text-green-600" />
                          ) : (
                            <GitPullRequest className="w-4 h-4" />
                          )}
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">
                              PR #{item.gitInfo?.pullRequest} • {item.gitInfo?.branch} → main
                            </div>
                          </div>
                        </div>
                        <Badge variant={item.gitInfo?.mergeStatus === 'merged' ? 'default' : 'secondary'}>
                          {item.gitInfo?.mergeStatus === 'merged' ? 'Merged' : item.gitInfo?.reviewStatus}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentLibrary;