import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ArrowLeft, FileText, Download, AlertTriangle, Shield, Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { FindingsReportGenerator } from "../components/findings-report-generator";

export default function FindingsReportPage() {
  const [selectedUseCase, setSelectedUseCase] = useState<any>(null);
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);

  // Get stored use cases
  const useCases = JSON.parse(localStorage.getItem('useCases') || '[]');

  const handleReportGeneration = (reportData: any) => {
    const newReport = {
      id: `FR-${Date.now()}`,
      ...reportData,
      generatedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    const updatedReports = [...generatedReports, newReport];
    setGeneratedReports(updatedReports);
    localStorage.setItem('findingsReports', JSON.stringify(updatedReports));
  };

  // Load existing reports on component mount
  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem('findingsReports') || '[]');
    setGeneratedReports(savedReports);
  }, []);

  const exportReport = (report: any) => {
    const reportContent = {
      metadata: {
        reportId: report.id,
        generatedAt: report.generatedAt,
        threatName: report.threatName,
        severity: report.severity,
        status: report.status
      },
      executiveSummary: report.executiveSummary,
      technicalDetails: report.technicalDetails,
      timeline: report.timeline,
      affectedSystems: report.affectedSystems,
      containmentActions: report.containmentActions,
      remediationSteps: report.remediationSteps,
      preventionMeasures: report.preventionMeasures,
      recommendations: report.recommendations,
      subplaybook: report.subplaybook
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.threatName.replace(/\s+/g, '_')}_findings_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-green-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Security Findings Report Generator</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Report Generator */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Generate New Findings Report
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Create comprehensive security findings reports with XSIAM subplaybook integration
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Threat Use Case
                  </label>
                  <Select 
                    value={selectedUseCase?.id || ""} 
                    onValueChange={(value) => {
                      const useCase = useCases.find((uc: any) => uc.id === value);
                      setSelectedUseCase(useCase);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a threat use case for the findings report" />
                    </SelectTrigger>
                    <SelectContent>
                      {useCases.map((useCase: any) => (
                        <SelectItem key={useCase.id} value={useCase.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getSeverityBadge(useCase.severity || 'medium')}>
                              {useCase.severity || 'medium'}
                            </Badge>
                            {useCase.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUseCase && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Selected Use Case</h3>
                    <p className="text-sm text-blue-800">{selectedUseCase.title}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className={getSeverityBadge(selectedUseCase.severity || 'medium')}>
                        {selectedUseCase.severity || 'medium'}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {selectedUseCase.category}
                      </Badge>
                    </div>
                  </div>
                )}

                {selectedUseCase && (
                  <FindingsReportGenerator
                    useCase={selectedUseCase}
                    onGenerateSubplaybook={handleReportGeneration}
                  />
                )}

                {!selectedUseCase && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a threat use case above to begin generating a findings report</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Generated Reports */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  Generated Reports ({generatedReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No reports generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedReports.slice().reverse().map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900 truncate flex-1">
                            {report.threatName}
                          </h4>
                          <Badge variant="outline" className={getSeverityBadge(report.severity)}>
                            {report.severity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {report.status}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => exportReport(report)}
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Export Report
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Report Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {generatedReports.length}
                    </div>
                    <div className="text-xs text-gray-500">Total Reports</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {generatedReports.filter(r => r.status === 'draft').length}
                    </div>
                    <div className="text-xs text-gray-500">Draft Reports</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}