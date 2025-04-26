import { useMutation, useQuery } from "@tanstack/react-query";
import { Feedback, FeedbackFormValues, FeedbackSubmitResponse } from "@/types/feedback";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useFeedback() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get user's feedback submissions
  const {
    data: userFeedback,
    isLoading: isLoadingFeedback,
    error: feedbackError,
  } = useQuery<Feedback[]>({
    queryKey: ['/api/users', user?.id, 'feedback'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', `/api/users/${user.id}/feedback`);
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Submit new feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues): Promise<FeedbackSubmitResponse> => {
      const res = await apiRequest('POST', '/api/feedback', values);
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate the feedback query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'feedback'] });
      
      // Show success toast with points awarded
      toast({
        title: "Feedback Submitted!",
        description: data.message,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit feedback",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return {
    userFeedback: userFeedback || [],
    isLoadingFeedback,
    feedbackError,
    submitFeedback: submitFeedbackMutation.mutate,
    isSubmitting: submitFeedbackMutation.isPending,
  };
}