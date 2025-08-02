import SequentialWorkflowManager from "@/components/sequential-workflow-manager";
import { useToast } from "@/hooks/use-toast";

export default function SequentialWorkflowPage() {
  const { toast } = useToast();

  const handleWorkflowComplete = (results: any) => {
    console.log('Workflow completed with results:', results);
    
    // Save to localStorage for persistence
    localStorage.setItem('completedWorkflow', JSON.stringify({
      ...results,
      completedAt: new Date().toISOString()
    }));

    toast({
      title: "Workflow Complete!",
      description: "Your security platform enablement workflow has been completed successfully."
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Platform Enablement Workflow</h1>
          <p className="text-muted-foreground mt-2">
            Complete end-to-end workflow from threat intelligence to deployed security content across your selected platforms with clear step-by-step instructions
          </p>
        </div>
        
        <SequentialWorkflowManager onWorkflowComplete={handleWorkflowComplete} />
      </div>
    </div>
  );
}