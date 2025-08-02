import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  Activity,
  ArrowRight,
  Zap,
  Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DDLCAnalytics {
  total_packages: number;
  phase_distribution: Record<string, number>;
  average_phase_time: Record<string, string>;
  completion_rate: {
    deployed_packages: number;
    total_packages: number;
    completion_percentage: number;
  };
  recent_transitions: Array<{
    package_name: string;
    from_phase: string;
    to_phase: string;
    timestamp: string;
    notes: string;
  }>;
  phase_bottlenecks: Array<{
    phase: string;
    count: number;
    severity: string;
  }>;
  quality_metrics: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    success_rate: number;
    packages_with_tests: number;
  };
}

const phaseColors: Record<string, string> = {
  requirement: "bg-blue-500",
  design: "bg-purple-500", 
  development: "bg-yellow-500",
  testing: "bg-orange-500",
  deployed: "bg-green-500",
  monitoring: "bg-emerald-500"
};

const phaseLabels: Record<string, string> = {
  requirement: "Requirement Gathering",
  design: "Design & Architecture", 
  development: "Development",
  testing: "Testing & Validation",
  deployed: "Production Deployment",
  monitoring: "Monitoring & Tuning"
};

export default function DDLCAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<DDLCAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/ddlc/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching DDLC analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            DDLC Analytics Dashboard
          </h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Unable to load DDLC analytics
        </h1>
        <Button onClick={fetchAnalytics}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            DDLC Analytics Dashboard
          </h1>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_packages}</div>
            <p className="text-xs text-muted-foreground">Active detection packages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completion_rate.completion_percentage}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completion_rate.deployed_packages} of {analytics.completion_rate.total_packages} deployed
            </p>
            <Progress 
              value={analytics.completion_rate.completion_percentage} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.quality_metrics.success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.quality_metrics.passed_tests} of {analytics.quality_metrics.total_tests} tests passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.phase_bottlenecks.length}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.phase_bottlenecks.filter(b => b.severity === 'high').length} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="phases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="phases">Phase Distribution</TabsTrigger>
          <TabsTrigger value="transitions">Recent Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                DDLC Phase Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.phase_distribution).map(([phase, count]) => (
                  <div key={phase} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${phaseColors[phase] || 'bg-gray-400'}`} />
                      <span className="font-medium">{phaseLabels[phase] || phase}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round((count / analytics.total_packages) * 100)}%
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {analytics.phase_bottlenecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Phase Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.phase_bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={bottleneck.severity === 'high' ? 'destructive' : 'secondary'}>
                          {bottleneck.severity}
                        </Badge>
                        <span className="font-medium">{phaseLabels[bottleneck.phase] || bottleneck.phase}</span>
                      </div>
                      <span className="text-sm font-medium">{bottleneck.count} packages</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transitions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Phase Transitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recent_transitions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No recent phase transitions to display
                  </p>
                ) : (
                  analytics.recent_transitions.map((transition, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${phaseColors[transition.from_phase] || 'bg-gray-400'}`} />
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <div className={`w-2 h-2 rounded-full ${phaseColors[transition.to_phase] || 'bg-gray-400'}`} />
                        </div>
                        <div>
                          <div className="font-medium">{transition.package_name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {phaseLabels[transition.from_phase] || transition.from_phase} → {phaseLabels[transition.to_phase] || transition.to_phase}
                          </div>
                          {transition.notes && (
                            <div className="text-xs text-gray-500 mt-1">{transition.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(transition.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Average Phase Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(analytics.average_phase_time).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No phase duration data available yet
                  </p>
                ) : (
                  Object.entries(analytics.average_phase_time).map(([phase, duration]) => (
                    <div key={phase} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${phaseColors[phase] || 'bg-gray-400'}`} />
                        <span className="font-medium">{phaseLabels[phase] || phase}</span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {duration}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Test Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Packages with Tests</span>
                    <Badge variant="secondary">
                      {analytics.quality_metrics.packages_with_tests} / {analytics.total_packages}
                    </Badge>
                  </div>
                  <Progress 
                    value={(analytics.quality_metrics.packages_with_tests / analytics.total_packages) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-600">Passed</span>
                    <Badge className="bg-green-100 text-green-800">
                      {analytics.quality_metrics.passed_tests}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Failed</span>
                    <Badge className="bg-red-100 text-red-800">
                      {analytics.quality_metrics.failed_tests}
                    </Badge>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Success Rate</span>
                    <Badge variant="outline">
                      {analytics.quality_metrics.success_rate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}