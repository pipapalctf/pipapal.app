import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Feedback } from "@shared/schema";
import { FeedbackFormData } from "@/types/feedback";

export function useFeedback() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Query to get all feedback for the current user
  const {
    data: userFeedback,
    isLoading: isLoadingFeedback,
    error: feedbackError,
    refetch: refetchFeedback,
  } = useQuery<Feedback[]>({
    queryKey: ['/api/feedback'],
    enabled: !!user,
  });
  
  // Mutation to submit new feedback
  const submitFeedback: UseMutationResult<
    Feedback,
    Error,
    FeedbackFormData,
    unknown
  > = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const response = await apiRequest('POST', '/api/feedback', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! You've earned 5 sustainability points.",
        variant: "success",
      });
      // Invalidate feedback query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      // Invalidate user query to refresh sustainability score
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit feedback",
        description: error.message || "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Return everything needed by feedback components
  return {
    userFeedback,
    isLoadingFeedback,
    feedbackError,
    submitFeedback,
    refetchFeedback,
    isSubmitting: submitFeedback.isPending,
  };
}