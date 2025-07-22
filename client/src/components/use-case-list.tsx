import { useState, useEffect, useMemo } from "react";
import { List, Play, Clock, Shield, AlertTriangle, Database, Server, Workflow, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUseCases, useSaveUseCase, useThreatReports, useSaveTrainingPath } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { generateTrainingPath } from "@/lib/training-generator";
import { extractUseCasesFromWebContent } from "@/lib/url-scraper";
import { extractUseCasesFromPDFText } from "@/lib/pdf-parser";
import { extractUseCasesFromFeedItem, type ThreatFeedItem } from "@/lib/threat-feeds";
import LabEnvironmentSetup from "./lab-environment-setup";
import XSIAMIntegrationGuide from "./xsiam-integration-guide";
import AttackSimulationGuide from "./attack-simulation-guide";
import AnalystWorkflowGuide from "./analyst-workflow-guide";
import SecurityOpsWorkflow from "./security-ops-workflow";
import type { UseCase, ThreatReport, TrainingPath } from "@shared/schema";

interface UseCaseListProps {
  onGenerateTraining: (trainingPathId: string) => void;
}

// Helper functions for generating contextual links
function getTechnologyLink(technology: string): string {
  const techLinks: Record<string, string> = {
    'Kubernetes': 'https://kubernetes.io/docs/concepts/security/',
    'Docker': 'https://docs.docker.com/engine/security/',
    'Apache Struts': 'https://struts.apache.org/security/',
    'Microsoft Exchange': 'https://learn.microsoft.com/en-us/exchange/exchange-server-security',
    'VMware vCenter': 'https://docs.vmware.com/en/VMware-vSphere/index.html',
    'Linux Kernel': 'https://www.kernel.org/doc/html/latest/admin-guide/security-bugs.html',
    'Node.js': 'https://nodejs.org/en/docs/guides/security/',
    'WordPress': 'https://wordpress.org/support/article/hardening-wordpress/',
    'Java': 'https://www.oracle.com/java/technologies/javase/seccodeguide.html',
    'Python': 'https://python.org/dev/security/',
    'NGINX': 'https://nginx.org/en/security_advisories.html',
    'Apache': 'https://httpd.apache.org/security/',
    'PostgreSQL': 'https://www.postgresql.org/support/security/',
    'MySQL': 'https://dev.mysql.com/doc/refman/8.0/en/security.html',
    'Redis': 'https://redis.io/docs/manual/security/',
    'MongoDB': 'https://docs.mongodb.com/manual/security/',
    'AWS': 'https://aws.amazon.com/security/',
    'Azure': 'https://docs.microsoft.com/en-us/azure/security/',
    'GCP': 'https://cloud.google.com/security'
  };
  
  return techLinks[technology] || `https://www.google.com/search?q=${encodeURIComponent(technology + ' security best practices')}`;
}

function getTechnologyIcon(technology: string): JSX.Element {
  const techStr = technology.toLowerCase();
  
  if (techStr.includes('kubernetes') || techStr.includes('docker')) {
    return <Database className="w-3 h-3 mr-1" />;
  }
  if (techStr.includes('microsoft') || techStr.includes('windows')) {
    return <Shield className="w-3 h-3 mr-1" />;
  }
  if (techStr.includes('linux') || techStr.includes('kernel')) {
    return <AlertTriangle className="w-3 h-3 mr-1" />;
  }
  
  return <Database className="w-3 h-3 mr-1" />;
}

function getMitreAttackLink(technique: string): string {
  // For MITRE ATT&CK techniques, search the framework
  const baseUrl = 'https://attack.mitre.org/search/?term=';
  return `${baseUrl}${encodeURIComponent(technique)}`;
}

function getVendorIcon(vendor: string): JSX.Element {
  const vendorStr = vendor.toLowerCase();
  
  if (vendorStr.includes('unit42') || vendorStr.includes('unit 42')) {
    return <Shield className="w-3 h-3 mr-1" />;
  }
  if (vendorStr.includes('cisa')) {
    return <AlertTriangle className="w-3 h-3 mr-1" />;
  }
  if (vendorStr.includes('wiz')) {
    return <Database className="w-3 h-3 mr-1" />;
  }
  if (vendorStr.includes('recorded future')) {
    return <Shield className="w-3 h-3 mr-1" />;
  }
  if (vendorStr.includes('datadog')) {
    return <Database className="w-3 h-3 mr-1" />;
  }
  
  return <Shield className="w-3 h-3 mr-1" />;
}

