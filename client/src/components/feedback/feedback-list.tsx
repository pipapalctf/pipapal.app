import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeedback } from "@/hooks/use-feedback";
import { FEEDBACK_CATEGORY_LABELS, FEEDBACK_STATUS_LABELS } from "@/types/feedback";
import { AlertTriangle, Clock, MessageCircle, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function FeedbackList() {
  const { userFeedback, isLoadingFeedback } = useFeedback();
  
  if (isLoadingFeedback) {
    return (
      <div className="py-6 px-2 text-center">
        <p className="text-muted-foreground">Loading your feedback...</p>
      </div>
    );
  }
  
  if (!userFeedback || userFeedback.length === 0) {
    return (
      <div className="py-10 px-4 text-center border border-dashed rounded-lg">
        <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No feedback yet</h3>
        <p className="text-muted-foreground mt-1">
          You haven't submitted any feedback yet.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Feedback History</h3>
      <div className="grid gap-4">
        {userFeedback.map((feedback) => {
          const createdAt = new Date(feedback.createdAt);
          
          // Determine badge color based on status
          let statusColor = "";
          switch (feedback.status) {
            case "pending":
              statusColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
              break;
            case "in_review":
              statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
              break;
            case "implemented":
              statusColor = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
              break;
            case "rejected":
              statusColor = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
              break;
            case "completed":
              statusColor = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
              break;
            default:
              statusColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
          }
          
          // Determine icon based on category
          let CategoryIcon = MessageCircle;
          switch (feedback.category) {
            case "feature_request":
              CategoryIcon = ThumbsUp;
              break;
            case "bug_report":
              CategoryIcon = AlertTriangle;
              break;
            default:
              CategoryIcon = MessageCircle;
          }
          
          return (
            <Card key={feedback.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <CategoryIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Badge variant="outline">
                      {FEEDBACK_CATEGORY_LABELS[feedback.category] || feedback.category}
                    </Badge>
                  </div>
                  <Badge className={statusColor}>
                    {FEEDBACK_STATUS_LABELS[feedback.status] || feedback.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{feedback.title}</CardTitle>
                <CardDescription className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {feedback.content}
                </p>
              </CardContent>
              {feedback.currentPage && (
                <CardFooter className="text-xs text-muted-foreground pt-0 border-t">
                  <p>Page: {feedback.currentPage}</p>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}