import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Feedback } from "@shared/schema";
import { FeedbackFormData } from "@/types/feedback";

export function useFeedback() {
  const { toast } = useToast();

  // Fetch user's submitted feedback
  const {
    data: userFeedback,
    isLoading: isLoadingFeedback,
    error: feedbackError,
    refetch: refetchFeedback
  } = useQuery<Feedback[]>({
    queryKey: ['/api/feedback'],
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Submit new feedback
  const submitFeedback = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const res = await apiRequest('POST', '/api/feedback', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting feedback",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isSubmitting = submitFeedback.isPending;

  return {
    userFeedback,
    isLoadingFeedback,
    feedbackError,
    refetchFeedback,
    submitFeedback,
    isSubmitting,
  };
}