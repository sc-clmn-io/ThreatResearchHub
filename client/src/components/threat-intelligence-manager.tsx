import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Clock, Database, ExternalLink, Key, Plus, RefreshCw, Settings, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { THREAT_SOURCES, type ThreatSource, type ThreatIntelligence } from '@shared/threat-sources';

interface ThreatIntelligenceManagerProps {
  onThreatSelected?: (threat: ThreatIntelligence) => void;
}

export default function ThreatIntelligenceManager({ onThreatSelected }: ThreatIntelligenceManagerProps) {
  const [sources, setSources] = useState<ThreatSource[]>([]);
  const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence[]>([]);
  const [selectedSource, setSelectedSource] = useState<ThreatSource | null>(null);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with pre-configured sources
    setSources(THREAT_SOURCES);
    loadThreatIntelligence();
    loadSourceStatus();
  }, []);

  const loadThreatIntelligence = () => {
    const stored = localStorage.getItem('threatIntelligence');
    if (stored) {
      setThreatIntelligence(JSON.parse(stored));
    }
  };

  const loadSourceStatus = () => {
    const stored = localStorage.getItem('threatSourceStatus');
    if (stored) {
      setSourceStatus(JSON.parse(stored));
    }
  };

  const handleToggleSource = (sourceId: string, enabled: boolean) => {
    setSources(prev => prev.map(source => 
      source.id === sourceId ? { ...source, enabled } : source
    ));
    
    // Update localStorage
    const updatedSources = sources.map(source => 
      source.id === sourceId ? { ...source, enabled } : source
    );
    localStorage.setItem('threatSources', JSON.stringify(updatedSources));
    
    toast({
      title: enabled ? "Source Enabled" : "Source Disabled",
      description: `${sources.find(s => s.id === sourceId)?.name} ${enabled ? 'will start' : 'has stopped'} collecting threat intelligence.`,
    });
  };

  const handleRefreshSource = async (sourceId: string) => {
    setIsRefreshing(sourceId);
    const source = sources.find(s => s.id === sourceId);
    
    if (!source) {
      setIsRefreshing(null);
      return;
    }

    try {
      // Simulate API call to refresh source
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last refresh time
      const newStatus = {
        ...sourceStatus,
        [sourceId]: {
          ...sourceStatus[sourceId],
          lastUpdate: new Date().toISOString(),
          threatCount: Math.floor(Math.random() * 50) + 10
        }
      };
      
      setSourceStatus(newStatus);
      localStorage.setItem('threatSourceStatus', JSON.stringify(newStatus));
      
      toast({
        title: "Source Updated",
        description: `Successfully refreshed ${source.name}. New threats have been collected.`,
      });
      
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: `Failed to refresh ${source.name}. Please check your API keys and try again.`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(null);
    }
  };

  const handleAddCustomSource = (newSource: ThreatSource) => {
    setSources(prev => [...prev, newSource]);
    localStorage.setItem('threatSources', JSON.stringify([...sources, newSource]));
    setIsAddingSource(false);
    
    toast({
      title: "Source Added",
      description: `${newSource.name} has been added to your threat intelligence sources.`,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTLPColor = (tlp: string) => {
    switch (tlp) {
      case 'red': return 'bg-red-600';
      case 'amber': return 'bg-amber-500';
      case 'green': return 'bg-green-500';
      case 'white': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-500';
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'api': return <Database className="h-4 w-4" />;
      case 'rss': return <ExternalLink className="h-4 w-4" />;
      case 'webhook': return <Zap className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Threat Intelligence Sources</h2>
          <p className="text-sm text-gray-600">Manage real-time threat feeds from security vendors</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Dialog open={isAddingSource} onOpenChange={setIsAddingSource}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Custom Threat Source</DialogTitle>
                <DialogDescription>
                  Configure a custom threat intelligence source with API or RSS feed
                </DialogDescription>
              </DialogHeader>
              <CustomSourceForm onSubmit={handleAddCustomSource} onCancel={() => setIsAddingSource(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence ({threatIntelligence.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <Card key={source.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getSourceTypeIcon(source.type)}
                      <CardTitle className="text-sm font-medium">{source.name}</CardTitle>
                    </div>
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={(enabled) => handleToggleSource(source.id, enabled)}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Badge variant="outline" className="text-xs">
                      {source.type.toUpperCase()}
                    </Badge>
                    <span>•</span>
                    <span>Every {source.updateInterval}min</span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <div className="flex items-center space-x-1">
                        {source.enabled ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-500">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Update</span>
                      <span className="text-xs text-gray-500">
                        {sourceStatus[source.id]?.lastUpdate ? 
                          new Date(sourceStatus[source.id].lastUpdate).toLocaleString() : 
                          'Never'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Threats</span>
                      <span className="text-sm font-medium">
                        {sourceStatus[source.id]?.threatCount || 0}
                      </span>
                    </div>

                    {source.authentication && (
                      <div className="flex items-center space-x-1 text-xs text-orange-600">
                        <Key className="h-3 w-3" />
                        <span>Requires API Key</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRefreshSource(source.id)}
                        disabled={isRefreshing === source.id || !source.enabled}
                        className="flex-1"
                      >
                        {isRefreshing === source.id ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Refresh
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedSource(source)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <div className="space-y-4">
            {threatIntelligence.slice(0, 50).map((threat) => (
              <Card key={threat.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onThreatSelected?.(threat)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getSeverityColor(threat.severity)} text-white text-xs`}>
                          {threat.severity.toUpperCase()}
                        </Badge>
                        <Badge className={`${getTLPColor(threat.tlp)} text-xs`}>
                          TLP:{threat.tlp.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {sources.find(s => s.id === threat.sourceId)?.name}
                        </span>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 hover:text-blue-600">
                        {threat.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {threat.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          {threat.cves.length > 0 && (
                            <span>CVEs: {threat.cves.slice(0, 3).join(', ')}</span>
                          )}
                          {threat.tags.length > 0 && (
                            <span>Tags: {threat.tags.slice(0, 2).join(', ')}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span>Confidence: {threat.confidence}%</span>
                          <span>•</span>
                          <span>{new Date(threat.publishedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ThreatAnalytics sources={sources} intelligence={threatIntelligence} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomSourceForm({ onSubmit, onCancel }: { 
  onSubmit: (source: ThreatSource) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'api' as ThreatSource['type'],
    url: '',
    updateInterval: 60,
    titleField: '',
    descriptionField: '',
    severityField: '',
    dateField: '',
    apiKey: '',
    authType: 'bearer' as 'bearer' | 'apikey' | 'basic'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSource: ThreatSource = {
      id: `custom_${Date.now()}`,
      name: formData.name,
      type: formData.type,
      url: formData.url,
      updateInterval: formData.updateInterval,
      enabled: true,
      parser: {
        titleField: formData.titleField,
        descriptionField: formData.descriptionField,
        severityField: formData.severityField,
        dateField: formData.dateField,
      },
      ...(formData.apiKey && {
        authentication: {
          type: formData.authType,
          credentials: formData.authType === 'bearer' ? 
            { token: formData.apiKey } : 
            { 'X-API-Key': formData.apiKey }
        }
      })
    };
    
    onSubmit(newSource);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Source Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Custom Source"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="type">Source Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ThreatSource['type'] }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="api">REST API</SelectItem>
              <SelectItem value="rss">RSS Feed</SelectItem>
              <SelectItem value="json">JSON Feed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="url">Source URL</Label>
        <Input
          id="url"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://api.example.com/threats"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="titleField">Title Field Path</Label>
          <Input
            id="titleField"
            value={formData.titleField}
            onChange={(e) => setFormData(prev => ({ ...prev, titleField: e.target.value }))}
            placeholder="title or data.name"
          />
        </div>
        
        <div>
          <Label htmlFor="descriptionField">Description Field Path</Label>
          <Input
            id="descriptionField"
            value={formData.descriptionField}
            onChange={(e) => setFormData(prev => ({ ...prev, descriptionField: e.target.value }))}
            placeholder="description or data.summary"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="severityField">Severity Field Path</Label>
          <Input
            id="severityField"
            value={formData.severityField}
            onChange={(e) => setFormData(prev => ({ ...prev, severityField: e.target.value }))}
            placeholder="severity or risk_level"
          />
        </div>
        
        <div>
          <Label htmlFor="dateField">Date Field Path</Label>
          <Input
            id="dateField"
            value={formData.dateField}
            onChange={(e) => setFormData(prev => ({ ...prev, dateField: e.target.value }))}
            placeholder="published_date or created_at"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="apiKey">API Key (Optional)</Label>
        <Input
          id="apiKey"
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Your API key for authenticated sources"
        />
      </div>
      
      <div className="flex items-center justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Source
        </Button>
      </div>
    </form>
  );
}

function ThreatAnalytics({ sources, intelligence }: { 
  sources: ThreatSource[]; 
  intelligence: ThreatIntelligence[]; 
}) {
  const activeSources = sources.filter(s => s.enabled).length;
  const totalThreats = intelligence.length;
  const criticalThreats = intelligence.filter(t => t.severity === 'critical').length;
  const averageConfidence = intelligence.length > 0 ? 
    intelligence.reduce((sum, t) => sum + t.confidence, 0) / intelligence.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeSources}</p>
                <p className="text-xs text-gray-600">Active Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalThreats}</p>
                <p className="text-xs text-gray-600">Total Threats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{criticalThreats}</p>
                <p className="text-xs text-gray-600">Critical Threats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{averageConfidence.toFixed(0)}%</p>
                <p className="text-xs text-gray-600">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sources.filter(s => s.enabled).map(source => (
              <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getSourceTypeIcon(source.type)}
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-gray-600">Updates every {source.updateInterval} minutes</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium">
                    {intelligence.filter(t => t.sourceId === source.id).length} threats
                  </p>
                  <p className="text-xs text-gray-600">
                    Last: {source.lastUpdate ? new Date(source.lastUpdate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getSourceTypeIcon(type: string) {
  switch (type) {
    case 'api': return <Database className="h-4 w-4" />;
    case 'rss': return <ExternalLink className="h-4 w-4" />;
    case 'webhook': return <Zap className="h-4 w-4" />;
    default: return <Shield className="h-4 w-4" />;
  }
}