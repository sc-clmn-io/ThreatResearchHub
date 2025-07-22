import { useState, useRef } from "react";
import { Upload, FileText, Trash2, Play, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { extractUseCasesFromPDFText } from "@/lib/pdf-parser";
import { extractUseCasesFromWebContent } from "@/lib/url-scraper";
import { useSaveUseCase } from "@/hooks/use-local-storage";
import type { UseCase } from "@shared/schema";

interface BulkFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'pdf' | 'url' | 'unknown';
  status: 'pending' | 'processing' | 'completed' | 'error';
  useCases?: UseCase[];
  error?: string;
}

interface BulkProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (totalUseCases: number) => void;
}

export default function BulkProcessingModal({ isOpen, onClose, onComplete }: BulkProcessingModalProps) {
  const [files, setFiles] = useState<BulkFile[]>([]);
  const [urls, setUrls] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'complete'>('upload');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const saveUseCase = useSaveUseCase();

  const handleFileUpload = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: BulkFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36),
      file,
      name: file.name,
      size: file.size,
      type: file.type === 'application/pdf' ? 'pdf' : 'unknown',
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleUrlsAdd = () => {
    if (!urls.trim()) return;

    const urlList = urls.split('\n').filter(url => url.trim());
    const newFiles: BulkFile[] = urlList.map(url => ({
      id: Math.random().toString(36),
      file: new File([''], url.trim(), { type: 'text/plain' }),
      name: url.trim(),
      size: 0,
      type: 'url',
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setUrls('');
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFile = async (file: BulkFile): Promise<UseCase[]> => {
    let extractedUseCases: Array<{
      title: string;
      description: string;
      techniques: string[];
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: 'endpoint' | 'network' | 'cloud' | 'identity';
    }> = [];

    if (file.type === 'pdf') {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            // Import PDF.js dynamically
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
            
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .filter((item): item is any => 'str' in item)
                .map(item => item.str)
                .join(' ');
              fullText += pageText + '\n';
            }
            
            resolve(fullText);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read PDF'));
        reader.readAsArrayBuffer(file.file);
      });
      
      extractedUseCases = extractUseCasesFromPDFText(text);
    } else if (file.type === 'url') {
      // For URLs, we need to scrape the content first
      extractedUseCases = await extractUseCasesFromWebContent('', file.name);
    } else {
      throw new Error('Unsupported file type');
    }

    // Transform extracted use cases to full UseCase objects
    return extractedUseCases.map(extracted => ({
      id: Math.random().toString(36).substring(2, 15),
      title: extracted.title,
      description: extracted.description,
      severity: extracted.severity,
      category: extracted.category,
      estimatedDuration: calculateEstimatedDuration(extracted.category, extracted.severity),
      requirements: generateRequirements(extracted.category),
      validated: false,
      validationStatus: 'pending' as const,
      extractedTechniques: extracted.techniques,
      threatReportId: null,
      metadata: {
        source: file.type,
        filename: file.name,
        extractedAt: new Date().toISOString()
      },
      sources: [{
        vendor: 'Bulk Upload',
        url: file.type === 'url' ? file.name : '',
        title: file.name
      }],
      cves: extracted.techniques.filter(t => t.startsWith('CVE-')),
      technologies: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  };

  const calculateEstimatedDuration = (category: string, severity: string): number => {
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
  };

  const generateRequirements = (category: string): string[] => {
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
  };

  const startBulkProcessing = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please add files or URLs to process",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setCurrentStep('processing');
    setProgress(0);

    let completedCount = 0;
    let totalUseCases = 0;

    for (const file of files) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ));

      try {
        const useCases = await processFile(file);
        
        // Save each use case
        for (const useCase of useCases) {
          await saveUseCase.mutateAsync(useCase);
        }

        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'completed', useCases } 
            : f
        ));

        totalUseCases += useCases.length;
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Processing failed' 
              } 
            : f
        ));
      }

      completedCount++;
      setProgress((completedCount / files.length) * 100);
    }

    setCurrentStep('complete');
    setProcessing(false);

    toast({
      title: "Bulk Processing Complete",
      description: `Successfully processed ${completedCount} files and extracted ${totalUseCases} use cases`,
    });
  };

  const getStatusIcon = (status: BulkFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: BulkFile['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
    }
  };

  const handleClose = () => {
    if (currentStep === 'complete') {
      const totalUseCases = files.reduce((sum, file) => sum + (file.useCases?.length || 0), 0);
      onComplete(totalUseCases);
    }
    
    // Reset state
    setFiles([]);
    setUrls('');
    setCurrentStep('upload');
    setProgress(0);
    setProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bulk Processing - Multiple Threat Reports</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mb-6">
            <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Upload className="w-4 h-4" />
              </div>
              <span className="font-medium">Upload Files</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className={`flex items-center space-x-2 ${currentStep === 'processing' ? 'text-blue-600' : currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'processing' ? 'bg-blue-100' : currentStep === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Play className="w-4 h-4" />
              </div>
              <span className="font-medium">Processing</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className={`flex items-center space-x-2 ${currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="font-medium">Complete</span>
            </div>
          </div>

          {currentStep === 'upload' && (
            <>
              {/* File Upload Section */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Upload PDF Reports</h3>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload PDF files or drag and drop</p>
                    <p className="text-sm text-gray-400">Supports multiple PDF threat reports</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </CardContent>
              </Card>

              {/* URL Upload Section */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Add URLs</h3>
                  <div className="space-y-3">
                    <textarea
                      value={urls}
                      onChange={(e) => setUrls(e.target.value)}
                      placeholder="Enter URLs (one per line)&#10;https://example.com/threat-report-1&#10;https://example.com/threat-report-2"
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none"
                    />
                    <Button
                      onClick={handleUrlsAdd}
                      disabled={!urls.trim()}
                      variant="outline"
                      size="sm"
                    >
                      Add URLs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Files to Process ({files.length})</h3>
                  {currentStep === 'upload' && (
                    <Button
                      onClick={startBulkProcessing}
                      disabled={processing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Processing
                    </Button>
                  )}
                </div>

                {currentStep === 'processing' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Processing files...</span>
                      <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {getStatusIcon(file.status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {file.type.toUpperCase()}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(file.status)}`}>
                                {file.status}
                              </Badge>
                              {file.useCases && (
                                <Badge variant="outline" className="text-xs">
                                  {file.useCases.length} use cases
                                </Badge>
                              )}
                            </div>
                            {file.error && (
                              <p className="text-xs text-red-600 mt-1">{file.error}</p>
                            )}
                          </div>
                        </div>
                        {currentStep === 'upload' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {currentStep === 'complete' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="font-medium text-green-800">Bulk Processing Complete</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-700">{files.length}</p>
                    <p className="text-sm text-green-600">Files Processed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      {files.reduce((sum, f) => sum + (f.useCases?.length || 0), 0)}
                    </p>
                    <p className="text-sm text-green-600">Use Cases Extracted</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      {files.filter(f => f.status === 'completed').length}
                    </p>
                    <p className="text-sm text-green-600">Successful</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              {currentStep === 'complete' ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}