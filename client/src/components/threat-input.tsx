import { useState, useEffect } from "react";
import { Upload, Link as LinkIcon, Rss, Target, Shield } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useSaveThreatReport, useSaveUseCase } from "@/hooks/use-local-storage";
import { scrapeURL, extractUseCasesFromWebContent } from "@/lib/url-scraper";
import { parsePDFFile, extractUseCasesFromPDFText } from "@/lib/pdf-parser";
import { threatFeeds, fetchThreatFeedData, extractUseCasesFromFeedItem } from "@/lib/threat-feeds";
import { parseSimpleThreatReport, convertSimpleToUseCase } from "@/lib/simple-threat-parser";
import { ManualUseCaseForm } from "./manual-use-case-form";
import type { UseCase } from "@shared/schema";

// Component to display and select from ingested threats
function ThreatFeedList({ onThreatSelected }: { onThreatSelected: (threat: any) => void }) {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const response = await fetch('/api/threats');
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Fetched ${data.length} threats from API`);
          console.log('First few threats:', data.slice(0, 3).map(t => ({ id: t.id, title: t.title })));
          setThreats(data);
        } else {
          console.error('❌ Failed to fetch threats - status:', response.status);
        }
      } catch (error) {
        console.error('❌ Failed to fetch threats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreats();
  }, []);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading threat intelligence...</div>;
  }

  if (threats.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="mb-2">No threats currently available in the feed.</p>
        <p className="text-sm">The system automatically ingests threat intelligence every 6 hours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700">TBH Threat Intelligence</h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {threats.length} threats available
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {threats.map((threat, index) => (
          <div key={threat.id || index} className="border border-gray-200 rounded-lg p-3 hover:border-green-500 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">{threat.title}</h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{threat.description || threat.summary}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  threat.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  threat.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {threat.severity}
                </span>
                {threat.source && (
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    {threat.source}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onThreatSelected(threat)}
              className="ml-3 bg-green-600 hover:bg-green-700 text-xs"
            >
              Convert to Raw Report
            </Button>
          </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThreatInput() {
  const [activeTab, setActiveTab] = useState("feeds");
  const [urlInput, setUrlInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const { toast } = useToast();
  const saveThreatReport = useSaveThreatReport();
  const saveUseCase = useSaveUseCase();

  // Check URL parameters to determine behavior
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const tab = urlParams.get('tab');
    
    if (mode === 'customer-pov') {
      setShowManualForm(true);
      setActiveTab("manual");
    } else {
      setShowManualForm(false);
      // Set active tab based on URL parameter or default to feeds
      if (tab === 'pdf') {
        setActiveTab("pdf");
      } else if (tab === 'url') {
        setActiveTab("url");
      } else {
        setActiveTab("feeds"); // Default for TBH Threat Feed
      }
    }
  }, []);

  const handleURLParse = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const scrapedContent = await scrapeURL(urlInput);
      
      // Parse threat intelligence with simple but effective parser
      const parsedThreat = parseSimpleThreatReport(scrapedContent.content, scrapedContent.title);
      
      const threatReport = {
        id: `report_${Date.now()}`,
        title: scrapedContent.title,
        url: scrapedContent.url,
        content: scrapedContent.content,
        source: "url" as const,
        extractedAt: new Date(),
        processed: false,
      };

      await saveThreatReport.mutateAsync(threatReport);
      
      // Convert to use case with multi-data source support
      const useCase = convertSimpleToUseCase(parsedThreat, {
        url: scrapedContent.url,
        author: scrapedContent.author,
        publishedDate: scrapedContent.publishedDate
      });
      
      await saveUseCase.mutateAsync(useCase);
      
      toast({
        title: "URL Parsed Successfully", 
        description: `Extracted content from: ${scrapedContent.title}. Redirecting to dashboard...`,
      });
      
      setUrlInput("");
      
      // Trigger event to notify parent components and redirect to dashboard
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('useCaseAdded'));
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      toast({
        title: "Parsing Failed",
        description: error instanceof Error ? error.message : "Failed to parse URL",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid File Type",
            description: "Only PDF files are supported.",
            variant: "destructive",
          });
          continue;
        }

        const parseResult = await parsePDFFile(file);
        
        // Parse threat intelligence from PDF
        const parsedThreat = parseSimpleThreatReport(parseResult.text, parseResult.metadata.title || file.name);
        
        const threatReport = {
          id: `report_${Date.now()}_${file.name}`,
          title: parseResult.metadata.title || file.name,
          content: parseResult.text,
          source: "pdf" as const,

          processed: false,
        };

        await saveThreatReport.mutateAsync(threatReport);
        
        // Convert to use case
        const useCase = convertSimpleToUseCase(parsedThreat, {
          filename: file.name,
          pages: parseResult.metadata.pages,
          author: parseResult.metadata.author
        });
        
        await saveUseCase.mutateAsync(useCase);
      }
      
      toast({
        title: "PDF Processing Complete",
        description: `Successfully processed ${files.length} file(s).`,
      });
      
      // Clear the input
      event.target.value = "";
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThreatFeed = async (feedId: string) => {
    setIsProcessing(true);
    try {
      const feedItems = await fetchThreatFeedData(feedId);
      
      for (const item of feedItems) {
        const threatReport = {
          id: `report_${Date.now()}_${item.id}`,
          title: item.title,
          url: item.url,
          content: item.description,
          source: feedId as any,
          processed: false,
        };

        await saveThreatReport.mutateAsync(threatReport);
      }
      
      toast({
        title: "Feed Data Retrieved",
        description: `Successfully imported ${feedItems.length} threat reports.`,
      });
    } catch (error) {
      toast({
        title: "Feed Import Failed",
        description: error instanceof Error ? error.message : "Failed to import threat feed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThreatFromFeed = async (threat: any) => {
    try {
      // Create a comprehensive use case from the threat
      const useCase: UseCase = {
        id: `usecase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `Security Outcome: ${threat.title}`,
        description: `${threat.description || threat.summary || 'Security outcome created from TBH threat feed'}\n\nSecurity Objectives:\n- Detect similar threats in environment\n- Implement prevention controls\n- Develop response procedures\n- Create monitoring dashboards`,
        category: (threat.category === 'general' ? 'endpoint' : threat.category) as 'endpoint' | 'network' | 'cloud' | 'identity',
        severity: threat.severity as 'critical' | 'high' | 'medium' | 'low',
        threatReportId: threat.id || `report_${Date.now()}`,
        estimatedDuration: '240 minutes',
        mitreMapping: threat.mitreMapping || [],
        indicators: threat.threatActors || [],
        extractedTechniques: [],
        extractedMitigations: [],
        validated: false,
        validationStatus: 'needs_review' as const,
        metadata: {
          source: 'threat_feed' as const,
          customerInfo: { 
            source: threat.source || 'ThreatResearchHub',
            originalThreat: threat.title,
            threatId: threat.id
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Saving use case:', useCase);
      await saveUseCase.mutateAsync(useCase);
      console.log('Use case saved successfully');
      
      // Also save to localStorage for immediate dashboard access
      const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      existingUseCases.push(useCase);
      localStorage.setItem('useCases', JSON.stringify(existingUseCases));
      console.log('Use case also saved to localStorage for immediate access');
      
      toast({
        title: "✅ Raw Report Created Successfully!",
        description: `Ready for infrastructure planning - proceeding directly to Step 3`,
        duration: 4000,
      });
      
      // Skip redundant steps and go directly to infrastructure planning
      setTimeout(() => {
        // Trigger refresh events to ensure dashboard updates
        window.dispatchEvent(new CustomEvent('useCaseAdded'));
        window.dispatchEvent(new CustomEvent('storage'));
        // Go directly to Lab Build Planner (Step 3)
        setTimeout(() => {
          console.log('Redirecting directly to Step 3 - Infrastructure Planning...');
          window.location.href = '/lab-build-planner'; // Skip to infrastructure planning
        }, 200);
      }, 1500);
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create security outcome",
        variant: "destructive",
      });
    }
  };

  const handleManualUseCaseSubmit = async (useCase: UseCase) => {
    try {
      await saveUseCase.mutateAsync(useCase);
      // Don't hide the form immediately - show successful creation first
      toast({
        title: "✅ Customer POV Use Case Created Successfully!",
        description: `"${useCase.title}" has been saved and will appear in your dashboard. Redirecting now so you can select it and proceed to Step 2...`,
      });
      // Wait a moment then redirect to dashboard to show the created use case
      setTimeout(() => {
        setShowManualForm(false);
        // Force page reload to show updated use case list
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save use case",
        variant: "destructive",
      });
    }
  };

  // Only show manual form when explicitly requested via Customer POV mode
  if (showManualForm && new URLSearchParams(window.location.search).get('mode') === 'customer-pov') {
    return (
      <ManualUseCaseForm
        onSubmit={handleManualUseCaseSubmit}
        onCancel={() => setShowManualForm(false)}
      />
    );
  }

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center">
            <Upload className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-xl font-medium text-cortex-dark">
              {new URLSearchParams(window.location.search).get('mode') === 'customer-pov' 
                ? 'Customer POV Entry' 
                : 'Threat Intelligence Input'}
            </h2>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="feeds" className="flex items-center gap-2">
                  <Rss className="w-4 h-4" />
                  TBH Threat Feed
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use threats already available in the platform</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  URL Link
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Parse threat reports from web URLs (security blogs, advisories, research posts)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="pdf" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  PDF Upload
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload PDF threat reports for automated content extraction and analysis</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div>
              <Label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Threat Report URL
              </Label>
              <div className="flex">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/threat-report"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 rounded-r-none"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleURLParse}
                      disabled={isProcessing}
                      className="rounded-l-none bg-cortex-blue hover:bg-blue-700"
                    >
                      <i className="fas fa-download mr-2" />
                      {isProcessing ? "Parsing..." : "Parse"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Extract threat intelligence content from the provided URL</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Supported sources: Security blogs, MITRE ATT&CK reports, vendor advisories
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cortex-blue transition-colors">
              <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Drop PDF files here</p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <Button variant="outline" asChild>
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </div>
            {isProcessing && (
              <div className="text-center text-sm text-gray-500">
                Processing PDF files...
              </div>
            )}
          </TabsContent>

          <TabsContent value="feeds" className="space-y-4">
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center mb-4">
                    <Shield className="text-green-600 text-xl mr-3" />
                    <div>
                      <h3 className="font-medium text-green-800">TBH Integrated Threat Feed</h3>
                      <p className="text-sm text-green-600">Select from automatically ingested threat intelligence</p>
                    </div>
                  </div>
                  <ThreatFeedList onThreatSelected={handleThreatFromFeed} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function getFeedColor(feedId: string): string {
  const colors: Record<string, string> = {
    unit42: '#FF6B35',
    cisa: '#2563EB',
    recordedfuture: '#7C3AED',
    wiz: '#059669',
    datadog: '#6366F1'
  };
  return colors[feedId] || '#6B7280';
}
