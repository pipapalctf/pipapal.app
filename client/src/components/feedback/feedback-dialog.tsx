import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { FeedbackFormData, FEEDBACK_CATEGORY_LABELS } from "@/types/feedback";
import { useFeedback } from "@/hooks/use-feedback";
import { FeedbackCategory } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { MessageCircle, MessageSquarePlus } from "lucide-react";

// Form schema with validation
const feedbackFormSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  content: z.string().min(10, "Please provide more details").max(1000, "Feedback cannot exceed 1000 characters"),
  rating: z.number().min(1).max(5).optional(),
  currentPage: z.string().optional(),
});

type FeedbackDialogProps = {
  variant?: "floating" | "profile";
  currentPage?: string;
};

export function FeedbackDialog({ variant = "floating", currentPage }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const { submitFeedback, isSubmitting } = useFeedback();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: FeedbackCategory.GENERAL,
      title: "",
      content: "",
      rating: undefined,
      currentPage: currentPage || window.location.pathname,
    },
  });

  async function onSubmit(data: FeedbackFormData) {
    await submitFeedback.mutateAsync(data);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "floating" ? (
          <Button 
            size="icon" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        ) : (
          <Button className="w-full md:w-auto">
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Submit Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl">Share Your Feedback</DialogTitle>
          <DialogDescription className="text-sm">
            We value your input! Help us improve PipaPal by sharing your thoughts, 
            suggestions, or reporting any issues you've encountered.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FeedbackCategory).map(([key, value]) => (
                        <SelectItem key={value} value={value}>
                          {FEEDBACK_CATEGORY_LABELS[value] || key}
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
                <FormItem className="space-y-1">
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief summary of your feedback" className="h-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide more information..." 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Please be as specific as possible to help us understand your feedback better.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>How would you rate this feature or area?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      className="flex space-x-2"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <FormItem key={rating} className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={rating.toString()} />
                          </FormControl>
                          <FormLabel className="font-normal">{rating}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Rating is optional
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9">
                {isSubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}