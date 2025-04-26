import { FeedbackList } from "@/components/feedback/feedback-list";
import { useFeedback } from "@/hooks/use-feedback";
import { AlertCircle } from "lucide-react";

export function FeedbackTab() {
  const { feedbackError } = useFeedback();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Feedback & Suggestions</h2>
        <p className="text-muted-foreground mt-1">
          View your submitted feedback and suggestions.
        </p>
      </div>
      
      {feedbackError && (
        <div className="bg-destructive/15 p-4 rounded-md flex gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <h3 className="font-medium text-destructive">Error loading feedback</h3>
            <p className="text-sm text-destructive/80 mt-1">
              {feedbackError.message || "There was an error loading your feedback. Please try again."}
            </p>
          </div>
        </div>
      )}
      
      <FeedbackList />
      
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium">About Feedback</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Your feedback helps us improve PipaPal. Each submission earns you 5 sustainability points and 
          helps us make PipaPal better for everyone. We review all feedback regularly and use it to 
          prioritize new features and fixes.
        </p>
      </div>
    </div>
  );
}