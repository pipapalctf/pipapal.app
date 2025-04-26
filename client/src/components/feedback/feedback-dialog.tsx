import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, Send, Star } from "lucide-react";
import { useFeedback } from "@/hooks/use-feedback";
import { FeedbackCategory } from "@shared/schema";
import { FEEDBACK_CATEGORY_LABELS } from "@/types/feedback";
import { useLocation } from "wouter";

// Feedback form validation schema
const feedbackFormSchema = z.object({
  category: z.string({
    required_error: "Please select a category",
  }),
  title: z.string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title must be less than 100 characters" }),
  content: z.string()
    .min(5, { message: "Feedback must be at least 5 characters" })
    .max(1000, { message: "Feedback must be less than 1000 characters" }),
  rating: z.number().min(1).max(5).optional(),
  currentPage: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const { submitFeedback, isSubmitting } = useFeedback();
  const [location] = useLocation();
  
  // Get current page URL for context
  const currentPage = location;
  
  // Form default values
  const defaultValues: Partial<FeedbackFormValues> = {
    category: FeedbackCategory.GENERAL,
    currentPage,
  };
  
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues,
  });
  
  function onSubmit(values: FeedbackFormValues) {
    submitFeedback(values, {
      onSuccess: () => {
        // Reset form and close dialog on success
        form.reset(defaultValues);
        setOpen(false);
      }
    });
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          size="sm" 
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg px-4 py-6 flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve PipaPal with your feedback, suggestions, or report issues. You'll earn 5 sustainability points for your contribution.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief title for your feedback" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts, suggestions, or report an issue..." 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Be as specific as possible to help us understand your feedback.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (Optional)</FormLabel>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        variant={field.value === rating ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => field.onChange(rating)}
                      >
                        <Star 
                          className={`h-4 w-4 ${field.value === rating ? "fill-current" : ""}`} 
                        />
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}