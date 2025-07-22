import { useState } from "react";
import { Route, Clock, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTrainingPaths } from "@/hooks/use-local-storage";
import type { TrainingPath, TrainingStep } from "@shared/schema";

export default function TrainingPath() {
  const { data: trainingPaths = [], isLoading } = useTrainingPaths();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const getStatusIcon = (status: TrainingPath['status']) => {
    const icons = {
      not_started: <Circle className="w-5 h-5 text-gray-400" />,
      in_progress: <Clock className="w-5 h-5 text-cortex-blue animate-pulse" />,
      completed: <CheckCircle className="w-5 h-5 text-cortex-success" />,
      validation_pending: <AlertCircle className="w-5 h-5 text-cortex-warning" />
    };
    return icons[status];
  };

  const getStatusColor = (status: TrainingPath['status']) => {
    const colors = {
      not_started: "bg-gray-300",
      in_progress: "bg-cortex-blue", 
      completed: "bg-cortex-success",
      validation_pending: "bg-cortex-warning"
    };
    return colors[status];
  };

  const getStepStatusIcon = (completed: boolean, validationRequired: boolean) => {
    if (completed) {
      return <CheckCircle className="w-5 h-5 text-cortex-success" />;
    } else if (validationRequired) {
      return <AlertCircle className="w-5 h-5 text-cortex-warning" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getCategoryIcon = (category: TrainingStep['category']) => {
    const icons = {
      planning: "fas fa-clipboard-list",
      environment_buildout: "fas fa-tools",
      attack_simulation: "fas fa-crosshairs", 
      detection_engineering: "fas fa-search",
      layout_configuration: "fas fa-th-large",
      script_development: "fas fa-code",
      dashboard_creation: "fas fa-chart-bar",
      decision_support: "fas fa-decision-tree",
      response_planning: "fas fa-shield-alt",
      automation_playbook: "fas fa-robot",
      learning_summary: "fas fa-graduation-cap"
    };
    return icons[category] || "fas fa-circle";
  };

  if (isLoading) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <Route className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-xl font-medium text-cortex-dark">Generated Training Path</h2>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cortex-blue mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading training paths...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trainingPaths.length === 0) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <Route className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-xl font-medium text-cortex-dark">Generated Training Path</h2>
          </div>
          <div className="text-center py-8">
            <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No Training Paths Generated</p>
            <p className="text-gray-400 text-sm">Generate training from validated use cases to see paths here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activePath = selectedPath 
    ? trainingPaths.find(p => p.id === selectedPath)
    : trainingPaths[trainingPaths.length - 1]; // Show most recent by default

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Route className="text-cortex-blue text-xl mr-3" />
            <h2 className="text-xl font-medium text-cortex-dark">Generated Training Path</h2>
          </div>
          <Button className="bg-cortex-blue hover:bg-blue-700">
            <i className="fas fa-download mr-2"></i>
            Export Path
          </Button>
        </div>

        {/* Path selector if multiple paths */}
        {trainingPaths.length > 1 && (
          <div className="mb-6">
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedPath || activePath?.id || ''}
              onChange={(e) => setSelectedPath(e.target.value)}
            >
              {trainingPaths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.title} ({path.status.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        )}

        {activePath && (
          <div>
            {/* Path Overview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-cortex-dark">{activePath.title}</h3>
                <div className="flex items-center">
                  {getStatusIcon(activePath.status)}
                  <span className="ml-2 text-sm font-medium capitalize">
                    {activePath.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{activePath.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Total Duration: {Math.floor(activePath.totalDuration / 60)}h {activePath.totalDuration % 60}m
                </span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Progress:</span>
                  <div className="w-24">
                    <Progress value={activePath.progress} className="h-2" />
                  </div>
                  <span className="text-sm text-cortex-blue ml-2">{activePath.progress}%</span>
                </div>
              </div>
            </div>

            {/* Training Steps */}
            <div className="space-y-4">
              {activePath.steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                    step.completed 
                      ? 'bg-cortex-success' 
                      : index === 0 || activePath.steps[index - 1]?.completed 
                        ? 'bg-cortex-blue' 
                        : 'bg-gray-300'
                  }`}>
                    {step.order}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-cortex-dark">{step.title}</h4>
                      <div className="flex items-center space-x-2">
                        {step.completed && (
                          <Badge className="bg-cortex-success text-white text-xs">
                            Completed
                          </Badge>
                        )}
                        {!step.completed && step.validationRequired && (
                          <Badge className="bg-cortex-warning text-white text-xs">
                            Validation Required
                          </Badge>
                        )}
                        {!step.completed && index === 0 || activePath.steps[index - 1]?.completed && (
                          <Badge className="bg-cortex-blue text-white text-xs">
                            In Progress
                          </Badge>
                        )}
                        {!step.completed && index > 0 && !activePath.steps[index - 1]?.completed && (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <i className={getCategoryIcon(step.category) + " mr-1"}></i>
                        {step.category.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {step.estimatedDuration} min
                      </Badge>
                      {step.dependencies.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <i className="fas fa-link mr-1"></i>
                          {step.dependencies.length} dependencies
                        </Badge>
                      )}
                    </div>
                    
                    {/* Progress bar for current step */}
                    {!step.completed && (index === 0 || activePath.steps[index - 1]?.completed) && (
                      <div className="mt-3 bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-cortex-blue h-2 rounded-full transition-all duration-300" 
                          style={{ width: '65%' }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                Next milestone in {activePath.steps.find(s => !s.completed)?.estimatedDuration || 0} minutes
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">
                  Previous Step
                </Button>
                <Button className="bg-cortex-blue hover:bg-blue-700">
                  Continue Training
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
