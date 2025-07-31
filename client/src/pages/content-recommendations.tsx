import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Zap, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ContentRecommendationEngine from '@/components/content-recommendation-engine';
import { UseCase } from '@shared/schema';

export default function ContentRecommendationsPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load use cases from localStorage
    const storedUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    setUseCases(storedUseCases);
    
    // Auto-select first use case if available
    if (storedUseCases.length > 0) {
      setSelectedUseCase(storedUseCases[0]);
    }
  }, []);

  const handleImplementRecommendation = (recommendation: any) => {
    // Store implemented recommendation for tracking
    const implemented = JSON.parse(localStorage.getItem('implementedRecommendations') || '[]');
    implemented.push({
      ...recommendation,
      implementedAt: new Date().toISOString(),
      useCase: selectedUseCase?.title
    });
    localStorage.setItem('implementedRecommendations', JSON.stringify(implemented));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Brain className="w-8 h-8 mr-3 text-blue-600" />
              Multi-AI Content Recommendations
            </h1>
            <p className="text-gray-600 mt-2 flex items-center">
              Enhanced with OpenAI + Grok for superior XQL generation and threat analysis
              <div className="flex space-x-2 ml-4">
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  GPT-4o
                </Badge>
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  <Brain className="w-3 h-3 mr-1" />
                  Grok-2
                </Badge>
              </div>
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select
              value={selectedUseCase?.id || ''}
              onValueChange={(value) => {
                const useCase = useCases.find(uc => uc.id === value);
                setSelectedUseCase(useCase || null);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a use case..." />
              </SelectTrigger>
              <SelectContent>
                {useCases.map((useCase) => (
                  <SelectItem key={useCase.id} value={useCase.id}>
                    {useCase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => window.location.reload()}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Description */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Analyze Threats</h3>
              <p className="text-sm text-gray-600">
                AI examines threat patterns, CVEs, attack vectors, and MITRE ATT&CK techniques
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Generate Recommendations</h3>
              <p className="text-sm text-gray-600">
                Combines OpenAI and Grok AI for optimized XQL rules, playbooks, and XSIAM content
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Prioritize & Implement</h3>
              <p className="text-sm text-gray-600">
                Ranks suggestions by confidence and impact for efficient implementation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <ContentRecommendationEngine
        useCase={selectedUseCase}
        onImplementRecommendation={handleImplementRecommendation}
      />
    </div>
  );
}