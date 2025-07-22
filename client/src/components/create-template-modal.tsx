import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Upload } from "lucide-react";
import { insertSharedTemplateSchema, type InsertSharedTemplate } from "@shared/schema";
import { z } from "zod";

interface CreateTemplateModalProps {
  open: boolean;
  onClose: () => void;
}

const formSchema = insertSharedTemplateSchema.extend({
  tags: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateTemplateModal({ open, onClose }: CreateTemplateModalProps) {
  const { toast } = useToast();
  const [newTag, setNewTag] = useState("");
  const [selectedUseCase, setSelectedUseCase] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "endpoint",
      difficulty: "beginner",
      authorName: "",
      authorEmail: "",
      tags: [],
      templateData: {},
      isPublic: true,
    },
  });

  // Get existing use cases for template creation
  const existingUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');

  const createTemplate = useMutation({
    mutationFn: async (data: FormData) => {
      // Store in localStorage for now (will be database later)
      const existingTemplates = JSON.parse(localStorage.getItem('sharedTemplates') || '[]');
      const newTemplate = {
        ...data,
        id: `template-${Date.now()}`,
        downloadCount: 0,
        ratingSum: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      existingTemplates.push(newTemplate);
      localStorage.setItem('sharedTemplates', JSON.stringify(existingTemplates));
      return newTemplate;
    },
    onSuccess: () => {
      toast({
        title: "Template Shared",
        description: "Your template has been shared with the community",
      });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to share template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addTag = () => {
    if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const selectUseCase = (useCase: any) => {
    setSelectedUseCase(useCase);
    form.setValue('title', useCase.title);
    form.setValue('description', useCase.description);
    form.setValue('category', useCase.category);
    form.setValue('templateData', {
      useCase: useCase,
      type: 'use_case_template',
      metadata: {
        originalId: useCase.id,
        extractedTechniques: useCase.extractedTechniques,
        mitreMapping: useCase.mitreMapping,
        indicators: useCase.indicators,
        cves: useCase.cves,
        technologies: useCase.technologies,
      }
    });
  };

  const onSubmit = (data: FormData) => {
    if (!data.templateData || Object.keys(data.templateData).length === 0) {
      toast({
        title: "No Template Data",
        description: "Please select a use case to create a template from",
        variant: "destructive",
      });
      return;
    }
    createTemplate.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Training Template</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Template Details */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this template teaches and how it helps..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="endpoint">Endpoint</SelectItem>
                            <SelectItem value="network">Network</SelectItem>
                            <SelectItem value="cloud">Cloud</SelectItem>
                            <SelectItem value="identity">Identity</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authorEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags */}
                <div>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.watch('tags').length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch('tags').map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Make template public</FormLabel>
                        <p className="text-sm text-gray-600">
                          Allow other engineers to discover and use this template
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column - Use Case Selection */}
              <div className="space-y-4">
                <div>
                  <FormLabel>Select Use Case Template</FormLabel>
                  <p className="text-sm text-gray-600 mb-3">
                    Choose an existing use case to create a template from
                  </p>
                  
                  {existingUseCases.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        No use cases available. Create some use cases first to share as templates.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
                      {existingUseCases.map((useCase: any) => (
                        <div
                          key={useCase.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedUseCase?.id === useCase.id
                              ? 'bg-cortex-blue/10 border-cortex-blue'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => selectUseCase(useCase)}
                        >
                          <div className="font-medium text-sm">{useCase.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {useCase.category} • {useCase.severity} severity
                          </div>
                          {useCase.cves && useCase.cves.length > 0 && (
                            <div className="text-xs text-purple-600 mt-1">
                              CVEs: {useCase.cves.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedUseCase && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-800">Selected Template</div>
                    <div className="text-sm text-green-700 mt-1">
                      {selectedUseCase.title}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      This use case will be packaged as a reusable template
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTemplate.isPending || !selectedUseCase}
                className="bg-cortex-blue hover:bg-blue-700"
              >
                {createTemplate.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Share Template
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}