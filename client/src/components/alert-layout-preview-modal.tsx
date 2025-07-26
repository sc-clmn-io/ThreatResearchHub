import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Layout, FileText, Monitor, Grid, List, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DataSourceAlertLayouts from "./data-source-alert-layouts";

interface AlertLayoutPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDataSource?: string;
  layoutData: {
    name: string;
    description: string;
    tabs: Array<{
      id: string;
      name: string;
      type: string;
      sections?: Array<{
        displayType: string;
        items: Array<{
          fieldId: string;
          height: number;
          startCol: number;
          endCol: number;
          sectionItemType: string;
        }>;
      }>;
    }>;
    fields: Array<{
      fieldId: string;
      displayName: string;
      type: string;
      description: string;
    }>;
  };
}

export default function AlertLayoutPreviewModal({ 
  isOpen, 
  onClose, 
  selectedDataSource = 'windows_defender',
  layoutData 
}: AlertLayoutPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<string>(layoutData.tabs[0]?.id || "summary");
  const [viewMode, setViewMode] = useState<'preview' | 'structure'>('preview');
  const { toast } = useToast();

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "Alert layout JSON copied successfully",
    });
  };

  const generateLayoutJSON = () => {
    return JSON.stringify({
      cacheVersn: 0,
      close: null,
      definitionId: "",
      description: layoutData.description,
      detached: false,
      details: null,
      detailsV2: {
        TypeName: "",
        tabs: layoutData.tabs.map(tab => ({
          id: tab.id,
          name: tab.name,
          type: tab.type,
          sections: tab.sections?.map(section => ({
            displayType: section.displayType,
            h: 2,
            isVisible: true,
            items: section.items.map(item => ({
              endCol: item.endCol,
              fieldId: item.fieldId,
              height: item.height,
              id: `${item.fieldId}-field`,
              index: 0,
              sectionItemType: item.sectionItemType,
              startCol: item.startCol
            }))
          })) || []
        }))
      },
      edit: null,
      fromServerVersion: "6.0.0",
      group: 0,
      id: layoutData.name.toLowerCase().replace(/\s+/g, '-'),
      itemVersion: "1.0.0",
      kind: "",
      locked: false,
      name: layoutData.name,
      packID: "CustomLayouts",
      packName: "Custom Layouts",
      system: false,
      toServerVersion: "",
      version: -1
    }, null, 2);
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'url': return '🔗';
      case 'ip': return '🌐';
      case 'email': return '📧';
      case 'user': return '👤';
      case 'boolean': return '☑️';
      default: return '📄';
    }
  };

  const currentTab = layoutData.tabs.find(tab => tab.id === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-purple-600" />
                {layoutData.name}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{layoutData.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{layoutData.tabs.length} tabs</Badge>
              <Badge variant="secondary">{layoutData.fields.length} fields</Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="preview">Layout Preview</TabsTrigger>
            <TabsTrigger value="scripts">Python Scripts</TabsTrigger>
            <TabsTrigger value="structure">Tab Structure</TabsTrigger>
            <TabsTrigger value="fields">Field Mapping</TabsTrigger>
            <TabsTrigger value="json">JSON Export</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <div className="h-[500px] border rounded-lg bg-white">
              {/* Tab Navigation */}
              <div className="border-b bg-gray-50 p-2">
                <div className="flex gap-1">
                  {layoutData.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 text-sm rounded transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                <ScrollArea className="h-[400px]">
                  {currentTab && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">{currentTab.name}</h3>
                      
                      {currentTab.sections && currentTab.sections.length > 0 ? (
                        <div className="space-y-6">
                          {currentTab.sections.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="border rounded-lg p-4 bg-gray-50">
                              <h4 className="font-medium mb-3 text-gray-700">
                                Section {sectionIndex + 1} ({section.displayType})
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {section.items.map((item, itemIndex) => {
                                  const field = layoutData.fields.find(f => f.fieldId === item.fieldId);
                                  return (
                                    <div key={itemIndex} className="border border-gray-200 rounded p-3 bg-white">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{getFieldTypeIcon(field?.type || 'text')}</span>
                                        <span className="font-medium text-sm">
                                          {field?.displayName || item.fieldId}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500 mb-2">
                                        {field?.description || `Field: ${item.fieldId}`}
                                      </div>
                                      <div className="bg-gray-100 p-2 rounded text-xs">
                                        <div className="text-gray-600">Sample Value</div>
                                        <div className="font-mono">
                                          {field?.type === 'date' ? '2025-01-15 10:30:00' :
                                           field?.type === 'ip' ? '192.168.1.100' :
                                           field?.type === 'number' ? '42' :
                                           field?.type === 'email' ? 'analyst@company.com' :
                                           field?.type === 'user' ? 'john.doe' :
                                           field?.type === 'boolean' ? 'true' :
                                           'Sample text value'}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No sections defined for this tab</p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scripts" className="mt-4">
            <DataSourceAlertLayouts dataSource={selectedDataSource} />
          </TabsContent>

          <TabsContent value="original-scripts" className="mt-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Required Python Automation Scripts
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Windows Defender alert layouts require specific automation scripts for MDE API integration and XSIAM-based investigation workflows.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* APT29 Process Analysis Script */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            MDE Host Context
                          </Badge>
                          <span className="font-mono text-sm text-gray-600">displayDefenderHostRecord_xsiam</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          Pulls current machine details from Microsoft Defender for Endpoint API to enrich alert context
                        </p>
                        <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                          <div className="text-gray-600 mb-2"># Based on your uploaded script pattern:</div>
                          <div>context_data = demisto.alert()</div>
                          <div>agent_id = context_data['CustomFields']['agentid']</div>
                          <div>host_context = execute_command('microsoft-atp-get-machine-details', {'{'}'machine_id': agent_id{'}'})</div>
                          <div>html_record = json_to_html_table(host_context[0])</div>
                          <div>return_results({'{'}'ContentsFormat': EntryFormat.HTML, 'Contents': html_record{'}'})</div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          <strong>MDE Commands:</strong> microsoft-atp-get-machine-details, microsoft-atp-get-machine-actions
                        </div>
                        <div className="mt-2 text-xs text-blue-600">
                          <strong>Investigation Focus:</strong> Machine risk score, health status, last seen, IP addresses, OS platform
                        </div>
                      </CardContent>
                    </Card>

                    {/* MDE Evidence Script */}
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            MDE Alert Evidence
                          </Badge>
                          <span className="font-mono text-sm text-gray-600">displayDefenderEvidence_xsiam</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          Displays Microsoft Graph security alert evidence in formatted HTML table for investigation
                        </p>
                        <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                          <div className="text-gray-600 mb-2"># Exact pattern from your uploaded script:</div>
                          <div>context_data = demisto.alert()</div>
                          <div>evidence = context_data['CustomFields']['microsoftgraphsecurityalertevidence']</div>
                          <div>table = json_array_to_html_table(evidence)</div>
                          <div>return_results({'{'}'ContentsFormat': EntryFormat.HTML, 'Contents': table{'}'})</div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          <strong>XSIAM Investigation:</strong> Review evidence artifacts, file hashes, registry keys, network indicators
                        </div>
                        <div className="mt-2 text-xs text-green-600">
                          <strong>Triage Steps:</strong> Check @odata.type fields, correlate with timeline, pivot on IOCs
                        </div>
                      </CardContent>
                    </Card>

                    {/* MDE Host Status Script */}
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            MDE Host Status
                          </Badge>
                          <span className="font-mono text-sm text-gray-600">displayDefenderHostStatus_xsiam</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          Shows current MDE status, risk score, isolation state, and recent XSIAM actions on the endpoint
                        </p>
                        <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                          <div className="text-gray-600 mb-2"># Host status from your uploaded script:</div>
                          <div>host_record = execute_command('microsoft-atp-get-machine-details', {'{'}'machine_id': agent_id{'}'})</div>
                          <div>risk_score = host_record[0]['riskScore']</div>
                          <div>health_status = host_record[0]['healthStatus']</div>
                          <div>last_action = full_context['MicrosoftATP']['MachineAction'][-1]['Type']</div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          <strong>XSIAM Investigation:</strong> Check isolation status, review machine actions history
                        </div>
                        <div className="mt-2 text-xs text-orange-600">
                          <strong>Triage Decision:</strong> High risk = isolate, Medium = monitor, Active status = investigate
                        </div>
                      </CardContent>
                    </Card>

                    {/* MDE Response Actions Script */}
                    <Card className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            MDE Response Actions
                          </Badge>
                          <span className="font-mono text-sm text-gray-600">defenderResponseActions_xsiam</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          One-click MDE response actions directly from XSIAM alert layout: isolate, collect files, run antivirus scan
                        </p>
                        <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                          <div className="text-gray-600 mb-2"># XSIAM-to-MDE response integration:</div>
                          <div>if action == "isolate":</div>
                          <div className="ml-4">execute_command('microsoft-atp-isolate-machine', {'{'}'machine_id': agent_id{'}'})</div>
                          <div>elif action == "collect_package":</div>
                          <div className="ml-4">execute_command('microsoft-atp-collect-investigation-package', {'{'}'machine_id': agent_id{'}'})</div>
                          <div>elif action == "run_scan":</div>
                          <div className="ml-4">execute_command('microsoft-atp-run-antivirus-scan', {'{'}'machine_id': agent_id{'}'})</div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          <strong>MDE Actions:</strong> microsoft-atp-isolate-machine, microsoft-atp-unisolate-machine, microsoft-atp-collect-investigation-package
                        </div>
                        <div className="mt-2 text-xs text-red-600">
                          <strong>XSIAM Workflow:</strong> Click button → Execute MDE API → Update machine status → Track in incident
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Windows Defender XSIAM Investigation Workflow</span>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div><strong>1. Context Analysis:</strong> Extract <code>agentid</code> and <code>microsoftgraphsecurityalertevidence</code> from alert</div>
                      <div><strong>2. Host Enrichment:</strong> Use <code>microsoft-atp-get-machine-details</code> for current state</div>
                      <div><strong>3. Evidence Review:</strong> Parse JSON evidence arrays with <code>json_array_to_html_table()</code></div>
                      <div><strong>4. Triage Decision:</strong> Risk score (High/Medium/Low) determines response actions</div>
                      <div><strong>5. Response Execution:</strong> One-click isolation, investigation package collection, AV scans</div>
                      <div><strong>6. Stay in Platform:</strong> All actions through XSIAM → MDE API integration</div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-800">XSIAM-Specific Investigation Steps</span>
                    </div>
                    <div className="text-sm text-orange-700 space-y-1">
                      <div><strong>High Risk Machine:</strong> Immediate isolation → collect forensics → timeline analysis</div>
                      <div><strong>Medium Risk:</strong> Enhanced monitoring → user behavior analysis → network segmentation check</div>
                      <div><strong>Evidence Artifacts:</strong> Check @odata.type fields, correlate file hashes with threat intel</div>
                      <div><strong>Pivot Points:</strong> Use IOCs from evidence to query XDR datasets for lateral movement</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tab Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {layoutData.tabs.map((tab, tabIndex) => (
                      <Card key={tab.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {tabIndex + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{tab.name}</h4>
                              <Badge variant="outline" className="text-xs capitalize mt-1">
                                {tab.type}
                              </Badge>
                            </div>
                          </div>

                          {tab.sections && tab.sections.length > 0 && (
                            <div className="ml-11 space-y-3">
                              <h5 className="font-medium text-sm text-gray-700">Sections:</h5>
                              {tab.sections.map((section, sectionIndex) => (
                                <div key={sectionIndex} className="border-l-2 border-gray-200 pl-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Grid className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium">
                                      Section {sectionIndex + 1} ({section.displayType})
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {section.items.map((item, itemIndex) => (
                                      <div key={itemIndex} className="text-xs text-gray-600 flex items-center gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>{item.fieldId}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {item.sectionItemType}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
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

          <TabsContent value="fields" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Definitions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {layoutData.fields.map((field, index) => (
                      <Card key={index} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getFieldTypeIcon(field.type)}</span>
                              <div>
                                <h4 className="font-medium">{field.displayName}</h4>
                                <p className="text-sm text-gray-600 font-mono">{field.fieldId}</p>
                                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="capitalize">
                              {field.type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                    onClick={() => copyToClipboard(generateLayoutJSON())}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <code>{generateLayoutJSON()}</code>
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