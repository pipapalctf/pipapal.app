import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeedbackDialog } from "./feedback-dialog";
import { FeedbackList } from "./feedback-list";
import { MessageSquareOff } from "lucide-react";

export function FeedbackTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback</CardTitle>
          <CardDescription>
            View your submitted feedback and submit new suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="mb-6">
            <Alert variant="default" className="bg-primary/10 text-primary border-primary/20">
              <MessageSquareOff className="h-4 w-4" />
              <AlertTitle>Feedback matters!</AlertTitle>
              <AlertDescription>
                Your feedback helps us improve PipaPal. We carefully review all suggestions and work to implement the most valuable ones.
              </AlertDescription>
            </Alert>
          </div>
          
          <FeedbackList />
        </CardContent>
        <CardFooter className="pt-2">
          <div className="w-full flex justify-end">
            <FeedbackDialog variant="profile" currentPage="profile-page" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}