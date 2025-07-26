import { useState } from "react";
import { Upload, Link, Rss, Target, Shield } from "lucide-react";
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

export default function ThreatInput() {
  const [activeTab, setActiveTab] = useState("url");
  const [urlInput, setUrlInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const { toast } = useToast();
  const saveThreatReport = useSaveThreatReport();
  const saveUseCase = useSaveUseCase();

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
        description: `Extracted content from: ${scrapedContent.title}`,
      });
      
      setUrlInput("");
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

  const handleLoadPreIngestedThreats = async () => {
    setIsProcessing(true);
    try {
      // Fetch threats from ThreatResearchHub's threat intelligence system
      const response = await fetch('/api/threats');
      if (!response.ok) {
        throw new Error('Failed to fetch pre-ingested threats');
      }
      
      const threats = await response.json();
      
      // Convert threats to use cases and save them
      for (const threat of threats) {
        const useCase: UseCase = {
          id: `usecase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: threat.title,
          description: threat.description || threat.summary || 'Pre-ingested threat from ThreatResearchHub',
          category: (threat.category === 'general' ? 'endpoint' : threat.category) as 'endpoint' | 'network' | 'cloud' | 'identity',
          severity: threat.severity as 'critical' | 'high' | 'medium' | 'low',
          threatReportId: threat.id || `report_${Date.now()}`,
          estimatedDuration: '240 minutes', // 4 hours default  
          mitreMapping: [],
          indicators: threat.threatActors || [],
          extractedTechniques: [],
          extractedMitigations: [],
          validated: false,
          validationStatus: 'needs_review' as const,
          metadata: {
            source: 'threat_feed' as const,
            customerInfo: { source: threat.source || 'ThreatResearchHub' }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await saveUseCase.mutateAsync(useCase);
      }
      
      toast({
        title: "Pre-Ingested Threats Loaded",
        description: `Successfully loaded ${threats.length} threats from ThreatResearchHub intelligence system.`,
      });
    } catch (error) {
      toast({
        title: "Load Failed", 
        description: error instanceof Error ? error.message : "Failed to load pre-ingested threats",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualUseCaseSubmit = async (useCase: UseCase) => {
    try {
      await saveUseCase.mutateAsync(useCase);
      setShowManualForm(false);
      setActiveTab("manual");
      toast({
        title: "POC Use Case Created",
        description: `"${useCase.title}" has been created for customer POC development.`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save use case",
        variant: "destructive",
      });
    }
  };

  if (showManualForm) {
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Upload className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-xl font-medium text-cortex-dark">Threat Intelligence Input</h2>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowManualForm(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Customer DoR Entry
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Customer Design of Record (DoR) - Create 5 comprehensive POV use cases with data source integration, correlation rules, alert layouts, automation playbooks, and dashboards</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
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
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="feeds" className="flex items-center gap-2">
                  <Rss className="w-4 h-4" />
                  Threat Feeds
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import latest threats from live intelligence feeds (CISA, Unit42, SANS ISC)</p>
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
              {/* Load Pre-Ingested Threats */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="text-green-600 text-xl mr-3" />
                      <div>
                        <h3 className="font-medium text-green-800">Load Pre-Ingested Threats</h3>
                        <p className="text-sm text-green-600">Use threats already processed by ThreatResearchHub</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleLoadPreIngestedThreats}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? "Loading..." : "Load Threats"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Live Feed Sources */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Or fetch from live sources:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {threatFeeds.map((feed) => (
                    <Card
                      key={feed.id}
                      className="cursor-pointer hover:border-cortex-blue transition-colors"
                      onClick={() => handleThreatFeed(feed.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <i className={`${feed.icon} text-xl mr-3`} 
                             style={{ color: getFeedColor(feed.id) }} />
                          <div>
                            <h3 className="font-medium">{feed.name}</h3>
                            <p className="text-sm text-gray-500">{feed.description}</p>
                            {feed.requiresAuth && (
                              <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                API Key Required
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            {isProcessing && (
              <div className="text-center text-sm text-gray-500">
                Importing threat feed data...
              </div>
            )}
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
