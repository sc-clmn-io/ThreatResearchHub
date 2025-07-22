import { useState, useEffect } from "react";
import { TrendingUp, CheckCircle, Clock, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTrainingPaths, useProgressTracking } from "@/hooks/use-local-storage";
import type { TrainingPath } from "@shared/schema";

export default function ProgressTracker() {
  const { data: trainingPaths = [], isLoading } = useTrainingPaths();
  const [overallProgress, setOverallProgress] = useState(0);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

  // Calculate overall progress across all training paths
  useEffect(() => {
    if (trainingPaths.length === 0) {
      setOverallProgress(0);
      return;
    }

    const totalProgress = trainingPaths.reduce((sum, path) => sum + path.progress, 0);
    const averageProgress = Math.round(totalProgress / trainingPaths.length);
    setOverallProgress(averageProgress);

    // Calculate module-specific progress
    const modules: Record<string, { completed: number; total: number }> = {
      'Environment Setup': { completed: 0, total: 0 },
      'Detection Rules': { completed: 0, total: 0 },
      'Playbook Creation': { completed: 0, total: 0 },
      'Response Planning': { completed: 0, total: 0 },
      'Automation': { completed: 0, total: 0 }
    };

    trainingPaths.forEach(path => {
      path.steps.forEach(step => {
        let moduleName = 'Environment Setup';
        
        if (step.category.includes('detection') || step.category.includes('engineering')) {
          moduleName = 'Detection Rules';
        } else if (step.category.includes('playbook') || step.category.includes('automation')) {
          moduleName = 'Playbook Creation';
        } else if (step.category.includes('response') || step.category.includes('planning')) {
          moduleName = 'Response Planning';
        } else if (step.category.includes('script') || step.category.includes('dashboard')) {
          moduleName = 'Automation';
        }

        modules[moduleName].total++;
        if (step.completed) {
          modules[moduleName].completed++;
        }
      });
    });

    const modulePercentages: Record<string, number> = {};
    Object.entries(modules).forEach(([name, data]) => {
      modulePercentages[name] = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    });

    setModuleProgress(modulePercentages);
  }, [trainingPaths]);

  if (isLoading) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-lg font-medium text-cortex-dark">Training Progress</h2>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'text-cortex-success';
    if (progress >= 50) return 'text-cortex-blue';
    return 'text-gray-500';
  };

  const getProgressIcon = (progress: number) => {
    if (progress === 100) return <CheckCircle className="w-4 h-4 text-cortex-success" />;
    if (progress > 0) return <Clock className="w-4 h-4 text-cortex-blue" />;
    return <Target className="w-4 h-4 text-gray-400" />;
  };

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="text-cortex-blue text-xl mr-3" />
          <h2 className="text-lg font-medium text-cortex-dark">Training Progress</h2>
        </div>
        
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Completion</span>
              <span className={`font-medium ${getProgressColor(overallProgress)}`}>
                {overallProgress}%
              </span>
            </div>
            <div className="bg-gray-100 rounded-full h-3">
              <div 
                className="bg-cortex-blue h-3 rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Training Statistics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-cortex-blue">
                {trainingPaths.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-500">Paths Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cortex-warning">
                {trainingPaths.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
          </div>

          {/* Module Progress */}
          {Object.keys(moduleProgress).length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-cortex-dark mb-3">Module Progress</h3>
              <div className="space-y-3">
                {Object.entries(moduleProgress).map(([module, progress]) => (
                  <div key={module} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{module}</span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-100 rounded-full h-2 w-16">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress === 100 ? 'bg-cortex-success' : 
                            progress > 0 ? 'bg-cortex-blue' : 'bg-gray-300'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      {getProgressIcon(progress)}
                      <span className={`text-xs ${getProgressColor(progress)}`}>
                        {progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-cortex-dark mb-3">Recent Activity</h3>
            <div className="space-y-2 text-xs text-gray-500">
              {trainingPaths.slice(0, 3).map((path) => {
                const lastUpdated = new Date(path.updatedAt).toLocaleDateString();
                const completedSteps = path.steps.filter(s => s.completed).length;
                return (
                  <div key={path.id} className="flex items-center justify-between py-1">
                    <span className="truncate max-w-32">{path.title}</span>
                    <div className="flex items-center space-x-2">
                      <span>{completedSteps}/{path.steps.length} steps</span>
                      <span>•</span>
                      <span>{lastUpdated}</span>
                    </div>
                  </div>
                );
              })}
              {trainingPaths.length === 0 && (
                <div className="text-center py-2 text-gray-400">
                  No training activity yet
                </div>
              )}
            </div>
          </div>

          {/* Time Tracking */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-cortex-dark mb-2">Time Investment</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium text-cortex-blue">
                  {Math.floor(trainingPaths.reduce((sum, p) => sum + p.totalDuration, 0) / 60)}h
                </div>
                <div className="text-gray-500">Total Planned</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium text-cortex-success">
                  {Math.floor(trainingPaths.reduce((sum, p) => 
                    sum + p.steps.filter(s => s.completed).reduce((stepSum, s) => stepSum + s.estimatedDuration, 0), 0
                  ) / 60)}h
                </div>
                <div className="text-gray-500">Time Completed</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
