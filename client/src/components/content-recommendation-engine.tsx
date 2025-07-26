import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  Clock, 
  Database, 
  Shield, 
  Target, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Zap,
  Brain,
  BookOpen,
  Settings
} from 'lucide-react';
import { UseCase } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface ContentRecommendation {
  id: string;
  type: 'xql-rule' | 'playbook' | 'layout' | 'dashboard' | 'data-source';
  title: string;
  description: string;
  reason: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: number;
  requiredDataSources: string[];
  tags: string[];
  category: string;
  template?: any;
}

interface ContentRecommendationEngineProps {
  useCase: UseCase | null;
  onImplementRecommendation?: (recommendation: ContentRecommendation) => void;
}

export default function ContentRecommendationEngine({ 
  useCase, 
  onImplementRecommendation 
}: ContentRecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [implementedIds, setImplementedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (useCase) {
      generateRecommendations();
    }
  }, [useCase]);

  const generateRecommendations = async () => {
    if (!useCase) return;

    setLoading(true);
    try {
      const response = await fetch('/api/content-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCase })
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      
      toast({
        title: "Recommendations Generated",
        description: `Found ${data.recommendations?.length || 0} intelligent content suggestions`,
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Recommendation Error",
        description: "Failed to generate content recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImplement = async (recommendation: ContentRecommendation) => {
    try {
      setImplementedIds(prev => new Set([...Array.from(prev), recommendation.id]));
      
      if (onImplementRecommendation) {
        onImplementRecommendation(recommendation);
      }

      toast({
        title: "Recommendation Implemented",
        description: `${recommendation.title} has been added to your content library`,
      });
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      toast({
        title: "Implementation Error", 
        description: "Failed to implement recommendation",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'xql-rule': return <Target className="w-4 h-4" />;
      case 'playbook': return <Settings className="w-4 h-4" />;
      case 'layout': return <BookOpen className="w-4 h-4" />;
      case 'dashboard': return <TrendingUp className="w-4 h-4" />;
      case 'data-source': return <Database className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.type === selectedCategory);

  const categoryStats = {
    'xql-rule': recommendations.filter(r => r.type === 'xql-rule').length,
    'playbook': recommendations.filter(r => r.type === 'playbook').length,
    'layout': recommendations.filter(r => r.type === 'layout').length,
    'dashboard': recommendations.filter(r => r.type === 'dashboard').length,
    'data-source': recommendations.filter(r => r.type === 'data-source').length
  };

  if (!useCase) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Intelligent Content Recommendation Engine
          </CardTitle>
          <CardDescription>
            Select a threat use case to receive AI-powered content recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Load a threat intelligence report or use case to get personalized XSIAM content recommendations based on threat patterns, data sources, and attack vectors.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Intelligent Content Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered suggestions for {useCase.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-500" />
                <span className="text-sm">
                  Threat: <strong>{useCase.category || 'General'}</strong>
                </span>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                <span className="text-sm">
                  Severity: <strong>{useCase.severity || 'Medium'}</strong>
                </span>
              </div>
            </div>
            <Button 
              onClick={generateRecommendations}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Refresh Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">XQL Rules</p>
                  <p className="text-2xl font-bold">{categoryStats['xql-rule']}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Playbooks</p>
                  <p className="text-2xl font-bold">{categoryStats['playbook']}</p>
                </div>
                <Settings className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Layouts</p>
                  <p className="text-2xl font-bold">{categoryStats['layout']}</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dashboards</p>
                  <p className="text-2xl font-bold">{categoryStats['dashboard']}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Sources</p>
                  <p className="text-2xl font-bold">{categoryStats['data-source']}</p>
                </div>
                <Database className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="xql-rule">XQL Rules</TabsTrigger>
          <TabsTrigger value="playbook">Playbooks</TabsTrigger>
          <TabsTrigger value="layout">Layouts</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboards</TabsTrigger>
          <TabsTrigger value="data-source">Data Sources</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing threat patterns and generating recommendations...</p>
              </div>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {selectedCategory === 'all' 
                      ? 'No recommendations available. Try refreshing or select a different use case.'
                      : `No ${selectedCategory.replace('-', ' ')} recommendations for this threat type.`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(recommendation.type)}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {recommendation.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityBadgeVariant(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {recommendation.confidence}% confidence
                          </div>
                          <Progress 
                            value={recommendation.confidence} 
                            className="w-16 h-2 mt-1" 
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Why this matters:</strong> {recommendation.reason}
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-2 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Estimated Effort
                          </p>
                          <p className="text-gray-600">{recommendation.estimatedEffort} minutes</p>
                        </div>
                        <div>
                          <p className="font-medium mb-2 flex items-center">
                            <Database className="w-4 h-4 mr-1" />
                            Required Data Sources
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {recommendation.requiredDataSources.map((source, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {recommendation.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Category: <span className="font-medium">{recommendation.category}</span>
                        </div>
                        <Button
                          onClick={() => handleImplement(recommendation)}
                          disabled={implementedIds.has(recommendation.id)}
                          size="sm"
                        >
                          {implementedIds.has(recommendation.id) ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Implemented
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Implement
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}