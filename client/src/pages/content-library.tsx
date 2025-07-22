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
  ArrowLeft
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
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [content, searchTerm, categoryFilter, typeFilter, statusFilter]);

  const loadContent = () => {
    // Load from localStorage for now
    const stored = localStorage.getItem('xsiam-content');
    if (stored) {
      const parsed = JSON.parse(stored);
      setContent(parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      })));
    }
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
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="capitalize">{item.category}</span>
          <span>v{item.version}</span>
        </div>
        
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" onClick={() => setSelectedContent(item)}>
            <Eye className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportContent(item, 'json')}>
            <Download className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportContent(item, 'yaml')}>
            <FileText className="w-3 h-3" />
          </Button>
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
              </div>
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
    </div>
  );
};

export default ContentLibrary;