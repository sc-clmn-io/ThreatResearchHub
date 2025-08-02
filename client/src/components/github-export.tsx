import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Github, CheckCircle, AlertCircle, Clock, Upload, Settings, Zap, Timer, Play, Pause, TestTube, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GitHubConfig {
  token: string;
  username: string;
  repository: string;
  branch: string;
}

interface ScheduledBackup {
  enabled: boolean;
  intervalHours: number;
  nextRun: string | null;
}

interface RepositoryInfo {
  name: string;
  description: string;
  private: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  default_branch: string;
  pushed_at: string;
}

export default function GitHubExport() {
  const [config, setConfig] = useState<GitHubConfig>({
    token: '',
    username: '',
    repository: 'security-research-platform',
    branch: 'main'
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [scheduledBackup, setScheduledBackup] = useState<ScheduledBackup>({
    enabled: true, // Enable 12-hour automatic backups by default
    intervalHours: 12,
    nextRun: null
  });
  const [timeUntilNext, setTimeUntilNext] = useState<string>("");
  const { toast } = useToast();

  // Repository information query
  const { data: repoInfo, refetch: testConnection } = useQuery({
    queryKey: ['github-repo-info', config.username, config.repository],
    queryFn: async () => {
      if (!config.token || !config.username || !config.repository) return null;
      
      const response = await fetch(`https://api.github.com/repos/${config.username}/${config.repository}`, {
        headers: {
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Repository not found or access denied');
      }
      
      return await response.json() as RepositoryInfo;
    },
    enabled: false, // Only run when manually triggered
    retry: false
  });

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('github-config');
    const savedSchedule = localStorage.getItem('github-schedule');
    const savedLastUpload = localStorage.getItem('github-last-upload');
    
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      setIsConfigured(true);
    }
    
    if (savedSchedule) {
      const parsedSchedule = JSON.parse(savedSchedule);
      setScheduledBackup(parsedSchedule);
    }
    
    if (savedLastUpload) {
      setLastUpload(savedLastUpload);
    }
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!scheduledBackup.enabled || !scheduledBackup.nextRun) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const nextRun = new Date(scheduledBackup.nextRun!).getTime();
      const difference = nextRun - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilNext(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilNext("Due now");
        // Trigger automatic backup if configured
        if (isConfigured) {
          handleScheduledBackup();
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [scheduledBackup, isConfigured]);

  const handleScheduledBackup = () => {
    const commitMessage = `Scheduled backup - ${new Date().toLocaleDateString()}`;
    uploadMutation.mutate({ config, message: commitMessage });
    
    // Schedule next backup
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + scheduledBackup.intervalHours);
    
    const updatedSchedule = {
      ...scheduledBackup,
      nextRun: nextRun.toISOString()
    };
    
    setScheduledBackup(updatedSchedule);
    localStorage.setItem('github-schedule', JSON.stringify(updatedSchedule));
  };

  const uploadMutation = useMutation({
    mutationFn: async (data: { config: GitHubConfig; message: string }) => {
      const response = await fetch('/api/github-export', {
        method: 'POST',
        body: JSON.stringify({
          ...data.config,
          commitMessage: data.message
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      const uploadTime = new Date().toLocaleString();
      setLastUpload(uploadTime);
      localStorage.setItem('github-last-upload', uploadTime);
      
      if (data.success) {
        toast({
          title: "Content Backed Up Successfully",
          description: `${data.message}. Available at: ${config.username}/${config.repository}`,
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`https://github.com/${config.username}/${config.repository}`, '_blank')}
            >
              View Repository
            </Button>
          ),
        });
      } else {
        toast({
          title: "Backup Failed",
          description: data.message || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload to GitHub",
        variant: "destructive",
      });
    },
  });

  const handleQuickUpload = () => {
    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure your GitHub settings first",
        variant: "destructive",
      });
      return;
    }

    const commitMessage = `ThreatResearchHub auto-backup - ${new Date().toLocaleDateString()}`;
    uploadMutation.mutate({ config, message: commitMessage });
  };

  const handleConfigSave = () => {
    if (!config.token || !config.username || !config.repository) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required GitHub configuration fields",
        variant: "destructive",
      });
      return;
    }

    setIsConfigured(true);
    localStorage.setItem('github-config', JSON.stringify(config));
    
    // Enable 12-hour automatic backups by default when configuration is saved
    if (!scheduledBackup.enabled) {
      const nextRun = new Date();
      nextRun.setHours(nextRun.getHours() + 12);
      
      const autoSchedule = {
        enabled: true,
        intervalHours: 12,
        nextRun: nextRun.toISOString()
      };
      
      setScheduledBackup(autoSchedule);
      localStorage.setItem('github-schedule', JSON.stringify(autoSchedule));
    }
    
    // Test connection immediately after saving
    testConnection();
    
    toast({
      title: "Configuration Saved",
      description: "GitHub settings saved successfully. 12-hour automatic backups are now enabled.",
    });
  };

  const handleTestConnection = () => {
    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please save your GitHub configuration first",
        variant: "destructive",
      });
      return;
    }
    
    testConnection();
  };

  const toggleScheduledBackup = (enabled: boolean) => {
    let updatedSchedule = {
      ...scheduledBackup,
      enabled
    };

    if (enabled && !scheduledBackup.nextRun) {
      // Set initial next run time
      const nextRun = new Date();
      nextRun.setHours(nextRun.getHours() + scheduledBackup.intervalHours);
      updatedSchedule.nextRun = nextRun.toISOString();
    } else if (!enabled) {
      updatedSchedule.nextRun = null;
    }

    setScheduledBackup(updatedSchedule);
    localStorage.setItem('github-schedule', JSON.stringify(updatedSchedule));
    
    toast({
      title: enabled ? "Scheduled Backups Enabled" : "Scheduled Backups Disabled",
      description: enabled 
        ? `Automatic backups every ${scheduledBackup.intervalHours} hours`
        : "No automatic backups will run",
    });
  };

  const handleCustomUpload = () => {
    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure your GitHub settings first",
        variant: "destructive",
      });
      return;
    }

    const commitMessage = prompt("Enter commit message:", `ThreatResearchHub update - ${new Date().toLocaleDateString()}`);
    if (commitMessage) {
      uploadMutation.mutate({ config, message: commitMessage });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Github className="h-8 w-8 text-gray-900 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">GitHub Backup & Collaboration</h1>
                <p className="text-sm text-gray-600">One-click backup and team collaboration setup</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={isConfigured ? "default" : "secondary"}>
                {isConfigured ? "Configured" : "Not Configured"}
              </Badge>
              {scheduledBackup.enabled && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Timer className="h-3 w-3 mr-1" />
                  Auto Backup ON
                </Badge>
              )}
              {lastUpload && (
                <div className="text-sm text-gray-600">
                  Last backup: {lastUpload}
                </div>
              )}
              {scheduledBackup.enabled && timeUntilNext && (
                <div className="text-sm text-blue-600">
                  Next: {timeUntilNext}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  GitHub Configuration
                </CardTitle>
                <CardDescription>
                  Configure your GitHub repository for automated backups and team collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="token" className="flex items-center justify-between">
                      GitHub Personal Access Token *
                      {config.token && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Saved
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={config.token}
                      onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your token is saved securely in your browser and won't need to be re-entered. Create a token at GitHub Settings → Developer settings → Personal access tokens
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">GitHub Username *</Label>
                      <Input
                        id="username"
                        placeholder="your-username"
                        value={config.username}
                        onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="repository">Repository Name *</Label>
                      <Input
                        id="repository"
                        placeholder="security-research-platform"
                        value={config.repository}
                        onChange={(e) => setConfig(prev => ({ ...prev, repository: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="branch">Branch Name</Label>
                    <Input
                      id="branch"
                      placeholder="main"
                      value={config.branch}
                      onChange={(e) => setConfig(prev => ({ ...prev, branch: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleConfigSave} 
                    disabled={!config.token || !config.username || !config.repository}
                    className="flex-1 sm:flex-none"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                  {isConfigured && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={handleTestConnection}
                        className="flex-1 sm:flex-none"
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsConfigured(false)}
                        className="flex-1 sm:flex-none"
                      >
                        Edit Configuration
                      </Button>
                    </>
                  )}
                </div>

                {/* Repository Information & Verification */}
                {isConfigured && (
                  <div className="mt-4 space-y-3">
                    {/* Quick verification links - always show when configured */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`https://github.com/${config.username}/${config.repository}`, '_blank')}
                        className="flex items-center flex-1 sm:flex-none"
                      >
                        <Github className="h-4 w-4 mr-2" />
                        View Repository
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`https://github.com/${config.username}/${config.repository}/commits`, '_blank')}
                        className="flex items-center flex-1 sm:flex-none"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        View Commits
                      </Button>
                      {lastUpload && (
                        <Badge variant="secondary" className="flex items-center justify-center sm:justify-start">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span className="text-xs">Last backup: {lastUpload}</span>
                        </Badge>
                      )}
                    </div>
                    
                    {/* Repository details - only show when repo info is available */}
                    {repoInfo && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-green-800 flex items-center">
                              <Github className="h-4 w-4 mr-2" />
                              {repoInfo.name}
                            </h4>
                            <p className="text-sm text-green-600 mt-1">
                              {repoInfo.description || "No description"}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-green-600">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {repoInfo.stargazers_count} stars
                              </div>
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {repoInfo.watchers_count} watchers
                              </div>
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                {repoInfo.private ? "Private" : "Public"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-600">Last pushed</p>
                            <p className="text-sm text-green-800">
                              {new Date(repoInfo.pushed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Actions */}
            {isConfigured && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Backup Actions
                  </CardTitle>
                  <CardDescription>
                    Create XSIAM content library for production deployment and training reference
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleQuickUpload}
                      disabled={uploadMutation.isPending}
                      className="flex items-center flex-1 sm:flex-none"
                    >
                      {uploadMutation.isPending ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {uploadMutation.isPending ? "Backing up to GitHub..." : "Backup Content to GitHub"}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleCustomUpload}
                      disabled={uploadMutation.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      Custom Content Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scheduled Backups */}
            {isConfigured && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Timer className="h-5 w-5 mr-2" />
                    Scheduled Backups
                  </CardTitle>
                  <CardDescription>
                    Automatic backups every 12 hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="schedule-toggle">Enable Automatic Backups</Label>
                      <p className="text-sm text-gray-600">
                        Backup every {scheduledBackup.intervalHours} hours automatically
                      </p>
                    </div>
                    <Switch
                      id="schedule-toggle"
                      checked={scheduledBackup.enabled}
                      onCheckedChange={toggleScheduledBackup}
                    />
                  </div>

                  {scheduledBackup.enabled && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Next Backup</p>
                          <p className="text-sm text-gray-600">
                            {scheduledBackup.nextRun 
                              ? new Date(scheduledBackup.nextRun).toLocaleString()
                              : "Not scheduled"
                            }
                          </p>
                        </div>
                        <Badge variant="outline" className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {timeUntilNext || "Calculating..."}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <Play className="h-4 w-4" />
                        <span>Automatic backups active</span>
                      </div>
                    </div>
                  )}

                  {!scheduledBackup.enabled && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 pt-4 border-t">
                      <Pause className="h-4 w-4" />
                      <span>Automatic backups disabled</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Information Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Complete Backup</p>
                    <p className="text-sm text-gray-600">All training data, configurations, and platform code</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Team Collaboration</p>
                    <p className="text-sm text-gray-600">Share with team members and contributors</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Version Control</p>
                    <p className="text-sm text-gray-600">Track changes and restore previous versions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Scheduled Backups</p>
                    <p className="text-sm text-gray-600">Automatic synchronization every 12 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">1. Create Personal Access Token</p>
                  <p className="text-gray-600">Go to GitHub Settings → Developer settings → Personal access tokens → Generate new token</p>
                </div>
                <div>
                  <p className="font-medium">2. Required Permissions</p>
                  <p className="text-gray-600">Select 'repo' scope for full repository access</p>
                </div>
                <div>
                  <p className="font-medium">3. Create Repository</p>
                  <p className="text-gray-600">Create a new private repository on GitHub (recommended)</p>
                </div>
                <div>
                  <p className="font-medium">4. Configure & Backup</p>
                  <p className="text-gray-600">Enter your details above and click "Quick Backup"</p>
                </div>
              </CardContent>
            </Card>

            {uploadMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload failed. Please check your GitHub configuration and try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}