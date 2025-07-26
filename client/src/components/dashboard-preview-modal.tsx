import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, BarChart3, PieChart, LineChart, Table, Monitor, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: {
    name: string;
    description: string;
    layout: Array<{
      id: string;
      data: Array<{
        key: string;
        data: {
          type: string;
          width: number;
          height: number;
          phrase: string;
          viewOptions: {
            type: string;
            commands: Array<any>;
          };
          time_frame?: {
            relativeTime: number;
          };
        };
      }>;
    }>;
    widgets: Array<{
      widget_key: string;
      title: string;
      description: string;
      data: {
        phrase: string;
        viewOptions: {
          type: string;
          commands: Array<any>;
        };
        time_frame?: {
          relativeTime: number;
        };
      };
    }>;
  };
}

export default function DashboardPreviewModal({ 
  isOpen, 
  onClose, 
  dashboardData 
}: DashboardPreviewModalProps) {
  const [activeWidget, setActiveWidget] = useState<string>(dashboardData.widgets[0]?.widget_key || "");
  const { toast } = useToast();

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "Dashboard JSON copied successfully",
    });
  };

  const getVisualizationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'line': return LineChart;
      case 'pie': return PieChart;
      case 'bar': 
      case 'column': return BarChart3;
      case 'table': return Table;
      default: return Monitor;
    }
  };

  const getVisualizationColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'line': return 'bg-blue-500';
      case 'pie': return 'bg-green-500';
      case 'bar':
      case 'column': return 'bg-purple-500';
      case 'table': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeFrame = (relativeTime?: number) => {
    if (!relativeTime) return 'Default';
    const hours = relativeTime / (1000 * 60 * 60);
    const days = hours / 24;
    
    if (days >= 1) {
      return `${Math.round(days)}d`;
    } else {
      return `${Math.round(hours)}h`;
    }
  };

  const generateDashboardJSON = () => {
    return JSON.stringify({
      dashboards_data: [{
        name: dashboardData.name,
        description: dashboardData.description,
        status: "ENABLED",
        layout: dashboardData.layout.map(row => ({
          id: row.id,
          data: row.data.map(widget => ({
            key: widget.key,
            data: {
              type: widget.data.type,
              width: widget.data.width,
              height: widget.data.height,
              phrase: widget.data.phrase,
              time_frame: widget.data.time_frame,
              viewOptions: widget.data.viewOptions
            }
          }))
        })),
        default_dashboard_id: 1,
        global_id: `dashboard-${Date.now()}`,
        metadata: {
          params: []
        }
      }],
      widgets_data: dashboardData.widgets.map(widget => ({
        widget_key: widget.widget_key,
        title: widget.title,
        creation_time: Date.now(),
        description: widget.description,
        data: widget.data,
        support_time_range: true,
        additional_info: {
          query_tables: ["xdr_data"],
          query_uses_library: false
        },
        creator_mail: "analyst@company.com"
      }))
    }, null, 2);
  };

  const currentWidget = dashboardData.widgets.find(w => w.widget_key === activeWidget);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                {dashboardData.name}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{dashboardData.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{dashboardData.layout.length} rows</Badge>
              <Badge variant="secondary">{dashboardData.widgets.length} widgets</Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard Layout</TabsTrigger>
            <TabsTrigger value="widgets">Widget Details</TabsTrigger>
            <TabsTrigger value="queries">XQL Queries</TabsTrigger>
            <TabsTrigger value="json">JSON Export</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <div className="h-[500px] border rounded-lg bg-gray-100 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {dashboardData.layout.map((row, rowIndex) => (
                    <div key={row.id} className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium mb-3 text-gray-700">Row {rowIndex + 1}</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {row.data.map((widget, widgetIndex) => {
                          const widgetInfo = dashboardData.widgets.find(w => w.widget_key === widget.key);
                          const Icon = getVisualizationIcon(widget.data.viewOptions.type);
                          
                          return (
                            <div 
                              key={widget.key} 
                              className="border rounded-lg p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => setActiveWidget(widget.key)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded ${getVisualizationColor(widget.data.viewOptions.type)} text-white`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-sm">{widgetInfo?.title || `Widget ${widgetIndex + 1}`}</h5>
                                    <p className="text-xs text-gray-500 capitalize">{widget.data.viewOptions.type}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {formatTimeFrame(widget.data.time_frame?.relativeTime)}
                                </Badge>
                              </div>
                              
                              <div className="text-xs text-gray-600 mb-2">
                                {widgetInfo?.description || "Dashboard widget"}
                              </div>
                              
                              <div className="bg-white p-2 rounded border text-xs">
                                <div className="font-mono text-gray-600 truncate">
                                  {widget.data.phrase.split('|')[0].trim()}...
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
              {/* Widget List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Widgets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {dashboardData.widgets.map((widget) => {
                          const Icon = getVisualizationIcon(widget.data.viewOptions.type);
                          const isActive = activeWidget === widget.widget_key;
                          
                          return (
                            <button
                              key={widget.widget_key}
                              onClick={() => setActiveWidget(widget.widget_key)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                                isActive 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : 'hover:bg-gray-50 text-gray-600'
                              }`}
                            >
                              <div className={`p-2 rounded ${getVisualizationColor(widget.data.viewOptions.type)} text-white`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{widget.title}</div>
                                <div className="text-xs text-gray-500 capitalize">{widget.data.viewOptions.type}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Widget Details */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Widget Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {currentWidget ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">{currentWidget.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{currentWidget.description}</p>
                            
                            <div className="flex items-center gap-4 mb-4">
                              <Badge variant="secondary" className="capitalize">
                                {currentWidget.data.viewOptions.type}
                              </Badge>
                              {currentWidget.data.time_frame && (
                                <Badge variant="outline">
                                  {formatTimeFrame(currentWidget.data.time_frame.relativeTime)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium mb-2">XQL Query</h5>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                {currentWidget.data.phrase}
                              </pre>
                            </div>
                          </div>

                          {currentWidget.data.viewOptions.commands.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">View Options</h5>
                              <div className="space-y-2">
                                {currentWidget.data.viewOptions.commands.map((command, index) => (
                                  <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                                    <pre className="text-gray-700 font-mono">
                                      {JSON.stringify(command, null, 2)}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Select a widget to view details</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="queries" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">XQL Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {dashboardData.widgets.map((widget, index) => {
                      const Icon = getVisualizationIcon(widget.data.viewOptions.type);
                      
                      return (
                        <Card key={widget.widget_key} className="border">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded ${getVisualizationColor(widget.data.viewOptions.type)} text-white`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{widget.title}</CardTitle>
                                  <p className="text-sm text-gray-600">{widget.description}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="capitalize">
                                {widget.data.viewOptions.type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                                {widget.data.phrase}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">JSON Export</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(generateDashboardJSON())}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <code>{generateDashboardJSON()}</code>
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