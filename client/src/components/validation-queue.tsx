import { useState } from "react";
import { ClipboardCheck, AlertTriangle, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useValidationItems, useSaveValidationItem } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import type { ContentValidation } from "@shared/schema";

export default function ValidationQueue() {
  const { data: validationItems = [], isLoading } = useValidationItems();
  const saveValidationItem = useSaveValidationItem();
  const { toast } = useToast();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  const pendingItems = validationItems.filter(item => item.status === 'pending');

  const handleApprove = async (item: ContentValidation) => {
    try {
      const updatedItem: ContentValidation = {
        ...item,
        status: 'approved',
        reviewedAt: new Date(),
        reviewNotes: comments[item.id] || null
      };
      
      await saveValidationItem.mutateAsync(updatedItem);
      
      toast({
        title: "Item Approved",
        description: `${item.contentId} has been approved successfully.`,
      });
      
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[item.id];
        return newComments;
      });
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve validation item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (item: ContentValidation) => {
    try {
      const comment = comments[item.id];
      if (!comment?.trim()) {
        toast({
          title: "Comment Required",
          description: "Please provide a reason for rejection.",
          variant: "destructive"
        });
        return;
      }

      const updatedItem: ContentValidation = {
        ...item,
        status: 'rejected',
        reviewedAt: new Date(),
        reviewNotes: comment
      };
      
      await saveValidationItem.mutateAsync(updatedItem);
      
      toast({
        title: "Item Rejected",
        description: `${item.contentId} has been rejected with feedback.`,
      });
      
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[item.id];
        return newComments;
      });
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject validation item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNeedsReview = async (item: ContentValidation) => {
    try {
      const updatedItem: ContentValidation = {
        ...item,
        status: 'revision_needed',
        reviewNotes: comments[item.id] || null
      };
      
      await saveValidationItem.mutateAsync(updatedItem);
      
      toast({
        title: "Marked for Review",
        description: `${item.contentId} has been marked as needing additional review.`,
      });
      
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[item.id];
        return newComments;
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update validation item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      syntax: "fas fa-code",
      logic: "fas fa-brain",
      security: "fas fa-shield-alt",
      performance: "fas fa-tachometer-alt"
    };
    return icons[type] || "fas fa-question-circle";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      syntax: "text-blue-500",
      logic: "text-green-500", 
      security: "text-red-500",
      performance: "text-orange-500"
    };
    return colors[type] || "text-gray-500";
  };

  if (isLoading) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <ClipboardCheck className="text-cortex-warning text-lg mr-2" />
              <h2 className="text-base font-medium text-cortex-dark">DC Activity Status</h2>
            </div>
            <Badge className="bg-cortex-warning text-white">
              Loading...
            </Badge>
          </div>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-material">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <ClipboardCheck className="text-cortex-warning text-lg mr-2" />
            <h2 className="text-base font-medium text-cortex-dark">DC Activity Status</h2>
          </div>
          <Badge className="bg-cortex-warning text-white">
            {pendingItems.length} Items
          </Badge>
        </div>

        {pendingItems.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-cortex-success mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">All Clear!</p>
            <p className="text-gray-400 text-xs">No items pending DC activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div 
                key={item.id}
                className="p-3 bg-yellow-50 rounded-lg border-l-4 border-cortex-warning"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="text-cortex-warning mt-0.5 flex-shrink-0" size={16} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{item.contentId}</p>
                      <div className="flex items-center space-x-1">
                        <i className={`${getTypeIcon(item.validationType)} ${getTypeColor(item.validationType)} text-xs`}></i>
                        <span className="text-xs text-gray-500 capitalize">
                          {item.validationType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{item.reviewNotes || 'Content validation required'}</p>
                    
                    {/* System status for rejected items */}
                    {item.status === 'rejected' && (
                      <div className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded mb-2">
                        <span className="font-medium">System Status:</span> Auto-fixing content issues and re-queuing for DC review
                      </div>
                    )}
                    
                    {/* System status for revision needed items */}
                    {item.status === 'revision_needed' && (
                      <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-2 rounded mb-2">
                        <span className="font-medium">System Status:</span> Applying recommended changes, will auto-resubmit
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-3">
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(item)}
                            disabled={saveValidationItem.isPending}
                            className="text-cortex-success border-cortex-success hover:bg-green-50 text-xs px-2 py-1"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Approve this item for production deployment</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(item)}
                            disabled={saveValidationItem.isPending}
                            className="text-cortex-error border-cortex-error hover:bg-red-50 text-xs px-2 py-1"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reject this item and require modification before deployment</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNeedsReview(item)}
                            disabled={saveValidationItem.isPending}
                            className="text-cortex-blue border-cortex-blue hover:bg-blue-50 text-xs px-2 py-1"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Needs Review
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark for additional review and discussion before decision</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                        className="text-gray-500 text-xs px-2 py-1"
                      >
                        {expandedItem === item.id ? 'Hide Details' : 'Show Details'}
                      </Button>
                    </div>

                    {/* Expandable details and comment section */}
                    {expandedItem === item.id && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <div className="mb-3">
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Validation Details</h4>
                          <p className="text-xs text-gray-600">
                            Entity ID: {item.entityId}
                          </p>
                          <p className="text-xs text-gray-600">
                            Type: {item.type.replace('_', ' ')}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Comments (required for rejection):
                          </label>
                          <Textarea
                            placeholder="Add your validation comments here..."
                            value={comments[item.id] || ''}
                            onChange={(e) => setComments(prev => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))}
                            className="text-xs min-h-16"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary statistics */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-cortex-success">
                {validationItems.filter(i => i.status === 'approved').length}
              </div>
              <div className="text-xs text-gray-500">Approved by DC</div>
            </div>
            <div>
              <div className="text-sm font-bold text-cortex-warning">
                {pendingItems.length}
              </div>
              <div className="text-xs text-gray-500">Pending DC Activity</div>
            </div>
            <div>
              <div className="text-sm font-bold text-cortex-error">
                {validationItems.filter(i => i.status === 'rejected').length}
              </div>
              <div className="text-xs text-gray-500">Rejected by DC</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
