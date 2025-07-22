import React, { useState } from 'react';
import { GitBranch, History, Download, Upload, Diff, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ContentVersionControlProps {
  content: any;
  onVersionSelected?: (version: ContentVersion) => void;
}

interface ContentVersion {
  id: string;
  version: string;
  timestamp: Date;
  author: string;
  message: string;
  changes: ChangeItem[];
  content: any;
}

interface ChangeItem {
  type: 'added' | 'modified' | 'removed';
  path: string;
  description: string;
  oldValue?: any;
  newValue?: any;
}

export default function ContentVersionControl({ content, onVersionSelected }: ContentVersionControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[ContentVersion | null, ContentVersion | null]>([null, null]);
  const { toast } = useToast();

  // Initialize versions from localStorage
  React.useEffect(() => {
    const storedVersions = localStorage.getItem(`versions_${content?.id}`);
    if (storedVersions) {
      setVersions(JSON.parse(storedVersions));
    } else {
      // Create initial version if none exists
      const initialVersion: ContentVersion = {
        id: `v1_${Date.now()}`,
        version: '1.0.0',
        timestamp: new Date(),
        author: 'ThreatResearchHub',
        message: 'Initial version',
        changes: [
          {
            type: 'added',
            path: 'content',
            description: 'Created initial content structure'
          }
        ],
        content: content
      };
      setVersions([initialVersion]);
      localStorage.setItem(`versions_${content?.id}`, JSON.stringify([initialVersion]));
    }
  }, [content?.id]);

  const createNewVersion = (message: string) => {
    const lastVersion = versions[0];
    const newVersionNumber = incrementVersion(lastVersion?.version || '1.0.0');
    
    const changes = detectChanges(lastVersion?.content, content);
    
    const newVersion: ContentVersion = {
      id: `v${versions.length + 1}_${Date.now()}`,
      version: newVersionNumber,
      timestamp: new Date(),
      author: 'ThreatResearchHub',
      message,
      changes,
      content: { ...content }
    };

    const updatedVersions = [newVersion, ...versions];
    setVersions(updatedVersions);
    localStorage.setItem(`versions_${content?.id}`, JSON.stringify(updatedVersions));

    toast({
      title: "Version Created",
      description: `Version ${newVersionNumber} has been saved`,
    });
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  };

  const detectChanges = (oldContent: any, newContent: any): ChangeItem[] => {
    const changes: ChangeItem[] = [];
    
    if (!oldContent) return changes;

    // Compare correlation rules
    if (oldContent.correlationRule?.xqlQuery !== newContent.correlationRule?.xqlQuery) {
      changes.push({
        type: 'modified',
        path: 'correlationRule.xqlQuery',
        description: 'Updated XQL query',
        oldValue: oldContent.correlationRule?.xqlQuery,
        newValue: newContent.correlationRule?.xqlQuery
      });
    }

    // Compare MITRE tactics
    if (JSON.stringify(oldContent.mitreTactics) !== JSON.stringify(newContent.mitreTactics)) {
      changes.push({
        type: 'modified',
        path: 'mitreTactics',
        description: 'Updated MITRE ATT&CK tactics',
        oldValue: oldContent.mitreTactics,
        newValue: newContent.mitreTactics
      });
    }

    // Compare title and description
    if (oldContent.title !== newContent.title) {
      changes.push({
        type: 'modified',
        path: 'title',
        description: 'Updated title',
        oldValue: oldContent.title,
        newValue: newContent.title
      });
    }

    if (oldContent.description !== newContent.description) {
      changes.push({
        type: 'modified',
        path: 'description',
        description: 'Updated description',
        oldValue: oldContent.description,
        newValue: newContent.description
      });
    }

    return changes;
  };

  const rollbackToVersion = (version: ContentVersion) => {
    if (confirm(`Are you sure you want to rollback to version ${version.version}? This will create a new version.`)) {
      const rollbackMessage = `Rollback to version ${version.version}`;
      const restoredContent = { ...version.content };
      
      // Create a new version with the rolled back content
      createNewVersion(rollbackMessage);
      
      onVersionSelected?.(version);
      
      toast({
        title: "Content Rolled Back",
        description: `Rolled back to version ${version.version}`,
      });
    }
  };

  const exportVersionHistory = () => {
    const exportData = {
      contentId: content?.id,
      contentTitle: content?.title,
      exportDate: new Date().toISOString(),
      versions: versions
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `version-history-${content?.id}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Version History Exported",
      description: "Version history has been downloaded",
    });
  };

  const importVersionHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.versions && Array.isArray(importData.versions)) {
          setVersions(importData.versions);
          localStorage.setItem(`versions_${content?.id}`, JSON.stringify(importData.versions));
          
          toast({
            title: "Version History Imported",
            description: `Imported ${importData.versions.length} versions`,
          });
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid version history file format",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const renderDiff = (change: ChangeItem) => {
    return (
      <div className="space-y-2 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant={change.type === 'added' ? 'default' : change.type === 'modified' ? 'secondary' : 'destructive'}>
            {change.type}
          </Badge>
          <span className="font-mono text-sm">{change.path}</span>
        </div>
        <div className="text-sm text-muted-foreground">{change.description}</div>
        
        {change.oldValue !== undefined && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-red-600">- Removed:</div>
            <div className="text-xs font-mono bg-red-50 p-2 rounded border-l-2 border-red-200">
              {typeof change.oldValue === 'string' ? change.oldValue : JSON.stringify(change.oldValue, null, 2)}
            </div>
          </div>
        )}
        
        {change.newValue !== undefined && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-green-600">+ Added:</div>
            <div className="text-xs font-mono bg-green-50 p-2 rounded border-l-2 border-green-200">
              {typeof change.newValue === 'string' ? change.newValue : JSON.stringify(change.newValue, null, 2)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'added': return <span className="text-green-500">+</span>;
      case 'modified': return <span className="text-blue-500">~</span>;
      case 'removed': return <span className="text-red-500">-</span>;
      default: return <span className="text-gray-500">?</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between text-purple-600 border-purple-200 hover:bg-purple-50">
          <div className="flex items-center">
            <GitBranch className="h-4 w-4 text-purple-500 mr-3" />
            <span className="text-sm font-medium">Version Control</span>
          </div>
          <Badge variant="outline">{versions.length} versions</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Content Version Control
            <Badge variant="outline">Git-like</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-2">
            <Button onClick={() => createNewVersion('Manual checkpoint')}>
              <GitBranch className="h-4 w-4 mr-2" />
              Create Version
            </Button>
            <Button variant="outline" onClick={exportVersionHistory}>
              <Download className="h-4 w-4 mr-2" />
              Export History
            </Button>
            <div className="relative">
              <Button variant="outline" onClick={() => document.getElementById('version-import')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Import History
              </Button>
              <input
                id="version-import"
                type="file"
                accept=".json"
                className="hidden"
                onChange={importVersionHistory}
              />
            </div>
          </div>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">Version History</TabsTrigger>
              <TabsTrigger value="compare">Compare Versions</TabsTrigger>
              <TabsTrigger value="details">Version Details</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <Card key={version.id} className={`cursor-pointer hover:bg-muted/50 ${selectedVersion?.id === version.id ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="pt-4" onClick={() => setSelectedVersion(version)}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? 'default' : 'secondary'}>
                              v{version.version}
                            </Badge>
                            {index === 0 && <Badge variant="outline">Latest</Badge>}
                          </div>
                          <div className="font-medium">{version.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {version.author} • {version.timestamp.toLocaleString()}
                          </div>
                          <div className="flex gap-1">
                            {version.changes.map((change, changeIndex) => (
                              <span key={changeIndex} className="text-xs">
                                {getChangeTypeIcon(change.type)} {change.path}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {index !== 0 && (
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              rollbackToVersion(version);
                            }}>
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Rollback
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compare" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Compare from:</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded"
                    onChange={(e) => {
                      const version = versions.find(v => v.id === e.target.value);
                      setCompareVersions([version || null, compareVersions[1]]);
                    }}
                  >
                    <option value="">Select version...</option>
                    {versions.map(version => (
                      <option key={version.id} value={version.id}>
                        v{version.version} - {version.message}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Compare to:</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded"
                    onChange={(e) => {
                      const version = versions.find(v => v.id === e.target.value);
                      setCompareVersions([compareVersions[0], version || null]);
                    }}
                  >
                    <option value="">Select version...</option>
                    {versions.map(version => (
                      <option key={version.id} value={version.id}>
                        v{version.version} - {version.message}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {compareVersions[0] && compareVersions[1] && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Diff className="h-4 w-4" />
                    <span className="font-medium">
                      Comparing v{compareVersions[0].version} → v{compareVersions[1].version}
                    </span>
                  </div>
                  
                  {compareVersions[1].changes.map((change, index) => (
                    <div key={index}>
                      {renderDiff(change)}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {selectedVersion ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Version {selectedVersion.version} Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium">Author</div>
                          <div className="text-sm text-muted-foreground">{selectedVersion.author}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Timestamp</div>
                          <div className="text-sm text-muted-foreground">{selectedVersion.timestamp.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Commit Message</div>
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {selectedVersion.message}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Changes ({selectedVersion.changes.length})</div>
                        <div className="space-y-2">
                          {selectedVersion.changes.map((change, index) => (
                            <div key={index}>
                              {renderDiff(change)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Select a version from the history to view details
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}