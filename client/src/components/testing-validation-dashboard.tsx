import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Play,
  RefreshCw,
  FileText,
  Bug,
  TestTube,
  Activity,
  Zap,
  Target
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  category: 'api' | 'manual';
  type: 'correlation_rule' | 'playbook' | 'dashboard' | 'alert_layout' | 'data_source';
  status: 'passed' | 'failed' | 'running' | 'pending';
  lastRun: string;
  duration: number;
  errorMessage?: string;
  details: {
    expected: string;
    actual: string;
    validationPoints: string[];
  };
}

interface FailedTestIssue {
  id: string;
  testId: string;
  testName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  environment: string;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  reproductionSteps: string[];
  impact: string;
  workaround?: string;
}

export function TestingValidationDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [failedIssues, setFailedIssues] = useState<FailedTestIssue[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    // Load test results from localStorage
    const storedResults = localStorage.getItem('testResults');
    const storedIssues = localStorage.getItem('failedTestIssues');
    
    if (storedResults) {
      setTestResults(JSON.parse(storedResults));
    } else {
      // Initialize with sample test results
      initializeSampleTestResults();
    }
    
    if (storedIssues) {
      setFailedIssues(JSON.parse(storedIssues));
    }
  }, []);

  const initializeSampleTestResults = () => {
    const sampleResults: TestResult[] = [
      {
        id: 'test-1',
        name: 'S3 Privilege Escalation Correlation Rule',
        category: 'api',
        type: 'correlation_rule',
        status: 'passed',
        lastRun: new Date().toISOString(),
        duration: 1500,
        details: {
          expected: 'XQL query executes successfully',
          actual: 'Query executed in 1.5s with valid results',
          validationPoints: ['Syntax validation', 'Performance check', 'Logic validation']
        }
      },
      {
        id: 'test-2',
        name: 'AWS CloudTrail Data Source Integration',
        category: 'manual',
        type: 'data_source',
        status: 'failed',
        lastRun: new Date().toISOString(),
        duration: 0,
        errorMessage: 'No logs received within 5 minutes',
        details: {
          expected: 'CloudTrail logs flowing within 5 minutes',
          actual: 'No logs received after 10 minutes',
          validationPoints: ['Connectivity', 'Log flow', 'Field parsing', 'Timestamps']
        }
      },
      {
        id: 'test-3',
        name: 'S3 Threat Response Playbook',
        category: 'api',
        type: 'playbook',
        status: 'running',
        lastRun: new Date().toISOString(),
        duration: 30000,
        details: {
          expected: 'Playbook completes successfully',
          actual: 'Currently executing step 3 of 5',
          validationPoints: ['Execution flow', 'Error handling', 'Output generation']
        }
      }
    ];
    
    setTestResults(sampleResults);
    localStorage.setItem('testResults', JSON.stringify(sampleResults));
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    
    // Simulate running tests
    for (let i = 0; i < testResults.length; i++) {
      setTimeout(() => {
        setTestResults(prev => prev.map(test => 
          test.status === 'pending' ? { ...test, status: 'running' } : test
        ));
      }, i * 1000);
    }
    
    // Complete tests after simulation
    setTimeout(() => {
      setTestResults(prev => prev.map(test => ({
        ...test,
        status: Math.random() > 0.3 ? 'passed' : 'failed' as any,
        lastRun: new Date().toISOString(),
        duration: Math.floor(Math.random() * 5000) + 1000
      })));
      setIsRunningTests(false);
    }, 5000);
  };

  const createIssueFromFailedTest = (test: TestResult) => {
    const newIssue: FailedTestIssue = {
      id: `issue-${Date.now()}`,
      testId: test.id,
      testName: test.name,
      severity: test.type === 'data_source' ? 'high' : 'medium',
      description: test.errorMessage || 'Test failed without specific error message',
      environment: 'Lab',
      status: 'open',
      createdAt: new Date().toISOString(),
      reproductionSteps: [
        'Navigate to testing dashboard',
        `Run ${test.name} test`,
        'Observe failure result'
      ],
      impact: 'Content validation blocked until resolved',
      workaround: test.type === 'data_source' ? 'Check network connectivity and credentials' : undefined
    };
    
    setFailedIssues(prev => {
      const updated = [...prev, newIssue];
      localStorage.setItem('failedTestIssues', JSON.stringify(updated));
      return updated;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      failed: 'destructive', 
      running: 'secondary',
      pending: 'outline'
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const runningTests = testResults.filter(t => t.status === 'running').length;
  const passRate = testResults.length > 0 ? Math.round((passedTests / testResults.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">XSIAM Content Testing & Validation</h1>
          <p className="text-gray-600">Automated API testing and manual validation framework</p>
        </div>
        <Button onClick={runAllTests} disabled={isRunningTests}>
          {isRunningTests ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold">{passRate}%</p>
              </div>
              <TestTube className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={passRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">{passedTests}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedTests}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold text-blue-600">{runningTests}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Test Results</TabsTrigger>
          <TabsTrigger value="api">API Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Checklists</TabsTrigger>
          <TabsTrigger value="issues">Failed Test Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Test Results</CardTitle>
              <CardDescription>Complete overview of automated and manual testing results</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {testResults.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <p className="font-medium">{test.name}</p>
                          <p className="text-sm text-gray-600">
                            {test.category} • {test.type.replace('_', ' ')} • Last run: {new Date(test.lastRun).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(test.status)}
                        {test.status === 'failed' && (
                          <Button size="sm" variant="outline" onClick={() => createIssueFromFailedTest(test)}>
                            <Bug className="h-3 w-3 mr-1" />
                            Create Issue
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>XSIAM API Testing Framework</CardTitle>
              <CardDescription>Automated validation of XSIAM content via API endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  API tests automatically validate XQL syntax, playbook logic, and dashboard configurations
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Connection Testing</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    curl -H "Authorization: Bearer $YOUR_XSIAM_API_KEY" https://tenant.xdr.us.paloaltonetworks.com/api/v1/health
                  </code>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Correlation Rule Validation</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    POST /api/v1/correlation-rules/validate
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Test Checklists</CardTitle>
              <CardDescription>Pass/fail validation points for components that require manual testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Data Source Integration Checklist
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Connectivity: Data source connects to XSIAM Broker</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Log Flow: Logs appearing in XSIAM within 5 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Field Parsing: All required fields extracting properly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Data Types: Field data types match XSIAM schema</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Correlation Rule Testing
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Syntax: XQL query executes without errors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Logic: Rule logic matches threat detection requirements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Performance: Query executes within 30 seconds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>False Positives: Rule doesn't trigger on normal activity</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Test Issues</CardTitle>
              <CardDescription>Tracking and resolution of test failures</CardDescription>
            </CardHeader>
            <CardContent>
              {failedIssues.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No failed test issues currently tracked</p>
                  <p className="text-sm">Issues will appear here when tests fail</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {failedIssues.map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{issue.testName}</h4>
                            <p className="text-sm text-gray-600">{issue.description}</p>
                          </div>
                          <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {issue.severity}
                          </Badge>
                        </div>
                        
                        <div className="text-sm space-y-1 text-gray-600">
                          <p><strong>Environment:</strong> {issue.environment}</p>
                          <p><strong>Impact:</strong> {issue.impact}</p>
                          {issue.workaround && (
                            <p><strong>Workaround:</strong> {issue.workaround}</p>
                          )}
                          <p><strong>Created:</strong> {new Date(issue.createdAt).toLocaleString()}</p>
                        </div>
                        
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">Assign</Button>
                          <Button size="sm" variant="outline">Update Status</Button>
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}