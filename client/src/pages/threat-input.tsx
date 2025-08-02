import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import ThreatInput from "@/components/threat-input";
import { useToast } from "@/hooks/use-toast";

export default function ThreatInputPage() {
  const { toast } = useToast();
  const [useCases, setUseCases] = useState<any[]>([]);

  useEffect(() => {
    // Load existing use cases to show progress
    const storedUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    setUseCases(storedUseCases);
  }, []);

  const refreshUseCases = () => {
    const storedUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    setUseCases(storedUseCases);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation back to workflow */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workflow
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Load Threat Intelligence</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Step 1 of 6: Load Threat Intelligence
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator */}
        {useCases.length > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium">
                  {useCases.length} threat report{useCases.length !== 1 ? 's' : ''} loaded successfully!
                </p>
                <p className="text-green-700 text-sm">
                  You can continue adding more threats or proceed to Step 2.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            How to Load Threat Intelligence
          </h2>
          <div className="text-blue-700 space-y-2">
            <p>• <strong>Upload PDF:</strong> Drag and drop threat intelligence PDF documents</p>
            <p>• <strong>Paste URL:</strong> Enter URLs from threat intelligence sources</p>
            <p>• <strong>Browse Feeds:</strong> Select from live threat intelligence feeds</p>
            <p>• <strong>Manual Entry:</strong> Enter customer requirements and scenarios manually</p>
          </div>
        </div>

        {/* Threat Input Component */}
        <div className="mb-8">
          <ThreatInput />
        </div>

        {/* Show loaded use cases */}
        {useCases.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Loaded Threat Intelligence</h3>
            <div className="space-y-3">
              {useCases.map((useCase, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{useCase.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{useCase.description}</p>
                  {useCase.cves && useCase.cves.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-red-600">CVEs: </span>
                      <span className="text-xs text-red-500">{useCase.cves.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          {useCases.length > 0 && (
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Continue to Step 2
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}