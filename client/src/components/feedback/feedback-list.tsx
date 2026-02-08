import { useFeedback } from "@/hooks/use-feedback";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { FEEDBACK_CATEGORY_LABELS, FEEDBACK_STATUS_LABELS } from "@/types/feedback";
import { CircleAlertIcon, ClockIcon, CheckCircleIcon, MessageCircleDashedIcon } from "lucide-react";

export function FeedbackList() {
  const { userFeedback, isLoadingFeedback } = useFeedback();

  if (isLoadingFeedback) {
    return <FeedbackListSkeleton />;
  }

  if (!userFeedback || userFeedback.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <MessageCircleDashedIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No feedback yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          You haven't submitted any feedback yet. We'd love to hear your thoughts!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {userFeedback.map((feedback) => (
        <div 
          key={feedback.id}
          className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-card"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">{feedback.title}</h3>
              <Badge variant="outline" className="text-xs">
                {FEEDBACK_CATEGORY_LABELS[feedback.category] || feedback.category}
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              <span>{feedback.createdAt ? format(new Date(feedback.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
            </div>
          </div>
          
          <div className="px-4 py-3">
            <p className="text-sm text-muted-foreground line-clamp-2">{feedback.content}</p>
          </div>
          
          <div className="px-4 py-2 bg-muted/10 flex justify-between items-center">
            <StatusBadge status={feedback.status || 'pending'} />
            {feedback.rating && (
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground mr-1">Rating:</span>
                <span className="text-xs font-medium">{feedback.rating}/5</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'outline';
  let icon = null;

  switch (status) {
    case 'implemented':
    case 'completed':
      variant = 'default';
      icon = <CheckCircleIcon className="h-3 w-3 mr-1" />;
      break;
    case 'in_review':
      variant = 'secondary';
      icon = <ClockIcon className="h-3 w-3 mr-1" />;
      break;
    case 'rejected':
      variant = 'destructive';
      icon = <CircleAlertIcon className="h-3 w-3 mr-1" />;
      break;
    default:
      icon = <ClockIcon className="h-3 w-3 mr-1" />;
  }

  return (
    <Badge variant={variant} className="text-xs flex items-center">
      {icon}
      {FEEDBACK_STATUS_LABELS[status] || status}
    </Badge>
  );
}

function FeedbackListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}