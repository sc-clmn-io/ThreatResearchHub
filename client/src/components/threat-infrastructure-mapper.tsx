import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Server, Cloud, Container, DollarSign, Clock, Play, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

interface ThreatMapping {
  id: string;
  name: string;
  description: string;
  categories: string[];
  infrastructureTypes: string[];
  recommendedPlatforms: string[];
  estimatedCosts: Record<string, string>;
  deploymentTimes: Record<string, string>;
}

interface DeploymentPlan {
  platformType: string;
  threatSources: number;
  totalEstimatedCost: string;
  totalDeploymentTime: string;
  infrastructureComponents: string[];
  deploymentSteps: Array<{
    step: number;
    name: string;
    description: string;
    estimatedTime: string;
  }>;
  connectionRequirements: string[];
}

export function ThreatInfrastructureMapper() {
  const { toast } = useToast();
  const [selectedThreats, setSelectedThreats] = useState<string[]>([]);

  // Get infrastructure mappings
  const { data: mappingsData, isLoading } = useQuery({
    queryKey: ['/api/threat-infrastructure/mappings']
  });

  // Get connection status
  const { data: connections } = useQuery({
    queryKey: ['/api/connections/status']
  });

  // Generate deployment plan
  const deploymentPlanMutation = useMutation({
    mutationFn: async (threatSources: string[]) => {
      const response = await fetch('/api/threat-infrastructure/deployment-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          threatSources,
          platformType: 'hybrid',
          budgetLimit: 1000
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate deployment plan');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deployment Plan Generated",
        description: `Plan created for ${data.deploymentPlan.threatSources} threat sources`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Plan Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggleThreatSelection = (threatId: string) => {
    setSelectedThreats(prev => 
      prev.includes(threatId) 
        ? prev.filter(id => id !== threatId)
        : [...prev, threatId]
    );
  };

  const getConnectionStatus = (platformType: string) => {
    return connections?.connections?.find((conn: any) => conn.type === platformType);
  };

  const ConnectionBadge = ({ platform }: { platform: string }) => {
    const connection = getConnectionStatus(platform);
    if (connection?.status === 'connected') {
      return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    }
    return <Badge variant="secondary">Not Connected</Badge>;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading threat infrastructure mappings...</div>;
  }

  const mappings: ThreatMapping[] = mappingsData?.mappings || [];
  const deploymentPlan: DeploymentPlan | undefined = deploymentPlanMutation.data?.deploymentPlan;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <MapPin className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Threat Infrastructure Mapping</h1>
      </div>
      
      <div className="text-sm text-gray-600">
        Map threat intelligence sources to required infrastructure and generate automated deployment plans.
      </div>

      <Tabs defaultValue="mappings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mappings">Infrastructure Mappings</TabsTrigger>
          <TabsTrigger value="deployment">Deployment Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mappings.map((mapping) => (
              <Card 
                key={mapping.id} 
                className={`cursor-pointer transition-all ${
                  selectedThreats.includes(mapping.id) 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-lg'
                }`}
                onClick={() => toggleThreatSelection(mapping.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{mapping.name}</CardTitle>
                    <input 
                      type="checkbox" 
                      checked={selectedThreats.includes(mapping.id)}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                  </div>
                  <CardDescription className="text-sm">
                    {mapping.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Categories */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Categories</div>
                    <div className="flex flex-wrap gap-1">
                      {mapping.categories.map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Infrastructure Types */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Infrastructure</div>
                    <div className="flex flex-wrap gap-1">
                      {mapping.infrastructureTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-1">
                          {type === 'docker' && <Container className="w-3 h-3" />}
                          {type === 'vm' && <Server className="w-3 h-3" />}
                          {type === 'cloud' && <Cloud className="w-3 h-3" />}
                          <span className="text-xs">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Platform Connections */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Platform Status</div>
                    <div className="space-y-1">
                      {mapping.recommendedPlatforms.map((platform) => (
                        <div key={platform} className="flex items-center justify-between">
                          <span className="text-xs capitalize">{platform}</span>
                          <ConnectionBadge platform={platform} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost & Time */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <DollarSign className="w-4 h-4 mx-auto mb-1 text-green-600" />
                      <div className="text-xs font-medium">Cost Range</div>
                      <div className="text-xs text-gray-600">
                        {Object.values(mapping.estimatedCosts)[0] || 'N/A'}
                      </div>
                    </div>
                    <div className="text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                      <div className="text-xs font-medium">Deploy Time</div>
                      <div className="text-xs text-gray-600">
                        {Object.values(mapping.deploymentTimes)[0] || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedThreats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Threat Sources ({selectedThreats.length})</CardTitle>
                <CardDescription>
                  Generate deployment plan for selected threat intelligence sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => deploymentPlanMutation.mutate(selectedThreats)}
                  disabled={deploymentPlanMutation.isPending}
                  className="w-full"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {deploymentPlanMutation.isPending ? 'Generating Plan...' : 'Generate Deployment Plan'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          {deploymentPlan ? (
            <div className="space-y-4">
              {/* Plan Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Deployment Plan Overview</CardTitle>
                  <CardDescription>
                    Infrastructure deployment plan for {deploymentPlan.threatSources} threat sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {deploymentPlan.totalEstimatedCost}
                      </div>
                      <div className="text-sm text-gray-600">Total Cost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {deploymentPlan.totalDeploymentTime}
                      </div>
                      <div className="text-sm text-gray-600">Deploy Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {deploymentPlan.infrastructureComponents.length}
                      </div>
                      <div className="text-sm text-gray-600">Components</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {deploymentPlan.connectionRequirements.length}
                      </div>
                      <div className="text-sm text-gray-600">Platforms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Infrastructure Components */}
              <Card>
                <CardHeader>
                  <CardTitle>Required Infrastructure Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {deploymentPlan.infrastructureComponents.map((component) => (
                      <Badge key={component} variant="outline" className="text-sm">
                        {component === 'docker' && <Container className="w-3 h-3 mr-1" />}
                        {component === 'vm' && <Server className="w-3 h-3 mr-1" />}
                        {component === 'cloud' && <Cloud className="w-3 h-3 mr-1" />}
                        {component}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Connection Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Connection Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {deploymentPlan.connectionRequirements.map((platform) => (
                      <div key={platform} className="flex items-center justify-between p-2 border rounded">
                        <span className="capitalize font-medium">{platform}</span>
                        <ConnectionBadge platform={platform} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Deployment Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Deployment Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deploymentPlan.deploymentSteps.map((step) => (
                      <div key={step.step} className="flex items-start space-x-3 p-3 border rounded">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{step.step}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-gray-600">{step.description}</div>
                          <div className="text-xs text-green-600 mt-1">⏱️ {step.estimatedTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Deploy Action */}
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Deploy</CardTitle>
                  <CardDescription>
                    Execute deployment plan on connected infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Execute Deployment Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Deployment Plan</h3>
                <p className="text-gray-600 mb-4">
                  Select threat sources from the Infrastructure Mappings tab to generate a deployment plan.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedThreats(mappings.slice(0, 3).map(m => m.id))}
                >
                  Select Sample Threats
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}