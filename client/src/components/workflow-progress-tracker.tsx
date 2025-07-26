import React from 'react';
import { Check, Circle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  href: string;
  completedCount?: number;
  totalCount?: number;
}

interface WorkflowProgressTrackerProps {
  steps: WorkflowStep[];
  currentStep?: string;
}

const WorkflowProgressTracker: React.FC<WorkflowProgressTrackerProps> = ({ 
  steps, 
  currentStep 
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-blue-600" />
          5-Step Workflow: Threat Report → XSIAM Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                step.status === 'completed' 
                  ? 'bg-green-50 border-green-200' 
                  : step.status === 'current'
                  ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Step Number/Status Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed'
                  ? 'bg-green-600 text-white'
                  : step.status === 'current'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  step.status === 'completed' 
                    ? 'text-green-800'
                    : step.status === 'current'
                    ? 'text-blue-800'
                    : 'text-gray-600'
                }`}>
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                
                {/* Progress indicator for completed steps */}
                {step.completedCount !== undefined && step.totalCount !== undefined && (
                  <div className="mt-2 text-xs text-gray-500">
                    Progress: {step.completedCount}/{step.totalCount} items completed
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                <Link href={step.href}>
                  <Button 
                    variant={step.status === 'current' ? 'default' : 'outline'}
                    size="sm"
                    className={step.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {step.status === 'completed' ? 'Review' : 
                     step.status === 'current' ? 'Continue' : 'Start'}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Getting Started Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>New users:</strong> Start with Step 1 to load your first threat report</li>
            <li>• <strong>Have data?</strong> Use the PII Sanitizer to clean sensitive information first</li>
            <li>• <strong>Need help?</strong> Check the User Guide for complete documentation</li>
            <li>• <strong>Advanced users:</strong> Use bulk processing to handle multiple threat reports</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowProgressTracker;