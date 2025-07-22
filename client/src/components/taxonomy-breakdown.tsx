import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Target, 
  Shield, 
  Network, 
  Database, 
  BarChart,
  Download,
  Eye,
  TrendingUp,
  Hash,
  Clock,
  MapPin
} from 'lucide-react';

interface TRAMField {
  name: string;
  type: 'string' | 'array' | 'object' | 'number' | 'date';
  required: boolean;
  description: string;
  values: Set<string>;
  count: number;
}

interface TaxonomyStats {
  totalUseCases: number;
  fieldsPopulated: number;
  totalFields: number;
  completenessScore: number;
  lastUpdated: string;
}

export function TaxonomyBreakdownModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [useCases, setUseCases] = useState<any[]>([]);
  const [taxonomyFields, setTaxonomyFields] = useState<Map<string, TRAMField>>(new Map());
  const [stats, setStats] = useState<TaxonomyStats>({
    totalUseCases: 0,
    fieldsPopulated: 0,
    totalFields: 0,
    completenessScore: 0,
    lastUpdated: new Date().toISOString()
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUseCasesAndAnalyze();
    }
  }, [isOpen]);

  const loadUseCasesAndAnalyze = async () => {
    setProcessing(true);
    try {
      // Load use cases from IndexedDB or localStorage fallback
      let allUseCases: any[] = [];
      
      try {
        const db = await openDB();
        const transaction = db.transaction(['useCases'], 'readonly');
        const store = transaction.objectStore('useCases');
        const request = store.getAll();
        
        // Wait for the request to complete
        await new Promise((resolve, reject) => {
          request.onsuccess = () => {
            allUseCases = request.result || [];
            resolve(request.result);
          };
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.log('IndexedDB not available, using localStorage fallback');
        allUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      }
      
      // Filter to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentUseCases = allUseCases.filter((useCase: any) => 
        new Date(useCase.createdAt || useCase.timestamp) >= thirtyDaysAgo
      );
      
      setUseCases(recentUseCases);
      
      // Analyze taxonomy fields
      const fields = analyzeTaxonomyFields(recentUseCases);
      setTaxonomyFields(fields);
      
      // Calculate statistics
      const taxonomyStats = calculateTaxonomyStats(recentUseCases, fields);
      setStats(taxonomyStats);
      
    } catch (error) {
      console.error('Error loading use cases:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('threatresearchhub-db', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('useCases')) {
          db.createObjectStore('useCases', { keyPath: 'id' });
        }
      };
    });
  };

  const analyzeTaxonomyFields = (useCases: any[]): Map<string, TRAMField> => {
    const fields = new Map<string, TRAMField>();
    
    // Define TRAM-based taxonomy structure
    const tramFields: Omit<TRAMField, 'values' | 'count'>[] = [
      // Report Metadata
      { name: 'report_id', type: 'string', required: true, description: 'Unique identifier for the threat report' },
      { name: 'title', type: 'string', required: true, description: 'Title of the threat report or use case' },
      { name: 'source_url', type: 'string', required: false, description: 'Original URL of the threat intelligence report' },
      { name: 'created_date', type: 'date', required: true, description: 'When the report was processed' },
      { name: 'updated_date', type: 'date', required: false, description: 'Last modification timestamp' },
      { name: 'content_type', type: 'string', required: false, description: 'Type of source (PDF, URL, Feed)' },
      
      // ATT&CK Mapping
      { name: 'technique_ids', type: 'array', required: false, description: 'MITRE ATT&CK technique identifiers' },
      { name: 'sub_technique_ids', type: 'array', required: false, description: 'Granular sub-technique classifications' },
      { name: 'technique_names', type: 'array', required: false, description: 'Human-readable technique names' },
      { name: 'tactics', type: 'array', required: false, description: 'ATT&CK tactic categories' },
      { name: 'confidence_scores', type: 'array', required: false, description: 'ML model confidence levels' },
      
      // Threat Classification
      { name: 'threat_actors', type: 'array', required: false, description: 'Known threat actor groups' },
      { name: 'malware_families', type: 'array', required: false, description: 'Malware variants and families' },
      { name: 'attack_vectors', type: 'array', required: false, description: 'Methods of initial compromise' },
      { name: 'target_industries', type: 'array', required: false, description: 'Targeted industry sectors' },
      { name: 'target_geographies', type: 'array', required: false, description: 'Geographic targeting patterns' },
      
      // Technical Details
      { name: 'cves', type: 'array', required: false, description: 'CVE identifiers referenced' },
      { name: 'affected_technologies', type: 'array', required: false, description: 'Technologies and platforms affected' },
      { name: 'affected_products', type: 'array', required: false, description: 'Specific products mentioned' },
      { name: 'iocs', type: 'array', required: false, description: 'Indicators of Compromise' },
      { name: 'ttps', type: 'array', required: false, description: 'Tactics, Techniques, and Procedures' },
      
      // Severity and Impact
      { name: 'severity_level', type: 'string', required: false, description: 'Critical, High, Medium, Low' },
      { name: 'impact_score', type: 'number', required: false, description: 'Numerical impact assessment' },
      { name: 'exploitability', type: 'string', required: false, description: 'Ease of exploitation' },
      { name: 'prevalence', type: 'string', required: false, description: 'How widespread the threat is' },
      
      // Data Quality
      { name: 'validation_status', type: 'string', required: false, description: 'Validation state of the data' },
      { name: 'completeness_score', type: 'number', required: false, description: 'Percentage of fields populated' },
      { name: 'source_reliability', type: 'string', required: false, description: 'Assessment of source credibility' },
      { name: 'annotation_quality', type: 'number', required: false, description: 'Quality score of annotations' },
      
      // Context and Evidence
      { name: 'evidence_text', type: 'array', required: false, description: 'Supporting text passages' },
      { name: 'context_window', type: 'array', required: false, description: 'Surrounding context for evidence' },
      { name: 'key_findings', type: 'array', required: false, description: 'Main findings from the report' },
      { name: 'recommendations', type: 'array', required: false, description: 'Security recommendations' },
      
      // Training and ML
      { name: 'training_relevance', type: 'string', required: false, description: 'Suitability for training scenarios' },
      { name: 'difficulty_level', type: 'string', required: false, description: 'Beginner, Intermediate, Advanced' },
      { name: 'use_case_category', type: 'string', required: false, description: 'Endpoint, Network, Cloud, Identity' },
      { name: 'simulation_complexity', type: 'string', required: false, description: 'Complexity of lab replication' }
    ];

    // Initialize fields with empty sets and counts
    tramFields.forEach(field => {
      fields.set(field.name, {
        ...field,
        values: new Set<string>(),
        count: 0
      });
    });

    // Analyze actual use case data
    useCases.forEach(useCase => {
      // Process each field
      fields.forEach((field, fieldName) => {
        const value = extractFieldValue(useCase, fieldName);
        if (value !== null && value !== undefined) {
          field.count++;
          
          if (Array.isArray(value)) {
            value.forEach(v => field.values.add(String(v)));
          } else {
            field.values.add(String(value));
          }
        }
      });
    });

    return fields;
  };

  const extractFieldValue = (useCase: any, fieldName: string): any => {
    // Map use case properties to TRAM taxonomy fields
    const mapping: Record<string, string | ((uc: any) => any)> = {
      'report_id': 'id',
      'title': 'title',
      'source_url': 'sourceUrl',
      'created_date': 'createdAt',
      'updated_date': 'updatedAt',
      'content_type': 'contentType',
      'technique_ids': 'mitreAttack',
      'technique_names': (uc) => uc.mitreAttack?.map((t: string) => t.replace(/^T\d+\s*-?\s*/, '')),
      'tactics': 'tactics',
      'threat_actors': 'threatActors',
      'malware_families': 'malware',
      'attack_vectors': 'attackVectors',
      'target_industries': 'industries',
      'target_geographies': 'geographies',
      'cves': 'cves',
      'affected_technologies': 'technologies',
      'affected_products': 'products',
      'iocs': 'iocs',
      'severity_level': 'severity',
      'impact_score': (uc) => uc.severity === 'Critical' ? 9 : uc.severity === 'High' ? 7 : uc.severity === 'Medium' ? 5 : 3,
      'use_case_category': 'category',
      'key_findings': 'description',
      'difficulty_level': (uc) => uc.difficulty || 'Intermediate'
    };

    const mapper = mapping[fieldName];
    if (!mapper) return null;

    if (typeof mapper === 'function') {
      return mapper(useCase);
    } else {
      return useCase[mapper];
    }
  };

  const calculateTaxonomyStats = (useCases: any[], fields: Map<string, TRAMField>): TaxonomyStats => {
    const totalUseCases = useCases.length;
    const totalFields = fields.size;
    
    let fieldsPopulated = 0;
    fields.forEach(field => {
      if (field.count > 0) fieldsPopulated++;
    });

    const completenessScore = totalFields > 0 ? (fieldsPopulated / totalFields) * 100 : 0;

    return {
      totalUseCases,
      fieldsPopulated,
      totalFields,
      completenessScore,
      lastUpdated: new Date().toISOString()
    };
  };

  const getFieldsByCategory = (category: string): TRAMField[] => {
    const categories: Record<string, string[]> = {
      'metadata': ['report_id', 'title', 'source_url', 'created_date', 'updated_date', 'content_type'],
      'attack': ['technique_ids', 'sub_technique_ids', 'technique_names', 'tactics', 'confidence_scores'],
      'threat': ['threat_actors', 'malware_families', 'attack_vectors', 'target_industries', 'target_geographies'],
      'technical': ['cves', 'affected_technologies', 'affected_products', 'iocs', 'ttps'],
      'impact': ['severity_level', 'impact_score', 'exploitability', 'prevalence'],
      'quality': ['validation_status', 'completeness_score', 'source_reliability', 'annotation_quality'],
      'context': ['evidence_text', 'context_window', 'key_findings', 'recommendations'],
      'training': ['training_relevance', 'difficulty_level', 'use_case_category', 'simulation_complexity']
    };

    const fieldNames = category === 'all' 
      ? Array.from(taxonomyFields.keys())
      : categories[category] || [];

    return fieldNames
      .map(name => taxonomyFields.get(name))
      .filter(field => field !== undefined) as TRAMField[];
  };

  const exportTaxonomy = (format: 'json' | 'csv') => {
    const data = Array.from(taxonomyFields.entries()).map(([name, field]) => ({
      field_name: name,
      field_type: field.type,
      required: field.required,
      description: field.description,
      unique_values: field.values.size,
      populated_count: field.count,
      coverage_percentage: stats.totalUseCases > 0 ? (field.count / stats.totalUseCases * 100).toFixed(1) : '0',
      sample_values: Array.from(field.values).slice(0, 5).join('; ')
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tram-taxonomy-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tram-taxonomy-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">TRAM-Based Taxonomy Breakdown</h2>
              <p className="text-gray-600">Standardized threat intelligence field analysis for last 30 days</p>
            </div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {processing ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Analyzing taxonomy fields...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.totalUseCases}</p>
                        <p className="text-sm text-gray-600">Use Cases (30d)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.fieldsPopulated}</p>
                        <p className="text-sm text-gray-600">Fields Populated</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BarChart className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.completenessScore.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">Completeness</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.totalFields}</p>
                        <p className="text-sm text-gray-600">Total Fields</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Taxonomy</CardTitle>
                  <CardDescription>Download standardized field analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => exportTaxonomy('json')} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button onClick={() => exportTaxonomy('csv')} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Field Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Field Analysis by Category</CardTitle>
                  <CardDescription>TRAM-standardized taxonomy breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      <TabsTrigger value="attack">ATT&CK</TabsTrigger>
                      <TabsTrigger value="threat">Threats</TabsTrigger>
                      <TabsTrigger value="technical">Technical</TabsTrigger>
                      <TabsTrigger value="impact">Impact</TabsTrigger>
                      <TabsTrigger value="quality">Quality</TabsTrigger>
                      <TabsTrigger value="training">Training</TabsTrigger>
                    </TabsList>

                    <TabsContent value={selectedCategory} className="mt-6">
                      <div className="space-y-4">
                        {getFieldsByCategory(selectedCategory).map((field) => (
                          <div key={field.name} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                                {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                <Badge variant="outline" className="text-xs">{field.type}</Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {field.count}/{stats.totalUseCases} ({stats.totalUseCases > 0 ? ((field.count / stats.totalUseCases) * 100).toFixed(1) : 0}%)
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{field.description}</p>
                            
                            <div className="mb-3">
                              <Progress 
                                value={stats.totalUseCases > 0 ? (field.count / stats.totalUseCases) * 100 : 0} 
                                className="h-2"
                              />
                            </div>
                            
                            {field.values.size > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Sample Values ({field.values.size} unique):</p>
                                <div className="flex flex-wrap gap-1">
                                  {Array.from(field.values).slice(0, 8).map((value, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {value.length > 20 ? value.substring(0, 20) + '...' : value}
                                    </Badge>
                                  ))}
                                  {field.values.size > 8 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{field.values.size - 8} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* TRAM Integration Info */}
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  This taxonomy follows TRAM (Threat Report ATT&CK Mapping) standards for consistent threat intelligence processing. 
                  Fields are mapped to MITRE ATT&CK techniques and standardized for automated analysis.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}