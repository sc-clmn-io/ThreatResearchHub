import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download, Star, MessageCircle, Share2, Filter, Search, Eye, Upload, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import CreateTemplateModal from "@/components/create-template-modal";
import TemplateDetailModal from "@/components/template-detail-modal";
import { SharedTemplate } from "@shared/schema";

export default function TemplateSharing() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<SharedTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch shared templates from localStorage for now (will be database later)
  const { data: templates = [], isLoading } = useQuery<SharedTemplate[]>({
    queryKey: ["templates"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem('sharedTemplates');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });

  // Download template mutation
  const downloadTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      // Add template data to use cases
      const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
      const templateUseCase = (template.templateData as any)?.useCase;
      
      if (templateUseCase) {
        const newUseCase = {
          ...templateUseCase,
          id: `template-${Date.now()}`,
          title: `${templateUseCase.title} (from template)`,
          source: `Template by ${template.authorName}`,
          url: '',
          extractedAt: new Date().toISOString(),
        };
        existingUseCases.push(newUseCase);
        localStorage.setItem('useCases', JSON.stringify(existingUseCases));
      }
      
      // Increment download count
      const updatedTemplates = templates.map(t => 
        t.id === templateId 
          ? { ...t, downloadCount: t.downloadCount + 1 }
          : t
      );
      localStorage.setItem('sharedTemplates', JSON.stringify(updatedTemplates));
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Template Downloaded",
        description: "Template has been added to your use cases",
      });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || template.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'endpoint': return '🖥️';
      case 'network': return '🌐';
      case 'cloud': return '☁️';
      case 'identity': return '👤';
      default: return '📄';
    }
  };

  const getAverageRating = (template: SharedTemplate) => {
    if (template.ratingCount === 0) return 0;
    return Math.round((template.ratingSum / template.ratingCount) * 10) / 10;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Template Sharing Hub</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600">Discover, share, and collaborate on training templates with the security community</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-cortex-blue hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share Template
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates, tags, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="endpoint">Endpoint</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="cloud">Cloud</SelectItem>
                <SelectItem value="identity">Identity</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cortex-blue mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter !== "all" || difficultyFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "Be the first to share a training template"}
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-cortex-blue hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Share First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCategoryIcon(template.category)}</span>
                      <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {template.category}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                    {template.description}
                  </p>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        {renderStars(getAverageRating(template))}
                        <span className="text-xs">
                          ({template.ratingCount})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>{template.downloadCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="text-xs text-gray-500 mb-4">
                    By {template.authorName}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => downloadTemplate.mutate(template.id)}
                      disabled={downloadTemplate.isPending}
                      className="flex-1 bg-cortex-blue hover:bg-blue-700"
                    >
                      {downloadTemplate.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1" />
                          Use
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateTemplateModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {selectedTemplate && (
          <TemplateDetailModal
            template={selectedTemplate}
            open={!!selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
          />
        )}
      </div>
    </div>
  );
}