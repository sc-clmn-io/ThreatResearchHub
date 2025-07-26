import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Zap, Shield, CheckCircle, AlertTriangle, Timer, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScenarioPlaygroundProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SimulationScenario {
  id: string;
  name: string;
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  description: string;
  techniques: string[];
  outcomes: string[];
}

const predefinedScenarios: SimulationScenario[] = [
  {
    id: 'vpn-anomaly',
    name: 'VPN Access from Abnormal OS',
    category: 'identity',
    difficulty: 'beginner',
    duration: 5,
    description: 'Simulate unauthorized VPN access from unusual operating system',
    techniques: ['T1078', 'T1133'],
    outcomes: ['Alert Generated', 'User Locked', 'Incident Created']
  },
  {
    id: 'malware-execution',
    name: 'Malware Execution via Email',
    category: 'endpoint',
    difficulty: 'intermediate', 
    duration: 8,
    description: 'Simulate malware execution through email attachment',
    techniques: ['T1566.001', 'T1204.002'],
    outcomes: ['File Quarantined', 'Process Terminated', 'Network Blocked']
  },
  {
    id: 'cloud-privilege-escalation',
    name: 'Cloud Privilege Escalation',
    category: 'cloud',
    difficulty: 'advanced',
    duration: 12,
    description: 'Simulate privilege escalation in cloud environment',
    techniques: ['T1548', 'T1068'],
    outcomes: ['Permissions Revoked', 'Account Suspended', 'Audit Triggered']
  },
  {
    id: 'lateral-movement',
    name: 'Network Lateral Movement',
    category: 'network',
    difficulty: 'intermediate',
    duration: 10,
    description: 'Simulate lateral movement across network segments',
    techniques: ['T1021', 'T1570'],
    outcomes: ['Connection Blocked', 'Alerts Generated', 'Segmentation Applied']
  }
];

export default function OneClickScenarioPlayground({ isOpen, onClose }: ScenarioPlaygroundProps) {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runScenario = async (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    // Simulate progressive execution
    const steps = [
      'Initializing environment...',
      'Deploying attack simulation...',
      'Triggering detection rules...',
      'Executing response actions...',
      'Collecting evidence...',
      'Generating report...'
    ];

    for (let i = 0; i < steps.length; i++) {
      toast({
        title: "Simulation Progress",
        description: steps[i]
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(((i + 1) / steps.length) * 100);
    }

    // Generate simulation results
    const simulationResults = {
      scenario: scenario.name,
      duration: scenario.duration,
      alertsGenerated: Math.floor(Math.random() * 5) + 3,
      actionsExecuted: scenario.outcomes.length,
      successRate: Math.floor(Math.random() * 20) + 80,
      detectedTechniques: scenario.techniques,
      outcomes: scenario.outcomes,
      timestamp: new Date().toISOString(),
      evidence: {
        logs: `${Math.floor(Math.random() * 500) + 100} log entries`,
        alerts: `${Math.floor(Math.random() * 10) + 5} security alerts`,
        artifacts: `${Math.floor(Math.random() * 15) + 8} forensic artifacts`
      }
    };

    setResults(simulationResults);
    setIsRunning(false);
    
    toast({
      title: "Simulation Complete",
      description: `${scenario.name} simulation completed with ${simulationResults.successRate}% success rate`
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'endpoint': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'network': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cloud': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'identity': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            <span>One-Click Scenario Simulation Playground</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedScenario && (
            <>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Instant Attack Simulation</h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Run complete attack scenarios with one click. Each simulation includes attack execution, detection triggering, 
                  response automation, and evidence collection for comprehensive POV demonstrations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predefinedScenarios.map((scenario) => (
                  <Card key={scenario.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <div className="flex items-center space-x-1">
                          <Timer className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">{scenario.duration}min</span>
                        </div>
                      </div>
                      <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(scenario.category)}>
                            {scenario.category}
                          </Badge>
                          <Badge className={getDifficultyColor(scenario.difficulty)}>
                            {scenario.difficulty}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MITRE Techniques:</p>
                          <div className="flex flex-wrap gap-1">
                            {scenario.techniques.map((technique) => (
                              <Badge key={technique} variant="outline" className="text-xs">
                                {technique}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Outcomes:</p>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {scenario.outcomes.join(', ')}
                          </div>
                        </div>

                        <Button 
                          onClick={() => runScenario(scenario)}
                          className="w-full"
                          disabled={isRunning}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Run Simulation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {selectedScenario && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Running: {selectedScenario.name}</h3>
                <Button variant="outline" onClick={() => {
                  setSelectedScenario(null);
                  setIsRunning(false);
                  setProgress(0);
                  setResults(null);
                }}>
                  Back to Scenarios
                </Button>
              </div>

              {isRunning && (
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress value={progress} className="w-full" />
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {progress < 100 ? 'Executing simulation...' : 'Finalizing results...'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {results && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Simulation Results</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{results.successRate}%</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Success Rate</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{results.alertsGenerated}</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Alerts Generated</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{results.actionsExecuted}</div>
                        <div className="text-sm text-purple-700 dark:text-purple-300">Actions Executed</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Detected Techniques</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.detectedTechniques.map((technique: string) => (
                            <Badge key={technique} variant="outline">{technique}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Response Outcomes</h4>
                        <div className="space-y-2">
                          {results.outcomes.map((outcome: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{outcome}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Evidence Collected</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span>{results.evidence.logs}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span>{results.evidence.alerts}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-purple-500" />
                            <span>{results.evidence.artifacts}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}