import { useState, useEffect } from "react";
import { GraduationCap, X, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useTrainingPaths, useSaveTrainingPath, useProgressTracking, useSaveProgress, useSaveValidationItem } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { validateTrainingStep } from "@/lib/training-generator";
import type { TrainingPath, TrainingStep, ProgressTracking, ValidationItem } from "@shared/schema";

interface TrainingModalProps {
  trainingPathId: string;
  onClose: () => void;
}

export default function TrainingModal({ trainingPathId, onClose }: TrainingModalProps) {
  const { data: trainingPaths = [] } = useTrainingPaths();
  const { data: progressData = [] } = useProgressTracking(trainingPathId);
  const saveTrainingPath = useSaveTrainingPath();
  const saveProgress = useSaveProgress();
  const saveValidationItem = useSaveValidationItem();
  const { toast } = useToast();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  
  const trainingPath = trainingPaths.find(p => p.id === trainingPathId);
  
  useEffect(() => {
    if (!trainingPath) return;
    
    // Find the first incomplete step
    const firstIncompleteIndex = trainingPath.steps.findIndex(step => !step.completed);
    if (firstIncompleteIndex !== -1) {
      setCurrentStepIndex(firstIncompleteIndex);
    }
  }, [trainingPath]);

  if (!trainingPath) {
    return null;
  }

  const currentStep = trainingPath.steps[currentStepIndex];
  const completedSteps = trainingPath.steps.filter(step => step.completed).length;
  const progressPercentage = Math.round((completedSteps / trainingPath.steps.length) * 100);

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < trainingPath.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleCompleteStep = async () => {
    if (!currentStep) return;

    try {
      // Validate step if required
      if (currentStep.validationRequired) {
        const validation = validateTrainingStep(currentStep, {
          completedSteps: trainingPath.steps.filter(s => s.completed).map(s => s.id)
        });

        if (!validation.isValid) {
          // Create validation item for manual review
          const validationItem: ValidationItem = {
            id: `validation_${Date.now()}`,
            type: 'training_step',
            entityId: currentStep.id,
            title: `Step Validation: ${currentStep.title}`,
            description: validation.issues.join('; '),
            status: 'pending',
            comments: validation.recommendations.join('\n'),
            createdAt: new Date()
          };

          await saveValidationItem.mutateAsync(validationItem);

          toast({
            title: "Validation Required",
            description: "This step has been queued for validation review.",
            variant: "destructive"
          });
          return;
        }
      }

      // Mark step as completed
      const updatedStep: TrainingStep = {
        ...currentStep,
        completed: true
      };

      const updatedSteps = trainingPath.steps.map(step => 
        step.id === currentStep.id ? updatedStep : step
      );

      const newProgress = Math.round(((completedSteps + 1) / trainingPath.steps.length) * 100);
      const newStatus = newProgress === 100 ? 'completed' : 'in_progress';

      const updatedPath: TrainingPath = {
        ...trainingPath,
        steps: updatedSteps,
        progress: newProgress,
        status: newStatus,
        updatedAt: new Date()
      };

      await saveTrainingPath.mutateAsync(updatedPath);

      // Save progress tracking
      const progressEntry: ProgressTracking = {
        id: `progress_${Date.now()}`,
        trainingPathId: trainingPath.id,
        stepId: currentStep.id,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        timeSpent: currentStep.estimatedDuration,
        notes: stepNotes[currentStep.id] || undefined
      };

      await saveProgress.mutateAsync(progressEntry);

      toast({
        title: "Step Completed",
        description: `${currentStep.title} has been marked as complete.`,
      });

      // Move to next step if available
      if (currentStepIndex < trainingPath.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } catch (error) {
      toast({
        title: "Completion Failed",
        description: "Failed to complete step. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSkipStep = async () => {
    if (!currentStep) return;

    try {
      const progressEntry: ProgressTracking = {
        id: `progress_${Date.now()}`,
        trainingPathId: trainingPath.id,
        stepId: currentStep.id,
        status: 'skipped',
        startedAt: new Date(),
        completedAt: new Date(),
        timeSpent: 0,
        notes: stepNotes[currentStep.id] || 'Step skipped by user'
      };

      await saveProgress.mutateAsync(progressEntry);

      toast({
        title: "Step Skipped",
        description: `${currentStep.title} has been skipped.`,
      });

      // Move to next step
      if (currentStepIndex < trainingPath.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } catch (error) {
      toast({
        title: "Skip Failed",
        description: "Failed to skip step. Please try again.",
        variant: "destructive"
      });
    }
  };

  const canCompleteStep = () => {
    if (!currentStep) return false;
    
    // Check dependencies
    if (currentStep.dependencies.length > 0) {
      const uncompletedDeps = currentStep.dependencies.filter(depId => 
        !trainingPath.steps.find(s => s.id === depId)?.completed
      );
      return uncompletedDeps.length === 0;
    }
    
    return true;
  };

  const formatContent = (content: string) => {
    // Convert markdown-like content to JSX
    return content.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h3 key={index} className="text-lg font-medium text-cortex-dark mb-2 mt-4">{line.slice(3)}</h3>;
      } else if (line.startsWith('### ')) {
        return <h4 key={index} className="text-md font-medium text-cortex-dark mb-2 mt-3">{line.slice(4)}</h4>;
      } else if (line.startsWith('```')) {
        return null; // Handle code blocks separately
      } else if (line.trim().startsWith('- ')) {
        return <li key={index} className="ml-4 text-sm text-gray-700">{line.slice(2)}</li>;
      } else if (line.trim()) {
        return <p key={index} className="text-sm text-gray-700 mb-2">{line}</p>;
      }
      return <br key={index} />;
    });
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GraduationCap className="text-cortex-blue text-xl mr-3" />
              <DialogTitle className="text-xl font-medium text-cortex-dark">
                {trainingPath.title}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Step {currentStepIndex + 1} of {trainingPath.steps.length}</span>
                <span className="text-cortex-blue">{progressPercentage}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {currentStep?.estimatedDuration || 0} min
            </Badge>
          </div>
        </DialogHeader>

        {currentStep && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Step header */}
            <div className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-cortex-dark">{currentStep.title}</h2>
                <div className="flex items-center space-x-2">
                  {currentStep.completed && (
                    <Badge className="bg-cortex-success text-white text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  {currentStep.validationRequired && (
                    <Badge className="bg-cortex-warning text-white text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Validation Required
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">{currentStep.description}</p>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="prose max-w-none text-sm">
                {formatContent(currentStep.content)}
              </div>
            </div>

            {/* Notes section */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Notes
              </label>
              <Textarea
                placeholder="Add your notes, observations, or questions about this training step..."
                value={stepNotes[currentStep.id] || ''}
                onChange={(e) => setStepNotes(prev => ({
                  ...prev,
                  [currentStep.id]: e.target.value
                }))}
                className="text-sm min-h-20"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                Estimated completion: {currentStep.estimatedDuration} minutes
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStepIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                {!currentStep.completed && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSkipStep}
                      className="text-gray-600"
                    >
                      Skip Step
                    </Button>
                    
                    <Button
                      onClick={handleCompleteStep}
                      disabled={!canCompleteStep() || saveTrainingPath.isPending}
                      className="bg-cortex-success hover:bg-green-700"
                    >
                      {saveTrainingPath.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Complete Step
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={handleNextStep}
                  disabled={currentStepIndex === trainingPath.steps.length - 1}
                  className="bg-cortex-blue hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
