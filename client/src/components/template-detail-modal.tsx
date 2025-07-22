import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Download, Star, MessageCircle, Calendar, User, Tag, Eye } from "lucide-react";
import { SharedTemplate, TemplateComment, TemplateRating } from "@shared/schema";

interface TemplateDetailModalProps {
  template: SharedTemplate;
  open: boolean;
  onClose: () => void;
}

export default function TemplateDetailModal({ template, open, onClose }: TemplateDetailModalProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingForm, setShowRatingForm] = useState(false);

  // Fetch comments for this template from localStorage
  const { data: comments = [] } = useQuery<TemplateComment[]>({
    queryKey: ["templates", template.id, "comments"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem('templateComments');
        const allComments = stored ? JSON.parse(stored) : [];
        return allComments.filter((c: any) => c.templateId === template.id);
      } catch {
        return [];
      }
    },
    enabled: open,
  });

  // Download template mutation
  const downloadTemplate = useMutation({
    mutationFn: async () => {
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
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Template Downloaded",
        description: "Template has been added to your use cases",
      });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      onClose();
    },
  });

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const existingComments = JSON.parse(localStorage.getItem('templateComments') || '[]');
      const newComment = {
        id: `comment-${Date.now()}`,
        templateId: template.id,
        content,
        authorName: "Anonymous User",
        authorEmail: "",
        createdAt: new Date().toISOString(),
      };
      existingComments.push(newComment);
      localStorage.setItem('templateComments', JSON.stringify(existingComments));
      return newComment;
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["templates", template.id, "comments"] });
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    },
  });

  // Add rating mutation
  const addRating = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/templates/${template.id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          comment: ratingComment,
          userEmail: "anonymous@example.com", // TODO: Get from auth
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      setUserRating(0);
      setRatingComment("");
      setShowRatingForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
    },
  });

  const getAverageRating = () => {
    if (template.ratingCount === 0) return 0;
    return Math.round((template.ratingSum / template.ratingCount) * 10) / 10;
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (star: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={() => interactive && onStarClick && onStarClick(i + 1)}
      />
    ));
  };

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">{getCategoryIcon(template.category)}</span>
                <DialogTitle className="text-xl">{template.title}</DialogTitle>
              </div>
              
              <div className="flex items-center space-x-2 mb-3">
                <Badge className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {template.category}
                </Badge>
                <div className="flex items-center space-x-1">
                  {renderStars(getAverageRating())}
                  <span className="text-sm text-gray-600">
                    ({template.ratingCount} {template.ratingCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>By {template.authorName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>{template.downloadCount} downloads</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRatingForm(true)}
              >
                <Star className="w-4 h-4 mr-1" />
                Rate
              </Button>
              <Button
                onClick={() => downloadTemplate.mutate()}
                disabled={downloadTemplate.isPending}
                className="bg-cortex-blue hover:bg-blue-700"
              >
                {downloadTemplate.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Use Template
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-700">{template.description}</p>
            </div>

            {template.tags.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {template.templateData && (
              <div>
                <h3 className="font-medium mb-2">Template Information</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div><strong>Type:</strong> {(template.templateData as any)?.type || 'Training Template'}</div>
                      {(template.templateData as any)?.useCase && (
                        <>
                          <div><strong>Based on:</strong> {(template.templateData as any).useCase.title}</div>
                          <div><strong>Category:</strong> {(template.templateData as any).useCase.category}</div>
                          <div><strong>Severity:</strong> {(template.templateData as any).useCase.severity}</div>
                          {(template.templateData as any).useCase.cves?.length > 0 && (
                            <div><strong>CVEs:</strong> {(template.templateData as any).useCase.cves.join(', ')}</div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Template Content</h3>
              <Card>
                <CardContent className="p-4">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                    {JSON.stringify(template.templateData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {/* Add Comment Form */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Add a Comment</h3>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Share your thoughts about this template..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => addComment.mutate(newComment)}
                    disabled={!newComment.trim() || addComment.isPending}
                    size="sm"
                    className="bg-cortex-blue hover:bg-blue-700"
                  >
                    {addComment.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <MessageCircle className="w-4 h-4 mr-2" />
                    )}
                    Post Comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm">{comment.authorName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="ratings" className="space-y-4">
            {/* Rating Form */}
            {showRatingForm && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Rate This Template</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Rating</label>
                      <div className="flex items-center space-x-1">
                        {renderStars(userRating, true, setUserRating)}
                      </div>
                    </div>
                    <Textarea
                      placeholder="Optional: Share your experience with this template..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => addRating.mutate()}
                        disabled={userRating === 0 || addRating.isPending}
                        size="sm"
                        className="bg-cortex-blue hover:bg-blue-700"
                      >
                        {addRating.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : null}
                        Submit Rating
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRatingForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rating Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Rating Summary</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold">{getAverageRating()}</div>
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      {renderStars(getAverageRating())}
                    </div>
                    <div className="text-sm text-gray-600">
                      Based on {template.ratingCount} {template.ratingCount === 1 ? 'review' : 'reviews'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}