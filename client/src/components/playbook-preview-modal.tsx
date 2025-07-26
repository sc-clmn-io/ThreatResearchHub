import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Play, FileText, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlaybookPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  playbookData: {
    name: string;
    description: string;
    version: string;
    tasks: Array<{
      id: string;
      name: string;
      type: string;
      description?: string;
      scriptarguments?: Record<string, any>;
      nexttasks?: Record<string, string[]>;
    }>;
    inputs?: Array<{
      key: string;
      value: string;
      required: boolean;
      description: string;
    }>;
    outputs?: Array<{
      key: string;
      description: string;
      type: string;
    }>;
  };
}

export default function PlaybookPreviewModal({ 
  isOpen, 
  onClose, 
  playbookData 
}: PlaybookPreviewModalProps) {
  const [activeTask, setActiveTask] = useState<string>(playbookData.tasks[0]?.id || "0");
  const { toast } = useToast();

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "Playbook YAML copied successfully",
    });
  };

  const getTaskTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'start': return 'bg-green-500';
      case 'regular': return 'bg-blue-500';
      case 'condition': return 'bg-yellow-500';
      case 'playbook': return 'bg-purple-500';
      case 'title': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const generatePlaybookYAML = () => {
    return `id: ${playbookData.name}
version: ${playbookData.version}
name: ${playbookData.name}
description: |
  ${playbookData.description}

starttaskid: "0"
tasks:
${playbookData.tasks.map(task => `  "${task.id}":
    id: "${task.id}"
    type: ${task.type}
    task:
      name: "${task.name}"
      description: ${task.description ? `"${task.description}"` : '""'}
      iscommand: ${task.type === 'regular' ? 'true' : 'false'}
    ${task.nexttasks ? `nexttasks:
      ${Object.entries(task.nexttasks).map(([key, values]) => 
        `${key}:\n      ${values.map(v => `- "${v}"`).join('\n      ')}`
      ).join('\n      ')}` : ''}
    separatecontext: false`).join('\n')}

inputs:
${playbookData.inputs?.map(input => `- key: ${input.key}
  value: ${input.value}
  required: ${input.required}
  description: ${input.description}`).join('\n') || '[]'}

outputs:
${playbookData.outputs?.map(output => `- contextPath: ${output.key}
  description: ${output.description}
  type: ${output.type}`).join('\n') || '[]'}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                {playbookData.name}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{playbookData.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">v{playbookData.version}</Badge>
              <Badge variant="secondary">{playbookData.tasks.length} tasks</Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="workflow" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="tasks">Task Details</TabsTrigger>
            <TabsTrigger value="inputs">Inputs/Outputs</TabsTrigger>
            <TabsTrigger value="yaml">YAML Export</TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
              {/* Workflow Visualization */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Workflow Visualization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {playbookData.tasks.map((task, index) => (
                          <div key={task.id} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${getTaskTypeColor(task.type)} flex items-center justify-center text-white text-xs font-bold`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div 
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  activeTask === task.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setActiveTask(task.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{task.name}</h4>
                                    <p className="text-sm text-gray-600 capitalize">{task.type}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {task.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {index < playbookData.tasks.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Task Details */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {(() => {
                        const task = playbookData.tasks.find(t => t.id === activeTask);
                        if (!task) return <div>Select a task to view details</div>;
                        
                        return (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">{task.name}</h4>
                              <Badge variant="secondary" className="mb-2 capitalize">
                                {task.type}
                              </Badge>
                              {task.description && (
                                <p className="text-sm text-gray-600">{task.description}</p>
                              )}
                            </div>
                            
                            {task.scriptarguments && (
                              <div>
                                <h5 className="font-medium mb-2">Arguments</h5>
                                <div className="space-y-2">
                                  {Object.entries(task.scriptarguments).map(([key, value]) => (
                                    <div key={key} className="p-2 bg-gray-50 rounded text-xs">
                                      <div className="font-medium">{key}:</div>
                                      <div className="text-gray-600 mt-1">
                                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {task.nexttasks && (
                              <div>
                                <h5 className="font-medium mb-2">Next Tasks</h5>
                                <div className="space-y-1">
                                  {Object.entries(task.nexttasks).map(([condition, taskIds]) => (
                                    <div key={condition} className="text-xs">
                                      <span className="font-medium">{condition}:</span>
                                      <span className="ml-2 text-gray-600">
                                        {Array.isArray(taskIds) ? taskIds.join(', ') : taskIds}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {playbookData.tasks.map((task, index) => (
                      <Card key={task.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full ${getTaskTypeColor(task.type)} flex items-center justify-center text-white text-xs font-bold`}>
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{task.name}</h4>
                                <Badge variant="outline" className="text-xs capitalize mt-1">
                                  {task.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          )}
                          {task.scriptarguments && (
                            <div className="text-xs text-gray-500">
                              <strong>Arguments:</strong> {Object.keys(task.scriptarguments).join(', ')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inputs" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inputs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {playbookData.inputs && playbookData.inputs.length > 0 ? (
                      <div className="space-y-3">
                        {playbookData.inputs.map((input, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{input.key}</h4>
                              {input.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{input.description}</p>
                            <p className="text-xs text-gray-500">Default: {input.value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No inputs defined
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Outputs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {playbookData.outputs && playbookData.outputs.length > 0 ? (
                      <div className="space-y-3">
                        {playbookData.outputs.map((output, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{output.key}</h4>
                              <Badge variant="secondary" className="text-xs">{output.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{output.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No outputs defined
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="yaml" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">YAML Export</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(generatePlaybookYAML())}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy YAML
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <code>{generatePlaybookYAML()}</code>
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}