export default function UseCaseList({ onGenerateTraining }: UseCaseListProps) {
  const { data: rawUseCases = [], isLoading: useCasesLoading, refetch } = useUseCases();
  
  // Listen for new use case additions and refresh the data
  useEffect(() => {
    const handleUseCaseAdded = () => {
      console.log('📡 New use case detected, refreshing display...');
      refetch();
    };
    
    window.addEventListener('useCaseAdded', handleUseCaseAdded);
    return () => window.removeEventListener('useCaseAdded', handleUseCaseAdded);
  }, [refetch]);
  
  // One-time migration check (removed infinite loop)
  useEffect(() => {
    const migrationKey = 'useCasesMigrated';
    const alreadyMigrated = localStorage.getItem(migrationKey);
    
    if (!alreadyMigrated) {
      const browserUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      console.log('🔍 Browser localStorage use cases:', browserUseCases.length);
      console.log('🔍 IndexedDB use cases:', rawUseCases.length);
      
      if (browserUseCases.length > 0) {
        console.log('🔄 One-time migration starting...');
        
        const migrateUseCases = async () => {
          try {
            const { localStorage: idbStorage } = await import('@/lib/storage');
            
            for (const useCase of browserUseCases) {
              await idbStorage.saveUseCase(useCase);
              console.log('✅ Migrated use case:', useCase.title);
            }
            
            // Mark migration as complete
            localStorage.setItem(migrationKey, 'true');
            console.log('✅ Migration completed successfully!');
            
            // Refresh the query instead of reloading the page
            refetch();
            
          } catch (error) {
            console.error('❌ Migration failed:', error);
          }
        };
        
        migrateUseCases();
      } else {
        localStorage.setItem(migrationKey, 'true');
      }
    }
  }, []); // Only run once on mount
  const { data: threatReports = [], isLoading: reportsLoading } = useThreatReports();
  const saveUseCase = useSaveUseCase();
  const saveTrainingPath = useSaveTrainingPath();
  const { toast } = useToast();
  const [processingReports, setProcessingReports] = useState<Set<string>>(new Set());
  const [labBuildoutModal, setLabBuildoutModal] = useState<{ isOpen: boolean; useCase: UseCase | null }>({
    isOpen: false,
    useCase: null
  });
  const [workflowModal, setWorkflowModal] = useState<{ isOpen: boolean; useCase: UseCase | null }>({
    isOpen: false,
    useCase: null
  });
  const [labSetupPhase, setLabSetupPhase] = useState<'setup' | 'integration' | 'simulation' | 'workflow'>('setup');
  const [labConfig, setLabConfig] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Deduplicate and combine vendor sources at display level
  const useCases = useMemo(() => {
    const deduplicatedMap = new Map<string, any>();

    rawUseCases.forEach((useCase: any) => {
      // Create a normalized key based on CVEs or title
      const cveKey = useCase.cves?.join(',') || '';
      const titleKey = useCase.title.toLowerCase().trim();
      const normalizedKey = cveKey || titleKey;

      if (deduplicatedMap.has(normalizedKey)) {
        // Merge sources
        const existing = deduplicatedMap.get(normalizedKey);
        const existingSources = existing.sources || [{ vendor: existing.source, url: existing.url || '', title: existing.title }];
        const newSource = { vendor: useCase.source, url: useCase.url || '', title: useCase.title };
        
        // Only add if source vendor is different
        if (!existingSources.some((s: any) => s.vendor === newSource.vendor)) {
          existingSources.push(newSource);
        }
        
        existing.sources = existingSources;
      } else {
        // First occurrence - ensure sources array exists
        const sources = useCase.sources || [{ vendor: useCase.source, url: useCase.url || '', title: useCase.title }];
        deduplicatedMap.set(normalizedKey, { ...useCase, sources });
      }
    });

    return Array.from(deduplicatedMap.values());
  }, [rawUseCases]);

  // No automatic processing - only show manually ingested use cases

  const handleGenerateTraining = async (useCase: UseCase) => {
    if (useCase.validationStatus !== 'approved' && useCase.validationStatus !== 'pending') {
      toast({
        title: "Validation Required",
        description: "This use case requires validation before training can be generated.",
        variant: "destructive"
      });
      return;
    }

    try {
      const trainingPath = generateTrainingPath(useCase);
      await saveTrainingPath.mutateAsync(trainingPath);
      onGenerateTraining(trainingPath.id);
      
      toast({
        title: "Training Path Generated",
        description: `Created comprehensive training path for ${useCase.title}`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate training path. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartLabBuildout = (useCase: UseCase) => {
    setLabBuildoutModal({ isOpen: true, useCase });
    setLabSetupPhase('setup');
  };

  const handleStartSecurityWorkflow = (useCase: UseCase) => {
    setWorkflowModal({ isOpen: true, useCase });
  };

  const handleLabBuildoutComplete = async (trainingPath: TrainingPath) => {
    try {
      await saveTrainingPath.mutateAsync(trainingPath);
      onGenerateTraining(trainingPath.id);
      
      toast({
        title: "Lab Buildout Started",
        description: `Lab infrastructure setup initiated for ${trainingPath.title}`,
      });
    } catch (error) {
      toast({
        title: "Buildout Failed",
        description: "Failed to start lab buildout. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getValidationBadge = (status: UseCase['validationStatus']) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pending Review" },
      approved: { variant: "default" as const, label: "Validated" },
      rejected: { variant: "destructive" as const, label: "Rejected" },
      needs_review: { variant: "outline" as const, label: "Needs Review" }
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getSeverityIcon = (severity: UseCase['severity']) => {
    const icons = {
      low: "fas fa-info-circle text-blue-500",
      medium: "fas fa-exclamation-triangle text-yellow-500",
      high: "fas fa-exclamation-triangle text-orange-500",
      critical: "fas fa-exclamation-triangle text-red-500"
    };
    return icons[severity as keyof typeof icons] || icons.medium;
  };

  const getCategoryIcon = (category: UseCase['category']) => {
    const icons = {
      endpoint: "fas fa-desktop",
      network: "fas fa-network-wired",
      cloud: "fas fa-cloud",
      identity: "fas fa-user-shield"
    };
    return icons[category as keyof typeof icons] || icons.endpoint;
  };

  if (useCasesLoading || reportsLoading) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <List className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-xl font-medium text-cortex-dark">Extracted Use Cases</h2>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cortex-blue mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading use cases...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (useCases.length === 0) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <List className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-xl font-medium text-cortex-dark">Extracted Use Cases</h2>
          </div>
          <div className="text-center py-8">
            <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No Use Cases Yet</p>
            <p className="text-gray-400 text-sm mb-4">Use cases appear here after ingesting threats from the feeds</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
              <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-2">How to get started:</h4>
              <ol className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>1. Go to <strong>Threat Feeds</strong> page</li>
                <li>2. Click <strong>"Ingest"</strong> on any threat</li>
                <li>3. Return here to see your extracted use case</li>
                <li>4. Click the purple <strong>"Workflow"</strong> button to start security operations</li>
              </ol>
              <div className="mt-3 text-xs text-gray-500">
                Debug: Browser storage has {JSON.parse(localStorage.getItem('useCases') || '[]').length} use cases
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validatedCount = useCases.filter(uc => uc.validationStatus === 'approved').length;
  const pendingCount = useCases.filter(uc => uc.validationStatus === 'pending').length;

  return (
    <>
    <Card className="shadow-material">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <List className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-xl font-medium text-cortex-dark">Extracted Use Cases</h2>
          </div>
          <div className="flex items-center space-x-2">
            {validatedCount > 0 && (
              <Badge className="bg-cortex-success text-white">
                {validatedCount} Validated
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge className="bg-cortex-warning text-white">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {useCases.map((useCase) => (
            <Card
              key={useCase.id}
              className="border border-gray-200 hover:border-cortex-blue transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-cortex-dark mb-1">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {useCase.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge {...getValidationBadge(useCase.validationStatus)}>
                      {getValidationBadge(useCase.validationStatus).label}
                    </Badge>
                    
                    {/* Security Operations Workflow Button */}
                    <Button
                      size="sm"
                      onClick={() => handleStartSecurityWorkflow(useCase)}
                      disabled={useCase.validationStatus === 'rejected'}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      title="Start Security Operations Workflow"
                    >
                      <Workflow className="w-4 h-4 mr-1" />
                      Workflow
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={useCase.validationStatus === 'rejected'}
                          className="border-green-500 text-green-700 hover:bg-green-50"
                          title="Lab Environment Setup"
                        >
                          <Server className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Lab Environment Setup - {useCase.title}</DialogTitle>
                        </DialogHeader>
                        {labSetupPhase === 'setup' && (
                          <LabEnvironmentSetup
                            useCase={useCase}
                            onComplete={(config) => {
                              setLabConfig(config);
                              setLabSetupPhase('integration');
                            }}
                          />
                        )}
                        {labSetupPhase === 'integration' && (
                          <XSIAMIntegrationGuide
                            useCase={useCase}
                            onConfigurationComplete={() => setLabSetupPhase('simulation')}
                          />
                        )}
                        {labSetupPhase === 'simulation' && (
                          <AttackSimulationGuide
                            useCase={useCase}
                            onSimulationComplete={(results) => {
                              setSimulationResults(results);
                              setLabSetupPhase('workflow');
                            }}
                          />
                        )}
                        {labSetupPhase === 'workflow' && (
                          <AnalystWorkflowGuide
                            useCase={useCase}
                            simulationResults={simulationResults}
                            onWorkflowComplete={() => {
                              toast({
                                title: "Lab Setup Complete",
                                description: "End-to-end lab environment configured successfully",
                              });
                              setLabSetupPhase('setup');
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateTraining(useCase)}
                      disabled={useCase.validationStatus === 'rejected' || saveTrainingPath.isPending}
                      className="bg-cortex-blue hover:bg-blue-700"
                    >
                      {saveTrainingPath.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <i className={getCategoryIcon(useCase.category) + " mr-1"}></i>
                    {useCase.category.charAt(0).toUpperCase() + useCase.category.slice(1)}
                  </span>
                  <span className="flex items-center">
                    <i className={getSeverityIcon(useCase.severity) + " mr-1"}></i>
                    {useCase.severity.charAt(0).toUpperCase() + useCase.severity.slice(1)} Severity
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {useCase.estimatedDuration} min training
                  </span>
                </div>
                
                {/* Research Sources, CVE Links and Techniques */}
                <div className="mt-3 space-y-2">
                  {/* Research Vendor Sources */}
                  {useCase.sources && useCase.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-500 mr-2">Sources:</span>
                      {useCase.sources.map((source: any, index: number) => (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                          title={`${source.title} - ${source.vendor}`}
                        >
                          {getVendorIcon(source.vendor)}
                          {source.vendor}
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {/* CVE Links */}
                  {useCase.cves && useCase.cves.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-500 mr-2">CVEs:</span>
                      {useCase.cves.map((cve: string, index: number) => (
                        <a
                          key={index}
                          href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
                          title={`View ${cve} details on National Vulnerability Database`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {cve}
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {/* Technology Links */}
                  {useCase.technologies && useCase.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-500 mr-2">Technologies:</span>
                      {useCase.technologies.map((tech: string, index: number) => (
                        <a
                          key={index}
                          href={getTechnologyLink(tech)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                          title={`Learn more about ${tech} security`}
                        >
                          {getTechnologyIcon(tech)}
                          {tech}
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {/* Extracted Techniques */}
                  {Array.isArray(useCase.extractedTechniques) && useCase.extractedTechniques.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-500 mr-2">Techniques:</span>
                      {useCase.extractedTechniques.slice(0, 5).map((technique: string, index: number) => (
                        <a
                          key={index}
                          href={getMitreAttackLink(technique)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
                          title={`View ${technique} on MITRE ATT&CK framework`}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {technique}
                        </a>
                      ))}
                      {useCase.extractedTechniques.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{useCase.extractedTechniques.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
    
    
    {/* Security Operations Workflow Dialog */}
    {workflowModal.isOpen && workflowModal.useCase && (
      <Dialog open={workflowModal.isOpen} onOpenChange={(open) => !open && setWorkflowModal({ isOpen: false, useCase: null })}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <SecurityOpsWorkflow 
            useCase={workflowModal.useCase} 
            onClose={() => setWorkflowModal({ isOpen: false, useCase: null })} 
          />
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}

function calculateEstimatedDuration(category: string, severity: string): number {
  const baseDuration = {
    endpoint: 45,
    network: 60,
    cloud: 75,
    identity: 50
  };

  const severityMultiplier = {
    low: 0.8,
    medium: 1.0,
    high: 1.3,
    critical: 1.6
  };

  return Math.round((baseDuration[category as keyof typeof baseDuration] || 45) * 
                   (severityMultiplier[severity as keyof typeof severityMultiplier] || 1.0));
}

function generateRequirements(category: string): string[] {
  const requirements = {
    endpoint: [
      "Windows/Linux test environment",
      "Cortex XDR Agent",
      "Administrative privileges",
      "Isolated lab network"
    ],
    network: [
      "Network monitoring tools",
      "Traffic capture capability",
      "Multiple network segments",
      "Firewall access"
    ],
    cloud: [
      "Cloud platform access",
      "CSPM tools",
      "API credentials",
      "Test workloads"
    ],
    identity: [
      "Active Directory environment",
      "Identity monitoring tools",
      "Test user accounts",
      "Authentication logs"
    ]
  };

  return requirements[category as keyof typeof requirements] || [];
}

// Removed auto-processing to prevent endless loop of example use cases
